"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { calculateUserXP } from "@/lib/xp";
import { getTimestampMs } from "@/lib/utils";
import { getCurrentSeasonId } from "@/lib/season";

export function useProfileSecondaryData({ user, userId, isOwnProfile }) {
  const [challengeRanks, setChallengeRanks] = useState(null);
  const [pvpStats, setPvpStats] = useState(null);
  const [sparringRecord, setSparringRecord] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [coachBookings, setCoachBookings] = useState([]);

  // Load challenge ranks — weekly + all-time rank for this profile
  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function loadChallengeRanks() {
      try {
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        const currentSeasonId = getCurrentSeasonId();

        const [seasonSnap, userSnap] = await Promise.all([
          getDocs(query(collection(db, "challenge_results"), where("seasonId", "==", currentSeasonId))),
          getDocs(query(collection(db, "challenge_results"), where("userId", "==", userId))),
        ]);
        if (!active) return;

        const weeklyByUser = {};
        seasonSnap.forEach((docSnap) => {
          const d = docSnap.data();
          if (!d.userId || d.score == null) return;
          const score = Number(d.score);
          if (Number.isNaN(score)) return;
          if (!weeklyByUser[d.userId] || score > weeklyByUser[d.userId]) {
            weeklyByUser[d.userId] = score;
          }
        });
        const weeklySorted = Object.entries(weeklyByUser).sort((a, b) => b[1] - a[1]);
        const weeklyRankIdx = weeklySorted.findIndex(([uid]) => uid === userId);
        const weeklyRank = weeklyRankIdx >= 0 ? weeklyRankIdx + 1 : null;
        const bestWeeklyScore = weeklyByUser[userId] ?? null;

        let allTimeBest = null;
        userSnap.forEach((docSnap) => {
          const score = Number(docSnap.data().score);
          if (!Number.isNaN(score) && (allTimeBest === null || score > allTimeBest)) {
            allTimeBest = score;
          }
        });

        if (active) {
          setChallengeRanks({ weeklyRank, allTimeRank: null, bestWeeklyScore, currentSeasonId, allTimeBest });
        }
      } catch (e) {
        if (active) setChallengeRanks(null);
      }
    }

    loadChallengeRanks();
    return () => { active = false; };
  }, [userId]);

  // Load PvP stats for this profile
  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function loadPvpStats() {
      try {
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        const [asChallenger, asOpponent] = await Promise.all([
          getDocs(query(collection(db, "pvp_results"), where("challengerId", "==", userId))),
          getDocs(query(collection(db, "pvp_results"), where("opponentId", "==", userId))),
        ]);
        if (!active) return;

        let wins = 0;
        let losses = 0;
        let bestWinScore = null;
        const battles = [];

        asChallenger.forEach((d) => {
          const data = d.data();
          const isWin = data.result === "win";
          if (isWin) {
            wins++;
            const s = Number(data.challengerScore);
            if (Number.isFinite(s) && (bestWinScore === null || s > bestWinScore)) bestWinScore = s;
          } else {
            losses++;
          }
          battles.push({
            id: d.id,
            opponentName: data.opponentName || "Opponent",
            challengerScore: Number(data.challengerScore) || 0,
            opponentScore: Number(data.opponentScore) || 0,
            result: data.result,
            createdAt: data.createdAt,
            reelId: data.reelId || null,
          });
        });

        battles.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));

        setPvpStats({
          wins,
          losses,
          timeschallenged: asOpponent.size,
          bestWinScore,
          recentBattles: battles.slice(0, 5),
        });
      } catch (e) {
        if (active) setPvpStats(null);
      }
    }

    loadPvpStats();
    return () => { active = false; };
  }, [userId]);

  // Load sparring record
  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function loadSparring() {
      try {
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        const [asSender, asReceiver] = await Promise.all([
          getDocs(query(collection(db, "sparring_requests"), where("fromUserId", "==", userId))),
          getDocs(query(collection(db, "sparring_requests"), where("toUserId", "==", userId))),
        ]);
        if (!active) return;
        const allReqs = [
          ...asSender.docs.map((d) => ({ id: d.id, ...d.data(), role: "sender" })),
          ...asReceiver.docs.map((d) => ({ id: d.id, ...d.data(), role: "receiver" })),
        ];
        const accepted = allReqs.filter((r) => r.status === "accepted");
        const sentPending = allReqs.filter((r) => r.status === "pending" && r.role === "sender").length;
        setSparringRecord({ totalAccepted: accepted.length, sentPending });
      } catch { if (active) setSparringRecord(null); }
    }
    loadSparring();
    return () => { active = false; };
  }, [userId]);

  // Load current user's own stats for rival comparison
  useEffect(() => {
    if (!user?.uid || !userId || user.uid === userId) { setMyStats(null); return; }
    let active = true;
    async function loadMyStats() {
      try {
        const { collection, doc: fsDoc, getDoc: fsGetDoc, getDocs, query, where } = await import("firebase/firestore");
        const [uSnap, feedSnap] = await Promise.all([
          fsGetDoc(fsDoc(db, "users", user.uid)),
          getDocs(query(collection(db, "ai_feedback"), where("userId", "==", user.uid))),
        ]);
        if (!active) return;
        const p = uSnap.exists() ? uSnap.data() : {};
        const scores = feedSnap.docs.map(d => Number(d.data().score)).filter(Number.isFinite);
        const storedXP = Number(p.xp) || 0;
        const myXP = storedXP + calculateUserXP({ aiFeedbackDocs: feedSnap.docs.map(d => d.data()) });
        setMyStats({
          xp: myXP,
          bestScore: scores.length ? Math.max(...scores) : null,
          streak: Number(p.challengeStreak) || Number(p.streakCount) || 0,
          wins: Number(p.pvpWins) || 0,
        });
      } catch { if (active) setMyStats(null); }
    }
    loadMyStats();
    return () => { active = false; };
  }, [user?.uid, userId]);

  // Load earned badges
  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function loadBadges() {
      try {
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        const snap = await getDocs(query(collection(db, "user_badges"), where("userId", "==", userId)));
        if (!active) return;
        const badges = snap.docs.map((d) => d.data());
        setUserBadges(badges);
      } catch { if (active) setUserBadges([]); }
    }
    loadBadges();
    return () => { active = false; };
  }, [userId]);

  // Load upcoming coach bookings — own profile only
  useEffect(() => {
    if (!userId || !isOwnProfile) return;
    let active = true;

    async function loadBookings() {
      try {
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        const snap = await getDocs(
          query(collection(db, "coach_bookings"), where("userId", "==", userId))
        );
        if (!active) return;
        setCoachBookings(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((b) => b.status === "scheduled")
            .sort((a, b) => getTimestampMs(a.date) - getTimestampMs(b.date))
        );
      } catch {
        // bookings are optional — silently skip
      }
    }

    loadBookings();
    return () => { active = false; };
  }, [userId, isOwnProfile]);

  return { challengeRanks, pvpStats, sparringRecord, myStats, userBadges, coachBookings };
}
