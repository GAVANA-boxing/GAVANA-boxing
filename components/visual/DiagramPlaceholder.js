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

function JabDiagram({ accent, w, h }) {
  return (
    <svg viewBox="0 0 120 76" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="120" height="76" fill="#050506" />
      {[24,48,72,96].map((x) => (
        <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={76} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {[19,38,57].map((y) => (
        <line key={`gy${y}`} x1={0} y1={y} x2={120} y2={y} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {/* Body top-down oval */}
      <ellipse cx="34" cy="44" rx="10" ry="13" fill={accent} opacity="0.08" stroke={accent} strokeWidth="0.8" />
      {/* Head */}
      <circle cx="34" cy="26" r="7" fill="none" stroke={accent} strokeWidth="0.9" opacity="0.45" />
      {/* Rear hand at chin */}
      <circle cx="41" cy="30" r="3.5" fill={accent} opacity="0.2" />
      <circle cx="41" cy="30" r="3.5" fill="none" stroke={accent} strokeWidth="0.7" opacity="0.5" />
      {/* Jab arm path */}
      <path d="M40 40 L92 35" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      {/* Arrowhead */}
      <path d="M88 31 L93 35 L88 39" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
      {/* Fist */}
      <circle cx="95" cy="35" r="4.5" fill={accent} opacity="0.75" />
      {/* Return path dashed */}
      <path d="M95 37 Q70 55 41 44" stroke={accent} strokeWidth="0.8" strokeDasharray="2.5,3" strokeLinecap="round" fill="none" opacity="0.28" />
      {/* SNAP label */}
      <text x="101" y="31" fill={accent} fontSize="5" fontFamily="monospace" fontWeight="bold" opacity="0.55">SNAP</text>
      {/* Label */}
      <text x="60" y="73" textAnchor="middle" fill={accent} fontSize="5.5" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1">JAB PATH</text>
    </svg>
  );
}

function CrossDiagram({ accent, w, h }) {
  return (
    <svg viewBox="0 0 120 76" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="120" height="76" fill="#050506" />
      {[24,48,72,96].map((x) => (
        <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={76} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {[19,38,57].map((y) => (
        <line key={`gy${y}`} x1={0} y1={y} x2={120} y2={y} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {/* Body */}
      <ellipse cx="34" cy="44" rx="10" ry="13" fill={accent} opacity="0.08" stroke={accent} strokeWidth="0.8" />
      {/* Head */}
      <circle cx="34" cy="26" r="7" fill="none" stroke={accent} strokeWidth="0.9" opacity="0.45" />
      {/* Hip rotation arc */}
      <path d="M24 50 A20 12 0 0 1 48 50" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.5" />
      <path d="M44 47 L48 50 L45 54" stroke={accent} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5" />
      {/* Lead hand guard */}
      <circle cx="30" cy="30" r="3.5" fill={accent} opacity="0.2" />
      <circle cx="30" cy="30" r="3.5" fill="none" stroke={accent} strokeWidth="0.7" opacity="0.5" />
      {/* Cross arm path */}
      <path d="M40 38 L94 36" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      {/* Arrowhead */}
      <path d="M90 32 L95 36 L90 40" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
      {/* Fist */}
      <circle cx="97" cy="36" r="4.5" fill={accent} opacity="0.75" />
      {/* HIP DRIVE label */}
      <text x="36" y="63" textAnchor="middle" fill={accent} fontSize="5" fontFamily="monospace" fontWeight="bold" opacity="0.5">HIP DRIVE</text>
      {/* Label */}
      <text x="60" y="73" textAnchor="middle" fill={accent} fontSize="5.5" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1">CROSS PATH</text>
    </svg>
  );
}

function HookDiagram({ accent, w, h }) {
  return (
    <svg viewBox="0 0 120 76" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="120" height="76" fill="#050506" />
      {[24,48,72,96].map((x) => (
        <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={76} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {[19,38,57].map((y) => (
        <line key={`gy${y}`} x1={0} y1={y} x2={120} y2={y} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {/* Body */}
      <ellipse cx="34" cy="46" rx="9" ry="12" fill={accent} opacity="0.08" stroke={accent} strokeWidth="0.8" />
      {/* Head */}
      <circle cx="34" cy="28" r="7" fill="none" stroke={accent} strokeWidth="0.9" opacity="0.45" />
      {/* Elbow level dashed line */}
      <line x1="12" y1="37" x2="108" y2="37" stroke={accent} strokeWidth="0.5" strokeDasharray="3,3" opacity="0.2" />
      <text x="110" y="39" fill={accent} fontSize="4.5" fontFamily="monospace" opacity="0.38">ELB</text>
      {/* Hook arc path */}
      <path d="M40 37 Q58 20 88 37" stroke={accent} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9" />
      {/* Arrowhead */}
      <path d="M84 33 L89 37 L84 41" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
      {/* Fist at target */}
      <circle cx="91" cy="37" r="4.5" fill={accent} opacity="0.75" />
      {/* Elbow circle */}
      <circle cx="40" cy="37" r="3.5" fill={accent} opacity="0.35" />
      <circle cx="40" cy="37" r="3.5" fill="none" stroke={accent} strokeWidth="0.9" opacity="0.7" />
      {/* Weight shift arrow */}
      <path d="M30 56 L38 56" stroke={accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.42" />
      <path d="M35 53 L38 56 L35 59" stroke={accent} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.42" />
      {/* Label */}
      <text x="60" y="73" textAnchor="middle" fill={accent} fontSize="5.5" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1">HOOK ARC</text>
    </svg>
  );
}

function GuardRecoveryDiagram({ accent, w, h }) {
  return (
    <svg viewBox="0 0 120 76" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="120" height="76" fill="#050506" />
      {[24,48,72,96].map((x) => (
        <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={76} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {/* Head */}
      <circle cx="60" cy="16" r="8" fill="none" stroke={accent} strokeWidth="0.9" opacity="0.5" />
      {/* Left glove extended below */}
      <ellipse cx="28" cy="55" rx="7" ry="5" fill={accent} opacity="0.22" stroke={accent} strokeWidth="1" />
      {/* Left return arrow */}
      <path d="M33 51 Q46 38 47 28" stroke={accent} strokeWidth="1.1" strokeDasharray="2,2" strokeLinecap="round" opacity="0.38" fill="none" />
      <path d="M43 25 L47 29 L42 30" stroke={accent} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.78" />
      {/* Right glove extended below */}
      <ellipse cx="92" cy="55" rx="7" ry="5" fill={accent} opacity="0.16" stroke={accent} strokeWidth="1" />
      {/* Right return arrow */}
      <path d="M87 51 Q74 38 73 28" stroke={accent} strokeWidth="1.1" strokeDasharray="2,2" strokeLinecap="round" opacity="0.38" fill="none" />
      <path d="M77 25 L73 29 L78 30" stroke={accent} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.78" />
      {/* Guard gloves in position */}
      <ellipse cx="48" cy="25" rx="6" ry="4.5" fill={accent} opacity="0.45" />
      <ellipse cx="72" cy="25" rx="6" ry="4.5" fill={accent} opacity="0.35" />
      {/* Timer chip */}
      <rect x="44" y="60" width="32" height="11" rx="5.5" fill={accent} opacity="0.1" stroke={accent} strokeWidth="0.6" />
      <text x="60" y="68" textAnchor="middle" fill={accent} fontSize="5.5" fontFamily="monospace" fontWeight="bold" opacity="0.7">{"< 0.3s"}</text>
      {/* Label */}
      <text x="60" y="73" textAnchor="middle" fill={accent} fontSize="5" fontFamily="monospace" fontWeight="bold" opacity="0.38" letterSpacing="1">GUARD RESET</text>
    </svg>
  );
}

function FootworkAngleDiagram({ accent, w, h }) {
  return (
    <svg viewBox="0 0 120 76" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="120" height="76" fill="#050506" />
      {[24,48,72,96].map((x) => (
        <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={76} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {[19,38,57].map((y) => (
        <line key={`gy${y}`} x1={0} y1={y} x2={120} y2={y} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {/* Starting foot positions */}
      <ellipse cx="52" cy="52" rx="10" ry="6" fill="none" stroke={accent} strokeWidth="1.1" opacity="0.7" />
      <ellipse cx="68" cy="60" rx="10" ry="6" fill="none" stroke={accent} strokeWidth="1.1" opacity="0.55" />
      {/* Pivot indicator at lead foot */}
      <circle cx="52" cy="52" r="3" fill={accent} opacity="0.6" />
      <circle cx="52" cy="52" r="7" fill="none" stroke={accent} strokeWidth="0.6" strokeDasharray="2,2" opacity="0.3" />
      {/* Angle exit left-forward */}
      <path d="M52 52 L20 24" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.78" />
      <path d="M17 27 L20 22 L25 25" stroke={accent} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.78" />
      {/* Angle exit right-forward */}
      <path d="M52 52 L84 24" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      <path d="M87 27 L84 22 L79 25" stroke={accent} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
      {/* Angle arc between paths */}
      <path d="M26 35 A30 30 0 0 1 78 35" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.28" />
      {/* 45° labels */}
      <text x="12" y="22" fill={accent} fontSize="5" fontFamily="monospace" fontWeight="bold" opacity="0.52">45°</text>
      <text x="86" y="22" fill={accent} fontSize="5" fontFamily="monospace" fontWeight="bold" opacity="0.52">45°</text>
      {/* Label */}
      <text x="60" y="73" textAnchor="middle" fill={accent} fontSize="5.5" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1">ANGLE EXIT</text>
    </svg>
  );
}

function SlipDiagram({ accent, w, h }) {
  return (
    <svg viewBox="0 0 120 76" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="120" height="76" fill="#050506" />
      {[24,48,72,96].map((x) => (
        <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={76} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {[19,38,57].map((y) => (
        <line key={`gy${y}`} x1={0} y1={y} x2={120} y2={y} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {/* Body */}
      <ellipse cx="34" cy="46" rx="10" ry="13" fill={accent} opacity="0.08" stroke={accent} strokeWidth="0.8" />
      {/* Center line (punch path) */}
      <line x1="100" y1="26" x2="12" y2="26" stroke={accent} strokeWidth="0.5" strokeDasharray="3,3" opacity="0.18" />
      {/* Ghost head — original on-line position */}
      <circle cx="34" cy="26" r="7" fill="none" stroke={accent} strokeWidth="0.8" strokeDasharray="2,2" opacity="0.28" />
      {/* Slipped head — moved off the punch line */}
      <circle cx="24" cy="20" r="7" fill={accent} opacity="0.12" />
      <circle cx="24" cy="20" r="7" fill="none" stroke={accent} strokeWidth="1.1" opacity="0.85" />
      {/* Guard hands staying up */}
      <circle cx="18" cy="16" r="3" fill={accent} opacity="0.28" />
      <circle cx="28" cy="13" r="2.5" fill={accent} opacity="0.22" />
      {/* Incoming punch from right — targeting ghost head */}
      <path d="M100 26 L43 26" stroke={accent} strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
      <path d="M46 22 L42 26 L46 30" stroke={accent} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.75" />
      {/* Punch going past (missed) */}
      <path d="M27 26 L10 26" stroke={accent} strokeWidth="0.8" strokeDasharray="2,2.5" opacity="0.22" />
      {/* Head movement arrow */}
      <path d="M32 24 L26 21" stroke={accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <path d="M22 18 L24 22 L28 19" stroke={accent} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
      {/* OFF LINE label */}
      <text x="68" y="21" fill={accent} fontSize="5" fontFamily="monospace" fontWeight="bold" opacity="0.5">OFF LINE</text>
      {/* Label */}
      <text x="60" y="73" textAnchor="middle" fill={accent} fontSize="5.5" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1">SLIP</text>
    </svg>
  );
}

function PullCounterDiagram({ accent, w, h }) {
  return (
    <svg viewBox="0 0 120 76" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="120" height="76" fill="#050506" />
      {[24,48,72,96].map((x) => (
        <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={76} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {[19,38,57].map((y) => (
        <line key={`gy${y}`} x1={0} y1={y} x2={120} y2={y} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {/* Fighter body — normal position (ghost = forward lean into pull) */}
      <ellipse cx="40" cy="46" rx="10" ry="12" fill="none" stroke={accent} strokeWidth="0.8" strokeDasharray="2,2" opacity="0.28" />
      <circle cx="40" cy="29" r="7" fill="none" stroke={accent} strokeWidth="0.8" strokeDasharray="2,2" opacity="0.28" />
      {/* Fighter body — pulled back position */}
      <ellipse cx="28" cy="46" rx="10" ry="12" fill={accent} opacity="0.08" stroke={accent} strokeWidth="0.9" />
      <circle cx="28" cy="30" r="7" fill={accent} opacity="0.1" />
      <circle cx="28" cy="30" r="7" fill="none" stroke={accent} strokeWidth="1.1" opacity="0.8" />
      {/* Incoming punch (from opponent, passing forward body ghost) */}
      <path d="M98 29 L48 29" stroke={accent} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      <path d="M51 25 L47 29 L51 33" stroke={accent} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.6" />
      {/* Punch passing through (missed — head pulled back) */}
      <path d="M36 29 L20 29" stroke={accent} strokeWidth="0.8" strokeDasharray="2,2" opacity="0.2" />
      {/* Pull arrow — backward weight shift */}
      <path d="M40 48 L28 48" stroke={accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      <path d="M31 44 L27 48 L31 52" stroke={accent} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
      {/* Counter punch arrow — forward */}
      <path d="M35 38 L86 34" stroke={accent} strokeWidth="1.8" strokeLinecap="round" opacity="0.88" />
      <path d="M82 30 L87 34 L82 38" stroke={accent} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.88" />
      {/* Counter fist */}
      <circle cx="89" cy="34" r="4" fill={accent} opacity="0.7" />
      {/* PULL label */}
      <text x="28" y="60" textAnchor="middle" fill={accent} fontSize="5" fontFamily="monospace" fontWeight="bold" opacity="0.48">PULL</text>
      {/* COUNTER label */}
      <text x="78" y="28" fill={accent} fontSize="5" fontFamily="monospace" fontWeight="bold" opacity="0.55">COUNTER</text>
      {/* Label */}
      <text x="60" y="73" textAnchor="middle" fill={accent} fontSize="5.5" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1">PULL COUNTER</text>
    </svg>
  );
}

function BodyShotDiagram({ accent, w, h }) {
  return (
    <svg viewBox="0 0 120 76" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="120" height="76" fill="#050506" />
      {[24,48,72,96].map((x) => (
        <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={76} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {[19,38,57].map((y) => (
        <line key={`gy${y}`} x1={0} y1={y} x2={120} y2={y} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {/* Fighter at normal height (ghost) */}
      <ellipse cx="30" cy="34" rx="9" ry="11" fill="none" stroke={accent} strokeWidth="0.8" strokeDasharray="2,2" opacity="0.25" />
      <circle cx="30" cy="18" r="6" fill="none" stroke={accent} strokeWidth="0.7" strokeDasharray="2,2" opacity="0.25" />
      {/* Fighter dropped to body level */}
      <ellipse cx="30" cy="48" rx="9" ry="11" fill={accent} opacity="0.08" stroke={accent} strokeWidth="0.9" />
      <circle cx="30" cy="34" r="6" fill={accent} opacity="0.1" />
      <circle cx="30" cy="34" r="6" fill="none" stroke={accent} strokeWidth="1" opacity="0.75" />
      {/* Level change arrow */}
      <path d="M16 22 L16 40" stroke={accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      <path d="M12 37 L16 41 L20 37" stroke={accent} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
      {/* KNEES label next to arrow */}
      <text x="6" y="32" fill={accent} fontSize="4.5" fontFamily="monospace" fontWeight="bold" opacity="0.45" style={{ writingMode: "vertical-rl" }}>KNEES</text>
      {/* Body shot punch arc */}
      <path d="M36 47 Q62 40 88 52" stroke={accent} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.88" />
      <path d="M84 48 L89 52 L84 56" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.88" />
      {/* Fist at target */}
      <circle cx="91" cy="52" r="4.5" fill={accent} opacity="0.7" />
      {/* Body target zone */}
      <ellipse cx="91" cy="52" rx="12" ry="8" fill="none" stroke={accent} strokeWidth="0.7" strokeDasharray="2,2" opacity="0.3" />
      {/* Target label */}
      <text x="91" y="66" textAnchor="middle" fill={accent} fontSize="5" fontFamily="monospace" fontWeight="bold" opacity="0.48">BODY</text>
      {/* Hip rotation arc */}
      <path d="M22 54 A14 8 0 0 1 40 54" fill="none" stroke={accent} strokeWidth="1" opacity="0.35" />
      <path d="M37 51 L40 54 L38 58" stroke={accent} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35" />
      {/* Label */}
      <text x="60" y="73" textAnchor="middle" fill={accent} fontSize="5.5" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1">BODY SHOT</text>
    </svg>
  );
}

function DoubleJabDiagram({ accent, w, h }) {
  return (
    <svg viewBox="0 0 120 76" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="120" height="76" fill="#050506" />
      {[24,48,72,96].map((x) => (
        <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={76} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {[19,38,57].map((y) => (
        <line key={`gy${y}`} x1={0} y1={y} x2={120} y2={y} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {/* Body top-down */}
      <ellipse cx="30" cy="44" rx="10" ry="13" fill={accent} opacity="0.08" stroke={accent} strokeWidth="0.8" />
      {/* Head */}
      <circle cx="30" cy="26" r="6.5" fill="none" stroke={accent} strokeWidth="0.9" opacity="0.45" />
      {/* Rear guard */}
      <circle cx="36" cy="30" r="3" fill={accent} opacity="0.22" />
      {/* First jab path */}
      <path d="M37 30 L86 28" stroke={accent} strokeWidth="1.7" strokeLinecap="round" opacity="0.7" />
      <path d="M82 24 L87 28 L82 32" stroke={accent} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
      {/* First fist */}
      <circle cx="89" cy="28" r="4" fill={accent} opacity="0.5" />
      {/* JAB 1 label */}
      <text x="89" y="22" textAnchor="middle" fill={accent} fontSize="5" fontFamily="monospace" fontWeight="bold" opacity="0.55">1</text>
      {/* Return path dashed */}
      <path d="M89 30 Q64 44 38 38" stroke={accent} strokeWidth="0.8" strokeDasharray="2,2.5" strokeLinecap="round" fill="none" opacity="0.22" />
      {/* Second jab path — slightly different angle */}
      <path d="M37 36 L86 40" stroke={accent} strokeWidth="1.9" strokeLinecap="round" opacity="0.9" />
      <path d="M82 36 L87 40 L82 44" stroke={accent} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
      {/* Second fist */}
      <circle cx="89" cy="40" r="4.5" fill={accent} opacity="0.72" />
      {/* JAB 2 label */}
      <text x="89" y="52" textAnchor="middle" fill={accent} fontSize="5" fontFamily="monospace" fontWeight="bold" opacity="0.65">2</text>
      {/* Timing break indicator */}
      <rect x="50" y="28" width="22" height="10" rx="4" fill={accent} opacity="0.06" stroke={accent} strokeWidth="0.5" />
      <text x="61" y="35" textAnchor="middle" fill={accent} fontSize="4.5" fontFamily="monospace" fontWeight="bold" opacity="0.45">VARY</text>
      {/* Label */}
      <text x="60" y="73" textAnchor="middle" fill={accent} fontSize="5.5" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1">DOUBLE JAB</text>
    </svg>
  );
}

function ShoulderRollDiagram({ accent, w, h }) {
  return (
    <svg viewBox="0 0 120 76" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="120" height="76" fill="#050506" />
      {[24,48,72,96].map((x) => (
        <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={76} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {[19,38,57].map((y) => (
        <line key={`gy${y}`} x1={0} y1={y} x2={120} y2={y} stroke={accent} strokeWidth="0.3" opacity="0.12" />
      ))}
      {/* Body */}
      <ellipse cx="36" cy="46" rx="10" ry="13" fill={accent} opacity="0.08" stroke={accent} strokeWidth="0.8" />
      {/* Head */}
      <circle cx="36" cy="28" r="7" fill="none" stroke={accent} strokeWidth="0.9" opacity="0.45" />
      {/* Raised front shoulder arc */}
      <path d="M28 32 Q36 24 44 28" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
      {/* Chin tucked behind shoulder — small filled circle */}
      <circle cx="36" cy="30" r="2.5" fill={accent} opacity="0.5" />
      {/* Incoming punch from right — straight line to shoulder */}
      <path d="M100 28 L50 28" stroke={accent} strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
      <path d="M53 24 L49 28 L53 32" stroke={accent} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
      {/* Deflection — punch bounces off shoulder at angle */}
      <path d="M44 28 Q48 18 58 14" stroke={accent} strokeWidth="1.4" strokeDasharray="2.5,2" strokeLinecap="round" fill="none" opacity="0.55" />
      <path d="M55 10 L59 14 L55 18" stroke={accent} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
      {/* DEFLECT label */}
      <text x="60" y="12" fill={accent} fontSize="5" fontFamily="monospace" fontWeight="bold" opacity="0.55">DEFLECT</text>
      {/* Counter punch arrow */}
      <path d="M42 38 L92 36" stroke={accent} strokeWidth="1.8" strokeLinecap="round" opacity="0.88" />
      <path d="M88 32 L93 36 L88 40" stroke={accent} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.88" />
      {/* Counter fist */}
      <circle cx="95" cy="36" r="4" fill={accent} opacity="0.7" />
      {/* COUNTER label */}
      <text x="95" y="48" textAnchor="middle" fill={accent} fontSize="5" fontFamily="monospace" fontWeight="bold" opacity="0.55">COUNTER</text>
      {/* Shell arm (loose) */}
      <path d="M30 34 L26 44" stroke={accent} strokeWidth="1.1" strokeLinecap="round" opacity="0.35" />
      {/* Label */}
      <text x="60" y="73" textAnchor="middle" fill={accent} fontSize="5.5" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1">SHOULDER ROLL</text>
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
    case "footwork":        diagram = <FootworkDiagram       {...props} />; break;
    case "stance":          diagram = <StanceDiagram         {...props} />; break;
    case "angle":           diagram = <AngleDiagram          {...props} />; break;
    case "guard":           diagram = <GuardDiagram          {...props} />; break;
    case "jab":             diagram = <JabDiagram            {...props} />; break;
    case "cross":           diagram = <CrossDiagram          {...props} />; break;
    case "hook":            diagram = <HookDiagram           {...props} />; break;
    case "guard-recovery":  diagram = <GuardRecoveryDiagram  {...props} />; break;
    case "footwork-angle":  diagram = <FootworkAngleDiagram  {...props} />; break;
    case "slip":            diagram = <SlipDiagram           {...props} />; break;
    case "pull-counter":    diagram = <PullCounterDiagram    {...props} />; break;
    case "body-shot":       diagram = <BodyShotDiagram       {...props} />; break;
    case "double-jab":      diagram = <DoubleJabDiagram      {...props} />; break;
    case "shoulder-roll":   diagram = <ShoulderRollDiagram   {...props} />; break;
    case "animal":          diagram = <AnimalPlaceholder animalEmoji={animalEmoji} animal={animal} {...props} />; break;
    default:                diagram = <RingDiagram           {...props} />;
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
