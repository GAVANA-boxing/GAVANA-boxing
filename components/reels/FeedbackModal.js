"use client";

import styles from "./reelStyles";

export default function FeedbackModal({
  feedbackOpen,
  feedbackLoading,
  feedbackError,
  feedbackResult,
  feedbackSaved,
  sessionXPData,
  feedbackReel,
  t,
  onClose,
}) {
  if (!feedbackOpen) return null;

  return (
    <div style={styles.feedbackModal}>
      <div style={styles.feedbackOverlay} onClick={onClose} />
      <div style={styles.feedbackSheet}>
        <div style={styles.feedbackHandle} />
        <div style={styles.feedbackHeader}>
          <div>
            <p style={styles.feedbackKicker}>{t("aiCoach")}</p>
            <h3 style={styles.feedbackTitle}>{t("techniqueFeedback")}</h3>
            {feedbackReel && (
              <p style={styles.feedbackSubtitle}>@{feedbackReel.username || "fighter"}</p>
            )}
          </div>
          <button style={styles.feedbackClose} onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={styles.feedbackBody}>
          {feedbackLoading && (
            <div style={styles.feedbackLoading}>
              <div style={styles.feedbackSpinner} />
              <span>{t("analyzingRound")}</span>
            </div>
          )}

          {feedbackError && (
            <div style={styles.feedbackError}>{feedbackError}</div>
          )}

          {feedbackResult && (
            <>
              {feedbackSaved && (
                <div style={styles.feedbackSaved}>
                  {t("savedToProgress")}
                </div>
              )}

              {sessionXPData && (
                <div style={styles.xpCard}>
                  <p style={styles.xpCardTitle}>{t("xpEarned")}</p>
                  <div style={styles.xpCardRows}>
                    <div style={styles.xpCardRow}>
                      <span style={styles.xpCardLabel}>{t("xpBase")}</span>
                      <span style={styles.xpCardVal}>+{sessionXPData.base}</span>
                    </div>
                    {sessionXPData.improvement > 0 && (
                      <div style={styles.xpCardRow}>
                        <span style={styles.xpCardLabel}>{t("xpImprovement")}</span>
                        <span style={{ ...styles.xpCardVal, color: "#34D399" }}>+{sessionXPData.improvement}</span>
                      </div>
                    )}
                    {sessionXPData.streakBonus > 0 && (
                      <div style={styles.xpCardRow}>
                        <span style={styles.xpCardLabel}>{t("xpStreakBonus")}</span>
                        <span style={{ ...styles.xpCardVal, color: "#FB923C" }}>+{sessionXPData.streakBonus}</span>
                      </div>
                    )}
                    {sessionXPData.likeXP > 0 && (
                      <div style={styles.xpCardRow}>
                        <span style={styles.xpCardLabel}>{t("xpLikes")}</span>
                        <span style={{ ...styles.xpCardVal, color: "#60A5FA" }}>+{sessionXPData.likeXP}</span>
                      </div>
                    )}
                    <div style={styles.xpCardRowTotal}>
                      <span style={styles.xpCardTotalLabel}>{t("xpLabel")}</span>
                      <span style={styles.xpCardTotalVal}>+{sessionXPData.total}</span>
                    </div>
                    {sessionXPData.capped && (
                      <p style={styles.xpCapNotice}>{t("xpDailyCap")}</p>
                    )}
                  </div>

                  <div style={styles.xpRankWrap}>
                    <div style={styles.xpRankRow}>
                      <span style={{ fontWeight: 900, fontSize: 12, color: sessionXPData.currentRank.color }}>
                        {t(sessionXPData.currentRank.key)}
                      </span>
                      <span style={styles.xpTotalLabel}>
                        {sessionXPData.totalXP.toLocaleString()} {t("xpLabel")}
                      </span>
                    </div>
                    <div style={styles.xpRankTrack}>
                      <div style={{
                        ...styles.xpRankFill,
                        width: `${sessionXPData.rankProgress}%`,
                        background: sessionXPData.currentRank.gradient,
                      }} />
                    </div>
                    {sessionXPData.nextRank && (
                      <p style={styles.xpNextLabel}>
                        {sessionXPData.xpToNext.toLocaleString()} {t("xpLabel")} → {t(sessionXPData.nextRank.key)}
                      </p>
                    )}
                    {!sessionXPData.nextRank && (
                      <p style={styles.xpNextLabel}>{t("atMaxRank")}</p>
                    )}
                  </div>
                </div>
              )}

              <pre style={styles.feedbackResult}>{feedbackResult}</pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
