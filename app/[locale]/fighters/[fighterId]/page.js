"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getLocale, translate } from "@/lib/i18n";
import { getFighter } from "@/lib/fighters";
import {
  getLocalizedField,
  getLocalizedCombos,
  getLocalizedFights,
} from "@/lib/fighters.i18n";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";

// ─── Combo step pills ─────────────────────────────────────────────────────────
function ComboSteps({ steps }) {
  return (
    <div style={s.comboSteps}>
      {steps.map((step, i) => (
        <span key={i} style={s.comboStepWrap}>
          <span style={s.comboStep}>{step}</span>
          {i < steps.length - 1 && <span style={s.comboArrow}>›</span>}
        </span>
      ))}
    </div>
  );
}

// ─── Tap-to-expand section ────────────────────────────────────────────────────
function Section({ title, emoji, accent, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ ...s.section, borderLeftColor: open ? accent : "rgba(255,255,255,0.08)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={s.sectionBtn}
      >
        <span style={{ ...s.sectionTitle, color: open ? accent : "#888" }}>
          {emoji} {title}
        </span>
        <svg
          style={{
            ...s.chevron,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: open ? accent : "#444",
          }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div style={s.sectionBody}>{children}</div>}
    </div>
  );
}

export default function FighterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const fighter = getFighter(params?.fighterId);

  if (!fighter) {
    return (
      <div style={s.page}>
        <div style={s.notFound}>
          <span style={{ fontSize: 48 }}>🥊</span>
          <p style={{ color: "#aaa", marginTop: 12, fontSize: 14 }}>{t("fighterNotFound")}</p>
          <button style={s.backBtn} onClick={() => router.back()}>← {t("back")}</button>
        </div>
        <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
      </div>
    );
  }

  const acc = fighter.accent;

  // Localized content
  const identity       = getLocalizedField(fighter, "identity", locale);
  const styleIdentity  = getLocalizedField(fighter, "styleIdentity", locale);
  const moveDNADesc    = getLocalizedField(fighter, "movementDNA", locale, "description");
  const whatToStudy    = getLocalizedField(fighter, "whatToStudy", locale);
  const habits         = getLocalizedField(fighter, "habitsToMimick", locale);
  const drills         = getLocalizedField(fighter, "drills", locale);
  const weaknesses     = getLocalizedField(fighter, "weaknesses", locale);
  const combos         = getLocalizedCombos(fighter, locale);
  const fights         = getLocalizedFights(fighter, locale);

  return (
    <div style={{ ...s.page, background: `radial-gradient(ellipse at top center, ${acc}12 0%, transparent 40%), #080808` }} className="page-enter">

      {/* ══════════ HERO ══════════ */}
      <div style={{ ...s.hero, background: `linear-gradient(180deg, ${acc}30 0%, ${acc}0e 55%, #080808 88%)` }} className="hero-enter">
        {/* Glow accent bar at very top */}
        <div style={{ ...s.heroTopBar, background: `linear-gradient(90deg, ${acc} 0%, ${acc}66 60%, transparent 100%)` }} />

        {/* Ambient radial glow — larger, more dramatic */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "140%", height: "100%", background: `radial-gradient(ellipse at 50% 10%, ${acc}2a 0%, transparent 55%)`, pointerEvents: "none" }} />

        {/* Faint grid lines for depth */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${acc}06 1px, transparent 1px), linear-gradient(90deg, ${acc}06 1px, transparent 1px)`, backgroundSize: "44px 44px", pointerEvents: "none", opacity: 0.5 }} />

        <button style={s.backPill} onClick={() => router.back()}>
          ← {t("back")}
        </button>

        {/* Cinematic centered fighter identity */}
        <div style={s.heroCenter} className="silhouette-enter">
          <p style={s.heroKicker}>GAVANA · FIGHTER STUDY</p>

          {/* Flag focal point with glow */}
          <div style={s.heroFlagDisplay}>
            <span style={s.heroFlagBig}>{fighter.country}</span>
            <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", width: 80, height: 20, background: `radial-gradient(ellipse, ${acc}70, transparent 70%)`, filter: "blur(10px)", pointerEvents: "none" }} />
          </div>

          {/* Fighter name — Anton display font, massive */}
          <h1 style={{ ...s.heroNameBig, textShadow: `0 0 40px ${acc}44` }}>
            {fighter.name.toUpperCase()}
          </h1>
          <p style={s.heroNickname}>"{fighter.nickname}"</p>

          {/* Meta row: style + weight class */}
          <div style={s.heroMeta}>
            <span style={{ ...s.heroStyleBadge, background: acc + "1e", color: acc, borderColor: acc + "40" }}>
              {fighter.style}
            </span>
            <span style={s.heroWeightClass}>{fighter.weightClass}</span>
          </div>
        </div>

        {/* Identity line */}
        <p style={s.heroIdentity}>{identity}</p>

        {/* Key weapon — inline, no card */}
        <div style={s.heroWeapon}>
          <span style={s.heroWeaponDot}>⚡</span>
          <span style={{ ...s.heroWeaponText, color: acc }}>{fighter.keyWeapon}</span>
        </div>

        {/* Bottom accent line */}
        <div style={{ ...s.heroAccentLine, background: `linear-gradient(90deg, ${acc} 0%, ${acc}55 50%, transparent 100%)` }} />
      </div>

      {/* ══════════ CONTENT ══════════ */}
      <div style={s.content}>

        {/* ── Style Identity ── */}
        <Section title={t("fighterStyleIdentity")} emoji="🎯" accent={acc} defaultOpen>
          <div style={s.pillGrid}>
            {styleIdentity.map((item, i) => (
              <span key={i} style={{ ...s.stylePill, borderColor: acc + "35", background: acc + "0d" }}>
                <span style={{ ...s.pillDot, background: acc }} />
                {item}
              </span>
            ))}
          </div>
        </Section>

        {/* ── Signature Combos ── */}
        <Section title={t("fighterSignatureCombos")} emoji="💥" accent={acc} defaultOpen>
          {combos.map((combo, i) => (
            <div key={i} style={s.comboCard}>
              <p style={{ ...s.comboName, color: acc }}>{combo.name}</p>
              <ComboSteps steps={combo.steps} />
            </div>
          ))}
        </Section>

        {/* ── Movement DNA ── */}
        <Section title={t("fighterMovementDNA")} emoji="🧬" accent={acc}>
          <div style={{ ...s.dnaBox, borderColor: acc + "35", background: acc + "0a" }}>
            <div style={s.dnaHeader}>
              <span style={{ ...s.dnaType, color: acc }}>{fighter.movementDNA.type}</span>
              <div style={s.dnaTags}>
                {fighter.movementDNA.tags.map((tag) => (
                  <span key={tag} style={{ ...s.dnaTag, borderColor: acc + "40", color: acc + "bb" }}>{tag}</span>
                ))}
              </div>
            </div>
            <p style={s.dnaDesc}>{moveDNADesc}</p>
          </div>
        </Section>

        {/* ── What to Study ── */}
        <Section title={t("fighterWhatToStudy")} emoji="📚" accent={acc}>
          {whatToStudy.map((item, i) => (
            <div key={i} style={s.numRow}>
              <span style={{ ...s.numBadge, background: acc + "22", color: acc }}>{i + 1}</span>
              <span style={s.rowText}>{item}</span>
            </div>
          ))}
        </Section>

        {/* ── Habits to Copy ── */}
        <Section title={t("fighterHabits")} emoji="🔄" accent="#D4AF37">
          {habits.map((item, i) => (
            <div key={i} style={s.dotRow}>
              <span style={{ ...s.dotMark, background: "#D4AF37" }} />
              <span style={s.rowText}>{item}</span>
            </div>
          ))}
        </Section>

        {/* ── Drills ── */}
        <Section title={t("fighterDrills")} emoji="🏋️" accent="#10B981">
          {drills.map((drill, i) => (
            <div key={i} style={s.drillRow}>
              <span style={s.drillNum}>{i + 1}</span>
              <span style={s.drillText}>{drill}</span>
            </div>
          ))}
        </Section>

        {/* ── Weaknesses ── */}
        <Section title={t("fighterWeaknesses")} emoji="⚠️" accent="#F87171">
          {weaknesses.map((item, i) => (
            <div key={i} style={s.dotRow}>
              <span style={{ ...s.dotMark, background: "#F87171" }} />
              <span style={{ ...s.rowText, color: "#999" }}>{item}</span>
            </div>
          ))}
        </Section>

        {/* ── Famous Fights ── */}
        <Section title={t("fighterFamousFights")} emoji="🎬" accent="#D4AF37">
          {fights.map((f, i) => (
            <div key={i} style={s.fightRow}>
              <div style={s.fightMeta}>
                <span style={s.fightName}>{f.fight}</span>
                <span style={s.fightYear}>{f.year}</span>
              </div>
              <p style={s.fightNote}>{f.note}</p>
            </div>
          ))}
        </Section>

        {/* ── Related tags ── */}
        <div style={s.tagsBlock}>
          <p style={s.tagsLabel}>Tags</p>
          <div style={s.tagsRow}>
            {fighter.relatedKeywords.map((kw) => (
              <span key={kw} style={s.tagChip}>{kw}</span>
            ))}
          </div>
        </div>

        {/* ── Back to all ── */}
        <button style={s.allBtn} onClick={() => router.push(`/${locale}/fighters`)}>
          ← {t("fighterBackToAll")}
        </button>

      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    paddingBottom: 100,
    position: "relative",
  },

  // ── Hero ──
  hero: {
    position: "relative",
    paddingTop: "calc(16px + env(safe-area-inset-top))",
    paddingBottom: 0,
    overflow: "hidden",
  },
  heroTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  backPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    padding: "5px 16px",
    borderRadius: 20,
    cursor: "pointer",
    margin: "10px 0 4px",
    position: "relative",
    zIndex: 2,
  },
  heroCenter: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "0 20px 16px",
    position: "relative",
    zIndex: 2,
  },
  heroKicker: {
    margin: "0 0 16px",
    fontSize: 8,
    fontWeight: 900,
    letterSpacing: 3,
    color: "rgba(255,255,255,0.25)",
    textTransform: "uppercase",
  },
  heroFlagDisplay: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroFlagBig: {
    fontSize: 72,
    lineHeight: 1,
    filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.7)) drop-shadow(0 0 30px rgba(255,255,255,0.05))",
  },
  heroNameBig: {
    margin: "0 0 6px",
    fontSize: "clamp(38px, 11vw, 64px)",
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    fontWeight: 400,
    letterSpacing: "0.02em",
    lineHeight: 0.9,
    color: "#fff",
    textTransform: "uppercase",
  },
  heroNickname: {
    margin: "0 0 16px",
    fontSize: 13,
    color: "rgba(255,255,255,0.38)",
    fontStyle: "italic",
    fontWeight: 400,
  },
  heroMeta: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  heroStyleBadge: {
    display: "inline-block",
    border: "1px solid",
    borderRadius: 20,
    padding: "4px 13px",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  heroWeightClass: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.28)",
  },
  heroIdentity: {
    margin: "0 20px 12px",
    fontSize: 13,
    color: "rgba(255,255,255,0.62)",
    lineHeight: 1.65,
    fontWeight: 400,
    textAlign: "center",
    position: "relative",
    zIndex: 2,
  },
  heroWeapon: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    margin: "0 16px 18px",
    padding: "0 0 4px",
  },
  heroWeaponDot: {
    fontSize: 14,
    opacity: 0.7,
  },
  heroWeaponText: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.1,
  },
  heroAccentLine: {
    height: 1,
    marginTop: 0,
    opacity: 0.6,
  },

  // ── Content ──
  content: {
    padding: "16px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  // ── Section ──
  section: {
    background: "rgba(255,255,255,0.02)",
    border: "none",
    borderLeft: "2px solid",
    borderRadius: 0,
    overflow: "hidden",
    transition: "border-color 220ms ease",
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  sectionBtn: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "13px 16px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: "uppercase",
    transition: "color 220ms ease",
  },
  chevron: {
    width: 15,
    height: 15,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    flexShrink: 0,
    transition: "transform 220ms ease, color 220ms ease",
    opacity: 0.5,
  },
  sectionBody: {
    padding: "0 16px 14px",
  },

  // ── Style identity pills ──
  pillGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  stylePill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    color: "#ddd",
    lineHeight: 1.3,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    flexShrink: 0,
  },

  // ── Combos ──
  comboCard: {
    background: "rgba(255,255,255,0.025)",
    borderRadius: 10,
    padding: "10px 12px",
    marginBottom: 8,
  },
  comboName: {
    margin: "0 0 6px",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  comboSteps: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    alignItems: "center",
  },
  comboStepWrap: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  comboStep: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    padding: "2px 7px",
    fontSize: 11,
    fontWeight: 600,
    color: "#e0e0e0",
  },
  comboArrow: {
    color: "#444",
    fontSize: 11,
  },

  // ── Movement DNA ──
  dnaBox: {
    border: "1px solid",
    borderRadius: 10,
    padding: "12px",
    overflow: "hidden",
  },
  dnaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  dnaType: {
    fontSize: 15,
    fontWeight: 900,
    letterSpacing: -0.3,
    lineHeight: 1.1,
  },
  dnaTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "flex-end",
    maxWidth: "55%",
  },
  dnaTag: {
    border: "1px solid",
    borderRadius: 20,
    padding: "1px 6px",
    fontSize: 9,
    fontWeight: 600,
    textTransform: "lowercase",
  },
  dnaDesc: {
    margin: 0,
    fontSize: 12,
    color: "#bbb",
    lineHeight: 1.55,
  },

  // ── Common rows ──
  numRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    marginBottom: 7,
  },
  numBadge: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    fontSize: 9,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  dotRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    marginBottom: 7,
  },
  dotMark: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    flexShrink: 0,
    marginTop: 6,
  },
  rowText: {
    fontSize: 13,
    color: "#d0d0d0",
    lineHeight: 1.45,
  },

  // ── Drills ──
  drillRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    marginBottom: 6,
    background: "rgba(16,185,129,0.06)",
    borderRadius: 7,
    padding: "6px 8px",
  },
  drillNum: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "rgba(16,185,129,0.18)",
    color: "#10B981",
    fontSize: 9,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  drillText: {
    fontSize: 12,
    color: "#c8c8c8",
    lineHeight: 1.45,
  },

  // ── Famous fights ──
  fightRow: {
    paddingBottom: 10,
    marginBottom: 4,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  fightMeta: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  fightName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#eee",
  },
  fightYear: {
    fontSize: 11,
    color: "#555",
  },
  fightNote: {
    margin: 0,
    fontSize: 12,
    color: "#888",
    lineHeight: 1.4,
  },

  // ── Tags ──
  tagsBlock: {
    marginTop: 2,
  },
  tagsLabel: {
    margin: "0 0 6px",
    fontSize: 9,
    color: "#444",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  tagsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 5,
  },
  tagChip: {
    background: "none",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: "3px 10px",
    fontSize: 10,
    color: "rgba(255,255,255,0.28)",
    letterSpacing: 0.2,
  },

  // ── Back button ──
  allBtn: {
    width: "100%",
    padding: "14px",
    background: "none",
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 0,
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
    cursor: "pointer",
    textAlign: "center",
    marginTop: 8,
  },

  // ── Not found ──
  notFound: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: 4,
  },
  backBtn: {
    marginTop: 16,
    padding: "9px 18px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20,
    color: "#aaa",
    fontSize: 12,
    cursor: "pointer",
  },
};
