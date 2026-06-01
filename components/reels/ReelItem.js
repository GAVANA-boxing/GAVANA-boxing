"use client";

import { memo, useEffect } from "react";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import {
  getSafeLikeCount,
  getSafeCommentsCount,
  formatCompactCount,
} from "@/lib/reelHelpers";
import {
  LikeIcon,
  CommentIcon,
  ShareIcon,
  BookmarkIcon,
  RobotIcon,
  AISparkIcon,
  CenterPlayIcon,
  DemoReelVisual,
  ReelFallbackVisual,
} from "@/components/reels/ReelIcons";
import styles from "@/components/reels/reelStyles";
import Image from "next/image";
import { getFirebase } from "@/lib/lazyFirebase";

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

  const openCreatorProfile = () => {
    if (reel.userId) router.push(`/${currentLocale}/profile/${reel.userId}`);
  };

  const handleChallengeClick = async () => {
    try {
      const { db: fdb } = await getFirebase();
      const { doc, setDoc, increment: fsIncrement, serverTimestamp: fsts } = await import("firebase/firestore");
      await setDoc(
        doc(fdb, "reel_stats", reel.id),
        { reelId: reel.id, challengeClicks: fsIncrement(1), updatedAt: fsts() },
        { merge: true }
      );
    } catch { /* non-critical */ }
    const trainParams = new URLSearchParams({ reelId: reel.id });
    if (reel.userId) trainParams.set("reelCreatorId", reel.userId);
    if (stats?.bestScore != null && Number.isFinite(stats.bestScore) && stats.bestScore > 0) {
      trainParams.set("creatorBestScore", stats.bestScore.toFixed(1));
    }
    router.push(`/${currentLocale}/train?${trainParams.toString()}`);
  };

  const effectiveType = reel.contentType || reel.type || "lifestyle";
  const isChallenge = effectiveType === "training";
  const isFeedChallenge = effectiveType === "challenge";
  const isEducational = effectiveType === "educational";
  const showChallengeCta = isChallenge || reel.challengeEnabled;
  const showAcceptChallengeCta = isFeedChallenge;
  const showLearnCta = isEducational && !reel.challengeEnabled;

  const handleAcceptChallengeClick = () => {
    router.push(`/${currentLocale}/train?challengePostId=${reel.id}`);
  };

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
        ...(isActive ? styles.activeVideo : {})
      }}
    >
      {reel.isDemo ? (
        <DemoReelVisual onUpload={() => router.push(`/${currentLocale}/upload`)} />
      ) : hasVideoError || !reel.videoUrl ? (
        <ReelFallbackVisual reel={reel} />
      ) : (
        <video
          ref={(el) => {
            if (el) {
              videoRefs.current[reel.id] = el;
              el.muted = !isActive || !soundEnabled;
              el.playsInline = true;
              el.setAttribute("playsinline", "");
              el.setAttribute("webkit-playsinline", "");
            } else {
              delete videoRefs.current[reel.id];
            }
          }}
          src={reel.videoUrl}
          style={styles.video}
          className={isActive ? "cinematic-video" : ""}
          autoPlay={isActive}
          loop
          muted={!isActive || !soundEnabled}
          playsInline
          webkit-playsinline="true"
          poster={reel.thumbnailUrl || undefined}
          onClick={(e) => onVideoClick(e, reel)}
          onLoadStart={() => onVideoLoadStart(reel.id)}
          onLoadedData={() => {
            onVideoLoaded(reel.id);
            if (isActive) {
              const video = videoRefs.current[reel.id];
              if (video) { video.muted = !soundEnabled; video.play().catch(() => {}); }
            }
          }}
          onLoadedMetadata={() => {
            if (isActive) {
              const video = videoRefs.current[reel.id];
              if (video) { video.muted = !soundEnabled; video.play().catch(() => {}); }
            }
          }}
          onCanPlay={() => {
            onVideoLoaded(reel.id);
            if (isActive) {
              const video = videoRefs.current[reel.id];
              if (video) { video.muted = !soundEnabled; video.play().catch(() => {}); }
            }
          }}
          onError={() => onVideoError(reel.id)}
          onTimeUpdate={(e) => {
            if (isActive) {
              const v = e.currentTarget;
              if (v.duration) setVideoProgress(v.currentTime / v.duration);
            }
          }}
          preload={isActive ? "auto" : index === currentIndex + 1 ? "metadata" : "none"}
        />
      )}

      {!reel.isDemo && !hasVideoError && isVideoLoading && (
        <div style={styles.videoLoadingOverlay}>
          <div style={styles.spinner}></div>
          <span style={styles.videoLoadingText}>{t("loadingReel")}</span>
        </div>
      )}

      {isActive && !reel.isDemo && <div style={styles.activeAmbient} />}
      <div style={styles.topFade} />
      <div style={styles.vignette} />
      <div style={styles.bottomGradient} />
      {!reel.isDemo && <div style={styles.nextReelHint} />}

      {/* Video progress bar */}
      {isActive && !reel.isDemo && (
        <div style={styles.videoProgressBar}>
          <div style={{ ...styles.videoProgressFill, width: `${videoProgress * 100}%` }} />
        </div>
      )}

      {/* Double-tap heart + fire bursts */}
      {heartBursts.map((b) => (
        <div key={b.id} style={{ position: "absolute", left: b.x - 40, top: b.y - 40, zIndex: 60, pointerEvents: "none", width: 80, height: 80 }}>
          <span className="heart-burst" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, lineHeight: 1 }}>❤️</span>
          {[...Array(6)].map((_, i) => (
            <span key={i} className={`fire-spark fire-spark-${i}`} style={{ position: "absolute", left: "50%", top: "50%", fontSize: 18, lineHeight: 1 }}>
              {["🔥", "✨", "🔥", "💥", "✨", "🔥"][i]}
            </span>
          ))}
        </div>
      ))}

      {isPvpSource && isActive && !reel.isDemo && (
        <div style={styles.pvpSourceBanner}>
          <span style={styles.pvpSourceIcon}>⚔️</span>
          <span style={styles.pvpSourceText}>{t("pvpChallengeBanner")}</span>
        </div>
      )}

      {isProfileSource && isActive && !reel.isDemo && (
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
                boxShadow: `0 0 0 2px ${RED}, 0 0 0 4px ${goldAlpha(0.35)}`,
              } : {}),
            }}
            onClick={openCreatorProfile}
            aria-label={`Open ${creatorName}'s profile`}
          >
            {creatorPhoto ? (
              <Image src={creatorPhoto} alt={creatorName || "Creator"} width={44} height={44} style={{ objectFit: "cover" }} />
            ) : (
              <span style={styles.creatorAvatarFallback}>{creatorInitial}</span>
            )}
          </button>
          <div style={styles.creatorInfo}>
            <button
              type="button"
              style={{ ...styles.username, cursor: reel.userId ? "pointer" : "default" }}
              onClick={openCreatorProfile}
            >
              @{creatorName}
              {creatorStreakCount >= 5 && (
                <span style={styles.onFireBadge}>{"🔥"}</span>
              )}
            </button>
            {creatorStatLine ? (
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, marginTop: 2, letterSpacing: 0.2 }}>
                {creatorStatLine}
              </div>
            ) : null}
            {gymName ? (
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, marginTop: 1 }}>
                🏋️ {gymName}
              </div>
            ) : null}
          </div>
          {onFollow && reel.userId && reel.userId !== viewerUid && (
            <button
              type="button"
              onClick={() => onFollow(reel.userId)}
              disabled={followLoading}
              style={{
                marginLeft:    "auto",
                flexShrink:    0,
                padding:       "4px 12px",
                borderRadius:  20,
                fontSize:      12,
                fontWeight:    700,
                lineHeight:    "18px",
                border:        isFollowing ? `1px solid ${goldAlpha(0.45)}` : "1px solid rgba(255,255,255,0.75)",
                background:    isFollowing ? goldAlpha(0.1) : "rgba(255,255,255,0.1)",
                color:         isFollowing ? GOLD : "#fff",
                cursor:        followLoading ? "default" : "pointer",
                letterSpacing: 0.2,
                transition:    "all 0.15s",
                opacity:       followLoading ? 0.6 : 1,
              }}
            >
              {followLoading ? t("followLoading") : isFollowing ? t("following") : t("follow")}
            </button>
          )}
        </div>

        {/* Reputation badge */}
        {!reel.isDemo && (() => {
          if (reel.contentType === "challenge_response" && typeof reel.sourceSessionScore === "number" && typeof reel.challengeTargetScore === "number" && reel.sourceSessionScore > reel.challengeTargetScore) {
            return <span style={{ display: "inline-block", marginBottom: 4, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: goldAlpha(0.12), border: `1px solid ${goldAlpha(0.35)}`, color: GOLD, letterSpacing: 0.3 }}>⚔️ {t("repBadgeResponder")}</span>;
          }
          if (reel.contentType === "academy") {
            return <span style={{ display: "inline-block", marginBottom: 4, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", color: "#FCD34D", letterSpacing: 0.3 }}>🎓 {t("repBadgeAcademy")}</span>;
          }
          if (reel.contentType === "training" && typeof reel.sessionScore === "number" && reel.sessionScore >= 8.5) {
            return <span style={{ display: "inline-block", marginBottom: 4, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", color: "#F87171", letterSpacing: 0.3 }}>🌟 {t("repBadgeTopScore")}</span>;
          }
          return null;
        })()}

        {captionText && (
          <button
            type="button"
            style={styles.descriptionLine}
            onClick={() => onCaptionSheet(reel.id)}
            aria-label={t("captionExpand")}
          >
            {captionText}
          </button>
        )}
        {captionText && captionText.length > 60 && (
          <span style={styles.captionMoreHint} onClick={() => onCaptionSheet(reel.id)}>
            {t("captionMore") || "more"}
          </span>
        )}

        {/* Primary CTA */}
        {!reel.isDemo && (showChallengeCta || showAcceptChallengeCta || showLearnCta) && (
          <div style={styles.trainButtonRow}>
            {showChallengeCta && (
              <button type="button" style={styles.tryThisButton} onClick={handleChallengeClick}>
                {t("reelChallenge")}
              </button>
            )}
            {showAcceptChallengeCta && (
              <button type="button" style={{ ...styles.tryThisButton, background: "rgba(167,139,250,0.18)", border: "1px solid rgba(167,139,250,0.4)", color: "#C084FC" }} onClick={handleAcceptChallengeClick}>
                {t("acceptChallenge")}
              </button>
            )}
            {showLearnCta && (
              <button type="button" style={styles.learnButton} onClick={() => onCaptionSheet(reel.id)}>
                {t("reelLearnMore")}
              </button>
            )}
          </div>
        )}

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
          style={{ ...styles.actionItem, ...(isLiked ? styles.actionItemLiked : {}) }}
          onClick={() => onLike(reel.id)}
        >
          <div className="reel-action-circle" style={{ ...styles.actionCircle, ...(isLiked ? styles.actionCircleLiked : {}) }}>
            <span style={{ ...styles.actionIcon, ...(isLiked ? styles.actionIconLiked : {}) }}>
              <LikeIcon filled={isLiked} />
            </span>
          </div>
          <span style={styles.actionText}>{formatCompactCount(getSafeLikeCount(reel))}</span>
        </div>

        <div className="reel-action" style={styles.actionItem} onClick={() => onOpenComments(reel.id)} title={t("comment")}>
          <div className="reel-action-circle" style={styles.actionCircle}>
            <CommentIcon />
          </div>
          <span style={styles.actionText}>{formatCompactCount(getSafeCommentsCount(reel))}</span>
        </div>

        <div className="reel-action" style={styles.actionItem} onClick={() => onShare(reel)} title={t("share") || "Share"}>
          <div className="reel-action-circle" style={styles.actionCircle}>
            <ShareIcon />
          </div>
          <span style={styles.actionText}>{formatCompactCount(reel.shares || 0)}</span>
        </div>

        <div
          className="reel-action"
          role="button"
          title={isSaved ? t("saved") : t("save")}
          style={{ ...styles.actionItem, ...(isSaved ? styles.actionItemSaved : {}) }}
          onClick={() => onSave(reel.id)}
        >
          <div className="reel-action-circle" style={{ ...styles.actionCircle, ...(isSaved ? styles.actionCircleSaved : {}) }}>
            <span style={{ ...styles.actionIcon, ...(isSaved ? styles.actionIconSaved : {}) }}>
              <BookmarkIcon filled={isSaved} />
            </span>
          </div>
        </div>

        {/* AI Insight — single entry point for all AI analysis */}
        <div className="reel-action" style={{ ...styles.actionItem, ...styles.actionItemAI }} onClick={() => onBreakdown(reel)} title="AI Insight">
          <div className="reel-action-circle" style={{ ...styles.actionCircle, ...styles.actionCircleAI }}>
            <AISparkIcon />
          </div>
          <span style={{ ...styles.actionText, ...styles.actionTextAI }}>
            AI
          </span>
        </div>
      </div>

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
