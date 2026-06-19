"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CaptionSheet from "@/components/reels/CaptionSheet";
import CommentsModal from "@/components/reels/CommentsModal";
import FeedEmptyState from "./FeedEmptyState";
import FilterTabBar from "./FilterTabBar";
import FeedDnaBanner from "./FeedDnaBanner";
import FeedSoundToggle from "./FeedSoundToggle";
import FeedFilteredEmpty from "./FeedFilteredEmpty";
import FeedScrollContainer from "./FeedScrollContainer";
import { translate } from "@/lib/i18n";
import XPToast from "@/components/XPToast";
import { useReelInteractions } from "@/hooks/useReelInteractions";
import { useCommentActions } from "@/hooks/useCommentActions";
import { useFeedFollow } from "@/hooks/useFeedFollow";
import { getFirebase } from "@/lib/lazyFirebase";

const ARCH_KEYWORDS = {
  pressure:   ["pressure", "forward", "body", "conditioning", "bag", "power", "heavy"],
  outboxer:   ["jab", "range", "distance", "footwork", "movement", "lateral"],
  counter:    ["counter", "counterpunch", "parry", "check", "timing", "read"],
  explosive:  ["explosive", "power", "knockout", "ko", "combination", "burst"],
  technician: ["technique", "technical", "precision", "form", "mechanics", "slip"],
};

export default function FeedPage({ reels, locale, router, user, userArchetype, followingReels = [], followingLoaded = false }) {
  const [currentIndex,       setCurrentIndex]       = useState(0);
  const [soundEnabled,       setSoundEnabled]       = useState(false);
  const [videoErrors,        setVideoErrors]        = useState({});
  const [videoLoading,       setVideoLoading]       = useState({});
  const [videoProgress,      setVideoProgressMap]   = useState({});
  const [captionSheetReelId, setCaptionSheetReelId] = useState(null);
  const [activeFilter,       setActiveFilter]       = useState("all");
  const [dnaBannerDismissed, setDnaBannerDismissed] = useState(false);
  const [xpToast,            setXpToast]            = useState({ visible: false, message: "" });

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

  const handleBreakdown = useCallback((reel) => {
    router.push(`/${locale}/ai-analysis/${reel.id}`);
  }, [router, locale]);

  const handleReport = useCallback(async (reel) => {
    if (!user?.uid) { router.push(`/${locale}/login`); return; }
    const confirmed = window.confirm(
      locale === "mn"
        ? "Энэ контентыг мэдэгдэх үү?"
        : locale === "ko"
        ? "이 콘텐츠를 신고하시겠습니까?"
        : "Report this content?"
    );
    if (!confirmed) return;
    try {
      const { getAuth } = await import("firebase/auth");
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) return;
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetId: reel.id, targetType: "reel", reason: "other" }),
      });
    } catch { /* non-critical */ }
  }, [user, router, locale]);

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

  const handleLikeWithToast = useCallback((reelOrId) => {
    const reelId = typeof reelOrId === "object" ? reelOrId?.id : reelOrId;
    const wasLiked = userLikes.has(reelId);
    handleLike(reelOrId);
    // Only show toast when adding a like (not removing), and don't stack
    if (!wasLiked && !xpToast.visible) {
      setXpToast({ visible: true, message: "+10 XP · RESPECT" });
    }
  }, [handleLike, userLikes, xpToast.visible]);

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

  const myStyleKeywords = userArchetype ? (ARCH_KEYWORDS[userArchetype] || []) : [];

  const FILTER_TABS = [
    { key: "all",       en: "For You",  mn: "Таны хувьд",  ko: "추천" },
    ...(user?.uid       ? [{ key: "following", en: "Following", mn: "Дагасан",     ko: "팔로잉" }] : []),
    ...(userArchetype   ? [{ key: "style",     en: "My Style",  mn: "Миний стиль", ko: "내 스타일" }] : []),
  ];

  const filteredReels =
    activeFilter === "following"
      ? followingReels
      : activeFilter === "style" && myStyleKeywords.length > 0
      ? allReels.filter((r) => {
          const text = ((r.caption || "") + " " + (r.description || "") + " " + (r.tags?.join(" ") || "")).toLowerCase();
          return myStyleKeywords.some((kw) => text.includes(kw));
        })
      : allReels;

  if (!reels.length) {
    return <FeedEmptyState locale={locale} router={router} />;
  }

  const isEmptyFiltered    = filteredReels.length === 0 && (activeFilter === "style" || activeFilter === "following");
  const isFollowingLoading = activeFilter === "following" && !followingLoaded;

  if (isFollowingLoading || isEmptyFiltered) {
    return (
      <FeedFilteredEmpty
        locale={locale}
        router={router}
        tabs={FILTER_TABS}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        isLoading={isFollowingLoading}
      />
    );
  }

  const showDnaBanner = user?.uid && !userArchetype && !dnaBannerDismissed;

  return (
    <>
      <FilterTabBar
        tabs={FILTER_TABS}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        locale={locale}
      />

      {showDnaBanner && (
        <FeedDnaBanner
          locale={locale}
          router={router}
          onDismiss={() => setDnaBannerDismissed(true)}
        />
      )}

      <FeedSoundToggle
        soundEnabled={soundEnabled}
        onToggle={() => setSoundEnabled((s) => !s)}
      />

      <FeedScrollContainer
        containerRef={containerRef}
        cardRefs={cardRefs}
        observerRef={observerRef}
        filteredReels={filteredReels}
        currentIndex={currentIndex}
        soundEnabled={soundEnabled}
        videoErrors={videoErrors}
        videoLoading={videoLoading}
        videoProgress={videoProgress}
        userLikes={userLikes}
        savedReels={savedReels}
        userArchetype={userArchetype}
        activeFilter={activeFilter}
        myStyleKeywords={myStyleKeywords}
        locale={locale}
        t={t}
        router={router}
        user={user}
        followingSet={followingSet}
        loadingSet={loadingSet}
        noop={noop}
        reelItemRefs={reelItemRefs}
        videoRefs={videoRefs}
        onLike={handleLikeWithToast}
        onOpenComments={commentActions.handleOpenComments}
        onShare={handleShare}
        onSave={handleSave}
        onBreakdown={handleBreakdown}
        onCaptionSheet={(id) => setCaptionSheetReelId(id)}
        onReport={handleReport}
        onFollow={handleFollow}
        onVideoLoadStart={(id) => setVideoLoading((p) => ({ ...p, [id]: true }))}
        onVideoLoaded={(id)    => setVideoLoading((p) => ({ ...p, [id]: false }))}
        onVideoError={(id)     => setVideoErrors((p)  => ({ ...p, [id]: true }))}
        setVideoProgress={(id, p) => setVideoProgressMap((prev) => ({ ...prev, [id]: p }))}
      />

      <CaptionSheet
        captionSheetReelId={captionSheetReelId}
        reels={allReels}
        setCaptionSheetReelId={setCaptionSheetReelId}
        t={t}
        currentLocale={locale}
      />

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

      <XPToast
        message={xpToast.message}
        visible={xpToast.visible}
        onDone={() => setXpToast((p) => ({ ...p, visible: false }))}
      />
    </>
  );
}
