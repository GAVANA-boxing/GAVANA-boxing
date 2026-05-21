"use client";

import { RED, RED_DARK, SURFACE, BORDER, MUTED } from "@/lib/tokens";

export default function AppButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  style,
  ...props
}) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    border: "none",
    borderRadius: 10,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "opacity 150ms ease",
    whiteSpace: "nowrap",
    ...(fullWidth ? { width: "100%" } : {}),
  };

  const sizes = {
    sm: { height: 32, padding: "0 12px", fontSize: 12 },
    md: { height: 40, padding: "0 16px", fontSize: 13 },
    lg: { height: 48, padding: "0 24px", fontSize: 14 },
  };

  const variants = {
    primary: { background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`, color: "#fff", boxShadow: `0 6px 20px rgba(255,59,48,0.28), inset 0 1px 0 rgba(255,255,255,0.1)` },
    ghost: { background: "transparent", border: `1px solid ${BORDER}`, color: "#fff" },
    muted: { background: SURFACE, color: MUTED },
  };

  return (
    <button
      onClick={!disabled ? onClick : undefined}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
