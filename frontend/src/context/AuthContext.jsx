import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const u = await auth.login({ username, password });
    setUser(u);
    return u;
  };

  const signup = async (username, password, display_name) => {
    const u = await auth.signup({ username, password, display_name });
    setUser(u);
    return u;
  };

  const logout = async () => {
    // Clear user state immediately so UI redirects right away
    setUser(null);
    try { await auth.logout(); } catch { /* session may already be expired */ }
  };

  const refreshUser = async () => {
    try {
      const u = await auth.me();
      setUser(u);
    } catch { /* noop */ }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
