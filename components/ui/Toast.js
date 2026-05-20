"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { redAlpha } from "@/lib/tokens";

export function Toast({ message, type = "error", onDismiss, duration = 3500 }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!message) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onDismiss, duration);
    return () => clearTimeout(timerRef.current);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  const isError = type === "error";
  const border = isError ? redAlpha(0.3) : "rgba(52,211,153,0.3)";
  const glow = isError ? redAlpha(0.18) : "rgba(52,211,153,0.12)";

  return (
    <>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{
        position: "fixed",
        bottom: "calc(82px + env(safe-area-inset-bottom))",
        left: 16,
        right: 16,
        zIndex: 9999,
        background: isError ? "rgba(10,5,7,0.97)" : "rgba(5,10,7,0.97)",
        border: `1px solid ${border}`,
        borderRadius: 16,
        padding: "13px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: `0 0 32px ${glow}, 0 12px 40px rgba(0,0,0,0.7)`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        animation: "toastIn 240ms cubic-bezier(0.16,1,0.3,1)",
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>{isError ? "⚠️" : "✓"}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.35 }}>
          {message}
        </span>
        <button
          type="button"
          onClick={onDismiss}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 16, cursor: "pointer", padding: 4, lineHeight: 1, flexShrink: 0 }}
        >
          ✕
        </button>
      </div>
    </>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "error") => setToast({ message, type }), []);
  const hideToast = useCallback(() => setToast(null), []);
  return { toast, showToast, hideToast };
}
