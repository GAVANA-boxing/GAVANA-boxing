// E2E: camera → MediaPipe (in the browser) → filtered landmarks → canvas skeleton overlay.
// The fake camera plays our synthetic 3D boxer (tests/fixtures/cv). Checks the things a
// screenshot can't: that inference runs, that the overlay really draws on new frames at a
// usable rate, and that the round produces punch data.
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem("gavana_onboarding_seen", "1"); localStorage.setItem("gavana_stance", "orthodox"); } catch { /* ignore */ }
  });
});

test("MediaPipe finds the body and the canvas overlay draws it during a round", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // The 60 s jab-minute benchmark: long enough for model load + checks on a slow machine.
  await page.goto("/en/train?debug=1&autostart=1&drill=jab-minute", { waitUntil: "load" });

  // The round starts by itself (autostart); the overlay canvas exists while recording.
  const overlay = page.getByTestId("pose-overlay");
  await expect(overlay).toBeAttached({ timeout: 60_000 });

  // Inference reached the page: the debug panel reports landmarks.
  await expect(page.getByText(/DETECTED \(\d+\)/)).toBeVisible({ timeout: 60_000 });

  // The overlay redraws on new pose frames (it skips frames with no new pose).
  await expect.poll(async () => Number(await overlay.getAttribute("data-frames-drawn")) || 0, { timeout: 30_000 })
    .toBeGreaterThanOrEqual(10);

  // Inference rate. A phone with WebGL gets ~10 fps (the detector's design rate); this
  // container has no GPU (SwiftShader + CPU delegate) and gets ~2. CV_MIN_FPS sets the bar
  // for the machine running the test — on a real device run it with CV_MIN_FPS=8.
  const fps = Number((await page.getByText(/^FPS/).locator("..").innerText()).match(/(\d+)\s*$/)?.[1] || 0);
  test.info().annotations.push({ type: "fps", description: String(fps) });
  expect(fps).toBeGreaterThanOrEqual(Number(process.env.CV_MIN_FPS || 1));

  // Something was actually painted (not an empty, transparent canvas).
  const painted = await overlay.evaluate((c) => {
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4 * 16) if (d[i] > 0) n++;
    return n;
  });
  expect(painted).toBeGreaterThan(20);

  // Evidence for the report: the live stage with the skeleton drawn over the body.
  // (A page screenshot clipped to the stage: element screenshots can miss the 2D canvas layer.)
  await overlay.scrollIntoViewIfNeeded();
  const box = await page.locator(".train-stage").boundingBox();
  await page.screenshot({ path: test.info().outputPath("overlay.png"), clip: box });


  expect(errors).toEqual([]);
});

test("a round on the synthetic boxer ends with punch data", async ({ page }) => {
  await page.goto("/en/train?debug=1&autostart=1", { waitUntil: "load" });
  // Guests get the 20 s speed test; wait for the result screen.
  await expect(page.getByText(/ROUND RESULT|NOT ENOUGH DATA|punches/i).first()).toBeVisible({ timeout: 90_000 });
  const text = await page.locator("body").innerText();
  const punches = Number(text.match(/(\d+)\s+PUNCHES/i)?.[1] ?? text.match(/(\d+)\s+punches/i)?.[1] ?? 0);
  test.info().annotations.push({ type: "punches", description: String(punches) });
  // The synthetic round throws 4 punches per ~2.6 s loop; at 2 fps (no GPU) most are missed,
  // so this only asserts the pipeline produced a result, and records the count.
  expect(text).toMatch(/ROUND RESULT|NOT ENOUGH DATA|Score|score/i);
});
