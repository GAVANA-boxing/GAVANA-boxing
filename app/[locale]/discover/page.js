"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection, getDocs, query as fsQuery, where,
  orderBy, limit, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import StoryBar from "@/components/StoryBar";
import { getLocale, translate } from "@/lib/i18n";
import { FIGHTERS } from "@/lib/fighters";

// ─── Legendary fighter mini card (for Fighter Study row) ─────────────────────
function FighterStudyCard({ fighter, onClick }) {
  const acc = fighter.accent;
  return (
    <button type="button" onClick={onClick} style={fs.card}>
      <div style={{ ...fs.cardTop, background: `linear-gradient(150deg, ${acc}28 0%, #111 100%)` }}>
        <span style={fs.cardFlag}>{fighter.country}</span>
        <div style={{ ...fs.cardAccentBar, background: acc }} />
      </div>
      <div style={fs.cardBody}>
        <p style={fs.cardName}>{fighter.name}</p>
        <p style={fs.cardNickname}>"{fighter.nickname}"</p>
        <span style={{ ...fs.cardPill, borderColor: acc + "55", color: acc }}>{fighter.style}</span>
      </div>
    </button>
  );
}

// Fighter Study card styles
const fs = {
  card: {
    flexShrink: 0,
    width: 120,
    background: "#111",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
    overflow: "hidden",
    cursor: "pointer",
    textAlign: "left",
    padding: 0,
  },
  cardTop: {
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cardFlag: {
    fontSize: 30,
    lineHeight: 1,
  },
  cardAccentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.5,
  },
  cardBody: {
    padding: "8px 10px 10px",
  },
  cardName: {
    margin: "0 0 1px",
    fontSize: 11,
    fontWeight: 800,
    color: "#fff",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardNickname: {
    margin: "0 0 6px",
    fontSize: 9,
    color: "#666",
    fontStyle: "italic",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardPill: {
    display: "inline-block",
    border: "1px solid",
    borderRadius: 20,
    padding: "1px 6px",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 0.2,
    textTransform: "uppercase",
    lineHeight: 1.6,
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
  { key: "all", emoji: "📚", label: "All" },
  { key: "combo", emoji: "💥", label: "Combo", keywords: ["combo", "combination", "1-2", "sequence"] },
  { key: "timing", emoji: "⏱️", label: "Timing", keywords: ["timing", "rhythm", "tempo", "reaction"] },
  { key: "footwork", emoji: "👟", label: "Footwork", keywords: ["footwork", "movement", "pivot", "step", "angle"] },
  { key: "defense", emoji: "🛡️", label: "Defense", keywords: ["defense", "guard", "block", "slip", "roll", "parry"] },
  { key: "jab", emoji: "👊", label: "Jab", keywords: ["jab", "lead hand", "straight", "jab cross"] },
  { key: "pressure", emoji: "🔥", label: "Pressure", keywords: ["pressure", "forward", "cut off", "body"] },
  { key: "counter", emoji: "🎯", label: "Counter", keywords: ["counter", "counterpunch", "parry", "check"] },
];

function formatCompact(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return String(num);
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
  const typeColor = reel.contentType === "educational" ? "#D4AF37" : reel.contentType === "lifestyle" ? "#60A5FA" : "#C1121F";
  const caption = reel.caption || reel.description || reel.title || "";
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
          <div style={{ ...s.reelThumbFallback, background: `linear-gradient(160deg, ${typeColor}22 0%, #111 60%, #0a0a0a 100%)` }}>
            <span style={{ fontSize: 34, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}>{typeEmoji}</span>
            {caption ? (
              <p style={s.reelFallbackCaption}>{caption}</p>
            ) : null}
          </div>
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
        {[1, 2, 3, 4].map((i) => <div key={i} style={s.shimmerCard} />)}
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

export default function DiscoverPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const [allReels, setAllReels] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState("all");
  const [learnOpen, setLearnOpen] = useState(false);
  const [learnCat, setLearnCat] = useState("all");
  const [challengesOpen, setChallengesOpen] = useState(false);
  const [topCoaches, setTopCoaches] = useState([]);

  // Search
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [userResults, setUserResults] = useState([]);
  const [reelResults, setReelResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [reelsSnap, coachSnap] = await Promise.all([
          getDocs(fsQuery(collection(db, "reels"), orderBy("createdAt", "desc"), limit(80))),
          getDocs(fsQuery(collection(db, "users"), where("isCoach", "==", true), limit(4))),
        ]);
        if (!active) return;
        setAllReels(reelsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setTopCoaches(coachSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { /* non-critical */ }
      if (active) setExploreLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    const term = query.trim().toLowerCase();
    if (!term) return;
    setSearching(true);
    setHasSearched(true);
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
    } catch { /* silent */ }
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
        <p style={s.kicker}>GAVANA</p>
        <h1 style={s.title}>{t("discoverTitle")}</h1>
      </div>

      {/* ── Stories ── */}
      <StoryBar locale={locale} router={router} />

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
          />
          {query && (
            <button type="button" onClick={clearSearch} style={s.clearBtn}>✕</button>
          )}
        </div>
        <button type="submit" style={s.searchBtn} disabled={searching || !query.trim()}>
          {searching ? "…" : t("discoverSearch")}
        </button>
      </form>

      {/* ══════════════════════════════════════════════
          SEARCH RESULTS
      ══════════════════════════════════════════════ */}
      {showSearch ? (
        <div style={s.content}>
          {userResults.length > 0 && (
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
                        <span style={s.listCardName}>{u.displayName || u.username || "Unnamed"}</span>
                        {u.username && <span style={s.listCardSub}>@{u.username}</span>}
                      </div>
                      <span style={s.listArrow}>›</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {reelResults.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p style={s.sectionLabel}>{t("discoverReels")}</p>
              <div style={s.listStack}>
                {reelResults.map((r) => (
                  <button key={r.id} type="button" onClick={() => router.push(`/${locale}/reels?reelId=${r.id}`)} style={s.listCard}>
                    <div style={{ ...s.listAvatar, background: "rgba(212,175,55,0.15)", color: "#D4AF37", fontSize: 18 }}>🎬</div>
                    <div style={s.listCardText}>
                      <span style={s.listCardName}>{r.caption || r.description || "Reel"}</span>
                      <span style={s.listCardSub}>{formatCompact(r.views || 0)} views</span>
                    </div>
                    <span style={s.listArrow}>›</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {userResults.length === 0 && reelResults.length === 0 && !searching && (
            <div style={s.emptyState}>
              <span style={{ fontSize: 36 }}>🔍</span>
              <p style={{ margin: "8px 0 0", color: "#666", fontSize: 14 }}>{t("discoverNoMatches")}</p>
            </div>
          )}
        </div>
      ) : (
        <div style={s.content}>

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
          </div>

          {/* ════════════════════════════════════════
              HUB 2 — 🧠 LEARN
          ════════════════════════════════════════ */}
          <HubCard
            emoji="🧠"
            title={t("discoverLearnHub")}
            accent="#D4AF37"
            expanded={learnOpen}
            onToggle={() => setLearnOpen((v) => !v)}
          >
            {/* ── Fighter Study subsection ── */}
            <div style={s.fighterStudySection}>
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

            <div style={s.learnDivider} />

            {/* Sub-category chips */}
            <div style={s.learnChips}>
              {LEARN_CATS.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setLearnCat(cat.key)}
                  style={{ ...s.learnChip, ...(learnCat === cat.key ? s.learnChipActive : {}) }}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            {filteredLearnReels.length > 0 ? (
              <ReelRow reels={filteredLearnReels} router={router} locale={locale} loading={false} />
            ) : (
              <div style={s.hubEmpty}>
                <p style={s.hubEmptyText}>No content yet in this category.</p>
              </div>
            )}

            <button type="button" style={s.hubFooterBtn} onClick={() => router.push(`/${locale}/reels`)}>
              Browse all technique reels →
            </button>
          </HubCard>

          {/* ════════════════════════════════════════
              HUB 3 — ⚔ CHALLENGES
          ════════════════════════════════════════ */}
          <HubCard
            emoji="⚔️"
            title={t("discoverChallengesHub")}
            accent="#C1121F"
            expanded={challengesOpen}
            onToggle={() => setChallengesOpen((v) => !v)}
          >
            {challengeReels.length > 0 ? (
              <ReelRow reels={challengeReels} router={router} locale={locale} loading={false} />
            ) : (
              <div style={s.hubEmpty}>
                <p style={s.hubEmptyText}>Challenge reels are waiting for you.</p>
              </div>
            )}

            {/* Challenge category quick links */}
            <div style={s.challengeGrid}>
              {[
                { emoji: "🟢", label: "Beginner", keywords: ["beginner"] },
                { emoji: "⚡", label: "Speed", keywords: ["speed", "fast"] },
                { emoji: "💥", label: "Power", keywords: ["power", "heavy"] },
                { emoji: "🏆", label: "Advanced", keywords: ["advanced", "pro"] },
              ].map((ch) => (
                <button
                  key={ch.label}
                  type="button"
                  style={s.challengeChip}
                  onClick={() => router.push(`/${locale}/challenges`)}
                >
                  {ch.emoji} {ch.label}
                </button>
              ))}
            </div>

            <button type="button" style={{ ...s.hubFooterBtn, color: "#F87171", borderColor: "rgba(193,18,31,0.3)" }} onClick={() => router.push(`/${locale}/challenges`)}>
              Go to all challenges →
            </button>
          </HubCard>

          {/* ════════════════════════════════════════
              EXPLORE — quick nav pills
          ════════════════════════════════════════ */}
          <div style={s.exploreSection}>
            <p style={s.exploreSectionLabel}>Explore</p>
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
          </div>

          {/* ════════════════════════════════════════
              TOP COACHES strip
          ════════════════════════════════════════ */}
          {topCoaches.length > 0 && (
            <div style={s.coachStrip}>
              <div style={s.coachStripHeader}>
                <span style={s.coachStripLabel}>🎓 {t("discoverTopCoaches")}</span>
                <button type="button" onClick={() => router.push(`/${locale}/coach`)} style={s.seeAllBtn}>
                  {t("discoverViewAll")} ›
                </button>
              </div>
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
                      <span style={s.coachName}>{(coach.displayName || coach.username || "Coach").split(" ")[0]}</span>
                      <span style={s.coachSpec}>{coach.coachSpecialties?.[0] || "Coach"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
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
    padding: "calc(22px + env(safe-area-inset-top)) 20px 10px",
  },
  kicker: {
    margin: 0,
    color: "#C1121F",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  title: {
    margin: "4px 0 0",
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: -0.5,
    lineHeight: 1.1,
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
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
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
    color: "#555",
    fontSize: 13,
    cursor: "pointer",
    padding: 4,
  },
  searchBtn: {
    height: 44,
    padding: "0 16px",
    borderRadius: 12,
    border: "none",
    background: "#C1121F",
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
    color: "#D4AF37",
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
    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s ease infinite",
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
    color: "#D4AF37",
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
    color: "#D4AF37",
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
    color: "#D4AF37",
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
};
