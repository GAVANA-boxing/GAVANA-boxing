"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Fetches the current user's own notifications as their activity feed.
// This avoids cross-user permission issues while still showing relevant activity.
export function useActivityFeed({ user, maxItems = 20 }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // Read own notifications — always permitted
        const snap = await getDocs(
          query(
            collection(db, "notifications"),
            where("recipientId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(maxItems)
          )
        );
        if (!cancelled) {
          setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch {
        // Fail silently — show empty state
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user?.uid, maxItems]);

  return { items, loading };
}
