"use client";

import { useEffect, useState, useRef } from "react";
import { GOLD, RED, RADIUS, redAlpha, goldAlpha, whiteAlpha, blackAlpha } from "@/lib/tokens";
import { ACADEMY_LESSONS } from "@/lib/academyLessons";
import styles from "@/components/train/trainStyles";
import { computeScoreConfidence, CONFIDENCE_TIPS } from "@/lib/scoreConfidence";
import {
  useCountUp, getIdentityWithSub, computeComparison,
  getBestPunchType, getNextFocus, getMovementSummary,
} from "@/lib/trainResultHelpers";
import CoachReviewCard from "@/components/train/CoachReviewCard";
import PunchPatternCard from "@/components/train/PunchPatternCard";
import ActionSummary from "@/components/train/ActionSummary";
import ResultActionsSection from "@/components/train/ResultActionsSection";
import ResultAnalysisSection from "@/components/train/ResultAnalysisSection";

export default function TrainResultModal({
  debrief = null,
  debriefSource = null,
  debriefLoading = false,
  result,
  activeChallenge,
  challengeUserId,
  challengeSaving,
  challengeSaved,
  rankUpInfo,
  beltUpInfo,
  sessionHistory,
  ghostBestScore,
  pvpResult,
  opponentUsername,
  targetScore,
  reelId,
  missionJustCompleted,
  missionStreakBonus,
  missionNewStreak,
  movementEvents,
  sessionStartTime,
  poseMetrics = null,
  prevPoseMetrics = null,
  userStreak = 0,
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
  onShareToFeed,
  feedSharing  = false,
  feedShared   = false,
  sharedReelId = null,
  onCreateChallengePost,
  challengePosting  = false,
  challengePosted   = false,
  challengePostId   = null,
  isGuest = false,
  academyLesson = null,
  challengePostData = null,
  onPostChallengeResponse,
  challengeResponsePosting = false,
  challengeResponsePosted  = false,
  challengeResponseId      = null,
  recordedBlob     = null,
  thumbnailBlob    = null,
}) {
  // Compute confidence early so we can cap the animated score
  const _punchCount = (poseMetrics?.punchCount ?? result?.hitCount ?? 0);
  const _scoreConf = computeScoreConfidence(_punchCount, poseMetrics?.sessionConfidence ?? null, poseMetrics?.cameraQuality ?? null);
  const _scoreCap = _scoreConf === "low" ? 7.5 : _scoreConf === "medium" ? 8.5 : 10;
  const _cappedScore = result ? Math.min(result.score, _scoreCap) : 0;
  const displayScore = useCountUp(_cappedScore);
  const [sessionTag, setSessionTag] = useState(null);
  const [clipDuration, setClipDuration] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (!recordedBlob) { setBlobUrl(null); setClipDuration(null); return; }
    setClipDuration(null);
    const url = URL.createObjectURL(recordedBlob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recordedBlob]);
  if (!result) return null;

  const MIN_PUNCHES = 5;
  const effectivePunchCount = poseMetrics?.punchCount ?? result.hitCount ?? 0;
  const tooFewPunches = effectivePunchCount < MIN_PUNCHES;

  const scoreConf = _scoreConf;
  const isLowConfidence = scoreConf === "low" || scoreConf === "none";

  const events = movementEvents || [];
  const identity = tooFewPunches ? null : getIdentityWithSub(result.score, events, poseMetrics, locale);
  const movementSummary = getMovementSummary(events);
  const comparison = computeComparison(poseMetrics, prevPoseMetrics);
  const timelineEvents = events.slice(-8);
  const hasMI = movementSummary.length > 0;
  const hasTimeline = timelineEvents.length > 0;

  const analysisLabel = challengeUserId
    ? "PVP ANALYSIS"
    : activeChallenge
      ? "CHALLENGE ANALYSIS"
      : "COMBAT ANALYSIS";

  return (
    <div style={styles.modalWrap}>
      <style>{`@keyframes dotBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
      <div style={styles.modalOverlay} />
      <section style={styles.modal}>

        {/* ── HEADER ───────────────────────────────────────────────── */}
        <div style={{ padding: "20px 20px 14px", flexShrink: 0, borderBottom: `1px solid ${whiteAlpha(0.05)}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 900, letterSpacing: 3.5, color: goldAlpha(0.65), textTransform: "uppercase" }}>
              {analysisLabel}
            </p>
            {/* Confidence badge */}
            {!tooFewPunches && (() => {
              const confMap = { high: { label: t("scoreConfidenceHigh"), color: "#34D399", bg: "rgba(52,211,153,0.1)" }, medium: { label: t("scoreConfidenceMedium"), color: "#F5C451", bg: "rgba(245,196,81,0.1)" }, low: { label: t("scoreConfidenceLow"), color: "#FB923C", bg: "rgba(251,146,60,0.1)" } };
              const cm = confMap[scoreConf];
              if (!cm) return null;
              return (
                <span style={{ fontSize: 8, fontWeight: 900, color: cm.color, background: cm.bg, padding: "3px 8px", borderRadius: 20, letterSpacing: 0.5 }}>
                  {cm.label}
                </span>
              );
            })()}
          </div>

          {tooFewPunches ? (
            /* ── Not enough data ── */
            <div style={{ margin: "16px 0 10px" }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 1000, color: whiteAlpha(0.55), letterSpacing: "-0.01em" }}>
                {locale === "mn" ? "Хангалтгүй өгөгдөл" : locale === "ko" ? "데이터 부족" : "Not Enough Data"}
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: whiteAlpha(0.35), lineHeight: 1.5 }}>
                {locale === "mn"
                  ? `AI шинжилгээнд хамгийн багадаа ${MIN_PUNCHES} цохилт хэрэгтэй. Та ${effectivePunchCount} цохилт хийсэн.`
                  : `AI analysis needs at least ${MIN_PUNCHES} punches. You threw ${effectivePunchCount}.`}
              </p>
            </div>
          ) : (
            <>
              <h2 style={{
                margin: "8px 0 2px", fontSize: 24, fontWeight: 1000,
                letterSpacing: "-0.02em", color: "#fff", lineHeight: 1.0,
                fontFamily: "var(--font-display, 'Anton', sans-serif)",
              }}>
                {identity.title}
              </h2>
              <p style={{ margin: "0 0 14px", fontSize: 11, color: whiteAlpha(0.35), fontWeight: 700 }}>
                {identity.sub}
              </p>

              {/* Score telemetry bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 3, background: whiteAlpha(0.07), borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${(displayScore / 10) * 100}%`,
                    background: `linear-gradient(90deg, ${RED}, ${GOLD})`,
                    borderRadius: 2,
                    transition: "width 0.04s linear",
                  }} />
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 32, fontWeight: 1000, lineHeight: 1,
                    fontFamily: "var(--font-display, 'Anton', sans-serif)",
                    letterSpacing: "-0.02em", color: "#fff",
                  }}>
                    {displayScore.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 12, color: whiteAlpha(0.28), fontWeight: 800 }}>/10</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── LOW CONFIDENCE TIPS ──────────────────────────────────── */}
        {isLowConfidence && !tooFewPunches && (
          <div style={{ margin: "0 20px 0", padding: "12px 14px", borderRadius: 12, background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.2)" }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "#FB923C", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
              ⚠ {t("confidenceLowNote")}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CONFIDENCE_TIPS.map((tip) => (
                <div key={tip.key} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span style={{ fontSize: 12 }}>{tip.icon}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>{t(tip.key)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RETURN SUMMARY ───────────────────────────────────────── */}
        {!tooFewPunches && (() => {
          const lastScore = Array.isArray(sessionHistory) && sessionHistory.length > 0 ? sessionHistory[0] : null;
          const delta = lastScore != null ? result.score - lastScore : null;
          const bestPunch = getBestPunchType(poseMetrics);
          const nextFocus = getNextFocus(result, poseMetrics);
          // Use missionNewStreak (post-save) if higher than the at-mount snapshot
          const effectiveStreak = Math.max(userStreak || 0, missionNewStreak || 0);
          return (
            <div style={{ padding: "12px 20px 0", display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
              {/* Score row */}
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}` }}>
                  <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.2, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 3 }}>{t("trainLabelToday")}</div>
                  <div style={{ fontSize: 18, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>{result.score.toFixed(1)}</div>
                </div>
                {delta != null && (
                  <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, background: delta >= 0 ? "rgba(52,211,153,0.04)" : "rgba(248,113,113,0.04)", border: `1px solid ${delta >= 0 ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)"}` }}>
                    <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.2, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 3 }}>{t("trainLabelVsLast")}</div>
                    <div style={{ fontSize: 18, fontWeight: 1000, color: delta >= 0 ? "#34D399" : "#F87171", fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)}</div>
                  </div>
                )}
                {ghostBestScore != null && (
                  <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}` }}>
                    <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.2, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 3 }}>{t("trainLabelBest")}</div>
                    <div style={{ fontSize: 18, fontWeight: 1000, color: GOLD, fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>{Math.max(ghostBestScore, result.score).toFixed(1)}</div>
                  </div>
                )}
              </div>
              {/* Punch info + next focus */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <div style={{ padding: "6px 11px", borderRadius: 8, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.06)}`, display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: whiteAlpha(0.28), textTransform: "uppercase", letterSpacing: 1 }}>{t("trainLabelPunches")}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{effectivePunchCount}</span>
                </div>
                {bestPunch && (
                  <div style={{ padding: "6px 11px", borderRadius: 8, background: "rgba(245,196,81,0.05)", border: `1px solid rgba(245,196,81,0.14)`, display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: goldAlpha(0.55), textTransform: "uppercase", letterSpacing: 1 }}>{t("trainLabelBestWeapon")}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: GOLD }}>{bestPunch}</span>
                  </div>
                )}
                {effectiveStreak > 0 && (
                  <div style={{ padding: "6px 11px", borderRadius: 8, background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.16)", display: "flex", gap: 5, alignItems: "center" }}>
                    <span style={{ fontSize: 14 }}>🔥</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: "#FB923C" }}>{effectiveStreak}d</span>
                  </div>
                )}
              </div>
              {nextFocus && (
                <div style={{ padding: "7px 12px", borderRadius: 9, background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.13)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: "rgba(168,85,247,0.65)", textTransform: "uppercase", letterSpacing: 1, flexShrink: 0, paddingTop: 1 }}>{t("trainLabelNextFocus")}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: whiteAlpha(0.65), lineHeight: 1.4 }}>{nextFocus}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── PUNCH PATTERN (Fighter DNA seed) ─────────────────────── */}
        {poseMetrics && !tooFewPunches && scoreConf !== "none" && (
          <PunchPatternCard poseMetrics={poseMetrics} t={t} />
        )}

        {/* ── ACTION SUMMARY: GOOD / FIX / NEXT ────────────────────── */}
        {poseMetrics && !tooFewPunches && (
          <ActionSummary poseMetrics={poseMetrics} result={result} locale={locale} />
        )}

        {/* ── COACH REVIEW ─────────────────────────────────────────── */}
        {poseMetrics && (
          <CoachReviewCard poseMetrics={poseMetrics} result={result} locale={locale} />
        )}

        {/* ── ACADEMY LESSON REVIEW ────────────────────────────────── */}
        {academyLesson && !tooFewPunches && (() => {
          const goalMet = (result?.score ?? 0) >= 6.5;
          const acc = academyLesson.accentColor;
          const currentIdx = ACADEMY_LESSONS.findIndex(l => l.id === academyLesson.id);
          const nextLesson = currentIdx >= 0 ? ACADEMY_LESSONS[currentIdx + 1] : null;
          return (
            <div style={{
              margin: "0 20px 8px",
              padding: "12px 14px", borderRadius: 12,
              background: `${acc}07`,
              border: `1px solid ${acc}25`,
              borderLeft: `3px solid ${acc}66`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 14 }}>{academyLesson.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.8, color: acc, textTransform: "uppercase" }}>
                    ACADEMY LESSON · {locale === "mn" ? "Дэвшил хадгаласан ✓" : "Progress tracked ✓"}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#fff", marginTop: 1 }}>
                    {academyLesson.title}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 10px", borderRadius: 20,
                    background: goalMet ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
                    border: `1px solid ${goalMet ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: goalMet ? "#34D399" : "#F87171", letterSpacing: 1 }}>
                      {goalMet ? "✓ COMPLETE" : `${(result?.score ?? 0).toFixed(1)}/6.5`}
                    </span>
                  </div>
                </div>
              </div>
              {!goalMet && (
                <div style={{
                  marginBottom: 8, padding: "7px 10px", borderRadius: 8,
                  background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.14)",
                }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
                    {locale === "mn"
                      ? `6.5/10 хүрвэл хичээл дуусна. Одоо ${(result?.score ?? 0).toFixed(1)} байна. Дахин дасгалдана уу.`
                      : `Score 6.5/10 to complete this lesson. You got ${(result?.score ?? 0).toFixed(1)}. Train again to improve.`}
                  </span>
                </div>
              )}
              {nextLesson && (
                <div style={{
                  padding: "8px 10px", borderRadius: 8,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                }}>
                  <div>
                    <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 1.2, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 2 }}>
                      {locale === "mn" ? "Дараагийн хичээл" : "Next Lesson"}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.65)" }}>
                      {nextLesson.emoji} {nextLesson.title}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/train?academyLesson=${nextLesson.id}`)}
                    style={{
                      flexShrink: 0, padding: "5px 12px", borderRadius: 8,
                      background: `${nextLesson.accentColor}18`, border: `1px solid ${nextLesson.accentColor}35`,
                      color: nextLesson.accentColor, fontSize: 9, fontWeight: 900,
                      cursor: "pointer", letterSpacing: 1, textTransform: "uppercase",
                    }}
                  >
                    Train →
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── AI DEBRIEF ───────────────────────────────────────────── */}
        {!tooFewPunches && (debriefLoading || debrief) && (
          <div style={{
            margin: "0 20px 0",
            padding: "12px 14px",
            borderRadius: 12,
            background: "rgba(245,196,81,0.04)",
            border: "1px solid rgba(245,196,81,0.14)",
            borderLeft: "3px solid rgba(245,196,81,0.55)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: goldAlpha(0.55), textTransform: "uppercase" }}>
                AI Debrief
              </div>
              {!debriefLoading && debriefSource === "error" && (
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, color: "rgba(255,100,100,0.6)", background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.2)", borderRadius: 4, padding: "1px 5px", textTransform: "uppercase" }}>
                  AI ERROR
                </span>
              )}
            </div>
            {debriefLoading
              ? (
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: goldAlpha(0.4),
                      animation: `dotBounce 1.1s ease-in-out ${i * 0.18}s infinite`,
                    }} />
                  ))}
                </div>
              )
              : (
                <p style={{ margin: 0, fontSize: 12, color: whiteAlpha(0.72), lineHeight: 1.6, fontStyle: "italic" }}>
                  {debrief}
                </p>
              )
            }
          </div>
        )}

        {/* ── SCROLLABLE ANALYSIS ──────────────────────────────────── */}
        <ResultAnalysisSection
          result={result}
          comparison={comparison}
          movementSummary={movementSummary}
          timelineEvents={timelineEvents}
          hasMI={hasMI}
          hasTimeline={hasTimeline}
          poseMetrics={poseMetrics}
          ghostBestScore={ghostBestScore}
          pvpResult={pvpResult}
          challengeUserId={challengeUserId}
          challengePostData={challengePostData}
          reelId={reelId}
          targetScore={targetScore}
          opponentUsername={opponentUsername}
          activeChallenge={activeChallenge}
          sessionStartTime={sessionStartTime}
          missionJustCompleted={missionJustCompleted}
          missionStreakBonus={missionStreakBonus}
          missionNewStreak={missionNewStreak}
          beltUpInfo={beltUpInfo}
          rankUpInfo={rankUpInfo}
          locale={locale}
          t={t}
          router={router}
        />

        {/* ── VIDEO PREVIEW ────────────────────────────────────────── */}
        {blobUrl && (
          <div style={{ padding: "0 20px 12px", flexShrink: 0 }}>
            <div style={{
              borderRadius: 12,
              overflow: "hidden",
              background: "#000",
              border: "1px solid rgba(255,255,255,0.08)",
              position: "relative",
            }}>
              <video
                src={blobUrl}
                controls
                playsInline
                muted
                loop
                style={{ width: "100%", maxHeight: 220, display: "block", objectFit: "cover" }}
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration;
                  if (Number.isFinite(d) && d > 0) setClipDuration(Math.round(d));
                }}
              />
              {clipDuration != null && (
                <div style={{
                  position: "absolute", bottom: 8, right: 10,
                  padding: "2px 8px", borderRadius: 6,
                  background: "rgba(0,0,0,0.7)",
                  fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.8)",
                  fontFamily: "monospace",
                }}>
                  {Math.floor(clipDuration / 60)}:{String(clipDuration % 60).padStart(2, "0")}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ACTIONS ──────────────────────────────────────────────── */}
        <ResultActionsSection
          error={error}
          isLowConfidence={isLowConfidence}
          tooFewPunches={tooFewPunches}
          isGuest={isGuest}
          activeChallenge={activeChallenge}
          sessionTag={sessionTag}
          setSessionTag={setSessionTag}
          saving={saving}
          saved={saved}
          savedAttemptNumber={savedAttemptNumber}
          feedSharing={feedSharing}
          feedShared={feedShared}
          challengePosting={challengePosting}
          challengePosted={challengePosted}
          challengeResponsePosting={challengeResponsePosting}
          challengeResponsePosted={challengeResponsePosted}
          challengeSaving={challengeSaving}
          challengeSaved={challengeSaved}
          challengePostData={challengePostData}
          poseMetrics={poseMetrics}
          events={events}
          academyLesson={academyLesson}
          recordedBlob={recordedBlob}
          onTryAgain={onTryAgain}
          onSave={onSave}
          onSaveChallengeResult={onSaveChallengeResult}
          onShareChallenge={onShareChallenge}
          onShareTraining={onShareTraining}
          onShareToFeed={onShareToFeed}
          onCreateChallengePost={onCreateChallengePost}
          onPostChallengeResponse={onPostChallengeResponse}
          locale={locale}
          t={t}
          router={router}
        />

      </section>
    </div>
  );
}
