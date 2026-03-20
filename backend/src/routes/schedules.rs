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
    sqlx::query("DELETE FROM schedule_blocks WHERE user_id = ? AND day_of_week = ?")
        .bind(user_id)
        .bind(input.day_of_week)
        .execute(&pool)
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
        .execute(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

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
