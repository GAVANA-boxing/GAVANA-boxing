"use client";

import { GOLD } from "@/lib/tokens";
import { calculateSessionXP } from "@/lib/xp";

function getTimestampMs(timestamp) {
  if (!timestamp) return 0;
  if (timestamp.toMillis) return timestamp.toMillis();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(1).replace(/\.0$/, "");
}

const sectionStyle = {
  width: "min(100%, 680px)",
  margin: "0 auto",
  padding: "16px 16px 32px",
  boxSizing: "border-box",
};

export default function TrainingProgressSection({
  feedbackScores,
  progressStats,
  streakCount,
  fighterRank,
  xp,
  nextRank,
  rankProgress,
  aiFeedbackHistory,
  isOwnProfile,
  locale,
  t,
  onGoToDashboard,
  onGoToReels,
}) {
  const scores = feedbackScores;
  const best = progressStats.bestScore ?? 0;
  const avg = progressStats.averageScore ?? 0;
  const fighterScore = scores.length
    ? Math.min(100, Math.round(best * 6 + avg * 4 + Math.min(5, streakCount * 0.3)))
    : 0;

  const recentAvg = scores.length >= 1
    ? scores.slice(0, Math.min(3, scores.length)).reduce((a, b) => a + b, 0) / Math.min(3, scores.length)
    : 0;
  const olderAvg = scores.length >= 4
    ? scores.slice(3, 6).reduce((a, b) => a + b, 0) / Math.min(3, scores.slice(3, 6).length)
    : 0;
  const delta = scores.length >= 4 ? recentAvg - olderAvg : 0;

  let insightText, insightColor;
  if (scores.length < 2) {
    insightText = t("profileInsightStart");
    insightColor = GOLD;
  } else if (delta >= 0.4) {
    insightText = t("profileInsightGrowing");
    insightColor = "#4ade80";
  } else if (delta <= -0.4) {
    insightText = t("profileInsightFocus");
    insightColor = "#FB923C";
  } else if (streakCount >= 3) {
    insightText = t("profileInsightConsistent");
    insightColor = "#4ade80";
  } else {
    insightText = t("profileInsightPush");
    insightColor = GOLD;
  }

  return (
    <section style={sectionStyle}>
      <div style={{
        position: "relative",
        background: "linear-gradient(145deg, #1c0202 0%, #0e0000 40%, #080808 100%)",
        border: "1px solid rgba(193,18,31,0.18)",
        borderLeft: "3px solid #C1121F",
        borderRadius: "3px 20px 20px 3px",
        padding: "20px 18px 18px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 10% 30%, rgba(193,18,31,0.18) 0%, transparent 55%)" }} />
        <div style={{ position: "relative" }}>
          <p style={{ margin: "0 0 16px", fontSize: 9, fontWeight: 900, color: "rgba(193,18,31,0.7)", letterSpacing: 3, textTransform: "uppercase" }}>
            GAVANA · FIGHTER SCORE
          </p>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 64, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 0.9, fontFamily: "var(--font-display,'Anton',sans-serif)", textShadow: "0 0 40px rgba(193,18,31,0.4)" }}>
                {fighterScore}
              </div>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.2)", fontWeight: 700 }}>/100</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: fighterRank.color, display: "block", marginBottom: 4 }}>
                {t(fighterRank.key)}
              </span>
              <span style={{ fontSize: 12, color: GOLD, fontWeight: 800, display: "block" }}>
                {xp.toLocaleString()} XP
              </span>
              {nextRank && (
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontWeight: 700 }}>
                  {(nextRank.minXP - xp).toLocaleString()} → {t(nextRank.key)}
                </span>
              )}
            </div>
          </div>

          <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 14 }}>
            <div style={{ height: "100%", width: `${rankProgress}%`, borderRadius: 999, background: fighterRank.gradient || fighterRank.color, boxShadow: `0 0 10px ${fighterRank.color}55`, transition: "width 800ms cubic-bezier(0.16,1,0.3,1)" }} />
          </div>

          <p style={{ margin: "0 0 18px", fontSize: 12, color: insightColor, fontStyle: "italic", lineHeight: 1.55, borderLeft: `2px solid ${insightColor}44`, paddingLeft: 10 }}>
            {insightText}
          </p>

          {isOwnProfile && (
            <button
              type="button"
              onClick={onGoToDashboard}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 13,
                background: "linear-gradient(135deg, #C1121F, #7d0812)",
                border: "none", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 4px 18px rgba(193,18,31,0.38)",
                letterSpacing: 0.3,
              }}
            >
              {t("profileViewAnalytics")}
            </button>
          )}
        </div>
      </div>

      {aiFeedbackHistory.length === 0 && (
        <div style={{
          marginTop: 14,
          background: "linear-gradient(145deg, #111012, #0a0a0a)",
          border: "1px solid rgba(212,175,55,0.18)",
          borderLeft: "3px solid #D4AF37",
          borderRadius: "3px 16px 16px 3px",
          padding: "20px 18px",
          textAlign: "center",
        }}>
          <p style={{ margin: "0 0 6px", fontSize: 28 }}>🥊</p>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: "#fff" }}>
            {t("profileStartTraining")}
          </p>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            {t("profileStartTrainingHint")}
          </p>
          {isOwnProfile && (
            <button
              type="button"
              onClick={onGoToReels}
              style={{
                padding: "11px 24px",
                background: "linear-gradient(135deg, #D4AF37, #b8942a)",
                border: "none", color: "#000", fontSize: 12, fontWeight: 900,
                borderRadius: 10, cursor: "pointer", letterSpacing: 0.3,
              }}
            >
              {t("profileWatchReels")}
            </button>
          )}
        </div>
      )}

      {aiFeedbackHistory.length > 0 && (
        <div style={{
          marginTop: 14,
          background: "linear-gradient(145deg, #111012, #0a0a0a)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderLeft: "2.5px solid #D4AF37",
          borderRadius: "3px 16px 16px 3px",
          padding: "14px 16px",
        }}>
          <p style={{ margin: "0 0 10px", fontSize: 9, fontWeight: 900, color: GOLD, letterSpacing: 2.5, textTransform: "uppercase" }}>
            {t("profileRecentXP")}
          </p>
          {aiFeedbackHistory.slice(0, 5).map((session, i) => {
            const prevScore = i < aiFeedbackHistory.length - 1 ? Number(aiFeedbackHistory[i + 1].score) : null;
            const xpResult = calculateSessionXP(Number(session.score), prevScore, streakCount);
            const dateLabel = session.createdAt
              ? new Date(getTimestampMs(session.createdAt)).toLocaleDateString()
              : "";
            return (
              <div key={session.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 0",
                borderBottom: i < Math.min(4, aiFeedbackHistory.length - 1) ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}>
                <div>
                  <span style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>⭐ {formatScore(session.score)}/10</span>
                  <span style={{ fontSize: 10, color: "#444", marginLeft: 8 }}>{dateLabel}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 900, color: GOLD }}>+{xpResult.total} XP</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
