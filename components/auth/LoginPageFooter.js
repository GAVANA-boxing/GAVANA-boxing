"use client";

const S = {
  bottomSystem: {
    position: "absolute",
    bottom: 16,
    textAlign: "center",
  },
};

/**
 * Bottom "SECURE CHANNEL" label with Terms and Privacy links.
 *
 * @param {{ locale: string }} props
 */
export default function LoginPageFooter({ locale }) {
  const termsLabel =
    locale === "mn" ? "Үйлчилгээний нөхцөл" : locale === "ko" ? "이용약관" : "Terms";
  const privacyLabel =
    locale === "mn" ? "Нууцлалын бодлого" : locale === "ko" ? "개인정보처리방침" : "Privacy";

  return (
    <div style={S.bottomSystem}>
      <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 10, letterSpacing: 2, fontWeight: 700 }}>
        GAVANA © 2025 — SECURE CHANNEL
      </span>
      <div style={{ marginTop: 8, display: "flex", gap: 12, justifyContent: "center" }}>
        <a
          href={`/${locale}/terms`}
          style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, textDecoration: "none" }}
        >
          {termsLabel}
        </a>
        <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
        <a
          href={`/${locale}/privacy`}
          style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, textDecoration: "none" }}
        >
          {privacyLabel}
        </a>
      </div>
    </div>
  );
}
