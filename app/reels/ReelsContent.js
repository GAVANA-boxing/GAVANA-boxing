"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { createNotification } from "@/lib/notifications";
import { getLocaleFromPathname, translate } from "@/lib/i18n";

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
  if (locale === "mn") return expanded ? "хураах" : "дэлгэрэнгүй";
  if (locale === "ko") return expanded ? "접기" : "더보기";
  return expanded ? "less" : "more";
}

export default function ReelsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = getLocaleFromPathname(pathname);
  const t = (key) => translate(currentLocale, key);
  const { user, loading: authLoading } = useAuth();
  const [feedMode, setFeedMode] = useState("forYou");
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
  const [expandedCaptionIds, setExpandedCaptionIds] = useState(new Set());
  const [videoLoading, setVideoLoading] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [selectedReelId, setSelectedReelId] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackResult, setFeedbackResult] = useState("");
  const [feedbackReel, setFeedbackReel] = useState(null);
  const [videoErrors, setVideoErrors] = useState({});
  const videoRefs = useRef({});
  const viewTimers = useRef({});
  const controlsTimer = useRef(null);
  const commentsUnsubscribeRef = useRef(null);
  const creatorProfileRequests = useRef(new Set());

  useEffect(() => {
    if (authLoading || allReels === null) {
      setReels([]);
      return;
    }

    if (feedMode !== "following") {
      setReels(allReels.length > 0 ? allReels : [DEMO_REEL]);
      setCurrentIndex(0);
      return;
    }

    const followedReels = allReels.filter((reel) => reel.userId && followingIds.has(reel.userId));
    setReels(followedReels);
    setCurrentIndex(0);
  }, [allReels, authLoading, feedMode, followingIds]);

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
          
          setAllReels(sortReelsByEngagement(reelsData));
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

  useEffect(() => {
    if (authLoading || !user?.uid) {
      setFollowingIds(new Set());
      return;
    }

    let unsubscribe;
    let isActive = true;

    async function listenForFollowing() {
      try {
        const { db } = await getFirebase();
        const { collection, query, where, onSnapshot } = await import("firebase/firestore");
        if (!isActive) return;

        const followingQuery = query(
          collection(db, "follows"),
          where("followerId", "==", user.uid)
        );

        unsubscribe = onSnapshot(followingQuery, (snapshot) => {
          if (!isActive) return;

          const nextFollowing = new Set();
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.followingId) {
              nextFollowing.add(data.followingId);
            }
          });
          setFollowingIds(nextFollowing);
        }, (err) => {
          if (!isActive) return;
          console.error("Failed to listen for following:", err);
          setFollowingIds(new Set());
        });
      } catch (err) {
        if (!isActive) return;
        console.error("Failed to load following:", err);
        setFollowingIds(new Set());
      }
    }

    listenForFollowing();

    return () => {
      isActive = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [authLoading, user?.uid]);

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

  // Fetch user's views
  useEffect(() => {
    if (authLoading || !user?.uid) {
      setUserViews(new Set());
      return;
    }

    let isActive = true;

    async function loadUserViews() {
      try {
        const { db } = await getFirebase();
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        if (!isActive) return;
        
        const viewsSnapshot = await getDocs(query(
          collection(db, "reel_views"),
          where("userId", "==", user.uid)
        ));
        const viewsSet = new Set();
        
        viewsSnapshot.forEach((doc) => {
          const data = doc.data();
          viewsSet.add(data.reelId);
        });
        
        if (isActive) {
          setUserViews(viewsSet);
        }
      } catch (err) {
        console.error("Failed to load views:", err);
      }
    }
    
    loadUserViews();

    return () => {
      isActive = false;
    };
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
        const { collection, addDoc, doc, updateDoc, increment, serverTimestamp } = await import("firebase/firestore");
        
        // Record view in reel_views collection
        await addDoc(collection(db, "reel_views"), {
          reelId: currentReel.id,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
        
        // Increment views count on reel
        const reelRef = doc(db, "reels", currentReel.id);
        await updateDoc(reelRef, {
          views: increment(1)
        });
        
        // Update local state
        setUserViews(prev => {
          const newViews = new Set(prev);
          newViews.add(currentReel.id);
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

    if (!soundEnabled) {
      enableSound();
      return;
    }

    if (showControls) {
      togglePlay();
    }
  }, [enableSound, revealControls, showControls, soundEnabled, togglePlay]);

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
      const { doc, setDoc, deleteDoc, serverTimestamp } = await import("firebase/firestore");
      const saveRef = doc(db, "saved_reels", `${user.uid}_${reelId}`);

      if (wasSaved) {
        await deleteDoc(saveRef);
      } else {
        await setDoc(saveRef, {
          userId: user.uid,
          reelId,
          createdAt: serverTimestamp(),
        });
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

  const handleGetFeedback = useCallback(async (reel) => {
    if (!user?.uid) {
      router.push(`/${currentLocale}/login`);
      return;
    }

    setFeedbackOpen(true);
    setFeedbackLoading(true);
    setFeedbackError("");
    setFeedbackResult("");
    setFeedbackReel(reel);

    try {
      const caption = reel?.description || reel?.caption || "No caption provided";
      const username = reel?.username || "fighter";
      const likes = getSafeLikeCount(reel);
      const views = getSafeViewCount(reel);
      const context = [
        `Username: @${username}`,
        `Caption: ${caption}`,
        `Likes: ${likes}`,
        `Views: ${views}`,
      ].join("\n");

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
                "Return exactly this structure:",
                "Score: a realistic score like 6.5/10.",
                "Strength: one specific strength or positive signal based on the caption/context.",
                "Improve: one practical thing to watch or refine next time.",
                "Next drill: one simple boxing drill with a clear rep/time target.",
              ].join("\n"),
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Feedback request failed");
      }

      const data = await response.json();
      const text = data?.content?.find((item) => item?.type === "text")?.text || data?.content?.[0]?.text || "";

      if (!text.trim()) {
        throw new Error("Empty feedback response");
      }

      setFeedbackResult(text.trim());
    } catch (err) {
      console.error("Failed to generate AI feedback:", err);
      setFeedbackError("Could not generate feedback. Please try again.");
    } finally {
      setFeedbackLoading(false);
    }
  }, [currentLocale, router, user?.uid]);

  const handleCloseFeedback = useCallback(() => {
    setFeedbackOpen(false);
    setFeedbackLoading(false);
    setFeedbackError("");
    setFeedbackResult("");
    setFeedbackReel(null);
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
        username: user.email.split("@")[0],
        text: newComment.trim(),
        createdAt: serverTimestamp()
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
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  }, [user, newComment, selectedReelId, reels]);

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
  }, []);

  useEffect(() => {
    return () => {
      if (commentsUnsubscribeRef.current) {
        commentsUnsubscribeRef.current();
        commentsUnsubscribeRef.current = null;
      }
    };
  }, []);

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
          <div style={styles.loadingTitle}>Loading reels...</div>
          <div style={styles.loadingMeta}>
            {authLoading ? "Checking your session" : "Fetching the fight feed"}
          </div>
        </div>
        <BottomNav router={router} user={user} currentLocale={currentLocale} />
      </div>
    );
  }

  if (reels.length === 0 && feedMode !== "following") {
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
      </div>
      {/* Reels Feed */}
      <div style={styles.feed} className="reels-feed" onScroll={handleScroll}>
        {reels.length === 0 ? (
          <div style={{...styles.videoContainer, ...styles.followingEmpty}}>
            <div style={styles.followingEmptyTitle}>{t("noReelsYet")}</div>
            <div style={styles.followingEmptyText}>
              Follow fighters from their profile to build your training feed.
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
          const captionText = reel.description || reel.caption || "";
          const isCaptionExpanded = expandedCaptionIds.has(reel.id);
          const canExpandCaption = captionText.length > 90;
          const openCreatorProfile = () => {
            if (reel.userId) {
              router.push(`/${currentLocale}/profile/${reel.userId}`);
            }
          };

          return (
          <div
            key={reel.id}
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
                onClick={handleVideoTap}
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
                preload={index === currentIndex || index <= 1 ? "auto" : "metadata"}
              />
            )}

            {!reel.isDemo && !videoErrors[reel.id] && videoLoading[reel.id] && (
              <div style={styles.videoLoadingOverlay}>
                <div style={styles.spinner}></div>
                <span style={styles.videoLoadingText}>Loading reel...</span>
              </div>
            )}

            <div style={styles.vignette} />
            <div style={styles.bottomGradient} />

            <div style={styles.info}>
              <div style={styles.creatorRow}>
                <button
                  type="button"
                  style={{
                    ...styles.creatorAvatarButton,
                    cursor: reel.userId ? "pointer" : "default",
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
                <button
                  type="button"
                  style={{
                    ...styles.username,
                    cursor: reel.userId ? "pointer" : "default",
                  }}
                  onClick={openCreatorProfile}
                >
                  @{creatorName}
                </button>
              </div>
              {captionText && (
                <button
                  type="button"
                  style={{
                    ...styles.descriptionButton,
                    ...(isCaptionExpanded ? styles.descriptionExpanded : {})
                  }}
                  onClick={() => {
                    if (canExpandCaption) {
                      toggleCaption(reel.id);
                    }
                  }}
                >
                  <span>{captionText}</span>
                  {canExpandCaption && (
                    <span style={styles.captionToggle}>
                      {getCaptionToggleLabel(currentLocale, isCaptionExpanded)}
                    </span>
                  )}
                </button>
              )}
              <div style={styles.metaLine}>
                <span>{formatCompactCount(getSafeViewCount(reel))} {t("views")}</span>
                <span>{formatDate(reel.createdAt)}</span>
              </div>
              <button
                type="button"
                style={styles.feedbackButton}
                onClick={(event) => {
                  event.stopPropagation();
                  handleGetFeedback(reel);
                }}
              >
                {t("getAiFeedback")}
              </button>
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
              <div className="reel-action" style={styles.actionItem} onClick={() => handleOpenComments(reel.id)}>
                <div className="reel-action-circle" style={styles.actionCircle}>
                  <CommentIcon />
                </div>
                <span style={styles.actionText}>{formatCompactCount(getSafeCommentsCount(reel))}</span>
              </div>
              <div className="reel-action" style={styles.actionItem}>
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
                <span style={styles.actionText}>{savedReels.has(reel.id) ? t("saved") : t("save")}</span>
              </div>
              <div className="reel-action" style={styles.actionItem}>
                <div className="reel-action-circle" style={styles.actionCircle}>
                  <ViewIcon />
                </div>
                <span style={styles.actionText}>{formatCompactCount(getSafeViewCount(reel))}</span>
              </div>
            </div>
            {/* Mute button */}
            {!reel.isDemo && showControls && (
              <button style={styles.muteBtn} onClick={toggleMute}>
                {soundEnabled ? "Sound on" : "Tap for sound"}
              </button>
            )}

            {/* Play/Pause indicator */}
            {!reel.isDemo && showControls && index === currentIndex && (
              <div style={styles.playIndicator}>
                {videoRefs.current[reel.id]?.paused ? "Play" : ""}
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
            <div style={styles.commentsHeader}>
              <h3 style={styles.commentsTitle}>{t("comment")}</h3>
              <button style={styles.commentsClose} onClick={handleCloseComments}>x</button>
            </div>

            <div style={styles.commentsList}>
              {comments.length === 0 ? (
                <div style={styles.noComments}>
                  {currentLocale === "ko"
                    ? "아직 댓글이 없습니다. 첫 댓글을 남겨보세요!"
                    : currentLocale === "mn"
                      ? "Одоогоор сэтгэгдэл алга. Эхний сэтгэгдлийг бичээрэй!"
                      : "No comments yet. Be the first to comment!"}
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} style={styles.commentItem}>
                    <div style={styles.commentAvatar}>
                      {comment.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div style={styles.commentContent}>
                      <div 
                        style={{...styles.commentUsername, cursor: "pointer"}}
                        onClick={() => {
                          router.push(`/${currentLocale}/profile/${comment.userId}`);
                        }}
                      >
                        @{comment.username}
                      </div>
                      <div style={styles.commentText}>{comment.text}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {user && (
              <div style={styles.commentInput}>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={currentLocale === "ko" ? "댓글 추가..." : currentLocale === "mn" ? "Сэтгэгдэл нэмэх..." : "Add a comment..."}
                  style={styles.commentInputField}
                  onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  style={{
                    ...styles.commentSendBtn,
                    ...(newComment.trim() ? {} : styles.commentSendBtnDisabled)
                  }}
                >
                  {currentLocale === "ko" ? "보내기" : currentLocale === "mn" ? "Илгээх" : "Send"}
                </button>
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
              <button style={styles.feedbackClose} onClick={handleCloseFeedback}>x</button>
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
                <pre style={styles.feedbackResult}>{feedbackResult}</pre>
              )}
            </div>
          </div>
        </div>
      )}

      {showControls && (
        <BottomNav
          router={router}
          user={user}
          currentLocale={currentLocale}
          onInteractStart={clearControlsTimer}
          onInteractEnd={scheduleControlsHide}
        />
      )}
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

// Bottom Nav component
function BottomNav({ router, user, currentLocale, onInteractStart, onInteractEnd }) {
  const t = (key) => translate(currentLocale, key);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    let unsubscribe;
    let isActive = true;

    async function listenForUnreadNotifications() {
      try {
        const { collection, query, where, onSnapshot } = await import("firebase/firestore");
        const { db } = await getFirebase();
        if (!isActive) return;
        const unreadQuery = query(
          collection(db, "notifications"),
          where("recipientId", "==", user.uid),
          where("read", "==", false)
        );

        unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
          if (isActive) {
            setUnreadCount(snapshot.size);
          }
        }, (err) => {
          if (isActive) {
            console.error("Failed to listen for unread notifications:", err);
            setUnreadCount(0);
          }
        });
      } catch (err) {
        if (isActive) {
          console.error("Failed to load unread notifications:", err);
          setUnreadCount(0);
        }
      }
    }

    listenForUnreadNotifications();

    return () => {
      isActive = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]);
  
  return (
    <div
      style={styles.bottomNav}
      onPointerEnter={onInteractStart}
      onPointerDown={onInteractStart}
      onPointerLeave={onInteractEnd}
      onPointerUp={onInteractEnd}
      onPointerCancel={onInteractEnd}
    >
      <div style={styles.navItem} onClick={() => router.push(`/${currentLocale}`)}>
        <NavHomeIcon />
        <span style={styles.navLabel}>{t("home")}</span>
      </div>
      <div style={styles.navItemActive}>
        <NavReelsIcon active />
        <span style={styles.navLabelActive}>{t("reels")}</span>
      </div>
      <div style={styles.navItem} onClick={() => router.push(`/${currentLocale}/coach`)}>
        <NavCoachIcon />
        <span style={styles.navLabel}>{t("aiCoach")}</span>
      </div>
      <div style={styles.navItem} onClick={() => router.push(`/${currentLocale}/notifications`)}>
        <span style={styles.navIconWrap}>
          <NavBellIcon />
          {unreadCount > 0 && (
            <span style={styles.navBadge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
          )}
        </span>
        <span style={styles.navLabel}>{t("alerts")}</span>
      </div>
      <div style={styles.navUpload} onClick={() => router.push(`/${currentLocale}/upload`)}>
        <NavPlusIcon />
      </div>
      <div style={styles.navItem} onClick={() => {
        if (user?.uid) {
          router.push(`/${currentLocale}/profile/${user.uid}`);
        } else {
          router.push(`/${currentLocale}/login`);
        }
      }}>
        <NavProfileIcon />
        <span style={styles.navLabel}>{t("profile")}</span>
      </div>
    </div>
  );
}

function NavSvg({ children, active = false }) {
  return (
    <svg style={active ? styles.navSvgActive : styles.navSvg} viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

function NavHomeIcon() {
  return (
    <NavSvg>
      <path d="M4 10.8 12 4l8 6.8v8.7h-5.1v-5.2H9.1v5.2H4v-8.7Z" />
    </NavSvg>
  );
}

function NavReelsIcon({ active }) {
  return (
    <NavSvg active={active}>
      <rect x="5" y="4" width="14" height="16" rx="3" />
      <path d="m11 9 4 3-4 3V9Z" />
    </NavSvg>
  );
}

function NavCoachIcon() {
  return (
    <NavSvg>
      <path d="M7.2 8.2h9.6a3.8 3.8 0 0 1 3.8 3.8v1.2a3.8 3.8 0 0 1-3.8 3.8H8.6L4 20v-8a3.8 3.8 0 0 1 3.2-3.8Z" />
      <path d="M9 12h.1M15 12h.1" />
    </NavSvg>
  );
}

function NavBellIcon() {
  return (
    <NavSvg>
      <path d="M18 10.8V9a6 6 0 0 0-12 0v1.8c0 2.8-1.4 3.7-2.2 4.7h16.4c-.8-1-2.2-1.9-2.2-4.7Z" />
      <path d="M9.7 18.7a2.5 2.5 0 0 0 4.6 0" />
    </NavSvg>
  );
}

function NavPlusIcon() {
  return (
    <svg style={styles.navUploadSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function NavProfileIcon() {
  return (
    <NavSvg>
      <circle cx="12" cy="8.3" r="3.3" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </NavSvg>
  );
}

const styles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
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
    border: "3px solid rgba(255,255,255,0.3)",
    borderTopColor: "var(--primary-red)",
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
    padding: "12px var(--space-6)",
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
  feedTabs: {
    position: "fixed",
    top: "calc(14px + env(safe-area-inset-top))",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 80,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 4,
    borderRadius: 999,
    background: "var(--glass)",
    border: "1px solid var(--line)",
    backdropFilter: "blur(18px) saturate(150%)",
    WebkitBackdropFilter: "blur(18px) saturate(150%)",
    boxShadow: "var(--shadow-soft)",
  },
  feedTab: {
    border: "none",
    borderRadius: 999,
    background: "transparent",
    color: "rgba(255,255,255,0.66)",
    minHeight: 34,
    padding: "0 14px",
    fontSize: 13,
    fontWeight: 850,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  feedTabActive: {
    background: "rgba(193,18,31,0.82)",
    color: "var(--text-primary)",
    boxShadow: "var(--shadow-glow-red)",
  },
  feed: {
    height: "100vh",
    overflowY: "scroll",
    scrollSnapType: "y mandatory",
    scrollBehavior: "smooth",
    paddingBottom: 0,
  },
  videoContainer: {
    position: "relative",
    width: "100vw",
    height: "100vh",
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
    padding: "0 var(--space-6)",
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
    padding: "20px 18px calc(86px + env(safe-area-inset-bottom))",
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
  info: {
    position: "absolute",
    left: "max(18px, env(safe-area-inset-left))",
    right: 96,
    bottom: "calc(134px + env(safe-area-inset-bottom))",
    maxWidth: 520,
    animation: "fadeUp 420ms ease both",
    zIndex: 4,
  },
  creatorRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
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
    padding: 0,
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
    padding: 0,
    border: "none",
    background: "transparent",
    color: "var(--text-primary)",
    fontFamily: "inherit",
    fontSize: 27,
    fontWeight: 1000,
    margin: 0,
    letterSpacing: 0,
    lineHeight: 1.02,
    textAlign: "left",
    textShadow: "0 5px 28px rgba(0,0,0,0.98), 0 1px 2px rgba(0,0,0,1)",
    WebkitTapHighlightColor: "transparent",
  },
  viewProof: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 10,
    textShadow: "0 2px 8px rgba(0,0,0,0.95)",
  },
  descriptionButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: 0,
    color: "var(--text-primary)",
    fontFamily: "inherit",
    fontSize: 17,
    lineHeight: 1.35,
    fontWeight: 650,
    marginBottom: 14,
    maxWidth: 500,
    textShadow: "0 4px 22px rgba(0,0,0,0.96), 0 1px 2px rgba(0,0,0,1)",
    letterSpacing: 0,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textAlign: "left",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  descriptionExpanded: {
    display: "block",
    overflow: "visible",
    WebkitLineClamp: "unset",
    maxHeight: "32vh",
    overflowY: "auto",
    paddingRight: 6,
  },
  captionToggle: {
    display: "inline",
    marginLeft: 6,
    color: "var(--accent-gold)",
    fontSize: 13,
    fontWeight: 900,
    textShadow: "0 4px 18px rgba(0,0,0,0.96)",
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
    padding: "0 16px",
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
    right: "max(12px, env(safe-area-inset-right))",
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "8px 4px",
    borderRadius: 999,
    background: "var(--glass)",
    border: "1px solid var(--line)",
    boxShadow: "var(--shadow-soft), inset 0 1px 0 rgba(255,255,255,0.08)",
    backdropFilter: "blur(18px) saturate(140%)",
    WebkitBackdropFilter: "blur(18px) saturate(140%)",
    animation: "fadeScale 220ms ease both",
    zIndex: 5,
    maxHeight: "min(600px, 90vh)",
    overflowY: "auto",
  },
  actionItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    userSelect: "none",
    opacity: 0.82,
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
    width: 36,
    height: 36,
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
    width: 22,
    height: 22,
    display: "block",
    color: "currentColor",
    filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.85))",
  },
  actionText: {
    color: "var(--text-primary)",
    fontSize: 10,
    fontWeight: 700,
    textShadow: "0 2px 8px rgba(0,0,0,0.95)",
  },
  muteBtn: {
    position: "absolute",
    top: "calc(16px + env(safe-area-inset-top))",
    right: "max(14px, env(safe-area-inset-right))",
    background: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 999,
    minWidth: 56,
    height: 32,
    color: "var(--text-primary)",
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  playIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: 60,
    opacity: 0.8,
    textShadow: "0 2px 8px rgba(0,0,0,0.5)",
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
    padding: "6px 8px",
  },
  navItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    cursor: "pointer",
    padding: "6px 6px",
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
    padding: "6px 8px",
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
    padding: "0 4px",
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
    background: "rgba(0,0,0,0.5)",
  },
  commentsContent: {
    background: "var(--surface)",
    borderRadius: "20px 20px 0 0",
    width: "100%",
    maxHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    zIndex: 1001,
  },
  commentsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid rgba(212,175,55,0.16)",
  },
  commentsTitle: {
    color: "var(--text-primary)",
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
  },
  commentsClose: {
    background: "none",
    border: "none",
    color: "var(--text-primary)",
    fontSize: 20,
    cursor: "pointer",
    padding: "4px",
  },
  commentsList: {
    flex: 1,
    overflowY: "auto",
    padding: "0 20px",
    maxHeight: "400px",
  },
  noComments: {
    textAlign: "center",
    color: "#666",
    padding: "40px 20px",
    fontSize: 14,
  },
  commentItem: {
    display: "flex",
    gap: 12,
    padding: "16px 0",
    borderBottom: "1px solid #222",
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "var(--primary-red)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-primary)",
    fontSize: 14,
    fontWeight: "bold",
    flexShrink: 0,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    color: "var(--text-primary)",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 4,
  },
  commentText: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 1.4,
  },
  commentInput: {
    display: "flex",
    gap: 12,
    padding: "20px",
    borderTop: "1px solid rgba(212,175,55,0.16)",
  },
  commentInputField: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid var(--line)",
    background: "#111",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
  },
  commentSendBtn: {
    padding: "12px 20px",
    borderRadius: 12,
    border: "none",
    background: "var(--primary-red)",
    color: "var(--text-primary)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
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
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "rgba(255,255,255,0.12)",
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
    padding: "18px 20px 14px",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "rgba(255,255,255,0.08)",
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
    borderColor: "rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.28)",
    color: "var(--text-primary)",
    fontSize: 18,
    cursor: "pointer",
  },
  feedbackBody: {
    maxHeight: "calc(76vh - 112px)",
    overflowY: "auto",
    padding: "18px 20px calc(24px + env(safe-area-inset-bottom))",
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
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.18)",
    borderTopColor: "var(--primary-red)",
    animation: "spin 1s linear infinite",
  },
  feedbackError: {
    color: "#ff8b8b",
    background: "rgba(193,18,31,0.12)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(193,18,31,0.26)",
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    lineHeight: 1.5,
  },
  feedbackResult: {
    margin: 0,
    whiteSpace: "pre-wrap",
    color: "var(--text-primary)",
    fontFamily: "inherit",
    fontSize: 14,
    lineHeight: 1.62,
  },
};
