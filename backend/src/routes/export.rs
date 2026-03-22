use axum::{Json, extract::State, http::StatusCode};
use serde::Serialize;
use sqlx::SqlitePool;

use crate::models::*;
use crate::session::AuthUser;

#[derive(Debug, Serialize)]
pub struct ExportData {
    pub exported_at: String,
    pub categories: Vec<Category>,
    pub schedules: Vec<ScheduleBlock>,
    pub progressions: Vec<ProgressionExport>,
    pub progress_logs: Vec<ProgressLog>,
    pub budget: Vec<BudgetItem>,
}

#[derive(Debug, Serialize)]
pub struct ProgressionExport {
    #[serde(flatten)]
    pub progression: Progression,
    pub phases: Vec<ProgressionPhase>,
}

pub async fn export_data(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
) -> Result<Json<ExportData>, (StatusCode, String)> {
    let categories =
        sqlx::query_as::<_, Category>("SELECT * FROM categories WHERE user_id = ? ORDER BY name")
            .bind(user_id)
            .fetch_all(&pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let schedules = sqlx::query_as::<_, ScheduleBlock>(
        "SELECT * FROM schedule_blocks WHERE user_id = ? ORDER BY day_of_week, sort_order",
    )
    .bind(user_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let progs = sqlx::query_as::<_, Progression>(
        "SELECT * FROM progressions WHERE user_id = ? ORDER BY name",
    )
    .bind(user_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut progressions = Vec::new();
    for prog in progs {
        let phases = sqlx::query_as::<_, ProgressionPhase>(
            "SELECT * FROM progression_phases WHERE progression_id = ? ORDER BY sort_order",
        )
        .bind(prog.id)
        .fetch_all(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        progressions.push(ProgressionExport {
            progression: prog,
            phases,
        });
    }

    let progress_logs = sqlx::query_as::<_, ProgressLog>(
        "SELECT * FROM progress_logs WHERE user_id = ? ORDER BY date DESC",
    )
    .bind(user_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let budget = sqlx::query_as::<_, BudgetItem>(
        "SELECT * FROM budget_items WHERE user_id = ? ORDER BY sort_order",
    )
    .bind(user_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let exported_at = chrono::Utc::now().to_rfc3339();

    Ok(Json(ExportData {
        exported_at,
        categories,
        schedules,
        progressions,
        progress_logs,
        budget,
    }))
}
