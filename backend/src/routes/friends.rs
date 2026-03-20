use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use rand::Rng;
use sqlx::SqlitePool;

use crate::models::*;
use crate::session::AuthUser;

#[derive(serde::Serialize)]
pub struct FriendInfo {
    pub friendship_id: i64,
    pub user: UserPublic,
}

#[derive(serde::Serialize)]
pub struct InviteLinkResponse {
    pub code: String,
}

#[derive(serde::Serialize)]
pub struct InviteInfo {
    pub code: String,
    pub from_user: UserPublic,
}

fn generate_invite_code() -> String {
    let mut rng = rand::thread_rng();
    let chars: Vec<char> = "abcdefghijklmnopqrstuvwxyz0123456789".chars().collect();
    (0..8)
        .map(|_| chars[rng.r#gen_range(0..chars.len())])
        .collect()
}

pub async fn create_invite(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
) -> Result<Json<InviteLinkResponse>, (StatusCode, String)> {
    let code = generate_invite_code();
    sqlx::query("INSERT INTO invite_links (user_id, code) VALUES (?, ?)")
        .bind(user_id)
        .bind(&code)
        .execute(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(InviteLinkResponse { code }))
}

pub async fn get_invite_info(
    State(pool): State<SqlitePool>,
    Path(code): Path<String>,
) -> Result<Json<InviteInfo>, (StatusCode, String)> {
    let invite = sqlx::query_as::<_, InviteLink>("SELECT * FROM invite_links WHERE code = ?")
        .bind(&code)
        .fetch_optional(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Invalid invite code".into()))?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(invite.user_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(InviteInfo {
        code: invite.code,
        from_user: user.into(),
    }))
}

pub async fn accept_invite(
    State(pool): State<SqlitePool>,
    AuthUser(my_id): AuthUser,
    Path(code): Path<String>,
) -> Result<Json<FriendInfo>, (StatusCode, String)> {
    let invite = sqlx::query_as::<_, InviteLink>("SELECT * FROM invite_links WHERE code = ?")
        .bind(&code)
        .fetch_optional(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Invalid invite code".into()))?;

    if invite.user_id == my_id {
        return Err((StatusCode::BAD_REQUEST, "Cannot friend yourself".into()));
    }

    let (a, b) = if my_id < invite.user_id {
        (my_id, invite.user_id)
    } else {
        (invite.user_id, my_id)
    };

    let existing = sqlx::query("SELECT id FROM friendships WHERE user_a = ? AND user_b = ?")
        .bind(a)
        .bind(b)
        .fetch_optional(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if existing.is_some() {
        return Err((StatusCode::CONFLICT, "Already friends".into()));
    }

    let friendship = sqlx::query_as::<_, Friendship>(
        "INSERT INTO friendships (user_a, user_b) VALUES (?, ?) RETURNING *",
    )
    .bind(a)
    .bind(b)
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let friend_user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(invite.user_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(FriendInfo {
        friendship_id: friendship.id,
        user: friend_user.into(),
    }))
}

pub async fn list_friends(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
) -> Result<Json<Vec<FriendInfo>>, StatusCode> {
    let rows =
        sqlx::query_as::<_, Friendship>("SELECT * FROM friendships WHERE user_a = ? OR user_b = ?")
            .bind(user_id)
            .bind(user_id)
            .fetch_all(&pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut friends = Vec::new();
    for f in rows {
        let friend_id = if f.user_a == user_id {
            f.user_b
        } else {
            f.user_a
        };
        let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
            .bind(friend_id)
            .fetch_one(&pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        friends.push(FriendInfo {
            friendship_id: f.id,
            user: user.into(),
        });
    }

    Ok(Json(friends))
}

pub async fn remove_friend(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
    Path(friendship_id): Path<i64>,
) -> Result<StatusCode, (StatusCode, String)> {
    let result = sqlx::query("DELETE FROM friendships WHERE id = ? AND (user_a = ? OR user_b = ?)")
        .bind(friendship_id)
        .bind(user_id)
        .bind(user_id)
        .execute(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Friendship not found".into()));
    }

    Ok(StatusCode::NO_CONTENT)
}
