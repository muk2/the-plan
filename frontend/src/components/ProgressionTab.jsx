import PhaseCard from "./PhaseCard";
import { COLORS } from "../theme";

export default function ProgressionTab({ progression }) {
  if (!progression) return null;
  return (
    <div>
      <div style={{ marginBottom: 20, padding: "14px 16px", background: `${progression.color}15`, borderRadius: 8, border: `1px solid ${progression.color}33` }}>
        <div style={{ color: progression.color, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6 }}>Current Level</div>
        <div style={{ color: COLORS.textDim, fontSize: 13, lineHeight: 1.6 }}>{progression.current_level || "Not set"}</div>
      </div>
      {(progression.phases || []).map((p, i) => <PhaseCard key={i} phase={p} langColor={progression.color} />)}
    </div>
  );
}
