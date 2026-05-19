"use client";

import { useCallback, useRef, useState } from "react";
import { updateLeaderboard } from "@/components/Leaderboard";
import { getSafeLikeCount, getSafeViewCount, extractFeedbackScore } from "@/lib/reelHelpers";
import { getFirebase } from "@/lib/lazyFirebase";

export function useReelFeedback({ user, router, currentLocale, t, creatorProfiles }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackResult, setFeedbackResult] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [feedbackReel, setFeedbackReel] = useState(null);
  const [sessionXPData, setSessionXPData] = useState(null);
  const feedbackCacheRef = useRef({});

  const handleGetFeedback = useCallback(async (reel) => {
    if (!user?.uid) {
      router.push(`/${currentLocale}/login`);
      return;
    }

    setFeedbackOpen(true);
    setFeedbackReel(reel);
    setSessionXPData(null);

    const cached = feedbackCacheRef.current[reel?.id];
    if (cached) {
      setFeedbackResult(cached);
      setFeedbackLoading(false);
      setFeedbackError("");
      setFeedbackSaved(false);
      return;
    }

    setFeedbackLoading(true);
    setFeedbackError("");
    setFeedbackResult("");
    setFeedbackSaved(false);

    try {
      const caption = reel?.description || reel?.caption || "No caption provided";
      const username = reel?.username || "fighter";
      const likes = getSafeLikeCount(reel);
      const views = getSafeViewCount(reel);
      const ownerId = reel?.userId;

      if (!ownerId || reel?.isDemo) {
        throw new Error("AI feedback is only available for real reels");
      }

      const isOwner = user.uid === ownerId;
      const { db } = await getFirebase();
      const { doc, getDoc, serverTimestamp, setDoc } = await import("firebase/firestore");
      const feedbackRef = doc(db, "ai_feedback", reel.id);
      const existingFeedbackSnap = await getDoc(feedbackRef);
      const existingFeedback = existingFeedbackSnap.exists() ? {
        id: existingFeedbackSnap.id,
        ...existingFeedbackSnap.data(),
      } : null;

      if (existingFeedback?.feedbackText) {
        feedbackCacheRef.current[reel.id] = existingFeedback.feedbackText;
        setFeedbackResult(existingFeedback.feedbackText);
        setFeedbackSaved(false);
        return;
      }

      if (!isOwner) {
        setFeedbackResult(t("reelOwnerNoFeedback"));
        setFeedbackSaved(false);
        return;
      }

      const context = [
        `Username: @${username}`,
        `Caption: ${caption}`,
        `Likes: ${likes}`,
        `Views: ${views}`,
      ].join("\n");

      const feedbackFormatLabels = currentLocale === "mn"
        ? { strength: "Давуу тал", improve: "Сайжруулах", drill: "Дараагийн дасгал" }
        : currentLocale === "ko"
        ? { strength: "강점", improve: "개선점", drill: "다음 훈련" }
        : { strength: "Strength", improve: "Improve", drill: "Next drill" };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: "analyst",
          locale: currentLocale,
          messages: [
            {
              role: "user",
              content: [
                "Give personalized boxing feedback using only the reel metadata below.",
                context,
                "Important: You cannot see the actual video, so do not claim you observed punches, footwork, guard, stance, speed, or technique directly.",
                "Infer likely training focus from the caption and engagement only. If the caption is vague, say what to check rather than pretending to know.",
                "Make the advice feel specific to the username, caption, likes, and views.",
                "Keep it realistic, natural, direct, and coach-like.",
                "Give a realistic score out of 10. Do not make the score too perfect unless the context strongly supports it.",
                "Return exactly this plain format with no markdown, no bold symbols, and no bullet points:",
                "Score: 6.5/10",
                `${feedbackFormatLabels.strength}: one specific strength or positive signal based on the caption/context.`,
                `${feedbackFormatLabels.improve}: one practical thing to watch or refine next time.`,
                `${feedbackFormatLabels.drill}: one simple boxing drill with a clear rep/time target.`,
              ].join("\n"),
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok || data?.fallback) {
        setFeedbackResult(data?.message || t("feedbackUnavailable"));
        setFeedbackSaved(false);
        return;
      }

      const text = data?.content?.find((item) => item?.type === "text")?.text || data?.content?.[0]?.text || "";

      if (!text.trim()) {
        setFeedbackResult(t("feedbackUnavailable"));
        setFeedbackSaved(false);
        return;
      }

      const feedbackText = text.trim();
      feedbackCacheRef.current[reel.id] = feedbackText;
      setFeedbackResult(feedbackText);

      try {
        const parsedScore = extractFeedbackScore(feedbackText);
        const feedbackDoc = {
          userId: ownerId,
          reelId: reel.id,
          feedbackText,
          reelCaption: caption,
          createdAt: serverTimestamp(),
          locale: currentLocale,
        };

        if (typeof parsedScore === "number") {
          feedbackDoc.score = parsedScore;
        }

        await setDoc(feedbackRef, feedbackDoc);

        if (typeof parsedScore === "number") {
          try {
            const { doc: docFn, getDoc: getDocFn } = await import("firebase/firestore");
            const userDoc = await getDocFn(docFn(db, "users", ownerId));
            const userData = userDoc.exists() ? userDoc.data() : {};
            const uname = userData.displayName || userData.username || "Anonymous";
            const photoURL = userData.photoURL || userData.profileImageUrl || "";
            await updateLeaderboard(ownerId, parsedScore, uname, photoURL);
          } catch (leaderboardError) {
            console.error("Failed to update leaderboard:", leaderboardError);
          }
        }

        setFeedbackSaved(true);

        if (typeof parsedScore === "number") {
          try {
            const { calculateSessionXP, calculateUserXP, getFighterRank, getNextRank, getRankProgress } = await import("@/lib/xp");
            const { collection, getDocs, query, where } = await import("firebase/firestore");

            const allSnap = await getDocs(query(collection(db, "ai_feedback"), where("userId", "==", ownerId)));
            const allDocs = allSnap.docs.map((d) => ({ score: d.data().score, createdAt: d.data().createdAt }));

            const sorted = [...allDocs]
              .filter((d) => Number.isFinite(Number(d.score)))
              .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
            const prevScore = sorted.length >= 2 ? Number(sorted[sorted.length - 2].score) : null;

            const streakDays = creatorProfiles[ownerId]?.streakCount || 0;
            const reelLikes = getSafeLikeCount(reel);
            const likeXP = Math.round(reelLikes) * 2;

            const breakdown = calculateSessionXP(parsedScore, prevScore, streakDays);
            const totalXP = calculateUserXP({ aiFeedbackDocs: allDocs, streakDays, likesReceived: reelLikes });
            const currentRank = getFighterRank(totalXP);
            const nextRankTier = getNextRank(totalXP);
            const progress = getRankProgress(totalXP);

            setSessionXPData({
              ...breakdown,
              likeXP,
              totalXP,
              currentRank,
              nextRank: nextRankTier,
              rankProgress: progress,
              xpToNext: nextRankTier ? nextRankTier.minXP - totalXP : 0,
            });
          } catch (xpErr) {
            console.error("XP breakdown error:", xpErr);
          }
        }
      } catch (saveError) {
        console.error("Failed to save AI feedback:", saveError);
      }
    } catch (err) {
      console.error("Failed to generate AI feedback:", err);
      setFeedbackError(t("feedbackGenerateError"));
    } finally {
      setFeedbackLoading(false);
    }
  }, [currentLocale, router, user?.uid, t, creatorProfiles]);

  const handleCloseFeedback = useCallback(() => {
    setFeedbackOpen(false);
    setFeedbackLoading(false);
    setFeedbackError("");
    setFeedbackResult("");
    setFeedbackSaved(false);
    setFeedbackReel(null);
    setSessionXPData(null);
  }, []);

  return {
    feedbackOpen, setFeedbackOpen,
    feedbackLoading,
    feedbackError,
    feedbackResult,
    feedbackSaved,
    feedbackReel,
    sessionXPData,
    handleGetFeedback,
    handleCloseFeedback,
  };
}
