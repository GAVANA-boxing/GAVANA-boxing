// Universal academy lessons — fundamental mechanics independent of any fighter.
// Each lesson links to a related fighter for deeper study.

export const ACADEMY_LESSONS = [
  {
    id: "jab-mechanics",
    title: "Jab Mechanics",
    subtitle: "Distance, disruption, and defense",
    diagramType: "footwork",
    relatedFighter: "dmitry-bivol",
    relatedFighterName: "Bivol",
    relatedFighterAccent: "#3B82F6",
    animalEmoji: "🐺",
    animal: "Wolf",
    difficulty: "beginner",
    emoji: "👊",
    accentColor: "#F5C451",

    explanation:
      "The jab controls distance, disrupts rhythm, measures range, and scores points. It's the most-thrown punch in boxing — not because it's the most powerful, but because it answers every question about an opponent before committing anything else. The jab is a question. Every other punch is the answer.",

    keyCues: [
      "Lead shoulder rises to the chin at full extension — the shoulder protects the chin exactly when it's most exposed",
      "Snap back at equal speed to the extension — slow retraction leaves the guard open during recovery",
      "No weight transfer into the jab — feet stay mobile, ready to move in any direction immediately after",
    ],

    commonMistake:
      "The rear hand drops without any conscious decision. While the jabbing arm extends, attention follows it — the inactive hand drifts. A rear-hand drop exposes the chin to exactly the counter the jab was supposed to prevent.",

    drill: {
      title: "100-Jab Retraction Drill",
      steps: [
        "Stand at heavy bag — 100 jabs focusing only on shoulder lift and retraction speed",
        "Count in pairs: extension-and-back as one rhythm — both halves must feel equal",
        "Rest rear hand on jaw throughout — any drift means the habit isn't trained yet",
        "Final 20 reps: partner stands behind bag, calls 'counter' randomly — you must already be in guard",
      ],
    },

    coachTip:
      "The jab is a question. Throw it to get answers: where is their guard, where are their feet, what do they do when something's incoming? React to those answers — don't preset the next punch.",
  },

  {
    id: "cross-mechanics",
    title: "Cross Mechanics",
    subtitle: "Rotational power from the ground up",
    diagramType: "angle",
    relatedFighter: "naoya-inoue",
    relatedFighterName: "Inoue",
    relatedFighterAccent: "#F97316",
    animalEmoji: "🦅",
    animal: "Hawk",
    difficulty: "beginner",
    emoji: "🥊",
    accentColor: "#FF3B30",

    explanation:
      "The cross travels the longest distance and carries full body weight through hip rotation. Most beginners throw it with the arm — they get reach but no real power. The cross is rotational energy that happens to end at the chin, not an arm extension that incorporates the body as an afterthought.",

    keyCues: [
      "Rear heel rises as the hip fires — heel stays down means hip didn't rotate, the cross carries arm only",
      "Chin tucks behind the lead shoulder at full extension — the shoulder shields the chin at moment of impact",
      "Hip fires first, shoulder second, arm arrives last — if the arm leads, the punch is less than half its potential",
    ],

    commonMistake:
      "Stepping forward before rotating. The step shifts weight forward but kills rotational velocity — you add linear momentum but lose the whip. Rotate in place first, then let the body naturally follow forward.",

    drill: {
      title: "Wall Cross — Rotation Only",
      steps: [
        "Stand 2 feet from wall, extend cross until fist is 4 inches from wall — no stepping allowed",
        "Focus entirely on rear heel rising and hip rotating — arm follows naturally from the chain",
        "30 reps rotation-only, then 30 reps adding the forward step — compare the feeling of each",
        "Heavy bag: place foot tape on floor, rear foot pivots ON the tape — heel must clearly lift",
      ],
    },

    coachTip:
      "Throw the cross from your rear heel through your hip, through your shoulder, to your fist. The arm just happens to be at the end of the chain. Train the chain, not the arm.",
  },

  {
    id: "hook-mechanics",
    title: "Hook Mechanics",
    subtitle: "The punch they don't see coming",
    diagramType: "stance",
    relatedFighter: "mike-tyson",
    relatedFighterName: "Tyson",
    relatedFighterAccent: "#FF3B30",
    animalEmoji: "🐂",
    animal: "Bull",
    difficulty: "intermediate",
    emoji: "⚡",
    accentColor: "#F97316",

    explanation:
      "The hook arrives from outside the opponent's primary visual field — which is why it causes more knockouts than any other punch. The brain doesn't brace for an impact it didn't see coming. The hook doesn't depend on reach; it depends on rotation. A short hook with full body rotation beats a wide swing every time.",

    keyCues: [
      "Elbow stays fixed at 90° throughout — if the elbow drops, the hook becomes a wide swing: more visible, less powerful",
      "Lead foot ball pivots as the hook fires — the pivot adds rotation and drives full body weight into the punch",
      "Palm faces slightly downward at impact — knuckles face the ceiling at the moment of landing, not the opponent",
    ],

    commonMistake:
      "Winding the arm back before throwing. Any rearward arm movement before the hook fires telegraphs it at full speed. Opponents see it coming and can prepare. The hook is already loaded in the rotation of your stance — the arm doesn't need to go back.",

    drill: {
      title: "Stationary Hook Sequence",
      steps: [
        "Stand with feet shoulder-width — 50 left hooks without moving feet, elbow fixed at 90°, rotation only",
        "Add the lead foot pivot: 50 more hooks where the ball of the foot turns as the hook fires",
        "Heavy bag at close range: 3 compact taps, no arm swing — feel body rotation doing the work",
        "Partner check: someone watches your elbow — must not drop below 90° at any point",
      ],
    },

    coachTip:
      "The hook is already loaded in your stance. You don't create power — you release the rotation that's already stored. Wind-up wastes that stored energy and gives opponents time to read it.",
  },

  {
    id: "guard-recovery",
    title: "Guard Recovery",
    subtitle: "The most neglected fundamental",
    diagramType: "guard",
    relatedFighter: "dmitry-bivol",
    relatedFighterName: "Bivol",
    relatedFighterAccent: "#3B82F6",
    animalEmoji: "👻",
    animal: "Ghost",
    difficulty: "beginner",
    emoji: "🛡️",
    accentColor: "#60A5FA",

    explanation:
      "Most knockdowns don't happen on the first punch of a combination — they happen on the last. After the final punch, many fighters instinctively pause or watch where the punch landed. That pause, with hands partially extended and feet planted, is the most dangerous moment in boxing. The counter arrives before the decision to return to guard is made.",

    keyCues: [
      "Retraction happens simultaneously with a lateral step — the step and guard reset are one motion, not two sequential actions",
      "Eyes stay on target during recovery — looking away while resetting is when most fighters get tagged",
      "Recovery is part of the combination, not the end of it — treat the guard reset as the final punch of every sequence",
    ],

    commonMistake:
      "Watching where the punch landed. That moment of follow-through — hands extended, gaze following the impact — is exactly when counters arrive. Opponents are already throwing before you've consciously decided to return to guard.",

    drill: {
      title: "Combination-and-Move",
      steps: [
        "Throw any 3-punch combination on the heavy bag — any combination you like",
        "After the last punch, immediately take 2 lateral steps before anything else",
        "Never be in the same position after a combination ends",
        "3×3 minute rounds: if you catch yourself standing still after a combination, restart the round",
      ],
    },

    coachTip:
      "After every combination, move. Not because you know something is coming — because something always might be. Guard recovery movement is a habit, not a reaction. You can't build a habit under pressure.",
  },

  {
    id: "footwork-angle-exit",
    title: "Footwork Angle Exit",
    subtitle: "Don't be where they're aiming",
    diagramType: "footwork",
    relatedFighter: "vasyl-lomachenko",
    relatedFighterName: "Lomachenko",
    relatedFighterAccent: "#A855F7",
    animalEmoji: "🐍",
    animal: "Snake",
    difficulty: "intermediate",
    emoji: "👣",
    accentColor: "#34D399",

    explanation:
      "Every planted lead foot is a pivot post. Most fighters don't use it — they jab and stay, or back straight out when something comes back. Pivoting 45–90° off the attack line after punching means the counter arrives at a position you've already left. The opponent is aiming at where you were.",

    keyCues: [
      "Lead foot ball is the pivot post — all weight on the ball, rear foot pushes, body swivels 45–90° to the side",
      "Exit to the side, not backward — backing straight out keeps you in the counter line, angles remove you from it entirely",
      "Punch first, then exit — the pivot is attached to the combination, not a separate step after it",
    ],

    commonMistake:
      "Stepping backward after combinations. Backward retreat is predictable — opponents step forward and the counter lands while you're moving in a straight line toward them. A sideways pivot puts you at an angle they weren't aiming for.",

    drill: {
      title: "Jab-and-Exit",
      steps: [
        "Throw a single jab, immediately pivot 45° right on lead foot ball — feel the exit angle",
        "Partner stands in front: after your jab, they reach for you — they should miss cleanly after the pivot",
        "Alternate exits: 5 reps jab-pivot-right, 5 reps jab-pivot-left — both sides",
        "3×2 minutes: every jab is followed by an angle exit — no jab without an exit attached",
      ],
    },

    coachTip:
      "Every time your lead foot plants, you have a pivot post. The question is whether you use it or waste it. Make the exit automatic — it costs nothing and removes you from every counter that was aimed at where you just were.",
  },
];
