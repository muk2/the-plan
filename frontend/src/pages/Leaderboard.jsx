import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../theme";
import Tag from "../components/Tag";
import * as api from "../api";

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [period, setPeriod] = useState("week");

  useEffect(() => {
    api.leaderboard.get(period).then(setEntries).catch(() => {});
  }, [period]);

  const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];

  return (
    <div style={{
      background: COLORS.bg,
      minHeight: "100vh",
      fontFamily: "'IBM Plex Sans', sans-serif",
      color: COLORS.text,
      padding: "24px 28px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
          &larr; Back
        </button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Leaderboard</h1>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 4 }}>
          {["week", "month"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: "6px 14px",
              background: period === p ? COLORS.accent : COLORS.surface2,
              color: period === p ? COLORS.bg : COLORS.textDim,
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              textTransform: "capitalize",
            }}>{p}</button>
          ))}
        </div>
      </div>

      {entries.length === 0 && (
        <div style={{ color: COLORS.textDim, fontSize: 13, padding: 40, textAlign: "center" }}>
          No data yet. Add friends and start logging progress to see the leaderboard!
        </div>
      )}

      {entries.map((entry, i) => {
        const isMe = entry.user_id === user?.id;
        return (
          <div key={entry.user_id} style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "16px 20px", marginBottom: 8,
            background: isMe ? `${COLORS.accent}11` : COLORS.surface,
            borderRadius: 10,
            border: `1px solid ${isMe ? COLORS.accent + "44" : COLORS.border}`,
            cursor: isMe ? "default" : "pointer",
          }} onClick={() => !isMe && navigate(`/user/${entry.user_id}`)}>
            {/* Rank */}
            <div style={{
              width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: i < 3 ? 22 : 16,
              fontWeight: 800,
              color: i < 3 ? COLORS.accent : COLORS.textFaint,
            }}>
              {i < 3 ? medals[i] : `#${i + 1}`}
            </div>

            {/* Avatar */}
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: isMe ? COLORS.accent + "33" : COLORS.surface2,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: isMe ? COLORS.accent : COLORS.textDim,
              fontWeight: 800, fontSize: 16,
            }}>
              {entry.display_name?.[0]?.toUpperCase() || "?"}
            </div>

            {/* Name */}
            <div style={{ flex: 1 }}>
              <div style={{ color: COLORS.text, fontSize: 15, fontWeight: 600 }}>
                {entry.display_name} {isMe && <span style={{ color: COLORS.accent, fontSize: 11 }}>(you)</span>}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                {entry.categories.slice(0, 4).map((c, ci) => (
                  <Tag key={ci} color={COLORS.accent} label={`${c.category_name} ${c.hours.toFixed(1)}h`} />
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ textAlign: "right" }}>
              <div style={{ color: COLORS.accent, fontSize: 20, fontWeight: 800, fontFamily: "'IBM Plex Mono', monospace" }}>
                {entry.total_hours.toFixed(1)}h
              </div>
              {entry.streak_days > 0 && (
                <div style={{ color: COLORS.textDim, fontSize: 11 }}>{entry.streak_days} day streak</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
