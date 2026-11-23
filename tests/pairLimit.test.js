import { describe, it, expect } from "vitest";
import { allowPair } from "@/lib/pairLimit";

describe("allowPair", () => {
  it("lets 3 through per window, then refuses", () => {
    const m = new Map();
    const r = [1, 2, 3, 4, 5].map(() => allowPair(m, "a>b:follow", { now: 1000 }));
    expect(r).toEqual([true, true, true, false, false]);
  });
  it("a new window starts again", () => {
    const m = new Map();
    for (let i = 0; i < 5; i++) allowPair(m, "k", { now: 0 });
    expect(allowPair(m, "k", { now: 3_600_001 })).toBe(true);
  });
  it("pairs and kinds are counted separately", () => {
    const m = new Map();
    for (let i = 0; i < 4; i++) allowPair(m, "a>b:follow", { now: 0 });
    expect(allowPair(m, "a>c:follow", { now: 0 })).toBe(true);
    expect(allowPair(m, "a>b:challenge", { now: 0 })).toBe(true);
  });
});
