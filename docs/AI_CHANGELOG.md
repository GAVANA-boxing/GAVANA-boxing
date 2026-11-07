# AI changelog

One entry per cycle that changed code. Newest first.

## Roadmap Phase 1 — Punch Teardown replay (approved: "0, 1-ийг Hii")
- `lib/punchTeardown.js` (pure): for one punch of a recorded round finds Load → Rotate → Extend →
  Return (peak reach near the detected moment, closest hand before/after, 25 % / 60 % of travel)
  and measures shoulder turn, hip turn, elbow at full reach, reach %, the other hand's guard and
  return time; checks per punch type (straight arm for jab/cross, shoulder + hip turn for the cross,
  guard hand, fast return) → grade good / ok / fix. `syntheticReplay()` builds a test round.
  9 unit tests.
- `components/train/PunchTeardown.js`: slow 3D replay focused on the chosen punch, tappable phase
  strip (freezes the fighter in that phase), 6 measurement panels, punch picker (starts on the punch
  with the most to fix), plain tips MN/KO/EN. Opened from the result screen ("Цохилт задлал").
- `MotionReplay3D` gained `focus` (loop one window at ¼ speed), `hud(t, seek)` and `extra`; in focus
  mode the avatar picker / punch markers / next-punch are hidden. Existing replay unchanged.
- Visual: `/visual/teardown` fixture (synthetic round) + baselines teardown mn-390 / mn-360 / ko-390
  (3D canvas hidden; HUD, panels, picker, tips compared). 19/19 visual, 187/187 unit, lint 0 errors.

## Roadmap Phase 0 — Training Studio state machine (approved by the owner: "0, 1-ийг Hii")
- `lib/trainSession.js`: named studio states (requestingCamera, cameraDenied, cameraUnavailable,
  ready, countdown, recording, result, saving, saved, saveFailed), derived from the existing flags;
  legal-transition table (dev console warning on an illegal move); per-state UI spec
  (dock, start label, stage message, retry, REC). 13 unit tests.
- `/train` renders from it: "Таймертай раунд эхлүүлэх" when there is no camera, "Дахин раунд"
  after a result, dock hidden while saving, retry only between rounds, `data-studio-state` on the stage.
- Camera errors split: permission (NotAllowed/Security) vs no/busy camera (own message, no
  permission steps). `useCameraSession` exposes `cameraError`.
- Timer-only round no longer says "Бичиж байна" (recording): HUD shows "Таймер · камергүй".
- Found + fixed: the camera flip button was dead and the selfie preview un-mirrored since commit
  7bac3e9 (June) dropped `facingMode`/`toggleCamera` from the hook while the page still used them.
- `useTrainingActions` exposes `saveFailed`.
- Visual: fake camera in the Playwright config; new baselines train-live (390, 360),
  train-recording (390), train-nocam (390); "train" now simulates NotAllowedError explicitly.
  16/16, two runs stable. 178/178 unit, lint 0 errors.

## Cycle 11 — Train lesson focus card text
- `TrainingFocusCard` (shown on /train when arriving from a fighter technique or academy lesson):
  4 labels 10.5px → 11px. Not in the visual baselines (needs lesson context), so baselines unchanged.
- Checked: lint, 165/165 unit, 12/12 visual.

## Cycle 10 — onboarding small text
- Grep of core screens for fontSize < 11: onboarding had 8.5–10px with 0.2–0.45 white (DNA
  preview kicker/labels/footnote, terms line, step counter, kicker, field labels). All → 11px,
  0.55–0.6 white; terms/privacy links 0.4→0.75. DNA dimension label column 68→80px for 11px text.
- Checked: lint, 165/165 unit, 12/12 visual. Onboarding needs sign-in → no screenshot here.
- Remaining <11px in core: FighterHero (3), ProfileTab/MenuSheet (1 each),
  CombatMemoryPanel, AcademyLessonCard; Debug* / PoseDebugOverlay are dev-only; FighterShareCard is
  an exported image.

## Cycle 9 — 9px type token
- `FONT_SIZE.xs` was 9px (below the 11px rule). Raised to 11. Used in 5 places: the 3D replay
  kicker (Ghost / Result — core) and the admin FunnelCard. Their 0.3–0.4 white text raised to
  0.55–0.6 for contrast.
- Checked: lint, 165/165 unit, 12/12 visual, Ghost at 360×800 (kicker readable, no overflow).

## Cycle 8 — Ghost camera error + microcopy
- `/ghost` camera error: was one generic line on a see-through red box that sat over the angle
  buttons (unreadable). Now: permission denied → per-platform steps (shared
  `cameraPermissionHelp`, which now takes the screen's own retry button name — "Дагаж хий");
  no camera / busy → its own message. Box is opaque with a shadow.
- "GHOST" label 9→11px; coach-motion caption 0.45→0.6 white.
- Checked: lint, 165/165 unit (+1 retry-label test), 12/12 visual (Train text unchanged), build,
  Playwright at 360×800 with an Android UA and a rejected getUserMedia → steps readable, no overflow.

## Cycle 7 — coach chat text below the 11px floor
- Checked `hooks/useFcmToken.js`: the locale it writes already comes from
  `getLocaleFromPathname` (mn/ko/en only) — no client fix needed; the server whitelist stays RED.
- Coach chat (core route): header "AI" badge 9→11px, TechniqueQuickAsk fighter kicker 10.5→11px,
  CoachEmptyState labels 0.45→0.6 white (contrast).
- Checked: lint, 164/164 unit, 12/12 visual. Coach chat needs sign-in, so no screenshot here
  (guest is redirected to /login) — see AI_KNOWN_ISSUES.

## Cycle 6 — push click stays inside the app
- Read-only check of `functions/index.js` retention pushes: copy is localized MN/KO/EN and
  throttled; OK. Found: the click URL is `/${users.locale}/train`, and `locale` is written by the
  client, so junk like "/evil.com" makes "//evil.com/train" (another site).
- `public/sw.js` notificationclick now resolves the URL against the app origin and opens only
  same-origin paths (else "/"); open-window match uses `startsWith(origin + "/")`.
  Checked with 6 URLs (relative, protocol-relative, absolute foreign, query/hash, missing,
  javascript:). The server-side whitelist is RED → backlog.

## Cycle 5 — profile page metadata
- `profile/[userId]/layout.js`: title was "Name — GAVANA Boxing | GAVANA Boxing" (root template
  appended again) → absolute title. OG url pointed at a hard-coded `gavana-boxing.web.app` and
  at `/profile/<username>` although the route is keyed by uid → relative `/{locale}/profile/{uid}`
  (metadataBase) + canonical. Added `noindex, nofollow` (page needs sign-in). Fallback title
  localized MN/KO/EN.
- Checked: build OK, `/mn|ko|en/profile/<unknown uid>` → localized title + robots noindex.
  Real-profile OG not checked here (would read production data).

## Cycle 4 — how to turn the camera back on
- `/train` camera denied: new hint box with the steps for iOS Safari («aA» → Website Settings →
  Camera), Android Chrome (lock icon → Permissions → Camera) or desktop (lock icon → Camera),
  MN / KO / EN. Pure helper `lib/cameraHelp.js` + `tests/cameraHelp.test.js` (4 tests).
- Retry button moved above the hint and given a 40px tap target; title 20→18px and top padding
  48→32 so everything stays above the Start dock on 360×800.
- Train baselines regenerated on purpose; 12/12 visual, 164/164 unit, lint 0 errors.

## Cycle 3 — camera-denied text no longer under the Start dock
- `/train` with no camera: the explanation and the "retry camera" button sat in the middle of the
  82dvh stage, behind the sticky Start dock + nav on 360×800. The fallback block is now
  top-aligned (`trainStyles.fallback`: alignContent start, 48px top padding).
- Train baselines regenerated on purpose; 12/12 visual, 160/160 unit, lint clean.
- Still possible on very short phones (≈640px tall) — the real fix is part of the BLOCKED
  Training Studio state machine (dock content per state).

## Cycle 2 — camera-denied stage icon
- `/train` with no camera: the stage showed a red "REC" label although nothing was recording.
  Replaced it with a camera-off icon in a red circle (`train/page.js`, `trainStyles.fallbackMark`).
- Train visual baselines regenerated on purpose (`--update-snapshots=all`; the old ones still
  passed because the change is under the 1% pixel threshold). 12/12 visual, 160/160 unit, lint 0 errors.

## Cycle 1 — visual regression baseline
- Added Playwright visual tests for Today (/home), Training Studio (/train), Result and Progress at
  390×844 and 360×800 (MN) and 390×844 (KO): 12 baselines in `tests/visual/__screenshots__`,
  plus a no-horizontal-overflow check on each.
- Result and Progress need a signed-in user, so they render from fixed data at
  `/[locale]/visual/[screen]` — only when `NEXT_PUBLIC_VISUAL_FIXTURES=1` (404 otherwise).
- Clock fixed to 2026-11-06 12:00 KST, camera stream masked, first-run overlays suppressed;
  two consecutive compare runs: 12/12 pass.
- Not in CI: screenshots depend on the machine's fonts / GPU. Run locally before pushing UI work.

Earlier work (before this log): see `git log` on `claude/review-refactor-code-DUmiX`.
