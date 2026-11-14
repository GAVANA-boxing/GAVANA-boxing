import { describe, it, expect } from "vitest";
import { buildSchedule, judgeRound, summarizeRound, callAt, handsFor, rng, nextMittBest, MITT_BEST_MIN_CALLS, LEVELS, CALLS } from "@/lib/mittDrill";

describe("buildSchedule", () => {
  it("is the same for the same seed and different for another", () => {
    expect(buildSchedule({ seed: 7 })).toEqual(buildSchedule({ seed: 7 }));
    expect(buildSchedule({ seed: 7 }).map((c) => c.call)).not.toEqual(buildSchedule({ seed: 8 }).map((c) => c.call));
  });

  it("fits the round, spaces calls out and leaves time to answer the last one", () => {
    for (const level of Object.keys(LEVELS)) {
      const s = buildSchedule({ seed: 3, durationMs: 30000, level });
      expect(s.length).toBeGreaterThanOrEqual(8);
      expect(s[0].at).toBe(1500);
      for (let k = 1; k < s.length; k++) expect(s[k].at - s[k - 1].at).toBeGreaterThanOrEqual(LEVELS[level].gap[0]);
      expect(s[s.length - 1].at + LEVELS[level].window).toBeLessThanOrEqual(30000);
      s.forEach((c) => expect(LEVELS[level].calls).toContain(c.call));
    }
  });

  it("never repeats a call three times in a row", () => {
    for (let seed = 1; seed < 60; seed++) {
      const calls = buildSchedule({ seed, level: "easy" }).map((c) => c.call);
      for (let k = 2; k < calls.length; k++) expect(calls[k] === calls[k - 1] && calls[k] === calls[k - 2]).toBe(false);
    }
  });

  it("rng stays in [0, 1)", () => {
    const r = rng(42);
    for (let k = 0; k < 1000; k++) { const x = r(); expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1); }
  });
});

describe("judgeRound", () => {
  const sched = [
    { i: 0, call: "1", at: 1000 },
    { i: 1, call: "1-2", at: 4000 },
    { i: 2, call: "slip", at: 7000 },
    { i: 3, call: "2", at: 10000 },
  ];

  it("scores correct answers with reaction time (orthodox: lead = left)", () => {
    const actions = [
      { t: 1350, kind: "punch", hand: "left" },
      { t: 4420, kind: "punch", hand: "left" }, { t: 4700, kind: "punch", hand: "right" },
      { t: 7500, kind: "slip" },
      { t: 10300, kind: "punch", hand: "right" },
    ];
    const r = judgeRound(sched, actions);
    expect(r.map((x) => x.outcome)).toEqual(["hit", "hit", "hit", "hit"]);
    expect(r.map((x) => x.reactionMs)).toEqual([350, 420, 500, 300]);
  });

  it("swaps hands for a southpaw", () => {
    expect(handsFor("southpaw")).toEqual({ lead: "right", rear: "left" });
    const r = judgeRound([{ i: 0, call: "1", at: 0 }], [{ t: 300, kind: "punch", hand: "right" }], { stance: "southpaw" });
    expect(r[0].outcome).toBe("hit");
  });

  it("wrong hand, wrong order, half a combo and punching on a defence call are 'wrong'", () => {
    const r = judgeRound(sched, [
      { t: 1300, kind: "punch", hand: "right" },                                      // 1 with the rear hand
      { t: 4300, kind: "punch", hand: "right" }, { t: 4500, kind: "punch", hand: "left" }, // 2-1 instead of 1-2
      { t: 7300, kind: "punch", hand: "left" },                                       // punched instead of slipping
      { t: 10300, kind: "punch", hand: "left" },                                      // 2 with the lead hand
    ]);
    expect(r.map((x) => x.outcome)).toEqual(["wrong", "wrong", "wrong", "wrong"]);
    const half = judgeRound([{ i: 0, call: "1-2", at: 0 }], [{ t: 300, kind: "punch", hand: "left" }]);
    expect(half[0].outcome).toBe("wrong");
  });

  it("misses when nothing happens in the window; early or late actions don't count", () => {
    const r = judgeRound(sched, [
      { t: 900, kind: "punch", hand: "left" },   // before the call
      { t: 2700, kind: "punch", hand: "left" },  // after the 1.4 s window
    ]);
    expect(r[0].outcome).toBe("miss");
  });

  it("one action answers one call only", () => {
    const close = [{ i: 0, call: "1", at: 0 }, { i: 1, call: "1", at: 200 }];
    const r = judgeRound(close, [{ t: 300, kind: "punch", hand: "left" }]);
    expect(r.map((x) => x.outcome)).toEqual(["hit", "miss"]);
  });
});

describe("summarizeRound", () => {
  it("adds up accuracy, reaction, streak and the call to work on", () => {
    const s = summarizeRound([
      { call: "1", outcome: "hit", reactionMs: 400 },
      { call: "1-2", outcome: "miss", reactionMs: null },
      { call: "1", outcome: "hit", reactionMs: 600 },
      { call: "1-2", outcome: "wrong", reactionMs: null },
      { call: "2", outcome: "hit", reactionMs: 500 },
    ]);
    expect(s).toMatchObject({ total: 5, hits: 3, wrong: 1, misses: 1, avgReactionMs: 500, bestReactionMs: 400, bestStreak: 1, weakestCall: "1-2", grade: "solid" });
    expect(s.accuracy).toBeCloseTo(0.6);
  });

  it("grades a sharp round and handles an empty one", () => {
    const sharp = summarizeRound(Array.from({ length: 10 }, () => ({ call: "1", outcome: "hit", reactionMs: 450 })));
    expect(sharp).toMatchObject({ grade: "sharp", bestStreak: 10, weakestCall: null });
    expect(summarizeRound([])).toMatchObject({ total: 0, accuracy: 0, avgReactionMs: null, grade: "work" });
  });
});

describe("callAt", () => {
  const s = [{ i: 0, call: "1", at: 1000 }, { i: 1, call: "slip", at: 4000 }];
  it("shows the current call while its window is open", () => {
    expect(callAt(s, 500)).toBe(null);
    expect(callAt(s, 1000)).toMatchObject({ call: "1", left: 1 });
    expect(callAt(s, 1700).left).toBeCloseTo(0.5);
    expect(callAt(s, 2500)).toBe(null);
    expect(callAt(s, 4100).call).toBe("slip");
  });
  it("every call has a definition", () => {
    Object.values(LEVELS).forEach((l) => l.calls.forEach((c) => expect(CALLS[c]).toBeTruthy()));
  });
});

describe("nextMittBest — personal best per level", () => {
  const round = (accuracy, avgReactionMs, total = 12) => ({ total, hits: Math.round(accuracy * total), accuracy, avgReactionMs });
  it("the first full round sets the record", () => {
    expect(nextMittBest(null, round(0.5, 620))).toEqual({ best: { accuracy: 0.5, avgReactionMs: 620 }, isNew: true });
  });
  it("a more accurate round beats it; a less accurate one does not", () => {
    const prev = { accuracy: 0.75, avgReactionMs: 600 };
    expect(nextMittBest(prev, round(0.83, 700)).isNew).toBe(true);
    expect(nextMittBest(prev, round(0.5, 300))).toEqual({ best: prev, isNew: false });
  });
  it("same accuracy: the faster reaction wins", () => {
    const prev = { accuracy: 0.75, avgReactionMs: 600 };
    expect(nextMittBest(prev, round(0.75, 540)).best.avgReactionMs).toBe(540);
    expect(nextMittBest(prev, round(0.75, 640)).isNew).toBe(false);
    expect(nextMittBest(prev, round(0.75, null)).isNew).toBe(false);
  });
  it("a round finished early, or with no hit at all, never sets a record", () => {
    expect(nextMittBest(null, round(1, 300, MITT_BEST_MIN_CALLS - 1))).toEqual({ best: null, isNew: false });
    expect(nextMittBest(null, { total: 12, hits: 0, accuracy: 0, avgReactionMs: null })).toEqual({ best: null, isNew: false });
    expect(nextMittBest(null, null)).toEqual({ best: null, isNew: false });
  });
  it("junk in storage is ignored", () => {
    expect(nextMittBest({ accuracy: "x" }, round(0.4, 800)).isNew).toBe(true);
    expect(nextMittBest("oops", round(0.4, 800)).isNew).toBe(true);
  });
});

