// Numbers for the Progress page, from the user's training sessions
// (training_sessions docs: { score, createdAt, poseMetrics: { punchCount, punchBreakdown }, sessionTag }).
// Pure: no Firestore, so it is tested directly.

export function sessionTime(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  return Number(ts) || 0;
}

const round1 = (x) => Math.round(x * 10) / 10;

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Short date ("11-р сарын 5", "11월 5일", "Nov 5"). Formatted by hand: many
 * browsers ship no Mongolian locale data, so toLocaleDateString("mn-MN") prints
 * English on some phones and Mongolian on the server.
 */
export function shortDate(ts, locale = "en") {
  const ms = sessionTime(ts);
  if (!ms) return "—";
  const d = new Date(ms);
  const m = d.getMonth(), day = d.getDate();
  if (locale === "mn") return `${m + 1}-р сарын ${day}`;
  if (locale === "ko") return `${m + 1}월 ${day}일`;
  return `${EN_MONTHS[m]} ${day}`;
}

/** Scored camera sessions, newest first. */
export function scoredSessions(sessions = []) {
  return (sessions || [])
    .filter((s) => s && (s.type == null || s.type === "training") && s.score != null && Number.isFinite(Number(s.score)))
    .sort((a, b) => sessionTime(b.createdAt) - sessionTime(a.createdAt));
}

/**
 * {
 *   count, best, avg,
 *   trend: change of the average score, last 5 vs the 5 before (null if < 6 sessions),
 *   series: last `seriesLength` scores, oldest → newest (for the chart),
 *   punches: total punches, mix: { jab, cross, hook } counts,
 *   thisWeek: sessions in the last 7 days,
 * }
 */
export function progressStats(sessions = [], { now = Date.now(), seriesLength = 20 } = {}) {
  const list = scoredSessions(sessions);
  const scores = list.map((s) => Number(s.score));
  const avgOf = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

  const recent = scores.slice(0, 5), before = scores.slice(5, 10);
  const trend = recent.length === 5 && before.length >= 1 ? round1(avgOf(recent) - avgOf(before)) : null;

  const mix = { jab: 0, cross: 0, hook: 0 };
  let punches = 0;
  for (const s of list) {
    const pm = s.poseMetrics || {};
    punches += Number(pm.punchCount) || 0;
    for (const k of Object.keys(mix)) mix[k] += Number(pm.punchBreakdown?.[k]?.count) || 0;
  }

  return {
    count: list.length,
    best: scores.length ? round1(Math.max(...scores)) : null,
    avg: scores.length ? round1(avgOf(scores)) : null,
    trend,
    series: scores.slice(0, seriesLength).reverse(),
    punches,
    mix,
    thisWeek: list.filter((s) => now - sessionTime(s.createdAt) <= 7 * 86400000).length,
  };
}

/**
 * "Am I getting better?" in one glance — the average of the first rounds vs the latest rounds.
 * Needs at least 4 scored rounds (2 vs 2); uses up to 5 vs 5. Never compares windows that overlap.
 * {
 *   ready, count, need,                    // ready=false → show `count`/`need` progress only
 *   start, now, delta,                     // average score, first k vs latest k rounds (0..10)
 *   punchesStart, punchesNow,              // average punches per round in the same windows (null if unknown)
 *   k, best, series (last 20, oldest → newest), thisWeek
 * }
 */
export function progressGlance(sessions = [], { now = Date.now() } = {}) {
  const list = scoredSessions(sessions); // newest first
  const count = list.length;
  const base = progressStats(sessions, { now });
  const out = { ready: false, count, need: 4, best: base.best, series: base.series, thisWeek: base.thisWeek };
  if (count < 4) return out;
  const k = Math.min(5, Math.floor(count / 2));
  const latest = list.slice(0, k);
  const first = list.slice(-k);
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const scoreAvg = (xs) => round1(avg(xs.map((s) => Number(s.score))));
  const punchAvg = (xs) => {
    const p = xs.map((s) => Number(s.poseMetrics?.punchCount)).filter((v) => Number.isFinite(v) && v > 0);
    return p.length === xs.length ? Math.round(avg(p)) : null;
  };
  const start = scoreAvg(first);
  const nowAvg = scoreAvg(latest);
  return {
    ...out,
    ready: true,
    k,
    start,
    now: nowAvg,
    delta: round1(nowAvg - start),
    punchesStart: punchAvg(first),
    punchesNow: punchAvg(latest),
  };
}
