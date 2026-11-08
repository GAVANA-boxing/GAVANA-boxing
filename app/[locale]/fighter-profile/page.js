"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useUserProfile } from "@/context/UserProfileProvider";
import { getLocaleFromPathname } from "@/lib/i18n";
import { useCombatMemory } from "@/hooks/useCombatMemory";
import BottomNav from "@/components/BottomNav";
import BrandHeader from "@/components/ui/BrandHeader";
import { glass, pageBackground } from "@/components/ui/brand";
import CombatMemoryPanel from "@/components/profile/CombatMemoryPanel";
import FighterDNACard from "@/components/profile/FighterDNACard";
import { RED, GOLD, RADIUS, goldAlpha, whiteAlpha, BG, redAlpha } from "@/lib/tokens";
import { computeMovementProfile } from "@/lib/combatMemory";
import { deriveCombatIdentity } from "@/lib/combatIdentity";
import { computeFighterDNA, dnaSnapshot, computePreliminarySignals } from "@/lib/fighterDNA";
import { computeCombatProgress, progressSnapshot } from "@/lib/combatProgress";
import CombatProgressCard from "@/components/profile/CombatProgressCard";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";

import CombatIdentitySection from "@/components/fighter-profile/CombatIdentitySection";
import FighterPassportCard from "@/components/fighter-profile/FighterPassportCard";
import DNAShareCard from "@/components/fighter-profile/DNAShareCard";
import IdentityJourneyStrip from "@/components/fighter-profile/IdentityJourneyStrip";
import FighterDNACompareCard from "@/components/fighter-profile/FighterDNACompareCard";
import TrainingPrescriptionCard from "@/components/fighter-profile/TrainingPrescriptionCard";
import DNANextStepsCard from "@/components/fighter-profile/DNANextStepsCard";
import ProUpgradePanel from "@/components/fighter-profile/ProUpgradePanel";
import WeeklyReportCard from "@/components/fighter-profile/WeeklyReportCard";
import StudiedFightersPanel from "@/components/fighter-profile/StudiedFightersPanel";
import TribeCard from "@/components/fighter-profile/TribeCard";
import TribeActivityFeed from "@/components/fighter-profile/TribeActivityFeed";
import DNARevealOverlay from "@/components/fighter-profile/DNARevealOverlay";
import DNAEvolutionCard from "@/components/fighter-profile/DNAEvolutionCard";
import DNATimelineCard from "@/components/fighter-profile/DNATimelineCard";
import EvolutionRevealPanel from "@/components/fighter-profile/EvolutionRevealPanel";
import ProGate from "@/components/fighter-profile/ProGate";
import { showRoute } from "@/lib/coreRoutes";

// ─── Shared locale strings used by the page shell ────────────────────────────
const FP = {
  en: {
    back:            "Back",
    kicker:          "Fighter Intelligence",
    sessions:        "Sessions",
    avgScore:        "Avg Score",
    bestScore:       "Best Score",
    noSessions:      "Train to build your fighter identity.",
    earlyRead:       "Movement Identity · Early Read",
    earlyReadHint:   "Train more sessions to improve confidence.",
    identityEyebrow: "Movement identity",
    signalConf:      "Signal confidence",
    evolutionTitle:    "Movement profile · Evolution tracking",
    profileCompletion: "Profile completion",
  },
  mn: {
    back:            "Буцах",
    kicker:          "Тулаанчийн тагнуул",
    sessions:        "Тренинг",
    avgScore:        "Дундаж оноо",
    bestScore:       "Шилдэг оноо",
    noSessions:      "Тулаанчийн мөн чанараа бүрдүүлэхийн тулд бэлтгэл хий.",
    earlyRead:       "Хөдөлгөөний таних — эрт унших",
    earlyReadHint:   "Найдвартай байдлаа сайжруулахын тулд илүү session хий.",
    identityEyebrow: "Хөдөлгөөн дээр суурилсан мөн чанар",
    signalConf:      "Дохионы найдвартай байдал",
    evolutionTitle:    "Хөдөлгөөний профайл · Хөгжлийн хяналт",
    profileCompletion: "Профайл бөглөлт",
  },
  ko: {
    back:            "뒤로",
    kicker:          "파이터 인텔리전스",
    sessions:        "세션",
    avgScore:        "평균 점수",
    bestScore:       "최고 점수",
    noSessions:      "파이터 정체성을 구축하려면 훈련하세요.",
    earlyRead:       "움직임 정체성 · 초기 분석",
    earlyReadHint:   "신뢰도 향상을 위해 더 많은 세션을 훈련하세요.",
    identityEyebrow: "움직임 기반 정체성",
    signalConf:      "신호 신뢰도",
    evolutionTitle:    "움직임 프로필 · 진화 추적",
    profileCompletion: "프로필 완성도",
  },
};

// ─── Shared DNA freshness locale strings (used inline in page) ────────────────
const FRESH_L = {
  en: {
    weak:    { label: "Signal Weakening",  hint: (n) => `${n} days without training. Your DNA signal is fading.` },
    degrade: { label: "Signal Degrading",  hint: (n) => `${n} days without training. DNA confidence is dropping.` },
    lost:    { label: "Signal Lost",       hint: (n) => `${n} days without training. Train to restore your signal.` },
    cta: "Train Now →",
  },
  mn: {
    weak:    { label: "Дохио суларч байна",  hint: (n) => `${n} хоног дасгал хийгээгүй. ДНХ дохио бүдгэрч байна.` },
    degrade: { label: "Дохио буурч байна",   hint: (n) => `${n} хоног дасгал хийгээгүй. ДНХ найдвартай байдал буурч байна.` },
    lost:    { label: "Дохио алдагдлаа",     hint: (n) => `${n} хоног дасгал хийгээгүй. Сэргээхийн тулд дасгал хий.` },
    cta: "Одоо дасгал хий →",
  },
  ko: {
    weak:    { label: "신호 약화 중",  hint: (n) => `${n}일 동안 훈련하지 않았습니다. DNA 신호가 희미해지고 있습니다.` },
    degrade: { label: "신호 저하 중",  hint: (n) => `${n}일 동안 훈련하지 않았습니다. DNA 신뢰도가 떨어지고 있습니다.` },
    lost:    { label: "신호 손실",     hint: (n) => `${n}일 동안 훈련하지 않았습니다. 신호를 복구하려면 훈련하세요.` },
    cta: "지금 훈련하기 →",
  },
};

// ─── Inline StatCell (only used inside the page header stat row) ──────────────
function StatCell({ value, label, accent }) {
  return (
    <div style={{ flex: 1, textAlign: "center", padding: "10px 8px", borderRadius: RADIUS.md, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.06)}` }}>
      <div style={{
        fontSize: 20, fontWeight: 1000, lineHeight: 1, marginBottom: 4,
        color: accent || "#fff",
        fontFamily: "var(--font-display, 'Anton', sans-serif)",
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.55), textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

export default function FighterProfilePage() {
  const router   = useRouter();
  const pathname = usePathname();
  const locale   = getLocaleFromPathname(pathname);
  const { user, loading: authLoading } = useAuth();
  const { profile: userProfile, loading: profileLoading } = useUserProfile();
  const { sessions, tendency, trends, loading } = useCombatMemory({ user });
  const profile  = computeMovementProfile(sessions);
  const identity = profile ? deriveCombatIdentity(profile, sessions) : null;
  const dna      = computeFighterDNA({ sessions, locale });
  const dnaSavedRef       = useRef(false);
  const progressSavedRef  = useRef(false);
  const [currentExperiment, setCurrentExperiment] = useState(null);
  const [studiedFighterIds, setStudiedFighterIds] = useState([]);
  const [tribeCount, setTribeCount] = useState(null);
  const [allTribeCounts, setAllTribeCounts] = useState(null);
  const [dnaRevealVisible, setDnaRevealVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("dna");
  const [userTier, setUserTier] = useState(null);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const [userData, setUserData] = useState(null);
  const dnaRevealShownRef = useRef(false);
  const [milestonesUnlocked, setMilestonesUnlocked] = useState({ m8: false, m15: false });

  // Combat Level derives from the canonical account XP (same number as belts/rank)
  // so the profile shows one coherent ladder; falls back to a session estimate
  // until the user doc (with xp) has loaded.
  const progress = computeCombatProgress({ sessions, streakDays: 0, locale, xp: userData?.xp });

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") === "1") {
      setSubscribeSuccess(true);
      // Clean the URL
      const url = new URL(window.location.href);
      url.searchParams.delete("subscribed");
      window.history.replaceState({}, "", url.toString());
      const timer = setTimeout(() => setSubscribeSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Load currentExperiment + tribe count + milestone badges
  useEffect(() => {
    if (!user?.uid) return;
    if (profileLoading) return;
    let active = true;
    (async () => {
      try {
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const data = userProfile || {};
        if (active) {
          setCurrentExperiment(data.currentExperiment || null);
          setStudiedFighterIds(data.studiedFighters || []);
          setUserTier(data.subscriptionTier || data.tier || null);
          setUserData(data);
          setMilestonesUnlocked({
            m8:  !!data.milestoneUnlocked8,
            m15: !!data.milestoneUnlocked15,
          });
        }
        // Tribe counts — query all 5 archetypes in parallel
        const ARCH_KEYS = ["pressure", "outboxer", "counter", "explosive", "technician"];
        const archSnaps = await Promise.all(
          ARCH_KEYS.map((arch) =>
            getDocs(query(collection(db, "users"), where("fighterDNA.archetypeKey", "==", arch)))
          )
        );
        if (active) {
          const counts = {};
          ARCH_KEYS.forEach((arch, i) => { counts[arch] = archSnaps[i].size; });
          setAllTribeCounts(counts);
          if (!dna.building && dna.archetypeKey) {
            setTribeCount(counts[dna.archetypeKey] ?? 0);
          }
        }
      } catch { /* silent */ }
    })();
    return () => { active = false; };
  }, [user?.uid, dna.archetypeKey, dna.building, userProfile, profileLoading]);

  async function clearExperiment() {
    if (!user?.uid) return;
    try {
      const { doc, updateDoc, deleteField } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await updateDoc(doc(db, "users", user.uid), { currentExperiment: deleteField() });
      setCurrentExperiment(null);
    } catch { /* silent */ }
  }

  // DNA Reveal Ceremony — show once, first time archetype confirms
  useEffect(() => {
    if (loading || !user?.uid || dna.building) return;
    if (dnaRevealShownRef.current) return;
    dnaRevealShownRef.current = true;
    const key = `gavana_dna_reveal_${user.uid}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      setDnaRevealVisible(true);
    }
  }, [loading, dna.building, user?.uid]);

  // Persist DNA to Firestore once per page load after sessions settle
  useEffect(() => {
    if (loading || dnaSavedRef.current || !user?.uid || dna.building) return;
    dnaSavedRef.current = true;
    const snap = dnaSnapshot(dna);
    if (!snap) return;
    (async () => {
      try {
        const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        await setDoc(doc(db, "users", user.uid), { fighterDNA: snap, fighterDnaUpdatedAt: serverTimestamp() }, { merge: true });
      } catch { /* non-critical */ }
    })();
  }, [loading, user?.uid, dna.building]);

  // Persist combat progress to Firestore once per page load
  useEffect(() => {
    if (loading || progressSavedRef.current || !user?.uid || progress.building) return;
    progressSavedRef.current = true;
    const snap = progressSnapshot(progress);
    if (!snap) return;
    (async () => {
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        await setDoc(doc(db, "users", user.uid), { combatProgress: snap }, { merge: true });
      } catch { /* non-critical */ }
    })();
  }, [loading, user?.uid, progress.building]);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
        <div style={{ width: 24, height: 24, border: `2px solid ${whiteAlpha(0.07)}`, borderTopColor: RED, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }
  if (!user) return null;

  // Aggregate stats from loaded sessions
  const totalSessions = sessions.length;
  const avgScore = totalSessions
    ? (sessions.reduce((a, s) => a + (s.score || 0), 0) / totalSessions).toFixed(1)
    : "—";
  const bestScore = totalSessions
    ? Math.max(...sessions.map((s) => s.score || 0)).toFixed(1)
    : "—";
  const displayName = user.displayName || user.email?.split("@")[0] || "FIGHTER";


  return (
    <main style={{
      minHeight: "100dvh",
      background: pageBackground,
      color: "#fff",
      paddingBottom: "calc(100px + max(env(safe-area-inset-bottom), 16px))",
    }}>

      {/* Stripe success toast */}
      {subscribeSuccess && (
        <div style={{ position: "fixed", top: "calc(16px + env(safe-area-inset-top))", left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "12px 20px", borderRadius: 14, background: "linear-gradient(135deg,#F5C451,#D4A017)", boxShadow: "0 8px 32px rgba(245,196,81,0.4)", display: "flex", alignItems: "center", gap: 10, pointerEvents: "none", whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 20 }}>🎉</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#000" }}>
              {locale === "mn" ? "Про болгосонд баярлалаа!" : locale === "ko" ? "업그레이드 완료!" : "Welcome to Pro!"}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.55)" }}>
              {locale === "mn" ? "Бүрэн хандалт нээгдлээ" : locale === "ko" ? "전체 기능 잠금 해제" : "Full access unlocked"}
            </div>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 16px" }}>
        <BrandHeader
          kicker="Fighter DNA"
          title={displayName}
          sub={tendency ? tendency.title : (FP[locale] || FP.en).evolutionTitle}
          onBack={() => (window.history.length > 1 ? router.back() : router.push(`/${locale}/progress`))}
          backLabel={(FP[locale] || FP.en).back}
        />

        {/* Stats row */}
        {!loading && (() => { const fp = FP[locale] || FP.en; return (
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <StatCell value={totalSessions || "0"} label={fp.sessions} />
            <StatCell value={avgScore}            label={fp.avgScore} accent={whiteAlpha(0.85)} />
            <StatCell value={bestScore}           label={fp.bestScore} accent={totalSessions ? GOLD : whiteAlpha(0.3)} />
          </div>
        ); })()}


        {/* ── Tab Bar ─────────────────────────────────────────────── */}
        {(() => {
          const TABS = [
            { key: "dna",      en: "DNA",      mn: "ДНХ",     ko: "DNA"  },
            { key: "progress", en: "Progress", mn: "Ахиц",    ko: "진행" },
            // Fighter studies are part of the pro-fighter library (hidden in core mode).
            ...(showRoute("/fighters") ? [{ key: "studies",  en: "Studies",  mn: "Судалгаа", ko: "학습" }] : []),
            { key: "tribe",    en: "Tribe",    mn: "Овог",    ko: "부족" },
          ];
          return (
            <div role="tablist" style={{ ...glass, display: "flex", gap: 4, padding: 4, borderRadius: 999, margin: "4px 0 18px" }}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      flex: 1, minHeight: 38, border: "none", borderRadius: 999, cursor: "pointer",
                      fontFamily: "inherit", fontSize: 13.5, fontWeight: 600,
                      background: isActive ? "#fff" : "transparent",
                      color: isActive ? "#0b0b0d" : "rgba(255,255,255,0.62)",
                      transition: "background 0.2s, color 0.2s",
                    }}
                  >
                    {tab[locale] || tab.en}
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* ── DNA Tab ─────────────────────────────────────────────── */}
        {activeTab === "dna" && (
          <>
            {/* Fighter Passport */}
            {!loading && (
              <FighterPassportCard
                dna={dna}
                displayName={displayName}
                progress={progress}
                studiedIds={studiedFighterIds}
                currentExperiment={currentExperiment}
                sessions={sessions}
                locale={locale}
              />
            )}

            {/* DNA Freshness Warning */}
            {!loading && sessions.length > 0 && (() => {
              const lastSec = Math.max(...sessions.map((s) => s.createdAt?.seconds || 0));
              const days = Math.floor((Date.now() / 1000 - lastSec) / 86400);
              if (days < 5) return null;
              const FL = FRESH_L[locale] || FRESH_L.en;
              const level = days >= 14 ? FL.lost : days >= 8 ? FL.degrade : FL.weak;
              const color = days >= 14 ? "#EF4444" : days >= 8 ? "#FB923C" : "#F59E0B";
              return (
                <div style={{ borderRadius: RADIUS.lg, padding: "12px 14px", marginBottom: 8, background: `${color}0a`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>⚡</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color, marginBottom: 3 }}>{level.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{level.hint(days)}</div>
                  </div>
                  <button type="button" onClick={() => router.push(`/${locale}/train`)} style={{ flexShrink: 0, padding: "7px 12px", borderRadius: 10, background: `${color}18`, border: `1px solid ${color}40`, color, fontSize: 12, fontWeight: 900, cursor: "pointer" }}>
                    {FL.cta}
                  </button>
                </div>
              );
            })()}

            {/* Fighter DNA Card */}
            {!loading && (
              <div style={{ marginBottom: 4 }}>
                <FighterDNACard dna={{ ...dna, prelim: dna.building ? computePreliminarySignals(sessions) : undefined }} locale={locale} />
              </div>
            )}

            {/* DNA Milestone Badges */}
            {!loading && (milestonesUnlocked.m8 || milestonesUnlocked.m15) && (
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {milestonesUnlocked.m8 && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 20,
                    background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.35)",
                  }}>
                    <span style={{ fontSize: 14 }}>🧬</span>
                    <span style={{ fontSize: 12, fontWeight: 900, color: "#A78BFA", letterSpacing: 0.5 }}>
                      {locale === "mn" ? "8-р тренинг" : locale === "ko" ? "세션 8 마일스톤" : "Session 8 Milestone"}
                    </span>
                  </div>
                )}
                {milestonesUnlocked.m15 && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 20,
                    background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.35)",
                  }}>
                    <span style={{ fontSize: 14 }}>⚗️</span>
                    <span style={{ fontSize: 12, fontWeight: 900, color: "#A78BFA", letterSpacing: 0.5 }}>
                      {locale === "mn" ? "15-р тренинг" : locale === "ko" ? "세션 15 마일스톤" : "Session 15 Milestone"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* DNA Confidence Journey */}
            {!loading && !dna.building && dna.archetypeKey && (() => {
              const conf = (dna.confidence || 0) * 100;
              const MILESTONES = [
                { pct: 0,  label: { en: "Forming", mn: "Бүрдэж байна", ko: "형성 중" } },
                { pct: 33, label: { en: "Emerging", mn: "Гарч байна", ko: "나타나는 중" } },
                { pct: 66, label: { en: "Solidifying", mn: "Бататгаж байна", ko: "강화 중" } },
                { pct: 90, label: { en: "Confirmed", mn: "Тогтсон", ko: "확정됨" } },
              ];
              const currentMilestone = [...MILESTONES].reverse().find((m) => conf >= m.pct) || MILESTONES[0];
              const nextMilestone = MILESTONES.find((m) => m.pct > conf);
              const accentColor = ARCH_TRAINING_COLORS[dna.archetypeKey] || GOLD;
              return (
                <div style={{ borderRadius: 14, padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.8, textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
                      {locale === "mn" ? "ДНХ ИТГЭЛЦЛИЙН ЗАМНАЛ" : locale === "ko" ? "DNA 신뢰도 여정" : "DNA CONFIDENCE JOURNEY"}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: accentColor }}>{conf.toFixed(0)}%</div>
                  </div>
                  <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${conf}%`, background: `linear-gradient(90deg, ${accentColor}88, ${accentColor})`, borderRadius: 3, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: accentColor }}>{currentMilestone.label[locale] || currentMilestone.label.en}</span>
                    {nextMilestone && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
                        → {nextMilestone.label[locale] || nextMilestone.label.en} @ {nextMilestone.pct}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* DNA Confidence Timeline */}
            {!loading && sessions.length >= 3 && (
              <DNATimelineCard sessions={sessions} locale={locale} />
            )}

            {/* DNA Evolution */}
            {!loading && sessions.length >= 6 && (
              <DNAEvolutionCard sessions={sessions} locale={locale} />
            )}

            {/* DNA Share Card */}
            {!loading && !dna.building && (
              <DNAShareCard dna={dna} displayName={displayName} locale={locale} uid={user?.uid} />
            )}

            {/* Pro Upgrade — only once the DNA has been unlocked (a brand-new
                fighter with 0 rounds shouldn't be sold to first) */}
            {!loading && !dna.building && userTier !== "pro" && userTier !== "champion" && (
              <ProUpgradePanel locale={locale} router={router} />
            )}

            {/* DNA Export — Pro only */}
            {!loading && (
              <ProGate tier={userTier} locale={locale} router={router}>
                <div style={{ borderRadius: 14, padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: "rgba(245,196,81,0.7)", textTransform: "uppercase", marginBottom: 4 }}>
                      {locale === "mn" ? "ДНХ ТАЙЛАН" : locale === "ko" ? "DNA 리포트" : "DNA EXPORT"}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 2 }}>
                      {locale === "mn" ? "Долоо хоногийн ДНХ тайлан татах" : locale === "ko" ? "주간 DNA 리포트 다운로드" : "Download Weekly DNA Report"}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 700 }}>
                      {locale === "mn" ? "Долоо хоногийн статистик · JSON" : locale === "ko" ? "주간 통계 · JSON" : "Weekly stats · JSON"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const token = await user?.getIdToken?.();
                        const res = await fetch("/api/dna-report", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                          body: JSON.stringify({ userId: user?.uid }),
                        });
                        if (!res.ok) throw new Error("report failed");
                        const report = await res.json();
                        const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(blob);
                        a.download = `gavana-dna-report-${new Date().toISOString().slice(0, 10)}.json`;
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
                      } catch { /* report unavailable — silent */ }
                    }}
                    style={{ padding: "9px 16px", borderRadius: 10, background: "linear-gradient(135deg,#F5C451,#D4A017)", border: "none", color: "#000", fontSize: 11, fontWeight: 900, cursor: "pointer", flexShrink: 0 }}
                  >
                    ↓ {locale === "mn" ? "Татах" : locale === "ko" ? "다운로드" : "Export"}
                  </button>
                </div>
              </ProGate>
            )}
          </>
        )}

        {/* ── Progress Tab ─────────────────────────────────────────── */}
        {activeTab === "progress" && (
          <>
            {/* Weekly DNA Report */}
            {!loading && sessions.length > 0 && (
              <WeeklyReportCard sessions={sessions} locale={locale} dna={dna} router={router} />
            )}

            {/* Identity Journey Map */}
            {!loading && (
              <IdentityJourneyStrip
                sessions={sessions}
                dna={dna}
                studiedIds={studiedFighterIds}
                currentExperiment={currentExperiment}
                locale={locale}
              />
            )}

            {/* Combat Identity */}
            {!loading && (
              <CombatIdentitySection identity={identity} sessionCount={sessions.length} locale={locale} />
            )}

            {/* Combat Progress */}
            {!loading && (
              <CombatProgressCard progress={progress} locale={locale} />
            )}

            {/* Training Prescription */}
            {!loading && !dna.building && (
              <TrainingPrescriptionCard dna={dna} locale={locale} router={router} />
            )}

            {/* DNA Next Steps */}
            {!loading && !dna.building && dna.archetypeKey && (
              <DNANextStepsCard dna={dna} locale={locale} />
            )}

            {/* Evolution Reveal — shown when experiment is complete (7+ days) */}
            {!loading && currentExperiment && showRoute("/fighters") && (() => {
              const startSec = currentExperiment.startDate?.seconds || 0;
              const daysElapsed = Math.floor((Date.now() / 1000 - startSec) / 86400);
              if (daysElapsed < 7) return null;
              return (
                <EvolutionRevealPanel
                  experiment={currentExperiment}
                  sessions={sessions}
                  locale={locale}
                  router={router}
                  onClearExperiment={clearExperiment}
                />
              );
            })()}
          </>
        )}

        {/* ── Studies Tab ──────────────────────────────────────────── */}
        {activeTab === "studies" && (
          <>
            {!loading && (
              <StudiedFightersPanel studiedIds={studiedFighterIds} dna={dna} locale={locale} router={router} />
            )}
            {!loading && !dna.building && (
              <ProGate tier={userTier} locale={locale} router={router}>
                <FighterDNACompareCard dna={dna} locale={locale} />
              </ProGate>
            )}
            <div style={{ padding: "0" }}>
              <CombatMemoryPanel
                sessions={sessions}
                tendency={tendency}
                trends={trends}
                loading={loading}
                onTrain={() => router.push(`/${locale}/train`)}
              />
            </div>
          </>
        )}

        {/* ── Tribe Tab ────────────────────────────────────────────── */}
        {activeTab === "tribe" && (
          <>
            {!loading && !dna.building && (
              <TribeCard
                archetypeKey={dna.archetypeKey}
                archetype={dna.archetype}
                tribeCount={tribeCount}
                locale={locale}
              />
            )}
            {!loading && allTribeCounts && (
              <TribeActivityFeed
                allTribeCounts={allTribeCounts}
                userArchetype={dna.building ? null : dna.archetypeKey}
                locale={locale}
              />
            )}
            {!loading && dna.building && (
              <div style={{ borderRadius: 14, padding: "24px 16px", background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.06)}`, textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🧬</div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: whiteAlpha(0.55), lineHeight: 1.5 }}>
                  {locale === "mn" ? "ДНХ баталгаажсаны дараа овгоо олно." : locale === "ko" ? "DNA 확정 후 부족에 합류합니다." : "Your tribe unlocks once your DNA confirms."}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />

      {/* DNA Reveal Ceremony — shown once when archetype first confirms */}
      {dnaRevealVisible && !dna.building && (
        <DNARevealOverlay
          dna={dna}
          locale={locale}
          onDismiss={() => setDnaRevealVisible(false)}
        />
      )}
    </main>
  );
}
