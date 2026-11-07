# GAVANA Evolve — target architecture, mapped onto what exists

Source: owner's "GAVANA EVOLVE — Master Engineering Directive v1.0" (2026-11-07).
This file says which parts already exist, what the smallest next step is, and what needs approval.
Principle kept from the directive: a change ships because measurements improved and a human approved
the risky part — not because an AI produced it.

## Engineer AI

| Directive item | Today | Gap |
|---|---|---|
| Observe → Prioritize → Implement → Verify → Record loop | 15-min session cycle + `docs/AI_*` memory; one issue per cycle; no forced commits | Runs are recorded as prose in `AI_CHANGELOG.md`, not as structured records; no automatic compare-to-baseline |
| QA | Vitest 231, Playwright 46 visual + 3 WebGL playtests | Visual/playtests not in CI; signed-in screens lack fixtures |
| Security | Rules tests (24), manual audits | Rules tests broken as documented and not in CI; storage rules gaps; no audit gate |
| Performance | Measured once (this baseline) | No budget, no regression check |
| Approval gates | Branch-only work, no PRs/deploys without the owner | Enforced by instructions, not by tooling |

**Smallest Engineer AI MVP (proposed, not built):**
1. `scripts/evolve/check.mjs` — runs lint, typecheck, unit, build, (optional) visual + playtests, punch
   metrics, bundle size; writes `docs/evaluations/runs/<run-id>.json` (`{ id, commit, startedAt, steps:
   [{ name, status: PASS|FAIL|NOT RUN, metrics }], verdict }`) and compares with `baseline.json`
   (fails if a test count drops, warnings rise, bundle grows > 5 %, macro F1 drops).
2. `lib/evolve/runState.js` — the directive's run state machine (PENDING → PLANNING → IMPLEMENTING →
   VERIFYING → EVALUATING → ACCEPTED | REJECTED | BLOCKED | FAILED | CANCELLED, + AWAITING_APPROVAL)
   as a pure, unit-tested reducer; a lock file so two runs never write at once.
3. Each engineering cycle calls `check.mjs` and records the run; CI gains the rules tests.
No new services, no paid APIs, no production access.

## Coach AI

| Directive item | Today | Gap |
|---|---|---|
| Pose extraction | MediaPipe on device | — |
| Punch recognition | Rule-based detector, protected | Baseline only on 39 punches / 1 person |
| Technique scoring, personal coach | Punch Teardown, Ghost analysis, FightHud guard watch, mitt drill | Thresholds unvalidated on real users |
| Dataset / labels / provenance / consent | None | Needs consent flow + storage + labelling UI — **RED** (data model, privacy) |
| Candidate models (TCN / GRU), model registry | None | Needs the dataset first; training runs off-Vercel (Python worker) — **RED** (infra, cost) |

**Next safe step:** extend the evaluation harness (more labelled landmark clips from consenting people,
orthodox + southpaw, two camera angles, uppercuts, explicit no-punch segments) before any model work.

## Evolution Core

| Component | Today | Proposal |
|---|---|---|
| Experiment registry / memory | `docs/AI_CHANGELOG.md`, git history | `docs/evaluations/runs/*.json` (MVP above); Firestore collections later |
| Policy / approval | Written rules (`AI_ENGINEERING_RULES.md`: protected areas, RED list) | Encode as `lib/evolve/policy.js` + checks in `check.mjs` |
| Release / rollback | Owner merges + Vercel | Rollback = Vercel redeploy of the previous build / `git revert`; document per change |
| Observability | Funnel events only | Sentry (or similar) — needs owner account + DSN (**RED**: new service) |
| Admin dashboard `/admin/evolution` | — | After runs are recorded; read-only first |

## Needs the owner's decision (RED)

1. Storage rules: make `coach_applications` owner/admin-only; add size + content-type limits.
2. Upgrade `next` (critical advisory) and audit the rest.
3. Error monitoring service (Sentry or similar) + DSN.
4. Coach AI dataset: consent wording, what is stored (landmarks only vs video), retention.
5. A shared rate-limit store for paid-API routes (e.g. Firestore counter or Upstash) — cost.
