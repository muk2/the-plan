import { useState, useRef } from "react";
import { COLORS } from "../theme";
import { parseFlexibleTime } from "../utils/timeParser";

function formatTimeDigits(raw) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ":" + digits.slice(2, 4);
}

export default function TimeRangeInput({ value, onChange, style = {} }) {
  const [startRaw, setStartRaw] = useState(() => {
    if (!value) return "";
    const parts = value.split(/\s*[-\u2013]\s*/);
    return parts[0] || "";
  });
  const [endRaw, setEndRaw] = useState(() => {
    if (!value) return "";
    const parts = value.split(/\s*[-\u2013]\s*/);
    return parts[1] || "";
  });
  const endRef = useRef(null);

  const emit = (s, e) => {
    const start = parseFlexibleTime(s) || formatTimeDigits(s);
    const end = parseFlexibleTime(e) || formatTimeDigits(e);
    if (start && end) {
      onChange(`${start}\u2013${end}`);
    } else if (start) {
      onChange(start);
    } else {
      onChange("");
    }
  };

  const handleStart = (e) => {
    let raw = e.target.value.replace(/[^\d:apmAPM ]/g, "");
    const digits = raw.replace(/\D/g, "");
    if (digits.length > 4) return;
    setStartRaw(raw);
    emit(raw, endRaw);
    if (digits.length >= 4 && endRef.current && !/[apmAPM]/.test(raw)) {
      endRef.current.focus();
    }
  };

  const handleEnd = (e) => {
    let raw = e.target.value.replace(/[^\d:apmAPM ]/g, "");
    const digits = raw.replace(/\D/g, "");
    if (digits.length > 4) return;
    setEndRaw(raw);
    emit(startRaw, raw);
  };

  const handleBlur = (which) => {
    const raw = which === "start" ? startRaw : endRaw;
    const parsed = parseFlexibleTime(raw);
    if (parsed) {
      if (which === "start") {
        setStartRaw(parsed);
        emit(parsed, endRaw);
      } else {
        setEndRaw(parsed);
        emit(startRaw, parsed);
      }
    }
  };

  const base = {
    padding: "8px 10px",
    background: COLORS.surface2,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    color: COLORS.text,
    fontSize: 13,
    fontFamily: "'IBM Plex Mono', monospace",
    outline: "none",
    width: 64,
    textAlign: "center",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, ...style }}>
      <input
        style={base}
        value={startRaw}
        onChange={handleStart}
        placeholder="6pm"
        maxLength={7}
        onFocus={e => e.target.style.borderColor = COLORS.accent}
        onBlur={e => { e.target.style.borderColor = COLORS.border; handleBlur("start"); }}
      />
      <span style={{ color: COLORS.textFaint, fontSize: 12, fontWeight: 600 }}>{"\u2013"}</span>
      <input
        ref={endRef}
        style={base}
        value={endRaw}
        onChange={handleEnd}
        placeholder="7:30"
        maxLength={7}
        onFocus={e => e.target.style.borderColor = COLORS.accent}
        onBlur={e => { e.target.style.borderColor = COLORS.border; handleBlur("end"); }}
      />
    </div>
  );
}
