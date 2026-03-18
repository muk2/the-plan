use serde::{Deserialize, Serialize};

// ─── Database row types ─────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub display_name: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub ai_provider: Option<String>,
    #[serde(skip_serializing)]
    pub ai_api_key: Option<String>,
    pub ai_model: Option<String>,
    pub ai_base_url: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Category {
    pub id: i64,
    pub user_id: i64,
    pub name: String,
    pub label: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ScheduleBlock {
    pub id: i64,
    pub user_id: i64,
    pub day_of_week: i64,
    pub time_range: String,
    pub label: String,
    pub category_name: String,
    pub note: Option<String>,
    pub sort_order: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Progression {
    pub id: i64,
    pub user_id: i64,
    pub name: String,
    pub label: String,
    pub emoji: Option<String>,
    pub color: String,
    pub current_level: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ProgressionPhase {
    pub id: i64,
    pub progression_id: i64,
    pub phase_name: String,
    pub period: Option<String>,
    pub hours_per_week: Option<String>,
    pub goal: Option<String>,
    pub topics: Option<String>,
    pub resources: Option<String>,
    pub milestone: Option<String>,
    pub sort_order: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ProgressLog {
    pub id: i64,
    pub user_id: i64,
    pub category_name: String,
    pub date: String,
    pub hours: f64,
    pub note: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct InviteLink {
    pub id: i64,
    pub user_id: i64,
    pub code: String,
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Friendship {
    pub id: i64,
    pub user_a: i64,
    pub user_b: i64,
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct BudgetItem {
    pub id: i64,
    pub user_id: i64,
    pub label: String,
    pub hours: f64,
    pub color: String,
    pub sort_order: i64,
}

// ─── API request/response types ─────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct SignupRequest {
    pub username: String,
    pub password: String,
    pub display_name: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct UserPublic {
    pub id: i64,
    pub username: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub ai_provider: Option<String>,
    pub ai_model: Option<String>,
    pub ai_base_url: Option<String>,
}

impl From<User> for UserPublic {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            username: u.username,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            bio: u.bio,
            ai_provider: u.ai_provider,
            ai_model: u.ai_model,
            ai_base_url: u.ai_base_url,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct ScheduleBlockInput {
    pub time_range: String,
    pub label: String,
    pub category_name: String,
    pub note: Option<String>,
    pub sort_order: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct BulkScheduleInput {
    pub day_of_week: i64,
    pub blocks: Vec<ScheduleBlockInput>,
}

#[derive(Debug, Deserialize)]
pub struct ProgressionInput {
    pub name: String,
    pub label: String,
    pub emoji: Option<String>,
    pub color: String,
    pub current_level: Option<String>,
    pub phases: Vec<PhaseInput>,
}

#[derive(Debug, Deserialize)]
pub struct PhaseInput {
    pub phase_name: String,
    pub period: Option<String>,
    pub hours_per_week: Option<String>,
    pub goal: Option<String>,
    pub topics: Option<Vec<String>>,
    pub resources: Option<Vec<String>>,
    pub milestone: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ProgressLogInput {
    pub category_name: String,
    pub date: Option<String>,
    pub hours: f64,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CategoryInput {
    pub name: String,
    pub label: String,
    pub color: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileInput {
    pub display_name: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AiSettingsInput {
    pub ai_provider: Option<String>,
    pub ai_api_key: Option<String>,
    pub ai_model: Option<String>,
    pub ai_base_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AiAnalyzeRequest {
    pub prompt: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AiAnalyzeResponse {
    pub analysis: String,
}

#[derive(Debug, Serialize)]
pub struct LeaderboardEntry {
    pub user_id: i64,
    pub username: String,
    pub display_name: String,
    pub total_hours: f64,
    pub streak_days: i64,
    pub categories: Vec<CategoryHours>,
}

#[derive(Debug, Serialize)]
pub struct CategoryHours {
    pub category_name: String,
    pub hours: f64,
}

#[derive(Debug, Deserialize)]
pub struct BudgetItemInput {
    pub label: String,
    pub hours: f64,
    pub color: String,
    pub sort_order: Option<i64>,
}
