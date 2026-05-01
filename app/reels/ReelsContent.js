"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { createNotification } from "@/lib/notifications";

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

export default function ReelsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const firstPathSegment = pathname?.split("/")[1];
  const currentLocale = ["en", "ko", "mn"].includes(firstPathSegment) ? firstPathSegment : "en";
  const { user, loading: authLoading } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [userLikes, setUserLikes] = useState(new Set());
  const [userViews, setUserViews] = useState(new Set());
  const [videoLoading, setVideoLoading] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [selectedReelId, setSelectedReelId] = useState(null);
  const videoRefs = useRef({});
  const viewTimers = useRef({});
  const controlsTimer = useRef(null);
  const commentsUnsubscribeRef = useRef(null);

  // Fetch reels from Firestore with real-time updates
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user?.uid) {
      setReels([DEMO_REEL]);
      setLoading(false);
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
          
          const sortedReels = reelsData.length > 0
            ? sortReelsByEngagement(reelsData)
            : [DEMO_REEL];
          
          setReels(sortedReels);
          setCurrentIndex(0);
          setLoading(false);
        }, (err) => {
          if (!isActive) return;
          console.error("Failed to listen for reels:", err);
          setReels([DEMO_REEL]);
          setLoading(false);
        });
      } catch (err) {
        if (!isActive) return;
        console.error("Failed to load reels:", err);
        setReels([DEMO_REEL]);
        setLoading(false);
      }
    }

    setLoading(true);
    loadReels();

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
        setReels(prev => sortReelsByEngagement(prev.map(reel => 
          reel.id === currentReel.id 
            ? { ...reel, views: getSafeViewCount(reel) + 1 }
            : reel
        )));
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

  useEffect(() => {
    const currentReel = reels[currentIndex];
    if (!currentReel || currentReel.isDemo) return;

    const video = videoRefs.current[currentReel.id];
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {
      // Browsers can still block autoplay; the tap-to-play overlay remains available.
    });
    setShowControls(true);
    scheduleControlsHide();
  }, [reels, currentIndex, scheduleControlsHide]);

  useEffect(() => {
    return () => {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

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
        
        setReels(prev => sortReelsByEngagement(prev.map(reel => 
          reel.id === reelId 
            ? { ...reel, likes: Math.max(0, getSafeLikeCount(reel) - 1) }
            : reel
        )));
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
        
        setReels(prev => sortReelsByEngagement(prev.map(reel => 
          reel.id === reelId 
            ? { ...reel, likes: getSafeLikeCount(reel) + 1 }
            : reel
        )));
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  }, [user, router, currentLocale, reels]);

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
  };

  // Handle video loaded
  const handleVideoLoaded = (reelId) => {
    setVideoLoading(prev => ({ ...prev, [reelId]: false }));
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          Loading reels...
        </div>
        <BottomNav router={router} user={user} currentLocale={currentLocale} />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          <p>No reels yet</p>
          <button style={styles.uploadBtn} onClick={() => router.push(`/${currentLocale}/upload`)}>
            Upload First Reel
          </button>
        </div>
        <BottomNav router={router} user={user} currentLocale={currentLocale} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Reels Feed */}
      <div style={styles.feed} className="reels-feed" onScroll={handleScroll}>
        {reels.map((reel, index) => (
          <div 
            key={reel.id} 
            style={{
              ...styles.videoContainer,
              ...(index === currentIndex ? styles.activeVideo : {})
            }}
          >
            {/* Video Loading Spinner */}
            {!reel.isDemo && videoLoading[reel.id] && (
              <div style={styles.videoLoadingOverlay}>
                <div style={styles.spinner}></div>
              </div>
            )}
            
            {reel.isDemo ? (
              <DemoReelVisual
                onUpload={() => router.push(`/${currentLocale}/upload`)}
              />
            ) : (
              <video
                ref={(el) => {
                  if (!el) return;
                  videoRefs.current[reel.id] = el;
                  if (index === 0 && currentIndex === 0) {
                    el.muted = true;
                    el.playsInline = true;
                    el.play().catch(() => {});
                  }
                }}
                src={reel.videoUrl}
                style={styles.video}
                className={index === currentIndex ? "cinematic-video" : ""}
                autoPlay={index === currentIndex}
                loop
                muted={isMuted}
                playsInline
                onClick={() => {
                  if (showControls) {
                    togglePlay();
                  } else {
                    revealControls();
                  }
                }}
                onLoadStart={() => handleVideoLoadStart(reel.id)}
                onLoadedMetadata={() => {
                  if (index === 0 && currentIndex === 0) {
                    videoRefs.current[reel.id]?.play().catch(() => {});
                  }
                }}
                onCanPlay={() => {
                  handleVideoLoaded(reel.id);
                  if (index === 0 && currentIndex === 0) {
                    videoRefs.current[reel.id]?.play().catch(() => {});
                  }
                }}
                preload={index <= 1 ? "auto" : "metadata"}
              />
            )}

            <div style={styles.vignette} />
            <div style={styles.bottomGradient} />

            <div style={styles.info}>
              <div
                style={{...styles.username, cursor: reel.userId ? "pointer" : "default"}}
                onClick={() => {
                  if (reel.userId) {
                    router.push(`/${currentLocale}/profile/${reel.userId}`);
                  }
                }}
              >
                @{reel.username || "user"}
              </div>
              {(reel.description || reel.caption) && (
                <div style={styles.description}>
                  {reel.description || reel.caption}
                </div>
              )}
              <div style={styles.metaLine}>
                <span>{formatViews(getSafeViewCount(reel))}</span>
                <span>{formatDate(reel.createdAt)}</span>
              </div>
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
                {isMuted ? "Mute" : "Sound"}
              </button>
            )}

            {/* Play/Pause indicator */}
            {!reel.isDemo && showControls && index === currentIndex && (
              <div style={styles.playIndicator}>
                {videoRefs.current[reel.id]?.paused ? "Play" : ""}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div style={styles.commentsModal}>
          <div style={styles.commentsOverlay} onClick={handleCloseComments} />
          <div style={styles.commentsContent}>
            <div style={styles.commentsHeader}>
              <h3 style={styles.commentsTitle}>Comments</h3>
              <button style={styles.commentsClose} onClick={handleCloseComments}>x</button>
            </div>

            <div style={styles.commentsList}>
              {comments.length === 0 ? (
                <div style={styles.noComments}>
                  No comments yet. Be the first to comment!
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
                  placeholder="Add a comment..."
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
                  Send
                </button>
              </div>
            )}
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

function DemoReelVisual() {
  return (
    <div style={styles.demoReel}>
      <div style={styles.demoVignette} />
    </div>
  );
}

// Bottom Nav component
function BottomNav({ router, user, currentLocale, onInteractStart, onInteractEnd }) {
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
        <span style={styles.navLabel}>Home</span>
      </div>
      <div style={styles.navItemActive}>
        <NavReelsIcon active />
        <span style={styles.navLabelActive}>Reels</span>
      </div>
      <div style={styles.navItem} onClick={() => router.push(`/${currentLocale}/coach`)}>
        <NavCoachIcon />
        <span style={styles.navLabel}>Coach</span>
      </div>
      <div style={styles.navItem} onClick={() => router.push(`/${currentLocale}/notifications`)}>
        <span style={styles.navIconWrap}>
          <NavBellIcon />
          {unreadCount > 0 && (
            <span style={styles.navBadge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
          )}
        </span>
        <span style={styles.navLabel}>Alerts</span>
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
        <span style={styles.navLabel}>Profile</span>
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
  videoLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#000",
    zIndex: 10,
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
    background: "#000",
  },
  demoVignette: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at 50% 38%, rgba(255,255,255,0.08), transparent 34%), linear-gradient(to bottom, rgba(0,0,0,0.15), #000)",
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
  username: {
    color: "var(--text-primary)",
    fontSize: 29,
    fontWeight: 1000,
    marginBottom: 14,
    letterSpacing: 0,
    lineHeight: 1.02,
    textShadow: "0 5px 28px rgba(0,0,0,0.98), 0 1px 2px rgba(0,0,0,1)",
  },
  viewProof: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 10,
    textShadow: "0 2px 8px rgba(0,0,0,0.95)",
  },
  description: {
    color: "var(--text-primary)",
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
  actions: {
    position: "absolute",
    right: "max(12px, env(safe-area-inset-right))",
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    padding: "14px 8px",
    borderRadius: 999,
    background: "var(--glass)",
    border: "1px solid var(--line)",
    boxShadow: "var(--shadow-soft), inset 0 1px 0 rgba(255,255,255,0.08)",
    backdropFilter: "blur(18px) saturate(140%)",
    WebkitBackdropFilter: "blur(18px) saturate(140%)",
    animation: "fadeScale 220ms ease both",
    zIndex: 5,
  },
  actionItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
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
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "transparent",
    border: "1px solid transparent",
    backdropFilter: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    boxShadow: "none",
    transition: "transform var(--motion-fast), background var(--motion-fast), border-color var(--motion-fast), box-shadow var(--motion-fast)",
  },
  actionCircleLiked: {
    background: "rgba(193, 18, 31, 0.12)",
    borderColor: "rgba(193,18,31,0.32)",
    boxShadow: "var(--shadow-glow-red)",
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
  actionSvg: {
    width: 28,
    height: 28,
    display: "block",
    color: "currentColor",
    filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.85))",
  },
  actionText: {
    color: "var(--text-primary)",
    fontSize: 11,
    fontWeight: 800,
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
};

