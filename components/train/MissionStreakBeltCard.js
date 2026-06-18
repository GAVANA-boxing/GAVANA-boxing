"use client";

const STREAK_MILESTONES = [1, 3, 7, 14, 30];

const COPY = {
  missionDone:    { mn: "ӨНӨӨДРИЙН ДААЛГАВАР ДУУССАН", ko: "오늘 미션 완료",   en: "TODAY'S MISSION DONE" },
  missionActive:  { mn: "ӨНӨӨДРИЙН ДААЛГАВАР",         ko: "오늘의 미션",      en: "DAILY MISSION" },
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
  return (
    <div style={{
      borderRadius: 14, overflow: "hidden",
      border: effectiveMissionDone ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(245,196,81,0.2)",
      background: effectiveMissionDone ? "rgba(52,211,153,0.04)" : "rgba(0,0,0,0.3)",
    }}>
      {/* Mission row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{effectiveMissionDone ? "✅" : "🥊"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.8, textTransform: "uppercase", color: effectiveMissionDone ? "#34D399" : "rgba(245,196,81,0.8)", marginBottom: 2 }}>
            {effectiveMissionDone ? (COPY.missionDone[locale] || COPY.missionDone.en) : (COPY.missionActive[locale] || COPY.missionActive.en)}
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.75)" }}>
            {effectiveMissionDone ? (COPY.doneCopy[locale] || COPY.doneCopy.en) : (COPY.activeCopy[locale] || COPY.activeCopy.en)}
          </div>
        </div>
        {/* Streak pill */}
        <div style={{
          flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center",
          padding: "6px 10px", borderRadius: 10,
          background: userStreak >= 7 ? "rgba(251,146,60,0.15)" : userStreak >= 3 ? "rgba(251,146,60,0.1)" : "rgba(255,255,255,0.05)",
          border: userStreak >= 3 ? "1px solid rgba(251,146,60,0.3)" : "1px solid rgba(255,255,255,0.08)",
        }}>
          <span style={{ fontSize: 16 }}>🔥</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: userStreak > 0 ? "#FB923C" : "rgba(255,255,255,0.3)", lineHeight: 1 }}>{userStreak}</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: 0.5, textTransform: "uppercase" }}>
            {COPY.streakDay[locale] || COPY.streakDay.en}
          </span>
        </div>
      </div>

      {/* Belt progress row */}
      <div style={{ padding: "0 14px 10px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12 }}>🥋</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: belt.color }}>{t(belt.key)}</span>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ width: `${beltPct}%`, height: "100%", background: belt.gradient, transition: "width 0.6s ease" }} />
        </div>
        <span style={{ fontSize: 9, fontWeight: 800, color: belt.color }}>{beltPct}%</span>
        {nextBelt && <span style={{ fontSize: 8, color: "rgba(255,255,255,0.22)" }}>→ {t(nextBelt.key)}</span>}
      </div>

      {/* Streak milestones */}
      {userStreak > 0 && (
        <div style={{ padding: "0 14px 10px", display: "flex", alignItems: "center", gap: 6 }}>
          {STREAK_MILESTONES.map((m) => (
            <div key={m} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: userStreak >= m ? "#FB923C" : "rgba(255,255,255,0.1)",
                boxShadow: userStreak >= m ? "0 0 6px rgba(251,146,60,0.6)" : "none",
              }} />
              <span style={{ fontSize: 7, fontWeight: 700, color: userStreak >= m ? "#FB923C" : "rgba(255,255,255,0.2)" }}>{m}</span>
            </div>
          ))}
          <div style={{ flex: 1, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, (userStreak / 30) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#FB923C,#F59E0B)", transition: "width 0.6s ease" }} />
          </div>
          {bestDailyStreak > 0 && (
            <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>
              {(COPY.bestStreak[locale] || COPY.bestStreak.en)(bestDailyStreak)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
