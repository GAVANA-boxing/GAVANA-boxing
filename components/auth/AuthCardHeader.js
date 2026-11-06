"use client";

import { BRAND, displayTitle, kickerDot, kickerPill } from "@/components/ui/brand";

/**
 * Pill kicker, display title and subtitle at the top of the sign-in card.
 * @param {{ isSignUp: boolean, locale: string, titleText: string, subtitleText: string }} props
 */
export default function AuthCardHeader({ isSignUp, locale, titleText, subtitleText }) {
  const kicker = isSignUp
    ? (locale === "mn" ? "Шинэ тулаанч" : locale === "ko" ? "새 파이터" : "New fighter")
    : (locale === "mn" ? "Тавтай морил" : locale === "ko" ? "환영합니다" : "Welcome back");

  return (
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      <p style={{ ...kickerPill, margin: "0 auto" }}><span style={kickerDot} />{kicker}</p>
      <h1 style={{ ...displayTitle, fontSize: 38, marginTop: 14 }}>{titleText}</h1>
      <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.5, color: BRAND.muted }}>{subtitleText}</p>
    </div>
  );
}
