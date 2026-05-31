"use client";

import { useState } from "react";
import { RED, PURPLE, GOLD, RADIUS, FONT_SIZE, FONT_WEIGHT, whiteAlpha } from "@/lib/tokens";
import { cleanCaption, getCreatorName } from "@/lib/reelHelpers";
import ReelVideo from "./ReelVideo";
import Image from "next/image";

const BADGE = {
  training: { label: "TRAINING", color: RED,    bg: "rgba(255,59,48,0.18)",  border: "rgba(255,59,48,0.35)"  },
  academy:  { label: "ACADEMY",  color: PURPLE,  bg: "rgba(167,139,250,0.18)", border: "rgba(167,139,250,0.35)" },
};

function Avatar({ photoURL, name }) {
  const [imgErr, setImgErr] = useState(false);
  const initial = (name || "?").charAt(0).toUpperCase();

  if (photoURL && !imgErr) {
    return (
      <Image
        src={photoURL}
        alt={name || ""}
        width={36}
        height={36}
        style={{ objectFit: "cover", width: 36, height: 36 }}
        onError={() => setImgErr(true)}
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

export default function ReelCard({ reel, isActive }) {
  const badge   = BADGE[reel.contentType] || BADGE.training;
  const name    = getCreatorName(reel, null);
  const photo   = reel.userPhotoURL || reel.profileImageUrl || "";
  const caption = cleanCaption(reel.caption || reel.description || "");

  const isAcademy  = reel.contentType === "academy";
  const isTraining = reel.contentType === "training";

  return (
    <div style={{
      position:        "relative",
      height:          "100dvh",
      flexShrink:      0,
      scrollSnapAlign: "start",
      scrollSnapStop:  "always",
      overflow:        "hidden",
      background:      "#000",
    }}>
      {/* Video layer */}
      <ReelVideo
        src={reel.videoURL || reel.url || ""}
        thumbnail={reel.thumbnailURL || reel.thumbnail || ""}
        isActive={isActive}
      />

      {/* Bottom gradient */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: "55%",
        background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 40%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* Overlay content */}
      <div style={{
        position:    "absolute",
        bottom:      0, left: 0, right: 0,
        padding:     `0 16px calc(96px + max(env(safe-area-inset-bottom), 8px)) 16px`,
        display:     "flex",
        flexDirection: "column",
        gap:         10,
      }}>

        {/* Content type badge */}
        <div>
          <span style={{
            display:       "inline-flex",
            alignItems:    "center",
            padding:       "3px 8px",
            borderRadius:  RADIUS.sm,
            background:    badge.bg,
            border:        `1px solid ${badge.border}`,
            color:         badge.color,
            fontSize:      FONT_SIZE.xs,
            fontWeight:    FONT_WEIGHT.ultra,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}>
            {badge.label}
          </span>
        </div>

        {/* User row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width:        36, height: 36,
            borderRadius: RADIUS.full,
            overflow:     "hidden",
            border:       "1.5px solid rgba(255,255,255,0.55)",
            flexShrink:   0,
            background:   "rgba(255,255,255,0.08)",
            display:      "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Avatar photoURL={photo} name={name} />
          </div>
          <span style={{
            fontSize:   FONT_SIZE.base,
            fontWeight: FONT_WEIGHT.black,
            color:      "#fff",
            letterSpacing: -0.1,
          }}>
            {name}
          </span>
        </div>

        {/* Caption */}
        {caption ? (
          <p style={{
            margin:       0,
            fontSize:     FONT_SIZE.sm,
            fontWeight:   FONT_WEIGHT.medium,
            color:        whiteAlpha(0.82),
            lineHeight:   1.5,
            display:      "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow:     "hidden",
          }}>
            {caption}
          </p>
        ) : null}

        {/* Meta row — technique tag / academy lesson / session score */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {reel.techniqueTag && (
            <span style={metaChip(whiteAlpha(0.08), whiteAlpha(0.12), whiteAlpha(0.55))}>
              🥊 {reel.techniqueTag}
            </span>
          )}

          {isAcademy && reel.academyLessonId && (
            <span style={metaChip("rgba(167,139,250,0.1)", "rgba(167,139,250,0.22)", PURPLE)}>
              📚 {reel.academyLessonId.replace(/-/g, " ")}
            </span>
          )}

          {isTraining && typeof reel.sessionScore === "number" && (
            <span style={metaChip("rgba(245,196,81,0.1)", "rgba(245,196,81,0.22)", GOLD)}>
              ⭐ {reel.sessionScore.toFixed(1)}/10
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

function metaChip(bg, border, color) {
  return {
    display:       "inline-flex",
    alignItems:    "center",
    gap:           4,
    padding:       "4px 9px",
    borderRadius:  RADIUS.sm,
    background:    bg,
    border:        `1px solid ${border}`,
    color,
    fontSize:      FONT_SIZE.xs,
    fontWeight:    FONT_WEIGHT.bold,
    letterSpacing: 0.3,
    textTransform: "capitalize",
    backdropFilter: "blur(4px)",
  };
}
