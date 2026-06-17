"use client";

import { PanelCard, SessionRow, ghostBtnStyle } from "@/components/dashboard/DashboardWidgets";

export default function SessionHistoryPanel({
  trainingSessions,
  showAllSessions,
  onToggleShowAll,
  t,
}) {
  const visibleSessions = showAllSessions ? trainingSessions : trainingSessions.slice(0, 5);

  return (
    <PanelCard
      label={t("dashboardTrainingHistory")}
      accent="rgba(255,255,255,0.22)"
      tag={`${trainingSessions.length} TOTAL`}
    >
      {trainingSessions.length === 0 ? (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", margin: 0 }}>{t("dashboardNoSessions")}</p>
      ) : (
        <>
          {visibleSessions.map((s) => (
            <SessionRow key={s.id} session={s} t={t} />
          ))}
          {trainingSessions.length > 5 && (
            <button
              type="button"
              onClick={onToggleShowAll}
              style={{ ...ghostBtnStyle, marginTop: 10, width: "100%", flex: "unset" }}
            >
              {showAllSessions
                ? t("dashboardShowLess")
                : `${t("dashboardShowAll")} ${trainingSessions.length}`}
            </button>
          )}
        </>
      )}
    </PanelCard>
  );
}
