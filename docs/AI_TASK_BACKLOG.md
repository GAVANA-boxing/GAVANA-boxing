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

## ROADMAP — "perfect app" (proposed 2026-11-07; each phase BLOCKED until the owner says "Hii" for it)
Ideas taken from what other builders made with Claude (procedural 3D, single-image teardown with HUD,
agent that drives a tool, game HUD, world simulator). Order = value to the core loop ÷ risk.

0. Foundation (loop can do the GREEN/YELLOW parts now)
   - Training Studio state machine (above) · camera-denied help per browser · visual baseline of the
     live recording stage.
1. **Punch Teardown replay** (from "3D robot from one image" — exploded view + HUD panels)
   After a round, pick one punch: slow-motion 3D replay split into Load → Rotate → Extend → Return,
   with labeled panels (hip/shoulder turn °, elbow angle, reach, guard hand height) and the coach's
   ghost overlaid. Reuses: world landmarks, `lib/motionReplay.js`, `MotionReplay3D`, ghost reference.
2. **Fight HUD** (from the 3D shooter's HUD) — during the round: round clock ring, combo counter,
   jab/cross/hook ticks, guard-down warning, last-10-s pulse. UI only; no scoring change.
3. **AI corner coach that drives the session** (from "AI controls the CAD mouse")
   The coach plans and runs a round through app tools (startRound, setCombo, setRest, showReplay,
   adjustDifficulty) and speaks short cues between rounds. RED: new API/tool-calling + cost.
4. **Reaction mitt drill / Ghost sparring defense** — targets or the ghost's punches appear; punch the
   right side / slip or block (uses `lib/defensiveDetector.js`). New game mode — needs approval.
5. **Procedural fighter avatar** (from "eye from math, ~400 params, no textures")
   Parametric boxer (build, skin, hair, gloves/shorts in rank colour) instead of the 1.7 MB GLB:
   faster load, personal, rank shows on the body. Used on profile, share card, ghost.
6. **World Tour** (from the world simulator) — rank progress as a journey of arenas
   (Ulaanbaatar → Seoul → Tokyo → Las Vegas), lighting by local time of day; retention, not scoring.
7. **Stance check from one photo** — onboarding: one selfie-stand photo → stance, guard height,
   foot width; sets southpaw/orthodox automatically.

## DONE
See AI_CHANGELOG.md.
