"use client";

import { PanelCard, SessionRow, ghostBtnStyle } from "@/components/dashboard/DashboardWidgets";

export default function SessionHistoryPanel({
  trainingSessions,
  showAllSessions,
  onToggleShowAll,
  t,
  router,
  locale,
}) {
  const visibleSessions = showAllSessions ? trainingSessions : trainingSessions.slice(0, 5);

  return (
    <PanelCard
      label={t("dashboardTrainingHistory")}
      accent="rgba(255,255,255,0.22)"
      tag={`${trainingSessions.length} TOTAL`}
    >
      {trainingSessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🥊</div>
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 900, color: "#fff" }}>
            {t("dashboardNoSessions")}
          </p>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
            {locale === "mn"
              ? "60 секунд бэлтгэл хийгээд AI шинжилгээ аваарай."
              : locale === "ko"
              ? "60초 훈련으로 AI 분석을 받아보세요."
              : "Train for 60 seconds and get your first AI analysis."}
          </p>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/train?autostart=1`)}
            style={{
              padding: "10px 24px", borderRadius: 10,
              background: "linear-gradient(135deg, #d4192a, #a01020)",
              color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer",
              border: "none", letterSpacing: "0.08em",
              boxShadow: "0 4px 16px rgba(212,25,42,0.35)",
            }}
          >
            {locale === "mn" ? "🥊 Эхний хичээл →" : locale === "ko" ? "🥊 첫 세션 시작 →" : "🥊 Start First Session →"}
          </button>
        </div>
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
