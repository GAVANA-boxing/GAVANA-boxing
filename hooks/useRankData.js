"use client";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
        const [feedbackSnap, sessionSnap, profileSnap] = await Promise.all([
          getDocs(query(collection(db, "ai_feedback"), where("userId", "==", user.uid))),
          getDocs(query(collection(db, "training_sessions"), where("userId", "==", user.uid))),
          getDoc(doc(db, "users", user.uid)),
        ]);

        const docs = feedbackSnap.docs.map((d) => ({ score: d.data().score, createdAt: d.data().createdAt }));
        const trainingSessions = sessionSnap.docs.map((d) => ({ xpGained: d.data().xpGained }));
        const profileData = profileSnap.exists() ? profileSnap.data() : {};

        if (active) {
          setXp(getAccountXp({
            storedXp: profileData.xp,
            aiFeedbackDocs: docs,
            trainingSessions,
            streakDays: Number(profileData.dailyStreak) || 0,
            likesReceived: Number(profileData.likesReceived) || 0,
          }));
          setSessionCount(feedbackSnap.docs.length);
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
