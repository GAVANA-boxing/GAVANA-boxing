# AI changelog

One entry per cycle that changed code. Newest first.

## Hidden features: the useful ones brought into the core loop (audit D; owner: "heregtei zuilsiig awch app deer gargan uyaldaa holbootoi ajluul")
- **Benchmark tests** (the old global challenges, now personal): Progress → "Сорилтын тестүүд" — speed test
  (20 s), combo test (30 s), jab minute (60 s), each with your best score and punches from your own sessions
  (`lib/benchmarks.js`, tested); Start opens Train with `?drill=<id>` and the test's name as the title. Train's
  "challenges" link goes there in core mode.
- **Boxing Academy path** on the Coach tab: the 10 technique lessons in order with progress (n/10, ✓ per
  lesson, next lesson button → guided round). Before, nothing in the app started lesson 1.
- **AI weekly plan** (workout builder) on the Coach tab: un-hidden; the plan is saved on the device
  (`lib/weeklyPlan.js`) instead of `training_programs` (readable by every signed-in user, so AI plans leaked
  into everyone's program list); each training day has "Start training"; guests are asked to sign in.
- Kept hidden (need other users / moderation / admin content): feed, reels, stories, explore, discover,
  inbox, sparring, events, gyms, leaderboard, fighters directory, creator, programs.
- Fixes: `/reels` (no locale) redirects to the localized route so core mode applies; `ai-analysis` hidden;
  the human-coach marketplace (coach profiles, apply, dashboard, "Coaches"/"My requests" tabs) hidden in core
  mode (the Coach tab is the AI coach); onboarding coach/gym buttons no longer land on hidden pages.
- Cleanup: removed unused `ScrollRow`, `dashboard/charts/FighterHero`, `messages/*.json` (unused, garbled),
  create-next-app SVGs; README rewritten (it had merge-conflict markers); "Джэб" → "жэб" in lessons; Coach
  section error texts localized.
- Run `20261108T043951Z-be32715` (RED: proxy.js; owner decision). Checked with curl on a production build:
  /reels → /mn/reels → /mn/home; /mn/coach/apply|dashboard|<id> → /mn/coach; /mn/coach/chat 200.

## Clarity (audit C)
- One fighting-style list: `lib/archetypes.js` (pressure / outboxer / counter / explosive / technician:
  names MN/KO/EN, one colour each, short descriptions, `normalizeArchetype` maps old onboarding keys
  technical→technician, brawler→explosive). Onboarding, profile edit, share card, DNA engine, first-round
  card, leaderboard/sparring and colour tables all use it; the unused `FighterStyleQuiz` is gone.
- One site address: `lib/site.js` (`NEXT_PUBLIC_SITE_URL`, default gavana-boxing.vercel.app) for share text,
  share cards, referral links, sitemap, robots (was a mix of gavana.app and the vercel address).
- No English in the MN core screens: desktop sidebar (with readable contrast), round titles ("PRESSURE
  INITIATOR" → "ДАРАМТ ЭХЛҮҮЛЭГЧ"), drill tags, punch-type tiles, round halves, streak modal, World Tour,
  Ghost round, badges, onboarding "YOU'RE IN", "Train руу буцах", mangled cues ("Эрж ре-сет хий!").
  The English-only analysis sentences show only in EN; the real-boxer style names ("Tank Davis") and the
  "Ring IQ" number that started at 70 are not shown at all. The English-only "next focus" (built from the
  removed made-up breakdown) is gone, so a round has fewer "one thing to fix" messages.
- One word each: дараалал (streak), жэб (jab), AI коуч (coach); "Өөрийгөө давах" (beat your best) is no
  longer also called "Ghost". The streak modal shows the daily streak (it showed the hidden challenge one).
- After a round: the first-round card's main button is "See my result" (it used to clear the result);
  the DNA share sheet opens from the Share button instead of popping up; the push-permission prompt waits a
  week after "Dismiss" (was every new browser session).
- Onboarding in core mode: stance → weekly goal → welcome (3 steps; the interest and role screens led to
  hidden features and their answers weren't used).
- Run `20261108T042629Z-620d50d` ACCEPTED (visual 60/60, stance screenshots updated).

## GAVANA Pro + pricing (owner: "Pro bolon uniig zow zohistoi zohioj taaruul")
- One definition: `lib/pro.js` — **9,900₮ / month, 79,000₮ / year (−33%)**, charged in MNT. Perks are only
  ones enforced in code: AI coach unlimited (free: 10 chat messages/day, counted server-side in
  `usage/{uid}`; the after-round debrief has its own 20/day so free users always get round feedback),
  2 streak saves/month (server), Fighter DNA report download (now also checked in `/api/dna-report`).
  Free forever: rounds, scores, AI debrief, progress/rank, 3D replay.
- `isProUser` also requires Stripe status active/trialing (past_due/canceled no longer keep Pro).
- Sale only when fully configured (`/api/stripe/config`: secret key + webhook secret + price + service
  account); otherwise /pro says "payments open soon" — no button that could take money without
  activating Pro. Checkout: monthly/yearly, locale return URLs, error codes (no raw English).
  Webhook: writes are checked (Stripe retries on failure), saves the customer id in `billing/{uid}`
  (server-only); `/api/stripe/portal` lets members cancel / change card (terms promised this).
- One Pro page `/[locale]/pro` (price, perks, free list, buy / manage); all Pro CTAs go there (ProGate,
  Fighter DNA panel, profile edit, coach quota message, Me menu). Removed: USD prices, false perk lists
  ("AI debrief, video analysis, priority sparring"), the coach "priority matching" banner, the creator
  Fan/Pro/Champion tiers (would have charged Pro), dead `?upgrade=1` link. Terms section 7 updated.
- Owner to do before selling: create Stripe prices 9,900 MNT/month and 79,000 MNT/year, set
  `STRIPE_PRICE_PRO`, `STRIPE_PRICE_PRO_YEARLY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `FIREBASE_SERVICE_ACCOUNT_BASE64`, enable the Stripe customer portal. Prices are a proposal — change
  `lib/pro.js` and the Stripe prices together.
- Visual: `/pro` mn-390 / mn-360 / ko-390. Run `20261108T041019Z-4271867` (RED payments/XP; owner decision).

## One truth for numbers (audit B)
- One score per round: `finalRoundScore` (lib/scoreConfidence.js) applies the confidence cap once on the
  Train page; the result screen, toast, saved session and XP preview all use it (before: screen capped,
  save/toast/XP raw, toast often showed the pixel-detector score).
- "How to earn XP" now states the server's real rules (score × 35 + grade bonus, ≤500/round, 10
  rounds/day, ≥3 punches; daily mission +50, streak day 3 +100 / day 7 +250; +20 per best-streak day;
  Pro = 2 streak saves/month). Removed the never-paid improvement bonus, likes XP and "Pro 2× XP".
- Streak XP banks at the best streak (`bestDailyStreak`), so breaking a streak no longer lowers XP/rank.
- Sidebar, Fighter DNA level and the AI coach context use the canonical account XP (same as
  Home/Progress); the desktop sidebar shows the translated rank instead of always "ROOKIE".
- Radar: reads `hitCount` / `breakdown.accuracy` (was `hits` / `accuracy`, never written); Speed and Guard
  come from the camera's pose measurements when available; Footwork no longer comes from the streak.
- Guard "too_low" (what the pose code emits) now triggers the guard fix / skill counts.
- During a round only the MediaPipe punch counter shows; the pixel "moves"/combo counters remain only
  as the fallback when pose detection isn't running.
- Left as is (noted): the server's rank-up celebration compares stored XP only.
- Run `20261108T035752Z-614f673` (RED: progression.ts; owner decision recorded).

## Trust fixes from the audit (owner: "dugnelteer garsan zuilsiig zasaj saijruulj ajil")
- Invented numbers removed: "combat telemetry" bars (score × 1.05 etc.), "BEAT %" (and no longer
  stored as `comparisonPercent`), "2,400+ fighters", "% match", hardcoded onboarding DNA preview %,
  `ai-analysis` scores from strength counts + `Math.random()`; first-session hook no longer defaults to
  "pressure / like Mike Tyson" without punches, and its "N more sessions" hint is right.
- AI: the analyst persona and debrief prompt must not invent or estimate numbers; users never see
  developer errors ("Invalid API key…").
- Words: counter archetype "Тохой тулаанч" (elbow) → "Контр тулаанч"; rule-made "ТРЕНЕРИЙН ДҮГНЭЛТ" →
  "АВТОМАТ ДҮГНЭЛТ"; weekly packages named by technique instead of boxers ("GGG" read as "666").
- No real boxer photos (owner: no rights): photo URLs removed from `lib/fighters.js`; coach technique
  cards are graphic. (Archetype images are AI-generated GAVANA art — kept.)
- World Tour says weather is typical for the season, not live; landing/login/manifest say the first
  round is 20 s (what guests get); onboarding no longer claims the camera measures power; removed the
  "Live group sessions — notify me" card that saved nothing.
- Privacy policy (MN/KO/EN) rewritten to match the code: what stays on the phone (video, stance photo,
  chat history), what the account stores, what goes to OpenAI (no email/name), services used, what's
  public, deletion by email. The `coach_memory` write/read had no Firestore rule (always failed) —
  removed, so "we don't keep your chat on our servers" is true.
- Tour screenshots now run without WebGL (stable); 3D covered by the playtest.
- Run `20261108T034913Z-ac2b81c` (RED: awardXp.js — field removal only; owner decision recorded).

## Audit (owner: "gavanag shalga shinjleed dugnelt garga")
- Read-only audit of the whole app + 16 screens at 390 px → `docs/audit/2026-11-08-gavana-audit.md`
  (MN). No code changed. Summary added to `docs/AI_KNOWN_ISSUES.md`.

## Roadmap Phase 5: personal procedural fighter
- `lib/avatar/fighterStyle.js` (pure, 6 tests): skin (6 tones), hair (none / buzz / short / bun, colour),
  build (lean / medium / heavy) from the user's choice or seeded from the uid; gloves + waistband in the
  rank colour (rookies keep red gloves).
- `lib/three/fighterAvatar.js` takes `style`: skin and kit colours, girth × build, hair caps on the head.
- 3D replay (`MotionReplay3D`): the "Classic" option is now **Mine** with a style picker (40 px swatches /
  buttons, MN/KO/EN), saved on this device; rank / seed come from the signed-in profile. The ghost keeps
  its glass look. No new files to download (unlike the 1.5–1.8 MB GLBs).
- Fixture `/visual/fighter` + 3 screenshots (canvas hidden, clock masked). Run `20261107T224511Z-fbdb167`
  ACCEPTED (unit 265, visual 57/57). Checked in Chromium: 3 looks render, no page errors.
- Not done yet: profile page / share card use (backlog item 5 follow-up).

## Roadmap Phase 7: stance check from one photo (onboarding)
- Onboarding stance step: "Detect from a photo" → one full-body photo in stance → MediaPipe
  PoseLandmarker in IMAGE mode (`lib/poseImage.js`, loaded only on tap; on device, nothing uploaded)
  → `lib/stanceFromPose.js` (pure, 7 tests): lead side from joint depth (feet and hands weighted most,
  scaled by shoulder width) → orthodox / southpaw pre-selected, plus guard height and foot width.
  Not sure (square-on, body cut off, no person) → a localized hint and manual choice stays.
- Mirrored selfies flip left/right; the result says so and the choice stays editable.
- Verified end to end in Chromium with a rendered 3D boxer image (bundle → model → result → radio
  selected). NOT validated on real photos of people — owner to try a few orthodox / southpaw shots.
- Visual fixture `/visual/stance` (mn-390, mn-360, ko-390). Run `20261107T223550Z-fbd5ffc` ACCEPTED
  (unit 259, visual 54/54).

## A11y: no text under 11 px in the core screens
- Every `fontSize` below 11 in the 36 files the observer flagged (68 values, incl. ternary arms and
  admin pages) is now 11. Observer: 0 small-text findings left in core code (low-contrast and lint
  findings remain). Run `20261107T222916Z-8ef4510` ACCEPTED; visual 51/51 unchanged — the fixture
  screens don't render these components, so their 360 px layout is not covered by screenshots.
- Outside the observer's core scope (sparring, programs, gyms, reels styles) there are still many
  9–10 px values — left for later cycles.

## Perf: MediaPipe loads only when a round starts on /bag and /mitts
- `usePoseDetection` takes `load` (default true). `/bag` passes `camera === "on"`, `/mitts`
  `phase !== "intro"`: the bundle, wasm and pose model (several MB) are no longer fetched just for
  opening the page. Checked in Chromium: 0 MediaPipe requests before Start, 4 after, on both pages.
  `/train` and `/ghost` unchanged. Run `20261107T221756Z-1de44c1` ACCEPTED.

## Landing: 3D cinematic intro (owner: "Intro hiilee blenderluu oruulj iluu saijruulaad ashiglaarai")
- The owner's canvas intro rebuilt in Blender (`tools/blender/intro.py`, 252 frames, 1280×720 30 fps,
  chrome letters, glove, spot cone, shockwave, crimson sweep) and encoded by
  `tools/blender/encode-intro.sh` → `public/intro/gavana-intro.{webm,mp4}` (~0.4 MB each) + poster.
- `components/landing/CinematicIntro.js` on the landing page: muted autoplay when in view (not with
  reduced motion), "Play with sound" restarts it with the original Web Audio soundtrack
  (`lib/intro/introAudio.js`) in sync; "BOXING" + localized tagline drawn over the video from 7.22 s;
  pause / mute / replay buttons (40 px, MN/KO/EN labels). 4:3 crop on phones so the lockup doesn't hit
  the letters; the sound button sits top-left.
- Checked in Chromium at 1280 and 360 px: plays, restarts with sound, controls appear, no console errors,
  no horizontal overflow.

## Dependencies: next 16.4.3 (owner: "bugdiin hii")
- `next` + `eslint-config-next` 16.2.4 → 16.4.3 (exact pin; fixes the critical Next.js RCE / proxy-bypass
  advisories, all `<=16.4.0`), plus `npm audit fix` (websocket-driver, zod, nanoid, source-map-js,
  protobufjs). `npm audit --omit=dev`: 10 (2 critical) → 4 high — all firebase → `@grpc/grpc-js`, no
  upstream fix yet.
- New lint rule flagged `components/ui/ErrorScreen.js`: "Go home" now assigns an absolute URL (still a full
  reload on purpose). Run `20261107T220759Z-1eabcf1`: lint 0/23, unit 252, build, visual 51/51,
  rules 43/43; the first run was REJECTED for that one extra warning.
- Repo hygiene (`1eabcf1`): committed `build.log` removed + ignored; old phase notes → `docs/archive/`.

## Storage rules hardening + functions locale whitelist (owner: "bugdiin hii")
- `storage.rules`: `coach_applications/{uid}` read is now owner-only (was any signed-in user); every
  upload must be `image/*` or `video/*` under a cap (images 10 MB, thumbnails 5 MB, story video 100 MB,
  reel video 200 MB); added `reels/videos/{uid}` and `reels/thumbnails/{uid}` matches — the paths
  `lib/uploadVideo.js` writes were not matched before, so those uploads were denied.
- `scripts/rules-test/storage.test.mjs` on the Storage emulator (19 cases); `npm run test:rules` now runs
  Firestore + Storage: 43/43 PASS. Run `20261107T214955Z-21f12cd` (RED → owner decision recorded).
- `functions/index.js` (`21f12cd`): retention pushes use `users.locale` only if it is mn/ko/en.
- NOT deployed. Owner: `firebase deploy --only storage,functions`.

## EVOLVE — self-improvement engine running (owner: implementation directive §17-23 + PRE-AUTHORIZED AUTONOMY POLICY v1.0)
- Engine C: persistent state in git on the branch — `evolve/queue.json` (tasks), `evolve/memory.json` (cycles),
  `evolve/lock.json` (distributed lock = a pushed commit; 45-min lease; lost race backs off),
  `evolve/control.json` (kill switch, daily budget, failure breaker — owner-controlled),
  `evolve/runs-index.json`; `scripts/evolve/observe.mjs` (finds text < 11 px incl. ternaries, low contrast,
  lint warnings, known RED security items), `scripts/evolve/cycle.mjs` (start / finish / status / add / release).
- Engine A demonstrated: cycles in this session (share card, coach styles, flaky-test fix — one REJECTED
  then fixed and ACCEPTED) and, outside this chat, by the **GAVANA Evolve runner** session
  (`session_01XsqRc7f7wzjyPWd5JQdzWx`) woken by the scheduled task `trig_0123oFdQS4k8m4dcWPQERWY6`
  (hourly, platform minimum; runner self-paces every 15 min via `send_later` per `docs/evolve/RUNNER.md`).
  First autonomous cycle: coach dashboard labels (`1e856b8`, ACCEPTED).
- Verified: kill switch → PAUSED; second start while locked → LOCKED; `/admin/evolution` fails closed
  (404 without ADMIN_UIDS, redirect without a valid signed cookie).
- Engine B: model registry `evolve/coach/models.json` (rule-v1 = current detector, macro F1 0.904 on the
  fixture), dataset manifest with provenance / consent / labels / split. Collect / label / train are
  BLOCKED (no consented multi-person data) — not operational, by design.
- `/admin/evolution` dashboard (owner-only): status, scheduler, tasks, test results vs baseline, punch
  metrics, approvals, alerts, cycle + run history, cost, baseline screenshots, stop / resume instructions.

## EVOLVE — Engineer AI MVP (owner: "A r hii")
- `scripts/evolve/check.mjs` (`npm run evolve:check`): VERIFY → EVALUATE → DECIDE → RECORD. Steps lint,
  typecheck, unit, build, bundle, punch metrics, optional visual / playtests and Firestore rules;
  gates against `docs/evaluations/baseline.json`; change risk from the diff; single-writer lock
  (`.evolve.lock`, stale-lock recovery); idempotency key (task + commit + diff); per-step timeouts;
  failing-step log tails with credential redaction; record in `docs/evaluations/runs/<id>.json`.
- `lib/evolve/runState.js`: the directive's run state machine (PENDING … EVALUATING → ACCEPTED /
  REJECTED / AWAITING_APPROVAL / BLOCKED / FAILED / CANCELLED), history, max two fix attempts,
  approval steps need a note. `lib/evolve/policy.js`: GREEN / YELLOW / RED per path — RED includes
  the automation's own guardrails (policy, runner, baseline, rules doc). 11 unit tests.
- `scripts/evolve/approve.mjs`: records an owner decision on an AWAITING_APPROVAL run.
- Rules tests fixed and isolated: own `scripts/rules-test/package.json` (the earlier `--no-save`
  install had silently replaced the app's firebase 12 with 10 in local node_modules — restored with
  `npm ci`), root `firebase.rules-test.json`, `npm run test:rules`, new CI job `rules` (Java 21).
- First baseline (15 metrics) from a full run: lint 0 / 23, typecheck 0, unit 241, bundle 6598 KB,
  punch macro F1 0.904, visual 49, rules 24 — all PASS.

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
