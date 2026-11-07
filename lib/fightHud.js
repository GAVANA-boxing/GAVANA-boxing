// Fight HUD — what the screen shows during a round, computed from data the
// round already has (time left, detected punches, the live guard metric).
// UI only: nothing here changes how a round is scored. Pure, unit-tested;
// components/train/FightHud.js draws it.

export const FINAL_SECONDS = 10;
export const PUNCH_TYPES = Object.freeze(["jab", "cross", "hook", "uppercut"]);

/**
 * Round clock for the ring.
 * @returns {{ remaining: number, elapsedPct: number, label: string, final: boolean }}
 *   remaining — whole seconds left (rounded up, so "1" shows until the end)
 *   elapsedPct — 0..1 of the round gone (drives the ring)
 *   final — inside the last FINAL_SECONDS (ring turns red and pulses)
 */
export function roundClock(secondsLeft, totalSeconds) {
  const total = Math.max(1, Number(totalSeconds) || 1);
  const left = Math.min(total, Math.max(0, Number(secondsLeft) || 0));
  const remaining = Math.ceil(left);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return {
    remaining,
    elapsedPct: 1 - left / total,
    label: m > 0 ? `${m}:${String(s).padStart(2, "0")}` : String(s),
    final: remaining > 0 && remaining <= Math.min(FINAL_SECONDS, Math.floor(total / 2)),
  };
}

/**
 * Keeps the punch tick strip: the last `limit` punch types and a count per type.
 * Feed it the detector's running punch count and last punch type; it only
 * records when the count goes up (several punches between polls are all
 * credited to the last type — the detector reports only the latest).
 */
export function createPunchTicks({ limit = 8 } = {}) {
  let lastCount = 0;
  let ticks = [];
  const counts = Object.fromEntries(PUNCH_TYPES.map((t) => [t, 0]));
  return {
    update(punchCount, lastType, now = 0) {
      const c = Number(punchCount) || 0;
      if (c < lastCount) { lastCount = c; return false; } // detector reset
      if (c === lastCount) return false;
      const type = PUNCH_TYPES.includes(lastType) ? lastType : "jab";
      for (let i = lastCount; i < c; i++) {
        ticks.push({ type, at: now, n: i + 1 });
        counts[type] += 1;
      }
      lastCount = c;
      if (ticks.length > limit) ticks = ticks.slice(-limit);
      return true;
    },
    ticks: () => ticks.slice(),
    counts: () => ({ ...counts }),
    reset() { lastCount = 0; ticks = []; PUNCH_TYPES.forEach((t) => { counts[t] = 0; }); },
  };
}

/**
 * Guard-down warning. The live guard metric flickers, and a hand is supposed
 * to leave the chin while it punches — so warn only when the guard has been
 * low for most of the last `windowMs`, not right after a punch, and keep the
 * warning up for at least `holdMs` so it can be read.
 */
export function createGuardWatch({ windowMs = 900, ratio = 0.6, minSamples = 4, punchGraceMs = 500, holdMs = 1200 } = {}) {
  let samples = []; // { t, low }
  let lastPunchAt = -Infinity;
  let warnUntil = -Infinity;
  return {
    punched(now) { lastPunchAt = now; },
    /** @param status "too_low" | "good" | "too_high" | null (no reading) */
    push(now, status) {
      if (status) samples.push({ t: now, low: status === "too_low" });
      samples = samples.filter((s) => now - s.t <= windowMs);
      const inGrace = now - lastPunchAt < punchGraceMs;
      if (!inGrace && samples.length >= minSamples) {
        const low = samples.filter((s) => s.low).length / samples.length;
        if (low >= ratio) warnUntil = now + holdMs;
      }
      return now < warnUntil;
    },
    reset() { samples = []; lastPunchAt = -Infinity; warnUntil = -Infinity; },
  };
}
