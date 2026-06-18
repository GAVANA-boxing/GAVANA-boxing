"use client";

import ErrorBoundary from "@/components/ErrorBoundary";
import ReelItem from "@/components/reels/ReelItem";
import FollowingEmptyState from "@/components/reels/FollowingEmptyState";
import {
  getCreatorName,
  getCreatorPhoto,
  cleanCaption,
} from "@/lib/reelHelpers";
import styles from "@/components/reels/reelStyles";

/**
 * ReelsFeedList
 *
 * Renders the scrollable feed container and the per-reel ReelItem cards.
 * All state lives in ReelsContent — this component is purely presentational.
 */
export default function ReelsFeedList({
  // Feed data
  reels,
  currentIndex,
  // Refs (passed as-is — mutable ref objects)
  feedRef,
  reelItemRefs,
  videoRefs,
  // Video state
  soundEnabled,
  videoErrors,
  videoLoading,
  videoProgress,
  setVideoProgress,
  heartBursts,
  showControls,
  // User state
  userLikes,
  savedReels,
  // Source flags
  isPvpSource,
  isProfileSource,
  profileReelProgress,
  // Creator data
  creatorProfiles,
  creatorStats,
  gymNames,
  // i18n
  currentLocale,
  t,
  router,
  // Event handlers
  handleScroll,
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
  // Following empty-state
  setFeedMode,
}) {
  return (
    <div ref={feedRef} style={styles.feed} className="reels-feed" onScroll={handleScroll}>
      {reels.length === 0 ? (
        <FollowingEmptyState
          currentLocale={currentLocale}
          setFeedMode={setFeedMode}
        />
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
          <ErrorBoundary key={reel.id}>
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
              onVideoClick={onVideoClick}
              onVideoLoadStart={onVideoLoadStart}
              onVideoLoaded={onVideoLoaded}
              onVideoError={onVideoError}
              onLike={onLike}
              onOpenComments={onOpenComments}
              onShare={onShare}
              onSave={onSave}
              onGetFeedback={onGetFeedback}
              onBreakdown={onBreakdown}
              onCaptionSheet={onCaptionSheet}
              onReport={onReport}
            />
          </ErrorBoundary>
        );
      })}
    </div>
  );
}
