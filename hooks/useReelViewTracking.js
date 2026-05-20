"use client";
import { useEffect, useRef } from "react";
import { getFirebase } from "@/lib/lazyFirebase";
import { getSafeViewCount, sortReelsByEngagement } from "@/lib/reelHelpers";

export function useReelViewTracking({ user, reels, currentIndex, userViews, setUserViews, setAllReels }) {
  const viewTimers = useRef({});

  useEffect(() => {
    if (!user || !reels.length || currentIndex < 0 || currentIndex >= reels.length) return;

    const currentReel = reels[currentIndex];
    if (!currentReel || !currentReel.id || currentReel.isDemo) return;

    if (userViews.has(currentReel.id)) return;

    const timers = viewTimers.current; // capture stable ref object for cleanup
    const reelId = currentReel.id;

    if (timers[reelId]) {
      clearTimeout(timers[reelId]);
    }

    timers[reelId] = setTimeout(async () => {
      if (!user?.uid) return;

      try {
        const { db } = await getFirebase();
        const { collection, addDoc, doc, setDoc, updateDoc, increment, serverTimestamp } = await import("firebase/firestore");

        await addDoc(collection(db, "reel_views"), {
          reelId: currentReel.id,
          userId: user.uid,
          createdAt: serverTimestamp()
        });

        await Promise.all([
          updateDoc(doc(db, "reels", currentReel.id), { views: increment(1) }),
          setDoc(doc(db, "reel_stats", currentReel.id), { reelId: currentReel.id, views: increment(1), updatedAt: serverTimestamp() }, { merge: true }),
        ]);

        setUserViews(prev => {
          const newViews = new Set(prev);
          newViews.add(currentReel.id);
          try {
            const sessionKey = `gavana_views_${user.uid}`;
            const stored = sessionStorage.getItem(sessionKey);
            const arr = stored ? JSON.parse(stored) : [];
            arr.push(currentReel.id);
            sessionStorage.setItem(sessionKey, JSON.stringify(arr.slice(-500)));
          } catch { /* sessionStorage unavailable */ }
          return newViews;
        });

        const updateViewedReel = (prev) => sortReelsByEngagement(prev.map(reel =>
          reel.id === currentReel.id
            ? { ...reel, views: getSafeViewCount(reel) + 1 }
            : reel
        ));
        setAllReels(updateViewedReel);
      } catch (err) {
      }
    }, 3000);

    return () => {
      if (timers[reelId]) {
        clearTimeout(timers[reelId]);
        delete timers[reelId];
      }
    };
  }, [user, currentIndex, reels, userViews, setUserViews, setAllReels]);

  useEffect(() => {
    const timers = viewTimers.current;
    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, []);
}
