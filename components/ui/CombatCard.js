"use client";

import { forwardRef } from "react";

const CombatCard = forwardRef(function CombatCard(
  { children, style, className = "", glowColor, accent = false, onClick, as: Tag = "div", ...props },
  ref
) {
  const borderColor = glowColor
    ? glowColor.replace(")", ", 0.3)").replace("rgb(", "rgba(")
    : accent
    ? "rgba(255,59,48,0.3)"
    : "rgba(255,255,255,0.06)";

  const shadow = glowColor
    ? `0 0 28px ${glowColor.replace(")", ", 0.18)").replace("rgb(", "rgba(")}, 0 8px 32px rgba(0,0,0,0.6)`
    : "0 8px 32px rgba(0,0,0,0.6)";

  return (
    <Tag
      ref={ref}
      onClick={onClick}
      className={className}
      style={{
        background: "rgba(255,255,255,0.025)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: `1px solid ${borderColor}`,
        borderRadius: "var(--card-radius-sm)",
        overflow: "hidden",
        boxShadow: shadow,
        position: "relative",
        ...style,
      }}
      {...props}
    >
      {accent && (
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, transparent, rgba(255,59,48,0.7), transparent)",
            pointerEvents: "none",
          }}
        />
      )}
      {children}
    </Tag>
  );
});

export default CombatCard;
