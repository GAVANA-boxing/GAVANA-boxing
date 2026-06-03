// Fighter DNA Engine — derives persistent style identity from session history.
// Input: sessions array (from Firestore), locale
// Output: { building, archetype, confidence, styleMix, bestWeapon, mainWeakness,
//           recommendedFighters, recommendedTechniques, summary, nextEvolution, ... }

import { computeMovementProfile } from "@/lib/combatMemory";
import { deriveRadarStats } from "@/lib/dashboardHelpers";
import { FIGHTERS } from "@/lib/fighters";

// ── Labels ────────────────────────────────────────────────────────────────────
const ARCHETYPES = {
  en: {
    pressure:   "Pressure Fighter",
    outboxer:   "Elusive Outboxer",
    counter:    "Counter Puncher",
    explosive:  "Explosive Puncher",
    technician: "Technical Boxer",
  },
  mn: {
    pressure:   "Дарамтын тулаанч",
    outboxer:   "Хурдан хөдлөгч",
    counter:    "Тохой тулаанч",
    explosive:  "Тэсрэмтгий цохигч",
    technician: "Техникийн боксчин",
  },
  ko: {
    pressure:   "압박형 파이터",
    outboxer:   "아웃복서",
    counter:    "카운터 펀처",
    explosive:  "폭발적 펀처",
    technician: "테크니컬 복서",
  },
};

const STYLE_LABELS = {
  en: { pressure: "Pressure", outboxer: "Outboxer", counter: "Counter", explosive: "Explosive", technician: "Technician" },
  mn: { pressure: "Дарамт", outboxer: "Хөдлөгч", counter: "Тохой", explosive: "Тэсрэмтгий", technician: "Техникийн" },
  ko: { pressure: "압박", outboxer: "아웃복싱", counter: "카운터", explosive: "폭발력", technician: "기술" },
};

const WEAPON_LABELS = {
  en: { jab: "Jab", cross: "Cross", hook: "Hook" },
  mn: { jab: "Jab", cross: "Cross", hook: "Hook" },
  ko: { jab: "잽", cross: "크로스", hook: "훅" },
};

const NEXT_EVOLUTIONS = {
  pressure: {
    en: "Build head movement to make your pressure harder to time.",
    mn: "Толгойн хөдөлгөөн нэмж, дарамтаа таймласахад хэцүү болго.",
    ko: "헤드 무브먼트를 키워 압박을 타이밍하기 어렵게 만드세요.",
  },
  outboxer: {
    en: "Add a sharp jab to control distance even better.",
    mn: "Хурц jab нэмж, зайны хяналтаа сайжруул.",
    ko: "날카로운 잽을 추가해 거리 조절을 더욱 향상시키세요.",
  },
  counter: {
    en: "Work on setting traps — bait punches and punish them.",
    mn: "Тавих занг сурч — цохилт урьж, шийтгэ.",
    ko: "함정 설치 연습 — 펀치를 유인하고 응징하세요.",
  },
  explosive: {
    en: "Develop your footwork to get in and out faster.",
    mn: "Хурдан орж гарахын тулд хөлийн ажлаа хөгжүүл.",
    ko: "더 빠르게 들어오고 나가기 위해 풋워크를 개발하세요.",
  },
  technician: {
    en: "Add power to your technique — combinations with snap.",
    mn: "Техникдээ хүч нэм — snap-тай combo.",
    ko: "기술에 파워를 추가하세요 — 스냅이 있는 콤보.",
  },
};

const LOW_DATA = {
  en: "Building your Fighter DNA. Train more sessions for a stable profile.",
  mn: "Тулаанчийн ДНХ-г бүрдүүлж байна. Тогтвортой дүн авахын тулд илүү олон session хийнэ үү.",
  ko: "파이터 DNA 구축 중. 안정적인 프로필을 위해 더 많은 세션을 훈련하세요.",
};

// ── Classify a fighter's dominant archetype from their movementDNA tags ───────
const ARCH_TAG_MAP = {
  pressure:   ["pressure", "infighting", "relentless", "forward", "volume"],
  outboxer:   ["footwork", "lateral", "distance", "angles", "pivot", "distance control"],
  counter:    ["counter", "defensive", "ambush", "shoulder roll", "philly shell", "timing"],
  explosive:  ["explosive", "speed", "combination", "animal-like", "southpaw"],
  technician: ["technical", "systematic", "fundamentals", "patient"],
};

export function classifyFighterArchetype(fighter) {
  const tags = (fighter.movementDNA?.tags || []).map((tag) => tag.toLowerCase());
  const scores = { pressure: 0, outboxer: 0, counter: 0, explosive: 0, technician: 0 };
  for (const tag of tags) {
    for (const [arch, archTags] of Object.entries(ARCH_TAG_MAP)) {
      if (archTags.some((at) => tag.includes(at))) scores[arch]++;
    }
  }
  return Object.entries(scores).sort(([, a], [, b]) => b - a)[0]?.[0] || "technician";
}

// ── Tag scoring maps ──────────────────────────────────────────────────────────
const TAG_WEIGHTS = {
  // pressure
  pressure:      { pressure: 2.5, explosive: 0.5 },
  infighting:    { pressure: 2.0 },
  relentless:    { pressure: 2.0 },
  volume:        { pressure: 1.5, explosive: 0.5 },
  forward:       { pressure: 1.5 },
  // outboxer
  footwork:      { outboxer: 2.5, technician: 0.5 },
  lateral:       { outboxer: 2.5 },
  distance:      { outboxer: 2.0 },
  "distance control": { outboxer: 2.0, counter: 0.5 },
  angles:        { outboxer: 1.5, technician: 1.0 },
  pivot:         { outboxer: 1.5, technician: 0.5 },
  // counter
  counter:       { counter: 2.5 },
  defensive:     { counter: 2.0 },
  ambush:        { counter: 2.0 },
  timing:        { counter: 1.5, technician: 0.5 },
  "Philly shell":{ counter: 2.0 },
  "shoulder roll":{ counter: 1.5 },
  patient:       { counter: 1.0, technician: 1.0 },
  // explosive
  explosive:     { explosive: 2.5, pressure: 0.5 },
  speed:         { explosive: 2.0 },
  combination:   { explosive: 1.5, technician: 0.5 },
  compact:       { explosive: 1.0, pressure: 0.5 },
  "animal-like": { explosive: 1.5 },
  southpaw:      { explosive: 0.5 },
  // technician
  technical:     { technician: 2.5 },
  systematic:    { technician: 2.0 },
  fundamentals:  { technician: 2.0 },
  "short punching": { technician: 0.5, pressure: 1.0 },
  "intimidation":   { pressure: 1.0 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function clamp(v, min = 0, max = 10) {
  return Math.min(max, Math.max(min, v));
}

function t(obj, locale) {
  return obj?.[locale] ?? obj?.en ?? "";
}

function deriveBestWeapon(sessions) {
  const counts = { jab: 0, cross: 0, hook: 0 };
  for (const s of sessions) {
    const pb = s.poseMetrics?.punchBreakdown;
    if (!pb) continue;
    if (pb.jab?.count)   counts.jab   += pb.jab.count;
    if (pb.cross?.count) counts.cross += pb.cross.count;
    if (pb.hook?.count)  counts.hook  += pb.hook.count;
  }
  const total = counts.jab + counts.cross + counts.hook;
  if (!total) return null;
  return Object.entries(counts).reduce((a, b) => b[1] > a[1] ? b : a, ["jab", 0])[0];
}

function deriveMainWeakness(sessions, radar, locale) {
  // Count how often each weakness shows up in session reviews
  const freq = {};
  for (const s of sessions) {
    const w = s.techniqueReview?.priorityWeakness;
    if (w) freq[w] = (freq[w] || 0) + 1;
    const biW = s.poseMetrics?.boxingIntelligence?.weakness?.label;
    if (biW) freq[biW] = (freq[biW] || 0) + 0.5;
  }
  if (Object.keys(freq).length) {
    return Object.entries(freq).sort(([, a], [, b]) => b - a)[0][0];
  }
  // Fallback: lowest radar metric
  if (radar) {
    const entries = Object.entries(radar).filter(([, v]) => typeof v === "number");
    if (entries.length) return entries.sort(([, a], [, b]) => a - b)[0][0];
  }
  return null;
}

export function matchFighters(styleMix) {
  const scored = FIGHTERS.map((fighter) => {
    const tags = fighter.movementDNA?.tags || [];
    let score = 0;
    for (const tag of tags) {
      const weights = TAG_WEIGHTS[tag] || {};
      for (const [dim, w] of Object.entries(weights)) {
        score += (styleMix[dim] || 0) * w;
      }
    }
    return { fighter, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.fighter);
}

// Returns compatibility % (0-100) between a fighter's style and user's styleMix
export function computeFighterCompatibility(fighter, styleMix) {
  if (!styleMix || !fighter) return null;

  function scoreForFighter(f) {
    const tags = f.movementDNA?.tags || [];
    let s = 0;
    for (const tag of tags) {
      const weights = TAG_WEIGHTS[tag] || {};
      for (const [dim, w] of Object.entries(weights)) {
        s += (styleMix[dim] || 0) * w;
      }
    }
    return s;
  }

  const thisScore = scoreForFighter(fighter);
  const allScores = FIGHTERS.map(scoreForFighter);
  const maxScore = Math.max(...allScores);
  if (maxScore === 0) return null;

  const pct = Math.round((thisScore / maxScore) * 100);
  const rank = allScores.filter((s) => s > thisScore).length + 1;
  return { pct, rank, totalFighters: FIGHTERS.length };
}

function buildSummary({ archetype, avgScore, bestWeapon, mainWeakness, sessionCount, locale }) {
  const weapon = bestWeapon ? WEAPON_LABELS[locale]?.[bestWeapon] || bestWeapon : null;
  if (locale === "mn") {
    const base = `${sessionCount} session-ийн дата дээр үндэслэсэн. ${archetype} хэв маяг илэрч байна.`;
    const w = weapon ? ` Шилдэг зэвсэг: ${weapon}.` : "";
    const fix = mainWeakness ? ` Сайжруулах чиглэл: ${mainWeakness}.` : "";
    return `${base}${w}${fix}`;
  }
  if (locale === "ko") {
    const base = `${sessionCount}개 세션 기반. ${archetype} 스타일 확인됨.`;
    const w = weapon ? ` 주요 무기: ${weapon}.` : "";
    const fix = mainWeakness ? ` 개선 필요: ${mainWeakness}.` : "";
    return `${base}${w}${fix}`;
  }
  const base = `Based on ${sessionCount} session${sessionCount !== 1 ? "s" : ""}. ${archetype} style identified.`;
  const w = weapon ? ` Best weapon: ${weapon}.` : "";
  const fix = mainWeakness ? ` Focus area: ${mainWeakness}.` : "";
  return `${base}${w}${fix}`;
}

// ── Main export ───────────────────────────────────────────────────────────────
export function computeFighterDNA({ sessions = [], locale = "en" }) {
  const MIN_SESSIONS = 3;

  if (!sessions || sessions.length < MIN_SESSIONS) {
    return {
      building: true,
      sessionsNeeded: Math.max(0, MIN_SESSIONS - (sessions?.length || 0)),
      buildingMsg: t(LOW_DATA, locale),
    };
  }

  const recent = sessions.slice(0, 10);
  const profile = computeMovementProfile(recent);
  const scores  = recent.map((s) => Number(s.score)).filter(Number.isFinite);
  const radar   = deriveRadarStats(scores, recent, 0);

  // Style mix (each 0–10)
  const pressure   = clamp((profile?.pressure   || 0) * 10 * 0.55 + (radar.Power    / 10) * 4.5);
  const outboxer   = clamp((profile?.lateral    || 0) * 10 * 0.55 + (radar.Footwork / 10) * 4.5);
  const counter    = clamp(((radar.Timing / 10) * 5   + (radar.Guard    / 10) * 5));
  const explosive  = clamp(((radar.Speed  / 10) * 5   + (radar.Power    / 10) * 5));
  const technician = clamp(((radar.Accuracy/10) * 5   + (radar.Timing   / 10) * 5));

  const styleMix = {
    pressure:   parseFloat(pressure.toFixed(1)),
    outboxer:   parseFloat(outboxer.toFixed(1)),
    counter:    parseFloat(counter.toFixed(1)),
    explosive:  parseFloat(explosive.toFixed(1)),
    technician: parseFloat(technician.toFixed(1)),
  };

  // Archetype = top dimension
  const [topKey] = Object.entries(styleMix).sort(([, a], [, b]) => b - a)[0];
  const archetype = ARCHETYPES[locale]?.[topKey] || ARCHETYPES.en[topKey];

  // Confidence
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const stdDev   = scores.length >= 3
    ? Math.sqrt(scores.reduce((v, s) => v + (s - avgScore) ** 2, 0) / scores.length)
    : 3;
  const consistency = clamp(1 - stdDev / 4, 0, 1);
  const confidence  = parseFloat(
    Math.min(1, (recent.length / 10) * 0.5 + consistency * 0.5).toFixed(2)
  );

  const bestWeapon  = deriveBestWeapon(recent);
  const mainWeakness = deriveMainWeakness(recent, radar, locale);
  const recommendedFighters = matchFighters(styleMix);
  const recommendedTechniques = recommendedFighters
    .flatMap((f) => f.whatToStudy || [])
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 3);

  const summary = buildSummary({
    archetype, avgScore, bestWeapon, mainWeakness,
    sessionCount: recent.length, locale,
  });

  const nextEvolution = t(NEXT_EVOLUTIONS[topKey] || NEXT_EVOLUTIONS.technician, locale);

  return {
    building: false,
    archetype,
    archetypeKey: topKey,
    confidence,
    styleMix,
    styleLabels: STYLE_LABELS[locale] || STYLE_LABELS.en,
    bestWeapon,
    bestWeaponLabel: bestWeapon ? (WEAPON_LABELS[locale]?.[bestWeapon] || bestWeapon) : null,
    mainWeakness,
    recommendedFighters,
    recommendedTechniques,
    summary,
    nextEvolution,
    avgScore: parseFloat(avgScore.toFixed(1)),
    sessionCount: recent.length,
  };
}

// Lightweight snapshot safe to store in Firestore
export function dnaSnapshot(dna) {
  if (!dna || dna.building) return null;
  return {
    archetype:     dna.archetype,
    archetypeKey:  dna.archetypeKey,
    confidence:    dna.confidence,
    styleMix:      dna.styleMix,
    bestWeapon:    dna.bestWeapon,
    mainWeakness:  dna.mainWeakness,
    summary:       dna.summary,
    nextEvolution: dna.nextEvolution,
    sessionCount:  dna.sessionCount,
    updatedAt:     Date.now(),
  };
}
