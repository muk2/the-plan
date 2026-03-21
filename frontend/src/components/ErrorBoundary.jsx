import { Component } from "react";
import { COLORS } from "../theme";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          background: COLORS.bg, minHeight: "100vh",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'IBM Plex Sans', sans-serif", color: COLORS.text,
        }}>
          <div style={{
            padding: 40, background: COLORS.surface, borderRadius: 12,
            border: `1px solid ${COLORS.border}`, maxWidth: 440, textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 16, opacity: 0.5 }}>&#x26A0;&#xFE0F;</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>Something went wrong</h2>
            <p style={{ color: COLORS.textDim, fontSize: 13, lineHeight: 1.6, margin: "0 0 20px" }}>
              An unexpected error occurred. Try reloading the page.
            </p>
            <pre style={{
              background: COLORS.surface2, padding: 12, borderRadius: 6,
              fontSize: 11, color: "#e55", textAlign: "left",
              overflow: "auto", maxHeight: 100, marginBottom: 20,
            }}>
              {this.state.error?.message || "Unknown error"}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 24px", background: COLORS.accent, color: COLORS.bg,
                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
