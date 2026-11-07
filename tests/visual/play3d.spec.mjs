import { test, expect } from "@playwright/test";

// Playtests for the 3D modes: open them in a real (software) WebGL browser,
// interact, and fail on shader / WebGL / page errors or a blank canvas.
// No screenshots are compared — GPU output differs per machine — but each run
// saves what it saw to test-results/ for a human (or an agent) to look at.

function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    const t = m.text();
    if (/THREE\.WebGLProgram|Shader Error|WebGL: |GL_INVALID/i.test(t)) errors.push(t.slice(0, 300));
    if (t.startsWith("CONTEXT_LOST_LIVE")) errors.push("WebGL context lost on a canvas still on screen");
  });
  // React Three Fiber force-loses the context of a canvas it unmounts (e.g. the
  // bag intro scene when the round starts) — that's cleanup, not a failure. A
  // loss on a canvas that is still in the page is a real problem.
  page.addInitScript(() => {
    document.addEventListener("webglcontextlost", (e) => {
      setTimeout(() => { if (e.target && e.target.isConnected) console.log("CONTEXT_LOST_LIVE"); }, 0);
    }, true);
  });
  return errors;
}

// A blank / single-colour canvas compresses to almost nothing as PNG.
async function expectDrawn(locator, name, minBytes = 12_000) {
  const png = await locator.screenshot({ path: `test-results/play3d-${name}.png` });
  expect(png.length, `${name} canvas looks blank`).toBeGreaterThan(minBytes);
}

test.describe("3D playtests", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("heavy bag: a tap lands, the bag swings, nothing breaks", async ({ page, context }) => {
    await context.grantPermissions(["camera"]);
    const errors = watchErrors(page);
    await page.addInitScript(() => { try { localStorage.setItem("gavana_onboarding_seen", "1"); } catch { /* ignore */ } });
    await page.goto("/mn/bag", { waitUntil: "load" });
    await page.getByTestId("bag-start").click();
    const scene = page.getByTestId("bag-scene");
    await expect(scene.locator("canvas")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(2500); // models + first frames

    const box = await scene.boundingBox();
    // The bag hangs a little left of centre in this camera; tap its body.
    await page.mouse.click(box.x + box.width * 0.42, box.y + box.height * 0.5);
    await expect(page.getByText(/🥊 [1-9]/)).toBeVisible({ timeout: 3000 });
    await expect.poll(async () => {
      const t = await page.getByText(/Савлалт \d+°/).innerText();
      return Number(t.match(/(\d+)°/)[1]);
    }, { timeout: 3000 }).toBeGreaterThan(2);
    await expectDrawn(scene.locator("canvas"), "bag");
    expect(errors).toEqual([]);
  });

  test("world tour: the city renders", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/mn/visual/tour", { waitUntil: "load" });
    const canvas = page.getByTestId("tour-scene").locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(2500);
    await expectDrawn(canvas, "tour");
    expect(errors).toEqual([]);
  });

  test("punch teardown: the replay renders", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/mn/visual/teardown", { waitUntil: "load" });
    await expect(page.locator("canvas")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(2500);
    await expectDrawn(page.locator("canvas"), "teardown", 6_000);
    expect(errors).toEqual([]);
  });
});
