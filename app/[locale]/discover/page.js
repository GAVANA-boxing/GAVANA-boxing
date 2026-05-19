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
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import { s, feed } from "@/components/discover/discoverStyles";
import { snapToDocs } from "@/lib/firestore";
import { formatCompact, getTimestampMs, formatAgo } from "@/lib/utils";
import { cleanCaption } from "@/lib/reelHelpers";
import { FighterStudyCard, ReelRow, HubCard, FeedPostCard, reelMatchesKeywords } from "@/components/discover/DiscoverCards";

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
                    <div style={{ ...s.listAvatar, background: `${goldAlpha(0.15)}`, color: GOLD, fontSize: 18 }}>🎬</div>
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
                      t={t}
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

            <button type="button" style={{ ...s.hubFooterBtn, color: "#F87171", borderColor: `${redAlpha(0.3)}` }} onClick={() => router.push(`/${locale}/challenges`)}>
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
    </div>
  );
}

