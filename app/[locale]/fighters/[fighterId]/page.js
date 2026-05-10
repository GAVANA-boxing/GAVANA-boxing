"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getLocale, translate } from "@/lib/i18n";
import { getFighter } from "@/lib/fighters";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";

// ─── Combo step row ───────────────────────────────────────────────────────────
function ComboSteps({ steps }) {
  return (
    <div style={s.comboSteps}>
      {steps.map((step, i) => (
        <div key={i} style={s.comboStepWrap}>
          <span style={s.comboStep}>{step}</span>
          {i < steps.length - 1 && <span style={s.comboArrow}>→</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ title, emoji, accent, children }) {
  return (
    <div style={{ ...s.section, borderColor: accent + "30" }}>
      <p style={{ ...s.sectionTitle, color: accent }}>
        {emoji} {title}
      </p>
      {children}
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
          <span style={{ fontSize: 40 }}>🥊</span>
          <p style={{ color: "#aaa", marginTop: 12 }}>{t("fighterNotFound")}</p>
          <button style={s.backBtn} onClick={() => router.back()}>← {t("back")}</button>
        </div>
        <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
      </div>
    );
  }

  const acc = fighter.accent;

  return (
    <div style={s.page}>
      {/* ── Hero header ── */}
      <div style={{ ...s.hero, background: `linear-gradient(160deg, ${acc}22 0%, #080808 60%)` }}>
        <button style={s.backPill} onClick={() => router.back()}>
          ← {t("back")}
        </button>

        <div style={s.heroContent}>
          <span style={s.heroFlag}>{fighter.country}</span>
          <h1 style={s.heroName}>{fighter.name}</h1>
          <p style={s.heroNickname}>"{fighter.nickname}"</p>

          <div style={s.heroPills}>
            <span style={{ ...s.heroPill, borderColor: acc + "60", color: acc }}>{fighter.weightClass}</span>
            <span style={{ ...s.heroPill, borderColor: acc + "60", color: acc }}>{fighter.style}</span>
          </div>

          <p style={s.heroIdentity}>{fighter.identity}</p>
        </div>

        {/* Accent line */}
        <div style={{ ...s.heroLine, background: acc }} />
      </div>

      <div style={s.content}>

        {/* ── Style Identity ── */}
        <Section title={t("fighterStyleIdentity")} emoji="🎯" accent={acc}>
          {fighter.styleIdentity.map((item, i) => (
            <div key={i} style={s.bulletRow}>
              <span style={{ ...s.bulletDot, background: acc }} />
              <span style={s.bulletText}>{item}</span>
            </div>
          ))}
        </Section>

        {/* ── Signature Combos ── */}
        <Section title={t("fighterSignatureCombos")} emoji="💥" accent={acc}>
          {fighter.signatureCombos.map((combo, i) => (
            <div key={i} style={s.comboCard}>
              <p style={s.comboName}>{combo.name}</p>
              <ComboSteps steps={combo.steps} />
            </div>
          ))}
        </Section>

        {/* ── Movement DNA ── */}
        <Section title={t("fighterMovementDNA")} emoji="🧬" accent={acc}>
          <div style={{ ...s.moveDNABox, borderColor: acc + "40", background: acc + "0a" }}>
            <p style={{ ...s.moveDNAType, color: acc }}>{fighter.movementDNA.type}</p>
            <p style={s.moveDNADesc}>{fighter.movementDNA.description}</p>
            <div style={s.moveDNATags}>
              {fighter.movementDNA.tags.map((tag) => (
                <span key={tag} style={{ ...s.moveDNATag, borderColor: acc + "40", color: acc + "cc" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Section>

        {/* ── What to Study ── */}
        <Section title={t("fighterWhatToStudy")} emoji="📚" accent={acc}>
          {fighter.whatToStudy.map((item, i) => (
            <div key={i} style={s.bulletRow}>
              <span style={s.bulletNum}>{i + 1}</span>
              <span style={s.bulletText}>{item}</span>
            </div>
          ))}
        </Section>

        {/* ── Habits to Copy ── */}
        <Section title={t("fighterHabits")} emoji="🔄" accent={acc}>
          {fighter.habitsToMimick.map((item, i) => (
            <div key={i} style={s.bulletRow}>
              <span style={{ ...s.bulletDot, background: "#D4AF37" }} />
              <span style={s.bulletText}>{item}</span>
            </div>
          ))}
        </Section>

        {/* ── Recommended Drills ── */}
        <Section title={t("fighterDrills")} emoji="🏋️" accent="#10B981">
          {fighter.drills.map((drill, i) => (
            <div key={i} style={s.drillRow}>
              <span style={s.drillIndex}>{i + 1}</span>
              <span style={s.drillText}>{drill}</span>
            </div>
          ))}
        </Section>

        {/* ── Weaknesses / Risk ── */}
        <Section title={t("fighterWeaknesses")} emoji="⚠️" accent="#F87171">
          {fighter.weaknesses.map((item, i) => (
            <div key={i} style={s.bulletRow}>
              <span style={{ ...s.bulletDot, background: "#F87171" }} />
              <span style={{ ...s.bulletText, color: "#aaa" }}>{item}</span>
            </div>
          ))}
        </Section>

        {/* ── Famous Fights ── */}
        <Section title={t("fighterFamousFights")} emoji="🎬" accent="#D4AF37">
          {fighter.famousFights.map((f, i) => (
            <div key={i} style={s.fightCard}>
              <div style={s.fightTop}>
                <span style={s.fightName}>{f.fight}</span>
                <span style={s.fightYear}>{f.year}</span>
              </div>
              <p style={s.fightNote}>{f.note}</p>
            </div>
          ))}
        </Section>

        {/* ── Related tags ── */}
        <div style={s.tagsSection}>
          <p style={s.tagsLabel}>Study tags</p>
          <div style={s.tagsRow}>
            {fighter.relatedKeywords.map((kw) => (
              <span key={kw} style={s.tagChip}>{kw}</span>
            ))}
          </div>
        </div>

        {/* ── Back to all fighters ── */}
        <button
          style={s.allFightersBtn}
          onClick={() => router.push(`/${locale}/fighters`)}
        >
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
    background: "#080808",
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    paddingBottom: 100,
  },

  // ── Hero ──
  hero: {
    position: "relative",
    padding: "calc(36px + env(safe-area-inset-top)) 20px 0",
    overflow: "hidden",
  },
  heroLine: {
    height: 2,
    marginTop: 20,
    borderRadius: 1,
    opacity: 0.5,
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
    marginBottom: 20,
  },
  heroContent: {
    textAlign: "left",
  },
  heroFlag: {
    fontSize: 36,
    lineHeight: 1,
    display: "block",
    marginBottom: 8,
  },
  heroName: {
    margin: 0,
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: -1,
    lineHeight: 1.05,
  },
  heroNickname: {
    margin: "4px 0 12px",
    color: "#888",
    fontSize: 15,
    fontStyle: "italic",
  },
  heroPills: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  heroPill: {
    border: "1px solid",
    borderRadius: 20,
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  heroIdentity: {
    margin: 0,
    fontSize: 14,
    color: "#bbb",
    lineHeight: 1.5,
    maxWidth: 380,
  },

  // ── Content ──
  content: {
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  // ── Section ──
  section: {
    background: "#111",
    border: "1px solid",
    borderRadius: 14,
    padding: "14px 16px",
  },
  sectionTitle: {
    margin: "0 0 12px",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // ── Bullets ──
  bulletRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    marginTop: 6,
    flexShrink: 0,
  },
  bulletNum: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    color: "#888",
    fontSize: 10,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  bulletText: {
    fontSize: 14,
    color: "#ddd",
    lineHeight: 1.45,
  },

  // ── Combos ──
  comboCard: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: "10px 12px",
    marginBottom: 8,
  },
  comboName: {
    margin: "0 0 8px",
    fontSize: 12,
    fontWeight: 700,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  comboSteps: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    alignItems: "center",
  },
  comboStepWrap: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  comboStep: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    padding: "3px 8px",
    fontSize: 12,
    fontWeight: 600,
    color: "#eee",
  },
  comboArrow: {
    color: "#555",
    fontSize: 12,
  },

  // ── Movement DNA ──
  moveDNABox: {
    border: "1px solid",
    borderRadius: 12,
    padding: "14px",
  },
  moveDNAType: {
    margin: "0 0 6px",
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: -0.3,
  },
  moveDNADesc: {
    margin: "0 0 10px",
    fontSize: 13,
    color: "#bbb",
    lineHeight: 1.5,
  },
  moveDNATags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  moveDNATag: {
    border: "1px solid",
    borderRadius: 20,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "lowercase",
  },

  // ── Drills ──
  drillRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
    padding: "8px 10px",
    background: "rgba(16,185,129,0.06)",
    borderRadius: 8,
  },
  drillIndex: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "rgba(16,185,129,0.2)",
    color: "#10B981",
    fontSize: 10,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  drillText: {
    fontSize: 13,
    color: "#ccc",
    lineHeight: 1.45,
  },

  // ── Fights ──
  fightCard: {
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  fightTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 4,
  },
  fightName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#fff",
  },
  fightYear: {
    fontSize: 11,
    color: "#666",
  },
  fightNote: {
    margin: 0,
    fontSize: 12,
    color: "#999",
    lineHeight: 1.4,
  },

  // ── Tags ──
  tagsSection: {
    marginTop: 4,
  },
  tagsLabel: {
    margin: "0 0 8px",
    fontSize: 11,
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tagsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  tagChip: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: "3px 10px",
    fontSize: 11,
    color: "#888",
  },

  // ── Footer btn ──
  allFightersBtn: {
    width: "100%",
    padding: "14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "#888",
    fontSize: 13,
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
    gap: 8,
  },
  backBtn: {
    marginTop: 16,
    padding: "10px 20px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20,
    color: "#aaa",
    fontSize: 13,
    cursor: "pointer",
  },
};
