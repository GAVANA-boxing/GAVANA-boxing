"use client";

import { useEffect, useRef } from "react";

export default function ReelVideo({ src, thumbnail, isActive }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
      video.play().catch(() => {
        // Autoplay blocked — user must interact first; silent fail is correct here
      });
    } else {
      video.pause();
    }
  }, [isActive]);

  if (!src) {
    return (
      <div style={{
        position: "absolute", inset: 0,
        background: "#0a0a0a",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={src}
      poster={thumbnail || undefined}
      muted
      loop
      playsInline
      preload="metadata"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        background: "#000",
      }}
    />
  );
}
