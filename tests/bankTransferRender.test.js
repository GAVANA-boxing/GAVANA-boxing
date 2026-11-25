import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import BankTransferCard from "@/components/pro/BankTransferCard";

const config = { bank: "Хаан банк", account: "5000000000", holder: "Овог Нэр", contact: "@gavana_pay" };
const html = (p) => renderToStaticMarkup(<BankTransferCard locale="mn" {...p} />);

describe("BankTransferCard", () => {
  it("no config → nothing at all (no invented bank details)", () => {
    expect(html({ config: null, reference: "G-AbC123xY" })).toBe("");
  });
  it("signed in: the owner's account and THIS person's code, both copyable, and where to send the code", () => {
    const h = html({ config, reference: "G-AbC123xY" });
    expect(h).toContain("5000000000");
    expect(h).toContain("Овог Нэр");
    expect(h).toContain("G-AbC123xY");
    expect(h).toContain("@gavana_pay");
    expect(h).toContain("9,900₮");
    expect(h).toContain("79,000₮");
    expect(h.match(/Хуулах/g).length).toBe(2);
  });
  it("signed out: no account number and no code yet — only the sign-in button", () => {
    const h = html({ config, reference: null });
    expect(h).not.toContain("5000000000");
    expect(h).toContain("Нэвтэрч кодоо аваарай");
  });
});
