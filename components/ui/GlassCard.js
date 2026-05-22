"use client";

import { forwardRef } from "react";
import { RADIUS, redAlpha, whiteAlpha, blackAlpha } from "@/lib/tokens";

const GlassCard = forwardRef(function GlassCard(
  { children, style, className = "", glow = false, onClick, as: Tag = "div", ...props },
  ref
) {
  return (
    <Tag
      ref={ref}
      onClick={onClick}
      className={className}
      style={{
        background: whiteAlpha(0.05),
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${whiteAlpha(0.07)}`,
        borderRadius: RADIUS.md,
        overflow: "hidden",
        ...(glow && { boxShadow: `0 0 28px ${redAlpha(0.2)}, 0 8px 32px ${blackAlpha(0.4)}` }),
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
});

export default GlassCard;
