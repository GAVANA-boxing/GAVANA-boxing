"use client";

import { useEffect, useRef, useState } from "react";
import ReelItem from "@/components/reels/ReelItem";
import CaptionSheet from "@/components/reels/CaptionSheet";
import FeedEmptyState from "./FeedEmptyState";
import { getCreatorName, cleanCaption } from "@/lib/reelHelpers";
import { translate } from "@/lib/i18n";
import { SpeakerIcon } from "@/components/reels/ReelIcons";

export default function FeedPage({ reels, locale, router }) {
  const [currentIndex,       setCurrentIndex]       = useState(0);
  const [soundEnabled,       setSoundEnabled]       = useState(false);
  const [videoErrors,        setVideoErrors]        = useState({});
  const [videoLoading,       setVideoLoading]       = useState({});
  const [videoProgress,      setVideoProgressMap]   = useState({});
  const [captionSheetReelId, setCaptionSheetReelId] = useState(null);

  const containerRef = useRef(null);
  const reelItemRefs = useRef({});
  const videoRefs    = useRef({});
  const observerRef  = useRef(null);
  const cardRefs     = useRef(new Map());

  const t = (key) => translate(locale, key);

  useEffect(() => {
    if (!reels.length || !containerRef.current) return;
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = parseInt(entry.target.dataset.index, 10);
            if (!isNaN(idx)) setCurrentIndex(idx);
          }
        }
      },
      { threshold: 0.6, root: containerRef.current },
    );
    cardRefs.current.forEach((el) => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reels.length]);

  if (!reels.length) {
    return <FeedEmptyState locale={locale} router={router} />;
  }

  const noop = () => {};

  return (
    <>
      {/* Sound toggle */}
      <button
        type="button"
        onClick={() => setSoundEnabled((s) => !s)}
        aria-label={soundEnabled ? "Mute" : "Unmute"}
        style={{
          position:       "fixed",
          top:            "max(env(safe-area-inset-top), 16px)",
          right:          16,
          zIndex:         50,
          padding:        "6px 8px",
          borderRadius:   8,
          background:     "rgba(0,0,0,0.45)",
          backdropFilter: "blur(8px)",
          color:          soundEnabled ? "#fff" : "rgba(255,255,255,0.55)",
          display:        "flex",
          alignItems:     "center",
          border:         "none",
          cursor:         "pointer",
        }}
      >
        <SpeakerIcon muted={!soundEnabled} />
      </button>

      {/* Scroll container */}
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
        {reels.map((reel, index) => {
          const name    = getCreatorName(reel, null);
          const initial = (name || "?").charAt(0).toUpperCase();
          const photo   = reel.userPhotoURL || reel.profileImageUrl || "";
          const caption = cleanCaption(reel.caption || reel.description || "");

          return (
            <div
              key={reel.id}
              data-index={index}
              style={{ flexShrink: 0, scrollSnapAlign: "start", scrollSnapStop: "always" }}
              ref={(el) => {
                if (el) {
                  cardRefs.current.set(index, el);
                  observerRef.current?.observe(el);
                } else {
                  cardRefs.current.delete(index);
                }
              }}
            >
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
                isLiked={false}
                isSaved={false}
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
                onVideoLoadStart={(id) => setVideoLoading((p) => ({ ...p, [id]: true }))}
                onVideoLoaded={(id)    => setVideoLoading((p) => ({ ...p, [id]: false }))}
                onVideoError={(id)     => setVideoErrors((p)  => ({ ...p, [id]: true }))}
                onLike={noop}
                onOpenComments={noop}
                onShare={noop}
                onSave={noop}
                onGetFeedback={noop}
                onBreakdown={noop}
                onCaptionSheet={(id)   => setCaptionSheetReelId(id)}
                onReport={noop}
                setVideoProgress={(p)  => setVideoProgressMap((prev) => ({ ...prev, [reel.id]: p }))}
              />
            </div>
          );
        })}
      </div>

      {/* Caption sheet */}
      <CaptionSheet
        captionSheetReelId={captionSheetReelId}
        reels={reels}
        setCaptionSheetReelId={setCaptionSheetReelId}
        t={t}
        currentLocale={locale}
      />
    </>
  );
}
