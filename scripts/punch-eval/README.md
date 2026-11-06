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
| IMG_6155 | 1 right (lead) hook + 3 left (rear) hooks | see below | |

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

**Lead hooks (fixed with 3D, 2026-11-06):** from the front the upper arm and forearm overlap,
the 2D elbow angle stays at 5–15° and the angle-gated state machine never fires. In world
landmarks a lead hook is distinctive: the elbow lifts to shoulder height (−0.20…+0.04
shoulder-widths below it) and the fist swings 0.54–0.79 toward the middle of the body within
0.35 s. The guard hand covering the face in the wind-up swings too, but with the elbow down
(≤ −0.35); a jab moves the fist out, and a jab coming back swings ≤ 0.16. `_isLeadHook3D`
checks exactly that, on the lead hand only. The rear guard hand rides along with the body and
used to log an "echo" (travel 0.29–0.37); within 0.4 s of a lead hook a rear punch now needs
the travel of a real one (crosses travel ≥ 0.51).

IMG_6155 was relabelled from the video (it had been "5 left hooks"): one right lead hook at
0.8 s, then three left rear hooks.

| all labelled clips (lite @ 10 fps) | before | after |
|---|---|---|
| lead hooks (IMG_6181 ×4, IMG_6155 ×1) | 0/5 | **5/5** |
| every punch, all 6 clips | 29/39 | **35/39** |
| phantoms, all 6 clips | 1 | **0** |

**Still open:**
- Only 5 lead hooks from one fighter — the thresholds have margin (smallest hook swing 0.54 vs
  0.35 needed) but need more fighters, angles and lighting before trusting them widely.
- Uppercuts: no labelled clips at all, so not detected or typed.
- Rear hooks on IMG_6155 are weak (the elbow stays low in 3D and the swing is very wide); only
  the first is cleanly caught. IMG_6182 rear hooks: 4/5.
- A big rear hook can make the lead guard hand pass the phantom gate (IMG_6182: 0–2 echoes).
- Events are logged ~0.3 s after the peak (end of recoil); the 3D lead hook is logged at the peak.
- Velocity thresholds are per frame, so 30 fps is worse than 10 fps; normalise by dt.
- The shoulder-depth stance hint guessed "orthodox" for this southpaw, so stance stays a user setting.
