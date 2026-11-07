"use client";

import { BRAND } from "@/components/ui/brand";

/** © line with the Terms and Privacy links, under the card. */
export default function LoginPageFooter({ locale }) {
  const termsLabel = locale === "mn" ? "Үйлчилгээний нөхцөл" : locale === "ko" ? "이용약관" : "Terms";
  const privacyLabel = locale === "mn" ? "Нууцлалын бодлого" : locale === "ko" ? "개인정보처리방침" : "Privacy";
  const link = { color: BRAND.faint, fontSize: 12.5, textDecoration: "none", display: "inline-block", padding: "10px 4px" };

  return (
    <footer style={{ marginTop: 28, textAlign: "center", fontSize: 12.5, color: BRAND.faint, position: "relative", zIndex: 1 }}>
      <div>© {new Date().getFullYear()} GAVANA</div>
      <div style={{ marginTop: 0, display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
        <a href={`/${locale}/terms`} style={link}>{termsLabel}</a>
        <span aria-hidden="true">·</span>
        <a href={`/${locale}/privacy`} style={link}>{privacyLabel}</a>
      </div>
    </footer>
  );
}
