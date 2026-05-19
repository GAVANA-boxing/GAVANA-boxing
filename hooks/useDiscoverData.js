"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, documentId, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { snapToDocs } from "@/lib/firestore";
import { getTimestampMs } from "@/lib/utils";

export function useDiscoverData({ userId, feedTab }) {
  const [allReels, setAllReels] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(true);
  const [exploreError, setExploreError] = useState(false);
  const [topCoaches, setTopCoaches] = useState([]);
  const [followingReels, setFollowingReels] = useState([]);
  const [followingUsers, setFollowingUsers] = useState({});
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedLoaded, setFeedLoaded] = useState(false);

  const loadExplore = useCallback(async () => {
    setExploreLoading(true);
    setExploreError(false);
    let active = true;
    try {
      const [reelsSnap, coachSnap] = await Promise.all([
        getDocs(query(collection(db, "reels"), orderBy("createdAt", "desc"), limit(80))),
        getDocs(query(collection(db, "users"), where("isCoach", "==", true), limit(4))),
      ]);
      if (!active) return;
      setAllReels(snapToDocs(reelsSnap));
      setTopCoaches(snapToDocs(coachSnap));
    } catch {
      if (active) setExploreError(true);
    }
    if (active) setExploreLoading(false);
    return () => { active = false; };
  }, []);

  useEffect(() => { loadExplore(); }, [loadExplore]);

  useEffect(() => {
    if (feedTab !== "following" || feedLoaded || !userId) return;
    let active = true;
    async function loadFollowing() {
      setFeedLoading(true);
      try {
        const followsSnap = await getDocs(query(collection(db, "follows"), where("followerId", "==", userId)));
        const followingIds = followsSnap.docs.map((d) => d.data().followingId).filter(Boolean);
        if (!followingIds.length) {
          if (active) { setFeedLoaded(true); setFeedLoading(false); }
          return;
        }
        const reels = [];
        const chunks = [];
        for (let i = 0; i < followingIds.length; i += 10) chunks.push(followingIds.slice(i, i + 10));
        await Promise.all(chunks.map(async (chunk) => {
          const snap = await getDocs(query(collection(db, "reels"), where("userId", "in", chunk)));
          snap.docs.forEach((d) => reels.push({ id: d.id, ...d.data() }));
        }));
        reels.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
        if (!active) return;
        setFollowingReels(reels.slice(0, 60));
        const authorIds = [...new Set(reels.map((r) => r.userId).filter(Boolean))];
        if (authorIds.length > 0) {
          const uChunks = [];
          for (let i = 0; i < authorIds.length; i += 10) uChunks.push(authorIds.slice(i, i + 10));
          const uMap = {};
          await Promise.all(uChunks.map(async (chunk) => {
            const uSnap = await getDocs(query(collection(db, "users"), where(documentId(), "in", chunk)));
            uSnap.docs.forEach((d) => { uMap[d.id] = d.data(); });
          }));
          if (active) setFollowingUsers(uMap);
        }
      } catch (e) { console.error("following feed error", e); }
      finally { if (active) { setFeedLoaded(true); setFeedLoading(false); } }
    }
    loadFollowing();
    return () => { active = false; };
  }, [feedTab, feedLoaded, userId]);

  return {
    allReels,
    exploreLoading, exploreError, loadExplore,
    topCoaches,
    followingReels, followingUsers, feedLoading, feedLoaded,
  };
}
