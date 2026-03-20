use axum::{Json, extract::State, http::StatusCode};
use sqlx::SqlitePool;

use crate::models::*;
use crate::session::AuthUser;

const MAX_PROMPT_LEN: usize = 5000;
const RATE_LIMIT_PER_HOUR: i64 = 20;

pub async fn analyze(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
    Json(input): Json<AiAnalyzeRequest>,
) -> Result<Json<AiAnalyzeResponse>, (StatusCode, String)> {
    // Validate prompt length
    if let Some(ref prompt) = input.prompt
        && prompt.len() > MAX_PROMPT_LEN
    {
        return Err((
            StatusCode::BAD_REQUEST,
            format!("Prompt too long (max {MAX_PROMPT_LEN} characters)"),
        ));
    }

    // Rate limiting: check requests in the last hour
    let recent_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM ai_requests WHERE user_id = ? AND created_at > datetime('now', '-1 hour')"
    )
    .bind(user_id)
    .fetch_one(&pool)
    .await
    .unwrap_or(0);

    if recent_count >= RATE_LIMIT_PER_HOUR {
        return Err((
            StatusCode::TOO_MANY_REQUESTS,
            format!(
                "Rate limit exceeded. Max {} AI requests per hour.",
                RATE_LIMIT_PER_HOUR
            ),
        ));
    }

    // Log this request for rate limiting
    sqlx::query("INSERT INTO ai_requests (user_id) VALUES (?)")
        .bind(user_id)
        .execute(&pool)
        .await
        .ok();

    // Clean old entries periodically
    sqlx::query("DELETE FROM ai_requests WHERE created_at < datetime('now', '-2 hours')")
        .execute(&pool)
        .await
        .ok();

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let encrypted_key = user.ai_api_key.as_ref().ok_or((
        StatusCode::BAD_REQUEST,
        "No AI API key configured. Go to Profile to add your API key.".into(),
    ))?;

    // Decrypt the API key
    let api_key = crate::crypto::decrypt(encrypted_key).unwrap_or_else(|_| encrypted_key.clone()); // Fall back to raw value for pre-encryption keys

    let base_url = user
        .ai_base_url
        .as_deref()
        .unwrap_or("https://openrouter.ai/api/v1");
    let model = user
        .ai_model
        .as_deref()
        .unwrap_or("anthropic/claude-sonnet-4");

    // Gather user data
    let schedules = sqlx::query_as::<_, ScheduleBlock>(
        "SELECT * FROM schedule_blocks WHERE user_id = ? ORDER BY day_of_week, sort_order",
    )
    .bind(user_id)
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    let progress = sqlx::query_as::<_, ProgressLog>(
        "SELECT * FROM progress_logs WHERE user_id = ? ORDER BY date DESC LIMIT 60",
    )
    .bind(user_id)
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    let progressions =
        sqlx::query_as::<_, Progression>("SELECT * FROM progressions WHERE user_id = ?")
            .bind(user_id)
            .fetch_all(&pool)
            .await
            .unwrap_or_default();

    let categories = sqlx::query_as::<_, Category>("SELECT * FROM categories WHERE user_id = ?")
        .bind(user_id)
        .fetch_all(&pool)
        .await
        .unwrap_or_default();

    let schedule_summary: String = schedules
        .iter()
        .map(|s| {
            let day = match s.day_of_week {
                0 => "Mon",
                1 => "Tue",
                2 => "Wed",
                3 => "Thu",
                4 => "Fri",
                5 => "Sat",
                6 => "Sun",
                _ => "?",
            };
            format!(
                "{} {} - {} [{}]",
                day, s.time_range, s.label, s.category_name
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let progress_summary: String = progress
        .iter()
        .map(|p| {
            format!(
                "{}: {} - {:.1}h{}",
                p.date,
                p.category_name,
                p.hours,
                p.note
                    .as_ref()
                    .map(|n| format!(" ({})", n))
                    .unwrap_or_default()
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let progression_summary: String = progressions
        .iter()
        .map(|p| {
            format!(
                "{}: {}",
                p.label,
                p.current_level.as_deref().unwrap_or("not set")
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let category_list: String = categories
        .iter()
        .map(|c| c.label.clone())
        .collect::<Vec<_>>()
        .join(", ");

    let user_prompt = input
        .prompt
        .as_deref()
        .unwrap_or("Analyze my schedule and progress. Give me actionable suggestions.");

    let system_prompt = format!(
        "You are an AI productivity coach. Be specific, actionable, and encouraging. Reference the user's actual data.\n\n\
        User: {} ({})\nCategories: {}\n\nWeekly Schedule:\n{}\n\nRecent Progress Logs:\n{}\n\nSkill Progressions:\n{}",
        user.display_name,
        user.username,
        category_list,
        schedule_summary,
        progress_summary,
        progression_summary
    );

    let client = reqwest::Client::new();
    let response = client
        .post(format!("{}/chat/completions", base_url))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "model": model,
            "messages": [
                { "role": "system", "content": system_prompt },
                { "role": "user", "content": user_prompt }
            ],
            "max_tokens": 2000
        }))
        .send()
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_GATEWAY,
                format!("AI API request failed: {}", e),
            )
        })?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err((
            StatusCode::BAD_GATEWAY,
            format!("AI API error ({}): {}", status, body),
        ));
    }

    let body: serde_json::Value = response.json().await.map_err(|e| {
        (
            StatusCode::BAD_GATEWAY,
            format!("Failed to parse AI response: {}", e),
        )
    })?;

    let analysis = body["choices"][0]["message"]["content"]
        .as_str()
        .unwrap_or("No analysis generated")
        .to_string();

    Ok(Json(AiAnalyzeResponse { analysis }))
}
