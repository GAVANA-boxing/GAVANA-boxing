// Mitt drill — a reaction round, like a coach holding pads.
//
// The screen calls a strike or a defence ("1", "2", "1-2", "1-1", "slip",
// "roll"); the fighter answers with the right hand(s) or head movement inside
// a time window. This module builds the call schedule (seeded, so a round can
// be replayed and tested), judges what the camera saw against it, and sums up
// the round. Pure — the page feeds it timestamps and detected actions.

export const CALLS = Object.freeze({
  "1":    { kind: "punch", seq: ["lead"] },
  "2":    { kind: "punch", seq: ["rear"] },
  "1-1":  { kind: "punch", seq: ["lead", "lead"] },
  "1-2":  { kind: "punch", seq: ["lead", "rear"] },
  slip:   { kind: "slip" },
  roll:   { kind: "roll" },
});

export const LEVELS = Object.freeze({
  // gap = pause between calls (ms, random within range); window = time to answer.
  easy:   { calls: ["1", "2", "1-2"], gap: [1900, 2800], window: 1600 },
  normal: { calls: ["1", "2", "1-2", "1-1", "slip"], gap: [1500, 2400], window: 1400 },
  hard:   { calls: ["1", "2", "1-2", "1-1", "slip", "roll"], gap: [1100, 1900], window: 1200 },
});

/** Small seeded PRNG (mulberry32) — same seed, same round. */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The calls for one round: [{ i, call, at }] with `at` in ms from round start.
 * Never the same call three times in a row; the last call leaves time to answer.
 */
export function buildSchedule({ seed = 1, durationMs = 30000, startDelayMs = 1500, level = "normal" } = {}) {
  const cfg = LEVELS[level] || LEVELS.normal;
  const rand = rng(seed);
  const out = [];
  let at = startDelayMs;
  while (at + cfg.window <= durationMs) {
    let call;
    do {
      call = cfg.calls[Math.floor(rand() * cfg.calls.length)];
    } while (out.length >= 2 && out[out.length - 1].call === call && out[out.length - 2].call === call);
    out.push({ i: out.length, call, at });
    // Two-punch calls need a little longer before the next one.
    const extra = CALLS[call].seq?.length > 1 ? 300 : 0;
    at += cfg.window * 0.6 + cfg.gap[0] + rand() * (cfg.gap[1] - cfg.gap[0]) + extra;
    at = Math.round(at);
  }
  return out;
}

/** "left" / "right" for the lead and rear hand of a stance. */
export function handsFor(stance) {
  return stance === "southpaw" ? { lead: "right", rear: "left" } : { lead: "left", rear: "right" };
}

/**
 * Judge a whole round. `actions` are what the camera saw, in any order:
 *   { t, kind: "punch", hand: "left"|"right" } | { t, kind: "slip" } | { t, kind: "roll" }
 * Each action answers at most one call. Returns one result per call:
 *   { i, call, at, outcome: "hit"|"wrong"|"miss", reactionMs|null }
 *   reactionMs = time from the call to the first action of a correct answer.
 */
export function judgeRound(schedule, actions, { stance = "orthodox", level = "normal" } = {}) {
  const cfg = LEVELS[level] || LEVELS.normal;
  const hands = handsFor(stance);
  const pool = [...(actions || [])].filter((a) => Number.isFinite(a?.t)).sort((a, b) => a.t - b.t);
  const used = new Set();

  return (schedule || []).map((item) => {
    const def = CALLS[item.call];
    const end = item.at + cfg.window;
    const inWin = pool
      .map((a, idx) => ({ a, idx }))
      .filter(({ a, idx }) => !used.has(idx) && a.t > item.at && a.t <= end);

    if (def.kind === "punch") {
      const punches = inWin.filter(({ a }) => a.kind === "punch");
      if (!punches.length) return { ...item, outcome: "miss", reactionMs: null };
      const want = def.seq.map((h) => hands[h]);
      const got = punches.slice(0, want.length);
      got.forEach(({ idx }) => used.add(idx));
      const ok = got.length === want.length && got.every(({ a }, k) => a.hand === want[k]);
      return { ...item, outcome: ok ? "hit" : "wrong", reactionMs: ok ? Math.round(got[0].a.t - item.at) : null };
    }

    // Defence: the matching head movement anywhere in the window.
    const hit = inWin.find(({ a }) => a.kind === def.kind);
    if (hit) {
      used.add(hit.idx);
      return { ...item, outcome: "hit", reactionMs: Math.round(hit.a.t - item.at) };
    }
    const punched = inWin.find(({ a }) => a.kind === "punch");
    return { ...item, outcome: punched ? "wrong" : "miss", reactionMs: null };
  });
}

/** Round summary for the result screen. */
export function summarizeRound(results) {
  const list = results || [];
  const total = list.length;
  const hits = list.filter((r) => r.outcome === "hit");
  const wrong = list.filter((r) => r.outcome === "wrong").length;
  const misses = list.filter((r) => r.outcome === "miss").length;
  const times = hits.map((r) => r.reactionMs).filter(Number.isFinite);
  let streak = 0, best = 0;
  for (const r of list) { streak = r.outcome === "hit" ? streak + 1 : 0; best = Math.max(best, streak); }

  const byCall = {};
  for (const r of list) {
    byCall[r.call] = byCall[r.call] || { total: 0, hits: 0 };
    byCall[r.call].total += 1;
    if (r.outcome === "hit") byCall[r.call].hits += 1;
  }
  // The call to work on: lowest hit rate among calls seen at least twice.
  const weakest = Object.entries(byCall)
    .filter(([, v]) => v.total >= 2)
    .sort((a, b) => a[1].hits / a[1].total - b[1].hits / b[1].total)[0];

  const accuracy = total ? hits.length / total : 0;
  const avgReactionMs = times.length ? Math.round(times.reduce((s, x) => s + x, 0) / times.length) : null;
  return {
    total,
    hits: hits.length,
    wrong,
    misses,
    accuracy,
    avgReactionMs,
    bestReactionMs: times.length ? Math.min(...times) : null,
    bestStreak: best,
    byCall,
    weakestCall: weakest && weakest[1].hits < weakest[1].total ? weakest[0] : null,
    grade: accuracy >= 0.85 && (avgReactionMs ?? 9999) <= 700 ? "sharp" : accuracy >= 0.6 ? "solid" : "work",
  };
}

/** The call on screen at time t (ms from round start) and how much of its window is left (1 → 0). */
export function callAt(schedule, t, { level = "normal" } = {}) {
  const cfg = LEVELS[level] || LEVELS.normal;
  for (let k = (schedule || []).length - 1; k >= 0; k--) {
    const item = schedule[k];
    if (t >= item.at) {
      const left = 1 - (t - item.at) / cfg.window;
      return left > 0 ? { ...item, left } : null;
    }
  }
  return null;
}
