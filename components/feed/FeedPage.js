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
import { getFirebase } from "@/lib/lazyFirebase";

export default function FeedPage({ reels, locale, router, user }) {
  const [currentIndex,       setCurrentIndex]       = useState(0);
  const [soundEnabled,       setSoundEnabled]       = useState(false);
  const [videoErrors,        setVideoErrors]        = useState({});
  const [videoLoading,       setVideoLoading]       = useState({});
  const [videoProgress,      setVideoProgressMap]   = useState({});
  const [captionSheetReelId, setCaptionSheetReelId] = useState(null);

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
        {allReels.map((reel, index) => {
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
