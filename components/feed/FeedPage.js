"use client";

import { useEffect, useRef, useState } from "react";
import ReelCard from "./ReelCard";
import FeedEmptyState from "./FeedEmptyState";

export default function FeedPage({ reels, locale, router }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const cardRefs     = useRef(new Map());
  const observerRef  = useRef(null);

  useEffect(() => {
    if (!reels.length || !containerRef.current) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = parseInt(entry.target.dataset.index, 10);
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        }
      },
      { threshold: 0.6, root: containerRef.current },
    );

    cardRefs.current.forEach((el) => observerRef.current.observe(el));

    return () => observerRef.current?.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reels.length]);

  if (!reels.length) {
    return <FeedEmptyState locale={locale} router={router} />;
  }

  return (
    <div
      ref={containerRef}
      className="no-scrollbar"
      style={{
        height:          "100dvh",
        overflowY:       "scroll",
        scrollSnapType:  "y mandatory",
        WebkitOverflowScrolling: "touch",
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
          ref={(el) => {
            if (el) {
              cardRefs.current.set(index, el);
              observerRef.current?.observe(el);
            } else {
              cardRefs.current.delete(index);
            }
          }}
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
