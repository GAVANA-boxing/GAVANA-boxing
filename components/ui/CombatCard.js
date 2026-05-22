"use client";

import { forwardRef } from "react";
import { RADIUS, redAlpha, whiteAlpha, blackAlpha } from "@/lib/tokens";

const CombatCard = forwardRef(function CombatCard(
  { children, style, className = "", glowColor, accent = false, onClick, as: Tag = "div", ...props },
  ref
) {
  const borderColor = glowColor
    ? glowColor.replace(")", ", 0.3)").replace("rgb(", "rgba(")
    : accent
    ? redAlpha(0.3)
    : whiteAlpha(0.06);

  const shadow = glowColor
    ? `0 0 28px ${glowColor.replace(")", ", 0.18)").replace("rgb(", "rgba(")}, 0 8px 32px ${blackAlpha(0.6)}`
    : `0 8px 32px ${blackAlpha(0.6)}`;

  return (
    <Tag
      ref={ref}
      onClick={onClick}
      className={className}
      style={{
        background: whiteAlpha(0.025),
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: `1px solid ${borderColor}`,
        borderRadius: RADIUS.sm,
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
            background: `linear-gradient(90deg, transparent, ${redAlpha(0.7)}, transparent)`,
            pointerEvents: "none",
          }}
        />
      )}
      {children}
    </Tag>
  );
});

export default CombatCard;
