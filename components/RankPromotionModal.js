"use client";

import { useEffect } from "react";
import { GOLD, goldAlpha, RADIUS} from "@/lib/tokens";
import RankIcon from "@/components/RankIcon";

const PARTICLES = [
  { tx: "-130px", ty: "-90px",  delay: 0   },
  { tx: "130px",  ty: "-100px", delay: 50  },
  { tx: "115px",  ty: "110px",  delay: 90  },
  { tx: "-115px", ty: "110px",  delay: 130 },
  { tx: "-160px", ty: "5px",    delay: 20  },
  { tx: "160px",  ty: "15px",   delay: 70  },
  { tx: "15px",   ty: "-150px", delay: 110 },
  { tx: "-15px",  ty: "150px",  delay: 150 },
  { tx: "85px",   ty: "-130px", delay: 35  },
  { tx: "-85px",  ty: "-120px", delay: 85  },
  { tx: "100px",  ty: "80px",   delay: 55  },
  { tx: "-100px", ty: "75px",   delay: 105 },
];

export default function RankPromotionModal({ rank, rankName, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "promotionOverlayIn 360ms ease both",
      }}
      onClick={onDismiss}
    >
      {/* Rotating gold ray burst */}
      <div style={{ position: "absolute", top: "50%", left: "50%", pointerEvents: "none" }}>
        <div
          className="promo-rays"
          style={{ width: 560, height: 560, marginLeft: -280, marginTop: -280, borderRadius: "50%" }}
        />
      </div>

      {/* Expanding ripple rings */}
      <div style={{ position: "absolute", top: "50%", left: "50%", pointerEvents: "none" }}>
        {[0, 0.38, 0.76].map((delay, i) => (
          <div
            key={i}
            className="promo-ring"
            style={{
              width: 130, height: 130,
              marginLeft: -65, marginTop: -65,
              borderRadius: "50%",
              border: `1.5px solid ${goldAlpha(0.55)}`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>

      {/* Gold particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="promo-particle"
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: 7, height: 7,
            marginLeft: -3.5, marginTop: -3.5,
            borderRadius: "50%",
            background: GOLD,
            boxShadow: `0 0 8px ${GOLD}, 0 0 16px ${goldAlpha(0.5)}`,
            animationDelay: `${p.delay}ms`,
            pointerEvents: "none",
            "--tx": p.tx,
            "--ty": p.ty,
          }}
        />
      ))}

      {/* Promotion card */}
      <div
        className="promotion-card-enter"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          padding: "36px 28px 28px",
          maxWidth: 320,
          width: "88%",
          borderRadius: 24,
          border: `1px solid ${goldAlpha(0.22)}`,
          background: `linear-gradient(160deg, ${goldAlpha(0.09)} 0%, rgba(0,0,0,0.7) 100%)`,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: `0 0 80px ${goldAlpha(0.15)}, 0 32px 64px rgba(0,0,0,0.7)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{
          margin: 0, fontSize: 9, fontWeight: 900,
          letterSpacing: "4px", textTransform: "uppercase",
          color: GOLD,
        }}>
          ⚡ RANK UP
        </p>

        <div className="promotion-badge-enter" style={{ margin: "4px 0 8px" }}>
          <RankIcon rank={rank} size={96} animated />
        </div>

        <h2
          className="promotion-title-enter"
          style={{
            margin: 0, fontSize: 30, fontWeight: 900,
            color: rank.color || GOLD,
            letterSpacing: "-0.02em", textAlign: "center",
            fontFamily: "var(--font-display, 'Anton', sans-serif)",
            textShadow: rank.glowColor ? `0 0 28px ${rank.glowColor}` : `0 0 20px ${goldAlpha(0.6)}`,
          }}
        >
          {rankName}
        </h2>

        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "6px 18px", borderRadius: RADIUS.full, marginTop: 2,
          background: goldAlpha(0.08),
          border: `1px solid ${goldAlpha(0.22)}`,
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>⭐</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: GOLD, letterSpacing: "-0.01em" }}>
            {rank.minXP.toLocaleString()} XP
          </span>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          style={{
            marginTop: 14, width: "100%",
            padding: "14px", borderRadius: 14,
            border: `1px solid ${goldAlpha(0.35)}`,
            background: `linear-gradient(135deg, ${goldAlpha(0.2)}, ${goldAlpha(0.06)})`,
            color: GOLD, fontSize: 13, fontWeight: 900,
            letterSpacing: "2px", textTransform: "uppercase",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          CONTINUE →
        </button>
      </div>
    </div>
  );
}
