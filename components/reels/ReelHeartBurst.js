"use client";

const SPARKS = ["🔥", "✨", "🔥", "💥", "✨", "🔥"];

/**
 * ReelHeartBurst
 * Renders the double-tap heart + fire-spark burst animations.
 * `heartBursts` is an array of { id, x, y } objects managed by the parent.
 */
export default function ReelHeartBurst({ heartBursts }) {
  if (!heartBursts.length) return null;

  return (
    <>
      {heartBursts.map((b) => (
        <div
          key={b.id}
          style={{
            position: "absolute",
            left: b.x - 40,
            top: b.y - 40,
            zIndex: 60,
            pointerEvents: "none",
            width: 80,
            height: 80,
          }}
        >
          <span
            className="heart-burst"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 80,
              lineHeight: 1,
            }}
          >
            ❤️
          </span>
          {SPARKS.map((spark, i) => (
            <span
              key={i}
              className={`fire-spark fire-spark-${i}`}
              style={{ position: "absolute", left: "50%", top: "50%", fontSize: 18, lineHeight: 1 }}
            >
              {spark}
            </span>
          ))}
        </div>
      ))}
    </>
  );
}
