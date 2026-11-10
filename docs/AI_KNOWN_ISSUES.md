# Known issues

- P0 privacy FIXED in code (2026-11-10): `training_sessions` / `user_training_profile` owner-only; public
  rank from server-written `users.publicXp`. Live only after the rules deploy (GitHub Action
  `firebase-deploy.yml`, needs the owner's one secret). Until a user's next round their public rank falls
  back to stored XP + streak (can show lower). Hidden features that read other people's rounds stop working
  when the rules are live: leaderboard (`useLeaderboardData`), reel author stats (`useReelFeed`) — both
  hidden in CORE_MODE; move them to `publicXp` before un-hiding.
- Funnel: retry_round counts a round after a result in the same browser visit (sessionStorage), so a
  retry the next day is a return (D1/D7), not a retry. D7 is from app_opened, not "first valid round".
- Fighter dashboard (`/fighter-dashboard`, off by default): the orders, video-analysis and benchmark sections
  have no data source yet — rules + indexes for `video_analyses`, `orders`, `products`, `benchmarks` are in
  the repo but NOT deployed (`docs/architecture/platform-v2.md` §5); clip analysis works on-device (plays the clip
  in real time — a 3-min clip takes 3 min; a hidden tab pauses it); no payment provider (Stripe
  doesn't serve Mongolian entities; QPay merchant contract needed), no consented benchmark clips.
- CV: inference runs on the main thread at ~10 fps (detector tuned for it); camera has no resolution
  constraint; no App Check; punch dataset is 6 clips of one fighter. See the same doc §2–§4.

- **Audit 2026-11-08** (`docs/audit/2026-11-08-gavana-audit.md`): A–D fixed the same day (see its section 6).
  Still open: Train idle screen overload; guest first round ("choose stance" with no control, 1.4 s
  auto-start); three design-token sources; server rank-up celebration compares stored XP only; duplicate
  rank-up modals; 37 unused exports; stance-from-photo not tried on real photos; Pro not sellable until the
  owner creates MNT Stripe prices and sets env vars.

- Visual baselines were made in the Claude Code cloud container (Chromium 1243, Linux). On another
  machine the first run will differ — regenerate there with `npm run test:visual:update` before
  comparing.
- Training Studio visual tests use Chromium's fake camera; the video/canvas are made transparent,
  so the picture itself and the pose overlay are not compared — only the UI around them.
- Signed-in screens (profile, history, fighter DNA) have no visual baselines; they need fixtures
  like `/visual/progress`.
- Punch detection: lead hooks 5/5 on one fighter's clips, uppercuts not detected (no clips) —
  paused by the owner.
- Push messages to real users can't be tested here (no FCM credentials in the container).
- Visual threshold is 1% of pixels: a small icon/text change can pass unnoticed. After an
  intended UI change, regenerate that screen's baselines with `--update-snapshots=all`.
- Punch Teardown thresholds are first guesses checked only on synthetic data; MediaPipe world
  landmarks are noisy at 10–20 fps, so short phases (Load/Rotate) can be 1–2 frames on real punches.
- Fight HUD tick strip: the detector exposes only the latest punch type, so several punches between
  two 150 ms polls are all shown as that type (rare; counts stay right).
- Mitt drill: punches are taken from the detector's running count at each 80 ms poll, so reaction
  times can read up to ~80 ms slow, and two punches inside one poll both get the latest hand.
  Untested with real punches here (fake camera only).
- Heavy bag: punch power is an estimate from the detector's snap velocity; impulses tuned by feel
  (~20–35 N·s), not measured. Tap mode exists for devices without a camera.
- 3D scenes render with WebGL2 even on WebGPU devices (GLSL shaders); a WebGPU path would need the
  shaders rewritten in TSL.
- `npm audit` reports issues in the dependency tree (pre-existing; not introduced by R3F/cannon-es —
  check before upgrading).
