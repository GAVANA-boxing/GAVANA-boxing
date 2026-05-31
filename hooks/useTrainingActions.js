"use client";
import { useCallback, useRef, useState } from "react";
import { addDoc, collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createChallengeAttemptNotification, createChallengeBeatenNotification } from "@/lib/notifications";
import { getCurrentSeasonId } from "@/lib/season";
import { calculateChallengeXP, getFighterRank } from "@/lib/xp";
import { getChallengeRank } from "@/lib/utils";
import { getChallengeComparisonPercent, getChallengeStreakBonus } from "@/lib/trainHelpers";
import { writeChallengeAttempt, updateUserTrainingProfile } from "@/lib/analytics";
import { checkAndAwardBadges } from "@/lib/badges";
import { getLocalDateKey, getPreviousLocalDateKey } from "@/lib/utils";
import { getSessionIdentity, buildMovementCounts, buildMovementMetrics } from "@/lib/combatMemory";
import { generateTechniqueReview } from "@/lib/techniqueReview";
import { computeFighterDNA, dnaSnapshot } from "@/lib/fighterDNA";
import { computeCombatProgress, progressSnapshot } from "@/lib/combatProgress";

export function useTrainingActions({
  user,
  locale,
  result,
  reelId,
  drillId,
  drillConfig,
  challengeId,
  activeChallenge,
  activeChallengeName,
  creatorBestScore,
  trainSourceUserId,
  currentXP,
  t,
  router,
  setError,
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedAttemptNumber, setSavedAttemptNumber] = useState(null);
  const [challengeSaving, setChallengeSaving] = useState(false);
  const [challengeSaved, setChallengeSaved] = useState(false);
  const [missionJustCompleted, setMissionJustCompleted] = useState(false);
  const [missionStreakBonus, setMissionStreakBonus] = useState(0);
  const [missionNewStreak, setMissionNewStreak] = useState(0);
  const [rankUpInfo, setRankUpInfo] = useState(null);
  const challengeSavedRef = useRef(false);
  const [feedSharing,       setFeedSharing]       = useState(false);
  const [feedShared,        setFeedShared]        = useState(false);
  const [sharedReelId,      setSharedReelId]      = useState(null);
  const feedSharedRef = useRef(false);
  const [challengePosting,          setChallengePosting]          = useState(false);
  const [challengePosted,           setChallengePosted]           = useState(false);
  const [challengePostId,           setChallengePostId]           = useState(null);
  const challengePostRef = useRef(false);
  const [challengeResponsePosting,  setChallengeResponsePosting]  = useState(false);
  const [challengeResponsePosted,   setChallengeResponsePosted]   = useState(false);
  const [challengeResponseId,       setChallengeResponseId]       = useState(null);
  const challengeResponseRef = useRef(false);

  const handleShareChallenge = useCallback(async () => {
    if (!result) return;

    const text = t("challengeShareText")
      .replace("{score}", result.score.toFixed(1))
      .replace("{challengeName}", activeChallengeName);

    try {
      if (navigator.share) {
        await navigator.share({
          title: activeChallengeName || t("challengesTitle"),
          text,
        });
        return;
      }

      await navigator.clipboard.writeText(text);
      setError(t("shareLinkCopied"));
    } catch (err) {
      setError(t("shareFailed"));
    }
  }, [result, t, activeChallengeName, setError]);

  const handleChallengeFriend = useCallback(async () => {
    if (!result || !activeChallenge || !challengeId) return;

    const scoreText = result.score.toFixed(1);
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/train?challengeId=${encodeURIComponent(challengeId)}&score=${encodeURIComponent(scoreText)}`
      : "";
    const text = t("challengeFriendShareText")
      .replace("{score}", scoreText)
      .replace("{challengeName}", activeChallengeName);
    const fallbackText = url ? `${text}\n${url}` : text;

    try {
      if (navigator.share) {
        await navigator.share({
          title: activeChallengeName || t("challengesTitle"),
          text,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(fallbackText);
      setError(t("shareLinkCopied"));
    } catch (err) {
      setError(t("shareFailed"));
    }
  }, [result, activeChallenge, challengeId, locale, t, activeChallengeName, setError]);

  const handleSaveChallengeResult = useCallback(async () => {
    if (!activeChallenge || !challengeId || !result) return;

    if (!user?.uid) {
      router.push(`/${locale}/login`);
      return;
    }

    if (challengeSavedRef.current || challengeSaved) return;

    challengeSavedRef.current = true;
    setChallengeSaving(true);
    setError("");

    try {
      const rank = getChallengeRank(result.score);
      const comparisonPercent = getChallengeComparisonPercent(result.score);
      const xpGained = calculateChallengeXP(result.score, rank);

      let rankUpData = null;
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", user.uid);
        const challengeResultRef = doc(collection(db, "challenge_results"));
        const userSnap = await transaction.get(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        const todayKey = getLocalDateKey();
        const yesterdayKey = getPreviousLocalDateKey();
        const lastChallengeDate = String(userData.lastChallengeDate || "");
        const currentStreak = Number(userData.challengeStreak) || 0;
        const isSameDay = lastChallengeDate === todayKey;
        const nextStreak = isSameDay
          ? currentStreak
          : lastChallengeDate === yesterdayKey
            ? currentStreak + 1
            : 1;
        const streakBonusXP = isSameDay ? 0 : getChallengeStreakBonus(nextStreak);
        const totalChallengeXP = xpGained + streakBonusXP;
        const nextXP = Math.round((Number(userData.xp) || 0) + totalChallengeXP);
        const nextCompleted = Math.round((Number(userData.totalChallengesCompleted) || 0) + 1);
        const prevRank = getFighterRank(Number(userData.xp) || 0);
        const nextRank = getFighterRank(nextXP);
        if (prevRank.key !== nextRank.key) rankUpData = nextRank;

        transaction.set(challengeResultRef, {
          userId: user.uid,
          challengeId,
          score: result.score,
          rank,
          comparisonPercent,
          xpGained: totalChallengeXP,
          baseXP: xpGained,
          streakBonusXP,
          challengeStreak: nextStreak,
          seasonId: getCurrentSeasonId(),
          createdAt: serverTimestamp(),
          locale,
        });

        transaction.set(userRef, {
          xp: nextXP,
          rank: nextRank.key,
          rankName: nextRank.key.replace(/^rank/, ""),
          totalChallengesCompleted: nextCompleted,
          challengeStreak: nextStreak,
          lastChallengeDate: todayKey,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      });

      setChallengeSaved(true);
      if (rankUpData) setRankUpInfo(rankUpData);
    } catch (err) {
      challengeSavedRef.current = false;
      setError(t("challengeSaveFailed"));
    } finally {
      setChallengeSaving(false);
    }
  }, [activeChallenge, challengeId, result, user, locale, router, t, setError, challengeSaved]);

  const handleShareTraining = useCallback(async () => {
    if (!result) return;

    const scoreStr = result.score.toFixed(1);
    const baseText = t("shareChallengeResult")
      ? `${t("shareChallengeResult")} — ${scoreStr}/10 🥊`
      : `I scored ${scoreStr}/10 in GAVANA 🥊 Can you beat me?`;

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({ score: scoreStr });
    if (reelId) params.set("reelId", reelId);
    if (user?.uid) params.set("challengeUserId", user.uid);
    const challengeUrl = reelId ? `${baseUrl}/${locale}/train?${params.toString()}` : "";
    const fullText = challengeUrl ? `${baseText}\n${challengeUrl}` : baseText;

    try {
      if (navigator.share) {
        await navigator.share({ title: "GAVANA Boxing", text: baseText, ...(challengeUrl ? { url: challengeUrl } : {}) });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullText);
        setError(t("shareLinkCopied"));
        return;
      }
      setError(t("shareFailed"));
    } catch (err) {
      setError(t("shareFailed"));
    }
  }, [result, t, reelId, user, locale, setError]);

  const handleSave = useCallback(async ({ movementEvents = [], tag = null, readiness = null, poseMetrics = null, priorSessions = [] } = {}) => {
    if (!user?.uid || !result) return;

    setSaving(true);
    setError("");

    try {
      const previousSessionsSnap = await getDocs(query(
        collection(db, "training_sessions"),
        where("userId", "==", user.uid),
        where("reelId", "==", reelId)
      ));
      const previousAttempts = previousSessionsSnap.docs
        .map((d) => d.data())
        .filter((session) => session.type === "training").length;
      const attemptNumber = previousAttempts + 1;

      // Enriched combat memory fields
      const sessionIdentity  = getSessionIdentity(result.score, movementEvents, poseMetrics);
      const movementCounts   = buildMovementCounts(movementEvents);
      const movementMetrics  = buildMovementMetrics(movementCounts);

      await addDoc(collection(db, "training_sessions"), {
        userId: user.uid,
        reelId,
        score: result.score,
        xpGained: result.xpGained,
        attemptNumber,
        rankProgress: result.rankProgress,
        breakdown: result.breakdown || null,
        hitCount: result.hitCount || 0,
        createdAt: serverTimestamp(),
        type: "training",
        locale,
        source: "train_screen",
        ...(tag ? { sessionTag: tag } : {}),
        ...(readiness?.energy ? { readiness } : {}),
        // Combat memory
        sessionIdentity,
        drillId: drillId || "default",
        durationSeconds: drillConfig?.durationSeconds || 10,
        movementCounts,
        ...movementMetrics,
        // Pose metrics (null if MediaPipe unavailable)
        ...(poseMetrics ? { poseMetrics } : {}),
        // Lightweight technique review (skip heavy arrays)
        ...(() => {
          if (!poseMetrics) return {};
          const rev = generateTechniqueReview({ poseMetrics, result, locale });
          if (rev.lowData) return {};
          return {
            techniqueReview: {
              title: rev.title,
              priorityWeakness: rev.priorityWeakness,
              drill: rev.drill,
              coachTone: rev.coachTone,
              strengths: rev.strengths,
            },
          };
        })(),
      });

      // Daily mission completion
      const todayKey = getLocalDateKey();
      const yesterdayKey = getPreviousLocalDateKey();
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      const alreadyCompleted = userData.dailyMissionCompleted === todayKey;

      if (!alreadyCompleted) {
        const MISSION_XP = 50;
        const lastDate = String(userData.lastTrainingDate || "");
        const currentStreak = Number(userData.dailyStreak) || 0;
        const newStreak = lastDate === yesterdayKey ? currentStreak + 1 : 1;
        const streakBonus = newStreak === 3 ? 100 : newStreak === 7 ? 250 : 0;
        const totalBonus = MISSION_XP + streakBonus;
        const currentStoredXP = Number(userData.xp) || 0;
        const newBest = Math.max(newStreak, Number(userData.bestDailyStreak) || 0);

        await setDoc(userRef, {
          dailyMissionCompleted: todayKey,
          lastTrainingDate: todayKey,
          dailyStreak: newStreak,
          bestDailyStreak: newBest,
          xp: currentStoredXP + totalBonus,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        setMissionJustCompleted(true);
        setMissionStreakBonus(streakBonus);
        setMissionNewStreak(newStreak);
      } else {
        // Still update lastTrainingDate even if mission already completed today
        await setDoc(userRef, { lastTrainingDate: todayKey }, { merge: true });
      }

      setSaved(true);
      setSavedAttemptNumber(attemptNumber);

      // Fighter DNA + Combat Progress — compute from prior sessions + this result and save to user doc
      try {
        const sessionsForStats = [
          ...priorSessions.slice(0, 9),
          { score: result.score, breakdown: result.breakdown, poseMetrics },
        ].filter((s) => typeof s.score === "number");
        if (sessionsForStats.length >= 3) {
          const dna  = computeFighterDNA({ sessions: sessionsForStats, locale });
          const snap = dnaSnapshot(dna);
          if (snap) {
            await setDoc(userRef, { fighterDNA: snap, fighterDnaUpdatedAt: serverTimestamp() }, { merge: true });
          }
          const prog     = computeCombatProgress({ sessions: sessionsForStats, streakDays: 0, locale });
          const progSnap = progressSnapshot(prog);
          if (progSnap) {
            await setDoc(userRef, { combatProgress: progSnap }, { merge: true });
          }
        }
      } catch { /* non-critical */ }

      // Analytics + badges (non-critical, fire and forget)
      if (reelId) {
        writeChallengeAttempt({
          userId: user.uid,
          reelId,
          score: result.score,
          hitCount: result.hitCount || 0,
          attemptNumber,
        }).catch(() => {});
      }

      const newStreak = Number((await getDoc(doc(db, "users", user.uid))).data()?.dailyStreak) || 1;
      const breakdown = result.breakdown || {};
      updateUserTrainingProfile(user.uid, {
        lastScore: result.score,
        dailyStreak: newStreak,
        totalAttempts: attemptNumber,
      }).catch(() => {});

      checkAndAwardBadges(user.uid, {
        totalAttempts: attemptNumber,
        dailyStreak: newStreak,
        accuracy: breakdown.accuracy,
        speed: breakdown.speed,
        category: "boxing",
      }).catch(() => {});

      // Notify the reel creator that someone attempted their challenge
      if (reelId && trainSourceUserId) {
        createChallengeAttemptNotification({
          reelCreatorId: trainSourceUserId,
          actorId: user.uid,
          actorName: user.displayName || user.email?.split("@")[0] || "Someone",
          actorPhotoURL: user.photoURL || "",
          reelId,
          score: result.score,
        }).catch(() => {});

        // Notify creator if challenger beats their best score
        if (creatorBestScore != null && result.score > creatorBestScore) {
          createChallengeBeatenNotification({
            reelCreatorId: trainSourceUserId,
            actorId: user.uid,
            actorName: user.displayName || user.email?.split("@")[0] || "Someone",
            actorPhotoURL: user.photoURL || "",
            reelId,
            score: result.score,
          }).catch(() => {});
        }
      }
    } catch (err) {
      setError(t("trainSaveFailed"));
    } finally {
      setSaving(false);
    }
  }, [user, result, reelId, drillId, drillConfig, locale, t, setError, trainSourceUserId, creatorBestScore]);

  const handleCreateChallengePost = useCallback(async ({ poseMetrics = null, academyLesson = null } = {}) => {
    if (!user?.uid || !result) return;
    if (challengePostRef.current) return;

    challengePostRef.current = true;
    setChallengePosting(true);
    setError("");

    try {
      const { createChallengePost } = await import("@/lib/shareToFeed");
      const id = await createChallengePost({ user, result, poseMetrics, academyLesson, locale });
      setChallengePostId(id);
      setChallengePosted(true);
    } catch {
      challengePostRef.current = false;
      setError(
        locale === "mn" ? "Challenge үүсгэхэд алдаа гарлаа" :
        locale === "ko" ? "챌린지 생성 실패" :
        "Failed to create challenge"
      );
    } finally {
      setChallengePosting(false);
    }
  }, [user, result, locale, setError]);

  const handleShareAcademyToFeed = useCallback(async ({ poseMetrics = null, academyLesson = null, videoBlob = null, thumbnailBlob = null } = {}) => {
    if (!user?.uid || !result || !academyLesson) return;
    if (feedSharedRef.current) return;

    feedSharedRef.current = true;
    setFeedSharing(true);
    setError("");

    try {
      let videoURL = null, thumbnailURL = null;
      if (videoBlob) {
        try {
          const { uploadVideoToFeed } = await import("@/lib/uploadVideo");
          const up = await uploadVideoToFeed({ videoBlob, thumbnailBlob, userId: user.uid });
          videoURL = up.videoURL;
          thumbnailURL = up.thumbnailURL;
        } catch { /* video upload non-fatal */ }
      }
      const { shareAcademyToFeed } = await import("@/lib/shareToFeed");
      const id = await shareAcademyToFeed({ user, result, poseMetrics, drillConfig, academyLesson, locale, videoURL, thumbnailURL });
      setSharedReelId(id);
      setFeedShared(true);
    } catch {
      feedSharedRef.current = false;
      setError(
        locale === "mn" ? "Feed-д нийтлэхэд алдаа гарлаа" :
        locale === "ko" ? "피드 공유 실패" :
        "Failed to share to feed"
      );
    } finally {
      setFeedSharing(false);
    }
  }, [user, result, drillConfig, locale, setError]);

  const handleShareToFeed = useCallback(async ({ poseMetrics = null, videoBlob = null, thumbnailBlob = null } = {}) => {
    if (!user?.uid || !result) return;
    if (feedSharedRef.current) return;

    feedSharedRef.current = true;
    setFeedSharing(true);
    setError("");

    try {
      let videoURL = null, thumbnailURL = null, durationSeconds = null;
      if (videoBlob) {
        try {
          const { uploadVideoToFeed } = await import("@/lib/uploadVideo");
          const up = await uploadVideoToFeed({ videoBlob, thumbnailBlob, userId: user.uid });
          videoURL = up.videoURL;
          thumbnailURL = up.thumbnailURL;
          durationSeconds = up.durationSeconds;
        } catch { /* video upload non-fatal — share text-only */ }
      }
      const { shareTrainingToFeed } = await import("@/lib/shareToFeed");
      const id = await shareTrainingToFeed({ user, result, poseMetrics, drillConfig, locale, videoURL, thumbnailURL, durationSeconds });
      setSharedReelId(id);
      setFeedShared(true);
    } catch {
      feedSharedRef.current = false;
      setError(
        locale === "mn" ? "Feed-д нийтлэхэд алдаа гарлаа" :
        locale === "ko" ? "피드 공유 실패" :
        "Failed to share to feed"
      );
    } finally {
      setFeedSharing(false);
    }
  }, [user, result, drillConfig, locale, setError]);

  const handlePostChallengeResponse = useCallback(async ({ challengePostData = null } = {}) => {
    if (!user?.uid || !result || !challengePostData?.id) return;
    if (challengeResponseRef.current) return;

    challengeResponseRef.current = true;
    setChallengeResponsePosting(true);
    setError("");

    try {
      const { createChallengeResponse } = await import("@/lib/shareToFeed");
      const id = await createChallengeResponse({ user, result, challengePostData, locale });
      setChallengeResponseId(id);
      setChallengeResponsePosted(true);
    } catch {
      challengeResponseRef.current = false;
      setError(
        locale === "mn" ? "Challenge хариу илгээхэд алдаа гарлаа" :
        locale === "ko" ? "챌린지 응답 실패" :
        "Failed to post challenge response"
      );
    } finally {
      setChallengeResponsePosting(false);
    }
  }, [user, result, locale, setError]);

  const resetForNewSession = useCallback(() => {
    setSaving(false);
    setSaved(false);
    setSavedAttemptNumber(null);
    setChallengeSaving(false);
    setChallengeSaved(false);
    challengeSavedRef.current = false;
    setMissionJustCompleted(false);
    setMissionStreakBonus(0);
    setMissionNewStreak(0);
    setRankUpInfo(null);
    setFeedSharing(false);
    setFeedShared(false);
    setSharedReelId(null);
    feedSharedRef.current = false;
    setChallengePosting(false);
    setChallengePosted(false);
    setChallengePostId(null);
    challengePostRef.current = false;
    setChallengeResponsePosting(false);
    setChallengeResponsePosted(false);
    setChallengeResponseId(null);
    challengeResponseRef.current = false;
  }, []);

  return {
    saving, saved, savedAttemptNumber,
    challengeSaving, challengeSaved, challengeSavedRef,
    missionJustCompleted, missionStreakBonus, missionNewStreak,
    rankUpInfo,
    handleSave, handleSaveChallengeResult,
    handleShareChallenge, handleChallengeFriend, handleShareTraining,
    feedSharing, feedShared, sharedReelId,
    handleShareToFeed, handleShareAcademyToFeed,
    challengePosting, challengePosted, challengePostId,
    handleCreateChallengePost,
    challengeResponsePosting, challengeResponsePosted, challengeResponseId,
    handlePostChallengeResponse,
    resetForNewSession,
  };
}
