"use client";

if (typeof window !== "undefined") {
  if (!document.getElementById("rank-icon-kf")) {
    const s = document.createElement("style");
    s.id = "rank-icon-kf";
    s.textContent = `
      @keyframes rankPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.14); }
      }
      @keyframes rankFlame {
        0%, 100% { transform: scale(1) rotate(-2deg); }
        40% { transform: scale(1.11) rotate(2.5deg); }
        70% { transform: scale(1.05) rotate(-1deg); }
      }
    `;
    document.head.appendChild(s);
  }
}

function IconShape({ icon, color, size }) {
  switch (icon) {
    case "circle":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill={color} />
        </svg>
      );
    case "shield":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3L20 7V14C20 18.2 16.4 21.5 12 22C7.6 21.5 4 18.2 4 14V7L12 3Z" fill={color} />
        </svg>
      );
    case "hexagon":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="12,3 20.6,7.5 20.6,16.5 12,21 3.4,16.5 3.4,7.5" fill={color} />
        </svg>
      );
    case "star5":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3" fill={color} />
        </svg>
      );
    case "star6":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="12,2 14.4,7.84 20.66,7 16.8,12 20.66,17 14.4,16.16 12,22 9.6,16.16 3.34,17 7.2,12 3.34,7 9.6,7.84" fill={color} />
        </svg>
      );
    case "diamond":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="12,2 22,12 12,22 2,12" fill={color} />
        </svg>
      );
    case "starburst":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="12,2 13.53,8.3 19.07,4.93 15.7,10.47 22,12 15.7,13.53 19.07,19.07 13.53,15.7 12,22 10.47,15.7 4.93,19.07 8.3,13.53 2,12 8.3,10.47 4.93,4.93 10.47,8.3" fill={color} />
        </svg>
      );
    case "crown":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 19H20V17L16 10L12 14L8 10L4 17V19Z" fill={color} />
          <rect x="4" y="20" width="16" height="2" rx="1" fill={color} />
        </svg>
      );
    case "flame":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 22C9.5 22 7 19.8 7 17C7 14 9 11.5 9.5 10C9.5 11.2 10.2 12.2 11 12.6C10.5 10.4 12 7.5 13.5 6C13.1 8.1 14.2 9.6 15 10.6C15.5 9.2 15.1 7.6 14.5 6.5C17 8.5 18 12 18 14.5C18 19.5 15 22 12 22Z" fill={color} />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill={color} />
        </svg>
      );
  }
}

export default function RankIcon({ rank, size = 32, animated = true, showLabel = false, label = "" }) {
  if (!rank) return null;

  const shouldAnimate = animated && rank.pulse;
  const isFlame = rank.icon === "flame";
  const glowPx = Math.max(3, Math.round(size * 0.22));
  const glowPx2 = Math.max(5, Math.round(size * 0.44));

  const wrapStyle = {
    display: "inline-block",
    lineHeight: 0,
    flexShrink: 0,
    ...(rank.glowColor
      ? { filter: `drop-shadow(0 0 ${glowPx}px ${rank.glowColor}) drop-shadow(0 0 ${glowPx2}px ${rank.glowColor.replace(/[\d.]+\)$/, "0.3)")})` }
      : {}),
    ...(shouldAnimate
      ? { animation: `${isFlame ? "rankFlame" : "rankPulse"} ${isFlame ? "1.7s" : "2.3s"} ease-in-out infinite` }
      : {}),
  };

  if (!showLabel) {
    return (
      <span style={wrapStyle}>
        <IconShape icon={rank.icon} color={rank.color} size={size} />
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <span style={wrapStyle}>
        <IconShape icon={rank.icon} color={rank.color} size={size} />
      </span>
      <span style={{
        fontSize: Math.max(9, Math.round(size * 0.28)),
        fontWeight: 900,
        color: rank.color,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}>
        {label || rank.key.replace("rank", "")}
      </span>
    </span>
  );
}
