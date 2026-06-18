"use client";

import { GOLD } from "@/lib/tokens";
import { StatPill } from "@/components/dashboard/DashboardWidgets";

export default function StatPillsGrid({
  dailyStreak,
  bestStreak,
  bestScoreFormatted,
  sessionCount,
  xp,
  t,
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 32 }}>
      <StatPill
        label={t("dashboardTrainingStreak")}
        value={`${dailyStreak}d`}
        sub={bestStreak > 0 ? `${t("dashboardBestStreak")} ${bestStreak}d` : undefined}
        color="#FB923C"
      />
      <StatPill
        label={t("dashboardBestScore")}
        value={bestScoreFormatted}
        sub="/10"
        color={GOLD}
      />
      <StatPill
        label={t("dashboardTotalSessions")}
        value={sessionCount}
        color="#fff"
      />
      <StatPill
        label={t("dashboardXP")}
        value={xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : xp}
        color={GOLD}
      />
    </div>
  );
}
