"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getLocale, translate } from "@/lib/i18n";
import { FIGHTERS } from "@/lib/fighters";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import FighterPortrait from "@/components/FighterPortrait";
import { RED, GOLD, redAlpha, pageBg } from "@/lib/tokens";
import { buildCoachSnapshot } from "@/lib/buildCoachContext";
import { getPersonalConnection } from "@/lib/fighterPersonalConnection";

function FighterGridCard({ fighter, onClick, badge, studied }) {
  const acc = fighter.accent;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...s.card,
        border: badge ? `1px solid ${acc}50` : studied ? `1px solid rgba(52,211,153,0.2)` : "1px solid rgba(255,255,255,0.08)",
        borderBottom: `3px solid ${acc}55`,
        boxShadow: badge
          ? `0 8px 28px rgba(0,0,0,0.5), 0 0 0 1px ${acc}22`
          : `0 8px 28px rgba(0,0,0,0.5), inset 0 0 0 1px ${acc}12`,
      }}
    >
      <FighterPortrait fighterId={fighter.id} fighter={fighter} height={155} flagSize={46} showName showLabel />
      {badge && (
        <div style={{ position: "absolute", top: 8, right: 8, padding: "2px 7px", borderRadius: 999, background: `${acc}22`, border: `1px solid ${acc}55`, fontSize: 8, fontWeight: 900, color: acc, letterSpacing: 1, textTransform: "uppercase" }}>
          {badge}
        </div>
      )}
      {studied && !badge && (
        <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", background: "rgba(52,211,153,0.18)", border: "1px solid rgba(52,211,153,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )}
      <div style={s.cardBottom}>
        <p style={{ ...s.cardWeapon, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center" }}>
          <svg width="8" height="10" viewBox="0 0 13 16" fill={acc} style={{ marginRight: 5, flexShrink: 0 }}>
            <path d="M7 0L0 9h6l-1 7 7-9H6L7 0z"/>
          </svg>
          {fighter.keyWeapon}
        </p>
      </div>
    </button>
  );
}

function RecommendedCard({ fighter, connection, onClick }) {
  const acc = fighter.accent;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 0,
        width: "100%", textAlign: "left", cursor: "pointer", padding: 0,
        background: `linear-gradient(90deg, ${acc}10 0%, rgba(0,0,0,0) 100%)`,
        border: `1px solid ${acc}35`,
        borderLeft: `3px solid ${acc}`,
        borderRadius: 14, overflow: "hidden",
      }}
    >
      <div style={{ width: 70, height: 80, flexShrink: 0, overflow: "hidden" }}>
        <FighterPortrait fighterId={fighter.id} fighter={fighter} height={80} flagSize={0} showName={false} showLabel={false} />
      </div>
      <div style={{ flex: 1, padding: "10px 12px" }}>
        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.5, color: acc, textTransform: "uppercase", marginBottom: 3 }}>
          {connection.primaryFocus} {connection.primaryValue?.toFixed(1)} →
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 4 }}>
          {fighter.name}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.4 }}>
          {fighter.style}
        </div>
      </div>
      <div style={{ padding: "0 14px 0 0", color: "rgba(255,255,255,0.2)", fontSize: 18 }}>›</div>
    </button>
  );
}

export default function FightersPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const [snapshot, setSnapshot] = useState(null);
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
        const sessions = sessSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => d.type === "training" && d.score != null)
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setSnapshot(buildCoachSnapshot({ sessions, profileData: {} }));
        setStudiedFighters(userSnap.data()?.studiedFighters || []);
      } catch { /* silent */ }
    })();
    return () => { active = false; };
  }, [user?.uid]);

  // Rank fighters by relevance to user's weak areas
  const ranked = FIGHTERS.map((f) => ({
    fighter: f,
    connection: snapshot ? getPersonalConnection(snapshot, f) : null,
  })).sort((a, b) => {
    const aScore = a.connection?.relevantWeak?.length || 0;
    const bScore = b.connection?.relevantWeak?.length || 0;
    return bScore - aScore;
  });

  const recommended = snapshot
    ? ranked.filter((r) => r.connection?.isDirectlyRelevant).slice(0, 3)
    : [];
  const recommendedIds = new Set(recommended.map((r) => r.fighter.id));

  return (
    <div style={s.page} className="page-enter">
      <div style={s.ambientGlow} />

      <div style={s.header}>
        <button type="button" style={s.backPill} onClick={() => router.back()} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <p style={s.kicker}>COMBAT · FIGHTERS</p>
        <h1 style={s.title}>{t("fighterAllTitle")}</h1>
        <p style={s.subtitle}>{t("fighterAllSubtitle")}</p>

        {/* ── Fighter Mastery progress ── */}
        {studiedFighters.length > 0 && (
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.8, color: "#34D399", textTransform: "uppercase" }}>
                ⚔️ {locale === "mn" ? "Fighter Mastery" : "Fighter Mastery"}
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
      </div>

      {/* ── Recommended for you ── */}
      {recommended.length > 0 && (
        <div style={{ padding: "0 14px 20px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: GOLD, textTransform: "uppercase" }}>
              Танд зөв сонголт
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(245,196,81,0.12)" }} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontWeight: 700 }}>
              {snapshot?.weakAreas?.slice(0, 2).map(([k]) => k).join(" · ")}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recommended.map(({ fighter, connection }) => (
              <RecommendedCard
                key={fighter.id}
                fighter={fighter}
                connection={connection}
                onClick={() => router.push(`/${locale}/fighters/${fighter.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── All fighters grid ── */}
      {recommended.length > 0 && (
        <div style={{ padding: "0 14px 8px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.28)", textTransform: "uppercase" }}>
              Бүх тулаанчид
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          </div>
        </div>
      )}

      <div style={{ ...s.grid, padding: "0 14px" }}>
        {ranked.map(({ fighter, connection }) => (
          <FighterGridCard
            key={fighter.id}
            fighter={fighter}
            badge={connection?.isDirectlyRelevant && !recommendedIds.has(fighter.id) ? connection.primaryFocus : null}
            studied={studiedFighters.includes(fighter.id)}
            onClick={() => router.push(`/${locale}/fighters/${fighter.id}`)}
          />
        ))}
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="home" />
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
  kicker: { margin: "0 0 8px", color: RED, fontSize: 9, fontWeight: 900, letterSpacing: 3.5, textTransform: "uppercase" },
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
  card: {
    background: "rgba(255,255,255,0.03)",
    borderRadius: 20, overflow: "hidden",
    cursor: "pointer", textAlign: "left", padding: 0,
    boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
    transition: "transform 180ms ease, box-shadow 180ms ease",
    position: "relative",
  },
  cardBottom: {
    padding: "8px 11px 10px",
    background: "rgba(0,0,0,0.55)",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  cardWeapon: { margin: 0, fontSize: 10, color: "rgba(255,255,255,0.38)", lineHeight: 1.4 },
};

