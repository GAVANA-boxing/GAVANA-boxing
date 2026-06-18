"use client";

import Image from "next/image";
import { RED, GOLD, goldAlpha } from "@/lib/tokens";
import styles from "@/components/reels/reelStyles";

/**
 * ReelCreatorRow
 * Avatar, display name (with on-fire badge), stat line, gym tag,
 * and the optional follow button.
 */
export default function ReelCreatorRow({
  reel,
  creatorName,
  creatorPhoto,
  creatorInitial,
  creatorStatLine,
  creatorStreakCount,
  gymName,
  hasStory,
  isFollowing,
  followLoading,
  onFollow,
  viewerUid,
  onOpenCreatorProfile,
  t,
}) {

  return (
    <div style={styles.creatorRow}>
      {/* Avatar */}
      <button
        type="button"
        style={{
          ...styles.creatorAvatarButton,
          cursor: reel.userId ? "pointer" : "default",
          ...(hasStory
            ? {
                borderColor: RED,
                boxShadow: `0 0 0 2px ${RED}, 0 0 0 4px ${goldAlpha(0.35)}`,
              }
            : {}),
        }}
        onClick={onOpenCreatorProfile}
        aria-label={`Open ${creatorName}'s profile`}
      >
        {creatorPhoto ? (
          <Image
            src={creatorPhoto}
            alt={creatorName || "Creator"}
            width={44}
            height={44}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <span style={styles.creatorAvatarFallback}>{creatorInitial}</span>
        )}
      </button>

      {/* Name + stats */}
      <div style={styles.creatorInfo}>
        <button
          type="button"
          style={{ ...styles.username, cursor: reel.userId ? "pointer" : "default" }}
          onClick={onOpenCreatorProfile}
        >
          @{creatorName}
          {creatorStreakCount >= 5 && (
            <span style={styles.onFireBadge}>{"🔥"}</span>
          )}
        </button>
        {creatorStatLine ? (
          <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
            {creatorStatLine.split(" · ").map((part, i) => {
              const isXP = part.includes("XP");
              const isScore = part.includes("/10");
              return (
                <span
                  key={i}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    whiteSpace: "nowrap",
                    padding: "1px 7px",
                    borderRadius: 20,
                    background: "rgba(0,0,0,0.48)",
                    border: isXP
                      ? "1px solid rgba(255,200,0,0.22)"
                      : "1px solid rgba(255,255,255,0.1)",
                    color: isXP
                      ? "rgba(255,200,0,0.9)"
                      : isScore
                      ? "rgba(255,255,255,0.82)"
                      : "rgba(255,185,80,0.82)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    textShadow: "0 1px 4px rgba(0,0,0,0.95)",
                  }}
                >
                  {part}
                </span>
              );
            })}
          </div>
        ) : null}
        {gymName ? (
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              fontWeight: 600,
              marginTop: 1,
            }}
          >
            🏋️ {gymName}
          </div>
        ) : null}
      </div>

      {/* Follow button — only on /feed */}
      {onFollow && reel.userId && reel.userId !== viewerUid && (
        <button
          type="button"
          onClick={() => onFollow(reel.userId)}
          disabled={followLoading}
          style={{
            marginLeft: "auto",
            flexShrink: 0,
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            lineHeight: "18px",
            border: isFollowing
              ? `1px solid ${goldAlpha(0.45)}`
              : "1px solid rgba(255,255,255,0.75)",
            background: isFollowing ? goldAlpha(0.1) : "rgba(255,255,255,0.1)",
            color: isFollowing ? GOLD : "#fff",
            cursor: followLoading ? "default" : "pointer",
            letterSpacing: 0.2,
            transition: "all 0.15s",
            opacity: followLoading ? 0.6 : 1,
          }}
        >
          {followLoading
            ? t("followLoading")
            : isFollowing
            ? t("following")
            : t("follow")}
        </button>
      )}
    </div>
  );
}
