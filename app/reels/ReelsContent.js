"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import DailyMission from "@/components/DailyMission";
import { createNotification } from "@/lib/notifications";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { updateLeaderboard } from "@/components/Leaderboard";
import { computeFeedScore } from "@/lib/analytics";
import AIBreakdownSheet from "@/components/AIBreakdownSheet";
import { RED, GOLD , PURPLE} from "@/lib/tokens";

// Dynamic import for Firebase to avoid SSR issues
let db = null;
async function getFirebase() {
  if (!db) {
    const { getFirestore } = await import("firebase/firestore");
    const { getApps, getApp, initializeApp } = await import("firebase/app");

    const firebaseConfig = {
      apiKey: "AIzaSyDwVdR5oVYSXQbWL4jqNSNx9cqKuKxqt6c",
      authDomain: "gavana-boxing-89a22.firebaseapp.com",
      projectId: "gavana-boxing-89a22",
      storageBucket: "gavana-boxing-89a22.firebasestorage.app",
      messagingSenderId: "1062689232574",
      appId: "1:1062689232574:web:1c362a4577072e51c9f0ef",
    };

    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  }
  return { db };
}

const DEMO_REEL = {
  id: "demo-reel",
  isDemo: true,
  userId: null,
  username: "gavana",
  description: "Your first 3 seconds decide everything. Show the combo, the footwork, the finish.",
  likes: 128,
  views: 2400,
  commentsCount: 18,
  shares: 7,
  createdAt: new Date().toISOString(),
};

// Helper function to safely get like count from reel
function getSafeLikeCount(reel) {
  // Try to use likes field first
  let count = reel?.likes;
  
  // If likes is not a valid number, try likesCount (migration from old field)
  if (typeof count !== 'number' || isNaN(count)) {
    count = reel?.likesCount;
  }
  
  // If still not valid, treat as 0
  if (typeof count !== 'number' || isNaN(count)) {
    count = 0;
  }
  
  return Math.max(0, count);
}

// Helper function to safely get view count from reel
function getSafeViewCount(reel) {
  let count = reel?.views;
  
  if (typeof count !== 'number' || isNaN(count)) {
    count = 0;
  }
  
  return Math.max(0, count);
}

// Helper function to safely get comments count
function getSafeCommentsCount(reel) {
  let count = reel?.commentsCount;
  
  if (typeof count !== 'number' || isNaN(count)) {
    count = 0;
  }
  
  return Math.max(0, count);
}

function getEngagementScore(reel) {
  return getSafeLikeCount(reel) + getSafeViewCount(reel);
}

function getCreatedAtMs(reel) {
  if (!reel?.createdAt) return 0;
  const date = reel.createdAt.toDate ? reel.createdAt.toDate() : new Date(reel.createdAt);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatCompactCount(count) {
  const safeCount = Math.max(0, Number(count) || 0);

  if (safeCount >= 1000000) {
    return `${(safeCount / 1000000).toFixed(safeCount >= 10000000 ? 0 : 1).replace(/\.0$/, "")}M`;
  }

  if (safeCount >= 1000) {
    return `${(safeCount / 1000).toFixed(safeCount >= 10000 ? 0 : 1).replace(/\.0$/, "")}K`;
  }

  return String(safeCount);
}

function formatViews(count) {
  return `${formatCompactCount(count)} views`;
}

function sortReelsByEngagement(reels) {
  return [...reels].sort((a, b) => {
    const scoreDelta = getEngagementScore(b) - getEngagementScore(a);
    if (scoreDelta !== 0) return scoreDelta;
    return getCreatedAtMs(b) - getCreatedAtMs(a);
  });
}

function getCreatorName(reel, creatorProfile) {
  return creatorProfile?.displayName || creatorProfile?.username || reel?.username || "user";
}

function getCreatorPhoto(creatorProfile) {
  return creatorProfile?.photoURL || creatorProfile?.profileImageUrl || creatorProfile?.profileImage || "";
}

function getCaptionToggleLabel(locale, expanded) {
  const labels = {
    mn: { more: "дэлгэрэнгүй", less: "хураах" },
    ko: { more: "더보기", less: "접기" },
  };
  const l = labels[locale];
  if (l) return expanded ? l.less : l.more;
  return expanded ? translate(locale, "less") : translate(locale, "more");
}

function cleanCaption(text) {
  return String(text || "")
    .replace(/\*\*[^*]+\*\*\s*:\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/^[ \t]*(Hook|Caption|Hashtags?)\s*:\s*/gim, "")
    .replace(/^\s*[-•]\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractFeedbackScore(feedbackText) {
  const cleanedText = String(feedbackText || "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "");
  const labelMatch = cleanedText.match(/(?:score|РѕРЅРѕРѕ|м ђм€)\s*[:пјљ-]?\s*(\d+(?:[.,]\d+)?)\s*\/\s*10/i);
  const fallbackMatch = cleanedText.match(/(\d+(?:[.,]\d+)?)\s*\/\s*10/i);
  const match = labelMatch || fallbackMatch;
  if (!match) return undefined;

  const score = Number(String(match[1]).replace(",", "."));
  if (!Number.isFinite(score)) return undefined;

  return Math.max(0, Math.min(10, score));
}

function getFirstValue(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return null;
}

function formatSpeedMetric(reel) {
  const speed = getFirstValue(
    reel?.speed,
    reel?.speedScore,
    reel?.aiSpeed,
    reel?.metrics?.speed,
    reel?.analysis?.speed
  );

  if (speed === null) return "Medium";
  if (typeof speed === "number" && Number.isFinite(speed)) return speed > 10 ? `${Math.round(speed)}` : `${speed.toFixed(1)}`;
  return String(speed);
}

function formatComboCountMetric(reel) {
  const comboCount = getFirstValue(
    reel?.comboCount,
    reel?.combo_count,
    reel?.combos,
    reel?.metrics?.comboCount,
    reel?.analysis?.comboCount
  );

  if (Array.isArray(comboCount)) return comboCount.length.toString();
  if (typeof comboCount === "number" && Number.isFinite(comboCount)) return Math.max(0, Math.round(comboCount)).toString();
  if (typeof comboCount === "string" && comboCount.trim()) return comboCount;

  const caption = String(reel?.description || reel?.caption || "").toLowerCase();
  const punchMatches = caption.match(/\b(jab|cross|hook|uppercut|body|slip|roll)\b/g);
  return Math.max(1, Math.min(6, punchMatches?.length || 1)).toString();
}

export default function ReelsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const targetReelId = searchParams.get("reelId");
  const source = searchParams.get("source");
  const profileSourceUserId = searchParams.get("userId");
  const isProfileSource = source === "profile" && Boolean(profileSourceUserId);
  const isPvpSource = source === "pvp";
  const currentLocale = getLocaleFromPathname(pathname);
  const t = (key) => translate(currentLocale, key);
  const { user, loading: authLoading } = useAuth();
  const [feedMode, setFeedMode] = useState("forYou");
  const [diffFilter, setDiffFilter] = useState("all"); // "all" | "beginner"
  const [ctFilter, setCtFilter] = useState("all"); // "all" | "training" | "lifestyle" | "educational"
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [allReels, setAllReels] = useState(null);
  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [userLikes, setUserLikes] = useState(new Set());
  const [userViews, setUserViews] = useState(new Set());
  const [followingIds, setFollowingIds] = useState(new Set());
  const [savedReels, setSavedReels] = useState(new Set());
  const [creatorProfiles, setCreatorProfiles] = useState({});
  const [expandedCaptionIds, setExpandedCaptionIds] = useState(new Set()); // kept for compat
  const [videoLoading, setVideoLoading] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentProfiles, setCommentProfiles] = useState({});
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, username }
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [selectedReelId, setSelectedReelId] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackResult, setFeedbackResult] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [feedbackReel, setFeedbackReel] = useState(null);
  const [sessionXPData, setSessionXPData] = useState(null);
  const [videoErrors, setVideoErrors] = useState({});
  const [creatorStats, setCreatorStats] = useState({}); // XP, rank, best score for creators
  const [profileReelProgress, setProfileReelProgress] = useState(null); // progress data when opened from profile
  const [captionSheetReelId, setCaptionSheetReelId] = useState(null);
  const [breakdownReel, setBreakdownReel] = useState(null);
  const [userTrainingProfile, setUserTrainingProfile] = useState(null);
  const [gymNames, setGymNames] = useState({}); // gymId → gymName cache
  const [featuredCreatorIds, setFeaturedCreatorIds] = useState(new Set());
  const videoRefs = useRef({});
  const feedbackCacheRef = useRef({});
  const lastTapRef = useRef({ time: 0, reelId: null });
  const singleTapTimerRef = useRef(null);
  const [heartBursts, setHeartBursts] = useState([]);
  const [videoProgress, setVideoProgress] = useState(0);
  const feedRef = useRef(null);
  const reelItemRefs = useRef({});
  const viewTimers = useRef({});
  const controlsTimer = useRef(null);
  const commentsUnsubscribeRef = useRef(null);
  const creatorProfileRequests = useRef(new Set());
  const commentProfileRequests = useRef(new Set());
  const lastScrolledReelId = useRef(null);
  const gymNameRequests = useRef(new Set());

  useEffect(() => {
    if (authLoading || allReels === null) {
      setReels([]);
      return;
    }

    if (isProfileSource) {
      setReels(allReels.filter((reel) => reel.userId === profileSourceUserId));
      setCurrentIndex(0);
      return;
    }

    const makeStats = (r) => ({ views: r.views || 0, likes: r.likes || 0, comments: r.commentsCount || 0, shares: r.shares || 0 });
    const isFeatured = (r) => featuredCreatorIds.has(r.userId);

    if (feedMode !== "following") {
      const base = allReels.length > 0 ? allReels : [DEMO_REEL];
      const diffFiltered = diffFilter === "beginner" ? base.filter((r) => r.difficulty === "beginner" || !r.difficulty) : base;
      const filtered = ctFilter !== "all" ? diffFiltered.filter((r) => (r.contentType || "training") === ctFilter) : diffFiltered;
      const scored = [...filtered].sort((a, b) =>
        computeFeedScore(b, makeStats(b), userTrainingProfile, userViews.has(b.id), isFeatured(b)) -
        computeFeedScore(a, makeStats(a), userTrainingProfile, userViews.has(a.id), isFeatured(a))
      );
      setReels(scored.length > 0 ? scored : base);
      setCurrentIndex(0);
      return;
    }

    // Following feed: hybrid sort — recency-weighted but boosted by engagement and personalisation
    const followedReels = allReels.filter((reel) => reel.userId && followingIds.has(reel.userId));
    const diffFiltered = diffFilter === "beginner" ? followedReels.filter((r) => r.difficulty === "beginner" || !r.difficulty) : followedReels;
    const filtered = ctFilter !== "all" ? diffFiltered.filter((r) => (r.contentType || "training") === ctFilter) : diffFiltered;
    const sorted = [...filtered].sort((a, b) => {
      const recencyA = getCreatedAtMs(a);
      const recencyB = getCreatedAtMs(b);
      const maxTs = Math.max(recencyA, recencyB, 1);
      const hybridA = (recencyA / maxTs) * 0.7 + computeFeedScore(a, makeStats(a), userTrainingProfile, userViews.has(a.id), isFeatured(a)) * 0.3;
      const hybridB = (recencyB / maxTs) * 0.7 + computeFeedScore(b, makeStats(b), userTrainingProfile, userViews.has(b.id), isFeatured(b)) * 0.3;
      return hybridB - hybridA;
    });
    setReels(sorted);
    setCurrentIndex(0);
  }, [allReels, authLoading, feedMode, followingIds, isProfileSource, profileSourceUserId, diffFilter, ctFilter, userTrainingProfile, userViews, featuredCreatorIds]);

  useEffect(() => {
    if (!targetReelId || !reels.length || lastScrolledReelId.current === targetReelId) return;

    const targetIndex = reels.findIndex((reel) => reel.id === targetReelId);
    if (targetIndex < 0) return;

    lastScrolledReelId.current = targetReelId;
    setCurrentIndex(targetIndex);

    requestAnimationFrame(() => {
      reelItemRefs.current[targetReelId]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [reels, targetReelId]);

  // Load profile-source progress for current reel
  const currentReelId = reels[currentIndex]?.id || null;
  useEffect(() => {
    if (!isProfileSource || !profileSourceUserId || !currentReelId) {
      setProfileReelProgress(null);
      return;
    }

    let isActive = true;
    setProfileReelProgress(null); // reset while loading

    async function loadProgress() {
      try {
        const { db } = await getFirebase();
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const snap = await getDocs(query(
          collection(db, "training_sessions"),
          where("userId", "==", profileSourceUserId),
          where("reelId", "==", currentReelId)
        ));

        if (!isActive) return;

        if (snap.empty) {
          setProfileReelProgress({ empty: true });
          return;
        }

        const sessions = snap.docs
          .map((d) => ({ ...d.data(), id: d.id }))
          .filter((s) => s.type === "training" && Number.isFinite(Number(s.score)))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() || 0;
            const tb = b.createdAt?.toMillis?.() || 0;
            return tb - ta;
          });

        if (!sessions.length) {
          setProfileReelProgress({ empty: true });
          return;
        }

        const scores = sessions.map((s) => Number(s.score));
        setProfileReelProgress({
          empty: false,
          attempts: sessions.length,
          bestScore: Math.max(...scores),
          latestScore: scores[0],
        });
      } catch (err) {
        console.error("Failed to load profile reel progress:", err);
        if (isActive) setProfileReelProgress(null);
      }
    }

    loadProgress();
    return () => { isActive = false; };
  }, [isProfileSource, profileSourceUserId, currentReelId]);

  useEffect(() => {
    if (!reels.length) return;

    let isActive = true;
    const missingCreatorIds = [...new Set(
      reels
        .map((reel) => reel?.userId)
        .filter((userId) => userId && !creatorProfiles[userId] && !creatorProfileRequests.current.has(userId))
    )];

    if (!missingCreatorIds.length) return;

    async function loadCreatorProfiles() {
      try {
        const { db } = await getFirebase();
        const { doc, getDoc } = await import("firebase/firestore");

        await Promise.all(missingCreatorIds.map(async (creatorId) => {
          creatorProfileRequests.current.add(creatorId);

          try {
            const profileSnap = await getDoc(doc(db, "users", creatorId));
            const profileData = profileSnap.exists() ? profileSnap.data() : {};

            if (!isActive) return;

            setCreatorProfiles((prev) => ({
              ...prev,
              [creatorId]: {
                displayName: profileData.displayName || "",
                username: profileData.username || "",
                photoURL: profileData.photoURL || "",
                profileImageUrl: profileData.profileImageUrl || "",
                profileImage: profileData.profileImage || "",
                streakCount: Number(profileData.streakCount) || 0,
              },
            }));
          } catch (err) {
            console.error("Failed to load creator profile:", err);

            if (!isActive) return;

            setCreatorProfiles((prev) => ({
              ...prev,
              [creatorId]: {},
            }));
          }
        }));
      } catch (err) {
        console.error("Failed to prepare creator profile reads:", err);
      }
    }

    loadCreatorProfiles();

    return () => {
      isActive = false;
    };
  }, [reels, creatorProfiles]);

  // Fetch creator stats (XP, rank, best AI score)
  useEffect(() => {
    if (!reels.length) return;

    let isActive = true;
    const missingCreatorIds = [...new Set(
      reels
        .map((reel) => reel?.userId)
        .filter((userId) => userId && !creatorStats[userId])
    )];

    if (!missingCreatorIds.length) return;

    async function loadCreatorStats() {
      try {
        const { db } = await getFirebase();
        const { collection, query, where, getDocs, doc, getDoc } = await import("firebase/firestore");
        const { calculateUserXP, getFighterRank } = await import("@/lib/xp");

        await Promise.all(missingCreatorIds.map(async (creatorId) => {
          if (!isActive) return;

          try {
            // Get AI feedback scores
            const feedbackQuery = query(
              collection(db, "ai_feedback"),
              where("userId", "==", creatorId)
            );
            const feedbackSnap = await getDocs(feedbackQuery);
            const feedbackDocs = feedbackSnap.docs.map(doc => ({
              score: doc.data().score,
              createdAt: doc.data().createdAt
            }));

            // Get user profile for streak
            const userDoc = await getDoc(doc(db, "users", creatorId));
            const userData = userDoc.exists() ? userDoc.data() : {};
            const streakDays = Number(userData.streakCount) || 0;

            // Calculate XP and rank (without likesReceived for now)
            const totalXP = calculateUserXP({
              aiFeedbackDocs: feedbackDocs,
              streakDays,
              likesReceived: 0 // TODO: Calculate total likes received
            });
            const rank = getFighterRank(totalXP);

            // Get best AI score
            const bestScore = feedbackDocs.length > 0
              ? Math.max(...feedbackDocs.map(d => Number(d.score) || 0))
              : null;

            if (!isActive) return;

            setCreatorStats((prev) => ({
              ...prev,
              [creatorId]: {
                xp: totalXP,
                rank,
                bestScore,
                hasData: feedbackDocs.length > 0
              },
            }));
          } catch (err) {
            console.error("Failed to load creator stats:", err);

            if (!isActive) return;

            setCreatorStats((prev) => ({
              ...prev,
              [creatorId]: {
                xp: 0,
                rank: null,
                bestScore: null,
                hasData: false
              },
            }));
          }
        }));
      } catch (err) {
        console.error("Failed to prepare creator stats reads:", err);
      }
    }

    loadCreatorStats();

    return () => {
      isActive = false;
    };
  }, [reels, creatorStats]);

  // Fetch reels from Firestore with real-time updates
  useEffect(() => {
    if (authLoading) {
      setReelsLoading(true);
      return;
    }

    if (!user?.uid) {
      setAllReels([]);
      setFollowingIds(new Set());
      setReelsLoading(false);
      return;
    }

    let unsubscribe;
    let isActive = true;

    async function loadReels() {
      try {
        const { db } = await getFirebase();
        const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
        if (!isActive) return;
        
        const reelsQuery = query(collection(db, "reels"), orderBy("createdAt", "desc"));
        
        // Use onSnapshot for real-time updates
        unsubscribe = onSnapshot(reelsQuery, (snapshot) => {
          if (!isActive) return;

          const reelsData = snapshot.docs.map((doc) => {
            const data = doc.data();
            // Migrate from likesCount to likes if needed
            let likeCount = getSafeLikeCount({ likes: data.likes, likesCount: data.likesCount });
            return {
              id: doc.id,
              ...data,
              likes: likeCount
            };
          });
          
          setAllReels(reelsData.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a)));
          setCurrentIndex(0);
          setReelsLoading(false);
        }, (err) => {
          if (!isActive) return;
          console.error("Failed to listen for reels:", err);
          setAllReels([]);
          setReelsLoading(false);
        });
      } catch (err) {
        if (!isActive) return;
        console.error("Failed to load reels:", err);
        setAllReels([]);
        setReelsLoading(false);
      }
    }

    setAllReels(null);
    setReelsLoading(true);
    loadReels();

    return () => {
      isActive = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [authLoading, user?.uid]);

  // One-time read — follows change only when the user manually follows/unfollows,
  // so a persistent listener is unnecessary overhead here.
  useEffect(() => {
    if (authLoading || !user?.uid) {
      setFollowingIds(new Set());
      return;
    }

    let isActive = true;

    async function loadFollowing() {
      try {
        const { db } = await getFirebase();
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        if (!isActive) return;

        const snap = await getDocs(
          query(collection(db, "follows"), where("followerId", "==", user.uid))
        );
        if (!isActive) return;

        const nextFollowing = new Set();
        snap.forEach((doc) => {
          const data = doc.data();
          if (data.followingId) nextFollowing.add(data.followingId);
        });
        setFollowingIds(nextFollowing);
      } catch (err) {
        if (!isActive) return;
        console.error("Failed to load following:", err);
        setFollowingIds(new Set());
      }
    }

    loadFollowing();

    return () => { isActive = false; };
  }, [authLoading, user?.uid]);

  // Load user_training_profile for feed personalization
  useEffect(() => {
    if (!user?.uid) { setUserTrainingProfile(null); return; }
    let active = true;
    async function loadProfile() {
      try {
        const { db } = await getFirebase();
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "user_training_profile", user.uid));
        if (active && snap.exists()) setUserTrainingProfile(snap.data());
      } catch { /* non-critical */ }
    }
    loadProfile();
    return () => { active = false; };
  }, [user?.uid]);

  // Load currently active featured creators (used for feed boost)
  useEffect(() => {
    let active = true;
    async function loadFeaturedCreators() {
      try {
        const { db } = await getFirebase();
        const { collection, getDocs, query, where, Timestamp } = await import("firebase/firestore");
        const now = Timestamp.now();
        const snap = await getDocs(query(
          collection(db, "featured_creators"),
          where("featuredUntil", ">=", now)
        ));
        if (!active) return;
        const ids = new Set();
        snap.forEach((doc) => { if (doc.data().userId) ids.add(doc.data().userId); });
        setFeaturedCreatorIds(ids);
      } catch { /* non-critical — featured boost is best-effort */ }
    }
    loadFeaturedCreators();
    return () => { active = false; };
  }, []);

  // Lazily fetch gym names for tagged reels
  useEffect(() => {
    const reelsWithGym = reels.filter((r) => r.gymId && !gymNames[r.gymId] && !gymNameRequests.current.has(r.gymId));
    if (reelsWithGym.length === 0) return;
    reelsWithGym.forEach((r) => gymNameRequests.current.add(r.gymId));
    async function fetchGymNames() {
      try {
        const { db } = await getFirebase();
        const { doc, getDoc } = await import("firebase/firestore");
        const results = await Promise.all(reelsWithGym.map((r) => getDoc(doc(db, "gyms", r.gymId))));
        const updates = {};
        results.forEach((snap) => { if (snap.exists()) updates[snap.id] = snap.data().gymName || ""; });
        if (Object.keys(updates).length > 0) setGymNames((prev) => ({ ...prev, ...updates }));
      } catch { /* non-critical */ }
    }
    fetchGymNames();
  }, [reels, gymNames]);

  // Fetch user's likes
  useEffect(() => {
    if (authLoading || !user?.uid) {
      setUserLikes(new Set());
      return;
    }

    let isActive = true;

    async function loadUserLikes() {
      try {
        const { db } = await getFirebase();
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        if (!isActive) return;
        
        const likesSnapshot = await getDocs(query(
          collection(db, "user_likes"),
          where("userId", "==", user.uid)
        ));
        const likesSet = new Set();
        
        likesSnapshot.forEach((doc) => {
          const data = doc.data();
          likesSet.add(data.reelId);
        });
        
        if (isActive) {
          setUserLikes(likesSet);
        }
      } catch (err) {
        console.error("Failed to load likes:", err);
      }
    }
    
    loadUserLikes();

    return () => {
      isActive = false;
    };
  }, [authLoading, user?.uid]);

  useEffect(() => {
    if (authLoading || !user?.uid) {
      setSavedReels(new Set());
      return;
    }

    let isActive = true;

    async function loadSavedReels() {
      try {
        const { db } = await getFirebase();
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        if (!isActive) return;

        const savedSnapshot = await getDocs(query(
          collection(db, "saved_reels"),
          where("userId", "==", user.uid)
        ));
        const savedSet = new Set();
        savedSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.reelId) savedSet.add(data.reelId);
        });

        if (isActive) {
          setSavedReels(savedSet);
        }
      } catch (err) {
        console.error("Failed to load saved reels:", err);
      }
    }

    loadSavedReels();

    return () => {
      isActive = false;
    };
  }, [authLoading, user?.uid]);

  // Load recent views to prevent double-counting. Capped at 300 to bound startup reads;
  // session-local views (this page load) are stored in sessionStorage to avoid re-fetching.
  useEffect(() => {
    if (authLoading || !user?.uid) {
      setUserViews(new Set());
      return;
    }

    let isActive = true;

    async function loadUserViews() {
      try {
        // Seed from sessionStorage first (fast, zero network cost)
        const sessionKey = `gavana_views_${user.uid}`;
        let viewsSet = new Set();
        try {
          const stored = sessionStorage.getItem(sessionKey);
          if (stored) JSON.parse(stored).forEach((id) => viewsSet.add(id));
        } catch { /* sessionStorage unavailable */ }

        // Supplement with Firestore — only the 300 most recent records
        const { db } = await getFirebase();
        const { collection, getDocs, query, where, orderBy, limit } = await import("firebase/firestore");
        if (!isActive) return;

        const snap = await getDocs(query(
          collection(db, "reel_views"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(300)
        ));
        snap.forEach((doc) => viewsSet.add(doc.data().reelId));

        if (isActive) setUserViews(viewsSet);
      } catch (err) {
        console.error("Failed to load views:", err);
      }
    }

    loadUserViews();

    return () => { isActive = false; };
  }, [authLoading, user?.uid]);

  // Track view when reel is active for 3 seconds
  useEffect(() => {
    if (!user || !reels.length || currentIndex < 0 || currentIndex >= reels.length) return;
    
    const currentReel = reels[currentIndex];
    if (!currentReel || !currentReel.id || currentReel.isDemo) return;
    
    // If already viewed, don't track again
    if (userViews.has(currentReel.id)) return;
    
    // Clear any existing timer for this reel
    if (viewTimers.current[currentReel.id]) {
      clearTimeout(viewTimers.current[currentReel.id]);
    }
    
    // Set a 3 second timer to record view
    viewTimers.current[currentReel.id] = setTimeout(async () => {
      if (!user?.uid) return;

      try {
        const { db } = await getFirebase();
        const { collection, addDoc, doc, setDoc, updateDoc, increment, serverTimestamp } = await import("firebase/firestore");

        // Record view in reel_views collection
        await addDoc(collection(db, "reel_views"), {
          reelId: currentReel.id,
          userId: user.uid,
          createdAt: serverTimestamp()
        });

        // Increment views on reel doc and reel_stats in parallel
        await Promise.all([
          updateDoc(doc(db, "reels", currentReel.id), { views: increment(1) }),
          setDoc(doc(db, "reel_stats", currentReel.id), { reelId: currentReel.id, views: increment(1), updatedAt: serverTimestamp() }, { merge: true }),
        ]);
        
        // Update local state and persist to sessionStorage so next load skips re-fetch
        setUserViews(prev => {
          const newViews = new Set(prev);
          newViews.add(currentReel.id);
          try {
            const sessionKey = `gavana_views_${user.uid}`;
            const stored = sessionStorage.getItem(sessionKey);
            const arr = stored ? JSON.parse(stored) : [];
            arr.push(currentReel.id);
            // Keep only last 500 to prevent unbounded growth
            sessionStorage.setItem(sessionKey, JSON.stringify(arr.slice(-500)));
          } catch { /* sessionStorage unavailable */ }
          return newViews;
        });
        
        // Update reel data locally
        const updateViewedReel = (prev) => sortReelsByEngagement(prev.map(reel => 
          reel.id === currentReel.id 
            ? { ...reel, views: getSafeViewCount(reel) + 1 }
            : reel
        ));
        setAllReels(updateViewedReel);
      } catch (err) {
        console.error("Failed to record view:", err);
      }
    }, 3000);
    
    // Cleanup timer on unmount or index change
    return () => {
      if (viewTimers.current[currentReel.id]) {
        clearTimeout(viewTimers.current[currentReel.id]);
        delete viewTimers.current[currentReel.id];
      }
    };
  }, [user, currentIndex, reels, userViews]);

  useEffect(() => {
    const timers = viewTimers.current;

    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Handle scroll to change current video
  const handleScroll = useCallback((e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    const itemHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, reels.length]);

  useEffect(() => {
    const root = feedRef.current;
    if (!root || !reels.length) return;

    const observer = new IntersectionObserver((entries) => {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!mostVisible || mostVisible.intersectionRatio < 0.6) return;

      const nextIndex = Number(mostVisible.target.getAttribute("data-reel-index"));
      if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= reels.length) return;

      setCurrentIndex((prevIndex) => (prevIndex === nextIndex ? prevIndex : nextIndex));
    }, {
      root,
      threshold: [0.6, 0.75, 0.9],
    });

    reels.forEach((reel) => {
      const element = reelItemRefs.current[reel.id];
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [reels]);

  const pauseInactiveVideos = useCallback((activeReelId, reset = true) => {
    Object.entries(videoRefs.current).forEach(([reelId, video]) => {
      if (!video || reelId === activeReelId) return;

      video.pause();
      video.muted = true;

      if (reset) {
        try {
          video.currentTime = 0;
        } catch {
          // Some mobile browsers can reject currentTime changes before metadata is ready.
        }
      }
    });
  }, []);

  // Play/pause current video
  const togglePlay = useCallback(() => {
    const video = videoRefs.current[reels[currentIndex]?.id];
    if (video) {
      if (video.paused) {
        video.play();
        setShowControls(false);
      } else {
        video.pause();
        setShowControls(true);
      }
    }
  }, [currentIndex, reels]);

  // Reset video progress when switching reels
  useEffect(() => { setVideoProgress(0); }, [currentIndex]);

  const clearControlsTimer = useCallback(() => {
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
      controlsTimer.current = null;
    }
  }, []);

  const scheduleControlsHide = useCallback(() => {
    clearControlsTimer();
    const video = videoRefs.current[reels[currentIndex]?.id];

    if (video && !video.paused) {
      controlsTimer.current = setTimeout(() => {
        setShowControls(false);
        controlsTimer.current = null;
      }, 2500);
    }
  }, [clearControlsTimer, currentIndex, reels]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  const enableSound = useCallback(() => {
    const activeReelId = reels[currentIndex]?.id;
    const video = videoRefs.current[activeReelId];

    setSoundEnabled(true);
    pauseInactiveVideos(activeReelId, false);

    if (video) {
      video.muted = false;
      video.volume = 1;
      video.play().catch(() => {
        // If a browser still blocks sound, the control remains visible for another tap.
      });
    }

    setShowControls(true);
    scheduleControlsHide();
  }, [currentIndex, pauseInactiveVideos, reels, scheduleControlsHide]);

  const muteAllVideos = useCallback(() => {
    setSoundEnabled(false);
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        video.muted = true;
      }
    });
    setShowControls(true);
  }, []);

  const handleVideoTap = useCallback(() => {
    revealControls();
    togglePlay();
  }, [revealControls, togglePlay]);

  useEffect(() => {
    const currentReel = reels[currentIndex];
    const activeReelId = currentReel?.isDemo ? null : currentReel?.id;

    pauseInactiveVideos(activeReelId);

    if (!currentReel || currentReel.isDemo || !activeReelId) return;

    const video = videoRefs.current[activeReelId];
    if (!video) return;

    setVideoErrors((prev) => ({ ...prev, [activeReelId]: false }));
    if (video.readyState < 3) {
      setVideoLoading((prev) => ({ ...prev, [activeReelId]: true }));
    }
    video.muted = !soundEnabled;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.play().catch(() => {
      // Browsers can still block autoplay; the tap-to-play overlay remains available.
    });
    setShowControls(true);
    scheduleControlsHide();
  }, [reels, currentIndex, pauseInactiveVideos, scheduleControlsHide, soundEnabled]);

  useEffect(() => {
    return () => {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }

      Object.values(videoRefs.current).forEach((video) => {
        if (!video) return;
        video.pause();
        video.muted = true;
      });
    };
  }, []);

  // Toggle global sound
  const toggleMute = useCallback(() => {
    if (soundEnabled) {
      muteAllVideos();
      return;
    }

    enableSound();
  }, [enableSound, muteAllVideos, soundEnabled]);

  // Handle like/unlike
  const handleLike = useCallback(async (reelId) => {
    const targetReel = reels.find((reel) => reel.id === reelId);
    if (targetReel?.isDemo) {
      router.push(`/${currentLocale}/upload`);
      return;
    }

    if (!user) {
      router.push(`/${currentLocale}/login`);
      return;
    }

    try {
      const { db } = await getFirebase();
      const { doc, setDoc, deleteDoc, getDoc, updateDoc, increment } = await import("firebase/firestore");
      
      const likeRef = doc(db, "user_likes", `${user.uid}_${reelId}`);
      const likeDoc = await getDoc(likeRef);
      const isLiked = likeDoc.exists();
      
      const reelRef = doc(db, "reels", reelId);
      
      if (isLiked) {
        // Unlike: remove like and decrement count
        await deleteDoc(likeRef);
        await updateDoc(reelRef, { likes: increment(-1) });
        
        setUserLikes(prev => {
          const newLikes = new Set(prev);
          newLikes.delete(reelId);
          return newLikes;
        });
        
        const updateUnlikedReel = (prev) => sortReelsByEngagement(prev.map(reel => 
          reel.id === reelId 
            ? { ...reel, likes: Math.max(0, getSafeLikeCount(reel) - 1) }
            : reel
        ));
        setAllReels(updateUnlikedReel);
      } else {
        const likedReel = reels.find((reel) => reel.id === reelId);
        // Like: add like and increment count
        await setDoc(likeRef, {
          userId: user.uid,
          reelId: reelId,
          createdAt: new Date().toISOString()
        });
        await updateDoc(reelRef, { likes: increment(1) });
        // Track in reel_stats for feed ranking
        setDoc(doc(db, "reel_stats", reelId), { reelId, likes: increment(1), updatedAt: new Date() }, { merge: true }).catch(() => {});
        await createNotification({
          recipientId: likedReel?.userId,
          actorId: user.uid,
          actorName: user.email?.split("@")[0],
          type: "like",
          reelId,
        });
        
        setUserLikes(prev => {
          const newLikes = new Set(prev);
          newLikes.add(reelId);
          return newLikes;
        });
        
        const updateLikedReel = (prev) => sortReelsByEngagement(prev.map(reel => 
          reel.id === reelId 
            ? { ...reel, likes: getSafeLikeCount(reel) + 1 }
            : reel
        ));
        setAllReels(updateLikedReel);
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  }, [user, router, currentLocale, reels]);

  const handleVideoClick = useCallback((e, reel) => {
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current.time < 350 && lastTapRef.current.reelId === reel.id;
    lastTapRef.current = { time: now, reelId: reel.id };

    if (isDoubleTap) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX || e.changedTouches?.[0]?.clientX || rect.width / 2) - rect.left;
      const y = (e.clientY || e.changedTouches?.[0]?.clientY || rect.height / 2) - rect.top;
      if (!reel.isDemo && !userLikes.has(reel.id)) handleLike(reel.id);
      const burstId = now;
      setHeartBursts((prev) => [...prev, { id: burstId, x, y, reelId: reel.id }]);
      setTimeout(() => setHeartBursts((prev) => prev.filter((b) => b.id !== burstId)), 800);
    } else {
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = setTimeout(() => {
        revealControls();
        togglePlay();
        singleTapTimerRef.current = null;
      }, 250);
    }
  }, [handleLike, revealControls, togglePlay, userLikes]);

  const handleSave = useCallback(async (reelId) => {
    const targetReel = reels.find((reel) => reel.id === reelId);
    if (targetReel?.isDemo) {
      router.push(`/${currentLocale}/upload`);
      return;
    }

    if (!user?.uid) {
      router.push(`/${currentLocale}/login`);
      return;
    }

    const wasSaved = savedReels.has(reelId);
    setSavedReels((prev) => {
      const next = new Set(prev);
      if (wasSaved) {
        next.delete(reelId);
      } else {
        next.add(reelId);
      }
      return next;
    });

    try {
      const { db } = await getFirebase();
      const { doc, setDoc, deleteDoc, serverTimestamp, increment } = await import("firebase/firestore");
      const saveRef = doc(db, "saved_reels", `${user.uid}_${reelId}`);

      if (wasSaved) {
        await deleteDoc(saveRef);
      } else {
        await setDoc(saveRef, {
          userId: user.uid,
          reelId,
          createdAt: serverTimestamp(),
        });
        // Track saves in reel_stats for feed ranking
        const statsRef = doc(db, "reel_stats", reelId);
        setDoc(statsRef, { reelId, saves: increment(1), updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to toggle saved reel:", err);
      setSavedReels((prev) => {
        const next = new Set(prev);
        if (wasSaved) {
          next.add(reelId);
        } else {
          next.delete(reelId);
        }
        return next;
      });
    }
  }, [currentLocale, reels, router, savedReels, user?.uid]);

  const handleShare = useCallback(async (reel) => {
    try {
      const { db } = await getFirebase();
      const { collection, query, where, getDocs } = await import("firebase/firestore");

      // Fetch feedback to get score
      let score = null;
      try {
        const feedbackQuery = query(
          collection(db, "feedback"),
          where("reelId", "==", reel.id),
          where("userId", "==", reel.userId)
        );
        const feedbackSnap = await getDocs(feedbackQuery);
        if (!feedbackSnap.empty) {
          const feedbackDoc = feedbackSnap.docs[0].data();
          score = feedbackDoc.score;
        }
      } catch (err) {
        console.error("Failed to fetch feedback for share:", err);
      }

      const baseUrl = window.location.origin;
      const reelUrl = `${baseUrl}${pathname}?reelId=${reel.id}`;
      const appUrl = baseUrl;

      let shareText = t("shareReelText");
      if (score !== null) {
        shareText = t("shareScoreText").replace("{score}", score);
      }

      const shareData = {
        title: t("shareReelTitle"),
        text: shareText,
        url: reelUrl,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const fullText = `${shareText} ${reelUrl} ${appUrl}`;
        await navigator.clipboard.writeText(fullText);
        alert(t("shareLinkCopied"));
      }
    } catch (err) {
      console.error("Failed to share:", err);
      alert(t("shareFailed"));
    }
  }, [pathname, currentLocale]);

  const handleGetFeedback = useCallback(async (reel) => {
    if (!user?.uid) {
      router.push(`/${currentLocale}/login`);
      return;
    }

    setFeedbackOpen(true);
    setFeedbackReel(reel);
    setSessionXPData(null);

    const cached = feedbackCacheRef.current[reel?.id];
    if (cached) {
      setFeedbackResult(cached);
      setFeedbackLoading(false);
      setFeedbackError("");
      setFeedbackSaved(false);
      return;
    }

    setFeedbackLoading(true);
    setFeedbackError("");
    setFeedbackResult("");
    setFeedbackSaved(false);

    try {
      const caption = reel?.description || reel?.caption || "No caption provided";
      const username = reel?.username || "fighter";
      const likes = getSafeLikeCount(reel);
      const views = getSafeViewCount(reel);
      const ownerId = reel?.userId;

      if (!ownerId || reel?.isDemo) {
        throw new Error("AI feedback is only available for real reels");
      }

      const isOwner = user.uid === ownerId;
      const { db } = await getFirebase();
      const { doc, getDoc, serverTimestamp, setDoc } = await import("firebase/firestore");
      const feedbackRef = doc(db, "ai_feedback", reel.id);
      const existingFeedbackSnap = await getDoc(feedbackRef);
      const existingFeedback = existingFeedbackSnap.exists() ? {
        id: existingFeedbackSnap.id,
        ...existingFeedbackSnap.data(),
      } : null;

      if (existingFeedback?.feedbackText) {
        feedbackCacheRef.current[reel.id] = existingFeedback.feedbackText;
        setFeedbackResult(existingFeedback.feedbackText);
        setFeedbackSaved(false);
        return;
      }

      if (!isOwner) {
        setFeedbackResult(t("reelOwnerNoFeedback"));
        setFeedbackSaved(false);
        return;
      }

      const context = [
        `Username: @${username}`,
        `Caption: ${caption}`,
        `Likes: ${likes}`,
        `Views: ${views}`,
      ].join("\n");

      const feedbackFormatLabels = currentLocale === "mn"
        ? { strength: "Давуу тал", improve: "Сайжруулах", drill: "Дараагийн дасгал" }
        : currentLocale === "ko"
        ? { strength: "강점", improve: "개선점", drill: "다음 훈련" }
        : { strength: "Strength", improve: "Improve", drill: "Next drill" };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          persona: "analyst",
          locale: currentLocale,
          messages: [
            {
              role: "user",
              content: [
                "Give personalized boxing feedback using only the reel metadata below.",
                context,
                "Important: You cannot see the actual video, so do not claim you observed punches, footwork, guard, stance, speed, or technique directly.",
                "Infer likely training focus from the caption and engagement only. If the caption is vague, say what to check rather than pretending to know.",
                "Make the advice feel specific to the username, caption, likes, and views.",
                "Keep it realistic, natural, direct, and coach-like.",
                "Give a realistic score out of 10. Do not make the score too perfect unless the context strongly supports it.",
                "Return exactly this plain format with no markdown, no bold symbols, and no bullet points:",
                "Score: 6.5/10",
                `${feedbackFormatLabels.strength}: one specific strength or positive signal based on the caption/context.`,
                `${feedbackFormatLabels.improve}: one practical thing to watch or refine next time.`,
                `${feedbackFormatLabels.drill}: one simple boxing drill with a clear rep/time target.`,
              ].join("\n"),
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok || data?.fallback) {
        setFeedbackResult(data?.message || t("feedbackUnavailable"));
        setFeedbackSaved(false);
        return;
      }

      const text = data?.content?.find((item) => item?.type === "text")?.text || data?.content?.[0]?.text || "";

      if (!text.trim()) {
        setFeedbackResult(t("feedbackUnavailable"));
        setFeedbackSaved(false);
        return;
      }

      const feedbackText = text.trim();
      feedbackCacheRef.current[reel.id] = feedbackText;
      setFeedbackResult(feedbackText);

      try {
        const parsedScore = extractFeedbackScore(feedbackText);
        const feedbackDoc = {
          userId: ownerId,
          reelId: reel.id,
          feedbackText,
          reelCaption: caption,
          createdAt: serverTimestamp(),
          locale: currentLocale,
        };

        if (typeof parsedScore === "number") {
          feedbackDoc.score = parsedScore;
        }

        await setDoc(feedbackRef, feedbackDoc);

        // Update leaderboard if score exists
        if (typeof parsedScore === "number") {
          try {
            const { doc, getDoc } = await import("firebase/firestore");
            const userDoc = await getDoc(doc(db, "users", ownerId));
            const userData = userDoc.exists() ? userDoc.data() : {};
            const username = userData.displayName || userData.username || "Anonymous";
            const photoURL = userData.photoURL || userData.profileImageUrl || "";
            await updateLeaderboard(ownerId, parsedScore, username, photoURL);
          } catch (leaderboardError) {
            console.error("Failed to update leaderboard:", leaderboardError);
          }
        }

        setFeedbackSaved(true);

        // Compute XP breakdown for the feedback card
        if (typeof parsedScore === "number") {
          try {
            const { calculateSessionXP, calculateUserXP, getFighterRank, getNextRank, getRankProgress } = await import("@/lib/xp");
            const { collection, getDocs, query, where } = await import("firebase/firestore");

            const allSnap = await getDocs(query(collection(db, "ai_feedback"), where("userId", "==", ownerId)));
            const allDocs = allSnap.docs.map((d) => ({ score: d.data().score, createdAt: d.data().createdAt }));

            // Sort ascending to find previous score (second-to-last after current save)
            const sorted = [...allDocs]
              .filter((d) => Number.isFinite(Number(d.score)))
              .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
            const prevScore = sorted.length >= 2 ? Number(sorted[sorted.length - 2].score) : null;

            const streakDays = creatorProfiles[ownerId]?.streakCount || 0;
            const reelLikes = getSafeLikeCount(reel);
            const likeXP = Math.round(reelLikes) * 2;

            const breakdown = calculateSessionXP(parsedScore, prevScore, streakDays);
            const totalXP = calculateUserXP({ aiFeedbackDocs: allDocs, streakDays, likesReceived: reelLikes });
            const currentRank = getFighterRank(totalXP);
            const nextRankTier = getNextRank(totalXP);
            const progress = getRankProgress(totalXP);

            setSessionXPData({
              ...breakdown,
              likeXP,
              totalXP,
              currentRank,
              nextRank: nextRankTier,
              rankProgress: progress,
              xpToNext: nextRankTier ? nextRankTier.minXP - totalXP : 0,
            });
          } catch (xpErr) {
            console.error("XP breakdown error:", xpErr);
          }
        }
      } catch (saveError) {
        console.error("Failed to save AI feedback:", saveError);
      }
    } catch (err) {
      console.error("Failed to generate AI feedback:", err);
      setFeedbackError(t("feedbackGenerateError"));
    } finally {
      setFeedbackLoading(false);
    }
  }, [currentLocale, router, user?.uid]);

  const handleCloseFeedback = useCallback(() => {
    setFeedbackOpen(false);
    setFeedbackLoading(false);
    setFeedbackError("");
    setFeedbackResult("");
    setFeedbackSaved(false);
    setFeedbackReel(null);
    setSessionXPData(null);
  }, []);

  // Handle opening comments
  const handleOpenComments = useCallback(async (reelId) => {
    const targetReel = reels.find((reel) => reel.id === reelId);
    if (targetReel?.isDemo) {
      setSelectedReelId(reelId);
      setShowComments(true);
      setNewComment("");
      setComments([
        {
          id: "demo-comment",
          username: "coach",
          userId: null,
          text: "Hook them early: start with the punch, then show the lesson.",
        },
      ]);
      return;
    }

    if (!user?.uid) {
      router.push(`/${currentLocale}/login`);
      return;
    }

    setSelectedReelId(reelId);
    setShowComments(true);
    setComments([]);
    setNewComment("");

    try {
      if (commentsUnsubscribeRef.current) {
        commentsUnsubscribeRef.current();
        commentsUnsubscribeRef.current = null;
      }

      const { db } = await getFirebase();
      const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");

      const commentsQuery = query(
        collection(db, "reels", reelId, "comments"),
        orderBy("createdAt", "desc")
      );

      commentsUnsubscribeRef.current = onSnapshot(commentsQuery, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(commentsData);
      }, (err) => {
        console.error("Failed to listen for comments:", err);
        setComments([]);
      });
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  }, [user?.uid, router, currentLocale, reels]);

  // Handle adding comment
  const handleAddComment = useCallback(async () => {
    if (!user || !newComment.trim() || !selectedReelId) return;
    const selectedReel = reels.find((reel) => reel.id === selectedReelId);
    if (selectedReel?.isDemo) return;

    try {
      const { db } = await getFirebase();
      const { collection, addDoc, serverTimestamp, increment, doc, updateDoc } = await import("firebase/firestore");

      // Add comment to subcollection
      await addDoc(collection(db, "reels", selectedReelId, "comments"), {
        userId: user.uid,
        username: user.displayName || user.email.split("@")[0],
        userPhotoURL: user.photoURL || "",
        text: newComment.trim(),
        createdAt: serverTimestamp(),
        parentId: replyingTo?.commentId || null,
      });

      // Update comment count on reel
      const reelRef = doc(db, "reels", selectedReelId);
      await updateDoc(reelRef, {
        commentsCount: increment(1)
      });
      await createNotification({
        recipientId: selectedReel?.userId,
        actorId: user.uid,
        actorName: user.email?.split("@")[0],
        type: "comment",
        reelId: selectedReelId,
        text: newComment.trim(),
      });

      setNewComment("");
      setReplyingTo(null);
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  }, [user, newComment, selectedReelId, reels, replyingTo]);

  const handleDeleteComment = useCallback(async (comment) => {
    if (!user || comment.userId !== user.uid || !selectedReelId) return;
    try {
      const { db } = await getFirebase();
      const { doc, deleteDoc, updateDoc, increment } = await import("firebase/firestore");
      await deleteDoc(doc(db, "reels", selectedReelId, "comments", comment.id));
      await updateDoc(doc(db, "reels", selectedReelId), { commentsCount: increment(-1) });
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  }, [user, selectedReelId]);

  // Handle closing comments
  const handleCloseComments = useCallback(() => {
    if (commentsUnsubscribeRef.current) {
      commentsUnsubscribeRef.current();
      commentsUnsubscribeRef.current = null;
    }

    setShowComments(false);
    setSelectedReelId(null);
    setComments([]);
    setNewComment("");
    setReplyingTo(null);
    setExpandedReplies(new Set());
  }, []);

  useEffect(() => {
    return () => {
      if (commentsUnsubscribeRef.current) {
        commentsUnsubscribeRef.current();
        commentsUnsubscribeRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!comments.length) return;

    let isActive = true;
    const missingUserIds = [...new Set(comments
      .map((comment) => comment.userId)
      .filter((commentUserId) => commentUserId && !commentProfiles[commentUserId] && !commentProfileRequests.current.has(commentUserId))
    )];

    if (!missingUserIds.length) return;

    async function loadCommentProfiles() {
      try {
        const { db } = await getFirebase();
        const { doc, getDoc } = await import("firebase/firestore");

        await Promise.all(missingUserIds.map(async (commentUserId) => {
          commentProfileRequests.current.add(commentUserId);
          const userSnap = await getDoc(doc(db, "users", commentUserId));
          const userData = userSnap.exists() ? userSnap.data() : {};

          if (!isActive) return;

          setCommentProfiles((prev) => ({
            ...prev,
            [commentUserId]: {
              displayName: userData.displayName || userData.username || "",
              photoURL: userData.photoURL || userData.profileImageUrl || userData.profileImage || userData.avatarUrl || "",
            },
          }));
        }));
      } catch (error) {
        console.error("Failed to load comment profiles:", error);
      }
    }

    loadCommentProfiles();

    return () => {
      isActive = false;
    };
  }, [comments, commentProfiles]);

  // Handle video load start
  const handleVideoLoadStart = (reelId) => {
    setVideoLoading(prev => ({ ...prev, [reelId]: true }));
    setVideoErrors(prev => ({ ...prev, [reelId]: false }));
  };

  // Handle video loaded
  const handleVideoLoaded = (reelId) => {
    setVideoLoading(prev => ({ ...prev, [reelId]: false }));
    setVideoErrors(prev => ({ ...prev, [reelId]: false }));
  };

  const handleVideoError = (reelId) => {
    setVideoLoading(prev => ({ ...prev, [reelId]: false }));
    setVideoErrors(prev => ({ ...prev, [reelId]: true }));
  };

  const toggleCaption = useCallback((reelId) => {
    setExpandedCaptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(reelId)) {
        next.delete(reelId);
      } else {
        next.add(reelId);
      }
      return next;
    });
  }, []);

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (authLoading || reelsLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <div style={styles.loadingTitle}>{t("loadingReels")}</div>
          <div style={styles.loadingMeta}>
            {authLoading ? t("checkingSession") : t("fetchingFeed")}
          </div>
        </div>
        <BottomNav router={router} user={user} currentLocale={currentLocale} />
      </div>
    );
  }

  if (reels.length === 0 && feedMode !== "following" && !isProfileSource) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          <p>{t("noReelsYet")}</p>
          <button style={styles.uploadBtn} onClick={() => router.push(`/${currentLocale}/upload`)}>
            {t("upload")}
          </button>
        </div>
        <BottomNav router={router} user={user} currentLocale={currentLocale} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {isProfileSource && (
        <button
          type="button"
          style={styles.profileBackButton}
          onClick={() => router.push(`/${currentLocale}/profile/${profileSourceUserId}`)}
        >
          <BackArrowIcon />
          <span>{t("profile")}</span>
        </button>
      )}

      <DailyMission locale={currentLocale} />
      {!isProfileSource && (
      <div style={styles.feedTabs}>
        <button
          type="button"
          onClick={() => setFeedMode("forYou")}
          style={{
            ...styles.feedTab,
            ...(feedMode === "forYou" ? styles.feedTabActive : {})
          }}
        >
          {t("forYou")}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!user?.uid) {
              router.push(`/${currentLocale}/login`);
              return;
            }
            setFeedMode("following");
          }}
          style={{
            ...styles.feedTab,
            ...(feedMode === "following" ? styles.feedTabActive : {})
          }}
        >
          {t("following")}
        </button>
        <button
          type="button"
          onClick={() => setShowFilterSheet(true)}
          style={{
            ...styles.feedTab,
            ...((diffFilter !== "all" || ctFilter !== "all") ? {
              ...styles.feedTabActive,
              color: GOLD,
              background: "rgba(212,175,55,0.15)",
            } : {}),
            padding: "4px 9px",
            fontSize: 14,
          }}
          aria-label="Filters"
        >
          {(diffFilter !== "all" || ctFilter !== "all") ? "●" : "⚙"}
        </button>
      </div>
      )}
      {/* Reels Feed */}
      <div ref={feedRef} style={styles.feed} className="reels-feed" onScroll={handleScroll}>
        {reels.length === 0 ? (
          <div style={{...styles.videoContainer, ...styles.followingEmpty}}>
            <div style={styles.followingEmptyTitle}>{t("noReelsYet")}</div>
            <div style={styles.followingEmptyText}>
              {t("followingEmptyHelp")}
            </div>
            <button
              type="button"
              onClick={() => setFeedMode("forYou")}
              style={styles.uploadBtn}
            >
              {t("reels")}
            </button>
          </div>
        ) : reels.map((reel, index) => {
          const creatorProfile = reel.userId ? creatorProfiles[reel.userId] : null;
          const creatorName = getCreatorName(reel, creatorProfile);
          const creatorPhoto = getCreatorPhoto(creatorProfile);
          const creatorInitial = creatorName.charAt(0).toUpperCase() || "U";
          const captionText = cleanCaption(reel.description || reel.caption || "");
          const stats = reel.userId ? creatorStats[reel.userId] : null;
          const hasBestScore = typeof stats?.bestScore === "number" && Number.isFinite(stats.bestScore) && stats.bestScore > 0;
          const metrics = [
            typeof stats?.xp === "number" ? { label: t("reels.xp"), value: stats.xp.toLocaleString() } : null,
            { label: t("reels.speed"), value: formatSpeedMetric(reel) },
            { label: t("reels.combo"), value: formatComboCountMetric(reel) },
            stats?.rank ? { label: t("reels.rank"), value: t(stats.rank.key) } : null,
          ].filter(Boolean);
          const creatorStatLine = stats
            ? [
                stats.rank ? t(stats.rank.key) : null,
                typeof stats.xp === "number" ? `${stats.xp.toLocaleString()} ${t("reels.xp")}` : null,
                hasBestScore ? `${t("reels.bestScore")} ${stats.bestScore.toFixed(1)}/10` : null,
              ].filter(Boolean).join(" · ")
            : "";
          const openCreatorProfile = () => {
            if (reel.userId) {
              router.push(`/${currentLocale}/profile/${reel.userId}`);
            }
          };
          const hasStory = !!(creatorProfile?.storyActive || creatorProfile?.hasActiveStory);

          return (
          <div
            key={reel.id}
            data-reel-index={index}
            ref={(el) => {
              if (el) {
                reelItemRefs.current[reel.id] = el;
              } else {
                delete reelItemRefs.current[reel.id];
              }
            }}
            style={{
              ...styles.videoContainer,
              ...(index === currentIndex ? styles.activeVideo : {})
            }}
          >
            {reel.isDemo ? (
              <DemoReelVisual
                onUpload={() => router.push(`/${currentLocale}/upload`)}
              />
            ) : videoErrors[reel.id] || !reel.videoUrl ? (
              <ReelFallbackVisual reel={reel} />
            ) : (
              <video
                ref={(el) => {
                  if (el) {
                    videoRefs.current[reel.id] = el;
                    el.muted = index !== currentIndex || !soundEnabled;
                    el.playsInline = true;
                    el.setAttribute("playsinline", "");
                    el.setAttribute("webkit-playsinline", "");
                  } else {
                    delete videoRefs.current[reel.id];
                  }
                }}
                src={reel.videoUrl}
                style={styles.video}
                className={index === currentIndex ? "cinematic-video" : ""}
                autoPlay={index === currentIndex}
                loop
                muted={index !== currentIndex || !soundEnabled}
                playsInline
                webkit-playsinline="true"
                poster={reel.thumbnailUrl || undefined}
                onClick={(e) => handleVideoClick(e, reel)}
                onLoadStart={() => handleVideoLoadStart(reel.id)}
                onLoadedData={() => {
                  handleVideoLoaded(reel.id);
                  if (index === currentIndex) {
                    const video = videoRefs.current[reel.id];
                    if (video) {
                      video.muted = !soundEnabled;
                      video.play().catch(() => {});
                    }
                  }
                }}
                onLoadedMetadata={() => {
                  if (index === currentIndex) {
                    const video = videoRefs.current[reel.id];
                    if (video) {
                      video.muted = !soundEnabled;
                      video.play().catch(() => {});
                    }
                  }
                }}
                onCanPlay={() => {
                  handleVideoLoaded(reel.id);
                  if (index === currentIndex) {
                    const video = videoRefs.current[reel.id];
                    if (video) {
                      video.muted = !soundEnabled;
                      video.play().catch(() => {});
                    }
                  }
                }}
                onError={() => handleVideoError(reel.id)}
                onTimeUpdate={(e) => {
                  if (index === currentIndex) {
                    const v = e.currentTarget;
                    if (v.duration) setVideoProgress(v.currentTime / v.duration);
                  }
                }}
                preload={index === currentIndex ? "auto" : index === currentIndex + 1 ? "metadata" : "none"}
              />
            )}

            {!reel.isDemo && !videoErrors[reel.id] && videoLoading[reel.id] && (
              <div style={styles.videoLoadingOverlay}>
                <div style={styles.spinner}></div>
                <span style={styles.videoLoadingText}>{t("loadingReel")}</span>
              </div>
            )}

            <div style={styles.vignette} />
            <div style={styles.bottomGradient} />

            {/* Video progress bar */}
            {index === currentIndex && !reel.isDemo && (
              <div style={styles.videoProgressBar}>
                <div style={{ ...styles.videoProgressFill, width: `${videoProgress * 100}%` }} />
              </div>
            )}

            {/* Double-tap heart + fire bursts */}
            {heartBursts.filter((b) => b.reelId === reel.id).map((b) => (
              <div key={b.id} style={{ position: "absolute", left: b.x - 40, top: b.y - 40, zIndex: 60, pointerEvents: "none", width: 80, height: 80 }}>
                <span className="heart-burst" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, lineHeight: 1 }}>❤️</span>
                {[...Array(6)].map((_, i) => (
                  <span
                    key={i}
                    className={`fire-spark fire-spark-${i}`}
                    style={{ position: "absolute", left: "50%", top: "50%", fontSize: 18, lineHeight: 1 }}
                  >
                    {["🔥", "✨", "🔥", "💥", "✨", "🔥"][i]}
                  </span>
                ))}
              </div>
            ))}

            {isPvpSource && index === currentIndex && !reel.isDemo && (
              <div style={styles.pvpSourceBanner}>
                <span style={styles.pvpSourceIcon}>⚔️</span>
                <span style={styles.pvpSourceText}>{t("pvpChallengeBanner")}</span>
              </div>
            )}

            {isProfileSource && index === currentIndex && !reel.isDemo && (
              <div style={styles.profileProgressCard}>
                <span style={styles.profileProgressTitle}>{t("reelProgressTitle")}</span>
                {profileReelProgress === null ? (
                  <span style={{ ...styles.profileProgressEmpty, opacity: 0.4 }}>…</span>
                ) : profileReelProgress.empty ? (
                  <span style={styles.profileProgressEmpty}>{t("reelNoAttempts")}</span>
                ) : (
                  <div style={styles.profileProgressStats}>
                    <div style={styles.profileProgressStat}>
                      <span style={styles.profileProgressStatVal}>{profileReelProgress.bestScore?.toFixed(1)}</span>
                      <span style={styles.profileProgressStatLbl}>{t("best")}</span>
                    </div>
                    <div style={styles.profileProgressDivider} />
                    <div style={styles.profileProgressStat}>
                      <span style={styles.profileProgressStatVal}>{profileReelProgress.latestScore?.toFixed(1)}</span>
                      <span style={styles.profileProgressStatLbl}>{t("reelLatestAttempt")}</span>
                    </div>
                    <div style={styles.profileProgressDivider} />
                    <div style={styles.profileProgressStat}>
                      <span style={styles.profileProgressStatVal}>{profileReelProgress.attempts}</span>
                      <span style={styles.profileProgressStatLbl}>{t("reelAttemptCount")}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={styles.info}>
              <div style={styles.creatorRow}>
                <button
                  type="button"
                  style={{
                    ...styles.creatorAvatarButton,
                    cursor: reel.userId ? "pointer" : "default",
                    ...(hasStory ? {
                      borderColor: RED,
                      boxShadow: "0 0 0 2px #C1121F, 0 0 0 4px rgba(212,175,55,0.35)",
                    } : {}),
                  }}
                  onClick={openCreatorProfile}
                  aria-label={`Open ${creatorName}'s profile`}
                >
                  {creatorPhoto ? (
                    <img src={creatorPhoto} alt="" style={styles.creatorAvatarImage} />
                  ) : (
                    <span style={styles.creatorAvatarFallback}>{creatorInitial}</span>
                  )}
                </button>
                <div style={styles.creatorInfo}>
                  <button
                    type="button"
                    style={{
                      ...styles.username,
                      cursor: reel.userId ? "pointer" : "default",
                    }}
                    onClick={openCreatorProfile}
                  >
                    @{creatorName}
                    {creatorProfile?.streakCount >= 5 && (
                      <span style={styles.onFireBadge}>{"🔥"}</span>
                    )}
                  </button>
                  {creatorStatLine ? (
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, marginTop: 2, letterSpacing: 0.2 }}>
                      {creatorStatLine}
                    </div>
                  ) : null}
                  {reel.gymId && gymNames[reel.gymId] ? (
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, marginTop: 1 }}>
                      🏋️ {gymNames[reel.gymId]}
                    </div>
                  ) : null}
                </div>
              </div>
              {captionText && (
                <button
                  type="button"
                  style={styles.descriptionLine}
                  onClick={() => setCaptionSheetReelId(reel.id)}
                  aria-label={t("captionExpand")}
                >
                  {captionText}
                </button>
              )}
              {/* Primary CTA — single, type-aware, no duplicates */}
              {!reel.isDemo && (() => {
                const effectiveType = reel.contentType || reel.type || "lifestyle";
                const isChallenge = effectiveType === "training";
                const isEducational = effectiveType === "educational";
                const showChallengeCta = isChallenge || reel.challengeEnabled;
                const showLearnCta = isEducational && !reel.challengeEnabled;
                if (!showChallengeCta && !showLearnCta) return null;
                const handleChallengeClick = async () => {
                  try {
                    const { db: fdb } = await getFirebase();
                    const { doc, setDoc, increment: fsIncrement, serverTimestamp: fsts } = await import("firebase/firestore");
                    await setDoc(doc(fdb, "reel_stats", reel.id), { reelId: reel.id, challengeClicks: fsIncrement(1), updatedAt: fsts() }, { merge: true });
                  } catch { /* non-critical */ }
                  const trainParams = new URLSearchParams({ reelId: reel.id });
                  if (reel.userId) trainParams.set("reelCreatorId", reel.userId);
                  if (stats?.bestScore != null && Number.isFinite(stats.bestScore) && stats.bestScore > 0) {
                    trainParams.set("creatorBestScore", stats.bestScore.toFixed(1));
                  }
                  router.push(`/${currentLocale}/train?${trainParams.toString()}`);
                };
                return (
                  <div style={styles.trainButtonRow}>
                    {showChallengeCta && (
                      <button type="button" style={styles.tryThisButton} onClick={handleChallengeClick}>
                        {t("reelChallenge")}
                      </button>
                    )}
                    {showLearnCta && (
                      <button type="button" style={styles.learnButton} onClick={() => setCaptionSheetReelId(reel.id)}>
                        {t("reelLearnMore")}
                      </button>
                    )}
                  </div>
                );
              })()}
              {/* Remix origin banner */}
              {!reel.isDemo && reel.remixOf && (
                <div style={styles.remixBanner}>
                  🔀 {t("remixOf").replace("{username}", reel.remixOfCreatorName || "creator")}
                </div>
              )}
            </div>

            <div style={styles.actions}>
              <div
                className="reel-action"
                style={{
                  ...styles.actionItem,
                  ...(userLikes.has(reel.id) ? styles.actionItemLiked : {})
                }}
                onClick={() => handleLike(reel.id)}
              >
                <div
                  className="reel-action-circle"
                  style={{
                    ...styles.actionCircle,
                    ...(userLikes.has(reel.id) ? styles.actionCircleLiked : {})
                  }}
                >
                  <span style={{
                    ...styles.actionIcon,
                    ...(userLikes.has(reel.id) ? styles.actionIconLiked : {})
                  }}>
                    <LikeIcon filled={userLikes.has(reel.id)} />
                  </span>
                </div>
                <span style={styles.actionText}>{formatCompactCount(getSafeLikeCount(reel))}</span>
              </div>
              <div className="reel-action" style={styles.actionItem} onClick={() => handleOpenComments(reel.id)} title={t("comment")}>
                <div className="reel-action-circle" style={styles.actionCircle}>
                  <CommentIcon />
                </div>
                <span style={styles.actionText}>{formatCompactCount(getSafeCommentsCount(reel))}</span>
              </div>
              <div className="reel-action" style={styles.actionItem} onClick={() => handleShare(reel)} title={t("share") || "Share"}>
                <div className="reel-action-circle" style={styles.actionCircle}>
                  <ShareIcon />
                </div>
                <span style={styles.actionText}>{formatCompactCount(reel.shares || 0)}</span>
              </div>
              <div
                className="reel-action"
                role="button"
                title={savedReels.has(reel.id) ? t("saved") : t("save")}
                style={{
                  ...styles.actionItem,
                  ...(savedReels.has(reel.id) ? styles.actionItemSaved : {})
                }}
                onClick={() => handleSave(reel.id)}
              >
                <div
                  className="reel-action-circle"
                  style={{
                    ...styles.actionCircle,
                    ...(savedReels.has(reel.id) ? styles.actionCircleSaved : {})
                  }}
                >
                  <span style={{
                    ...styles.actionIcon,
                    ...(savedReels.has(reel.id) ? styles.actionIconSaved : {})
                  }}>
                    <BookmarkIcon filled={savedReels.has(reel.id)} />
                  </span>
                </div>
              </div>
              <div
                className="reel-action"
                style={styles.actionItem}
                onClick={() => handleGetFeedback(reel)}
                title={t("getAiFeedback")}
              >
                <div className="reel-action-circle" style={styles.actionCircle}>
                  <RobotIcon />
                </div>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.95)", textAlign: "center", lineHeight: 1.2 }}>
                  {currentLocale === "mn" ? "AI" : currentLocale === "ko" ? "AI" : "AI"}
                </span>
              </div>
              <div
                className="reel-action"
                style={styles.actionItem}
                onClick={() => setBreakdownReel(reel)}
                title={t("aiBreakdownBtn")}
              >
                <div className="reel-action-circle" style={styles.actionCircle}>
                  <AISparkIcon />
                </div>
                <span style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.95)", textAlign: "center", lineHeight: 1.2, maxWidth: 40 }}>
                  {currentLocale === "mn" ? "Шинж" : currentLocale === "ko" ? "분석" : "Breakdown"}
                </span>
              </div>
            </div>

            {/* Play/Pause indicator — shown only when paused */}
            {!reel.isDemo && showControls && index === currentIndex && videoRefs.current[reel.id]?.paused && (
              <div style={styles.playIndicator}>
                <CenterPlayIcon />
              </div>
            )}
          </div>
          );
        })}
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div style={styles.commentsModal}>
          <div style={styles.commentsOverlay} onClick={handleCloseComments} />
          <div style={styles.commentsContent}>
            <div style={styles.commentsHandle} />
            <div style={styles.commentsHeader}>
              <span style={styles.commentsTitle}>
                {t("comment")}{comments.length > 0 ? ` (${comments.length})` : ""}
              </span>
              <button style={styles.commentsClose} onClick={handleCloseComments} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div style={styles.commentsList}>
              {comments.length === 0 ? (
                <div style={styles.noComments}>{t("noCommentsYet")}</div>
              ) : (() => {
                const topLevel = comments.filter((c) => !c.parentId);
                const repliesByParent = comments.reduce((acc, c) => {
                  if (c.parentId) { acc[c.parentId] = acc[c.parentId] || []; acc[c.parentId].push(c); }
                  return acc;
                }, {});

                const renderComment = (comment, isReply = false) => {
                  const profile = comment.userId ? commentProfiles[comment.userId] : null;
                  const name = profile?.displayName || comment.username || "user";
                  const photo = comment.userPhotoURL || profile?.photoURL || "";
                  return (
                    <div key={comment.id} style={isReply ? styles.replyItem : styles.commentItem}>
                      <button type="button" style={isReply ? styles.replyAvatar : styles.commentAvatar}
                        onClick={() => comment.userId && router.push(`/${currentLocale}/profile/${comment.userId}`)}>
                        {photo ? <img src={photo} alt="" style={styles.commentAvatarImage} /> : name.charAt(0).toUpperCase()}
                      </button>
                      <div style={styles.commentContent}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <button type="button" style={styles.commentUsername}
                            onClick={() => comment.userId && router.push(`/${currentLocale}/profile/${comment.userId}`)}>
                            @{name}
                          </button>
                          {user?.uid === comment.userId && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment)}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "rgba(255,255,255,0.25)", lineHeight: 1 }}
                              title={currentLocale === "mn" ? "Устгах" : currentLocale === "ko" ? "삭제" : "Delete"}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                            </button>
                          )}
                        </div>
                        <div style={styles.commentText}>{comment.text}</div>
                        {!isReply && user && (
                          <button type="button" style={styles.replyBtn}
                            onClick={() => setReplyingTo(replyingTo?.commentId === comment.id ? null : { commentId: comment.id, username: name })}>
                            {replyingTo?.commentId === comment.id ? t("cancelReply") : t("reply")}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                };

                return topLevel.map((comment) => {
                  const replies = repliesByParent[comment.id] || [];
                  const isExpanded = expandedReplies.has(comment.id);
                  return (
                    <div key={comment.id}>
                      {renderComment(comment, false)}
                      {replies.length > 0 && (
                        <div style={styles.repliesSection}>
                          <button type="button" style={styles.toggleReplies}
                            onClick={() => setExpandedReplies((prev) => {
                              const next = new Set(prev);
                              isExpanded ? next.delete(comment.id) : next.add(comment.id);
                              return next;
                            })}>
                            {isExpanded ? `▲ ${t("hideReplies")}` : `▼ ${t("viewReplies").replace("{n}", replies.length)}`}
                          </button>
                          {isExpanded && replies.map((r) => renderComment(r, true))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {user && (
              <div style={styles.commentInput}>
                <div style={{ display: "flex", gap: 6, padding: "6px 12px 0", overflowX: "auto", scrollbarWidth: "none" }}>
                  {["🥊", "🔥", "💪", "👏", "🙌", "👊"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewComment((prev) => prev + emoji)}
                      style={{ flexShrink: 0, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 8px", fontSize: 16, cursor: "pointer", lineHeight: 1 }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {replyingTo && (
                  <div style={styles.replyPill}>
                    <span style={styles.replyPillText}>↩ @{replyingTo.username}</span>
                    <button type="button" style={styles.replyPillClose} onClick={() => setReplyingTo(null)}>✕</button>
                  </div>
                )}
                <div style={styles.commentInputRow}>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? `${t("replyTo")} @${replyingTo.username}…` : t("addComment")}
                    style={styles.commentInputField}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    style={{ ...styles.commentSendBtn, ...(newComment.trim() ? {} : styles.commentSendBtnDisabled) }}
                  >
                    {t("send")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {feedbackOpen && (
        <div style={styles.feedbackModal}>
          <div style={styles.feedbackOverlay} onClick={handleCloseFeedback} />
          <div style={styles.feedbackSheet}>
            <div style={styles.feedbackHandle} />
            <div style={styles.feedbackHeader}>
              <div>
                <p style={styles.feedbackKicker}>{t("aiCoach")}</p>
                <h3 style={styles.feedbackTitle}>{t("techniqueFeedback")}</h3>
                {feedbackReel && (
                  <p style={styles.feedbackSubtitle}>@{feedbackReel.username || "fighter"}</p>
                )}
              </div>
              <button style={styles.feedbackClose} onClick={handleCloseFeedback} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div style={styles.feedbackBody}>
              {feedbackLoading && (
                <div style={styles.feedbackLoading}>
                  <div style={styles.feedbackSpinner} />
                  <span>{t("analyzingRound")}</span>
                </div>
              )}

              {feedbackError && (
                <div style={styles.feedbackError}>{feedbackError}</div>
              )}

              {feedbackResult && (
                <>
                  {feedbackSaved && (
                    <div style={styles.feedbackSaved}>
                      {t("savedToProgress")}
                    </div>
                  )}

                  {sessionXPData && (
                    <div style={styles.xpCard}>
                      <p style={styles.xpCardTitle}>{t("xpEarned")}</p>
                      <div style={styles.xpCardRows}>
                        <div style={styles.xpCardRow}>
                          <span style={styles.xpCardLabel}>{t("xpBase")}</span>
                          <span style={styles.xpCardVal}>+{sessionXPData.base}</span>
                        </div>
                        {sessionXPData.improvement > 0 && (
                          <div style={styles.xpCardRow}>
                            <span style={styles.xpCardLabel}>{t("xpImprovement")}</span>
                            <span style={{ ...styles.xpCardVal, color: "#34D399" }}>+{sessionXPData.improvement}</span>
                          </div>
                        )}
                        {sessionXPData.streakBonus > 0 && (
                          <div style={styles.xpCardRow}>
                            <span style={styles.xpCardLabel}>{t("xpStreakBonus")}</span>
                            <span style={{ ...styles.xpCardVal, color: "#FB923C" }}>+{sessionXPData.streakBonus}</span>
                          </div>
                        )}
                        {sessionXPData.likeXP > 0 && (
                          <div style={styles.xpCardRow}>
                            <span style={styles.xpCardLabel}>{t("xpLikes")}</span>
                            <span style={{ ...styles.xpCardVal, color: "#60A5FA" }}>+{sessionXPData.likeXP}</span>
                          </div>
                        )}
                        <div style={styles.xpCardRowTotal}>
                          <span style={styles.xpCardTotalLabel}>{t("xpLabel")}</span>
                          <span style={styles.xpCardTotalVal}>+{sessionXPData.total}</span>
                        </div>
                        {sessionXPData.capped && (
                          <p style={styles.xpCapNotice}>{t("xpDailyCap")}</p>
                        )}
                      </div>

                      {/* Rank progress bar */}
                      <div style={styles.xpRankWrap}>
                        <div style={styles.xpRankRow}>
                          <span style={{ fontWeight: 900, fontSize: 12, color: sessionXPData.currentRank.color }}>
                            {t(sessionXPData.currentRank.key)}
                          </span>
                          <span style={styles.xpTotalLabel}>
                            {sessionXPData.totalXP.toLocaleString()} {t("xpLabel")}
                          </span>
                        </div>
                        <div style={styles.xpRankTrack}>
                          <div style={{
                            ...styles.xpRankFill,
                            width: `${sessionXPData.rankProgress}%`,
                            background: sessionXPData.currentRank.gradient,
                          }} />
                        </div>
                        {sessionXPData.nextRank && (
                          <p style={styles.xpNextLabel}>
                            {sessionXPData.xpToNext.toLocaleString()} {t("xpLabel")} → {t(sessionXPData.nextRank.key)}
                          </p>
                        )}
                        {!sessionXPData.nextRank && (
                          <p style={styles.xpNextLabel}>{t("atMaxRank")}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <pre style={styles.feedbackResult}>{feedbackResult}</pre>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {breakdownReel && (
        <AIBreakdownSheet
          reel={breakdownReel}
          locale={currentLocale}
          onClose={() => setBreakdownReel(null)}
        />
      )}

      {captionSheetReelId && (() => {
        const sheetReel = reels.find(r => r.id === captionSheetReelId);
        const fullCaption = sheetReel ? cleanCaption(sheetReel.description || sheetReel.caption || "") : "";
        return (
          <div
            style={styles.captionSheetOverlay}
            onClick={() => setCaptionSheetReelId(null)}
          >
            <div
              style={styles.captionSheet}
              onClick={e => e.stopPropagation()}
            >
              <div style={styles.captionSheetHandle} />
              <div style={styles.captionSheetHeader}>
                <span style={styles.captionSheetTitle}>{t("captionSheetTitle")}</span>
                <button
                  type="button"
                  style={styles.captionSheetClose}
                  onClick={() => setCaptionSheetReelId(null)}
                  aria-label={t("close")}
                >
                  ✕
                </button>
              </div>
              <div style={styles.captionSheetBody}>
                {fullCaption ? (
                  <p style={styles.captionSheetText}>{fullCaption}</p>
                ) : (
                  <p style={{ ...styles.captionSheetText, opacity: 0.35 }}>—</p>
                )}
                {sheetReel && (sheetReel.contentType || sheetReel.difficulty) && (
                  <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {sheetReel.contentType && (
                      <span style={styles.captionMetaChip}>
                        {sheetReel.contentType === "training" ? `🥊 ${t("ctFilterTraining")}`
                          : sheetReel.contentType === "educational" ? `📚 ${t("ctFilterEducational")}`
                          : sheetReel.contentType === "lifestyle" ? `🎬 ${t("ctFilterLifestyle")}`
                          : sheetReel.contentType}
                      </span>
                    )}
                    {sheetReel.difficulty && (
                      <span style={styles.captionMetaChip}>
                        {sheetReel.difficulty === "beginner" ? `🟢 ${t("diffBeginner")}` : sheetReel.difficulty}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <button
        type="button"
        style={styles.soundToggleButton}
        onClick={toggleMute}
        aria-label={soundEnabled ? t("soundOn") : t("tapForSound")}
        title={soundEnabled ? t("soundOn") : t("tapForSound")}
      >
        <SpeakerIcon muted={!soundEnabled} />
      </button>

      {/* Filter sheet */}
      {showFilterSheet && (
        <div style={styles.filterSheetOverlay} onClick={() => setShowFilterSheet(false)}>
          <div style={styles.filterSheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.filterSheetHandle} />
            <div style={styles.filterSheetHeader}>
              <span style={styles.filterSheetTitle}>
                {t("filterSheetTitle") || (currentLocale === "mn" ? "ШҮҮЛТҮҮР" : currentLocale === "ko" ? "필터" : "FILTERS")}
              </span>
              <button type="button" style={styles.filterSheetClose} onClick={() => setShowFilterSheet(false)}>✕</button>
            </div>
            <div style={styles.filterSheetBody}>
              <p style={styles.filterSheetLabel}>
                {t("filterLevelLabel") || (currentLocale === "mn" ? "ТҮВШИН" : currentLocale === "ko" ? "레벨" : "LEVEL")}
              </p>
              <div style={styles.filterSheetRow}>
                {[
                  { key: "all", label: currentLocale === "mn" ? "Бүх түвшин" : currentLocale === "ko" ? "전체" : "All levels" },
                  { key: "beginner", label: `🟢 ${t("diffBeginner")}` },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDiffFilter(key)}
                    style={{ ...styles.filterChip, ...(diffFilter === key ? styles.filterChipActive : {}) }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p style={{ ...styles.filterSheetLabel, marginTop: 16 }}>
                {t("filterContentLabel") || (currentLocale === "mn" ? "КОНТЕНТ" : currentLocale === "ko" ? "콘텐츠" : "CONTENT")}
              </p>
              <div style={styles.filterSheetRow}>
                {[
                  { key: "all", label: `📂 ${t("ctFilterAll")}` },
                  { key: "training", label: `🥊 ${t("ctFilterTraining")}` },
                  { key: "lifestyle", label: `🎬 ${t("ctFilterLifestyle")}` },
                  { key: "educational", label: `📚 ${t("ctFilterEducational")}` },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCtFilter(key)}
                    style={{ ...styles.filterChip, ...(ctFilter === key ? styles.filterChipActive : {}) }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {(diffFilter !== "all" || ctFilter !== "all") && (
                <button
                  type="button"
                  style={styles.filterClearBtn}
                  onClick={() => { setDiffFilter("all"); setCtFilter("all"); }}
                >
                  {t("filterClear") || (currentLocale === "mn" ? "Шүүлтүүр арилгах" : currentLocale === "ko" ? "필터 초기화" : "Clear filters")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav
        router={router}
        user={user}
        currentLocale={currentLocale}
        onInteractStart={clearControlsTimer}
        onInteractEnd={scheduleControlsHide}
      />
      <style>{`
        @keyframes likePop {
          0% { transform: scale(1); }
          45% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        @keyframes reelEnter {
          from { opacity: 0.72; transform: scale(1.012); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pageEnter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes cinematicZoom {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }

        .cinematic-video {
          animation: cinematicZoom 12s ease-out forwards;
        }

        .reels-feed {
          scrollbar-width: none;
        }

        .reels-feed::-webkit-scrollbar {
          display: none;
        }

        .reel-action:active {
          animation: iconTap 220ms ease;
        }

        .reel-action:active .reel-action-circle {
          transform: scale(1.15);
        }

        @keyframes iconTap {
          0% { transform: scale(1); }
          45% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        @keyframes heartBurst {
          0%   { opacity: 0; transform: scale(0.3); }
          18%  { opacity: 1; transform: scale(1.45); }
          65%  { opacity: 0.9; transform: scale(1.0); }
          100% { opacity: 0; transform: scale(0.8) translateY(-18px); }
        }
        .heart-burst { animation: heartBurst 700ms cubic-bezier(0.16,1,0.3,1) forwards; pointer-events: none; }

        @keyframes sparkFly0 { 0%{opacity:0;transform:translate(-50%,-50%) scale(0)} 20%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(calc(-50% - 36px),calc(-50% - 44px)) scale(0.5)} }
        @keyframes sparkFly1 { 0%{opacity:0;transform:translate(-50%,-50%) scale(0)} 20%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(calc(-50% + 38px),calc(-50% - 40px)) scale(0.5)} }
        @keyframes sparkFly2 { 0%{opacity:0;transform:translate(-50%,-50%) scale(0)} 25%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(calc(-50% - 48px),calc(-50% - 18px)) scale(0.4)} }
        @keyframes sparkFly3 { 0%{opacity:0;transform:translate(-50%,-50%) scale(0)} 25%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(calc(-50% + 48px),calc(-50% - 14px)) scale(0.4)} }
        @keyframes sparkFly4 { 0%{opacity:0;transform:translate(-50%,-50%) scale(0)} 30%{opacity:1;transform:translate(-50%,-50%) scale(0.9)} 100%{opacity:0;transform:translate(calc(-50% - 22px),calc(-50% + 42px)) scale(0.3)} }
        @keyframes sparkFly5 { 0%{opacity:0;transform:translate(-50%,-50%) scale(0)} 30%{opacity:1;transform:translate(-50%,-50%) scale(0.9)} 100%{opacity:0;transform:translate(calc(-50% + 22px),calc(-50% + 42px)) scale(0.3)} }
        .fire-spark-0 { animation: sparkFly0 750ms ease-out 80ms forwards; }
        .fire-spark-1 { animation: sparkFly1 750ms ease-out 100ms forwards; }
        .fire-spark-2 { animation: sparkFly2 700ms ease-out 60ms forwards; }
        .fire-spark-3 { animation: sparkFly3 700ms ease-out 120ms forwards; }
        .fire-spark-4 { animation: sparkFly4 650ms ease-out 140ms forwards; }
        .fire-spark-5 { animation: sparkFly5 650ms ease-out 160ms forwards; }

        .reel-action-circle { transition: transform 160ms ease, background 160ms ease, border-color 160ms ease; }
        .reel-action:active .reel-action-circle { transform: scale(0.88); }

        [style*="cursor: pointer"]:active {
          transform: scale(0.96);
        }
      `}</style>
    </div>
  );
}

function LikeIcon({ filled }) {
  return (
    <svg style={styles.actionSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.8 4.9c-2-2-5.2-1.8-7 .4L12 7.1l-1.8-1.8c-1.8-2.2-5-2.4-7-.4-2.2 2.2-2 5.7.4 8.1l8.4 7.8 8.4-7.8c2.4-2.4 2.6-5.9.4-8.1Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg style={styles.backArrowSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 5 8 12l7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpeakerIcon({ muted }) {
  return (
    <svg style={styles.soundSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.5 9.2h3.4l4.8-4v13.6l-4.8-4H4.5V9.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {muted ? (
        <>
          <path d="m17 9 4 4M21 9l-4 4" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M16.2 8.2c1.1 1 1.7 2.3 1.7 3.8s-.6 2.8-1.7 3.8" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
          <path d="M18.7 5.8c1.8 1.6 2.8 3.8 2.8 6.2s-1 4.6-2.8 6.2" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg style={styles.actionSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.8 5.4h14.4v10.1H9.5L5 19.2v-3.7H4.8V5.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg style={styles.actionSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 12.5 18.5 5l-3 14-3.9-4.3-4.6-2.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ViewIcon() {
  return (
    <svg style={styles.actionSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2.8 12s3.4-5.5 9.2-5.5 9.2 5.5 9.2 5.5-3.4 5.5-9.2 5.5S2.8 12 2.8 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.45" />
    </svg>
  );
}

function BookmarkIcon({ filled }) {
  return (
    <svg style={styles.actionSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 4.5h10v15l-5-3.2-5 3.2v-15Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RobotIcon() {
  return (
    <svg style={styles.actionSvg} viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="5"
        y="8"
        width="14"
        height="10"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
      />
      <path
        d="M12 5v3M8.5 12h.1M15.5 12h.1M9 15h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AISparkIcon() {
  return (
    <svg style={{ ...styles.actionSvg, width: 18, height: 18 }} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.5 3 4 13h7l-1.5 8L20 11h-7L14.5 3z"
        fill="none" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function CenterPlayIcon() {
  return (
    <div style={{
      width: 72,
      height: 72,
      borderRadius: "50%",
      background: "rgba(0,0,0,0.55)",
      border: "2px solid rgba(255,255,255,0.32)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
    }}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="white" aria-hidden="true">
        <path d="M8 5.5v13l11-6.5-11-6.5Z" />
      </svg>
    </div>
  );
}

function DemoReelVisual() {
  return (
    <div style={styles.demoReel}>
      <div style={styles.demoVignette} />
    </div>
  );
}

function ReelFallbackVisual({ reel }) {
  return (
    <div style={styles.reelFallback}>
      <div style={styles.reelFallbackLight} />
      <div style={styles.reelFallbackContent}>
        <span style={styles.reelFallbackKicker}>GAVANA BOXING</span>
        <strong style={styles.reelFallbackTitle}>
          {reel?.description || reel?.caption || "Training reel unavailable"}
        </strong>
        <span style={styles.reelFallbackText}>
          Video could not load. Try refreshing or opening the reel again.
        </span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    minHeight: "100dvh",
    background: "#000",
    overflow: "hidden",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    height: "100vh",
    color: "var(--text-primary)",
    fontSize: 16,
  },
  loadingTitle: {
    color: "var(--text-primary)",
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: 0,
  },
  loadingMeta: {
    color: "var(--text-secondary)",
    fontSize: 13,
    fontWeight: 650,
    marginTop: -8,
  },
  spinner: {
    width: 40,
    height: 40,
    borderTop: "3px solid var(--primary-red)",
    borderRight: "3px solid rgba(255,255,255,0.3)",
    borderBottom: "3px solid rgba(255,255,255,0.3)",
    borderLeft: "3px solid rgba(255,255,255,0.3)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    color: "var(--text-primary)",
    gap: 16,
  },
  uploadBtn: {
    background: "var(--primary-red)",
    color: "var(--text-primary)",
    border: "none",
    borderRadius: 10,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: "var(--space-6)",
    paddingRight: "var(--space-6)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  header: {
    display: "none",
  },
  headerTabs: {
    display: "flex",
    gap: 24,
  },
  headerTab: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 17,
    fontWeight: 600,
    cursor: "pointer",
  },
  headerTabActive: {
    color: "var(--text-primary)",
    fontSize: 17,
    fontWeight: 700,
    borderBottom: "2px solid #C1121F",
    paddingBottom: 4,
  },
  profileBackButton: {
    position: "fixed",
    top: "calc(16px + env(safe-area-inset-top))",
    left: "max(14px, env(safe-area-inset-left))",
    zIndex: 90,
    height: 38,
    paddingTop: 0,
    paddingRight: 13,
    paddingBottom: 0,
    paddingLeft: 10,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.4,
    cursor: "pointer",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  },
  feedTabs: {
    position: "fixed",
    top: "calc(14px + env(safe-area-inset-top))",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 110,
    display: "flex",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    paddingRight: 4,
    borderRadius: 999,
    background: "var(--glass)",
    border: "1px solid var(--line)",
    backdropFilter: "blur(18px) saturate(150%)",
    WebkitBackdropFilter: "blur(18px) saturate(150%)",
    boxShadow: "var(--shadow-soft)",
    maxWidth: "calc(100vw - 24px)",
    overflowX: "auto",
    scrollbarWidth: "none",
  },
  feedTab: {
    border: "none",
    borderRadius: 999,
    background: "transparent",
    color: "#888",
    minHeight: 34,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 11,
    paddingRight: 11,
    fontSize: 12,
    fontWeight: 850,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  feedTabActive: {
    background: RED,
    color: "#FFFFFF",
    boxShadow: "none",
  },
  feed: {
    height: "100dvh",
    overflowY: "scroll",
    scrollSnapType: "y mandatory",
    scrollBehavior: "smooth",
    overscrollBehaviorY: "contain",
    WebkitOverflowScrolling: "touch",
  },
  videoContainer: {
    position: "relative",
    width: "100vw",
    height: "100dvh",
    flexShrink: 0,
    overflow: "hidden",
    scrollSnapAlign: "start",
    scrollSnapStop: "always",
    animation: "reelEnter 220ms ease both",
  },
  activeVideo: {
    zIndex: 1,
  },
  followingEmpty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: "var(--space-6)",
    paddingRight: "var(--space-6)",
    textAlign: "center",
    background: "var(--background)",
  },
  followingEmptyTitle: {
    color: "var(--text-primary)",
    fontSize: 24,
    fontWeight: 950,
  },
  followingEmptyText: {
    color: "var(--text-secondary)",
    fontSize: 14,
    lineHeight: 1.45,
    maxWidth: 320,
  },
  videoLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(circle at 50% 42%, rgba(193,18,31,0.16), transparent 34%), linear-gradient(180deg, rgba(7,7,7,0.82), rgba(7,7,7,0.94))",
    zIndex: 10,
  },
  videoLoadingText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: 850,
    textShadow: "0 3px 14px rgba(0,0,0,0.85)",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    background: "var(--background)",
    filter: "contrast(1.08) saturate(1.04)",
    transformOrigin: "center center",
  },
  vignette: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background: "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.22) 72%, rgba(0,0,0,0.56) 100%)",
    zIndex: 2,
  },
  demoReel: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    background: "radial-gradient(circle at 52% 34%, rgba(212,175,55,0.16), transparent 28%), radial-gradient(circle at 46% 62%, rgba(193,18,31,0.2), transparent 30%), linear-gradient(145deg, #070707 0%, #171010 48%, #050505 100%)",
  },
  demoVignette: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at 50% 38%, rgba(255,255,255,0.08), transparent 34%), linear-gradient(to bottom, rgba(0,0,0,0.15), #000)",
  },
  reelFallback: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    background: "radial-gradient(circle at 50% 38%, rgba(193,18,31,0.22), transparent 32%), radial-gradient(circle at 58% 56%, rgba(212,175,55,0.12), transparent 30%), linear-gradient(145deg, #070707, #13090b 48%, #050505)",
  },
  reelFallbackLight: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.08) 42%, transparent 66%)",
    opacity: 0.5,
  },
  reelFallbackContent: {
    position: "absolute",
    left: "max(24px, env(safe-area-inset-left))",
    right: 96,
    bottom: "calc(170px + env(safe-area-inset-bottom))",
    display: "grid",
    gap: 10,
    zIndex: 1,
  },
  reelFallbackKicker: {
    color: "var(--accent-gold)",
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 1.8,
  },
  reelFallbackTitle: {
    color: "var(--text-primary)",
    fontSize: 28,
    lineHeight: 1.05,
    fontWeight: 1000,
    textShadow: "0 8px 28px rgba(0,0,0,0.9)",
  },
  reelFallbackText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    lineHeight: 1.45,
    maxWidth: 360,
  },
  demoGrid: {
    display: "none",
  },
  demoSpotlight: {
    display: "none",
  },
  demoBag: {
    display: "none",
  },
  demoFighter: {
    display: "none",
  },
  demoHead: {
    position: "absolute",
    left: 76,
    top: 0,
    width: 54,
    height: 54,
    borderRadius: "50%",
    background: "linear-gradient(145deg, #D4AF37, #70501a)",
  },
  demoTorso: {
    position: "absolute",
    left: 58,
    top: 60,
    width: 92,
    height: 148,
    borderRadius: "42px 42px 24px 24px",
    background: "linear-gradient(160deg, #1c1c1c, #530916)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  demoGloveLead: {
    position: "absolute",
    right: 0,
    top: 76,
    width: 86,
    height: 58,
    borderRadius: "34px 30px 28px 28px",
    background: "linear-gradient(145deg, #C1121F, #770111)",
    boxShadow: "0 20px 48px rgba(0,0,0,0.36)",
  },
  demoGloveRear: {
    position: "absolute",
    left: 8,
    top: 86,
    width: 66,
    height: 54,
    borderRadius: "30px",
    background: "linear-gradient(145deg, #D4AF37, #70501a)",
  },
  demoHook: {
    position: "absolute",
    left: 18,
    right: 92,
    bottom: 132,
    display: "grid",
    gap: 8,
  },
  demoHookKicker: {
    color: "var(--accent-gold)",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  demoHookTitle: {
    color: "var(--text-primary)",
    fontSize: 34,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 0,
  },
  demoHookText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 1.45,
  },
  demoUploadMessage: {
    marginTop: 8,
    color: "var(--text-primary)",
    fontSize: 15,
    fontWeight: 900,
    textShadow: "0 2px 10px rgba(0,0,0,0.9)",
  },
  demoUploadButton: {
    width: 128,
    minHeight: 42,
    marginTop: 4,
    border: "none",
    borderRadius: 8,
    background: "var(--primary-red)",
    color: "var(--text-primary)",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 14px 32px rgba(0,0,0,0.34)",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingRight: 18,
    paddingBottom: "calc(86px + env(safe-area-inset-bottom))",
    paddingLeft: 18,
    background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.38) 46%, transparent 78%)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  bottomGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "64vh",
    pointerEvents: "none",
    background: "linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.68) 38%, rgba(0,0,0,0.32) 68%, transparent 100%)",
    zIndex: 2,
  },
  videoProgressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    background: "rgba(255,255,255,0.15)",
    zIndex: 20,
    overflow: "hidden",
  },
  videoProgressFill: {
    height: "100%",
    background: "rgba(255,255,255,0.65)",
    transition: "width 0.25s linear",
    borderRadius: "0 1px 1px 0",
  },
  info: {
    position: "absolute",
    left: "max(14px, env(safe-area-inset-left))",
    right: 76,
    bottom: "calc(92px + env(safe-area-inset-bottom))",
    maxWidth: 520,
    animation: "pageEnter 380ms cubic-bezier(0.16, 1, 0.3, 1) both",
    zIndex: 4,
  },
  creatorRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  creatorAvatarButton: {
    width: 44,
    height: 44,
    flex: "0 0 44px",
    borderRadius: "50%",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(212,175,55,0.64)",
    background: "linear-gradient(145deg, rgba(193,18,31,0.9), rgba(7,7,7,0.78))",
    boxShadow: "0 0 0 3px rgba(193,18,31,0.2), 0 10px 26px rgba(0,0,0,0.55)",
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    WebkitTapHighlightColor: "transparent",
  },
  creatorAvatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  creatorAvatarFallback: {
    color: "var(--text-primary)",
    fontSize: 17,
    fontWeight: 1000,
    textShadow: "0 2px 10px rgba(0,0,0,0.72)",
  },
  username: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    border: "none",
    background: "transparent",
    color: "var(--text-primary)",
    fontFamily: "inherit",
    fontSize: 15,
    fontWeight: 900,
    margin: 0,
    letterSpacing: 0,
    lineHeight: 1.1,
    textAlign: "left",
    textShadow: "0 5px 28px rgba(0,0,0,0.98), 0 1px 2px rgba(0,0,0,1)",
    WebkitTapHighlightColor: "transparent",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  onFireBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.6,
    color: "#FB923C",
    lineHeight: 1,
    flexShrink: 0,
  },
  viewProof: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 10,
    textShadow: "0 2px 8px rgba(0,0,0,0.95)",
  },
  descriptionLine: {
    display: "block",
    marginBottom: 8,
    padding: 0,
    border: "none",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
    color: "var(--text-primary)",
    fontSize: 13,
    lineHeight: 1.35,
    fontWeight: 500,
    maxWidth: 500,
    width: "100%",
    textShadow: "0 4px 22px rgba(0,0,0,0.96), 0 1px 2px rgba(0,0,0,1)",
    letterSpacing: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  filterSheetOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  filterSheet: {
    width: "100%",
    maxWidth: 600,
    background: "linear-gradient(180deg, #161212, #0a0a0a)",
    borderRadius: "20px 20px 0 0",
    padding: "10px 20px calc(32px + env(safe-area-inset-bottom))",
    border: "1px solid rgba(212,175,55,0.12)",
    boxShadow: "0 -16px 48px rgba(0,0,0,0.7)",
    display: "flex",
    flexDirection: "column",
  },
  filterSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    background: "rgba(255,255,255,0.18)",
    alignSelf: "center",
    marginBottom: 16,
    flexShrink: 0,
  },
  filterSheetHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  filterSheetTitle: {
    fontSize: 10,
    fontWeight: 900,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 2,
  },
  filterSheetClose: {
    background: "rgba(255,255,255,0.08)",
    border: "none",
    borderRadius: "50%",
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    cursor: "pointer",
    padding: 0,
  },
  filterSheetBody: {
    display: "flex",
    flexDirection: "column",
  },
  filterSheetLabel: {
    margin: "0 0 10px",
    fontSize: 10,
    fontWeight: 900,
    color: GOLD,
    letterSpacing: 1.5,
  },
  filterSheetRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  filterChip: {
    padding: "7px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  filterChipActive: {
    border: "1px solid rgba(193,18,31,0.6)",
    background: "rgba(193,18,31,0.2)",
    color: "#F87171",
  },
  filterClearBtn: {
    marginTop: 20,
    padding: "10px 20px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  captionSheetOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  captionSheet: {
    width: "100%",
    maxWidth: 600,
    maxHeight: "50vh",
    background: "#111",
    borderRadius: "18px 18px 0 0",
    padding: "12px 20px 32px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -4px 32px rgba(0,0,0,0.7)",
  },
  captionSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    background: "rgba(255,255,255,0.22)",
    alignSelf: "center",
    marginBottom: 14,
    flexShrink: 0,
  },
  captionSheetHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    flexShrink: 0,
  },
  captionSheetTitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  captionSheetClose: {
    background: "rgba(255,255,255,0.1)",
    border: "none",
    borderRadius: "50%",
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    cursor: "pointer",
    padding: 0,
  },
  captionSheetBody: {
    overflowY: "auto",
    flex: 1,
  },
  captionSheetText: {
    margin: 0,
    color: "var(--text-primary)",
    fontSize: 15,
    lineHeight: 1.6,
    fontWeight: 400,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  captionMetaChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 11px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
  },
  metaLine: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    color: "rgba(170,170,170,0.9)",
    fontSize: 13,
    fontWeight: 800,
    textShadow: "0 4px 18px rgba(0,0,0,0.98)",
  },
  feedbackButton: {
    marginTop: 16,
    width: "fit-content",
    minHeight: 38,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 999,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.16)",
    background: "rgba(193,18,31,0.82)",
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 0,
    cursor: "pointer",
    boxShadow: "0 14px 34px rgba(193,18,31,0.24), inset 0 1px 0 rgba(255,255,255,0.12)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    transition: "transform var(--motion-fast), background var(--motion-fast), box-shadow var(--motion-fast)",
    WebkitTapHighlightColor: "transparent",
  },
  actions: {
    position: "absolute",
    right: "max(10px, env(safe-area-inset-right))",
    bottom: "calc(90px + env(safe-area-inset-bottom))",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 4,
    paddingRight: 4,
    borderRadius: 999,
    background: "var(--glass)",
    border: "1px solid var(--line)",
    boxShadow: "var(--shadow-soft), inset 0 1px 0 rgba(255,255,255,0.08)",
    backdropFilter: "blur(22px) saturate(155%)",
    WebkitBackdropFilter: "blur(22px) saturate(155%)",
    animation: "fadeScale 220ms ease both",
    zIndex: 5,
  },
  actionItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    userSelect: "none",
    opacity: 0.88,
    transition: "transform var(--motion-fast), opacity var(--motion-fast), filter var(--motion-fast)",
  },
  actionItemLiked: {
    animation: "likePop 340ms ease",
    opacity: 1,
  },
  actionItemSaved: {
    animation: "likePop 340ms ease",
    opacity: 1,
  },
  actionCircle: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "transparent",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    backdropFilter: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
    boxShadow: "none",
    transition: "transform var(--motion-fast), background var(--motion-fast), border-color var(--motion-fast), box-shadow var(--motion-fast)",
  },
  actionCircleLiked: {
    background: "rgba(193, 18, 31, 0.12)",
    borderColor: "rgba(193,18,31,0.32)",
    boxShadow: "var(--shadow-glow-red)",
  },
  actionCircleSaved: {
    background: "rgba(212,175,55,0.12)",
    borderColor: "rgba(212,175,55,0.34)",
    boxShadow: "0 0 24px rgba(212,175,55,0.22)",
  },
  actionIcon: {
    color: "var(--text-primary)",
    fontSize: 0,
    fontWeight: 300,
    lineHeight: 1,
    textShadow: "0 2px 8px rgba(0,0,0,0.9)",
  },
  actionIconLiked: {
    color: "var(--primary-red)",
    transform: "scale(1.08)",
    textShadow: "0 0 22px rgba(193,18,31,0.75), 0 2px 8px rgba(0,0,0,0.9)",
  },
  actionIconSaved: {
    color: "var(--accent-gold)",
    transform: "scale(1.08)",
    textShadow: "0 0 20px rgba(212,175,55,0.45), 0 2px 8px rgba(0,0,0,0.9)",
  },
  actionSvg: {
    width: 20,
    height: 20,
    display: "block",
    color: "currentColor",
    filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.85))",
  },
  backArrowSvg: {
    width: 18,
    height: 18,
    display: "block",
  },
  soundToggleButton: {
    position: "fixed",
    top: "calc(62px + env(safe-area-inset-top))",
    right: "max(14px, env(safe-area-inset-right))",
    zIndex: 92,
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    transition: "transform var(--motion-fast), background var(--motion-fast)",
    WebkitTapHighlightColor: "transparent",
  },
  soundSvg: {
    width: 20,
    height: 20,
    display: "block",
  },
  actionText: {
    color: "var(--text-primary)",
    fontSize: 10,
    fontWeight: 700,
    textShadow: "0 2px 8px rgba(0,0,0,0.95)",
  },
  muteBtn: {
    position: "absolute",
    top: "calc(64px + env(safe-area-inset-top))",
    right: "max(14px, env(safe-area-inset-right))",
    background: "rgba(0,0,0,0.42)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 999,
    minWidth: 52,
    height: 30,
    color: "var(--text-primary)",
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  },
  playIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 10,
    pointerEvents: "none",
    animation: "fadeScale 220ms ease both",
  },
  bottomNav: {
    position: "fixed",
    bottom: "calc(6px + env(safe-area-inset-bottom))",
    left: "50%",
    width: "min(calc(100vw - 28px), 440px)",
    minHeight: 58,
    transform: "translateX(-50%)",
    background: "var(--glass)",
    border: "1px solid var(--line)",
    borderRadius: 24,
    boxShadow: "var(--shadow-soft), inset 0 1px 0 rgba(255,255,255,0.11)",
    backdropFilter: "blur(30px) saturate(165%)",
    WebkitBackdropFilter: "blur(30px) saturate(165%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    zIndex: 100,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
  },
  navItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    cursor: "pointer",
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 6,
    paddingRight: 6,
    minWidth: 43,
    minHeight: 44,
    borderRadius: 16,
    color: "rgba(255,255,255,0.62)",
    WebkitTapHighlightColor: "transparent",
    transition: "color var(--motion-fast), transform var(--motion-fast), background var(--motion-fast), opacity var(--motion-fast)",
  },
  navItemActive: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    cursor: "pointer",
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
    minWidth: 48,
    minHeight: 44,
    borderRadius: 16,
    color: "var(--text-primary)",
    background: "rgba(193,18,31,0.14)",
    boxShadow: "0 0 20px rgba(193,18,31,0.24), inset 0 0 0 1px rgba(193,18,31,0.2)",
    WebkitTapHighlightColor: "transparent",
    transition: "color var(--motion-fast), transform var(--motion-fast), background var(--motion-fast), box-shadow var(--motion-fast)",
  },
  navIcon: {
    fontSize: 20,
  },
  navSvg: {
    width: 20,
    height: 20,
    display: "block",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  navSvgActive: {
    width: 20,
    height: 20,
    display: "block",
    fill: "none",
    stroke: "#fff",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    filter: "drop-shadow(0 0 8px rgba(193,18,31,0.72))",
  },
  navIconWrap: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 24,
    minHeight: 24,
    color: "currentColor",
  },
  navBadge: {
    position: "absolute",
    top: -7,
    right: -9,
    minWidth: 16,
    height: 16,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 4,
    paddingRight: 4,
    borderRadius: 8,
    background: "var(--primary-red)",
    color: "var(--text-primary)",
    border: "1px solid rgba(0,0,0,0.9)",
    fontSize: 10,
    fontWeight: 700,
    lineHeight: "14px",
    textAlign: "center",
  },
  navIconActive: {
    fontSize: 21,
  },
  navLabel: {
    color: "currentColor",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 0,
  },
  navLabelActive: {
    color: "var(--text-primary)",
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: 0,
    textShadow: "0 0 12px rgba(193,18,31,0.65)",
  },
  navUpload: {
    width: 42,
    height: 42,
    background: "rgba(193,18,31,0.82)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 8px 22px rgba(193,18,31,0.24)",
    WebkitTapHighlightColor: "transparent",
    transition: "transform 180ms ease, box-shadow 180ms ease, background 180ms ease",
  },
  navUploadIcon: {
    color: "var(--text-primary)",
    fontSize: 22,
    fontWeight: 300,
  },
  navUploadSvg: {
    width: 21,
    height: 21,
    display: "block",
    fill: "none",
    stroke: "#fff",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.35))",
  },
  // Comments Modal Styles
  commentsModal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "flex-end",
  },
  commentsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.62)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
  },
  commentsContent: {
    background: "linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)",
    borderRadius: "22px 22px 0 0",
    width: "100%",
    maxHeight: "78vh",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    zIndex: 1001,
    borderTop: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "0 -24px 70px rgba(0,0,0,0.65)",
  },
  commentsHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    background: "rgba(255,255,255,0.18)",
    alignSelf: "center",
    margin: "10px auto 0",
    flexShrink: 0,
  },
  commentsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 20,
    paddingRight: 20,
    borderBottom: "1px solid rgba(255,255,255,0.055)",
  },
  commentsTitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: 800,
    margin: 0,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  commentsClose: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "50%",
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.65)",
    cursor: "pointer",
    padding: 0,
  },
  commentsList: {
    flex: 1,
    overflowY: "auto",
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 20,
    paddingRight: 20,
    maxHeight: "min(460px, 54vh)",
  },
  noComments: {
    textAlign: "center",
    color: "#AAAAAA",
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 14,
    lineHeight: 1.5,
  },
  commentItem: {
    display: "flex",
    gap: 12,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 0,
    paddingRight: 0,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  commentAvatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(212,175,55,0.32)",
    background: "linear-gradient(145deg, #C1121F, #520711)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-primary)",
    fontSize: 14,
    fontWeight: 950,
    flexShrink: 0,
    overflow: "hidden",
    cursor: "pointer",
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  commentAvatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    border: "none",
    background: "transparent",
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    color: "var(--text-primary)",
    fontSize: 14,
    fontWeight: 900,
    marginBottom: 4,
    cursor: "pointer",
    textAlign: "left",
  },
  commentText: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 1.4,
  },
  replyItem: {
    display: "flex",
    gap: 10,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 0,
    borderLeft: "2px solid rgba(212,175,55,0.18)",
    marginLeft: 12,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 11,
    fontWeight: 900,
    flexShrink: 0,
    overflow: "hidden",
    cursor: "pointer",
    padding: 0,
  },
  replyBtn: {
    marginTop: 4,
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
  },
  repliesSection: {
    marginLeft: 50,
    marginBottom: 4,
  },
  toggleReplies: {
    background: "none",
    border: "none",
    color: GOLD,
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    padding: "4px 0 8px",
    display: "block",
  },
  commentInput: {
    display: "flex",
    flexDirection: "column",
    paddingTop: 12,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
    borderTop: "1px solid rgba(212,175,55,0.16)",
    gap: 8,
  },
  commentInputRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  replyPill: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 10px",
    borderRadius: 999,
    background: "rgba(212,175,55,0.1)",
    border: "1px solid rgba(212,175,55,0.25)",
    alignSelf: "flex-start",
  },
  replyPillText: {
    fontSize: 12,
    color: GOLD,
    fontWeight: 700,
  },
  replyPillClose: {
    background: "none",
    border: "none",
    color: GOLD,
    fontSize: 11,
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
  },
  commentInputField: {
    flex: 1,
    paddingTop: 11,
    paddingBottom: 11,
    paddingLeft: 14,
    paddingRight: 14,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.09)",
    background: "rgba(255,255,255,0.06)",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
  },
  commentSendBtn: {
    paddingTop: 11,
    paddingBottom: 11,
    paddingLeft: 18,
    paddingRight: 18,
    borderRadius: 999,
    border: "none",
    background: RED,
    color: "#fff",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(193,18,31,0.35)",
  },
  commentSendBtnDisabled: {
    background: "#333",
    cursor: "not-allowed",
  },
  feedbackModal: {
    position: "fixed",
    inset: 0,
    zIndex: 1200,
    display: "flex",
    alignItems: "flex-end",
  },
  feedbackOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.62)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
  },
  feedbackSheet: {
    position: "relative",
    zIndex: 1201,
    width: "100%",
    maxHeight: "76vh",
    overflow: "hidden",
    borderRadius: "26px 26px 0 0",
    borderTop: "1px solid rgba(255,255,255,0.12)",
    background: "linear-gradient(145deg, rgba(193,18,31,0.14), rgba(11,11,11,0.98) 36%, rgba(212,175,55,0.07))",
    boxShadow: "0 -24px 80px rgba(0,0,0,0.58)",
    color: "var(--text-primary)",
  },
  feedbackHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    background: "rgba(255,255,255,0.24)",
    margin: "10px auto 2px",
  },
  feedbackHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    paddingTop: 18,
    paddingRight: 20,
    paddingBottom: 14,
    paddingLeft: 20,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  feedbackKicker: {
    margin: 0,
    color: "var(--accent-gold)",
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  feedbackTitle: {
    margin: "5px 0 0",
    color: "var(--text-primary)",
    fontSize: 24,
    lineHeight: 1,
    fontWeight: 1000,
    letterSpacing: 0,
  },
  feedbackSubtitle: {
    margin: "8px 0 0",
    color: "var(--text-secondary)",
    fontSize: 13,
    fontWeight: 750,
  },
  feedbackClose: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    lineHeight: 1,
  },
  feedbackBody: {
    maxHeight: "calc(76vh - 112px)",
    overflowY: "auto",
    paddingTop: 18,
    paddingRight: 20,
    paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
    paddingLeft: 20,
  },
  feedbackLoading: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "var(--text-secondary)",
    fontSize: 14,
    fontWeight: 750,
  },
  feedbackSpinner: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    borderTop: "2px solid var(--primary-red)",
    borderRight: "2px solid rgba(255,255,255,0.18)",
    borderBottom: "2px solid rgba(255,255,255,0.18)",
    borderLeft: "2px solid rgba(255,255,255,0.18)",
    animation: "spin 1s linear infinite",
  },
  feedbackError: {
    color: "#ff8b8b",
    background: "rgba(193,18,31,0.12)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(193,18,31,0.26)",
    borderRadius: 14,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 14,
    paddingRight: 14,
    fontSize: 14,
    lineHeight: 1.5,
  },
  feedbackSaved: {
    marginBottom: 14,
    color: "var(--accent-gold)",
    background: "rgba(212,175,55,0.1)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(212,175,55,0.22)",
    borderRadius: 14,
    paddingTop: 11,
    paddingBottom: 11,
    paddingLeft: 13,
    paddingRight: 13,
    fontSize: 13,
    fontWeight: 900,
  },
  feedbackResult: {
    margin: 0,
    whiteSpace: "pre-wrap",
    color: "var(--text-primary)",
    fontFamily: "inherit",
    fontSize: 14,
    lineHeight: 1.62,
  },
  xpCard: {
    marginBottom: 16,
    padding: "14px 15px",
    borderRadius: 16,
    background: "rgba(212,175,55,0.07)",
    border: "1px solid rgba(212,175,55,0.2)",
    animation: "fadeUp 280ms ease forwards",
  },
  xpCardTitle: {
    margin: "0 0 10px",
    fontSize: 9,
    fontWeight: 900,
    color: GOLD,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  xpCardRows: {
    display: "grid",
    gap: 5,
    marginBottom: 12,
  },
  xpCardRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  xpCardRowTotal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    marginTop: 5,
    paddingTop: 7,
  },
  xpCardLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: 600,
  },
  xpCardVal: {
    fontSize: 13,
    fontWeight: 900,
    color: "#ccc",
  },
  xpCardTotalLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#fff",
  },
  xpCardTotalVal: {
    fontSize: 18,
    fontWeight: 1000,
    color: GOLD,
  },
  xpCapNotice: {
    margin: "5px 0 0",
    fontSize: 10,
    color: "#FB923C",
    fontWeight: 700,
  },
  xpRankWrap: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: 11,
  },
  xpRankRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  xpTotalLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: 700,
  },
  xpRankTrack: {
    height: 5,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginBottom: 5,
  },
  xpRankFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 700ms ease",
  },
  xpNextLabel: {
    margin: 0,
    fontSize: 10,
    color: "#888",
    textAlign: "right",
  },
  // AI Metrics Overlay
  metricsOverlay: {
    position: "absolute",
    top: "calc(124px + env(safe-area-inset-top))",
    left: "max(18px, env(safe-area-inset-left))",
    right: "calc(96px + env(safe-area-inset-right))",
    zIndex: 4,
    animation: "fadeUp 420ms ease both",
    pointerEvents: "none",
  },
  metricsRow: {
    width: "fit-content",
    maxWidth: "min(300px, calc(100vw - 132px))",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
    padding: 10,
    borderRadius: 18,
    background: "linear-gradient(145deg, rgba(8,8,8,0.62), rgba(22,18,16,0.42))",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(18px) saturate(150%)",
    WebkitBackdropFilter: "blur(18px) saturate(150%)",
    boxShadow: "0 18px 46px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
  },
  metricItem: {
    minWidth: 0,
    display: "grid",
    gap: 5,
    minHeight: 48,
    padding: "8px 10px",
    borderRadius: 13,
    background: "rgba(255,255,255,0.075)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: 900,
    color: "rgba(255,255,255,0.62)",
    letterSpacing: 0,
    textShadow: "0 1px 4px rgba(0,0,0,0.8)",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  metricValue: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 15,
    lineHeight: 1.05,
    fontWeight: 1000,
    color: "var(--text-primary)",
    textShadow: "0 2px 8px rgba(0,0,0,0.9)",
  },
  // Creator Info and Stats
  creatorInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  creatorStats: {
    fontSize: 12,
    lineHeight: 1.25,
    fontWeight: 800,
    color: "rgba(255,255,255,0.74)",
    textShadow: "0 2px 8px rgba(0,0,0,0.9)",
  },
  metricsChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 5,
    marginBottom: 8,
  },
  metricChip: {
    display: "inline-flex",
    alignItems: "center",
    height: 20,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 999,
    background: "rgba(0,0,0,0.55)",
    border: "1px solid rgba(255,255,255,0.18)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    color: "rgba(255,255,255,0.88)",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0,
    whiteSpace: "nowrap",
    textShadow: "0 1px 4px rgba(0,0,0,0.8)",
  },
  reelBadgeRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 6,
  },
  reelBadge: {
    fontSize: 10,
    fontWeight: 900,
    borderRadius: 999,
    border: "1px solid",
    padding: "3px 8px",
    letterSpacing: 0.4,
  },
  reelCategoryBadge: {
    fontSize: 10,
    fontWeight: 900,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "3px 8px",
    color: "rgba(255,255,255,0.6)",
    background: "rgba(255,255,255,0.07)",
    letterSpacing: 0.4,
  },
  trainButtonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  tryThisButton: {
    width: "fit-content",
    maxWidth: "100%",
    minHeight: 26,
    marginTop: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 999,
    border: "1px solid rgba(193,18,31,0.4)",
    background: "rgba(0,0,0,0.38)",
    color: "rgba(255,100,100,0.88)",
    fontFamily: "inherit",
    fontSize: 10,
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: 0.5,
    cursor: "pointer",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    boxShadow: "none",
    textShadow: "none",
    transition: "transform 180ms ease, background 180ms ease",
    WebkitTapHighlightColor: "transparent",
  },
  beatScoreButton: {
    width: "fit-content",
    maxWidth: "100%",
    minHeight: 34,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 14,
    paddingRight: 14,
    borderRadius: 999,
    border: "1px solid rgba(96,165,250,0.45)",
    background: "rgba(96,165,250,0.12)",
    color: "#93C5FD",
    fontFamily: "inherit",
    fontSize: 13,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 0,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  learnButton: {
    width: "fit-content",
    maxWidth: "100%",
    minHeight: 34,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 14,
    paddingRight: 14,
    borderRadius: 999,
    border: "1px solid rgba(212,175,55,0.42)",
    background: "rgba(212,175,55,0.12)",
    color: GOLD,
    fontFamily: "inherit",
    fontSize: 13,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: 0,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  remixBanner: {
    fontSize: 11,
    color: PURPLE,
    marginTop: 4,
    opacity: 0.85,
  },
  gymTagBanner: {
    fontSize: 11,
    color: GOLD,
    marginTop: 4,
    opacity: 0.9,
  },
  pvpSourceBanner: {
    position: "absolute",
    top: "calc(68px + env(safe-area-inset-top))",
    left: "max(12px, env(safe-area-inset-left))",
    zIndex: 6,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(96,165,250,0.18)",
    border: "1px solid rgba(96,165,250,0.4)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  pvpSourceIcon: {
    fontSize: 14,
    lineHeight: 1,
  },
  pvpSourceText: {
    color: "#93C5FD",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  profileProgressCard: {
    position: "absolute",
    top: "calc(68px + env(safe-area-inset-top))",
    left: "max(12px, env(safe-area-inset-left))",
    zIndex: 6,
    borderRadius: 14,
    background: "rgba(0,0,0,0.58)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(14px) saturate(140%)",
    WebkitBackdropFilter: "blur(14px) saturate(140%)",
    padding: "8px 12px",
    display: "grid",
    gap: 6,
    minWidth: 160,
    maxWidth: 210,
    pointerEvents: "none",
  },
  profileProgressTitle: {
    color: GOLD,
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  profileProgressEmpty: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.3,
  },
  profileProgressStats: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  profileProgressStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 1,
  },
  profileProgressStatVal: {
    color: "#fff",
    fontSize: 17,
    fontWeight: 1000,
    lineHeight: 1,
  },
  profileProgressStatLbl: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  profileProgressDivider: {
    width: 1,
    height: 24,
    background: "rgba(255,255,255,0.14)",
    flexShrink: 0,
  },
};
