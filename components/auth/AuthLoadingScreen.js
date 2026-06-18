"use client";

import { RED } from "@/lib/tokens";

const S = {
  page: {
    position: "relative",
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 20px",
    overflow: "hidden",
    background: `
      radial-gradient(ellipse 90% 65% at 50% -10%, rgba(255,59,48,0.22) 0%, transparent 58%),
      radial-gradient(ellipse 55% 45% at 15% 85%, rgba(255,59,48,0.07) 0%, transparent 55%),
      #0B0B0C
    `,
  },
  loadingWrap: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "center",
    zIndex: 10,
  },
};

/**
 * Full-page loading splash shown while auth state is resolving,
 * or when the user is already logged in and about to be redirected.
 *
 * @param {{ message: string, variant?: "loading" | "loggedIn" }} props
 */
export default function AuthLoadingScreen({ message }) {
  return (
    <div style={S.page} className="grain-overlay">
      <div className="scanline" />
      <div style={S.loadingWrap}>
        <p style={{ color: RED, letterSpacing: 2, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>
          COMBAT · BOXING
        </p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
          {message}
        </p>
      </div>
    </div>
  );
}
