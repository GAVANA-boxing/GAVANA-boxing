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

function CombatIdentitySection({ identity, sessionCount, locale }) {
  const CI_I18N = {
    en: { noSessions: "Train to build your combat identity.", earlyRead: "Movement Identity · Early Read", earlyHint: "Early read — train more sessions to improve confidence.", movementId: "Movement-based identity", signalConf: "Signal confidence" },
    mn: { noSessions: "Тулаанчийн мөн чанараа бүрдүүлэхийн тулд бэлтгэл хий.", earlyRead: "Хөдөлгөөний таних — эрт унших", earlyHint: "Найдвартай байдлаа сайжруулахын тулд илүү session хий.", movementId: "Хөдөлгөөн дээр суурилсан мөн чанар", signalConf: "Дохионы найдвартай байдал" },
    ko: { noSessions: "파이터 정체성을 구축하려면 훈련하세요.", earlyRead: "움직임 정체성 · 초기 분석", earlyHint: "신뢰도 향상을 위해 더 많은 세션을 훈련하세요.", movementId: "움직임 기반 정체성", signalConf: "신호 신뢰도" },
  };
  const ci = CI_I18N[locale] || CI_I18N.en;

  if (sessionCount === 0) {
    return (
      <div style={{
        borderRadius: RADIUS.lg, padding: "16px 18px",
        background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}`,
        marginBottom: 4,
      }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: whiteAlpha(0.3), lineHeight: 1.5 }}>
          {ci.noSessions}
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
          {ci.earlyRead}
        </div>
        {identity && (
          <div style={{ fontSize: 17, fontWeight: 1000, color: whiteAlpha(0.6), letterSpacing: "-0.015em", fontFamily: "var(--font-display, 'Anton', sans-serif)", marginBottom: 6 }}>
            {identity.primary}
          </div>
        )}
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: whiteAlpha(0.3) }}>
          {ci.earlyHint}
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
        {ci.movementId}
      </div>

      {/* Primary identity */}
      <div style={{ fontSize: 22, fontWeight: 1000, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.0, fontFamily: "var(--font-display, 'Anton', sans-serif)", marginBottom: 10 }}>
        {identity.primary}
      </div>

      {/* Confidence bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: whiteAlpha(0.3), letterSpacing: 1, textTransform: "uppercase" }}>{ci.signalConf}</span>
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

const FP_I18N = {
  en: {
    back:              "Back",
    kicker:            "Fighter Intelligence",
    sessions:          "Sessions",
    avgScore:          "Avg score",
    bestScore:         "Best score",
    evolutionTitle:    "Movement profile · Evolution tracking",
    earlyRead:         "Movement Identity · Early Read",
    earlyReadHint:     "Train more sessions to improve confidence.",
    movementId:        "Movement-based identity",
    signalConf:        "Signal confidence",
    noSessions:        "Train to build your combat identity.",
    profileCompletion: "Profile completion",
  },
  mn: {
    back:              "Буцах",
    kicker:            "Тулаанчийн тагнуул",
    sessions:          "Тренинг",
    avgScore:          "Дундаж оноо",
    bestScore:         "Шилдэг оноо",
    evolutionTitle:    "Хөдөлгөөний профайл · Хөгжлийн хяналт",
    earlyRead:         "Хөдөлгөөний таних — эрт унших",
    earlyReadHint:     "Найдвартай байдлаа сайжруулахын тулд илүү session хий.",
    movementId:        "Хөдөлгөөн дээр суурилсан мөн чанар",
    signalConf:        "Дохионы найдвартай байдал",
    noSessions:        "Тулаанчийн мөн чанараа бүрдүүлэхийн тулд бэлтгэл хий.",
    profileCompletion: "Профайл бөглөлт",
  },
  ko: {
    back:              "뒤로",
    kicker:            "파이터 인텔리전스",
    sessions:          "세션",
    avgScore:          "평균 점수",
    bestScore:         "최고 점수",
    evolutionTitle:    "움직임 프로필 · 진화 추적",
    earlyRead:         "움직임 정체성 · 초기 분석",
    earlyReadHint:     "신뢰도 향상을 위해 더 많은 세션을 훈련하세요.",
    movementId:        "움직임 기반 정체성",
    signalConf:        "신호 신뢰도",
    noSessions:        "파이터 정체성을 구축하려면 훈련하세요.",
    profileCompletion: "프로필 완성도",
  },
};

export default function FighterProfilePage() {
  const router   = useRouter();
  const pathname = usePathname();
  const locale   = getLocaleFromPathname(pathname);
  const fp       = FP_I18N[locale] || FP_I18N.en;
  const { user, loading: authLoading } = useAuth();
  const { sessions, tendency, trends, loading } = useCombatMemory({ user });
  const profile  = computeMovementProfile(sessions);
  const identity = profile ? deriveCombatIdentity(profile, sessions) : null;
  const dna      = computeFighterDNA({ sessions, locale });
  const progress = computeCombatProgress({ sessions, streakDays: 0, locale });
  const dnaSavedRef       = useRef(false);
  const progressSavedRef  = useRef(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  // Load user profile data for completion tracker
  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snap = await getDoc(doc(db, "users", user.uid));
        if (active && snap.exists()) setUserData(snap.data());
      } catch { /* silent */ }
    })();
    return () => { active = false; };
  }, [user?.uid]);

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

  // Profile completion
  const profileCompletion = (() => {
    let pct = 0;
    if (user.displayName) pct += 20;
    if (user.photoURL || userData?.photoURL || userData?.profileImageUrl) pct += 20;
    if (!dna.building && dna.archetypeKey) pct += 20;
    if (totalSessions >= 1) pct += 20;
    if (userData?.bio || userData?.description) pct += 20;
    return pct;
  })();
  const completionColor = profileCompletion >= 80 ? "#34D399" : profileCompletion >= 40 ? GOLD : RED;

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
            {fp.back}
          </button>
        </div>

        {/* Kicker */}
        <p style={{ margin: "20px 0 6px", fontSize: 9, fontWeight: 900, letterSpacing: 2, color: goldAlpha(0.55), textTransform: "uppercase" }}>
          {fp.kicker}
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
        <p style={{ margin: "0 0 16px", fontSize: 11, color: whiteAlpha(0.3), fontWeight: 700 }}>
          {tendency ? tendency.title : fp.evolutionTitle}
        </p>

        {/* Profile completion tracker */}
        <div style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 12, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: whiteAlpha(0.5), textTransform: "uppercase", letterSpacing: 0.5 }}>
              {fp.profileCompletion}
            </span>
            <span style={{ fontSize: 13, fontWeight: 900, color: completionColor }}>{profileCompletion}%</span>
          </div>
          <div style={{ height: 4, background: whiteAlpha(0.08), borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${profileCompletion}%`, background: completionColor, borderRadius: 2, transition: "width 0.6s ease" }} />
          </div>
        </div>

        {/* Stats row */}
        {!loading && (
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <StatCell value={totalSessions || "0"} label={fp.sessions} />
            <StatCell value={avgScore}            label={fp.avgScore} accent={whiteAlpha(0.85)} />
            <StatCell value={bestScore}           label={fp.bestScore} accent={totalSessions ? GOLD : whiteAlpha(0.3)} />
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: whiteAlpha(0.05), marginBottom: 16 }} />

        {/* Combat Identity */}
        {!loading && (
          <CombatIdentitySection identity={identity} sessionCount={sessions.length} locale={locale} />
        )}

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
