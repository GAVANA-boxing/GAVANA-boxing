"use client";

const MAX_VISIBLE = 5;

function fmtTime(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function MovementTimeline({ events, sessionStartTime }) {
  if (!events || events.length === 0) return null;

  const visible = events.slice(-MAX_VISIBLE);

  return (
    <div style={{
      position: "absolute",
      bottom: 14,
      left: 12,
      zIndex: 5,
      pointerEvents: "none",
      display: "flex",
      flexDirection: "column-reverse",
      gap: 3,
      alignItems: "flex-start",
    }}>
      {visible.map((ev, i) => {
        const distFromNewest = visible.length - 1 - i;
        const opacity = Math.max(0.18, 0.75 - distFromNewest * 0.13);
        return (
          <div
            key={ev.id}
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 0.3,
              color: `rgba(255,255,255,${opacity})`,
              textShadow: "0 1px 4px rgba(0,0,0,0.95)",
              whiteSpace: "nowrap",
              fontFamily: "monospace",
              lineHeight: 1.4,
            }}
          >
            <span style={{ color: `rgba(245,196,81,${opacity * 0.9})` }}>
              [{fmtTime(ev.timestamp - sessionStartTime)}]
            </span>
            {" "}{ev.label}
          </div>
        );
      })}
    </div>
  );
}
