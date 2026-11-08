"use client";

import { loc } from "@/lib/loc";

/**
 * One line of what the coach knows about the fighter: rounds + average score. (The movement-
 * identity label is English-only in lib/combatIdentity, so it isn't shown in the MN/KO UI.)
 * (No per-skill numbers here: "Power", "Accuracy" etc. are not measured by the camera, so
 * showing them as scores was misleading — owner feedback 2026-11-08.)
 *
 * Props:
 *   coachSnapshot  {{ totalSessions, avgScore }} | null
 *   locale         "mn" | "ko" | "en"
 */
export default function CoachMemoryPanel({ coachSnapshot, locale = "en" }) {
  if (!coachSnapshot) return null;
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const n = coachSnapshot.totalSessions || 0;
  const avg = Number(coachSnapshot.avgScore);

  return (
    <div style={{
      margin: "0 14px 8px",
      padding: "9px 12px",
      borderRadius: 11,
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
    }}>
      <span aria-hidden="true" style={{ fontSize: 14 }}>🧠</span>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
        {L(`${n} раунд`, `${n}라운드`, `${n} rounds`)}
        {Number.isFinite(avg) && n > 0 ? ` · ${L("дундаж", "평균", "avg")} ${avg.toFixed(1)}` : ""}
      </span>
    </div>
  );
}
