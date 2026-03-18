-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_user_day ON schedule_blocks(user_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_progressions_user ON progressions(user_id);
CREATE INDEX IF NOT EXISTS idx_progression_phases_prog ON progression_phases(progression_id);
CREATE INDEX IF NOT EXISTS idx_progress_logs_user_date ON progress_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_user ON budget_items(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_a ON friendships(user_a);
CREATE INDEX IF NOT EXISTS idx_friendships_b ON friendships(user_b);
CREATE INDEX IF NOT EXISTS idx_invite_links_code ON invite_links(code);
