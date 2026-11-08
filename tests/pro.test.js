import { describe, it, expect } from "vitest";
import { isProUser, formatMnt, PRO_PRICES, PRO_PERKS, AI_CHAT_FREE_DAILY } from "@/lib/pro";

describe("isProUser", () => {
  it("needs a Pro tier and an active status", () => {
    expect(isProUser({ subscriptionTier: "pro", subscription: "active" })).toBe(true);
    expect(isProUser({ subscriptionTier: "pro", subscription: "trialing" })).toBe(true);
    expect(isProUser({ subscriptionTier: "pro", subscription: "past_due" })).toBe(false);
    expect(isProUser({ subscriptionTier: "pro", subscription: "canceled" })).toBe(false);
    expect(isProUser({ subscriptionTier: "", subscription: "active" })).toBe(false);
    expect(isProUser({ subscriptionTier: "fan", subscription: "active" })).toBe(false);
  });
  it("keeps older docs that only have the tier", () => {
    expect(isProUser({ subscriptionTier: "champion" })).toBe(true);
    expect(isProUser({ tier: "pro" })).toBe(true);
    expect(isProUser(null)).toBe(false);
  });
});

describe("pricing", () => {
  it("formats tögrög", () => {
    expect(formatMnt(9900)).toBe("9,900₮");
    expect(formatMnt(79000)).toBe("79,000₮");
  });
  it("yearly is cheaper than 12 months", () => {
    expect(PRO_PRICES.yearly.amount).toBeLessThan(PRO_PRICES.monthly.amount * 12);
    expect(PRO_PRICES.monthly.currency).toBe("MNT");
  });
  it("every perk names where it is enforced and has MN/KO/EN text", () => {
    for (const p of PRO_PERKS) {
      expect(p.where).toMatch(/\.(js|ts)$/);
      for (const l of ["mn", "ko", "en"]) { expect(p.title[l]).toBeTruthy(); expect(p.body[l]).toBeTruthy(); }
    }
    expect(AI_CHAT_FREE_DAILY).toBeGreaterThan(0);
  });
});
