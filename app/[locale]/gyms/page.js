"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocaleFromPathname, translate } from "@/lib/i18n";

const GYM_TYPES = [
  "Boxing", "MMA", "Muay Thai", "Fitness",
  "Crossfit", "Street Workout", "Powerlifting", "Running Club",
];

const GYM_TYPE_KEYS = {
  Boxing: "gymTypeBoxing",
  MMA: "gymTypeMMA",
  "Muay Thai": "gymTypeMuayThai",
  Fitness: "gymTypeFitness",
  Crossfit: "gymTypeCrossfit",
  "Street Workout": "gymTypeStreetWorkout",
  Powerlifting: "gymTypePowerlifting",
  "Running Club": "gymTypeRunningClub",
};

const VIBE_FILTERS = ["Beginner-Friendly", "Technical", "Competitive", "Traditional"];

const VIBE_LABELS = {
  "Beginner-Friendly": { mn: "Анхлан суралцагч", ko: "입문자 친화적" },
  "Technical": { mn: "Техникийн", ko: "기술적" },
  "Competitive": { mn: "Өрсөлдөөнт", ko: "경쟁적" },
  "Traditional": { mn: "Уламжлалт", ko: "전통적" },
};

function getDefaultVibes(gymType) {
  const map = {
    Boxing: ["Technical", "Sparring"],
    MMA: ["Hard training", "Competitive"],
    "Muay Thai": ["Traditional", "Technical"],
    Fitness: ["Beginner-Friendly", "Conditioning"],
    Crossfit: ["High intensity", "Competitive"],
  };
  return map[gymType] || [];
}

function StarDisplay({ rating }) {
  const r = Number(rating) || 0;
  return (
    <span style={{ color: "#D4AF37", fontSize: 12, fontWeight: 700 }}>
      {"★".repeat(Math.round(r))}{"☆".repeat(5 - Math.round(r))} {r > 0 ? r.toFixed(1) : ""}
    </span>
  );
}

function GymCard({ gym, t, router, locale }) {
  const vibes = gym.vibes || getDefaultVibes(gym.gymType);
  return (
    <div style={styles.card}>
      <div style={styles.cardImageWrap} onClick={() => router.push(`/${locale}/gyms/${gym.id}`)}>
        {gym.logo ? (
          <img src={gym.logo} alt="" style={styles.cardLogo} />
        ) : (
          <div style={styles.cardLogoFallback}>
            <span style={{ fontSize: 32, filter: "drop-shadow(0 2px 12px rgba(193,18,31,0.6))" }}>🥊</span>
          </div>
        )}
        {gym.verified && (
          <span style={styles.verifiedBadge}>✓ {t("gymVerified")}</span>
        )}
        {gym.memberCount > 0 && (
          <span style={styles.memberCountBadge}>👥 {gym.memberCount}</span>
        )}
      </div>

      <div style={styles.cardBody}>
        <div style={styles.cardNameRow}>
          <span style={styles.cardName}>{gym.gymName}</span>
          {gym.gymType && (
            <span style={styles.typeChip}>{t(GYM_TYPE_KEYS[gym.gymType]) || gym.gymType}</span>
          )}
        </div>

        {(gym.city || gym.country) && (
          <div style={styles.cardLocation}>
            📍 {[gym.city, gym.country].filter(Boolean).join(", ")}
          </div>
        )}

        {gym.rating > 0 && (
          <div style={styles.cardRating}>
            <StarDisplay rating={gym.rating} />
            {gym.totalReviews > 0 && (
              <span style={styles.reviewCount}>({gym.totalReviews})</span>
            )}
          </div>
        )}

        {gym.specialties?.length > 0 && (
          <div style={styles.cardStats}>
            {gym.specialties.slice(0, 3).map((sp) => (
              <span key={sp} style={styles.statChip}>{sp}</span>
            ))}
          </div>
        )}

        {vibes.length > 0 && (
          <div style={styles.cardVibeRow}>
            {vibes.slice(0, 3).map((v) => (
              <span key={v} style={styles.cardVibeBadge}>{v}</span>
            ))}
          </div>
        )}

        {gym.description && (
          <p style={styles.cardDesc}>
            {gym.description.length > 90 ? gym.description.slice(0, 90) + "…" : gym.description}
          </p>
        )}

        <button
          type="button"
          style={styles.joinBtn}
          onClick={() => router.push(`/${locale}/gyms/${gym.id}`)}
        >
          {t("gymViewJoin")}
        </button>
      </div>
    </div>
  );
}

export default function GymsPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState("all");
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myMemberships, setMyMemberships] = useState([]);
  const [myMembershipsLoading, setMyMembershipsLoading] = useState(false);
  const myMembershipsLoadedRef = useRef(false);
  const [ownedGym, setOwnedGym] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [sortMode, setSortMode] = useState("topRated"); // topRated | newest | nearby
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [filterVibe, setFilterVibe] = useState("");
  const [nearbyCoords, setNearbyCoords] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, "gyms"), orderBy("createdAt", "desc"), limit(50)));
        if (active) {
          setGyms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (e) {
        console.error("gyms load error", e);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (tab !== "mine" || myMembershipsLoadedRef.current || !user?.uid) return;
    myMembershipsLoadedRef.current = true;
    let active = true;
    setMyMembershipsLoading(true);
    Promise.all([
      getDocs(query(collection(db, "gym_join_requests"), where("userId", "==", user.uid))),
      getDocs(query(collection(db, "gyms"), where("ownerId", "==", user.uid))),
    ])
      .then(async ([reqSnap, ownedSnap]) => {
        if (!active) return;
        if (!ownedSnap.empty) {
          const od = ownedSnap.docs[0];
          setOwnedGym({ id: od.id, ...od.data() });
        }
        const reqs = reqSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        const gymIds = [...new Set(reqs.map((r) => r.gymId).filter(Boolean))];
        const gymMap = {};
        await Promise.all(gymIds.map(async (gid) => {
          const s = await getDoc(doc(db, "gyms", gid));
          if (s.exists()) gymMap[gid] = { id: gid, ...s.data() };
        }));
        if (active) setMyMemberships(reqs.map((r) => ({ ...r, gym: gymMap[r.gymId] || null })));
      })
      .catch(() => {})
      .finally(() => { if (active) setMyMembershipsLoading(false); });
    return () => { active = false; };
  }, [tab, user?.uid]);

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
  }, [gyms, verifiedOnly, selectedType, cityFilter, searchText, sortMode, nearbyCoords]);

  const GYM_STATUS = {
    pending:  { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.35)",  label: t("gymStatusPending") },
    approved: { color: "#34D399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.35)",  label: t("gymStatusMember") },
    declined: { color: "#F87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.35)", label: t("gymStatusDeclined") },
  };

  return (
    <div style={styles.page}>
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
              <p style={styles.kicker}>GAVANA</p>
              <h1 style={styles.title}>{t("gymMyTitle")}</h1>
            </div>

            {!user?.uid ? (
              <EmptyState
                emoji="🔒"
                title={t("gymLoginRequired")}
                action={
                  <button type="button" onClick={() => router.push(`/${locale}/login`)} style={{ padding: "12px 28px", borderRadius: 14, background: "#C1121F", border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
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
                  <button type="button" onClick={() => setTab("all")} style={{ padding: "12px 28px", borderRadius: 14, background: "#C1121F", border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", marginTop: 4 }}>
                    {t("gymFindBtn")}
                  </button>
                }
              />
            ) : (
              <div style={styles.cardList}>
                {ownedGym && (
                  <div
                    style={{ ...styles.card, borderLeft: "2.5px solid #D4AF37", borderRadius: "3px 16px 16px 3px", cursor: "pointer" }}
                    onClick={() => router.push(`/${locale}/gyms/${ownedGym.id}`)}
                  >
                    <div style={styles.cardImageWrap}>
                      {ownedGym.logo
                        ? <img src={ownedGym.logo} alt="" style={styles.cardLogo} />
                        : <div style={styles.cardLogoFallback}><span style={{ fontSize: 28 }}>🥊</span></div>
                      }
                      <span style={{ position: "absolute", bottom: 8, right: 10, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 900, background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.5)", color: "#D4AF37" }}>
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
                        style={{ marginTop: 10, padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(212,175,55,0.4)", background: "rgba(212,175,55,0.1)", color: "#D4AF37", fontSize: 12, fontWeight: 900, cursor: "pointer" }}
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
                          ? <img src={gym.logo} alt="" style={styles.cardLogo} />
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
                    <img src={gym.logo} alt="" style={styles.featuredLogo} />
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
              style={{ marginRight: 6, accentColor: "#D4AF37" }}
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
              <button type="button" onClick={() => router.push(`/${locale}/gyms/dashboard`)} style={{ padding: "12px 28px", borderRadius: 14, background: "#C1121F", border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
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
      <style>{`
        @keyframes skPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .sk-pulse { animation: skPulse 1.4s ease infinite; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "system-ui, sans-serif" },
  tabBar: {
    position: "sticky", top: 0, zIndex: 50,
    display: "flex", background: "rgba(8,8,8,0.95)",
    backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    paddingTop: "env(safe-area-inset-top)",
  },
  tabActive: {
    flex: 1, minHeight: 46, border: "none",
    borderBottom: "2px solid #C1121F", background: "transparent",
    color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer", letterSpacing: 0.3,
  },
  tabInactive: {
    flex: 1, minHeight: 46, border: "none",
    borderBottom: "2px solid transparent", background: "transparent",
    color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  content: { maxWidth: 520, margin: "0 auto", padding: "0 16px calc(90px + env(safe-area-inset-bottom))" },
  header: { paddingTop: "calc(18px + env(safe-area-inset-top))", paddingBottom: 20, display: "flex", flexDirection: "column", gap: 4 },
  kicker: { margin: 0, fontSize: 11, letterSpacing: 2, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" },
  title: { margin: 0, fontSize: 28, fontWeight: 1000, lineHeight: 1.1, fontFamily: "var(--font-display, 'Anton', sans-serif)" },
  subtitle: { margin: 0, fontSize: 14, color: "rgba(255,255,255,0.65)" },
  registerBtn: { alignSelf: "flex-start", marginTop: 8, padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(212,175,55,0.45)", background: "rgba(212,175,55,0.1)", color: "#D4AF37", fontSize: 13, fontWeight: 900, cursor: "pointer" },
  searchInput: { width: "100%", boxSizing: "border-box", padding: "12px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14, outline: "none", marginBottom: 14 },
  sortRow: { display: "flex", gap: 8, marginBottom: 12 },
  sortBtn: { padding: "7px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  sortBtnActive: { padding: "7px 14px", borderRadius: 999, border: "1px solid rgba(193,18,31,0.5)", background: "rgba(193,18,31,0.15)", color: "#F87171", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  filtersRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  filterSelect: { flex: 1, height: 38, padding: "0 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, outline: "none", colorScheme: "dark", appearance: "none", WebkitAppearance: "none" },
  verifiedToggle: { display: "flex", alignItems: "center", height: 38, gap: 6, padding: "0 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)", cursor: "pointer", whiteSpace: "nowrap" },
  catRow: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 16, scrollbarWidth: "none" },
  catBtn: { flexShrink: 0, padding: "6px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  catActive: { flexShrink: 0, padding: "6px 14px", borderRadius: 999, border: "1px solid rgba(212,175,55,0.5)", background: "rgba(212,175,55,0.12)", color: "#D4AF37", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  loadingText: { textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.55)", fontSize: 14 },
  skeletonList: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 },
  skeletonCard: { height: 200, borderRadius: 16, background: "rgba(255,255,255,0.06)" },
  cardList: { display: "flex", flexDirection: "column", gap: 12 },
  card: { borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(145deg, #131313, #0a0a0a)", overflow: "hidden", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" },
  cardImageWrap: { position: "relative", height: 100, background: "radial-gradient(ellipse at 50% 0%, rgba(193,18,31,0.18) 0%, transparent 60%), linear-gradient(160deg, #141010, #0d0d0d)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  cardLogo: { width: 64, height: 64, objectFit: "cover", borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" },
  cardLogoFallback: { width: 68, height: 68, borderRadius: 16, background: "radial-gradient(ellipse at 50% 30%, rgba(193,18,31,0.3), rgba(10,5,5,0.9))", border: "1px solid rgba(193,18,31,0.2)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(193,18,31,0.12)" },
  verifiedBadge: { position: "absolute", top: 10, right: 10, fontSize: 10, fontWeight: 900, color: "#D4AF37", background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 999, padding: "3px 8px" },
  cardBody: { padding: "12px 14px 14px" },
  cardNameRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  cardName: { fontSize: 16, fontWeight: 1000, color: "#fff" },
  typeChip: { fontSize: 10, fontWeight: 900, color: "#C1121F", background: "rgba(193,18,31,0.12)", border: "1px solid rgba(193,18,31,0.25)", borderRadius: 999, padding: "2px 8px" },
  cardLocation: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 6 },
  cardRating: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 },
  reviewCount: { fontSize: 11, color: "rgba(255,255,255,0.55)" },
  cardStats: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  statChip: { fontSize: 11, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "3px 8px" },
  cardDesc: { margin: 0, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 },
  cardVibeRow: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 },
  cardVibeBadge: { fontSize: 10, fontWeight: 800, color: "#F87171", background: "rgba(193,18,31,0.08)", border: "1px solid rgba(193,18,31,0.2)", borderRadius: 999, padding: "2px 8px" },
  vibeRow: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 12, scrollbarWidth: "none" },
  vibeBtn: { flexShrink: 0, padding: "5px 14px", borderRadius: 999, border: "1px solid rgba(193,18,31,0.2)", background: "rgba(193,18,31,0.05)", color: "rgba(255,165,130,0.65)", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  vibeActive: { flexShrink: 0, padding: "5px 14px", borderRadius: 999, border: "1px solid rgba(193,18,31,0.6)", background: "rgba(193,18,31,0.18)", color: "#F87171", fontSize: 12, fontWeight: 900, cursor: "pointer" },
  memberCountBadge: { position: "absolute", bottom: 8, left: 10, fontSize: 10, fontWeight: 900, color: "#fff", background: "rgba(0,0,0,0.65)", borderRadius: 999, padding: "2px 8px" },
  joinBtn: { display: "block", width: "100%", marginTop: 10, padding: "10px 0", borderRadius: 12, border: "none", background: "#C1121F", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer", letterSpacing: 0.3, boxShadow: "0 6px 20px rgba(193,18,31,0.22)" },
  sectionLabel: { margin: "0 0 10px", fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" },
  featuredScroll: { display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", WebkitOverflowScrolling: "touch" },
  featuredCard: { flexShrink: 0, width: 116, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "linear-gradient(145deg, #131313, #0a0a0a)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 8px", cursor: "pointer", textAlign: "center", WebkitTapHighlightColor: "transparent" },
  featuredLogo: { width: 48, height: 48, borderRadius: 12, objectFit: "cover", marginBottom: 2 },
  featuredLogoFallback: { width: 48, height: 48, borderRadius: 12, background: "rgba(193,18,31,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 2 },
  featuredName: { margin: 0, fontSize: 12, fontWeight: 900, color: "#fff", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" },
  featuredCity: { margin: 0, fontSize: 10, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" },
  featuredRating: { fontSize: 10, color: "#D4AF37", fontWeight: 800 },
  featuredMembers: { fontSize: 10, color: "#888" },
};
