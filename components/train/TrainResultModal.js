"use client";

import { useEffect, useState } from "react";
import styles from "@/components/train/trainStyles";
import { GOLD, RED, redAlpha, whiteAlpha, RADIUS} from "@/lib/tokens";
import { getChallengeRank } from "@/lib/utils";
import { getChallengeComparisonPercent } from "@/lib/trainHelpers";
import RankBadge from "@/components/RankBadge";

function useCountUp(target, duration = 1100) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (target == null) return;
    setDisplay(0);
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return display;
}

export default function TrainResultModal({
  result,
  activeChallenge,
  challengeUserId,
  challengeSaving,
  challengeSaved,
  rankUpInfo,
  sessionHistory,
  ghostBestScore,
  pvpResult,
  opponentUsername,
  targetScore,
  reelId,
  missionJustCompleted,
  missionStreakBonus,
  missionNewStreak,
  error,
  saving,
  saved,
  savedAttemptNumber,
  locale,
  t,
  router,
  onTryAgain,
  onSave,
  onSaveChallengeResult,
  onShareChallenge,
  onShareTraining,
}) {
  const displayScore = useCountUp(result?.score);
  if (!result) return null;

  return (
    <div style={styles.modalWrap}>
      <div style={styles.modalOverlay} />
      <section style={styles.modal}>
        {/* TOP — score hero */}
        <div style={styles.modalTop}>
          <p style={styles.modalKicker}>{t("trainResult")}</p>
          <div style={styles.score}>{displayScore.toFixed(1)}</div>
          <span style={styles.scoreUnit}>/10</span>
          <div style={styles.resultGrid}>
            {activeChallenge ? (
              <>
                <div style={styles.resultItem}>
                  <span>{t("challengeRank")}</span>
                  <strong>{getChallengeRank(result.score)}</strong>
                </div>
                <div style={styles.resultItem}>
                  <span>{t("trainXpGained")}</span>
                  <strong style={{ color: GOLD }}>+{result.xpGained}</strong>
                </div>
                <div style={{ ...styles.resultItem, gridColumn: "1 / -1" }}>
                  <span>{t("challengeComparison")}</span>
                  <strong>{t("challengeBeatPlayers").replace("{n}", getChallengeComparisonPercent(result.score))}</strong>
                </div>
              </>
            ) : (
              <>
                <div style={styles.resultItem}>
                  <span>{t("trainXpGained")}</span>
                  <strong>+{result.xpGained}</strong>
                </div>
                <div style={styles.resultItem}>
                  <span>{t("trainRankProgress")}</span>
                  <strong>{result.rankProgress}%</strong>
                </div>
              </>
            )}
          </div>
          {!activeChallenge && (
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${result.rankProgress}%` }} />
            </div>
          )}
        </div>

        {/* MIDDLE — detail breakdown (scrollable) */}
        <div style={styles.modalMiddle}>
          {challengeUserId && pvpResult && (
            <div style={pvpResult === "win" ? styles.pvpWinBanner : styles.pvpLoseBanner}>
              <div style={styles.pvpResultBadge}>
                {pvpResult === "win" ? t("pvpWin") : t("pvpLose")}
              </div>
              <div style={styles.pvpResultHeadline}>
                {pvpResult === "win"
                  ? t("pvpYouWon").replace("{username}", opponentUsername || "them")
                  : t("pvpYouLost")}
              </div>
              <div style={styles.pvpResultScoreRow}>
                <div style={styles.pvpResultScoreCell}>
                  <span style={styles.pvpResultScoreNum}>{result.score.toFixed(1)}</span>
                  <span style={styles.pvpResultScoreLbl}>{t("pvpYouLabel")}</span>
                </div>
                <div style={styles.pvpResultScoreVs}>{t("pvpVsLabel")}</div>
                <div style={styles.pvpResultScoreCell}>
                  <span style={styles.pvpResultScoreNum}>{targetScore?.toFixed(1)}</span>
                  <span style={styles.pvpResultScoreLbl}>@{opponentUsername || "?"}</span>
                </div>
              </div>
              {(() => {
                const diff = result.score - (targetScore || 0);
                return (
                  <div style={{ ...styles.pvpResultDiff, color: diff >= 0 ? "#34D399" : "#F87171" }}>
                    {diff >= 0 ? "+" : ""}{diff.toFixed(1)}
                  </div>
                );
              })()}
              {reelId && (
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/reels?id=${reelId}`)}
                  style={{ marginTop: 12, padding: "8px 18px", borderRadius: RADIUS.full, border: "1px solid rgba(168,85,247,0.4)", background: "rgba(168,85,247,0.12)", color: "#C084FC", fontSize: 12, fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  {t("trainWatchMatchReel")}
                </button>
              )}
            </div>
          )}

          {!challengeUserId && ghostBestScore !== null && (
            <div style={result.score > ghostBestScore ? styles.newBestCard : styles.vsGhostCard}>
              {result.score > ghostBestScore && (
                <div style={styles.newBestBadge}>🏆 {t("trainNewBest")}</div>
              )}
              <div style={styles.vsCompareRow}>
                <div style={styles.vsCompareCell}>
                  <span style={styles.vsCompareLbl}>{t("trainNewLabel")}</span>
                  <span style={{ ...styles.vsCompareScore, color: result.score > ghostBestScore ? "#34D399" : "#fff" }}>
                    {result.score.toFixed(1)}
                  </span>
                </div>
                <div style={{ ...styles.vsCompareDelta, color: result.score >= ghostBestScore ? "#34D399" : "#F87171" }}>
                  {result.score >= ghostBestScore ? `+${(result.score - ghostBestScore).toFixed(1)}` : (result.score - ghostBestScore).toFixed(1)}
                </div>
                <div style={styles.vsCompareCell}>
                  <span style={styles.vsCompareLbl}>{t("trainBestLabel")}</span>
                  <span style={styles.vsCompareScore}>{ghostBestScore.toFixed(1)}</span>
                </div>
              </div>
              {result.score < ghostBestScore && (
                <div style={styles.almostMsg}>
                  {(ghostBestScore - result.score) <= 0.5
                    ? t("trainSoClose")
                    : (locale === "mn" ? `${(ghostBestScore - result.score).toFixed(1)} оноо дутлаа — дахин оролдоод давна` : locale === "ko" ? `${(ghostBestScore - result.score).toFixed(1)}점 부족 — 다시 도전!` : `${(ghostBestScore - result.score).toFixed(1)} pts away — keep going!`)}
                </div>
              )}
            </div>
          )}

          {!activeChallenge && result.breakdown && (
            <div style={styles.breakdownCard}>
              <p style={styles.breakdownTitle}>{t("scoreBreakdown")}</p>
              <div style={styles.breakdownGrid}>
                {[
                  { key: "scoreAccuracy", val: result.breakdown.accuracy, color: "#60A5FA" },
                  { key: "scoreSpeed", val: result.breakdown.speed, color: "#F59E0B" },
                  { key: "scorePower", val: result.breakdown.power, color: "#F87171" },
                  { key: "scoreConsistency", val: result.breakdown.consistency, color: "#34D399" },
                ].map(({ key, val, color }) => (
                  <div key={key} style={styles.breakdownItem}>
                    <span style={styles.breakdownLbl}>{t(key)}</span>
                    <span style={{ ...styles.breakdownVal, color }}>{val.toFixed(1)}</span>
                    <div style={styles.breakdownTrack}>
                      <div style={{ ...styles.breakdownFill, width: `${val * 10}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {missionJustCompleted && (
            <div
              style={styles.missionCompleteBanner}
              className={missionStreakBonus > 0 ? "streak-burst" : undefined}
            >
              <div style={styles.missionCompleteTitle}>🎯 {t("missionDailyComplete")}</div>
              <div style={styles.missionCompleteXP}>
                +50 XP
                {missionStreakBonus > 0 && (
                  <span style={styles.missionStreakBonusText}>
                    {" "}+ {missionStreakBonus} XP 🔥{missionNewStreak} {t("missionStreakBonus")}
                  </span>
                )}
              </div>
              {missionStreakBonus > 0 && (
                <div style={{ fontSize: 10, color: whiteAlpha(0.45), fontWeight: 700, marginTop: 2 }}>
                  {locale === "mn" ? `${missionNewStreak} өдрийн дараалал — бонус XP авлаа!` : locale === "ko" ? `${missionNewStreak}일 연속 — 보너스 XP 획득!` : `${missionNewStreak}-day streak — bonus XP earned!`}
                </div>
              )}
            </div>
          )}

          {rankUpInfo && (
            <div style={{
              borderRadius: 16, padding: "18px 20px", textAlign: "center",
              background: `linear-gradient(135deg, ${rankUpInfo.color}18, rgba(0,0,0,0.8))`,
              border: `1px solid ${rankUpInfo.color}55`,
              boxShadow: `0 0 28px ${rankUpInfo.color}30`,
              animation: "rankUpPulse 2s ease-in-out infinite",
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                <RankBadge rank={rankUpInfo} size={48} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: rankUpInfo.color, marginBottom: 4 }}>
                {t("trainRankUp")}
              </div>
              <div style={{ fontSize: 13, color: "#fff", fontWeight: 800 }}>
                {t(rankUpInfo.key)}
              </div>
              <div style={{ fontSize: 11, color: whiteAlpha(0.45), marginTop: 4 }}>
                {t("trainNewRank")}
              </div>
            </div>
          )}

          {sessionHistory.length > 0 && (
            <div style={styles.resultSparklineCard}>
              <p style={styles.resultSparklineTitle}>{t("trainRecentSessions")}</p>
              <div style={styles.resultSparklineBars}>
                {[...sessionHistory].reverse().map((s, i, arr) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{
                      width: "100%",
                      height: `${Math.max(8, (s / 10) * 44)}px`,
                      background: i === arr.length - 1 ? RED : whiteAlpha(0.16),
                      borderRadius: "3px 3px 0 0",
                      transition: "height 0.5s ease",
                      alignSelf: "flex-end",
                    }} />
                    <span style={{ fontSize: 9, color: whiteAlpha(0.4), fontWeight: 700 }}>
                      {s.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM — action buttons */}
        <div style={styles.modalBottom}>
          {error && (
            <div style={{ margin: "0 0 10px", padding: "10px 14px", borderRadius: 10, background: `${redAlpha(0.15)}`, border: `1px solid ${redAlpha(0.35)}`, color: "#fca5a5", fontSize: 13, fontWeight: 700 }}>
              {error}
            </div>
          )}
          <div style={styles.modalActions}>
            <button type="button" style={styles.tryAgainButton} onClick={onTryAgain}>
              {activeChallenge ? t("challengeTryAgain") : t("trainTryAgain")}
            </button>
            {!activeChallenge && (
              <button
                type="button"
                style={{ ...styles.saveButton, ...(saved ? styles.saveButtonDone : {}), opacity: saving || saved ? 0.65 : 1, cursor: saving || saved ? "default" : "pointer" }}
                onClick={onSave}
                disabled={saving || saved}
              >
                {saving
                  ? t("trainSaving")
                  : saved && savedAttemptNumber
                    ? t("trainAttemptSaved").replace("{n}", savedAttemptNumber)
                    : saved
                      ? t("trainSavedShort")
                      : t("trainSaveProgress")}
              </button>
            )}
            {activeChallenge && (
              <button
                type="button"
                style={{ ...styles.saveButton, ...(challengeSaved ? styles.saveButtonDone : {}), opacity: challengeSaving || challengeSaved ? 0.65 : 1, cursor: challengeSaving || challengeSaved ? "default" : "pointer" }}
                onClick={onSaveChallengeResult}
                disabled={challengeSaving || challengeSaved}
              >
                {challengeSaving
                  ? t("trainSaving")
                  : challengeSaved
                    ? t("challengeResultSaved")
                    : t("challengeSaveResult")}
              </button>
            )}
            <button
              type="button"
              style={styles.shareResultButton}
              onClick={activeChallenge ? onShareChallenge : onShareTraining}
            >
              {t("share") || "Share"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
