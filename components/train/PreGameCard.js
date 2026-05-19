"use client";

import styles from "@/components/train/trainStyles";
import { GOLD, RED } from "@/lib/tokens";

export default function PreGameCard({
  phase,
  challengeUserId,
  weeklySessionCount,
  userStreak,
  ghostBestScore,
  sessionHistory,
  targetScore,
  opponentUsername,
  ghostEnabled,
  reelId,
  locale,
  t,
}) {
  if (phase !== "idle") return null;

  return (
    <div style={styles.contextCard}>
      {!challengeUserId && (
        <div style={styles.preSessionStrip}>
          {(() => {
            const weeklyGoal = 5;
            const pct = Math.min(1, weeklySessionCount / weeklyGoal);
            const r = 22;
            const circ = 2 * Math.PI * r;
            const filled = pct * circ;
            return (
              <div style={styles.weeklyRingWrap}>
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ display: "block" }}>
                  <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                  <circle cx="28" cy="28" r={r} fill="none" stroke={GOLD} strokeWidth="4"
                    strokeDasharray={`${filled} ${circ - filled}`}
                    strokeLinecap="round"
                    transform="rotate(-90 28 28)"
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                  <text x="28" y="32" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="900" fontFamily="sans-serif">
                    {weeklySessionCount}/{weeklyGoal}
                  </text>
                </svg>
                <span style={styles.weeklyRingLabel}>{t("trainWeekly")}</span>
              </div>
            );
          })()}

          <div style={styles.preSessionStat}>
            <span style={styles.preSessionStatVal}>
              {userStreak > 0 ? `🔥 ${userStreak}` : "—"}
            </span>
            <span style={styles.preSessionStatLbl}>{t("profileStatStreak")}</span>
          </div>

          {ghostBestScore !== null && (
            <div style={styles.preSessionStat}>
              <span style={styles.preSessionStatVal}>{ghostBestScore.toFixed(1)}</span>
              <span style={styles.preSessionStatLbl}>{t("trainBest")}</span>
            </div>
          )}

          {sessionHistory.length > 0 && (
            <div style={styles.preSessionSparkWrap}>
              <div style={styles.preSessionSparkBars}>
                {[...sessionHistory].reverse().map((s, i, arr) => (
                  <div
                    key={i}
                    style={{
                      ...styles.preSessionSparkBar,
                      height: `${Math.max(12, (s / 10) * 36)}px`,
                      background: i === arr.length - 1 ? RED : "rgba(255,255,255,0.18)",
                    }}
                  />
                ))}
              </div>
              <span style={styles.preSessionStatLbl}>{t("trainHistory")}</span>
            </div>
          )}
        </div>
      )}

      {(ghostBestScore !== null || targetScore || (challengeUserId && opponentUsername)) ? (
        <div style={styles.contextStatsRow}>
          {!challengeUserId && ghostBestScore !== null && (
            <div style={styles.contextStat}>
              <span style={styles.contextStatLabel}>👻 {t("trainYourBest")}</span>
              <span style={styles.contextStatValue}>{ghostBestScore.toFixed(1)}<span style={styles.contextStatUnit}>/10</span></span>
            </div>
          )}
          {!challengeUserId && targetScore && (
            <div style={styles.contextStat}>
              <span style={styles.contextStatLabel}>🎯 {t("trainTarget")}</span>
              <span style={{ ...styles.contextStatValue, color: "#FDE68A" }}>{targetScore.toFixed(1)}<span style={styles.contextStatUnit}>/10</span></span>
            </div>
          )}
          {challengeUserId && targetScore && (
            <div style={{ ...styles.contextStat, flex: 1, alignItems: "center" }}>
              <span style={styles.contextStatLabel}>🆚 {t("trainBeat")}</span>
              <span style={{ ...styles.contextStatValue, color: "#93C5FD", fontSize: 17 }}>
                {opponentUsername || "Opponent"} · {targetScore.toFixed(1)}/10
              </span>
            </div>
          )}
        </div>
      ) : (
        !challengeUserId && (
          <div style={styles.contextEmptyMsg}>
            {reelId ? t("trainFirstScore") : t("trainReadyToTrain")}
          </div>
        )
      )}

      {ghostEnabled && ghostBestScore !== null && !challengeUserId && (
        <div style={styles.contextGhostNote}>
          👻 {locale === "mn" ? `Ghost горим идэвхтэй — ${ghostBestScore.toFixed(1)}/10 давах` : locale === "ko" ? `고스트 모드 활성화 — ${ghostBestScore.toFixed(1)}/10 넘기` : `Ghost mode active — beat ${ghostBestScore.toFixed(1)}/10`}
        </div>
      )}
    </div>
  );
}
