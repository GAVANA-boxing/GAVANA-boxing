"use client";

// Progress you read at a glance instead of in a sentence: a ring, a half-circle gauge, week dots.
// Pure SVG / CSS, no library. Values are clamped; a missing value draws an empty track and "—".
import { BRAND } from "@/components/ui/brand";

const clamp01 = (x) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);

/** A full ring: `value` of `max`, the number in the middle. */
export function RingGauge({ value, max = 10, size = 76, stroke = 8, color = BRAND.gold, label, format = (v) => v }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const has = Number.isFinite(value);
  const f = has ? clamp01(value / max) : 0;
  return (
    <div style={{ position: "relative", width: size, height: size }} role="img" aria-label={`${label || ""} ${has ? format(value) : "—"}`.trim()}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * f} ${c}`} />
      </svg>
      <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontSize: size * 0.3, lineHeight: 1, color: BRAND.text }}>
        {has ? format(value) : "—"}
      </span>
    </div>
  );
}

/** A half-circle gauge (speedometer): `value` of `max`, the number under the arc. */
export function ArcGauge({ value, max = 10, width = 96, stroke = 9, color = BRAND.red, label, format = (v) => v }) {
  const r = (width - stroke) / 2;
  const cx = width / 2, cy = r + stroke / 2;
  const has = Number.isFinite(value);
  const f = has ? clamp01(value / max) : 0;
  const arc = Math.PI * r;
  const d = `M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${width - stroke / 2} ${cy}`;
  return (
    <div style={{ position: "relative", width, height: cy + 4 }} role="img" aria-label={`${label || ""} ${has ? format(value) : "—"}`.trim()}>
      <svg width={width} height={cy + 4} aria-hidden="true">
        <path d={d} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} strokeLinecap="round" />
        <path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arc * f} ${arc}`} />
      </svg>
      <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, textAlign: "center", fontFamily: "var(--font-display)", fontSize: width * 0.26, lineHeight: 1, color: BRAND.text }}>
        {has ? format(value) : "—"}
      </span>
    </div>
  );
}

/** Seven days of the week: trained days filled, today outlined. */
export function WeekDots({ days = [], todayIndex = -1, labels = [], color = BRAND.red }) {
  return (
    <div style={{ display: "flex", gap: 6 }} role="img" aria-label={`${days.filter(Boolean).length}/7`}>
      {Array.from({ length: 7 }, (_, i) => {
        const done = Boolean(days[i]);
        const today = i === todayIndex;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span style={{ width: "100%", maxWidth: 30, aspectRatio: "1", borderRadius: "50%", display: "grid", placeItems: "center", background: done ? color : "rgba(255,255,255,0.07)", border: today && !done ? `2px solid ${color}` : "2px solid transparent", boxShadow: done ? `0 4px 14px ${color}55` : "none", color: "#fff", fontSize: 13, fontWeight: 800 }}>
              {done ? "✓" : ""}
            </span>
            <span aria-hidden="true" style={{ fontSize: 11.5, fontWeight: today ? 800 : 600, color: today ? BRAND.text : BRAND.faint }}>{labels[i] || ""}</span>
          </div>
        );
      })}
    </div>
  );
}
