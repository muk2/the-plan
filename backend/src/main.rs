mod auth;
mod crypto;
mod db;
mod models;
mod routes;
mod session;

use axum::{
    Router,
    routing::{delete, get, post, put},
};
use tower_http::services::ServeDir;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    // Resolve DB path relative to the binary's location, not CWD
    let db_path = std::env::var("DATABASE_PATH").unwrap_or_else(|_| {
        let exe = std::env::current_exe().unwrap_or_default();
        let base = exe.parent().unwrap_or(std::path::Path::new("."));
        // In dev: target/release/binary → go up to project root
        // In prod: binary sits next to data/
        let project_root = if base.ends_with("target/release") || base.ends_with("target/debug") {
            base.parent().unwrap().parent().unwrap()
        } else {
            base
        };
        let data_dir = project_root.join("data");
        std::fs::create_dir_all(&data_dir).ok();
        data_dir.join("theplan.db").to_string_lossy().into_owned()
    });
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);

    let pool = db::init_pool(&db_path).await;

    // API routes
    let api = Router::new()
        // Auth
        .route("/auth/signup", post(routes::auth::signup))
        .route("/auth/login", post(routes::auth::login))
        .route("/auth/logout", post(routes::auth::logout))
        .route("/auth/me", get(routes::auth::me))
        .route("/auth/profile", put(routes::auth::update_profile))
        .route("/auth/ai-settings", put(routes::auth::update_ai_settings))
        // Categories
        .route("/categories", get(routes::categories::get_categories))
        .route("/categories", post(routes::categories::upsert_category))
        .route("/categories/{name}", delete(routes::categories::delete_category))
        .route("/users/{id}/categories", get(routes::categories::get_user_categories))
        // Schedules
        .route("/schedules", get(routes::schedules::get_schedules))
        .route("/schedules", put(routes::schedules::put_schedule_day))
        .route("/users/{id}/schedules", get(routes::schedules::get_user_schedules))
        // Progressions
        .route("/progressions", get(routes::progressions::get_progressions))
        .route("/progressions", post(routes::progressions::create_progression))
        .route("/progressions/{id}", put(routes::progressions::update_progression))
        .route("/progressions/{id}", delete(routes::progressions::delete_progression))
        .route("/users/{id}/progressions", get(routes::progressions::get_user_progressions))
        // Progress logging
        .route("/progress", get(routes::progress::get_progress))
        .route("/progress", post(routes::progress::log_progress))
        .route("/progress/{id}", delete(routes::progress::delete_progress))
        // Friends
        .route("/invite", post(routes::friends::create_invite))
        .route("/invite/{code}", get(routes::friends::get_invite_info))
        .route("/invite/{code}/accept", post(routes::friends::accept_invite))
        .route("/friends", get(routes::friends::list_friends))
        .route("/friends/{id}", delete(routes::friends::remove_friend))
        // Leaderboard
        .route("/leaderboard", get(routes::leaderboard::get_leaderboard))
        // AI
        .route("/ai/analyze", post(routes::ai::analyze))
        // Budget
        .route("/budget", get(routes::budget::get_budget))
        .route("/budget", put(routes::budget::set_budget));

    // Serve frontend static files, fallback to index.html for SPA routing
    let frontend_dir = std::env::var("FRONTEND_DIR")
        .unwrap_or_else(|_| "../frontend/dist".to_string());

    let app = Router::new()
        .nest("/api", api)
        .fallback_service(ServeDir::new(&frontend_dir).fallback(
            tower_http::services::ServeFile::new(format!("{}/index.html", frontend_dir)),
        ))
        .with_state(pool);

    let addr = format!("0.0.0.0:{}", port);
    tracing::info!("Server starting on {}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
