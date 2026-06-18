"use client";

const COPY = {
  sessions: { mn: "тренинг", ko: "세션", en: "sessions" },
};

export default function ExperimentModeWidget({ locale, t, currentExperiment, experimentSessionCount, router }) {
  const exp     = currentExperiment;
  const expAcc  = exp.fighterAccent || "#F5C451";
  const startSec   = exp.startDate?.seconds || Math.floor(Date.now() / 1000);
  const daysElapsed = Math.min(7, Math.floor((Date.now() / 1000 - startSec) / 86400));
  const daysLeft    = Math.max(0, 7 - daysElapsed);
  const isDone      = daysLeft === 0;

  return (
    <div style={{
      borderRadius: 14,
      border: `1px solid ${isDone ? "rgba(52,211,153,0.3)" : `${expAcc}35`}`,
      background: isDone ? "rgba(52,211,153,0.05)" : `${expAcc}08`,
      padding: "13px 14px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚗️</span>
          <div>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: isDone ? "#34D399" : expAcc, textTransform: "uppercase", marginBottom: 2 }}>
              {isDone ? t("experimentDone") : t("experimentWeekly")}
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{exp.fighterName}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/fighters/${exp.fighterId}`)}
          style={{ background: `${expAcc}18`, border: `1px solid ${expAcc}40`, borderRadius: 8, padding: "5px 11px", color: expAcc, fontSize: 10.5, fontWeight: 900, cursor: "pointer", flexShrink: 0 }}
        >
          {t("experimentView")}
        </button>
      </div>

      {/* Days progress bar */}
      <div style={{ marginBottom: isDone ? 10 : 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>
            {daysElapsed}/{7} {t("experimentDaysOf")}
            {experimentSessionCount > 0 && (
              <span style={{ marginLeft: 8, color: "rgba(255,255,255,0.28)" }}>
                · {experimentSessionCount} {COPY.sessions[locale] || COPY.sessions.en}
              </span>
            )}
          </span>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: isDone ? "#34D399" : expAcc }}>
            {isDone
              ? `7 ${t("experimentDaysComplete")}`
              : `${daysLeft} ${t("experimentDaysLeft")}`}
          </span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, (daysElapsed / 7) * 100)}%`, height: "100%", background: isDone ? "#34D399" : expAcc, transition: "width 0.6s ease" }} />
        </div>
      </div>

      {isDone && (
        <button
          type="button"
          onClick={() => router.push(`/${locale}/fighter-profile`)}
          style={{ width: "100%", padding: "10px 0", borderRadius: 10, background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", color: "#34D399", fontSize: 12, fontWeight: 900, cursor: "pointer", marginTop: 2 }}
        >
          {t("experimentResultsCta")}
        </button>
      )}
    </div>
  );
}
