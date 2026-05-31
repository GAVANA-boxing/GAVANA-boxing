"use client";

import { useState } from "react";
import { RED, PURPLE, GOLD, RADIUS, FONT_SIZE, FONT_WEIGHT, whiteAlpha, redAlpha } from "@/lib/tokens";
import { cleanCaption, getCreatorName } from "@/lib/reelHelpers";
import Image from "next/image";

const BADGE = {
  training: { label: "TRAINING", color: RED,   bg: "rgba(255,59,48,0.18)",   border: "rgba(255,59,48,0.35)"   },
  academy:  { label: "ACADEMY",  color: PURPLE, bg: "rgba(167,139,250,0.18)", border: "rgba(167,139,250,0.35)" },
};

function Avatar({ photoURL, name }) {
  const [imgErr, setImgErr] = useState(false);
  const initial = ((name || "?").charAt(0)).toUpperCase();
  if (photoURL && !imgErr) {
    return (
      <Image
        src={photoURL}
        alt={name || ""}
        width={36} height={36}
        style={{ objectFit: "cover", width: 36, height: 36 }}
        onError={() => setImgErr(true)}
        unoptimized={!/firebasestorage\.googleapis\.com|googleusercontent\.com/.test(photoURL)}
      />
    );
  }
  return (
    <span style={{
      width: 36, height: 36,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.black, color: "#fff",
    }}>
      {initial}
    </span>
  );
}

function BoxingWatermark() {
  return (
    <svg
      viewBox="0 0 120 120"
      width="220" height="220"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {/* Stylised glove outline */}
      <path
        d="M30 85 C28 70 24 55 26 42 C28 30 36 22 48 20
           C52 19 56 20 60 22
           C64 18 70 16 76 18
           C84 20 88 28 88 38
           L88 44
           C94 44 98 48 98 54
           C98 62 92 66 86 66
           L86 80
           C86 90 80 96 70 98
           L52 98
           C40 98 30 92 30 85 Z"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <path
        d="M60 22 L60 66"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M30 60 L86 60"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

function metaChip(bg, border, color) {
  return {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "4px 9px", borderRadius: RADIUS.sm,
    background: bg, border: `1px solid ${border}`, color,
    fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 0.3, textTransform: "capitalize",
    backdropFilter: "blur(4px)",
  };
}

export default function ReelPosterFallback({ reel }) {
  if (!reel) return null;

  const badge     = BADGE[reel.contentType] || BADGE.training;
  const name      = getCreatorName(reel, null);
  const photo     = reel.userPhotoURL || reel.profileImageUrl || "";
  const caption   = cleanCaption(reel.caption || reel.description || "");
  const thumbnail = reel.thumbnailURL || reel.thumbnail || "";
  const isAcademy  = reel.contentType === "academy";
  const isTraining = reel.contentType === "training";
  const hasScore   = isTraining && typeof reel.sessionScore === "number" && isFinite(reel.sessionScore);

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "#000", overflow: "hidden",
    }}>

      {/* Blurred thumbnail backdrop — if available */}
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            filter: "blur(24px) brightness(0.22) saturate(0.4)",
            transform: "scale(1.08)",
          }}
        />
      ) : null}

      {/* Cinematic gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          radial-gradient(ellipse 90% 55% at 50% -5%, rgba(180,0,0,0.18) 0%, transparent 60%),
          linear-gradient(170deg, rgba(35,4,4,0.75) 0%, rgba(8,8,10,0.92) 45%, rgba(0,0,0,0.98) 100%)
        `,
      }} />

      {/* Boxing glove watermark — center, very faint */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -58%)",
        opacity: 0.055,
        userSelect: "none", pointerEvents: "none",
      }}>
        <BoxingWatermark />
      </div>

      {/* HUD corner — top left */}
      <div style={{
        position: "absolute",
        top: "max(env(safe-area-inset-top), 18px)",
        left: 18,
        width: 20, height: 20,
        borderTop: `2px solid ${redAlpha(0.5)}`,
        borderLeft: `2px solid ${redAlpha(0.5)}`,
        borderRadius: "4px 0 0 0",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        top: "max(env(safe-area-inset-top), 18px)",
        right: 18,
        width: 20, height: 20,
        borderTop: `2px solid ${redAlpha(0.5)}`,
        borderRight: `2px solid ${redAlpha(0.5)}`,
        borderRadius: "0 4px 0 0",
        pointerEvents: "none",
      }} />

      {/* GAVANA kicker — subtle top-center */}
      <div style={{
        position: "absolute",
        top: "max(env(safe-area-inset-top), 18px)",
        left: 0, right: 0,
        display: "flex", justifyContent: "center",
        pointerEvents: "none",
      }}>
        <span style={{
          fontSize: FONT_SIZE.xs,
          fontWeight: FONT_WEIGHT.ultra,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: whiteAlpha(0.18),
        }}>
          GAVANA
        </span>
      </div>

      {/* Bottom gradient */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: "65%",
        background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 45%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* Overlay content */}
      <div style={{
        position:      "absolute",
        bottom:        0, left: 0, right: 0,
        padding:       `0 16px calc(100px + max(env(safe-area-inset-bottom), 8px)) 16px`,
        display:       "flex",
        flexDirection: "column",
        gap:           10,
        pointerEvents: "none",
      }}>

        {/* Content type badge */}
        <div>
          <span style={{
            display: "inline-flex", alignItems: "center",
            padding: "3px 8px", borderRadius: RADIUS.sm,
            background: badge.bg, border: `1px solid ${badge.border}`,
            color: badge.color,
            fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.ultra,
            letterSpacing: 1.5, textTransform: "uppercase",
          }}>
            {badge.label}
          </span>
        </div>

        {/* User row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            borderRadius: RADIUS.full, overflow: "hidden",
            border: "1.5px solid rgba(255,255,255,0.55)",
            flexShrink: 0, background: "rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Avatar photoURL={photo} name={name} />
          </div>
          <span style={{
            fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.black,
            color: "#fff", letterSpacing: -0.1,
            textShadow: "0 1px 6px rgba(0,0,0,0.8)",
          }}>
            {name}
          </span>
        </div>

        {/* Caption */}
        {caption ? (
          <p style={{
            margin: 0,
            fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium,
            color: whiteAlpha(0.82), lineHeight: 1.5,
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {caption}
          </p>
        ) : null}

        {/* Meta chips */}
        {(reel.techniqueTag || (isAcademy && reel.academyLessonId) || hasScore) ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {reel.techniqueTag ? (
              <span style={metaChip(whiteAlpha(0.08), whiteAlpha(0.14), whiteAlpha(0.7))}>
                🥊 {reel.techniqueTag}
              </span>
            ) : null}
            {isAcademy && reel.academyLessonId ? (
              <span style={metaChip("rgba(167,139,250,0.1)", "rgba(167,139,250,0.25)", PURPLE)}>
                📚 {String(reel.academyLessonId).replace(/-/g, " ")}
              </span>
            ) : null}
            {hasScore ? (
              <span style={metaChip("rgba(245,196,81,0.1)", "rgba(245,196,81,0.25)", GOLD)}>
                ⭐ {reel.sessionScore.toFixed(1)}/10
              </span>
            ) : null}
          </div>
        ) : null}

      </div>
    </div>
  );
}
