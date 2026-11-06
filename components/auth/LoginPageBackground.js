"use client";

import Link from "next/link";
import { displayTitle } from "@/components/ui/brand";

/** Soft red glow behind the card, and the GAVANA wordmark (back to the landing page) on top. */
export default function LoginPageBackground({ locale = "mn" }) {
  return (
    <>
      <div aria-hidden="true" style={{ position: "absolute", top: "-18%", left: "50%", transform: "translateX(-50%)", width: 560, height: 360, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,59,48,0.24) 0%, transparent 70%)", filter: "blur(50px)", pointerEvents: "none" }} />
      <Link href={`/${locale}`} style={{ ...displayTitle, position: "absolute", top: "calc(20px + env(safe-area-inset-top))", fontSize: 22, letterSpacing: "0.12em", textDecoration: "none" }}>
        GAVANA
      </Link>
    </>
  );
}
