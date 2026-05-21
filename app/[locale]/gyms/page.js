"use client";


import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/gyms/gymsStyles";
import { GymCard } from "@/components/gyms/GymCard";
import { useGymsPageData } from "@/hooks/useGymsPageData";
import Image from "next/image";
import { GYM_TYPES, GYM_TYPE_KEYS, VIBE_FILTERS, VIBE_LABELS, getDefaultVibes } from "@/lib/gymConstants";

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
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const cities = useMemo(() => {
    const set = new Set(gyms.map((g) => g.city).filter(Boolean));
    return Array.from(set).sort();
  }, [gyms]);

  const featuredGyms = useMemo(() =>
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
      list = list.filter((g) =>
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
        const da = a.latitude && a.longitude ? haversineKm(nearbyCoords.lat, nearbyCoords.lng, a.latitude, a.longitude) : 9999;
        const db2 = b.latitude && b.longitude ? haversineKm(nearbyCoords.lat, nearbyCoords.lng, b.latitude, b.longitude) : 9999;
        return da - db2;
      });
    }
    return list;
  }, [gyms, verifiedOnly, selectedType, cityFilter, filterVibe, searchText, sortMode, nearbyCoords]);

  const GYM_STATUS = {
    pending:  { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.35)",  label: t("gymStatusPending") },
    approved: { color: "#34D399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.35)",  label: t("gymStatusMember") },
    declined: { color: "#F87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.35)", label: t("gymStatusDeclined") },
  };

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
          <>
            <div style={{ ...styles.header, paddingTop: 20 }}>
              <p style={styles.kicker}>COMBAT · GYMS</p>
              <h1 style={styles.title}>{t("gymMyTitle")}</h1>
            </div>

            {!user?.uid ? (
              <EmptyState
                emoji="🔒"
                title={t("gymLoginRequired")}
                action={
                  <button type="button" onClick={() => router.push(`/${locale}/login`)} style={{ padding: "12px 28px", borderRadius: 14, background: `linear-gradient(145deg, ${RED}, #cc2820)`, border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: `0 8px 24px ${redAlpha(0.28)}, inset 0 1px 0 rgba(255,255,255,0.1)` }}>
                    {t("gymLoginBtn")}
                  </button>
                }
              />
            ) : myMembershipsLoading ? (
              <div style={styles.skeletonList}>
                {[0, 1].map((i) => <div key={i} style={styles.skeletonCard} className="sk-pulse" />)}
              </div>
            ) : myMemberships.length === 0 && !ownedGym ? (
              <EmptyState
                emoji="🏋️"
                title={t("gymNotMember")}
                hint={t("gymJoinHint")}
                action={
                  <button type="button" onClick={() => setTab("all")} style={{ padding: "12px 28px", borderRadius: 14, background: `linear-gradient(145deg, ${RED}, #cc2820)`, border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", marginTop: 4, boxShadow: `0 8px 24px ${redAlpha(0.28)}, inset 0 1px 0 rgba(255,255,255,0.1)` }}>
                    {t("gymFindBtn")}
                  </button>
                }
              />
            ) : (
              <div style={styles.cardList}>
                {ownedGym && (
                  <div
                    style={{ ...styles.card, borderLeft: "2.5px solid #F5C451", borderRadius: "3px 16px 16px 3px", cursor: "pointer" }}
                    onClick={() => router.push(`/${locale}/gyms/${ownedGym.id}`)}
                  >
                    <div style={styles.cardImageWrap}>
                      {ownedGym.logo
                        ? <Image src={ownedGym.logo} alt="" width={64} height={64} style={{ objectFit: "cover", borderRadius: 14 }} />
                        : <div style={styles.cardLogoFallback}><span style={{ fontSize: 28 }}>🥊</span></div>
                      }
                      <span style={{ position: "absolute", bottom: 8, right: 10, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 900, background: `${goldAlpha(0.15)}`, border: `1px solid ${goldAlpha(0.5)}`, color: GOLD }}>
                        {t("gymOwnerLabel")}
                      </span>
                    </div>
                    <div style={styles.cardBody}>
                      <div style={styles.cardNameRow}>
                        <span style={styles.cardName}>{ownedGym.gymName}</span>
                        {ownedGym.verified && <span style={styles.verifiedBadge}>✓</span>}
                      </div>
                      {(ownedGym.city || ownedGym.country) && (
                        <div style={styles.cardLocation}>📍 {[ownedGym.city, ownedGym.country].filter(Boolean).join(", ")}</div>
                      )}
                      {ownedGym.gymType && <span style={styles.typeChip}>{t(GYM_TYPE_KEYS[ownedGym.gymType]) || ownedGym.gymType}</span>}
                      <button
                        type="button"
                        style={{ marginTop: 10, padding: "8px 16px", borderRadius: 10, border: `1px solid ${goldAlpha(0.4)}`, background: `${goldAlpha(0.1)}`, color: GOLD, fontSize: 12, fontWeight: 900, cursor: "pointer" }}
                        onClick={(e) => { e.stopPropagation(); router.push(`/${locale}/gyms/dashboard`); }}
                      >
                        {t("gymManageBtn")}
                      </button>
                    </div>
                  </div>
                )}
                {myMemberships.map((mem) => {
                  const gym = mem.gym;
                  const st = GYM_STATUS[mem.status] || GYM_STATUS.pending;
                  if (!gym) return null;
                  return (
                    <div
                      key={mem.id}
                      style={{ ...styles.card, borderLeft: `2.5px solid ${st.color}`, borderRadius: "3px 16px 16px 3px", cursor: "pointer" }}
                      onClick={() => router.push(`/${locale}/gyms/${gym.id}`)}
                    >
                      <div style={styles.cardImageWrap}>
                        {gym.logo
                          ? <Image src={gym.logo} alt="" width={64} height={64} style={{ objectFit: "cover", borderRadius: 14 }} />
                          : <div style={styles.cardLogoFallback}><span style={{ fontSize: 28 }}>🥊</span></div>
                        }
                        <span style={{ position: "absolute", bottom: 8, right: 10, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 900, background: st.bg, border: `1px solid ${st.border}`, color: st.color }}>
                          {st.label}
                        </span>
                      </div>
                      <div style={styles.cardBody}>
                        <div style={styles.cardNameRow}>
                          <span style={styles.cardName}>{gym.gymName}</span>
                          {gym.verified && <span style={styles.verifiedBadge}>✓</span>}
                        </div>
                        {(gym.city || gym.country) && (
                          <div style={styles.cardLocation}>📍 {[gym.city, gym.country].filter(Boolean).join(", ")}</div>
                        )}
                        {gym.gymType && <span style={styles.typeChip}>{t(GYM_TYPE_KEYS[gym.gymType]) || gym.gymType}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* All Gyms tab */}
        {tab === "all" && (<>
        {/* Header */}
        <div style={styles.header}>
          <p style={styles.kicker}>GAVANA</p>
          <h1 style={styles.title}>{t("gymsTitle")}</h1>
          <p style={styles.subtitle}>{t("gymsSubtitle")}</p>
          <button type="button" style={styles.registerBtn} onClick={() => router.push(`/${locale}/gyms/dashboard`)}>
            + {t("gymsRegister")}
          </button>
        </div>

        {/* Featured Gyms horizontal scroll */}
        {!loading && featuredGyms.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={styles.sectionLabel}>
              {t("gymFeatured")}
            </p>
            <div style={styles.featuredScroll}>
              {featuredGyms.map((gym) => (
                <button
                  key={gym.id}
                  type="button"
                  style={styles.featuredCard}
                  onClick={() => router.push(`/${locale}/gyms/${gym.id}`)}
                >
                  {gym.logo ? (
                    <Image src={gym.logo} alt="" width={48} height={48} style={{ objectFit: "cover", borderRadius: 12, marginBottom: 2 }} />
                  ) : (
                    <div style={styles.featuredLogoFallback}>🥊</div>
                  )}
                  <p style={styles.featuredName}>{gym.gymName}</p>
                  <p style={styles.featuredCity}>{gym.city || ""}</p>
                  {gym.rating > 0 && (
                    <span style={styles.featuredRating}>⭐ {Number(gym.rating).toFixed(1)}</span>
                  )}
                  {gym.memberCount > 0 && (
                    <span style={styles.featuredMembers}>👥 {gym.memberCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder={t("gymsSearch")}
          style={styles.searchInput}
        />

        {/* Sort tabs */}
        <div style={styles.sortRow}>
          {[
            { key: "topRated", label: t("gymsTopRated") },
            { key: "newest", label: t("gymsNewest") },
            { key: "nearby", label: t("gymsNearby") },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              style={sortMode === key ? styles.sortBtnActive : styles.sortBtn}
              onClick={() => {
                if (key === "nearby") handleNearby();
                else setSortMode(key);
              }}
            >
              {nearbyLoading && key === "nearby" ? "…" : label}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div style={styles.filtersRow}>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">{t("gymsAllCities")}</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <label style={styles.verifiedToggle}>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              style={{ marginRight: 6, accentColor: GOLD }}
            />
            {t("gymsVerifiedOnly")}
          </label>
        </div>

        {/* Vibe filter chips */}
        <div style={styles.vibeRow}>
          {VIBE_FILTERS.map((v) => {
            const lbl = locale === "mn" ? (VIBE_LABELS[v]?.mn || v) : locale === "ko" ? (VIBE_LABELS[v]?.ko || v) : v;
            return (
              <button
                key={v}
                type="button"
                style={filterVibe === v ? styles.vibeActive : styles.vibeBtn}
                onClick={() => setFilterVibe((prev) => (prev === v ? "" : v))}
              >
                {lbl}
              </button>
            );
          })}
        </div>

        {/* Category pills */}
        <div style={styles.catRow}>
          <button
            type="button"
            style={selectedType === "all" ? styles.catActive : styles.catBtn}
            onClick={() => setSelectedType("all")}
          >
            {t("gymsAll")}
          </button>
          {GYM_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              style={selectedType === type ? styles.catActive : styles.catBtn}
              onClick={() => setSelectedType(type)}
            >
              {t(GYM_TYPE_KEYS[type])}
            </button>
          ))}
        </div>

        {/* List */}
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
              <button type="button" onClick={() => router.push(`/${locale}/gyms/dashboard`)} style={{ padding: "12px 28px", borderRadius: 14, background: `linear-gradient(145deg, ${RED}, #cc2820)`, border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: `0 8px 24px ${redAlpha(0.28)}, inset 0 1px 0 rgba(255,255,255,0.1)` }}>
                + {t("gymsRegister")}
              </button>
            }
          />
        ) : (
          <div style={styles.cardList}>
            {filtered.map((gym) => (
              <GymCard key={gym.id} gym={gym} t={t} router={router} locale={locale} />
            ))}
          </div>
        )}
        </>)}
      </div>

      <BottomNav
        router={router}
        user={user}
        currentLocale={locale}
        activeTab="discover"
      />
    </div>
  );
}

