"use client";

import { useEffect, useState } from "react";
import styles from "@/components/train/trainStyles";
import { computeScoreConfidence, roundPunchCount } from "@/lib/scoreConfidence";
import {
  useCountUp, getIdentityWithSub, computeComparison,
  getBestPunchType, getMovementSummary,
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
import MotionReplay3D        from "@/components/train/MotionReplay3D";
import PunchTeardown         from "@/components/train/PunchTeardown";
import { loc }               from "@/lib/loc";
import { BRAND, btnSecondary } from "@/components/ui/brand";
import { SITE_URL, SITE_HOST } from "@/lib/site";
import { archetypeName } from "@/lib/archetypes";

const MIN_PUNCHES = 5;

export default function TrainResultModal({
  motionReplay = null,
  debrief = null,
  debriefSource = null,
  debriefLoading = false,
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
  streakFreezeUsed,
  movementEvents,
  sessionStartTime,
  poseMetrics = null,
  prevPoseMetrics = null,
  userStreak = 0,
  error,
  saving,
  saved,
  saveFailed = false,
  savedAttemptNumber,
  xpPending = false,
  awardedXp = null,
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
  const _punchCount  = roundPunchCount(poseMetrics, result?.hitCount);
  const _scoreConf   = computeScoreConfidence(
    _punchCount,
    poseMetrics?.sessionConfidence ?? null,
    poseMetrics?.cameraQuality    ?? null,
  );
  // result.score is already the round's final (confidence-capped) score — set once by the
  // Train page via finalRoundScore — so this screen, the toast, the save and XP all agree.
  const _cappedScore = result ? result.score : 0;
  const displayScore = useCountUp(_cappedScore);

  // ── Local state ─────────────────────────────────────────────────────────
  const [sessionTag,    setSessionTag]    = useState(null);
  const [clipDuration,  setClipDuration]  = useState(null);
  const [showDnaShare,  setShowDnaShare]  = useState(false);
  const [replayOpen,    setReplayOpen]    = useState(false);
  const [teardownOpen,  setTeardownOpen]  = useState(false);
  const [detailsOpen,   setDetailsOpen]   = useState(false);
  const [shareCopied,   setShareCopied]   = useState(false);
  const [blobUrl,      setBlobUrl]      = useState(null);

  useEffect(() => {
    if (!recordedBlob) { setBlobUrl(null); setClipDuration(null); return; }
    setClipDuration(null);
    const url = URL.createObjectURL(recordedBlob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recordedBlob]);

  // Challenge / PvP outcomes and level-ups live in the details: never hide those.
  const mustShowDetails = Boolean(challengeUserId || activeChallenge || pvpResult || rankUpInfo || missionJustCompleted);
  useEffect(() => { if (mustShowDetails) setDetailsOpen(true); }, [mustShowDetails]);

  // The DNA share card opens from the Share button (no auto-popup: after a round the
  // result itself comes first, and at most one celebration shows).

  if (!result) return null;

  // ── Derived values ───────────────────────────────────────────────────────
  const effectivePunchCount = _punchCount;
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
  const effectiveStreak = Math.max(userStreak || 0, missionNewStreak || 0);

  const headerMode = challengeUserId ? "pvp" : activeChallenge ? "challenge" : "train";
  // A failed AI call is our problem, not the fighter's: show nothing rather than an error.
  const showDebrief = !tooFewPunches && (debriefLoading || (debrief && debriefSource !== "error"));

  return (
    <div style={styles.modalWrap}>
      <style>{`@keyframes dotBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
      <div style={styles.modalOverlay} />
      <section style={styles.modal}>

        {/* ── HEADER ───────────────────────────────────────────────── */}
        <ResultHeader
          mode={headerMode}
          punchBreakdown={poseMetrics?.punchBreakdown || null}
          tooFewPunches={tooFewPunches}
          effectivePunchCount={effectivePunchCount}
          minPunches={MIN_PUNCHES}
          identity={identity}
          displayScore={displayScore}
          finalScore={_cappedScore}
          cameraOff={Boolean(result.cameraOff)}
          scoreConf={scoreConf}
          locale={locale}
          t={t}
        />

        {/* ── LOW CONFIDENCE TIPS ──────────────────────────────────── */}
        {isLowConfidence && !tooFewPunches && (
          <ConfidenceTipsBar t={t} />
        )}

        {/* Order: score → the ONE fix → next action → everything else folded away */}
        {poseMetrics && !tooFewPunches && (
          <ActionSummary poseMetrics={poseMetrics} result={result} locale={locale} />
        )}

        {/* ── 3D TECHNIQUE BREAKDOWN — the user's own punches in 3D ─── */}
        {motionReplay && !tooFewPunches && (
          <div style={{ padding: "12px 20px 0" }}>
            <button type="button" onClick={() => setReplayOpen(true)} style={{ ...btnSecondary, justifyContent: "flex-start", textAlign: "left", minHeight: 60, padding: "10px 14px" }}>
              <span aria-hidden="true" style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 10, display: "grid", placeItems: "center", background: "rgba(255,59,48,0.14)", color: BRAND.red }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.5l8.5 4.75v9.5L12 21.5l-8.5-4.75v-9.5z" /><path d="M12 12l8.5-4.75M12 12v9.5M12 12L3.5 7.25" /></svg>
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>{loc(locale, "Цохилтоо 3D-ээр хар", "펀치를 3D로 보기", "See your punches in 3D")}</span>
                <span style={{ display: "block", fontSize: 13, color: BRAND.faint, marginTop: 2, fontWeight: 500 }}>{loc(locale, "Эргүүлж, удаашруулж, хамгаалалтаа шалга", "돌려보고 슬로모션으로 가드 확인", "Rotate, slow it down, check your guard")}</span>
              </span>
              <span aria-hidden="true" style={{ color: BRAND.faint }}>→</span>
            </button>
            <button type="button" data-testid="open-teardown" onClick={() => setTeardownOpen(true)} style={{ ...btnSecondary, justifyContent: "flex-start", textAlign: "left", minHeight: 60, padding: "10px 14px", marginTop: 8 }}>
              <span aria-hidden="true" style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 10, display: "grid", placeItems: "center", background: "rgba(245,196,81,0.14)", color: BRAND.gold }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l2-6 4 12 2-6h6" /></svg>
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>{loc(locale, "Цохилт задлал", "펀치 분석", "Punch teardown")}</span>
                <span style={{ display: "block", fontSize: 13, color: BRAND.faint, marginTop: 2, fontWeight: 500 }}>{loc(locale, "Бэлтгэл → Эргэлт → Сунгалт → Буцаалт, градус бүрээр", "장전 → 회전 → 뻗기 → 회수, 각도까지", "Load → Rotate → Extend → Return, angle by angle")}</span>
              </span>
              <span aria-hidden="true" style={{ color: BRAND.faint }}>→</span>
            </button>
          </div>
        )}

        {/* ── AI DEBRIEF ───────────────────────────────────────────── */}
        {showDebrief && (
          <AIDebriefCard
            debrief={debrief}
            debriefLoading={debriefLoading}
            debriefSource={debriefSource}
            locale={locale}
          />
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
          saveFailed={saveFailed}
          savedAttemptNumber={savedAttemptNumber}
          xpPending={xpPending}
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
          onShareTraining={userArchetype && _cappedScore > 0 ? () => setShowDnaShare(true) : onShareTraining}
          onShareToFeed={onShareToFeed}
          onCreateChallengePost={onCreateChallengePost}
          onPostChallengeResponse={onPostChallengeResponse}
          locale={locale}
          t={t}
          router={router}
        />

        {/* ── DETAILS — everything else, folded away ─────────────────── */}
        <div style={{ padding: "0 20px 8px" }}>
          <button
            type="button"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((v) => !v)}
            style={{ ...btnSecondary, background: "transparent", border: "none", minHeight: 44, color: BRAND.muted, fontSize: 14 }}
          >
            {detailsOpen
              ? loc(locale, "Дэлгэрэнгүйг хаах", "자세히 닫기", "Hide details")
              : loc(locale, "Дэлгэрэнгүй шинжилгээ", "자세한 분석", "Full analysis")}
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ transform: detailsOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>
        {detailsOpen && (
          <div>
        {/* ── RETURN SUMMARY ───────────────────────────────────────── */}
        {!tooFewPunches && (
          <ReturnSummary
            result={result}
            sessionHistory={sessionHistory}
            ghostBestScore={ghostBestScore}
            effectivePunchCount={effectivePunchCount}
            bestPunch={bestPunch}
            effectiveStreak={effectiveStreak}
            t={t}
          />
        )}

        {/* ── PUNCH PATTERN (Fighter DNA seed) ─────────────────────── */}
        {poseMetrics && !tooFewPunches && scoreConf !== "none" && (
          <PunchPatternCard poseMetrics={poseMetrics} t={t} />
        )}

        {/* ── COACH REVIEW ─────────────────────────────────────────── */}
        {poseMetrics && !tooFewPunches && (
          <CoachReviewCard poseMetrics={poseMetrics} result={result} locale={locale} />
        )}

        {/* ── ACADEMY LESSON REVIEW ────────────────────────────────── */}
        {academyLesson && !tooFewPunches && (
          <AcademyLessonCard
            academyLesson={academyLesson}
            result={result}
            punches={effectivePunchCount}
            locale={locale}
            router={router}
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
          streakFreezeUsed={streakFreezeUsed}
          rankUpInfo={rankUpInfo}
          saved={saved}
          awardedXp={awardedXp}
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
          </div>
        )}

      </section>

      {/* ── 3D REPLAY ───────────────────────────────────────────────── */}
      {replayOpen && motionReplay && (
        <MotionReplay3D replay={motionReplay} locale={locale} onClose={() => setReplayOpen(false)} />
      )}
      {teardownOpen && motionReplay && (
        <PunchTeardown replay={motionReplay} locale={locale} onClose={() => setTeardownOpen(false)} />
      )}

      {/* ── DNA SHARE SHEET ──────────────────────────────────────────── */}
      {showDnaShare && (() => {
        const archLabel = archetypeName(userArchetype, locale) || "";
        const shareText = locale === "mn"
          ? `Миний Fighter DNA: ${archLabel} 🥊\nОноо: ${_cappedScore.toFixed(1)}/10\n${SITE_HOST}`
          : locale === "ko"
          ? `내 파이터 DNA: ${archLabel} 🥊\n점수: ${_cappedScore.toFixed(1)}/10\n${SITE_HOST}`
          : `My Fighter DNA: ${archLabel} 🥊\nScore: ${_cappedScore.toFixed(1)}/10\n${SITE_HOST}`;

        const handleShare = async () => {
          if (navigator.share) {
            try { await navigator.share({ text: shareText, url: SITE_URL }); }
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
              <p style={{ margin: "0 0 6px", fontSize: 11.5, fontWeight: 900, letterSpacing: 4, color: "rgba(245,196,81,0.7)", textTransform: "uppercase" }}>
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
                  color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 700,
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
