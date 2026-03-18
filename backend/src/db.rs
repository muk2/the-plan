use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use std::path::Path;

pub async fn init_pool(db_path: &str) -> SqlitePool {
    // Ensure parent directory exists
    if let Some(parent) = Path::new(db_path).parent() {
        std::fs::create_dir_all(parent).ok();
    }

    let url = format!("sqlite:{}?mode=rwc", db_path);
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&url)
        .await
        .expect("Failed to connect to SQLite");

    // Enable WAL mode for better concurrent performance
    sqlx::query("PRAGMA journal_mode=WAL")
        .execute(&pool)
        .await
        .ok();

    sqlx::query("PRAGMA foreign_keys=ON")
        .execute(&pool)
        .await
        .ok();

    // Run migrations
    let migrations: &[&str] = &[
        include_str!("../migrations/001_init.sql"),
        include_str!("../migrations/002_indexes.sql"),
    ];
    for migration_sql in migrations {
        for statement in migration_sql.split(';') {
            let trimmed = statement.trim();
            if !trimmed.is_empty() {
                sqlx::query(trimmed)
                    .execute(&pool)
                    .await
                    .expect("Failed to run migration");
            }
        }
    }

    // Clean up expired sessions on startup
    sqlx::query("DELETE FROM sessions WHERE expires_at < datetime('now')")
        .execute(&pool)
        .await
        .ok();

    tracing::info!("Database initialized at {}", db_path);
    pool
}
