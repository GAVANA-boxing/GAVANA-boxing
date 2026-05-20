"use client";

import { forwardRef } from "react";

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
        background: "var(--glass)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "var(--card-radius)",
        overflow: "hidden",
        ...(glow && { boxShadow: "var(--shadow-glow-red)" }),
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
});

export default GlassCard;
