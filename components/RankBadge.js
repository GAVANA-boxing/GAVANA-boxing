"use client";

const ICONS = {
  circle: ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill={color + "22"} />
      <circle cx="12" cy="12" r="4" fill={color} />
    </svg>
  ),
  shield: ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6L12 2z"
        fill={color + "22"} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  star5: ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill={color + "33"} stroke={color} strokeWidth="1.6" strokeLinejoin="round"
      />
    </svg>
  ),
  diamond: ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L22 9 12 22 2 9Z"
        fill={color + "28"} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M2 9h20M8 9L12 2l4 7" stroke={color} strokeWidth="1.4" strokeLinejoin="round" opacity="0.6" />
    </svg>
  ),
  crown: ({ color, size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 17L5 8l4 4 3-6 3 6 4-4 2 9H3z"
        fill={color + "28"} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3 17h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="6" r="1.2" fill={color} />
    </svg>
  ),
};

export default function RankBadge({ rank, size = 24, glowEnabled = true }) {
  if (!rank) return null;

  const iconType = rank.icon || "circle";
  const IconComponent = ICONS[iconType] || ICONS.circle;
  const color = rank.color || "#9CA3AF";
  const glow = glowEnabled && rank.glowColor;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        filter: glow ? `drop-shadow(0 0 6px ${rank.glowColor})` : undefined,
        animation: rank.pulse ? "ambient-pulse 2s ease-in-out infinite" : undefined,
      }}
      aria-hidden="true"
    >
      <IconComponent color={color} size={size} />
    </span>
  );
}
