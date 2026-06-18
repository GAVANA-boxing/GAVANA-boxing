"use client";

import styles from "@/components/reels/reelStyles";

/**
 * ReelVideoPlayer
 * Renders the video element (or demo/fallback visual), the loading spinner,
 * ambient glow, gradient overlays, and the progress bar.
 */
export default function ReelVideoPlayer({
  reel,
  index,
  currentIndex,
  videoRefs,
  isActive,
  soundEnabled,
  hasVideoError,
  isVideoLoading,
  videoProgress,
  onVideoClick,
  onVideoLoadStart,
  onVideoLoaded,
  onVideoError,
  setVideoProgress,
  router,
  currentLocale,
  t,
  // visual slot components injected by parent so this file stays icon-free
  DemoReelVisual,
  ReelFallbackVisual,
}) {
  return (
    <>
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

      {/* Loading spinner */}
      {!reel.isDemo && !hasVideoError && isVideoLoading && (
        <div style={styles.videoLoadingOverlay}>
          <div style={styles.spinner}></div>
          <span style={styles.videoLoadingText}>{t("loadingReel")}</span>
        </div>
      )}

      {/* Ambient glow + gradient overlays */}
      {isActive && !reel.isDemo && <div style={styles.activeAmbient} />}
      <div style={styles.topFade} />
      <div style={styles.vignette} />
      <div style={styles.bottomGradient} />
      {!reel.isDemo && <div style={styles.nextReelHint} />}

      {/* Progress bar */}
      {isActive && !reel.isDemo && (
        <div style={styles.videoProgressBar}>
          <div style={{ ...styles.videoProgressFill, width: `${videoProgress * 100}%` }} />
        </div>
      )}
    </>
  );
}
