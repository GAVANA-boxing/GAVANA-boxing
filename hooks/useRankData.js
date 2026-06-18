"use client";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { calculateUserXP } from "@/lib/xp";

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
        const [feedbackSnap, profileSnap] = await Promise.all([
          getDocs(query(collection(db, "ai_feedback"), where("userId", "==", user.uid))),
          getDoc(doc(db, "users", user.uid)),
        ]);

        const docs = feedbackSnap.docs.map((d) => ({ score: d.data().score, createdAt: d.data().createdAt }));
        const profileData = profileSnap.exists() ? profileSnap.data() : {};
        const storedXP = Number(profileData.xp) || 0;
        const streak = Number(profileData.dailyStreak) || 0;
        const likes = Number(profileData.likesReceived) || 0;
        const aiXP = calculateUserXP({ aiFeedbackDocs: docs, streakDays: streak, likesReceived: likes });

        if (active) {
          setXp(storedXP + aiXP);
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
