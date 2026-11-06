# Punch-detection eval

Runs GAVANA's real detection stack (MediaPipe Pose Landmarker + `lib/punchPhaseDetector`)
over labelled recordings, frame by frame at a fixed sample rate, so detector changes can be
compared on identical input. `Date.now()` is driven from video time, so runs are reproducible.

Not part of the app build. Recordings are personal footage — keep them out of `main`
(they live on the `punch-clips` branch).

## Run
1. `ffmpeg -i clip.mov -vf scale=-2:720 -an -c:v libvpx-vp9 -b:v 2M public/zz-eval/clip.webm`
   (Playwright's Chromium has no H.264, so use VP9/WebM.)
2. `mkdir -p "app/[locale]/zz-eval" && cp scripts/punch-eval/eval-page.js "app/[locale]/zz-eval/page.js"`
3. `npx next build && npx next start -p 3100`
4. `node scripts/punch-eval/run.cjs '[{"src":"/zz-eval/clip.webm","fps":"10","model":"lite"}]'`
   Query params: `fps` (sample rate; the app runs ~10), `model` (lite | full | heavy), `stance`.
5. Delete `app/[locale]/zz-eval` and `public/zz-eval` afterwards — never commit them.

## Offline replay (fast loop for detector changes)
Add `"dump":"1","out":"/path/clip.json"` to a run.cjs entry to save the per-frame landmarks, then
`node scripts/punch-eval/replay.mjs southpaw /path/clip.json scripts/punch-eval/truth.json`
re-runs only `lib/punchPhaseDetector` (deterministic, milliseconds) and scores it per hand.
`VERBOSE=1` prints each event's head-travel, extension, elbow angle and snap.
`tests/punchDetector.test.js` runs three of the labelled clips in CI (landmarks only — no video).

## Results (lite @ 10 fps, stance=southpaw)
Fighter is **southpaw** (right foot forward): jab = right hand, cross = left hand.
Recordings are not mirrored (shirt text reads correctly; same room layout in every clip).
Truth = `truth.json` (peak times read off the video frame by frame).

| clip | truth | before (2026-11-06) | after head-travel gate |
|---|---|---|---|
| jabcross | 4 right jabs + 4 left crosses | 4/4 + 4/4, **1 phantom left** | 4/4 + 3/4, 0 phantoms |
| IMG_6156 | 6 right jabs + 6 left crosses | 6/6 + 5/6, 0 phantoms | 6/6 + 5/6, 0 phantoms |
| IMG_6153 | 6 right jabs                  | 6/6, **4 phantom left**  | 6/6, 0 phantoms |
| IMG_6155 | 5 left hooks                  | 1/5                      | 1/5 |

(The missed cross in jabcross / IMG_6156 peaks in the last ~0.2 s of the clip, before it can be
logged.) IMG_6156 was earlier mislabelled as "10 right jabs" — it is jab–cross; its left-hand
detections were real crosses, not phantoms.

**Phantoms (fixed):** when the torso turns for a jab, the guard hand's shoulder moves back, and
the shoulder-relative signals read the guard hand as "extending" — always at the same moment as
the real punch. Fix: every punch must move the wrist ≥ 0.28 shoulder-widths from its guard spot
*relative to the nose* (phantoms ≤ 0.21, real jabs ≥ 0.35).

**Punch type (fixed with 3D):** from the front, a hook and a cross both look like "an arm across
the body" in 2D, so the 2D arc classifier called real jab–crosses hooks and real hooks crosses.
The detector now also takes MediaPipe *world* landmarks (meters) and types each punch at its
frame of maximum reach: short reach on the far side = lead hook; long reach but sideways (not
toward the camera) = rear hook; otherwise straight. Without world landmarks it falls back to 2D.

| clips (lite @ 10 fps) | punches typed correctly, 2D | 3D |
|---|---|---|
| jabcross, IMG_6156, IMG_6153 (straight), IMG_6182 (left hooks), IMG_6181 | 20/29 (69%) | **29/29** |

Clips: IMG_6181 = right (lead) hooks ×4 (+ one cut off at 0.0 s), IMG_6182 = left (rear) hooks ×5.

**Still open:**
- Lead hooks are not *detected* (IMG_6181: 0/4): seen from the front the upper arm and forearm
  overlap, the 2D elbow angle stays at 5–15° and the angle-gated state machine never fires. A
  3D-excursion peak path found them but also fired on the guard hand covering the face during
  the wind-up (3 phantoms on IMG_6181) — not shipped; needs more lead-hook clips.
- A big rear hook can make the lead guard hand pass the phantom gate (IMG_6182: 0–2 echoes).
- IMG_6155 (labelled "left hooks" early on, before the IMG_6156 relabel) needs re-checking: in 3D
  those punches go clearly toward the camera (forward/reach 0.34–0.50), like crosses.
- Events are logged ~0.3 s after the peak (end of recoil).
- Velocity thresholds are per frame, so 30 fps is worse than 10 fps; normalise by dt.
- The shoulder-depth stance hint guessed "orthodox" for this southpaw, so stance stays a user setting.
