#!/usr/bin/env node
// Evolve check — Engineer AI MVP: VERIFY → EVALUATE → DECIDE → RECORD for one run.
//
//   npm run evolve:check -- --task "what this change does" [--visual] [--rules] [--skip-build]
//                           [--force] [--write-baseline] [--base <git ref>]
//
// Runs the project's checks, compares every metric with docs/evaluations/baseline.json,
// classifies the changed files (lib/evolve/policy.js) and walks the run through the
// state machine (lib/evolve/runState.js). Writes docs/evaluations/runs/<id>.json.
//
// Verdict / exit code:  ACCEPTED 0 · REJECTED 1 · FAILED 1 · AWAITING_APPROVAL 2 · BLOCKED 3
// ACCEPTED means "checks pass and no gate regressed" — it never deploys anything.
// A change touching RED paths (rules, auth, XP, detector, payments, deploy config,
// dependencies) stops at AWAITING_APPROVAL even when everything passes.
// Only steps that ran are judged; skipped steps are NOT RUN, never PASS.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const { RUN, createRun, move, runKey } = await import(join(ROOT, "lib/evolve/runState.js"));
const { classifyChange, canAutoAccept } = await import(join(ROOT, "lib/evolve/policy.js"));

const RUNS_DIR = join(ROOT, "docs/evaluations/runs");
const BASELINE = join(ROOT, "docs/evaluations/baseline.json");
const LOCK = join(ROOT, ".evolve.lock");

// ── args ─────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const TASK = opt("task", "");
if (!TASK) { console.error('usage: evolve:check -- --task "what this change does" [--visual] [--rules] [--skip-build]'); process.exit(64); }

// ── helpers ──────────────────────────────────────────────────────────────
const sh = (cmd, { timeoutMs = 15 * 60_000 } = {}) => {
  const t0 = Date.now();
  const r = spawnSync(cmd, { cwd: ROOT, shell: true, encoding: "utf8", timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1", CI: "1" } });
  const out = `${r.stdout || ""}\n${r.stderr || ""}`.replace(/\u001b\[[0-9;]*[A-Za-z]/g, "");
  return { code: r.status, timedOut: r.error?.code === "ETIMEDOUT", spawnError: r.error && r.error.code !== "ETIMEDOUT" ? String(r.error.message) : null, out, ms: Date.now() - t0 };
};
const git = (args) => sh(`git ${args}`).out.trim();
// Logs go into a committed record: strip anything that looks like a credential.
const redact = (s) => s
  .replace(/\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{8,}/g, "[redacted]")
  .replace(/AIza[0-9A-Za-z_-]{30,}/g, "[redacted]")
  .replace(/(Bearer|token|secret|password)(["':= ]+)[^\s"']{8,}/gi, "$1$2[redacted]");
// Keep the end of a failing log, minus progress lines ("[12/49] …") that push the errors out.
const tail = (s, n = 60) => redact(s.trim().split("\n").filter((l) => !/^\s*\[\d+\/\d+\]/.test(l)).slice(-n).join("\n"));
const now = () => new Date().toISOString();

function hashText(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function dirSizeKB(dir, ext = ".js") {
  if (!existsSync(dir)) return null;
  let total = 0;
  const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); const st = statSync(p); if (st.isDirectory()) walk(p); else if (p.endsWith(ext)) total += st.size; });
  walk(dir);
  return Math.round(total / 1024);
}

// ── steps ────────────────────────────────────────────────────────────────
const num = (re, s) => { const m = s.match(re); return m ? Number(m[1]) : null; };
const STEPS = [
  {
    name: "lint", cmd: "npx eslint",
    parse: (o) => ({ errors: num(/\((\d+) errors?,/, o) ?? 0, warnings: num(/, (\d+) warnings?\)/, o) ?? 0 }),
  },
  { name: "typecheck", cmd: "npx tsc --noEmit -p tsconfig.json", parse: (o) => ({ errors: (o.match(/error TS\d+/g) || []).length }) },
  {
    name: "unit", cmd: "npx vitest run",
    parse: (o) => ({ passed: num(/Tests\s+(?:\d+ failed \| )?(\d+) passed/, o) ?? 0, failed: num(/Tests\s+(\d+) failed/, o) ?? 0 }),
  },
  { name: "build", cmd: "npx next build", skip: () => flag("skip-build") && "--skip-build", parse: () => ({}) },
  {
    name: "bundle", fn: () => {
      const kb = dirSizeKB(join(ROOT, ".next/static/chunks"));
      return kb == null ? { status: "NOT RUN", note: "no build output" } : { status: "PASS", metrics: { kb } };
    },
    skip: () => flag("skip-build") && "--skip-build",
  },
  {
    name: "punch", cmd: "node scripts/punch-eval/metrics.mjs --json",
    parse: (o) => {
      const j = JSON.parse(o.slice(o.indexOf("{"), o.lastIndexOf("}") + 1));
      return { macroF1: j.macroF1, recall: j.detection.recall, precision: j.detection.precision, phantoms: j.detection.phantoms };
    },
  },
  {
    name: "visual", cmd: "npx playwright test --trace off --reporter=line", timeoutMs: 25 * 60_000,
    skip: () => !flag("visual") && "pass --visual to run",
    parse: (o) => ({ passed: num(/(\d+) passed/, o) ?? 0, failed: num(/(\d+) failed/, o) ?? 0, flaky: num(/(\d+) flaky/, o) ?? 0 }),
  },
  {
    name: "rules", cmd: "npm run test:rules", timeoutMs: 10 * 60_000,
    skip: () => (!flag("rules") && "pass --rules to run") || (!existsSync(join(ROOT, "scripts/rules-test/node_modules")) && "run `npm --prefix scripts/rules-test ci` first"),
    parse: (o) => ({ passed: (o.match(/^PASS /gm) || []).length, failed: (o.match(/^FAIL /gm) || []).length }),
  },
];

function runStep(step) {
  const skipped = step.skip?.();
  if (skipped) return { name: step.name, status: "NOT RUN", note: skipped };
  if (step.fn) return { name: step.name, ...step.fn() };
  const r = sh(step.cmd, { timeoutMs: step.timeoutMs });
  const base = { name: step.name, ms: r.ms };
  if (r.spawnError) return { ...base, status: "FAIL", note: r.spawnError };
  if (r.timedOut) return { ...base, status: "FAIL", note: "timed out", tail: tail(r.out) };
  let metrics = {};
  try { metrics = step.parse ? step.parse(r.out) : {}; } catch (e) { return { ...base, status: "FAIL", note: `could not read output: ${e.message}`, tail: tail(r.out) }; }
  return r.code === 0 ? { ...base, status: "PASS", metrics } : { ...base, status: "FAIL", metrics, tail: tail(r.out) };
}

// ── gates: how each metric may move against the baseline ─────────────────
const GATES = [
  ["lint.errors", "max", () => 0],
  ["lint.warnings", "max", (b) => b],
  ["typecheck.errors", "max", () => 0],
  ["unit.failed", "max", () => 0],
  ["unit.passed", "min", (b) => b],
  ["bundle.kb", "max", (b) => Math.round(b * 1.05)],
  ["punch.macroF1", "min", (b) => b - 0.0005],
  ["punch.phantoms", "max", (b) => b],
  ["visual.failed", "max", () => 0],
  ["visual.passed", "min", (b) => b],
  ["rules.failed", "max", () => 0],
  ["rules.passed", "min", (b) => b],
];

function compare(steps, baseline) {
  const value = (key) => { const [s, m] = key.split("."); const st = steps.find((x) => x.name === s); return st?.status === "NOT RUN" || !st?.metrics ? undefined : st.metrics[m]; };
  return GATES.map(([key, kind, limitOf]) => {
    const v = value(key);
    const b = baseline?.metrics?.[key];
    if (v === undefined) return { metric: key, status: "NOT RUN" };
    if (b === undefined) return { metric: key, value: v, status: "NO BASELINE" };
    const limit = limitOf(b);
    const ok = kind === "max" ? v <= limit : v >= limit;
    return { metric: key, baseline: b, value: v, limit: `${kind === "max" ? "≤" : "≥"} ${limit}`, status: ok ? "PASS" : "FAIL" };
  });
}

// ── main ─────────────────────────────────────────────────────────────────
const commit = git("rev-parse --short HEAD");
const branch = git("rev-parse --abbrev-ref HEAD");
const baseRef = opt("base", "@{upstream}");
const changed = [...new Set([
  ...git(`diff --name-only ${baseRef}`).split("\n"),
  ...git("ls-files --others --exclude-standard").split("\n"),
].filter((p) => p && !p.startsWith("docs/evaluations/runs/")))];
const diffHash = hashText(git(`diff ${baseRef}`) + changed.join("\n"));
const key = runKey({ task: TASK, commit, diffHash });
const id = `${now().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z")}-${commit}`;

mkdirSync(RUNS_DIR, { recursive: true });

// Idempotency: the same task on the same code already has a final record.
if (!flag("force") && !flag("write-baseline")) {
  for (const f of readdirSync(RUNS_DIR).filter((x) => x.endsWith(".json"))) {
    const prev = JSON.parse(readFileSync(join(RUNS_DIR, f), "utf8"));
    if (prev.key === key) {
      console.log(`same task + same code already checked: ${f} → ${prev.verdict} (use --force to re-run)`);
      process.exit({ ACCEPTED: 0, AWAITING_APPROVAL: 2, BLOCKED: 3 }[prev.verdict] ?? 1);
    }
  }
}

// Single writer: one run at a time.
if (existsSync(LOCK)) {
  const lock = JSON.parse(readFileSync(LOCK, "utf8"));
  let alive = false;
  try { process.kill(lock.pid, 0); alive = true; } catch { alive = false; }
  if (alive) { console.error(`BLOCKED: run ${lock.id} (pid ${lock.pid}) is still running`); process.exit(3); }
  unlinkSync(LOCK); // stale lock from a crashed run
}
writeFileSync(LOCK, JSON.stringify({ pid: process.pid, id, startedAt: now() }));
const release = () => { try { unlinkSync(LOCK); } catch { /* already gone */ } };
process.on("exit", release);
process.on("SIGINT", () => process.exit(130));
process.on("SIGTERM", () => process.exit(143));

const change = classifyChange(changed);
let run = createRun({ id, key, task: TASK, at: now() });
run = move(run, RUN.PLANNING, { at: now(), note: TASK });
run = move(run, RUN.IMPLEMENTING, { at: now(), note: `${changed.length} changed file(s) vs ${baseRef}, risk ${change.level}` });
run = move(run, RUN.VERIFYING, { at: now() });

const started = Date.now();
const steps = [];
for (const step of STEPS) {
  process.stdout.write(`▸ ${step.name} … `);
  const r = runStep(step);
  steps.push(r);
  console.log(`${r.status}${r.metrics && Object.keys(r.metrics).length ? " " + JSON.stringify(r.metrics) : ""}${r.note ? ` (${r.note})` : ""}`);
}

run = move(run, RUN.EVALUATING, { at: now() });
const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : null;
const comparison = compare(steps, baseline);
const failedSteps = steps.filter((s) => s.status === "FAIL").map((s) => s.name);
const failedGates = comparison.filter((c) => c.status === "FAIL").map((c) => c.metric);

let verdictNote;
if (failedSteps.length || failedGates.length) {
  verdictNote = [failedSteps.length && `failed: ${failedSteps.join(", ")}`, failedGates.length && `regressed: ${failedGates.join(", ")}`].filter(Boolean).join("; ");
  run = move(run, RUN.REJECTED, { at: now(), note: verdictNote });
} else if (!canAutoAccept(change)) {
  verdictNote = `RED paths need the owner: ${change.red.map((f) => `${f.path} (${f.why})`).join(", ")}`;
  run = move(run, RUN.AWAITING_APPROVAL, { at: now(), note: verdictNote });
} else {
  verdictNote = "all run checks pass, no gate regressed";
  run = move(run, RUN.ACCEPTED, { at: now(), note: verdictNote });
}

const record = {
  id, key, task: TASK, branch, commit, base: baseRef,
  dirty: git("status --porcelain").length > 0, // uncommitted changes were part of what was checked
  startedAt: run.history[0].at, finishedAt: now(), durationS: Math.round((Date.now() - started) / 1000),
  cost: { paidApiCalls: 0, note: "checks run locally; no paid APIs" },
  change: { level: change.level, files: change.files },
  steps, comparison,
  verdict: run.state, verdictNote,
  history: run.history,
  baselineCommit: baseline?.commit ?? null,
};

if (flag("write-baseline")) {
  if (failedSteps.length) { console.error(`not writing a baseline from a failing run (${failedSteps.join(", ")})`); process.exit(1); }
  const metrics = {};
  for (const s of steps) if (s.status === "PASS" && s.metrics) for (const [k, v] of Object.entries(s.metrics)) metrics[`${s.name}.${k}`] = v;
  writeFileSync(BASELINE, JSON.stringify({ commit, date: now(), note: "Written by evolve:check --write-baseline. Machine-specific (bundle size, visual).", metrics }, null, 2) + "\n");
  console.log(`baseline written: ${relative(ROOT, BASELINE)} (${Object.keys(metrics).length} metrics)`);
}

const file = join(RUNS_DIR, `${id}.json`);
writeFileSync(file, JSON.stringify(record, null, 2) + "\n");
// Compact index for the owner dashboard (/admin/evolution).
{
  const { upsertRun } = await import(join(ROOT, "lib/evolve/runsIndex.js"));
  const idxFile = join(ROOT, "evolve/runs-index.json");
  const idx = existsSync(idxFile) ? JSON.parse(readFileSync(idxFile, "utf8")) : { runs: [] };
  mkdirSync(join(ROOT, "evolve"), { recursive: true });
  writeFileSync(idxFile, JSON.stringify(upsertRun(idx, record), null, 2) + "\n");
}
console.log(`\n${run.state} — ${verdictNote}\nrecord: ${relative(ROOT, file)}`);
for (const c of comparison.filter((x) => x.status === "FAIL")) console.log(`  ✗ ${c.metric}: ${c.value} (baseline ${c.baseline}, limit ${c.limit})`);
process.exit({ ACCEPTED: 0, AWAITING_APPROVAL: 2, BLOCKED: 3 }[run.state] ?? 1);
