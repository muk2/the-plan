use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use sqlx::SqlitePool;

use crate::models::*;
use crate::session::AuthUser;

pub async fn get_schedules(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
) -> Result<Json<Vec<ScheduleBlock>>, StatusCode> {
    let blocks = sqlx::query_as::<_, ScheduleBlock>(
        "SELECT * FROM schedule_blocks WHERE user_id = ? ORDER BY day_of_week, sort_order",
    )
    .bind(user_id)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(blocks))
}

pub async fn put_schedule_day(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
    Json(input): Json<BulkScheduleInput>,
) -> Result<Json<Vec<ScheduleBlock>>, (StatusCode, String)> {
    // Validate time ranges
    for block in &input.blocks {
        validate_time_range(&block.time_range)?;
    }

    let mut tx = pool
        .begin()
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    sqlx::query("DELETE FROM schedule_blocks WHERE user_id = ? AND day_of_week = ?")
        .bind(user_id)
        .bind(input.day_of_week)
        .execute(&mut *tx)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    for (i, block) in input.blocks.iter().enumerate() {
        sqlx::query(
            "INSERT INTO schedule_blocks (user_id, day_of_week, time_range, label, category_name, note, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(user_id)
        .bind(input.day_of_week)
        .bind(&block.time_range)
        .bind(&block.label)
        .bind(&block.category_name)
        .bind(&block.note)
        .bind(block.sort_order.unwrap_or(i as i64))
        .execute(&mut *tx)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    tx.commit()
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let blocks = sqlx::query_as::<_, ScheduleBlock>(
        "SELECT * FROM schedule_blocks WHERE user_id = ? AND day_of_week = ? ORDER BY sort_order",
    )
    .bind(user_id)
    .bind(input.day_of_week)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(blocks))
}

fn validate_time_range(time_range: &str) -> Result<(), (StatusCode, String)> {
    // Allow single time (e.g. "22:00" for sleep) or range "HH:MM–HH:MM"
    let parts: Vec<&str> = time_range.split(['\u{2013}', '-']).collect();
    for part in &parts {
        let trimmed = part.trim();
        if trimmed.is_empty() {
            continue;
        }
        let time_parts: Vec<&str> = trimmed.split(':').collect();
        if time_parts.len() != 2 {
            return Err((
                StatusCode::BAD_REQUEST,
                format!("Invalid time format: '{}'. Use HH:MM", trimmed),
            ));
        }
        let h: u32 = time_parts[0].parse().map_err(|_| {
            (
                StatusCode::BAD_REQUEST,
                format!("Invalid hour in '{}'", trimmed),
            )
        })?;
        let m: u32 = time_parts[1].parse().map_err(|_| {
            (
                StatusCode::BAD_REQUEST,
                format!("Invalid minute in '{}'", trimmed),
            )
        })?;
        if h > 23 || m > 59 {
            return Err((
                StatusCode::BAD_REQUEST,
                format!("Time out of range: '{}'", trimmed),
            ));
        }
    }

    // Validate start < end for ranges
    if parts.len() == 2 {
        let start = parts[0].trim();
        let end = parts[1].trim();
        if !start.is_empty() && !end.is_empty() {
            let start_mins = parse_time_minutes(start);
            let end_mins = parse_time_minutes(end);
            if let (Some(s), Some(e)) = (start_mins, end_mins) {
                if s >= e {
                    return Err((
                        StatusCode::BAD_REQUEST,
                        format!(
                            "Start time ({}) must be before end time ({})",
                            start, end
                        ),
                    ));
                }
            }
        }
    }
    Ok(())
}

fn parse_time_minutes(time: &str) -> Option<u32> {
    let parts: Vec<&str> = time.split(':').collect();
    if parts.len() != 2 {
        return None;
    }
    let h: u32 = parts[0].parse().ok()?;
    let m: u32 = parts[1].parse().ok()?;
    Some(h * 60 + m)
}

pub async fn get_user_schedules(
    State(pool): State<SqlitePool>,
    AuthUser(my_id): AuthUser,
    Path(target_user_id): Path<i64>,
) -> Result<Json<Vec<ScheduleBlock>>, (StatusCode, String)> {
    if my_id != target_user_id {
        let (a, b) = if my_id < target_user_id {
            (my_id, target_user_id)
        } else {
            (target_user_id, my_id)
        };
        let friendship = sqlx::query("SELECT id FROM friendships WHERE user_a = ? AND user_b = ?")
            .bind(a)
            .bind(b)
            .fetch_optional(&pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        if friendship.is_none() {
            return Err((StatusCode::FORBIDDEN, "Not friends with this user".into()));
        }
    }

    let blocks = sqlx::query_as::<_, ScheduleBlock>(
        "SELECT * FROM schedule_blocks WHERE user_id = ? ORDER BY day_of_week, sort_order",
    )
    .bind(target_user_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(blocks))
}
