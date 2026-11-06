// Offline replay: run lib/punchPhaseDetector over landmark dumps (eval page with
// dump=1, run.cjs "out") — no browser, deterministic, milliseconds per clip.
// Usage: node scripts/punch-eval/replay.mjs <stance> <dump.json> [truth.json]
//   truth.json: { "<clip basename>": { "right": [t…], "left": [t…] } } — peak times in seconds.
import fs from "node:fs";
import path from "node:path";
import { PunchPhaseDetector } from "../../lib/punchPhaseDetector.js";

const MATCH_S = 0.6; // a detection within this after/before a labelled punch counts as it

export function replay(dump, stance) {
  const realNow = Date.now;
  let sim = 1e9;
  Date.now = () => sim;
  try {
    const det = new PunchPhaseDetector();
    det.setStance(stance);
    for (const f of dump.frames) {
      sim = 1e9 + f.t;
      det.update(
        f.L.map(([x, y, z, visibility]) => ({ x, y, z, visibility })),
        f.W ? f.W.map(([x, y, z]) => ({ x, y, z })) : null,
      );
    }
    return det.getPunchEvents().map((e) => ({ t: +((e.ts - 1e9) / 1000).toFixed(2), type: e.type, hand: e.hand, conf: e.confidenceLabel, travel: e.travel, ext: e.extNorm, ang: e.peakAngle, snap: e.snapVelocity }));
  } finally {
    Date.now = realNow;
  }
}

/** Greedy per-hand matching of detections to labelled peaks. */
export function score(events, truth) {
  const out = {};
  for (const hand of ["right", "left"]) {
    const want = [...(truth[hand] || [])];
    const got = events.filter((e) => e.hand === hand).map((e) => e.t);
    const used = new Set();
    let hit = 0;
    for (const t of want) {
      let best = -1, bestD = Infinity;
      got.forEach((g, i) => { const d = Math.abs(g - t); if (!used.has(i) && d <= MATCH_S && d < bestD) { best = i; bestD = d; } });
      if (best >= 0) { used.add(best); hit++; }
    }
    out[hand] = { truth: want.length, hit, miss: want.length - hit, phantom: got.length - used.size };
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [stance, file, truthFile] = process.argv.slice(2);
  const dump = JSON.parse(fs.readFileSync(file, "utf8"));
  const ev = replay(dump, stance);
  const name = path.basename(file, ".json");
  console.log(name, ev.map((e) => `${e.t}s ${e.type}(${e.hand[0]})`).join("  "));
  if (process.env.VERBOSE) for (const e of ev) console.log(`   ${e.t}s ${e.hand[0]} ${e.type} travel=${e.travel} ext=${e.ext} ang=${e.ang} snap=${e.snap} ${e.conf}`);
  if (truthFile) {
    const truth = JSON.parse(fs.readFileSync(truthFile, "utf8"))[name];
    if (truth) console.log("  ", JSON.stringify(score(ev, truth)));
  }
}
