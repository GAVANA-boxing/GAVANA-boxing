// Chromium's fake camera reads raw .y4m — convert the small committed .mp4 once per run.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export default function globalSetup() {
  const out = resolve("test-results/cv/synthetic-boxer.y4m");
  mkdirSync(dirname(out), { recursive: true });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", resolve("tests/fixtures/cv/synthetic-boxer.mp4"), "-pix_fmt", "yuv420p", out]);
}
