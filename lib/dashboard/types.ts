// Fighter dashboard — data model. Every number here is something the app really measures or
// stores; nothing is a decorative estimate. Units are in the names.
//
// Sources (Firestore):
//   users/{uid}                      → profile, rank, streak, stats aggregates (server-written)
//   training_sessions (userId==uid)  → per-round MediaPipe analytics (lib/trainingSessionDoc.js)
//   video_analyses (userId==uid)     → uploaded clips analysed in the browser (status lifecycle)
//   benchmarks/{sourceId}            → reference profiles with provenance (who, how many clips)
//   orders (userId==uid)             → shop orders (written by the server / payment webhook)

export type Locale = "mn" | "ko" | "en";
/** ISO-8601 string (client-side; Firestore Timestamps are converted in lib/dashboard/mappers). */
export type ISODate = string;

export type ArchetypeKey = "pressure" | "outboxer" | "counter" | "explosive" | "technician";
export type PunchType = "jab" | "cross" | "hook" | "uppercut";
export type Stance = "orthodox" | "southpaw";
export type Confidence = "high" | "medium" | "low" | "none";

/** Money in whole tögrög (MNT has no minor unit in practice). */
export interface Money {
  amount: number;
  currency: "MNT";
}

// ── 1. Profile & stats summary ─────────────────────────────────────────────
export interface FighterProfileSummary {
  uid: string;
  displayName: string;
  photoURL: string | null;
  stance: Stance | null;
  archetype: ArchetypeKey | null;
  rank: {
    key: string;              // lib/xp RANK_TIERS key, e.g. "rankAmateurBelt"
    xp: number;               // canonical account XP (lib/domain/progression)
    nextKey: string | null;
    progressPct: number;      // 0..100 toward nextKey
  };
  totals: {
    sessions: number;
    trainingMinutes: number;
    analyzedVideos: number;
    punches: number;
    /** true when analyzedVideos is only the live window (no server aggregate users.stats yet). */
    partial: boolean;
  };
  streak: { current: number; best: number };
}

// ── 2. Biomechanical analytics (MediaPipe) ─────────────────────────────────
/** One analysed round. Fields map 1:1 to training_sessions.poseMetrics (lib/mediapipePoseMetrics,
 *  lib/cinematicCoaching computeVelocityStats). Speed is relative to body size, not m/s. */
export interface SessionAnalytics {
  id: string;
  createdAt: ISODate;
  score: number;                       // 0..10, the round's one final score
  durationSec: number;
  punches: number;
  byType: Record<PunchType, number>;
  speed: {
    /** Mean time to bring the hand back to guard after a punch, ms (lower = sharper). */
    avgReturnMs: number | null;
    /** Mean snap velocity (normalized, shoulder-relative) — comparable between rounds, not m/s. */
    snapIndex: number | null;
    rating: "FAST" | "MODERATE" | "SLOW" | null;
  };
  technique: {
    /** % of the five form checks rated "good" (guard height, stance width, extension,
     *  rotation, balance) among those the camera could measure this round. */
    score: number | null;
    checksPassed: number;
    checksTotal: number;
  };
  balance: { status: "good" | "off_balance" | null };
  guard: { status: "good" | "too_low" | "too_high" | null };
  confidence: Confidence;
}

export interface TrendPoint {
  date: ISODate;
  score: number;
  techniquePct: number | null;
  avgReturnMs: number | null;
}

export interface BiomechanicsSummary {
  sessionsInWindow: number;
  trend: TrendPoint[];                 // oldest → newest
  punchMix: Record<PunchType, number>; // totals in the window
  avgReturnMs: number | null;
  techniquePct: number | null;
  balancedPct: number | null;          // % of rounds with balance "good"
  guardGoodPct: number | null;         // % of rounds with guard "good"
  latest: SessionAnalytics | null;
}

// ── 3. Fight Knowledge Graph comparison ────────────────────────────────────
export type BenchmarkAxis = "speed" | "technique" | "guard" | "balance" | "volume" | "variety";

/** Where a benchmark comes from. No source = no comparison (we never invent pro numbers). */
export interface BenchmarkSource {
  id: string;
  label: Record<Locale, string>;
  kind: "coach" | "partner-athletes" | "community";
  athletes: number;
  clips: number;
  updatedAt: ISODate;
}

export interface BenchmarkAxisValue {
  axis: BenchmarkAxis;
  /** 0..100 on the same scale for both sides (see lib/dashboard/mappers normalizeAxis). */
  you: number | null;
  benchmark: number;
}

export interface BenchmarkComparison {
  source: BenchmarkSource;
  axes: BenchmarkAxisValue[];
}

// ── 4. Recent analysed videos ──────────────────────────────────────────────
export type VideoAnalysisStatus = "queued" | "processing" | "completed" | "failed";

export interface VideoAnalysis {
  id: string;
  createdAt: ISODate;
  status: VideoAnalysisStatus;
  progressPct: number | null;          // 0..100 while processing
  durationSec: number | null;
  thumbnailUrl: string | null;
  score: number | null;                // set when completed
  punches: number | null;
  poseFramesPct: number | null;        // % of frames with a detected body
  error: string | null;                // set when failed
}

// ── 5. Shop orders ─────────────────────────────────────────────────────────
export type OrderStatus =
  | "pending_payment" | "paid" | "fulfilling" | "shipped" | "delivered" | "cancelled" | "refunded";

export interface OrderLine {
  productId: string;
  title: string;
  variant: string | null;              // e.g. "12 oz · Red"
  qty: number;
  unitPrice: Money;
  imageUrl: string | null;
}

export interface OrderSummary {
  id: string;
  createdAt: ISODate;
  status: OrderStatus;
  total: Money;
  items: OrderLine[];
  trackingUrl: string | null;
}

// ── Loading / error per section ────────────────────────────────────────────
export type DashboardErrorCode = "permission-denied" | "unavailable" | "not-found" | "unauthenticated" | "unknown";

export interface DashboardError {
  code: DashboardErrorCode;
  message: string;
  retryable: boolean;
}

export type SectionState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; error: DashboardError };

export interface FighterDashboardState {
  profile: SectionState<FighterProfileSummary>;
  biomechanics: SectionState<BiomechanicsSummary>;
  /** data null = no benchmark source published yet (shown as an honest empty state). */
  benchmark: SectionState<BenchmarkComparison | null>;
  videos: SectionState<VideoAnalysis[]>;
  orders: SectionState<OrderSummary[]>;
}
