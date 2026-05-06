"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
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

function StarDisplay({ rating }) {
  const r = Number(rating) || 0;
  return (
    <span style={{ color: "#D4AF37", fontSize: 12, fontWeight: 700 }}>
      {"★".repeat(Math.round(r))}{"☆".repeat(5 - Math.round(r))} {r > 0 ? r.toFixed(1) : ""}
    </span>
  );
}

function GymCard({ gym, t, router, locale }) {
  return (
    <div style={styles.card} onClick={() => router.push(`/${locale}/gyms/${gym.id}`)}>
      <div style={styles.cardImageWrap}>
        {gym.logo ? (
          <img src={gym.logo} alt="" style={styles.cardLogo} />
        ) : (
          <div style={styles.cardLogoFallback}>
            <span style={{ fontSize: 28 }}>🥊</span>
          </div>
        )}
        {gym.verified && (
          <span style={styles.verifiedBadge}>✓ {t("gymVerified")}</span>
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

        <div style={styles.cardStats}>
          {gym.memberCount > 0 && (
            <span style={styles.statChip}>👥 {gym.memberCount} {t("gymMembers")}</span>
          )}
          {gym.specialties?.length > 0 && (
            <span style={styles.statChip}>{gym.specialties.slice(0, 2).join(" · ")}</span>
          )}
        </div>

        {gym.description && (
          <p style={styles.cardDesc}>
            {gym.description.length > 100 ? gym.description.slice(0, 100) + "…" : gym.description}
          </p>
        )}
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

  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [sortMode, setSortMode] = useState("topRated"); // topRated | newest | nearby
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [nearbyCoords, setNearbyCoords] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const q = query(collection(db, "gyms"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
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

  const filtered = useMemo(() => {
    let list = [...gyms];
    if (verifiedOnly) list = list.filter((g) => g.verified);
    if (selectedType !== "all") list = list.filter((g) => g.gymType === selectedType);
    if (cityFilter) list = list.filter((g) => g.city === cityFilter);
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

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <p style={styles.kicker}>GAVANA</p>
          <h1 style={styles.title}>{t("gymsTitle")}</h1>
          <p style={styles.subtitle}>{t("gymsSubtitle")}</p>
          <button type="button" style={styles.registerBtn} onClick={() => router.push(`/${locale}/gyms/dashboard`)}>
            + {t("gymsRegister")}
          </button>
        </div>

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
          <div style={styles.loadingText}>{t("gymsLoading")}</div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 44, opacity: 0.5 }}>🏋️</div>
            <p style={styles.emptyText}>{t("gymsNoGyms")}</p>
            <p style={{ margin: "-4px 0 16px", color: "rgba(255,255,255,0.32)", fontSize: 13, textAlign: "center", maxWidth: 260 }}>
              {t("gymsNoGymsSub")}
            </p>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/gyms/dashboard`)}
              style={{ padding: "12px 28px", borderRadius: 14, background: "#C1121F", border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}
            >
              + {t("gymsRegister")}
            </button>
          </div>
        ) : (
          <div style={styles.cardList}>
            {filtered.map((gym) => (
              <GymCard key={gym.id} gym={gym} t={t} router={router} locale={locale} />
            ))}
          </div>
        )}
      </div>

      <BottomNav
        router={router}
        user={user}
        currentLocale={locale}
        activeTab="coach"
      />
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "system-ui, sans-serif" },
  content: { maxWidth: 520, margin: "0 auto", padding: "0 16px calc(90px + env(safe-area-inset-bottom))" },
  header: { paddingTop: "calc(18px + env(safe-area-inset-top))", paddingBottom: 20, display: "flex", flexDirection: "column", gap: 4 },
  kicker: { margin: 0, fontSize: 11, letterSpacing: 2, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" },
  title: { margin: 0, fontSize: 28, fontWeight: 1000, lineHeight: 1.1, fontFamily: "var(--font-display, 'Anton', sans-serif)" },
  subtitle: { margin: 0, fontSize: 14, color: "rgba(255,255,255,0.45)" },
  registerBtn: { alignSelf: "flex-start", marginTop: 8, padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(212,175,55,0.45)", background: "rgba(212,175,55,0.1)", color: "#D4AF37", fontSize: 13, fontWeight: 900, cursor: "pointer" },
  searchInput: { width: "100%", boxSizing: "border-box", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 15, outline: "none", marginBottom: 12 },
  sortRow: { display: "flex", gap: 8, marginBottom: 12 },
  sortBtn: { padding: "7px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  sortBtnActive: { padding: "7px 14px", borderRadius: 999, border: "1px solid rgba(193,18,31,0.5)", background: "rgba(193,18,31,0.15)", color: "#F87171", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  filtersRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  filterSelect: { flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, outline: "none", colorScheme: "dark" },
  verifiedToggle: { display: "flex", alignItems: "center", fontSize: 13, color: "rgba(255,255,255,0.6)", cursor: "pointer", whiteSpace: "nowrap" },
  catRow: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 16, scrollbarWidth: "none" },
  catBtn: { flexShrink: 0, padding: "6px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  catActive: { flexShrink: 0, padding: "6px 14px", borderRadius: 999, border: "1px solid rgba(212,175,55,0.5)", background: "rgba(212,175,55,0.12)", color: "#D4AF37", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  loadingText: { textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.35)", fontSize: 14 },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "60px 24px", textAlign: "center" },
  emptyText: { margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 15 },
  cardList: { display: "flex", flexDirection: "column", gap: 12 },
  card: { borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(145deg, #131313, #0a0a0a)", overflow: "hidden", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" },
  cardImageWrap: { position: "relative", height: 90, background: "linear-gradient(135deg, #1a1a1a, #111)", display: "flex", alignItems: "center", justifyContent: "center" },
  cardLogo: { width: 60, height: 60, objectFit: "cover", borderRadius: 12 },
  cardLogoFallback: { width: 60, height: 60, borderRadius: 12, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" },
  verifiedBadge: { position: "absolute", top: 10, right: 10, fontSize: 10, fontWeight: 900, color: "#D4AF37", background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 999, padding: "3px 8px" },
  cardBody: { padding: "12px 14px 14px" },
  cardNameRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  cardName: { fontSize: 16, fontWeight: 1000, color: "#fff" },
  typeChip: { fontSize: 10, fontWeight: 900, color: "#C1121F", background: "rgba(193,18,31,0.12)", border: "1px solid rgba(193,18,31,0.25)", borderRadius: 999, padding: "2px 8px" },
  cardLocation: { fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 6 },
  cardRating: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 },
  reviewCount: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
  cardStats: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  statChip: { fontSize: 11, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "3px 8px" },
  cardDesc: { margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 },
};
