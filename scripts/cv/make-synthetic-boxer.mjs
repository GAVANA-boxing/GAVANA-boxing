// Makes tests/fixtures/cv/synthetic-boxer.mp4: our own 3D fighter (MotionReplay3D, the
// synthetic jab–cross round from lib/punchTeardown) seen from the front, recorded as a
// portrait 480×640 clip like a phone's front camera. Used as Chromium's fake camera in tests/cv — no real person, no
// personal recording. Needs a fixtures build running:
//   NEXT_PUBLIC_VISUAL_FIXTURES=1 npx next build && npx next start -p 3400
//   node scripts/cv/make-synthetic-boxer.mjs [http://127.0.0.1:3400]
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const base = process.argv[2] || "http://127.0.0.1:3400";
const tmp = join(process.cwd(), "test-results", "cv-make");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  ...(process.env.PLAYWRIGHT_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE } : {}),
});
const ctx = await browser.newContext({ viewport: { width: 480, height: 900 }, recordVideo: { dir: tmp, size: { width: 480, height: 900 } } });
await ctx.addInitScript(() => { localStorage.setItem("gavana_avatar", "male"); localStorage.setItem("gavana_onboarding_seen", "1"); });
const page = await ctx.newPage();
await page.goto(`${base}/en/visual/fighter`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Front" }).click();
await page.getByRole("button", { name: "1×" }).click();
const box = await page.locator("canvas").first().boundingBox();
await page.waitForTimeout(9000); // GLB load + ~1.5 replay loops
await ctx.close();
await browser.close();

const webm = readdirSync(tmp).find((f) => f.endsWith(".webm"));
if (!webm || !box) throw new Error("recording failed");
// Portrait, like a phone's front camera: the middle 70 % of the canvas width, 4:3 tall.
const even = (v) => Math.floor(v / 2) * 2;
const cw = even(box.width * 0.7);
const ch = even(Math.min(box.height, cw * 4 / 3));
const crop = `crop=${cw}:${ch}:${Math.round(box.x + (box.width - cw) / 2)}:${Math.round(box.y)}`;
mkdirSync("tests/fixtures/cv", { recursive: true });
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", "3", "-t", "5", "-i", join(tmp, webm),
  "-vf", `${crop},scale=480:640:force_original_aspect_ratio=decrease,pad=480:640:(ow-iw)/2:(oh-ih)/2,fps=15`,
  "-c:v", "libx264", "-crf", "28", "-pix_fmt", "yuv420p", "-an", "tests/fixtures/cv/synthetic-boxer.mp4"]);
console.log("wrote tests/fixtures/cv/synthetic-boxer.mp4", crop);
