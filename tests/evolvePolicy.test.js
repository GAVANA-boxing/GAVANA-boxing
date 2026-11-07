import { describe, it, expect } from "vitest";
import { RUN, TERMINAL, MAX_RETRIES, createRun, move, canMove, isTerminal, runKey } from "@/lib/evolve/runState";
import { classifyPath, classifyChange, canAutoAccept } from "@/lib/evolve/policy";

const walk = (run, states) => states.reduce((r, s, i) => move(r, s, { at: i + 1, note: s === RUN.AWAITING_APPROVAL || r.state === RUN.AWAITING_APPROVAL ? "test" : "" }), run);
const fresh = () => createRun({ id: "r1", key: "k1", task: "fix label", at: 0 });

describe("run state machine", () => {
  it("walks the happy path and records every step", () => {
    const r = walk(fresh(), [RUN.PLANNING, RUN.IMPLEMENTING, RUN.VERIFYING, RUN.EVALUATING, RUN.ACCEPTED]);
    expect(r.state).toBe(RUN.ACCEPTED);
    expect(r.history.map((h) => h.state)).toEqual([RUN.PENDING, RUN.PLANNING, RUN.IMPLEMENTING, RUN.VERIFYING, RUN.EVALUATING, RUN.ACCEPTED]);
    expect(isTerminal(r.state)).toBe(true);
  });

  it("can't skip verification or evaluation", () => {
    const impl = walk(fresh(), [RUN.PLANNING, RUN.IMPLEMENTING]);
    expect(() => move(impl, RUN.ACCEPTED, { at: 9 })).toThrow(/illegal/);
    expect(() => move(impl, RUN.EVALUATING, { at: 9 })).toThrow(/illegal/);
    expect(canMove(RUN.PENDING, RUN.IMPLEMENTING)).toBe(false);
  });

  it("final states are final", () => {
    const done = walk(fresh(), [RUN.PLANNING, RUN.REJECTED]);
    for (const s of Object.values(RUN)) expect(() => move(done, s, { at: 9, note: "x" })).toThrow();
    expect(TERMINAL).toContain(RUN.CANCELLED);
  });

  it("allows at most two fix attempts", () => {
    let r = walk(fresh(), [RUN.PLANNING, RUN.IMPLEMENTING, RUN.VERIFYING]);
    for (let k = 1; k <= MAX_RETRIES; k++) {
      r = move(r, RUN.IMPLEMENTING, { at: 10 + k });
      expect(r.retries).toBe(k);
      r = move(r, RUN.VERIFYING, { at: 20 + k });
    }
    expect(() => move(r, RUN.IMPLEMENTING, { at: 99 })).toThrow(/fix attempts/);
  });

  it("approval needs a note going in and coming out", () => {
    const ev = walk(fresh(), [RUN.PLANNING, RUN.IMPLEMENTING, RUN.VERIFYING, RUN.EVALUATING]);
    expect(() => move(ev, RUN.AWAITING_APPROVAL, { at: 9 })).toThrow(/note/);
    const waiting = move(ev, RUN.AWAITING_APPROVAL, { at: 9, note: "touches firestore.rules" });
    expect(() => move(waiting, RUN.ACCEPTED, { at: 10 })).toThrow(/note/);
    expect(move(waiting, RUN.ACCEPTED, { at: 10, note: "owner approved" }).state).toBe(RUN.ACCEPTED);
    expect(() => move(waiting, RUN.IMPLEMENTING, { at: 10, note: "x" })).toThrow(/illegal/);
  });

  it("any open run can be blocked, failed or cancelled", () => {
    for (const s of [RUN.PENDING, RUN.PLANNING, RUN.IMPLEMENTING, RUN.VERIFYING, RUN.EVALUATING]) {
      let r = fresh();
      const path = { [RUN.PENDING]: [], [RUN.PLANNING]: [RUN.PLANNING], [RUN.IMPLEMENTING]: [RUN.PLANNING, RUN.IMPLEMENTING], [RUN.VERIFYING]: [RUN.PLANNING, RUN.IMPLEMENTING, RUN.VERIFYING], [RUN.EVALUATING]: [RUN.PLANNING, RUN.IMPLEMENTING, RUN.VERIFYING, RUN.EVALUATING] }[s];
      r = walk(r, path);
      for (const stop of [RUN.BLOCKED, RUN.FAILED, RUN.CANCELLED]) expect(move(r, stop, { at: 50 }).state).toBe(stop);
    }
  });

  it("needs id, key and task; keys are stable and change with the code", () => {
    expect(() => createRun({ id: "x", task: "t" })).toThrow();
    const a = runKey({ task: "t", commit: "abc", diffHash: "d1" });
    expect(runKey({ task: "t", commit: "abc", diffHash: "d1" })).toBe(a);
    expect(runKey({ task: "t", commit: "abc", diffHash: "d2" })).not.toBe(a);
    expect(runKey({ task: "t", commit: "abd", diffHash: "d1" })).not.toBe(a);
    expect(a).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("change policy", () => {
  it("marks security, money, scoring, detector, deploy and dependency files RED", () => {
    for (const p of ["firestore.rules", "storage.rules", "lib/xp.js", "lib/domain/scoreGuard.js", "app/api/score/session/route.js",
      "lib/punchPhaseDetector.js", "functions/index.js", "app/api/stripe/checkout/route.js", "next.config.mjs", ".github/workflows/ci.yml",
      "package.json", "package-lock.json", "app/api/admin/funnel/route.js", "lib/withAuth.js", ".env.local"]) {
      expect(classifyPath(p).level, p).toBe("RED");
    }
  });

  it("the automation can't loosen its own guardrails without the owner", () => {
    for (const p of ["lib/evolve/policy.js", "lib/evolve/runState.js", "scripts/evolve/check.mjs", "docs/evaluations/baseline.json", "docs/AI_ENGINEERING_RULES.md"]) {
      expect(classifyPath(p).level, p).toBe("RED");
    }
    expect(classifyPath("docs/evaluations/runs/x.json").level).toBe("GREEN");
    expect(classifyPath("docs/evaluations/baseline.md").level).toBe("GREEN");
  });

  it("server code and hooks are YELLOW, UI / docs / tests GREEN, unknown YELLOW", () => {
    expect(classifyPath("app/api/chat/route.js").level).toBe("YELLOW");
    expect(classifyPath("hooks/useCameraSession.js").level).toBe("YELLOW");
    expect(classifyPath("lib/server/firestore.js").level).toBe("YELLOW");
    for (const p of ["components/train/FightHud.js", "app/[locale]/train/page.js", "lib/fightHud.js", "docs/x.md", "tests/a.test.js", "README.md", "scripts/punch-eval/metrics.mjs", "firebase.rules-test.json", ".gitignore"]) {
      expect(classifyPath(p).level, p).toBe("GREEN");
    }
    expect(classifyPath("weird/place.txt").level).toBe("YELLOW");
  });

  it("a change is as risky as its riskiest file; RED can't be auto-accepted", () => {
    const ui = classifyChange(["components/a.js", "docs/b.md"]);
    expect(ui.level).toBe("GREEN");
    expect(canAutoAccept(ui)).toBe(true);
    const mixed = classifyChange(["components/a.js", "firestore.rules"]);
    expect(mixed.level).toBe("RED");
    expect(mixed.red.map((f) => f.path)).toEqual(["firestore.rules"]);
    expect(canAutoAccept(mixed)).toBe(false);
    expect(classifyChange([]).level).toBe("GREEN");
  });
});
