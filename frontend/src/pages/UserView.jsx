import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { COLORS } from "../theme";
import ScheduleRow from "../components/ScheduleRow";
import ProgressionTab from "../components/ProgressionTab";
import * as api from "../api";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function UserView() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [progressions, setProgressions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("schedule");
  const [schedDay, setSchedDay] = useState(0);
  const [progTab, setProgTab] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [s, c, p] = await Promise.all([
          api.schedules.listForUser(userId),
          api.categories.listForUser(userId),
          api.progressions.listForUser(userId),
        ]);
        if (cancelled) return;
        setSchedules(s);
        setCategories(c);
        setProgressions(p);
        if (p.length > 0) setProgTab(p[0].name);
        setError("");
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    setLoading(true);
    load();
    return () => { cancelled = true; };
  }, [userId]);

  const daySchedule = schedules.filter(s => s.day_of_week === schedDay).sort((a, b) => a.sort_order - b.sort_order);

  // Build typeMeta from friend's actual categories
  const typeMeta = {};
  categories.forEach(c => {
    typeMeta[c.name] = { color: c.color, label: c.label };
  });
  // Fallback for any schedule entries with categories not in the list
  schedules.forEach(s => {
    if (!typeMeta[s.category_name]) typeMeta[s.category_name] = { color: "#555", label: s.category_name };
  });

  return (
    <div style={{
      background: COLORS.bg,
      minHeight: "100vh",
      fontFamily: "'IBM Plex Sans', sans-serif",
      color: COLORS.text,
      padding: "24px 28px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
          &larr; Back
        </button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Friend&apos;s Schedule</h1>
      </div>

      {loading && (
        <div style={{ color: COLORS.textDim, fontSize: 13, padding: 20, textAlign: "center" }}>
          Loading...
        </div>
      )}

      {error && (
        <div style={{ color: "#e55", fontSize: 13, padding: "8px 12px", background: "#e5555522", borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        <button onClick={() => setTab("schedule")} style={{
          padding: "8px 16px",
          background: tab === "schedule" ? COLORS.accent : COLORS.surface2,
          color: tab === "schedule" ? COLORS.bg : COLORS.textDim,
          border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}>Schedule</button>
        <button onClick={() => setTab("progressions")} style={{
          padding: "8px 16px",
          background: tab === "progressions" ? COLORS.accent : COLORS.surface2,
          color: tab === "progressions" ? COLORS.bg : COLORS.textDim,
          border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}>Progressions</button>
      </div>

      {tab === "schedule" && (
        <div>
          <div style={{ display: "flex", gap: 2, marginBottom: 18 }}>
            {DAY_NAMES.map((d, i) => (
              <button key={i} onClick={() => setSchedDay(i)} style={{
                background: schedDay === i ? COLORS.surface2 : "transparent",
                color: schedDay === i ? COLORS.text : COLORS.textDim,
                border: `1px solid ${schedDay === i ? COLORS.border : "transparent"}`,
                borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>{d}</button>
            ))}
          </div>
          {daySchedule.length === 0 && (
            <div style={{ color: COLORS.textDim, fontSize: 13, padding: 20, textAlign: "center" }}>
              No schedule for this day.
            </div>
          )}
          {daySchedule.map((item, i) => <ScheduleRow key={i} item={item} typeMeta={typeMeta} />)}
        </div>
      )}

      {tab === "progressions" && (
        <div>
          {progressions.length > 0 && (
            <div style={{ display: "flex", gap: 2, marginBottom: 20, flexWrap: "wrap" }}>
              {progressions.map(p => (
                <button key={p.name} onClick={() => setProgTab(p.name)} style={{
                  background: progTab === p.name ? `${p.color}22` : "transparent",
                  color: progTab === p.name ? p.color : COLORS.textDim,
                  border: `1px solid ${progTab === p.name ? p.color + "66" : "transparent"}`,
                  borderRadius: 6, padding: "6px 16px", fontSize: 12,
                  fontWeight: progTab === p.name ? 700 : 400,
                  cursor: "pointer", fontFamily: "inherit",
                }}>{p.emoji} {p.label}</button>
              ))}
            </div>
          )}
          {progressions.length === 0 && (
            <div style={{ color: COLORS.textDim, fontSize: 13, padding: 20, textAlign: "center" }}>
              No progressions to show.
            </div>
          )}
          <ProgressionTab progression={progressions.find(p => p.name === progTab)} />
        </div>
      )}
    </div>
  );
}
