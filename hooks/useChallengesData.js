"use client";
import { useEffect, useRef, useState } from "react";
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useChallengesData({ user, authLoading, mainTab }) {
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [profiles, setProfiles] = useState({});
  const profileRequestsRef = useRef(new Set());
  const [myBattles, setMyBattles] = useState([]);
  const [battlesLoading, setBattlesLoading] = useState(false);

  useEffect(() => {
    if (!user?.uid || mainTab !== "battles") return;
    let active = true;
    setBattlesLoading(true);
    async function loadBattles() {
      try {
        const [asChal, asOpp] = await Promise.all([
          getDocs(query(collection(db, "pvp_challenges"), where("challengerId", "==", user.uid))),
          getDocs(query(collection(db, "pvp_challenges"), where("opponentId", "==", user.uid))),
        ]);
        if (!active) return;
        const all = [
          ...asChal.docs.map((d) => ({ id: d.id, ...d.data(), role: "challenger" })),
          ...asOpp.docs.map((d) => ({ id: d.id, ...d.data(), role: "opponent" })),
        ].sort((a, b) => {
          const aMs = a.createdAt?.toMillis?.() || 0;
          const bMs = b.createdAt?.toMillis?.() || 0;
          return bMs - aMs;
        });
        setMyBattles(all);
      } catch (e) {
        if (process.env.NODE_ENV !== "production") console.error("battles load error", e);
      } finally {
        if (active) setBattlesLoading(false);
      }
    }
    loadBattles();
    return () => { active = false; };
  }, [user?.uid, mainTab]);

  useEffect(() => {
    if (!user?.uid || profiles[user.uid]) return;
    let active = true;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (!active || !snap.exists()) return;
      const data = snap.data();
      setProfiles((prev) => ({
        ...prev,
        [user.uid]: {
          name: data.displayName || data.username || "",
          photoURL: data.photoURL || data.profileImageUrl || "",
          challengeStreak: Number(data.challengeStreak) || 0,
          lastChallengeDate: data.lastChallengeDate || "",
        },
      }));
    }).catch(() => {});
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // profiles omitted — adding it would cause infinite loop with profile batch loader

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "challenge_results"), (snap) => {
      setResults(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((r) => r.challengeId && Number.isFinite(Number(r.score)))
      );
      setResultsLoading(false);
    }, (err) => { console.error(err); setResults([]); setResultsLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!results.length) return;
    const uids = [...new Set(results.map((r) => r.userId).filter(Boolean))];
    const missing = uids.filter((uid) => !profiles[uid] && !profileRequestsRef.current.has(uid));
    if (!missing.length) return;
    let active = true;
    missing.forEach((uid) => profileRequestsRef.current.add(uid));
    Promise.all(missing.map(async (uid) => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        const data = snap.exists() ? snap.data() : {};
        return [uid, {
          name: data.displayName || data.username || "",
          photoURL: data.photoURL || data.profileImageUrl || data.profileImage || data.avatarUrl || "",
          challengeStreak: Number(data.challengeStreak) || 0,
          lastChallengeDate: data.lastChallengeDate || "",
        }];
      } catch { return [uid, {}]; }
    })).then((entries) => {
      if (!active) return;
      setProfiles((prev) => {
        const next = { ...prev };
        entries.forEach(([uid, data]) => { next[uid] = data; });
        return next;
      });
    });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]); // profiles omitted — used only to check already-loaded keys, adding causes infinite loop

  return {
    results, resultsLoading,
    profiles,
    myBattles, battlesLoading,
  };
}
