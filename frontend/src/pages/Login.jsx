import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { COLORS } from "../theme";

export default function Login() {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inviteCode = searchParams.get("invite");

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate(inviteCode ? `/invite/${inviteCode}` : "/");
  }, [user, navigate, inviteCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        await signup(username, password, displayName || username);
      } else {
        await login(username, password);
      }
      if (inviteCode) {
        navigate(`/invite/${inviteCode}`);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: COLORS.surface2,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    color: COLORS.text,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      background: COLORS.bg,
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'IBM Plex Sans', sans-serif",
    }}>
      <div style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: "40px",
        width: 380,
        maxWidth: "90vw",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ color: COLORS.accent, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>The Plan</span>
          <h1 style={{ margin: "8px 0 4px", fontSize: 24, fontWeight: 800, color: COLORS.text }}>
            {isSignup ? "Create Account" : "Welcome Back"}
          </h1>
          <p style={{ color: COLORS.textDim, fontSize: 13, margin: 0 }}>
            {isSignup ? "Set up your profile to start tracking" : "Log in to your schedule"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: COLORS.textDim, fontSize: 12, display: "block", marginBottom: 6 }}>Username</label>
            <input
              style={inputStyle}
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="your_username"
              required
            />
          </div>

          {isSignup && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: COLORS.textDim, fontSize: 12, display: "block", marginBottom: 6 }}>Display Name</label>
              <input
                style={inputStyle}
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your Name"
              />
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ color: COLORS.textDim, fontSize: 12, display: "block", marginBottom: 6 }}>Password</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isSignup ? "At least 6 characters" : "Your password"}
              required
            />
          </div>

          {error && (
            <div style={{ color: "#e55", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "#e5555522", borderRadius: 6 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: COLORS.accent,
              color: COLORS.bg,
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              fontFamily: "inherit",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "..." : isSignup ? "Create Account" : "Log In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => { setIsSignup(!isSignup); setError(""); }}
            style={{
              background: "none",
              border: "none",
              color: COLORS.accent,
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          >
            {isSignup ? "Already have an account? Log in" : "Need an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
