use axum::{extract::{Path, State}, http::StatusCode, Json};
use sqlx::SqlitePool;

use crate::models::*;
use crate::session::AuthUser;

#[derive(serde::Serialize)]
pub struct ProgressionWithPhases {
    #[serde(flatten)]
    pub progression: Progression,
    pub phases: Vec<ProgressionPhase>,
}

pub async fn get_progressions(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
) -> Result<Json<Vec<ProgressionWithPhases>>, StatusCode> {
    let progs = sqlx::query_as::<_, Progression>(
        "SELECT * FROM progressions WHERE user_id = ? ORDER BY name"
    )
    .bind(user_id)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut result = Vec::new();
    for prog in progs {
        let phases = sqlx::query_as::<_, ProgressionPhase>(
            "SELECT * FROM progression_phases WHERE progression_id = ? ORDER BY sort_order"
        )
        .bind(prog.id)
        .fetch_all(&pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        result.push(ProgressionWithPhases { progression: prog, phases });
    }

    Ok(Json(result))
}

pub async fn create_progression(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
    Json(input): Json<ProgressionInput>,
) -> Result<Json<ProgressionWithPhases>, (StatusCode, String)> {
    let mut tx = pool.begin().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let prog = sqlx::query_as::<_, Progression>(
        "INSERT INTO progressions (user_id, name, label, emoji, color, current_level) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
    )
    .bind(user_id)
    .bind(&input.name)
    .bind(&input.label)
    .bind(&input.emoji)
    .bind(&input.color)
    .bind(&input.current_level)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut phases = Vec::new();
    for (i, phase) in input.phases.iter().enumerate() {
        let p = sqlx::query_as::<_, ProgressionPhase>(
            "INSERT INTO progression_phases (progression_id, phase_name, period, hours_per_week, goal, topics, resources, milestone, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
        )
        .bind(prog.id)
        .bind(&phase.phase_name)
        .bind(&phase.period)
        .bind(&phase.hours_per_week)
        .bind(&phase.goal)
        .bind(phase.topics.as_ref().map(|t| serde_json::to_string(t).unwrap_or_default()))
        .bind(phase.resources.as_ref().map(|r| serde_json::to_string(r).unwrap_or_default()))
        .bind(&phase.milestone)
        .bind(i as i64)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        phases.push(p);
    }

    tx.commit().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ProgressionWithPhases { progression: prog, phases }))
}

pub async fn update_progression(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
    Path(prog_id): Path<i64>,
    Json(input): Json<ProgressionInput>,
) -> Result<Json<ProgressionWithPhases>, (StatusCode, String)> {
    let existing = sqlx::query_as::<_, Progression>("SELECT * FROM progressions WHERE id = ? AND user_id = ?")
        .bind(prog_id).bind(user_id)
        .fetch_optional(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Progression not found".into()))?;

    let mut tx = pool.begin().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    sqlx::query("UPDATE progressions SET name = ?, label = ?, emoji = ?, color = ?, current_level = ? WHERE id = ?")
        .bind(&input.name).bind(&input.label).bind(&input.emoji).bind(&input.color).bind(&input.current_level)
        .bind(existing.id)
        .execute(&mut *tx).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    sqlx::query("DELETE FROM progression_phases WHERE progression_id = ?")
        .bind(existing.id).execute(&mut *tx).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut phases = Vec::new();
    for (i, phase) in input.phases.iter().enumerate() {
        let p = sqlx::query_as::<_, ProgressionPhase>(
            "INSERT INTO progression_phases (progression_id, phase_name, period, hours_per_week, goal, topics, resources, milestone, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
        )
        .bind(existing.id)
        .bind(&phase.phase_name).bind(&phase.period).bind(&phase.hours_per_week)
        .bind(&phase.goal)
        .bind(phase.topics.as_ref().map(|t| serde_json::to_string(t).unwrap_or_default()))
        .bind(phase.resources.as_ref().map(|r| serde_json::to_string(r).unwrap_or_default()))
        .bind(&phase.milestone)
        .bind(i as i64)
        .fetch_one(&mut *tx).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        phases.push(p);
    }

    tx.commit().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let prog = sqlx::query_as::<_, Progression>("SELECT * FROM progressions WHERE id = ?")
        .bind(existing.id).fetch_one(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(ProgressionWithPhases { progression: prog, phases }))
}

pub async fn delete_progression(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
    Path(prog_id): Path<i64>,
) -> Result<StatusCode, (StatusCode, String)> {
    let result = sqlx::query("DELETE FROM progressions WHERE id = ? AND user_id = ?")
        .bind(prog_id).bind(user_id)
        .execute(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Progression not found".into()));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_user_progressions(
    State(pool): State<SqlitePool>,
    AuthUser(my_id): AuthUser,
    Path(target_user_id): Path<i64>,
) -> Result<Json<Vec<ProgressionWithPhases>>, (StatusCode, String)> {
    if my_id != target_user_id {
        let (a, b) = if my_id < target_user_id { (my_id, target_user_id) } else { (target_user_id, my_id) };
        let friendship = sqlx::query("SELECT id FROM friendships WHERE user_a = ? AND user_b = ?")
            .bind(a).bind(b)
            .fetch_optional(&pool).await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        if friendship.is_none() {
            return Err((StatusCode::FORBIDDEN, "Not friends".into()));
        }
    }

    let progs = sqlx::query_as::<_, Progression>("SELECT * FROM progressions WHERE user_id = ? ORDER BY name")
        .bind(target_user_id).fetch_all(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut result = Vec::new();
    for prog in progs {
        let phases = sqlx::query_as::<_, ProgressionPhase>(
            "SELECT * FROM progression_phases WHERE progression_id = ? ORDER BY sort_order"
        )
        .bind(prog.id).fetch_all(&pool).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        result.push(ProgressionWithPhases { progression: prog, phases });
    }

    Ok(Json(result))
}
