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

## Baseline (2026-11-06, lite @ 10 fps)
Fighter is **southpaw** (right foot forward): jab = right hand, cross = left hand.
Recordings are not mirrored (shirt text reads correctly), so MediaPipe's left/right are anatomical.

| clip | truth | detected (right hand / phantom left) |
|---|---|---|
| IMG_6156 | 10 right jabs (straight)  | 4 straight + 2 as hook / **5 phantom left** |
| IMG_6153 | 6 right jabs (straight)   | 6 straight / **4 phantom left** |
| IMG_6155 | 5 left (rear) hooks       | 1 hook |

(Runs used `stance=orthodox`, so right-hand straights were *labelled* "cross"; the counts per
hand are what matter. Use `stance=southpaw` for this fighter.)

Systematic error: phantom punches on the non-punching (guard) hand, at the same moment or
~0.4 s after a real punch — the torso turns, that side's shoulder moves back, and extension is
measured from the same-side shoulder, so the guard hand reads as "extending". Model size / fps
alone do not fix it. The shoulder-depth stance hint also guessed "orthodox" for this southpaw
(he faces the camera fairly square), so stance must stay an explicit user choice.

Still needed to validate a fix: a clip with **real** punches from both hands (southpaw jab–cross:
right jab, left cross) so suppressing phantoms can be checked not to drop real ones.
