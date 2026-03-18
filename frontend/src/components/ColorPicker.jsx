import { COLORS } from "../theme";

const PRESET_COLORS = [
  "#ce422b", "#e8c547", "#f08800", "#2d7a3a", "#5a9a3a",
  "#002395", "#2d5fa0", "#00599c", "#7b3fa0", "#c60b1e",
  "#c4732a", "#2a7a8a", "#8a5a2a", "#e55", "#36a3d9",
  "#6b8e23", "#9370db", "#20b2aa", "#ff6347", "#778899",
];

export default function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 200 }}>
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{
            width: 24, height: 24,
            borderRadius: 4,
            background: c,
            border: value === c ? `2px solid ${COLORS.text}` : "2px solid transparent",
            cursor: "pointer",
            transition: "transform 0.1s",
            transform: value === c ? "scale(1.15)" : "scale(1)",
          }}
        />
      ))}
    </div>
  );
}
