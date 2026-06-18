"use client";

import { blackAlpha } from "@/lib/tokens";
import { memo, useState } from "react";
import MediaCover from "@/components/MediaCover";
import { getSafeReelLikes } from "@/lib/utils";
import Image from "next/image";
import styles from "@/components/profile/profilePageStyles";

const ProfileReelsGrid = memo(function ProfileReelsGrid({
  visibleReels,
  previewFailures,
  deletingReelIds,
  isOwnProfile,
  profileTab,
  userId,
  locale,
  router,
  user,
  t,
  markPreviewFailed,
  setDeleteConfirmReel,
}) {
  const [hoveredId, setHoveredId] = useState(null);

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
        const isVideoSrc = (u) => { const p = (u || "").split("?")[0].toLowerCase(); return p.endsWith(".mp4") || p.endsWith(".mov") || p.endsWith(".webm"); };
        const showImage = reel.thumbnailUrl && !imageFailed && !isVideoSrc(reel.thumbnailUrl);
        const showVideo = !showImage && reel.videoUrl && !videoFailed;
        const likeCount = getSafeReelLikes(reel);
        const canDeleteReel = user?.uid && reel.userId === user.uid;
        const isDeletingReel = deletingReelIds.has(reel.id);
        const effectiveType = reel.contentType || reel.type || "lifestyle";
        const isHovered = hoveredId === reel.id;

        return (
          <div
            key={reel.id}
            style={{
              aspectRatio: "1/1",
              overflow: "hidden",
              background: "#0a0a0a",
              cursor: "pointer",
              position: "relative",
            }}
            onClick={() => router.push(`/${locale}/reels?reelId=${reel.id}&source=profile&userId=${userId}`)}
            onMouseEnter={() => {
              setHoveredId(reel.id);
              const video = document.querySelector(`[data-reel-id="${reel.id}"] video`);
              if (video) video.play().catch(() => {});
            }}
            onMouseLeave={() => {
              setHoveredId(null);
              const video = document.querySelector(`[data-reel-id="${reel.id}"] video`);
              if (video) { video.pause(); video.currentTime = 0; }
            }}
            data-reel-id={reel.id}
          >
            {showImage ? (
              <Image
                src={reel.thumbnailUrl}
                alt={reel.description || t("trainingReel")}
                fill
                style={{ objectFit: "cover" }}
                sizes="33vw"
                onError={() => markPreviewFailed(reel.id, "image")}
              />
            ) : showVideo ? (
              <video
                src={reel.videoUrl}
                style={styles.reelPreviewMedia}
                muted
                playsInline
                loop
                preload="metadata"
                poster={reel.thumbnailUrl || undefined}
                onLoadedMetadata={(e) => {
                  try { if (e.currentTarget.currentTime === 0) e.currentTarget.currentTime = 0.05; } catch {}
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

            {/* Instagram-style hover overlay: centered likes + comments */}
            <div style={{
              position: "absolute", inset: 0, zIndex: 3,
              background: blackAlpha(isHovered ? 0.38 : 0),
              display: "flex", alignItems: "center", justifyContent: "center", gap: 20,
              transition: "background 180ms",
              pointerEvents: "none",
            }}>
              {isHovered && (
                <>
                  <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M20.8 4.9c-2-2-5.2-1.8-7 .4L12 7.1l-1.8-1.8c-1.8-2.2-5-2.4-7-.4-2.2 2.2-2 5.7.4 8.1l8.4 7.8 8.4-7.8c2.4-2.4 2.6-5.9.4-8.1Z"/></svg>
                    {likeCount}
                  </span>
                  <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M4.8 5.4h14.4v10.1H9.5L5 19.2v-3.7H4.8V5.4Z"/></svg>
                    {reel.commentsCount ?? 0}
                  </span>
                </>
              )}
            </div>

            {/* Multi-photo/video indicator — small icon top-right like Instagram */}
            {showVideo && !isHovered && (
              <div style={{ position: "absolute", top: 8, right: 8, zIndex: 4, pointerEvents: "none" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.9))" }}>
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            )}

            {canDeleteReel && (
              <button
                type="button"
                aria-label={t("deleteReel")}
                onClick={(e) => { e.stopPropagation(); if (!isDeletingReel) setDeleteConfirmReel(reel); }}
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
          </div>
        );
      })}
    </>
  );
});
export default ProfileReelsGrid;
