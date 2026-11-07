# AI engineering rules — GAVANA Boxing

Read this (and CLAUDE.md) before every change. Keep it short and current.

## Stack and shape
- Next.js 16 App Router (`app/[locale]/…`, locales mn / ko / en), React 19, Firebase Auth + Firestore,
  Vercel. Tests: Vitest (`tests/*.test.*`), visual regression with Playwright (`tests/visual`).
- `CORE_MODE` (`lib/coreRoutes.js`) hides everything outside Train → Score → Progress
  (feed, reels, gyms, sparring, …); `proxy.js` redirects those routes. Don't polish hidden routes.
- One XP number (`getAccountXp`, server-written sources only) and one rank ladder (`lib/xp.js`).
- Score / XP are written by `/api/score/session` (anti-cheat in `lib/domain/scoreGuard.js`).

## Protected — do not change without the owner's explicit OK
- `lib/punchPhaseDetector.js` (punch detection / lead hook / uppercut) — paused.
- `firestore.rules`, auth, XP / rank math, the training-session data model, push sending.
  (If rules change: run `scripts/rules-test` on the emulator.)

## 3D
- three.js imperative scenes (MotionReplay3D, TourScene) and React Three Fiber (HeavyBagScene); physics
  with cannon-es; GLSL in `lib/three/shaders.js`; quality via `lib/three/renderCaps.js`.
- Models: build with Blender scripts in `tools/blender/` (run: `python -I tools/blender/<file>.py` with
  `pip install bpy`, or `blender --background --python …`), export GLB to `public/models/`.
- Visual tests hide 3D canvases (GPU output differs per machine). `tests/visual/play3d.spec.mjs` playtests
  the 3D modes in SwiftShader WebGL (errors, blank canvas, interaction) — look at `test-results/play3d-*.png`
  after a 3D change, and add a playtest for every new 3D mode.

## Design system
- `components/ui/brand.js`: BRAND, btnPrimary, btnSecondary, glass, glassCard, pageBackground,
  displayTitle, kickerPill, kickerDot, sectionLabel. Shared: BrandHeader, PromptBanner, ErrorScreen.
- Text ≥ 11 px; text colour on the dark background ≥ 4.5:1 (BRAND.faint = white 50 % = 5.3:1);
  tap targets ≥ 40 px; no horizontal overflow at 360 px; every string in MN / KO / EN (`loc()`).
- `html, body { overflow-x: clip }` — never `hidden` (it silently breaks every `position: sticky`).
- Error boundaries read the locale from `usePathname()` (reading `document` causes hydration errors).

## Every change
1. `npm run evolve:check -- --task "…"` (runs lint, tests, build and the rest — see above).
2. UI change → `npm run test:visual`. If a screenshot diff is an intended change, look at it, then
   `npm run test:visual:update` and commit the new baselines in the same commit.
3. Never commit `app/[locale]/zz-eval/`, `public/zz-eval/`, `test-results/`, secrets, personal
   recordings or model IDs.

## Evolve check (Engineer AI MVP) — every change goes through it
- `npm run evolve:check -- --task "<what the change does>"` (+ `--visual` for UI / 3D, `--rules` for
  anything near data access) runs lint, typecheck, unit, build, bundle size, punch metrics (+ visual /
  playtests, Firestore rules), compares with `docs/evaluations/baseline.json` and writes
  `docs/evaluations/runs/<id>.json`. Skipped steps are recorded as NOT RUN, never as PASS.
- Verdicts: **ACCEPTED** (exit 0) → commit code + run record, push the branch.
  **REJECTED** (1) → fix (max two attempts, then stop and report) or revert; never commit failing code.
  **AWAITING_APPROVAL** (2) → the change touches RED paths (`lib/evolve/policy.js`); an automated
  cycle must revert it and report instead. **BLOCKED** (3) → another run holds `.evolve.lock`.
- Gates: no new lint errors / warnings, typecheck clean, unit count never drops, 0 failures,
  bundle ≤ +5 %, punch macro F1 and phantoms no worse, visual / rules no failures or fewer passes.
- The baseline, the policy, the runner and this file are RED: changing them needs the owner.
  `--write-baseline` only after the owner agrees the new numbers are the new normal.
- Record an owner decision: `node scripts/evolve/approve.mjs <run-id> --accept|--reject --note "…"`
  — only for a decision the owner actually made (quote where).

## Automation (15-minute cycles)
- A cycle does not have to commit. If nothing worth fixing is found, a fix needs approval, or a
  test fails and can't be fixed safely: change nothing, report, and note it in AI_KNOWN_ISSUES.md.
- One problem per cycle, smallest change, at most two fix attempts.
