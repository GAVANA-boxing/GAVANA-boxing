# GAVANA — current state (Phase Zero audit, 2026-11-07)

Branch `claude/review-refactor-code-DUmiX` @ `d9da829`. Every claim is tagged:
**VERIFIED** (checked in this repo / container today), **INFERRED** (follows from code, not run),
**UNKNOWN** (needs access we don't have), **BLOCKED** (can't be checked here).
Measurements and how to reproduce them: `docs/evaluations/baseline.md`.

## 1. Application

| Area | State | Evidence |
|---|---|---|
| Framework | Next.js 16.2.4 App Router, React 19.2.4, JS (+ a few `.ts` tests); `tsconfig` strict but `checkJs: false` | VERIFIED `package.json`, `tsconfig.json` |
| Routes | 65 `page.js` under `app/[locale]/…` (mn / ko / en); 13 API routes | VERIFIED `find app` |
| Product focus | `CORE_MODE` (on unless `NEXT_PUBLIC_CORE_MODE=false`) hides feed, reels, gyms, sparring, challenges, … from navigation; `proxy.js` redirects them | VERIFIED `lib/coreRoutes.js` |
| Core loop | Today (`/home`) → Train (`/train`, Training Studio state machine `lib/trainSession.js`) → Result (`TrainResultModal`) → Progress (`/progress`) | VERIFIED |
| Training modes | Train, Ghost Round (`/ghost`), Mitt drill (`/mitts`), Heavy bag (`/bag`, R3F + cannon-es), World Tour (`/tour`), Punch Teardown (result) | VERIFIED |
| Secondary modules | Coach chat (`/coach/chat`, OpenAI), coach marketplace, sparring, reels, gyms, events, shopping-type pages exist but are hidden by CORE_MODE | VERIFIED routes; usage UNKNOWN |
| i18n | `lib/locales/{mn,ko,en}.js` + inline `loc()`; `HtmlLang` sets `<html lang>` | VERIFIED |
| Local-only eval pages | `app/[locale]/zz-eval/*`, `public/zz-eval/*` (37 MB) exist in this container, git-ignored, not tracked | VERIFIED `.gitignore:49-50`, `git ls-files` |

## 2. Data & backend

| Area | State | Evidence |
|---|---|---|
| Auth | Firebase Auth (client); API routes wrapped in `withAuth` / `withAdmin` (`lib/withAuth.js`) — all 13 routes checked | VERIFIED |
| Admin | `ADMIN_UIDS` + signed `admin_session` cookie (`ADMIN_SESSION_SECRET`) | VERIFIED code; production env values UNKNOWN (were unset on 2026-11-06 per owner) |
| Firestore | Rules in `firestore.rules`; public `users/{uid}` (no email), owner-only `users_private`, server-written XP (`/api/score/session`, `lib/domain/scoreGuard.js`) | VERIFIED |
| Rules tests | `scripts/rules-test` — 24 cases **PASS** on the emulator, but only with a root-level config: the documented command fails ("firestore.rules is outside of project directory", port mismatch) | VERIFIED (workaround run) |
| Storage | `storage.rules`: uploads limited to the owner's folder, **no size or content-type limits**; `coach_applications/{uid}/*` (applicant photos) **readable by any signed-in user** | VERIFIED file; exposure in production INFERRED |
| Cloud Functions | `functions/index.js`: `streakAtRisk`, `winBack` scheduled pushes (FCM) | VERIFIED code; deploy state UNKNOWN |
| Rate limiting | In-memory maps in 6 API routes | VERIFIED; on Vercel serverless each instance has its own map → limits are per-instance, weak (INFERRED) |
| Paid APIs in use | OpenAI (`/api/chat`, `/api/ai-breakdown`), Stripe (checkout, webhook) | VERIFIED code; spend UNKNOWN |
| App Check | Not used | VERIFIED (`git grep`) |
| Secrets in git | None found (Stripe/AWS/GitHub/private-key patterns). Firebase web API key is in client code (public by design) | VERIFIED |

## 3. Coach AI (camera)

| Area | State | Evidence |
|---|---|---|
| Pose | MediaPipe Pose Landmarker (lite, WASM + model served from `public/mediapipe`, 22 MB) on the device | VERIFIED |
| Punch detection | Rule-based `lib/punchPhaseDetector.js` (2D state machine + 3D world-landmark typing, lead-hook rule). Protected — not modified | VERIFIED |
| Defence | `lib/defensiveDetector.js` (slip / bob counts) | VERIFIED |
| Labelled data | `tests/fixtures/punch-landmarks.json`: 6 clips, **one southpaw fighter**, 39 punches, landmarks only (no video). Videos live on `punch-clips*` branches (personal footage) | VERIFIED |
| Eval tooling | `scripts/punch-eval` (browser run over video + offline replay) and new `metrics.mjs` (per-class metrics on the fixture) | VERIFIED |
| Baseline | macro F1 **0.904**, detection recall 0.897, precision 1.0 on that fixture — tiny, single-person set; not representative | VERIFIED (`docs/evaluations/punch-baseline.json`) |
| On-device latency | Not measured | BLOCKED (needs real phones) |
| Training pipeline / model registry / consented dataset | Do not exist | VERIFIED absent |

## 4. Quality & delivery

| Area | State | Evidence |
|---|---|---|
| CI | `.github/workflows/ci.yml`: lint + Vitest + build on push to `main` / `claude/**` and PRs. No visual tests, no rules tests, no audit | VERIFIED file; latest CI result UNKNOWN here |
| Unit tests | 23 files, 231 tests, PASS, 3.5 s | VERIFIED |
| Visual / playtests | Playwright: 46 screenshot tests + 3 WebGL playtests, PASS, ~5 min; local only (baselines are machine-specific) | VERIFIED |
| Lint | 0 errors, 23 warnings | VERIFIED |
| Typecheck | `tsc --noEmit` PASS — but `checkJs: false`, so JS (almost all code) is not type-checked | VERIFIED |
| Dependencies | `npm audit`: 25 (4 critical incl. `next`, 10 high) — same before the 3D packages were added | VERIFIED |
| Deploy | Vercel; owner merges to `main` and deploys | INFERRED from history; preview/staging setup UNKNOWN |
| Monitoring | No Sentry / OpenTelemetry; funnel events to Firestore (`lib/funnel.js`, `/api/admin/funnel`) | VERIFIED |
| Engineering memory | `docs/AI_ENGINEERING_RULES.md`, `AI_TASK_BACKLOG.md`, `AI_KNOWN_ISSUES.md`, `AI_CHANGELOG.md`; 15-minute engineering cycle via the session scheduler (paused during this audit) | VERIFIED |
| Repo hygiene | `build.log` is committed; root has several old phase / release markdown files | VERIFIED |

## 5. Highest-risk gaps (ranked)

1. **Storage: applicant photos readable by every signed-in user; no upload size/type limits.** Privacy + cost risk. Fix = rules change → needs owner approval (RED).
2. **`next` has a critical advisory** (and 24 other audit findings). Upgrade = dependency change across the app → needs approval and a full test pass.
3. **Rules tests aren't runnable as documented and aren't in CI** — the only guard on the privacy rules can silently rot.
4. **No production error monitoring** — regressions on real phones are invisible.
5. **Coach AI has no real evaluation set** — 39 punches from one person; any "model improvement" claim today would be unfounded.
6. **Per-instance in-memory rate limits** on paid-API routes (OpenAI) — weak cost protection.
7. **MediaPipe (≈17 MB) loads on the intro screens of /bag and /mitts** before the user starts — mobile data and time (see baseline).
8. **JS isn't type-checked** (`checkJs: false`).
