"use client";

import { memo, useEffect } from "react";
import { getFirebase } from "@/lib/lazyFirebase";
import styles from "@/components/reels/reelStyles";
import {
  CenterPlayIcon,
  DemoReelVisual,
  ReelFallbackVisual,
} from "@/components/reels/ReelIcons";
import ReelVideoPlayer from "@/components/reels/ReelVideoPlayer";
import ReelHeartBurst from "@/components/reels/ReelHeartBurst";
import ReelBanners from "@/components/reels/ReelBanners";
import ReelInfoPanel from "@/components/reels/ReelInfoPanel";
import ReelActionBar from "@/components/reels/ReelActionBar";

const ReelItem = memo(function ReelItem({
  reel,
  index,
  currentIndex,
  reelItemRefs,
  videoRefs,
  soundEnabled,
  hasVideoError,
  isVideoLoading,
  videoProgress,
  isLiked,
  isSaved,
  heartBursts,
  showControls,
  isPvpSource,
  isProfileSource,
  profileReelProgress,
  creatorName,
  creatorPhoto,
  creatorInitial,
  captionText,
  creatorStatLine,
  hasStory,
  creatorStreakCount,
  stats,
  gymName,
  currentLocale,
  t,
  router,
  onVideoClick,
  onVideoLoadStart,
  onVideoLoaded,
  onVideoError,
  onLike,
  onOpenComments,
  onShare,
  onSave,
  onGetFeedback,
  onBreakdown,
  onCaptionSheet,
  onReport,
  setVideoProgress,
  // Follow (optional — only wired on /feed)
  isFollowing = false,
  followLoading = false,
  onFollow = null,
  viewerUid = null,
}) {
  const isActive = index === currentIndex;

  // ── Play / pause on active change ──────────────────────────────────────────
  useEffect(() => {
    const video = videoRefs.current[reel.id];
    if (!video || reel.isDemo || hasVideoError || !reel.videoUrl) return;
    if (isActive) {
      video.muted = !soundEnabled;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, soundEnabled]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openCreatorProfile = () => {
    if (reel.userId) router.push(`/${currentLocale}/profile/${reel.userId}`);
  };

  const handleChallengeClick = async () => {
    try {
      const { db: fdb } = await getFirebase();
      const { doc, setDoc, increment: fsIncrement, serverTimestamp: fsts } =
        await import("firebase/firestore");
      await setDoc(
        doc(fdb, "reel_stats", reel.id),
        { reelId: reel.id, challengeClicks: fsIncrement(1), updatedAt: fsts() },
        { merge: true }
      );
    } catch { /* non-critical */ }

    const trainParams = new URLSearchParams({ reelId: reel.id });
    if (reel.userId) trainParams.set("reelCreatorId", reel.userId);
    if (
      stats?.bestScore != null &&
      Number.isFinite(stats.bestScore) &&
      stats.bestScore > 0
    ) {
      trainParams.set("creatorBestScore", stats.bestScore.toFixed(1));
    }
    router.push(`/${currentLocale}/train?${trainParams.toString()}`);
  };

  const handleAcceptChallengeClick = () => {
    router.push(`/${currentLocale}/train?challengePostId=${reel.id}`);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      key={reel.id}
      data-reel-index={index}
      ref={(el) => {
        if (el) reelItemRefs.current[reel.id] = el;
        else delete reelItemRefs.current[reel.id];
      }}
      style={{
        ...styles.videoContainer,
        ...(isActive ? styles.activeVideo : {}),
      }}
    >
      <ReelVideoPlayer
        reel={reel}
        index={index}
        currentIndex={currentIndex}
        videoRefs={videoRefs}
        isActive={isActive}
        soundEnabled={soundEnabled}
        hasVideoError={hasVideoError}
        isVideoLoading={isVideoLoading}
        videoProgress={videoProgress}
        onVideoClick={onVideoClick}
        onVideoLoadStart={onVideoLoadStart}
        onVideoLoaded={onVideoLoaded}
        onVideoError={onVideoError}
        setVideoProgress={setVideoProgress}
        router={router}
        currentLocale={currentLocale}
        t={t}
        DemoReelVisual={DemoReelVisual}
        ReelFallbackVisual={ReelFallbackVisual}
      />

      <ReelHeartBurst heartBursts={heartBursts} />

      <ReelBanners
        reel={reel}
        isActive={isActive}
        isPvpSource={isPvpSource}
        isProfileSource={isProfileSource}
        profileReelProgress={profileReelProgress}
        t={t}
      />

      <ReelInfoPanel
        reel={reel}
        stats={stats}
        captionText={captionText}
        creatorName={creatorName}
        creatorPhoto={creatorPhoto}
        creatorInitial={creatorInitial}
        creatorStatLine={creatorStatLine}
        creatorStreakCount={creatorStreakCount}
        gymName={gymName}
        hasStory={hasStory}
        isFollowing={isFollowing}
        followLoading={followLoading}
        onFollow={onFollow}
        viewerUid={viewerUid}
        onOpenCreatorProfile={openCreatorProfile}
        onCaptionSheet={onCaptionSheet}
        onChallengeClick={handleChallengeClick}
        onAcceptChallengeClick={handleAcceptChallengeClick}
        t={t}
      />

      <ReelActionBar
        reel={reel}
        isLiked={isLiked}
        isSaved={isSaved}
        onLike={onLike}
        onOpenComments={onOpenComments}
        onShare={onShare}
        onSave={onSave}
        onBreakdown={onBreakdown}
        t={t}
      />

      {/* Play/Pause indicator */}
      {!reel.isDemo && showControls && isActive && videoRefs.current[reel.id]?.paused && (
        <div style={styles.playIndicator}>
          <CenterPlayIcon />
        </div>
      )}
    </div>
  );
});

export default ReelItem;
