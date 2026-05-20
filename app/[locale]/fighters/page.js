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
        <p style={s.kicker}>GAVANA · FIGHTER STUDY</p>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    background: `radial-gradient(ellipse at top center, ${redAlpha(0.1)} 0%, transparent 45%), #080808`,
    color: "#fff",
    paddingBottom: 100,
    position: "relative",
  },
  ambientGlow: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "80%",
    height: 300,
    background: `radial-gradient(ellipse at top, ${redAlpha(0.08)} 0%, transparent 70%)`,
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    padding: "calc(36px + env(safe-area-inset-top)) 20px 24px",
    position: "relative",
    zIndex: 1,
  },
  backPill: {
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    borderRadius: 10,
    cursor: "pointer",
    padding: 0,
    marginBottom: 18,
  },
  kicker: {
    margin: "0 0 8px",
    color: RED,
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 3.5,
    textTransform: "uppercase",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "clamp(34px, 10vw, 52px)",
    fontWeight: 900,
    letterSpacing: -0.5,
    lineHeight: 0.95,
    color: "#fff",
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
  },
  subtitle: {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    lineHeight: 1.5,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    padding: "0 14px",
    position: "relative",
    zIndex: 1,
  },
  card: {
    background: "rgba(255,255,255,0.02)",
    border: "none",
    borderRadius: 16,
    overflow: "hidden",
    cursor: "pointer",
    textAlign: "left",
    padding: 0,
  },
  cardBottom: {
    padding: "7px 10px 9px",
    background: "rgba(0,0,0,0.4)",
  },
  cardWeapon: {
    margin: 0,
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    lineHeight: 1.4,
  },
};
