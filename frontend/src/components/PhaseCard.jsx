import { useState } from "react";
import Tag from "./Tag";
import { COLORS } from "../theme";

export default function PhaseCard({ phase, langColor }) {
  const [open, setOpen] = useState(false);
  const topics = typeof phase.topics === "string" ? JSON.parse(phase.topics || "[]") : (phase.topics || []);
  const resources = typeof phase.resources === "string" ? JSON.parse(phase.resources || "[]") : (phase.resources || []);

  return (
    <div style={{ border: `1px solid ${langColor}33`, borderRadius: 8, marginBottom: 12, overflow: "hidden" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(o => !o); } }}
        style={{
          background: `${langColor}18`,
          padding: "12px 16px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: langColor, fontWeight: 800, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}>{phase.phase_name || phase.name}</span>
          <span style={{ color: COLORS.textDim, fontSize: 12 }}>{phase.period}</span>
          <Tag color={langColor} label={phase.hours_per_week || phase.hrs} />
        </div>
        <span style={{ color: COLORS.textFaint, fontSize: 12 }}>{open ? "\u25B2" : "\u25BC"}</span>
      </div>
      {open && (
        <div style={{ padding: "16px", background: COLORS.surface2 }}>
          <div style={{ color: COLORS.text, fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
            <strong style={{ color: langColor }}>Goal:</strong> {phase.goal}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ color: COLORS.textDim, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>Topics</div>
              {topics.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: langColor, fontSize: 10, marginTop: 3 }}>{"\u25C6"}</span>
                  <span style={{ color: COLORS.textDim, fontSize: 12, lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ color: COLORS.textDim, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>Resources</div>
              {resources.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: COLORS.textDim, fontSize: 10, marginTop: 3 }}>{"\u2192"}</span>
                  <span style={{ color: COLORS.textDim, fontSize: 12, lineHeight: 1.5 }}>{r}</span>
                </div>
              ))}
              {phase.milestone && (
                <div style={{ marginTop: 12, padding: "10px", background: `${langColor}11`, borderRadius: 6, border: `1px solid ${langColor}33` }}>
                  <div style={{ color: COLORS.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontFamily: "'IBM Plex Mono', monospace" }}>Milestone</div>
                  <div style={{ color: langColor, fontSize: 12, lineHeight: 1.5 }}>{phase.milestone}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
