"use client";

import { useEffect, useRef } from "react";

export default function ReelVideo({ src, thumbnail, isActive, muted, onFallback }) {
  const videoRef = useRef(null);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={thumbnail || undefined}
      muted
      loop
      playsInline
      preload="metadata"
      onError={onFallback}
      onStalled={() => {
        // Stalled with no data loaded means the src is likely invalid
        const video = videoRef.current;
        if (video && video.readyState === 0) onFallback?.();
      }}
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
