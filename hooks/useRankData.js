"use client";
import { useEffect, useState } from "react";
import { getAccountXp } from "@/lib/domain/progression";

export function useRankData({ user, authLoading }) {
  const [xp, setXp] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [tier, setTier] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) { setXp(0); setDataLoading(false); return; }

    let active = true;
    async function loadXP() {
      try {
        // Loaded here, not at module top: the desktop sidebar uses this hook on every page.
        const [{ collection, doc, getDoc, getDocs, query, where }, { db }] = await Promise.all([
          import("firebase/firestore"),
          import("@/lib/firebase"),
        ]);
        const [sessionSnap, profileSnap] = await Promise.all([
          getDocs(query(collection(db, "training_sessions"), where("userId", "==", user.uid))),
          getDoc(doc(db, "users", user.uid)),
        ]);

        const trainingSessions = sessionSnap.docs.map((d) => ({ xpGained: d.data().xpGained }));
        const profileData = profileSnap.exists() ? profileSnap.data() : {};

        if (active) {
          setXp(getAccountXp({
            storedXp: profileData.xp,
            trainingSessions,
            streakDays: Number(profileData.dailyStreak) || 0,
            bestStreakDays: Number(profileData.bestDailyStreak) || 0,
          }));
          setSessionCount(sessionSnap.docs.length);
          setTier(profileData.subscriptionTier || profileData.tier || null);
        }
      } catch {
        if (active) setXp(0);
      } finally {
        if (active) setDataLoading(false);
      }
    }

    loadXP();
    return () => { active = false; };
  }, [user?.uid, authLoading]);

  return { xp, sessionCount, dataLoading, tier };
}
