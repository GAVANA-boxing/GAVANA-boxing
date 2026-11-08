// Firestore documents → dashboard model. Pure functions (no Firebase imports), unit-tested in
// tests/dashboardMappers.test.ts. Unknown / malformed fields become null — never invented values.
import type {
  BenchmarkAxis, BenchmarkAxisValue, BenchmarkComparison, BenchmarkSource, BiomechanicsSummary,
  Confidence, DashboardError, DashboardErrorCode, ISODate, Money, OrderLine, OrderStatus, OrderSummary,
  PunchType, SessionAnalytics, VideoAnalysis, VideoAnalysisStatus,
} from "./types";

type Doc = Record<string, unknown>;
const PUNCH_TYPES: PunchType[] = ["jab", "cross", "hook", "uppercut"];

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);
const obj = (v: unknown): Doc => (v && typeof v === "object" ? (v as Doc) : {});
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

/** Firestore Timestamp | {seconds} | Date | ISO string | ms → ISO string ("" if unknown). */
export function toIso(v: unknown): ISODate {
  if (!v) return "";
  if (typeof v === "string") return Number.isNaN(Date.parse(v)) ? "" : new Date(v).toISOString();
  if (typeof v === "number") return new Date(v).toISOString();
  if (v instanceof Date) return v.toISOString();
  const o = v as { toDate?: () => Date; seconds?: number };
  if (typeof o.toDate === "function") return o.toDate().toISOString();
  if (typeof o.seconds === "number") return new Date(o.seconds * 1000).toISOString();
  return "";
}

// ── Sessions ───────────────────────────────────────────────────────────────
const FORM_CHECKS = ["guardHeight", "stanceWidth", "punchExtension", "rotation", "balance"] as const;

export function mapSession(id: string, d: Doc): SessionAnalytics {
  const pm = obj(d.poseMetrics);
  const pb = obj(pm.punchBreakdown);
  const vs = obj(pm.velocityStats);
  const byType = Object.fromEntries(PUNCH_TYPES.map((t) => [t, num(obj(pb[t]).count) ?? 0])) as Record<PunchType, number>;
  let passed = 0;
  let total = 0;
  for (const k of FORM_CHECKS) {
    const status = str(obj(pm[k]).status);
    if (!status) continue;
    total++;
    if (status === "good") passed++;
  }
  const rating = str(vs.snapRating);
  const conf = str(pm.sessionConfidence);
  const guard = str(obj(pm.guardHeight).status);
  const balance = str(obj(pm.balance).status);
  return {
    id,
    createdAt: toIso(d.createdAt),
    score: clamp(num(d.score) ?? 0, 0, 10),
    durationSec: num(d.durationSeconds) ?? 0,
    punches: num(pm.punchCount) ?? num(d.hitCount) ?? 0,
    byType,
    speed: {
      avgReturnMs: num(vs.avgRecoilMs),
      snapIndex: num(vs.avgSnapVelocity),
      rating: rating === "FAST" || rating === "MODERATE" || rating === "SLOW" ? rating : null,
    },
    technique: { score: total ? Math.round((passed / total) * 100) : null, checksPassed: passed, checksTotal: total },
    balance: { status: balance === "good" || balance === "off_balance" ? balance : null },
    guard: { status: guard === "good" || guard === "too_low" || guard === "too_high" ? guard : null },
    confidence: (conf === "high" || conf === "medium" || conf === "low" ? conf : "none") as Confidence,
  };
}

const mean = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const pctOf = (xs: boolean[]): number | null => (xs.length ? Math.round((xs.filter(Boolean).length / xs.length) * 100) : null);

/** sessions newest → oldest (as queried); the trend is returned oldest → newest. */
export function buildBiomechanics(sessions: SessionAnalytics[]): BiomechanicsSummary {
  const punchMix = Object.fromEntries(PUNCH_TYPES.map((t) => [t, 0])) as Record<PunchType, number>;
  for (const s of sessions) for (const t of PUNCH_TYPES) punchMix[t] += s.byType[t];
  const returns = sessions.map((s) => s.speed.avgReturnMs).filter((v): v is number => v != null);
  const tech = sessions.map((s) => s.technique.score).filter((v): v is number => v != null);
  const bal = sessions.filter((s) => s.balance.status).map((s) => s.balance.status === "good");
  const grd = sessions.filter((s) => s.guard.status).map((s) => s.guard.status === "good");
  const avgReturn = mean(returns);
  const avgTech = mean(tech);
  return {
    sessionsInWindow: sessions.length,
    trend: [...sessions].reverse().map((s) => ({
      date: s.createdAt, score: s.score, techniquePct: s.technique.score, avgReturnMs: s.speed.avgReturnMs,
    })),
    punchMix,
    avgReturnMs: avgReturn == null ? null : Math.round(avgReturn),
    techniquePct: avgTech == null ? null : Math.round(avgTech),
    balancedPct: pctOf(bal),
    guardGoodPct: pctOf(grd),
    latest: sessions[0] ?? null,
  };
}

// ── Benchmark comparison ───────────────────────────────────────────────────
/** The ONE normalisation used for both the fighter and the benchmark (so axes compare). */
export function normalizeAxes(input: {
  avgReturnMs: number | null; techniquePct: number | null; guardGoodPct: number | null;
  balancedPct: number | null; punchesPerMin: number | null; punchMix: Record<PunchType, number> | null;
}): Record<BenchmarkAxis, number | null> {
  // speed: 200 ms return → 100, 700 ms → 0
  const speed = input.avgReturnMs == null ? null : Math.round(clamp((700 - input.avgReturnMs) / 5, 0, 100));
  // volume: 0 → 0, 120 punches/min → 100
  const volume = input.punchesPerMin == null ? null : Math.round(clamp((input.punchesPerMin / 120) * 100, 0, 100));
  // variety: Shannon entropy of the jab/cross/hook/uppercut mix, normalised to 0..100
  let variety: number | null = null;
  if (input.punchMix) {
    const counts = PUNCH_TYPES.map((t) => input.punchMix![t]);
    const total = counts.reduce((a, b) => a + b, 0);
    if (total > 0) {
      const h = counts.filter((c) => c > 0).reduce((acc, c) => acc - (c / total) * Math.log2(c / total), 0);
      variety = Math.round((h / Math.log2(PUNCH_TYPES.length)) * 100);
    }
  }
  return {
    speed, technique: input.techniquePct, guard: input.guardGoodPct, balance: input.balancedPct, volume, variety,
  };
}

export function fighterAxes(bio: BiomechanicsSummary, sessions: SessionAnalytics[]) {
  const minutes = sessions.reduce((a, s) => a + s.durationSec, 0) / 60;
  const punches = sessions.reduce((a, s) => a + s.punches, 0);
  return normalizeAxes({
    avgReturnMs: bio.avgReturnMs, techniquePct: bio.techniquePct, guardGoodPct: bio.guardGoodPct,
    balancedPct: bio.balancedPct, punchesPerMin: minutes > 0 ? punches / minutes : null, punchMix: bio.punchMix,
  });
}

const AXES: BenchmarkAxis[] = ["speed", "technique", "guard", "balance", "volume", "variety"];

/** benchmarks/{id}: { label:{mn,ko,en}, kind, athletes, clips, updatedAt, axes:{speed:0..100,…} }.
 *  Returns null when the doc is missing or has no provenance — we never compare against nothing. */
export function mapBenchmark(id: string, d: Doc | null, you: Record<BenchmarkAxis, number | null>): BenchmarkComparison | null {
  if (!d) return null;
  const label = obj(d.label);
  const kind = str(d.kind);
  const athletes = num(d.athletes);
  const clips = num(d.clips);
  if (!str(label.en) || !athletes || !clips || (kind !== "coach" && kind !== "partner-athletes" && kind !== "community")) return null;
  const axesDoc = obj(d.axes);
  const axes: BenchmarkAxisValue[] = AXES
    .map((axis) => ({ axis, you: you[axis], benchmark: num(axesDoc[axis]) }))
    .filter((a): a is BenchmarkAxisValue => a.benchmark != null)
    .map((a) => ({ ...a, benchmark: clamp(a.benchmark, 0, 100) }));
  if (axes.length < 3) return null; // a radar needs at least 3 axes
  const source: BenchmarkSource = {
    id,
    label: { mn: str(label.mn) ?? String(label.en), ko: str(label.ko) ?? String(label.en), en: String(label.en) },
    kind, athletes, clips, updatedAt: toIso(d.updatedAt),
  };
  return { source, axes };
}

// ── Videos ─────────────────────────────────────────────────────────────────
const VIDEO_STATUSES: VideoAnalysisStatus[] = ["queued", "processing", "completed", "failed"];

export function mapVideo(id: string, d: Doc): VideoAnalysis {
  const status = VIDEO_STATUSES.includes(d.status as VideoAnalysisStatus) ? (d.status as VideoAnalysisStatus) : "queued";
  const completed = status === "completed";
  const progress = num(d.progressPct);
  return {
    id,
    createdAt: toIso(d.createdAt),
    status,
    progressPct: status === "processing" && progress != null ? clamp(Math.round(progress), 0, 100) : null,
    durationSec: num(d.durationSec),
    thumbnailUrl: str(d.thumbnailUrl),
    score: completed ? (num(d.score) == null ? null : round1(clamp(num(d.score)!, 0, 10))) : null,
    punches: completed ? num(d.punches) : null,
    poseFramesPct: completed ? num(d.poseFramesPct) : null,
    error: status === "failed" ? (str(d.error) ?? "unknown") : null,
  };
}

// ── Orders ─────────────────────────────────────────────────────────────────
const ORDER_STATUSES: OrderStatus[] = ["pending_payment", "paid", "fulfilling", "shipped", "delivered", "cancelled", "refunded"];
const money = (v: unknown): Money => ({ amount: Math.max(0, Math.round(num(obj(v).amount) ?? 0)), currency: "MNT" });

export function mapOrder(id: string, d: Doc): OrderSummary {
  const items: OrderLine[] = (Array.isArray(d.items) ? d.items : []).map((raw) => {
    const it = obj(raw);
    return {
      productId: str(it.productId) ?? "",
      title: str(it.title) ?? "",
      variant: str(it.variant),
      qty: Math.max(1, Math.round(num(it.qty) ?? 1)),
      unitPrice: money(it.unitPrice),
      imageUrl: str(it.imageUrl),
    };
  });
  return {
    id,
    createdAt: toIso(d.createdAt),
    status: ORDER_STATUSES.includes(d.status as OrderStatus) ? (d.status as OrderStatus) : "pending_payment",
    total: money(d.total),
    items,
    trackingUrl: str(d.trackingUrl),
  };
}

/** Orders still moving (shown in the "active orders" card). */
export const isActiveOrder = (o: OrderSummary) => o.status === "paid" || o.status === "fulfilling" || o.status === "shipped" || o.status === "pending_payment";

// ── Errors ─────────────────────────────────────────────────────────────────
export function toDashboardError(err: unknown): DashboardError {
  const code = String((err as { code?: string })?.code || "").replace(/^firestore\//, "");
  const known: Record<string, DashboardErrorCode> = {
    "permission-denied": "permission-denied", unavailable: "unavailable", "deadline-exceeded": "unavailable",
    "not-found": "not-found", unauthenticated: "unauthenticated", "failed-precondition": "unavailable",
  };
  const mapped = known[code] ?? "unknown";
  return {
    code: mapped,
    message: String((err as { message?: string })?.message || mapped).slice(0, 200),
    retryable: mapped === "unavailable" || mapped === "unknown",
  };
}
