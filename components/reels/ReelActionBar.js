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
import { RED, GOLD, goldAlpha, whiteAlpha } from "@/lib/tokens";

// ─── Chrome-free action rail (feed redesign) ──────────────────────────────────
// Icons float directly over the clip: no glass pill, no filled circles. The AI
// "Breakdown" is set apart at the top as GAVANA's signature function; like,
// comment, share and save share one uniform size and style below it.
const COND = "var(--font-condensed, 'Barlow Condensed', sans-serif)";

const S = {
  rail: {
    position: "absolute",
    right: "max(12px, env(safe-area-inset-right))",
    bottom: "calc(104px + env(safe-area-inset-bottom))",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    zIndex: 5,
    animation: "fadeScale 220ms ease both",
  },
  // AI — the signature function, deliberately distinct
  aiItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", marginBottom: 2, WebkitTapHighlightColor: "transparent" },
  aiCap: {
    width: 50, height: 50, borderRadius: 16, display: "grid", placeItems: "center",
    background: `radial-gradient(120% 120% at 50% 20%, ${goldAlpha(0.28)}, ${goldAlpha(0.1)})`,
    border: `1.5px solid ${goldAlpha(0.7)}`,
    boxShadow: `0 0 22px ${goldAlpha(0.35)}, inset 0 1px 0 rgba(255,255,255,0.18)`,
    color: GOLD,
  },
  aiIcon: { display: "flex", transform: "scale(1.3)", color: GOLD },
  aiLabel: { fontFamily: COND, fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: GOLD, textShadow: "0 1px 3px rgba(0,0,0,0.6)" },
  divider: { width: 26, height: 1, background: whiteAlpha(0.14) },
  // uniform actions
  act: { display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer", color: "#fff", WebkitTapHighlightColor: "transparent" },
  icon: { display: "flex", transform: "scale(1.38)", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" },
  count: { fontFamily: COND, fontWeight: 700, fontSize: 13, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.7)", letterSpacing: 0.3 },
};

/**
 * ReelActionBar — the vertical column of action buttons on the right of a reel.
 * AI breakdown (top, distinct), then like, comment, share, save.
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
    <div style={S.rail}>
      {/* AI Breakdown — signature function */}
      <div
        className="tap-target"
        role="button"
        aria-label={t("feedAiAnalyze") || "AI breakdown"}
        style={S.aiItem}
        onClick={() => onBreakdown(reel)}
      >
        <div style={S.aiCap}>
          <span style={S.aiIcon}><AISparkIcon /></span>
        </div>
        <span style={S.aiLabel}>{t("feedAiAnalyze") || "AI"}</span>
      </div>

      <div style={S.divider} />

      {/* Like */}
      <div
        className="tap-target"
        role="button"
        aria-label={isLiked ? t("liked") || "Unlike" : t("like") || "Like"}
        aria-pressed={isLiked}
        style={{ ...S.act, color: isLiked ? RED : "#fff", animation: isLiked ? "likePop 340ms ease" : undefined }}
        onClick={() => onLike(reel.id)}
      >
        <span style={S.icon}><GloveIcon filled={isLiked} /></span>
        <span style={{ ...S.count, color: isLiked ? RED : "#fff" }}>{formatCompactCount(getSafeLikeCount(reel))}</span>
      </div>

      {/* Comment */}
      <div
        className="tap-target"
        role="button"
        aria-label={t("comment") || "Comments"}
        style={S.act}
        onClick={() => onOpenComments(reel.id)}
      >
        <span style={S.icon}><CommentIcon /></span>
        <span style={S.count}>{formatCompactCount(getSafeCommentsCount(reel))}</span>
      </div>

      {/* Share */}
      <div
        className="tap-target"
        role="button"
        aria-label={t("share") || "Share"}
        style={S.act}
        onClick={() => onShare(reel)}
      >
        <span style={S.icon}><ShareIcon /></span>
        <span style={S.count}>{formatCompactCount(reel.shares || 0)}</span>
      </div>

      {/* Save / Bookmark */}
      <div
        className="tap-target"
        role="button"
        aria-label={isSaved ? t("saved") || "Saved" : t("save") || "Save"}
        aria-pressed={isSaved}
        style={{ ...S.act, color: isSaved ? GOLD : "#fff", animation: isSaved ? "likePop 340ms ease" : undefined }}
        onClick={() => onSave(reel.id)}
      >
        <span style={S.icon}><BookmarkIcon filled={isSaved} /></span>
      </div>
    </div>
  );
}
