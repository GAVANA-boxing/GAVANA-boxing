"use client";


import { useParams, useRouter } from "next/navigation";
import { getLocale, translate } from "@/lib/i18n";
import { FIGHTERS } from "@/lib/fighters";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import FighterPortrait from "@/components/FighterPortrait";
import { RED, GOLD , redAlpha} from "@/lib/tokens";

function FighterGridCard({ fighter, onClick }) {
  const acc = fighter.accent;
  return (
    <button type="button" onClick={onClick} style={s.card}>
      {/* Portrait area — cinematic visual identity */}
      <FighterPortrait
        fighterId={fighter.id}
        fighter={fighter}
        height={130}
        flagSize={46}
        showName
        showLabel
      />
      {/* Key weapon hint at bottom */}
      <div style={s.cardBottom}>
        <p style={{ ...s.cardWeapon, color: "rgba(255,255,255,0.38)" }}>
          <span style={{ color: acc + "cc", marginRight: 4, fontSize: 9 }}>⚡</span>
          {fighter.keyWeapon}
        </p>
      </div>
    </button>
  );
}

export default function FightersPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  return (
    <div style={s.page} className="page-enter">
      {/* Ambient top glow */}
      <div style={s.ambientGlow} />

      {/* Header */}
      <div style={s.header}>
        <button type="button" style={s.backPill} onClick={() => router.back()} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <p style={s.kicker}>COMBAT · FIGHTERS</p>
        <h1 style={s.title}>{t("fighterAllTitle")}</h1>
        <p style={s.subtitle}>{t("fighterAllSubtitle")}</p>
      </div>

      {/* Fighter grid */}
      <div style={s.grid}>
        {FIGHTERS.map((fighter) => (
          <FighterGridCard
            key={fighter.id}
            fighter={fighter}
            onClick={() => router.push(`/${locale}/fighters/${fighter.id}`)}
          />
        ))}
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100dvh",
    background: `radial-gradient(ellipse at 50% -8%, ${redAlpha(0.16)} 0%, transparent 50%), #0B0B0C`,
    color: "#fff",
    paddingBottom: "calc(88px + env(safe-area-inset-bottom))",
    position: "relative",
  },
  ambientGlow: {
    position: "absolute",
    top: 0, left: "50%",
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
  kicker: {
    margin: "0 0 8px", color: RED, fontSize: 9,
    fontWeight: 900, letterSpacing: 3.5, textTransform: "uppercase",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "clamp(34px, 10vw, 52px)",
    fontWeight: 1000,
    letterSpacing: "-0.03em",
    lineHeight: 0.92,
    color: "#fff",
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    textTransform: "uppercase",
  },
  subtitle: {
    margin: 0, fontSize: 13,
    color: "rgba(255,255,255,0.4)", lineHeight: 1.5,
  },
  grid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: 12, padding: "0 14px",
    position: "relative", zIndex: 1,
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20, overflow: "hidden",
    cursor: "pointer", textAlign: "left", padding: 0,
    boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
    transition: "transform 180ms ease, box-shadow 180ms ease",
  },
  cardBottom: {
    padding: "8px 11px 10px",
    background: "rgba(0,0,0,0.55)",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  cardWeapon: {
    margin: 0, fontSize: 10,
    color: "rgba(255,255,255,0.38)", lineHeight: 1.4,
  },
};
