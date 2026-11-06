import { describe, it, expect } from "vitest";
import { planPrivacyMigration } from "@/lib/privacyMigration";
import { PRIVATE_USER_FIELDS } from "@/lib/privateProfileFields";

describe("privacy migration plan", () => {
  it("moves a real email and deletes the field", () => {
    expect(planPrivacyMigration([{ id: "a", data: { email: " x@y.mn " } }])).toEqual([{ id: "a", email: "x@y.mn", deleteFields: ["email"] }]);
  });
  it("deletes an empty email without copying it", () => {
    expect(planPrivacyMigration([{ id: "b", data: { email: "" } }])).toEqual([{ id: "b", email: null, deleteFields: ["email"] }]);
  });
  it("skips clean docs", () => {
    expect(planPrivacyMigration([{ id: "c", data: {} }, { id: "d", data: { displayName: "D" } }])).toEqual([]);
  });
  it("email is a private field", () => {
    expect(PRIVATE_USER_FIELDS).toContain("email");
  });
});
