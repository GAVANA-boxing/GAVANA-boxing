// Evolve OBSERVE — find real, checkable issues in the repo and turn them into
// queue findings ({ fingerprint, kind, title, evidence, files, priority, risk }).
// Deterministic and cheap (no network, no paid APIs). Each scanner re-reads
// the current code, so findings are always revalidated against the repo.
//
//   node scripts/evolve/observe.mjs        → print findings as JSON

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const { classifyPath } = await import(join(ROOT, "lib/evolve/policy.js"));

// Hidden by CORE_MODE (docs/AI_ENGINEERING_RULES.md: don't polish hidden routes).
const HIDDEN_COMPONENT_DIRS = new Set(["feed", "reels", "gyms", "sparring", "challenges", "leaderboard", "creator", "events", "discover", "fighters", "upload", "workout", "programs", "chat", "ai-analysis"]);
const HIDDEN_FILES = /(SparringPage|StoryUpload|InboxList|Leaderboard|ChatThread)\.js$/;
const HIDDEN_ROUTES = ["feed", "reels", "explore", "discover", "events", "gyms", "sparring", "challenges", "leaderboard", "fighters", "creator", "programs", "upload", "story", "inbox", "workout"];
const SKIP = /\/api\/|zz-|\/visual\/|Debug|PoseDebugOverlay|node_modules/;
const CORE_HINT = /components\/(train|progress|profile|onboarding|bottomnav|ui|auth|ghost|mitts|bag|tour|rank|notifications|dashboard|coach)\/|app\/\[locale\]\/(home|train|progress|profile|onboarding|ghost|mitts|bag|tour|coach\/chat|history|fighter-profile|login)\//;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|tsx?)$/.test(f)) out.push(p);
  }
  return out;
}

function inScope(rel) {
  if (SKIP.test(rel) || HIDDEN_FILES.test(rel)) return false;
  const comp = rel.match(/^components\/([^/]+)\//);
  if (comp && HIDDEN_COMPONENT_DIRS.has(comp[1])) return false;
  const route = rel.match(/^app\/\[locale\]\/([^/]+)\//);
  if (route && HIDDEN_ROUTES.includes(route[1])) return false;
  return true;
}

const sourceFiles = () => [...walk(join(ROOT, "components")), ...walk(join(ROOT, "app"))]
  .map((p) => relative(ROOT, p)).filter(inScope);

/** Text below the 11 px floor (design rule). One finding per file. */
export function scanSmallText() {
  const out = [];
  for (const rel of sourceFiles()) {
    const lines = readFileSync(join(ROOT, rel), "utf8").split("\n");
    const hits = [];
    lines.forEach((l, i) => {
      // Plain sizes and both arms of a ternary (`fontSize: isDesktop ? 9 : 8`).
      for (const m of l.matchAll(/fontSize[:=]\s*\{?\s*(?:[^,}?]*\?\s*)?(\d+(?:\.\d+)?)(?:\s*:\s*(\d+(?:\.\d+)?))?/g)) {
        const small = [m[1], m[2]].filter(Boolean).map(Number).filter((v) => v > 0 && v < 11);
        if (small.length) { hits.push(`${rel}:${i + 1} fontSize ${small.join(" / ")}`); break; }
      }
    });
    if (!hits.length) continue;
    const core = CORE_HINT.test(rel);
    out.push({
      fingerprint: `a11y-small-text:${rel}`, kind: "a11y-small-text", source: "scanner",
      title: `Text under 11 px in ${rel} (${hits.length})`,
      evidence: hits.slice(0, 12), files: [rel],
      priority: (core ? 70 : 40) + Math.min(hits.length, 10),
      risk: classifyPath(rel).level,
      fix: "Raise each fontSize to ≥ 11; keep the layout (check 360 px); keep contrast ≥ 4.5:1.",
    });
  }
  return out;
}

/** White text dimmer than 0.45 alpha on the dark theme (contrast < ~4.5:1). */
export function scanLowContrast() {
  const out = [];
  for (const rel of sourceFiles()) {
    const lines = readFileSync(join(ROOT, rel), "utf8").split("\n");
    const hits = [];
    lines.forEach((l, i) => {
      const m = l.match(/\bcolor:\s*["'`]rgba\(255,\s*255,\s*255,\s*(0?\.\d+)\)/);
      if (m && Number(m[1]) < 0.45 && !/border|background|placeholder|disabled/i.test(l)) hits.push(`${rel}:${i + 1} white @ ${m[1]}`);
    });
    if (!hits.length) continue;
    const core = CORE_HINT.test(rel);
    out.push({
      fingerprint: `a11y-contrast:${rel}`, kind: "a11y-contrast", source: "scanner",
      title: `Low-contrast text in ${rel} (${hits.length})`,
      evidence: hits.slice(0, 12), files: [rel],
      priority: (core ? 60 : 30) + Math.min(hits.length, 10),
      risk: classifyPath(rel).level,
      fix: "Text colour ≥ rgba(255,255,255,0.5) (BRAND.faint) on the dark background; decorative-only elements can stay dim.",
    });
  }
  return out;
}

/** ESLint warnings, one finding per file. */
export function scanLint() {
  const r = spawnSync("npx eslint -f json", { cwd: ROOT, shell: true, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 5 * 60_000 });
  let report = [];
  try { report = JSON.parse(r.stdout); } catch { return []; }
  return report.filter((f) => f.warningCount > 0).map((f) => {
    const rel = relative(ROOT, f.filePath);
    return {
      fingerprint: `lint-warning:${rel}`, kind: "lint-warning", source: "scanner",
      title: `${f.warningCount} lint warning(s) in ${rel}`,
      evidence: f.messages.slice(0, 8).map((m) => `${rel}:${m.line} ${m.ruleId}: ${m.message.slice(0, 120)}`),
      files: [rel],
      priority: 35 + Math.min(f.warningCount, 5),
      risk: classifyPath(rel).level,
      fix: "Fix the warning without changing behaviour; never just disable the rule.",
    };
  });
}

/** Known RED items from the audit — tracked so they stay visible, never auto-worked. */
export function scanKnownRed() {
  const out = [];
  const storage = existsSync(join(ROOT, "storage.rules")) ? readFileSync(join(ROOT, "storage.rules"), "utf8") : "";
  if (/coach_applications\/\{uid\}\/\{file\}\s*\{\s*allow read:\s*if request\.auth != null;/.test(storage)) {
    out.push({
      fingerprint: "security:storage-coach-applications-read", kind: "security", source: "scanner",
      title: "Storage: applicant photos readable by any signed-in user; no upload size/type limits",
      evidence: ["storage.rules coach_applications allow read: if request.auth != null"], files: ["storage.rules"],
      priority: 95, risk: "RED", fix: "Owner-only + admin read; size and content-type limits; emulator test; owner deploys.",
    });
  }
  return out;
}

export function observe() {
  return [...scanKnownRed(), ...scanSmallText(), ...scanLowContrast(), ...scanLint()];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const f = observe();
  console.log(JSON.stringify(f.map(({ fingerprint, priority, risk, title }) => ({ fingerprint, priority, risk, title })), null, 1));
  console.error(`${f.length} findings`);
}
