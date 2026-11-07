#!/usr/bin/env node
// Record the owner's decision on a run that is AWAITING_APPROVAL.
//
//   node scripts/evolve/approve.mjs <run-id> --accept|--reject --note "who decided, where, what"
//
// The note must say where the decision came from (e.g. the owner's message). An
// agent may run this only to record a decision the owner actually made — never
// to approve its own change. The run record keeps the full history.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const { RUN, move } = await import(join(ROOT, "lib/evolve/runState.js"));

const [id] = process.argv.slice(2);
const accept = process.argv.includes("--accept");
const reject = process.argv.includes("--reject");
const i = process.argv.indexOf("--note");
const note = i >= 0 ? process.argv[i + 1] : "";
if (!id || accept === reject || !note) {
  console.error('usage: approve.mjs <run-id> --accept|--reject --note "decided by …"');
  process.exit(64);
}
const file = join(ROOT, "docs/evaluations/runs", `${id.replace(/\.json$/, "")}.json`);
if (!existsSync(file)) { console.error(`no run ${id}`); process.exit(1); }
const rec = JSON.parse(readFileSync(file, "utf8"));
if (rec.verdict !== RUN.AWAITING_APPROVAL) { console.error(`run ${id} is ${rec.verdict}, not awaiting approval`); process.exit(1); }
const run = move({ id: rec.id, state: rec.verdict, retries: 0, history: rec.history }, accept ? RUN.ACCEPTED : RUN.REJECTED, { at: new Date().toISOString(), note });
rec.verdict = run.state;
rec.history = run.history;
rec.decision = { by: "owner", note, at: run.history.at(-1).at };
writeFileSync(file, JSON.stringify(rec, null, 2) + "\n");
{
  const { upsertRun } = await import(join(ROOT, "lib/evolve/runsIndex.js"));
  const idxFile = join(ROOT, "evolve/runs-index.json");
  const idx = existsSync(idxFile) ? JSON.parse(readFileSync(idxFile, "utf8")) : { runs: [] };
  writeFileSync(idxFile, JSON.stringify(upsertRun(idx, rec), null, 2) + "\n");
}
console.log(`${id} → ${run.state}`);
