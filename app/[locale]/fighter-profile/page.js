"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname } from "@/lib/i18n";
import { useCombatMemory } from "@/hooks/useCombatMemory";
import BottomNav from "@/components/BottomNav";
import CombatMemoryPanel from "@/components/profile/CombatMemoryPanel";
import FighterDNACard from "@/components/profile/FighterDNACard";
import { RED, GOLD, RADIUS, goldAlpha, whiteAlpha, BG, redAlpha } from "@/lib/tokens";
import { computeMovementProfile } from "@/lib/combatMemory";
import { deriveCombatIdentity } from "@/lib/combatIdentity";
import { computeFighterDNA, dnaSnapshot } from "@/lib/fighterDNA";
import { computeCombatProgress, progressSnapshot } from "@/lib/combatProgress";
import CombatProgressCard from "@/components/profile/CombatProgressCard";
import { computeAggregatePunchPattern } from "@/lib/movementInsight";

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
    evolutionTitle:  "Movement profile · Evolution tracking",
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
    evolutionTitle:  "Хөдөлгөөний профайл · Хөгжлийн хяналт",
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
    evolutionTitle:  "움직임 프로필 · 진화 추적",
  },
};

function CombatIdentitySection({ identity, sessionCount, locale }) {
  const s = FP[locale] || FP.en;
  if (sessionCount === 0) {
    return (
      <div style={{
        borderRadius: RADIUS.lg, padding: "16px 18px",
        background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}`,
        marginBottom: 4,
      }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: whiteAlpha(0.3), lineHeight: 1.5 }}>
          {s.noSessions}
        </p>
      </div>
    );
  }

  if (sessionCount < 3 || !identity) {
    return (
      <div style={{
        borderRadius: RADIUS.lg, padding: "16px 18px",
        background: whiteAlpha(0.025), border: `1px solid ${whiteAlpha(0.06)}`,
        marginBottom: 4,
      }}>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 6 }}>
          {s.earlyRead}
        </div>
        {identity && (
          <div style={{ fontSize: 17, fontWeight: 1000, color: whiteAlpha(0.6), letterSpacing: "-0.015em", fontFamily: "var(--font-display, 'Anton', sans-serif)", marginBottom: 6 }}>
            {identity.primary}
          </div>
        )}
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: whiteAlpha(0.3) }}>
          {s.earlyReadHint}
        </p>
      </div>
    );
  }

  const confidencePct = Math.round(identity.confidence * 100);

  return (
    <div style={{
      borderRadius: RADIUS.lg, padding: "18px 18px 14px",
      background: "rgba(255,255,255,0.022)",
      border: `1px solid ${whiteAlpha(0.07)}`,
      marginBottom: 4,
    }}>
      {/* Eyebrow */}
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 6 }}>
        {s.identityEyebrow}
      </div>

      {/* Primary identity */}
      <div style={{ fontSize: 22, fontWeight: 1000, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.0, fontFamily: "var(--font-display, 'Anton', sans-serif)", marginBottom: 10 }}>
        {identity.primary}
      </div>

      {/* Confidence bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: whiteAlpha(0.3), letterSpacing: 1, textTransform: "uppercase" }}>{(FP[locale] || FP.en).signalConf}</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: confidencePct >= 70 ? GOLD : whiteAlpha(0.45), fontFamily: "monospace" }}>
            {confidencePct}%
          </span>
        </div>
        <div style={{ height: 2, borderRadius: 2, background: whiteAlpha(0.07), overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${confidencePct}%`, borderRadius: 2,
            background: confidencePct >= 70 ? `linear-gradient(90deg, ${GOLD}80, ${GOLD})` : whiteAlpha(0.3),
            transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
          }} />
        </div>
      </div>

      {/* Secondary traits */}
      {identity.secondary.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {identity.secondary.map((trait, i) => (
            <span key={i} style={{
              fontSize: 9.5, fontWeight: 800,
              color: whiteAlpha(0.42),
              background: whiteAlpha(0.04),
              border: `1px solid ${whiteAlpha(0.07)}`,
              borderRadius: RADIUS.full,
              padding: "3px 10px",
            }}>
              {trait}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

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
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.28), textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

// ─── Evolution Reveal — post-experiment punch pattern comparison ──────────────
const EVO_L = {
  en: {
    eyebrow:   "EXPERIMENT COMPLETE",
    subtitle:  (n) => `${n}-day experiment finished`,
    baseline:  "Before",
    current:   "After",
    jab:       "Jab",
    cross:     "Cross",
    hook:      "Hook",
    noData:    "Train more sessions to see evolution",
    newExp:    "New Experiment",
    viewFighter: "View Fighter →",
    dominantShift: (punch, pct, name) => `Your ${punch} increased ${pct}% — ${name} influence detected`,
    noShift:   (name) => `Style experiment with ${name} complete`,
  },
  mn: {
    eyebrow:   "ТУРШИЛТ ДУУССАН",
    subtitle:  (n) => `${n} өдрийн туршилт дууслаа`,
    baseline:  "Өмнө",
    current:   "Одоо",
    jab:       "Жааб",
    cross:     "Кросс",
    hook:      "Хук",
    noData:    "Хөгжлийг харахын тулд илүү тренинг хий",
    newExp:    "Шинэ туршилт",
    viewFighter: "Тулаанчийг харах →",
    dominantShift: (punch, pct, name) => `Таны ${punch} ${pct}%-иар нэмэгдсэн — ${name}-ийн нөлөө илрэв`,
    noShift:   (name) => `${name}-тай хэв маягийн туршилт дууслаа`,
  },
  ko: {
    eyebrow:   "실험 완료",
    subtitle:  (n) => `${n}일 실험 완료`,
    baseline:  "이전",
    current:   "이후",
    jab:       "잽",
    cross:     "크로스",
    hook:      "훅",
    noData:    "진화를 보려면 더 많이 훈련하세요",
    newExp:    "새 실험",
    viewFighter: "파이터 보기 →",
    dominantShift: (punch, pct, name) => `${punch}이 ${pct}% 증가 — ${name} 스타일 영향 감지`,
    noShift:   (name) => `${name} 스타일 실험 완료`,
  },
};

function EvolutionRevealPanel({ experiment, sessions, locale, router, onClearExperiment }) {
  const L = EVO_L[locale] || EVO_L.en;
  const acc = experiment.fighterAccent || "#F5C451";
  const startSec = experiment.startDate?.seconds || 0;
  const daysElapsed = Math.floor((Date.now() / 1000 - startSec) / 86400);

  // Sessions during experiment
  const expSessions = sessions.filter((s) => (s.createdAt?.seconds || 0) > startSec);
  const currentPattern = computeAggregatePunchPattern(expSessions);
  const baseline = experiment.baselinePunchPct;

  const punches = [
    { key: "jab",   label: L.jab,   color: "#3B82F6", basePct: baseline?.jabPct,   nowPct: currentPattern?.jabPct   },
    { key: "cross", label: L.cross, color: "#EF4444", basePct: baseline?.crossPct, nowPct: currentPattern?.crossPct },
    { key: "hook",  label: L.hook,  color: "#8B5CF6", basePct: baseline?.hookPct,  nowPct: currentPattern?.hookPct  },
  ];

  // Find biggest positive shift
  const shifts = punches.map((p) => ({
    ...p,
    delta: (p.nowPct != null && p.basePct != null) ? p.nowPct - p.basePct : null,
  }));
  const topShift = shifts.filter((s) => s.delta != null).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  const insight = topShift?.delta != null && Math.abs(topShift.delta) >= 5
    ? L.dominantShift(topShift.label.toLowerCase(), topShift.delta > 0 ? `+${topShift.delta}` : topShift.delta, experiment.fighterName)
    : L.noShift(experiment.fighterName);

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: `1px solid ${acc}40`,
      background: `linear-gradient(135deg, ${acc}0c 0%, rgba(0,0,0,0) 60%)`,
      marginBottom: 8,
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${acc}20` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>⚗️</span>
            <div>
              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 2 }}>
                {L.eyebrow}
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{experiment.fighterName}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
                {L.subtitle(daysElapsed)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/fighters/${experiment.fighterId}`)}
            style={{ background: `${acc}18`, border: `1px solid ${acc}35`, borderRadius: 8, padding: "5px 10px", color: acc, fontSize: 9.5, fontWeight: 900, cursor: "pointer" }}
          >
            {L.viewFighter}
          </button>
        </div>
      </div>

      {/* Punch comparison bars */}
      <div style={{ padding: "12px 16px" }}>
        {!currentPattern && (
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{L.noData}</p>
        )}

        {currentPattern && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Column headers */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 36, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>{L.baseline}</span>
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>{L.current}</span>
              </div>
              <span style={{ width: 38, flexShrink: 0 }} />
            </div>

            {punches.map(({ key, label, color, basePct, nowPct }) => {
              const delta = (nowPct != null && basePct != null) ? nowPct - basePct : null;
              const deltaStr = delta == null ? "" : delta > 0 ? `+${delta}%` : `${delta}%`;
              const deltaColor = delta == null ? "transparent" : delta > 0 ? "#34D399" : delta < 0 ? "#F87171" : "rgba(255,255,255,0.3)";
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Label */}
                  <span style={{ width: 36, fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.8, flexShrink: 0 }}>
                    {label}
                  </span>
                  {/* Dual bar */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                    {/* Before bar (grey) */}
                    {basePct != null && (
                      <div style={{ position: "relative", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${basePct}%`, height: "100%", background: "rgba(255,255,255,0.22)", borderRadius: 2 }} />
                      </div>
                    )}
                    {/* After bar (colored) */}
                    {nowPct != null && (
                      <div style={{ position: "relative", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${nowPct}%`, height: "100%", background: color, borderRadius: 2, boxShadow: `0 0 6px ${color}55` }} />
                      </div>
                    )}
                    {basePct == null && nowPct == null && (
                      <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2 }} />
                    )}
                  </div>
                  {/* Delta */}
                  <div style={{ width: 38, textAlign: "right", fontSize: 10, fontWeight: 900, color: deltaColor, fontFamily: "monospace", flexShrink: 0 }}>
                    {deltaStr || (nowPct != null ? `${nowPct}%` : "—")}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Insight line */}
        <div style={{ marginTop: 12, padding: "9px 12px", borderRadius: 10, background: `${acc}10`, border: `1px solid ${acc}20` }}>
          <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: "rgba(255,255,255,0.72)", lineHeight: 1.45 }}>
            {insight}
          </p>
        </div>

        {/* New experiment CTA */}
        <button
          type="button"
          onClick={onClearExperiment}
          style={{ marginTop: 10, width: "100%", padding: "9px 0", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 900, cursor: "pointer" }}
        >
          {L.newExp}
        </button>
      </div>
    </div>
  );
}

export default function FighterProfilePage() {
  const router   = useRouter();
  const pathname = usePathname();
  const locale   = getLocaleFromPathname(pathname);
  const { user, loading: authLoading } = useAuth();
  const { sessions, tendency, trends, loading } = useCombatMemory({ user });
  const profile  = computeMovementProfile(sessions);
  const identity = profile ? deriveCombatIdentity(profile, sessions) : null;
  const dna      = computeFighterDNA({ sessions, locale });
  const progress = computeCombatProgress({ sessions, streakDays: 0, locale });
  const dnaSavedRef       = useRef(false);
  const progressSavedRef  = useRef(false);
  const [currentExperiment, setCurrentExperiment] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  // Load currentExperiment from user doc
  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snap = await getDoc(doc(db, "users", user.uid));
        if (active && snap.exists()) setCurrentExperiment(snap.data().currentExperiment || null);
      } catch { /* silent */ }
    })();
    return () => { active = false; };
  }, [user?.uid]);

  async function clearExperiment() {
    if (!user?.uid) return;
    try {
      const { doc, updateDoc, deleteField } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await updateDoc(doc(db, "users", user.uid), { currentExperiment: deleteField() });
      setCurrentExperiment(null);
    } catch { /* silent */ }
  }

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
      background: BG,
      paddingBottom: "calc(100px + max(env(safe-area-inset-bottom), 16px))",
    }}>

      {/* ── Hero header ─────────────────────────────────────────── */}
      <div style={{
        padding: "0 20px",
        background: `radial-gradient(ellipse at 50% 0%, rgba(255,59,48,0.07) 0%, transparent 65%)`,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        {/* Back */}
        <div style={{ paddingTop: 16 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "none", border: "none",
              color: whiteAlpha(0.4), cursor: "pointer",
              padding: "8px 0", fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
            }}
            aria-label="Back"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {(FP[locale] || FP.en).back}
          </button>
        </div>

        {/* Kicker */}
        <p style={{ margin: "20px 0 6px", fontSize: 9, fontWeight: 900, letterSpacing: 2, color: goldAlpha(0.55), textTransform: "uppercase" }}>
          {(FP[locale] || FP.en).kicker}
        </p>

        {/* Name */}
        <h1 style={{
          margin: "0 0 3px", fontSize: 30, fontWeight: 1000,
          letterSpacing: "-0.025em", color: "#fff", lineHeight: 1.0,
          fontFamily: "var(--font-display, 'Anton', sans-serif)",
          textTransform: "uppercase",
        }}>
          {displayName}
        </h1>

        {/* Tendency subtitle — shows once loaded */}
        <p style={{ margin: "0 0 20px", fontSize: 11, color: whiteAlpha(0.3), fontWeight: 700 }}>
          {tendency ? tendency.title : (FP[locale] || FP.en).evolutionTitle}
        </p>

        {/* Stats row */}
        {!loading && (() => { const fp = FP[locale] || FP.en; return (
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <StatCell value={totalSessions || "0"} label={fp.sessions} />
            <StatCell value={avgScore}            label={fp.avgScore} accent={whiteAlpha(0.85)} />
            <StatCell value={bestScore}           label={fp.bestScore} accent={totalSessions ? GOLD : whiteAlpha(0.3)} />
          </div>
        ); })()}

        {/* Divider */}
        <div style={{ height: 1, background: whiteAlpha(0.05), marginBottom: 16 }} />

        {/* Combat Identity */}
        {!loading && (
          <CombatIdentitySection identity={identity} sessionCount={sessions.length} locale={locale} />
        )}

        {/* Evolution Reveal — shown when experiment is complete (7+ days) */}
        {!loading && currentExperiment && (() => {
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

        {/* Fighter DNA */}
        {!loading && (
          <div style={{ marginBottom: 4 }}>
            <FighterDNACard dna={dna} locale={locale} />
          </div>
        )}

        {/* Combat Progress */}
        {!loading && (
          <CombatProgressCard progress={progress} locale={locale} />
        )}
      </div>

      {/* ── Panel ───────────────────────────────────────────────── */}
      <div style={{ padding: "0 20px" }}>
        <CombatMemoryPanel
          sessions={sessions}
          tendency={tendency}
          trends={trends}
          loading={loading}
          onTrain={() => router.push(`/${locale}/train`)}
        />
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </main>
  );
}
