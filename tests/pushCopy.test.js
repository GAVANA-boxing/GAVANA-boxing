import { describe, it, expect } from "vitest";
import { pushCopy, PUSH_KINDS, PUSH_LOCALES } from "../lib/pushCopy";

describe("pushCopy", () => {
  it("writes in the recipient's language, with a link in that language", () => {
    const ko = pushCopy("follow", { locale: "ko", actorName: "Bat", actorId: "u1" });
    expect(ko.title).toContain("팔로워");
    expect(ko.body).toContain("Bat");
    expect(ko.url).toBe("/ko/profile/u1");
  });

  it("falls back to Mongolian when the recipient's language is unknown", () => {
    const c = pushCopy("sparringAccepted", { locale: null, actorName: "", actorId: "u1" });
    expect(c.url).toBe("/mn/sparring");
    expect(c.body).toContain("Тулаанч");
  });

  it("has every kind in all three languages and rejects unknown kinds", () => {
    for (const kind of Object.keys(PUSH_KINDS))
      for (const locale of PUSH_LOCALES) {
        const c = pushCopy(kind, { locale, actorName: "A", actorId: "x" });
        expect(c.title.length).toBeGreaterThan(0);
        expect(c.body.length).toBeLessThanOrEqual(300);
      }
    expect(pushCopy("anything", { locale: "en" })).toBeNull();
  });

  it("caps a long sender name", () => {
    const c = pushCopy("challenge", { locale: "en", actorName: "x".repeat(500), actorId: "u" });
    expect(c.body.length).toBeLessThan(120);
  });
});
