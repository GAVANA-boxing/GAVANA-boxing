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
  userArchetype = null,
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
  const [sessionTag,    setSessionTag]    = useState(null);
  const [clipDuration,  setClipDuration]  = useState(null);
  const [showDnaShare,  setShowDnaShare]  = useState(false);
  const [shareCopied,   setShareCopied]   = useState(false);
  const [blobUrl,      setBlobUrl]      = useState(null);

  useEffect(() => {
    if (!recordedBlob) { setBlobUrl(null); setClipDuration(null); return; }
    setClipDuration(null);
    const url = URL.createObjectURL(recordedBlob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recordedBlob]);

  // Show DNA share card 1.5s after result saved with archetype
  useEffect(() => {
    if (!saved || !userArchetype || _cappedScore <= 0) return;
    const t = setTimeout(() => setShowDnaShare(true), 1500);
    return () => clearTimeout(t);
  }, [saved, userArchetype, _cappedScore]);

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

      {/* ── DNA SHARE SHEET ──────────────────────────────────────────── */}
      {showDnaShare && (() => {
        const ARCH_LABELS = {
          pressure:  { en: "Pressure Fighter", mn: "Pressure Fighter", ko: "압박형 파이터" },
          outboxer:  { en: "Outboxer",          mn: "Outboxer",         ko: "아웃복서" },
          counter:   { en: "Counter Puncher",   mn: "Counter Puncher",  ko: "카운터 펀처" },
          technical: { en: "Technical Boxer",   mn: "Technical Boxer",  ko: "테크니컬 복서" },
          brawler:   { en: "Brawler",            mn: "Brawler",          ko: "브롤러" },
          slugger:   { en: "Slugger",            mn: "Slugger",          ko: "슬러거" },
        };
        const archLabel = ARCH_LABELS[userArchetype]?.[locale] || ARCH_LABELS[userArchetype]?.en || userArchetype?.toUpperCase();
        const shareText = locale === "mn"
          ? `Миний Fighter DNA: ${archLabel} 🥊\nОноо: ${_cappedScore.toFixed(1)}/10\ngavana-boxing.vercel.app`
          : locale === "ko"
          ? `내 파이터 DNA: ${archLabel} 🥊\n점수: ${_cappedScore.toFixed(1)}/10\ngavana-boxing.vercel.app`
          : `My Fighter DNA: ${archLabel} 🥊\nScore: ${_cappedScore.toFixed(1)}/10\ngavana-boxing.vercel.app`;

        const handleShare = async () => {
          if (navigator.share) {
            try { await navigator.share({ text: shareText, url: "https://gavana-boxing.vercel.app" }); }
            catch (_) { /* cancelled */ }
          } else {
            navigator.clipboard?.writeText(shareText);
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2000);
          }
        };

        return (
          <div style={{
            position: "fixed", inset: 0, zIndex: 200,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
          }} onClick={() => setShowDnaShare(false)}>
            <div
              style={{
                width: "100%", maxWidth: 480,
                background: "linear-gradient(180deg, #111013 0%, #0c0b0e 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "24px 24px 0 0",
                padding: "28px 24px 40px",
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", marginBottom: 24 }} />

              {/* Kicker */}
              <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 900, letterSpacing: 4, color: "rgba(245,196,81,0.7)", textTransform: "uppercase" }}>
                GAVANA // FIGHTER DNA
              </p>

              {/* Archetype */}
              <h2 style={{
                margin: "0 0 4px", fontSize: 28, fontWeight: 1000,
                letterSpacing: "-0.02em", color: "#fff", textAlign: "center",
                fontFamily: "var(--font-display,'Anton',sans-serif)",
                textShadow: "0 0 30px rgba(212,25,42,0.4)",
              }}>
                {archLabel?.toUpperCase()}
              </h2>

              {/* Score */}
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                {locale === "mn" ? `Оноо: ${_cappedScore.toFixed(1)}/10` : locale === "ko" ? `점수: ${_cappedScore.toFixed(1)}/10` : `Score: ${_cappedScore.toFixed(1)}/10`}
              </p>

              {/* Share button */}
              <button
                type="button"
                onClick={handleShare}
                style={{
                  width: "100%", padding: "16px", borderRadius: 14,
                  background: "linear-gradient(135deg, #d4192a, #a01020)",
                  color: "#fff", border: "none", fontSize: 14, fontWeight: 900,
                  cursor: "pointer", letterSpacing: "0.06em",
                  boxShadow: "0 0 24px rgba(212,25,42,0.45), 0 8px 24px rgba(212,25,42,0.25)",
                  marginBottom: 10,
                }}
              >
                {shareCopied
                  ? (locale === "mn" ? "✓ Хуулагдсан!" : locale === "ko" ? "✓ 복사됨!" : "✓ Copied!")
                  : (locale === "mn" ? "📱 DNA карт хуваалцах" : locale === "ko" ? "📱 DNA 카드 공유" : "📱 Share Fighter DNA")}
              </button>

              {/* Dismiss */}
              <button
                type="button"
                onClick={() => setShowDnaShare(false)}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12,
                  background: "none", border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {locale === "mn" ? "Хаах" : locale === "ko" ? "닫기" : "Dismiss"}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
