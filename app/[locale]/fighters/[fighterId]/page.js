"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getLocale, translate } from "@/lib/i18n";
import { getFighter } from "@/lib/fighters";
import {
  getLocalizedField,
  getLocalizedCombos,
} from "@/lib/fighters.i18n";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { computeFighterCompatibility } from "@/lib/fighterDNA";
import s from "@/components/fighters/fighterStyles";
import { FIGHTER_TECHNIQUES } from "@/lib/fighterTechniques";
import { buildCoachSnapshot } from "@/lib/buildCoachContext";
import { getPersonalConnection } from "@/lib/fighterPersonalConnection";
import { getFighterAcademy } from "@/lib/fighterAcademy";
import FighterAcademyPanel from "@/components/fighters/FighterAcademyPanel";

// Sub-components
import FighterHero from "@/components/fighters/FighterHero";
import FighterSection from "@/components/fighters/FighterSection";
import FighterComboTrainer from "@/components/fighters/FighterComboTrainer";
import FighterTrainCTA from "@/components/fighters/FighterTrainCTA";
import FighterDNACompatibility from "@/components/fighters/FighterDNACompatibility";
import FighterExperimentCTA from "@/components/fighters/FighterExperimentCTA";
import FighterPersonalConnection from "@/components/fighters/FighterPersonalConnection";
import FighterStyleIdentitySection from "@/components/fighters/FighterStyleIdentitySection";
import FighterTechniqueSection from "@/components/fighters/FighterTechniqueSection";
import FighterMovementDNASection from "@/components/fighters/FighterMovementDNASection";
import FighterStudySection from "@/components/fighters/FighterStudySection";
import FighterDrillsSection from "@/components/fighters/FighterDrillsSection";
import FighterWeaknessesSection from "@/components/fighters/FighterWeaknessesSection";
import { SI } from "@/components/fighters/FighterIcons";

export default function FighterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const fighter = getFighter(params?.fighterId);

  const [personalConnection, setPersonalConnection] = useState(null);
  const [studied, setStudied] = useState(false);
  const [currentExperiment, setCurrentExperiment] = useState(null);
  const [settingExperiment, setSettingExperiment] = useState(false);
  const [userDNA, setUserDNA] = useState(null);

  // Mark fighter as studied + load currentExperiment + userDNA from Firestore
  useEffect(() => {
    if (!user?.uid || !fighter?.id) return;
    (async () => {
      try {
        const { doc, setDoc, getDoc, arrayUnion } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setCurrentExperiment(data.currentExperiment || null);
          if (data.fighterDNA && !data.fighterDNA.building) setUserDNA(data.fighterDNA);
        }
        await setDoc(userRef, { studiedFighters: arrayUnion(fighter.id) }, { merge: true });
        setStudied(true);
      } catch { /* silent */ }
    })();
  }, [user?.uid, fighter?.id]);

  async function handleSetExperiment() {
    if (!user?.uid || settingExperiment) return;
    setSettingExperiment(true);
    try {
      const { doc, setDoc, serverTimestamp, collection, getDocs, query, where } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const { computePunchPattern } = await import("@/lib/movementInsight");

      // Capture baseline punch pattern from most recent session with punchBreakdown
      let baselinePunchPct = null;
      const sessSnap = await getDocs(query(collection(db, "training_sessions"), where("userId", "==", user.uid)));
      const sorted = sessSnap.docs
        .map((d) => ({ ...d.data() }))
        .filter((d) => d.type === "training" && d.poseMetrics?.punchBreakdown)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      if (sorted.length > 0) {
        const pattern = computePunchPattern(sorted[0].poseMetrics.punchBreakdown);
        if (pattern) baselinePunchPct = { jabPct: pattern.jabPct, crossPct: pattern.crossPct, hookPct: pattern.hookPct };
      }

      const experiment = {
        fighterId: fighter.id,
        fighterName: fighter.name,
        fighterAccent: fighter.accent,
        startDate: serverTimestamp(),
        baselinePunchPct,
      };
      await setDoc(doc(db, "users", user.uid), { currentExperiment: experiment }, { merge: true });
      setCurrentExperiment({ ...experiment, startDate: { seconds: Math.floor(Date.now() / 1000) } });
    } catch { /* silent */ }
    setSettingExperiment(false);
  }

  async function handleStopExperiment() {
    if (!user?.uid) return;
    try {
      const { doc, updateDoc, deleteField } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await updateDoc(doc(db, "users", user.uid), { currentExperiment: deleteField() });
      setCurrentExperiment(null);
    } catch { /* silent */ }
  }

  // Build personal connection from training history
  useEffect(() => {
    if (!user?.uid || !fighter) return;
    let active = true;
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
        <BottomNav router={router} user={user} currentLocale={locale} activeTab="fighters" />
      </div>
    );
  }

  const acc = fighter.accent;

  // Localized content
  const identity      = getLocalizedField(fighter, "identity", locale);
  const styleIdentity = getLocalizedField(fighter, "styleIdentity", locale);
  const moveDNADesc   = getLocalizedField(fighter, "movementDNA", locale, "description");
  const whatToStudy   = getLocalizedField(fighter, "whatToStudy", locale);
  const habits        = getLocalizedField(fighter, "habitsToMimick", locale);
  const drills        = getLocalizedField(fighter, "drills", locale);
  const weaknesses    = getLocalizedField(fighter, "weaknesses", locale);
  const combos        = getLocalizedCombos(fighter, locale);

  // Academy
  const academy = getFighterAcademy(fighter.id);
  const academyTitle =
    locale === "mn" ? "Академийн гарын авлага" :
    locale === "ko" ? "아카데미 가이드" :
    "Academy Guide";

  // Technique CTA — first lesson slug
  const techniques = FIGHTER_TECHNIQUES[fighter.id] || [];
  const firstLessonSlug = techniques.length > 0
    ? techniques[0].title.toLowerCase().replace(/\s+/g, "-")
    : null;

  return (
    <div style={{ ...s.page, background: `radial-gradient(ellipse at top center, ${acc}12 0%, transparent 40%), #0B0B0C` }} className="page-enter">

      {/* ══════════ HERO ══════════ */}
      <FighterHero
        fighter={fighter}
        locale={locale}
        studied={studied}
        identity={identity}
        onBack={() => router.back()}
      />

      {/* ══════════ CONTENT ══════════ */}
      <div style={s.content}>

        {/* ── Train This Style CTA ── */}
        {firstLessonSlug && (
          <FighterTrainCTA
            fighter={fighter}
            locale={locale}
            firstLessonSlug={firstLessonSlug}
            onPress={() => router.push(`/${locale}/train?fighter=${fighter.id}&lesson=${encodeURIComponent(firstLessonSlug)}`)}
          />
        )}

        {/* ── DNA Compatibility Score ── */}
        <FighterDNACompatibility
          fighter={fighter}
          userDNA={userDNA}
          locale={locale}
        />

        {/* ── Try This Style Experiment ── */}
        {user && (
          <FighterExperimentCTA
            fighter={fighter}
            locale={locale}
            currentExperiment={currentExperiment}
            settingExperiment={settingExperiment}
            onStart={handleSetExperiment}
            onStop={handleStopExperiment}
          />
        )}

        {/* ── Personal Connection panel ── */}
        <FighterPersonalConnection
          fighter={fighter}
          personalConnection={personalConnection}
          locale={locale}
          accent={acc}
        />

        {/* ── Style Identity ── */}
        <FighterSection title={t("fighterStyleIdentity")} icon={SI.target} accent={acc} defaultOpen>
          <FighterStyleIdentitySection styleIdentity={styleIdentity} accent={acc} />
        </FighterSection>

        {/* ── Signature Combos ── */}
        <FighterSection title={t("fighterSignatureCombos")} icon={SI.combos} accent={acc} defaultOpen>
          {combos.map((combo, i) => (
            <FighterComboTrainer key={i} combo={combo} acc={acc} locale={locale} />
          ))}
        </FighterSection>

        {/* ── Technique Lessons ── */}
        {techniques.length > 0 && (
          <FighterSection title={t("fighterTechniqueLesson")} icon={SI.lessons} accent={acc} defaultOpen>
            <FighterTechniqueSection
              lessons={techniques}
              locale={locale}
              accent={acc}
              router={router}
              fighterId={fighter.id}
            />
          </FighterSection>
        )}

        {/* ── Fighter Academy ── */}
        {academy && (
          <FighterSection title={academyTitle} icon={SI.academy} accent={acc} defaultOpen>
            <FighterAcademyPanel academy={academy} fighterId={fighter.id} locale={locale} />
          </FighterSection>
        )}

        {/* ── Movement DNA ── */}
        <FighterSection title={t("fighterMovementDNA")} icon={SI.dna} accent={acc} defaultOpen>
          <FighterMovementDNASection
            fighter={fighter}
            locale={locale}
            accent={acc}
            moveDNADesc={moveDNADesc}
          />
        </FighterSection>

        {/* ── What to Study + Habits ── */}
        <FighterSection title={t("fighterWhatToStudy")} icon={SI.study} accent={acc}>
          <FighterStudySection
            whatToStudy={whatToStudy}
            habits={habits}
            locale={locale}
            accent={acc}
          />
        </FighterSection>

        {/* ── Drills ── */}
        <FighterSection title={t("fighterDrills")} icon={SI.drills} accent="#10B981">
          <FighterDrillsSection drills={drills} />
        </FighterSection>

        {/* ── Weaknesses ── */}
        <FighterSection title={t("fighterWeaknesses")} icon={SI.warn} accent="#F87171">
          <FighterWeaknessesSection weaknesses={weaknesses} />
        </FighterSection>

        {/* ── Back to all ── */}
        <button style={s.allBtn} onClick={() => router.push(`/${locale}/fighters`)}>
          ← {t("fighterBackToAll")}
        </button>

      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="fighters" />
    </div>
  );
}
