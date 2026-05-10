"use client";

import { useParams, useRouter } from "next/navigation";
import { getLocale, translate } from "@/lib/i18n";
import { FIGHTERS } from "@/lib/fighters";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";

function FighterGridCard({ fighter, onClick }) {
  const acc = fighter.accent;
  return (
    <button type="button" onClick={onClick} style={s.card}>
      {/* Gradient top */}
      <div style={{ ...s.cardTop, background: `linear-gradient(160deg, ${acc}3a 0%, #0e0e0e 100%)` }}>
        <span style={s.cardFlag}>{fighter.country}</span>
        <div style={{ ...s.cardAccentBar, background: `linear-gradient(90deg, ${acc}, ${acc}00)` }} />
        {/* Ambient corner glow */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(ellipse at 50% 0%, ${acc}18, transparent 70%)`, pointerEvents: "none" }} />
      </div>
      {/* Info */}
      <div style={s.cardBody}>
        <p style={s.cardName}>{fighter.name}</p>
        <p style={s.cardNickname}>"{fighter.nickname}"</p>
        <span style={{ ...s.cardStylePill, borderColor: acc + "40", color: acc }}>
          {fighter.style}
        </span>
        <p style={s.cardWeapon}>{fighter.keyWeapon}</p>
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
        <button style={s.backPill} onClick={() => router.back()}>← {t("back")}</button>
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
    background: "radial-gradient(ellipse at top center, rgba(193,18,31,0.1) 0%, transparent 45%), #080808",
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
    background: "radial-gradient(ellipse at top, rgba(193,18,31,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    padding: "calc(36px + env(safe-area-inset-top)) 20px 24px",
    position: "relative",
    zIndex: 1,
  },
  backPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "rgba(255,255,255,0.05)",
    border: "none",
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    padding: "6px 14px",
    borderRadius: 20,
    cursor: "pointer",
    marginBottom: 18,
  },
  kicker: {
    margin: "0 0 8px",
    color: "#C1121F",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 3.5,
    textTransform: "uppercase",
  },
  title: {
    margin: "0 0 8px",
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: -0.8,
    lineHeight: 1.05,
    color: "#fff",
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
    background: "rgba(255,255,255,0.03)",
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    overflow: "hidden",
    cursor: "pointer",
    textAlign: "left",
    padding: 0,
  },
  cardTop: {
    height: 90,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  cardFlag: {
    fontSize: 44,
    lineHeight: 1,
    position: "relative",
    zIndex: 1,
    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.6))",
  },
  cardAccentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "60%",
    height: 1.5,
    opacity: 0.7,
  },
  cardBody: {
    padding: "10px 12px 14px",
  },
  cardName: {
    margin: "0 0 2px",
    fontSize: 13,
    fontWeight: 800,
    color: "#fff",
    lineHeight: 1.2,
  },
  cardNickname: {
    margin: "0 0 8px",
    fontSize: 9,
    color: "rgba(255,255,255,0.35)",
    fontStyle: "italic",
  },
  cardStylePill: {
    display: "inline-block",
    border: "1px solid",
    borderRadius: 20,
    padding: "2px 7px",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  cardWeapon: {
    margin: 0,
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    lineHeight: 1.4,
  },
};
