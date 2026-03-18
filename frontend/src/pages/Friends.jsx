import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../theme";
import * as api from "../api";

export default function Friends() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.friends.list().then(setFriends).catch(() => {});
  }, []);

  const createInvite = async () => {
    try {
      const res = await api.friends.createInvite();
      setInviteCode(res.code);
    } catch (e) { alert(e.message); }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeFriend = async (id) => {
    if (!confirm("Remove this friend?")) return;
    try {
      await api.friends.remove(id);
      setFriends(friends.filter(f => f.friendship_id !== id));
    } catch (e) { alert(e.message); }
  };

  const btnStyle = {
    padding: "10px 20px",
    background: COLORS.accent,
    color: COLORS.bg,
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  };

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
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Friends</h1>
      </div>

      {/* Invite Section */}
      <div style={{ marginBottom: 32, padding: "16px", background: COLORS.surface, borderRadius: 8, border: `1px solid ${COLORS.border}`, maxWidth: 500 }}>
        <div style={{ color: COLORS.accent, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Invite a Friend</div>
        <p style={{ color: COLORS.textDim, fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
          Generate an invite link and share it with your friends. They can use it to connect with you on The Plan.
        </p>
        {!inviteCode ? (
          <button onClick={createInvite} style={btnStyle}>Generate Invite Link</button>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              readOnly
              value={`${window.location.origin}/invite/${inviteCode}`}
              style={{
                flex: 1,
                padding: "10px 14px",
                background: COLORS.surface2,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                color: COLORS.accent,
                fontSize: 12,
                fontFamily: "'IBM Plex Mono', monospace",
                outline: "none",
              }}
            />
            <button onClick={copyLink} style={btnStyle}>
              {copied ? "Copied!" : "Copy"}
            </button>
            <button onClick={createInvite} style={{ ...btnStyle, background: COLORS.surface2, color: COLORS.textDim }}>New</button>
          </div>
        )}
      </div>

      {/* Friends List */}
      <div style={{ maxWidth: 500 }}>
        <div style={{ color: COLORS.accent, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
          Your Friends ({friends.length})
        </div>
        {friends.length === 0 && (
          <div style={{ color: COLORS.textDim, fontSize: 13, padding: 20, textAlign: "center" }}>
            No friends yet. Share an invite link to connect!
          </div>
        )}
        {friends.map(f => (
          <div key={f.friendship_id} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px", marginBottom: 6,
            background: COLORS.surface, borderRadius: 8,
            border: `1px solid ${COLORS.border}`,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: COLORS.accent + "22",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: COLORS.accent, fontWeight: 800, fontSize: 14,
            }}>
              {f.user.display_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: COLORS.text, fontSize: 14, fontWeight: 600 }}>{f.user.display_name}</div>
              <div style={{ color: COLORS.textDim, fontSize: 12 }}>@{f.user.username}</div>
            </div>
            <button onClick={() => navigate(`/user/${f.user.id}`)} style={{ ...btnStyle, padding: "6px 12px", fontSize: 11 }}>
              View
            </button>
            <button onClick={() => removeFriend(f.friendship_id)} style={{
              background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 6,
              color: COLORS.textFaint, cursor: "pointer", padding: "6px 10px", fontSize: 11, fontFamily: "inherit",
            }}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
