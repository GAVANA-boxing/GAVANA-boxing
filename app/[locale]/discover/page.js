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
import { getLocale, translate } from "@/lib/i18n";

const FIGHTER_STYLES = [
  { key: "all", labelKey: "discoverStyleAll", emoji: "🥊" },
  { key: "counter", labelKey: "discoverStyleCounter", emoji: "🎯", keywords: ["counter", "technique", "technical", "parry"] },
  { key: "pressure", labelKey: "discoverStylePressure", emoji: "💥", keywords: ["pressure", "conditioning", "bag", "power", "heavy"] },
  { key: "fastHands", labelKey: "discoverStyleFastHands", emoji: "⚡", keywords: ["speed", "fast", "combo", "rapid", "jab"] },
  { key: "footwork", labelKey: "discoverStyleFootwork", emoji: "👟", keywords: ["footwork", "movement", "pivot", "step", "shadow"] },
  { key: "technical", labelKey: "discoverStyleTechnical", emoji: "📐", keywords: ["technical", "technique", "timing", "rhythm"] },
  { key: "southpaw", labelKey: "discoverStyleSouthpaw", emoji: "🔄", keywords: ["southpaw", "orthodox", "stance"] },
];

const EDU_CATEGORIES = [
  { key: "all", labelKey: "discoverEduAll", emoji: "📚" },
  { key: "defense", labelKey: "discoverEduDefense", emoji: "🛡️", keywords: ["defense", "guard", "block", "parry", "slip", "roll"] },
  { key: "footwork", labelKey: "discoverEduFootwork", emoji: "👟", keywords: ["footwork", "movement", "pivot", "step", "angle"] },
  { key: "jab", labelKey: "discoverEduJab", emoji: "👊", keywords: ["jab", "lead hand", "jab cross", "straight"] },
  { key: "combo", labelKey: "discoverEduCombo", emoji: "💥", keywords: ["combo", "combination", "sequence", "1-2", "three"] },
  { key: "timing", labelKey: "discoverEduTiming", emoji: "⏱️", keywords: ["timing", "rhythm", "tempo", "reaction", "counter"] },
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

function ReelThumbCard({ reel, onClick }) {
  const typeEmoji = reel.contentType === "educational" ? "📚" : reel.contentType === "lifestyle" ? "🎬" : "🥊";
  const typeColor = reel.contentType === "educational" ? "#D4AF37" : reel.contentType === "lifestyle" ? "#60A5FA" : "#F87171";
  const diffColor = reel.difficulty === "beginner" ? "#34D399" : reel.difficulty === "intermediate" ? "#D4AF37" : "#F87171";

  return (
    <button type="button" onClick={onClick} style={s.reelCard}>
      <div style={s.reelThumb}>
        {reel.thumbnailUrl || reel.thumbnail ? (
          <img src={reel.thumbnailUrl || reel.thumbnail} alt="" style={s.reelThumbImg} />
        ) : (
          <div style={{ ...s.reelThumbFallback, background: `radial-gradient(circle at 40% 40%, rgba(193,18,31,0.28), transparent 60%), #0a0a0a` }}>
            <span style={{ fontSize: 22 }}>{typeEmoji}</span>
          </div>
        )}
        <span style={{ ...s.reelTypeBadge, color: typeColor }}>{typeEmoji}</span>
        {reel.difficulty && (
          <span style={{ ...s.reelDiffBadge, color: diffColor, borderColor: `${diffColor}55` }}>
            {reel.difficulty.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div style={s.reelCardBody}>
        <span style={s.reelCaption}>{reel.caption || reel.description || "Reel"}</span>
        <span style={s.reelMeta}>
          {formatCompact(reel.views || 0)} views · {formatCompact(reel.likes || reel.likesCount || 0)} ♥
        </span>
      </div>
    </button>
  );
}

function SectionRow({ title, reels, router, locale, viewAllPath, shimmer }) {
  if (shimmer) {
    return (
      <section style={s.section}>
        <p style={{ ...s.sectionLabel, marginBottom: 10 }}>{title}</p>
        <div style={s.shimmerRow}>
          {[1, 2, 3].map((i) => <div key={i} style={s.shimmerCard} />)}
        </div>
      </section>
    );
  }
  if (!reels || !reels.length) return null;
  return (
    <section style={s.section}>
      <div style={s.sectionHeader}>
        <p style={{ ...s.sectionLabel, margin: 0 }}>{title}</p>
        {viewAllPath && (
          <button type="button" onClick={() => router.push(viewAllPath)} style={s.viewAll}>
            See all ›
          </button>
        )}
      </div>
      <div style={s.scroll}>
        {reels.slice(0, 8).map((reel) => (
          <ReelThumbCard
            key={reel.id}
            reel={reel}
            onClick={() => router.push(`/${locale}/reels?reelId=${reel.id}`)}
          />
        ))}
      </div>
    </section>
  );
}

export default function DiscoverPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const [allReels, setAllReels] = useState([]);
  const [featuredCreators, setFeaturedCreators] = useState([]);
  const [topCoaches, setTopCoaches] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(true);
  const [userChallengeResults, setUserChallengeResults] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState("all");
  const [selectedEduCat, setSelectedEduCat] = useState("all");

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [userResults, setUserResults] = useState([]);
  const [reelResults, setReelResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const now = Timestamp.now();
        const [featuredSnap, reelsSnap, coachSnap] = await Promise.all([
          getDocs(fsQuery(collection(db, "featured_creators"), where("featuredUntil", ">=", now))),
          getDocs(fsQuery(collection(db, "reels"), orderBy("createdAt", "desc"), limit(60))),
          getDocs(fsQuery(collection(db, "users"), where("isCoach", "==", true), limit(6))),
        ]);
        if (!active) return;

        if (!featuredSnap.empty) {
          const creatorIds = featuredSnap.docs.map((d) => d.data().userId).filter(Boolean);
          if (creatorIds.length) {
            const usersSnap = await getDocs(collection(db, "users"));
            const profiles = [];
            usersSnap.forEach((d) => {
              if (creatorIds.includes(d.id)) {
                const feat = featuredSnap.docs.find((f) => f.data().userId === d.id);
                profiles.push({ id: d.id, ...d.data(), reason: feat?.data().reason || "" });
              }
            });
            if (active) setFeaturedCreators(profiles.slice(0, 6));
          }
        }
        if (active) {
          setAllReels(reelsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setTopCoaches(coachSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch { /* non-critical */ }
      if (active) setExploreLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    async function loadUserData() {
      try {
        const snap = await getDocs(
          fsQuery(collection(db, "challenge_results"), where("userId", "==", user.uid))
        );
        if (!active) return;
        setUserChallengeResults(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { /* non-critical */ }
    }
    loadUserData();
    return () => { active = false; };
  }, [user?.uid]);

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
        ) {
          users.push({ id: doc.id, ...d });
        }
      });
      const reels = [];
      reelsSnap.forEach((doc) => {
        const d = doc.data();
        if (String(d.caption || d.description || "").toLowerCase().includes(term)) {
          reels.push({ id: doc.id, ...d });
        }
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

  // Derived reel sections
  const nonDemoReels = useMemo(() => allReels.filter((r) => !r.isDemo), [allReels]);

  const forYouReels = useMemo(() => {
    if (selectedStyle === "all") return nonDemoReels;
    const style = FIGHTER_STYLES.find((st) => st.key === selectedStyle);
    if (!style?.keywords) return nonDemoReels;
    const matched = nonDemoReels.filter((r) => reelMatchesKeywords(r, style.keywords));
    return matched.length ? matched : nonDemoReels;
  }, [nonDemoReels, selectedStyle]);

  const beginnerReels = useMemo(
    () => nonDemoReels.filter((r) => r.difficulty === "beginner"),
    [nonDemoReels]
  );
  const educationalReels = useMemo(
    () => nonDemoReels.filter((r) => r.contentType === "educational"),
    [nonDemoReels]
  );
  const timingReels = useMemo(
    () => nonDemoReels.filter((r) => reelMatchesKeywords(r, ["timing", "reaction", "rhythm", "tempo"])),
    [nonDemoReels]
  );
  const footworkReels = useMemo(
    () => nonDemoReels.filter((r) => reelMatchesKeywords(r, ["footwork", "movement", "pivot", "angle", "step"])),
    [nonDemoReels]
  );
  const comboReels = useMemo(
    () => nonDemoReels.filter((r) => reelMatchesKeywords(r, ["combo", "combination", "1-2", "three punch", "sequence"])),
    [nonDemoReels]
  );
  const filteredEduReels = useMemo(() => {
    if (selectedEduCat === "all") return educationalReels;
    const cat = EDU_CATEGORIES.find((c) => c.key === selectedEduCat);
    if (!cat?.keywords) return educationalReels;
    return educationalReels.filter((r) => reelMatchesKeywords(r, cat.keywords));
  }, [educationalReels, selectedEduCat]);

  // Personalization: progression hint
  const completedCount = useMemo(
    () => userChallengeResults.filter((r) => Number.isFinite(Number(r.score)) && Number(r.score) >= 5).length,
    [userChallengeResults]
  );
  const bestScore = useMemo(() => {
    const scores = userChallengeResults.map((r) => Number(r.score)).filter(Number.isFinite);
    return scores.length ? Math.max(...scores) : null;
  }, [userChallengeResults]);
  const showNextLevelHint = completedCount >= 3 && (bestScore === null || bestScore < 8);

  const showSearch = hasSearched && query.trim();

  return (
    <div style={s.page}>
      <div style={s.header}>
        <p style={s.kicker}>{t("discoverKicker")}</p>
        <h1 style={s.title}>{t("discoverTitle")}</h1>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={s.searchRow}>
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("discoverPlaceholder")}
            style={s.searchInput}
          />
          {query && <button type="button" onClick={clearSearch} style={s.clearBtn}>✕</button>}
        </div>
        <button type="submit" style={s.searchBtn} disabled={searching || !query.trim()}>
          {searching ? "…" : t("discoverSearch")}
        </button>
      </form>

      {showSearch ? (
        <div style={s.content}>
          <p style={s.sectionLabel}>{t("discoverSearchResults")}</p>
          {userResults.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={s.subLabel}>{t("discoverFighters")}</p>
              <div style={s.cardList}>
                {userResults.map((u) => {
                  const photo = u.photoURL || u.profileImageUrl || "";
                  const initial = (u.displayName || u.username || "U").charAt(0).toUpperCase();
                  return (
                    <button key={u.id} type="button" onClick={() => router.push(`/${locale}/profile/${u.id}`)} style={s.listCard}>
                      <div style={s.avatar}>{photo ? <img src={photo} alt="" style={s.avatarImg} /> : initial}</div>
                      <div style={s.listCardText}>
                        <span style={s.listCardName}>{u.displayName || u.username || "Unnamed"}</span>
                        {u.username && <span style={s.listCardSub}>@{u.username}</span>}
                      </div>
                      <span style={s.arrow}>›</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {reelResults.length > 0 && (
            <div>
              <p style={s.subLabel}>{t("discoverReels")}</p>
              <div style={s.cardList}>
                {reelResults.map((r) => (
                  <button key={r.id} type="button" onClick={() => router.push(`/${locale}/reels?reelId=${r.id}`)} style={s.listCard}>
                    <div style={{ ...s.avatar, background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>🎬</div>
                    <div style={s.listCardText}>
                      <span style={s.listCardName}>{r.caption || r.description || "Reel"}</span>
                      <span style={s.listCardSub}>{formatCompact(r.views || 0)} {t("views")}</span>
                    </div>
                    <span style={s.arrow}>›</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {userResults.length === 0 && reelResults.length === 0 && !searching && (
            <div style={s.emptyState}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
              <p style={{ margin: 0, color: "#888" }}>{t("discoverNoMatches")}</p>
            </div>
          )}
        </div>
      ) : (
        <div style={s.content}>
          {/* Fighter Style Identity chips */}
          <p style={s.styleFilterLabel}>{t("discoverStyleFilterLabel")}</p>
          <div style={s.styleChips}>
            {FIGHTER_STYLES.map((style) => (
              <button
                key={style.key}
                type="button"
                onClick={() => setSelectedStyle(style.key)}
                style={{ ...s.styleChip, ...(selectedStyle === style.key ? s.styleChipActive : {}) }}
              >
                <span>{style.emoji}</span>
                <span>{t(style.labelKey)}</span>
              </button>
            ))}
          </div>

          {/* Progression hint */}
          {showNextLevelHint && (
            <button type="button" style={s.progressionCard} onClick={() => router.push(`/${locale}/challenges`)}>
              <div style={s.progressionLeft}>
                <span style={s.progressionEmoji}>⬆️</span>
                <div>
                  <p style={s.progressionTitle}>{t("discoverNextLevel")}</p>
                  <p style={s.progressionDesc}>{t("discoverNextLevelDesc").replace("{n}", completedCount)}</p>
                </div>
              </div>
              <span style={s.progressionArrow}>›</span>
            </button>
          )}

          {/* For You / style-filtered feed */}
          <SectionRow
            title={`🎯 ${t("discoverForYou")}`}
            reels={forYouReels}
            router={router}
            locale={locale}
            viewAllPath={`/${locale}/reels`}
            shimmer={exploreLoading}
          />

          {/* Beginner Friendly — shown when no style filter active */}
          {selectedStyle === "all" && (
            <SectionRow
              title={`🟢 ${t("discoverForBeginners")}`}
              reels={beginnerReels}
              router={router}
              locale={locale}
            />
          )}

          {/* Timing & Reaction */}
          <SectionRow
            title={`⏱️ ${t("discoverTiming")}`}
            reels={timingReels}
            router={router}
            locale={locale}
          />

          {/* Footwork Focus */}
          <SectionRow
            title={`👟 ${t("discoverFootworkFocus")}`}
            reels={footworkReels}
            router={router}
            locale={locale}
          />

          {/* Fast Combo Drills */}
          <SectionRow
            title={`⚡ ${t("discoverComboDrills")}`}
            reels={comboReels}
            router={router}
            locale={locale}
          />

          {/* Educational section with subcategory pills */}
          {(educationalReels.length > 0 || exploreLoading) && (
            <section style={s.section}>
              <div style={s.sectionHeader}>
                <p style={{ ...s.sectionLabel, margin: 0 }}>📚 {t("discoverEduSection")}</p>
                <button type="button" onClick={() => router.push(`/${locale}/reels`)} style={s.viewAll}>
                  {t("discoverViewAll")} ›
                </button>
              </div>
              <div style={s.chips}>
                {EDU_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedEduCat(cat.key)}
                    style={{ ...s.chip, ...(selectedEduCat === cat.key ? s.chipActive : {}) }}
                  >
                    {cat.emoji} {t(cat.labelKey)}
                  </button>
                ))}
              </div>
              {exploreLoading ? (
                <div style={s.shimmerRow}>{[1, 2, 3].map((i) => <div key={i} style={s.shimmerCard} />)}</div>
              ) : filteredEduReels.length > 0 ? (
                <div style={s.scroll}>
                  {filteredEduReels.slice(0, 8).map((reel) => (
                    <ReelThumbCard key={reel.id} reel={reel} onClick={() => router.push(`/${locale}/reels?reelId=${reel.id}`)} />
                  ))}
                </div>
              ) : (
                <div style={s.emptyState}>
                  <p style={{ margin: 0, color: "#888", fontSize: 13 }}>No content in this category yet.</p>
                </div>
              )}
            </section>
          )}

          {/* Featured creators */}
          {featuredCreators.length > 0 && (
            <section style={s.section}>
              <div style={s.sectionHeader}>
                <p style={{ ...s.sectionLabel, margin: 0 }}>⭐ {t("discoverFeatured")}</p>
              </div>
              <div style={s.scroll}>
                {featuredCreators.map((c) => {
                  const photo = c.photoURL || c.profileImageUrl || "";
                  const initial = (c.displayName || c.username || "C").charAt(0).toUpperCase();
                  return (
                    <button key={c.id} type="button" onClick={() => router.push(`/${locale}/profile/${c.id}`)} style={s.creatorCard}>
                      <div style={s.creatorAvatar}>
                        {photo ? <img src={photo} alt="" style={s.avatarImg} /> : initial}
                      </div>
                      <span style={s.creatorName}>{c.displayName || c.username || "Creator"}</span>
                      <span style={s.featuredBadge}>⭐ {t("featuredBadge")}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Compact quick-action pill strip */}
          <section style={s.section}>
            <div style={s.sectionHeader}>
              <p style={{ ...s.sectionLabel, margin: 0 }}>🗺️ Explore</p>
            </div>
            <div style={s.quickPills}>
              <button type="button" onClick={() => router.push(`/${locale}/leaderboard`)} style={s.quickPill}>
                🏆 {t("leaderboardTitle")}
              </button>
              <button type="button" onClick={() => router.push(`/${locale}/challenges`)} style={{ ...s.quickPill, borderColor: "rgba(193,18,31,0.35)", color: "#F87171" }}>
                🥊 {t("challengesTitle")}
              </button>
              <button type="button" onClick={() => router.push(`/${locale}/coach`)} style={{ ...s.quickPill, borderColor: "rgba(96,165,250,0.28)", color: "#60A5FA" }}>
                🎓 {t("navCoach")}
              </button>
              <button type="button" onClick={() => router.push(`/${locale}/gyms`)} style={{ ...s.quickPill, borderColor: "rgba(52,211,153,0.28)", color: "#34D399" }}>
                🏋️ {t("gymsTitle")}
              </button>
            </div>
          </section>

          {/* Top Coaches */}
          {topCoaches.length > 0 && (
            <section style={s.section}>
              <div style={s.sectionHeader}>
                <p style={{ ...s.sectionLabel, margin: 0 }}>🎓 {t("discoverTopCoaches")}</p>
                <button type="button" onClick={() => router.push(`/${locale}/coach`)} style={s.viewAll}>
                  {t("discoverViewAll")} ›
                </button>
              </div>
              <div style={s.cardList}>
                {topCoaches.map((coach) => {
                  const photo = coach.photoURL || coach.profileImageUrl || "";
                  const initial = (coach.displayName || coach.username || "C").charAt(0).toUpperCase();
                  return (
                    <button key={coach.id} type="button" onClick={() => router.push(`/${locale}/coach/${coach.id}`)} style={s.listCard}>
                      <div style={{ ...s.avatar, border: "2px solid rgba(96,165,250,0.4)" }}>
                        {photo ? <img src={photo} alt="" style={s.avatarImg} /> : initial}
                      </div>
                      <div style={s.listCardText}>
                        <span style={s.listCardName}>{coach.displayName || coach.username || "Coach"}</span>
                        <span style={{ ...s.listCardSub, color: "#60A5FA" }}>{coach.coachSpecialty || coach.specialty || t("navCoach")}</span>
                      </div>
                      <span style={s.arrow}>›</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #070707 0%, #090909 100%)",
    color: "#fff",
    paddingBottom: 100,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    padding: "calc(28px + env(safe-area-inset-top)) 20px 0",
    maxWidth: 640,
  },
  kicker: {
    margin: 0,
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    margin: "6px 0 20px",
    fontSize: 30,
    lineHeight: 1.05,
    fontWeight: 900,
    fontFamily: "var(--font-anton, 'Anton', sans-serif)",
    letterSpacing: 0.5,
  },
  searchRow: {
    display: "flex",
    gap: 10,
    padding: "0 20px 16px",
    position: "sticky",
    top: 0,
    background: "rgba(7,7,7,0.96)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    zIndex: 50,
  },
  searchWrap: {
    flex: 1,
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    fontSize: 14,
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    padding: "0 36px 0 40px",
    fontSize: 14,
    outline: "none",
  },
  clearBtn: {
    position: "absolute",
    right: 10,
    background: "none",
    border: "none",
    color: "#666",
    fontSize: 13,
    cursor: "pointer",
    padding: 4,
  },
  searchBtn: {
    height: 46,
    padding: "0 18px",
    borderRadius: 14,
    border: "none",
    background: "#C1121F",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    flexShrink: 0,
  },
  content: {
    padding: "0 20px",
  },
  styleFilterLabel: {
    margin: "0 0 8px",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#666",
  },
  styleChips: {
    display: "flex",
    gap: 7,
    overflowX: "auto",
    paddingBottom: 4,
    marginBottom: 18,
    scrollbarWidth: "none",
  },
  styleChip: {
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "7px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#aaa",
    fontSize: 12,
    fontWeight: 750,
    cursor: "pointer",
    whiteSpace: "nowrap",
    WebkitTapHighlightColor: "transparent",
  },
  styleChipActive: {
    background: "linear-gradient(135deg, rgba(193,18,31,0.9), rgba(92,7,17,0.9))",
    borderColor: "rgba(193,18,31,0.5)",
    color: "#fff",
    fontWeight: 900,
  },
  progressionCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "13px 16px",
    marginBottom: 18,
    borderRadius: 16,
    border: "1px solid rgba(212,175,55,0.3)",
    background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(11,11,11,0.98))",
    cursor: "pointer",
    color: "#fff",
    boxSizing: "border-box",
  },
  progressionLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    textAlign: "left",
  },
  progressionEmoji: {
    fontSize: 22,
    lineHeight: 1,
    flexShrink: 0,
  },
  progressionTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 900,
    color: "#D4AF37",
    lineHeight: 1.2,
  },
  progressionDesc: {
    margin: "3px 0 0",
    fontSize: 12,
    color: "#888",
    fontWeight: 600,
    lineHeight: 1.3,
  },
  progressionArrow: {
    color: "#D4AF37",
    fontSize: 20,
    flexShrink: 0,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#fff",
  },
  subLabel: {
    margin: "0 0 10px",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#888",
  },
  viewAll: {
    background: "none",
    border: "none",
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    padding: 0,
  },
  chips: {
    display: "flex",
    gap: 7,
    overflowX: "auto",
    paddingBottom: 4,
    marginBottom: 12,
    scrollbarWidth: "none",
  },
  chip: {
    flexShrink: 0,
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#aaa",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  chipActive: {
    background: "#C1121F",
    borderColor: "#C1121F",
    color: "#fff",
  },
  scroll: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 4,
    scrollbarWidth: "none",
  },
  reelCard: {
    flexShrink: 0,
    width: 136,
    borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    overflow: "hidden",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    color: "#fff",
    textAlign: "left",
    WebkitTapHighlightColor: "transparent",
  },
  reelThumb: {
    width: "100%",
    height: 106,
    background: "#0a0a0a",
    position: "relative",
    flexShrink: 0,
    overflow: "hidden",
  },
  reelThumbFallback: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  reelThumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  reelTypeBadge: {
    position: "absolute",
    top: 5,
    left: 6,
    fontSize: 12,
    lineHeight: 1,
    filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.9))",
  },
  reelDiffBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    fontSize: 9,
    fontWeight: 900,
    lineHeight: 1,
    padding: "2px 5px",
    borderRadius: 999,
    border: "1px solid",
    background: "rgba(0,0,0,0.7)",
    letterSpacing: 0.3,
  },
  reelCardBody: {
    padding: "7px 9px 9px",
    display: "grid",
    gap: 3,
  },
  reelCaption: {
    fontSize: 11,
    fontWeight: 700,
    color: "#eee",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    lineHeight: 1.35,
  },
  reelMeta: {
    fontSize: 10,
    color: "#666",
    fontWeight: 600,
  },
  quickPills: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  quickPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#ccc",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  creatorCard: {
    flexShrink: 0,
    width: 100,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "12px 10px",
    borderRadius: 16,
    background: "rgba(212,175,55,0.06)",
    border: "1px solid rgba(212,175,55,0.2)",
    cursor: "pointer",
    color: "#fff",
    WebkitTapHighlightColor: "transparent",
  },
  creatorAvatar: {
    width: 46,
    height: 46,
    borderRadius: "50%",
    background: "#1a1a1a",
    border: "2px solid #D4AF37",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 17,
    fontWeight: 900,
    overflow: "hidden",
    flexShrink: 0,
  },
  creatorName: {
    fontSize: 11,
    fontWeight: 700,
    color: "#eee",
    textAlign: "center",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "100%",
  },
  featuredBadge: {
    fontSize: 9,
    color: "#D4AF37",
    fontWeight: 900,
    letterSpacing: 0.4,
  },
  cardList: {
    display: "grid",
    gap: 8,
  },
  listCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "11px 14px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    cursor: "pointer",
    color: "#fff",
    textAlign: "left",
    width: "100%",
    WebkitTapHighlightColor: "transparent",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "rgba(193,18,31,0.22)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 900,
    flexShrink: 0,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  listCardText: {
    flex: 1,
    minWidth: 0,
    display: "grid",
    gap: 2,
  },
  listCardName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#eee",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  listCardSub: {
    fontSize: 12,
    color: "#888",
  },
  arrow: {
    color: "#555",
    fontSize: 18,
    lineHeight: 1,
    flexShrink: 0,
  },
  emptyState: {
    textAlign: "center",
    padding: "20px 20px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  shimmerRow: {
    display: "flex",
    gap: 10,
  },
  shimmerCard: {
    flexShrink: 0,
    width: 136,
    height: 160,
    borderRadius: 14,
    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.6s infinite",
  },
};
