"use client";

const STREAK_MILESTONES = [1, 3, 7, 14, 30];

const COPY = {
  missionDone:    { mn: "Өнөөдрийн даалгавар дууссан", ko: "오늘 미션 완료",   en: "Today's mission done" },
  missionActive:  { mn: "Өнөөдрийн даалгавар",         ko: "오늘의 미션",      en: "Daily mission" },
  doneCopy:       { mn: "Гайхалтай! Маргааш streak-ийг үргэлжлүүл.", ko: "훌륭해요! 내일도 스트릭을 이어가세요.", en: "Great work! Keep the streak alive tomorrow." },
  activeCopy:     { mn: "Дасгал хийж +50 XP ав",       ko: "훈련하고 +50 XP 획득", en: "Train once today for +50 XP" },
  streakDay:      { mn: "өдөр",                         ko: "일",              en: "day" },
  bestStreak:     {
    mn: (n) => `Хамгийн дээд: ${n}`,
    ko: (n) => `최고: ${n}일`,
    en: (n) => `Best: ${n}d`,
  },
};

export default function MissionStreakBeltCard({
  locale,
  t,
  effectiveMissionDone,
  userStreak,
  bestDailyStreak,
  belt,
  beltPct,
  nextBelt,
}) {
  const done = effectiveMissionDone;
  return (
    <div style={{
      borderRadius: 22, overflow: "hidden",
      border: done ? "1px solid rgba(52,211,153,0.28)" : "1px solid rgba(255,255,255,0.10)",
      background: done ? "rgba(52,211,153,0.06)" : "rgba(255,255,255,0.04)",
    }}>
      {/* Mission row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
        <span style={{ width: 42, height: 42, borderRadius: 14, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 20, background: done ? "rgba(52,211,153,0.14)" : "rgba(245,196,81,0.12)" }} aria-hidden="true">{done ? "✅" : "🥊"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: done ? "#34D399" : "#F5C451" }}>
            {done ? (COPY.missionDone[locale] || COPY.missionDone.en) : (COPY.missionActive[locale] || COPY.missionActive.en)}
          </div>
          <div style={{ marginTop: 2, fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.35 }}>
            {done ? (COPY.doneCopy[locale] || COPY.doneCopy.en) : (COPY.activeCopy[locale] || COPY.activeCopy.en)}
          </div>
        </div>
        {/* Streak */}
        <div style={{
          flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 52,
          padding: "6px 10px", borderRadius: 14,
          background: userStreak >= 3 ? "rgba(251,146,60,0.14)" : "rgba(255,255,255,0.05)",
          border: userStreak >= 3 ? "1px solid rgba(251,146,60,0.35)" : "1px solid rgba(255,255,255,0.08)",
        }}>
          <span style={{ fontSize: 15 }} aria-hidden="true">🔥</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 1, color: userStreak > 0 ? "#FB923C" : "rgba(255,255,255,0.38)" }}>{userStreak}</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
            {COPY.streakDay[locale] || COPY.streakDay.en}
          </span>
        </div>
      </div>

      {/* Rank progress (same ladder as /progress) */}
      <div style={{ padding: "0 16px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: belt.color }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: belt.color }} aria-hidden="true" />
            {t(belt.key)}
          </span>
          {nextBelt && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{beltPct}% → {t(nextBelt.key)}</span>}
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <div style={{ width: `${beltPct}%`, height: "100%", background: belt.gradient, transition: "width 0.6s ease" }} />
        </div>
      </div>

      {/* Streak milestones */}
      {userStreak > 0 && (
        <div style={{ padding: "0 16px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          {STREAK_MILESTONES.map((m) => (
            <div key={m} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: userStreak >= m ? "#FB923C" : "rgba(255,255,255,0.12)",
                boxShadow: userStreak >= m ? "0 0 6px rgba(251,146,60,0.6)" : "none",
              }} />
              <span style={{ fontSize: 11, color: userStreak >= m ? "#FB923C" : "rgba(255,255,255,0.35)" }}>{m}</span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          {bestDailyStreak > 0 && (
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>
              {(COPY.bestStreak[locale] || COPY.bestStreak.en)(bestDailyStreak)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
