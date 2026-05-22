"use client";

import { useState, memo } from "react";
import FighterPortrait from "@/components/FighterPortrait";
import MediaCover from "@/components/MediaCover";
import { RED, GOLD } from "@/lib/tokens";
import { s, feed } from "@/components/discover/discoverStyles";
import { formatCompact, formatAgo } from "@/lib/utils";
import { cleanCaption } from "@/lib/reelHelpers";
import Image from "next/image";

const fs = {
  card: {
    flexShrink: 0,
    width: 128,
    background: "transparent",
    border: "none",
    borderRadius: 14,
    overflow: "hidden",
    cursor: "pointer",
    textAlign: "left",
    padding: 0,
  },
};

export function FighterStudyCard({ fighter, onClick }) {
  const acc = fighter.accent;
  return (
    <button type="button" onClick={onClick} style={fs.card}>
      <FighterPortrait
        fighterId={fighter.id}
        fighter={fighter}
        height={88}
        flagSize={36}
        showName
        showLabel
      />
    </button>
  );
}

export function reelMatchesKeywords(reel, keywords) {
  const text = [
    reel.category || "",
    reel.caption || "",
    reel.description || "",
    reel.contentType || "",
    reel.type || "",
  ].join(" ").toLowerCase();
  return keywords.some((k) => text.includes(k.toLowerCase()));
}

const ReelCard = memo(function ReelCard({ reel, onClick }) {
  const [mediaErr, setMediaErr] = useState(false);
  const src = reel.thumbnailUrl || reel.thumbnail || reel.coverUrl || reel.videoUrl || "";
  const typeEmoji = reel.contentType === "educational" ? "📚" : reel.contentType === "lifestyle" ? "🎬" : "🥊";
  const typeColor = reel.contentType === "educational" ? GOLD : reel.contentType === "lifestyle" ? "#60A5FA" : RED;
  const caption = cleanCaption(reel.caption || reel.description || reel.title || "");
  const views = formatCompact(reel.views || 0);

  return (
    <button type="button" onClick={onClick} style={s.reelCard}>
      <div style={s.reelThumbWrap}>
        {src && !mediaErr ? (
          <video
            src={src}
            style={s.reelThumbImg}
            preload="metadata"
            muted
            playsInline
            onError={() => setMediaErr(true)}
          />
        ) : (
          <MediaCover
            contentType={reel.contentType}
            category={reel.category}
            caption={caption}
            style={{ position: "absolute", inset: 0 }}
          />
        )}
        <div style={s.reelGradTop} />
        <div style={s.reelGradBottom} />
        <span style={s.reelTypeBadge}>{typeEmoji}</span>
        {reel.views > 0 && (
          <span style={s.reelViews}>{views}</span>
        )}
        {caption && (
          <p style={s.reelCaptionOverlay}>{caption}</p>
        )}
      </div>
    </button>
  );
});
export { ReelCard };

export function ReelRow({ reels, router, locale, loading }) {
  if (loading) {
    return (
      <div style={s.reelScroll}>
        {[1, 2, 3, 4].map((i) => <div key={i} className="shimmer" style={s.shimmerCard} />)}
      </div>
    );
  }
  if (!reels?.length) return null;
  return (
    <div style={s.reelScroll}>
      {reels.slice(0, 10).map((reel) => (
        <ReelCard
          key={reel.id}
          reel={reel}
          onClick={() => router.push(`/${locale}/reels?reelId=${reel.id}`)}
        />
      ))}
    </div>
  );
}

export function HubCard({ emoji, title, accent, expanded, onToggle, children }) {
  return (
    <div style={s.hubWrap}>
      <button type="button" style={{ ...s.hubRow, background: expanded ? "rgba(255,255,255,0.02)" : "none" }} onClick={onToggle}>
        <div style={s.hubLeft}>
          <span style={{ ...s.hubEmoji, background: accent + "18", color: accent }}>{emoji}</span>
          <span style={s.hubTitle}>{title}</span>
        </div>
        <svg style={{ ...s.hubChevron, transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }} viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {expanded && <div style={s.hubBody}>{children}</div>}
    </div>
  );
}

const FeedPostCard = memo(function FeedPostCard({ reel, authorUser, t, router, locale }) {
  const [mediaErr, setMediaErr] = useState(false);
  const src = reel.thumbnailUrl || reel.thumbnail || reel.videoUrl || "";
  const typeEmoji = reel.contentType === "educational" ? "📚" : reel.contentType === "lifestyle" ? "🎬" : "🥊";
  const caption = cleanCaption(reel.caption || reel.description || "");
  const name = authorUser?.displayName || authorUser?.username || t("fallbackFighter");
  const photo = authorUser?.photoURL || authorUser?.profileImageUrl || "";

  return (
    <div style={feed.card}>
      <div style={feed.cardHeader}>
        <div style={feed.avatar} onClick={() => router.push(`/${locale}/profile/${reel.userId}`)}>
          {photo
            ? <Image src={photo} alt="" width={38} height={38} style={{ objectFit: "cover" }} />
            : <span style={feed.avatarInitial}>{name[0]?.toUpperCase()}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={feed.authorName}>{name}</p>
          <p style={feed.timeAgo}>{formatAgo(reel.createdAt, locale)}</p>
        </div>
        <span style={{ ...feed.typeBadge, color: reel.contentType === "educational" ? GOLD : reel.contentType === "lifestyle" ? "#60A5FA" : RED }}>
          {typeEmoji}
        </span>
      </div>
      <div style={feed.thumb} onClick={() => router.push(`/${locale}/reels?reelId=${reel.id}`)}>
        {src && !mediaErr ? (
          <video src={src} style={feed.thumbMedia} preload="metadata" muted playsInline onError={() => setMediaErr(true)} />
        ) : (
          <MediaCover contentType={reel.contentType} caption={caption} style={{ position: "absolute", inset: 0 }} />
        )}
        <div style={feed.thumbGrad} />
        {caption ? <p style={feed.thumbCaption}>{caption}</p> : null}
      </div>
      <div style={feed.cardFooter}>
        <span style={feed.likes}>❤️ {formatCompact(reel.likes || reel.likesCount || 0)}</span>
        <button type="button" style={feed.watchBtn} onClick={() => router.push(`/${locale}/reels?reelId=${reel.id}`)}>
          {t("discoverWatch")}
        </button>
      </div>
    </div>
  );
});
export { FeedPostCard };
