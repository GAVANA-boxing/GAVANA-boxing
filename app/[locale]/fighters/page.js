"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getLocale, translate } from "@/lib/i18n";
import { FIGHTERS } from "@/lib/fighters";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { RED, GOLD, redAlpha, goldAlpha, pageBg } from "@/lib/tokens";
import { isBeginnerUser } from "@/lib/beginnerPath";
import { buildCoachSnapshot } from "@/lib/buildCoachContext";
import { getPersonalConnection } from "@/lib/fighterPersonalConnection";
import FighterCompareModal from "@/components/fighters/FighterCompareModal";
import { matchFighters, classifyFighterArchetype } from "@/lib/fighterDNA";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";
import FighterGridCard from "@/components/fighters/FighterGridCard";
import RecommendedCard from "@/components/fighters/RecommendedCard";

const ARCH_FILTER_LABELS = {
  en: { pressure: "Pressure", outboxer: "Outboxer", counter: "Counter", explosive: "Explosive", technician: "Technician" },
  mn: { pressure: "Дарамт", outboxer: "Аутбоксер", counter: "Контр", explosive: "Тэсрэмтгий", technician: "Техникийн" },
  ko: { pressure: "압박", outboxer: "아웃복서", counter: "카운터", explosive: "폭발력", technician: "기술" },
};

const ARCHETYPE_TAGS = {
  pressure:  ["pressure"],
  counter:   ["counter"],
  technical: ["technical", "angles", "fundamentals", "footwork"],
  brawler:   ["power", "infighting", "intimidation", "explosive"],
};

export default function FightersPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const [snapshot, setSnapshot] = useState(null);
  const [userArchetype, setUserArchetype] = useState(null);
  const [fighterDNA, setFighterDNA] = useState(null);
  const [totalSessionCount, setTotalSessionCount] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [activeArchFilter, setActiveArchFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeWeightFilter, setActiveWeightFilter] = useState(null);

  const toggleCompare = (id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };
  const [studiedFighters, setStudiedFighters] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      try {
        const { collection, getDocs, doc, getDoc, query, where } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const [sessSnap, userSnap] = await Promise.all([
          getDocs(query(collection(db, "training_sessions"), where("userId", "==", user.uid))),
          getDoc(doc(db, "users", user.uid)),
        ]);
        if (!active) return;
        const userData = userSnap.data() || {};
        const sessions = sessSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => d.type === "training" && d.score != null)
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setTotalSessionCount(sessions.length);
        if (sessions.length > 0) setSnapshot(buildCoachSnapshot({ sessions, profileData: {} }));
        setStudiedFighters(userData.studiedFighters || []);
        setUserArchetype(userData.fighterArchetype || userData.archetype || null);
        if (userData.fighterDNA && !userData.fighterDNA.building) setFighterDNA(userData.fighterDNA);
      } catch { /* silent */ }
    })();
    return () => { active = false; };
  }, [user?.uid]);

  const ranked = useMemo(() => FIGHTERS.map((f) => ({
    fighter: f,
    connection: snapshot ? getPersonalConnection(snapshot, f) : null,
  })).sort((a, b) => {
    const aScore = a.connection?.relevantWeak?.length || 0;
    const bScore = b.connection?.relevantWeak?.length || 0;
    return bScore - aScore;
  }), [snapshot]);

  const recommended = useMemo(() => {
    // Priority 1: Fighter DNA match (most accurate — based on aggregated punch styleMix)
    if (fighterDNA?.styleMix) {
      return matchFighters(fighterDNA.styleMix).map((fighter) => ({
        fighter,
        connection: null,
        dnaMatch: true,
        studyFocus: fighter.whatToStudy?.[0] || null,
      }));
    }
    // Priority 2: Combat snapshot (session-based weak areas)
    if (snapshot) {
      return ranked.filter((r) => r.connection?.isDirectlyRelevant).slice(0, 3);
    }
    // Priority 3: Basic archetype tags fallback
    if (!userArchetype) return [];
    const tags = ARCHETYPE_TAGS[userArchetype] || [];
    return FIGHTERS
      .filter((f) => f.movementDNA?.tags?.some((tag) => tags.includes(tag)))
      .slice(0, 3)
      .map((f) => ({ fighter: f, connection: null, archetypeBased: true }));
  }, [fighterDNA, snapshot, ranked, userArchetype]);
  const recommendedIds = useMemo(() => new Set(recommended.map((r) => r.fighter.id)), [recommended]);

  const availableWeightClasses = useMemo(() => {
    const wcs = [...new Set(ranked.map(({ fighter }) => fighter.weightClass).filter(Boolean))];
    return wcs.sort();
  }, [ranked]);

  const filteredRanked = useMemo(() => {
    let result = ranked;
    if (activeArchFilter) result = result.filter(({ fighter }) => classifyFighterArchetype(fighter) === activeArchFilter);
    if (activeWeightFilter) result = result.filter(({ fighter }) => fighter.weightClass === activeWeightFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(({ fighter }) =>
        fighter.name.toLowerCase().includes(q) ||
        fighter.style?.toLowerCase().includes(q) ||
        fighter.keyWeapon?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [ranked, activeArchFilter, activeWeightFilter, searchQuery]);

  return (
    <div style={s.page} className="page-enter">
      <div style={s.ambientGlow} />

      <div style={s.header}>
        <button type="button" style={s.backPill} onClick={() => router.back()} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
          <p style={{ ...s.kicker, margin: 0 }}>COMBAT · FIGHTERS</p>
          {!isBeginnerUser(totalSessionCount ?? 999) && (
            <button
              type="button"
              onClick={() => { setCompareMode((c) => !c); setCompareIds([]); }}
              style={{
                padding: "5px 12px", borderRadius: 20,
                background: compareMode ? goldAlpha(0.15) : "rgba(255,255,255,0.05)",
                border: compareMode ? `1px solid ${GOLD}40` : "1px solid rgba(255,255,255,0.1)",
                color: compareMode ? GOLD : "rgba(255,255,255,0.4)",
                fontSize: 11, fontWeight: 900, cursor: "pointer",
              }}
            >
              {t("fighterCompare")}
            </button>
          )}
        </div>
        <h1 style={s.title}>{t("fighterAllTitle")}</h1>
        <p style={s.subtitle}>{t("fighterAllSubtitle")}</p>

        {compareMode && (
          <div style={{ marginTop: 10, padding: "10px 13px", borderRadius: 12, background: goldAlpha(0.07), border: `1px solid ${GOLD}22`, fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
            {compareIds.length === 0 && t("fighterCompareSelect0")}
            {compareIds.length === 1 && t("fighterCompareSelect1")}
            {compareIds.length === 2 && (
              <button
                type="button"
                onClick={() => {/* show modal - handled below */}}
                style={{ width: "100%", padding: "9px 0", borderRadius: 10, background: GOLD, border: "none", color: "#000", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
              >
                {t("fighterCompareNow")}
              </button>
            )}
          </div>
        )}

        {/* ── Fighter Mastery progress ── */}
        {studiedFighters.length > 0 && (
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.8, color: "#34D399", textTransform: "uppercase" }}>
                ⚔️ {t("fighterMastery")}
              </span>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#34D399" }}>
                {studiedFighters.length}/{FIGHTERS.length}
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ width: `${(studiedFighters.length / FIGHTERS.length) * 100}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #34D399, #10B981)", transition: "width 0.6s ease" }} />
            </div>
          </div>
        )}

        {/* ── Search input ── */}
        <div style={{ marginTop: 16, position: "relative" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === "mn" ? "Тулаанч хайх…" : locale === "ko" ? "파이터 검색…" : "Search fighters…"}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 12px 10px 34px",
              borderRadius: 12, background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", fontSize: 13, fontWeight: 600,
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 2 }}
            >✕</button>
          )}
        </div>
      </div>

      {/* ── Beginner notice ── */}
      {isBeginnerUser(totalSessionCount ?? 999) && totalSessionCount !== null && (
        <div style={{ margin: "0 14px 16px", padding: "12px 14px", borderRadius: 14, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#A78BFA", marginBottom: 4 }}>
            {t("beginnerStudyLater")}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
            {t("beginnerStudyLaterDesc")}
          </div>
        </div>
      )}

      {/* ── Recommended for you ── */}
      {recommended.length > 0 && (
        <div style={{ padding: "0 14px 20px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: GOLD, textTransform: "uppercase" }}>
              {recommended[0]?.dnaMatch
                ? (locale === "mn" ? "Таны ДНХ-д тохирох тулаанч" : locale === "ko" ? "파이터 DNA 매칭" : "Fighter DNA Match")
                : t("fighterRecommended")}
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(245,196,81,0.12)" }} />
            {recommended[0]?.dnaMatch && fighterDNA?.archetype && (
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontWeight: 700 }}>
                {fighterDNA.archetype}
              </span>
            )}
            {!recommended[0]?.dnaMatch && (
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontWeight: 700 }}>
                {recommended[0]?.archetypeBased
                  ? locale === "mn" ? "таны загварт тохирсон" : locale === "ko" ? "스타일 기반" : "your style match"
                  : snapshot?.weakAreas?.slice(0, 2).map(([k]) => k).join(" · ")}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(isBeginnerUser(totalSessionCount ?? 999) ? recommended.slice(0, 1) : recommended).map(({ fighter, connection, archetypeBased, dnaMatch, studyFocus }) => (
              <RecommendedCard
                key={fighter.id}
                fighter={fighter}
                connection={connection}
                archetypeBased={archetypeBased}
                dnaMatch={dnaMatch}
                studyFocus={studyFocus}
                locale={locale}
                onClick={() => router.push(`/${locale}/fighters/${fighter.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Archetype filter + All fighters grid ── */}
      <div style={{ padding: "0 14px 8px", position: "relative", zIndex: 1 }}>
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.28)", textTransform: "uppercase" }}>
            {activeArchFilter
              ? `${ARCH_FILTER_LABELS[locale]?.[activeArchFilter] || activeArchFilter} · ${filteredRanked.length}`
              : searchQuery
              ? `${filteredRanked.length} ${locale === "mn" ? "тулаанч" : locale === "ko" ? "파이터" : "fighters"}`
              : t("fighterAllFighters")}
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Archetype filter pills */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12, WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
          {[null, "pressure", "outboxer", "counter", "explosive", "technician"].map((arch) => {
            const isActive = activeArchFilter === arch;
            const color = arch ? (ARCH_TRAINING_COLORS[arch] || GOLD) : "rgba(255,255,255,0.55)";
            const label = arch
              ? (ARCH_FILTER_LABELS[locale]?.[arch] || arch)
              : (locale === "mn" ? "Бүгд" : locale === "ko" ? "전체" : "All");
            const count = arch ? ranked.filter(({ fighter }) => classifyFighterArchetype(fighter) === arch).length : ranked.length;
            return (
              <button
                key={arch || "all"}
                type="button"
                onClick={() => setActiveArchFilter(arch)}
                style={{
                  flexShrink: 0, padding: "5px 12px", borderRadius: 20,
                  background: isActive ? `${color}20` : "rgba(255,255,255,0.04)",
                  border: isActive ? `1px solid ${color}55` : "1px solid rgba(255,255,255,0.08)",
                  color: isActive ? color : "rgba(255,255,255,0.38)",
                  fontSize: 10, fontWeight: 900, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                  boxShadow: isActive ? `0 0 12px ${color}25` : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {label}
                <span style={{ fontSize: 8, fontWeight: 700, opacity: 0.6 }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Weight class filter */}
        {availableWeightClasses.length > 0 && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
            <button
              key="all-wc"
              type="button"
              onClick={() => setActiveWeightFilter(null)}
              style={{
                flexShrink: 0, padding: "4px 10px", borderRadius: 20,
                background: activeWeightFilter === null ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                border: activeWeightFilter === null ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
                color: activeWeightFilter === null ? "#fff" : "rgba(255,255,255,0.38)",
                fontSize: 9, fontWeight: 900, cursor: "pointer",
              }}
            >
              {locale === "mn" ? "Бүх жин" : locale === "ko" ? "전체 체급" : "All Classes"}
            </button>
            {availableWeightClasses.map((wc) => (
              <button
                key={wc}
                type="button"
                onClick={() => setActiveWeightFilter(activeWeightFilter === wc ? null : wc)}
                style={{
                  flexShrink: 0, padding: "4px 10px", borderRadius: 20,
                  background: activeWeightFilter === wc ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                  border: activeWeightFilter === wc ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  color: activeWeightFilter === wc ? "#fff" : "rgba(255,255,255,0.38)",
                  fontSize: 9, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {wc}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty state for filter */}
      {filteredRanked.length === 0 && (
        <div style={{ padding: "32px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🥊</div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 700 }}>
            {locale === "mn" ? "Тулаанч олдсонгүй" : locale === "ko" ? "파이터 없음" : "No fighters found"}
          </p>
        </div>
      )}

      <div style={{ ...s.grid, padding: "0 14px" }}>
        {filteredRanked.map(({ fighter, connection }) => (
          <FighterGridCard
            key={fighter.id}
            fighter={fighter}
            badge={connection?.isDirectlyRelevant && !recommendedIds.has(fighter.id) ? connection.primaryFocus : null}
            studied={studiedFighters.includes(fighter.id)}
            onClick={() => router.push(`/${locale}/fighters/${fighter.id}`)}
            compareMode={compareMode}
            selected={compareIds.includes(fighter.id)}
            onToggle={() => toggleCompare(fighter.id)}
          />
        ))}
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="fighters" />

      {compareMode && compareIds.length === 2 && (
        <FighterCompareModal
          fighterIds={compareIds}
          snapshot={snapshot}
          locale={locale}
          router={router}
          onClose={() => { setCompareIds([]); setCompareMode(false); }}
        />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100dvh",
    background: pageBg(0.16),
    color: "#fff",
    paddingBottom: "calc(88px + env(safe-area-inset-bottom))",
    position: "relative",
  },
  ambientGlow: {
    position: "absolute", top: 0, left: "50%",
    transform: "translateX(-50%)",
    width: "90%", height: 340,
    background: `radial-gradient(ellipse at top, ${redAlpha(0.14)} 0%, transparent 68%)`,
    pointerEvents: "none", zIndex: 0,
  },
  header: {
    padding: "calc(36px + env(safe-area-inset-top)) 20px 24px",
    position: "relative", zIndex: 1,
  },
  backPill: {
    width: 40, height: 40,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    color: "#fff", borderRadius: 12, cursor: "pointer", padding: 0, marginBottom: 18,
  },
  kicker: { margin: "0 0 8px", color: RED, fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" },
  title: {
    margin: "0 0 8px",
    fontSize: "clamp(34px, 10vw, 52px)",
    fontWeight: 1000, letterSpacing: "-0.03em", lineHeight: 0.92,
    color: "#fff", fontFamily: "var(--font-display, 'Anton', sans-serif)", textTransform: "uppercase",
  },
  subtitle: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 },
  grid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: 12, position: "relative", zIndex: 1,
  },
};
