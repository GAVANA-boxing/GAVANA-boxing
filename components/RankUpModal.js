"use client";

import RankIcon from "@/components/RankIcon";
import { RADIUS } from "@/lib/tokens";

if (typeof window !== "undefined") {
  if (!document.getElementById("rank-modal-kf")) {
    const s = document.createElement("style");
    s.id = "rank-modal-kf";
    s.textContent = `
      @keyframes rankModalIn {
        0%   { opacity: 0; transform: scale(0.7) translateY(28px); }
        65%  { transform: scale(1.04) translateY(-4px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes rankOverlayIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes rankIconBounce {
        0%,100% { transform: scale(1); }
        30%     { transform: scale(1.32); }
        55%     { transform: scale(0.9); }
        75%     { transform: scale(1.1); }
      }
      @keyframes rankShine {
        0%,100% { opacity: 0; }
        50%     { opacity: 1; }
      }
    `;
    document.head.appendChild(s);
  }
}

export default function RankUpModal({ rank, onClose, t }) {
  if (!rank) return null;

  const borderColor = rank.glowColor
    ? rank.glowColor.replace(/[\d.]+\)$/, "0.45)")
    : `${rank.color}55`;
  const shadowColor = rank.glowColor
    ? rank.glowColor.replace(/[\d.]+\)$/, "0.25)")
    : `${rank.color}30`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        animation: "rankOverlayIn 300ms ease forwards",
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          background: "linear-gradient(165deg, #0E0E0E, #131313)",
          border: `1px solid ${borderColor}`,
          borderRadius: 28,
          padding: "48px 32px 38px",
          maxWidth: 320,
          width: "100%",
          textAlign: "center",
          boxShadow: `0 0 70px ${shadowColor}, 0 36px 90px rgba(0,0,0,0.75)`,
          animation: "rankModalIn 500ms cubic-bezier(0.34,1.56,0.64,1) forwards",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Shine sweep */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(125deg, transparent 30%, ${rank.color}18 50%, transparent 70%)`,
          animation: "rankShine 2.5s ease-in-out 0.5s infinite",
          pointerEvents: "none",
        }} />

        {/* Rank icon with bounce */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 24,
          animation: "rankIconBounce 750ms 350ms cubic-bezier(0.34,1.56,0.64,1) both",
        }}>
          <RankIcon rank={rank} size={76} animated />
        </div>

        <p style={{
          margin: "0 0 6px",
          color: rank.color,
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 3.5,
          textTransform: "uppercase",
        }}>
          {t("rankUpTitle")}
        </p>

        <h2 style={{
          margin: "0 0 10px",
          color: "#fff",
          fontSize: 34,
          fontWeight: 1000,
          lineHeight: 1,
          letterSpacing: -0.5,
        }}>
          {t(rank.key)}
        </h2>

        <p style={{
          margin: "0 0 30px",
          color: "rgba(255,255,255,0.45)",
          fontSize: 13,
          lineHeight: 1.55,
        }}>
          {t("rankUpSubtitle").replace("{rank}", t(rank.key))}
        </p>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            padding: "15px 0",
            background: rank.gradient,
            border: "none",
            borderRadius: RADIUS.full,
            color: "#fff",
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: 0.8,
            cursor: "pointer",
          }}
        >
          {t("rankUpContinue")}
        </button>
      </div>
    </div>
  );
}
