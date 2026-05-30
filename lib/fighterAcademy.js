// Fighter Academy profiles — structured educational content for deep study.
// Covers 5 fighters with: system overview, focus areas, signature habit,
// beginner drill, and a reference to the fighter's advanced FIGHTER_TECHNIQUES lesson.

export const FIGHTER_ACADEMY = {

  // ── Mike Tyson ─────────────────────────────────────────────────────────────
  "mike-tyson": {
    systemName: "Peekaboo Pressure System",
    systemEmoji: "💢",
    systemLabel: "PRESSURE SYSTEM",
    diagramType: "guard",
    accentColor: "#FF3B30",

    focusAreas: [
      {
        title: "Inside Range Entry",
        icon: "🎯",
        description:
          "Tyson's offense operated entirely from inside range. Study how he slipped outside the jab and entered simultaneously — the entry itself was the position he wanted, not just a step toward it. The slip and the punch setup were one movement.",
      },
      {
        title: "Hip-Loaded Hooks",
        icon: "⚡",
        description:
          "Every Tyson hook was pre-charged by loading the rear hip before the punch fired. The hook was half-done by body position — the arm just delivered what the hip had already stored. Watch how his hip moves before the arm does.",
      },
      {
        title: "Head Movement Between Combos",
        icon: "🌀",
        description:
          "Even between combinations, Tyson's head was always weaving slightly. No still position held for more than a moment. This made the start of each new combination unpredictable and meant opponents were never timing a stationary target.",
      },
    ],

    signatureHabit: {
      title: "Constant Head Movement",
      description:
        "Between every combination and during resets, Tyson maintained a subtle weave — never standing fully upright or stationary. This made him nearly impossible to time cleanly because there was never a fixed target to calibrate against.",
      cue: "After every combination, dip once before your guard resets. Never stand fully upright between sequences.",
    },

    beginnerDrill: {
      title: "Slip & Entry",
      description: "The foundation of the Peekaboo system — slip outside the jab, enter simultaneously.",
      steps: [
        "Partner throws slow jabs — you slip outside left (head moves left, rear hip loads)",
        "10 reps — no counter yet, just feel the slip and the new position it creates",
        "Add the entry step: slip + step inside, both happening simultaneously",
        "Feel the angle after the entry — you're slightly to their left side. That's the Tyson position.",
      ],
    },

    advancedLessonTitle: "Peekaboo Entry",
    advancedLessonNote: "Combines slip, entry step, and hook into one fluid motion.",
  },

  // ── Dmitry Bivol ──────────────────────────────────────────────────────────
  "dmitry-bivol": {
    systemName: "Soviet Technical Fundamentals",
    systemEmoji: "📐",
    systemLabel: "TECHNICAL SYSTEM",
    diagramType: "angle",
    accentColor: "#3B82F6",

    focusAreas: [
      {
        title: "Jab as a System",
        icon: "👊",
        description:
          "Bivol's jab isn't used primarily for power — it controls distance, disrupts rhythm, and gathers information. Study how he varies jab timing: rhythm jabs to establish a pattern, then a broken-timing jab to catch the guard in transition.",
      },
      {
        title: "Guard Recovery in Motion",
        icon: "🛡️",
        description:
          "After every combination, Bivol moves laterally before resetting. He never resets guard while stationary. The lateral step and guard recovery are one motion — the movement IS the reset. Study how clean his position is immediately after combination.",
      },
      {
        title: "Range Ownership",
        icon: "📏",
        description:
          "Bivol's footwork constantly maintains the exact distance where his jab reaches at full extension. When opponents close, he steps back. When they retreat, he steps in. He doesn't chase — he maintains the gap that makes his punches work.",
      },
    ],

    signatureHabit: {
      title: "Guard Resets After Every Single Punch",
      description:
        "Most fighters reset their guard between combinations. Bivol resets after every individual punch. Guard is fully formed before the next punch fires. This eliminates the exposure window most fighters carry between punches within a combination.",
      cue: "After every punch — not every combination — consciously feel your guard reform fully before anything else moves.",
    },

    beginnerDrill: {
      title: "Range Finder",
      description: "Identify your working distance and build automatic footwork to maintain it.",
      steps: [
        "Extend your jab fully — where your fist reaches at full extension is your working distance",
        "Partner actively tries to change the distance: stepping forward, stepping back",
        "Your only job: maintain that gap — step back when they close, step in when they retreat",
        "3 minutes continuous — if the gap changes, you lost the drill. No pausing.",
      ],
    },

    advancedLessonTitle: "Optimal Range Discipline",
    advancedLessonNote: "Trains footwork to maintain working distance automatically under pressure.",
  },

  // ── Naoya Inoue ──────────────────────────────────────────────────────────
  "naoya-inoue": {
    systemName: "Monster Body-Head System",
    systemEmoji: "🦅",
    systemLabel: "BODY-HEAD SYSTEM",
    diagramType: "angle",
    accentColor: "#F97316",

    focusAreas: [
      {
        title: "Level Switching",
        icon: "⬆️",
        description:
          "Inoue attacks two levels in every combination, and the second shot is always decided by reading the guard response to the first — not programmed in advance. Study how he watches the elbows: when they rise to protect the head, the body opens.",
      },
      {
        title: "Counter Right Hand",
        icon: "🎯",
        description:
          "Inoue draws jabs by presenting a slightly low guard, slips outside before contact, and fires the right hand through the center lane. The slip and counter happen simultaneously — there's no pause or sequential movement between them.",
      },
      {
        title: "Body Shot Accumulation",
        icon: "📊",
        description:
          "Body shots are investments. Each one forces the opponent's guard down by a fraction. By punch 5 or 6, the guard has drifted without a decision being made. Inoue thinks three combinations ahead when building his body work.",
      },
    ],

    signatureHabit: {
      title: "Two Levels in Every Combination",
      description:
        "Inoue never throws a combination that doesn't attack two levels. Even a simple jab-cross includes a body variation in the decision tree. His mind is simultaneously throwing the head shot and reading whether the body just opened.",
      cue: "Every combination you throw should include at least one level change — read the guard response, don't preset the switch.",
    },

    beginnerDrill: {
      title: "Head-to-Body Double Jab",
      description: "Train the fundamental head-body level switch from the simplest possible movement.",
      steps: [
        "Throw first jab to head level — pause, watch partner's guard",
        "Did their guard rise? If yes, the body just opened",
        "Second jab drops to body level — feel the height change",
        "Reduce the pause over sessions until head-to-body is one flowing reactive decision",
      ],
    },

    advancedLessonTitle: "High-Low Switch",
    advancedLessonNote: "Applies reactive level switching at full combination speed.",
  },

  // ── Vasyl Lomachenko ─────────────────────────────────────────────────────
  "vasyl-lomachenko": {
    systemName: "Matrix Footwork System",
    systemEmoji: "🌀",
    systemLabel: "MOVEMENT SYSTEM",
    diagramType: "footwork",
    accentColor: "#A855F7",

    focusAreas: [
      {
        title: "Foot Placement as Punch Permission",
        icon: "👣",
        description:
          "Lomachenko never punches from a neutral foot position. Every punch is preceded by a foot placement that creates the angle. Study how the lead foot lands outside, beside, or behind the opponent's lead foot — and how that position dictates which punches are available.",
      },
      {
        title: "Angle Changes Mid-Combination",
        icon: "🔄",
        description:
          "Lomachenko pivots mid-combination so each punch arrives from a different direction. One combination requires three guard adjustments simultaneously — impossible to do. Study how the pivot happens during the punch flow, not as a reset after it.",
      },
      {
        title: "Direction Change Feints",
        icon: "↔️",
        description:
          "Movement creates commitment. Lomachenko goes one direction until the opponent's weight loads in response, then reverses. The opponent's own reaction becomes the opening. Study how long he waits before reversing — the timing IS the skill.",
      },
    ],

    signatureHabit: {
      title: "Foot Placement Before Every Punch",
      description:
        "Lomachenko's rule: foot position before punch permission. He never throws from a neutral foot position. The foot is always placed to create an angle first. This makes every punch arrive unexpectedly, and makes it functionally impossible for the guard to cover all angles.",
      cue: "Before throwing any punch, check: where is your lead foot? Is it creating an angle, or are you punching from neutral? Neutral means predictable.",
    },

    beginnerDrill: {
      title: "Outside Foot Placement",
      description: "Train the single most important positioning element in Lomachenko's system.",
      steps: [
        "Partner stands in front — step your lead foot outside their lead foot",
        "20 reps of foot placement only — no punches yet, just feel the new position",
        "Notice: from outside their foot, their right cross angle is completely closed",
        "Add the left straight: outside foot placement, then left straight through the center lane",
      ],
    },

    advancedLessonTitle: "Outside Foot Entry",
    advancedLessonNote: "Explosive outside entry with immediate left straight down the center lane.",
  },

  // ── Floyd Mayweather ─────────────────────────────────────────────────────
  "floyd-mayweather": {
    systemName: "Philly Shell Defense",
    systemEmoji: "👻",
    systemLabel: "DEFENSE SYSTEM",
    diagramType: "guard",
    accentColor: "#94A3B8",

    focusAreas: [
      {
        title: "Shell Architecture",
        icon: "🛡️",
        description:
          "Right hand at jaw, left arm diagonal, rear shoulder forward — three defense layers from one relaxed position. Study how relaxed the position is held. Tension kills the shoulder roll reflex that makes the Shell work. Rigid = too slow.",
      },
      {
        title: "Counter Attached to Every Defense",
        icon: "↩️",
        description:
          "Mayweather never executes a defense without returning something. The shoulder deflects, the body is already in counter position — the left hand is at its shortest counter distance the moment the roll completes. Defense and counter are one motion.",
      },
      {
        title: "Catch and Redirect",
        icon: "✋",
        description:
          "The rear hand doesn't block the jab — it guides it offline to the outside. The guide and counter happen simultaneously. Study how the catch motion is an outward redirect, not a stopping motion straight back. Redirect, not block.",
      },
    ],

    signatureHabit: {
      title: "Counter Attached to Every Defense",
      description:
        "Mayweather trained himself never to execute a defense without immediately attaching a counter. Every roll produces a return shot. Every catch produces a simultaneous response. Defense and offense are never two separate events — always one continuous motion.",
      cue: "Every defensive movement has a counter attached. Roll and counter. Catch and counter. If you're doing defense-only, you're giving up free punches.",
    },

    beginnerDrill: {
      title: "Shell Hold",
      description: "Master the position before the motion. The structure must be automatic before the rolls can work.",
      steps: [
        "Stand in Philly Shell: right hand by jaw, left arm diagonal, rear shoulder slightly forward",
        "Hold the position for 60 seconds — feel what's covered and what's not",
        "Walk one full round in Shell — move without breaking the structure",
        "Partner lightly taps your shoulder area: roll with the shoulder surface, not with your arm",
      ],
    },

    advancedLessonTitle: "Philly Shell Position",
    advancedLessonNote: "Full mechanics of the Shell including active counter from every roll.",
  },
};

export function getFighterAcademy(fighterId) {
  return FIGHTER_ACADEMY[fighterId] || null;
}
