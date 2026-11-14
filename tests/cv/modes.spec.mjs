// E2E for the three extra modes (mitts, ghost, heavy bag) with the real MediaPipe pipeline and
// the fake camera. What broke before (2026-11): the round started while the pose model was
// still loading, then the clock jumped back to 0:30 when it became ready; a model that failed
// to load ended in a silent 0 % result.
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem("gavana_onboarding_seen", "1"); localStorage.setItem("gavana_stance", "orthodox"); } catch { /* ignore */ }
  });
});

const seconds = (text) => { const m = String(text || "").match(/0:(\d\d)/); return m ? Number(m[1]) : null; };

/** Samples the round clock until `done` is visible; returns every reading (seconds left). */
async function watchClock(page, clock, done, maxMs) {
  const seen = [];
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    if (await done.isVisible().catch(() => false)) break;
    const s = seconds(await clock.textContent({ timeout: 1000 }).catch(() => null));
    if (s !== null) seen.push(s);
    await page.waitForTimeout(400);
  }
  return seen;
}

function expectClockNeverRestarts(seen) {
  expect(seen.length).toBeGreaterThan(5);
  // The first reading comes a few seconds into the round on a slow machine; what matters is that
  // the clock only counts down. A restart shows as a jump back up to 0:30.
  expect(seen[0]).toBeGreaterThanOrEqual(20);
  for (let i = 1; i < seen.length; i++) expect(seen[i], `clock went up: ${seen.join(",")}`).toBeLessThanOrEqual(seen[i - 1]);
  expect(seen[seen.length - 1]).toBeLessThanOrEqual(2);
}

test("mitt drill: waits for the pose model, the clock never restarts, a result is shown", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/en/mitts", { waitUntil: "load" });
  await page.getByTestId("mitts-start").click();

  const clock = page.getByTestId("mitts-clock");
  await expect(clock).toBeVisible({ timeout: 20_000 });
  // While the model loads there is a spinner and the clock shows "—": no round yet.
  if (await page.getByTestId("mitts-loading").isVisible().catch(() => false)) {
    expect(seconds(await clock.textContent())).toBeNull();
  }
  await expect(clock).toHaveText(/0:\d\d/, { timeout: 90_000 }); // model ready → 3-2-1 → round
  const seen = await watchClock(page, clock, page.getByTestId("mitt-result"), 60_000);
  expectClockNeverRestarts(seen);

  await expect(page.getByTestId("mitt-result")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("mitt-result")).toContainText("%");
  expect(errors).toEqual([]);
});

test("mitt drill: a model that cannot load goes back to the start with a message, not a 0 % result", async ({ page }) => {
  // Break the model download only (the page and the camera still work).
  await page.route("**/*.task", (route) => route.abort());
  await page.route("**/mediapipe/**", (route) => route.abort());
  await page.goto("/en/mitts", { waitUntil: "load" });
  await page.getByTestId("mitts-start").click();
  await expect(page.getByText(/motion AI didn't load/i)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("mitts-start")).toBeVisible();
  await expect(page.getByTestId("mitt-result")).toHaveCount(0);
});

test("ghost round: waits for the pose model, the clock never restarts, a result is shown", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/en/ghost", { waitUntil: "load" });
  await page.getByRole("button", { name: /Copy it/i }).click({ timeout: 60_000 });

  const clock = page.getByTestId("ghost-clock");
  await expect(clock).toHaveText(/0:\d\d/, { timeout: 120_000 });
  const seen = await watchClock(page, clock, page.getByTestId("ghost-result"), 60_000);
  expectClockNeverRestarts(seen);

  const result = page.getByTestId("ghost-result");
  await expect(result).toBeVisible({ timeout: 15_000 });
  // Either a match with the two rows that mean something, or the honest "couldn't see you".
  await expect(result).toContainText(/match with the ghost|couldn't see you/i);
  await expect(result).not.toContainText(/reach/i);
  expect(errors).toEqual([]);
});

test("heavy bag: the clock never restarts and the result shows no invented power numbers", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/en/bag", { waitUntil: "load" });
  await page.getByTestId("bag-start").click({ timeout: 60_000 });

  const clock = page.getByTestId("bag-clock");
  await expect(clock).toHaveText(/0:\d\d/, { timeout: 30_000 });
  const seen = await watchClock(page, clock, page.getByTestId("bag-result"), 75_000);
  expectClockNeverRestarts(seen);

  const result = page.getByTestId("bag-result");
  await expect(result).toBeVisible({ timeout: 15_000 });
  await expect(result).toContainText(/punches/i);
  await expect(result).not.toContainText(/power/i);
  expect(errors).toEqual([]);
});
