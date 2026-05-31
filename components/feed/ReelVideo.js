"use client";

import { useEffect, useRef } from "react";

export default function ReelVideo({ src, thumbnail, isActive, muted }) {
  const videoRef = useRef(null);

  // Sync play/pause when active state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive]);

  // Sync muted state separately — React's `muted` attr doesn't update reactively
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  if (!src) {
    return (
      <div style={{
        position: "absolute", inset: 0,
        background: "#0a0a0a",
      }}>
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
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
        position:  "absolute",
        inset:     0,
        width:     "100%",
        height:    "100%",
        objectFit: "cover",
        background: "#000",
      }}
    />
  );
}
