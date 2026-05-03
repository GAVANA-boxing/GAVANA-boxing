"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import { getLocale, translate } from "@/lib/i18n";

export default function DiscoverPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [userResults, setUserResults] = useState([]);
  const [reelResults, setReelResults] = useState([]);
  const [message, setMessage] = useState(() => translate(locale, "discoverSubtitle"));

  const handleSearch = async (event) => {
    event.preventDefault();
    const term = query.trim().toLowerCase();
    if (!term) {
      setUserResults([]);
      setReelResults([]);
      setMessage(t("discoverTypeKeyword"));
      return;
    }

    setLoading(true);
    setMessage(t("discoverSearching"));

    try {
      const [usersSnapshot, reelsSnapshot] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "reels")),
      ]);

      const users = [];
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        const username = String(data.username || "").toLowerCase();
        const displayName = String(data.displayName || "").toLowerCase();
        if (username.includes(term) || displayName.includes(term)) {
          users.push({ id: doc.id, ...data });
        }
      });

      const reels = [];
      reelsSnapshot.forEach((doc) => {
        const data = doc.data();
        const caption = String(data.caption || data.description || "").toLowerCase();
        if (caption.includes(term)) {
          reels.push({ id: doc.id, ...data });
        }
      });

      setUserResults(users.slice(0, 24));
      setReelResults(reels.slice(0, 24));
      setMessage(users.length + reels.length === 0 ? t("discoverNoMatches") : "");
    } catch (error) {
      console.error("Discover search failed:", error);
      setMessage(t("discoverError"));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = (userId) => {
    router.push(`/${locale}/profile/${userId}`);
  };

  const handleReelClick = (reelId) => {
    router.push(`/${locale}/reels?reelId=${reelId}`);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>{t("discoverKicker")}</p>
          <h1 style={styles.title}>{t("discoverTitle")}</h1>
          {message ? <p style={styles.subtitle}>{message}</p> : null}
        </div>

        {/* Leaderboard shortcut */}
        <button
          type="button"
          onClick={() => router.push(`/${locale}/leaderboard`)}
          style={styles.leaderboardCard}
        >
          <span style={styles.leaderboardCardIcon}>🏆</span>
          <div style={styles.leaderboardCardText}>
            <span style={styles.leaderboardCardTitle}>{t("leaderboardTitle")}</span>
            <span style={styles.leaderboardCardSub}>{t("leaderboardTopFighters")}</span>
          </div>
          <span style={styles.leaderboardCardArrow}>›</span>
        </button>

        <button
          type="button"
          onClick={() => router.push(`/${locale}/challenges`)}
          style={styles.challengeCard}
        >
          <span style={styles.challengeCardIcon}>GO</span>
          <div style={styles.leaderboardCardText}>
            <span style={styles.challengeCardTitle}>{t("challengesTitle")}</span>
            <span style={styles.challengeCardSub}>{t("challengesSubtitle")}</span>
          </div>
          <span style={styles.challengeCardArrow}>{">"}</span>
        </button>

        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("discoverPlaceholder")}
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchButton} disabled={loading}>
            {loading ? t("discoverSearching") : t("discoverSearch")}
          </button>
        </form>
      </div>

      <div style={styles.resultsGrid}>
        <section style={styles.resultSection}>
          <h2 style={styles.sectionTitle}>{t("discoverFighters")}</h2>
          {userResults.length === 0 ? (
            <div style={styles.emptyState}>{t("discoverNoFighters")}</div>
          ) : (
            <div style={styles.cardsGrid}>
              {userResults.map((profile) => {
                const photoURL = profile.photoURL || profile.profileImageUrl || profile.profileImage || profile.avatarUrl || "";
                const initial = (profile.displayName || profile.username || "U").charAt(0).toUpperCase();
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleProfileClick(profile.id)}
                    style={styles.card}
                  >
                    <div style={styles.cardHeader}>
                      <div style={styles.avatar}>
                        {photoURL
                          ? <img src={photoURL} alt={initial} style={styles.avatarImg} />
                          : initial}
                      </div>
                      <div>
                        <div style={styles.cardTitle}>{profile.displayName || profile.username || "Unnamed"}</div>
                        <div style={styles.cardSubtitle}>{profile.username ? `@${profile.username}` : t("fighterProfile")}</div>
                      </div>
                    </div>
                    {profile.bio ? <p style={styles.cardText}>{profile.bio}</p> : null}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section style={styles.resultSection}>
          <h2 style={styles.sectionTitle}>{t("discoverReels")}</h2>
          {reelResults.length === 0 ? (
            <div style={styles.emptyState}>{t("discoverNoReels")}</div>
          ) : (
            <div style={styles.cardsGrid}>
              {reelResults.map((reel) => {
                const thumbnailUrl = reel.thumbnailUrl || reel.posterUrl || "";
                const caption = reel.caption || reel.description || "";
                const views = Number(reel.views);

                return (
                  <button
                    key={reel.id}
                    type="button"
                    onClick={() => handleReelClick(reel.id)}
                    style={styles.card}
                  >
                    <div style={styles.cardHeader}>
                      <div style={styles.reelPreview}>
                        {thumbnailUrl ? (
                          <img src={thumbnailUrl} alt={caption || "Reel"} style={styles.reelPreviewImg} />
                        ) : (
                          <span>{(reel.username || "R").charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div style={styles.cardTitle}>{reel.username ? `@${reel.username}` : t("navReels")}</div>
                        <div style={styles.cardSubtitle}>{Number.isFinite(views) ? `${Math.round(views)} ${t("views")}` : ""}</div>
                      </div>
                    </div>
                    <p style={styles.cardText}>{caption}</p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    paddingBottom: "90px",
    background: "radial-gradient(circle at top, rgba(255,255,255,0.04), transparent 25%), linear-gradient(180deg, #070707 0%, #090909 100%)",
    color: "#fff",
    padding: "28px 20px 24px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    display: "grid",
    gap: 18,
    maxWidth: 900,
    margin: "0 auto 24px",
  },
  kicker: {
    margin: 0,
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 2,
  },
  title: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.05,
    fontWeight: 900,
  },
  subtitle: {
    margin: 0,
    color: "#AAA",
    fontSize: 15,
    lineHeight: 1.6,
  },
  searchForm: {
    display: "grid",
    gap: 12,
    width: "100%",
    maxWidth: 900,
    gridTemplateColumns: "1fr auto",
  },
  searchInput: {
    width: "100%",
    minHeight: 52,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    padding: "0 18px",
    fontSize: 15,
    outline: "none",
  },
  searchButton: {
    minWidth: 120,
    minHeight: 52,
    borderRadius: 16,
    border: "none",
    background: "#C1121F",
    color: "#fff",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
  },
  resultsGrid: {
    display: "grid",
    gap: 24,
    maxWidth: 1080,
    margin: "0 auto",
  },
  resultSection: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 24,
    padding: 20,
  },
  sectionTitle: {
    margin: "0 0 16px",
    color: "#fff",
    fontSize: 18,
    fontWeight: 800,
  },
  cardsGrid: {
    display: "grid",
    gap: 16,
  },
  card: {
    display: "grid",
    gap: 12,
    padding: 18,
    borderRadius: 20,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    textAlign: "left",
    cursor: "pointer",
    color: "#fff",
    width: "100%",
    font: "inherit",
  },
  cardHeader: {
    display: "flex",
    gap: 14,
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "rgba(193,18,31,0.24)",
    color: "#fff",
    fontWeight: 900,
    fontSize: 16,
    flexShrink: 0,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    borderRadius: "50%",
  },
  reelPreview: {
    width: 44,
    height: 58,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(145deg, rgba(193,18,31,0.28), rgba(212,175,55,0.14))",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#fff",
    fontWeight: 900,
    fontSize: 16,
    flexShrink: 0,
    overflow: "hidden",
  },
  reelPreviewImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  cardTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
  },
  cardSubtitle: {
    margin: 0,
    color: "#AAA",
    fontSize: 13,
  },
  cardText: {
    margin: 0,
    color: "#ddd",
    fontSize: 14,
    lineHeight: 1.6,
  },
  emptyState: {
    color: "#888",
    fontSize: 14,
    padding: 20,
    textAlign: "center",
    borderRadius: 16,
    background: "rgba(255,255,255,0.02)",
  },
  leaderboardCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(212,175,55,0.07)",
    border: "1px solid rgba(212,175,55,0.22)",
    color: "#fff",
    cursor: "pointer",
    textAlign: "left",
  },
  leaderboardCardIcon: {
    fontSize: 26,
    lineHeight: 1,
    flexShrink: 0,
  },
  leaderboardCardText: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  leaderboardCardTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#D4AF37",
    lineHeight: 1.2,
  },
  leaderboardCardSub: {
    fontSize: 12,
    color: "#888",
  },
  leaderboardCardArrow: {
    fontSize: 22,
    color: "#D4AF37",
    fontWeight: 900,
    lineHeight: 1,
    flexShrink: 0,
  },
  challengeCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    padding: "16px 18px",
    borderRadius: 18,
    background: "linear-gradient(135deg, rgba(193,18,31,0.95), rgba(94,8,16,0.92))",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 18px 46px rgba(193,18,31,0.22)",
    color: "#fff",
    cursor: "pointer",
    textAlign: "left",
  },
  challengeCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    background: "rgba(212,175,55,0.18)",
    border: "1px solid rgba(212,175,55,0.36)",
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: 0,
  },
  challengeCardTitle: {
    fontSize: 16,
    fontWeight: 1000,
    color: "#fff",
    lineHeight: 1.2,
  },
  challengeCardSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.35,
  },
  challengeCardArrow: {
    fontSize: 22,
    color: "#D4AF37",
    fontWeight: 1000,
    lineHeight: 1,
    flexShrink: 0,
  },
};
