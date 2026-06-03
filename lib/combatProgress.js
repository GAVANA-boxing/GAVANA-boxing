// Combat Progress Engine — Combat Level, Skill Mastery, Evolution Timeline.
// Pure functions — no Firestore, no UI.

import { deriveRadarStats } from "@/lib/dashboardHelpers";
import { computeMovementProfile } from "@/lib/combatMemory";
import { computeFighterDNA } from "@/lib/fighterDNA";

// ── Level system ──────────────────────────────────────────────────────────────
const LEVEL_NAMES = [
  { level: 1,  en: "Newcomer",           mn: "Шинэ ирсэн",           ko: "신규"         },
  { level: 2,  en: "Amateur",            mn: "Аматур",               ko: "아마추어"      },
  { level: 3,  en: "Contender",          mn: "Өрсөлдөгч",            ko: "컨텐더"       },
  { level: 4,  en: "Prospect",           mn: "Ирээдүйтэй",           ko: "프로스펙트"   },
  { level: 5,  en: "Fighter",            mn: "Тулаанч",              ko: "파이터"       },
  { level: 6,  en: "Solid Boxer",        mn: "Хатуу боксчин",        ko: "솔리드 복서"  },
  { level: 7,  en: "Club Champion",      mn: "Клубын аварга",        ko: "클럽 챔피언"  },
  { level: 8,  en: "Regional Pro",       mn: "Бүсийн мэргэжлийн",    ko: "지역 프로"   },
  { level: 9,  en: "Ranked Contender",   mn: "Жагсаалтын өрсөлдөгч", ko: "랭킹 컨텐더" },
  { level: 10, en: "Title Challenger",   mn: "Алдрын чалланжер",     ko: "타이틀 도전자"},
  { level: 11, en: "National Champion",  mn: "Үндэсний аварга",      ko: "전국 챔피언"  },
  { level: 12, en: "Top Contender",      mn: "Тэргүүн өрсөлдөгч",    ko: "탑 컨텐더"   },
  { level: 13, en: "Elite Pro",          mn: "Элит мэргэжлийн",      ko: "엘리트 프로" },
  { level: 14, en: "World Class",        mn: "Дэлхийн анги",         ko: "월드 클래스" },
  { level: 15, en: "World Ranked",       mn: "Дэлхийн жагсаалт",     ko: "세계 랭킹"   },
  { level: 16, en: "World Champion",     mn: "Дэлхийн аварга",       ko: "세계 챔피언" },
];

// Threshold = 150 * L * (L+1) / 2
function xpForLevel(L) {
  return L <= 1 ? 0 : Math.round(150 * (L - 1) * L / 2);
}
const THRESHOLDS = LEVEL_NAMES.map((d) => ({ ...d, xpRequired: xpForLevel(d.level) }));

function computeXP({ sessions, streakDays = 0 }) {
  if (!sessions?.length) return 0;
  const scores = sessions.map((s) => Number(s.score)).filter(Number.isFinite);
  if (!scores.length) return 0;
  const avgScore  = scores.reduce((a, b) => a + b, 0) / scores.length;
  const bestScore = Math.max(...scores);
  const consistencyPct = scores.filter((s) => s >= 5).length / scores.length * 100;
  return Math.round(
    Math.min(sessions.length, 100) * 20 +
    avgScore * 12 +
    Math.min(streakDays, 30) * 5 +
    bestScore * 8 +
    consistencyPct * 0.30
  );
}

function levelFromXP(xp) {
  let current = THRESHOLDS[0];
  for (const t of THRESHOLDS) {
    if (xp >= t.xpRequired) current = t;
    else break;
  }
  const next = THRESHOLDS.find((t) => t.xpRequired > xp) || null;
  const xpInLevel  = xp - current.xpRequired;
  const xpToNext   = next ? next.xpRequired - current.xpRequired : null;
  const progressPct = xpToNext ? Math.round((xpInLevel / xpToNext) * 100) : 100;
  return { ...current, xp, xpInLevel, xpToNext, progressPct, nextName: next, maxLevel: !next };
}

// ── Skill mastery ─────────────────────────────────────────────────────────────
const SKILL_KEYS = ["jabIQ", "guardRecovery", "comboRhythm", "footwork", "powerTransfer"];

const SKILL_LABELS = {
  en: { jabIQ: "Jab IQ", guardRecovery: "Guard Recovery", comboRhythm: "Combo Rhythm", footwork: "Footwork", powerTransfer: "Power Transfer" },
  mn: { jabIQ: "Jab IQ", guardRecovery: "Guard буцалт", comboRhythm: "Combo хэмнэл", footwork: "Хөлийн ажил", powerTransfer: "Хүч дамжуулалт" },
  ko: { jabIQ: "잽 IQ", guardRecovery: "가드 회복", comboRhythm: "콤보 리듬", footwork: "풋워크", powerTransfer: "파워 전달" },
};

const SKILL_COLORS = {
  jabIQ:         "#F5C451",
  guardRecovery: "#60A5FA",
  comboRhythm:   "#34D399",
  footwork:      "#A78BFA",
  powerTransfer: "#FF3B30",
};

function clamp(v, min = 0, max = 10) {
  return Math.min(max, Math.max(min, isFinite(v) ? v : min));
}

function computeSkillMastery({ sessions, radar, profile }) {
  if (!sessions?.length || !radar) {
    return { jabIQ: 1, guardRecovery: 1, comboRhythm: 1, footwork: 1, powerTransfer: 1 };
  }

  // Jab IQ: speed + accuracy + jab dominance bonus
  let jabBonus = 0;
  let snapBonus = 0;
  let recoilBonus = 0;
  let jabCount = 0, crossCount = 0, hookCount = 0;
  let snapFast = 0, recoilQuick = 0, guardDropped = 0, punchSessions = 0;

  for (const s of sessions) {
    const pb = s.poseMetrics?.punchBreakdown;
    if (pb) {
      jabCount   += pb.jab?.count   || 0;
      crossCount += pb.cross?.count || 0;
      hookCount  += pb.hook?.count  || 0;
    }
    const vs = s.poseMetrics?.velocityStats;
    if (vs) {
      punchSessions++;
      if (vs.snapRating   === "FAST")  snapFast++;
      if (vs.recoilRating === "QUICK") recoilQuick++;
    }
    const gh = s.poseMetrics?.guardHeight?.status;
    if (gh === "dropped" || gh === "low") guardDropped++;
  }

  const totalPunches = jabCount + crossCount + hookCount;
  if (totalPunches > 0 && jabCount > crossCount && jabCount > hookCount) jabBonus = 1.2;
  if (punchSessions > 0) {
    snapBonus   = (snapFast   / punchSessions) * 1.5;
    recoilBonus = (recoilQuick / punchSessions) * 1.5;
  }
  const guardPenalty = sessions.length > 0 ? (guardDropped / sessions.length) * 1.5 : 0;

  const jabIQ          = clamp((radar.Speed + radar.Accuracy) / 2 + jabBonus + snapBonus * 0.5);
  const guardRecovery  = clamp(radar.Guard + recoilBonus - guardPenalty);
  const comboRhythm    = clamp((radar.Timing + radar.Accuracy) / 2 + (profile?.stability || 0) * 2);
  const footwork       = clamp(radar.Footwork + (profile?.lateral || 0) * 2);
  const powerTransfer  = clamp((radar.Power + radar.Speed) / 2 + snapBonus * 0.5);

  return {
    jabIQ:         parseFloat(jabIQ.toFixed(1)),
    guardRecovery: parseFloat(guardRecovery.toFixed(1)),
    comboRhythm:   parseFloat(comboRhythm.toFixed(1)),
    footwork:      parseFloat(footwork.toFixed(1)),
    powerTransfer: parseFloat(powerTransfer.toFixed(1)),
  };
}

// ── Evolution timeline ─────────────────────────────────────────────────────────
const EVO_LABELS = {
  session1:      { en: "First session complete",         mn: "Эхний тренинг дуусгав",              ko: "첫 번째 세션 완료"        },
  session5:      { en: "5 sessions trained",              mn: "5 тренинг дасгалласан",              ko: "5세션 훈련 완료"          },
  session10:     { en: "10 sessions milestone",           mn: "10 тренингийн тэмдэгт цэг",          ko: "10세션 마일스톤"          },
  session25:     { en: "25 sessions grinder",             mn: "25 тренинг — тогтвортой тулаанч",    ko: "25세션 달성"             },
  session50:     { en: "50 sessions veteran",             mn: "50 тренинг — ветеран тулаанч",       ko: "50세션 베테랑"           },
  score5:        { en: "First 5+ score",                  mn: "Анх 5+ дүн авлаа",                  ko: "첫 5점 이상 달성"         },
  score7:        { en: "Broke the 7.0 barrier",           mn: "7.0 хаалтыг нэвтрэв",               ko: "7.0 벽 돌파"            },
  score8:        { en: "Hit 8.0+ — strong session",       mn: "8.0+ авлаа — хүчтэй тренинг",       ko: "8.0+ 기록 — 강한 세션"   },
  jabWeapon:     { en: "Jab became your best weapon",     mn: "Жааб шилдэг зэвсэг болов",          ko: "잽이 주요 무기가 됨"     },
  crossWeapon:   { en: "Cross became your best weapon",   mn: "Кросс шилдэг зэвсэг болов",         ko: "크로스가 주요 무기가 됨" },
  hookWeapon:    { en: "Hook is a real threat now",       mn: "Хук аюулын зэвсэг болов",           ko: "훅이 위협이 됨"          },
  pressureRise:  { en: "Pressure style intensified",      mn: "Дарамтын хэв маяг нэмэгдэв",        ko: "압박 스타일 강화"        },
  outboxerRise:  { en: "Outboxer movement increased",     mn: "Хурдан хөдлөгч хэв маяг нэмэгдэв",  ko: "아웃복서 움직임 증가"   },
  guardImproved: { en: "Guard recovery improved",         mn: "Хамгаалалтын буцалт сайжарлаа",     ko: "가드 회복 향상"          },
  speedImproved: { en: "Hand speed increased",            mn: "Гарын хурд нэмэгдэв",               ko: "손 속도 향상"            },
  dnaUnlock:     { en: "Fighter DNA unlocked",            mn: "Тулаанчийн ДНХ нээгдэв",            ko: "파이터 DNA 잠금 해제"   },
  levelUp:       { en: (n) => `Reached Level ${n}`,      mn: (n) => `${n}-р түвшинд хүрлээ`,       ko: (n) => `레벨 ${n} 달성`   },
  dnaShift:      { en: (a, b) => `Style shifting: ${a} → ${b}`, mn: (a, b) => `Хэв маяг өөрчлөгдөж байна: ${a} → ${b}`, ko: (a, b) => `스타일 변화: ${a} → ${b}` },
  punchShift:    { en: "Punch pattern evolved",           mn: "Цохилтын хэв маяг хөгжсөн",         ko: "펀치 패턴 진화"          },
};

function t(obj, locale, arg) {
  const val = obj?.[locale] ?? obj?.en;
  return typeof val === "function" ? val(arg) : (val ?? "");
}

function deriveEvolutionTimeline({ sessions, levelData, skills, locale }) {
  if (!sessions?.length) return [];
  const events = [];
  const sorted = [...sessions].sort((a, b) => {
    const ta = a.createdAt?.seconds || 0;
    const tb = b.createdAt?.seconds || 0;
    return ta - tb; // ascending (oldest first for event generation)
  });

  function ts(session) {
    const s = session?.createdAt?.seconds;
    return s ? s * 1000 : null;
  }

  // Session count milestones
  const milestones = [
    { count: 1,  key: "session1",  emoji: "🥊" },
    { count: 5,  key: "session5",  emoji: "🔥" },
    { count: 10, key: "session10", emoji: "💥" },
    { count: 25, key: "session25", emoji: "⚡" },
    { count: 50, key: "session50", emoji: "🏆" },
  ];
  for (const m of milestones) {
    if (sorted.length >= m.count) {
      events.push({ emoji: m.emoji, text: t(EVO_LABELS[m.key], locale), timestamp: ts(sorted[m.count - 1]), priority: m.count });
    }
  }

  // Score milestones (first occurrence)
  const scores_asc = sorted.map((s) => s.score).filter(Number.isFinite);
  const SCORE_MILESTONES = [
    { threshold: 5, key: "score5", emoji: "📈" },
    { threshold: 7, key: "score7", emoji: "🎯" },
    { threshold: 8, key: "score8", emoji: "🌟" },
  ];
  for (const sm of SCORE_MILESTONES) {
    const idx = scores_asc.findIndex((s) => s >= sm.threshold);
    if (idx >= 0) {
      events.push({ emoji: sm.emoji, text: t(EVO_LABELS[sm.key], locale), timestamp: ts(sorted[idx]), priority: 50 + sm.threshold });
    }
  }

  // Best weapon detection across recent sessions
  let jabs = 0, crosses = 0, hooks = 0;
  for (const s of sorted) {
    const pb = s.poseMetrics?.punchBreakdown;
    if (!pb) continue;
    jabs    += pb.jab?.count   || 0;
    crosses += pb.cross?.count || 0;
    hooks   += pb.hook?.count  || 0;
  }
  const totalPunches = jabs + crosses + hooks;
  if (totalPunches > 20) {
    let weaponKey = null;
    if (jabs > crosses && jabs > hooks) weaponKey = "jabWeapon";
    else if (crosses > jabs && crosses > hooks) weaponKey = "crossWeapon";
    else if (hooks > jabs && hooks > crosses) weaponKey = "hookWeapon";
    if (weaponKey) {
      events.push({ emoji: "🥊", text: t(EVO_LABELS[weaponKey], locale), timestamp: ts(sorted[sorted.length - 1]), priority: 60 });
    }
  }

  // Style shift — compare first half vs second half of sessions
  if (sorted.length >= 6) {
    const midpoint = Math.floor(sorted.length / 2);
    const early = sorted.slice(0, midpoint);
    const recent = sorted.slice(midpoint);

    const earlyProfile  = computeMovementProfile(early);
    const recentProfile = computeMovementProfile(recent);

    if (earlyProfile && recentProfile) {
      const pressureDelta = (recentProfile.pressure || 0) - (earlyProfile.pressure || 0);
      const lateralDelta  = (recentProfile.lateral  || 0) - (earlyProfile.lateral  || 0);

      if (pressureDelta > 0.15) {
        events.push({ emoji: "💪", text: t(EVO_LABELS.pressureRise, locale), timestamp: ts(recent[0]), priority: 65 });
      }
      if (lateralDelta > 0.15) {
        events.push({ emoji: "🌊", text: t(EVO_LABELS.outboxerRise, locale), timestamp: ts(recent[0]), priority: 65 });
      }
    }
  }

  // Guard improvement — compare early vs recent recoilRating
  const earlyQuickCount  = sorted.slice(0, Math.ceil(sorted.length / 2)).filter((s) => s.poseMetrics?.velocityStats?.recoilRating === "QUICK").length;
  const recentQuickCount = sorted.slice(Math.ceil(sorted.length / 2)).filter((s) => s.poseMetrics?.velocityStats?.recoilRating === "QUICK").length;
  const halfLen = Math.ceil(sorted.length / 2);
  if (halfLen > 0 && recentQuickCount / halfLen > earlyQuickCount / halfLen + 0.2) {
    events.push({ emoji: "🛡️", text: t(EVO_LABELS.guardImproved, locale), timestamp: ts(sorted[sorted.length - 1]), priority: 70 });
  }

  // Speed improvement
  const earlySnapFast  = sorted.slice(0, Math.ceil(sorted.length / 2)).filter((s) => s.poseMetrics?.velocityStats?.snapRating === "FAST").length;
  const recentSnapFast = sorted.slice(Math.ceil(sorted.length / 2)).filter((s) => s.poseMetrics?.velocityStats?.snapRating === "FAST").length;
  if (halfLen > 0 && recentSnapFast / halfLen > earlySnapFast / halfLen + 0.2) {
    events.push({ emoji: "⚡", text: t(EVO_LABELS.speedImproved, locale), timestamp: ts(sorted[sorted.length - 1]), priority: 70 });
  }

  // DNA archetype shift — compare early vs recent fighting style
  if (sorted.length >= 8) {
    const midpoint   = Math.floor(sorted.length / 2);
    const earlyDNA   = computeFighterDNA({ sessions: sorted.slice(0, midpoint),  locale });
    const recentDNA  = computeFighterDNA({ sessions: sorted.slice(midpoint),     locale });
    if (!earlyDNA.building && !recentDNA.building && earlyDNA.archetypeKey !== recentDNA.archetypeKey) {
      events.push({
        emoji: "🔄",
        text: t(EVO_LABELS.dnaShift, locale, earlyDNA.archetype, recentDNA.archetype),
        timestamp: ts(sorted[midpoint]),
        priority: 80,
      });
    }
  }

  // Punch pattern shift — compare early vs recent jab/cross/hook %
  if (sorted.length >= 6) {
    const midpoint = Math.floor(sorted.length / 2);
    function punchPct(sessions) {
      let j = 0, c = 0, h = 0;
      for (const s of sessions) {
        const pb = s.poseMetrics?.punchBreakdown;
        if (!pb) continue;
        j += pb.jab?.count || 0;
        c += pb.cross?.count || 0;
        h += pb.hook?.count || 0;
      }
      const total = j + c + h;
      return total > 0 ? { jab: Math.round(j/total*100), cross: Math.round(c/total*100), hook: Math.round(h/total*100) } : null;
    }
    const earlyPct  = punchPct(sorted.slice(0, midpoint));
    const recentPct = punchPct(sorted.slice(midpoint));
    if (earlyPct && recentPct) {
      const jabDelta = recentPct.jab - earlyPct.jab;
      const crossDelta = recentPct.cross - earlyPct.cross;
      const hookDelta = recentPct.hook - earlyPct.hook;
      if (Math.abs(jabDelta) >= 12 || Math.abs(crossDelta) >= 12 || Math.abs(hookDelta) >= 12) {
        events.push({ emoji: "📊", text: t(EVO_LABELS.punchShift, locale), timestamp: ts(sorted[midpoint]), priority: 75 });
      }
    }
  }

  // DNA unlock (at 3 sessions)
  if (sorted.length >= 3) {
    events.push({ emoji: "🧬", text: t(EVO_LABELS.dnaUnlock, locale), timestamp: ts(sorted[2]), priority: 30 });
  }

  // Level milestones
  const LEVEL_MILESTONES = [2, 3, 4, 5, 7, 10];
  for (const lv of LEVEL_MILESTONES) {
    if (levelData.level >= lv) {
      events.push({ emoji: "🏅", text: t(EVO_LABELS.levelUp, locale, lv), timestamp: null, priority: 40 + lv });
    }
  }

  // Sort by timestamp descending (most recent first), deduplicate by text
  const seen = new Set();
  return events
    .filter((e) => { if (seen.has(e.text)) return false; seen.add(e.text); return true; })
    .sort((a, b) => {
      if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
      if (a.timestamp) return -1;
      if (b.timestamp) return 1;
      return b.priority - a.priority;
    })
    .slice(0, 8);
}

// ── Main export ───────────────────────────────────────────────────────────────
export { SKILL_KEYS, SKILL_LABELS, SKILL_COLORS, LEVEL_NAMES };

export function computeCombatProgress({ sessions = [], streakDays = 0, locale = "en" }) {
  const MIN_SESSIONS = 3;

  if (!sessions || sessions.length < MIN_SESSIONS) {
    return {
      building: true,
      sessionsNeeded: Math.max(0, MIN_SESSIONS - (sessions?.length || 0)),
    };
  }

  const scores  = sessions.map((s) => Number(s.score)).filter(Number.isFinite);
  const radar   = deriveRadarStats(scores, sessions, streakDays);
  const profile = computeMovementProfile(sessions);

  const xp         = computeXP({ sessions, streakDays });
  const levelData  = levelFromXP(xp);
  const skills     = computeSkillMastery({ sessions, radar, profile });
  const timeline   = deriveEvolutionTimeline({ sessions, levelData, skills, locale });

  // Punch pattern trend: early vs recent half
  let punchTrend = null;
  if (sessions.length >= 6) {
    const sorted  = [...sessions].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    const mid     = Math.floor(sorted.length / 2);
    function pctOf(sess) {
      let j = 0, c = 0, h = 0;
      for (const s of sess) {
        const pb = s.poseMetrics?.punchBreakdown;
        if (!pb) continue;
        j += pb.jab?.count || 0; c += pb.cross?.count || 0; h += pb.hook?.count || 0;
      }
      const total = j + c + h;
      return total > 0 ? { jab: Math.round(j/total*100), cross: Math.round(c/total*100), hook: Math.round(h/total*100) } : null;
    }
    const early  = pctOf(sorted.slice(0, mid));
    const recent = pctOf(sorted.slice(mid));
    if (early && recent) punchTrend = { early, recent };
  }

  return {
    building: false,
    levelData,
    skills,
    skillLabels: SKILL_LABELS[locale] || SKILL_LABELS.en,
    timeline,
    punchTrend,
    sessionCount: sessions.length,
  };
}

// Lightweight snapshot for Firestore
export function progressSnapshot(progress) {
  if (!progress || progress.building) return null;
  return {
    level:    progress.levelData.level,
    xp:       progress.levelData.xp,
    skills:   progress.skills,
    updatedAt: Date.now(),
  };
}
