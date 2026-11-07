# Known issues

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
