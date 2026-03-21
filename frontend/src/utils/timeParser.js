/**
 * Parse flexible time input into HH:MM 24h format.
 * Accepts: "6", "12", "630", "1200", "6a", "6am", "12p", "12pm", "6:30", "6:30pm", etc.
 */
export function parseFlexibleTime(raw) {
  if (!raw) return "";
  const trimmed = raw.trim().toLowerCase();

  // Detect am/pm suffix
  let isPM = false;
  let isAM = false;
  let cleaned = trimmed;
  if (/p\.?m?\.?$/.test(cleaned)) {
    isPM = true;
    cleaned = cleaned.replace(/\s*p\.?m?\.?$/, "");
  } else if (/a\.?m?\.?$/.test(cleaned)) {
    isAM = true;
    cleaned = cleaned.replace(/\s*a\.?m?\.?$/, "");
  }

  // If it already has a colon, parse directly
  if (cleaned.includes(":")) {
    const [hStr, mStr] = cleaned.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10) || 0;
    if (isNaN(h)) return "";
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    if (h > 23 || m > 59) return "";
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  // Digits only
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 0) return "";

  let h, m;
  if (digits.length <= 2) {
    // "6" -> 06:00, "12" -> 12:00
    h = parseInt(digits, 10);
    m = 0;
  } else if (digits.length === 3) {
    // "630" -> 6:30
    h = parseInt(digits[0], 10);
    m = parseInt(digits.slice(1), 10);
  } else {
    // "0630" or "1200" -> 06:30, 12:00
    h = parseInt(digits.slice(0, 2), 10);
    m = parseInt(digits.slice(2, 4), 10);
  }

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  if (h > 23 || m > 59) return "";

  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** Parse the start time from a time_range string into minutes for sorting */
export function parseStartMinutes(timeRange) {
  if (!timeRange) return Infinity;
  const start = timeRange.split(/\s*[-\u2013]\s*/)[0];
  const parsed = parseFlexibleTime(start);
  if (!parsed) return Infinity;
  const [h, m] = parsed.split(":").map(Number);
  return h * 60 + m;
}

/** Sort blocks by their start time */
export function sortBlocksByTime(blocks) {
  return [...blocks].sort((a, b) => parseStartMinutes(a.time_range) - parseStartMinutes(b.time_range));
}
