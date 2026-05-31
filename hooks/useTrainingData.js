"use client";

import { useEffect, useRef, useState } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { calculateUserXP } from "@/lib/xp";

export function useTrainingData({ user }) {
  const [reelId, setReelId] = useState(null);
  const [drillId, setDrillId] = useState(null);
  const [challengeId, setChallengeId] = useState(null);
  const [trainSource, setTrainSource] = useState(null);
  const [trainSourceUserId, setTrainSourceUserId] = useState(null);
  const [challengeUserId, setChallengeUserId] = useState(null);
  const [creatorBestScore, setCreatorBestScore] = useState(null);
  const [targetScore, setTargetScore] = useState(null);
  const [currentXP, setCurrentXP] = useState(0);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [weeklySessionCount, setWeeklySessionCount] = useState(0);
  const [userStreak, setUserStreak] = useState(0);
  const [opponentUsername, setOpponentUsername] = useState(null);
  const [ghostBestScore, setGhostBestScore] = useState(null);
  const ghostBestScoreRef = useRef(null);
  const [challengePostId, setChallengePostId] = useState(null);
  const [challengePostData, setChallengePostData] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setReelId(params.get("reelId") || null);
    setDrillId(params.get("drill") || null);
    setChallengeId(params.get("challengeId") || null);
    setTrainSource(params.get("source") || null);
    setTrainSourceUserId(params.get("reelCreatorId") || params.get("userId") || null);
    setChallengeUserId(params.get("challengeUserId") || null);
    const parsedCreatorBest = Number(params.get("creatorBestScore"));
    setCreatorBestScore(Number.isFinite(parsedCreatorBest) && parsedCreatorBest > 0 ? parsedCreatorBest : null);
    const parsedTargetScore = Number(params.get("score") || params.get("targetScore"));
    setTargetScore(Number.isFinite(parsedTargetScore) && parsedTargetScore > 0 ? parsedTargetScore : null);
    setChallengePostId(params.get("challengePostId") || null);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    async function loadCurrentXP() {
      try {
        const snap = await getDocs(query(collection(db, "ai_feedback"), where("userId", "==", user.uid)));
        const docs = snap.docs.map((d) => ({ score: d.data().score, createdAt: d.data().createdAt }));
        if (active) setCurrentXP(calculateUserXP({ aiFeedbackDocs: docs }));
      } catch (err) {
      }
    }
    loadCurrentXP();
    return () => { active = false; };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    async function loadSessionStats() {
      try {
        const [userSnap, sessSnap] = await Promise.all([
          getDoc(doc(db, "users", user.uid)),
          getDocs(query(collection(db, "training_sessions"), where("userId", "==", user.uid))),
        ]);
        if (!active) return;
        const userData = userSnap.exists() ? userSnap.data() : {};
        setUserStreak(Number(userData.dailyStreak) || 0);
        const sessions = sessSnap.docs
          .map((d) => d.data())
          .filter((d) => d.type === "training" && Number.isFinite(Number(d.score)));
        sessions.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setSessionHistory(sessions.slice(0, 5).map((d) => Number(d.score)));
        const now = new Date();
        const dayOfWeek = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
        monday.setHours(0, 0, 0, 0);
        const weeklyCount = sessions.filter((d) => {
          const ts = d.createdAt?.seconds ? new Date(d.createdAt.seconds * 1000) : null;
          return ts && ts >= monday;
        }).length;
        setWeeklySessionCount(weeklyCount);
      } catch { /* silent */ }
    }
    loadSessionStats();
    return () => { active = false; };
  }, [user?.uid]);

  useEffect(() => {
    if (!challengeUserId) return;
    let active = true;
    async function loadOpponent() {
      try {
        const snap = await getDoc(doc(db, "users", challengeUserId));
        if (!active) return;
        const data = snap.exists() ? snap.data() : {};
        setOpponentUsername(data.username || data.displayName || "Opponent");
      } catch {
        if (active) setOpponentUsername("Opponent");
      }
    }
    loadOpponent();
    return () => { active = false; };
  }, [challengeUserId]);

  useEffect(() => {
    if (!user?.uid || !reelId || challengeUserId) return;
    let active = true;
    async function loadGhost() {
      try {
        const snap = await getDocs(query(
          collection(db, "training_sessions"),
          where("userId", "==", user.uid),
          where("reelId", "==", reelId)
        ));
        if (!active) return;
        const scores = snap.docs
          .map((d) => d.data())
          .filter((d) => d.type === "training" && Number.isFinite(Number(d.score)))
          .map((d) => Number(d.score));
        if (!scores.length) return;
        const best = Math.max(...scores);
        setGhostBestScore(best);
        ghostBestScoreRef.current = best;
      } catch { /* silent — ghost won't show */ }
    }
    loadGhost();
    return () => { active = false; };
  }, [user?.uid, reelId, challengeUserId]);

  useEffect(() => {
    if (!user?.uid || !challengeId || challengeUserId) return;
    let active = true;
    async function loadChallengeGhost() {
      try {
        const snap = await getDocs(query(
          collection(db, "challenge_results"),
          where("userId", "==", user.uid),
          where("challengeId", "==", challengeId)
        ));
        if (!active) return;
        const scores = snap.docs
          .map((d) => d.data())
          .filter((d) => Number.isFinite(Number(d.score)))
          .map((d) => Number(d.score));
        if (!scores.length) return;
        const best = Math.max(...scores);
        setGhostBestScore(best);
        ghostBestScoreRef.current = best;
      } catch { /* silent — ghost won't show */ }
    }
    loadChallengeGhost();
    return () => { active = false; };
  }, [user?.uid, challengeId, challengeUserId]);

  useEffect(() => {
    if (!challengePostId) return;
    let active = true;
    async function loadChallengePost() {
      try {
        const snap = await getDoc(doc(db, "reels", challengePostId));
        if (!active) return;
        if (snap.exists()) {
          setChallengePostData({ id: snap.id, ...snap.data() });
        }
      } catch { /* silent */ }
    }
    loadChallengePost();
    return () => { active = false; };
  }, [challengePostId]);

  return {
    reelId,
    drillId,
    challengeId,
    trainSource,
    trainSourceUserId,
    challengeUserId,
    creatorBestScore,
    targetScore,
    currentXP,
    sessionHistory,
    weeklySessionCount,
    userStreak,
    opponentUsername,
    ghostBestScore, setGhostBestScore,
    ghostBestScoreRef,
    challengePostId,
    challengePostData,
  };
}
