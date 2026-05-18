"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection, documentId, getDocs, query as fsQuery, where,
  orderBy, limit, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import StoryBar from "@/components/StoryBar";
import { getLocale, translate } from "@/lib/i18n";
import { FIGHTERS } from "@/lib/fighters";
import FighterPortrait from "@/components/FighterPortrait";
import MediaCover from "@/components/MediaCover";
import { RED, GOLD } from "@/lib/tokens";
import { snapToDocs } from "@/lib/firestore";

// ─── Legendary fighter mini card (for Fighter Study row) ─────────────────────
function FighterStudyCard({ fighter, onClick }) {
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

// Fighter Study card styles
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

// ─── Fighter style identity chips ────────────────────────────────────────────
const FIGHTER_STYLES = [
  { key: "all", labelKey: "discoverStyleAll", emoji: "🥊" },
  { key: "counter", labelKey: "discoverStyleCounter", emoji: "🎯", keywords: ["counter", "technique", "technical", "parry"] },
  { key: "pressure", labelKey: "discoverStylePressure", emoji: "💥", keywords: ["pressure", "conditioning", "bag", "power", "heavy"] },
  { key: "fastHands", labelKey: "discoverStyleFastHands", emoji: "⚡", keywords: ["speed", "fast", "combo", "rapid", "jab"] },
  { key: "footwork", labelKey: "discoverStyleFootwork", emoji: "👟", keywords: ["footwork", "movement", "pivot", "step", "shadow"] },
  { key: "technical", labelKey: "discoverStyleTechnical", emoji: "📐", keywords: ["technical", "technique", "timing", "rhythm"] },
];

// ─── Learn sub-categories ─────────────────────────────────────────────────────
const LEARN_CATS = [
  { key: "all", emoji: "📚", label: "All", mn: "Бүгд", ko: "전체" },
  { key: "combo", emoji: "💥", label: "Combo", mn: "Комбо", ko: "콤보", keywords: ["combo", "combination", "1-2", "sequence"] },
  { key: "timing", emoji: "⏱️", label: "Timing", mn: "Цаг хугацаа", ko: "타이밍", keywords: ["timing", "rhythm", "tempo", "reaction"] },
  { key: "footwork", emoji: "👟", label: "Footwork", mn: "Хөл хөдөлгөөн", ko: "풋워크", keywords: ["footwork", "movement", "pivot", "step", "angle"] },
  { key: "defense", emoji: "🛡️", label: "Defense", mn: "Хамгаалалт", ko: "방어", keywords: ["defense", "guard", "block", "slip", "roll", "parry"] },
  { key: "jab", emoji: "👊", label: "Jab", mn: "Жаб", ko: "잽", keywords: ["jab", "lead hand", "straight", "jab cross"] },
  { key: "pressure", emoji: "🔥", label: "Pressure", mn: "Дарамт", ko: "압박", keywords: ["pressure", "forward", "cut off", "body"] },
  { key: "counter", emoji: "🎯", label: "Counter", mn: "Контр", ko: "카운터", keywords: ["counter", "counterpunch", "parry", "check"] },
];

function formatCompact(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return String(num);
}

function getTimestampMs(ts) {
  if (!ts) return 0;
  if (ts.toMillis) return ts.toMillis();
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function formatAgo(ts, locale) {
  const ms = getTimestampMs(ts);
  if (!ms) return "";
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (locale === "mn") {
    if (mins < 1) return "Дөнгөж сая";
    if (mins < 60) return `${mins}м өмнө`;
    if (hrs < 24) return `${hrs}ц өмнө`;
    return `${days}өдр өмнө`;
  }
  if (locale === "ko") {
    if (mins < 1) return "방금";
    if (mins < 60) return `${mins}분 전`;
    if (hrs < 24) return `${hrs}시간 전`;
    return `${days}일 전`;
  }
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

function cleanCaption(text) {
  if (!text) return "";
  return text
    .replace(/^Hook:\s*/i, "")
    .replace(/\nCaption:\s*/i, " — ")
    .replace(/\nHashtags:.*$/is, "")
    .replace(/\nCaption:.*/is, "")
    .trim();
}

function reelMatchesKeywords(reel, keywords) {
  const text = [
    reel.category || "",
    reel.caption || "",
    reel.description || "",
    reel.contentType || "",
    reel.type || "",
  ].join(" ").toLowerCase();
  return keywords.some((k) => text.includes(k.toLowerCase()));
}

// ─── Premium portrait reel card ───────────────────────────────────────────────
// thumbnailUrl in Firestore is the video URL itself (set by upload page).
// Use <video preload="metadata"> so the browser renders the first frame.
function ReelCard({ reel, onClick }) {
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
        {/* Gradient overlays */}
        <div style={s.reelGradTop} />
        <div style={s.reelGradBottom} />
        {/* Type badge */}
        <span style={s.reelTypeBadge}>{typeEmoji}</span>
        {/* Views */}
        {reel.views > 0 && (
          <span style={s.reelViews}>{views}</span>
        )}
        {/* Caption overlay */}
        {caption && (
          <p style={s.reelCaptionOverlay}>{caption}</p>
        )}
      </div>
    </button>
  );
}

// ─── Horizontal section of reel cards ────────────────────────────────────────
function ReelRow({ reels, router, locale, loading }) {
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

// ─── Expandable hub card (Learn / Challenges) ─────────────────────────────────
function HubCard({ emoji, title, accent, expanded, onToggle, children }) {
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

// ─── Following feed post card ─────────────────────────────────────────────────
function FeedPostCard({ reel, authorUser, router, locale }) {
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
            ? <img src={photo} alt="" style={feed.avatarImg} />
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
}

export default function DiscoverPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const [allReels, setAllReels] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(true);
  const [exploreError, setExploreError] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("all");
  const [learnOpen, setLearnOpen] = useState(false);
  const [learnCat, setLearnCat] = useState("all");
  const [challengesOpen, setChallengesOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [topCoaches, setTopCoaches] = useState([]);

  // Feed tabs
  const [feedTab, setFeedTab] = useState("explore"); // "explore" | "following"
  const [followingReels, setFollowingReels] = useState([]);
  const [followingUsers, setFollowingUsers] = useState({});
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedLoaded, setFeedLoaded] = useState(false);

  // Search
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [userResults, setUserResults] = useState([]);
  const [reelResults, setReelResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const loadExplore = useCallback(async () => {
    setExploreLoading(true);
    setExploreError(false);
    let active = true;
    try {
      const [reelsSnap, coachSnap] = await Promise.all([
        getDocs(fsQuery(collection(db, "reels"), orderBy("createdAt", "desc"), limit(80))),
        getDocs(fsQuery(collection(db, "users"), where("isCoach", "==", true), limit(4))),
      ]);
      if (!active) return;
      setAllReels(snapToDocs(reelsSnap));
      setTopCoaches(snapToDocs(coachSnap));
    } catch {
      if (active) setExploreError(true);
    }
    if (active) setExploreLoading(false);
    return () => { active = false; };
  }, []);

  useEffect(() => { loadExplore(); }, [loadExplore]);

  // Following feed — lazy-loaded on first tab switch
  useEffect(() => {
    if (feedTab !== "following" || feedLoaded || !user?.uid) return;
    let active = true;
    async function loadFollowing() {
      setFeedLoading(true);
      try {
        const followsSnap = await getDocs(fsQuery(collection(db, "follows"), where("followerId", "==", user.uid)));
        const followingIds = followsSnap.docs.map((d) => d.data().followingId).filter(Boolean);
        if (!followingIds.length) { if (active) { setFeedLoaded(true); setFeedLoading(false); } return; }
        const reels = [];
        const chunks = [];
        for (let i = 0; i < followingIds.length; i += 10) chunks.push(followingIds.slice(i, i + 10));
        await Promise.all(chunks.map(async (chunk) => {
          const snap = await getDocs(fsQuery(collection(db, "reels"), where("userId", "in", chunk)));
          snap.docs.forEach((d) => reels.push({ id: d.id, ...d.data() }));
        }));
        reels.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
        if (!active) return;
        setFollowingReels(reels.slice(0, 60));
        const authorIds = [...new Set(reels.map((r) => r.userId).filter(Boolean))];
        if (authorIds.length > 0) {
          const uChunks = [];
          for (let i = 0; i < authorIds.length; i += 10) uChunks.push(authorIds.slice(i, i + 10));
          const uMap = {};
          await Promise.all(uChunks.map(async (chunk) => {
            const uSnap = await getDocs(fsQuery(collection(db, "users"), where(documentId(), "in", chunk)));
            uSnap.docs.forEach((d) => { uMap[d.id] = d.data(); });
          }));
          if (active) setFollowingUsers(uMap);
        }
      } catch (e) { console.error("following feed error", e); }
      finally { if (active) { setFeedLoaded(true); setFeedLoading(false); } }
    }
    loadFollowing();
    return () => { active = false; };
  }, [feedTab, feedLoaded, user?.uid]);

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    const term = query.trim().toLowerCase();
    if (!term) return;
    setSearching(true);
    setHasSearched(true);
    setSearchError(false);
    try {
      const [usersSnap, reelsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "reels")),
      ]);
      const users = [];
      usersSnap.forEach((doc) => {
        const d = doc.data();
        if (
          String(d.username || "").toLowerCase().includes(term) ||
          String(d.displayName || "").toLowerCase().includes(term)
        ) users.push({ id: doc.id, ...d });
      });
      const reels = [];
      reelsSnap.forEach((doc) => {
        const d = doc.data();
        if (String(d.caption || d.description || "").toLowerCase().includes(term))
          reels.push({ id: doc.id, ...d });
      });
      setUserResults(users.slice(0, 20));
      setReelResults(reels.slice(0, 20));
    } catch {
      setSearchError(true);
    }
    setSearching(false);
  }, [query]);

  const clearSearch = () => {
    setQuery("");
    setUserResults([]);
    setReelResults([]);
    setHasSearched(false);
  };

  // Derived sections
  const nonDemoReels = useMemo(() => allReels.filter((r) => !r.isDemo), [allReels]);

  const forYouReels = useMemo(() => {
    if (selectedStyle === "all") return nonDemoReels;
    const style = FIGHTER_STYLES.find((st) => st.key === selectedStyle);
    if (!style?.keywords) return nonDemoReels;
    const matched = nonDemoReels.filter((r) => reelMatchesKeywords(r, style.keywords));
    return matched.length ? matched : nonDemoReels;
  }, [nonDemoReels, selectedStyle]);

  const educationalReels = useMemo(
    () => nonDemoReels.filter((r) => r.contentType === "educational"),
    [nonDemoReels]
  );

  const filteredLearnReels = useMemo(() => {
    if (learnCat === "all") return educationalReels;
    const cat = LEARN_CATS.find((c) => c.key === learnCat);
    if (!cat?.keywords) return educationalReels;
    const filtered = educationalReels.filter((r) => reelMatchesKeywords(r, cat.keywords));
    // Fallback: if no matches in educational, search all reels
    if (!filtered.length) {
      return nonDemoReels.filter((r) => reelMatchesKeywords(r, cat.keywords));
    }
    return filtered;
  }, [educationalReels, nonDemoReels, learnCat]);

  const challengeReels = useMemo(
    () => nonDemoReels.filter((r) => r.contentType === "challenge" || r.hasChallenge || r.challengeMode),
    [nonDemoReels]
  );

  const showSearch = hasSearched && query.trim();

  return (
    <div style={s.page} className="page-enter">
      {/* ── Header ── */}
      <div style={s.header}>
        <p style={s.kicker}>GAVANA · EXPLORE</p>
        <h1 style={s.title}>{t("discoverTitle")}</h1>
        <p style={s.subtitle}>{t("discoverSubtitle") || "Fighters. Techniques. Community."}</p>
      </div>

      {/* ── Stories ── */}
      <StoryBar locale={locale} router={router} />

      {/* ── Feed Tabs ── */}
      <div style={s.feedTabs}>
        <button
          type="button"
          style={feedTab === "explore" ? s.feedTabActive : s.feedTabBtn}
          onClick={() => setFeedTab("explore")}
        >
          {t("discoverExploreTab")}
        </button>
        <button
          type="button"
          style={feedTab === "following" ? s.feedTabActive : s.feedTabBtn}
          onClick={() => setFeedTab("following")}
        >
          {t("discoverFollowingTab")}
        </button>
      </div>

      {/* ── Search (sticky) ── */}
      <form onSubmit={handleSearch} style={s.searchRow}>
        <div style={s.searchWrap}>
          <svg style={s.searchIconSvg} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("discoverPlaceholder")}
            style={s.searchInput}
            aria-label={t("discoverPlaceholder")}
          />
          {query && (
            <button type="button" onClick={clearSearch} style={s.clearBtn} aria-label="Clear search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
        <button type="submit" style={{ ...s.searchBtn, opacity: searching || !query.trim() ? 0.55 : 1, cursor: searching || !query.trim() ? "default" : "pointer" }} disabled={searching || !query.trim()}>
          {searching ? (
            <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          ) : t("discoverSearch")}
        </button>
      </form>

      {/* ══════════════════════════════════════════════
          SEARCH RESULTS
      ══════════════════════════════════════════════ */}
      {showSearch ? (
        <div style={s.content}>
          {searching && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 16px" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="shimmer" style={{ height: 60, borderRadius: 12 }} />
              ))}
            </div>
          )}
          {searchError && !searching && (
            <div style={s.emptyState}>
              <span style={{ fontSize: 32 }}>⚠️</span>
              <p style={{ margin: "8px 0 4px", color: "#fff", fontSize: 14, fontWeight: 800 }}>
                {t("discoverSearchFailed")}
              </p>
              <button type="button" onClick={() => handleSearch()} style={{ marginTop: 8, padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                {t("discoverRetry")}
              </button>
            </div>
          )}
          {!searching && !searchError && userResults.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p style={s.sectionLabel}>{t("discoverFighters")}</p>
              <div style={s.listStack}>
                {userResults.map((u) => {
                  const photo = u.photoURL || u.profileImageUrl || "";
                  const initial = (u.displayName || u.username || "U").charAt(0).toUpperCase();
                  return (
                    <button key={u.id} type="button" onClick={() => router.push(`/${locale}/profile/${u.id}`)} style={s.listCard}>
                      <div style={s.listAvatar}>{photo ? <img src={photo} alt="" style={s.listAvatarImg} /> : initial}</div>
                      <div style={s.listCardText}>
                        <span style={s.listCardName}>{u.displayName || u.username || t("fallbackUnnamed")}</span>
                        {u.username && <span style={s.listCardSub}>@{u.username}</span>}
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "#444", flexShrink: 0 }} aria-hidden="true"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {!searching && !searchError && reelResults.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p style={s.sectionLabel}>{t("discoverReels")}</p>
              <div style={s.listStack}>
                {reelResults.map((r) => (
                  <button key={r.id} type="button" onClick={() => router.push(`/${locale}/reels?reelId=${r.id}`)} style={s.listCard}>
                    <div style={{ ...s.listAvatar, background: "rgba(212,175,55,0.15)", color: GOLD, fontSize: 18 }}>🎬</div>
                    <div style={s.listCardText}>
                      <span style={s.listCardName}>{r.caption || r.description || t("fallbackReel")}</span>
                      <span style={s.listCardSub}>{formatCompact(r.views || 0)} {t("views")}</span>
                    </div>
                    <span style={s.listArrow}>›</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {!searching && !searchError && userResults.length === 0 && reelResults.length === 0 && (
            <div style={s.emptyState}>
              <span style={{ fontSize: 36 }}>🔍</span>
              <p style={{ margin: "8px 0 4px", color: "#fff", fontSize: 15, fontWeight: 800 }}>{t("discoverNoMatches")}</p>
              <p style={{ margin: 0, color: "#555", fontSize: 13, maxWidth: 240, lineHeight: 1.5 }}>
                {t("discoverSearchHint")}
              </p>
              <button type="button" onClick={clearSearch} style={{ marginTop: 12, padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: GOLD, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                {t("discoverClearSearch")}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={s.content}>

          {/* ════════════════════════════════════════
              FOLLOWING FEED
          ════════════════════════════════════════ */}
          {feedTab === "following" && (
            <div style={{ padding: "8px 16px 0" }}>
              {feedLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={feed.skeleton} />
                  ))}
                </div>
              )}
              {!feedLoading && !user?.uid && (
                <div style={feed.emptyWrap}>
                  <span style={{ fontSize: 40 }}>🔒</span>
                  <p style={feed.emptyTitle}>{t("discoverSignInRequired")}</p>
                  <p style={feed.emptyText}>{t("discoverSignInDesc")}</p>
                  <button type="button" style={feed.emptyBtn} onClick={() => router.push(`/${locale}/login`)}>
                    {t("discoverSignIn")}
                  </button>
                </div>
              )}
              {!feedLoading && user?.uid && feedLoaded && followingReels.length === 0 && (
                <div style={feed.emptyWrap}>
                  <span style={{ fontSize: 40 }}>👥</span>
                  <p style={feed.emptyTitle}>{t("discoverNoFollowing")}</p>
                  <p style={feed.emptyText}>{t("discoverNoFollowingDesc")}</p>
                  <button type="button" style={feed.emptyBtn} onClick={() => setFeedTab("explore")}>
                    {t("discoverExploreFighters")}
                  </button>
                </div>
              )}
              {!feedLoading && followingReels.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {followingReels.map((reel) => (
                    <FeedPostCard
                      key={reel.id}
                      reel={reel}
                      authorUser={followingUsers[reel.userId]}
                      router={router}
                      locale={locale}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {feedTab === "explore" && (<>

          {/* Explore load error */}
          {exploreError && !exploreLoading && (
            <div style={{ padding: "20px 16px", textAlign: "center" }}>
              <p style={{ margin: "0 0 10px", color: "#888", fontSize: 14 }}>
                {t("discoverLoadError")}
              </p>
              <button type="button" onClick={loadExplore} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                {t("discoverRetry")}
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════
              HUB 1 — 🥊 FOR YOU
          ════════════════════════════════════════ */}
          <div style={s.hubSection}>
            <div style={s.forYouHeader}>
              <span style={s.forYouTitle}>🥊 {t("discoverForYou")}</span>
              <button type="button" onClick={() => router.push(`/${locale}/reels`)} style={s.seeAllBtn}>
                {t("discoverViewAll")} ›
              </button>
            </div>

            {/* Fighter style chips */}
            <div style={s.styleChips}>
              {FIGHTER_STYLES.map((style) => (
                <button
                  key={style.key}
                  type="button"
                  onClick={() => setSelectedStyle(style.key)}
                  style={{ ...s.styleChip, ...(selectedStyle === style.key ? s.styleChipActive : {}) }}
                >
                  {style.emoji} {t(style.labelKey)}
                </button>
              ))}
            </div>

            <ReelRow reels={forYouReels} router={router} locale={locale} loading={exploreLoading} />
            {!exploreLoading && forYouReels.length === 0 && (
              <div style={s.hubEmpty}>
                <p style={s.hubEmptyText}>{t("discoverNoContent")}</p>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════
              FIGHTER STUDY — standalone visible section
          ════════════════════════════════════════ */}
          <div style={{ ...s.hubSection, marginBottom: 8 }}>
            <div style={s.fighterStudyHeader}>
              <span style={s.fighterStudyLabel}>🥊 {t("fighterStudyTitle")}</span>
              <button
                type="button"
                style={s.fighterStudySeeAll}
                onClick={() => router.push(`/${locale}/fighters`)}
              >
                {t("fighterStudySeeAll")} ›
              </button>
            </div>
            <div style={s.fighterStudyScroll}>
              {FIGHTERS.map((f) => (
                <FighterStudyCard
                  key={f.id}
                  fighter={f}
                  onClick={() => router.push(`/${locale}/fighters/${f.id}`)}
                />
              ))}
            </div>
          </div>

          {/* ════════════════════════════════════════
              HUB 2 — 🧠 LEARN
          ════════════════════════════════════════ */}
          <HubCard
            emoji="🧠"
            title={t("discoverLearnHub")}
            accent={GOLD}
            expanded={learnOpen}
            onToggle={() => setLearnOpen((v) => !v)}
          >
            {/* Sub-category chips */}
            <div style={s.learnChips}>
              {LEARN_CATS.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setLearnCat(cat.key)}
                  style={{ ...s.learnChip, ...(learnCat === cat.key ? s.learnChipActive : {}) }}
                >
                  {cat.emoji} {locale === "mn" ? cat.mn : locale === "ko" ? cat.ko : cat.label}
                </button>
              ))}
            </div>

            {filteredLearnReels.length > 0 ? (
              <ReelRow reels={filteredLearnReels} router={router} locale={locale} loading={false} />
            ) : (
              <div style={s.hubEmpty}>
                <p style={s.hubEmptyText}>{t("discoverNoCategoryContent")}</p>
              </div>
            )}

            <button type="button" style={s.hubFooterBtn} onClick={() => router.push(`/${locale}/reels`)}>
              {t("discoverBrowseReels")}
            </button>
          </HubCard>

          {/* ════════════════════════════════════════
              HUB 3 — ⚔ CHALLENGES
          ════════════════════════════════════════ */}
          <HubCard
            emoji="⚔️"
            title={t("discoverChallengesHub")}
            accent={RED}
            expanded={challengesOpen}
            onToggle={() => setChallengesOpen((v) => !v)}
          >
            {challengeReels.length > 0 ? (
              <ReelRow reels={challengeReels} router={router} locale={locale} loading={false} />
            ) : (
              <div style={s.hubEmpty}>
                <p style={s.hubEmptyText}>{t("discoverChallengeEmpty")}</p>
              </div>
            )}

            {/* Challenge category quick links */}
            <div style={s.challengeGrid}>
              {[
                { emoji: "🟢", label: "Beginner", mn: "Анхлан", ko: "입문자", keywords: ["beginner"] },
                { emoji: "⚡", label: "Speed", mn: "Хурд", ko: "스피드", keywords: ["speed", "fast"] },
                { emoji: "💥", label: "Power", mn: "Хүч", ko: "파워", keywords: ["power", "heavy"] },
                { emoji: "🏆", label: "Advanced", mn: "Дэвшилтэт", ko: "고급", keywords: ["advanced", "pro"] },
              ].map((ch) => (
                <button
                  key={ch.label}
                  type="button"
                  style={s.challengeChip}
                  onClick={() => router.push(`/${locale}/challenges`)}
                >
                  {ch.emoji} {locale === "mn" ? ch.mn : locale === "ko" ? ch.ko : ch.label}
                </button>
              ))}
            </div>

            <button type="button" style={{ ...s.hubFooterBtn, color: "#F87171", borderColor: "rgba(193,18,31,0.3)" }} onClick={() => router.push(`/${locale}/challenges`)}>
              {t("discoverGoToChallenges")}
            </button>
          </HubCard>

          {/* ════════════════════════════════════════
              HUB 4 — 🌐 EXPLORE MORE
          ════════════════════════════════════════ */}
          <HubCard
            emoji="🌐"
            title={t("discoverExploreMore")}
            accent="#60A5FA"
            expanded={exploreOpen}
            onToggle={() => setExploreOpen((v) => !v)}
          >
            <div style={s.explorePills}>
              <button type="button" onClick={() => router.push(`/${locale}/leaderboard`)} style={s.explorePill}>
                🏆 {t("leaderboardTitle")}
              </button>
              <button type="button" onClick={() => router.push(`/${locale}/coach`)} style={{ ...s.explorePill, borderColor: "rgba(96,165,250,0.25)", color: "#60A5FA" }}>
                🎓 {t("navCoach")}
              </button>
              <button type="button" onClick={() => router.push(`/${locale}/gyms`)} style={{ ...s.explorePill, borderColor: "rgba(52,211,153,0.25)", color: "#34D399" }}>
                🏋️ {t("gymsTitle")}
              </button>
            </div>

            {topCoaches.length > 0 && (
              <>
                <p style={{ ...s.sectionLabel, margin: "16px 0 10px" }}>🎓 {t("discoverTopCoaches")}</p>
                <div style={s.coachScroll}>
                  {topCoaches.map((coach) => {
                    const photo = coach.photoURL || coach.profileImageUrl || "";
                    const initial = (coach.displayName || coach.username || "C").charAt(0).toUpperCase();
                    return (
                      <button
                        key={coach.id}
                        type="button"
                        onClick={() => router.push(`/${locale}/coach/${coach.id}`)}
                        style={s.coachCard}
                      >
                        <div style={s.coachAvatar}>
                          {photo ? <img src={photo} alt="" style={s.coachAvatarImg} /> : initial}
                        </div>
                        <span style={s.coachName}>{(coach.displayName || coach.username || t("fallbackCoach")).split(" ")[0]}</span>
                        <span style={s.coachSpec}>{coach.coachSpecialties?.[0] || (locale === "mn" ? "Тренер" : locale === "ko" ? "코치" : "Coach")}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </HubCard>

          </>)}

        </div>
      )}

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at top center, rgba(193,18,31,0.07) 0%, transparent 55%), #080808",
    color: "#fff",
    paddingBottom: 100,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    padding: "calc(28px + env(safe-area-inset-top)) 20px 14px",
    position: "relative",
  },
  kicker: {
    margin: "0 0 6px",
    color: "rgba(193,18,31,0.9)",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 3.5,
    textTransform: "uppercase",
  },
  title: {
    margin: "0 0 4px",
    fontSize: "clamp(30px, 9vw, 42px)",
    fontWeight: 900,
    letterSpacing: -0.8,
    lineHeight: 1.0,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
  },
  subtitle: {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
    fontWeight: 400,
    lineHeight: 1.5,
  },

  // ── Search ──
  searchRow: {
    display: "flex",
    gap: 8,
    padding: "0 16px 14px",
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "rgba(8,8,8,0.95)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  },
  searchWrap: {
    flex: 1,
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIconSvg: {
    position: "absolute",
    left: 13,
    width: 16,
    height: 16,
    fill: "none",
    stroke: "#555",
    strokeWidth: 2,
    strokeLinecap: "round",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    height: 44,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    padding: "0 34px 0 38px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  clearBtn: {
    position: "absolute",
    right: 10,
    background: "none",
    border: "none",
    color: "#666",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtn: {
    height: 44,
    padding: "0 18px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(135deg, #C1121F, #8f0d17)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    flexShrink: 0,
    opacity: 1,
  },

  // ── Main content ──
  content: {
    padding: "8px 0 0",
  },

  // ── Hub Section (For You) ──
  hubSection: {
    marginBottom: 32,
    padding: "0 16px",
  },
  forYouHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingTop: 8,
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  forYouTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: "#fff",
    letterSpacing: 0.2,
  },
  seeAllBtn: {
    background: "none",
    border: "none",
    color: GOLD,
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    padding: 0,
  },

  // ── Fighter style chips ──
  styleChips: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    paddingBottom: 12,
    scrollbarWidth: "none",
  },
  styleChip: {
    flexShrink: 0,
    padding: "7px 13px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#888",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    WebkitTapHighlightColor: "transparent",
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  styleChipActive: {
    background: "rgba(193,18,31,0.85)",
    borderColor: "rgba(193,18,31,0.6)",
    color: "#fff",
    fontWeight: 900,
  },

  // ── Reel scroll ──
  reelScroll: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 4,
    scrollbarWidth: "none",
    WebkitOverflowScrolling: "touch",
  },

  // ── Portrait reel card ──
  reelCard: {
    flexShrink: 0,
    width: 120,
    height: 200,
    borderRadius: 14,
    overflow: "hidden",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    display: "block",
    position: "relative",
    WebkitTapHighlightColor: "transparent",
  },
  reelThumbWrap: {
    width: "100%",
    height: "100%",
    position: "relative",
    background: "linear-gradient(135deg, #1a0a0a 0%, #0d0d0d 100%)",
    borderRadius: 14,
    overflow: "hidden",
  },
  reelThumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    borderRadius: 14,
  },
  reelThumbFallback: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "8px 8px 24px",
    boxSizing: "border-box",
  },
  reelFallbackCaption: {
    margin: 0,
    fontSize: 9,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.3,
    textAlign: "center",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  reelGradTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 100%)",
    pointerEvents: "none",
  },
  reelGradBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    background: "linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
    pointerEvents: "none",
  },
  reelTypeBadge: {
    position: "absolute",
    top: 7,
    left: 8,
    fontSize: 13,
    lineHeight: 1,
    filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.9))",
    zIndex: 2,
  },
  reelViews: {
    position: "absolute",
    top: 8,
    right: 8,
    fontSize: 9,
    fontWeight: 900,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.3,
    zIndex: 2,
  },
  reelCaptionOverlay: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    margin: 0,
    fontSize: 10,
    fontWeight: 800,
    color: "#fff",
    lineHeight: 1.3,
    letterSpacing: 0.1,
    textShadow: "0 1px 4px rgba(0,0,0,0.9)",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    zIndex: 2,
  },
  shimmerCard: {
    flexShrink: 0,
    width: 120,
    height: 200,
    borderRadius: 14,
  },

  // ── Expandable hub ──
  hubWrap: {
    marginBottom: 4,
  },
  hubRow: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderRadius: 0,
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    background: "none",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    boxSizing: "border-box",
    transition: "background 180ms",
  },
  hubLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  hubEmoji: {
    width: 34,
    height: 34,
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 17,
    flexShrink: 0,
  },
  hubTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#fff",
    letterSpacing: 0.1,
  },
  hubChevron: {
    width: 18,
    height: 18,
    fill: "none",
    stroke: "rgba(255,255,255,0.3)",
    strokeWidth: 2.2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    transition: "transform 200ms ease",
    flexShrink: 0,
  },
  hubBody: {
    padding: "4px 16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  // ── Learn sub-cats ──
  learnChips: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    scrollbarWidth: "none",
    paddingBottom: 4,
  },
  learnChip: {
    flexShrink: 0,
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid rgba(212,175,55,0.18)",
    background: "rgba(212,175,55,0.04)",
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: 4,
    WebkitTapHighlightColor: "transparent",
  },
  learnChipActive: {
    background: "rgba(212,175,55,0.18)",
    borderColor: "rgba(212,175,55,0.55)",
    color: GOLD,
    fontWeight: 900,
  },
  hubEmpty: {
    padding: "20px 0",
    textAlign: "center",
  },
  hubEmptyText: {
    margin: 0,
    fontSize: 13,
    color: "#555",
  },
  hubFooterBtn: {
    background: "none",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: "11px 16px",
    color: GOLD,
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    width: "100%",
    textAlign: "center",
  },

  // ── Challenge grid ──
  challengeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 8,
  },
  challengeChip: {
    padding: "12px 8px",
    borderRadius: 12,
    border: "1px solid rgba(193,18,31,0.2)",
    background: "rgba(193,18,31,0.06)",
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    WebkitTapHighlightColor: "transparent",
  },

  // ── Explore section ──
  exploreSection: {
    padding: "20px 16px 8px",
  },
  exploreSectionLabel: {
    margin: "0 0 10px",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#444",
  },
  explorePills: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  explorePill: {
    padding: "9px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    WebkitTapHighlightColor: "transparent",
  },

  // ── Top coaches ──
  coachStrip: {
    padding: "20px 16px 8px",
  },
  coachStripHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  coachStripLabel: {
    fontSize: 14,
    fontWeight: 900,
    color: "#fff",
  },
  coachScroll: {
    display: "flex",
    gap: 12,
    overflowX: "auto",
    scrollbarWidth: "none",
    paddingBottom: 4,
  },
  coachCard: {
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    WebkitTapHighlightColor: "transparent",
    width: 64,
  },
  coachAvatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "rgba(96,165,250,0.15)",
    border: "2px solid rgba(96,165,250,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    fontSize: 18,
    fontWeight: 800,
    color: "#fff",
  },
  coachAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  coachName: {
    fontSize: 11,
    fontWeight: 800,
    color: "#fff",
    maxWidth: 64,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textAlign: "center",
  },
  coachSpec: {
    fontSize: 9,
    fontWeight: 700,
    color: "#60A5FA",
    textAlign: "center",
    maxWidth: 64,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Search results ──
  sectionLabel: {
    margin: "0 0 10px",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#666",
  },
  listStack: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  listCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "11px 14px",
    borderRadius: 12,
    border: "none",
    background: "rgba(255,255,255,0.03)",
    cursor: "pointer",
    color: "#fff",
    textAlign: "left",
    width: "100%",
    boxSizing: "border-box",
    WebkitTapHighlightColor: "transparent",
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 800,
    flexShrink: 0,
    overflow: "hidden",
  },
  listAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  listCardText: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
  },
  listCardName: {
    fontSize: 14,
    fontWeight: 800,
    color: "#fff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  listCardSub: {
    fontSize: 12,
    color: "#666",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  listArrow: {
    color: "#444",
    fontSize: 18,
    flexShrink: 0,
  },
  emptyState: {
    textAlign: "center",
    padding: "48px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  // ── Fighter Study subsection ──
  fighterStudySection: {
    marginBottom: 4,
  },
  fighterStudyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  fighterStudyLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: GOLD,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  fighterStudySeeAll: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: 11,
    cursor: "pointer",
    padding: 0,
  },
  fighterStudyScroll: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 4,
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    WebkitOverflowScrolling: "touch",
  },
  learnDivider: {
    height: 1,
    background: "rgba(255,255,255,0.06)",
    margin: "14px 0",
  },

  // ── Feed Tabs ──
  feedTabs: {
    display: "flex",
    gap: 0,
    padding: "0 16px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    marginBottom: 2,
  },
  feedTabBtn: {
    flex: 1,
    padding: "10px 0",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    transition: "color 150ms, border-color 150ms",
  },
  feedTabActive: {
    flex: 1,
    padding: "10px 0",
    background: "none",
    border: "none",
    borderBottom: "2px solid #C1121F",
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
};

// ─── Following Feed Styles ────────────────────────────────────────────────────
const feed = {
  skeleton: {
    height: 320,
    borderRadius: 16,
    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s ease infinite",
  },
  emptyWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "52px 24px",
    gap: 10,
  },
  emptyTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 900,
    color: "#fff",
  },
  emptyText: {
    margin: 0,
    fontSize: 13,
    color: "#666",
    lineHeight: 1.5,
    maxWidth: 260,
  },
  emptyBtn: {
    marginTop: 8,
    padding: "11px 22px",
    borderRadius: 12,
    border: "none",
    background: RED,
    color: "#fff",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
  card: {
    background: "linear-gradient(145deg, #111012, #0a0a0a)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderLeft: "2.5px solid #C1121F",
    borderRadius: "3px 16px 16px 3px",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px 10px",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "rgba(193,18,31,0.2)",
    border: "1.5px solid rgba(193,18,31,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    cursor: "pointer",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: 900,
    color: "#fff",
  },
  authorName: {
    margin: 0,
    fontSize: 14,
    fontWeight: 800,
    color: "#fff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  timeAgo: {
    margin: 0,
    fontSize: 11,
    color: "#555",
    fontWeight: 600,
  },
  typeBadge: {
    fontSize: 18,
    lineHeight: 1,
    flexShrink: 0,
  },
  thumb: {
    position: "relative",
    width: "100%",
    aspectRatio: "16/9",
    background: "#0d0d0d",
    overflow: "hidden",
    cursor: "pointer",
  },
  thumbMedia: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  thumbGrad: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(0deg, rgba(0,0,0,0.65) 0%, transparent 50%)",
    pointerEvents: "none",
  },
  thumbCaption: {
    position: "absolute",
    bottom: 10,
    left: 12,
    right: 12,
    margin: 0,
    fontSize: 12,
    fontWeight: 800,
    color: "#fff",
    textShadow: "0 1px 4px rgba(0,0,0,0.9)",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px 12px",
  },
  likes: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: 600,
  },
  watchBtn: {
    padding: "7px 14px",
    borderRadius: 10,
    border: "none",
    background: RED,
    color: "#fff",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
};
