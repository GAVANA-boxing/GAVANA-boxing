import { describe, it, expect } from "vitest";
import { getFighterContext } from "@/lib/chatFighterContext";
import { buildDrillRequest } from "@/lib/drillRequest";

describe("getFighterContext", () => {
  it("does not fire on a substring (the drill builder's own 'valid JSON' text)", () => {
    const req = buildDrillRequest({ area: "Jab", type: "Shadow" });
    expect(getFighterContext(req.messages)).toBeNull();
  });
  it("still matches a fighter named as a word", () => {
    expect(getFighterContext([{ role: "user", content: "How did Ali move?" }])).toMatch(/Ali/);
    expect(getFighterContext([{ role: "user", content: "tyson's entry" }])).toMatch(/Tyson/);
  });
  it("drill request marks the drill-builder purpose", () => {
    expect(buildDrillRequest({ area: "a", type: "b" }).purpose).toBe("drills");
  });
});
