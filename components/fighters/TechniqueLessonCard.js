"use client";

import { RED, GOLD, RADIUS, redAlpha, goldAlpha, whiteAlpha } from "@/lib/tokens";

export default function TechniqueLessonCard({
  title,
  explanation,
  coachNotes,
  drillSteps = [],
  accent = RED,
  diagramLabel,
}) {
  return (
    <div style={{
      background: "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(0,0,0,0.2))",
      border: `1px solid ${accent}30`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: RADIUS.lg,
      overflow: "hidden",
      marginBottom: 12,
    }}>
      {/* Title bar */}
      <div style={{
        padding: "11px 14px",
        background: `${accent}0d`,
        borderBottom: `1px solid ${accent}20`,
        display: "flex",
        alignItems: "center",
        gap: 9,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: accent, flexShrink: 0,
          boxShadow: `0 0 8px ${accent}88`,
        }} />
        <span style={{
          fontSize: 11, fontWeight: 900,
          color: "#fff", letterSpacing: 1.2,
          textTransform: "uppercase",
        }}>
          {title}
        </span>
      </div>

      {/* Diagram placeholder */}
      <div style={{
        height: 96,
        background: `linear-gradient(135deg, ${accent}0a 0%, rgba(0,0,0,0.3) 100%)`,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Subtle grid overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, ${accent}07 0px, ${accent}07 1px, transparent 1px, transparent 22px), repeating-linear-gradient(90deg, ${accent}07 0px, ${accent}07 1px, transparent 1px, transparent 22px)`,
          pointerEvents: "none",
        }} />
        {/* Boxing ring diagram SVG */}
        <svg width="76" height="76" viewBox="0 0 80 80" fill="none" style={{ opacity: 0.3 }}>
          <rect x="4" y="4" width="72" height="72" rx="2" stroke={accent} strokeWidth="1.5" strokeDasharray="4 4"/>
          <circle cx="40" cy="40" r="20" stroke={accent} strokeWidth="1" strokeDasharray="3 3"/>
          <circle cx="40" cy="40" r="3" fill={accent}/>
          <line x1="20" y1="40" x2="60" y2="40" stroke={accent} strokeWidth="0.8" strokeDasharray="2 4"/>
          <line x1="40" y1="20" x2="40" y2="60" stroke={accent} strokeWidth="0.8" strokeDasharray="2 4"/>
        </svg>
        {diagramLabel && (
          <span style={{
            position: "absolute", bottom: 7,
            fontSize: 8, fontWeight: 800,
            color: accent, letterSpacing: 1.2, opacity: 0.75,
            textTransform: "uppercase",
          }}>
            {diagramLabel}
          </span>
        )}
      </div>

      {/* Explanation */}
      {explanation && (
        <div style={{
          padding: "12px 14px",
          borderBottom: (coachNotes || drillSteps.length > 0) ? "1px solid rgba(255,255,255,0.05)" : "none",
        }}>
          <p style={{ margin: 0, fontSize: 13, color: whiteAlpha(0.72), lineHeight: 1.6 }}>
            {explanation}
          </p>
        </div>
      )}

      {/* Coach notes */}
      {coachNotes && (
        <div style={{
          padding: "10px 14px",
          background: goldAlpha(0.05),
          borderBottom: drillSteps.length > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
          borderTop: `1px solid ${goldAlpha(0.15)}`,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <div>
              <div style={{ fontSize: 8, fontWeight: 900, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
                Coach Note
              </div>
              <p style={{ margin: 0, fontSize: 12, color: whiteAlpha(0.62), lineHeight: 1.5, fontStyle: "italic" }}>
                {coachNotes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Drill steps */}
      {drillSteps.length > 0 && (
        <div style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 8, fontWeight: 900, color: RED, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 9 }}>
            Drill Steps
          </div>
          {drillSteps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < drillSteps.length - 1 ? 8 : 0 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                background: redAlpha(0.18), border: `1px solid ${redAlpha(0.38)}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                fontSize: 9, fontWeight: 900, color: RED,
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 12, color: whiteAlpha(0.75), lineHeight: 1.5, paddingTop: 2 }}>
                {step}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
