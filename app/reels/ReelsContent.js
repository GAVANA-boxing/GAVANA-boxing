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

// Calculate "For You" score for a reel
function calculateReelScore(reel, userFollowing) {
  let score = 0;
  
  // Views: +1 point each
  score += getSafeViewCount(reel);
  
  // Likes: +5 points each
  score += getSafeLikeCount(reel) * 5;
  
  // Comments: +3 points each
  score += getSafeCommentsCount(reel) * 3;
  
  // Recent posts get a small boost (within last 7 days)
  if (reel.createdAt) {
    const createdDate = reel.createdAt.toDate ? reel.createdAt.toDate() : new Date(reel.createdAt);
    const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7) {
      // Boost decreases over time: max +10 for very recent, +2 for 7 days old
      const recencyBoost = Math.max(2, 10 - (daysSinceCreation * 1.14));
      score += recencyBoost;
    }
  }
  
  // Follow boost: +10 if user follows this reel owner
  if (reel.userId && userFollowing.has(reel.userId)) {
    score += 10;
  }
  
  return score;
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
  const [showControls, setShowControls] = useState(true);
  const [userLikes, setUserLikes] = useState(new Set());
  const [userViews, setUserViews] = useState(new Set());
  const [userFollowing, setUserFollowing] = useState(new Set());
  const [videoLoading, setVideoLoading] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [selectedReelId, setSelectedReelId] = useState(null);
  const videoRefs = useRef({});
  const viewTimers = useRef({});
  const commentsUnsubscribeRef = useRef(null);

  // Fetch reels from Firestore with real-time updates
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user?.uid) {
      setReels([]);
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
          
          // Sort by "For You" algorithm score
          const sortedReels = reelsData.sort((a, b) => {
            const scoreA = calculateReelScore(a, userFollowing);
            const scoreB = calculateReelScore(b, userFollowing);
            return scoreB - scoreA; // Sort descending (highest score first)
          });
          
          setReels(sortedReels);
          setLoading(false);
        }, (err) => {
          if (!isActive) return;
          console.error("Failed to listen for reels:", err);
          setReels([]);
          setLoading(false);
        });
      } catch (err) {
        if (!isActive) return;
        console.error("Failed to load reels:", err);
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
  }, [authLoading, user?.uid, userFollowing]);

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
    if (!currentReel || !currentReel.id) return;
    
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
        setReels(prev => prev.map(reel => 
          reel.id === currentReel.id 
            ? { ...reel, views: getSafeViewCount(reel) + 1 }
            : reel
        ));
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
      } else {
        video.pause();
      }
    }
  }, [currentIndex, reels]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Handle like/unlike
  const handleLike = useCallback(async (reelId) => {
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
        
        setReels(prev => prev.map(reel => 
          reel.id === reelId 
            ? { ...reel, likes: Math.max(0, getSafeLikeCount(reel) - 1) }
            : reel
        ));
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
        
        setReels(prev => prev.map(reel => 
          reel.id === reelId 
            ? { ...reel, likes: getSafeLikeCount(reel) + 1 }
            : reel
        ));
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  }, [user, router, currentLocale, reels]);

  // Handle opening comments
  const handleOpenComments = useCallback(async (reelId) => {
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
  }, [user?.uid, router, currentLocale]);

  // Handle adding comment
  const handleAddComment = useCallback(async () => {
    if (!user || !newComment.trim() || !selectedReelId) return;

    try {
      const { db } = await getFirebase();
      const { collection, addDoc, serverTimestamp, increment, doc, updateDoc } = await import("firebase/firestore");
      const selectedReel = reels.find((reel) => reel.id === selectedReelId);

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
      {/* Header - TikTok style top bar */}
      <div style={styles.header}>
        <div style={styles.headerTabs}>
          <span style={styles.headerTabActive}>Reels</span>
          <span style={styles.headerTab}>Following</span>
          <span 
            style={styles.headerTab} 
            onClick={() => router.push(`/${currentLocale}/coach`)}
          >
            Coach
          </span>
        </div>
      </div>

      {/* Reels Feed */}
      <div style={styles.feed} onScroll={handleScroll}>
        {reels.map((reel, index) => (
          <div 
            key={reel.id} 
            style={{
              ...styles.videoContainer,
              ...(index === currentIndex ? styles.activeVideo : {})
            }}
          >
            {/* Video Loading Spinner */}
            {videoLoading[reel.id] && (
              <div style={styles.videoLoadingOverlay}>
                <div style={styles.spinner}></div>
              </div>
            )}
            
            {/* Video - lazy load only current and nearby videos */}
            <video
              ref={(el) => { if (el) videoRefs.current[reel.id] = el; }}
              src={reel.videoUrl}
              style={styles.video}
              autoPlay={index === currentIndex}
              loop
              muted={isMuted}
              playsInline
              onClick={togglePlay}
              onLoadStart={() => handleVideoLoadStart(reel.id)}
              onCanPlay={() => handleVideoLoaded(reel.id)}
              preload={index === currentIndex ? "auto" : "none"}
            />

            {/* Overlay Info */}
            <div style={styles.overlay}>
              {/* Left side info */}
              <div style={styles.info}>
                <div 
                  style={{...styles.username, cursor: "pointer"}}
                  onClick={() => {
                    router.push(`/${currentLocale}/profile/${reel.userId}`);
                  }}
                >
                  @{reel.username || "user"}
                </div>
                <div style={styles.description}>{reel.description || reel.caption || ""}</div>
                <div style={styles.date}>{formatDate(reel.createdAt)}</div>
              </div>

              {/* Right side actions - TikTok style */}
              <div style={styles.actions}>
                <div 
                  style={styles.actionItem} 
                  onClick={() => handleLike(reel.id)}
                >
                  <div style={{
                    ...styles.actionCircle,
                    ...(userLikes.has(reel.id) ? styles.actionCircleLiked : {})
                  }}>
                    <span style={{
                      ...styles.actionIcon,
                      ...(userLikes.has(reel.id) ? styles.actionIconLiked : {})
                    }}>
                      {userLikes.has(reel.id) ? "❤️" : "♥"}
                    </span>
                  </div>
                  <span style={styles.actionText}>{getSafeLikeCount(reel)}</span>
                </div>
                <div style={styles.actionItem} onClick={() => handleOpenComments(reel.id)}>
                  <div style={styles.actionCircle}>
                    <span style={styles.actionIcon}>💬</span>
                  </div>
                  <span style={styles.actionText}>{reel.commentsCount || 0}</span>
                </div>
                <div style={styles.actionItem}>
                  <div style={styles.actionCircle}>
                    <span style={styles.actionIcon}>↗️</span>
                  </div>
                  <span style={styles.actionText}>{reel.shares || 0}</span>
                </div>
                <div style={styles.actionItem}>
                  <div style={styles.actionCircle}>
                    <span style={styles.actionIcon}>👁️</span>
                  </div>
                  <span style={styles.actionText}>{getSafeViewCount(reel)}</span>
                </div>
              </div>
            </div>

            {/* Mute button */}
            <button style={styles.muteBtn} onClick={toggleMute}>
              {isMuted ? "🔇" : "🔊"}
            </button>

            {/* Play/Pause indicator */}
            {showControls && index === currentIndex && (
              <div style={styles.playIndicator}>
                {videoRefs.current[reel.id]?.paused ? "▶️" : ""}
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
              <button style={styles.commentsClose} onClick={handleCloseComments}>✕</button>
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

      <BottomNav router={router} user={user} currentLocale={currentLocale} />
    </div>
  );
}

// Bottom Nav component
function BottomNav({ router, user, currentLocale }) {
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
    <div style={styles.bottomNav}>
      <div style={styles.navItem} onClick={() => router.push(`/${currentLocale}`)}>
        <span style={styles.navIcon}>🏠</span>
        <span style={styles.navLabel}>Home</span>
      </div>
      <div style={styles.navItemActive}>
        <span style={styles.navIconActive}>🎬</span>
        <span style={styles.navLabelActive}>Reels</span>
      </div>
      <div style={styles.navItem} onClick={() => router.push(`/${currentLocale}/coach`)}>
        <span style={styles.navIcon}>🤖</span>
        <span style={styles.navLabel}>Coach</span>
      </div>
      <div style={styles.navItem} onClick={() => router.push(`/${currentLocale}/notifications`)}>
        <span style={styles.navIconWrap}>
          <span style={styles.navIcon}>!</span>
          {unreadCount > 0 && (
            <span style={styles.navBadge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
          )}
        </span>
        <span style={styles.navLabel}>Alerts</span>
      </div>
      <div style={styles.navUpload} onClick={() => router.push(`/${currentLocale}/upload`)}>
        <span style={styles.navUploadIcon}>+</span>
      </div>
      <div style={styles.navItem} onClick={() => {
        if (user?.uid) {
          router.push(`/${currentLocale}/profile/${user.uid}`);
        } else {
          router.push(`/${currentLocale}/login`);
        }
      }}>
        <span style={styles.navIcon}>👤</span>
        <span style={styles.navLabel}>Profile</span>
      </div>
    </div>
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
    color: "#fff",
    fontSize: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fe2c55",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    color: "#fff",
    gap: 16,
  },
  uploadBtn: {
    background: "#fe2c55",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  header: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 20px",
    background: "rgba(0,0,0,0.9)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
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
    color: "#fff",
    fontSize: 17,
    fontWeight: 700,
    borderBottom: "2px solid #fe2c55",
    paddingBottom: 4,
  },
  feed: {
    height: "100vh",
    overflowY: "scroll",
    scrollSnapType: "y mandatory",
    scrollBehavior: "smooth",
    paddingBottom: 60,
  },
  videoContainer: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    scrollSnapAlign: "start",
    scrollSnapStop: "always",
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
    background: "#000",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "20px 16px 90px",
    background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  info: {
    flex: 1,
    maxWidth: "75%",
  },
  username: {
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 8,
    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
  },
  description: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 1.4,
    marginBottom: 8,
    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
  },
  date: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    paddingBottom: 8,
  },
  actionItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    cursor: "pointer",
  },
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    transition: "transform 0.2s ease",
  },
  actionCircleLiked: {
    background: "rgba(254, 44, 85, 0.2)",
    transform: "scale(1.1)",
  },
  actionIcon: {
    fontSize: 24,
  },
  actionIconLiked: {
    transform: "scale(1.2)",
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
  },
  muteBtn: {
    position: "absolute",
    top: "50%",
    right: 12,
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.2)",
    border: "none",
    borderRadius: "50%",
    width: 36,
    height: 36,
    fontSize: 18,
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
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    background: "#000",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    zIndex: 100,
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  navItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    cursor: "pointer",
    padding: "8px 16px",
  },
  navItemActive: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    cursor: "pointer",
    padding: "8px 16px",
  },
  navIcon: {
    fontSize: 24,
  },
  navIconWrap: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 24,
    minHeight: 24,
    color: "#fff",
  },
  navBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    padding: "0 4px",
    borderRadius: 8,
    background: "#fe2c55",
    color: "#fff",
    border: "1px solid #000",
    fontSize: 10,
    fontWeight: 700,
    lineHeight: "14px",
    textAlign: "center",
  },
  navIconActive: {
    fontSize: 26,
  },
  navLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: 500,
  },
  navLabelActive: {
    color: "#fff",
    fontSize: 10,
    fontWeight: 600,
  },
  navUpload: {
    width: 44,
    height: 32,
    background: "#fe2c55",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  navUploadIcon: {
    color: "#fff",
    fontSize: 22,
    fontWeight: 300,
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
    background: "#0d0d0d",
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
    borderBottom: "1px solid #333",
  },
  commentsTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
  },
  commentsClose: {
    background: "none",
    border: "none",
    color: "#fff",
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
    background: "#E8002D",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    flexShrink: 0,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    color: "#fff",
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
    borderTop: "1px solid #333",
  },
  commentInputField: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 25,
    border: "1px solid #333",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: 14,
    outline: "none",
  },
  commentSendBtn: {
    padding: "12px 20px",
    borderRadius: 25,
    border: "none",
    background: "#E8002D",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  commentSendBtnDisabled: {
    background: "#333",
    cursor: "not-allowed",
  },
};
