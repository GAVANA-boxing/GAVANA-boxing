import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { ref, uploadBytes, getBytes } from "firebase/storage";
const env = await initializeTestEnvironment({
  projectId: "demo-gavana",
  storage: { rules: readFileSync(new URL("../../storage.rules", import.meta.url), "utf8"), host: "127.0.0.1", port: 9199 },
});
const alice = env.authenticatedContext("alice").storage();
const bob = env.authenticatedContext("bob").storage();
const anon = env.unauthenticatedContext().storage();
const img = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const IMG = { contentType: "image/jpeg" };
const VID = { contentType: "video/webm" };
const big = new Uint8Array(11 * 1024 * 1024);
const results = [];
const t = async (name, p) => { try { await p; results.push("PASS " + name); } catch (e) { results.push("FAIL " + name + " " + String(e.message).slice(0, 120)); } };

await t("profile: owner image ok", assertSucceeds(uploadBytes(ref(alice, "profile-images/alice/a.jpg"), img, IMG)));
await t("profile: public read ok", assertSucceeds(getBytes(ref(anon, "profile-images/alice/a.jpg"))));
await t("profile: other user write blocked", assertFails(uploadBytes(ref(bob, "profile-images/alice/b.jpg"), img, IMG)));
await t("profile: non-image blocked", assertFails(uploadBytes(ref(alice, "profile-images/alice/x.html"), img, { contentType: "text/html" })));
await t("profile: >10MB blocked", assertFails(uploadBytes(ref(alice, "profile-images/alice/big.jpg"), big, IMG)));
await t("coach app: owner upload ok", assertSucceeds(uploadBytes(ref(alice, "coach_applications/alice/p.jpg"), img, IMG)));
await t("coach app: owner read ok", assertSucceeds(getBytes(ref(alice, "coach_applications/alice/p.jpg"))));
await t("coach app: other user read blocked", assertFails(getBytes(ref(bob, "coach_applications/alice/p.jpg"))));
await t("coach app: anon read blocked", assertFails(getBytes(ref(anon, "coach_applications/alice/p.jpg"))));
await t("reels/videos: owner video ok", assertSucceeds(uploadBytes(ref(alice, "reels/videos/alice/1.webm"), img, VID)));
await t("reels/videos: image type blocked", assertFails(uploadBytes(ref(alice, "reels/videos/alice/2.webm"), img, IMG)));
await t("reels/thumbnails: owner image ok", assertSucceeds(uploadBytes(ref(alice, "reels/thumbnails/alice/1.jpg"), img, IMG)));
await t("reels/thumbnails: other user blocked", assertFails(uploadBytes(ref(bob, "reels/thumbnails/alice/2.jpg"), img, IMG)));
await t("reels: owner video ok", assertSucceeds(uploadBytes(ref(alice, "reels/alice/clip.mp4"), img, { contentType: "video/mp4" })));
await t("reels: public read ok", assertSucceeds(getBytes(ref(anon, "reels/alice/clip.mp4"))));
await t("stories: anon read blocked", assertFails(getBytes(ref(anon, "stories/alice/s.jpg"))));
await t("stories: owner image ok", assertSucceeds(uploadBytes(ref(alice, "stories/alice/s.jpg"), img, IMG)));
await t("stories: signed-in read ok", assertSucceeds(getBytes(ref(bob, "stories/alice/s.jpg"))));
await t("gyms: non-image blocked", assertFails(uploadBytes(ref(alice, "gyms/alice/logo"), img, { contentType: "application/zip" })));

console.log(results.join("\n"));
if (results.some((r) => r.startsWith("FAIL"))) process.exitCode = 1;
await env.cleanup();
