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

## Baseline (2026-11-06, lite @ 10 fps, orthodox)
| clip | truth | detected |
|---|---|---|
| IMG_6156 (cross10) | 10 right crosses | 4 cross + 2 hook (right), **5 phantom left punches** |
| IMG_6155 (hook5)   | 5 left hooks     | 1 hook |

Systematic error: a phantom lead-hand "jab" ~0.4 s after every cross — the torso turns,
the lead shoulder moves back, and extension is measured from the same-side shoulder, so the
guard hand reads as "extending". Model size / fps alone do not fix it.
