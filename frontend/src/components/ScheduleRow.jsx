import { useState } from "react";
import Tag from "./Tag";
import { COLORS } from "../theme";

export default function ScheduleRow({ item, typeMeta }) {
  const [open, setOpen] = useState(false);
  const meta = typeMeta[item.category_name] || typeMeta[item.type] || { color: "#555", label: item.category_name || item.type };
  return (
    <div
      onClick={() => item.note && setOpen(o => !o)}
      style={{
        borderLeft: `3px solid ${meta.color}`,
        background: open ? "#1e1e22" : "#16161a",
        marginBottom: 3,
        borderRadius: "0 6px 6px 0",
        cursor: item.note ? "pointer" : "default",
        transition: "background 0.15s",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px" }}>
        <span style={{ color: COLORS.textFaint, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, minWidth: 100 }}>{item.time_range || item.time}</span>
        <span style={{ color: COLORS.text, fontSize: 13, fontWeight: 500, flex: 1 }}>{item.label}</span>
        <Tag color={meta.color} label={meta.label} />
        {item.note && <span style={{ color: COLORS.textFaint, fontSize: 11 }}>{open ? "\u25B2" : "\u25BC"}</span>}
      </div>
      {open && item.note && (
        <div style={{ padding: "0 14px 10px 126px", color: COLORS.textDim, fontSize: 12, lineHeight: 1.6 }}>
          {item.note}
        </div>
      )}
    </div>
  );
}
