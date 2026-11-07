// Evolve — the life of one engineering run (Engineer AI MVP).
//
// A run is one task taken from idea to a final state. The states and the legal
// moves between them come from the owner's Evolve directive:
//
//   PENDING → PLANNING → IMPLEMENTING → VERIFYING → EVALUATING → ACCEPTED
//                                                              ↘ REJECTED
//   any non-final state → BLOCKED | FAILED | CANCELLED
//   EVALUATING → AWAITING_APPROVAL → ACCEPTED | REJECTED | CANCELLED
//   VERIFYING / EVALUATING → IMPLEMENTING (a retry after a fix, counted)
//
// Pure: no I/O, no clock (callers pass `at`). Every move is appended to the
// run's history so the record shows how it got where it is.

export const RUN = Object.freeze({
  PENDING: "PENDING",
  PLANNING: "PLANNING",
  IMPLEMENTING: "IMPLEMENTING",
  VERIFYING: "VERIFYING",
  EVALUATING: "EVALUATING",
  AWAITING_APPROVAL: "AWAITING_APPROVAL",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  BLOCKED: "BLOCKED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
});

const R = RUN;
export const TERMINAL = Object.freeze([R.ACCEPTED, R.REJECTED, R.BLOCKED, R.FAILED, R.CANCELLED]);
export const MAX_RETRIES = 2; // the engineering rules allow at most two fix attempts per task

const STOP = [R.BLOCKED, R.FAILED, R.CANCELLED];
const NEXT = {
  [R.PENDING]: [R.PLANNING, ...STOP],
  [R.PLANNING]: [R.IMPLEMENTING, R.REJECTED, ...STOP],          // REJECTED: nothing worth doing
  [R.IMPLEMENTING]: [R.VERIFYING, ...STOP],
  [R.VERIFYING]: [R.EVALUATING, R.IMPLEMENTING, ...STOP],
  [R.EVALUATING]: [R.ACCEPTED, R.REJECTED, R.AWAITING_APPROVAL, R.IMPLEMENTING, ...STOP],
  [R.AWAITING_APPROVAL]: [R.ACCEPTED, R.REJECTED, R.CANCELLED],
};

export const isTerminal = (state) => TERMINAL.includes(state);

export function canMove(from, to) {
  return (NEXT[from] || []).includes(to);
}

/** A new run record. `key` makes the run idempotent (same task + same code → same key). */
export function createRun({ id, key, task, at }) {
  if (!id || !key || !task) throw new Error("createRun needs id, key and task");
  return { id, key, task, state: R.PENDING, retries: 0, history: [{ state: R.PENDING, at, note: "created" }] };
}

/**
 * Move a run. Throws on an illegal move (so a broken orchestrator can't skip
 * verification), when the run is already final, or when retries run out.
 * Moving to AWAITING_APPROVAL / ACCEPTED-after-approval needs a `note`.
 */
export function move(run, to, { at, note = "" } = {}) {
  if (isTerminal(run.state)) throw new Error(`run ${run.id} is already ${run.state}`);
  if (!canMove(run.state, to)) throw new Error(`illegal move ${run.state} → ${to}`);
  let retries = run.retries;
  if (to === R.IMPLEMENTING && (run.state === R.VERIFYING || run.state === R.EVALUATING)) {
    retries += 1;
    if (retries > MAX_RETRIES) throw new Error(`run ${run.id}: more than ${MAX_RETRIES} fix attempts — stop and report`);
  }
  if ((to === R.AWAITING_APPROVAL || run.state === R.AWAITING_APPROVAL) && !note) {
    throw new Error("approval steps need a note (what is waiting / who approved)");
  }
  return { ...run, state: to, retries, history: [...run.history, { state: to, at, note }] };
}

/** Same task + same commit + same working-tree diff → same key. */
export function runKey({ task, commit, diffHash }) {
  const s = `${task}\u0000${commit}\u0000${diffHash || ""}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, "0");
}
