use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
};
use chrono::Datelike;
use sqlx::SqlitePool;

use crate::models::*;
use crate::session::AuthUser;

#[derive(serde::Deserialize)]
pub struct ProgressQuery {
    pub range: Option<String>,
    pub from: Option<String>,
    pub to: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

pub async fn get_progress(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
    Query(query): Query<ProgressQuery>,
) -> Result<Json<Vec<ProgressLog>>, StatusCode> {
    let (from, to) = match query.range.as_deref() {
        Some("week") => {
            let now = chrono::Local::now().date_naive();
            let weekday = now.weekday().num_days_from_monday();
            let start = now - chrono::Duration::days(weekday as i64);
            let end = start + chrono::Duration::days(6);
            (start.to_string(), end.to_string())
        }
        Some("month") => {
            let now = chrono::Local::now().date_naive();
            let start = now.with_day(1).unwrap_or(now);
            let end = if now.month() == 12 {
                start
                    .with_year(now.year() + 1)
                    .unwrap()
                    .with_month(1)
                    .unwrap()
            } else {
                start.with_month(now.month() + 1).unwrap()
            } - chrono::Duration::days(1);
            (start.to_string(), end.to_string())
        }
        _ => {
            let from = query.from.unwrap_or_else(|| "2000-01-01".to_string());
            let to = query.to.unwrap_or_else(|| "2099-12-31".to_string());
            (from, to)
        }
    };

    let limit = query.limit.unwrap_or(500).min(500);
    let offset = query.offset.unwrap_or(0).max(0);

    let logs = sqlx::query_as::<_, ProgressLog>(
        "SELECT * FROM progress_logs WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?"
    )
    .bind(user_id)
    .bind(&from)
    .bind(&to)
    .bind(limit)
    .bind(offset)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(logs))
}

pub async fn log_progress(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
    Json(input): Json<ProgressLogInput>,
) -> Result<Json<ProgressLog>, (StatusCode, String)> {
    let date = input
        .date
        .unwrap_or_else(|| chrono::Local::now().format("%Y-%m-%d").to_string());

    let log = sqlx::query_as::<_, ProgressLog>(
        "INSERT INTO progress_logs (user_id, category_name, date, hours, note) VALUES (?, ?, ?, ?, ?) RETURNING *"
    )
    .bind(user_id)
    .bind(&input.category_name)
    .bind(&date)
    .bind(input.hours)
    .bind(&input.note)
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(log))
}

pub async fn delete_progress(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
    Path(log_id): Path<i64>,
) -> Result<StatusCode, (StatusCode, String)> {
    let result = sqlx::query("DELETE FROM progress_logs WHERE id = ? AND user_id = ?")
        .bind(log_id)
        .bind(user_id)
        .execute(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Log not found".into()));
    }

    Ok(StatusCode::NO_CONTENT)
}
