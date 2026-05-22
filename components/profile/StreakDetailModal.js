"use client";

import { GOLD, RADIUS, blackAlpha} from "@/lib/tokens";

const streakCardStyle = {
  borderRadius: 16,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "14px 16px",
  display: "grid",
  gap: 4,
  justifyItems: "center",
};
const streakCardLabel = { color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" };
const streakCardValue = { fontSize: 36, fontWeight: 1000, lineHeight: 1, fontFamily: "var(--font-display, 'Anton', sans-serif)" };
const streakCardUnit = { color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700 };
const streakRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const streakRowLabel = { color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 700 };
const streakRowValue = { color: "#fff", fontSize: 13, fontWeight: 900 };

export default function StreakDetailModal({ profile, trainingSessions, t, onClose }) {
  const challengeStreak = Number(profile?.challengeStreak) || 0;
  const trainingStreak = Number(profile?.streakCount) || 0;
  const lastChallengeDate = profile?.lastChallengeDate || "";
  const hasAnyStreak = challengeStreak > 0 || trainingStreak > 0;

  const lastTrainingMs = trainingSessions.length
    ? Math.max(...trainingSessions.map((s) => {
        if (!s.createdAt) return 0;
        if (s.createdAt.toMillis) return s.createdAt.toMillis();
        const d = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
        return d.getTime() || 0;
      }))
    : 0;

  const lastTrainingLabel = lastTrainingMs
    ? new Date(lastTrainingMs).toLocaleDateString()
    : lastChallengeDate || null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        background: blackAlpha(0.72),
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(100%, 400px)",
          borderRadius: 24,
          background: "linear-gradient(160deg, #111 0%, #0b0b0b 100%)",
          border: "1px solid rgba(251,146,60,0.28)",
          boxShadow: `0 32px 80px ${blackAlpha(0.6)}, 0 0 0 1px rgba(251,146,60,0.12)`,
          padding: "28px 24px 24px",
          display: "grid",
          gap: 20,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, color: "#FB923C", fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>🔥</p>
            <h2 style={{ margin: "4px 0 0", color: "#fff", fontSize: 22, fontWeight: 1000 }}>{t("streakModalTitle")}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 34, height: 34, color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ×
          </button>
        </div>

        {!hasAnyStreak ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
            {t("streakNoStreak")}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={streakCardStyle}>
              <span style={streakCardLabel}>{t("streakCurrentDays")}</span>
              <span style={{ ...streakCardValue, color: "#FB923C" }}>{challengeStreak}</span>
              <span style={streakCardUnit}>days</span>
            </div>
            <div style={streakCardStyle}>
              <span style={streakCardLabel}>{t("streakBestDays")}</span>
              <span style={{ ...streakCardValue, color: GOLD }}>{Math.max(challengeStreak, trainingStreak)}</span>
              <span style={streakCardUnit}>days</span>
            </div>
          </div>
        )}

        {hasAnyStreak && (
          <div style={{ display: "grid", gap: 10 }}>
            {lastTrainingLabel && (
              <div style={streakRowStyle}>
                <span style={streakRowLabel}>{t("streakLastTrain")}</span>
                <span style={streakRowValue}>{lastTrainingLabel}</span>
              </div>
            )}
            <div style={{ ...streakRowStyle }}>
              <span style={streakRowLabel}>{t("streakCurrentDays")}</span>
              <span style={streakRowValue}>{challengeStreak} {challengeStreak === 1 ? "day" : "days"}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700 }}>Streak progress</span>
                <span style={{ color: "#FB923C", fontSize: 11, fontWeight: 900 }}>{Math.min(100, Math.round((challengeStreak / 7) * 100))}%</span>
              </div>
              <div style={{ height: 6, borderRadius: RADIUS.full, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, Math.round((challengeStreak / 7) * 100))}%`, borderRadius: RADIUS.full, background: "linear-gradient(90deg, #EA580C, #FB923C)", transition: "width 500ms ease" }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
