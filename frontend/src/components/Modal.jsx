import { COLORS } from "../theme";

export default function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
        animation: "fadeIn 0.15s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: "28px",
          width,
          maxWidth: "92vw",
          maxHeight: "85vh",
          overflowY: "auto",
          animation: "slideUp 0.2s ease",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: COLORS.surface2, border: "none", borderRadius: 6,
              color: COLORS.textDim, cursor: "pointer", width: 32, height: 32,
              fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.target.style.background = COLORS.border}
            onMouseLeave={e => e.target.style.background = COLORS.surface2}
          >{"\u2715"}</button>
        </div>
        {children}
      </div>
    </div>
  );
}
