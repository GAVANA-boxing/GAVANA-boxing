// Evolve — compact index of run records (evolve/runs-index.json) for the owner
// dashboard. The full records stay in docs/evaluations/runs/<id>.json.

export function summarizeRun(r) {
  return {
    id: r.id,
    task: r.task,
    verdict: r.verdict,
    commit: r.commit,
    at: r.finishedAt || r.startedAt,
    durationS: r.durationS ?? null,
    level: r.change?.level ?? null,
    failedSteps: (r.steps || []).filter((s) => s.status === "FAIL").map((s) => s.name),
    notRun: (r.steps || []).filter((s) => s.status === "NOT RUN").map((s) => s.name),
    metrics: Object.fromEntries((r.steps || []).filter((s) => s.metrics).flatMap((s) => Object.entries(s.metrics).map(([k, v]) => [`${s.name}.${k}`, v]))),
    decision: r.decision?.note ? "owner" : null,
  };
}

/** Insert or replace a run in the index (newest first, capped). */
export function upsertRun(index, record, cap = 300) {
  const runs = [summarizeRun(record), ...((index?.runs) || []).filter((x) => x.id !== record.id)]
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, cap);
  return { runs };
}
