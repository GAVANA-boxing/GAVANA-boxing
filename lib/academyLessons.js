export const ACADEMY_LESSONS = [

  // ── Jab Mechanics ────────────────────────────────────────────────────────────
  {
    id: "jab-mechanics",
    emoji: "👊",
    title: "Jab Mechanics",
    subtitle: "Distance · Rhythm · Information",
    diagramType: "jab",
    difficulty: "beginner",
    accentColor: "#F5C451",
    relatedFighter: "dmitry-bivol",
    relatedFighterName: "Dmitry Bivol",
    relatedFighterAccent: "#3B82F6",
    animalEmoji: "🐺",
    animal: "Wolf",

    concept: "The jab is not a scoring punch — it is an intelligence tool. It measures distance, disrupts rhythm, and creates every combination that follows. Bivol uses his jab as a complete system: rhythm jabs establish predictability, then a broken-timing jab catches the guard mid-reset.",

    explanation: "The jab controls distance and sets up every combination. Most beginners throw it as an arm extension — Bivol throws it as a system with varying timing and intent.",

    bodyMechanics: [
      "Lead shoulder rotates forward before the fist extends — shoulder drives the punch, not the arm",
      "Fist snaps to full extension then retracts immediately — retraction begins before you consciously pull back",
      "Rear hand maintains contact with the jaw throughout — guard never breaks during the jab",
      "Weight remains neutral — no forward lean, which telegraphs the punch and sacrifices balance",
    ],

    whatYouShouldFeel: [
      "Your shoulder lifting and rotating before your fist moves — if you feel arm first, reset",
      "The fist snapping out and back like a rubber band — not a push and a return",
      "Rear knuckles lightly pressing your jaw the entire time",
      "Minimal weight shift — grounded, not committing forward",
    ],

    keyCues: [
      "Shoulder before fist — the shoulder drives, the arm delivers",
      "Snap and return — the hand comes back as fast as it went out",
      "Rear hand at jaw throughout — guard intact before, during, and after",
    ],

    commonMistake: "Dropping the rear hand during the jab. Most fighters focus entirely on the extending arm and forget their chin is exposed. The rear hand presses lightly against your jaw for the full duration of every jab.",

    drillProgression: [
      {
        level: "beginner",
        levelColor: "#10B981",
        title: "Mirror Jab",
        duration: "3 × 30 reps",
        steps: [
          "Stand within arm's reach of a mirror — you need to see shoulder and guard simultaneously",
          "Throw jabs at 50% speed. Stop after each one: did the shoulder rotate first? Is the rear hand at jaw?",
          "Fix what's wrong before adding speed — shape first, speed never",
          "When 10 consecutive reps look correct in the mirror, advance to the next drill",
        ],
      },
      {
        level: "intermediate",
        levelColor: "#F59E0B",
        title: "Retraction Race",
        duration: "4 × 20 reps",
        steps: [
          "Your goal: hand returns to jaw before you decide to throw again",
          "Partner calls 'go' — you throw jab, return, freeze. Partner checks guard position immediately",
          "If guard is below jaw on freeze, restart the full set from zero",
          "When 20 consecutive reps pass the freeze check, you've built the habit",
        ],
      },
      {
        level: "advanced",
        levelColor: "#F87171",
        title: "Broken Rhythm Jab",
        duration: "3 × 3 min rounds",
        steps: [
          "Throw 3-4 jabs at even, predictable rhythm — this is your bait, not a mistake",
          "Pause half a beat — then fire the next jab on unexpected timing",
          "The pause disrupts the opponent's guard reset. The jab catches the gap",
          "Vary which jab is the 'broken' one — never follow a predictable pattern within the pattern",
        ],
      },
    ],

    drill: {
      title: "Retraction Race",
      steps: [
        "Throw one jab — freeze on return",
        "Partner checks: hand back at jaw level?",
        "If not, restart the set from zero",
        "20 clean reps = habit formed",
      ],
    },

    fighterExample: {
      fighterId: "dmitry-bivol",
      name: "Dmitry Bivol",
      accent: "#3B82F6",
      observation: "In rounds 1-3 against any opponent, Bivol throws 4-5 jabs at even spacing — establishing rhythm. Then one jab arrives half a beat early. The opponent's guard was mid-reset. That is the broken-timing jab working exactly as designed.",
    },

    animalAnalogy: {
      animal: "Wolf",
      emoji: "🐺",
      description: "The wolf's paw-swipe tests the prey's reaction before committing to the attack. It gathers information without putting the wolf at risk. Throw the jab like a probe, not a commitment.",
    },

    coachTip: "Short, sharp, home. The jab asks — it doesn't answer.",
    coachCue: "Short, sharp, home. The jab asks — it doesn't answer.",

    scoringMetrics: [
      { metric: "Jab count", description: "AI counts arm extensions matching jab geometry — straight-line forward with quick retraction" },
      { metric: "Guard return speed", description: "Time between full jab extension and guard hand returning to jaw position" },
      { metric: "Stance stability", description: "Whether your base moves forward during the jab — good jabbing stays grounded" },
      { metric: "Snap rating", description: "Wrist velocity at full extension — snap vs. push classification" },
    ],
  },

  // ── Cross Mechanics ───────────────────────────────────────────────────────────
  {
    id: "cross-mechanics",
    emoji: "⚡",
    title: "Cross Mechanics",
    subtitle: "Rotation · Power Chain · Timing",
    diagramType: "cross",
    difficulty: "beginner",
    accentColor: "#F87171",
    relatedFighter: "naoya-inoue",
    relatedFighterName: "Naoya Inoue",
    relatedFighterAccent: "#F97316",
    animalEmoji: "🦅",
    animal: "Hawk",

    concept: "The cross is power generated from the floor — not from the arm. Inoue's right hand looks effortless because the work was done by his feet and hips before his arm moved. The arm is the last thing that fires. Everything before it is loading.",

    explanation: "The cross generates power through a chain starting at the floor. Beginners arm-punch — champions rotate. The difference is visible in the rear heel and hip position before the arm extends.",

    bodyMechanics: [
      "Rear heel rises off the floor as the hip begins rotating — this is where the power originates",
      "Hip rotates toward the target before the arm extends — hip movement precedes arm movement",
      "Weight transfers from rear foot to front foot simultaneously with the rotation",
      "Lead shoulder rises to protect the chin as the cross extends fully",
    ],

    whatYouShouldFeel: [
      "The floor pushing back against your rear foot as you begin the rotation",
      "Your hip turning first — arm following, not leading",
      "A locking sensation when the punch fully extends and rotation stops",
      "Lead shoulder touching your chin as the right hand reaches extension",
    ],

    keyCues: [
      "Heel, hip, fist — in that exact order",
      "The arm delivers what the hip loaded — not the other way",
      "Rotation stops at the target — lock in, don't follow through past contact",
    ],

    commonMistake: "Stepping forward into the cross. Beginners lean into the punch thinking it adds power — it actually removes the rotational base and telegraphs the punch. Stay grounded, rotate in place, let the hip do the work.",

    drillProgression: [
      {
        level: "beginner",
        levelColor: "#10B981",
        title: "Hip Tap Drill",
        duration: "3 × 20 reps",
        steps: [
          "Before each cross, tap your rear hip with your lead hand — forces hip awareness",
          "Tap the hip, then rotate, then extend the arm. Three separate steps until they merge",
          "You're teaching your nervous system that the hip comes first — always",
          "When tapping feels unnecessary because you already feel the hip — advance",
        ],
      },
      {
        level: "intermediate",
        levelColor: "#F59E0B",
        title: "Heel Watch",
        duration: "2 × 30 reps",
        steps: [
          "Throw the cross in front of a mirror. Watch your rear heel — does it rise off the floor?",
          "If the heel stays flat, you are arm-punching. The heel rising is the mechanical signature of proper cross power",
          "Throw at 60% intensity, focusing entirely on the heel-rise moment",
          "Speed is irrelevant until the heel-rise is automatic",
        ],
      },
      {
        level: "advanced",
        levelColor: "#F87171",
        title: "Jab-Cross Load Pause",
        duration: "3 × 2 min",
        steps: [
          "Throw the jab. Pause 1 full second. Load the rear hip consciously. Then throw the cross.",
          "The pause trains full loading before firing — rather than rushing the cross off the jab",
          "As the drill becomes natural, compress the pause — eventually it vanishes but the loading doesn't",
          "When the cross feels like it fires itself, the mechanical chain is automatic",
        ],
      },
    ],

    drill: {
      title: "Hip Tap Drill",
      steps: [
        "Tap rear hip before each cross — feel the hip-first order",
        "3 separate steps: tap → rotate → extend",
        "20 reps until tapping feels unnecessary",
        "Then add speed without losing the sequence",
      ],
    },

    fighterExample: {
      fighterId: "naoya-inoue",
      name: "Naoya Inoue",
      accent: "#F97316",
      observation: "Watch Inoue against Donaire II. Focus on his rear heel — it comes off the floor before his arm moves. His shoulder rotation is visible from ringside. The arm extends last. Pause on a cross frame and trace the sequence: heel → hip → shoulder → arm. Sequential every time.",
    },

    animalAnalogy: {
      animal: "Hawk",
      emoji: "🦅",
      description: "The hawk's wing generates velocity through the sky before the strike lands. Speed at impact comes from loading, not from trying to be fast. The strike is the endpoint of a chain that starts far from the point of contact.",
    },

    coachTip: "Heel, hip, fist — in that order. The floor is your power source.",
    coachCue: "Heel, hip, fist — in that order. The floor is your power source.",

    scoringMetrics: [
      { metric: "Cross detection", description: "AI identifies rear-arm straight extensions with rotational body signature" },
      { metric: "Hip rotation indicator", description: "Body rotation detected during punch — rotational vs. static classification" },
      { metric: "Extension completeness", description: "Whether arm reaches full extension before retraction begins" },
      { metric: "Guard maintenance", description: "Is the lead hand still at jaw level while the cross extends?" },
    ],
  },

  // ── Hook Mechanics ────────────────────────────────────────────────────────────
  {
    id: "hook-mechanics",
    emoji: "💥",
    title: "Hook Mechanics",
    subtitle: "Rotation · Hip Load · Short Range",
    diagramType: "hook",
    difficulty: "beginner",
    accentColor: "#F97316",
    relatedFighter: "mike-tyson",
    relatedFighterName: "Mike Tyson",
    relatedFighterAccent: "#FF3B30",
    animalEmoji: "🐂",
    animal: "Bull",

    concept: "The hook doesn't exist in the arm — it exists in the hip. Tyson's hooks were so fast because the arm was already half-loaded by body position before the punch started. By the time you see it, the hip has already fired.",

    explanation: "The hook is a rotational punch driven by the hips and core. Arm-only hooks are slow and weak. When hip rotation drives the arm, the hook arrives from a direction the opponent cannot track.",

    bodyMechanics: [
      "Lead elbow rises to shoulder height first — arm forms a 90-degree angle before the punch fires",
      "Hip rotation drives the arm through the arc — the arm does not move independently of the body",
      "Lead foot pivots on the ball of the foot as the hook fires — body weight transfers",
      "The hook stops at the target — rotation arrests at the point of contact, no follow-through past it",
    ],

    whatYouShouldFeel: [
      "The elbow lifting before anything else — if the arm extends first, it is an arm punch",
      "Your hip pulling the arm through — core tightening at the moment of contact",
      "The pivot happening automatically, not as a separate conscious movement",
      "A sharp stopping sensation at the end — not a sweeping follow-through",
    ],

    keyCues: [
      "Elbow up first — the angle is set before the rotation fires",
      "Hip pulls the arm — arm is a passenger on hip rotation",
      "Stop at the target — the hook punches through, not past",
    ],

    commonMistake: "Swinging the hook in a wide arc. Wide hooks sacrifice both speed and power — the longer the arc, the more time the opponent has to move. Keep the elbow at 90 degrees and let hip rotation do the work. Short and sharp beats wide and sweeping every time.",

    drillProgression: [
      {
        level: "beginner",
        levelColor: "#10B981",
        title: "Hip Hook",
        duration: "3 × 15 reps each side",
        steps: [
          "Arms completely loose at your sides — no guard, no tension",
          "Rotate your hips left and right aggressively. Let your arms follow from pure hip rotation",
          "Now add a 90-degree angle to the lead arm. Rotate hips and let the angled arm swing through",
          "This is the base hook — no independent arm movement, only hip-driven motion",
        ],
      },
      {
        level: "intermediate",
        levelColor: "#F59E0B",
        title: "Short Hook — Focus Mitt",
        duration: "4 × 30 reps",
        steps: [
          "Partner holds focus mitts at jaw height, 18 inches from your lead shoulder",
          "Throw short hooks focusing entirely on elbow position — 90-degree angle, elbow at shoulder height",
          "No power goal at this stage — mechanics only. Hip drives, arm follows",
          "Partner provides feedback on elbow height: too low means arm-punching, too high means telegraphing",
        ],
      },
      {
        level: "advanced",
        levelColor: "#F87171",
        title: "Body-Head Hook",
        duration: "3 × 2 min",
        steps: [
          "Throw hook to the body — watch the partner's elbow drop to protect",
          "Immediately throw hook to the head — the body shot created the opening",
          "Both hooks must come from hip rotation — no isolated arm punches",
          "The body hook is the investment; the head hook is the dividend",
        ],
      },
    ],

    drill: {
      title: "Short Hook — Focus Mitt",
      steps: [
        "Partner holds mitts at jaw height, 18 inches away",
        "Elbow at shoulder height — 90 degrees",
        "Hip drives, arm follows — no independent arm movement",
        "30 reps per side, mechanics before power",
      ],
    },

    fighterExample: {
      fighterId: "mike-tyson",
      name: "Mike Tyson",
      accent: "#FF3B30",
      observation: "Watch Tyson vs. Holmes, round 4 left hook. Freeze-frame before the punch arrives: his left elbow is already at shoulder height. His hips are already mid-rotation. The arm is following — not leading. The punch was loaded before it started. That is the Peekaboo hook.",
    },

    animalAnalogy: {
      animal: "Bull",
      emoji: "🐂",
      description: "The bull's horn sweep is a full-body rotational movement — the horns follow the body. The force comes from the body turning, not from the horns extending. The hook works the same way: body generates, arm delivers.",
    },

    coachTip: "Load the hip first. The fist is a passenger.",
    coachCue: "Load the hip first. The fist is a passenger on hip rotation.",

    scoringMetrics: [
      { metric: "Hook arc detection", description: "AI identifies lateral arm movement with rotational body signature" },
      { metric: "Elbow geometry", description: "Punch geometry classification — hook arc vs. straight punch" },
      { metric: "Body rotation", description: "Hip rotation score during punch — rotational vs. static" },
      { metric: "Guard height", description: "Is the rear hand maintained at jaw level during the hook?" },
    ],
  },

  // ── Guard Recovery ────────────────────────────────────────────────────────────
  {
    id: "guard-recovery",
    emoji: "🛡️",
    title: "Guard Recovery",
    subtitle: "Retraction · Protection · Discipline",
    diagramType: "guard-recovery",
    difficulty: "intermediate",
    accentColor: "#3B82F6",
    relatedFighter: "dmitry-bivol",
    relatedFighterName: "Dmitry Bivol",
    relatedFighterAccent: "#3B82F6",
    animalEmoji: "👻",
    animal: "Ghost",

    concept: "Most fighters think of guard as the space between punches. Bivol eliminated that concept entirely. For Bivol, every punch has a guard built into its return path. The exposure window that exists between punches in most fighters doesn't exist in his.",

    explanation: "Guard recovery is the discipline of returning every punch immediately to guard. Most fighters reset guard between combinations — Bivol resets after every individual punch. One habit eliminates an entire vulnerability.",

    bodyMechanics: [
      "Return path mirrors the launch path exactly — no loops, no shortcuts, same straight line back",
      "Return speed equals or exceeds punch speed — hand comes back as fast as it went out",
      "Both hands return to jaw level — not chest, not hip, not 'near' the jaw. Jaw.",
      "Guard is consciously checked between every punch, not just between combinations",
    ],

    whatYouShouldFeel: [
      "The punch retracting like a rubber band snapping back — not being consciously pulled",
      "Your jaw protected between every individual punch, not just between combinations",
      "A brief pause after each punch where your guard is fully formed before the next decision",
      "The conscious sensation of both hands at jaw level before anything else moves",
    ],

    keyCues: [
      "Return on the same path — no loop, no detour, straight back",
      "Hand at jaw before the next punch fires — not during, before",
      "Guard check after every punch, not every combination",
    ],

    commonMistake: "Dropping both hands while throwing a combination. In a 1-2, both the jab-arm retracting AND the cross-arm extending happen simultaneously — creating a moment where neither hand is at guard. Fix: jab returns before the cross fires. Feels slow at first. Becomes fast.",

    drillProgression: [
      {
        level: "beginner",
        levelColor: "#10B981",
        title: "Single Punch Return",
        duration: "3 × 30 reps",
        steps: [
          "Throw one jab. Freeze on the return — do not throw again",
          "Check your guard position. Is the extended hand back at jaw level?",
          "If not, consciously place it there. Hold for 2 seconds. Then throw again.",
          "Do not throw a second punch until the first hand is fully returned",
        ],
      },
      {
        level: "intermediate",
        levelColor: "#F59E0B",
        title: "1-2 Guard Freeze",
        duration: "4 × 20 combinations",
        steps: [
          "Throw jab-cross. After the cross, freeze immediately",
          "Partner checks: both hands at jaw level? If either is low, that set is void",
          "Restart from zero on any failure — this is a habit drill, not a rep counter",
          "20 consecutive combinations with both hands at jaw on freeze = session complete",
        ],
      },
      {
        level: "advanced",
        levelColor: "#F87171",
        title: "4-Punch Combination Guard",
        duration: "3 × 2 min",
        steps: [
          "Throw 1-2-3-2 at full speed. Guard must maintain throughout — no drops",
          "Partner watches specifically for the jab returning before the cross fires",
          "Any guard drop stops the drill and you restart the round from zero",
          "When 10 clean rounds pass without a restart — you have Bivol's habit",
        ],
      },
    ],

    drill: {
      title: "1-2 Guard Freeze",
      steps: [
        "Throw jab-cross — freeze on return",
        "Both hands at jaw? If not, restart the set",
        "20 consecutive combinations without failure",
        "Speed comes after the habit is locked",
      ],
    },

    fighterExample: {
      fighterId: "dmitry-bivol",
      name: "Dmitry Bivol",
      accent: "#3B82F6",
      observation: "Watch Bivol vs. Canelo in any round. After each individual punch — not combination — his hands return to guard. Count how many times you see his guard drop between punches. The answer approaches zero. When Canelo lands, it is because Bivol chose to take a shot — not because his guard failed.",
    },

    animalAnalogy: null,

    coachTip: "Punch. Return. Protect. In that exact order. Every single time.",
    coachCue: "Punch. Return. Protect. Every single punch — not every combination.",

    scoringMetrics: [
      { metric: "Guard recovery speed", description: "Time between punch extension and guard hand returning to jaw position" },
      { metric: "Guard height consistency", description: "AI tracks hand position between punches — low guard events counted" },
      { metric: "Exposure windows", description: "Frames where both hands are simultaneously away from guard position" },
      { metric: "Combination integrity", description: "Whether guard maintains throughout multi-punch sequences" },
    ],
  },

  // ── Footwork Angle Exit ───────────────────────────────────────────────────────
  {
    id: "footwork-angle-exit",
    emoji: "👣",
    title: "Footwork Angle Exit",
    subtitle: "Angles · Exit · Position",
    diagramType: "footwork-angle",
    difficulty: "intermediate",
    accentColor: "#A855F7",
    relatedFighter: "vasyl-lomachenko",
    relatedFighterName: "Vasyl Lomachenko",
    relatedFighterAccent: "#A855F7",
    animalEmoji: "🐍",
    animal: "Snake",

    concept: "For most beginners, footwork means 'moving around.' For Lomachenko, footwork is the primary offensive weapon. The angle his feet create determines what punches are available, where his opponent must turn, and what openings appear. The punch is secondary. The position is the weapon.",

    explanation: "The angle exit creates a new position after every combination. Your opponent must physically turn to face you. That turning moment is where their guard breaks. The footwork doesn't follow the combination — it is part of it.",

    bodyMechanics: [
      "Lead foot steps at 45 degrees to the outside — not back, not sideways, but diagonally forward-outside",
      "Rear foot follows at the same angle maintaining stance width — the whole stance shifts, not just one foot",
      "Weight stays centered during the step — no lean, no lunge, no instability",
      "The exit happens during or immediately after the combination — not as a separate sequence after a pause",
    ],

    whatYouShouldFeel: [
      "The ground shifting under your feet while your center stays level",
      "The 45-degree angle as a specific target position, not a vague directional intent",
      "Balance throughout — no moment of instability during or after the step",
      "The new angle revealing punching lanes that didn't exist before the step",
    ],

    keyCues: [
      "45 degrees to the outside — diagonal, not sideways or backward",
      "Both feet move — stance stays intact, position changes",
      "Exit is part of the combination — no pause before or after",
    ],

    commonMistake: "Stepping after the combination ends. Beginners think: punch → stop → move. Lomachenko's sequence is: punch → move simultaneously → punch from new angle. The step happens during the combination. Any pause gives the opponent time to reset.",

    drillProgression: [
      {
        level: "beginner",
        levelColor: "#10B981",
        title: "45-Degree Step Pattern",
        duration: "3 × 20 reps each direction",
        steps: [
          "Partner stands in front. Step your lead foot 45 degrees outside their lead foot — then stop",
          "Check: foot at 45 degrees? Weight centered? Rear foot maintaining stance width?",
          "Step back to neutral. Repeat 20 reps each direction — left exit and right exit",
          "No punches yet. Build the step completely before adding anything else",
        ],
      },
      {
        level: "intermediate",
        levelColor: "#F59E0B",
        title: "Step & Jab Exit",
        duration: "4 × 15 reps each direction",
        steps: [
          "Take the 45-degree step outside the lead foot",
          "From the new angle, throw one jab straight down the center lane",
          "The jab should arrive from the side — not from in front. Partner feels the angle difference",
          "Focus on the punch coming from the new position, not from where you started",
        ],
      },
      {
        level: "advanced",
        levelColor: "#F87171",
        title: "1-2 Exit Combination",
        duration: "3 × 2 min",
        steps: [
          "Throw jab-cross to front. During the cross, begin the 45-degree exit step",
          "Complete the step as the cross lands. Throw jab from new angle immediately — no pause",
          "Sequence: jab → cross + step → jab from angle. Three punches, one movement, new position",
          "If the partner can predict where the third punch arrives from, the exit isn't happening during the combination",
        ],
      },
    ],

    drill: {
      title: "1-2 Exit Combination",
      steps: [
        "Jab → cross + 45-degree step simultaneously",
        "Jab from new angle immediately after",
        "No pause between combination, step, and angle punch",
        "Partner should not know where the third punch arrives from",
      ],
    },

    fighterExample: {
      fighterId: "vasyl-lomachenko",
      name: "Vasyl Lomachenko",
      accent: "#A855F7",
      observation: "Watch Lomachenko vs. Linares, round 10. Every combination ends with a position change. After 1-2, he's no longer in front. After body hooks, he's outside the line. Count how many times Linares must pivot to find him. That pivoting moment is where the guard breaks.",
    },

    animalAnalogy: {
      animal: "Snake",
      emoji: "🐍",
      description: "The snake never attacks from the same angle twice. Its approach is non-linear — by the time you know where it is, it's somewhere else. Footwork makes you that snake: never in front, never predictable, always at a new angle.",
    },

    coachTip: "The angle is the weapon. The punch just tells them where you were.",
    coachCue: "The angle is the weapon. The punch just tells them where you were.",

    scoringMetrics: [
      { metric: "Lateral movement detection", description: "AI detects sideways and diagonal movement events during training" },
      { metric: "Movement timing", description: "Whether movement occurs before, during, or after punch sequences" },
      { metric: "Balance consistency", description: "Stable body position throughout movement — stumbling events counted" },
      { metric: "Direction variety", description: "Movement in multiple directions vs. single-direction pattern" },
    ],
  },
];
