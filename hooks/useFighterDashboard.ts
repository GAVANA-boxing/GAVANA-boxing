"use client";

// Live data for the fighter dashboard.
//   profile  — users/{uid}                        onSnapshot (rank / streak change live)
//   sessions — training_sessions (all, like useRankData — XP must match /progress); the latest N
//              feed the biomechanics; fetched, refresh() re-fetches
//   videos   — video_analyses (latest N)           onSnapshot (queued → processing → completed / failed)
//   orders   — orders (latest N)                   onSnapshot (payment webhook → paid → shipped …)
//   benchmark— benchmarks/{benchmarkId}            fetched once per refresh, compared on one scale
// Every section has its own loading / error state, so one failing listener (e.g. rules not deployed
// for orders yet) never blanks the whole page. Firestore is imported on demand (it stays off pages
// that don't need it). All listeners are removed on unmount / uid change / refresh.
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { DocumentData, QuerySnapshot } from "firebase/firestore";
import type {
  BenchmarkComparison, BiomechanicsSummary, DashboardError, FighterDashboardState, FighterProfileSummary,
  OrderSummary, SectionState, SessionAnalytics, Stance, VideoAnalysis,
} from "@/lib/dashboard/types";
import {
  buildBiomechanics, fighterAxes, isActiveOrder, mapBenchmark, mapOrder, mapSession, mapVideo, toDashboardError, toIso,
} from "@/lib/dashboard/mappers";
import { normalizeArchetype } from "@/lib/archetypes";
import { getFighterRank, getNextRank, getRankProgress } from "@/lib/xp";
import { getAccountXp } from "@/lib/domain/progression";

export interface UseFighterDashboardOptions {
  sessionLimit?: number;
  videoLimit?: number;
  orderLimit?: number;
  /** benchmarks/{id} to compare against; the doc must carry provenance (see mapBenchmark). */
  benchmarkId?: string;
}

export interface UseFighterDashboardResult extends FighterDashboardState {
  /** Re-fetch sessions + benchmark and re-subscribe the listeners. */
  refresh: () => void;
  /** Orders still in progress (pending payment, paid, fulfilling, shipped). */
  activeOrders: number;
}

type Section = keyof FighterDashboardState;
type Action =
  | { type: "reset" }
  | { type: "ready"; section: Section; data: unknown }
  | { type: "error"; section: Section; error: DashboardError };

const LOADING: FighterDashboardState = {
  profile: { status: "loading" }, biomechanics: { status: "loading" }, benchmark: { status: "loading" },
  videos: { status: "loading" }, orders: { status: "loading" },
};

function reducer(state: FighterDashboardState, a: Action): FighterDashboardState {
  if (a.type === "reset") return LOADING;
  if (a.type === "ready") return { ...state, [a.section]: { status: "ready", data: a.data } };
  return { ...state, [a.section]: { status: "error", error: a.error } };
}

const UNAUTH: DashboardError = { code: "unauthenticated", message: "Sign in to see your dashboard.", retryable: false };

export function useFighterDashboard(uid: string | null | undefined, opts: UseFighterDashboardOptions = {}): UseFighterDashboardResult {
  const { sessionLimit = 30, videoLimit = 6, orderLimit = 5, benchmarkId = "gavana-coach" } = opts;
  const [state, dispatch] = useReducer(reducer, LOADING);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    dispatch({ type: "reset" });
    if (!uid) {
      (["profile", "biomechanics", "benchmark", "videos", "orders"] as Section[])
        .forEach((section) => dispatch({ type: "error", section, error: UNAUTH }));
      return undefined;
    }

    let cancelled = false;
    const unsubs: Array<() => void> = [];
    const ready = (section: Section, data: unknown) => { if (!cancelled) dispatch({ type: "ready", section, data }); };
    const fail = (section: Section, err: unknown) => { if (!cancelled) dispatch({ type: "error", section, error: toDashboardError(err) }); };

    // Profile needs both the user doc (live) and the session window (for totals / XP).
    let userDoc: DocumentData | null = null;
    let sessionDocs: Array<{ id: string; data: DocumentData }> | null = null;
    let videoCount: number | null = null;
    const emitProfile = () => {
      if (!userDoc || !sessionDocs) return;
      ready("profile", buildProfile(uid, userDoc, sessionDocs, videoCount));
    };

    (async () => {
      let fs: typeof import("firebase/firestore");
      let db: import("firebase/firestore").Firestore;
      try {
        [fs, { db }] = await Promise.all([import("firebase/firestore"), import("@/lib/firebase")]);
      } catch (err) {
        (["profile", "biomechanics", "benchmark", "videos", "orders"] as Section[]).forEach((s) => fail(s, err));
        return;
      }
      if (cancelled) return;
      const { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, where } = fs;
      const mine = (name: string, n: number) =>
        query(collection(db, name), where("userId", "==", uid), orderBy("createdAt", "desc"), limit(n));

      // 1. Profile (live)
      unsubs.push(onSnapshot(doc(db, "users", uid),
        (snap) => { userDoc = snap.exists() ? snap.data() : {}; emitProfile(); },
        (err) => fail("profile", err)));

      // 2. Live listeners: video analysis status, order status
      unsubs.push(onSnapshot(mine("video_analyses", videoLimit),
        (snap: QuerySnapshot<DocumentData>) => {
          const videos: VideoAnalysis[] = snap.docs.map((d) => mapVideo(d.id, d.data()));
          videoCount = snap.size;
          ready("videos", videos);
          emitProfile();
        },
        (err) => fail("videos", err)));
      unsubs.push(onSnapshot(mine("orders", orderLimit),
        (snap: QuerySnapshot<DocumentData>) => ready("orders", snap.docs.map((d): OrderSummary => mapOrder(d.id, d.data()))),
        (err) => fail("orders", err)));

      // 3. Sessions (fetched): all of them for XP / totals — the same query useRankData runs, so the
      //    rank here can't disagree with /progress — and the latest N rounds → biomechanics → benchmark.
      let sessions: SessionAnalytics[] = [];
      let bio: BiomechanicsSummary;
      try {
        const snap = await getDocs(query(collection(db, "training_sessions"), where("userId", "==", uid)));
        if (cancelled) return;
        sessionDocs = snap.docs
          .map((d) => ({ id: d.id, data: d.data(), at: toIso(d.data().createdAt) }))
          .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
          .map(({ id, data }) => ({ id, data }));
        sessions = sessionDocs
          .filter((d) => (d.data.type ?? "training") === "training")
          .slice(0, sessionLimit)
          .map((d) => mapSession(d.id, d.data));
        bio = buildBiomechanics(sessions);
        ready("biomechanics", bio);
        emitProfile();
      } catch (err) {
        // XP / rank need the sessions — show the profile as failed rather than a wrong (lower) rank.
        fail("profile", err);
        fail("biomechanics", err);
        fail("benchmark", err);
        return;
      }
      try {
        const b = await getDoc(doc(db, "benchmarks", benchmarkId));
        const comparison: BenchmarkComparison | null = mapBenchmark(benchmarkId, b.exists() ? b.data() : null, fighterAxes(bio, sessions));
        ready("benchmark", comparison);
      } catch (err) {
        fail("benchmark", err);
      }
    })();

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
    };
  }, [uid, refreshKey, sessionLimit, videoLimit, orderLimit, benchmarkId]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const activeOrders = useMemo(
    () => (state.orders.status === "ready" ? state.orders.data.filter(isActiveOrder).length : 0),
    [state.orders],
  );
  return { ...state, refresh, activeOrders };
}

/** users/{uid} + all of the fighter's sessions → profile summary. Server aggregates (users.stats)
 *  win when present. */
function buildProfile(
  uid: string, u: DocumentData, sessions: Array<{ id: string; data: DocumentData }>, videoCount: number | null,
): FighterProfileSummary {
  const stats = (u.stats && typeof u.stats === "object" ? u.stats : {}) as Record<string, unknown>;
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const allMinutes = Math.round(sessions.reduce((a, s) => a + (n(s.data.durationSeconds) ?? 0), 0) / 60);
  const allPunches = sessions.reduce((a, s) => a + (n((s.data.poseMetrics as DocumentData | undefined)?.punchCount) ?? n(s.data.hitCount) ?? 0), 0);
  const xp = getAccountXp({
    storedXp: n(u.xp) ?? 0,
    trainingSessions: sessions.map((s) => ({ xpGained: s.data.xpGained })),
    streakDays: n(u.dailyStreak) ?? 0,
    bestStreakDays: n(u.bestDailyStreak) ?? 0,
  });
  const rank = getFighterRank(xp) as { key: string };
  const next = getNextRank(xp) as { key: string } | null;
  const stance: Stance | null = u.stance === "orthodox" || u.stance === "southpaw" ? u.stance : null;
  return {
    uid,
    displayName: String(u.displayName || u.username || "Fighter"),
    photoURL: typeof u.photoURL === "string" ? u.photoURL : typeof u.profileImageUrl === "string" ? u.profileImageUrl : null,
    stance,
    archetype: normalizeArchetype(u.fighterArchetype || u.archetype),
    rank: { key: rank.key, xp, nextKey: next?.key ?? null, progressPct: Math.round(Number(getRankProgress(xp)) || 0) },
    totals: {
      sessions: n(stats.sessions) ?? sessions.length,
      trainingMinutes: n(stats.trainingMinutes) ?? allMinutes,
      analyzedVideos: n(stats.analyzedVideos) ?? videoCount ?? 0,
      punches: n(stats.punches) ?? allPunches,
      // analysed-video count is the live window (videoLimit) until the server keeps users.stats
      partial: n(stats.analyzedVideos) == null,
    },
    streak: { current: n(u.dailyStreak) ?? 0, best: Math.max(n(u.bestDailyStreak) ?? 0, n(u.dailyStreak) ?? 0) },
  };
}

export type { SectionState };
