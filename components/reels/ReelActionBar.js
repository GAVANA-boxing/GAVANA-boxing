"use client";

import {
  GloveIcon,
  CommentIcon,
  ShareIcon,
  BookmarkIcon,
  AISparkIcon,
} from "@/components/reels/ReelIcons";
import {
  getSafeLikeCount,
  getSafeCommentsCount,
  formatCompactCount,
} from "@/lib/reelHelpers";
import styles from "@/components/reels/reelStyles";

/**
 * ReelActionBar
 * The vertical column of action buttons on the right side:
 * like, comment, share, save/bookmark, AI insight.
 */
export default function ReelActionBar({
  reel,
  isLiked,
  isSaved,
  onLike,
  onOpenComments,
  onShare,
  onSave,
  onBreakdown,
  t,
}) {
  return (
    <div style={styles.actions}>
      {/* Like */}
      <div
        className="reel-action tap-target"
        role="button"
        aria-label={isLiked ? t("liked") || "Unlike" : t("like") || "Like"}
        aria-pressed={isLiked}
        style={{ ...styles.actionItem, ...(isLiked ? styles.actionItemLiked : {}) }}
        onClick={() => onLike(reel.id)}
      >
        <div
          className="reel-action-circle"
          style={{ ...styles.actionCircle, ...(isLiked ? styles.actionCircleLiked : {}) }}
        >
          <span style={{ ...styles.actionIcon, ...(isLiked ? styles.actionIconLiked : {}) }}>
            <GloveIcon filled={isLiked} />
          </span>
        </div>
        <span style={styles.actionText}>{formatCompactCount(getSafeLikeCount(reel))}</span>
      </div>

      {/* Comment */}
      <div
        className="reel-action tap-target"
        role="button"
        aria-label={t("comment") || "Comments"}
        style={styles.actionItem}
        onClick={() => onOpenComments(reel.id)}
      >
        <div className="reel-action-circle" style={styles.actionCircle}>
          <CommentIcon />
        </div>
        <span style={styles.actionText}>{formatCompactCount(getSafeCommentsCount(reel))}</span>
      </div>

      {/* Share */}
      <div
        className="reel-action tap-target"
        role="button"
        aria-label={t("share") || "Share"}
        style={styles.actionItem}
        onClick={() => onShare(reel)}
      >
        <div className="reel-action-circle" style={styles.actionCircle}>
          <ShareIcon />
        </div>
        <span style={styles.actionText}>{formatCompactCount(reel.shares || 0)}</span>
      </div>

      {/* Save / Bookmark */}
      <div
        className="reel-action tap-target"
        role="button"
        aria-label={isSaved ? t("saved") || "Saved" : t("save") || "Save"}
        aria-pressed={isSaved}
        style={{ ...styles.actionItem, ...(isSaved ? styles.actionItemSaved : {}) }}
        onClick={() => onSave(reel.id)}
      >
        <div
          className="reel-action-circle"
          style={{ ...styles.actionCircle, ...(isSaved ? styles.actionCircleSaved : {}) }}
        >
          <span style={{ ...styles.actionIcon, ...(isSaved ? styles.actionIconSaved : {}) }}>
            <BookmarkIcon filled={isSaved} />
          </span>
        </div>
      </div>

      {/* AI Insight */}
      <div
        className="reel-action tap-target"
        role="button"
        aria-label="AI Insight"
        style={{ ...styles.actionItem, ...styles.actionItemAI }}
        onClick={() => onBreakdown(reel)}
      >
        <div
          className="reel-action-circle"
          style={{ ...styles.actionCircle, ...styles.actionCircleAI }}
        >
          <AISparkIcon />
        </div>
        <span style={{ ...styles.actionText, ...styles.actionTextAI }}>AI</span>
      </div>
    </div>
  );
}
