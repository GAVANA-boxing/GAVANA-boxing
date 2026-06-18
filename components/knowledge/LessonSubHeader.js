"use client";

/**
 * Props:
 *   label    – string to display
 *   acc      – accent color string
 *   asSpan   – render as inline <span> instead of <div> (default false)
 */
export default function LessonSubHeader({ label, acc, asSpan = false }) {
  const style = {
    fontSize: 7.5, fontWeight: 900, letterSpacing: 1.5,
    color: acc || "rgba(255,255,255,0.32)",
    textTransform: "uppercase", marginBottom: 8,
  };
  return asSpan
    ? <span style={{ ...style, display: "block" }}>{label}</span>
    : <div style={style}>{label}</div>;
}
