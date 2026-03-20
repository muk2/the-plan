use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use sqlx::SqlitePool;

use crate::models::*;
use crate::session::AuthUser;

pub async fn get_user_categories(
    State(pool): State<SqlitePool>,
    AuthUser(my_id): AuthUser,
    Path(target_user_id): Path<i64>,
) -> Result<Json<Vec<Category>>, (StatusCode, String)> {
    // Allow viewing own categories or friend's categories
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

    let cats =
        sqlx::query_as::<_, Category>("SELECT * FROM categories WHERE user_id = ? ORDER BY name")
            .bind(target_user_id)
            .fetch_all(&pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(cats))
}

pub async fn get_categories(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
) -> Result<Json<Vec<Category>>, StatusCode> {
    let cats =
        sqlx::query_as::<_, Category>("SELECT * FROM categories WHERE user_id = ? ORDER BY name")
            .bind(user_id)
            .fetch_all(&pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(cats))
}

pub async fn upsert_category(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
    Json(input): Json<CategoryInput>,
) -> Result<Json<Category>, (StatusCode, String)> {
    let cat = sqlx::query_as::<_, Category>(
        "INSERT INTO categories (user_id, name, label, color) VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, name) DO UPDATE SET label = excluded.label, color = excluded.color
         RETURNING *",
    )
    .bind(user_id)
    .bind(&input.name)
    .bind(&input.label)
    .bind(&input.color)
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(cat))
}

pub async fn delete_category(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
    Path(name): Path<String>,
) -> Result<StatusCode, (StatusCode, String)> {
    sqlx::query("DELETE FROM categories WHERE user_id = ? AND name = ?")
        .bind(user_id)
        .bind(&name)
        .execute(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}
