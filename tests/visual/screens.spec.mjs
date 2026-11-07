import { test, expect } from "@playwright/test";

// Core screens: Today (home), Training Studio, Result, Progress — each at the
// default phone size, the narrowest phone, and in Korean (longest labels).
// "train" is the camera-denied studio (getUserMedia rejected with NotAllowedError).
const SCREENS = [
  { name: "today", path: "/home" },
  { name: "train", path: "/train", mask: ["video", "canvas"], camera: "NotAllowedError" },
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
      await prepare(page, screen.camera);
      await page.setViewportSize(v.viewport);
      await page.goto(`/${v.locale}${screen.path}`, { waitUntil: "load" });
      await settle(page);
      await expect(page).toHaveScreenshot(`${screen.name}-${v.id}.png`, {
        fullPage: true,
        mask: (screen.mask || []).map((sel) => page.locator(sel)),
      });
    });
  }
}

// Training Studio states that need a camera (Chromium's fake camera device) or
// a specific camera failure. The live picture is made transparent (a mask would
// paint over the whole stage, hiding the HUD and badges drawn on top of it);
// what is compared is everything the studio draws around the video.
const STAGE_MASK = [];
const HIDE_LIVE_PICTURE = ".train-stage video, .train-stage canvas { opacity: 0 !important; }";
const viewport390 = { width: 390, height: 844 };

test("train-nocam mn-390", async ({ page }) => {
  await prepare(page, "NotFoundError");
  await page.setViewportSize(viewport390);
  await page.goto("/mn/train", { waitUntil: "load" });
  await expect(page.locator("[data-studio-state=cameraUnavailable]")).toBeVisible();
  await settle(page);
  await expect(page).toHaveScreenshot("train-nocam-mn-390.png", { fullPage: true, mask: STAGE_MASK.map((s) => page.locator(s)) });
});

test.describe("live camera", () => {
  for (const v of [{ id: "mn-390", viewport: viewport390 }, { id: "mn-360", viewport: { width: 360, height: 800 } }]) {
    test(`train-live ${v.id}`, async ({ page, context }) => {
      await context.grantPermissions(["camera"]);
      await prepare(page);
      await page.setViewportSize(v.viewport);
      await page.goto("/mn/train", { waitUntil: "load" });
      await expect(page.locator("[data-studio-state=ready]")).toBeVisible();
      await page.addStyleTag({ content: HIDE_LIVE_PICTURE });
      await settle(page);
      await expect(page).toHaveScreenshot(`train-live-${v.id}.png`, { fullPage: true, mask: STAGE_MASK.map((s) => page.locator(s)) });
    });
  }

  test("train-recording mn-390", async ({ page, context }) => {
    await context.grantPermissions(["camera"]);
    await prepare(page);
    await page.setViewportSize(viewport390);
    // ?autostart=1 starts the round as soon as the camera is ready (no readiness sheet).
    await page.goto("/mn/train?autostart=1", { waitUntil: "load" });
    await expect(page.locator("[data-studio-state=recording]")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("hud-timer-mode")).toHaveCount(0); // live camera → "recording", not timer-only
    await page.addStyleTag({ content: HIDE_LIVE_PICTURE });
    await settle(page);
    await expect(page).toHaveScreenshot("train-recording-mn-390.png", { mask: STAGE_MASK.map((s) => page.locator(s)) });
  });
});

// Punch Teardown on a synthetic round. The 3D canvas is hidden (WebGL output
// differs between machines); the phase strip, panels, picker and tips are compared.
for (const v of [{ id: "mn-390", locale: "mn", viewport: viewport390 }, { id: "mn-360", locale: "mn", viewport: { width: 360, height: 800 } }, { id: "ko-390", locale: "ko", viewport: viewport390 }]) {
  test(`teardown ${v.id}`, async ({ page }) => {
    await prepare(page);
    // No WebGL here: the canvas isn't compared anyway, and software GL rendering the
    // avatar can starve the page on a loaded machine (flaky scrub). The 3D itself is
    // covered by the playtest in play3d.spec.mjs. The page shows its no-3D fallback.
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        return /webgl/i.test(type) ? null : orig.call(this, type, ...rest);
      };
    });
    await page.setViewportSize(v.viewport);
    await page.goto(`/${v.locale}/visual/teardown`, { waitUntil: "load" });
    await expect(page.getByTestId("teardown-tips")).toBeVisible();
    // Freeze on a fixed moment of the selected punch (scrubbing pauses playback).
    // The replay's own start-up (focus → play from the punch start) can land after an
    // early scrub on a loaded machine — so scrub until it sticks.
    await page.waitForTimeout(1500);
    await expect(async () => {
      await page.getByRole("slider").fill("1780");
      await expect(page.getByRole("button", { name: "▶" })).toBeVisible({ timeout: 800 });
      await expect(page.getByText("1.8s / 5.4s")).toBeVisible({ timeout: 800 });
    }).toPass({ timeout: 15_000 });
    await page.addStyleTag({ content: "canvas { opacity: 0 !important; }" });
    await settle(page);
    await expect(page).toHaveScreenshot(`teardown-${v.id}.png`);
  });
}

// Fight HUD (fixture): mid-round and the last seconds with the guard down.
for (const screen of ["hud", "hud-final"]) {
  for (const v of [{ id: "mn-390", locale: "mn", viewport: viewport390 }, { id: "mn-360", locale: "mn", viewport: { width: 360, height: 800 } }, { id: "ko-390", locale: "ko", viewport: viewport390 }]) {
    test(`${screen} ${v.id}`, async ({ page }) => {
      await prepare(page);
      await page.setViewportSize(v.viewport);
      await page.goto(`/${v.locale}/visual/${screen}`, { waitUntil: "load" });
      await expect(page.getByTestId("fight-hud-ticks")).toBeVisible();
      if (screen === "hud-final") await expect(page.getByTestId("fight-hud-guard")).toBeVisible({ timeout: 5_000 });
      await settle(page);
      await expect(page).toHaveScreenshot(`${screen}-${v.id}.png`, { timeout: 15_000 });
    });
  }
}

// Mitt drill: intro page (real route), a call on screen, a defence call with "too late", the result.
for (const v of [{ id: "mn-390", locale: "mn", viewport: viewport390 }, { id: "mn-360", locale: "mn", viewport: { width: 360, height: 800 } }, { id: "ko-390", locale: "ko", viewport: viewport390 }]) {
  for (const [name, path] of [["mitts", "/mitts"], ["mitts-call", "/visual/mitts-call"], ["mitts-slip", "/visual/mitts-slip"], ["mitts-result", "/visual/mitts-result"]]) {
    test(`${name} ${v.id}`, async ({ page }) => {
      await prepare(page);
      await page.setViewportSize(v.viewport);
      await page.goto(`/${v.locale}${path}`, { waitUntil: "load" });
      await settle(page);
      await expect(page).toHaveScreenshot(`${name}-${v.id}.png`, { fullPage: true });
    });
  }
}

// World Tour (fixture, fixed moment). The 3D canvas is hidden; header, live
// conditions, next-city card and journey are compared.
for (const v of [{ id: "mn-390", locale: "mn", viewport: viewport390 }, { id: "mn-360", locale: "mn", viewport: { width: 360, height: 800 } }, { id: "ko-390", locale: "ko", viewport: viewport390 }]) {
  for (const name of ["tour", "tour-night"]) {
    test(`${name} ${v.id}`, async ({ page }) => {
      await prepare(page);
      await page.setViewportSize(v.viewport);
      await page.goto(`/${v.locale}/visual/${name}`, { waitUntil: "load" });
      await expect(page.getByTestId("tour-city")).toBeVisible();
      await page.addStyleTag({ content: "[data-testid=tour-scene] canvas { opacity: 0 !important; }" });
      await settle(page);
      await expect(page).toHaveScreenshot(`${name}-${v.id}.png`, { fullPage: true });
    });
  }
}

// Heavy bag intro (real route). The 3D canvas is hidden; the page around it is compared.
for (const v of [{ id: "mn-390", locale: "mn", viewport: viewport390 }, { id: "mn-360", locale: "mn", viewport: { width: 360, height: 800 } }, { id: "ko-390", locale: "ko", viewport: viewport390 }]) {
  test(`bag ${v.id}`, async ({ page }) => {
    await prepare(page);
    await page.setViewportSize(v.viewport);
    await page.goto(`/${v.locale}/bag`, { waitUntil: "load" });
    await expect(page.getByTestId("bag-scene")).toBeVisible({ timeout: 15_000 });
    await page.addStyleTag({ content: "[data-testid=bag-scene] canvas { opacity: 0 !important; }" });
    await settle(page);
    // Software WebGL keeps rendering the (hidden) bag scene, so taking the shot is slow.
    await expect(page).toHaveScreenshot(`bag-${v.id}.png`, { fullPage: true, timeout: 30_000 });
  });
}

// Same day, time and first-run state on every run; optionally make
// getUserMedia fail with a given error name.
async function prepare(page, cameraError) {
  await page.clock.setFixedTime(new Date("2026-11-06T12:00:00+09:00"));
  await page.addInitScript((err) => {
    try { localStorage.setItem("gavana_onboarding_seen", "1"); } catch { /* ignore */ }
    try { sessionStorage.setItem("pwa-banner-dismissed", "1"); sessionStorage.setItem("push-banner-dismissed", "1"); } catch { /* ignore */ }
    if (err && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error(err), { name: err }));
    }
  }, cameraError || null);
}

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  // No horizontal scrolling at any size.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "horizontal overflow (px)").toBeLessThanOrEqual(1);
}
