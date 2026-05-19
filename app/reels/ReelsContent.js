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
import { RED, GOLD, PURPLE, redAlpha, goldAlpha } from "@/lib/tokens";
import {
  DEMO_REEL,
  getSafeLikeCount,
  getSafeViewCount,
  getCreatedAtMs,
  sortReelsByEngagement,
  getCreatorName,
  getCreatorPhoto,
  cleanCaption,
  extractFeedbackScore,
} from "@/lib/reelHelpers";
import {
  BackArrowIcon,
  SpeakerIcon,
} from "@/components/reels/ReelIcons";
import CommentsModal from "@/components/reels/CommentsModal";
import FeedbackModal from "@/components/reels/FeedbackModal";
import FilterSheet from "@/components/reels/FilterSheet";
import CaptionSheet from "@/components/reels/CaptionSheet";
import ReelItem from "@/components/reels/ReelItem";
import { useReelFeed } from "@/hooks/useReelFeed";
import styles from "@/components/reels/reelStyles";

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
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showControls, setShowControls] = useState(false);
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
  const [captionSheetReelId, setCaptionSheetReelId] = useState(null);
  const [breakdownReel, setBreakdownReel] = useState(null);
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
  const commentProfileRequests = useRef(new Set());
  const lastScrolledReelId = useRef(null);
  const {
    allReels, setAllReels,
    reelsLoading,
    userLikes, setUserLikes,
    userViews, setUserViews,
    followingIds,
    savedReels, setSavedReels,
    creatorProfiles,
    creatorStats,
    gymNames,
    featuredCreatorIds,
    userTrainingProfile,
    profileReelProgress,
  } = useReelFeed({ user, authLoading, isProfileSource, profileSourceUserId, currentReelId: reels[currentIndex]?.id || null });

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
              background: `${goldAlpha(0.15)}`,
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
          const creatorStatLine = stats
            ? [
                stats.rank ? t(stats.rank.key) : null,
                typeof stats.xp === "number" ? `${stats.xp.toLocaleString()} ${t("reels.xp")}` : null,
                hasBestScore ? `${t("reels.bestScore")} ${stats.bestScore.toFixed(1)}/10` : null,
              ].filter(Boolean).join(" · ")
            : "";
          const hasStory = !!(creatorProfile?.storyActive || creatorProfile?.hasActiveStory);
          return (
            <ReelItem
              key={reel.id}
              reel={reel}
              index={index}
              currentIndex={currentIndex}
              reelItemRefs={reelItemRefs}
              videoRefs={videoRefs}
              soundEnabled={soundEnabled}
              hasVideoError={!!videoErrors[reel.id]}
              isVideoLoading={!!videoLoading[reel.id]}
              videoProgress={videoProgress}
              isLiked={userLikes.has(reel.id)}
              isSaved={savedReels.has(reel.id)}
              heartBursts={heartBursts.filter((b) => b.reelId === reel.id)}
              showControls={showControls}
              isPvpSource={isPvpSource}
              isProfileSource={isProfileSource}
              profileReelProgress={profileReelProgress}
              creatorName={creatorName}
              creatorPhoto={creatorPhoto}
              creatorInitial={creatorInitial}
              creatorStreakCount={creatorProfile?.streakCount || 0}
              captionText={captionText}
              creatorStatLine={creatorStatLine}
              hasStory={hasStory}
              stats={stats}
              gymName={reel.gymId ? gymNames[reel.gymId] : null}
              currentLocale={currentLocale}
              t={t}
              router={router}
              setVideoProgress={setVideoProgress}
              onVideoClick={handleVideoClick}
              onVideoLoadStart={handleVideoLoadStart}
              onVideoLoaded={handleVideoLoaded}
              onVideoError={handleVideoError}
              onLike={handleLike}
              onOpenComments={handleOpenComments}
              onShare={handleShare}
              onSave={handleSave}
              onGetFeedback={handleGetFeedback}
              onBreakdown={setBreakdownReel}
              onCaptionSheet={setCaptionSheetReelId}
            />
          );
        })}
      </div>

      {/* Comments Modal */}
      <CommentsModal
        showComments={showComments}
        comments={comments}
        commentProfiles={commentProfiles}
        newComment={newComment}
        setNewComment={setNewComment}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        expandedReplies={expandedReplies}
        setExpandedReplies={setExpandedReplies}
        user={user}
        currentLocale={currentLocale}
        t={t}
        router={router}
        onClose={handleCloseComments}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
      />

      <FeedbackModal
        feedbackOpen={feedbackOpen}
        feedbackLoading={feedbackLoading}
        feedbackError={feedbackError}
        feedbackResult={feedbackResult}
        feedbackSaved={feedbackSaved}
        sessionXPData={sessionXPData}
        feedbackReel={feedbackReel}
        t={t}
        onClose={handleCloseFeedback}
      />

      <CaptionSheet
        captionSheetReelId={captionSheetReelId}
        reels={reels}
        setCaptionSheetReelId={setCaptionSheetReelId}
        t={t}
        currentLocale={currentLocale}
      />

      <button
        type="button"
        style={styles.soundToggleButton}
        onClick={toggleMute}
        aria-label={soundEnabled ? t("soundOn") : t("tapForSound")}
        title={soundEnabled ? t("soundOn") : t("tapForSound")}
      >
        <SpeakerIcon muted={!soundEnabled} />
      </button>

      <FilterSheet
        showFilterSheet={showFilterSheet}
        diffFilter={diffFilter}
        ctFilter={ctFilter}
        setDiffFilter={setDiffFilter}
        setCtFilter={setCtFilter}
        setShowFilterSheet={setShowFilterSheet}
        currentLocale={currentLocale}
        t={t}
      />
      <BottomNav
        router={router}
        user={user}
        currentLocale={currentLocale}
        onInteractStart={clearControlsTimer}
        onInteractEnd={scheduleControlsHide}
      />    </div>
  );
}
