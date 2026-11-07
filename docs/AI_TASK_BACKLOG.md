# AI task backlog

Status: TODO · BLOCKED (needs approval) · DONE. Highest priority first.

## P1
- **Training Studio session state machine** — BLOCKED (design proposal, needs approval: touches the
  core training flow). States today are spread over `phase`, `isCountingDown`, `isRecording`,
  camera error flags and saving flags in `app/[locale]/train/page.js` + `hooks/useCameraSession.js`.
  Proposed explicit machine (pure reducer in `lib/trainSession.js`, unit-tested):
  `idle → requestingCamera → (cameraDenied | ready) → countdown → recording ⇄ paused → finishing →
  saving → (result | saveFailed) → idle`, plus `error` from any state. Each state defines what the
  screen shows and which buttons exist. Evidence of the need: with the camera denied the stage
  still shows a "REC" label (`train/page.js` fallback block) although nothing is recording.
- Camera-permission-denied screen: say how to re-enable the camera per browser (iOS Safari,
  Android Chrome), in MN / KO / EN. Baseline: `tests/visual/__screenshots__/train-*.png` already
  show the denied state.

## P2
- Push notification texts: user-to-user pushes localized in 40bcf61 (another session). Still to
  check: `functions/index.js` retention pushes — read-only first; changing what is sent is RED.
- `profile/[userId]` layout metadata (per-user title, noindex).
- Coach chat header / persona chips in the brand style.
- Ghost recording / viewing microcopy (small caps text).

## DONE
See AI_CHANGELOG.md.
