use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};
use std::time::Instant;

/// Simple in-memory rate limiter keyed by string (e.g. IP or username).
pub struct RateLimiter {
    requests: Mutex<HashMap<String, Vec<Instant>>>,
    max_requests: usize,
    window_secs: u64,
}

impl RateLimiter {
    pub fn new(max_requests: usize, window_secs: u64) -> Self {
        Self {
            requests: Mutex::new(HashMap::new()),
            max_requests,
            window_secs,
        }
    }

    /// Returns true if the request is allowed, false if rate limited.
    pub fn check(&self, key: &str) -> bool {
        let mut map = self.requests.lock().unwrap();
        let now = Instant::now();
        let window = std::time::Duration::from_secs(self.window_secs);

        let entries = map.entry(key.to_string()).or_default();

        // Remove expired entries
        entries.retain(|t| now.duration_since(*t) < window);

        if entries.len() >= self.max_requests {
            return false;
        }

        entries.push(now);

        // Opportunistic cleanup (~1% of requests)
        drop(map);
        if rand::random::<u8>() < 3 {
            self.cleanup();
        }

        true
    }

    fn cleanup(&self) {
        let mut map = self.requests.lock().unwrap();
        let now = Instant::now();
        let window = std::time::Duration::from_secs(self.window_secs);
        map.retain(|_, entries| {
            entries.retain(|t| now.duration_since(*t) < window);
            !entries.is_empty()
        });
    }
}

/// 10 login attempts per minute per key (username)
pub static LOGIN_LIMITER: LazyLock<RateLimiter> = LazyLock::new(|| RateLimiter::new(10, 60));

/// 5 signup attempts per minute per key (IP/username)
pub static SIGNUP_LIMITER: LazyLock<RateLimiter> = LazyLock::new(|| RateLimiter::new(5, 60));
