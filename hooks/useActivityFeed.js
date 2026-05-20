"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Fetches recent activity from users the current user follows.
// Falls back to global recent activity if user follows nobody.
export function useActivityFeed({ user, maxItems = 20 }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // 1. Get followed user IDs
        const followSnap = await getDocs(
          query(collection(db, "follows"), where("followerId", "==", user.uid), limit(50))
        );
        const followedIds = followSnap.docs.map((d) => d.data().followingId).filter(Boolean);

        // 2. Fetch recent notifications of activity types (global if no follows)
        const ACTIVITY_TYPES = ["pvp_challenge", "pvp_win", "rank_up", "new_reel", "follow"];
        let activityQuery;

        if (followedIds.length > 0) {
          // Show activity FROM people the user follows
          const ids = followedIds.slice(0, 10); // Firestore "in" limit
          activityQuery = query(
            collection(db, "notifications"),
            where("actorId", "in", ids),
            orderBy("createdAt", "desc"),
            limit(maxItems)
          );
        } else {
          // Global recent activity
          activityQuery = query(
            collection(db, "notifications"),
            orderBy("createdAt", "desc"),
            limit(maxItems)
          );
        }

        const snap = await getDocs(activityQuery);
        if (!cancelled) {
          setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (e) {
        console.error("Activity feed error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user?.uid, maxItems]);

  return { items, loading };
}
