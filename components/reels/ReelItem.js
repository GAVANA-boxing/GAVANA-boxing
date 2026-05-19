"use client";

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

let _db = null;
async function getFirebase() {
  if (!_db) {
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
    _db = getFirestore(app);
  }
  return { db: _db };
}

export default function ReelItem({
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
  setVideoProgress,
}) {
  const isActive = index === currentIndex;

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
  const isEducational = effectiveType === "educational";
  const showChallengeCta = isChallenge || reel.challengeEnabled;
  const showLearnCta = isEducational && !reel.challengeEnabled;

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

      <div style={styles.vignette} />
      <div style={styles.bottomGradient} />

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
                boxShadow: `0 0 0 2px #C1121F, 0 0 0 4px ${goldAlpha(0.35)}`,
              } : {}),
            }}
            onClick={openCreatorProfile}
            aria-label={`Open ${creatorName}'s profile`}
          >
            {creatorPhoto ? (
              <Image src={creatorPhoto} alt="" width={44} height={44} style={{ objectFit: "cover" }} />
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
        </div>

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

        {/* Primary CTA */}
        {!reel.isDemo && (showChallengeCta || showLearnCta) && (
          <div style={styles.trainButtonRow}>
            {showChallengeCta && (
              <button type="button" style={styles.tryThisButton} onClick={handleChallengeClick}>
                {t("reelChallenge")}
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

        <div className="reel-action" style={styles.actionItem} onClick={() => onGetFeedback(reel)} title={t("getAiFeedback")}>
          <div className="reel-action-circle" style={styles.actionCircle}>
            <RobotIcon />
          </div>
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.95)", textAlign: "center", lineHeight: 1.2 }}>
            AI
          </span>
        </div>

        <div className="reel-action" style={styles.actionItem} onClick={() => onBreakdown(reel)} title={t("aiBreakdownBtn")}>
          <div className="reel-action-circle" style={styles.actionCircle}>
            <AISparkIcon />
          </div>
          <span style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.95)", textAlign: "center", lineHeight: 1.2, maxWidth: 40 }}>
            {currentLocale === "mn" ? "Шинж" : currentLocale === "ko" ? "분석" : "Breakdown"}
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
}
