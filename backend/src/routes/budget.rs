use axum::{extract::State, http::StatusCode, Json};
use sqlx::SqlitePool;

use crate::models::*;
use crate::session::AuthUser;

pub async fn get_budget(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
) -> Result<Json<Vec<BudgetItem>>, StatusCode> {
    let items = sqlx::query_as::<_, BudgetItem>(
        "SELECT * FROM budget_items WHERE user_id = ? ORDER BY sort_order"
    )
    .bind(user_id)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(items))
}

pub async fn set_budget(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
    Json(items): Json<Vec<BudgetItemInput>>,
) -> Result<Json<Vec<BudgetItem>>, (StatusCode, String)> {
    let mut tx = pool.begin().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    sqlx::query("DELETE FROM budget_items WHERE user_id = ?")
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    for (i, item) in items.iter().enumerate() {
        sqlx::query(
            "INSERT INTO budget_items (user_id, label, hours, color, sort_order) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(user_id)
        .bind(&item.label)
        .bind(item.hours)
        .bind(&item.color)
        .bind(item.sort_order.unwrap_or(i as i64))
        .execute(&mut *tx)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    tx.commit().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let result = sqlx::query_as::<_, BudgetItem>(
        "SELECT * FROM budget_items WHERE user_id = ? ORDER BY sort_order"
    )
    .bind(user_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(result))
}
