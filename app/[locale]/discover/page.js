"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection, getDocs, query as fsQuery, where,
  orderBy, limit, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import { getLocale, translate } from "@/lib/i18n";

const CATEGORIES = [
  { key: "discoverCatAll", value: "" },
  { key: "discoverCatTech", value: "technique" },
  { key: "discoverCatSpar", value: "sparring" },
  { key: "discoverCatCond", value: "conditioning" },
  { key: "discoverCatShadow", value: "shadow" },
  { key: "discoverCatBag", value: "bag_work" },
];

function formatCompact(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return String(num);
}

export default function DiscoverPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  // Explore state
  const [featuredCreators, setFeaturedCreators] = useState([]);
  const [trendingReels, setTrendingReels] = useState([]);
  const [topCoaches, setTopCoaches] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [exploreLoading, setExploreLoading] = useState(true);

  // Search state
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [userResults, setUserResults] = useState([]);
  const [reelResults, setReelResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Load explore data on mount
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const now = Timestamp.now();
        const [featuredSnap, reelsSnap, coachSnap] = await Promise.all([
          getDocs(fsQuery(collection(db, "featured_creators"), where("featuredUntil", ">=", now))),
          getDocs(fsQuery(collection(db, "reels"), orderBy("views", "desc"), limit(10))),
          getDocs(fsQuery(collection(db, "users"), where("isCoach", "==", true), limit(6))),
        ]);
        if (!active) return;

        // Featured creators
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

        // Trending reels
        if (active) {
          setTrendingReels(reelsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }

        // Top coaches
        if (active) {
          setTopCoaches(coachSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
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

  const filteredTrending = selectedCategory
    ? trendingReels.filter((r) => r.category === selectedCategory)
    : trendingReels;

  const showSearch = hasSearched && query.trim();

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <p style={s.kicker}>{t("discoverKicker")}</p>
        <h1 style={s.title}>{t("discoverTitle")}</h1>
      </div>

      {/* Search bar */}
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
          {query && (
            <button type="button" onClick={clearSearch} style={s.clearBtn}>✕</button>
          )}
        </div>
        <button type="submit" style={s.searchBtn} disabled={searching || !query.trim()}>
          {searching ? "…" : t("discoverSearch")}
        </button>
      </form>

      {showSearch ? (
        /* ── Search Results ── */
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
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => router.push(`/${locale}/profile/${u.id}`)}
                      style={s.listCard}
                    >
                      <div style={s.avatar}>
                        {photo ? <img src={photo} alt="" style={s.avatarImg} /> : initial}
                      </div>
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
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => router.push(`/${locale}/reels?reelId=${r.id}`)}
                    style={s.listCard}
                  >
                    <div style={{ ...s.avatar, background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>
                      🎬
                    </div>
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
        /* ── Explore Mode ── */
        <div style={s.content}>
          {/* Quick action cards */}
          <div style={s.quickGrid}>
            <button type="button" onClick={() => router.push(`/${locale}/leaderboard`)} style={{ ...s.quickCard, background: "rgba(212,175,55,0.09)", borderColor: "rgba(212,175,55,0.22)" }}>
              <span style={s.quickIcon}>🏆</span>
              <span style={s.quickLabel}>{t("leaderboardTitle")}</span>
            </button>
            <button type="button" onClick={() => router.push(`/${locale}/challenges`)} style={{ ...s.quickCard, background: "rgba(193,18,31,0.1)", borderColor: "rgba(193,18,31,0.28)" }}>
              <span style={s.quickIcon}>🥊</span>
              <span style={s.quickLabel}>{t("challengesTitle")}</span>
            </button>
            <button type="button" onClick={() => router.push(`/${locale}/coach`)} style={{ ...s.quickCard, background: "rgba(96,165,250,0.08)", borderColor: "rgba(96,165,250,0.2)" }}>
              <span style={s.quickIcon}>🎓</span>
              <span style={s.quickLabel}>{t("navCoach")}</span>
            </button>
            <button type="button" onClick={() => router.push(`/${locale}/gyms`)} style={{ ...s.quickCard, background: "rgba(52,211,153,0.08)", borderColor: "rgba(52,211,153,0.2)" }}>
              <span style={s.quickIcon}>🏋️</span>
              <span style={s.quickLabel}>{t("gymsTitle")}</span>
            </button>
          </div>

          {/* Category chips */}
          <div style={s.chips}>
            {CATEGORIES.map(({ key, value }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCategory(value)}
                style={{
                  ...s.chip,
                  ...(selectedCategory === value ? s.chipActive : {}),
                }}
              >
                {t(key)}
              </button>
            ))}
          </div>

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
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => router.push(`/${locale}/profile/${c.id}`)}
                      style={s.creatorCard}
                    >
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

          {/* Trending reels */}
          <section style={s.section}>
            <div style={s.sectionHeader}>
              <p style={{ ...s.sectionLabel, margin: 0 }}>🔥 {t("discoverTrendingReels")}</p>
              <button type="button" onClick={() => router.push(`/${locale}/reels`)} style={s.viewAll}>
                {t("discoverViewAll")} ›
              </button>
            </div>
            {exploreLoading ? (
              <div style={s.shimmerRow}>
                {[1,2,3].map((i) => <div key={i} style={s.shimmerCard} />)}
              </div>
            ) : filteredTrending.length === 0 ? (
              <div style={s.emptyState}><p style={{ margin: 0, color: "#888" }}>{t("discoverNoTrending")}</p></div>
            ) : (
              <div style={s.scroll}>
                {filteredTrending.slice(0, 8).map((reel) => (
                  <button
                    key={reel.id}
                    type="button"
                    onClick={() => router.push(`/${locale}/reels?reelId=${reel.id}`)}
                    style={s.reelCard}
                  >
                    <div style={s.reelThumb}>
                      {reel.thumbnailUrl || reel.thumbnail ? (
                        <img src={reel.thumbnailUrl || reel.thumbnail} alt="" style={s.reelThumbImg} />
                      ) : (
                        <span style={{ fontSize: 24 }}>🥊</span>
                      )}
                    </div>
                    <div style={s.reelCardBody}>
                      <span style={s.reelCaption}>{reel.caption || reel.description || "Reel"}</span>
                      <span style={s.reelMeta}>{formatCompact(reel.views || 0)} {t("views")}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Top coaches */}
          {(topCoaches.length > 0 || !exploreLoading) && (
            <section style={s.section}>
              <div style={s.sectionHeader}>
                <p style={{ ...s.sectionLabel, margin: 0 }}>🎓 {t("discoverTopCoaches")}</p>
                <button type="button" onClick={() => router.push(`/${locale}/coach`)} style={s.viewAll}>
                  {t("discoverViewAll")} ›
                </button>
              </div>
              {exploreLoading ? (
                <div style={s.shimmerRow}>
                  {[1,2].map((i) => <div key={i} style={{ ...s.shimmerCard, height: 64 }} />)}
                </div>
              ) : topCoaches.length === 0 ? (
                <div style={s.emptyState}>
                  <p style={{ margin: 0, color: "#888" }}>{t("discoverNoCoaches")}</p>
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/coach/apply`)}
                    style={{ marginTop: 12, padding: "10px 22px", borderRadius: 12, border: "none", background: "#C1121F", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                  >
                    {t("becomeCoach")}
                  </button>
                </div>
              ) : (
                <div style={s.cardList}>
                  {topCoaches.map((coach) => {
                    const photo = coach.photoURL || coach.profileImageUrl || "";
                    const initial = (coach.displayName || coach.username || "C").charAt(0).toUpperCase();
                    return (
                      <button
                        key={coach.id}
                        type="button"
                        onClick={() => router.push(`/${locale}/coach/${coach.id}`)}
                        style={s.listCard}
                      >
                        <div style={{ ...s.avatar, border: "2px solid rgba(96,165,250,0.4)" }}>
                          {photo ? <img src={photo} alt="" style={s.avatarImg} /> : initial}
                        </div>
                        <div style={s.listCardText}>
                          <span style={s.listCardName}>{coach.displayName || coach.username || "Coach"}</span>
                          <span style={{ ...s.listCardSub, color: "#60A5FA" }}>
                            {coach.coachSpecialty || coach.specialty || t("navCoach")}
                          </span>
                        </div>
                        <span style={s.arrow}>›</span>
                      </button>
                    );
                  })}
                </div>
              )}
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
    padding: "28px 20px 0",
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
    opacity: 1,
  },
  content: {
    padding: "0 20px",
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
    marginBottom: 20,
  },
  quickCard: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid",
    cursor: "pointer",
    color: "#fff",
  },
  quickIcon: {
    fontSize: 22,
    lineHeight: 1,
    flexShrink: 0,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.2,
    textAlign: "left",
    color: "#ddd",
    lineHeight: 1.2,
  },
  chips: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 4,
    marginBottom: 20,
    scrollbarWidth: "none",
  },
  chip: {
    flexShrink: 0,
    padding: "7px 14px",
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
    letterSpacing: 1,
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
  scroll: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 4,
    scrollbarWidth: "none",
  },
  creatorCard: {
    flexShrink: 0,
    width: 110,
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
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#1a1a1a",
    border: "2px solid #D4AF37",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
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
  reelCard: {
    flexShrink: 0,
    width: 140,
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    overflow: "hidden",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    color: "#fff",
    textAlign: "left",
  },
  reelThumb: {
    width: "100%",
    height: 110,
    background: "rgba(193,18,31,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  reelThumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  reelCardBody: {
    padding: "8px 10px 10px",
    display: "grid",
    gap: 3,
  },
  reelCaption: {
    fontSize: 12,
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
    color: "#888",
    fontWeight: 600,
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
    padding: "24px 20px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  shimmerRow: {
    display: "flex",
    gap: 10,
  },
  shimmerCard: {
    flexShrink: 0,
    width: 140,
    height: 170,
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
    animation: "shimmer 1.5s infinite",
  },
};
