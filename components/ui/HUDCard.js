"use client";

import { forwardRef } from "react";

const HUDCard = forwardRef(function HUDCard(
  { children, style, className = "", label, value, corners = true, onClick, as: Tag = "div", ...props },
  ref
) {
  return (
    <Tag
      ref={ref}
      onClick={onClick}
      className={className}
      style={{
        position: "relative",
        background: "rgba(7,7,7,0.92)",
        border: "1px solid rgba(193,18,31,0.18)",
        borderRadius: "var(--card-radius-sm)",
        overflow: "hidden",
        ...style,
      }}
      {...props}
    >
      {/* Ambient top glow */}
      <div
        style={{
          position: "absolute",
          top: -20,
          left: "50%",
          transform: "translateX(-50%)",
          width: 160,
          height: 60,
          background: "rgba(193,18,31,0.08)",
          filter: "blur(24px)",
          pointerEvents: "none",
          borderRadius: "50%",
        }}
      />

      {/* HUD corner brackets */}
      {corners && (
        <>
          <div
            style={{
              position: "absolute",
              top: 6,
              left: 6,
              width: 10,
              height: 10,
              borderTop: "1.5px solid rgba(193,18,31,0.5)",
              borderLeft: "1.5px solid rgba(193,18,31,0.5)",
              borderRadius: "2px 0 0 0",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 6,
              right: 6,
              width: 10,
              height: 10,
              borderBottom: "1.5px solid rgba(193,18,31,0.5)",
              borderRight: "1.5px solid rgba(193,18,31,0.5)",
              borderRadius: "0 0 2px 0",
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* Optional label/value header */}
      {(label || value) && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            padding: "10px 14px 0",
            position: "relative",
            zIndex: 1,
          }}
        >
          {label && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                color: "var(--primary-red)",
                fontFamily: "var(--font-condensed)",
              }}
            >
              {label}
            </span>
          )}
          {value && (
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#fff",
                fontFamily: "var(--font-display)",
              }}
            >
              {value}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </Tag>
  );
});

export default HUDCard;
