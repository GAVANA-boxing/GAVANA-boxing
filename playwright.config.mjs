// Visual regression tests (tests/visual). Not part of CI: screenshots depend on
// fonts / GPU of the machine, so the baselines are made and checked on the same
// dev container. Run:
//   npm run test:visual           compare with the baselines
//   npm run test:visual:update    accept the current look as the new baseline
import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

const PORT = 3300;

export default defineConfig({
  testDir: "tests/visual",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  timeout: 120_000,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled", caret: "hide", scale: "css" },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    // This container ships one Chromium (PLAYWRIGHT_EXECUTABLE overrides); elsewhere
    // Playwright's own browser is used.
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE }
      : (existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {}),
    colorScheme: "dark",
    locale: "en-US",
    timezoneId: "Asia/Seoul",
  },
  webServer: {
    // A production build with the fixture routes switched on.
    command: `npx next build && npx next start -p ${PORT}`,
    env: { NEXT_PUBLIC_VISUAL_FIXTURES: "1", NEXT_TELEMETRY_DISABLED: "1" },
    url: `http://localhost:${PORT}/mn`,
    timeout: 600_000,
    reuseExistingServer: false,
  },
});
