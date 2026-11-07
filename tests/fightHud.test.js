import { describe, it, expect } from "vitest";
import { roundClock, createPunchTicks, createGuardWatch, FINAL_SECONDS } from "@/lib/fightHud";

describe("roundClock", () => {
  it("counts down in whole seconds and fills the ring", () => {
    expect(roundClock(20, 20)).toMatchObject({ remaining: 20, elapsedPct: 0, label: "20", final: false });
    expect(roundClock(12.3, 20)).toMatchObject({ remaining: 13, label: "13", final: false });
    expect(roundClock(10, 20).final).toBe(true);
    expect(roundClock(0.2, 20)).toMatchObject({ remaining: 1, final: true });
    expect(roundClock(0, 20)).toMatchObject({ remaining: 0, elapsedPct: 1, final: false });
  });

  it("formats minutes", () => {
    expect(roundClock(125, 180).label).toBe("2:05");
    expect(roundClock(60, 180).label).toBe("1:00");
  });

  it("short rounds only pulse for their last half", () => {
    expect(roundClock(8, 12).final).toBe(false); // 12 s round → last 6 s
    expect(roundClock(6, 12).final).toBe(true);
    expect(roundClock(FINAL_SECONDS, 120).final).toBe(true);
  });

  it("survives bad input", () => {
    expect(roundClock(undefined, undefined)).toMatchObject({ remaining: 0, final: false });
    expect(roundClock(50, 20).elapsedPct).toBe(0);
  });
});

describe("createPunchTicks", () => {
  it("records punches as the count goes up and keeps the last N", () => {
    const pt = createPunchTicks({ limit: 3 });
    expect(pt.update(0, null)).toBe(false);
    pt.update(1, "jab"); pt.update(2, "cross"); pt.update(3, "hook"); pt.update(4, "jab");
    expect(pt.ticks().map((t) => t.type)).toEqual(["cross", "hook", "jab"]);
    expect(pt.counts()).toMatchObject({ jab: 2, cross: 1, hook: 1, uppercut: 0 });
  });

  it("credits several punches between polls and ignores repeats", () => {
    const pt = createPunchTicks();
    pt.update(3, "cross");
    expect(pt.update(3, "cross")).toBe(false);
    expect(pt.counts().cross).toBe(3);
    expect(pt.ticks().map((t) => t.n)).toEqual([1, 2, 3]);
  });

  it("unknown types count as jab; a detector reset doesn't double count", () => {
    const pt = createPunchTicks();
    pt.update(1, "weird");
    expect(pt.counts().jab).toBe(1);
    pt.update(0, null);
    pt.update(1, "hook");
    expect(pt.counts()).toMatchObject({ jab: 1, hook: 1 });
    pt.reset();
    expect(pt.ticks()).toEqual([]);
    expect(pt.counts().jab).toBe(0);
  });
});

describe("createGuardWatch", () => {
  const feed = (gw, from, to, status, step = 100) => {
    let warn = false;
    for (let t = from; t <= to; t += step) warn = gw.push(t, status);
    return warn;
  };

  it("warns when the guard stays low, not on a flicker", () => {
    const gw = createGuardWatch();
    expect(feed(gw, 0, 1000, "good")).toBe(false);
    expect(gw.push(1100, "too_low")).toBe(false); // one low frame
    expect(feed(gw, 1200, 2200, "too_low")).toBe(true);
  });

  it("holds the warning briefly after the guard comes back up", () => {
    const gw = createGuardWatch({ holdMs: 1200 });
    feed(gw, 0, 1000, "too_low");
    expect(feed(gw, 1100, 1500, "good")).toBe(true);
    expect(feed(gw, 1600, 3200, "good")).toBe(false);
  });

  it("does not warn right after a punch (the hand is supposed to leave)", () => {
    const gw = createGuardWatch({ punchGraceMs: 500 });
    let warn = false;
    for (let t = 0; t <= 1500; t += 100) {
      if (t % 400 === 0) gw.punched(t);
      warn = warn || gw.push(t, "too_low");
    }
    expect(warn).toBe(false);
  });

  it("ignores missing readings", () => {
    const gw = createGuardWatch();
    expect(feed(gw, 0, 2000, null)).toBe(false);
  });
});
