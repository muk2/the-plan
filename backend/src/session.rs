use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
};
use axum_extra::extract::cookie::{Cookie, CookieJar};
use rand::Rng;
use sqlx::SqlitePool;

const SESSION_COOKIE: &str = "session_token";

pub fn generate_token() -> String {
    let mut rng = rand::thread_rng();
    let bytes: Vec<u8> = (0..32).map(|_| rng.r#gen::<u8>()).collect();
    hex::encode(bytes)
}

pub async fn create_session(pool: &SqlitePool, user_id: i64) -> Result<String, sqlx::Error> {
    let token = generate_token();
    sqlx::query("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))")
        .bind(&token)
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(token)
}

pub async fn get_user_id_from_token(pool: &SqlitePool, token: &str) -> Option<i64> {
    // Opportunistically clean expired sessions (~1% of requests)
    let r: u8 = rand::thread_rng().r#gen();
    if r < 3 {
        sqlx::query("DELETE FROM sessions WHERE expires_at < datetime('now')")
            .execute(pool)
            .await
            .ok();
    }

    sqlx::query_scalar::<_, i64>(
        "SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')",
    )
    .bind(token)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten()
}

pub async fn delete_session(pool: &SqlitePool, token: &str) {
    sqlx::query("DELETE FROM sessions WHERE token = ?")
        .bind(token)
        .execute(pool)
        .await
        .ok();
}

pub fn set_session_cookie(jar: CookieJar, token: &str) -> CookieJar {
    let is_secure = std::env::var("SECURE_COOKIES")
        .map(|v| v != "0" && v.to_lowercase() != "false")
        .unwrap_or(true);
    let cookie = Cookie::build((SESSION_COOKIE, token.to_string()))
        .path("/")
        .http_only(true)
        .secure(is_secure)
        .same_site(axum_extra::extract::cookie::SameSite::Lax)
        .max_age(time::Duration::days(30))
        .build();
    jar.add(cookie)
}

pub fn remove_session_cookie(jar: CookieJar) -> CookieJar {
    jar.remove(Cookie::from(SESSION_COOKIE))
}

pub fn get_token_from_jar(jar: &CookieJar) -> Option<String> {
    jar.get(SESSION_COOKIE).map(|c| c.value().to_string())
}

/// Extractor that provides the authenticated user_id
pub struct AuthUser(pub i64);

impl FromRequestParts<SqlitePool> for AuthUser {
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &SqlitePool,
    ) -> Result<Self, Self::Rejection> {
        let jar = CookieJar::from_request_parts(parts, state)
            .await
            .map_err(|_| StatusCode::UNAUTHORIZED)?;
        let token = get_token_from_jar(&jar).ok_or(StatusCode::UNAUTHORIZED)?;
        let user_id = get_user_id_from_token(state, &token)
            .await
            .ok_or(StatusCode::UNAUTHORIZED)?;
        Ok(AuthUser(user_id))
    }
}
