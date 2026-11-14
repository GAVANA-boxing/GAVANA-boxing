// The AI drill builder's request. /api/chat keeps only the first 800 characters of a message
// (2026-11: the fighter context was prepended to it, so the JSON instruction was cut off and
// every "Generate" came back as "unexpected format").
import { describe, it, expect } from "vitest";
import { buildDrillRequest, CHAT_MESSAGE_LIMIT } from "@/lib/drillRequest";
import { buildCoachSnapshot, buildCoachContext } from "@/lib/buildCoachContext";

const sessions = Array.from({ length: 12 }, (_, i) => ({
  score: 6 + (i % 4) * 0.5, hitCount: 20 + i, movementCounts: { jab: 8, cross: 6, hook: 3 },
  createdAt: { seconds: 1_800_000_000 - i * 86_400 },
}));

describe("buildDrillRequest", () => {
  const context = buildCoachContext({ snapshot: buildCoachSnapshot({ sessions, profileData: {} }), locale: "mn" });

  it("the whole instruction, schema included, fits in what the route keeps", () => {
    for (const area of ["Power", "Footwork", "Head Movement", "Combination Flow & Counter Punching"]) {
      for (const type of ["shadow", "bag", "partner", "conditioning"]) {
        const msg = buildDrillRequest({ area, type, context, locale: "mn" }).messages[0].content;
        expect(msg.length).toBeLessThanOrEqual(CHAT_MESSAGE_LIMIT);
        expect(msg.slice(0, CHAT_MESSAGE_LIMIT)).toContain('"steps":["step1","step2","step3"]}]');
        expect(msg).toContain(area);
        expect(msg).toContain(type);
      }
    }
  });
  it("the fighter context goes in coachContext, never in the message", () => {
    expect(context.length).toBeGreaterThan(100);
    const req = buildDrillRequest({ area: "Power", type: "shadow", context, locale: "mn" });
    expect(req.coachContext).toBe(context);
    expect(req.messages[0].content).not.toContain(context.slice(0, 40));
    expect(req).toMatchObject({ persona: "analyst", locale: "mn" });
  });
  it("no rounds yet → no context, same instruction", () => {
    const req = buildDrillRequest({ area: "Power", type: "shadow" });
    expect(req.coachContext).toBeNull();
    expect(req.messages[0].content).toContain("Return ONLY valid JSON array");
  });
});
