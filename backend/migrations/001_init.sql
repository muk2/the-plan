-- Users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    ai_provider TEXT,
    ai_api_key TEXT,
    ai_model TEXT,
    ai_base_url TEXT DEFAULT 'https://openrouter.ai/api/v1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Activity categories (user-customizable)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    color TEXT NOT NULL,
    UNIQUE(user_id, name)
);

-- Schedule blocks (weekly template)
CREATE TABLE IF NOT EXISTS schedule_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    time_range TEXT NOT NULL,
    label TEXT NOT NULL,
    category_name TEXT NOT NULL,
    note TEXT,
    sort_order INTEGER DEFAULT 0
);

-- Skill progressions
CREATE TABLE IF NOT EXISTS progressions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    emoji TEXT,
    color TEXT NOT NULL,
    current_level TEXT,
    UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS progression_phases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    progression_id INTEGER NOT NULL REFERENCES progressions(id) ON DELETE CASCADE,
    phase_name TEXT NOT NULL,
    period TEXT,
    hours_per_week TEXT,
    goal TEXT,
    topics TEXT,
    resources TEXT,
    milestone TEXT,
    sort_order INTEGER DEFAULT 0
);

-- Daily progress logs
CREATE TABLE IF NOT EXISTS progress_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    date DATE NOT NULL,
    hours REAL NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Invite links for friend discovery
CREATE TABLE IF NOT EXISTS invite_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Friend relationships
CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_a, user_b)
);

-- Time budget templates
CREATE TABLE IF NOT EXISTS budget_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    hours REAL NOT NULL,
    color TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);
