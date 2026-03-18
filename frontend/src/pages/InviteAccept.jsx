import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../theme";
import * as api from "../api";

export default function InviteAccept() {
  const { code } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inviteInfo, setInviteInfo] = useState(null);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    api.friends.getInviteInfo(code)
      .then(setInviteInfo)
      .catch(e => setError(e.message));
  }, [code]);

  const accept = async () => {
    try {
      await api.friends.acceptInvite(code);
      setAccepted(true);
    } catch (e) { setError(e.message); }
  };

  if (!user) {
    navigate(`/login?invite=${code}`);
    return null;
  }

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
        width: 400,
        maxWidth: "90vw",
        textAlign: "center",
      }}>
        <span style={{ color: COLORS.accent, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>Friend Invite</span>

        {error && (
          <div style={{ color: "#e55", fontSize: 13, marginTop: 16, padding: "8px 12px", background: "#e5555522", borderRadius: 6 }}>
            {error}
          </div>
        )}

        {inviteInfo && !accepted && (
          <>
            <h2 style={{ color: COLORS.text, marginTop: 20, fontSize: 20 }}>
              {inviteInfo.from_user.display_name}
            </h2>
            <p style={{ color: COLORS.textDim, fontSize: 13 }}>
              @{inviteInfo.from_user.username} invited you to connect on The Plan
            </p>
            <button onClick={accept} style={{
              marginTop: 16,
              padding: "12px 32px",
              background: COLORS.accent,
              color: COLORS.bg,
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}>Accept Invite</button>
          </>
        )}

        {accepted && (
          <>
            <h2 style={{ color: COLORS.accent, marginTop: 20, fontSize: 20 }}>Connected!</h2>
            <p style={{ color: COLORS.textDim, fontSize: 13 }}>
              You and {inviteInfo?.from_user.display_name} are now friends.
            </p>
            <button onClick={() => navigate("/leaderboard")} style={{
              marginTop: 16,
              padding: "12px 32px",
              background: COLORS.accent,
              color: COLORS.bg,
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}>View Leaderboard</button>
          </>
        )}
      </div>
    </div>
  );
}
