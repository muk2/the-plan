use axum::{
    Json,
    extract::{Query, State},
    http::StatusCode,
};
use chrono::Datelike;
use sqlx::SqlitePool;

use crate::models::*;
use crate::session::AuthUser;

#[derive(serde::Deserialize)]
pub struct LeaderboardQuery {
    pub period: Option<String>,
}

pub async fn get_leaderboard(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
    Query(query): Query<LeaderboardQuery>,
) -> Result<Json<Vec<LeaderboardEntry>>, (StatusCode, String)> {
    let friendships =
        sqlx::query_as::<_, Friendship>("SELECT * FROM friendships WHERE user_a = ? OR user_b = ?")
            .bind(user_id)
            .bind(user_id)
            .fetch_all(&pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut user_ids: Vec<i64> = friendships
        .iter()
        .map(|f| {
            if f.user_a == user_id {
                f.user_b
            } else {
                f.user_a
            }
        })
        .collect();
    user_ids.push(user_id);

    let (from_date, to_date) = match query.period.as_deref() {
        Some("month") => {
            let now = chrono::Local::now().date_naive();
            let start = now.with_day(1).unwrap_or(now);
            (start.to_string(), now.to_string())
        }
        _ => {
            let now = chrono::Local::now().date_naive();
            let weekday = now.weekday().num_days_from_monday();
            let start = now - chrono::Duration::days(weekday as i64);
            (start.to_string(), now.to_string())
        }
    };

    let mut entries = Vec::new();
    for uid in &user_ids {
        let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
            .bind(uid)
            .fetch_one(&pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        let total: f64 = sqlx::query_scalar::<_, f64>(
            "SELECT COALESCE(SUM(hours), 0.0) FROM progress_logs WHERE user_id = ? AND date >= ? AND date <= ?"
        )
        .bind(uid).bind(&from_date).bind(&to_date)
        .fetch_one(&pool).await
        .unwrap_or(0.0);

        let cat_rows: Vec<(String, f64)> = sqlx::query_as(
            "SELECT category_name, SUM(hours) as total FROM progress_logs WHERE user_id = ? AND date >= ? AND date <= ? GROUP BY category_name ORDER BY total DESC"
        )
        .bind(uid).bind(&from_date).bind(&to_date)
        .fetch_all(&pool).await
        .unwrap_or_default();

        let categories: Vec<CategoryHours> = cat_rows
            .into_iter()
            .map(|(name, hours)| CategoryHours {
                category_name: name,
                hours,
            })
            .collect();

        let streak = calculate_streak(&pool, *uid).await;

        entries.push(LeaderboardEntry {
            user_id: *uid,
            username: user.username,
            display_name: user.display_name,
            total_hours: total,
            streak_days: streak,
            categories,
        });
    }

    entries.sort_by(|a, b| {
        b.total_hours
            .partial_cmp(&a.total_hours)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    Ok(Json(entries))
}

async fn calculate_streak(pool: &SqlitePool, user_id: i64) -> i64 {
    let dates: Vec<String> = sqlx::query_scalar(
        "SELECT DISTINCT date FROM progress_logs WHERE user_id = ? ORDER BY date DESC LIMIT 365",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    if dates.is_empty() {
        return 0;
    }

    let today = chrono::Local::now().date_naive();
    let mut streak = 0i64;
    let mut expected = today;

    for date_str in &dates {
        if let Ok(date) = chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
            if date == expected {
                streak += 1;
                expected -= chrono::Duration::days(1);
            } else if date < expected {
                break;
            }
        }
    }

    streak
}
