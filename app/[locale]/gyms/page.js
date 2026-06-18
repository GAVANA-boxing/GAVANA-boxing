"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { RED, RED_DARK, redAlpha } from "@/lib/tokens";
import styles from "@/components/gyms/gymsStyles";
import { GymCard } from "@/components/gyms/GymCard";
import { useGymsPageData } from "@/hooks/useGymsPageData";
import { getDefaultVibes } from "@/lib/gymConstants";
import { GymsAllTabHeader } from "@/components/gyms/GymsAllTabHeader";
import { GymsFeaturedScroll } from "@/components/gyms/GymsFeaturedScroll";
import { GymsSortRow, GymsFiltersRow, GymsVibeRow, GymsCategoryRow } from "@/components/gyms/GymsFilters";
import { GymsMyTab } from "@/components/gyms/GymsMyTab";

export default function GymsPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [sortMode, setSortMode] = useState("topRated");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [filterVibe, setFilterVibe] = useState("");
  const [nearbyCoords, setNearbyCoords] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const { gyms, loading, myMemberships, myMembershipsLoading, ownedGym } =
    useGymsPageData({ tab, userId: user?.uid });

  const handleNearby = () => {
    if (!navigator.geolocation) return;
    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNearbyCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortMode("nearby");
        setNearbyLoading(false);
      },
      () => setNearbyLoading(false)
    );
  };

  function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const cities = useMemo(() => {
    const set = new Set(gyms.map((g) => g.city).filter(Boolean));
    return Array.from(set).sort();
  }, [gyms]);

  const featuredGyms = useMemo(
    () =>
      [...gyms]
        .filter((g) => g.rating > 0 || g.featured || (g.memberCount || 0) > 0)
        .sort((a, b) => {
          if (b.featured && !a.featured) return 1;
          if (a.featured && !b.featured) return -1;
          return (b.rating || 0) - (a.rating || 0);
        })
        .slice(0, 8),
    [gyms]
  );

  const filtered = useMemo(() => {
    let list = [...gyms];
    if (verifiedOnly) list = list.filter((g) => g.verified);
    if (selectedType !== "all") list = list.filter((g) => g.gymType === selectedType);
    if (cityFilter) list = list.filter((g) => g.city === cityFilter);
    if (filterVibe) list = list.filter((g) => (g.vibes || getDefaultVibes(g.gymType)).includes(filterVibe));
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (g) =>
          g.gymName?.toLowerCase().includes(q) ||
          g.city?.toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q)
      );
    }
    if (sortMode === "topRated") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortMode === "newest") {
      list.sort((a, b) => {
        const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });
    } else if (sortMode === "nearby" && nearbyCoords) {
      list.sort((a, b) => {
        const da =
          a.latitude && a.longitude
            ? haversineKm(nearbyCoords.lat, nearbyCoords.lng, a.latitude, a.longitude)
            : 9999;
        const db2 =
          b.latitude && b.longitude
            ? haversineKm(nearbyCoords.lat, nearbyCoords.lng, b.latitude, b.longitude)
            : 9999;
        return da - db2;
      });
    }
    return list;
  }, [gyms, verifiedOnly, selectedType, cityFilter, filterVibe, searchText, sortMode, nearbyCoords]);

  return (
    <div style={styles.page} className="page-enter">
      {/* Sticky tab bar */}
      <div style={styles.tabBar}>
        {[
          { key: "all",  label: t("gymAllTab") },
          { key: "mine", label: t("gymMyTab") },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            style={tab === key ? styles.tabActive : styles.tabInactive}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {/* My Gym tab */}
        {tab === "mine" && (
          <GymsMyTab
            user={user}
            myMemberships={myMemberships}
            myMembershipsLoading={myMembershipsLoading}
            ownedGym={ownedGym}
            locale={locale}
            router={router}
            onSwitchToAll={() => setTab("all")}
            t={t}
          />
        )}

        {/* All Gyms tab */}
        {tab === "all" && (
          <>
            <GymsAllTabHeader locale={locale} router={router} t={t} />

            {!loading && (
              <GymsFeaturedScroll
                featuredGyms={featuredGyms}
                locale={locale}
                router={router}
                t={t}
              />
            )}

            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={t("gymsSearch")}
              style={styles.searchInput}
            />

            <GymsSortRow
              sortMode={sortMode}
              nearbyLoading={nearbyLoading}
              onSortChange={setSortMode}
              onNearby={handleNearby}
              t={t}
            />

            <GymsFiltersRow
              cityFilter={cityFilter}
              cities={cities}
              verifiedOnly={verifiedOnly}
              onCityChange={setCityFilter}
              onVerifiedChange={setVerifiedOnly}
              t={t}
            />

            <GymsVibeRow
              filterVibe={filterVibe}
              onVibeChange={setFilterVibe}
              locale={locale}
            />

            <GymsCategoryRow
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              t={t}
            />

            {loading ? (
              <div style={styles.skeletonList}>
                {[0, 1, 2].map((i) => <div key={i} style={styles.skeletonCard} className="sk-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                emoji="🏋️"
                title={t("gymsNoGyms")}
                hint={t("gymsNoGymsSub")}
                action={
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/gyms/dashboard`)}
                    style={{ padding: "12px 28px", borderRadius: 14, background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`, border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: `0 8px 24px ${redAlpha(0.28)}, inset 0 1px 0 rgba(255,255,255,0.1)` }}
                  >
                    + {t("gymsRegister")}
                  </button>
                }
              />
            ) : (
              <div style={styles.cardList} className="section-reveal">
                {filtered.map((gym) => (
                  <GymCard key={gym.id} gym={gym} t={t} router={router} locale={locale} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="" />
    </div>
  );
}
