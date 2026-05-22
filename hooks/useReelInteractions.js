"use client";
import { useCallback } from "react";
import { createNotification } from "@/lib/notifications";
import { getSafeLikeCount, getSafeViewCount, sortReelsByEngagement } from "@/lib/reelHelpers";
import { getFirebase } from "@/lib/lazyFirebase";

export function useReelInteractions({
  user, router, currentLocale, pathname, t,
  reels, userLikes, savedReels,
  setUserLikes, setAllReels, setSavedReels, setUserViews, setHeartBursts,
  revealControls, togglePlay, singleTapTimerRef, lastTapRef,
}) {
  const handleLike = useCallback(async (reelId) => {
    const targetReel = reels.find((reel) => reel.id === reelId);
    if (targetReel?.isDemo) {
      router.push(`/${currentLocale}/upload`);
      return;
    }

    if (!user) {
      router.push(`/${currentLocale}/login`);
      return;
    }

    try {
      const { db } = await getFirebase();
      const { doc, setDoc, deleteDoc, getDoc, updateDoc, increment } = await import("firebase/firestore");

      const likeRef = doc(db, "user_likes", `${user.uid}_${reelId}`);
      const likeDoc = await getDoc(likeRef);
      const isLiked = likeDoc.exists();

      const reelRef = doc(db, "reels", reelId);

      if (isLiked) {
        // Unlike: remove like and decrement count
        await deleteDoc(likeRef);
        await updateDoc(reelRef, { likes: increment(-1) });

        setUserLikes(prev => {
          const newLikes = new Set(prev);
          newLikes.delete(reelId);
          return newLikes;
        });

        const updateUnlikedReel = (prev) => sortReelsByEngagement(prev.map(reel =>
          reel.id === reelId
            ? { ...reel, likes: Math.max(0, getSafeLikeCount(reel) - 1) }
            : reel
        ));
        setAllReels(updateUnlikedReel);
      } else {
        const likedReel = reels.find((reel) => reel.id === reelId);
        // Like: add like and increment count
        await setDoc(likeRef, {
          userId: user.uid,
          reelId: reelId,
          createdAt: new Date().toISOString()
        });
        await updateDoc(reelRef, { likes: increment(1) });
        // Track in reel_stats for feed ranking
        setDoc(doc(db, "reel_stats", reelId), { reelId, likes: increment(1), updatedAt: new Date() }, { merge: true }).catch(() => {});
        await createNotification({
          recipientId: likedReel?.userId,
          actorId: user.uid,
          actorName: user.email?.split("@")[0],
          type: "like",
          reelId,
        });

        setUserLikes(prev => {
          const newLikes = new Set(prev);
          newLikes.add(reelId);
          return newLikes;
        });

        const updateLikedReel = (prev) => sortReelsByEngagement(prev.map(reel =>
          reel.id === reelId
            ? { ...reel, likes: getSafeLikeCount(reel) + 1 }
            : reel
        ));
        setAllReels(updateLikedReel);
      }
    } catch (err) {
    }
  }, [user, router, currentLocale, reels, setAllReels, setUserLikes]);

  const handleVideoClick = useCallback((e, reel) => {
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current.time < 350 && lastTapRef.current.reelId === reel.id;
    lastTapRef.current = { time: now, reelId: reel.id };

    if (isDoubleTap) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX || e.changedTouches?.[0]?.clientX || rect.width / 2) - rect.left;
      const y = (e.clientY || e.changedTouches?.[0]?.clientY || rect.height / 2) - rect.top;
      if (!reel.isDemo && !userLikes.has(reel.id)) handleLike(reel.id);
      const burstId = now;
      setHeartBursts((prev) => [...prev, { id: burstId, x, y, reelId: reel.id }]);
      setTimeout(() => setHeartBursts((prev) => prev.filter((b) => b.id !== burstId)), 800);
    } else {
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = setTimeout(() => {
        revealControls();
        togglePlay();
        singleTapTimerRef.current = null;
      }, 250);
    }
  }, [handleLike, revealControls, togglePlay, userLikes, lastTapRef, singleTapTimerRef, setHeartBursts]);

  const handleSave = useCallback(async (reelId) => {
    const targetReel = reels.find((reel) => reel.id === reelId);
    if (targetReel?.isDemo) {
      router.push(`/${currentLocale}/upload`);
      return;
    }

    if (!user?.uid) {
      router.push(`/${currentLocale}/login`);
      return;
    }

    const wasSaved = savedReels.has(reelId);
    setSavedReels((prev) => {
      const next = new Set(prev);
      if (wasSaved) {
        next.delete(reelId);
      } else {
        next.add(reelId);
      }
      return next;
    });

    try {
      const { db } = await getFirebase();
      const { doc, setDoc, deleteDoc, serverTimestamp, increment } = await import("firebase/firestore");
      const saveRef = doc(db, "saved_reels", `${user.uid}_${reelId}`);

      if (wasSaved) {
        await deleteDoc(saveRef);
      } else {
        await setDoc(saveRef, {
          userId: user.uid,
          reelId,
          createdAt: serverTimestamp(),
        });
        // Track saves in reel_stats for feed ranking
        const statsRef = doc(db, "reel_stats", reelId);
        setDoc(statsRef, { reelId, saves: increment(1), updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
      }
    } catch (err) {
      setSavedReels((prev) => {
        const next = new Set(prev);
        if (wasSaved) {
          next.add(reelId);
        } else {
          next.delete(reelId);
        }
        return next;
      });
    }
  }, [currentLocale, reels, router, savedReels, user?.uid, setSavedReels]);

  const handleShare = useCallback(async (reel) => {
    try {
      const { db } = await getFirebase();
      const { collection, query, where, getDocs } = await import("firebase/firestore");

      // Fetch feedback to get score
      let score = null;
      try {
        const feedbackQuery = query(
          collection(db, "feedback"),
          where("reelId", "==", reel.id),
          where("userId", "==", reel.userId)
        );
        const feedbackSnap = await getDocs(feedbackQuery);
        if (!feedbackSnap.empty) {
          const feedbackDoc = feedbackSnap.docs[0].data();
          score = feedbackDoc.score;
        }
      } catch (err) {
      }

      const baseUrl = window.location.origin;
      const reelUrl = `${baseUrl}${pathname}?reelId=${reel.id}`;
      const appUrl = baseUrl;

      let shareText = t("shareReelText");
      if (score !== null) {
        shareText = t("shareScoreText").replace("{score}", score);
      }

      const shareData = {
        title: t("shareReelTitle"),
        text: shareText,
        url: reelUrl,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const fullText = `${shareText} ${reelUrl} ${appUrl}`;
        await navigator.clipboard.writeText(fullText);
        alert(t("shareLinkCopied"));
      }
    } catch (err) {
      alert(t("shareFailed"));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, currentLocale]); // t intentionally omitted — recreated every render, locale covers it

  return { handleLike, handleVideoClick, handleSave, handleShare };
}
