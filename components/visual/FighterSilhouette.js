"use client";

// Abstract boxer stance silhouettes — one per featured fighter.
// Pure SVG geometry, no external assets. viewBox="0 0 80 120".

function TysonSilhouette({ accent, w, h }) {
  return (
    <svg viewBox="0 0 80 120" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="80" height="120" fill="#050506" />
      <rect width="80" height="120" fill={accent} opacity="0.06" />
      {/* Head — low and tucked */}
      <circle cx="40" cy="24" r="9" fill={accent} opacity="0.14" />
      <circle cx="40" cy="24" r="9" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.7" />
      {/* Neck */}
      <line x1="40" y1="33" x2="40" y2="40" stroke={accent} strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
      {/* Shoulders wide & hunched */}
      <line x1="18" y1="42" x2="62" y2="42" stroke={accent} strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
      {/* L arm: elbow flared, fist at eye level (peekaboo) */}
      <path d="M18 42 L12 28 L28 18" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85" />
      <ellipse cx="28" cy="15" rx="5.5" ry="4" fill={accent} opacity="0.75" />
      {/* R arm: mirror peekaboo */}
      <path d="M62 42 L68 28 L52 18" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
      <ellipse cx="52" cy="15" rx="5.5" ry="4" fill={accent} opacity="0.6" />
      {/* Torso compact */}
      <line x1="40" y1="42" x2="40" y2="65" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      {/* Hips */}
      <line x1="26" y1="65" x2="54" y2="65" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* L leg bent wide */}
      <path d="M26 65 L18 85 L14 104" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.6" />
      {/* R leg bent wide */}
      <path d="M54 65 L62 85 L66 104" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5" />
      {/* Feet */}
      <ellipse cx="13" cy="106" rx="7" ry="3" fill={accent} opacity="0.38" />
      <ellipse cx="67" cy="106" rx="7" ry="3" fill={accent} opacity="0.28" />
      {/* Style label */}
      <text x="40" y="116" textAnchor="middle" fill={accent} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1.5">PEEKABOO</text>
    </svg>
  );
}

function BivolSilhouette({ accent, w, h }) {
  return (
    <svg viewBox="0 0 80 120" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="80" height="120" fill="#050506" />
      <rect width="80" height="120" fill={accent} opacity="0.05" />
      {/* Head upright */}
      <circle cx="36" cy="16" r="9" fill={accent} opacity="0.14" />
      <circle cx="36" cy="16" r="9" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.7" />
      {/* Neck */}
      <line x1="36" y1="25" x2="36" y2="32" stroke={accent} strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
      {/* Shoulders */}
      <line x1="20" y1="34" x2="52" y2="34" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.65" />
      {/* L arm — jab fully extended */}
      <path d="M20 34 L70 30" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      <ellipse cx="73" cy="30" rx="5" ry="4" fill={accent} opacity="0.8" />
      {/* Arrowhead on jab */}
      <path d="M66 26 L71 30 L66 34" stroke={accent} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
      {/* R arm guard at chin */}
      <path d="M52 34 L46 26" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <circle cx="44" cy="24" r="4.5" fill={accent} opacity="0.55" />
      {/* Torso tall */}
      <line x1="36" y1="34" x2="36" y2="70" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      {/* Hips */}
      <line x1="26" y1="70" x2="46" y2="70" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* L leg */}
      <path d="M26 70 L24 90 L22 108" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.6" />
      {/* R leg */}
      <path d="M46 70 L48 90 L50 108" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5" />
      {/* Feet */}
      <ellipse cx="21" cy="110" rx="6" ry="3" fill={accent} opacity="0.38" />
      <ellipse cx="51" cy="110" rx="6" ry="3" fill={accent} opacity="0.28" />
      {/* Style label */}
      <text x="40" y="118" textAnchor="middle" fill={accent} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1.5">RANGE JAB</text>
    </svg>
  );
}

function InoueSilhouette({ accent, w, h }) {
  return (
    <svg viewBox="0 0 80 120" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="80" height="120" fill="#050506" />
      <rect width="80" height="120" fill={accent} opacity="0.06" />
      {/* Head angled forward */}
      <circle cx="42" cy="22" r="9" fill={accent} opacity="0.14" />
      <circle cx="42" cy="22" r="9" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.7" />
      {/* Neck angled */}
      <line x1="42" y1="31" x2="40" y2="38" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Shoulders forward lean */}
      <line x1="22" y1="40" x2="58" y2="38" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {/* L arm tight guard, high */}
      <path d="M22 40 L16 26 L30 18" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85" />
      <ellipse cx="30" cy="15" rx="5" ry="4" fill={accent} opacity="0.8" />
      {/* R arm tight guard */}
      <path d="M58 38 L64 24 L50 16" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
      <ellipse cx="50" cy="13" rx="5" ry="4" fill={accent} opacity="0.65" />
      {/* Body→head combo path (dashed arrow) */}
      <path d="M32 52 Q26 44 22 34" stroke={accent} strokeWidth="0.9" strokeDasharray="2,2" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M20 31 L22 35 L26 33" stroke={accent} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.4" />
      {/* Torso forward lean */}
      <line x1="40" y1="38" x2="38" y2="66" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      {/* Hips */}
      <line x1="28" y1="66" x2="50" y2="66" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Weight forward — front leg heavy */}
      <path d="M28 66 L24 86 L22 104" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
      <path d="M50 66 L56 86 L60 104" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45" />
      {/* Feet */}
      <ellipse cx="21" cy="106" rx="6" ry="3" fill={accent} opacity="0.5" />
      <ellipse cx="61" cy="106" rx="6" ry="3" fill={accent} opacity="0.28" />
      {/* Style label */}
      <text x="40" y="116" textAnchor="middle" fill={accent} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1.5">PRESSURE</text>
    </svg>
  );
}

function LomachenkoSilhouette({ accent, w, h }) {
  return (
    <svg viewBox="0 0 80 120" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="80" height="120" fill="#050506" />
      <rect width="80" height="120" fill={accent} opacity="0.05" />
      {/* Head */}
      <circle cx="40" cy="18" r="9" fill={accent} opacity="0.14" />
      <circle cx="40" cy="18" r="9" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.7" />
      {/* Neck */}
      <line x1="40" y1="27" x2="40" y2="34" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Shoulders very wide */}
      <line x1="14" y1="36" x2="66" y2="36" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.65" />
      {/* L arm guard */}
      <path d="M14 36 L8 22 L24 16" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
      <ellipse cx="24" cy="13" rx="5" ry="4" fill={accent} opacity="0.7" />
      {/* R arm guard */}
      <path d="M66 36 L72 22 L56 16" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.65" />
      <ellipse cx="56" cy="13" rx="5" ry="4" fill={accent} opacity="0.55" />
      {/* Torso */}
      <line x1="40" y1="36" x2="40" y2="64" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      {/* Hips */}
      <line x1="20" y1="64" x2="60" y2="64" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Wide lateral legs */}
      <path d="M20 64 L10 84 L6 102" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.65" />
      <path d="M60 64 L70 84 L74 102" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
      {/* Feet */}
      <ellipse cx="5" cy="104" rx="7" ry="3" fill={accent} opacity="0.42" />
      <ellipse cx="75" cy="104" rx="7" ry="3" fill={accent} opacity="0.32" />
      {/* Angle exit arrows from center */}
      <path d="M40 64 L14 44" stroke={accent} strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
      <path d="M11 47 L14 43 L18 46" stroke={accent} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5" />
      <path d="M40 64 L66 44" stroke={accent} strokeWidth="1.3" strokeLinecap="round" opacity="0.4" />
      <path d="M69 47 L66 43 L62 46" stroke={accent} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.4" />
      {/* Pivot circle */}
      <circle cx="40" cy="64" r="4" fill="none" stroke={accent} strokeWidth="0.8" strokeDasharray="2,2" opacity="0.35" />
      {/* Style label */}
      <text x="40" y="114" textAnchor="middle" fill={accent} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1.5">ANGLES</text>
    </svg>
  );
}

function MayweatherSilhouette({ accent, w, h }) {
  return (
    <svg viewBox="0 0 80 120" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="80" height="120" fill="#050506" />
      <rect width="80" height="120" fill={accent} opacity="0.05" />
      {/* Head upright, slightly back */}
      <circle cx="38" cy="18" r="9" fill={accent} opacity="0.14" />
      <circle cx="38" cy="18" r="9" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.7" />
      {/* Neck */}
      <line x1="38" y1="27" x2="38" y2="34" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Shoulders raised/hunched */}
      <line x1="20" y1="34" x2="56" y2="34" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
      {/* Shell guard — L forearm covering face */}
      <path d="M20 34 L28 20" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      <ellipse cx="28" cy="17" rx="5" ry="4" fill={accent} opacity="0.75" />
      {/* Shell guard — R forearm */}
      <path d="M56 34 L48 20" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <ellipse cx="48" cy="17" rx="5" ry="4" fill={accent} opacity="0.65" />
      {/* Shell coverage arc */}
      <path d="M24 22 Q38 12 52 22" fill="none" stroke={accent} strokeWidth="0.6" opacity="0.25" />
      {/* Shoulder roll arc (R shoulder) */}
      <path d="M56 34 Q66 27 62 20" fill="none" stroke={accent} strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
      <path d="M65 22 L62 20 L62 25" stroke={accent} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.4" />
      {/* Torso upright */}
      <line x1="38" y1="34" x2="38" y2="68" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      {/* Hips */}
      <line x1="26" y1="68" x2="50" y2="68" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Weight back — rear leg heavier */}
      <path d="M26 68 L24 88 L22 106" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.48" />
      <path d="M50 68 L54 88 L56 106" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.65" />
      {/* Feet */}
      <ellipse cx="21" cy="108" rx="6" ry="3" fill={accent} opacity="0.32" />
      <ellipse cx="57" cy="108" rx="6" ry="3" fill={accent} opacity="0.44" />
      {/* Style label */}
      <text x="40" y="118" textAnchor="middle" fill={accent} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.45" letterSpacing="1.5">SHELL</text>
    </svg>
  );
}

function GenericFighterSilhouette({ accent, w, h }) {
  return (
    <svg viewBox="0 0 80 120" width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <rect width="80" height="120" fill="#050506" />
      <rect width="80" height="120" fill={accent} opacity="0.05" />
      <circle cx="40" cy="18" r="9" fill={accent} opacity="0.14" />
      <circle cx="40" cy="18" r="9" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.65" />
      <line x1="40" y1="27" x2="40" y2="34" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="22" y1="36" x2="58" y2="36" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M22 36 L16 22 L30 16" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.75" />
      <ellipse cx="30" cy="13" rx="5" ry="4" fill={accent} opacity="0.65" />
      <path d="M58 36 L64 22 L50 16" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.6" />
      <ellipse cx="50" cy="13" rx="5" ry="4" fill={accent} opacity="0.55" />
      <line x1="40" y1="36" x2="40" y2="67" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="28" y1="67" x2="52" y2="67" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.48" />
      <path d="M28 67 L24 88 L22 106" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.58" />
      <path d="M52 67 L56 88 L58 106" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.48" />
      <ellipse cx="21" cy="108" rx="6" ry="3" fill={accent} opacity="0.35" />
      <ellipse cx="59" cy="108" rx="6" ry="3" fill={accent} opacity="0.28" />
      <text x="40" y="118" textAnchor="middle" fill={accent} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.4" letterSpacing="1.5">FIGHTER</text>
    </svg>
  );
}

const FIGHTER_COMPONENT = {
  "mike-tyson": TysonSilhouette,
  "dmitry-bivol": BivolSilhouette,
  "naoya-inoue": InoueSilhouette,
  "vasyl-lomachenko": LomachenkoSilhouette,
  "floyd-mayweather": MayweatherSilhouette,
};

export default function FighterSilhouette({ fighterId, accent = "#F5C451", width = 80, height = 120 }) {
  const Component = FIGHTER_COMPONENT[fighterId] || GenericFighterSilhouette;
  return <Component accent={accent} w={width} h={height} />;
}
