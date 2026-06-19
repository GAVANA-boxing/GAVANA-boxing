"use client";

import { useEffect, useState } from "react";
import { GOLD, goldAlpha, blackAlpha } from "@/lib/tokens";

/**
 * XPToast — bottom-center floating XP gain notification.
 *
 * Props:
 *   message   – e.g. "+150 XP · A RANK"
 *   visible   – boolean
 *   onDone    – called when animation ends (parent should set visible=false)
 */
export default function XPToast({ message, visible, onDone }) {
  const [phase, setPhase] = useState("idle"); // idle | in | out

  useEffect(() => {
    if (!visible) { setPhase("idle"); return; }
    setPhase("in");
    const t1 = setTimeout(() => setPhase("out"), 2200);
    const t2 = setTimeout(() => { setPhase("idle"); onDone?.(); }, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [visible, onDone]);

  if (phase === "idle") return null;

  return (
    <div
      className={phase === "in" ? "xp-toast-in" : "xp-toast-out"}
      style={{
        position: "fixed",
        bottom: "calc(90px + env(safe-area-inset-bottom))",
        left: "50%",
        zIndex: 200,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 20px",
        borderRadius: 999,
        background: `linear-gradient(135deg, ${blackAlpha(0.88)}, ${blackAlpha(0.76)})`,
        border: `1px solid ${goldAlpha(0.45)}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: `0 8px 32px ${blackAlpha(0.5)}, 0 0 20px ${goldAlpha(0.2)}`,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 16 }}>⚡</span>
      <span style={{
        fontSize: 13,
        fontWeight: 900,
        letterSpacing: 0.5,
        color: GOLD,
        textShadow: `0 0 12px ${goldAlpha(0.7)}`,
      }}>
        {message}
      </span>
    </div>
  );
}
