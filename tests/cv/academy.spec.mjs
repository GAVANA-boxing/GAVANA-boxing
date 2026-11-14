// E2E: an Academy lesson done as a real round (real MediaPipe, fake camera). Checks the recording
// rule end to end: a scored round records the lesson with the round's FINAL score; a round the
// result screen calls "not enough data" records nothing.
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem("gavana_onboarding_seen", "1"); localStorage.setItem("gavana_stance", "orthodox"); } catch { /* ignore */ }
  });
});

test("an Academy lesson round is recorded from the final score — or not at all", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/en/train?academyLesson=jab-mechanics&autostart=1", { waitUntil: "load" });

  // The lesson card shows before the round, then the round runs and ends in a result.
  await expect(page.getByText(/ROUND RESULT|NOT ENOUGH DATA/i).first()).toBeVisible({ timeout: 120_000 });
  await page.waitForTimeout(1500); // let the recording effect and the final score settle

  const stored = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem("gavana_academy_progress") || "null"); } catch { return null; }
  });
  const entry = stored?.lessonProgress?.["jab-mechanics"] || null;
  const scored = await page.getByText(/ROUND RESULT/i).first().isVisible().catch(() => false);
  test.info().annotations.push({ type: "round", description: scored ? `scored, entry=${JSON.stringify(entry)}` : "not enough data" });

  if (scored) {
    // A scored round: recorded, and the best score is the number the result screen shows.
    expect(entry).toMatchObject({ attempted: true });
    const shown = Number((await page.locator("span", { hasText: /^\d+\.\d$/ }).first().innerText()).trim());
    expect(entry.bestScore).toBeCloseTo(shown, 1);
    expect(entry.completed).toBe(entry.bestScore >= 6.5);
    expect(entry.lastTrained).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  } else {
    // Too few punches: nothing is recorded for the lesson.
    expect(entry).toBeNull();
  }
  expect(errors).toEqual([]);
});
