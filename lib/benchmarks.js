// Benchmark tests — the three fixed rounds that used to be global "challenges". In core mode
// they are personal: run one from Train (?drill=<id>), and Progress shows your best for each.
// Pure; tested in tests/benchmarks.test.js.

export const BENCHMARKS = [
  {
    id: "speed-test",
    seconds: 20,
    icon: "⚡",
    name: { mn: "Хурдны тест", ko: "스피드 테스트", en: "Speed test" },
    goal: { mn: "20 секундэд аль болох олон цохилт", ko: "20초 동안 최대한 많은 펀치", en: "As many punches as you can in 20 seconds" },
  },
  {
    id: "combo-master",
    seconds: 30,
    icon: "🔥",
    name: { mn: "Комбо тест", ko: "콤보 테스트", en: "Combo test" },
    goal: { mn: "30 секунд — 2-3 цохилттой комбо", ko: "30초 — 2~3연타 콤보", en: "30 seconds of 2–3 punch combinations" },
  },
  {
    id: "jab-minute",
    seconds: 60,
    icon: "🎯",
    name: { mn: "Жэбийн минут", ko: "잽 1분", en: "Jab minute" },
    goal: { mn: "60 секунд — цэвэр, хурдан жэб", ko: "60초 — 깨끗하고 빠른 잽", en: "60 seconds of clean, fast jabs" },
  },
];

const punchesOf = (s) => Number(s?.poseMetrics?.punchCount ?? s?.hitCount ?? 0) || 0;

/**
 * Best result per benchmark from the user's own training sessions.
 * @returns {Record<string, { attempts: number, bestScore: number, bestPunches: number } | null>}
 */
export function benchmarkBests(sessions = []) {
  const out = {};
  for (const b of BENCHMARKS) {
    const runs = (sessions || []).filter((s) => s?.drillId === b.id && Number.isFinite(Number(s.score)));
    out[b.id] = runs.length
      ? {
          attempts: runs.length,
          bestScore: Math.max(...runs.map((s) => Number(s.score))),
          bestPunches: Math.max(...runs.map(punchesOf)),
        }
      : null;
  }
  return out;
}
