"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import PageTopBar from "@/components/PageTopBar";
import { getLocale, translate } from "@/lib/i18n";
import { s } from "@/components/discover/discoverStyles";
import { reelMatchesKeywords } from "@/components/discover/DiscoverCards";
import { useDiscoverData } from "@/hooks/useDiscoverData";
import { useDiscoverSearch } from "@/hooks/useDiscoverSearch";
import { FIGHTER_STYLES, LEARN_CATS } from "@/lib/discoverConstants";
import DiscoverFeedTabs from "@/components/discover/DiscoverFeedTabs";
import DiscoverSearchBar from "@/components/discover/DiscoverSearchBar";
import DiscoverSearchResults from "@/components/discover/DiscoverSearchResults";
import DiscoverFollowingFeed from "@/components/discover/DiscoverFollowingFeed";
import DiscoverExploreFeed from "@/components/discover/DiscoverExploreFeed";

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
  const [userArchetype, setUserArchetype] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snap = await getDoc(doc(db, "users", user.uid));
        if (active && snap.exists()) {
          const arch = snap.data()?.fighterDNA?.archetypeKey;
          if (arch) setUserArchetype(arch);
        }
      } catch { /* silent */ }
    })();
    return () => { active = false; };
  }, [user?.uid]);

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

      <DiscoverFeedTabs feedTab={feedTab} setFeedTab={setFeedTab} t={t} />

      <DiscoverSearchBar
        query={query}
        setQuery={setQuery}
        searching={searching}
        onSubmit={handleSearch}
        onClear={clearSearch}
        t={t}
      />

      {showSearch ? (
        <DiscoverSearchResults
          searching={searching}
          searchError={searchError}
          userResults={userResults}
          reelResults={reelResults}
          t={t}
          router={router}
          locale={locale}
          onRetry={() => handleSearch()}
        />
      ) : (
        <div style={s.content}>
          {feedTab === "following" && (
            <DiscoverFollowingFeed
              feedLoading={feedLoading}
              feedLoaded={feedLoaded}
              user={user}
              followingReels={followingReels}
              followingUsers={followingUsers}
              t={t}
              router={router}
              locale={locale}
              onExploreFighters={() => setFeedTab("explore")}
            />
          )}

          {feedTab === "explore" && (
            <DiscoverExploreFeed
              locale={locale}
              t={t}
              router={router}
              userArchetype={userArchetype}
              forYouReels={forYouReels}
              exploreLoading={exploreLoading}
              exploreError={exploreError}
              loadExplore={loadExplore}
              selectedStyle={selectedStyle}
              setSelectedStyle={setSelectedStyle}
              topCoaches={topCoaches}
              activityChips={activityChips}
              sparringCount={sparringCount}
              learnOpen={learnOpen}
              setLearnOpen={setLearnOpen}
              learnCat={learnCat}
              setLearnCat={setLearnCat}
              filteredLearnReels={filteredLearnReels}
            />
          )}
        </div>
      )}

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="" />
    </div>
  );
}
