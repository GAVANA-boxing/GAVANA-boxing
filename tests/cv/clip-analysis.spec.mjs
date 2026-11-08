// E2E: an uploaded clip is analysed in the browser by the real MediaPipe pipeline (the same one a
// live round uses) and its status goes queued → processing → completed with a skeleton-only
// thumbnail. The clip is our synthetic 3D boxer (tests/fixtures/cv, looped to 15 s by
// global-setup). Runs on /visual/dashboard, whose analyzer writes to an in-memory store.
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";

const CLIP = resolve("test-results/cv/synthetic-boxer-15s.webm");
const log = async (page) => JSON.parse((await page.getByTestId("clip-log").textContent()) || "[]");

test("an uploaded clip: queued → processing → completed, live overlay, skeleton thumbnail", async ({ page }) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/en/visual/dashboard", { waitUntil: "load" });
  const analyzer = page.getByTestId("clip-analyzer");
  await expect(analyzer).toHaveAttribute("data-phase", "idle");

  await page.getByTestId("clip-input").setInputFiles(CLIP);
  await expect(analyzer).toHaveAttribute("data-phase", /reading|loading_model|analyzing/, { timeout: 15_000 });

  // While it plays, the skeleton overlay draws on new pose frames.
  const overlay = analyzer.getByTestId("pose-overlay");
  await expect.poll(async () => Number(await overlay.getAttribute("data-frames-drawn")) || 0, { timeout: 120_000 })
    .toBeGreaterThanOrEqual(3);
  await analyzer.scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath("clip-analyzing.png"), clip: await analyzer.boundingBox() });

  await expect(analyzer).toHaveAttribute("data-phase", /done|failed/, { timeout: 180_000 });
  const writes = await log(page);
  const statuses = writes.map((w) => w.data.status);
  test.info().annotations.push({ type: "writes", description: statuses.join(" → ") });
  expect(statuses[0]).toBe("queued");
  expect(statuses).toContain("processing");
  expect(statuses.at(-1)).toBe("completed");
  expect(writes.filter((w) => w.data.status === "processing").length).toBeLessThanOrEqual(11); // throttled

  const done = writes.at(-1).data;
  test.info().annotations.push({ type: "result", description: JSON.stringify({ ...done, thumbnailUrl: `${String(done.thumbnailUrl).length} chars` }) });
  expect(done.poseFramesPct).toBeGreaterThan(50);           // the synthetic boxer is in every frame
  expect(done.punches).toBeGreaterThanOrEqual(0);
  if (done.score != null) expect(done.score).toBeGreaterThanOrEqual(0);
  expect(done.thumbnailUrl).toMatch(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/);
  expect(done.thumbnailUrl.length).toBeLessThanOrEqual(24_576); // firestore.rules cap

  await expect(page.getByTestId("clip-result")).toBeVisible();
  await page.getByTestId("clip-result").screenshot({ path: test.info().outputPath("clip-result.png") });
  expect(errors).toEqual([]);
});

test("a non-video file is refused before anything is written", async ({ page }) => {
  await page.goto("/en/visual/dashboard", { waitUntil: "load" });
  await page.getByTestId("clip-input").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not a video") });
  await expect(page.getByTestId("clip-error")).toHaveAttribute("data-code", "not_video");
  expect(await log(page)).toEqual([]);
});
