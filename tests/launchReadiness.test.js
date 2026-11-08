import { describe, it, expect } from "vitest";
import { launchReadiness } from "@/lib/server/launchReadiness";

describe("launchReadiness", () => {
  it("reports booleans only and flags missing required settings", () => {
    const r = launchReadiness({ OPENAI_API_KEY: "sk-x", NEXT_PUBLIC_VISUAL_FIXTURES: "1" });
    const byKey = Object.fromEntries(r.map((x) => [x.key, x]));
    expect(byKey.openai.ok).toBe(true);
    expect(byKey["service-account"].ok).toBe(false);
    expect(byKey["fixtures-off"].ok).toBe(false);
    expect(byKey["core-mode"].ok).toBe(true);
    for (const x of r) expect(typeof x.ok).toBe("boolean");
    expect(JSON.stringify(r)).not.toContain("sk-x");
  });
});
