"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deriveMovementTendency, deriveTrends } from "@/lib/combatMemory";

export function useCombatMemory({ user, maxSessions = 30 }) {
  const [sessions, setSessions] = useState([]);
  const [tendency, setTendency] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    let active = true;

    async function load() {
      try {
        const snap = await getDocs(query(
          collection(db, "training_sessions"),
          where("userId", "==", user.uid),
          where("type", "==", "training")
        ));
        if (!active) return;
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => typeof d.score === "number")
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .slice(0, maxSessions);
        setSessions(data);
        setTendency(deriveMovementTendency(data));
        setTrends(deriveTrends(data));
      } catch {
        // silent — panel shows empty state
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [user?.uid, maxSessions]);

  return { sessions, tendency, trends, loading };
}
