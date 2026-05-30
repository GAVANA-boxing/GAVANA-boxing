"use client";

// Cinematic SVG diagram placeholders for boxing techniques and fighter pages.
// Shown when no real imageUrl / gifUrl / videoUrl exists.

function FootworkDiagram({ accent, w, h }) {
  return (
    <svg viewBox="0 0 120 76" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="120" height="76" fill="#050506" />
      {/* Grid */}
      {[24,48,72,96].map((x) => (
        <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={76} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {[19,38,57].map((y) => (
        <line key={`gy${y}`} x1={0} y1={y} x2={120} y2={y} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {/* Foot outlines — left */}
      <ellipse cx="36" cy="52" rx="11" ry="6.5" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.85" />
      <ellipse cx="36" cy="40" rx="7.5" ry="5" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.85" />
      <line x1="36" y1="45" x2="36" y2="46" stroke={accent} strokeWidth="0.8" opacity="0.5" />
      {/* Foot outlines — right */}
      <ellipse cx="84" cy="52" rx="11" ry="6.5" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.85" />
      <ellipse cx="84" cy="40" rx="7.5" ry="5" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.85" />
      <line x1="84" y1="45" x2="84" y2="46" stroke={accent} strokeWidth="0.8" opacity="0.5" />
      {/* Movement arrows */}
      <path d="M50 57 L70 57" stroke={accent} strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
      <path d="M67 54 L71 57 L67 60" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" fill="none" />
      {/* Stance labels */}
      <text x="36" y="70" textAnchor="middle" fill={accent} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.55">L</text>
      <text x="84" y="70" textAnchor="middle" fill={accent} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.55">R</text>
      {/* Center axis */}
      <line x1="60" y1="18" x2="60" y2="63" stroke={accent} strokeWidth="0.5" strokeDasharray="3,3" opacity="0.25" />
    </svg>
  );
}

function StanceDiagram({ accent, w, h }) {
  return (
    <svg viewBox="0 0 120 76" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="120" height="76" fill="#050506" />
      {/* Grid */}
      {[24,48,72,96].map((x) => (
        <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={76} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {/* Balance bar */}
      <rect x="20" y="32" width="80" height="3" rx="1.5" fill={accent} opacity="0.18" />
      {/* Left weight indicator */}
      <rect x="28" y="20" width="22" height="12" rx="3" fill={accent} opacity="0.25" />
      <text x="39" y="30" textAnchor="middle" fill={accent} fontSize="7.5" fontFamily="monospace" fontWeight="bold" opacity="0.9">55%</text>
      {/* Right weight indicator */}
      <rect x="70" y="24" width="22" height="8" rx="3" fill={accent} opacity="0.15" />
      <text x="81" y="31" textAnchor="middle" fill={accent} fontSize="7.5" fontFamily="monospace" fontWeight="bold" opacity="0.6">45%</text>
      {/* Pivot point */}
      <circle cx="60" cy="33" r="4" fill={accent} opacity="0.7" />
      <circle cx="60" cy="33" r="7" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.35" />
      {/* Leg lines */}
      <line x1="39" y1="32" x2="39" y2="58" stroke={accent} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <line x1="81" y1="32" x2="81" y2="58" stroke={accent} strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
      {/* Feet */}
      <rect x="30" y="56" width="18" height="6" rx="3" fill={accent} opacity="0.5" />
      <rect x="72" y="56" width="18" height="6" rx="3" fill={accent} opacity="0.35" />
      {/* Label */}
      <text x="60" y="73" textAnchor="middle" fill={accent} fontSize="5.5" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1">WEIGHT</text>
    </svg>
  );
}

function AngleDiagram({ accent, w, h }) {
  return (
    <svg viewBox="0 0 120 76" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="120" height="76" fill="#050506" />
      {/* Grid */}
      {[24,48,72,96].map((x) => (
        <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={76} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {[19,38,57].map((y) => (
        <line key={`gy${y}`} x1={0} y1={y} x2={120} y2={y} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {/* Compass circle */}
      <circle cx="60" cy="40" r="22" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.25" />
      <circle cx="60" cy="40" r="3" fill={accent} opacity="0.7" />
      {/* Main angle lines */}
      <line x1="60" y1="40" x2="60" y2="18" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="60" y1="40" x2="84" y2="52" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      {/* Angle arc */}
      <path d="M60 26 A14 14 0 0 1 71 47" fill="none" stroke={accent} strokeWidth="1" opacity="0.55" />
      {/* Direction arrow */}
      <path d="M56 17 L60 13 L64 17" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
      {/* Target dot */}
      <circle cx="84" cy="52" r="3.5" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.7" />
      <circle cx="84" cy="52" r="1.2" fill={accent} opacity="0.7" />
      {/* Label */}
      <text x="60" y="73" textAnchor="middle" fill={accent} fontSize="5.5" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1">ANGLE</text>
    </svg>
  );
}

function GuardDiagram({ accent, w, h }) {
  return (
    <svg viewBox="0 0 120 76" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="120" height="76" fill="#050506" />
      {/* Grid */}
      {[24,48,72,96].map((x) => (
        <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={76} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {/* Shield outline */}
      <path d="M60 14 L84 24 L84 46 Q84 60 60 68 Q36 60 36 46 L36 24 Z" fill={accent} opacity="0.08" stroke={accent} strokeWidth="1" opacity2="0.35" />
      <path d="M60 14 L84 24 L84 46 Q84 60 60 68 Q36 60 36 46 L36 24 Z" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.4" />
      {/* Left glove */}
      <ellipse cx="44" cy="34" rx="8" ry="6" fill={accent} opacity="0.3" />
      <ellipse cx="44" cy="34" rx="8" ry="6" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.8" />
      {/* Right glove */}
      <ellipse cx="76" cy="34" rx="8" ry="6" fill={accent} opacity="0.2" />
      <ellipse cx="76" cy="34" rx="8" ry="6" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.65" />
      {/* Center axis */}
      <line x1="60" y1="18" x2="60" y2="60" stroke={accent} strokeWidth="0.5" strokeDasharray="2,3" opacity="0.3" />
      {/* Chin indicator */}
      <circle cx="60" cy="24" r="2.5" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.45" />
      {/* Label */}
      <text x="60" y="73" textAnchor="middle" fill={accent} fontSize="5.5" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1">GUARD</text>
    </svg>
  );
}

function RingDiagram({ accent, w, h }) {
  return (
    <svg viewBox="0 0 120 76" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="120" height="76" fill="#050506" />
      {/* Canvas floor */}
      <rect x="14" y="14" width="92" height="48" rx="2" fill={accent} opacity="0.04" />
      <rect x="14" y="14" width="92" height="48" rx="2" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.35" />
      {/* Ropes */}
      {[20, 30, 40].map((y, i) => (
        <line key={y} x1="14" y1={y} x2="106" y2={y} stroke={accent} strokeWidth={i === 1 ? "1.2" : "0.8"} opacity={i === 1 ? 0.5 : 0.3} />
      ))}
      {/* Corner posts */}
      {[[14,14],[106,14],[14,62],[106,62]].map(([cx, cy], i) => (
        <rect key={i} x={cx - 3} y={cy - 3} width="6" height="6" rx="1" fill={accent} opacity="0.6" />
      ))}
      {/* Center cross */}
      <circle cx="60" cy="38" r="8" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.3" />
      <line x1="52" y1="38" x2="68" y2="38" stroke={accent} strokeWidth="0.8" opacity="0.3" />
      <line x1="60" y1="30" x2="60" y2="46" stroke={accent} strokeWidth="0.8" opacity="0.3" />
      {/* Fighter dots */}
      <circle cx="48" cy="42" r="3" fill={accent} opacity="0.8" />
      <circle cx="72" cy="34" r="3" fill={accent} opacity="0.45" />
      {/* Label */}
      <text x="60" y="73" textAnchor="middle" fill={accent} fontSize="5.5" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1">RING</text>
    </svg>
  );
}

function AnimalPlaceholder({ animalEmoji, animal, accent, w, h }) {
  return (
    <div style={{
      width: w, height: h,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: `radial-gradient(ellipse at 50% 40%, ${accent}18 0%, #050506 70%)`,
    }}>
      <span style={{ fontSize: Math.round(h * 0.42), lineHeight: 1, filter: `drop-shadow(0 0 12px ${accent}66)` }}>
        {animalEmoji}
      </span>
      <span style={{ fontSize: Math.round(h * 0.095), fontWeight: 900, color: accent, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.65, marginTop: 4, fontFamily: "monospace" }}>
        {animal}
      </span>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function DiagramPlaceholder({
  type = "footwork",
  accent = "#F5C451",
  width = 120,
  height = 76,
  label = null,
  animalEmoji = "🥊",
  animal = "Fighter",
}) {
  const props = { accent, w: width, h: height };

  let diagram;
  switch (type) {
    case "footwork": diagram = <FootworkDiagram {...props} />; break;
    case "stance":   diagram = <StanceDiagram   {...props} />; break;
    case "angle":    diagram = <AngleDiagram    {...props} />; break;
    case "guard":    diagram = <GuardDiagram    {...props} />; break;
    case "animal":   diagram = <AnimalPlaceholder animalEmoji={animalEmoji} animal={animal} {...props} />; break;
    default:         diagram = <RingDiagram     {...props} />;
  }

  if (!label) return diagram;

  return (
    <div style={{ position: "relative", width, height, display: "inline-block" }}>
      {diagram}
      <div style={{
        position: "absolute", bottom: 6, left: 6, right: 6,
        fontSize: 7, fontWeight: 900, letterSpacing: 1.2,
        color: accent, textTransform: "uppercase", fontFamily: "monospace",
        opacity: 0.7,
      }}>
        {label}
      </div>
    </div>
  );
}
