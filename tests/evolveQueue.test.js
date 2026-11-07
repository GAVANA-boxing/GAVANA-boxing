import { describe, it, expect } from "vitest";
import { TASK, MAX_ATTEMPTS, LEASE_MS, mergeFindings, pickNext, settleTask, lockState, newLock, cycleGate, remember } from "@/lib/evolve/queue";

const f = (fp, priority = 50, risk = "GREEN", evidence = ["x"]) => ({ fingerprint: fp, kind: "k", title: fp, priority, risk, evidence, files: [fp] });
const T0 = "2026-11-07T00:00:00Z";

describe("queue", () => {
  it("adds findings, RED ones start blocked, highest priority first", () => {
    const q = mergeFindings({ tasks: [] }, [f("a", 10), f("b", 90), f("c", 50, "RED")], T0);
    expect(q.tasks.map((t) => t.fingerprint)).toEqual(["b", "c", "a"]);
    expect(q.tasks.find((t) => t.fingerprint === "c").status).toBe(TASK.BLOCKED);
    expect(pickNext(q).fingerprint).toBe("b");
  });

  it("resolves tasks whose evidence is gone (revalidated, not remembered)", () => {
    let q = mergeFindings({ tasks: [] }, [f("a"), f("b")], T0);
    q = mergeFindings(q, [f("b")], "t2");
    expect(q.tasks.find((t) => t.fingerprint === "a").status).toBe(TASK.RESOLVED);
    expect(q.tasks.find((t) => t.fingerprint === "b").status).toBe(TASK.OPEN);
  });

  it("keeps manual tasks even when no scanner sees them", () => {
    const q = mergeFindings({ tasks: [{ ...f("m"), source: "manual", status: TASK.OPEN, attempts: 0 }] }, [], T0);
    expect(q.tasks[0].status).toBe(TASK.OPEN);
  });

  it("settles outcomes: done, retry, give up after two failures, blocked", () => {
    let q = mergeFindings({ tasks: [] }, [f("a"), f("b"), f("c")], T0);
    q = settleTask(q, "a", { outcome: "ACCEPTED", runId: "r1", commit: "abc", at: "t1" });
    expect(q.tasks.find((t) => t.fingerprint === "a")).toMatchObject({ status: TASK.DONE, attempts: 0 });
    q = settleTask(q, "b", { outcome: "REJECTED", at: "t1" });
    expect(q.tasks.find((t) => t.fingerprint === "b")).toMatchObject({ status: TASK.OPEN, attempts: 1 });
    q = settleTask(q, "b", { outcome: "REJECTED", at: "t2" });
    expect(q.tasks.find((t) => t.fingerprint === "b")).toMatchObject({ status: TASK.GAVE_UP, attempts: MAX_ATTEMPTS });
    q = settleTask(q, "c", { outcome: "AWAITING_APPROVAL", at: "t1" });
    expect(q.tasks.find((t) => t.fingerprint === "c").status).toBe(TASK.BLOCKED);
    expect(pickNext(q)).toBe(null);
    expect(q.tasks.find((t) => t.fingerprint === "a").history.at(-1)).toMatchObject({ outcome: "ACCEPTED", commit: "abc" });
  });

  it("doesn't reopen a done task unless its evidence changed", () => {
    let q = mergeFindings({ tasks: [] }, [f("a", 50, "GREEN", ["line 1"])], T0);
    q = settleTask(q, "a", { outcome: "ACCEPTED", at: "t1" });
    expect(mergeFindings(q, [f("a", 50, "GREEN", ["line 1"])], "t2").tasks[0].status).toBe(TASK.DONE);
    expect(mergeFindings(q, [f("a", 50, "GREEN", ["line 9"])], "t2").tasks[0].status).toBe(TASK.OPEN);
  });
});

describe("lock lease", () => {
  it("is held until the lease runs out, then can be taken over", () => {
    const now = Date.parse(T0);
    const lock = newLock({ cycleId: "c1", holder: "s1", nowMs: now });
    expect(lockState(lock, now + 1000).held).toBe(true);
    expect(lockState(lock, now + LEASE_MS + 1)).toMatchObject({ held: false, stale: true });
    expect(lockState(null, now).held).toBe(false);
    expect(lockState({ leaseUntil: "garbage" }, now).held).toBe(false);
  });
});

describe("cycle gate", () => {
  const now = Date.parse("2026-11-07T12:00:00Z");
  const cyc = (outcome, at = "2026-11-07T10:00:00Z") => ({ outcome, at });

  it("kill switch stops everything", () => {
    expect(cycleGate({ paused: true }, {}, now)).toMatchObject({ ok: false, reason: "PAUSED" });
  });
  it("daily budget", () => {
    const mem = { cycles: Array.from({ length: 4 }, () => cyc("ACCEPTED")) };
    expect(cycleGate({ maxCyclesPerDay: 4 }, mem, now)).toMatchObject({ ok: false, reason: "BUDGET" });
    expect(cycleGate({ maxCyclesPerDay: 5 }, mem, now).ok).toBe(true);
    expect(cycleGate({ maxCyclesPerDay: 4 }, { cycles: [cyc("ACCEPTED", "2026-11-06T10:00:00Z")] }, now).ok).toBe(true);
  });
  it("failure breaker halts after N failed cycles in a row until the owner clears it", () => {
    const mem = { cycles: [cyc("ACCEPTED", "2026-11-07T01:00:00Z"), cyc("REJECTED", "2026-11-07T02:00:00Z"), cyc("FAILED", "2026-11-07T03:00:00Z"), cyc("REJECTED", "2026-11-07T04:00:00Z")] };
    expect(cycleGate({}, mem, now)).toMatchObject({ ok: false, reason: "HALTED" });
    expect(cycleGate({ clearFailuresBefore: "2026-11-07T05:00:00Z" }, mem, now).ok).toBe(true);
    expect(cycleGate({}, { cycles: [...mem.cycles, cyc("ACCEPTED", "2026-11-07T06:00:00Z")] }, now).ok).toBe(true);
  });
  it("memory is capped", () => {
    let m = {};
    for (let i = 0; i < 10; i++) m = remember(m, { i }, 3);
    expect(m.cycles.map((c) => c.i)).toEqual([7, 8, 9]);
  });
});
