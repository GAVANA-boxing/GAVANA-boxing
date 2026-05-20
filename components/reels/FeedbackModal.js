"use client";

import styles from "./feedbackStyles";
import RankBadge from "@/components/RankBadge";

// Parse the structured AI feedback into sections
function parseFeedback(text) {
  if (!text) return null;
  const scoreMatch = text.match(/Score:\s*([\d.]+)\s*\/\s*10/i);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let strength = null, improve = null, drill = null;

  for (const line of lines) {
    if (!strength && /^(strength|давуу тал|강점)\s*:/i.test(line)) {
      strength = line.replace(/^[^:]+:\s*/i, "");
    } else if (!improve && /^(improve|сайжруулах|개선점)\s*:/i.test(line)) {
      improve = line.replace(/^[^:]+:\s*/i, "");
    } else if (!drill && /^(next drill|дараагийн дасгал|다음 훈련)\s*:/i.test(line)) {
      drill = line.replace(/^[^:]+:\s*/i, "");
    }
  }

  // If we couldn't parse sections, fall back to raw text
  if (!strength && !improve && !drill) return { raw: text, score };
  return { score, strength, improve, drill };
}

function ScoreMeter({ score }) {
  const pct = Math.min(100, Math.max(0, (score / 10) * 100));
  const color = score >= 8 ? "#34D399" : score >= 6 ? "#FBBF24" : "#F87171";
  return (
    <div style={fm.scoreWrap}>
      <div style={fm.scoreRow}>
        <span style={fm.scoreLabel}>SCORE</span>
        <span style={{ ...fm.scoreVal, color }}>{score.toFixed(1)}<span style={fm.scoreMax}>/10</span></span>
      </div>
      <div style={fm.scoreTrack}>
        <div style={{ ...fm.scoreFill, width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function FeedbackSection({ icon, label, text, accentColor }) {
  return (
    <div style={{ ...fm.section, borderLeftColor: accentColor }}>
      <p style={{ ...fm.sectionLabel, color: accentColor }}>{icon} {label}</p>
      <p style={fm.sectionText}>{text}</p>
    </div>
  );
}

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

  const parsed = parseFeedback(feedbackResult);

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
            <div style={fm.loadingWrap}>
              <div style={styles.feedbackSpinner} />
              <div style={fm.loadingText}>
                <span style={fm.loadingTitle}>AI ANALYZING</span>
                <span style={fm.loadingMeta}>{t("analyzingRound")}</span>
              </div>
            </div>
          )}

          {feedbackError && (
            <div style={styles.feedbackError}>{feedbackError}</div>
          )}

          {feedbackResult && parsed && (
            <>
              {feedbackSaved && (
                <div style={styles.feedbackSaved}>
                  {t("savedToProgress")}
                </div>
              )}

              {/* Score meter */}
              {parsed.score !== null && <ScoreMeter score={parsed.score} />}

              {/* Structured sections */}
              {parsed.raw ? (
                <pre style={styles.feedbackResult}>{parsed.raw}</pre>
              ) : (
                <div style={fm.sections}>
                  {parsed.strength && (
                    <FeedbackSection
                      icon="✦"
                      label="STRENGTH"
                      text={parsed.strength}
                      accentColor="#34D399"
                    />
                  )}
                  {parsed.improve && (
                    <FeedbackSection
                      icon="↑"
                      label="IMPROVE"
                      text={parsed.improve}
                      accentColor="#FBBF24"
                    />
                  )}
                  {parsed.drill && (
                    <FeedbackSection
                      icon="⚡"
                      label="NEXT DRILL"
                      text={parsed.drill}
                      accentColor="#C8102E"
                    />
                  )}
                </div>
              )}

              {/* XP breakdown */}
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
                      <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 900, fontSize: 12, color: sessionXPData.currentRank.color }}>
                        <RankBadge rank={sessionXPData.currentRank} size={18} />
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Phase 45 local styles
const fm = {
  loadingWrap: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "8px 0 16px",
  },
  loadingText: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  loadingTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 2,
  },
  loadingMeta: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
  },
  scoreWrap: {
    marginBottom: 16,
    padding: "14px 16px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  scoreRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 2,
    color: "rgba(255,255,255,0.4)",
  },
  scoreVal: {
    fontSize: 28,
    fontWeight: 1000,
    lineHeight: 1,
  },
  scoreMax: {
    fontSize: 14,
    fontWeight: 700,
    color: "rgba(255,255,255,0.35)",
  },
  scoreTrack: {
    height: 4,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  scoreFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.8s ease",
  },
  sections: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 16,
  },
  section: {
    padding: "12px 14px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderLeft: "3px solid",
  },
  sectionLabel: {
    margin: "0 0 5px",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1.5,
  },
  sectionText: {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.55,
  },
};
