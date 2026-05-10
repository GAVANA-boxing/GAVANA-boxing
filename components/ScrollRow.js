"use client";

import { useEffect, useRef, useState } from "react";

// Horizontally scrollable row with:
// - scroll-snap per card
// - arrow buttons on non-touch devices
// - mobile swipe natively
// - no page-wide overflow

export default function ScrollRow({ children, cardWidth = 220, gap = 10 }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [isTouch, setIsTouch] = useState(true);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      setCanLeft(el.scrollLeft > 8);
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", check); ro.disconnect(); };
  }, []);

  const scrollBy = (dir) => {
    ref.current?.scrollBy({ left: dir * (cardWidth + gap), behavior: "smooth" });
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Left arrow */}
      {!isTouch && canLeft && (
        <ArrowBtn dir="left" onClick={() => scrollBy(-1)} />
      )}

      {/* Scroll container */}
      <div
        ref={ref}
        style={{
          display: "flex",
          gap,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          paddingBottom: 8,
          // Fade edges on desktop to hint more content
          WebkitMaskImage: canLeft && canRight
            ? "linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent)"
            : canLeft
              ? "linear-gradient(to right, transparent, black 40px)"
              : canRight
                ? "linear-gradient(to right, black calc(100% - 40px), transparent)"
                : "none",
          maskImage: canLeft && canRight
            ? "linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent)"
            : canLeft
              ? "linear-gradient(to right, transparent, black 40px)"
              : canRight
                ? "linear-gradient(to right, black calc(100% - 40px), transparent)"
                : "none",
        }}
      >
        {children}
      </div>

      {/* Right arrow */}
      {!isTouch && canRight && (
        <ArrowBtn dir="right" onClick={() => scrollBy(1)} />
      )}

      {/* Hide scrollbar in WebKit */}
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

function ArrowBtn({ dir, onClick }) {
  const isLeft = dir === "left";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-60%)",
        [isLeft ? "left" : "right"]: -16,
        zIndex: 10,
        width: 30,
        height: 30,
        borderRadius: "50%",
        border: "1px solid #333",
        background: "rgba(20,20,20,0.92)",
        color: "#aaa",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        backdropFilter: "blur(8px)",
        transition: "background 150ms, color 150ms",
      }}
      aria-label={isLeft ? "Scroll left" : "Scroll right"}
    >
      {isLeft ? "‹" : "›"}
    </button>
  );
}
