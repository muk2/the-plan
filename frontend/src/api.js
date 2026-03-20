const BASE = "/api";

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
  } catch {
    throw new Error("Can't reach server. Check your connection.");
  }
  if (res.status === 204) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  try {
    return await res.json();
  } catch {
    throw new Error("Unexpected server response.");
  }
}

// Auth
export const auth = {
  signup: (data) => request("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),
  updateProfile: (data) => request("/auth/profile", { method: "PUT", body: JSON.stringify(data) }),
  updateAiSettings: (data) => request("/auth/ai-settings", { method: "PUT", body: JSON.stringify(data) }),
};

// Categories
export const categories = {
  list: () => request("/categories"),
  upsert: (data) => request("/categories", { method: "POST", body: JSON.stringify(data) }),
  remove: (name) => request(`/categories/${name}`, { method: "DELETE" }),
};

// Schedules
export const schedules = {
  list: () => request("/schedules"),
  putDay: (data) => request("/schedules", { method: "PUT", body: JSON.stringify(data) }),
  listForUser: (userId) => request(`/users/${userId}/schedules`),
};

// Progressions
export const progressions = {
  list: () => request("/progressions"),
  create: (data) => request("/progressions", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/progressions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => request(`/progressions/${id}`, { method: "DELETE" }),
  listForUser: (userId) => request(`/users/${userId}/progressions`),
};

// Progress Logging
export const progress = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/progress${q ? "?" + q : ""}`);
  },
  log: (data) => request("/progress", { method: "POST", body: JSON.stringify(data) }),
  remove: (id) => request(`/progress/${id}`, { method: "DELETE" }),
};

// Friends
export const friends = {
  list: () => request("/friends"),
  createInvite: () => request("/invite", { method: "POST" }),
  getInviteInfo: (code) => request(`/invite/${code}`),
  acceptInvite: (code) => request(`/invite/${code}/accept`, { method: "POST" }),
  remove: (id) => request(`/friends/${id}`, { method: "DELETE" }),
};

// Leaderboard
export const leaderboard = {
  get: (period = "week") => request(`/leaderboard?period=${period}`),
};

// AI
export const ai = {
  analyze: (data = {}) => request("/ai/analyze", { method: "POST", body: JSON.stringify(data) }),
};

// Budget
export const budget = {
  list: () => request("/budget"),
  set: (items) => request("/budget", { method: "PUT", body: JSON.stringify(items) }),
};
