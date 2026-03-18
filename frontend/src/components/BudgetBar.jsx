import { COLORS } from "../theme";

export default function BudgetBar({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div style={{ display: "flex", height: 28, borderRadius: 6, overflow: "hidden", marginBottom: 12, gap: 1 }}>
        {items.map((b, i) => (
          <div key={i} title={`${b.label}: ${b.hours}h`} style={{ flex: b.hours, background: b.color, transition: "flex 0.3s" }} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
        {items.map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: b.color }} />
            <span style={{ color: COLORS.textDim, fontSize: 11 }}>{b.label}</span>
            <span style={{ color: COLORS.textFaint, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>{b.hours}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}
