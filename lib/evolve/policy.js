// Evolve — what an automated change may touch on its own.
//
// Mirrors docs/AI_ENGINEERING_RULES.md: GREEN = do it, YELLOW = do it and say so
// in the report, RED = stop and get the owner's approval. A run whose diff
// touches a RED path can't be ACCEPTED automatically — it goes to
// AWAITING_APPROVAL. Pure; tested in tests/evolvePolicy.test.js.

const RULES = [
  // RED — the automation's own guardrails: an agent must not loosen the policy,
  // the gates, the run machine or the baseline it is judged against.
  { level: "RED", why: "evolve guardrails", test: /^lib\/evolve\/|^scripts\/evolve\/|^docs\/evaluations\/baseline\.json$|^docs\/AI_ENGINEERING_RULES\.md$|^evolve\/control\.json$/ },
  { level: "RED", why: "model registry (promotion needs the owner)", test: /^evolve\/coach\/models\.json$/ },
  // RED — security, money, data model, protected AI, production config
  { level: "RED", why: "security rules", test: /^(firestore|storage)\.rules$|^firestore\.indexes\.json$/ },
  { level: "RED", why: "auth / admin", test: /^lib\/(withAuth|verifyAuth|adminSession|AuthContext)\b|^app\/api\/admin\/|^components\/AdminSessionBootstrap/ },
  { level: "RED", why: "XP / rank / scoring", test: /^lib\/(xp|domain\/)|^app\/api\/score\// },
  { level: "RED", why: "protected punch detector", test: /^lib\/punchPhaseDetector\.js$/ },
  { level: "RED", why: "push sending / Cloud Functions", test: /^functions\/|^app\/api\/(push-notify|rank-notify)\// },
  { level: "RED", why: "payments", test: /^app\/api\/stripe\// },
  { level: "RED", why: "production / deploy config", test: /^(firebase\.json|next\.config\.mjs|proxy\.js|vercel\.json|\.env.*)$|^\.github\/workflows\// },
  { level: "RED", why: "dependencies", test: /^package(-lock)?\.json$/ },
  // YELLOW — server code, data access, shared state
  { level: "YELLOW", why: "API route", test: /^app\/api\// },
  { level: "YELLOW", why: "server / data helpers", test: /^lib\/(server|privateProfile|privacyMigration|firebase|lazyFirebase)/ },
  { level: "YELLOW", why: "hooks with data access", test: /^hooks\// },
  // GREEN — UI, pure libs, tests, docs, tooling
  { level: "GREEN", why: "docs", test: /^docs\/|\.md$/ },
  { level: "GREEN", why: "tests / evaluation", test: /^tests\/|^scripts\/(punch-eval|rules-test)\/|^firebase\.rules-test\.json$|^docs\/evaluations\/runs\// },
  { level: "GREEN", why: "repo hygiene", test: /^\.gitignore$/ },
  { level: "GREEN", why: "evolve state written by the cycle tooling", test: /^evolve\/(queue|memory|lock|runs-index)\.json$|^evolve\/coach\/datasets\// },
  { level: "GREEN", why: "UI / pure code", test: /^(app|components|lib|context|public|tools|messages)\// },
];

const ORDER = { GREEN: 0, YELLOW: 1, RED: 2 };

/** Level for one path (unknown paths are YELLOW: look before trusting). */
export function classifyPath(path) {
  const p = String(path || "").replace(/^\.\//, "");
  for (const r of RULES) if (r.test.test(p)) return { path: p, level: r.level, why: r.why };
  return { path: p, level: "YELLOW", why: "unclassified path" };
}

/** Level for a whole change = the highest of its files. */
export function classifyChange(paths) {
  const files = (paths || []).filter(Boolean).map(classifyPath);
  const level = files.reduce((m, f) => (ORDER[f.level] > ORDER[m] ? f.level : m), "GREEN");
  return { level, files, red: files.filter((f) => f.level === "RED") };
}

/** Whether a verified, passing change may be accepted without a human. */
export function canAutoAccept(change) {
  return change.level !== "RED";
}
