"use client";

// Progress you read at a glance instead of in a sentence: a score dial and the week as dots.
// Pure SVG / CSS, no library. Values are clamped; a missing value draws an empty track and "—".
import { BRAND } from "@/components/ui/brand";

const clamp01 = (x) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);

/**
 * A half-circle dial: `value` of `max`, the number under the arc with its scale ("7.2 /10").
 * One shape for every score on a screen, so the numbers can be compared.
 */
export function ScoreDial({ value, max = 10, width = 112, stroke = 10, color = BRAND.text, label }) {
  const r = (width - stroke) / 2;
  const cy = r + stroke / 2;
  const has = Number.isFinite(value);
  const f = has ? clamp01(value / max) : 0;
  const arc = Math.PI * r;
  const d = `M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${width - stroke / 2} ${cy}`;
  const text = has ? Number(value).toFixed(1) : "—";
  return (
    <div style={{ position: "relative", width, height: cy + 6 }} role="img" aria-label={`${label || ""} ${text}${has ? ` / ${max}` : ""}`.trim()}>
      <svg width={width} height={cy + 6} aria-hidden="true">
        <path d={d} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={stroke} strokeLinecap="round" />
        {has && <path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arc * f} ${arc}`} />}
      </svg>
      <span aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, textAlign: "center", lineHeight: 1, color: BRAND.text }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: Math.round(width * 0.27) }}>{text}</span>
        {has && <span style={{ fontSize: Math.max(13, Math.round(width * 0.11)), fontWeight: 700, color: "rgba(255,255,255,0.6)" }}> /{max}</span>}
      </span>
    </div>
  );
}

/**
 * The week, Monday first. Trained days are filled; today has a white ring; a missed past day is
 * a hollow circle; days still to come are faint dashes — "skipped" and "not yet" never look alike.
 * days: [{ trained, past, today }] ×7
 */
export function WeekDots({ days = [], labels = [], color = BRAND.red }) {
  const done = days.filter((d) => d?.trained).length;
  return (
    <div style={{ display: "flex", gap: 6 }} role="img" aria-label={`${done}`}>
      {Array.from({ length: 7 }, (_, i) => {
        const d = days[i] || {};
        const base = { width: "100%", maxWidth: 32, aspectRatio: "1", borderRadius: "50%", display: "grid", placeItems: "center", boxSizing: "border-box" };
        const dot = d.trained
          ? { ...base, background: color, border: d.today ? "2px solid #fff" : "2px solid transparent", boxShadow: `0 4px 14px ${color}66` }
          : d.today
            ? { ...base, background: "rgba(255,255,255,0.06)", border: "2px solid #fff" }
            : d.past
              ? { ...base, background: "transparent", border: "2px solid rgba(255,255,255,0.28)" }
              : { ...base, background: "transparent", border: "2px dashed rgba(255,255,255,0.14)" };
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span data-day={d.trained ? "trained" : d.today ? "today" : d.past ? "missed" : "ahead"} style={dot}>
              {d.trained && (
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              )}
            </span>
            <span aria-hidden="true" style={{ fontSize: 12.5, fontWeight: d.today ? 800 : 600, color: d.today ? BRAND.text : "rgba(255,255,255,0.7)" }}>{labels[i] || ""}</span>
          </div>
        );
      })}
    </div>
  );
}
