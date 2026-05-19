"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { dedupeWeeklyByUser } from "@/lib/leaderboardHelpers";

export function useLeaderboardData({ user, currentSeasonId }) {
  const [entries, setEntries] = useState([]);
  const [rawChallengeResults, setRawChallengeResults] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [reelsStats, setReelsStats] = useState({});

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const twentyEightDaysAgo = new Date(Date.now() - 28 * 86_400_000);

        const [challengeSnapshot, usersSnapshot, trainingSnapshot, reelsSnapshot] = await Promise.all([
          getDocs(query(collection(db, "challenge_results"), where("seasonId", "==", currentSeasonId))),
          getDocs(query(collection(db, "users"), limit(500))),
          getDocs(query(collection(db, "training_sessions"), where("createdAt", ">", twentyEightDaysAgo), limit(1000))),
          getDocs(query(collection(db, "reels"), limit(500))),
        ]);

        const profileMap = {};
        usersSnapshot.forEach((userDoc) => {
          profileMap[userDoc.id] = { userId: userDoc.id, ...userDoc.data() };
        });

        const rawResults = [];
        challengeSnapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.userId && d.score != null) {
            rawResults.push({
              userId: d.userId,
              score: Number(d.score),
              seasonId: d.seasonId || null,
              challengeId: d.challengeId || null,
              createdAt: d.createdAt,
            });
          }
        });

        const userMap = {};
        Object.values(profileMap).forEach((p) => {
          const uid = p.userId;
          const storedXP = Number(p.xp) || 0;
          if (storedXP > 0 || p.displayName || p.username) {
            userMap[uid] = { userId: uid, xp: storedXP, challengeScores: [], latestTs: 0, latestScore: 0 };
          }
        });

        rawResults.forEach((r) => {
          const uid = r.userId;
          const score = r.score;
          if (Number.isNaN(score)) return;
          if (!userMap[uid]) {
            userMap[uid] = { userId: uid, xp: Number(profileMap[uid]?.xp) || 0, challengeScores: [], latestTs: 0, latestScore: 0 };
          }
          if (!userMap[uid].challengeScores) userMap[uid].challengeScores = [];
          userMap[uid].challengeScores.push(score);
          const ts = r.createdAt?.toMillis?.() || 0;
          if (ts >= userMap[uid].latestTs) {
            userMap[uid].latestTs = ts;
            userMap[uid].latestScore = score;
          }
        });

        const sorted = Object.values(userMap)
          .map((u) => {
            const scores = (u.challengeScores || []).filter((s) => Number.isFinite(s));
            return {
              userId: u.userId,
              bestScore: scores.length ? Math.max(...scores) : 0,
              latestScore: u.latestScore,
              sessions: (u.challengeScores || []).length,
              xp: u.xp,
            };
          })
          .sort((a, b) => b.xp - a.xp || b.bestScore - a.bestScore)
          .slice(0, 50);

        const sessions = [];
        trainingSnapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.userId && d.score != null) {
            sessions.push({ userId: d.userId, score: Number(d.score), createdAt: d.createdAt });
          }
        });

        const reelsMap = {};
        reelsSnapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (!d.userId) return;
          if (!reelsMap[d.userId]) reelsMap[d.userId] = { totalViews: 0, totalLikes: 0 };
          reelsMap[d.userId].totalViews += Number(d.views || 0);
          reelsMap[d.userId].totalLikes += Number(d.likes || d.likesCount || 0);
        });

        if (!active) return;
        setEntries(sorted);
        setRawChallengeResults(rawResults);
        setProfiles(profileMap);
        setTrainingSessions(sessions);
        setReelsStats(reelsMap);
      } catch (err) {
        console.error("Leaderboard load error:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [currentSeasonId]);

  useEffect(() => {
    if (!user?.uid) { setFollowingIds(new Set()); return; }
    let active = true;
    async function loadFollowing() {
      try {
        const snap = await getDocs(query(collection(db, "follows"), where("followerId", "==", user.uid)));
        if (!active) return;
        const ids = new Set();
        snap.forEach((d) => { if (d.data().followingId) ids.add(d.data().followingId); });
        setFollowingIds(ids);
      } catch { setFollowingIds(new Set()); }
    }
    loadFollowing();
    return () => { active = false; };
  }, [user?.uid]);

  const weeklyEntries = useMemo(
    () => dedupeWeeklyByUser(rawChallengeResults, currentSeasonId),
    [rawChallengeResults, currentSeasonId]
  );

  const improvementEntries = useMemo(() => {
    const now = Date.now();
    const recent = now - 14 * 86400000;
    const prev = now - 28 * 86400000;
    const byUser = {};
    trainingSessions.forEach((s) => {
      const ms = s.createdAt?.toMillis?.() || 0;
      if (!byUser[s.userId]) byUser[s.userId] = { recentBest: null, prevBest: null };
      if (ms >= recent) {
        if (byUser[s.userId].recentBest === null || s.score > byUser[s.userId].recentBest) byUser[s.userId].recentBest = s.score;
      } else if (ms >= prev) {
        if (byUser[s.userId].prevBest === null || s.score > byUser[s.userId].prevBest) byUser[s.userId].prevBest = s.score;
      }
    });
    return Object.entries(byUser)
      .filter(([, v]) => v.recentBest !== null && v.prevBest !== null)
      .map(([uid, v]) => ({ userId: uid, bestScore: v.recentBest, improvement: Number((v.recentBest - v.prevBest).toFixed(1)) }))
      .filter((e) => e.improvement > 0)
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 50);
  }, [trainingSessions]);

  const streakEntries = useMemo(() => {
    return Object.values(profiles)
      .filter((p) => (Number(p.dailyStreak) || 0) > 0)
      .map((p) => ({ userId: p.userId, bestScore: Number(p.dailyStreak) || 0 }))
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 50);
  }, [profiles]);

  const friendsEntries = useMemo(() => {
    if (!user?.uid || followingIds.size === 0) return [];
    return entries.filter((e) => followingIds.has(e.userId) || e.userId === user.uid);
  }, [entries, followingIds, user?.uid]);

  const viewsEntries = useMemo(() =>
    Object.entries(reelsStats)
      .map(([userId, stats]) => ({ userId, bestScore: stats.totalViews, totalLikes: stats.totalLikes }))
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 50),
    [reelsStats]
  );

  const likesEntries = useMemo(() =>
    Object.entries(reelsStats)
      .map(([userId, stats]) => ({ userId, bestScore: stats.totalLikes, totalViews: stats.totalViews }))
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 50),
    [reelsStats]
  );

  const currentUserAllTimeRank = useMemo(() => {
    if (!user?.uid) return null;
    const idx = entries.findIndex((e) => e.userId === user.uid);
    return idx >= 0 ? idx + 1 : null;
  }, [entries, user?.uid]);

  const currentUserWeeklyRank = useMemo(() => {
    if (!user?.uid) return null;
    const idx = weeklyEntries.findIndex((e) => e.userId === user.uid);
    return idx >= 0 ? idx + 1 : null;
  }, [weeklyEntries, user?.uid]);

  const currentUserAllTimeEntry = useMemo(() => {
    if (!user?.uid) return null;
    return entries.find((e) => e.userId === user.uid) || null;
  }, [entries, user?.uid]);

  const currentUserWeeklyEntry = useMemo(() => {
    if (!user?.uid) return null;
    return weeklyEntries.find((e) => e.userId === user.uid) || null;
  }, [weeklyEntries, user?.uid]);

  const weeklyChampion = weeklyEntries.length > 0 ? weeklyEntries[0] : null;

  return {
    entries,
    profiles,
    loading,
    weeklyEntries,
    improvementEntries,
    streakEntries,
    friendsEntries,
    viewsEntries,
    likesEntries,
    currentUserAllTimeRank,
    currentUserWeeklyRank,
    currentUserAllTimeEntry,
    currentUserWeeklyEntry,
    weeklyChampion,
  };
}
