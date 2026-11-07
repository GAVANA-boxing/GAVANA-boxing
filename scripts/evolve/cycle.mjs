#!/usr/bin/env node
// Evolve CYCLE — the orchestrator around one improvement cycle.
//
//   node scripts/evolve/cycle.mjs start                  → gate, lock, observe, pick a task (prints it)
//   node scripts/evolve/cycle.mjs finish --outcome <ACCEPTED|REJECTED|BLOCKED|FAILED|NO_CHANGE>
//                                        [--run <run-id>] [--commit <sha>] [--note "…"]
//   node scripts/evolve/cycle.mjs status                 → control, lock, queue summary
//   node scripts/evolve/cycle.mjs release --force        → drop a stuck lock (owner / recovery)
//   node scripts/evolve/cycle.mjs add --fingerprint k:id --title "…" [--files a,b] [--priority n]
//
// State is in git on the authorized branch (persists across processes, machines and
// sessions): evolve/control.json (kill switch, budgets — owner-controlled), evolve/lock.json
// (distributed lock: taken by a pushed commit — a rejected push means someone else holds it;
// 45-min lease so a crashed run can be taken over), evolve/queue.json (tasks), evolve/memory.json
// (cycle history). The coding agent does PLAN + IMPLEMENT between `start` and `finish` and runs
// `npm run evolve:check` for VERIFY / EVALUATE / RECORD.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const Q = await import(join(ROOT, "lib/evolve/queue.js"));
const { observe } = await import(join(ROOT, "scripts/evolve/observe.mjs"));

const AUTH_REPO = /github\.com[/:]gavana-boxing\/gavana-boxing(\.git)?$/i;
const AUTH_BRANCH = "claude/review-refactor-code-DUmiX";
const DIR = join(ROOT, "evolve");
const F = { control: join(DIR, "control.json"), lock: join(DIR, "lock.json"), queue: join(DIR, "queue.json"), memory: join(DIR, "memory.json") };

const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };

const sh = (c) => { const r = spawnSync(c, { cwd: ROOT, shell: true, encoding: "utf8" }); return { ok: r.status === 0, out: (r.stdout || "").trim(), err: (r.stderr || "").trim() }; };
const read = (p, d) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : d);
const write = (p, v) => { mkdirSync(DIR, { recursive: true }); writeFileSync(p, JSON.stringify(v, null, 2) + "\n"); };
const iso = () => new Date().toISOString();
const say = (status, extra = {}) => { console.log(JSON.stringify({ status, ...extra }, null, 2)); };

function commitPush(message, paths) {
  sh(`git add ${paths.map((p) => `"${p}"`).join(" ")}`);
  const c = sh(`git commit -q -m "${message.replace(/"/g, "'")}" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`);
  if (!c.ok && !/nothing to commit/.test(c.out + c.err)) return { ok: false, why: c.err || c.out };
  const p = sh(`git push -q origin ${AUTH_BRANCH}`);
  return p.ok ? { ok: true } : { ok: false, why: p.err || "push rejected" };
}

function verifyRepo() {
  const remote = sh("git remote get-url origin").out;
  const branch = sh("git rev-parse --abbrev-ref HEAD").out;
  if (!AUTH_REPO.test(remote.replace(/^.*?github\.com/, "github.com"))) return `wrong repository (${remote.replace(/\/\/[^@]*@/, "//")})`;
  if (branch !== AUTH_BRANCH) return `wrong branch ${branch} (authorized: ${AUTH_BRANCH})`;
  if (sh("git status --porcelain").out) return "working tree not clean";
  const f = sh(`git fetch -q origin ${AUTH_BRANCH}`);
  if (!f.ok) return `fetch failed: ${f.err}`;
  const ff = sh(`git merge -q --ff-only origin/${AUTH_BRANCH}`);
  if (!ff.ok) return "local branch diverged from origin — needs a human";
  return null;
}

if (cmd === "status") {
  const lock = read(F.lock, null);
  const queue = read(F.queue, { tasks: [] });
  const counts = queue.tasks.reduce((m, t) => ({ ...m, [t.status]: (m[t.status] || 0) + 1 }), {});
  say("STATUS", { control: read(F.control, {}), lock: lock ? { ...lock, ...Q.lockState(lock, Date.now()) } : null, queue: counts, next: Q.pickNext(queue)?.title || null, lastCycles: (read(F.memory, { cycles: [] }).cycles || []).slice(-5) });
  process.exit(0);
}

if (cmd === "start") {
  const bad = verifyRepo();
  if (bad) { say("BLOCKED", { note: bad }); process.exit(3); }
  const control = read(F.control, {});
  const memory = read(F.memory, { cycles: [] });
  const gate = Q.cycleGate(control, memory, Date.now());
  if (!gate.ok) { say(gate.reason, { note: gate.note }); process.exit(gate.reason === "PAUSED" ? 4 : 5); }

  const lock = read(F.lock, null);
  const ls = Q.lockState(lock, Date.now());
  if (ls.held) { say("LOCKED", { note: `cycle ${lock.cycleId} holds the lock until ${lock.leaseUntil}` }); process.exit(3); }

  const cycleId = `${iso().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z")}-${sh("git rev-parse --short HEAD").out}`;
  write(F.lock, Q.newLock({ cycleId, holder: `${hostname()}:${process.pid}`, nowMs: Date.now() }));
  const got = commitPush(`evolve: lock ${cycleId}${ls.stale ? ` (took over stale ${lock.cycleId})` : ""}`, ["evolve/lock.json"]);
  if (!got.ok) {
    // Someone else pushed first: drop our lock commit and back off.
    sh(`git fetch -q origin ${AUTH_BRANCH} && git reset -q --hard origin/${AUTH_BRANCH}`);
    say("LOCKED", { note: `lost the race for the lock: ${got.why}` });
    process.exit(3);
  }

  const queue = Q.mergeFindings(read(F.queue, { tasks: [] }), observe(), iso());
  const task = Q.pickNext(queue);
  if (!task) {
    write(F.queue, queue);
    write(F.memory, Q.remember(memory, { cycleId, at: iso(), outcome: "NO_TASK" }));
    unlinkSync(F.lock);
    commitPush(`evolve: cycle ${cycleId} — no safe task`, ["evolve/queue.json", "evolve/memory.json", "evolve/lock.json"]);
    say("NO_TASK", { cycleId, blocked: queue.tasks.filter((t) => t.status === Q.TASK.BLOCKED).map((t) => t.title) });
    process.exit(0);
  }
  const queued = { ...queue, tasks: queue.tasks.map((t) => (t.fingerprint === task.fingerprint ? { ...t, status: Q.TASK.IN_PROGRESS, cycleId } : t)) };
  write(F.queue, queued);
  const lessons = (task.history || []).filter((h) => h.outcome !== "ACCEPTED").map((h) => `${h.at} ${h.outcome}: ${h.note}`);
  say("TASK", { cycleId, task: { fingerprint: task.fingerprint, kind: task.kind, title: task.title, risk: task.risk, files: task.files, evidence: task.evidence, fix: task.fix, attempts: task.attempts, previousFailures: lessons } });
  process.exit(0);
}

if (cmd === "finish") {
  const outcome = opt("outcome");
  const allowed = ["ACCEPTED", "REJECTED", "BLOCKED", "FAILED", "NO_CHANGE", "AWAITING_APPROVAL"];
  if (!allowed.includes(outcome)) { console.error(`--outcome one of ${allowed.join(", ")}`); process.exit(64); }
  const lock = read(F.lock, null);
  if (!lock) { say("BLOCKED", { note: "no lock — was `start` run?" }); process.exit(3); }
  const queue = read(F.queue, { tasks: [] });
  const task = queue.tasks.find((t) => t.status === Q.TASK.IN_PROGRESS && t.cycleId === lock.cycleId);
  const at = iso();
  const settled = task ? Q.settleTask(queue, task.fingerprint, { outcome: outcome === "NO_CHANGE" ? "REJECTED" : outcome, runId: opt("run"), commit: opt("commit"), note: opt("note", ""), at }) : queue;
  write(F.queue, settled);
  write(F.memory, Q.remember(read(F.memory, { cycles: [] }), { cycleId: lock.cycleId, at, task: task?.fingerprint || null, outcome, runId: opt("run") || null, commit: opt("commit") || null, note: opt("note", "") }));
  unlinkSync(F.lock);
  const pushed = commitPush(`evolve: cycle ${lock.cycleId} ${outcome}${task ? ` — ${task.title}` : ""}`, ["evolve/queue.json", "evolve/memory.json", "evolve/lock.json"]);
  say(pushed.ok ? "FINISHED" : "FINISHED_LOCAL", { cycleId: lock.cycleId, outcome, task: task?.title || null, note: pushed.ok ? "" : `push failed: ${pushed.why}` });
  process.exit(pushed.ok ? 0 : 1);
}

if (cmd === "add") {
  // A task the scanners can't see (found by a person, a failed cycle or an audit).
  const title = opt("title"), fp = opt("fingerprint"), files = (opt("files", "") || "").split(",").filter(Boolean);
  if (!title || !fp) { console.error('add --fingerprint <kind:id> --title "…" [--files a,b] [--priority 0-100] [--fix "…"]'); process.exit(64); }
  const { classifyChange } = await import(join(ROOT, "lib/evolve/policy.js"));
  const queue = read(F.queue, { tasks: [] });
  if (queue.tasks.some((t) => t.fingerprint === fp)) { say("EXISTS", { fingerprint: fp }); process.exit(0); }
  const risk = files.length ? classifyChange(files).level : "YELLOW";
  queue.tasks.push({ fingerprint: fp, kind: fp.split(":")[0], source: "manual", title, files, evidence: [opt("evidence", title)], fix: opt("fix", ""), priority: Number(opt("priority", 80)), risk, status: risk === "RED" ? Q.TASK.BLOCKED : Q.TASK.OPEN, attempts: 0, createdAt: iso(), updatedAt: iso(), history: [] });
  queue.tasks.sort((x, y) => y.priority - x.priority);
  write(F.queue, queue);
  const r = commitPush(`evolve: add task ${fp}`, ["evolve/queue.json"]);
  say(r.ok ? "ADDED" : "ADDED_LOCAL", { fingerprint: fp, risk });
  process.exit(r.ok ? 0 : 1);
}

if (cmd === "release") {
  if (!argv.includes("--force")) { console.error("release needs --force"); process.exit(64); }
  if (!existsSync(F.lock)) { say("NO_LOCK"); process.exit(0); }
  const lock = read(F.lock, null);
  const queue = read(F.queue, { tasks: [] });
  write(F.queue, { ...queue, tasks: queue.tasks.map((t) => (t.status === Q.TASK.IN_PROGRESS ? { ...t, status: Q.TASK.OPEN } : t)) });
  unlinkSync(F.lock);
  const r = commitPush(`evolve: release lock ${lock.cycleId} (manual recovery)`, ["evolve/lock.json", "evolve/queue.json"]);
  say(r.ok ? "RELEASED" : "RELEASE_FAILED", { cycleId: lock.cycleId, note: r.why || "" });
  process.exit(r.ok ? 0 : 1);
}

console.error("usage: cycle.mjs start | finish --outcome … | status | add … | release --force");
process.exit(64);
