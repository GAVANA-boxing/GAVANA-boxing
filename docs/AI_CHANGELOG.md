# AI changelog

One entry per cycle that changed code. Newest first.

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
