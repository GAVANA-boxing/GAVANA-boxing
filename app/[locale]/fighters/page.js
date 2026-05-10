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
      <div style={{ ...s.cardTop, background: `linear-gradient(150deg, ${acc}33 0%, #111 100%)` }}>
        <span style={s.cardFlag}>{fighter.country}</span>
        <span style={{ ...s.cardAccentBar, background: acc }} />
      </div>
      {/* Info */}
      <div style={s.cardBody}>
        <p style={s.cardName}>{fighter.name}</p>
        <p style={s.cardNickname}>"{fighter.nickname}"</p>
        <span style={{ ...s.cardStylePill, borderColor: acc + "50", color: acc }}>
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
    <div style={s.page}>
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
    background: "#080808",
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    paddingBottom: 100,
  },
  header: {
    padding: "calc(32px + env(safe-area-inset-top)) 20px 20px",
  },
  backPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#aaa",
    fontSize: 13,
    padding: "6px 14px",
    borderRadius: 20,
    cursor: "pointer",
    marginBottom: 16,
  },
  kicker: {
    margin: "0 0 6px",
    color: "#C1121F",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  title: {
    margin: "0 0 6px",
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: -0.5,
    lineHeight: 1.1,
  },
  subtitle: {
    margin: 0,
    fontSize: 13,
    color: "#666",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    padding: "0 16px",
  },
  card: {
    background: "#111",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    overflow: "hidden",
    cursor: "pointer",
    textAlign: "left",
    padding: 0,
  },
  cardTop: {
    height: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cardFlag: {
    fontSize: 38,
    lineHeight: 1,
  },
  cardAccentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.6,
  },
  cardBody: {
    padding: "10px 12px 12px",
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
    fontSize: 10,
    color: "#666",
    fontStyle: "italic",
  },
  cardStylePill: {
    display: "inline-block",
    border: "1px solid",
    borderRadius: 20,
    padding: "2px 7px",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  cardWeapon: {
    margin: 0,
    fontSize: 10,
    color: "#777",
    lineHeight: 1.4,
  },
};
