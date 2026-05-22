"use client";

import { BG } from "@/lib/tokens";

export default function PageShell({ children, style, maxWidth = 640, padBottom = true }) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: BG,
        color: "#fff",
        paddingBottom: padBottom ? "calc(88px + env(safe-area-inset-bottom))" : 0,
        ...style,
      }}
    >
      <div
        style={{
          maxWidth,
          margin: "0 auto",
          padding: "0 16px",
        }}
      >
        {children}
      </div>
    </main>
  );
}
