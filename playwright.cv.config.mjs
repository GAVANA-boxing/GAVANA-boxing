// Computer-vision E2E (tests/cv): the real MediaPipe pipeline in Chromium, fed by a fake
// camera playing tests/fixtures/cv/synthetic-boxer.mp4 (our own 3D fighter — no real person).
//   npm run test:cv
// Separate from the screenshot suite because the fake camera is set at browser launch.
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.CV_PORT || 3301);
export const Y4M = resolve("test-results/cv/synthetic-boxer.y4m");

export default defineConfig({
  testDir: "tests/cv",
  globalSetup: "./tests/cv/global-setup.mjs",
  timeout: 180_000,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: {
      ...(process.env.PLAYWRIGHT_EXECUTABLE
        ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE }
        : (existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {})),
      args: [
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
        `--use-file-for-fake-video-capture=${Y4M}`,
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    },
    permissions: ["camera"],
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/en`,
    timeout: 600_000,
    reuseExistingServer: true,
  },
});
