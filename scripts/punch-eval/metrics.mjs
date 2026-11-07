// Coach AI baseline: per-class punch metrics for the current rule-based detector
// (lib/punchPhaseDetector.js, used read-only) on the labelled landmark fixture.
//
//   node scripts/punch-eval/metrics.mjs            → table
//   node scripts/punch-eval/metrics.mjs --json     → JSON (docs/evaluations/punch-baseline.json)
//
// Data: tests/fixtures/punch-landmarks.json — MediaPipe landmarks (no video) from 6
// labelled clips of ONE southpaw fighter, 10 fps. Truth = punch peak times per hand
// plus the clip's punch kind (straight or hook). Southpaw: right = lead, left = rear.
// A detection matches a truth punch of the same hand within ±0.6 s (same rule as
// tests/punchDetector.test.js). Matched detections are then scored by type.
// This is a tiny, single-person, single-camera set: the numbers describe these
// clips only and must not be read as accuracy for GAVANA users in general.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const root = fileURLToPath(new URL("../../", import.meta.url));
const { PunchPhaseDetector } = await import(`${root}lib/punchPhaseDetector.js`);
const FIXTURE = JSON.parse(readFileSync(`${root}tests/fixtures/punch-landmarks.json`, "utf8"));
const MATCH_S = 0.6;
const CLASSES = ["jab", "cross", "hook"];

function truthClass(hand, kind) {
  if (kind === "hook") return "hook";
  return hand === "right" ? "jab" : "cross"; // southpaw
}

function replay(clip) {
  let sim = 1e9;
  const realNow = Date.now;
  Date.now = () => sim;
  const det = new PunchPhaseDetector();
  det.setStance("southpaw");
  let cpu = 0;
  try {
    for (const [t, pts, wpts] of clip.frames) {
      sim = 1e9 + t;
      const L = Array.from({ length: 17 }, () => ({ x: 0, y: 0, z: 0, visibility: 0 }));
      FIXTURE.indices.forEach((idx, k) => { const [x, y, z, visibility] = pts[k]; L[idx] = { x, y, z, visibility }; });
      const W = Array.from({ length: 17 }, () => ({ x: 0, y: 0, z: 0 }));
      FIXTURE.worldIndices.forEach((idx, k) => { const [x, y, z] = wpts[k]; W[idx] = { x, y, z }; });
      const t0 = performance.now();
      det.update(L, W);
      cpu += performance.now() - t0;
    }
  } finally {
    Date.now = realNow;
  }
  return { events: det.getPunchEvents().map((e) => ({ t: (e.ts - 1e9) / 1000, hand: e.hand, type: e.type })), cpuMs: cpu, frames: clip.frames.length };
}

const confusion = Object.fromEntries([...CLASSES, "missed"].map((c) => [c, Object.fromEntries([...CLASSES, "none"].map((p) => [p, 0]))]));
// confusion[truth][predicted]; truth "missed" row unused; predicted "none" = missed truth.
let phantoms = 0, phantomByType = Object.fromEntries(CLASSES.map((c) => [c, 0]));
let cpuTotal = 0, frameTotal = 0;
const perClip = {};

for (const [name, clip] of Object.entries(FIXTURE.clips)) {
  const { events, cpuMs, frames } = replay(clip);
  cpuTotal += cpuMs; frameTotal += frames;
  const kind = clip.truth.types;
  const clipStats = { truth: 0, matched: 0, phantoms: 0 };
  for (const hand of ["left", "right"]) {
    const got = events.filter((e) => e.hand === hand);
    const used = new Set();
    for (const t of clip.truth[hand] || []) {
      clipStats.truth++;
      let best = -1;
      got.forEach((g, i) => { if (!used.has(i) && Math.abs(g.t - t) <= MATCH_S && (best < 0 || Math.abs(g.t - t) < Math.abs(got[best].t - t))) best = i; });
      const truth = truthClass(hand, kind);
      if (best >= 0) {
        used.add(best);
        clipStats.matched++;
        const pred = CLASSES.includes(got[best].type) ? got[best].type : "none";
        confusion[truth][pred]++;
      } else {
        confusion[truth].none++;
      }
    }
    got.forEach((g, i) => {
      if (used.has(i)) return;
      phantoms++; clipStats.phantoms++;
      if (CLASSES.includes(g.type)) phantomByType[g.type]++;
    });
  }
  perClip[name] = { kind, ...clipStats };
}

const r3 = (x) => Math.round(x * 1000) / 1000;
const perClass = {};
for (const c of CLASSES) {
  const tp = confusion[c][c];
  const truthTotal = Object.values(confusion[c]).reduce((s, x) => s + x, 0);
  const predTotal = CLASSES.reduce((s, t) => s + confusion[t][c], 0) + phantomByType[c];
  const precision = predTotal ? tp / predTotal : 0;
  const recall = truthTotal ? tp / truthTotal : 0;
  perClass[c] = { support: truthTotal, predicted: predTotal, precision: r3(precision), recall: r3(recall), f1: r3(precision + recall ? (2 * precision * recall) / (precision + recall) : 0) };
}
const truthAll = CLASSES.reduce((s, c) => s + perClass[c].support, 0);
const detected = CLASSES.reduce((s, c) => s + CLASSES.reduce((a, p) => a + confusion[c][p], 0), 0);
const result = {
  detector: "lib/punchPhaseDetector.js (rule-based, 2D + 3D world landmarks)",
  data: "tests/fixtures/punch-landmarks.json — 6 clips, 1 southpaw fighter, MediaPipe lite @ 10 fps",
  matchToleranceS: MATCH_S,
  punches: truthAll,
  detection: { recall: r3(detected / truthAll), precision: r3(detected / (detected + phantoms)), phantoms },
  perClass,
  macroF1: r3(CLASSES.reduce((s, c) => s + perClass[c].f1, 0) / CLASSES.length),
  confusion: Object.fromEntries(CLASSES.map((c) => [c, confusion[c]])),
  phantomsByType: phantomByType,
  perClip,
  cpuMsPerFrame: r3(cpuTotal / frameTotal),
  cpuNote: "Node replay of the detector only (no MediaPipe, no browser) — not on-device latency.",
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`punches ${result.punches} · detection recall ${result.detection.recall} · precision ${result.detection.precision} · phantoms ${result.detection.phantoms}`);
  console.log("class     support  pred  precision  recall  f1");
  for (const c of CLASSES) {
    const p = perClass[c];
    console.log(`${c.padEnd(9)} ${String(p.support).padStart(7)} ${String(p.predicted).padStart(5)} ${String(p.precision).padStart(10)} ${String(p.recall).padStart(7)} ${String(p.f1).padStart(5)}`);
  }
  console.log(`macro F1 ${result.macroF1} · detector CPU ${result.cpuMsPerFrame} ms/frame (Node)`);
  console.log("confusion (truth → predicted):", JSON.stringify(result.confusion));
}
