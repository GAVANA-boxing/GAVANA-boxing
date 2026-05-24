"use client";

import { useState, useEffect } from "react";
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
import TechniqueLessonCard from "@/components/fighters/TechniqueLessonCard";
import { FIGHTER_TECHNIQUES } from "@/lib/fighterTechniques";
import { buildCoachSnapshot } from "@/lib/buildCoachContext";
import { getPersonalConnection } from "@/lib/fighterPersonalConnection";

// ─── Style identity pill icons — SVG line icons cycle by index ────────────────
const PILL_SVGS = [
  <svg key="zap" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  <svg key="shield" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  <svg key="activity" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  <svg key="trending" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  <svg key="arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  <svg key="crosshair" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>,
  <svg key="refresh" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  <svg key="maximize" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
];

// ─── Section SVG icons ────────────────────────────────────────────────────────
const SI = {
  target:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>,
  combos:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  dna:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  study:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  habits:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  drills:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,
  warn:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  award:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  lessons:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
};

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
function Section({ title, icon, accent, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ ...s.section, borderLeftColor: open ? accent : "rgba(255,255,255,0.08)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={s.sectionBtn}
      >
        <span style={{ ...s.sectionTitle, color: open ? accent : "#888", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: open ? accent : "#555", display: "flex", alignItems: "center", flexShrink: 0 }}>
            {icon}
          </span>
          {title}
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

  const [personalConnection, setPersonalConnection] = useState(null);
  const [studied, setStudied] = useState(false);

  // Mark fighter as studied in Firestore
  useEffect(() => {
    if (!user?.uid || !fighter?.id) return;
    (async () => {
      try {
        const { doc, setDoc, arrayUnion } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        await setDoc(doc(db, "users", user.uid), { studiedFighters: arrayUnion(fighter.id) }, { merge: true });
        setStudied(true);
      } catch { /* silent */ }
    })();
  }, [user?.uid, fighter?.id]);
    (async () => {
      try {
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snap = await getDocs(query(
          collection(db, "training_sessions"),
          where("userId", "==", user.uid)
        ));
        if (!active) return;
        const sessions = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => d.type === "training" && d.score != null)
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        const snapshot = buildCoachSnapshot({ sessions, profileData: {} });
        setPersonalConnection(getPersonalConnection(snapshot, fighter));
      } catch { /* silent */ }
    })();
    return () => { active = false; };
  }, [user?.uid, fighter?.id]);

  if (!fighter) {
    return (
      <div style={s.page}>
        <div style={s.notFound}>
          <span style={{ fontSize: 48 }}>🥊</span>
          <p style={{ color: "#aaa", marginTop: 12, fontSize: 14 }}>{t("fighterNotFound")}</p>
          <button style={s.backBtn} onClick={() => router.back()}>← {t("back")}</button>
        </div>
        <BottomNav router={router} user={user} currentLocale={locale} activeTab="home" />
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
          {/* Studied badge */}
          {studied && (
            <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.4)", backdropFilter: "blur(8px)" }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span style={{ fontSize: 9.5, fontWeight: 900, color: "#34D399", letterSpacing: 0.8 }}>
                {locale === "mn" ? "Судалсан" : "Studied"}
              </span>
            </div>
          )}
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
          <svg width="11" height="14" viewBox="0 0 13 16" fill={acc} style={{ flexShrink: 0, opacity: 0.8 }}>
            <path d="M7 0L0 9h6l-1 7 7-9H6L7 0z"/>
          </svg>
          <span style={{ ...s.heroWeaponText, color: acc }}>{fighter.keyWeapon}</span>
        </div>

        {/* Bottom accent line */}
        <div style={{ ...s.heroAccentLine, background: `linear-gradient(90deg, ${acc} 0%, ${acc}55 50%, transparent 100%)` }} />
      </div>

      {/* ══════════ CONTENT ══════════ */}
      <div style={s.content}>

        {/* ── Personal Connection panel ── */}
        {personalConnection && (
          <div style={{
            marginBottom: 16,
            padding: "14px 16px",
            borderRadius: 14,
            background: `linear-gradient(135deg, ${acc}0a 0%, rgba(0,0,0,0) 100%)`,
            border: `1px solid ${acc}30`,
            borderLeft: `3px solid ${acc}`,
          }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 8 }}>
              {personalConnection.isDirectlyRelevant ? "Your Focus" : "What to learn"}
            </div>

            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.4 }}>
              {personalConnection.isDirectlyRelevant
                ? `Your ${personalConnection.primaryFocus} is ${personalConnection.primaryValue?.toFixed(1)} — ${fighter.name} is one of the best at this.`
                : `${fighter.name} excels at ${personalConnection.teaches.slice(0, 2).join(" & ")}.`}
            </p>

            {(personalConnection.focusStudy.length > 0 || personalConnection.focusDrills.length > 0) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {personalConnection.focusStudy.map((item, i) => (
                  <div key={`s${i}`} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: acc, fontSize: 10, flexShrink: 0, marginTop: 2 }}>→</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
                {personalConnection.focusDrills.map((item, i) => (
                  <div key={`d${i}`} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: GOLD, fontSize: 10, flexShrink: 0, marginTop: 2 }}>▸</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {personalConnection.relevantWeak.length > 1 && (
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {personalConnection.relevantWeak.map((area) => (
                  <span key={area} style={{
                    fontSize: 9, fontWeight: 800, padding: "2px 8px",
                    borderRadius: 999, background: `${acc}14`,
                    border: `1px solid ${acc}30`, color: acc,
                  }}>
                    {area} {personalConnection.teaches.includes(area) ? "↑" : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Style Identity ── */}
        <Section title={t("fighterStyleIdentity")} icon={SI.target} accent={acc} defaultOpen>
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
                <span style={{ color: acc, display: "flex", alignItems: "center", lineHeight: 1 }}>
                  {PILL_SVGS[i % PILL_SVGS.length]}
                </span>
                <span style={{ fontSize: 12, color: "#ddd", lineHeight: 1.4 }}>{item}</span>
              </span>
            ))}
          </div>
        </Section>

        {/* ── Signature Combos ── */}
        <Section title={t("fighterSignatureCombos")} icon={SI.combos} accent={acc} defaultOpen>
          {combos.map((combo, i) => (
            <div key={i} style={s.comboCard} className="fighter-combo-card">
              <p style={{ ...s.comboName, color: acc }}>{combo.name}</p>
              <ComboSteps steps={combo.steps} />
            </div>
          ))}
        </Section>

        {/* ── Technique Lessons ── */}
        {FIGHTER_TECHNIQUES[fighter.id]?.length > 0 && (
          <Section title={t("fighterTechniqueLesson")} icon={SI.lessons} accent={acc} defaultOpen>
            {FIGHTER_TECHNIQUES[fighter.id].map((lesson, i) => (
              <TechniqueLessonCard
                key={i}
                index={i + 1}
                title={lesson.title}
                difficulty={lesson.difficulty}
                teachingBlocks={lesson.teachingBlocks}
                explanation={lesson.explanation}
                bodyCue={lesson.bodyCue}
                commonMistake={lesson.commonMistake}
                coachNotes={lesson.coachNotes}
                drillSteps={lesson.drillSteps}
                accent={acc}
                defaultOpen={i === 0}
                locale={locale}
                fighterId={fighter.id}
                router={router}
              />
            ))}
          </Section>
        )}

        {/* ── Movement DNA ── */}
        <Section title={t("fighterMovementDNA")} icon={SI.dna} accent={acc}>
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
        <Section title={t("fighterWhatToStudy")} icon={SI.study} accent={acc}>
          {whatToStudy.map((item, i) => (
            <div key={i} style={s.numRow}>
              <span style={{ ...s.numBadge, background: acc + "22", color: acc }}>{i + 1}</span>
              <span style={s.rowText}>{item}</span>
            </div>
          ))}
        </Section>

        {/* ── Habits to Copy ── */}
        <Section title={t("fighterHabits")} icon={SI.habits} accent={GOLD}>
          {habits.map((item, i) => (
            <div key={i} style={s.dotRow}>
              <span style={{ ...s.dotMark, background: GOLD }} />
              <span style={s.rowText}>{item}</span>
            </div>
          ))}
        </Section>

        {/* ── Drills ── */}
        <Section title={t("fighterDrills")} icon={SI.drills} accent="#10B981">
          {drills.map((drill, i) => (
            <div key={i} style={s.drillRow} className="fighter-drill-row">
              <span style={s.drillNum}>{i + 1}</span>
              <span style={s.drillText}>{drill}</span>
            </div>
          ))}
        </Section>

        {/* ── Weaknesses ── */}
        <Section title={t("fighterWeaknesses")} icon={SI.warn} accent="#F87171">
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
        <Section title={t("fighterFamousFights")} icon={SI.award} accent={GOLD}>
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

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="home" />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

