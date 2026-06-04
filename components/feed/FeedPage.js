"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReelItem from "@/components/reels/ReelItem";
import CaptionSheet from "@/components/reels/CaptionSheet";
import CommentsModal from "@/components/reels/CommentsModal";
import FeedEmptyState from "./FeedEmptyState";
import { getCreatorName, cleanCaption } from "@/lib/reelHelpers";
import { translate } from "@/lib/i18n";
import { SpeakerIcon } from "@/components/reels/ReelIcons";
import { useReelInteractions } from "@/hooks/useReelInteractions";
import { useCommentActions } from "@/hooks/useCommentActions";
import { useFeedFollow } from "@/hooks/useFeedFollow";
import { getFirebase } from "@/lib/lazyFirebase";

export default function FeedPage({ reels, locale, router, user, userArchetype }) {
  const [currentIndex,       setCurrentIndex]       = useState(0);
  const [soundEnabled,       setSoundEnabled]       = useState(false);
  const [videoErrors,        setVideoErrors]        = useState({});
  const [videoLoading,       setVideoLoading]       = useState({});
  const [videoProgress,      setVideoProgressMap]   = useState({});
  const [captionSheetReelId, setCaptionSheetReelId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  // Social state
  const [allReels,   setAllReels]   = useState(reels);
  const [userLikes,  setUserLikes]  = useState(new Set());
  const [savedReels, setSavedReels] = useState(new Set());

  // Stub refs — only needed by handleVideoClick which we don't use on feed
  const singleTapTimerRef = useRef(null);
  const lastTapRef        = useRef({ time: 0, reelId: null });

  const containerRef = useRef(null);
  const reelItemRefs = useRef({});
  const videoRefs    = useRef({});
  const observerRef  = useRef(null);
  const cardRefs     = useRef(new Map());

  const t    = useCallback((key) => translate(locale, key), [locale]);
  const noop = useCallback(() => {}, []);

  // Sync allReels when parent data changes
  useEffect(() => { setAllReels(reels); }, [reels]);

  // Load userLikes + savedReels for logged-in users
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;

    async function loadSocialState() {
      try {
        const { db } = await getFirebase();
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const [likesSnap, savesSnap] = await Promise.all([
          getDocs(query(collection(db, "user_likes"),  where("userId", "==", user.uid))),
          getDocs(query(collection(db, "saved_reels"), where("userId", "==", user.uid))),
        ]);
        if (cancelled) return;
        setUserLikes(new Set(likesSnap.docs.map((d) => d.data().reelId)));
        setSavedReels(new Set(savesSnap.docs.map((d) => d.data().reelId)));
      } catch { /* non-critical */ }
    }

    loadSocialState();
    return () => { cancelled = true; };
  }, [user?.uid]);

  // Wrap setAllReels to preserve scroll order — useReelInteractions calls sortReelsByEngagement
  // which would jumble the feed scroll-snap position after a like.
  const setAllReelsStable = useCallback((updater) => {
    setAllReels((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const order = new Map(prev.map((r, i) => [r.id, i]));
      return [...next].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
    });
  }, []);

  const { handleLike, handleSave, handleShare } = useReelInteractions({
    user,
    router,
    currentLocale:  locale,
    pathname:       `/${locale}/feed`,
    t,
    reels:          allReels,
    userLikes,
    savedReels,
    setUserLikes,
    setAllReels:    setAllReelsStable,
    setSavedReels,
    setUserViews:   noop,
    setHeartBursts: noop,
    revealControls: noop,
    togglePlay:     noop,
    singleTapTimerRef,
    lastTapRef,
  });

  const commentActions = useCommentActions({ user, router, currentLocale: locale, reels: allReels });
  const { followingSet, loadingSet, handleFollow } = useFeedFollow({ user, router, currentLocale: locale });

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

  const ARCH_KEYWORDS = {
    pressure:   ["pressure", "forward", "body", "conditioning", "bag", "power", "heavy"],
    outboxer:   ["jab", "range", "distance", "footwork", "movement", "lateral"],
    counter:    ["counter", "counterpunch", "parry", "check", "timing", "read"],
    explosive:  ["explosive", "power", "knockout", "ko", "combination", "burst"],
    technician: ["technique", "technical", "precision", "form", "mechanics", "slip"],
  };

  const myStyleKeywords = userArchetype ? (ARCH_KEYWORDS[userArchetype] || []) : [];
  const filteredReels = activeFilter === "style" && myStyleKeywords.length > 0
    ? allReels.filter((r) => {
        const text = ((r.caption || "") + " " + (r.description || "") + " " + (r.tags?.join(" ") || "")).toLowerCase();
        return myStyleKeywords.some((kw) => text.includes(kw));
      })
    : allReels;

  if (!reels.length) {
    return <FeedEmptyState locale={locale} router={router} />;
  }

  if (filteredReels.length === 0 && activeFilter === "style") {
    return (
      <>
        {userArchetype && (
          <div style={{ position: "fixed", top: "max(env(safe-area-inset-top), 14px)", left: "50%", transform: "translateX(-50%)", zIndex: 50, display: "flex", gap: 6, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)", borderRadius: 20, padding: "4px 6px", border: "1px solid rgba(255,255,255,0.1)" }}>
            {[{ key: "all", en: "For You", mn: "Таны хувьд", ko: "추천" }, { key: "style", en: "My Style", mn: "Миний стиль", ko: "내 스타일" }].map((f) => (
              <button key={f.key} type="button" onClick={() => setActiveFilter(f.key)} style={{ padding: "5px 14px", borderRadius: 16, border: "none", background: activeFilter === f.key ? "rgba(255,255,255,0.18)" : "transparent", color: activeFilter === f.key ? "#fff" : "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                {locale === "mn" ? f.mn : locale === "ko" ? f.ko : f.en}
              </button>
            ))}
          </div>
        )}
        <div style={{ height: "100dvh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "0 32px", textAlign: "center" }}>
          <span style={{ fontSize: 32 }}>🧬</span>
          <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>
            {locale === "mn" ? "Таны стилийн контент одоохондоо алга" : locale === "ko" ? "내 스타일 콘텐츠가 아직 없습니다" : "No content matching your style yet"}
          </div>
          <button type="button" onClick={() => setActiveFilter("all")} style={{ padding: "8px 20px", borderRadius: 20, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
            {locale === "mn" ? "Бүгдийг үзэх" : locale === "ko" ? "전체 보기" : "See All"}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Filter tabs */}
      {userArchetype && (
        <div style={{
          position: "fixed",
          top: "max(env(safe-area-inset-top), 14px)",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          display: "flex",
          gap: 6,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(12px)",
          borderRadius: 20,
          padding: "4px 6px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          {[
            { key: "all",   en: "For You",   mn: "Таны хувьд", ko: "추천" },
            { key: "style", en: "My Style",  mn: "Миний стиль", ko: "내 스타일" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: "5px 14px",
                borderRadius: 16,
                border: "none",
                background: activeFilter === f.key ? "rgba(255,255,255,0.18)" : "transparent",
                color: activeFilter === f.key ? "#fff" : "rgba(255,255,255,0.45)",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                transition: "background 160ms ease, color 160ms ease",
              }}
            >
              {locale === "mn" ? f.mn : locale === "ko" ? f.ko : f.en}
            </button>
          ))}
        </div>
      )}

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
        {filteredReels.map((reel, index) => {
          const name    = getCreatorName(reel, null);
          const initial = (name || "?").charAt(0).toUpperCase();
          const photo   = reel.userPhotoURL || reel.profileImageUrl || "";
          const caption = cleanCaption(reel.caption || reel.description || "");

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
            >
              {/* DNA match badge */}
              {userArchetype && activeFilter === "style" && (() => {
                const text = ((reel.caption || "") + " " + (reel.description || "") + " " + (reel.tags?.join(" ") || "")).toLowerCase();
                const matches = myStyleKeywords.some((kw) => text.includes(kw));
                if (!matches) return null;
                const ARCH_COLORS = { pressure: "#EF4444", outboxer: "#3B82F6", counter: "#8B5CF6", explosive: "#F59E0B", technician: "#10B981" };
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
                    🧬 {locale === "mn" ? "Таны стиль" : locale === "ko" ? "내 스타일" : "Your Style"}
                  </div>
                );
              })()}
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
                onVideoLoadStart={(id) => setVideoLoading((p) => ({ ...p, [id]: true }))}
                onVideoLoaded={(id)    => setVideoLoading((p) => ({ ...p, [id]: false }))}
                onVideoError={(id)     => setVideoErrors((p)  => ({ ...p, [id]: true }))}
                onLike={handleLike}
                onOpenComments={commentActions.handleOpenComments}
                onShare={handleShare}
                onSave={handleSave}
                onGetFeedback={noop}
                onBreakdown={noop}
                onCaptionSheet={(id)   => setCaptionSheetReelId(id)}
                onReport={noop}
                setVideoProgress={(p)  => setVideoProgressMap((prev) => ({ ...prev, [reel.id]: p }))}
                isFollowing={followingSet.has(reel.userId)}
                followLoading={loadingSet.has(reel.userId)}
                onFollow={handleFollow}
                viewerUid={user?.uid || null}
              />
            </div>
          );
        })}
      </div>

      {/* Caption sheet */}
      <CaptionSheet
        captionSheetReelId={captionSheetReelId}
        reels={allReels}
        setCaptionSheetReelId={setCaptionSheetReelId}
        t={t}
        currentLocale={locale}
      />

      {/* Comments modal */}
      <CommentsModal
        showComments={commentActions.showComments}
        comments={commentActions.comments}
        commentProfiles={commentActions.commentProfiles}
        newComment={commentActions.newComment}
        setNewComment={commentActions.setNewComment}
        replyingTo={commentActions.replyingTo}
        setReplyingTo={commentActions.setReplyingTo}
        expandedReplies={commentActions.expandedReplies}
        setExpandedReplies={commentActions.setExpandedReplies}
        user={user}
        currentLocale={locale}
        t={t}
        router={router}
        onClose={commentActions.handleCloseComments}
        onAddComment={commentActions.handleAddComment}
        onDeleteComment={commentActions.handleDeleteComment}
      />
    </>
  );
}
