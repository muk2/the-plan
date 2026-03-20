use axum::{
    Json,
    extract::{Query, State},
    http::StatusCode,
};
use chrono::Datelike;
use sqlx::SqlitePool;

use crate::models::*;
use crate::session::AuthUser;

#[derive(serde::Deserialize)]
pub struct LeaderboardQuery {
    pub period: Option<String>,
}

pub async fn get_leaderboard(
    State(pool): State<SqlitePool>,
    AuthUser(user_id): AuthUser,
    Query(query): Query<LeaderboardQuery>,
) -> Result<Json<Vec<LeaderboardEntry>>, (StatusCode, String)> {
    let friendships =
        sqlx::query_as::<_, Friendship>("SELECT * FROM friendships WHERE user_a = ? OR user_b = ?")
            .bind(user_id)
            .bind(user_id)
            .fetch_all(&pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut user_ids: Vec<i64> = friendships
        .iter()
        .map(|f| {
            if f.user_a == user_id {
                f.user_b
            } else {
                f.user_a
            }
        })
        .collect();
    user_ids.push(user_id);

    if user_ids.is_empty() {
        return Ok(Json(Vec::new()));
    }

    let (from_date, to_date) = match query.period.as_deref() {
        Some("month") => {
            let now = chrono::Local::now().date_naive();
            let start = now.with_day(1).unwrap_or(now);
            (start.to_string(), now.to_string())
        }
        _ => {
            let now = chrono::Local::now().date_naive();
            let weekday = now.weekday().num_days_from_monday();
            let start = now - chrono::Duration::days(weekday as i64);
            (start.to_string(), now.to_string())
        }
    };

    // Batch fetch all users in one query
    let placeholders: String = user_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");

    let users_query = format!("SELECT * FROM users WHERE id IN ({})", placeholders);
    let mut q = sqlx::query_as::<_, User>(&users_query);
    for id in &user_ids {
        q = q.bind(id);
    }
    let users: Vec<User> = q
        .fetch_all(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Batch fetch all progress totals in one query
    let totals_query = format!(
        "SELECT user_id, COALESCE(SUM(hours), 0.0) as total FROM progress_logs WHERE user_id IN ({}) AND date >= ? AND date <= ? GROUP BY user_id",
        placeholders
    );
    let mut q = sqlx::query_as::<_, (i64, f64)>(&totals_query);
    for id in &user_ids {
        q = q.bind(id);
    }
    q = q.bind(&from_date).bind(&to_date);
    let totals: Vec<(i64, f64)> = q.fetch_all(&pool).await.unwrap_or_default();
    let totals_map: std::collections::HashMap<i64, f64> = totals.into_iter().collect();

    // Batch fetch all category breakdowns in one query
    let cats_query = format!(
        "SELECT user_id, category_name, SUM(hours) as total FROM progress_logs WHERE user_id IN ({}) AND date >= ? AND date <= ? GROUP BY user_id, category_name ORDER BY total DESC",
        placeholders
    );
    let mut q = sqlx::query_as::<_, (i64, String, f64)>(&cats_query);
    for id in &user_ids {
        q = q.bind(id);
    }
    q = q.bind(&from_date).bind(&to_date);
    let cat_rows: Vec<(i64, String, f64)> = q.fetch_all(&pool).await.unwrap_or_default();
    let mut cats_map: std::collections::HashMap<i64, Vec<CategoryHours>> =
        std::collections::HashMap::new();
    for (uid, name, hours) in cat_rows {
        cats_map.entry(uid).or_default().push(CategoryHours {
            category_name: name,
            hours,
        });
    }

    // Batch fetch all streaks: get distinct dates for all users in one query
    let dates_query = format!(
        "SELECT user_id, date FROM progress_logs WHERE user_id IN ({}) GROUP BY user_id, date ORDER BY user_id, date DESC",
        placeholders
    );
    let mut q = sqlx::query_as::<_, (i64, String)>(&dates_query);
    for id in &user_ids {
        q = q.bind(id);
    }
    let all_dates: Vec<(i64, String)> = q.fetch_all(&pool).await.unwrap_or_default();
    let mut dates_map: std::collections::HashMap<i64, Vec<String>> =
        std::collections::HashMap::new();
    for (uid, date) in all_dates {
        dates_map.entry(uid).or_default().push(date);
    }

    let today = chrono::Local::now().date_naive();

    let mut entries: Vec<LeaderboardEntry> = users
        .into_iter()
        .map(|user| {
            let streak = calculate_streak_from_dates(
                dates_map.get(&user.id).map(|v| v.as_slice()).unwrap_or(&[]),
                today,
            );
            LeaderboardEntry {
                user_id: user.id,
                username: user.username,
                display_name: user.display_name,
                total_hours: *totals_map.get(&user.id).unwrap_or(&0.0),
                streak_days: streak,
                categories: cats_map.remove(&user.id).unwrap_or_default(),
            }
        })
        .collect();

    entries.sort_by(|a, b| {
        b.total_hours
            .partial_cmp(&a.total_hours)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    Ok(Json(entries))
}

fn calculate_streak_from_dates(dates: &[String], today: chrono::NaiveDate) -> i64 {
    if dates.is_empty() {
        return 0;
    }
    let mut streak = 0i64;
    let mut expected = today;
    for date_str in dates {
        if let Ok(date) = chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
            if date == expected {
                streak += 1;
                expected -= chrono::Duration::days(1);
            } else if date < expected {
                break;
            }
        }
    }
    streak
}
