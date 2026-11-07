import { test, expect } from "@playwright/test";

// Core screens: Today (home), Training Studio, Result, Progress — each at the
// default phone size, the narrowest phone, and in Korean (longest labels).
const SCREENS = [
  { name: "today", path: "/home" },
  { name: "train", path: "/train", mask: ["video", "canvas"] },
  { name: "result", path: "/visual/result" },
  { name: "progress", path: "/visual/progress" },
];
const VARIANTS = [
  { id: "mn-390", locale: "mn", viewport: { width: 390, height: 844 } },
  { id: "mn-360", locale: "mn", viewport: { width: 360, height: 800 } },
  { id: "ko-390", locale: "ko", viewport: { width: 390, height: 844 } },
];

for (const screen of SCREENS) {
  for (const v of VARIANTS) {
    test(`${screen.name} ${v.id}`, async ({ page, context }) => {
      await context.grantPermissions(["camera"]);
      // Same day, time and first-run state on every run.
      await page.clock.setFixedTime(new Date("2026-11-06T12:00:00+09:00"));
      await page.addInitScript(() => {
        try { localStorage.setItem("gavana_onboarding_seen", "1"); } catch { /* ignore */ }
        try { sessionStorage.setItem("pwa-banner-dismissed", "1"); sessionStorage.setItem("push-banner-dismissed", "1"); } catch { /* ignore */ }
      });
      await page.setViewportSize(v.viewport);
      await page.goto(`/${v.locale}${screen.path}`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1500);

      // No horizontal scrolling at any size.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "horizontal overflow (px)").toBeLessThanOrEqual(1);

      await expect(page).toHaveScreenshot(`${screen.name}-${v.id}.png`, {
        fullPage: true,
        mask: (screen.mask || []).map((sel) => page.locator(sel)),
      });
    });
  }
}
