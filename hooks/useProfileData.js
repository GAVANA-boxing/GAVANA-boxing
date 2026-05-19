"use client";
import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { RANK_TIERS, calculateUserXP, getFighterRank } from "@/lib/xp";
import { getTimestampMs, getSafeReelLikes } from "@/lib/utils";
import { getCurrentSeasonId } from "@/lib/season";

export function useProfileData({ user, userId, authLoading, locale }) {
  const [profileUser, setProfileUser] = useState(null);
  const [userReels, setUserReels] = useState([]);
  const [savedUserReels, setSavedUserReels] = useState([]);
  const [aiFeedbackHistory, setAiFeedbackHistory] = useState([]);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalLikes, setTotalLikes] = useState(0);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutual, setIsMutual] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [challengeRanks, setChallengeRanks] = useState(null);
  const [pvpStats, setPvpStats] = useState(null);
  const [sparringRecord, setSparringRecord] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [coachBookings, setCoachBookings] = useState([]);
  const [rankUpRank, setRankUpRank] = useState(null);

  const rankUpShownRef = useRef(false);

  // Helper: load saved reels for the profile user (own profile only)
  const loadSavedReels = async (targetUserId) => {
    if (!user?.uid || user.uid !== targetUserId) {
      setSavedUserReels([]);
      return;
    }

    try {
      const { collection, query, where, getDocs, documentId } = await import("firebase/firestore");
      const savedSnapshot = await getDocs(query(
        collection(db, "saved_reels"),
        where("userId", "==", targetUserId)
      ));
      const savedReelIds = savedSnapshot.docs
        .map((savedDoc) => savedDoc.data().reelId)
        .filter(Boolean);

      if (savedReelIds.length === 0) {
        setSavedUserReels([]);
        return;
      }

      const savedReels = [];
      const batchSize = 10;

      for (let i = 0; i < savedReelIds.length; i += batchSize) {
        const batchIds = savedReelIds.slice(i, i + batchSize);
        const reelsSnapshot = await getDocs(query(
          collection(db, "reels"),
          where(documentId(), "in", batchIds)
        ));
        reelsSnapshot.forEach((reelDoc) => {
          savedReels.push({ id: reelDoc.id, ...reelDoc.data() });
        });
      }

      setSavedUserReels(savedReels);
    } catch (error) {
      console.error("Error loading saved reels:", error);
      setSavedUserReels([]);
    }
  };

  // Helper: load follow statistics
  const loadFollowStats = async (targetUserId) => {
    if (!user?.uid) return;

    try {
      const { collection, query, where, getDocs } = await import("firebase/firestore");

      // Count followers (users following this user)
      const followersQuery = query(
        collection(db, "follows"),
        where("followingId", "==", targetUserId)
      );
      const followersSnapshot = await getDocs(followersQuery);
      const followersCount = followersSnapshot.size;

      // Count following (users this user is following)
      const followingQuery = query(
        collection(db, "follows"),
        where("followerId", "==", targetUserId)
      );
      const followingSnapshot = await getDocs(followingQuery);
      const followingCount = followingSnapshot.size;

      setStats({ followers: followersCount, following: followingCount });
    } catch (error) {
      console.error("Error loading follow stats:", error);
    }
  };

  // Helper: check if current user is following this profile (and if mutual)
  const checkFollowStatus = async (currentUserId, targetUserId) => {
    if (!currentUserId || !targetUserId) return;

    try {
      const { doc, getDoc } = await import("firebase/firestore");

      const [followDoc, reverseDoc] = await Promise.all([
        getDoc(doc(db, "follows", `${currentUserId}_${targetUserId}`)),
        getDoc(doc(db, "follows", `${targetUserId}_${currentUserId}`)),
      ]);
      setIsFollowing(followDoc.exists());
      setIsMutual(followDoc.exists() && reverseDoc.exists());
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  // Load profile data + listen to reels in real time
  useEffect(() => {
    let unsubscribeReels = null;
    let isActive = true;

    async function loadUserProfile() {
      if (authLoading) return;

      if (!user || !userId) {
        setLoading(false);
        return;
      }

      try {
        const { collection, query, where, onSnapshot, doc, getDoc } = await import("firebase/firestore");

        // Check if this is the current user's own profile
        const isOwn = user.uid === userId;
        setIsOwnProfile(isOwn);

        const userDoc = await getDoc(doc(db, "users", userId));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const fallbackName = userData.username || userData.email?.split("@")[0] || `user_${userId.slice(0, 8)}`;
        const profileUserData = {
          id: userId,
          username: userData.username || fallbackName,
          displayName: userData.displayName || userData.username || fallbackName,
          bio: userData.bio || "",
          photoURL: userData.photoURL || userData.profileImageUrl || "",
          email: userData.email || `${fallbackName}@example.com`,
          streakCount: Number(userData.streakCount) || 0,
          xp: Number(userData.xp) || 0,
          totalChallengesCompleted: Number(userData.totalChallengesCompleted) || 0,
          challengeStreak: Number(userData.challengeStreak) || 0,
          lastChallengeDate: userData.lastChallengeDate || "",
          fighterArchetype: userData.fighterArchetype || null,
        };
        setProfileUser(profileUserData);

        // Listen to user's reels so likes update in real time from the reel document.
        const reelsQuery = query(
          collection(db, "reels"),
          where("userId", "==", userId)
        );

        unsubscribeReels = onSnapshot(reelsQuery, (reelsSnapshot) => {
          if (!isActive) return;
          const reelsData = reelsSnapshot.docs
            .map((reelDoc) => ({ id: reelDoc.id, ...reelDoc.data() }))
            .sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
          setUserReels(reelsData);
          setTotalLikes(reelsData.reduce((sum, reel) => sum + getSafeReelLikes(reel), 0));
          setLoading(false);
        }, (error) => {
          if (!isActive) return;
          console.error("Error listening to profile reels:", error);
          setUserReels([]);
          setTotalLikes(0);
          setLoading(false);
        });

        await loadSavedReels(userId);

        // Load followers/following counts
        await loadFollowStats(userId);

        // Check if current user is following this profile
        if (!isOwn) {
          await checkFollowStatus(user.uid, userId);
        }

      } catch (error) {
        console.error("Error loading profile:", error);
        if (isActive) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    loadUserProfile();

    return () => {
      isActive = false;
      if (unsubscribeReels) {
        unsubscribeReels();
      }
    };
  }, [user, userId, authLoading]);

  // Listen to AI feedback in real time
  useEffect(() => {
    if (authLoading || !user?.uid || !userId) {
      setAiFeedbackHistory([]);
      return;
    }

    let isActive = true;
    let unsubscribeFeedback = null;

    async function listenForAiFeedback() {
      try {
        const { collection, onSnapshot, query, where } = await import("firebase/firestore");
        const feedbackQuery = query(
          collection(db, "ai_feedback"),
          where("userId", "==", userId)
        );

        unsubscribeFeedback = onSnapshot(feedbackQuery, (snapshot) => {
          if (!isActive) return;

          const feedbackItems = snapshot.docs
            .map((feedbackDoc) => ({
              id: feedbackDoc.id,
              ...feedbackDoc.data(),
            }))
            .filter((feedback) => Number.isFinite(Number(feedback.score)))
            .sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));

          setAiFeedbackHistory(feedbackItems);
        }, (error) => {
          if (!isActive) return;
          console.error("Error listening to AI feedback:", error);
          setAiFeedbackHistory([]);
        });
      } catch (error) {
        if (!isActive) return;
        console.error("Error loading AI feedback:", error);
        setAiFeedbackHistory([]);
      }
    }

    listenForAiFeedback();

    return () => {
      isActive = false;
      if (unsubscribeFeedback) {
        unsubscribeFeedback();
      }
    };
  }, [authLoading, user?.uid, userId]);

  // Listen to training sessions in real time
  useEffect(() => {
    if (authLoading || !user?.uid || !userId) {
      setTrainingSessions([]);
      return;
    }

    let isActive = true;
    let unsubscribeTraining = null;

    async function listenForTrainingSessions() {
      try {
        const { collection, onSnapshot, query, where } = await import("firebase/firestore");
        const trainingQuery = query(
          collection(db, "training_sessions"),
          where("userId", "==", userId)
        );

        unsubscribeTraining = onSnapshot(trainingQuery, (snapshot) => {
          if (!isActive) return;

          const sessions = snapshot.docs
            .map((sessionDoc) => ({
              id: sessionDoc.id,
              ...sessionDoc.data(),
            }))
            .filter((session) => session.type === "training")
            .sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));

          setTrainingSessions(sessions);
        }, (error) => {
          if (!isActive) return;
          console.error("Error listening to training sessions:", error);
          setTrainingSessions([]);
        });
      } catch (error) {
        if (!isActive) return;
        console.error("Error loading training sessions:", error);
        setTrainingSessions([]);
      }
    }

    listenForTrainingSessions();

    return () => {
      isActive = false;
      if (unsubscribeTraining) {
        unsubscribeTraining();
      }
    };
  }, [authLoading, user?.uid, userId]);

  // Load challenge ranks — weekly + all-time rank for this profile
  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function loadChallengeRanks() {
      try {
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        const currentSeasonId = getCurrentSeasonId();

        // Load only this season's results (not all history) + user's own all-time results
        const [seasonSnap, userSnap] = await Promise.all([
          getDocs(query(collection(db, "challenge_results"), where("seasonId", "==", currentSeasonId))),
          getDocs(query(collection(db, "challenge_results"), where("userId", "==", userId))),
        ]);
        if (!active) return;

        // Weekly rank: rank among all users in current season
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

        // All-time: user's own best score only (no global rank to avoid full collection scan)
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

  // Detect rank-up during session — own profile only
  useEffect(() => {
    if (loading || rankUpShownRef.current || !isOwnProfile) return;
    const currentXP = (Number(profileUser?.xp) || 0) + calculateUserXP({
      aiFeedbackDocs: aiFeedbackHistory,
      streakDays: profileUser?.streakCount || 0,
      likesReceived: totalLikes,
    });
    const currentRank = getFighterRank(currentXP);
    const storedKey = typeof window !== "undefined"
      ? localStorage.getItem("gavana_rank_key")
      : null;
    const currentIdx = RANK_TIERS.findIndex((r) => r.key === currentRank.key);
    const storedIdx = storedKey ? RANK_TIERS.findIndex((r) => r.key === storedKey) : -1;
    if (storedIdx >= 0 && currentIdx > storedIdx) {
      setRankUpRank(currentRank);
      rankUpShownRef.current = true;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("gavana_rank_key", currentRank.key);
    }
  }, [loading, aiFeedbackHistory, userReels.length, stats.followers, profileUser?.streakCount, totalLikes, isOwnProfile]);

  return {
    profileUser, setProfileUser,
    userReels, setUserReels,
    savedUserReels, setSavedUserReels,
    aiFeedbackHistory,
    trainingSessions,
    loading, setLoading,
    totalLikes, setTotalLikes,
    stats, setStats,
    isFollowing, setIsFollowing,
    isMutual, setIsMutual,
    isOwnProfile,
    challengeRanks,
    pvpStats,
    sparringRecord,
    myStats,
    userBadges,
    coachBookings,
    rankUpRank, setRankUpRank,
    loadFollowStats,
  };
}
