"use client";

import { useState } from "react";
import { RED, PURPLE, GOLD, RADIUS, FONT_SIZE, FONT_WEIGHT, whiteAlpha } from "@/lib/tokens";
import { cleanCaption, getCreatorName } from "@/lib/reelHelpers";
import ReelVideo from "./ReelVideo";
import ReelPosterFallback from "./ReelPosterFallback";
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

function MuteIcon({ muted }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {muted ? (
        <>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </>
      ) : (
        <>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </>
      )}
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
    backdropFilter: "blur(4px)", textShadow: "none",
  };
}

export default function ReelCard({ reel, isActive }) {
  const [muted,       setMuted]       = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  if (!reel) return null;

  const srcUrl    = reel.videoURL || reel.url || "";
  const hasVideo  = Boolean(srcUrl);
  const showVideo = hasVideo && !videoFailed;

  const badge     = BADGE[reel.contentType] || BADGE.training;
  const name      = getCreatorName(reel, null);
  const photo     = reel.userPhotoURL || reel.profileImageUrl || "";
  const caption   = cleanCaption(reel.caption || reel.description || "");
  const isAcademy  = reel.contentType === "academy";
  const isTraining = reel.contentType === "training";
  const hasScore   = isTraining && typeof reel.sessionScore === "number" && isFinite(reel.sessionScore);

  return (
    <div
      style={{
        position:        "relative",
        height:          "100dvh",
        flexShrink:      0,
        scrollSnapAlign: "start",
        scrollSnapStop:  "always",
        overflow:        "hidden",
        background:      "#000",
        cursor:          showVideo ? "pointer" : "default",
      }}
      onClick={showVideo ? () => setMuted((m) => !m) : undefined}
    >

      {/* ── Video path ─────────────────────────────────────────────────────── */}
      {showVideo ? (
        <>
          <ReelVideo
            src={srcUrl}
            thumbnail={reel.thumbnailURL || reel.thumbnail || ""}
            isActive={isActive}
            muted={muted}
            onFallback={() => setVideoFailed(true)}
          />

          {/* Mute indicator */}
          <div style={{
            position:  "absolute",
            top:       "max(env(safe-area-inset-top), 16px)",
            right:     16,
            zIndex:    10,
            padding:   "6px 8px",
            borderRadius: RADIUS.sm,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(8px)",
            color:     muted ? "rgba(255,255,255,0.55)" : "#fff",
            display:   "flex", alignItems: "center",
            pointerEvents: "none",
          }}>
            <MuteIcon muted={muted} />
          </div>

          {/* Bottom gradient */}
          <div style={{
            position:      "absolute",
            bottom:        0, left: 0, right: 0,
            height:        "60%",
            background:    "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 40%, transparent 100%)",
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
                textShadow: "0 1px 4px rgba(0,0,0,0.6)",
              }}>
                {name}
              </span>
            </div>

            {caption ? (
              <p style={{
                margin: 0,
                fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium,
                color: whiteAlpha(0.85), lineHeight: 1.5,
                textShadow: "0 1px 4px rgba(0,0,0,0.7)",
                display: "-webkit-box",
                WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {caption}
              </p>
            ) : null}

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
        </>
      ) : (
        /* ── Poster fallback path ─────────────────────────────────────────── */
        <ReelPosterFallback reel={reel} />
      )}

    </div>
  );
}
