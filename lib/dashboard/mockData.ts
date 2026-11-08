// Fixed demo data for the fighter dashboard (visual fixture /visual/dashboard and the component
// preview). Built from raw Firestore-shaped docs through the SAME mappers the live hook uses, so
// the preview can't drift from what real data renders. Nothing here is shown to real users.
// The benchmark is labelled as a demo source — it is not a measurement of any real athlete.
import type { FighterDashboardState, SectionState } from "./types";
import { buildBiomechanics, fighterAxes, mapBenchmark, mapOrder, mapSession, mapVideo } from "./mappers";

const NOW = Date.UTC(2026, 10, 6, 12, 0, 0);
const DAY = 86_400_000;
const ts = (msAgo: number) => ({ seconds: Math.round((NOW - msAgo) / 1000) });

const SCORES = [5.8, 6.1, 6.0, 6.6, 6.4, 6.9, 7.1, 6.8, 7.4, 7.3, 7.6, 7.9];
const GUARD = ["too_low", "too_low", "good", "too_low", "good", "good", "too_low", "good", "good", "good", "too_low", "good"];
const BAL = ["good", "off_balance", "good", "good", "good", "off_balance", "good", "good", "good", "good", "good", "good"];

// newest first, like the Firestore query
const sessionDocs = SCORES.map((score, i) => ({
  id: `s${i}`,
  data: {
    type: "training", userId: "demo", score, durationSeconds: 120 + (i % 3) * 60,
    createdAt: ts((SCORES.length - i) * 1.5 * DAY),
    poseMetrics: {
      punchCount: 34 + i * 2,
      punchBreakdown: { jab: { count: 16 + i }, cross: { count: 11 + (i % 4) }, hook: { count: 5 + (i % 3) }, uppercut: { count: 2 + (i % 2) } },
      velocityStats: { avgRecoilMs: 420 - i * 9, avgSnapVelocity: 0.07 + i * 0.002, snapRating: i > 7 ? "FAST" : "MODERATE" },
      guardHeight: { status: GUARD[i] }, stanceWidth: { status: "good" }, punchExtension: { status: i % 4 === 0 ? "short" : "good" },
      rotation: { status: i > 5 ? "good" : "under_rotated" }, balance: { status: BAL[i] },
      sessionConfidence: i > 8 ? "high" : "medium",
    },
  },
})).reverse();

const sessions = sessionDocs.map((d) => mapSession(d.id, d.data));
const biomechanics = buildBiomechanics(sessions);

const benchmark = mapBenchmark("demo-coach", {
  label: { mn: "Жишээ дасгалжуулагч (demo)", ko: "예시 코치 (demo)", en: "Sample coach (demo)" },
  kind: "coach", athletes: 1, clips: 24, updatedAt: "2026-11-01T00:00:00Z",
  axes: { speed: 82, technique: 90, guard: 92, balance: 88, volume: 64, variety: 78 },
}, fighterAxes(biomechanics, sessions));

const videos = [
  mapVideo("v4", { status: "processing", progressPct: 46, createdAt: ts(0.1 * DAY), durationSec: 42 }),
  mapVideo("v3", { status: "completed", createdAt: ts(1.2 * DAY), durationSec: 61, score: 7.6, punches: 48, poseFramesPct: 94 }),
  mapVideo("v2", { status: "failed", createdAt: ts(3 * DAY), durationSec: 18, error: "no_body_detected" }),
  mapVideo("v1", { status: "completed", createdAt: ts(6 * DAY), durationSec: 55, score: 6.9, punches: 39, poseFramesPct: 88 }),
];

const orders = [
  mapOrder("GV-1042", {
    status: "shipped", createdAt: ts(2 * DAY), trackingUrl: "https://example.com/track/GV-1042",
    total: { amount: 214000 },
    items: [
      { productId: "gloves-pro", title: "GAVANA Pro gloves", variant: "12 oz · Red", qty: 1, unitPrice: { amount: 189000 } },
      { productId: "wraps", title: "Hand wraps 4.5 m", variant: "Black", qty: 1, unitPrice: { amount: 25000 } },
    ],
  }),
  mapOrder("GV-1051", {
    status: "pending_payment", createdAt: ts(0.3 * DAY), total: { amount: 69000 },
    items: [{ productId: "tee", title: "GAVANA training tee", variant: "M · Black", qty: 1, unitPrice: { amount: 69000 } }],
  }),
  mapOrder("GV-0987", {
    status: "delivered", createdAt: ts(19 * DAY), total: { amount: 45000 },
    items: [{ productId: "mouthguard", title: "Mouthguard", variant: null, qty: 1, unitPrice: { amount: 45000 } }],
  }),
];

const ready = <T,>(data: T): SectionState<T> => ({ status: "ready", data });

export const MOCK_DASHBOARD: FighterDashboardState = {
  profile: ready({
    uid: "demo", displayName: "Bat-Erdene", photoURL: null, stance: "southpaw", archetype: "counter",
    rank: { key: "rankBronzeBelt", xp: 2340, nextKey: "rankSilverBelt", progressPct: 47 },
    totals: { sessions: 46, trainingMinutes: 318, analyzedVideos: 9, punches: 2140, partial: false },
    streak: { current: 6, best: 11 },
  }),
  biomechanics: ready(biomechanics),
  benchmark: ready(benchmark),
  videos: ready(videos),
  orders: ready(orders),
};

/** Every section loading / failing — for the state previews. */
export const MOCK_LOADING: FighterDashboardState = {
  profile: { status: "loading" }, biomechanics: { status: "loading" }, benchmark: { status: "loading" },
  videos: { status: "loading" }, orders: { status: "loading" },
};

export const MOCK_PARTIAL_ERROR: FighterDashboardState = {
  ...MOCK_DASHBOARD,
  benchmark: ready(null),
  orders: { status: "error", error: { code: "unavailable", message: "offline", retryable: true } },
};
