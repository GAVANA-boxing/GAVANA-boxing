import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { localizeCoaching, COACHING_TEXT_KEYS } from "@/lib/coachingText";

// Every coaching cue the generators can emit must have MN and KO text, or a
// Mongolian user sees English in the middle of their result.
function emittedMessages() {
  const src = ["lib/cinematicCoaching.js", "lib/mediapipePoseMetrics.js"]
    .map((f) => fs.readFileSync(path.join(process.cwd(), f), "utf8")).join("\n");
  const out = new Set();
  for (const m of src.matchAll(/message:\s*"([^"]+)"/g)) out.add(m[1]);
  for (const m of src.matchAll(/\?\s*"(Too much rotation[^"]+)"/g)) out.add(m[1]);
  return [...out];
}

describe("coaching text localization", () => {
  it("translates every cue the coaching generators emit", () => {
    const msgs = emittedMessages();
    expect(msgs.length).toBeGreaterThan(20);
    const missing = msgs.filter((m) => !COACHING_TEXT_KEYS.includes(m));
    expect(missing).toEqual([]);
    for (const m of msgs) {
      expect(localizeCoaching(m, "mn")).not.toBe(m);
      expect(localizeCoaching(m, "ko")).not.toBe(m);
      expect(localizeCoaching(m, "en")).toBe(m);
    }
  });

  it("translates the templated low-confidence cue and passes unknown text through", () => {
    expect(localizeCoaching("40% of punches were low-confidence — step back for better framing", "mn")).toMatch(/^Цохилтын 40%/);
    expect(localizeCoaching("Something new", "mn")).toBe("Something new");
    expect(localizeCoaching(null, "mn")).toBe(null);
  });
});
