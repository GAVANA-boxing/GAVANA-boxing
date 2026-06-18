"use client";

import { RED } from "@/lib/tokens";

const S = {
  arenaLabel: {
    margin: "0 0 10px",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 4,
    color: RED,
    textTransform: "uppercase",
    textShadow: "0 0 14px rgba(255,59,48,0.65)",
  },
  mainTitle: {
    margin: "0 0 8px",
    fontSize: 34,
    fontWeight: 1000,
    color: "#fff",
    letterSpacing: "-0.02em",
    lineHeight: 1,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    textTransform: "uppercase",
  },
  helperText: {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.38)",
    lineHeight: 1.45,
  },
};

/**
 * Arena label, main title, and helper subtitle inside the HUD card.
 *
 * @param {{ isSignUp: boolean, locale: string, titleText: string, subtitleText: string }} props
 */
export default function AuthCardHeader({ isSignUp, locale, titleText, subtitleText }) {
  const arenaLabel = isSignUp
    ? (locale === "mn" ? "БҮРТГҮҮЛЭХ" : locale === "ko" ? "등록하기" : "FIGHTER REGISTRATION")
    : (locale === "mn" ? "ТУЛААНД НЭВТРЭХ" : locale === "ko" ? "아레나 입장" : "ENTER THE ARENA");

  return (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      <p style={S.arenaLabel}>{arenaLabel}</p>
      <h1 style={S.mainTitle}>{titleText}</h1>
      <p style={S.helperText}>{subtitleText}</p>
    </div>
  );
}
