// Chromium's fake camera reads raw .y4m — convert the small committed .mp4 once per run.
// The clip-upload test gets a 15 s WebM (the 5 s clip looped 3×; VP8 plays in every Chromium build).
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export default function globalSetup() {
  const out = resolve("test-results/cv/synthetic-boxer.y4m");
  mkdirSync(dirname(out), { recursive: true });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", resolve("tests/fixtures/cv/synthetic-boxer.mp4"), "-pix_fmt", "yuv420p", out]);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-stream_loop", "2", "-i", resolve("tests/fixtures/cv/synthetic-boxer.mp4"),
    "-c:v", "libvpx", "-b:v", "600k", "-an", resolve("test-results/cv/synthetic-boxer-15s.webm")]);
}
