"use client";

import MediaCover from "@/components/MediaCover";
import { getSafeReelLikes } from "@/lib/utils";

export default function ProfileReelsGrid({
  visibleReels,
  previewFailures,
  deletingReelIds,
  isOwnProfile,
  profileTab,
  userId,
  locale,
  router,
  user,
  styles,
  t,
  markPreviewFailed,
  setDeleteConfirmReel,
}) {
  if (visibleReels.length === 0) {
    return (
      <div style={styles.reelGridEmpty}>
        <div style={styles.reelGridEmptyIcon}>🥊</div>
        <p style={styles.reelGridEmptyTitle}>
          {profileTab === "saved" ? t("noSavedReelsYet") : t("noReelsYet")}
        </p>
        <p style={styles.reelGridEmptyText}>
          {profileTab === "saved" ? t("bookmarkedReelsEmpty") : t("trainingClipsEmpty")}
        </p>
        {profileTab !== "saved" && isOwnProfile && (
          <button
            type="button"
            style={styles.reelGridEmptyCta}
            onClick={() => router.push(`/${locale}/upload`)}
          >
            {t("uploadFirstReel")}
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {visibleReels.map((reel) => {
        const imageFailed = previewFailures[`${reel.id}:image`];
        const videoFailed = previewFailures[`${reel.id}:video`];
        const showImage = reel.thumbnailUrl && !imageFailed;
        const showVideo = !showImage && reel.videoUrl && !videoFailed;
        const likeCount = getSafeReelLikes(reel);
        const canDeleteReel = user?.uid && reel.userId === user.uid;
        const isDeletingReel = deletingReelIds.has(reel.id);
        const effectiveType = reel.contentType || reel.type || "lifestyle";

        return (
          <div
            key={reel.id}
            className="profile-reel-tile"
            style={{
              aspectRatio: "9/16",
              overflow: "hidden",
              background: "#0a0a0a",
              cursor: "pointer",
              position: "relative",
              borderRadius: 2,
            }}
            onClick={() => router.push(`/${locale}/reels?reelId=${reel.id}&source=profile&userId=${userId}`)}
            onMouseEnter={(e) => {
              const video = e.currentTarget.querySelector("video");
              if (video) video.play().catch(() => {});
            }}
            onMouseLeave={(e) => {
              const video = e.currentTarget.querySelector("video");
              if (video) { video.pause(); video.currentTime = 0; }
            }}
          >
            {showImage ? (
              <img
                src={reel.thumbnailUrl}
                alt={reel.description || t("trainingReel")}
                className="profile-reel-media"
                style={styles.reelPreviewMedia}
                loading="lazy"
                onError={() => markPreviewFailed(reel.id, "image")}
              />
            ) : showVideo ? (
              <video
                src={reel.videoUrl}
                className="profile-reel-media"
                style={styles.reelPreviewMedia}
                muted
                playsInline
                loop
                preload="metadata"
                poster={reel.thumbnailUrl || undefined}
                onLoadedMetadata={(event) => {
                  try {
                    if (event.currentTarget.currentTime === 0) {
                      event.currentTarget.currentTime = 0.05;
                    }
                  } catch {
                    // Some mobile browsers do not allow seeking before enough data is ready.
                  }
                }}
                onError={() => markPreviewFailed(reel.id, "video")}
              />
            ) : (
              <MediaCover
                contentType={effectiveType}
                caption={reel.description || reel.caption}
                style={{ position: "absolute", inset: 0 }}
              />
            )}

            {showVideo && (
              <div className="reel-play-hint">
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            )}

            <div style={styles.reelTileTypeBadge}>
              {effectiveType === "training" ? "🥊" : effectiveType === "educational" ? "📚" : "🎬"}
            </div>

            {canDeleteReel && (
              <button
                type="button"
                aria-label={t("deleteReel")}
                title={t("deleteReel")}
                onClick={(event) => { event.stopPropagation(); if (!isDeletingReel) setDeleteConfirmReel(reel); }}
                disabled={isDeletingReel}
                style={{
                  ...styles.deleteReelButton,
                  opacity: isDeletingReel ? 0.55 : 1,
                  cursor: isDeletingReel ? "not-allowed" : "pointer",
                }}
              >
                {isDeletingReel
                  ? <span style={{ fontSize: 11, fontWeight: 900 }}>...</span>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                }
              </button>
            )}

            <div style={styles.reelTileOverlay}>
              <div style={styles.reelTileLikes}>♥ {likeCount}</div>
              {reel.description && (
                <div style={styles.reelTileCaption}>{reel.description}</div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
