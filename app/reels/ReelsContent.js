"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import DailyMission from "@/components/DailyMission";
import ReelsDashboard from "@/components/reels/ReelsDashboard";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { computeFeedScore } from "@/lib/analytics";
import dynamic from "next/dynamic";
import { getCreatedAtMs } from "@/lib/reelHelpers";
import { BackArrowIcon } from "@/components/reels/ReelIcons";

const CommentsModal = dynamic(() => import("@/components/reels/CommentsModal"), { ssr: false });
const FeedbackModal = dynamic(() => import("@/components/reels/FeedbackModal"), { ssr: false });

import { useReelFeed } from "@/hooks/useReelFeed";
import { useVideoControls } from "@/hooks/useVideoControls";
import { useCommentActions } from "@/hooks/useCommentActions";
import { useReelFeedback } from "@/hooks/useReelFeedback";
import { useReelInteractions } from "@/hooks/useReelInteractions";
import { useReelViewTracking } from "@/hooks/useReelViewTracking";
import styles from "@/components/reels/reelStyles";

// Sub-components
import ReelsLoadingScreen from "@/components/reels/ReelsLoadingScreen";
import ReelsEmptyArena from "@/components/reels/ReelsEmptyArena";
import FeedTabs from "@/components/reels/FeedTabs";
import SoundToggleButton from "@/components/reels/SoundToggleButton";
import ReelsFeedList from "@/components/reels/ReelsFeedList";
import ReelsMobileModals from "@/components/reels/ReelsMobileModals";

export default function ReelsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
  const [captionSheetReelId, setCaptionSheetReelId] = useState(null);
  const handleBreakdown = useCallback((reel) => {
    router.push(`/${currentLocale}/ai-analysis/${reel.id}`);
  }, [router, currentLocale]);
  const [reportReel, setReportReel] = useState(null);

  const feedRef = useRef(null);
  const reelItemRefs = useRef({});
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
    soundEnabled, showControls,
    videoLoading, videoErrors, videoProgress, setVideoProgress,
    heartBursts, setHeartBursts,
    videoRefs, singleTapTimerRef,
    togglePlay, clearControlsTimer,
    scheduleControlsHide, revealControls,
    toggleMute,
    handleVideoLoadStart, handleVideoLoaded, handleVideoError,
  } = useVideoControls({ reels, currentIndex });

  const {
    showComments, comments, commentProfiles,
    newComment, setNewComment,
    replyingTo, setReplyingTo,
    expandedReplies, setExpandedReplies,
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

  // ── Feed filtering / sorting ──────────────────────────────────────────────
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
      const base = allReels;
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

  // ── Scroll to target reel (deep-link) ────────────────────────────────────
  useEffect(() => {
    if (!targetReelId || !reels.length || lastScrolledReelId.current === targetReelId) return;
    const targetIndex = reels.findIndex((reel) => reel.id === targetReelId);
    if (targetIndex < 0) return;
    lastScrolledReelId.current = targetReelId;
    setCurrentIndex(targetIndex);
    requestAnimationFrame(() => {
      reelItemRefs.current[targetReelId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [reels, targetReelId]);

  useReelViewTracking({ user, reels, currentIndex, userViews, setUserViews, setAllReels });

  // ── Scroll handler ────────────────────────────────────────────────────────
  const handleScroll = useCallback((e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    const itemHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, reels.length]);

  // ── IntersectionObserver for current index ────────────────────────────────
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
    }, { root, threshold: [0.6, 0.75, 0.9] });
    reels.forEach((reel) => {
      const element = reelItemRefs.current[reel.id];
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [reels]);

  // ── Cleanup single-tap timer on unmount ───────────────────────────────────
  useEffect(() => {
    const timerRef = singleTapTimerRef;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [singleTapTimerRef]);

  // ── Early returns ─────────────────────────────────────────────────────────
  if (authLoading || reelsLoading) {
    return (
      <ReelsLoadingScreen
        router={router}
        user={user}
        currentLocale={currentLocale}
        t={t}
        authLoading={authLoading}
      />
    );
  }

  if (reels.length === 0 && feedMode !== "following" && !isProfileSource) {
    return (
      <ReelsEmptyArena
        router={router}
        user={user}
        currentLocale={currentLocale}
      />
    );
  }

  // ── Desktop 3-column dashboard ────────────────────────────────────────────
  if (isDesktop) {
    return (
      <>
        <ReelsDashboard
          reels={reels}
          feedMode={feedMode}
          setFeedMode={setFeedMode}
          videoRefs={videoRefs}
          soundEnabled={soundEnabled}
          videoProgress={videoProgress}
          userLikes={userLikes}
          savedReels={savedReels}
          heartBursts={heartBursts}
          creatorProfiles={creatorProfiles}
          creatorStats={creatorStats}
          gymNames={gymNames}
          isProfileSource={isProfileSource}
          profileSourceUserId={profileSourceUserId}
          user={user}
          router={router}
          currentLocale={currentLocale}
          t={t}
          handleLike={handleLike}
          handleOpenComments={handleOpenComments}
          handleShare={handleShare}
          handleSave={handleSave}
          handleGetFeedback={handleGetFeedback}
          feedRef={feedRef}
        />
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
      </>
    );
  }

  // ── Mobile feed ───────────────────────────────────────────────────────────
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
        <FeedTabs
          feedMode={feedMode}
          setFeedMode={setFeedMode}
          diffFilter={diffFilter}
          ctFilter={ctFilter}
          user={user}
          router={router}
          currentLocale={currentLocale}
          t={t}
          setShowFilterSheet={setShowFilterSheet}
        />
      )}

      <ReelsFeedList
        reels={reels}
        currentIndex={currentIndex}
        feedRef={feedRef}
        reelItemRefs={reelItemRefs}
        videoRefs={videoRefs}
        soundEnabled={soundEnabled}
        videoErrors={videoErrors}
        videoLoading={videoLoading}
        videoProgress={videoProgress}
        setVideoProgress={setVideoProgress}
        heartBursts={heartBursts}
        showControls={showControls}
        userLikes={userLikes}
        savedReels={savedReels}
        isPvpSource={isPvpSource}
        isProfileSource={isProfileSource}
        profileReelProgress={profileReelProgress}
        creatorProfiles={creatorProfiles}
        creatorStats={creatorStats}
        gymNames={gymNames}
        currentLocale={currentLocale}
        t={t}
        router={router}
        handleScroll={handleScroll}
        onVideoClick={handleVideoClick}
        onVideoLoadStart={handleVideoLoadStart}
        onVideoLoaded={handleVideoLoaded}
        onVideoError={handleVideoError}
        onLike={handleLike}
        onOpenComments={handleOpenComments}
        onShare={handleShare}
        onSave={handleSave}
        onGetFeedback={handleGetFeedback}
        onBreakdown={handleBreakdown}
        onCaptionSheet={setCaptionSheetReelId}
        onReport={setReportReel}
        setFeedMode={setFeedMode}
      />

      <SoundToggleButton
        soundEnabled={soundEnabled}
        toggleMute={toggleMute}
        t={t}
      />

      <ReelsMobileModals
        showComments={showComments}
        comments={comments}
        commentProfiles={commentProfiles}
        newComment={newComment}
        setNewComment={setNewComment}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        expandedReplies={expandedReplies}
        setExpandedReplies={setExpandedReplies}
        onCloseComments={handleCloseComments}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        feedbackOpen={feedbackOpen}
        feedbackLoading={feedbackLoading}
        feedbackError={feedbackError}
        feedbackResult={feedbackResult}
        feedbackSaved={feedbackSaved}
        sessionXPData={sessionXPData}
        feedbackReel={feedbackReel}
        onCloseFeedback={handleCloseFeedback}
        captionSheetReelId={captionSheetReelId}
        reels={reels}
        setCaptionSheetReelId={setCaptionSheetReelId}
        showFilterSheet={showFilterSheet}
        diffFilter={diffFilter}
        ctFilter={ctFilter}
        setDiffFilter={setDiffFilter}
        setCtFilter={setCtFilter}
        setShowFilterSheet={setShowFilterSheet}
        reportReel={reportReel}
        onCloseReport={() => setReportReel(null)}
        user={user}
        router={router}
        currentLocale={currentLocale}
        t={t}
      />

      <BottomNav
        router={router}
        user={user}
        currentLocale={currentLocale}
        onInteractStart={clearControlsTimer}
        onInteractEnd={scheduleControlsHide}
      />
    </div>
  );
}
