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
          <div style={{ ...s.heroPortraitFade, background: `linear-gradient(to bottom, transparent 40%, ${acc}08 65%, #080808 100%)` }} />
          {/* Back button — floats over portrait */}
          <button style={s.backPill} onClick={() => router.back()}>← {t("back")}</button>
          {/* Top accent bar */}
          <div style={{ ...s.heroTopBar, background: `linear-gradient(90deg, ${acc} 0%, ${acc}66 60%, transparent 100%)` }} />
        </div>

        {/* Text block below portrait */}
        <div style={s.heroCenter}>
          <p style={s.heroKicker}>GAVANA · FIGHTER STUDY</p>
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

