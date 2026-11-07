# AI task backlog

Status: TODO · BLOCKED (needs approval) · DONE. Highest priority first.

## P1
- Training Studio: save-failed state has no dedicated "retry save" button yet (the error text
  shows; the result view's save action can be pressed again). Add one in the result view.

## P2
- RED (needs approval — push sending): `functions/index.js` `localeOf()` trusts the client-written
  `users.locale`; whitelist mn/ko/en before building the copy and the `/${locale}/train` URL.
  Copy itself checked in Cycle 6 (streak-risk + win-back, MN/KO/EN, fine). Deploy:
  `firebase deploy --only functions`.
- Coach chat header / persona chips in the brand style (text sizes fixed in Cycle 7; layout/style
  still to do, needs a signed-in visual fixture to verify).

- Coach marketplace pages (`coach/page.js`, `coach/[coachId]`, `coach/dashboard`, `coach/apply`)
  still use 9–10px labels (coachDashboardStyles, coachIdStyles, DashboardCards,
  ProPriorityMatchingBanner). Check which of them CORE_MODE shows before fixing.

## ROADMAP — "perfect app" (proposed 2026-11-07; each phase BLOCKED until the owner says "Hii" for it)
Ideas taken from what other builders made with Claude (procedural 3D, single-image teardown with HUD,
agent that drives a tool, game HUD, world simulator). Order = value to the core loop ÷ risk.

0. Foundation — DONE (see AI_CHANGELOG "Roadmap Phase 0").
1. **Punch Teardown replay** — DONE (AI_CHANGELOG "Roadmap Phase 1"). Follow-ups: ghost overlay of the
   coach's reference punch in teardown; check the thresholds (15° shoulder, 8° hip, 150° elbow,
   450 ms return) on real recordings with the owner.
   Original idea (from "3D robot from one image" — exploded view + HUD panels):
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
