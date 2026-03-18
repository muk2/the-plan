export default function Tag({ color, label }) {
  return (
    <span style={{
      background: color + "22",
      color: color,
      border: `1px solid ${color}44`,
      borderRadius: 3,
      padding: "1px 7px",
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      fontFamily: "'IBM Plex Mono', monospace",
      whiteSpace: "nowrap",
    }}>{label}</span>
  );
}
