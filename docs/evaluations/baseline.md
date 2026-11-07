# Baseline — 2026-11-07 (commit `d9da829`)

Measured in the Claude Code cloud container (Linux, Node 22, Chromium 1243 / SwiftShader).
Status words: PASS · FAIL · NOT RUN. Numbers are from this machine; re-measure on yours before comparing.

## Engineering

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | PASS — 0 errors, 23 warnings |
| Typecheck | `npx tsc --noEmit` | PASS (3.3 s) — JS not checked (`checkJs: false`) |
| Unit tests | `npm test` | PASS — 23 files, 231 tests, 3.5 s |
| Production build | `rm -rf .next && npx next build` | PASS — compile 14.3 s, total 19.3 s |
| Visual + playtests | `npm run test:visual` | PASS — 49/49 (46 screenshots, 3 WebGL playtests), ~5 min |
| Firestore rules | emulator, `scripts/rules-test/rules.test.mjs` | PASS — 24/24, **only with a root-level emulator config**; the README command FAILS (rules outside project dir, port 8085 vs 8080) |
| Dependency audit | `npm audit` | 25 findings: 4 critical (incl. `next`), 10 high, 10 moderate, 1 low |
| Secrets scan | `git grep` for Stripe / AWS / GitHub / private-key patterns | none found |
| CI | `.github/workflows/ci.yml` | lint + unit + build only; last run result NOT RUN here |

## Bundle & page weight

Client JS emitted: 150 chunks, 6.8 MB on disk (`.next/static/chunks`); largest chunks 380 / 372 / 355 / 344 KB.
Static assets: `public/` 38 MB (MediaPipe 22 MB, models 3.8 MB).

Page loads against local `next start` (gzip on), phone viewport 390×844, guest, warm server.
Bytes = what the browser received; LCP from `PerformanceObserver`. Local network — real phones will be slower.

| Route | JS KB | Total KB | Requests | Load ms | LCP ms |
|---|---|---|---|---|---|
| `/mn` (landing) | 2187 | 5009 | 49 | 623 | 764 |
| `/mn/home` | 1463 | 1918 | 39 | 311 | 168 |
| `/mn/train` | 2507 | **19622** | 54 | 328 | 476 |
| `/mn/progress` | 1446 | 1903 | 40 | 292 | 196 |
| `/mn/bag` (intro) | 2803 | **20065** | 52 | 230 | 124 |
| `/mn/tour` | 2182 | 2626 | 43 | 279 | 468 |

`/train` and `/bag` pull ~17 MB of MediaPipe (WASM + model) on mount — expected on `/train`
(preload so the round starts instantly), avoidable on the `/bag` and `/mitts` intro screens.

## Coach AI — punch detector

`node scripts/punch-eval/metrics.mjs` (JSON: `docs/evaluations/punch-baseline.json`). Deterministic
except the CPU timing. Data: 6 labelled clips, one southpaw fighter, 39 punches, MediaPipe lite @ 10 fps,
match = same hand within ±0.6 s.

| Class | Support | Precision | Recall | F1 |
|---|---|---|---|---|
| jab | 16 | 1.000 | 1.000 | 1.000 |
| cross | 10 | 0.889 | 0.800 | 0.842 |
| hook | 13 | 1.000 | 0.769 | 0.870 |
| **macro** | 39 | | | **0.904** |

Detection (any type): recall 0.897, precision 1.000, phantom punches 0.
Confusion: 1 hook typed as a cross; misses = 2 crosses + 2 hooks (crosses missed peak in the last
~0.2 s of a clip). Detector CPU in Node ≈ 0.05 ms/frame — **not** on-device latency (NOT RUN: needs phones;
MediaPipe inference dominates and isn't in this number).

**Limits:** one person, one room, one camera angle, southpaw only, no uppercuts, no "no-punch" negatives
beyond guard movement. These numbers say the detector works on these clips, nothing about users at large.
A real Coach AI baseline needs a consented, multi-person, multi-angle test set (see evolution-target.md).
