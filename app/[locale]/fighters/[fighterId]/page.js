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
import FighterPortrait from "@/components/FighterPortrait";
import { RED, GOLD } from "@/lib/tokens";
import s from "@/components/fighters/fighterStyles";

// ─── Style identity pill icons (cycles by index) ──────────────────────────────
const PILL_ICONS = ["⚡", "🛡️", "🥊", "💪", "👊", "🎯", "🔥", "⚔️"];

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
    <div style={{ ...s.page, background: `radial-gradient(ellipse at top center, ${acc}12 0%, transparent 40%), #0B0B0C` }} className="page-enter">

      {/* ══════════ HERO ══════════ */}
      <div style={s.hero} className="hero-enter">
        {/* Portrait — dominant visual (full width, tall) */}
        <div style={s.heroPortraitWrap}>
          <FighterPortrait
            fighterId={fighter.id}
            fighter={fighter}
            height={260}
            flagSize={80}
            showName={false}
            showLabel={false}
          />
          {/* Overlay gradient — fades to page bg at bottom */}
          <div style={{ ...s.heroPortraitFade, background: `linear-gradient(to bottom, transparent 40%, ${acc}08 65%, #0B0B0C 100%)` }} />
          {/* Back button — floats over portrait */}
          <button style={s.backPill} onClick={() => router.back()}>← {t("back")}</button>
          {/* Top accent bar */}
          <div style={{ ...s.heroTopBar, background: `linear-gradient(90deg, ${acc} 0%, ${acc}66 60%, transparent 100%)` }} />
        </div>

        {/* Text block below portrait */}
        <div style={s.heroCenter}>
          <p style={s.heroKicker}>COMBAT · FIGHTER</p>
          <h1 style={{ ...s.heroNameBig, textShadow: `0 0 40px ${acc}44` }}>
            {fighter.name.toUpperCase()}
          </h1>
          <p style={s.heroNickname}>&ldquo;{fighter.nickname}&rdquo;</p>
          <div style={s.heroMeta}>
            <span style={{ ...s.heroStyleBadge, background: acc + "1e", color: acc, borderColor: acc + "40" }}>
              {fighter.style}
            </span>
            <span style={s.heroWeightClass}>{fighter.weightClass}</span>
          </div>
        </div>

        {/* Identity line */}
        <p style={s.heroIdentity}>{identity}</p>

        {/* Key weapon */}
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
              <span
                key={i}
                className="fighter-style-pill"
                style={{
                  ...s.stylePill,
                  borderColor: acc + "35",
                  boxShadow: `0 0 0 1px ${acc}10 inset`,
                }}
              >
                <span style={{ ...s.pillIcon }}>{PILL_ICONS[i % PILL_ICONS.length]}</span>
                <span style={{ fontSize: 12, color: "#ddd", lineHeight: 1.4 }}>{item}</span>
              </span>
            ))}
          </div>
        </Section>

        {/* ── Signature Combos ── */}
        <Section title={t("fighterSignatureCombos")} emoji="💥" accent={acc} defaultOpen>
          {combos.map((combo, i) => (
            <div key={i} style={s.comboCard} className="fighter-combo-card">
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
        <Section title={t("fighterHabits")} emoji="🔄" accent={GOLD}>
          {habits.map((item, i) => (
            <div key={i} style={s.dotRow}>
              <span style={{ ...s.dotMark, background: GOLD }} />
              <span style={s.rowText}>{item}</span>
            </div>
          ))}
        </Section>

        {/* ── Drills ── */}
        <Section title={t("fighterDrills")} emoji="🏋️" accent="#10B981">
          {drills.map((drill, i) => (
            <div key={i} style={s.drillRow} className="fighter-drill-row">
              <span style={s.drillNum}>{i + 1}</span>
              <span style={s.drillText}>{drill}</span>
            </div>
          ))}
        </Section>

        {/* ── Weaknesses ── */}
        <Section title={t("fighterWeaknesses")} emoji="⚠️" accent="#F87171">
          <div style={{
            background: "rgba(248,113,113,0.04)",
            backgroundImage: "repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(248,113,113,0.03) 5px, rgba(248,113,113,0.03) 10px)",
            border: "1px solid rgba(248,113,113,0.18)",
            borderLeft: "3px solid rgba(248,113,113,0.55)",
            borderRadius: "3px 12px 12px 3px",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 9,
          }}>
            {weaknesses.map((item, i) => (
              <div key={i} style={{ ...s.dotRow, marginBottom: 0 }}>
                <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1, opacity: 0.8 }}>⚠️</span>
                <span style={{ ...s.rowText, color: "#c8a0a0", fontStyle: "italic" }}>{item}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Famous Fights ── */}
        <Section title={t("fighterFamousFights")} emoji="🎬" accent={GOLD}>
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

