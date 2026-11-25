import { describe, it, expect } from "vitest";
import { paymentReference, parseReference, manualPayConfig, grantFields } from "@/lib/manualPay";
import { isProUser } from "@/lib/pro";

const DAY = 86_400_000;
const NOW = Date.parse("2026-11-25T12:00:00Z");

describe("payment reference", () => {
  it("is 'G-' + 8 chars of the account id; none for a too-short id", () => {
    expect(paymentReference("AbC123xYz9QwErTy")).toBe("G-AbC123xY");
    expect(paymentReference("abc")).toBeNull();
    expect(paymentReference(null)).toBeNull();
  });
  it("the owner can type it with or without the G- and in any case of the prefix", () => {
    expect(parseReference("G-AbC123xY")).toBe("AbC123xY");
    expect(parseReference(" g-AbC123xY ")).toBe("AbC123xY");
    expect(parseReference("AbC123xY")).toBe("AbC123xY");
  });
  it("rejects anything that is not exactly 8 letters/digits (no wildcard or path tricks)", () => {
    for (const bad of ["", "G-abc", "AbC123xY9", "abc/1234", "ab c1234", "AbC123x*", null, undefined]) expect(parseReference(bad)).toBeNull();
  });
});

describe("manualPayConfig", () => {
  const full = { NEXT_PUBLIC_PAY_BANK: "Хаан банк", NEXT_PUBLIC_PAY_ACCOUNT: "5000000000", NEXT_PUBLIC_PAY_HOLDER: "Овог Нэр", NEXT_PUBLIC_PAY_CONTACT: "@gavana_pay" };
  it("needs all four values — never a half-filled or invented card", () => {
    expect(manualPayConfig(full)).toEqual({ bank: "Хаан банк", account: "5000000000", holder: "Овог Нэр", contact: "@gavana_pay" });
    for (const k of Object.keys(full)) expect(manualPayConfig({ ...full, [k]: "" })).toBeNull();
    expect(manualPayConfig({})).toBeNull();
    expect(manualPayConfig()).toBeNull();
  });
});

describe("grantFields", () => {
  it("1 month from now; marked manual with an end date", () => {
    const f = grantFields(1, { now: NOW });
    expect(f.subscription).toBe("manual");
    expect(f.subscriptionTier).toBe("pro");
    expect(f.proUntil).toBe("2025-12-25T12:00:00.000Z".replace("2025", "2026"));
  });
  it("12 months", () => expect(grantFields(12, { now: NOW }).proUntil).toBe("2027-11-25T12:00:00.000Z"));
  it("only whole months 1–12", () => {
    for (const m of [0, 13, 1.5, -1, "x", null, undefined]) expect(grantFields(m, { now: NOW })).toBeNull();
  });
  it("paying while Pro still runs extends from its end", () => {
    const f = grantFields(1, { now: NOW, currentProUntil: new Date(NOW + 10 * DAY).toISOString() });
    expect(Date.parse(f.proUntil)).toBeGreaterThan(NOW + 35 * DAY);
  });
  it("an expired Pro starts again from now, not from the old end", () => {
    const f = grantFields(1, { now: NOW, currentProUntil: new Date(NOW - 100 * DAY).toISOString() });
    expect(f.proUntil).toBe("2026-12-25T12:00:00.000Z");
  });
});

describe("isProUser with a manual grant", () => {
  const manual = (proUntil) => ({ subscriptionTier: "pro", subscription: "manual", proUntil });
  it("Pro until the end date, not after", () => {
    expect(isProUser(manual(new Date(NOW + DAY).toISOString()), NOW)).toBe(true);
    expect(isProUser(manual(new Date(NOW - DAY).toISOString()), NOW)).toBe(false);
  });
  it("a manual grant with no / broken end date is not Pro (never open-ended)", () => {
    expect(isProUser(manual(undefined), NOW)).toBe(false);
    expect(isProUser(manual("soon"), NOW)).toBe(false);
  });
  it("Stripe-style users are unchanged", () => {
    expect(isProUser({ subscriptionTier: "pro", subscription: "active" }, NOW)).toBe(true);
    expect(isProUser({ subscriptionTier: "pro", subscription: "canceled" }, NOW)).toBe(false);
    expect(isProUser({ subscriptionTier: "pro" }, NOW)).toBe(true);
    expect(isProUser({ tier: "pro" }, NOW)).toBe(false);
  });
});
