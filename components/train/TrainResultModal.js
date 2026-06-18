"use client";

import { useEffect, useState } from "react";
import styles from "@/components/train/trainStyles";
import { computeScoreConfidence } from "@/lib/scoreConfidence";
import {
  useCountUp, getIdentityWithSub, computeComparison,
  getBestPunchType, getNextFocus, getMovementSummary,
} from "@/lib/trainResultHelpers";

import ResultHeader          from "@/components/train/ResultHeader";
import ConfidenceTipsBar     from "@/components/train/ConfidenceTipsBar";
import ReturnSummary         from "@/components/train/ReturnSummary";
import AcademyLessonCard     from "@/components/train/AcademyLessonCard";
import AIDebriefCard         from "@/components/train/AIDebriefCard";
import VideoPreview          from "@/components/train/VideoPreview";
import CoachReviewCard       from "@/components/train/CoachReviewCard";
import PunchPatternCard      from "@/components/train/PunchPatternCard";
import ActionSummary         from "@/components/train/ActionSummary";
import ResultActionsSection  from "@/components/train/ResultActionsSection";
import ResultAnalysisSection from "@/components/train/ResultAnalysisSection";

const MIN_PUNCHES = 5;

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
  recordedBlob  = null,
  thumbnailBlob = null,
}) {
  // ── Score / confidence ──────────────────────────────────────────────────
  const _punchCount  = poseMetrics?.punchCount ?? result?.hitCount ?? 0;
  const _scoreConf   = computeScoreConfidence(
    _punchCount,
    poseMetrics?.sessionConfidence ?? null,
    poseMetrics?.cameraQuality    ?? null,
  );
  const _scoreCap    = _scoreConf === "low" ? 7.5 : _scoreConf === "medium" ? 8.5 : 10;
  const _cappedScore = result ? Math.min(result.score, _scoreCap) : 0;
  const displayScore = useCountUp(_cappedScore);

  // ── Local state ─────────────────────────────────────────────────────────
  const [sessionTag,   setSessionTag]   = useState(null);
  const [clipDuration, setClipDuration] = useState(null);
  const [blobUrl,      setBlobUrl]      = useState(null);

  useEffect(() => {
    if (!recordedBlob) { setBlobUrl(null); setClipDuration(null); return; }
    setClipDuration(null);
    const url = URL.createObjectURL(recordedBlob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recordedBlob]);

  if (!result) return null;

  // ── Derived values ───────────────────────────────────────────────────────
  const effectivePunchCount = poseMetrics?.punchCount ?? result.hitCount ?? 0;
  const tooFewPunches       = effectivePunchCount < MIN_PUNCHES;
  const scoreConf           = _scoreConf;
  const isLowConfidence     = scoreConf === "low" || scoreConf === "none";

  const events         = movementEvents || [];
  const identity       = tooFewPunches ? null : getIdentityWithSub(result.score, events, poseMetrics, locale);
  const movementSummary = getMovementSummary(events);
  const comparison     = computeComparison(poseMetrics, prevPoseMetrics);
  const timelineEvents = events.slice(-8);
  const hasMI          = movementSummary.length > 0;
  const hasTimeline    = timelineEvents.length > 0;
  const bestPunch      = getBestPunchType(poseMetrics);
  const nextFocus      = getNextFocus(result, poseMetrics);
  const effectiveStreak = Math.max(userStreak || 0, missionNewStreak || 0);

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
        <ResultHeader
          analysisLabel={analysisLabel}
          tooFewPunches={tooFewPunches}
          effectivePunchCount={effectivePunchCount}
          minPunches={MIN_PUNCHES}
          identity={identity}
          displayScore={displayScore}
          scoreConf={scoreConf}
          locale={locale}
          t={t}
        />

        {/* ── LOW CONFIDENCE TIPS ──────────────────────────────────── */}
        {isLowConfidence && !tooFewPunches && (
          <ConfidenceTipsBar t={t} />
        )}

        {/* ── RETURN SUMMARY ───────────────────────────────────────── */}
        {!tooFewPunches && (
          <ReturnSummary
            result={result}
            sessionHistory={sessionHistory}
            ghostBestScore={ghostBestScore}
            effectivePunchCount={effectivePunchCount}
            bestPunch={bestPunch}
            nextFocus={nextFocus}
            effectiveStreak={effectiveStreak}
            t={t}
          />
        )}

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
        {academyLesson && !tooFewPunches && (
          <AcademyLessonCard
            academyLesson={academyLesson}
            result={result}
            locale={locale}
            router={router}
          />
        )}

        {/* ── AI DEBRIEF ───────────────────────────────────────────── */}
        {!tooFewPunches && (debriefLoading || debrief) && (
          <AIDebriefCard
            debrief={debrief}
            debriefLoading={debriefLoading}
            debriefSource={debriefSource}
          />
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
          <VideoPreview
            blobUrl={blobUrl}
            clipDuration={clipDuration}
            onDurationLoad={setClipDuration}
          />
        )}

        {/* ── RETURN TRIGGER ───────────────────────────────────────── */}
        {!tooFewPunches && (
          <div style={{ margin: "12px 20px 0", padding: "12px 14px", borderRadius: 12, background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.14)", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>🔥</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 900, color: "#FB923C" }}>
                {locale === "mn" ? "Маргааш дахин ир" : locale === "ko" ? "내일 다시 돌아오세요" : "Come back tomorrow"}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.38)", lineHeight: 1.4 }}>
                {locale === "mn"
                  ? "3 хичээлийн дараа Fighter DNA тодорхойлогдоно."
                  : locale === "ko"
                  ? "3회 세션 후 파이터 DNA가 확인됩니다."
                  : "3 sessions builds your Fighter DNA profile."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { router.push(`/${locale}/train?autostart=1`); }}
              style={{ padding: "7px 14px", borderRadius: 9, background: "rgba(251,146,60,0.18)", border: "1px solid rgba(251,146,60,0.35)", color: "#FB923C", fontSize: 11, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {locale === "mn" ? "Дахин →" : locale === "ko" ? "다시 →" : "Train again →"}
            </button>
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
