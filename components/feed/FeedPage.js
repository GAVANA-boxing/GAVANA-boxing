"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ReelCard from "./ReelCard";
import FeedEmptyState from "./FeedEmptyState";

export default function FeedPage({ reels, locale, router }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef  = useRef(null);
  const cardRefs      = useRef(new Map());
  const observerRef   = useRef(null);

  const registerCard = useCallback((index, el) => {
    if (el) {
      cardRefs.current.set(index, el);
    } else {
      cardRefs.current.delete(index);
    }
  }, []);

  useEffect(() => {
    if (!reels.length) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = parseInt(entry.target.dataset.index, 10);
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        }
      },
      { threshold: 0.6, root: containerRef.current }
    );

    cardRefs.current.forEach((el) => observerRef.current.observe(el));

    return () => observerRef.current?.disconnect();
  }, [reels.length]);

  // Observe newly registered cards after initial mount
  useEffect(() => {
    if (!observerRef.current) return;
    cardRefs.current.forEach((el) => {
      try { observerRef.current.observe(el); } catch {}
    });
  });

  if (!reels.length) {
    return <FeedEmptyState locale={locale} router={router} />;
  }

  return (
    <div
      ref={containerRef}
      style={{
        height:          "100dvh",
        overflowY:       "scroll",
        scrollSnapType:  "y mandatory",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth:  "none",
        msOverflowStyle: "none",
        display:         "flex",
        flexDirection:   "column",
        background:      "#000",
        position:        "relative",
      }}
    >
      {reels.map((reel, index) => (
        <div
          key={reel.id}
          data-index={index}
          ref={(el) => registerCard(index, el)}
        >
          <ReelCard
            reel={reel}
            isActive={activeIndex === index}
          />
        </div>
      ))}
    </div>
  );
}
