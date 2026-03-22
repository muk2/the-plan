use axum::{Json, extract::State, http::StatusCode};
use axum_extra::extract::cookie::CookieJar;
use sqlx::SqlitePool;

use crate::auth::{hash_password, verify_password};
use crate::models::*;
use crate::session::{self, AuthUser};

pub async fn signup(
    State(pool): State<SqlitePool>,
    jar: CookieJar,
    Json(input): Json<SignupRequest>,
) -> Result<(CookieJar, Json<UserPublic>), (StatusCode, String)> {
    if !crate::rate_limit::SIGNUP_LIMITER.check(&input.username) {
        return Err((
            StatusCode::TOO_MANY_REQUESTS,
            "Too many signup attempts. Please try again in a minute.".into(),
        ));
    }
    if input.username.len() < 2 || input.username.len() > 32 {
        return Err((
            StatusCode::BAD_REQUEST,
            "Username must be 2-32 characters".into(),
        ));
    }
    if input.password.len() < 8 {
        return Err((
            StatusCode::BAD_REQUEST,
            "Password must be at least 8 characters".into(),
        ));
    }
    if !input.password.chars().any(|c| c.is_ascii_digit())
        || !input.password.chars().any(|c| c.is_alphabetic())
    {
        return Err((
            StatusCode::BAD_REQUEST,
            "Password must contain both letters and numbers".into(),
        ));
    }

    let hash =
        hash_password(&input.password).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    let result = sqlx::query_as::<_, User>(
        "INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?) RETURNING *",
    )
    .bind(&input.username)
    .bind(&input.display_name)
    .bind(&hash)
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        if e.to_string().contains("UNIQUE") {
            (StatusCode::CONFLICT, "Username already taken".into())
        } else {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("DB error: {}", e),
            )
        }
    })?;

    seed_default_categories(&pool, result.id).await;

    let token = session::create_session(&pool, result.id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let jar = session::set_session_cookie(jar, &token);
    Ok((jar, Json(result.into())))
}

pub async fn login(
    State(pool): State<SqlitePool>,
    jar: CookieJar,
    Json(input): Json<LoginRequest>,
) -> Result<(CookieJar, Json<UserPublic>), (StatusCode, String)> {
    if !crate::rate_limit::LOGIN_LIMITER.check(&input.username) {
        return Err((
            StatusCode::TOO_MANY_REQUESTS,
            "Too many login attempts. Please try again in a minute.".into(),
        ));
    }
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = ?")
        .bind(&input.username)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("DB error: {}", e),
            )
        })?
        .ok_or((StatusCode::UNAUTHORIZED, "Invalid credentials".into()))?;

    if !verify_password(&input.password, &user.password_hash) {
        return Err((StatusCode::UNAUTHORIZED, "Invalid credentials".into()));
    }

    let token = session::create_session(&pool, user.id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let jar = session::set_session_cookie(jar, &token);
    Ok((jar, Json(user.into())))
}

pub async fn logout(State(pool): State<SqlitePool>, jar: CookieJar) -> (CookieJar, StatusCode) {
    if let Some(token) = session::get_token_from_jar(&jar) {
        session::delete_session(&pool, &token).await;
    }
    (session::remove_session_cookie(jar), StatusCode::NO_CONTENT)
}

pub async fn me(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
) -> Result<Json<UserPublic>, StatusCode> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_optional(&pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::UNAUTHORIZED)?;

    Ok(Json(user.into()))
}

pub async fn update_profile(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
    Json(input): Json<UpdateProfileInput>,
) -> Result<Json<UserPublic>, (StatusCode, String)> {
    if let Some(ref name) = input.display_name {
        sqlx::query("UPDATE users SET display_name = ? WHERE id = ?")
            .bind(name)
            .bind(user_id)
            .execute(&pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }
    if let Some(ref bio) = input.bio {
        sqlx::query("UPDATE users SET bio = ? WHERE id = ?")
            .bind(bio)
            .bind(user_id)
            .execute(&pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }
    if let Some(ref url) = input.avatar_url {
        sqlx::query("UPDATE users SET avatar_url = ? WHERE id = ?")
            .bind(url)
            .bind(user_id)
            .execute(&pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(user.into()))
}

pub async fn update_ai_settings(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
    Json(input): Json<AiSettingsInput>,
) -> Result<Json<UserPublic>, (StatusCode, String)> {
    // Encrypt the API key before storing
    let encrypted_key = match &input.ai_api_key {
        Some(key) if !key.is_empty() => {
            Some(crate::crypto::encrypt(key).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?)
        }
        _ => None,
    };

    sqlx::query(
        "UPDATE users SET ai_provider = ?, ai_api_key = ?, ai_model = ?, ai_base_url = ? WHERE id = ?"
    )
    .bind(&input.ai_provider)
    .bind(&encrypted_key)
    .bind(&input.ai_model)
    .bind(&input.ai_base_url)
    .bind(user_id)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(user.into()))
}

async fn seed_default_categories(pool: &SqlitePool, user_id: i64) {
    let defaults = [
        ("prog", "Programming", "#ce422b"),
        ("language", "Languages", "#002395"),
        ("omscs", "OMSCS", "#555555"),
        ("gym", "Gym", "#7b3fa0"),
        ("golf", "Golf", "#2d7a3a"),
        ("work", "Work", "#444444"),
        ("routine", "Life", "#333333"),
        ("read", "Reading", "#2d5fa0"),
        ("free", "Free", "#336666"),
        ("sleep", "Sleep", "#222222"),
        ("music", "Music", "#c4732a"),
        ("social", "Social", "#2a7a8a"),
        ("oss", "Open Source", "#5a9a3a"),
        ("sports", "Sports", "#8a5a2a"),
    ];
    for (name, label, color) in defaults {
        sqlx::query(
            "INSERT OR IGNORE INTO categories (user_id, name, label, color) VALUES (?, ?, ?, ?)",
        )
        .bind(user_id)
        .bind(name)
        .bind(label)
        .bind(color)
        .execute(pool)
        .await
        .ok();
    }
}
