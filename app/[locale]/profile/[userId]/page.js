"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { createNotification, createNewFollowerNotification } from "@/lib/notifications";
import { startConversation } from "@/lib/messaging";
import { getLocale, translate } from "@/lib/i18n";
import { RANK_TIERS, calculateSessionXP, calculateUserXP, getFighterRank, getNextRank, getRankProgress } from "@/lib/xp";
import RankIcon from "@/components/RankIcon";
import RankUpModal from "@/components/RankUpModal";
import { getCurrentSeasonId } from "@/lib/season";
import MediaCover from "@/components/MediaCover";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import BottomSheet from "@/components/BottomSheet";
import { RED, GOLD , PURPLE, redAlpha, goldAlpha} from "@/lib/tokens";
import RankBeltModal from "@/components/profile/RankBeltModal";
import StreakDetailModal from "@/components/profile/StreakDetailModal";
import FighterShareCard from "@/components/profile/FighterShareCard";
import { WeeklyRecapModal, WeeklyLeaderboardModal } from "@/components/profile/WeeklyModals";
import BattleSection from "@/components/profile/BattleSection";
import TrainingProgressSection from "@/components/profile/TrainingProgressSection";

function getSafeReelLikes(reel) {
  const fieldLikes = typeof reel.likes === "number" && !Number.isNaN(reel.likes)
    ? reel.likes
    : reel.likesCount;

  if (typeof fieldLikes !== "number" || Number.isNaN(fieldLikes)) {
    return 0;
  }

  return Math.max(0, fieldLikes);
}

function getTimestampMs(timestamp) {
  if (!timestamp) return 0;
  if (timestamp.toMillis) return timestamp.toMillis();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatScore(score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return "0";
  return numericScore.toFixed(1).replace(/\.0$/, "");
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPreviousLocalDateKey(date = new Date()) {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return getLocalDateKey(previous);
}

function getActiveChallengeStreak(profile) {
  const lastDate = String(profile?.lastChallengeDate || "");
  if (lastDate !== getLocalDateKey() && lastDate !== getPreviousLocalDateKey()) return 0;
  return Number(profile?.challengeStreak) || 0;
}

export default function UserProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const locale = getLocale(params?.locale);
  const userId = params?.userId;
  const t = (key) => translate(locale, key);
  const router = useRouter();

  const BADGE_META = {
    first_challenge: { icon: "🥊", label: t("profileBadgeFirstChallenge"), color: RED },
    streak_3:        { icon: "🔥", label: t("profileBadgeStreak3"), color: "#FB923C" },
    streak_7:        { icon: "⚡", label: t("profileBadgeStreak7"), color: "#F59E0B" },
    jab_master:      { icon: "🎯", label: t("profileBadgeJabMaster"), color: "#60A5FA" },
    speed_king:      { icon: "💨", label: t("profileBadgeSpeedKing"), color: PURPLE },
    creator_starter: { icon: "🎬", label: t("creatorTag"), color: "#34D399" },
  };
  const [profileUser, setProfileUser] = useState(null);
  const [userReels, setUserReels] = useState([]);
  const [savedUserReels, setSavedUserReels] = useState([]);
  const [aiFeedbackHistory, setAiFeedbackHistory] = useState([]);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [profileTab, setProfileTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [totalLikes, setTotalLikes] = useState(0);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutual, setIsMutual] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [previewFailures, setPreviewFailures] = useState({});
  const [deletingReelIds, setDeletingReelIds] = useState(new Set());
  const [deleteConfirmReel, setDeleteConfirmReel] = useState(null);
  const [rankUpRank, setRankUpRank] = useState(null);
  const [expandedTrainingGroups, setExpandedTrainingGroups] = useState(new Set());
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [challengeRanks, setChallengeRanks] = useState(null);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);
  const [pvpStats, setPvpStats] = useState(null);
  const [sparringRecord, setSparringRecord] = useState(null);
  const [coachBookings, setCoachBookings] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [showFighterCard, setShowFighterCard] = useState(false);
  const [cardShareCopied, setCardShareCopied] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const tabContentRef = useRef(null);
  const [challengeSending, setChallengeSending] = useState(false);
  const [challengeSent, setChallengeSent] = useState(false);
  const [myStats, setMyStats] = useState(null);
  const rankUpShownRef = useRef(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      setLoading(false);
      router.push(`/${locale}/login`);
    }
  }, [user, authLoading, locale, router]);

  // Load profile data
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
        const { collection, getDocs, query, where, orderBy } = await import("firebase/firestore");
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

  // Load follow statistics
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

  // Check if current user is following this profile (and if the follow is mutual)
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

  // Handle message
  const handleMessage = async () => {
    if (!user) { router.push(`/${locale || "en"}/login`); return; }
    if (isOwnProfile) { router.push(`/${locale || "en"}/inbox`); return; }
    try {
      const convoId = await startConversation(user, userId, {
        displayName: profileUser?.displayName || profileUser?.username || "",
        photoURL: profileUser?.photoURL || "",
      });
      router.push(`/${locale || "en"}/inbox/${convoId}`);
    } catch (e) {
      console.error("Message error:", e);
    }
  };

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!user) {
      router.push(`/${locale || "en"}/login`);
      return;
    }

    if (isOwnProfile || followLoading) return;

    setFollowLoading(true);
    const wasFollowing = isFollowing;
    const previousStats = stats;
    setIsFollowing(!wasFollowing);
    setStats((prev) => ({
      ...prev,
      followers: Math.max(0, prev.followers + (wasFollowing ? -1 : 1))
    }));

    try {
      const { doc, setDoc, deleteDoc, getDoc, serverTimestamp } = await import("firebase/firestore");

      const followRef = doc(db, "follows", `${user.uid}_${userId}`);

      if (wasFollowing) {
        // Unfollow
        await deleteDoc(followRef);
        setIsMutual(false);
        // Reload follow stats to ensure accuracy
        await loadFollowStats(userId);
      } else {
        // Follow
        await setDoc(followRef, {
          followerId: user.uid,
          followingId: userId,
          createdAt: serverTimestamp()
        });
        createNewFollowerNotification({
          recipientId: userId,
          actorId: user.uid,
          actorName: user.displayName || user.email?.split("@")[0],
          actorPhotoURL: user.photoURL || "",
        });
        // Check if now mutual
        const reverseDoc = await getDoc(doc(db, "follows", `${userId}_${user.uid}`));
        setIsMutual(reverseDoc.exists());
        // Reload follow stats to ensure accuracy
        await loadFollowStats(userId);
      }
    } catch (error) {
      console.error("Error following user:", error);
      setIsFollowing(wasFollowing);
      setStats(previousStats);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLogout = async () => {
    if (signingOut) return;

    setSigningOut(true);
    try {
      await signOut(auth);
      router.push(`/${locale}/login`);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setSigningOut(false);
    }
  };

  const handleSendChallenge = async (challengeId) => {
    if (!user?.uid || !userId || challengeSending) return;
    setChallengeSending(true);
    try {
      const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
      await addDoc(collection(db, "pvp_challenges"), {
        challengerId: user.uid,
        opponentId: userId,
        challengeId,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, "notifications"), {
        recipientId: userId,
        actorId: user.uid,
        actorName: user.displayName || "Fighter",
        fromUserId: user.uid,
        fromUsername: user.displayName || "Fighter",
        fromUserPhotoURL: user.photoURL || "",
        type: "pvp_challenge",
        challengeId,
        message: locale === "mn"
          ? `${user.displayName || "Fighter"} тан руу тулааны шийдэл илгээлээ!`
          : locale === "ko"
          ? `${user.displayName || "Fighter"}님이 PvP 배틀을 신청했습니다!`
          : `${user.displayName || "Fighter"} challenged you to a battle!`,
        read: false,
        createdAt: serverTimestamp(),
      });
      setChallengeSent(true);
      setTimeout(() => { setChallengeSent(false); setShowChallengeModal(false); }, 2000);
    } catch (e) {
      console.error("challenge send error", e);
    } finally {
      setChallengeSending(false);
    }
  };

  const handleSwitchAccount = async () => {
    if (signingOut) return;

    setSigningOut(true);
    try {
      await signOut(auth);
      router.push(`/${locale}/login`);
    } catch (error) {
      console.error("Error switching account:", error);
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteReel = async (event, reel) => {
    event.stopPropagation();

    if (!user?.uid || reel.userId !== user.uid || deletingReelIds.has(reel.id)) {
      return;
    }

    const previousUserReels = userReels;
    const previousSavedReels = savedUserReels;

    setDeletingReelIds((prev) => new Set(prev).add(reel.id));
    setUserReels((prev) => prev.filter((item) => item.id !== reel.id));
    setSavedUserReels((prev) => prev.filter((item) => item.id !== reel.id));
    setTotalLikes((prev) => Math.max(0, prev - getSafeReelLikes(reel)));

    try {
      const {
        collection,
        deleteDoc,
        doc,
        getDocs,
        query,
        where,
        writeBatch,
      } = await import("firebase/firestore");

      const deleteDocsInBatches = async (docs) => {
        for (let i = 0; i < docs.length; i += 450) {
          const batch = writeBatch(db);
          docs.slice(i, i + 450).forEach((snapshotDoc) => {
            batch.delete(snapshotDoc.ref);
          });
          await batch.commit();
        }
      };

      const commentsSnapshot = await getDocs(collection(db, "reels", reel.id, "comments"));
      await deleteDocsInBatches(commentsSnapshot.docs);

      const likesSnapshot = await getDocs(query(
        collection(db, "user_likes"),
        where("reelId", "==", reel.id)
      ));
      await deleteDocsInBatches(likesSnapshot.docs);

      const savedSnapshot = await getDocs(query(
        collection(db, "saved_reels"),
        where("reelId", "==", reel.id)
      ));
      await deleteDocsInBatches(savedSnapshot.docs);

      const notificationsSnapshot = await getDocs(query(
        collection(db, "notifications"),
        where("reelId", "==", reel.id)
      ));
      await deleteDocsInBatches(notificationsSnapshot.docs);

      await deleteDoc(doc(db, "reels", reel.id));
    } catch (error) {
      console.error("Error deleting reel:", error);
      setUserReels(previousUserReels);
      setSavedUserReels(previousSavedReels);
      setTotalLikes(previousUserReels.reduce((sum, item) => sum + getSafeReelLikes(item), 0));
      alert(t("deleteReelError"));
    } finally {
      setDeletingReelIds((prev) => {
        const next = new Set(prev);
        next.delete(reel.id);
        return next;
      });
    }
  };

  // Per-session XP breakdowns — must be before any early return (Rules of Hooks)
  const xpBreakdowns = useMemo(() => {
    const streak = profileUser?.streakCount || 0;
    const sortedAsc = [...(aiFeedbackHistory || [])]
      .map((fb) => ({ ...fb, _ts: getTimestampMs(fb.createdAt) }))
      .sort((a, b) => a._ts - b._ts);
    const result = {};
    let prevScore = null;
    for (const fb of sortedAsc) {
      const score = Number(fb.score);
      if (!Number.isFinite(score)) continue;
      result[fb.id] = calculateSessionXP(score, prevScore, streak);
      prevScore = score;
    }
    return result;
  }, [aiFeedbackHistory, profileUser?.streakCount]);

  const groupedTrainingSessions = useMemo(() => {
    const groups = new Map();

    for (const session of trainingSessions) {
      const key = session.reelId || "free_training";
      const existing = groups.get(key) || {
        key,
        reelId: session.reelId || null,
        label: session.reelId ? `${t("reels.combo")} ${String(session.reelId).slice(0, 8)}` : t("freeTraining"),
        sessions: [],
        latestScore: null,
        bestScore: null,
        firstScore: null,
        latestAt: 0,
        earliestAt: Infinity,
        totalHits: 0,
        totalPunches: 0,
        bestComboStr: null,
      };

      const score = Number(session.score);
      const createdAtMs = getTimestampMs(session.createdAt);
      const hits = Number(session.hits) || 0;
      const punches = Number(session.totalPunches || session.punches) || 0;

      existing.sessions.push(session);
      existing.totalHits += hits;
      existing.totalPunches += punches;

      if (Number.isFinite(score)) {
        existing.bestScore = existing.bestScore === null ? score : Math.max(existing.bestScore, score);
        if (createdAtMs >= existing.latestAt) {
          existing.latestAt = createdAtMs;
          existing.latestScore = score;
        }
        if (createdAtMs < existing.earliestAt) {
          existing.earliestAt = createdAtMs;
          existing.firstScore = score;
        }
      }
      if (session.combo && (!existing.bestComboStr || score > existing.bestScore)) {
        existing.bestComboStr = session.combo;
      }

      groups.set(key, existing);
    }

    return [...groups.values()]
      .map((group) => {
        const sortedSessions = group.sessions.sort((a, b) => {
          const attemptDelta = (Number(b.attemptNumber) || 0) - (Number(a.attemptNumber) || 0);
          if (attemptDelta !== 0) return attemptDelta;
          return getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt);
        });
        const acc = group.totalPunches > 0
          ? Math.round((group.totalHits / group.totalPunches) * 100)
          : null;
        const delta = group.firstScore !== null && group.latestScore !== null
          ? group.latestScore - group.firstScore
          : null;
        return {
          ...group,
          sessions: sortedSessions,
          accuracy: acc,
          improvementDelta: delta,
        };
      })
      .sort((a, b) => b.latestAt - a.latestAt);
  }, [trainingSessions, t]);

  const toggleTrainingGroup = (groupKey) => {
    setExpandedTrainingGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  useEffect(() => {
    if (tabContentRef.current) {
      tabContentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [profileTab]);

  const progressStats = useMemo(() => {
    const sortedAsc = [...(aiFeedbackHistory || [])]
      .map((feedback) => ({
        ...feedback,
        scoreNumber: Number(feedback.score),
        ts: getTimestampMs(feedback.createdAt),
      }))
      .filter((feedback) => Number.isFinite(feedback.scoreNumber))
      .sort((a, b) => a.ts - b.ts);

    const totalSessions = sortedAsc.length;
    const scores = sortedAsc.map((feedback) => feedback.scoreNumber);
    const firstScore = totalSessions ? sortedAsc[0].scoreNumber : null;
    const latestScoreValue = totalSessions ? sortedAsc[totalSessions - 1].scoreNumber : null;
    const bestScoreValue = totalSessions ? Math.max(...scores) : null;
    const averageScoreValue = totalSessions
      ? scores.reduce((sum, score) => sum + score, 0) / totalSessions
      : null;
    const improvement = firstScore !== null && latestScoreValue !== null
      ? latestScoreValue - firstScore
      : null;
    const weeklySequence = sortedAsc.slice(-7).map((feedback) => formatScore(feedback.scoreNumber));

    const comboMap = new Map();
    for (const feedback of sortedAsc) {
      const key = feedback.reelId || "free_training";
      const existing = comboMap.get(key) || {
        key,
        label: feedback.reelId ? `${t("reels.combo")} ${String(feedback.reelId).slice(0, 8)}` : t("freeTraining"),
        bestScore: null,
        attemptCount: 0,
      };

      existing.attemptCount += 1;
      existing.bestScore = existing.bestScore === null
        ? feedback.scoreNumber
        : Math.max(existing.bestScore, feedback.scoreNumber);
      comboMap.set(key, existing);
    }

    return {
      totalSessions,
      firstScore,
      latestScore: latestScoreValue,
      bestScore: bestScoreValue,
      averageScore: averageScoreValue,
      improvement,
      weeklySequence,
      comboProgress: [...comboMap.values()].sort((a, b) => b.bestScore - a.bestScore),
    };
  }, [aiFeedbackHistory, t]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", padding: "calc(28px + env(safe-area-inset-top)) 16px 40px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 14 }}>
          <div className="shimmer" style={{ width: 40, height: 40, borderRadius: 10 }} />
          <div className="shimmer" style={{ height: 220, borderRadius: 20 }} />
          <div className="shimmer" style={{ height: 80, borderRadius: 16 }} />
          <div className="shimmer" style={{ height: 60, borderRadius: 14 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[1,2,3].map((i) => <div key={i} className="shimmer" style={{ height: 70, borderRadius: 14 }} />)}
          </div>
          <div className="shimmer" style={{ height: 160, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (!user || !profileUser) {
    return null; // Will redirect
  }

  const feedbackScores = aiFeedbackHistory
    .map((feedback) => Number(feedback.score))
    .filter((score) => Number.isFinite(score));

  const streakCount = profileUser?.streakCount || 0;
  const storedChallengeXP = Number(profileUser?.xp) || 0;
  const trainingSessionXP = trainingSessions.reduce((sum, s) => sum + (Number(s.xpGained) || 0), 0);
  const xp = storedChallengeXP + trainingSessionXP + calculateUserXP({
    aiFeedbackDocs: aiFeedbackHistory,
    streakDays: streakCount,
    likesReceived: totalLikes,
  });
  const fighterRank = getFighterRank(xp);
  const nextRank = getNextRank(xp);
  const rankProgress = getRankProgress(xp);
  const xpToNextVal = nextRank ? nextRank.minXP - xp : 0;

  const latestScore = feedbackScores.length ? feedbackScores[0] : null;
  const bestScore = feedbackScores.length ? Math.max(...feedbackScores) : null;
  const averageScore = feedbackScores.length
    ? feedbackScores.reduce((sum, score) => sum + score, 0) / feedbackScores.length
    : null;
  const visibleReels = profileTab === "saved" ? savedUserReels : userReels;
  const markPreviewFailed = (reelId, type) => {
    setPreviewFailures((prev) => ({ ...prev, [`${reelId}:${type}`]: true }));
  };
  const handleStatNavigate = (target) => {
    if (target === "posts") {
      setProfileTab("posts");
      router.push(`/${locale}/profile/${userId}`);
      return;
    }

    router.push(`/${locale}/profile/${userId}?view=${target}`);
  };

  return (
    <div className="page-enter" style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse at top center, ${redAlpha(0.08)} 0%, transparent 50%), var(--background)`,
      color: "var(--text-primary)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: 0,
      overflowX: "hidden"
    }}>
      <header style={styles.backHeader}>
        <button
          type="button"
          style={styles.backBtnProfile}
          onClick={() => router.back()}
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </header>
      <section style={styles.fighterCard}>
        {/* ── Cover Photo ── */}
        <div style={styles.coverPhotoSection}>
          {(profileUser.coverPhotoURL || profileUser.coverPhoto) ? (
            <img src={profileUser.coverPhotoURL || profileUser.coverPhoto} alt="" style={styles.coverPhotoImg} />
          ) : (
            <div style={styles.coverPhotoFallback} />
          )}
          <div style={styles.coverPhotoGradient} />
          {isOwnProfile && (
            <button type="button" style={styles.coverPhotoEditBtn} onClick={() => router.push(`/${locale}/profile/edit`)}>
              📷
            </button>
          )}
        </div>

        <div style={styles.fighterCardInner}>
        {/* Avatar */}
        <div
          className={streakCount >= 10 ? "avatar-on-fire" : undefined}
          style={{
            ...styles.avatarFrame,
            ...(streakCount >= 5 ? {
              boxShadow: `0 0 0 1px ${goldAlpha(0.55)}, 0 22px 70px rgba(0,0,0,0.5), 0 0 28px rgba(251,146,60,0.6), 0 0 56px rgba(251,146,60,0.28)`,
              border: "3px solid #FB923C",
            } : {}),
          }}
        >
          {profileUser.photoURL ? (
            <img
              src={profileUser.photoURL}
              alt={profileUser.displayName || profileUser.username || "Profile"}
              style={styles.avatarImage}
            />
          ) : (
            profileUser.displayName?.charAt(0).toUpperCase() || profileUser.username?.charAt(0).toUpperCase() || "U"
          )}
        </div>

        {/* "Add Story" shortcut — own profile only */}
        {isOwnProfile && (
          <button
            type="button"
            onClick={() => router.push(`/${locale}/story/upload`)}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, padding: "5px 12px", borderRadius: 999, border: `1px solid ${redAlpha(0.35)}`, background: `${redAlpha(0.08)}`, color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: 0.3 }}
          >
            <span style={{ fontSize: 13 }}>+</span>
            {t("profileAddStory")}
          </button>
        )}

        {/* Name + username */}
        <h1 style={styles.fighterName}>
          {profileUser.displayName || profileUser.username}
        </h1>
        <div style={styles.fighterUsername}>@{profileUser.username}</div>

        {/* Bio */}
        {profileUser.bio && (
          <p style={styles.bio}>{profileUser.bio}</p>
        )}

        {/* Archetype badge */}
        {profileUser.fighterArchetype && ARCHETYPE_DISPLAY[profileUser.fighterArchetype] && (() => {
          const arch = ARCHETYPE_DISPLAY[profileUser.fighterArchetype];
          return (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 14px", borderRadius: 999,
                background: `${arch.color}15`,
                border: `1px solid ${arch.color}44`,
                color: arch.color, fontSize: 13, fontWeight: 800,
              }}>
                {arch.emoji} {arch.name}
              </span>
            </div>
          );
        })()}

        {/* Gym + weight class metadata */}
        {(profileUser.gym || profileUser.weightClass) && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {profileUser.gym && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "3px 10px", borderRadius: 999, fontWeight: 700 }}>
                🏋️ {profileUser.gym}
              </span>
            )}
            {profileUser.weightClass && (
              <span style={{ fontSize: 11, color: "#60A5FA", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", padding: "3px 10px", borderRadius: 999, fontWeight: 700 }}>
                ⚖️ {profileUser.weightClass}kg
              </span>
            )}
          </div>
        )}

        {/* Fighter identity tags — derived from data */}
        {(() => {
          const tags = [];
          tags.push({ label: t(fighterRank.key), color: fighterRank.color, bg: `${fighterRank.color}18`, border: `${fighterRank.color}44` });
          const challengeStreak = getActiveChallengeStreak(profileUser);
          if (challengeStreak > 0) tags.push({ label: `🔥 ${challengeStreak}d`, color: "#FB923C", bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.35)" });
          if (bestScore !== null) tags.push({ label: `⭐ ${formatScore(bestScore)}/10`, color: GOLD, bg: `${goldAlpha(0.12)}`, border: `${goldAlpha(0.35)}` });
          if (userReels.length > 0) tags.push({ label: `🎬 ${t("creatorTag")}`, color: "#60A5FA", bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.28)" });
          if (challengeRanks?.weeklyRank && challengeRanks.weeklyRank <= 10) tags.push({ label: `#${challengeRanks.weeklyRank} ${t("seasonCurrentWeek")}`, color: GOLD, bg: `${goldAlpha(0.12)}`, border: `${goldAlpha(0.32)}` });
          if (pvpStats && pvpStats.wins > 0) tags.push({ label: `⚔️ ${pvpStats.wins}W ${pvpStats.losses}L`, color: PURPLE, bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.28)" });
          return (
            <div style={styles.fighterTagsRow}>
              {tags.map((tag, i) => (
                <span key={i} style={{ ...styles.fighterTag, color: tag.color, background: tag.bg, borderColor: tag.border }}>
                  {tag.label}
                </span>
              ))}
            </div>
          );
        })()}

        {/* Rank row — tappable, opens rank modal */}
        <button type="button" onClick={() => setShowRankModal(true)} style={styles.rankRow}>
          <RankIcon rank={fighterRank} size={30} animated />
          <span style={{ ...styles.rankLabel, color: fighterRank.color }}>{t(fighterRank.key)}</span>
        </button>

        {/* XP progress bar */}
        <div style={styles.xpWrap}>
          <div style={styles.xpTopRow}>
            <span style={{ ...styles.xpAmount, color: fighterRank.color }}>
              {xp.toLocaleString()} {t("xpLabel")}
            </span>
            <span style={styles.xpNextLabel}>
              {nextRank
                ? t("xpToNext").replace("{xp}", xpToNextVal.toLocaleString()).replace("{rank}", t(nextRank.key))
                : t("atMaxRank")}
            </span>
          </div>
          <div style={styles.xpTrack}>
            <div style={{ ...styles.xpFill, width: `${rankProgress}%`, background: fighterRank.gradient }} />
          </div>
        </div>

        {/* Achievements Shelf */}
        {userBadges.length > 0 && (
          <div style={styles.achievementsShelf}>
            {userBadges.map((b) => {
              const meta = BADGE_META[b.badgeId] || { icon: "🏅", label: b.badgeId, color: GOLD };
              return (
                <div key={b.badgeId} style={{ ...styles.achievementCard, borderColor: meta.color + "44" }}>
                  <span style={{ fontSize: 22 }}>{meta.icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 900, color: meta.color, marginTop: 4, textAlign: "center", lineHeight: 1.2, letterSpacing: 0.3 }}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats row: posts / followers / following */}
        <div style={styles.statsRow}>
          <button type="button" onClick={() => handleStatNavigate("posts")} style={styles.statButton}>
            <span style={styles.statNumber}>{userReels.length}</span>
            <span style={styles.statLabel}>{t("posts")}</span>
          </button>
          <button type="button" onClick={() => handleStatNavigate("followers")} style={styles.statButton}>
            <span style={styles.statNumber}>{stats.followers}</span>
            <span style={styles.statLabel}>{t("followers")}</span>
          </button>
          <button type="button" onClick={() => handleStatNavigate("following")} style={styles.statButton}>
            <span style={styles.statNumber}>{stats.following}</span>
            <span style={styles.statLabel}>{t("followingCount")}</span>
          </button>
        </div>

        {/* Action buttons */}
        {isOwnProfile ? (
          <div style={styles.actionRow}>
            <button onClick={() => router.push(`/${locale}/profile/edit`)} style={styles.ghostAction}>
              {t("editProfile")}
            </button>
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              style={{ ...styles.ghostAction, color: GOLD, borderColor: `${goldAlpha(0.3)}` }}
            >
              {t("dashboardViewProgress")}
            </button>
            {userReels.length > 0 && (
              <button onClick={() => router.push(`/${locale}/creator/dashboard`)} style={styles.ghostAction}>
                {t("creatorDashboard")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFighterCard(true)}
              style={{ ...styles.ghostAction, color: GOLD, borderColor: `${goldAlpha(0.3)}` }}
            >
              🥊 {t("profileFighterCard")}
            </button>
            <button
              onClick={handleLogout}
              disabled={signingOut}
              style={{ ...styles.ghostAction, opacity: signingOut ? 0.7 : 1, cursor: signingOut ? "not-allowed" : "pointer" }}
            >
              {signingOut ? t("signingOut") : t("logout")}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleFollow}
                disabled={followLoading}
                style={{
                  ...styles.followAction,
                  background: followLoading ? "#555" : (isFollowing ? "#151515" : RED),
                  cursor: followLoading ? "not-allowed" : "pointer",
                  opacity: followLoading ? 0.7 : 1
                }}
              >
                {followLoading ? t("followLoading") : (isFollowing ? t("unfollow") : t("follow"))}
              </button>
              <button
                type="button"
                onClick={handleMessage}
                style={{
                  height: 38, padding: "0 18px", borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff", fontSize: 13, fontWeight: 800,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {t("profileMessageBtn")}
              </button>
            </div>
            {isMutual && (
              <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 0.5 }}>
                ⇄ {t("mutual")}
              </span>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
              <button
                type="button"
                onClick={() => { setShowChallengeModal(true); setChallengeSent(false); }}
                style={{ ...styles.ghostAction, color: PURPLE, borderColor: "rgba(167,139,250,0.3)", flex: 1 }}
              >
                ⚔️ {t("profileChallengeBtn")}
              </button>
              <button
                type="button"
                onClick={() => setShowFighterCard(true)}
                style={{ ...styles.ghostAction, color: GOLD, borderColor: `${goldAlpha(0.3)}`, flex: 1 }}
              >
                🥊 {t("profileFighterCard")}
              </button>
            </div>
          </div>
        )}
        </div>
      </section>

      {/* ── Rival Comparison ── */}
      {!isOwnProfile && myStats && (
        <div style={{ padding: "0 16px 4px" }}>
          <div style={{ background: "linear-gradient(145deg, #0d0b0d, #0a0a0a)", border: "1px solid rgba(167,139,250,0.15)", borderLeft: `3px solid ${PURPLE}`, borderRadius: "3px 16px 16px 3px", padding: "14px 16px" }}>
            <p style={{ margin: "0 0 10px", fontSize: 9, fontWeight: 900, color: PURPLE, letterSpacing: 2, textTransform: "uppercase" }}>
              ⚔️ {t("profileYouVs")}{(profileUser.displayName || profileUser.username || "Fighter").split(" ")[0]}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
              {/* Headers */}
              <div style={{ textAlign: "center", fontSize: 9, fontWeight: 900, color: RED, letterSpacing: 0.5, paddingBottom: 8 }}>
                {t("profileYouLabel")}
              </div>
              <div />
              <div style={{ textAlign: "center", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: 0.5, paddingBottom: 8 }}>
                {(profileUser.displayName || profileUser.username || "Fighter").split(" ")[0].toUpperCase().slice(0, 8)}
              </div>
              {[
                { label: "XP", my: myStats.xp, their: xp, fmt: v => v.toLocaleString() },
                { label: t("profileStatBest"), my: myStats.bestScore, their: bestScore, fmt: v => v !== null ? `${formatScore(v)}/10` : "—" },
                { label: t("profileStatStreak"), my: myStats.streak, their: getActiveChallengeStreak(profileUser), fmt: v => v > 0 ? `🔥${v}d` : "—" },
              ].map((stat, i) => {
                const myNum = Number(stat.my) || 0;
                const theirNum = Number(stat.their) || 0;
                const myWins = myNum > theirNum;
                const theirWins = theirNum > myNum;
                const sep = i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none";
                return (
                  <div key={i} style={{ display: "contents" }}>
                    <div style={{ textAlign: "center", padding: "7px 0", borderTop: sep }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: myWins ? "#34D399" : "#fff" }}>{stat.fmt(stat.my)}</span>
                    </div>
                    <div style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "#555", paddingTop: i > 0 ? 7 : 0, borderTop: sep }}>
                      {stat.label}
                    </div>
                    <div style={{ textAlign: "center", padding: "7px 0", borderTop: sep }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: theirWins ? "#34D399" : "#fff" }}>{stat.fmt(stat.their)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={styles.profileTabs}>
        <button
          type="button"
          onClick={() => setProfileTab("posts")}
          style={{
            ...styles.profileTab,
            ...(profileTab === "posts" ? styles.profileTabActive : {})
          }}
        >
          {t("postsGrid")}
        </button>
        {isOwnProfile && (
          <button
            type="button"
            onClick={() => setProfileTab("saved")}
            style={{
              ...styles.profileTab,
              ...(profileTab === "saved" ? styles.profileTabActive : {})
            }}
          >
            {t("saved")}
          </button>
        )}
        <button
          type="button"
          onClick={() => setProfileTab("progress")}
          style={{
            ...styles.profileTab,
            ...(profileTab === "progress" ? styles.profileTabActive : {})
          }}
        >
          {t("aiProgress")}
        </button>
        <button
          type="button"
          onClick={() => setProfileTab("record")}
          style={{
            ...styles.profileTab,
            ...(profileTab === "record" ? styles.profileTabActive : {})
          }}
        >
          ⚔️ {t("profileRecordTab")}
        </button>
      </div>

      <div ref={tabContentRef} />

      {profileTab === "progress" ? (
        <TrainingProgressSection
          feedbackScores={feedbackScores}
          progressStats={progressStats}
          streakCount={streakCount}
          fighterRank={fighterRank}
          xp={xp}
          nextRank={nextRank}
          rankProgress={rankProgress}
          aiFeedbackHistory={aiFeedbackHistory}
          isOwnProfile={isOwnProfile}
          locale={locale}
          t={t}
          onGoToDashboard={() => router.push(`/${locale}/dashboard`)}
          onGoToReels={() => router.push(`/${locale}/reels`)}
        />
      ) : profileTab === "record" ? (
        <BattleSection
          pvpStats={pvpStats}
          sparringRecord={sparringRecord}
          isOwnProfile={isOwnProfile}
          locale={locale}
          t={t}
          onGoToSparring={() => router.push(`/${locale}/sparring`)}
        />
      ) : (
      <div style={{
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 2,
        width: "100%"
      }}>
        {visibleReels.length === 0 ? (
          <div style={styles.reelGridEmpty}>
            <div style={styles.reelGridEmptyIcon}>🥊</div>
            <p style={styles.reelGridEmptyTitle}>
              {profileTab === "saved" ? t("noSavedReelsYet") : t("noReelsYet")}
            </p>
            <p style={styles.reelGridEmptyText}>
              {profileTab === "saved" ? t("bookmarkedReelsEmpty") : t("trainingClipsEmpty")}
            </p>
            {profileTab !== "saved" && isOwnProfile && (
              <button
                type="button"
                style={styles.reelGridEmptyCta}
                onClick={() => router.push(`/${locale}/upload`)}
              >
                {t("uploadFirstReel")}
              </button>
            )}
          </div>
        ) : (
          visibleReels.map((reel) => {
            const imageFailed = previewFailures[`${reel.id}:image`];
            const videoFailed = previewFailures[`${reel.id}:video`];
            const showImage = reel.thumbnailUrl && !imageFailed;
            const showVideo = !showImage && reel.videoUrl && !videoFailed;
            const likeCount = getSafeReelLikes(reel);
            const canDeleteReel = user?.uid && reel.userId === user.uid;
            const isDeletingReel = deletingReelIds.has(reel.id);
            const effectiveType = reel.contentType || reel.type || "lifestyle";

            return (
              <div
                key={reel.id}
                className="profile-reel-tile"
                style={{
                  aspectRatio: "9/16",
                  overflow: "hidden",
                  background: "#0a0a0a",
                  cursor: "pointer",
                  position: "relative",
                  borderRadius: 2,
                }}
                onClick={() => router.push(`/${locale}/reels?reelId=${reel.id}&source=profile&userId=${userId}`)}
                onMouseEnter={(e) => {
                  const video = e.currentTarget.querySelector("video");
                  if (video) video.play().catch(() => {});
                }}
                onMouseLeave={(e) => {
                  const video = e.currentTarget.querySelector("video");
                  if (video) { video.pause(); video.currentTime = 0; }
                }}
              >
                {showImage ? (
                  <img
                    src={reel.thumbnailUrl}
                    alt={reel.description || t("trainingReel")}
                    className="profile-reel-media"
                    style={styles.reelPreviewMedia}
                    loading="lazy"
                    onError={() => markPreviewFailed(reel.id, "image")}
                  />
                ) : showVideo ? (
                  <video
                    src={reel.videoUrl}
                    className="profile-reel-media"
                    style={styles.reelPreviewMedia}
                    muted
                    playsInline
                    loop
                    preload="metadata"
                    poster={reel.thumbnailUrl || undefined}
                    onLoadedMetadata={(event) => {
                      try {
                        if (event.currentTarget.currentTime === 0) {
                          event.currentTarget.currentTime = 0.05;
                        }
                      } catch {
                        // Some mobile browsers do not allow seeking before enough data is ready.
                      }
                    }}
                    onError={() => markPreviewFailed(reel.id, "video")}
                  />
                ) : (
                  <MediaCover
                    contentType={effectiveType}
                    caption={reel.description || reel.caption}
                    style={{ position: "absolute", inset: 0 }}
                  />
                )}

                {/* Hover play hint (desktop only via CSS) */}
                {showVideo && (
                  <div className="reel-play-hint">
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                )}

                {/* Content type indicator — top-left */}
                <div style={styles.reelTileTypeBadge}>
                  {effectiveType === "training" ? "🥊" : effectiveType === "educational" ? "📚" : "🎬"}
                </div>

                {canDeleteReel && (
                  <button
                    type="button"
                    aria-label={t("deleteReel")}
                    title={t("deleteReel")}
                    onClick={(event) => { event.stopPropagation(); if (!isDeletingReel) setDeleteConfirmReel(reel); }}
                    disabled={isDeletingReel}
                    style={{
                      ...styles.deleteReelButton,
                      opacity: isDeletingReel ? 0.55 : 1,
                      cursor: isDeletingReel ? "not-allowed" : "pointer",
                    }}
                  >
                    {isDeletingReel
                      ? <span style={{ fontSize: 11, fontWeight: 900 }}>...</span>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                    }
                  </button>
                )}
                <div style={styles.reelTileOverlay}>
                  <div style={styles.reelTileLikes}>
                    ♥ {likeCount}
                  </div>
                  {reel.description && (
                    <div style={styles.reelTileCaption}>
                      {reel.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      )}

      <style>{`
        .profile-reel-tile .profile-reel-media {
          transform: scale(1);
          transition: transform var(--motion-fast), filter var(--motion-fast);
        }
        .profile-reel-tile:hover .profile-reel-media {
          transform: scale(1.08);
          filter: contrast(1.08);
        }
        .profile-reel-tile:active .profile-reel-media {
          transform: scale(1.12);
          filter: contrast(1.12);
        }
        @media (hover: hover) {
          .profile-reel-tile .reel-play-hint {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 180ms ease;
            pointer-events: none;
            z-index: 2;
          }
          .profile-reel-tile:hover .reel-play-hint {
            opacity: 1;
          }
        }
        @keyframes avatarFire {
          0%,100% { box-shadow: 0 0 0 1px rgba(212,175,55,0.55), 0 22px 70px rgba(0,0,0,0.5), 0 0 28px rgba(251,146,60,0.7), 0 0 56px rgba(251,146,60,0.35); border-color: #FB923C; }
          50%      { box-shadow: 0 0 0 1px rgba(212,175,55,0.75), 0 22px 70px rgba(0,0,0,0.5), 0 0 44px rgba(251,146,60,1.0), 0 0 88px rgba(251,146,60,0.55); border-color: #FFA040; }
        }
        .avatar-on-fire { animation: avatarFire 1.6s ease-in-out infinite; }
      `}</style>

      {rankUpRank && (
        <RankUpModal rank={rankUpRank} onClose={() => setRankUpRank(null)} t={t} />
      )}

      <BottomSheet
        open={!!deleteConfirmReel}
        onClose={() => setDeleteConfirmReel(null)}
        centered
        zIndex={9999}
        maxWidth={340}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
          <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900, color: "#fff" }}>
            {t("profileDeleteTitle")}
          </p>
          <p style={{ margin: "0 0 24px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            {t("profileDeleteWarning")}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => setDeleteConfirmReel(null)}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              {t("profileCancelBtn")}
            </button>
            <button
              type="button"
              onClick={async () => { const reel = deleteConfirmReel; setDeleteConfirmReel(null); await handleDeleteReel({ stopPropagation: () => {} }, reel); }}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.15)", color: "#F87171", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
            >
              {t("profileDeleteBtn")}
            </button>
          </div>
        </div>
      </BottomSheet>

      {showStreakModal && (
        <StreakDetailModal
          profile={profileUser}
          trainingSessions={trainingSessions}
          t={t}
          onClose={() => setShowStreakModal(false)}
        />
      )}

      {showRankModal && (
        <RankBeltModal
          xp={xp}
          fighterRank={fighterRank}
          nextRank={nextRank}
          rankProgress={rankProgress}
          t={t}
          onClose={() => setShowRankModal(false)}
        />
      )}

      {showWeeklyRecap && (
        <WeeklyRecapModal
          aiFeedbackHistory={aiFeedbackHistory}
          profileUser={profileUser}
          t={t}
          onClose={() => setShowWeeklyRecap(false)}
        />
      )}

      {showChallengeModal && !isOwnProfile && (
        <BottomSheet
          open
          onClose={() => setShowChallengeModal(false)}
          zIndex={999}
          accent={PURPLE}
          maxWidth={480}
        >
          <div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: PURPLE, letterSpacing: 1.4, textTransform: "uppercase" }}>GAVANA PvP</p>
            <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color: "#fff" }}>
              {t("profileSendChallenge")}
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
            {t("profilePickChallenge")}
          </p>
          {challengeSent ? (
            <div style={{ textAlign: "center", padding: "24px 0", fontSize: 15, fontWeight: 900, color: "#34D399" }}>
              {t("profileChallengeSent")}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { id: "jab-minute", emoji: "👊", label: t("profileChallengeJabMinute"), desc: t("profileChallengeJabDesc") },
                { id: "speed-test", emoji: "⚡", label: t("profileChallengeSpeedTest"), desc: t("profileChallengeSpeedDesc") },
                { id: "combo-master", emoji: "🔥", label: t("profileChallengeComboMaster"), desc: t("profileChallengeComboDesc") },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={challengeSending}
                  onClick={() => handleSendChallenge(c.id)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(167,139,250,0.2)", background: challengeSending ? "rgba(167,139,250,0.04)" : "rgba(167,139,250,0.08)", cursor: challengeSending ? "not-allowed" : "pointer", textAlign: "left", width: "100%", transition: "background 0.15s" }}
                >
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{c.emoji}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", marginBottom: 2 }}>{c.label}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{c.desc}</div>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 16, color: "rgba(167,139,250,0.6)", flexShrink: 0 }}>›</span>
                </button>
              ))}
            </div>
          )}
        </BottomSheet>
      )}

      {showFighterCard && (
        <FighterShareCard
          profileUser={profileUser}
          fighterRank={fighterRank}
          xp={xp}
          rankProgress={rankProgress}
          pvpStats={pvpStats}
          bestScore={bestScore}
          challengeStreak={getActiveChallengeStreak(profileUser)}
          challengeRanks={challengeRanks}
          aiFeedbackHistory={aiFeedbackHistory}
          userBadges={userBadges}
          badgeMeta={BADGE_META}
          locale={locale}
          t={t}
          cardShareCopied={cardShareCopied}
          onShareCopied={setCardShareCopied}
          onClose={() => setShowFighterCard(false)}
        />
      )}

      {showWeeklyModal && challengeRanks && (
        <WeeklyLeaderboardModal
          challengeRanks={challengeRanks}
          t={t}
          onClose={() => setShowWeeklyModal(false)}
          onGoToChallenges={() => { setShowWeeklyModal(false); router.push(`/${locale}/challenges`); }}
        />
      )}
    </div>
  );
}

const styles = {
  backHeader: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    paddingTop: "calc(12px + env(safe-area-inset-top))",
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    background: "rgba(7,7,7,0.88)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  },
  backBtnProfile: {
    width: 40,
    height: 40,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.055)",
    color: "#fff",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  },
  fighterCard: {
    width: "100%",
    padding: "0 16px 28px",
    background: `radial-gradient(ellipse at 50% 0%, ${redAlpha(0.28)} 0%, ${redAlpha(0.06)} 40%, transparent 65%), linear-gradient(180deg, #0C0C0C 0%, #070707 100%)`,
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },
  coverPhotoSection: {
    position: "relative",
    height: 150,
    overflow: "hidden",
    background: "linear-gradient(135deg, #1a0404 0%, #0d0d0d 100%)",
    marginLeft: -16,
    marginRight: -16,
  },
  coverPhotoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  coverPhotoFallback: {
    width: "100%",
    height: "100%",
    background: `radial-gradient(ellipse at 50% 0%, ${redAlpha(0.35)} 0%, ${redAlpha(0.08)} 50%, transparent 100%)`,
  },
  coverPhotoGradient: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(7,7,7,0.75) 100%)",
    pointerEvents: "none",
  },
  coverPhotoEditBtn: {
    position: "absolute",
    bottom: 10,
    right: 12,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 8,
    color: "#fff",
    width: 32,
    height: 32,
    cursor: "pointer",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fighterCardInner: {
    width: "min(100%, 520px)",
    margin: "0 auto",
    textAlign: "center",
  },
  avatarFrame: {
    width: 148,
    height: 148,
    borderRadius: "50%",
    background: "linear-gradient(145deg, #C1121F, #310408)",
    border: `3px solid ${redAlpha(0.85)}`,
    boxShadow: `0 0 0 1px ${goldAlpha(0.5)}, 0 0 0 4px ${redAlpha(0.15)}, 0 24px 80px rgba(0,0,0,0.6), 0 0 48px ${redAlpha(0.25)}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 52,
    fontWeight: 1000,
    margin: "-52px auto 20px",
    color: "#FFFFFF",
    overflow: "hidden",
    position: "relative",
    zIndex: 1,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
  },
  fighterName: {
    margin: "8px 0 0",
    color: "#FFFFFF",
    fontSize: "clamp(36px, 11vw, 56px)",
    lineHeight: 0.92,
    fontWeight: 1000,
    letterSpacing: -0.5,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
  },
  fighterUsername: {
    marginTop: 10,
    color: "#AAAAAA",
    fontSize: 14,
    fontWeight: 750,
  },
  achievementsShelf: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    scrollbarWidth: "none",
    WebkitOverflowScrolling: "touch",
    padding: "14px 0 0",
    margin: "0 auto",
    maxWidth: 430,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  achievementCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid",
    minWidth: 76,
    gap: 4,
    flexShrink: 0,
  },
  bio: {
    maxWidth: 360,
    margin: "12px auto 0",
    color: "rgba(255,255,255,0.38)",
    fontSize: 12,
    lineHeight: 1.65,
    fontWeight: 400,
    fontStyle: "italic",
    letterSpacing: 0.2,
    padding: "8px 14px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 1,
    margin: "24px auto 24px",
    maxWidth: 430,
    borderTop: "1px solid rgba(255,255,255,0.06)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.01)",
  },
  statButton: {
    minHeight: 72,
    border: "none",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    background: "transparent",
    color: "#FFFFFF",
    display: "grid",
    alignContent: "center",
    justifyItems: "center",
    gap: 7,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 1,
    fontWeight: 1000,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
  },
  statLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  actionRow: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  ghostAction: {
    padding: "10px 17px",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 999,
    background: "rgba(255,255,255,0.055)",
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  followAction: {
    padding: "12px 34px",
    border: "none",
    borderRadius: 999,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 900,
  },
  profileTabs: {
    display: "flex",
    width: "100%",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "#070707",
    position: "sticky",
    top: 0,
    zIndex: 8,
  },
  profileTab: {
    flex: 1,
    minHeight: 50,
    border: "none",
    background: "transparent",
    color: "#777",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    cursor: "pointer",
  },
  profileTabActive: {
    color: "#FFFFFF",
    boxShadow: "inset 0 -2px 0 #C1121F",
  },
  reelPreviewMedia: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    background: "linear-gradient(145deg, #070707, #18090c)",
  },
  deleteReelButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 3,
    width: 30,
    height: 30,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(7,7,7,0.72)",
    color: "#fff",
    fontSize: 20,
    fontWeight: 800,
    lineHeight: "26px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 24px rgba(0,0,0,0.36)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  fighterTagsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    margin: "14px auto 4px",
    maxWidth: 430,
  },
  fighterTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid",
    fontSize: 11,
    fontWeight: 850,
    letterSpacing: 0.3,
    lineHeight: 1.4,
  },
  reelGridEmpty: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "72px 24px 80px",
    gap: 12,
    background: "var(--background)",
  },
  reelGridEmptyIcon: {
    fontSize: 52,
    lineHeight: 1,
    marginBottom: 4,
    filter: `drop-shadow(0 4px 16px ${redAlpha(0.4)})`,
  },
  reelGridEmptyTitle: {
    margin: 0,
    color: "var(--text-primary)",
    fontWeight: 950,
    fontSize: 20,
    textAlign: "center",
  },
  reelGridEmptyText: {
    margin: 0,
    fontSize: 14,
    color: "var(--text-secondary)",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 1.5,
  },
  reelGridEmptyCta: {
    marginTop: 8,
    padding: "12px 26px",
    borderRadius: 999,
    border: "none",
    background: RED,
    color: "#fff",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
    letterSpacing: 0.2,
  },
  reelTileTypeBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    fontSize: 14,
    lineHeight: 1,
    pointerEvents: "none",
    zIndex: 4,
    filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.95))",
  },
  reelTileOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "20px 6px 6px",
    background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
    pointerEvents: "none",
    zIndex: 3,
  },
  reelTileLikes: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.2,
    textShadow: "0 1px 6px rgba(0,0,0,0.9)",
    marginBottom: 2,
  },
  reelTileCaption: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    fontWeight: 600,
    textShadow: "0 1px 4px rgba(0,0,0,0.9)",
  },
  rankRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
    marginBottom: 2,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "6px 14px",
    borderRadius: 14,
    WebkitTapHighlightColor: "transparent",
  },
  rankLabel: {
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  xpWrap: {
    maxWidth: 430,
    margin: "12px auto 0",
    padding: "0 4px",
  },
  xpTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  xpAmount: {
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 0.3,
  },
  xpNextLabel: {
    fontSize: 11,
    color: "#888",
    textAlign: "right",
  },
  xpTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 500ms ease",
  },
};
