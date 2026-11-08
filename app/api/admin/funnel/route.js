import { withAdmin } from "@/lib/withAuth";
import { firestoreRunQuery } from "@/lib/server/firestore";
import { FUNNEL_STEPS } from "@/lib/funnelSteps";

// Admin-only activation funnel. Aggregates analytics_events (written by
// /api/analytics from lib/funnel.js) into:
//   - a NEW-user cohort funnel: browsers whose first-ever funnel event falls in
//     the window, and how many of them reached each step;
//   - time-to-wow (ms from Train opened to first result) p50/p75;
//   - camera-denied count (the classic silent drop-off);
//   - D1 / D7 retention from app_opened days.

const MAX_DOCS = 20000;
const DAY = 86_400_000;

function pct(n, d) {
  return d > 0 ? Math.round((n / d) * 1000) / 10 : 0;
}

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const i = Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)));
  return sorted[i];
}

const dayIndex = (iso) => Math.floor(new Date(iso).getTime() / DAY);

export const GET = withAdmin(async (req) => {
  const url = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days")) || 7));
  const since = new Date(Date.now() - days * DAY).toISOString();

  let rows;
  try {
    rows = await firestoreRunQuery({
      from: [{ collectionId: "analytics_events" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "createdAt" },
          op: "GREATER_THAN_OR_EQUAL",
          value: { timestampValue: since },
        },
      },
      select: {
        fields: ["event", "anonId", "first", "ms", "createdAt"].map((fieldPath) => ({ fieldPath })),
      },
      limit: MAX_DOCS,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "service-account-unconfigured") {
      return Response.json({ error: "Analytics not configured" }, { status: 503 });
    }
    console.error("[admin/funnel]", err);
    return Response.json({ error: "Query failed" }, { status: 500 });
  }

  // Only events that carry a funnel identity.
  const events = rows.filter((r) => r.anonId);

  // Cohort = browsers that hit ANY step for the first time inside the window.
  const cohort = new Set(events.filter((e) => e.first === true).map((e) => e.anonId));

  // Who in the cohort reached each step (any occurrence counts).
  const reached = new Map(FUNNEL_STEPS.map((s) => [s.key, new Set()]));
  for (const e of events) {
    if (!cohort.has(e.anonId)) continue;
    reached.get(e.event)?.add(e.anonId);
  }

  const top = reached.get(FUNNEL_STEPS[0].key).size || cohort.size;
  let prev = null;
  const steps = FUNNEL_STEPS.map((s) => {
    const n = reached.get(s.key).size;
    const row = {
      key: s.key, mn: s.mn, en: s.en, ko: s.ko,
      reached: n,
      pctOfTop: pct(n, top),
      pctOfPrev: prev == null ? 100 : pct(n, prev),
    };
    prev = n;
    return row;
  });

  // Time-to-wow: first result_viewed per browser.
  const wow = events
    .filter((e) => e.event === "result_viewed" && e.first === true && Number(e.ms) > 0)
    .map((e) => Number(e.ms))
    .sort((a, b) => a - b);

  // Core-loop KPIs (docs/research/2026-11-08-research-digest.md), always with n / N:
  //   retry — of the cohort who saw a result, how many started another round in a visit;
  //   timer — browsers that ran a camera-less timer round; signupToSave — guests who tapped
  //   "sign up to keep this round" on a result.
  const cohortWith = (name) => new Set(events.filter((e) => e.event === name && cohort.has(e.anonId)).map((e) => e.anonId));
  const sawResult = cohortWith("result_viewed");
  const retried = [...cohortWith("retry_round")].filter((id) => sawResult.has(id)).length;
  const retry = { rate: pct(retried, sawResult.size), n: retried, of: sawResult.size };
  const timerRounds = cohortWith("timer_round_started").size;
  const signupToSave = { n: cohortWith("signup_to_save").size, of: sawResult.size };

  const cameraDenied = new Set(
    events.filter((e) => e.event === "camera_denied" && cohort.has(e.anonId)).map((e) => e.anonId),
  ).size;

  // Retention from app_opened days (UTC day buckets).
  const openDays = new Map(); // anonId -> Set(dayIndex)
  for (const e of events) {
    if (e.event !== "app_opened" || !e.createdAt) continue;
    if (!openDays.has(e.anonId)) openDays.set(e.anonId, new Set());
    openDays.get(e.anonId).add(dayIndex(e.createdAt));
  }
  const today = Math.floor(Date.now() / DAY);
  const retention = (offset) => {
    let eligible = 0;
    let returned = 0;
    for (const [id, set] of openDays) {
      if (!cohort.has(id)) continue;
      const firstDay = Math.min(...set);
      if (firstDay + offset > today) continue; // not old enough to measure
      eligible++;
      if (set.has(firstDay + offset)) returned++;
    }
    return { rate: pct(returned, eligible), returned, eligible };
  };

  return Response.json({
    days,
    totalEvents: rows.length,
    truncated: rows.length >= MAX_DOCS,
    cohortSize: cohort.size,
    steps,
    cameraDenied,
    retry,
    timerRounds,
    signupToSave,
    timeToWowMs: { p50: quantile(wow, 0.5), p75: quantile(wow, 0.75), n: wow.length },
    retention: { d1: retention(1), d7: retention(7), d30: retention(30) },
  });
});
