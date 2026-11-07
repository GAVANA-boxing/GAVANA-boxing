// Evolve — task queue, lock lease, memory and cycle guards (pure).
//
// State lives in git on the authorized branch (evolve/*.json), so it survives
// process restarts and is shared by every session that runs a cycle. These
// functions only compute; scripts/evolve/cycle.mjs does the reading, writing,
// committing and pushing. Tested in tests/evolveQueue.test.js.

export const TASK = Object.freeze({ OPEN: "open", IN_PROGRESS: "in_progress", DONE: "done", BLOCKED: "blocked", RESOLVED: "resolved", GAVE_UP: "gave_up" });
export const MAX_ATTEMPTS = 2;
export const LEASE_MS = 45 * 60_000;

/**
 * Merge freshly observed findings into the queue.
 * - new fingerprint → OPEN task
 * - known OPEN / BLOCKED task → evidence refreshed
 * - OPEN task no longer observed → RESOLVED (revalidated against the repo, not trusted from memory)
 * - DONE / GAVE_UP tasks are never reopened automatically (a fresh finding gets a new attempt only
 *   when its evidence changed)
 */
export function mergeFindings(queue, findings, at) {
  const byFp = new Map((queue.tasks || []).map((t) => [t.fingerprint, t]));
  const seen = new Set();
  const tasks = [];
  for (const f of findings) {
    seen.add(f.fingerprint);
    const prev = byFp.get(f.fingerprint);
    if (!prev) {
      tasks.push({ ...f, status: f.risk === "RED" ? TASK.BLOCKED : TASK.OPEN, attempts: 0, createdAt: at, updatedAt: at, history: [] });
      continue;
    }
    const evidenceChanged = JSON.stringify(prev.evidence) !== JSON.stringify(f.evidence);
    let status = prev.status;
    if ((status === TASK.DONE || status === TASK.RESOLVED) && evidenceChanged) status = f.risk === "RED" ? TASK.BLOCKED : TASK.OPEN;
    tasks.push({ ...prev, ...f, status, attempts: status === TASK.OPEN && prev.status !== TASK.OPEN ? 0 : prev.attempts, updatedAt: at, history: prev.history || [] });
  }
  for (const t of queue.tasks || []) {
    if (seen.has(t.fingerprint)) continue;
    const gone = t.status === TASK.OPEN || t.status === TASK.BLOCKED;
    tasks.push(gone && t.source !== "manual" ? { ...t, status: TASK.RESOLVED, updatedAt: at } : t);
  }
  return { ...queue, tasks: tasks.sort((a, b) => b.priority - a.priority || a.fingerprint.localeCompare(b.fingerprint)) };
}

/** The next task a cycle may take: OPEN, not RED, attempts left. Highest priority first. */
export function pickNext(queue) {
  return (queue.tasks || []).find((t) => t.status === TASK.OPEN && t.risk !== "RED" && t.attempts < MAX_ATTEMPTS) || null;
}

/** Record a cycle's outcome on its task. */
export function settleTask(queue, fingerprint, { outcome, runId, commit, note, at }) {
  return {
    ...queue,
    tasks: queue.tasks.map((t) => {
      if (t.fingerprint !== fingerprint) return t;
      const attempts = t.attempts + (outcome === "ACCEPTED" ? 0 : 1);
      const status = outcome === "ACCEPTED" ? TASK.DONE
        : outcome === "BLOCKED" || outcome === "AWAITING_APPROVAL" ? TASK.BLOCKED
        : attempts >= MAX_ATTEMPTS ? TASK.GAVE_UP : TASK.OPEN;
      return { ...t, status, attempts, updatedAt: at, history: [...(t.history || []), { at, outcome, runId: runId || null, commit: commit || null, note: note || "" }] };
    }),
  };
}

/** Is the lock held by someone else right now? (expired leases can be taken over) */
export function lockState(lock, nowMs) {
  if (!lock) return { held: false };
  const until = Date.parse(lock.leaseUntil);
  if (!Number.isFinite(until) || until <= nowMs) return { held: false, stale: true, lock };
  return { held: true, lock };
}

export function newLock({ cycleId, holder, nowMs }) {
  return { cycleId, holder, acquiredAt: new Date(nowMs).toISOString(), leaseUntil: new Date(nowMs + LEASE_MS).toISOString() };
}

/**
 * May a new cycle start? Checks the kill switch, the daily budget and the
 * failure breaker (N cycles in a row without an ACCEPTED change → halt until
 * the owner clears it by setting control.clearFailuresBefore).
 */
export function cycleGate(control, memory, nowMs) {
  if (control?.paused) return { ok: false, reason: "PAUSED", note: control.pausedNote || "kill switch on (evolve/control.json)" };
  const day = new Date(nowMs).toISOString().slice(0, 10);
  const cycles = memory?.cycles || [];
  const today = cycles.filter((c) => (c.at || "").slice(0, 10) === day).length;
  const max = control?.maxCyclesPerDay ?? 40;
  if (today >= max) return { ok: false, reason: "BUDGET", note: `${today}/${max} cycles today` };
  const clear = Date.parse(control?.clearFailuresBefore || 0) || 0;
  const recent = cycles.filter((c) => Date.parse(c.at) > clear).slice(-(control?.failureBreaker ?? 3));
  const breaker = control?.failureBreaker ?? 3;
  if (recent.length >= breaker && recent.every((c) => c.outcome === "REJECTED" || c.outcome === "FAILED")) {
    return { ok: false, reason: "HALTED", note: `${breaker} cycles in a row failed — owner must review and set clearFailuresBefore` };
  }
  return { ok: true, today, max };
}

/** Append a cycle to memory (most recent last, capped). */
export function remember(memory, entry, cap = 500) {
  const cycles = [...(memory?.cycles || []), entry];
  return { ...memory, cycles: cycles.slice(-cap) };
}
