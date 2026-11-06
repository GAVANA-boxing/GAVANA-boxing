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

**Still open:**
- Hooks (1/5): from the front a hook's elbow stays bent in 2D (angle 10–50°), so the
  angle-gated state machine rarely enters "extending". Needs a travel/arc-based path.
- 4 of 22 straight punches typed as "hook" (extension missed when entry is late).
- Events are logged ~0.3 s after the peak (end of recoil).
- Velocity thresholds are per frame, so 30 fps is worse than 10 fps; normalise by dt.
- The shoulder-depth stance hint guessed "orthodox" for this southpaw, so stance stays a user setting.
