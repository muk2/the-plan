import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../theme";
import Tag from "../components/Tag";
import ScheduleRow from "../components/ScheduleRow";
import ProgressionTab from "../components/ProgressionTab";
import BudgetBar from "../components/BudgetBar";
import TimeRangeInput from "../components/TimeRangeInput";
import Modal from "../components/Modal";
import ColorPicker from "../components/ColorPicker";
import * as api from "../api";
import * as S from "../styles";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

const MAIN_TABS = [
  { id: "schedule", label: "Schedule", icon: "\u{1F4C5}" },
  { id: "progressions", label: "Progressions", icon: "\u{1F4C8}" },
  { id: "log", label: "Log Progress", icon: "\u{270F}\uFE0F" },
  { id: "budget", label: "Time Budget", icon: "\u23F1\uFE0F" },
  { id: "ai", label: "AI Coach", icon: "\u{1F9E0}" },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState("schedule");
  const [schedDay, setSchedDay] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1; // Convert Sunday=0 to our Mon=0 format
  });
  const [schedules, setSchedules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [progressions, setProgressions] = useState([]);
  const [progTab, setProgTab] = useState(null);
  const [budgetItems, setBudgetItems] = useState([]);
  const [progressLogs, setProgressLogs] = useState([]);
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAutoSchedule, setShowAutoSchedule] = useState(false);
  const [editingProg, setEditingProg] = useState(null);

  // Log form
  const [logCat, setLogCat] = useState("");
  const [logHours, setLogHours] = useState("");
  const [logNote, setLogNote] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);

  // Schedule editor
  const [editing, setEditing] = useState(false);
  const [editBlocks, setEditBlocks] = useState([]);

  // Category form
  const [catName, setCatName] = useState("");
  const [catLabel, setCatLabel] = useState("");
  const [catColor, setCatColor] = useState("#e8c547");

  // Progression form
  const [progForm, setProgForm] = useState({ name: "", label: "", emoji: "", color: "#ce422b", current_level: "", phases: [] });

  // Budget form
  const [budgetForm, setBudgetForm] = useState([]);

  // Auto-schedule form
  const [autoActivities, setAutoActivities] = useState([]);
  const [autoWake, setAutoWake] = useState("06:00");
  const [autoSleep, setAutoSleep] = useState("22:00");
  const [autoWorkStart, setAutoWorkStart] = useState("09:00");
  const [autoWorkEnd, setAutoWorkEnd] = useState("17:00");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = () => {
    api.categories.list().then(setCategories).catch(() => {});
    api.schedules.list().then(setSchedules).catch(() => {});
    api.progressions.list().then(p => {
      setProgressions(p);
      if (p.length > 0 && !progTab) setProgTab(p[0].name);
    }).catch(() => {});
    api.budget.list().then(setBudgetItems).catch(() => {});
    api.progress.list({ range: "week" }).then(setProgressLogs).catch(() => {});
  };

  const typeMeta = useMemo(() => {
    const m = {};
    categories.forEach(c => { m[c.name] = { color: c.color, label: c.label }; });
    return m;
  }, [categories]);

  const daySchedule = schedules.filter(s => s.day_of_week === schedDay).sort((a, b) => a.sort_order - b.sort_order);
  const weekTotal = progressLogs.reduce((sum, l) => sum + l.hours, 0);

  // Group logs by category for stats
  const logsByCategory = useMemo(() => {
    const m = {};
    progressLogs.forEach(l => {
      if (!m[l.category_name]) m[l.category_name] = 0;
      m[l.category_name] += l.hours;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [progressLogs]);

  // Schedule mini-map: which days have blocks
  const dayBlockCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    schedules.forEach(s => { counts[s.day_of_week]++; });
    return counts;
  }, [schedules]);

  // ── Schedule Editor ──
  const startEditing = () => {
    setEditBlocks(daySchedule.map(s => ({
      time_range: s.time_range, label: s.label,
      category_name: s.category_name, note: s.note || "",
    })));
    setEditing(true);
  };

  const saveSchedule = async () => {
    try {
      await api.schedules.putDay({ day_of_week: schedDay, blocks: editBlocks });
      const fresh = await api.schedules.list();
      setSchedules(fresh);
      setEditing(false);
    } catch (e) { alert(e.message); }
  };

  const addBlock = () => {
    const defaultCat = categories.length > 0 ? categories[0].name : "prog";
    setEditBlocks([...editBlocks, { time_range: "", label: "", category_name: defaultCat, note: "" }]);
  };

  const updateBlock = (idx, field, value) => {
    const copy = [...editBlocks];
    copy[idx] = { ...copy[idx], [field]: value };
    setEditBlocks(copy);
  };

  const removeBlock = (idx) => setEditBlocks(editBlocks.filter((_, i) => i !== idx));

  // ── Category CRUD ──
  const saveCategory = async () => {
    if (!catName || !catLabel) return;
    const slug = catName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    try {
      await api.categories.upsert({ name: slug, label: catLabel, color: catColor });
      const fresh = await api.categories.list();
      setCategories(fresh);
      setCatName(""); setCatLabel(""); setCatColor("#e8c547");
    } catch (e) { alert(e.message); }
  };

  const deleteCategory = async (name) => {
    try {
      await api.categories.remove(name);
      setCategories(categories.filter(c => c.name !== name));
    } catch (e) { alert(e.message); }
  };

  // ── Progression CRUD ──
  const openNewProgression = () => {
    setProgForm({ name: "", label: "", emoji: "", color: "#ce422b", current_level: "", phases: [] });
    setEditingProg(null);
    setShowProgressionModal(true);
  };

  const openEditProgression = (p) => {
    setProgForm({
      name: p.name, label: p.label, emoji: p.emoji || "", color: p.color,
      current_level: p.current_level || "",
      phases: (p.phases || []).map(ph => ({
        phase_name: ph.phase_name, period: ph.period || "", hours_per_week: ph.hours_per_week || "",
        goal: ph.goal || "",
        topics: typeof ph.topics === "string" ? JSON.parse(ph.topics || "[]") : (ph.topics || []),
        resources: typeof ph.resources === "string" ? JSON.parse(ph.resources || "[]") : (ph.resources || []),
        milestone: ph.milestone || "",
      })),
    });
    setEditingProg(p);
    setShowProgressionModal(true);
  };

  const saveProgression = async () => {
    if (!progForm.name || !progForm.label) return;
    const slug = progForm.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const payload = { ...progForm, name: slug };
    try {
      if (editingProg) {
        await api.progressions.update(editingProg.id, payload);
      } else {
        await api.progressions.create(payload);
      }
      const fresh = await api.progressions.list();
      setProgressions(fresh);
      if (!progTab && fresh.length > 0) setProgTab(fresh[0].name);
      setShowProgressionModal(false);
    } catch (e) { alert(e.message); }
  };

  const deleteProgression = async (id) => {
    if (!confirm("Delete this progression?")) return;
    try {
      await api.progressions.remove(id);
      const fresh = await api.progressions.list();
      setProgressions(fresh);
      if (fresh.length > 0) setProgTab(fresh[0].name);
      else setProgTab(null);
    } catch (e) { alert(e.message); }
  };

  const addPhase = () => {
    setProgForm({ ...progForm, phases: [...progForm.phases, { phase_name: "", period: "", hours_per_week: "", goal: "", topics: [], resources: [], milestone: "" }] });
  };

  const updatePhase = (idx, field, value) => {
    const copy = [...progForm.phases];
    copy[idx] = { ...copy[idx], [field]: value };
    setProgForm({ ...progForm, phases: copy });
  };

  const removePhase = (idx) => {
    setProgForm({ ...progForm, phases: progForm.phases.filter((_, i) => i !== idx) });
  };

  // ── Budget ──
  const openBudgetEditor = () => {
    setBudgetForm(budgetItems.length > 0
      ? budgetItems.map(b => ({ label: b.label, hours: b.hours, color: b.color }))
      : [{ label: "", hours: 0, color: "#e8c547" }]
    );
    setShowBudgetModal(true);
  };

  const saveBudget = async () => {
    try {
      const result = await api.budget.set(budgetForm.filter(b => b.label && b.hours > 0));
      setBudgetItems(result);
      setShowBudgetModal(false);
    } catch (e) { alert(e.message); }
  };

  // ── Auto Schedule ──
  const openAutoSchedule = () => {
    setAutoActivities(categories.filter(c => !["sleep", "routine", "work"].includes(c.name)).map(c => ({
      name: c.name, label: c.label, color: c.color, enabled: false,
      hours_per_week: 2, preferred_time: "evening",
    })));
    setShowAutoSchedule(true);
  };

  const generateAutoSchedule = async () => {
    const active = autoActivities.filter(a => a.enabled);
    if (active.length === 0) return alert("Select at least one activity");

    const parseTime = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
    const formatTime = (mins) => { const h = Math.floor(mins / 60); const m = mins % 60; return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`; };

    const wake = parseTime(autoWake);
    const sleep = parseTime(autoSleep);
    const workStart = parseTime(autoWorkStart);
    const workEnd = parseTime(autoWorkEnd);

    // Distribute activities across the week
    for (let day = 0; day < 7; day++) {
      const blocks = [];
      let cursor = wake;

      // Morning routine
      blocks.push({ time_range: `${formatTime(cursor)}\u2013${formatTime(cursor + 30)}`, label: "Wake + Morning", category_name: "routine", note: "" });
      cursor += 30;

      const isWeekday = day < 5;

      if (isWeekday) {
        // Pre-work activities
        const morningSlot = workStart - cursor;
        if (morningSlot >= 60) {
          const morningActivities = active.filter(a => a.preferred_time === "morning" || a.preferred_time === "any");
          if (morningActivities.length > 0) {
            const act = morningActivities[day % morningActivities.length];
            const dur = Math.min(morningSlot - 15, 90);
            blocks.push({ time_range: `${formatTime(cursor)}\u2013${formatTime(cursor + dur)}`, label: act.label, category_name: act.name, note: "" });
            cursor += dur;
          }
        }
        // Transition to work
        if (cursor < workStart) {
          blocks.push({ time_range: `${formatTime(cursor)}\u2013${formatTime(workStart)}`, label: "Breakfast + Prep", category_name: "routine", note: "" });
        }
        // Work
        blocks.push({ time_range: `${formatTime(workStart)}\u2013${formatTime(workEnd)}`, label: "Work", category_name: "work", note: "" });
        cursor = workEnd;

        // Evening activities
        blocks.push({ time_range: `${formatTime(cursor)}\u2013${formatTime(cursor + 30)}`, label: "Dinner", category_name: "routine", note: "" });
        cursor += 30;

        const eveningActivities = active.filter(a => a.preferred_time === "evening" || a.preferred_time === "any");
        if (eveningActivities.length > 0) {
          const act = eveningActivities[day % eveningActivities.length];
          const dur = Math.min(90, sleep - cursor - 30);
          if (dur > 0) {
            blocks.push({ time_range: `${formatTime(cursor)}\u2013${formatTime(cursor + dur)}`, label: act.label, category_name: act.name, note: "" });
            cursor += dur;
          }
        }
      } else {
        // Weekend - more flexible
        const weekendActivities = active.filter(a => a.enabled);
        let actIdx = day === 5 ? 0 : Math.floor(active.length / 2);
        for (let slot = 0; slot < 3 && actIdx < weekendActivities.length; slot++) {
          const act = weekendActivities[actIdx % weekendActivities.length];
          const dur = 90;
          blocks.push({ time_range: `${formatTime(cursor)}\u2013${formatTime(cursor + dur)}`, label: act.label, category_name: act.name, note: "" });
          cursor += dur + 30; // 30 min break
          actIdx++;
        }
      }

      // Wind down + sleep
      if (cursor < sleep) {
        blocks.push({ time_range: `${formatTime(Math.max(cursor, sleep - 60))}\u2013${formatTime(sleep)}`, label: "Wind Down", category_name: "free", note: "" });
      }
      blocks.push({ time_range: formatTime(sleep), label: "Sleep", category_name: "sleep", note: "" });

      try {
        await api.schedules.putDay({ day_of_week: day, blocks });
      } catch (e) { console.error(e); }
    }

    const fresh = await api.schedules.list();
    setSchedules(fresh);
    setShowAutoSchedule(false);
  };

  // ── Log Progress ──
  const handleLog = async (e) => {
    e.preventDefault();
    if (!logCat || !logHours) return;
    try {
      await api.progress.log({ category_name: logCat, hours: parseFloat(logHours), note: logNote || null, date: logDate });
      setLogHours(""); setLogNote("");
      const fresh = await api.progress.list({ range: "week" });
      setProgressLogs(fresh);
    } catch (e) { alert(e.message); }
  };

  // ── AI ──
  const handleAi = async () => {
    setAiLoading(true); setAiResult("");
    try {
      const res = await api.ai.analyze({ prompt: aiPrompt || null });
      setAiResult(res.analysis);
    } catch (e) { setAiResult("Error: " + e.message); }
    finally { setAiLoading(false); }
  };

  return (
    <div style={{
      background: COLORS.bg, minHeight: "100vh",
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      color: COLORS.text, paddingBottom: 60,
    }}>
      {/* ─── Header ─── */}
      <div className="dashboard-header" style={{
        borderBottom: `1px solid ${COLORS.border}`,
        padding: "20px 28px 0", background: COLORS.surface,
      }}>
        <div className="dashboard-header-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={S.sectionHeader}>The Plan</span>
            <h1 style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 800, color: COLORS.text, letterSpacing: "-0.02em" }}>
              {user?.display_name || user?.username}
            </h1>
          </div>
          <div className="dashboard-nav" style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => navigate("/friends")} style={S.btnSecondary}>Friends</button>
            <button onClick={() => navigate("/leaderboard")} style={S.btnSecondary}>Leaderboard</button>
            <button onClick={() => navigate("/profile")} style={S.btnSecondary}>Profile</button>
            <button onClick={async () => { await logout(); navigate("/login"); }} style={{ ...S.btnSecondary, color: "#e55", borderColor: "#e5555544" }}>Logout</button>
          </div>
        </div>
        {/* Tabs */}
        <div className="dashboard-tabs" style={{ display: "flex", gap: 2, marginTop: 16 }}>
          {MAIN_TABS.map(t => (
            <button key={t.id} onClick={() => setMainTab(t.id)} style={{
              background: mainTab === t.id ? COLORS.accent : "transparent",
              color: mainTab === t.id ? COLORS.bg : COLORS.textDim,
              border: "none", borderRadius: "8px 8px 0 0",
              padding: "10px 18px", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}>{t.icon} <span className="tab-label">{t.label}</span></button>
          ))}
        </div>
      </div>

      <div className="dashboard-content" style={{ padding: "24px 28px", maxWidth: 1100 }}>

        {/* ═══════════════ SCHEDULE TAB ═══════════════ */}
        {mainTab === "schedule" && (
          <div>
            {/* Day selector with indicators */}
            <div className="day-selector" style={{ display: "flex", gap: 4, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
              {DAY_NAMES.map((d, i) => (
                <button key={i} onClick={() => { setSchedDay(i); setEditing(false); }} style={{
                  background: schedDay === i ? COLORS.accent : COLORS.surface,
                  color: schedDay === i ? COLORS.bg : COLORS.text,
                  border: `1px solid ${schedDay === i ? COLORS.accent : COLORS.border}`,
                  borderRadius: 8, padding: "10px 16px",
                  fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.15s",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  minWidth: 52, flex: "1 1 0",
                }}>
                  <span>{d}</span>
                  <div style={{ display: "flex", gap: 2 }}>
                    {Array.from({ length: Math.min(dayBlockCounts[i], 5) }).map((_, j) => (
                      <div key={j} style={{
                        width: 4, height: 4, borderRadius: "50%",
                        background: schedDay === i ? COLORS.bg + "88" : COLORS.accent,
                      }} />
                    ))}
                  </div>
                </button>
              ))}
              <div className="day-actions" style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                <button onClick={openAutoSchedule} style={S.btnSecondary}>Auto-Generate</button>
                {!editing ? (
                  <button onClick={startEditing} style={S.btn}>Edit Day</button>
                ) : (
                  <>
                    <button onClick={saveSchedule} style={S.btn}>Save</button>
                    <button onClick={() => setEditing(false)} style={S.btnSecondary}>Cancel</button>
                  </>
                )}
              </div>
            </div>

            {!editing ? (
              <>
                {daySchedule.length === 0 ? (
                  <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
                    <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>{"\u{1F4C5}"}</div>
                    <div style={{ color: COLORS.textDim, fontSize: 14 }}>No schedule for {DAY_NAMES[schedDay]}.</div>
                    <div style={{ color: COLORS.textFaint, fontSize: 12, marginTop: 4 }}>Click "Edit Day" to add blocks or "Auto-Generate" for a full schedule.</div>
                  </div>
                ) : (
                  <div>{daySchedule.map((item, i) => <ScheduleRow key={i} item={item} typeMeta={typeMeta} />)}</div>
                )}
                {/* Weekly overview mini-grid */}
                {schedules.length > 0 && (
                  <div style={{ ...S.card, marginTop: 20 }}>
                    <div style={S.sectionHeader}>Weekly Overview</div>
                    <div className="weekly-overview" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                      {DAY_NAMES.map((d, i) => {
                        const dayBlocks = schedules.filter(s => s.day_of_week === i);
                        return (
                          <div key={i} style={{ background: COLORS.surface2, borderRadius: 8, padding: "8px 10px", border: schedDay === i ? `1px solid ${COLORS.accent}44` : `1px solid transparent` }}>
                            <div style={{ color: COLORS.accent, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{d}</div>
                            {dayBlocks.slice(0, 4).map((b, j) => {
                              const meta = typeMeta[b.category_name] || { color: "#555" };
                              return <div key={j} style={{ height: 3, background: meta.color, borderRadius: 2, marginBottom: 2, opacity: 0.8 }} />;
                            })}
                            {dayBlocks.length > 4 && <div style={{ color: COLORS.textFaint, fontSize: 9 }}>+{dayBlocks.length - 4} more</div>}
                            {dayBlocks.length === 0 && <div style={{ color: COLORS.textFaint, fontSize: 9 }}>empty</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Schedule Editor */
              <div>
                {editBlocks.map((block, idx) => (
                  <div key={idx} className="schedule-editor-row" style={{
                    display: "flex", gap: 8, marginBottom: 6, alignItems: "center",
                    padding: "8px 12px", background: COLORS.surface, borderRadius: 8,
                    border: `1px solid ${COLORS.border}`,
                  }}>
                    <TimeRangeInput value={block.time_range} onChange={v => updateBlock(idx, "time_range", v)} />
                    <input style={{ ...S.input, flex: 1 }} placeholder="Activity name" value={block.label} onChange={e => updateBlock(idx, "label", e.target.value)} />
                    <select style={{ ...S.select, width: 140 }} value={block.category_name} onChange={e => updateBlock(idx, "category_name", e.target.value)}>
                      {categories.map(c => <option key={c.name} value={c.name}>{c.label}</option>)}
                    </select>
                    <input style={{ ...S.input, flex: 1, fontSize: 12 }} placeholder="Notes (optional)" value={block.note} onChange={e => updateBlock(idx, "note", e.target.value)} />
                    <button onClick={() => removeBlock(idx)} style={{ ...S.btnDanger, padding: "6px 10px", fontSize: 13, background: "transparent" }}>{"\u2715"}</button>
                  </div>
                ))}
                <button onClick={addBlock} style={{ ...S.btnSecondary, marginTop: 8, width: "100%", textAlign: "center" }}>+ Add Block</button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ PROGRESSIONS TAB ═══════════════ */}
        {mainTab === "progressions" && (
          <div>
            <div className="progression-tabs" style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              {progressions.map(p => (
                <button key={p.name} onClick={() => setProgTab(p.name)} style={{
                  background: progTab === p.name ? `${p.color}22` : "transparent",
                  color: progTab === p.name ? p.color : COLORS.textDim,
                  border: `1px solid ${progTab === p.name ? p.color + "66" : COLORS.border}`,
                  borderRadius: 8, padding: "8px 16px",
                  fontSize: 12, fontWeight: progTab === p.name ? 700 : 400,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.15s",
                }}>{p.emoji} {p.label}</button>
              ))}
              <div style={{ flex: 1 }} />
              {progTab && (
                <button onClick={() => openEditProgression(progressions.find(p => p.name === progTab))} style={{ ...S.btnSecondary, fontSize: 11 }}>Edit</button>
              )}
              {progTab && (
                <button onClick={() => deleteProgression(progressions.find(p => p.name === progTab)?.id)} style={{ ...S.btnDanger, fontSize: 11, padding: "6px 12px" }}>Delete</button>
              )}
              <button onClick={openNewProgression} style={S.btn}>+ New Skill</button>
            </div>
            {progressions.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>{"\u{1F4C8}"}</div>
                <div style={{ color: COLORS.textDim, fontSize: 14 }}>No skill progressions yet.</div>
                <div style={{ color: COLORS.textFaint, fontSize: 12, marginTop: 4 }}>Click "+ New Skill" to start tracking a skill progression.</div>
              </div>
            ) : (
              <ProgressionTab progression={progressions.find(p => p.name === progTab)} />
            )}
          </div>
        )}

        {/* ═══════════════ LOG PROGRESS TAB ═══════════════ */}
        {mainTab === "log" && (
          <div>
            {/* Stats bar */}
            <div className="stats-bar" style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ ...S.card, flex: 1, minWidth: 140, textAlign: "center" }}>
                <div style={{ color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>This Week</div>
                <div style={{ color: COLORS.accent, fontSize: 28, fontWeight: 800, fontFamily: "'IBM Plex Mono', monospace" }}>{weekTotal.toFixed(1)}<span style={{ fontSize: 14, color: COLORS.textDim }}>h</span></div>
              </div>
              {logsByCategory.slice(0, 4).map(([cat, hours]) => {
                const meta = typeMeta[cat] || { color: "#555", label: cat };
                return (
                  <div key={cat} style={{ ...S.card, flex: 1, minWidth: 120, borderLeft: `3px solid ${meta.color}` }}>
                    <div style={{ color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{meta.label}</div>
                    <div style={{ color: meta.color, fontSize: 22, fontWeight: 800, fontFamily: "'IBM Plex Mono', monospace" }}>{hours.toFixed(1)}<span style={{ fontSize: 12, color: COLORS.textDim }}>h</span></div>
                  </div>
                );
              })}
            </div>

            {/* Log form */}
            <div style={{ ...S.card, marginBottom: 24 }}>
              <div style={S.sectionHeader}>Log Hours</div>
              <form onSubmit={handleLog} className="log-form" style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div>
                  <label style={S.label}>Category</label>
                  <select style={{ ...S.select, width: 160 }} value={logCat} onChange={e => setLogCat(e.target.value)} required>
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.name} value={c.name}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Hours</label>
                  <input style={{ ...S.input, width: 80 }} type="number" step="0.25" min="0.25" max="24" value={logHours} onChange={e => setLogHours(e.target.value)} placeholder="1.5" required />
                </div>
                <div>
                  <label style={S.label}>Date</label>
                  <input style={{ ...S.input, width: 150 }} type="date" value={logDate} onChange={e => setLogDate(e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={S.label}>Note</label>
                  <input style={{ ...S.input, width: "100%" }} value={logNote} onChange={e => setLogNote(e.target.value)} placeholder="What did you work on?" />
                </div>
                <button type="submit" style={S.btn}>Log</button>
              </form>
            </div>

            {/* Log history */}
            {progressLogs.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>{"\u270F\uFE0F"}</div>
                <div style={{ color: COLORS.textDim, fontSize: 14 }}>No progress logged this week.</div>
              </div>
            ) : (
              progressLogs.map((log, i) => {
                const meta = typeMeta[log.category_name] || { color: "#555", label: log.category_name };
                return (
                  <div key={log.id || i} className="progress-log-row" style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", marginBottom: 4,
                    background: COLORS.surface, borderRadius: 8,
                    borderLeft: `3px solid ${meta.color}`,
                    transition: "background 0.1s",
                  }}>
                    <span style={{ color: COLORS.textFaint, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, minWidth: 80 }}>{log.date}</span>
                    <Tag color={meta.color} label={meta.label} />
                    <span style={{ color: COLORS.accent, fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, fontWeight: 700, minWidth: 44 }}>{log.hours}h</span>
                    {log.note && <span style={{ color: COLORS.textDim, fontSize: 12, flex: 1 }}>{log.note}</span>}
                    <button onClick={async () => {
                      await api.progress.remove(log.id);
                      setProgressLogs(progressLogs.filter(l => l.id !== log.id));
                    }} style={{ background: "none", border: "none", color: COLORS.textFaint, cursor: "pointer", fontSize: 16, padding: 4, opacity: 0.5 }}>{"\u2715"}</button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ═══════════════ BUDGET TAB ═══════════════ */}
        {mainTab === "budget" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ color: COLORS.textDim, fontSize: 13, lineHeight: 1.7 }}>
                168 hours in a week. Plan where they all go.
              </div>
              <button onClick={openBudgetEditor} style={S.btn}>{budgetItems.length > 0 ? "Edit Budget" : "Set Up Budget"}</button>
            </div>
            {budgetItems.length > 0 ? (
              <>
                <BudgetBar items={budgetItems} />
                <div style={{ ...S.card, marginTop: 20 }}>
                  <div style={S.sectionHeader}>Breakdown</div>
                  <div className="budget-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                    {budgetItems.map((b, i) => (
                      <div key={i} style={{
                        padding: "14px", borderRadius: 8,
                        background: b.color + "11", borderLeft: `3px solid ${b.color}`,
                      }}>
                        <div style={{ color: COLORS.textDim, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{b.label}</div>
                        <div style={{ color: b.color, fontSize: 22, fontWeight: 800, fontFamily: "'IBM Plex Mono', monospace", marginTop: 4 }}>
                          {b.hours}<span style={{ fontSize: 12, color: COLORS.textDim }}>h/wk</span>
                        </div>
                        <div style={{ color: COLORS.textFaint, fontSize: 10, marginTop: 2 }}>{(b.hours / 168 * 100).toFixed(1)}% of week</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, textAlign: "center", color: COLORS.textFaint, fontSize: 12 }}>
                    Total: {budgetItems.reduce((s, b) => s + b.hours, 0).toFixed(1)}h / 168h
                    ({(168 - budgetItems.reduce((s, b) => s + b.hours, 0)).toFixed(1)}h unallocated)
                  </div>
                </div>
              </>
            ) : (
              <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>{"\u23F1\uFE0F"}</div>
                <div style={{ color: COLORS.textDim, fontSize: 14 }}>No time budget configured.</div>
                <div style={{ color: COLORS.textFaint, fontSize: 12, marginTop: 4 }}>Set one up to visualize how you spend your 168 hours per week.</div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ AI COACH TAB ═══════════════ */}
        {mainTab === "ai" && (
          <div>
            <div style={{ ...S.card, marginBottom: 20 }}>
              <div style={S.sectionHeader}>AI Analysis</div>
              {!user?.ai_provider ? (
                <div style={{ color: COLORS.textDim, fontSize: 13, lineHeight: 1.6 }}>
                  Configure your AI provider in{" "}
                  <button onClick={() => navigate("/profile")} style={{ background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontFamily: "inherit", fontSize: 13, textDecoration: "underline" }}>Profile Settings</button>
                  {" "}to use AI analysis. Supports OpenRouter (recommended), or any OpenAI-compatible API.
                </div>
              ) : (
                <>
                  <textarea
                    style={{ ...S.input, width: "100%", minHeight: 80, resize: "vertical", marginBottom: 12, boxSizing: "border-box" }}
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Ask about your schedule, progress, or goals... (leave blank for general analysis)"
                  />
                  <button onClick={handleAi} disabled={aiLoading} style={{ ...S.btn, opacity: aiLoading ? 0.7 : 1 }}>
                    {aiLoading ? "Analyzing..." : "Analyze My Progress"}
                  </button>
                </>
              )}
            </div>
            {aiResult && (
              <div style={{ ...S.card, background: COLORS.surface2, whiteSpace: "pre-wrap", color: COLORS.textDim, fontSize: 13, lineHeight: 1.8 }}>
                {aiResult}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Category Manager - accessible from schedule edit */}
      {showCategoryModal && (
        <Modal title="Manage Activities" onClose={() => setShowCategoryModal(false)} width={480}>
          <div style={{ marginBottom: 20 }}>
            {categories.map(c => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: c.color }} />
                <span style={{ flex: 1, color: COLORS.text, fontSize: 13 }}>{c.label}</span>
                <span style={{ color: COLORS.textFaint, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>{c.name}</span>
                <button onClick={() => deleteCategory(c.name)} style={{ background: "none", border: "none", color: COLORS.textFaint, cursor: "pointer", fontSize: 14 }}>{"\u2715"}</button>
              </div>
            ))}
          </div>
          <div style={S.sectionHeader}>Add Activity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={S.label}>Name</label>
              <input style={{ ...S.input, width: "100%" }} value={catLabel} onChange={e => { setCatLabel(e.target.value); setCatName(e.target.value); }} placeholder="e.g. Guitar Practice" />
            </div>
            <div>
              <label style={S.label}>Color</label>
              <ColorPicker value={catColor} onChange={setCatColor} />
            </div>
            <button onClick={saveCategory} style={S.btn}>Add Activity</button>
          </div>
        </Modal>
      )}

      {/* Progression Editor */}
      {showProgressionModal && (
        <Modal title={editingProg ? "Edit Progression" : "New Skill Progression"} onClose={() => setShowProgressionModal(false)} width={600}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Skill Name</label>
                <input style={{ ...S.input, width: "100%" }} value={progForm.label} onChange={e => { setProgForm({ ...progForm, label: e.target.value, name: e.target.value }); }} placeholder="e.g. Rust, Piano, Chess" />
              </div>
              <div style={{ width: 60 }}>
                <label style={S.label}>Emoji</label>
                <input style={{ ...S.input, width: "100%", textAlign: "center" }} value={progForm.emoji} onChange={e => setProgForm({ ...progForm, emoji: e.target.value })} placeholder="\u{1F9E0}" />
              </div>
            </div>
            <div>
              <label style={S.label}>Color</label>
              <ColorPicker value={progForm.color} onChange={c => setProgForm({ ...progForm, color: c })} />
            </div>
            <div>
              <label style={S.label}>Current Level</label>
              <input style={{ ...S.input, width: "100%" }} value={progForm.current_level} onChange={e => setProgForm({ ...progForm, current_level: e.target.value })} placeholder="Describe your current level..." />
            </div>

            <div style={S.sectionHeader}>Phases</div>
            {progForm.phases.map((ph, idx) => (
              <div key={idx} style={{ padding: 14, background: COLORS.surface2, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ color: progForm.color, fontWeight: 700, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>Phase {idx + 1}</span>
                  <button onClick={() => removePhase(idx)} style={{ background: "none", border: "none", color: "#e55", cursor: "pointer", fontSize: 12 }}>{"\u2715"} Remove</button>
                </div>
                <div className="phase-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div><label style={S.label}>Name</label><input style={{ ...S.input, width: "100%" }} value={ph.phase_name} onChange={e => updatePhase(idx, "phase_name", e.target.value)} placeholder="Phase 1" /></div>
                  <div><label style={S.label}>Period</label><input style={{ ...S.input, width: "100%" }} value={ph.period} onChange={e => updatePhase(idx, "period", e.target.value)} placeholder="Now - Aug 2026" /></div>
                  <div><label style={S.label}>Hours/Week</label><input style={{ ...S.input, width: "100%" }} value={ph.hours_per_week} onChange={e => updatePhase(idx, "hours_per_week", e.target.value)} placeholder="90 min/wk" /></div>
                </div>
                <div><label style={S.label}>Goal</label><input style={{ ...S.input, width: "100%", marginBottom: 8 }} value={ph.goal} onChange={e => updatePhase(idx, "goal", e.target.value)} placeholder="What you want to achieve" /></div>
                <div><label style={S.label}>Topics (one per line)</label><textarea style={{ ...S.input, width: "100%", minHeight: 50, resize: "vertical", marginBottom: 8, boxSizing: "border-box" }} value={(ph.topics || []).join("\n")} onChange={e => updatePhase(idx, "topics", e.target.value.split("\n"))} placeholder="Topic 1&#10;Topic 2" /></div>
                <div><label style={S.label}>Resources (one per line)</label><textarea style={{ ...S.input, width: "100%", minHeight: 40, resize: "vertical", marginBottom: 8, boxSizing: "border-box" }} value={(ph.resources || []).join("\n")} onChange={e => updatePhase(idx, "resources", e.target.value.split("\n"))} placeholder="Book, course, URL..." /></div>
                <div><label style={S.label}>Milestone</label><input style={{ ...S.input, width: "100%" }} value={ph.milestone} onChange={e => updatePhase(idx, "milestone", e.target.value)} placeholder="How you know you're done" /></div>
              </div>
            ))}
            <button onClick={addPhase} style={{ ...S.btnSecondary, textAlign: "center" }}>+ Add Phase</button>
            <button onClick={saveProgression} style={{ ...S.btn, textAlign: "center", marginTop: 8 }}>{editingProg ? "Save Changes" : "Create Progression"}</button>
          </div>
        </Modal>
      )}

      {/* Budget Editor */}
      {showBudgetModal && (
        <Modal title="Edit Time Budget" onClose={() => setShowBudgetModal(false)} width={480}>
          <div style={{ color: COLORS.textDim, fontSize: 12, marginBottom: 16 }}>
            168 hours per week. Allocated: {budgetForm.reduce((s, b) => s + (parseFloat(b.hours) || 0), 0).toFixed(1)}h
          </div>
          {budgetForm.map((item, idx) => (
            <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: item.color, flexShrink: 0 }} />
              <input style={{ ...S.input, flex: 1 }} value={item.label} onChange={e => {
                const copy = [...budgetForm]; copy[idx] = { ...copy[idx], label: e.target.value }; setBudgetForm(copy);
              }} placeholder="Category name" />
              <input style={{ ...S.input, width: 70, textAlign: "center" }} type="number" step="0.5" min="0" value={item.hours} onChange={e => {
                const copy = [...budgetForm]; copy[idx] = { ...copy[idx], hours: parseFloat(e.target.value) || 0 }; setBudgetForm(copy);
              }} />
              <span style={{ color: COLORS.textFaint, fontSize: 11 }}>h</span>
              <input style={{ ...S.input, width: 40, padding: 2, height: 28 }} type="color" value={item.color} onChange={e => {
                const copy = [...budgetForm]; copy[idx] = { ...copy[idx], color: e.target.value }; setBudgetForm(copy);
              }} />
              <button onClick={() => setBudgetForm(budgetForm.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: COLORS.textFaint, cursor: "pointer" }}>{"\u2715"}</button>
            </div>
          ))}
          <button onClick={() => setBudgetForm([...budgetForm, { label: "", hours: 0, color: "#888888" }])} style={{ ...S.btnSecondary, width: "100%", textAlign: "center", marginTop: 8, marginBottom: 12 }}>+ Add Category</button>
          <button onClick={saveBudget} style={{ ...S.btn, width: "100%", textAlign: "center" }}>Save Budget</button>
        </Modal>
      )}

      {/* Auto-Schedule Generator */}
      {showAutoSchedule && (
        <Modal title="Auto-Generate Schedule" onClose={() => setShowAutoSchedule(false)} width={560}>
          <div style={{ color: COLORS.textDim, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
            Select which activities to include and your daily routine. We'll create a balanced weekly schedule for you.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            <div><label style={S.label}>Wake Up</label><input style={{ ...S.input, width: "100%" }} type="time" value={autoWake} onChange={e => setAutoWake(e.target.value)} /></div>
            <div><label style={S.label}>Bedtime</label><input style={{ ...S.input, width: "100%" }} type="time" value={autoSleep} onChange={e => setAutoSleep(e.target.value)} /></div>
            <div><label style={S.label}>Work Start</label><input style={{ ...S.input, width: "100%" }} type="time" value={autoWorkStart} onChange={e => setAutoWorkStart(e.target.value)} /></div>
            <div><label style={S.label}>Work End</label><input style={{ ...S.input, width: "100%" }} type="time" value={autoWorkEnd} onChange={e => setAutoWorkEnd(e.target.value)} /></div>
          </div>

          <div style={S.sectionHeader}>Activities to Include</div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
            <button onClick={() => setShowCategoryModal(true)} style={{ ...S.btnSecondary, fontSize: 11, padding: "4px 10px" }}>+ Add New Activity</button>
          </div>
          {autoActivities.map((act, idx) => (
            <div key={act.name} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              background: act.enabled ? `${act.color}11` : COLORS.surface2,
              borderRadius: 8, marginBottom: 4,
              border: `1px solid ${act.enabled ? act.color + "44" : "transparent"}`,
              cursor: "pointer", transition: "all 0.15s",
            }} onClick={() => {
              const copy = [...autoActivities]; copy[idx] = { ...copy[idx], enabled: !copy[idx].enabled }; setAutoActivities(copy);
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4,
                border: `2px solid ${act.enabled ? act.color : COLORS.textFaint}`,
                background: act.enabled ? act.color : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 12, fontWeight: 800,
                transition: "all 0.15s",
              }}>{act.enabled ? "\u2713" : ""}</div>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: act.color }} />
              <span style={{ flex: 1, color: act.enabled ? COLORS.text : COLORS.textDim, fontSize: 13 }}>{act.label}</span>
              {act.enabled && (
                <select style={{ ...S.select, width: 100, padding: "4px 8px", fontSize: 11 }} value={act.preferred_time} onClick={e => e.stopPropagation()} onChange={e => {
                  const copy = [...autoActivities]; copy[idx] = { ...copy[idx], preferred_time: e.target.value }; setAutoActivities(copy);
                }}>
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                  <option value="any">Flexible</option>
                </select>
              )}
            </div>
          ))}
          <div style={{ color: "#e8c54788", fontSize: 11, marginTop: 12, marginBottom: 16 }}>
            This will replace your entire current schedule for all 7 days.
          </div>
          <button onClick={generateAutoSchedule} style={{ ...S.btn, width: "100%", textAlign: "center" }}>Generate Schedule</button>
        </Modal>
      )}
    </div>
  );
}
