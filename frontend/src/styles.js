import { COLORS } from "./theme";

export const input = {
  padding: "10px 14px",
  background: COLORS.surface2,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  color: COLORS.text,
  fontSize: 13,
  fontFamily: "'IBM Plex Sans', sans-serif",
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};

export const btn = {
  padding: "10px 18px",
  background: COLORS.accent,
  color: COLORS.bg,
  border: "none",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "'IBM Plex Sans', sans-serif",
  transition: "opacity 0.15s, transform 0.1s",
};

export const btnSecondary = {
  ...btn,
  background: COLORS.surface2,
  color: COLORS.textDim,
  border: `1px solid ${COLORS.border}`,
};

export const btnDanger = {
  ...btn,
  background: "#e5555522",
  color: "#e55",
  border: `1px solid #e5555544`,
};

export const btnSmall = {
  ...btn,
  padding: "6px 12px",
  fontSize: 11,
};

export const label = {
  color: COLORS.textDim,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  display: "block",
  marginBottom: 6,
};

export const sectionHeader = {
  color: COLORS.accent,
  fontSize: 11,
  fontFamily: "'IBM Plex Mono', monospace",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: 14,
  fontWeight: 600,
};

export const card = {
  padding: "20px",
  background: COLORS.surface,
  borderRadius: 10,
  border: `1px solid ${COLORS.border}`,
};

export const select = {
  ...input,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 32,
};
