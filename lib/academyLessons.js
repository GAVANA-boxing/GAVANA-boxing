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

    keywordsMn: ["джэб", "джеб", "зайн цохилт", "ритм", "мэдээлэл", "Бивол", "бивол"],

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

    keywordsMn: ["хүч", "шулуун цохилт", "бүсэлхий", "Иноуэ", "иноуе", "дэлбэрэх хүч"],

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

    keywordsMn: ["хук", "хазайсан цохилт", "тойрог цохилт", "Тайсон", "тайсон", "бүсэлхийн эргэлт"],

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

    keywordsMn: ["хамгаалалт", "буцаах", "хамгаалалтын сэргэлт", "Бивол", "бивол", "харуул"],

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

    keywordsMn: ["хөлний ажил", "өнцөг", "гарц", "хажуу", "Ломаченко", "ломаченко"],

    scoringMetrics: [
      { metric: "Lateral movement detection", description: "AI detects sideways and diagonal movement events during training" },
      { metric: "Movement timing", description: "Whether movement occurs before, during, or after punch sequences" },
      { metric: "Balance consistency", description: "Stable body position throughout movement — stumbling events counted" },
      { metric: "Direction variety", description: "Movement in multiple directions vs. single-direction pattern" },
    ],
  },

  // ── Slip Defense ──────────────────────────────────────────────────────────────
  {
    id: "slip-defense",
    emoji: "💨",
    title: "Slip Defense",
    subtitle: "Head Movement · Off-Line · Counter Ready",
    diagramType: "slip",
    difficulty: "intermediate",
    accentColor: "#34D399",
    relatedFighter: "floyd-mayweather",
    relatedFighterName: "Floyd Mayweather",
    relatedFighterAccent: "#94A3B8",
    animalEmoji: "🦊",
    animal: "Fox",

    concept: "The slip is not a defensive move — it is the first move of the counter. Moving your head outside the punch line removes you from danger and simultaneously puts you in perfect counter position. Mayweather's slip doesn't just save him; it reloads him. By the time the incoming punch is passing his ear, his counter is already in motion.",

    explanation: "The slip moves the head laterally off the punch line. Most beginners duck straight down or step back — both remove the head but neither creates counter position. The lateral slip ends with you inside the opponent's guard, counter already loading.",

    bodyMechanics: [
      "Head moves laterally off the punch centerline — not down, not back, but diagonally outside the incoming line",
      "Knees bend slightly as the head moves — the legs drive the movement, not the neck or waist alone",
      "Both hands stay raised at guard height throughout — the head moving does not move the hands",
      "Weight shifts to the opposite leg as the head moves outside — loading the counter automatically",
    ],

    whatYouShouldFeel: [
      "The incoming punch traveling past your ear, not toward your face — a clear miss with daylight",
      "Your knees bending before your head moves — if the head leads alone, you're bowing not slipping",
      "Both fists still near your face as the head changes position",
      "Your weight already loading the counter as the slip completes — defense and offense as one action",
    ],

    keyCues: [
      "Off the line, not just down — lateral beats backward",
      "Knees drive the head — neck and waist are passengers",
      "Slip ends in counter position — the defense is the setup",
    ],

    commonMistake: "Bending from the waist only (the 'bow'). A waist-bend drops the hands, exposes the upper back to body shots, and offers the top of your head to an uppercut. The slip must come from the knees — a short knee-bend with the head moving outside the punch line. The hands don't move.",

    drillProgression: [
      {
        level: "beginner",
        levelColor: "#10B981",
        title: "Wall Slip",
        duration: "3 × 30 reps each side",
        steps: [
          "Stand 6 inches from a wall — too close to step backward, forces a purely lateral slip",
          "Slip left: bend knees slightly, move head outside the left shoulder line without touching the wall",
          "Slip right: same movement, opposite direction — did you touch the wall? If yes, you moved backward not sideways",
          "20 clean reps per side before adding any punches",
        ],
      },
      {
        level: "intermediate",
        levelColor: "#F59E0B",
        title: "Slip the Jab",
        duration: "4 × 30 reps",
        steps: [
          "Partner throws jabs at controlled speed — 50%, no variation yet",
          "Slip outside: move head to the outside of the incoming jab as it extends",
          "Focus on knees bending first — if partner touches your head, you're not getting fully outside",
          "Check your guard: after the slip, both hands should still be near your face",
        ],
      },
      {
        level: "advanced",
        levelColor: "#F87171",
        title: "Slip-Counter",
        duration: "3 × 2 min",
        steps: [
          "Partner throws jabs at full speed — your goal: slip outside and return the cross",
          "The counter fires from the new angle: arrives from the side, not from in front",
          "Drill the slip-cross as one continuous motion — not slip, pause, counter",
          "If you can pause between slip and counter, the slip is too slow or too small",
        ],
      },
    ],

    drill: {
      title: "Slip the Jab",
      steps: [
        "Partner throws jab at 50% speed",
        "Slip outside — knees first, head moves off the line",
        "Guard stays raised throughout",
        "Build to slip-counter as one motion",
      ],
    },

    fighterExample: {
      fighterId: "floyd-mayweather",
      name: "Floyd Mayweather",
      accent: "#94A3B8",
      observation: "Watch Mayweather vs. Canelo, rounds 4-12. Every time Canelo throws, Mayweather's head is somewhere slightly different. Count how many times Canelo lands clean — the answer approaches zero. Each slip ends with Mayweather at a new angle, counter already returning. The slip is never the end of the sequence.",
    },

    animalAnalogy: {
      animal: "Fox",
      emoji: "🦊",
      description: "The fox doesn't run from the predator — it sidesteps the lunge and is already facing away before the predator lands. The lateral movement is faster than the forward momentum. The slip works the same way.",
    },

    coachTip: "The slip is the first move of the counter, not the last move of the defense.",
    coachCue: "Slip ends in counter position — defense and offense are one action.",

    keywordsMn: ["гулгах", "толгой хөдөлгөөн", "зайлах", "хамгаалалт", "Мэйвэзер", "майвэзер"],

    scoringMetrics: [
      { metric: "Head displacement", description: "AI tracks lateral head movement during incoming punch events" },
      { metric: "Guard maintenance", description: "Whether hands stay at guard height while head moves" },
      { metric: "Counter timing", description: "Speed from slip completion to counter punch initiation" },
      { metric: "Slip direction", description: "Lateral vs. downward head movement — proper slip classification" },
    ],
  },

  // ── Pull Counter ──────────────────────────────────────────────────────────────
  {
    id: "pull-counter",
    emoji: "↩️",
    title: "Pull Counter",
    subtitle: "Bait · Evade · Punish",
    diagramType: "pull-counter",
    difficulty: "intermediate",
    accentColor: "#22D3EE",
    relatedFighter: "floyd-mayweather",
    relatedFighterName: "Floyd Mayweather",
    relatedFighterAccent: "#94A3B8",
    animalEmoji: "🦎",
    animal: "Chameleon",

    concept: "The pull counter is patience as a weapon. You offer a visible target, create the commitment, then punish it. The opponent doesn't miss — you make them miss. That is a completely different thing. Mayweather made entire Hall of Fame careers irrelevant with this single technique: present the chin, draw the shot, remove it at the last moment, counter before they can recover.",

    explanation: "The pull counter requires stillness before the moment — no early movement, no telegraphing. The weight shifts back only as the punch arrives. The counter fires as the opponent's arm is fully extended and they are completely open.",

    bodyMechanics: [
      "Weight shifts to the rear foot as the incoming punch approaches — the head moves back with the weight, not independently",
      "No backward lean: the spine remains straight, only weight redistributes to the rear leg",
      "As the opponent's fist extends past you, weight immediately transfers forward to the front foot",
      "The counter cross fires as the opponent reaches full extension — they cannot retract and defend simultaneously",
    ],

    whatYouShouldFeel: [
      "The incoming punch arriving just short of your face — space created by weight shift, not stepping back",
      "Your weight on the rear foot first, then immediately coming forward as the counter fires",
      "The counter landing before the opponent can retract their punching arm",
      "One continuous motion: pull back → load → forward → counter — not four separate decisions",
    ],

    keyCues: [
      "Make them miss — then make them pay",
      "Pull back to load, not to escape",
      "Counter fires when they're extended — that is the only window",
    ],

    commonMistake: "Pulling straight back without countering. Moving backward without a counter means giving up position for nothing and ending up further from landing. The pull creates the counter position. If the counter doesn't fire, the technique failed.",

    drillProgression: [
      {
        level: "beginner",
        levelColor: "#10B981",
        title: "Weight Shift Drill",
        duration: "3 × 30 reps",
        steps: [
          "No punches yet — practice the weight shift only",
          "Rock weight back onto rear foot (feel the front foot lighten), then immediately forward",
          "Rear foot absorbs weight, then acts as a spring — forward is automatic after backward",
          "Add a counter punch motion on the forward rock — feel how pull and counter connect",
        ],
      },
      {
        level: "intermediate",
        levelColor: "#F59E0B",
        title: "Pull-Freeze Check",
        duration: "4 × 20 reps",
        steps: [
          "Partner throws a jab at controlled speed — you pull back and freeze",
          "Partner checks: weight on rear foot? Spine upright? Did you step back, or just shift?",
          "No stepping — the pull is a weight shift, not a retreat",
          "Add the counter cross before adding speed — shape before velocity",
        ],
      },
      {
        level: "advanced",
        levelColor: "#F87171",
        title: "Live Pull Counter",
        duration: "3 × 2 min",
        steps: [
          "Partner throws combinations at real speed — pull from jab or cross, counter every miss",
          "Counter arrives before they can retract — if they're back on guard before your counter, you were too slow",
          "Vary: pull from jab and counter, pull from cross and counter, pull from 1-2 and counter",
          "Success: partner cannot retract before the counter lands",
        ],
      },
    ],

    drill: {
      title: "Pull-Freeze Check",
      steps: [
        "Partner throws jab — pull back and freeze",
        "Weight on rear foot, spine upright, no step backward",
        "Add counter cross — shape first, speed after",
        "20 clean reps before going live",
      ],
    },

    fighterExample: {
      fighterId: "floyd-mayweather",
      name: "Floyd Mayweather",
      accent: "#94A3B8",
      observation: "Mayweather vs. De La Hoya, rounds 6-8. Every time Oscar throws the left hook, Mayweather's head is somewhere else and his right hand is landing. Watch Oscar's face after each exchange — he looks genuinely confused about where the opening went. The pull was so minimal it looked like Oscar missed on his own. He didn't.",
    },

    animalAnalogy: {
      animal: "Chameleon",
      emoji: "🦎",
      description: "The chameleon doesn't fight the threat — it disappears from where the threat aimed. The threat arrives at empty space. The counter comes from a direction no one was watching.",
    },

    coachTip: "The miss is the opening. The counter is the punishment.",
    coachCue: "Make them miss, make them pay — in that exact order, with nothing in between.",

    keywordsMn: ["татах цохилт", "буцах цохилт", "хариу цохилт", "буцах", "Мэйвэзер", "майвэзер"],

    scoringMetrics: [
      { metric: "Pull detection", description: "AI tracks rear-weight shifts as incoming punches approach" },
      { metric: "Counter timing", description: "Speed from pull completion to counter punch initiation" },
      { metric: "Guard maintenance", description: "Whether both hands maintain guard position during the pull" },
      { metric: "Balance during pull", description: "Upright posture maintained — lean vs. upright classification" },
    ],
  },

  // ── Body Shot Mechanics ───────────────────────────────────────────────────────
  {
    id: "body-shot",
    emoji: "💪",
    title: "Body Shot Mechanics",
    subtitle: "Level Change · Torque · Target Selection",
    diagramType: "body-shot",
    difficulty: "intermediate",
    accentColor: "#FB923C",
    relatedFighter: "naoya-inoue",
    relatedFighterName: "Naoya Inoue",
    relatedFighterAccent: "#F97316",
    animalEmoji: "🐗",
    animal: "Boar",

    concept: "A body shot is not a punch aimed lower — it is a completely different movement starting from the legs. The level change is the technique; the punch is the destination. Inoue breaks opponents with body shots that look impossible because his level change is so fast that by the time the defense adjusts, the punch has already landed.",

    explanation: "Most boxers think body shots mean 'same punch, lower target.' Wrong. The level change must be mechanical and leg-driven. Waist-bend body shots are weak, predictable, and expose the top of the head to uppercuts.",

    bodyMechanics: [
      "Bend at the knees to reach body level — the waist stays straight, the legs provide the altitude change",
      "Rear heel rises as the hip rotates through the body punch — same power chain as the head-level cross or hook",
      "Lead elbow rises slightly to protect against counter-uppercuts during the level change",
      "Target zones: liver (right hook to orthodox opponent), solar plexus (straight center), or ribs (lead hook path)",
    ],

    whatYouShouldFeel: [
      "Your knees dropping before your arm extends — if your back bends first, you've done it wrong",
      "The same rotational power in the hips as a head-level punch — body shots are not weaker punches",
      "Your chin tucking slightly as you drop level — not exposed while you're lower",
      "A genuine altitude change: your eyes drop to your opponent's chest or elbow level",
    ],

    keyCues: [
      "Knees drop, back stays — altitude from legs not waist",
      "Full hip rotation at body level — the power chain doesn't change",
      "Exit the level immediately after — don't stay low",
    ],

    commonMistake: "Bending from the waist to reach body level. Waist-bend body shots expose the top of your head to uppercuts, remove rotational power from the punch, and are clearly telegraphed. The back must remain nearly vertical throughout the level change — only the legs create the altitude change.",

    drillProgression: [
      {
        level: "beginner",
        levelColor: "#10B981",
        title: "Level Change Drill",
        duration: "3 × 20 reps",
        steps: [
          "No punching — practice dropping to body level and returning only",
          "Knees bend, back stays straight, chin stays in, then stand back up",
          "Mirror check: does your back stay vertical as you drop? If you see your back bending, reset",
          "20 clean level changes before adding any punch",
        ],
      },
      {
        level: "intermediate",
        levelColor: "#F59E0B",
        title: "Body Hook Sequence",
        duration: "4 × 20 reps",
        steps: [
          "Drop level, throw lead hook to body, stand up, throw lead hook to head",
          "This is the body-head combination foundation — every body shot sets up the head",
          "The body shot must genuinely land at rib/liver level — not stomach level",
          "After the body shot, stand immediately before throwing the head shot — no lurking low",
        ],
      },
      {
        level: "advanced",
        levelColor: "#F87171",
        title: "1-2-Body Combination",
        duration: "3 × 2 min",
        steps: [
          "Jab to head, cross to head — watch opponent defend the high line",
          "Drop level immediately: lead hook to body (liver if orthodox vs. orthodox)",
          "Opponent must simultaneously defend two levels — upper guard drops to cover the body",
          "Follow immediately with lead hook to the head — the body shot opened it",
        ],
      },
    ],

    drill: {
      title: "Body Hook Sequence",
      steps: [
        "Drop level with knee bend — back stays straight",
        "Lead hook to body at rib/liver level",
        "Stand up immediately — lead hook to head",
        "The body shot is the key that opens the head",
      ],
    },

    fighterExample: {
      fighterId: "naoya-inoue",
      name: "Naoya Inoue",
      accent: "#F97316",
      observation: "Inoue vs. Donaire II, rounds 5-6. Watch Inoue's back when he throws body shots. It stays nearly vertical — he genuinely drops altitude through knee work. The rotational power at body level is identical to his head shots. Pause on a body hook frame: knees bent, back straight, hip mid-rotation. That is the complete technique.",
    },

    animalAnalogy: {
      animal: "Boar",
      emoji: "🐗",
      description: "The boar doesn't attack at head level — it charges low and drives forward with its whole body behind the blow. Power from dropping weight into the attack, not swinging down toward it.",
    },

    coachTip: "The body opens the head. Every clean body shot is a down payment on a head shot later.",
    coachCue: "Knees drop, back stays, hip rotates — the power chain is the same, just lower.",

    keywordsMn: ["биеийн цохилт", "биед цохих", "элэг", "биеийн хэмжээний өөрчлөлт", "Иноуэ", "иноуе"],

    scoringMetrics: [
      { metric: "Level change detection", description: "AI tracks drop in body position during punch execution" },
      { metric: "Body zone targeting", description: "Whether punch trajectory indicates body-level targeting" },
      { metric: "Guard exposure", description: "Head and chin protection score during the level change" },
      { metric: "Hip rotation at body level", description: "Rotational power signature detected at lower punch altitude" },
    ],
  },

  // ── Double Jab ────────────────────────────────────────────────────────────────
  {
    id: "double-jab",
    emoji: "👊",
    title: "Double Jab",
    subtitle: "Setup · Rhythm Break · Distance Control",
    diagramType: "double-jab",
    difficulty: "beginner",
    accentColor: "#60A5FA",
    relatedFighter: "dmitry-bivol",
    relatedFighterName: "Dmitry Bivol",
    relatedFighterAccent: "#3B82F6",
    animalEmoji: "🐝",
    animal: "Bee",

    concept: "The double jab is one technique delivered twice — but the second delivery is never identical to the first. The first jab is the announcement; the second is the surprise. The gap between them is where the opponent's guard is mid-reset. Bivol uses the double jab to break defensive timing before every major combination: the first establishes the rhythm the opponent expects, the second breaks it.",

    explanation: "Most fighters throw double jabs as two identical punches in a row. That's just a longer jab. The real double jab uses the first punch to set a rhythm and the second punch to break it — different speed, angle, or height.",

    bodyMechanics: [
      "First jab fires and fully retracts before the second fires — no half-retraction, no overlap",
      "Second jab fires immediately as the first completes its return — retraction of the first is the load for the second",
      "Rear guard maintains jaw contact throughout both extensions — no drop between jabs",
      "The second jab intentionally varies: faster, slightly lower, or on an unexpected timing break",
    ],

    whatYouShouldFeel: [
      "The first jab fully returning home before the second departs — distinct retraction, not a push-push motion",
      "One continuous rhythmic flow — not two separate decisions with a dead pause between them",
      "Your rear shoulder staying forward on both extensions, protecting the chin",
      "The second jab catching the opponent's guard mid-reset — if they fully reset before the second arrives, your timing needs work",
    ],

    keyCues: [
      "Return before you re-fire — full retraction, then second jab",
      "First is the distraction, second is the technique",
      "Vary the second — height, speed, or timing — never identical",
    ],

    commonMistake: "Two identical jabs at the same speed and height. Two identical jabs are one jab that takes twice as long — the opponent reads the second exactly like the first and adjusts. The second jab must be deliberately different in at least one dimension.",

    drillProgression: [
      {
        level: "beginner",
        levelColor: "#10B981",
        title: "Return Check",
        duration: "3 × 30 combinations",
        steps: [
          "Throw first jab — freeze before throwing the second",
          "Partner checks: first hand back at jaw level? Only then fire the second",
          "Build the habit: complete retraction before second jab fires",
          "30 double-jabs with the freeze check before adding speed",
        ],
      },
      {
        level: "intermediate",
        levelColor: "#F59E0B",
        title: "Vary the Second",
        duration: "4 × 20 combinations",
        steps: [
          "Round 1: both jabs same speed — feel the baseline rhythm",
          "Round 2: second jab noticeably faster than the first",
          "Round 3: second jab to the body after a head first jab — force a guard adjustment",
          "Round 4: mix all variations — partner should not be able to predict the second",
        ],
      },
      {
        level: "advanced",
        levelColor: "#F87171",
        title: "1-1-2 Combination",
        duration: "3 × 2 min",
        steps: [
          "Throw double jab — the second jab breaks the guard timing",
          "Immediately fire the cross from the same line as the second jab",
          "The double jab creates two guard responses; the cross arrives during the second reset",
          "If the cross feels easy to land, the double jab is working correctly",
        ],
      },
    ],

    drill: {
      title: "Return Check",
      steps: [
        "Throw first jab — freeze",
        "First hand fully back at jaw? Then fire second",
        "Vary the second on the third set: lower target",
        "30 clean combinations before adding speed",
      ],
    },

    fighterExample: {
      fighterId: "dmitry-bivol",
      name: "Dmitry Bivol",
      accent: "#3B82F6",
      observation: "Bivol vs. Canelo, rounds 2-4. Watch any sequence before Bivol throws a cross. Count the jabs — there are almost always two. But they don't sound the same. The first is measured; the second is slightly faster or lower. By the third punch (the cross), the opponent has been asked to adjust twice in half a second.",
    },

    animalAnalogy: {
      animal: "Bee",
      emoji: "🐝",
      description: "The bee doesn't sting once and wait. The second sting follows the first immediately — from the same direction but at the moment when the instinct to protect has already fired and not yet reset. Two stings, one opening.",
    },

    coachTip: "First jab shows them the door. Second jab knocks — from a different angle.",
    coachCue: "First jab asks. Second jab surprises. Cross answers.",

    keywordsMn: ["давхар джэб", "давхар цохилт", "хоёр джеб", "хэмнэл", "Бивол", "бивол"],

    scoringMetrics: [
      { metric: "Jab count", description: "AI counts individual jab extensions — identifies double jab sequences" },
      { metric: "Retraction speed", description: "Whether first jab fully retracts before second fires" },
      { metric: "Rhythm variation", description: "Speed variation between first and second jab — identical vs. varied classification" },
      { metric: "Guard maintenance", description: "Rear hand at jaw level throughout both jab extensions" },
    ],
  },

  // ── Shoulder Roll ─────────────────────────────────────────────────────────────
  {
    id: "shoulder-roll",
    emoji: "🔄",
    title: "Shoulder Roll",
    subtitle: "Shell Defense · Deflection · Counter System",
    diagramType: "shoulder-roll",
    difficulty: "advanced",
    accentColor: "#A3E635",
    relatedFighter: "floyd-mayweather",
    relatedFighterName: "Floyd Mayweather",
    relatedFighterAccent: "#94A3B8",
    animalEmoji: "🐢",
    animal: "Turtle",

    concept: "The shoulder roll is not a block — it is a redirection system. The front shoulder rises and angles to send incoming punches past the chin rather than absorbing them. Mayweather built his entire defensive identity around this principle: nothing is absorbed, everything is redirected, and every redirect automatically loads a counter. The punch doesn't stop. It goes somewhere harmless.",

    explanation: "The shell guard and shoulder roll work together. The shell makes you small and awkward to hit cleanly; the roll redirects what gets through. Most defensive techniques try to stop punches — the roll makes them miss by redirecting their path.",

    bodyMechanics: [
      "Front shoulder rises to chin level — the chin tucks completely behind the raised shoulder",
      "Front arm hangs in shell position: loose at roughly 45 degrees, not extended, not fully tucked",
      "Weight shifts slightly to the rear leg as the shoulder rises — this loads the counter",
      "After deflection, weight transfers forward automatically — the roll flows directly into the counter cross",
    ],

    whatYouShouldFeel: [
      "The punch sliding off the angled shoulder — not stopping, but redirecting past the chin",
      "Your chin completely hidden behind the raised front shoulder",
      "Your rear hand already loaded at the hip or elbow level, counter ready",
      "The roll feeling fluid, not rigid — tension removes the deflection angle",
    ],

    keyCues: [
      "Shoulder rises to meet it — chin hides behind it",
      "Deflect, don't absorb — the angle redirects, not the strength",
      "Roll flows into counter — deflection and offense are one motion",
    ],

    commonMistake: "Tensing the shoulder to stop the punch. A rigid shoulder transmits force directly to your neck and face. The roll must be relaxed — the shoulder acts as a ramp, not a wall. Tension destroys the deflection angle and eliminates the counter window.",

    drillProgression: [
      {
        level: "beginner",
        levelColor: "#10B981",
        title: "Shell Hold",
        duration: "3 × 60 seconds",
        steps: [
          "Stand in shell position: front shoulder raised to chin height, chin behind it, rear hand at temple",
          "Hold for 60 seconds — build comfort and muscle memory in the position",
          "Check: is the shoulder raised or just forward? It must go up to chin level, not just slightly forward",
          "The discomfort disappears after 5-6 sessions — the position becomes natural",
        ],
      },
      {
        level: "intermediate",
        levelColor: "#F59E0B",
        title: "Roll the Pad",
        duration: "4 × 30 reps",
        steps: [
          "Partner slowly pushes a pad against your raised front shoulder — pressure, not a punch",
          "Feel the deflection angle: shoulder angled so the pad slides off rather than stops",
          "If pad stops dead against your shoulder, you're blocking not rolling — adjust the shoulder angle",
          "Speed increases only after the deflection angle is consistent",
        ],
      },
      {
        level: "advanced",
        levelColor: "#F87171",
        title: "Roll-Counter Live",
        duration: "3 × 2 min",
        steps: [
          "Partner throws jab-cross combinations at increasing speed",
          "Roll the cross with the front shoulder — chin behind it, counter loading",
          "Fire the counter cross immediately after deflection — before they reset",
          "The counter must fire before they're back on guard — if they reset first, the roll was too late",
        ],
      },
    ],

    drill: {
      title: "Roll the Pad",
      steps: [
        "Partner pushes pad against raised front shoulder",
        "Angle shoulder so pad slides off — not stopped",
        "Feel the deflection, not the absorption",
        "Build to live roll-counter from this sensation",
      ],
    },

    fighterExample: {
      fighterId: "floyd-mayweather",
      name: "Floyd Mayweather",
      accent: "#94A3B8",
      observation: "Mayweather vs. Canelo, every round after the 4th. Watch when Canelo throws the left hook. Mayweather's right shoulder rises, the hook slides off at an angle, and Mayweather is already stepping inside with the right hand. Roll and counter begin simultaneously: shoulder rises as weight loads, counter is already traveling when the hook makes contact with the shoulder.",
    },

    animalAnalogy: {
      animal: "Turtle",
      emoji: "🐢",
      description: "The turtle's shell doesn't fight the threat — it redirects it around the animal. The shape does the work, not the strength. The threat bounces off harmlessly. The shoulder roll is the turtle: geometry beats force.",
    },

    coachTip: "The roll doesn't stop the punch. It sends it somewhere it can't hurt you.",
    coachCue: "Shoulder up, chin behind it, deflect the punch, flow into the counter.",

    keywordsMn: ["мөрний эргэлт", "мөр", "хамгаалалт", "снарк хамгаалалт", "Мэйвэзер", "майвэзер"],

    scoringMetrics: [
      { metric: "Shoulder elevation", description: "AI detects front shoulder rising to chin-level as incoming punch arrives" },
      { metric: "Chin protection score", description: "Whether chin disappears behind the raised shoulder during deflection" },
      { metric: "Counter timing", description: "Speed from roll completion to counter punch initiation" },
      { metric: "Deflection fluidity", description: "Smooth roll vs. rigid block classification" },
    ],
  },
];
