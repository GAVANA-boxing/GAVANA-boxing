// How a failed scoring call is classified. "not_configured" means "give up, nothing to retry";
// a transient failure classified that way lost the round's XP for good (2026-11 review).
import { describe, it, expect } from "vitest";
import { scoreFailure } from "@/lib/scoreClient";

describe("scoreFailure", () => {
  it("the route saying it has no service account → not_configured", () => {
    expect(scoreFailure(503, { error: "Scoring not configured", code: "not_configured" })).toEqual({ ok: false, code: "not_configured" });
  });
  it("a 503 from the platform (no body / other body) → retryable error", () => {
    expect(scoreFailure(503, null)).toEqual({ ok: false, code: "error", status: 503 });
    expect(scoreFailure(503, { message: "Service Unavailable" })).toMatchObject({ code: "error" });
  });
  it("500 / 429 / anything else → retryable error", () => {
    expect(scoreFailure(500, { error: "Scoring failed" })).toEqual({ ok: false, code: "error", status: 500 });
    expect(scoreFailure(429, { error: "Rate limited" })).toMatchObject({ code: "error", status: 429 });
    // a body that claims not_configured on another status is not trusted as such
    expect(scoreFailure(500, { code: "not_configured" })).toMatchObject({ code: "error" });
  });
});
