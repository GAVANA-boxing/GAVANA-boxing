"use client";

import ProgressRing from "@/components/programs/ProgressRing";
import s from "@/components/programs/programsStyles";
import { RED } from "@/lib/tokens";

const LEVEL_COLOR = { beginner: "#34D399", intermediate: "#F59E0B", advanced: RED };

/**
 * Props:
 *   program       object   — Firestore program doc
 *   enrollment    object   — { completedDays, streak, ... }
 *   todayKey      string   — local date key "YYYY-MM-DD"
 *   t             (key: string) => string   — translate fn
 *   onContinue    (program) => void
 *   onUnenroll    (programId) => void
 */
export default function EnrolledProgramCard({
  program,
  enrollment,
  todayKey,
  t,
  onContinue,
  onUnenroll,
}) {
  const completedDays = enrollment?.completedDays || [];
  const total = program.duration || program.durationDays || 30;
  const pct = Math.round((completedDays.length / total) * 100);
  const streak = enrollment?.streak || 0;
  const doneToday = completedDays.includes(todayKey);
  const color = program.color || LEVEL_COLOR[program.level] || RED;

  return (
    <div style={{ ...s.enrolledCard, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 18 }}>{program.emoji || "🥊"}</p>
          <p style={s.enrolledTitle}>{program.title}</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#888" }}>
            {completedDays.length}/{total} {t("programsDaysUnit")}
          </p>
          {streak > 0 && (
            <div style={s.streakBadge}>
              🔥 {streak} {t("programsDayStreak")}
            </div>
          )}
        </div>
        <ProgressRing pct={pct} size={56} color={color} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          style={{
            ...s.continueBtn,
            background: doneToday ? "#1a3d2e" : color,
            color: doneToday ? "#34D399" : "#fff",
            cursor: doneToday ? "default" : "pointer",
          }}
          onClick={() => { if (!doneToday) onContinue(program); }}
          disabled={doneToday}
        >
          {doneToday ? t("programsDoneToday") : t("programsContinue")}
        </button>
        <button type="button" style={s.unenrollBtn} onClick={() => onUnenroll(program.id)}>
          {t("programsLeave")}
        </button>
      </div>
    </div>
  );
}
