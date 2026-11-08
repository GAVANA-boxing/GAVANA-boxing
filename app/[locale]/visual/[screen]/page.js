"use client";

import { useState } from "react";
import { notFound, useParams } from "next/navigation";
import { getLocale, translate } from "@/lib/i18n";
import { getFighterRank, getNextRank, getRankProgress } from "@/lib/xp";
import { progressStats } from "@/lib/progressStats";
import { computeFighterDNA } from "@/lib/fighterDNA";
import { pageBackground } from "@/components/ui/brand";
import ProgressView from "@/components/progress/ProgressView";
import ResultHeader from "@/components/train/ResultHeader";
import ResultAnalysisSection from "@/components/train/ResultAnalysisSection";
import PunchTeardown from "@/components/train/PunchTeardown";
import MotionReplay3D from "@/components/train/MotionReplay3D";
import FightHud from "@/components/train/FightHud";
import MittCall from "@/components/mitts/MittCall";
import MittResult from "@/components/mitts/MittResult";
import { summarizeRound } from "@/lib/mittDrill";
import TourView from "@/components/tour/TourView";
import FighterShareCard from "@/components/profile/FighterShareCard";
import { syntheticReplay } from "@/lib/punchTeardown";
import OnboardingStep1Archetype from "@/components/onboarding/OnboardingStep1Archetype";
import FighterDashboard from "@/components/dashboard/fighter/FighterDashboard";
import { MOCK_DASHBOARD, MOCK_PARTIAL_ERROR } from "@/lib/dashboard/mockData";

// Fixed-data renders of screens that need a signed-in user, for the visual
// regression tests (tests/visual). Only exists when NEXT_PUBLIC_VISUAL_FIXTURES=1
// (set by playwright.config.mjs); everywhere else it is a 404.
const ENABLED = process.env.NEXT_PUBLIC_VISUAL_FIXTURES === "1";

const NOW = Date.UTC(2026, 10, 6, 12, 0, 0);
const DAY = 86_400_000;
const SCORES = [5.8, 6.1, 6.0, 6.6, 6.4, 6.9, 7.1, 6.8, 7.4, 7.3, 7.6, 7.9];
const SESSIONS = SCORES.map((score, i) => ({
  id: `s${i}`, type: "training", score,
  createdAt: { seconds: (NOW - (SCORES.length - i) * 1.5 * DAY) / 1000 },
  poseMetrics: { punchCount: 20 + i, punchBreakdown: { jab: { count: 10 + i }, cross: { count: 8 }, hook: { count: 3 } } },
})).reverse();
const POSE = {
  punchCount: 24, sessionConfidence: "medium", cameraQuality: 80, frameCount: 300,
  velocityStats: { snapRating: "FAST", recoilRating: "MODERATE" },
  punchBreakdown: { jab: { count: 12 }, cross: { count: 9 }, hook: { count: 3 } },
};

const TEARDOWN_REPLAY = syntheticReplay({ punches: 4, lazyCross: true, dropGuardOn: 1 });

function StanceFixture({ locale, t }) {
  const [stance, setStance] = useState(null);
  const [archetype, setArchetype] = useState(null);
  const [weightClass, setWeightClass] = useState("");
  return (
    <main style={{ minHeight: "100dvh", background: pageBackground, padding: "24px 16px" }}>
      <OnboardingStep1Archetype
        locale={locale} t={t} archetype={archetype} setArchetype={setArchetype} stance={stance} setStance={setStance}
        weightClass={weightClass} setWeightClass={setWeightClass} saving={false} onNext={() => {}}
      />
    </main>
  );
}

export default function VisualFixture() {
  const params = useParams();
  if (!ENABLED) notFound();
  const locale = getLocale(params?.locale);
  const t = (k) => translate(locale, k);

  if (params?.screen === "share-card") {
    const xp = 2340;
    return (
      <main style={{ minHeight: "100dvh", background: pageBackground }}>
        <FighterShareCard
          profileUser={{ uid: "fixture", username: "bat_erdene", displayName: "Bat-Erdene", fighterArchetype: "counter", stance: "southpaw", dailyStreak: 6 }}
          fighterRank={getFighterRank(xp)} xp={xp} rankProgress={getRankProgress(xp)}
          trainingSessions={SESSIONS} locale={locale} t={t} onClose={() => {}}
        />
      </main>
    );
  }

  if (params?.screen === "tour" || params?.screen === "tour-night") {
    // Tokyo at noon (2,000 XP), or Las Vegas in the evening (top rank) — fixed moment.
    const night = params.screen === "tour-night";
    return (
      <main style={{ minHeight: "100dvh", background: pageBackground, color: "#fff", padding: "20px 16px 40px" }}>
        <TourView xp={night ? 45000 : 2000} locale={locale} now={new Date(NOW - 9 * 3600 * 1000)} />
      </main>
    );
  }

  if (params?.screen === "mitts-call" || params?.screen === "mitts-slip") {
    // Mitt drill call over an empty stage: a 1-2 (with the last call's hit), or a slip.
    const slip = params.screen === "mitts-slip";
    return (
      <main style={{ position: "fixed", inset: 0, background: "#111" }}>
        <MittCall
          current={slip ? { i: 3, call: "slip", at: 0, left: 0.35 } : { i: 2, call: "1-2", at: 0, left: 0.7 }}
          stance="orthodox" locale={locale}
          feedback={slip ? { outcome: "miss", reactionMs: null } : { outcome: "hit", reactionMs: 420 }}
        />
      </main>
    );
  }

  if (params?.screen === "mitts-result") {
    const summary = summarizeRound([
      { call: "1", outcome: "hit", reactionMs: 410 }, { call: "1-2", outcome: "hit", reactionMs: 520 },
      { call: "slip", outcome: "miss", reactionMs: null }, { call: "2", outcome: "hit", reactionMs: 380 },
      { call: "1-2", outcome: "wrong", reactionMs: null }, { call: "1", outcome: "hit", reactionMs: 450 },
      { call: "slip", outcome: "hit", reactionMs: 610 }, { call: "1-1", outcome: "hit", reactionMs: 560 },
      { call: "2", outcome: "hit", reactionMs: 400 }, { call: "1-2", outcome: "miss", reactionMs: null },
    ]);
    return (
      <main style={{ minHeight: "100dvh", background: pageBackground, color: "#fff", padding: "20px 16px 32px" }}>
        <MittResult summary={summary} locale={locale} onAgain={() => {}} onExit={() => {}} />
      </main>
    );
  }

  if (params?.screen === "hud" || params?.screen === "hud-final") {
    // Fight HUD over an empty stage: mid-round, or the last seconds with the guard down.
    const final = params.screen === "hud-final";
    // One more punch per poll until the sequence is done, so the tick strip fills like a real round.
    const seq = ["jab", "cross", "jab", "cross", "hook", "jab", final ? "uppercut" : "cross"];
    let polls = 0;
    const getInfo = () => {
      const n = Math.min(seq.length, ++polls);
      return { punchCount: n, lastPunchType: seq[n - 1], latestMetrics: { guardHeight: { status: final ? "too_low" : "good" } } };
    };
    return (
      <main style={{ minHeight: "100dvh", background: pageBackground, padding: 16 }}>
        <div style={{ position: "relative", height: 560, borderRadius: 20, overflow: "hidden", background: "#0b0b0d", border: "1px solid rgba(255,255,255,0.08)" }}>
          <FightHud getDebugInfo={getInfo} isActive secondsLeft={final ? 6.4 : 14.2} totalSeconds={20} locale={locale} pollMs={100} />
        </div>
      </main>
    );
  }

  if (params?.screen === "stance") return <StanceFixture locale={locale} t={t} />;

  if (params?.screen === "fighter") {
    // The personal procedural fighter ("Mine") with its style picker; rank from fixed XP.
    return <MotionReplay3D replay={TEARDOWN_REPLAY} locale={locale} onClose={() => {}} fighter={{ xp: 2340, seed: "fixture" }} />;
  }

  if (params?.screen === "teardown") {
    // A synthetic round: jab, arm-only cross with the guard dropped, jab, cross.
    return <PunchTeardown replay={TEARDOWN_REPLAY} locale={locale} onClose={() => {}} />;
  }

  // Fighter dashboard with demo data; "-states" = no benchmark published + orders offline.
  if (params?.screen === "dashboard" || params?.screen === "dashboard-states") {
    const state = params.screen === "dashboard" ? MOCK_DASHBOARD : MOCK_PARTIAL_ERROR;
    return <FighterDashboard state={state} locale={locale} onRetry={() => {}} />;
  }

  if (params?.screen === "progress") {
    const xp = 2340;
    return (
      <main style={{ minHeight: "100dvh", background: pageBackground, color: "#fff" }}>
        <ProgressView
          locale={locale} t={t} loading={false} currentXP={xp}
          rank={getFighterRank(xp)} nextRank={getNextRank(xp)} rankPct={getRankProgress(xp)}
          stats={progressStats(SESSIONS, { now: NOW })} dna={computeFighterDNA({ sessions: SESSIONS, locale })}
          sessions={SESSIONS} go={() => {}}
        />
      </main>
    );
  }

  if (params?.screen === "result") {
    return (
      <main style={{ minHeight: "100dvh", background: pageBackground, color: "#fff", display: "flex", flexDirection: "column" }}>
        <ResultHeader
          mode="train" tooFewPunches={false} effectivePunchCount={24} minPunches={3}
          identity={{ title: t("rankBronzeBelt"), sub: null }} displayScore={7.4} scoreConf="high"
          punchBreakdown={POSE.punchBreakdown} locale={locale} t={t}
        />
        <ResultAnalysisSection
          result={{ score: 7.4, breakdown: { accuracy: 7.1, speed: 6.4, power: 8.0, consistency: 7.0 }, rankProgress: 40, xpGained: 120 }}
          comparison={[{ label: t("score") || "Score", value: "+0.6", improved: true }]}
          movementSummary={[]} timelineEvents={[]} hasMI={false} hasTimeline={false} poseMetrics={POSE}
          ghostBestScore={6.8} missionJustCompleted missionStreakBonus={100} missionNewStreak={3}
          rankUpInfo={null} locale={locale} t={t} router={{ push() {} }}
        />
      </main>
    );
  }

  notFound();
}
