# AI changelog

One entry per cycle that changed code. Newest first.

## EVOLVE Phase Zero — repository audit + baseline (owner directive v1.0)
- No app code changed. Added `docs/architecture/current-state.md` (VERIFIED / INFERRED / UNKNOWN /
  BLOCKED inventory + ranked risks), `docs/architecture/evolution-target.md` (directive mapped onto what
  exists; smallest Engineer AI MVP; RED decisions), `docs/evaluations/baseline.md` (lint, typecheck,
  unit, build, visual, rules, audit, bundle + page weight, punch metrics).
- New measurement tool `scripts/punch-eval/metrics.mjs` (+ `docs/evaluations/punch-baseline.json`):
  per-class precision / recall / F1 + confusion for the rule-based detector on the labelled fixture —
  macro F1 0.904 on 39 punches from one southpaw fighter (not representative).
- Found: storage rules expose coach-application photos to all signed-in users and have no size / type
  limits; rules-test command broken as documented (24/24 PASS with a root config); MediaPipe loads on
  the /bag and /mitts intros; `next` critical advisory; no error monitoring; `build.log` committed.

## Game pipeline ideas (owner shared the "Sumiro" Opus + Blender + three.js build)
Taken: Blender → three.js environment, atmosphere, and the "play it, find bugs, fix, repeat" agent loop.
Not taken (RED: paid generation APIs + keys): Flux video, GPT Image turnarounds, Tripo image→3D.
- **Blender gym** — `tools/blender/gym.py` builds the room the heavy bag hangs in: concrete floor,
  brick walls with bright windows, a ring (deck, canvas, GAVANA apron text, red / blue / white corner
  pads, 3 ropes a side, steps), a bag rack with two spare bags, three hanging lamps with emissive bulbs.
  Exported with Blender 5.0.1 → `public/models/gym.glb` (92 KB).
- **Atmosphere** — `lightShaftShader` (GLSL, additive cone: bright at the lamp, fading to the floor,
  soft edges, slight flicker) under each lamp + warm point lights + drifting dust (count by quality tier).
- **HeavyBagScene** loads the gym (shadows per tier), cooler window light, wider camera.
- **3D playtests** — `tests/visual/play3d.spec.mjs` runs in real software WebGL (SwiftShader flags
  added to the Playwright config): starts a bag round, taps the bag and checks the hit counter and the
  swing angle, renders World Tour and Punch Teardown; fails on shader / WebGL / page errors or a blank
  canvas, and saves what it saw to `test-results/play3d-*.png`.
- Checked: 231/231 unit, 49/49 Playwright (46 visual + 3 playtests), lint 0 errors, build OK.

## Cycle 13 — unread badges readable
- Bottom-nav avatar badge (unread notifications) was 8 px text on a 14 px dot; menu-sheet badges 9 px.
  Now 11 px on a 17 px (avatar) / 20 px (menu) pill, shifted so it still sits on the avatar corner.
- Checked: lint, 231/231 unit, 46/46 visual (badges only show for signed-in users with unread items —
  not in the baselines).
- Remaining < 11 px in core: FighterHero (3), CombatMemoryPanel, AcademyLessonCard.

## Cycle 12 — "retry save" after a failed save
- After a failed save the result's save button became active again but still read "Save progress",
  next to the error text. `saveFailed` (Phase 0) is now passed page → TrainResultModal →
  ResultActionsSection and the button reads "Дахин хадгалах ↻" / "다시 저장 ↻" / "Retry save ↻".
- Checked: lint, 231/231 unit, 46/46 visual (state not in baselines — needs a signed-in failed save).

## 3D tech stack: React Three Fiber, physics, GLSL, Blender, WebGPU detection (owner: "Edgeer technology uudiig ch bas ashigla")
- **Heavy bag** — new route `/[locale]/bag` (+ metadata, sitemap; entry on /train). Punch at the camera
  (pose detection) or tap the bag; a 35 kg bag hangs on a ball joint and swings, dents and ripples where
  each punch lands. 30 s round → punches, pace, average / best power, max swing, mix. Nothing saved.
  - **React Three Fiber** (`@react-three/fiber` 9) for the scene (`components/bag/HeavyBagScene.js`).
  - **Physics engine**: `cannon-es` 0.20 (`lib/heavyBag.js`): bag body + point-to-point joint; punches
    become impulses by type / hand / snap (jab light & straight, cross heavier, hook across, uppercut
    up; ~20–35 N·s). 7 unit tests run the real physics in Node (swings, settles, stays on its chain).
  - **GLSL** (`lib/three/shaders.js`): bag shader — leather grain + seams, dent displacement and a red
    ripple ring per hit (4 hit slots); sky dome — gradient, sun disc + glow, stars at night, cloud
    dimming; water — travelling waves, Fresnel sky reflection, sun glint.
  - **Blender**: `tools/blender/heavy_bag.py` builds the bag (rounded ends, belly, three stitched bands,
    straps) and exports `public/models/heavy-bag.glb` (55 KB). Generated here with Blender 5.0.1
    (`bpy`); the scene falls back to a procedural cylinder if the model can't load.
- **World Tour** now uses the GLSL sky dome and water plane (river / coast), plus the quality tier.
- **WebGPU / WebGL**: `lib/three/renderCaps.js` detects WebGPU (navigator.gpu adapter) and WebGL2 and
  picks a quality tier (pixel ratio, shadows, shadow-map size, particle count, reduced motion).
  Rendering stays WebGL2 on purpose: GLSL ShaderMaterials don't run on three's WebGPU renderer and
  iPhones only got WebGPU in iOS 26; WebGPU-capable devices get the "high" tier.
- Checked: 231/231 unit, 46/46 visual, lint 0 errors, build OK; 3D renders verified with SwiftShader
  (bag swing + ripple with the Blender model, Tokyo water, Vegas night sky) — no shader errors.

## Roadmap Phase 6 — World Tour (owner: "gavana-д ашигла", world-simulator idea)
- New route `/[locale]/tour` (+ metadata, sitemap; entry row on /progress). Each of the 9 rank tiers
  unlocks a boxing city: Ulaanbaatar → Seoul → Tokyo → Bangkok → Manila → London → New York →
  Mexico City → Las Vegas (with a real arena name each).
- `lib/worldTour.js` (pure, 13 tests): stops, `tourProgress(xp)`, local time per time zone,
  mean solar time from longitude, sun elevation (declination / hour-angle), sky colours by sun
  (night / dawn / day / dusk, window glow), season by month + hemisphere, today's weather from each
  city's climate (seeded per date — no weather API), value-noise terrain (valley mountains for UB,
  a volcano for Tokyo / Mexico City), procedural street-grid city with downtown core, river or coast.
- `components/tour/TourScene.js`: three.js — vertex-coloured terrain (snow caps / winter snow),
  instanced buildings with shadows, the arena dome in the middle, real sun direction, fog by weather,
  snow / rain particles, slow auto-orbit, drag to rotate, WebGL fallback text.
- `components/tour/TourView.js`: city + arena, live chips (local time + phase, weather, sun °),
  3D scene, next-city XP bar + Train button, the journey list (locked cities show their XP).
- Visual: `/visual/tour` (Tokyo noon) and `/visual/tour-night` (Vegas evening) × 3 sizes; progress
  baselines updated for the new row. 43/43 visual, 224/224 unit, lint 0 errors, build OK. Checked the
  3D render with SwiftShader: Tokyo day, Vegas night neon, Ulaanbaatar at the real current time.
- No external map / terrain / weather data (would need API keys / network); all procedural.

## Roadmap Phase 4 — Mitt drill (reaction round) (approved: "4iig hii")
- New route `/[locale]/mitts` (+ metadata, sitemap; entry button on /train under Ghost Round).
  30 s round: the screen calls "1", "2", "1-2", "1-1", "slip", "roll" (by level easy/normal/hard);
  pads appear on the lead/rear side of the mirrored picture with a ring that empties over the answer
  window; beep on every call; live ✓ reaction ms / "wrong hand" / "too late". Result: accuracy,
  average / fastest reaction, best streak, per-call table, one tip for the weakest call.
- `lib/mittDrill.js` (pure, 13 tests): seeded schedule, stance-aware judging (lead/rear hand,
  order of a combo, one action answers one call), round summary + grade, `callAt`.
- `usePoseDetection.getDebugInfo()` now also returns `defenseStats` (slip / bob counts from the
  existing DefensiveDetector) — read-only; detection itself untouched.
- Nothing is saved (no data-model / XP change). Early "Finish" judges only the calls shown.
- Visual: mitts intro (real route), call, slip + "too late", result × mn-390 / mn-360 / ko-390
  (12 baselines). 37/37 visual, 211/211 unit, lint 0 errors, build OK. Checked a live round with
  Chromium's fake camera (calls appear, judged, finish → result).

## Roadmap Phase 2 — Fight HUD (approved: "2iig hii")
- `lib/fightHud.js` (pure, 11 tests): `roundClock` (whole seconds, ring fill, "final" in the last
  10 s — or last half of a short round), `createPunchTicks` (last 8 punches + count per type from the
  detector's running count), `createGuardWatch` (warns only when the guard metric is "too_low" for
  ≥60 % of ~0.9 s, never within 0.5 s of a punch, holds 1.2 s so it can be read).
- `components/train/FightHud.js` over the stage while recording: round-clock ring (red + number pop
  + red stage-edge pulse in the final seconds, "СҮҮЛИЙН СЕКУНД"), punch tick strip coloured like the
  punch mix, per-type counts, "Гараа өргө — эрүүгээ хамгаал!" warning. Respects reduced motion.
  Display only — scoring untouched.
- Visual: `/visual/hud` and `/visual/hud-final` fixtures, 6 baselines; train-recording baseline
  updated (ring). 25/25 visual twice, 198/198 unit, lint 0 errors, build OK.

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
