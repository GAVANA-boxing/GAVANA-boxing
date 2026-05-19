"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import DailyMission from "@/components/DailyMission";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { computeFeedScore } from "@/lib/analytics";
import AIBreakdownSheet from "@/components/AIBreakdownSheet";
import { GOLD, goldAlpha } from "@/lib/tokens";
import {
  DEMO_REEL,
  getSafeViewCount,
  getCreatedAtMs,
  sortReelsByEngagement,
  getCreatorName,
  getCreatorPhoto,
  cleanCaption,
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
import { useVideoControls } from "@/hooks/useVideoControls";
import { useCommentActions } from "@/hooks/useCommentActions";
import { useReelFeedback } from "@/hooks/useReelFeedback";
import { useReelInteractions } from "@/hooks/useReelInteractions";
import { getFirebase } from "@/lib/lazyFirebase";
import styles from "@/components/reels/reelStyles";

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
  const [diffFilter, setDiffFilter] = useState("all");
  const [ctFilter, setCtFilter] = useState("all");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedCaptionIds, setExpandedCaptionIds] = useState(new Set());
  const [captionSheetReelId, setCaptionSheetReelId] = useState(null);
  const [breakdownReel, setBreakdownReel] = useState(null);
  const [localProfileProgress, setProfileReelProgress] = useState(null);
  const feedRef = useRef(null);
  const reelItemRefs = useRef({});
  const viewTimers = useRef({});
  const lastTapRef = useRef({ time: 0, reelId: null });
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

  const {
    soundEnabled, showControls, setShowControls,
    videoLoading, videoErrors, videoProgress, setVideoProgress,
    heartBursts, setHeartBursts,
    videoRefs, singleTapTimerRef,
    pauseInactiveVideos, togglePlay, clearControlsTimer,
    scheduleControlsHide, revealControls,
    muteAllVideos, toggleMute,
    handleVideoLoadStart, handleVideoLoaded, handleVideoError,
  } = useVideoControls({ reels, currentIndex });

  const {
    showComments, comments, commentProfiles,
    newComment, setNewComment,
    replyingTo, setReplyingTo,
    expandedReplies, setExpandedReplies,
    selectedReelId,
    handleOpenComments, handleAddComment, handleDeleteComment, handleCloseComments,
  } = useCommentActions({ user, router, currentLocale, reels });

  const {
    feedbackOpen, feedbackLoading, feedbackError, feedbackResult,
    feedbackSaved, feedbackReel, sessionXPData,
    handleGetFeedback, handleCloseFeedback,
  } = useReelFeedback({ user, router, currentLocale, t, creatorProfiles });

  const { handleLike, handleVideoClick, handleSave, handleShare } = useReelInteractions({
    user, router, currentLocale, pathname, t,
    reels, userLikes, savedReels,
    setUserLikes, setAllReels, setSavedReels, setUserViews, setHeartBursts,
    revealControls, togglePlay, singleTapTimerRef, lastTapRef,
  });

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

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    };
  }, []);

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
              profileReelProgress={isProfileSource ? localProfileProgress : profileReelProgress}
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
