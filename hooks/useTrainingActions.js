"use client";
import { useCallback, useRef, useState } from "react";
import { addDoc, collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createChallengeAttemptNotification, createChallengeBeatenNotification } from "@/lib/notifications";
import { getCurrentSeasonId } from "@/lib/season";
import { calculateChallengeXP, getFighterRank, RANK_TIERS } from "@/lib/xp";
import { getChallengeRank } from "@/lib/utils";
import { getChallengeStreakBonus } from "@/lib/trainHelpers";
import { buildDateKeys, commitSessionProgression } from "@/lib/scoreClient";
import { writeChallengeAttempt, updateUserTrainingProfile } from "@/lib/analytics";
import { checkAndAwardBadges } from "@/lib/badges";
import { getLocalDateKey, getPreviousLocalDateKey } from "@/lib/utils";
import { buildTrainingSessionDoc } from "@/lib/trainingSessionDoc";
import { computeFighterDNA, dnaSnapshot } from "@/lib/fighterDNA";
import { computeCombatProgress, progressSnapshot } from "@/lib/combatProgress";
import { isProUser, PRO_STREAK_SAVES } from "@/lib/pro";

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
  const [saveFailed, setSaveFailed] = useState(false);
  const [savedAttemptNumber, setSavedAttemptNumber] = useState(null);
  const [challengeSaving, setChallengeSaving] = useState(false);
  const [challengeSaved, setChallengeSaved] = useState(false);
  const [missionJustCompleted, setMissionJustCompleted] = useState(false);
  const [missionStreakBonus, setMissionStreakBonus] = useState(0);
  const [missionNewStreak, setMissionNewStreak] = useState(0);
  const [streakFreezeUsed, setStreakFreezeUsed] = useState(false);
  const [rankUpInfo, setRankUpInfo] = useState(null);
  // The round is in History but the server hasn't confirmed its XP (scoring call failed).
  const [xpPending, setXpPending] = useState(false);
  // What the server really awarded for this round (null until it answers).
  const [awardedXp, setAwardedXp] = useState(null);
  // One round = one saved document. Set once the round's doc exists; a second "save" (retry)
  // re-posts that id for scoring instead of writing the round again.
  const savedSessionRef = useRef(null); // { id, attemptNumber }
  // Bumped when a new round starts: a save still running for the previous round must not write
  // its "saved" state into the next one.
  const roundTokenRef = useRef(0);
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
      // Server-authoritative path: the server recomputes XP + streak and writes
      // users.xp + challenge_results via the service account (rules will block
      // the client from writing these). Falls back to the legacy client
      // transaction only while the server path isn't configured yet.
      const dateKeys = buildDateKeys();
      const srv = await commitSessionProgression(user, {
        type: "challenge",
        score: result.score,
        challengeId,
        locale,
        dateKeys,
      });
      if (srv.ok) {
        const cel = srv.celebration || {};
        setChallengeSaved(true);
        if (cel.rankUpKey) {
          const r = RANK_TIERS.find((x) => x.key === cel.rankUpKey);
          if (r) setRankUpInfo(r);
        }
        return;
      }

      // ── Fallback: legacy client transaction — ONLY when server scoring is not configured. A
      //    refusal (challenges off, daily cap) or a transient failure must not be worked around
      //    by writing XP from the client. ──
      if (srv.code !== "not_configured") throw new Error("score-failed");
      const rank = getChallengeRank(result.score);
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

    const token = roundTokenRef.current;
    const live = () => roundTokenRef.current === token; // still the same round on screen?

    setSaving(true);
    setSaveFailed(false);
    setError("");

    try {
      // ── 1. The round itself: written once. A retry reuses the saved document. ──
      let sessionId;
      let attemptNumber;
      // A retry (XP re-ask) must not repeat what the first save already did after the write.
      const firstSave = !savedSessionRef.current;
      if (savedSessionRef.current) {
        ({ id: sessionId, attemptNumber } = savedSessionRef.current);
      } else {
        const previousSessionsSnap = await getDocs(query(
          collection(db, "training_sessions"),
          where("userId", "==", user.uid),
          where("reelId", "==", reelId)
        ));
        const previousAttempts = previousSessionsSnap.docs
          .map((d) => d.data())
          .filter((session) => session.type === "training").length;
        attemptNumber = previousAttempts + 1;

        // Note: xpGained is NOT written here — the server stamps the authoritative
        // value (rules forbid the client from setting it). This is what getAccountXp
        // sums, so letting the client set it would be a canonical-XP cheat.
        const trainingRef = await addDoc(collection(db, "training_sessions"), {
          ...buildTrainingSessionDoc({
            uid: user.uid, result, reelId, attemptNumber, locale,
            drillId, drillConfig, tag, readiness, movementEvents, poseMetrics,
          }),
          createdAt: serverTimestamp(),
        });
        sessionId = trainingRef.id;
        if (live()) savedSessionRef.current = { id: sessionId, attemptNumber };
      }

      // ── 2. XP / streak: the server decides. From here on the round IS saved; a scoring
      //    failure must never be reported as "save failed" (that made "Retry" write it twice). ──
      const todayKey = getLocalDateKey();
      const yesterdayKey = getPreviousLocalDateKey();
      const userRef = doc(db, "users", user.uid);
      let userData = {};
      let userLoaded = false;
      try {
        const userSnap = await getDoc(userRef);
        userData = userSnap.exists() ? userSnap.data() : {};
        userLoaded = true;
      } catch { /* the server reads its own copy */ }
      const alreadyCompleted = userData.dailyMissionCompleted === todayKey;

      const dateKeys = buildDateKeys();
      const commit = () => commitSessionProgression(user, {
        type: "mission",
        locale,
        dateKeys,
        trainingSessionId: sessionId,
        score: result.score,
      });
      let srv = await commit();
      // One quiet retry for a transient failure (network blip, cold start). The server awards a
      // session only once, so repeating the call is safe.
      if (!srv.ok && srv.code === "error") {
        await new Promise((r) => setTimeout(r, 1500));
        srv = await commit();
      }
      if (!live()) return; // the user already started another round

      if (srv.ok) {
        setXpPending(false);
        setAwardedXp(Number.isFinite(Number(srv.trainingXpGained)) ? Number(srv.trainingXpGained) : 0);
        const cel = srv.celebration || {};
        if (cel.missionJustCompleted) {
          setMissionJustCompleted(true);
          setMissionStreakBonus(cel.streakBonus || 0);
          setMissionNewStreak(cel.newStreak || 0);
          setStreakFreezeUsed(!!cel.freezeUsed);
          if (cel.rankUpKey) {
            const r = RANK_TIERS.find((x) => x.key === cel.rankUpKey);
            if (r) setTimeout(() => setRankUpInfo(r), 1200);
          }
        }
      } else if (srv.code === "not_configured") {
        // Server scoring isn't set up (no service account): the legacy client write. Once the
        // rules that make XP server-only are deployed this write is refused — then the round is
        // simply saved, not "failed". Nothing to retry here: asking again gives the same answer.
        setXpPending(false);
        try {
          // Never compute XP / streak from a profile that could not be read: it would write
          // first-day values over the real ones.
          if (!userLoaded) throw new Error("user doc not read");
          if (!alreadyCompleted) {
        const MISSION_XP = 50;
            const lastDate = String(userData.lastTrainingDate || "");
            const currentStreak = Number(userData.dailyStreak) || 0;

            // ── Streak Protection (Pro perk) ──────────────────────────────────
            // Pro/Champion get 2 streak freezes per month. Missing exactly one day
            // consumes a freeze instead of resetting the streak to 1.
            const isPro = isProUser(userData);
            const monthKey = todayKey.slice(0, 7); // YYYY-MM
            let freezes = Number(userData.streakFreezes);
            if (userData.streakFreezeMonth !== monthKey || !Number.isFinite(freezes)) {
              freezes = isPro ? PRO_STREAK_SAVES : 0; // replenish monthly allowance
            }
            const twoDaysAgoKey = getLocalDateKey(new Date(Date.now() - 2 * 86400000));

            let newStreak;
            let freezeUsed = false;
            let freezesLeft = freezes;
            if (lastDate === yesterdayKey) {
              newStreak = currentStreak + 1;
            } else if (isPro && freezes > 0 && currentStreak > 0 && lastDate === twoDaysAgoKey) {
              // Missed exactly one day — a freeze saves the streak.
              newStreak = currentStreak + 1;
              freezeUsed = true;
              freezesLeft = freezes - 1;
            } else {
              newStreak = 1;
            }

            const streakBonus = newStreak === 3 ? 100 : newStreak === 7 ? 250 : 0;
            const totalBonus = MISSION_XP + streakBonus;
            const currentStoredXP = Number(userData.xp) || 0;
            const newBest = Math.max(newStreak, Number(userData.bestDailyStreak) || 0);

            const newXP = currentStoredXP + totalBonus;
            await setDoc(userRef, {
              dailyMissionCompleted: todayKey,
              lastTrainingDate: todayKey,
              dailyStreak: newStreak,
              bestDailyStreak: newBest,
              streakFreezes: freezesLeft,
              streakFreezeMonth: monthKey,
              xp: newXP,
              updatedAt: serverTimestamp(),
            }, { merge: true });

            // Rank-up detection
            const prevTrainRank = getFighterRank(currentStoredXP);
            const newTrainRank = getFighterRank(newXP);
            if (prevTrainRank.key !== newTrainRank.key) { setTimeout(() => setRankUpInfo(newTrainRank), 1200); }

            setMissionJustCompleted(true);
            setMissionStreakBonus(streakBonus);
            setMissionNewStreak(newStreak);
            setStreakFreezeUsed(freezeUsed);
          } else {
            await setDoc(userRef, { lastTrainingDate: todayKey }, { merge: true });
          }
        } catch { /* the round is saved; XP stays with the server */ }
      } else {
        setXpPending(true);
      }
      if (!live()) return;

      setSaved(true);
      setSavedAttemptNumber(attemptNumber);

      // Training profile + badges: with the first save, and again when a retry finally got the
      // award (the first pass then ran with the streak from before it). The streak comes from
      // the server's answer when it has one. Both writes are idempotent; fire and forget.
      if (firstSave || srv.ok) {
        let newStreak = srv.ok ? Number(srv.authoritative?.dailyStreak ?? srv.celebration?.newStreak) || 0 : 0;
        if (!newStreak) {
          // A late read error here must not turn a saved round into "save failed".
          try { newStreak = Number((await getDoc(userRef)).data()?.dailyStreak) || 1; } catch { newStreak = 1; }
        }
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
      }
      if (!firstSave) return; // everything below ran with the first save

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
          // Needs the stored XP: skipped when the profile could not be read (it would be
          // recomputed from 0 and written over the real one).
          if (userLoaded) {
            const prog     = computeCombatProgress({ sessions: sessionsForStats, streakDays: 0, locale, xp: Number(userData.xp) || 0 });
            const progSnap = progressSnapshot(prog);
            if (progSnap) {
              await setDoc(userRef, { combatProgress: progSnap }, { merge: true });
            }
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
      if (!live()) return;
      if (savedSessionRef.current) {
        // The round's document exists — it is saved; only what came after it failed.
        setSaved(true);
        setSavedAttemptNumber(savedSessionRef.current.attemptNumber);
      } else {
        setSaveFailed(true);
        setError(t("trainSaveFailed"));
      }
    } finally {
      if (live()) setSaving(false);
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
      let videoURL = null, thumbnailURL = null, durationSeconds = null;
      if (videoBlob) {
        try {
          const { uploadVideoToFeed } = await import("@/lib/uploadVideo");
          const up = await uploadVideoToFeed({ videoBlob, thumbnailBlob, userId: user.uid });
          videoURL = up.videoURL;
          thumbnailURL = up.thumbnailURL;
          durationSeconds = up.durationSeconds;
        } catch { /* video upload non-fatal */ }
      }
      const { shareAcademyToFeed } = await import("@/lib/shareToFeed");
      const id = await shareAcademyToFeed({ user, result, poseMetrics, drillConfig, academyLesson, locale, videoURL, thumbnailURL, durationSeconds });
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
    roundTokenRef.current += 1;     // any save still running belongs to the old round
    savedSessionRef.current = null;
    setXpPending(false);
    setAwardedXp(null);
    setSaving(false);
    setSaved(false);
    setSaveFailed(false);
    setSavedAttemptNumber(null);
    setChallengeSaving(false);
    setChallengeSaved(false);
    challengeSavedRef.current = false;
    setMissionJustCompleted(false);
    setMissionStreakBonus(0);
    setMissionNewStreak(0);
    setStreakFreezeUsed(false);
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
    saving, saved, saveFailed, savedAttemptNumber, xpPending, awardedXp,
    challengeSaving, challengeSaved, challengeSavedRef,
    missionJustCompleted, missionStreakBonus, missionNewStreak, streakFreezeUsed,
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
