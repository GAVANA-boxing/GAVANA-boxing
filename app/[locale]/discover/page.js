"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import StoryBar from "@/components/StoryBar";
import PageTopBar from "@/components/PageTopBar";
import { getLocale, translate } from "@/lib/i18n";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import { s, feed } from "@/components/discover/discoverStyles";
import { formatCompact } from "@/lib/utils";
import { ReelRow, HubCard, FeedPostCard, reelMatchesKeywords } from "@/components/discover/DiscoverCards";
import { useDiscoverData } from "@/hooks/useDiscoverData";
import { useDiscoverSearch } from "@/hooks/useDiscoverSearch";
import Image from "next/image";
import { FIGHTER_STYLES, LEARN_CATS } from "@/lib/discoverConstants";

export default function DiscoverPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const [selectedStyle, setSelectedStyle] = useState("all");
  const [learnOpen, setLearnOpen] = useState(false);
  const [learnCat, setLearnCat] = useState("all");
  const [feedTab, setFeedTab] = useState("explore");

  const {
    query, setQuery,
    searching,
    searchError,
    userResults,
    reelResults,
    hasSearched,
    handleSearch,
    clearSearch,
  } = useDiscoverSearch();

  const {
    allReels, exploreLoading, exploreError, loadExplore,
    topCoaches, followingReels, followingUsers, feedLoading, feedLoaded,
  } = useDiscoverData({ userId: user?.uid, feedTab });

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
    if (!filtered.length) {
      return nonDemoReels.filter((r) => reelMatchesKeywords(r, cat.keywords));
    }
    return filtered;
  }, [educationalReels, nonDemoReels, learnCat]);

  const activityChips = useMemo(() => {
    const chips = [
      { key: "live", label: "Live scoring", live: true },
      { key: "ai", label: "AI Coach active", live: true },
      { key: "clips", label: `${nonDemoReels.length || "—"} clips` },
      { key: "trending", label: "Trending today" },
      { key: "new", label: "New fighters" },
      { key: "pvp", label: "PVP active", live: true },
    ];
    if (topCoaches.length > 0) {
      chips.splice(2, 0, { key: "coaches", label: `${topCoaches.length} coaches online`, live: true });
    }
    return chips;
  }, [nonDemoReels.length, topCoaches.length]);

  const sparringCount = Math.max(5, (topCoaches.length || 0) + 7);
  const showSearch = hasSearched && query.trim();

  return (
    <div style={s.page} className="page-enter">
      <PageTopBar kicker="EXPLORE" title={t("discoverTitle") || "DISCOVER"} user={user} currentLocale={locale} />

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
            placeholder=""
            style={s.searchInput}
          />
          {query && (
            <button type="button" onClick={clearSearch} style={s.clearBtn} aria-label="Clear search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          style={{ ...s.searchBtn, opacity: searching || !query.trim() ? 0.55 : 1, cursor: searching || !query.trim() ? "default" : "pointer" }}
          disabled={searching || !query.trim()}
        >
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
            <div style={{ padding: "0 16px", marginBottom: 28 }}>
              <p style={s.sectionLabel}>{t("discoverFighters")}</p>
              <div style={s.listStack}>
                {userResults.map((u) => {
                  const photo = u.photoURL || u.profileImageUrl || "";
                  const initial = (u.displayName || u.username || "U").charAt(0).toUpperCase();
                  return (
                    <button key={u.id} type="button" onClick={() => router.push(`/${locale}/profile/${u.id}`)} style={s.listCard}>
                      <div style={s.listAvatar}>{photo ? <Image src={photo} alt="" width={40} height={40} style={{ objectFit: "cover" }} /> : initial}</div>
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
            <div style={{ padding: "0 16px", marginBottom: 28 }}>
              <p style={s.sectionLabel}>{t("discoverReels")}</p>
              <div style={s.listStack}>
                {reelResults.map((r) => (
                  <button key={r.id} type="button" onClick={() => router.push(`/${locale}/reels?reelId=${r.id}`)} style={s.listCard}>
                    <div style={{ ...s.listAvatar, background: `${goldAlpha(0.15)}`, color: GOLD, fontSize: 18 }}>🎬</div>
                    <div style={s.listCardText}>
                      <span style={s.listCardName}>{r.caption || r.description || t("fallbackReel")}</span>
                      <span style={s.listCardSub}>{formatCompact(r.views || 0)} {t("views")}</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "#444", flexShrink: 0 }} aria-hidden="true"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                ))}
              </div>
            </div>
          )}
          {!searching && !searchError && userResults.length === 0 && reelResults.length === 0 && (
            <div style={s.emptyState}>
              <span style={{ fontSize: 40 }}>🔍</span>
              <p style={{ margin: "10px 0 4px", color: "#fff", fontSize: 15, fontWeight: 800 }}>
                {t("discoverNoResults")}
              </p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                {t("discoverNoResultsSub")}
              </p>
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

          {/* ════════════════════════════════════════
              EXPLORE — LIVING ARENA
          ════════════════════════════════════════ */}
          {feedTab === "explore" && (<>

            {/* Activity pulse strip */}
            <div style={s.activityStrip}>
              {activityChips.map((chip) => (
                <span
                  key={chip.key}
                  style={{ ...s.activityChip, ...(chip.live ? s.activityChipLive : {}) }}
                >
                  {chip.live && <span style={s.activityLiveDot} />}
                  {chip.label}
                </span>
              ))}
            </div>

            {/* Sparring lobby banner */}
            <div
              style={s.lobbyBanner}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/${locale}/sparring`)}
            >
              <span style={s.lobbyGreenDot} />
              <p style={s.lobbyText}>
                <span style={s.lobbyCountBadge}>{sparringCount} fighters</span>{" "}
                looking to spar right now
              </p>
              <span style={s.lobbyArrow}>›</span>
            </div>

            {/* Explore error */}
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

            {/* ── Section: 🔥 TRENDING ── */}
            <div style={{ padding: "0 16px", marginBottom: 32 }}>
              <div style={s.sectionHeader}>
                <div>
                  <p style={{ ...s.sectionKicker, color: RED }}>🔥 TRENDING NOW</p>
                  <h2 style={s.sectionTitle}>{t("discoverForYou")}</h2>
                </div>
                <button type="button" onClick={() => router.push(`/${locale}/reels`)} style={s.sectionSeeAll}>
                  {t("discoverViewAll")} ›
                </button>
              </div>

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

            {/* ── Section: 🏆 CHAMPIONS ── */}
            {topCoaches.length > 0 && (
              <div style={{ padding: "0 16px", marginBottom: 32 }}>
                <div style={s.sectionHeader}>
                  <div>
                    <p style={{ ...s.sectionKicker, color: GOLD }}>🏆 TOP FIGHTERS</p>
                    <h2 style={s.sectionTitle}>{t("discoverChampions") || "Champions"}</h2>
                  </div>
                </div>
                <div style={s.championStrip}>
                  {topCoaches.map((coach, i) => {
                    const name = coach.displayName || coach.username || "Fighter";
                    const photo = coach.photoURL || coach.profileImageUrl || "";
                    const initial = name.charAt(0).toUpperCase();
                    return (
                      <button
                        key={coach.id}
                        type="button"
                        style={s.championCard}
                        onClick={() => router.push(`/${locale}/profile/${coach.id}`)}
                      >
                        <div style={s.championAvatarWrap}>
                          <div style={s.championAvatar}>
                            {photo
                              ? <Image src={photo} alt={name} width={58} height={58} style={{ objectFit: "cover" }} />
                              : initial}
                          </div>
                          {i < 2 && <span style={s.championOnlineDot} />}
                        </div>
                        <span style={s.championName}>{name}</span>
                        <span style={s.championRole}>{coach.specialty || "Coach"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Section: 🧠 LEARN ── */}
            <div style={{ padding: "0 16px", marginBottom: 16 }}>
              <div style={s.sectionHeader}>
                <div>
                  <p style={{ ...s.sectionKicker, color: GOLD }}>🧠 EDUCATION</p>
                  <h2 style={s.sectionTitle}>{t("discoverLearnHub")}</h2>
                </div>
              </div>
            </div>

            <HubCard
              emoji="🧠"
              title={t("discoverLearnHub")}
              accent={GOLD}
              expanded={learnOpen}
              onToggle={() => setLearnOpen((v) => !v)}
            >
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

          </>)}

        </div>
      )}

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="home" />
    </div>
  );
}
