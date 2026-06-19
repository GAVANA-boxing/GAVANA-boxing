"use client";

import { useCallback, useRef, useState } from "react";
import ReelItem from "@/components/reels/ReelItem";
import { getCreatorName, cleanCaption } from "@/lib/reelHelpers";
import { loc } from "@/lib/loc";

const ARCH_COLORS = {
  pressure:   "#EF4444",
  outboxer:   "#3B82F6",
  counter:    "#8B5CF6",
  explosive:  "#F59E0B",
  technician: "#10B981",
};

/**
 * DnaMatchBadge
 *
 * Absolute-positioned badge overlaid on a reel card when the reel matches the
 * viewer's archetype keywords.
 */
function DnaMatchBadge({ locale, userArchetype }) {
  const color = ARCH_COLORS[userArchetype] || "#EF4444";
  return (
    <div style={{
      position: "absolute",
      top: 56,
      left: 12,
      zIndex: 40,
      padding: "3px 10px",
      borderRadius: 12,
      background: `${color}22`,
      border: `1px solid ${color}55`,
      color,
      fontSize: 10,
      fontWeight: 900,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      backdropFilter: "blur(8px)",
      pointerEvents: "none",
    }}>
      🧬 {loc(locale, "Таны стиль", "내 스타일", "Your Style")}
    </div>
  );
}

/**
 * FeedScrollContainer
 *
 * The full-screen scroll-snapping list of reel cards.
 *
 * Props:
 *   containerRef       – ref forwarded to the outer scroll div
 *   cardRefs           – ref<Map> used by the IntersectionObserver in FeedPage
 *   observerRef        – ref to the IntersectionObserver instance
 *   filteredReels      – array of reel objects to render
 *   currentIndex       – index of the currently visible reel
 *   soundEnabled       – boolean
 *   videoErrors        – { [reelId]: boolean }
 *   videoLoading       – { [reelId]: boolean }
 *   videoProgress      – { [reelId]: number }
 *   userLikes          – Set<reelId>
 *   savedReels         – Set<reelId>
 *   userArchetype      – string | null
 *   activeFilter       – string
 *   myStyleKeywords    – string[]
 *   locale             – "mn" | "ko" | "en"
 *   t                  – translate fn
 *   router             – Next.js router
 *   user               – auth user object | null
 *   followingSet       – Set<userId>
 *   loadingSet         – Set<userId>
 *   noop               – () => void  (stable no-op callback)
 *   reelItemRefs       – ref<{}>
 *   videoRefs          – ref<{}>
 *   onLike             – (reel) => void
 *   onOpenComments     – (reel) => void
 *   onShare            – (reel) => void
 *   onSave             – (reel) => void
 *   onBreakdown        – (reel) => void
 *   onCaptionSheet     – (reelId) => void
 *   onReport           – (reel) => void
 *   onFollow           – (userId) => void
 *   onVideoLoadStart   – (reelId) => void
 *   onVideoLoaded      – (reelId) => void
 *   onVideoError       – (reelId) => void
 *   setVideoProgress   – (reelId, progress) => void
 */
export default function FeedScrollContainer({
  containerRef,
  cardRefs,
  observerRef,
  filteredReels,
  currentIndex,
  soundEnabled,
  videoErrors,
  videoLoading,
  videoProgress,
  userLikes,
  savedReels,
  userArchetype,
  activeFilter,
  myStyleKeywords,
  locale,
  t,
  router,
  user,
  followingSet,
  loadingSet,
  noop,
  reelItemRefs,
  videoRefs,
  onLike,
  onOpenComments,
  onShare,
  onSave,
  onBreakdown,
  onCaptionSheet,
  onReport,
  onFollow,
  onVideoLoadStart,
  onVideoLoaded,
  onVideoError,
  setVideoProgress,
}) {
  const lastTapRef   = useRef({});
  const tapCountRef  = useRef({});
  const tapTimerRef  = useRef({});
  const [punchBursts, setPunchBursts] = useState([]);
  const [respectFloats, setRespectFloats] = useState([]);

  const handleCardTap = useCallback((e, reelId, onLikeFn, reel) => {
    const now  = Date.now();
    const last = lastTapRef.current[reelId] || 0;
    const gap  = now - last;

    if (gap < 320) {
      const rect    = e.currentTarget.getBoundingClientRect();
      const clientX = e.touches?.[0]?.clientX ?? e.clientX;
      const clientY = e.touches?.[0]?.clientY ?? e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      tapCountRef.current[reelId] = (tapCountRef.current[reelId] || 1) + 1;
      clearTimeout(tapTimerRef.current[reelId]);
      tapTimerRef.current[reelId] = setTimeout(() => {
        tapCountRef.current[reelId] = 0;
      }, 900);

      const count = tapCountRef.current[reelId];
      const tier  = count >= 5 ? 3 : count >= 3 ? 2 : 1;
      const emoji = tier === 3 ? "⚡" : tier === 2 ? "🔥" : "🥊";
      const cls   = tier === 3 ? "ko-burst" : tier === 2 ? "combo-burst" : "punch-burst";
      const id    = now + Math.random();

      setPunchBursts((prev) => [...prev, { id, reelId, x, y, emoji, cls }]);
      setTimeout(() => setPunchBursts((prev) => prev.filter((b) => b.id !== id)), 800);

      // Like fires immediately on first double-tap (count===2); subsequent taps just burst
      if (onLikeFn && count === 2) onLikeFn(reel);

      // +RESPECT float delayed 120ms so it doesn't overlap the burst sprite
      const fid = id + 0.5;
      setTimeout(() => {
        setRespectFloats((prev) => [...prev, { id: fid, reelId, x, y }]);
        setTimeout(() => setRespectFloats((prev) => prev.filter((f) => f.id !== fid)), 850);
      }, 120);
    }
    lastTapRef.current[reelId] = now;
  }, []);

  return (
    <div
      ref={containerRef}
      className="no-scrollbar"
      style={{
        height:                  "100dvh",
        overflowY:               "scroll",
        scrollSnapType:          "y mandatory",
        WebkitOverflowScrolling: "touch",
        display:                 "flex",
        flexDirection:           "column",
        background:              "#000",
        position:                "relative",
      }}
    >
      {filteredReels.map((reel, index) => {
        const name    = getCreatorName(reel, null);
        const initial = (name || "?").charAt(0).toUpperCase();
        const photo   = reel.userPhotoURL || reel.profileImageUrl || "";
        const caption = cleanCaption(reel.caption || reel.description || "");

        const showDnaBadge =
          userArchetype &&
          activeFilter === "style" &&
          (() => {
            const text = ((reel.caption || "") + " " + (reel.description || "") + " " + (reel.tags?.join(" ") || "")).toLowerCase();
            return myStyleKeywords.some((kw) => text.includes(kw));
          })();

        const cardBursts    = punchBursts.filter((b) => b.reelId === reel.id);
        const cardRespects  = respectFloats.filter((f) => f.reelId === reel.id);

        return (
          <div
            key={reel.id}
            data-index={index}
            style={{ flexShrink: 0, scrollSnapAlign: "start", scrollSnapStop: "always", position: "relative" }}
            ref={(el) => {
              if (el) {
                cardRefs.current.set(index, el);
                observerRef.current?.observe(el);
              } else {
                cardRefs.current.delete(index);
              }
            }}
            onClick={(e) => handleCardTap(e, reel.id, onLike, reel)}
            onTouchEnd={(e) => handleCardTap(e, reel.id, onLike, reel)}
          >
            {showDnaBadge && (
              <DnaMatchBadge locale={locale} userArchetype={userArchetype} />
            )}
            {cardBursts.map((b) => (
              <span
                key={b.id}
                className={b.cls || "punch-burst"}
                style={{
                  position: "absolute",
                  left: b.x,
                  top: b.y,
                  zIndex: 60,
                  fontSize: b.cls === "ko-burst" ? 76 : b.cls === "combo-burst" ? 72 : 68,
                  lineHeight: 1,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {b.emoji || "🥊"}
              </span>
            ))}
            {cardRespects.map((f) => (
              <span
                key={f.id}
                className="respect-float"
                style={{ left: f.x, top: f.y }}
              >
                +RESPECT
              </span>
            ))}
            <ReelItem
              reel={reel}
              index={index}
              currentIndex={currentIndex}
              reelItemRefs={reelItemRefs}
              videoRefs={videoRefs}
              soundEnabled={soundEnabled}
              hasVideoError={Boolean(videoErrors[reel.id])}
              isVideoLoading={Boolean(videoLoading[reel.id])}
              videoProgress={videoProgress[reel.id] ?? 0}
              isLiked={userLikes.has(reel.id)}
              isSaved={savedReels.has(reel.id)}
              heartBursts={[]}
              showControls={false}
              isPvpSource={false}
              isProfileSource={false}
              profileReelProgress={null}
              creatorName={name}
              creatorPhoto={photo}
              creatorInitial={initial}
              captionText={caption}
              creatorStatLine={null}
              hasStory={false}
              creatorStreakCount={0}
              stats={null}
              gymName={null}
              currentLocale={locale}
              t={t}
              router={router}
              onVideoClick={noop}
              onVideoLoadStart={() => onVideoLoadStart(reel.id)}
              onVideoLoaded={()    => onVideoLoaded(reel.id)}
              onVideoError={()     => onVideoError(reel.id)}
              onLike={onLike}
              onOpenComments={onOpenComments}
              onShare={onShare}
              onSave={onSave}
              onGetFeedback={noop}
              onBreakdown={onBreakdown}
              onCaptionSheet={(id) => onCaptionSheet(id)}
              onReport={onReport}
              setVideoProgress={(p) => setVideoProgress(reel.id, p)}
              isFollowing={followingSet.has(reel.userId)}
              followLoading={loadingSet.has(reel.userId)}
              onFollow={onFollow}
              viewerUid={user?.uid || null}
            />
          </div>
        );
      })}
    </div>
  );
}
