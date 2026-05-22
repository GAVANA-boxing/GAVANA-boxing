// Fighter Study — static data for v1
// Combat terms (jab, guard, combo, footwork, timing, pressure, counter, pivot) kept in EN per spec.

export const FIGHTERS = [
  {
    id: "mike-tyson",
    name: "Mike Tyson",
    nickname: "Iron Mike",
    country: "🇺🇸",
    weightClass: "Heavyweight",
    style: "Peekaboo Pressure",
    keyWeapon: "Explosive entries + body hooks",
    identity: "The most feared pressure fighter in history. Short-range devastation behind elite head movement.",
    accent: "#FF3B30",

    styleIdentity: [
      "Explosive pressure walker",
      "Peekaboo shell defense",
      "Body-to-head attack chains",
      "Ultra-compact punching range",
    ],

    signatureCombos: [
      { name: "Peek Entry", steps: ["bob", "step in", "left hook body", "right uppercut"] },
      { name: "Double Hook", steps: ["jab", "weave", "left hook head", "right hook head"] },
      { name: "Body-Head Bomb", steps: ["feint jab", "left hook body", "right overhand"] },
    ],

    movementDNA: {
      type: "Explosive Stalker",
      description: "Short rhythmic bobs. Closes distance in 2–3 steps. Attacks in violent 3-punch bursts, resets to shell.",
      tags: ["pressure", "explosive", "compact", "animal-like"],
    },

    whatToStudy: [
      "Peekaboo guard position",
      "Bob and weave rhythm",
      "Explosive first-step entry",
      "Left hook to the body",
    ],

    habitsToMimick: [
      "Head always moving inside guard",
      "Close distance behind the jab",
      "Attack in 3-shot bursts, not singles",
      "Cut angles immediately after every combo",
    ],

    drills: [
      "Slip rope × 3 min continuous",
      "Body hook on heavy bag: 3 × 3 min",
      "Shadow: bob-step-hook pattern",
      "2-step explosive entry drill vs partner",
    ],

    weaknesses: [
      "Struggles against disciplined distance fighters",
      "Upper-body rhythm can be timed by calm opponents",
      "Exposed on the way in if feints are read",
    ],

    famousFights: [
      { fight: "Tyson vs Spinks", year: 1988, note: "91-second KO. Perfect peekaboo execution." },
      { fight: "Tyson vs Berbick", year: 1986, note: "Lightning entries. Peekaboo at full speed." },
      { fight: "Tyson vs Biggs", year: 1987, note: "Systematic body attack clinic." },
    ],

    relatedKeywords: ["peekaboo", "body hook", "pressure", "explosive entry"],
  },

  {
    id: "muhammad-ali",
    name: "Muhammad Ali",
    nickname: "The Greatest",
    country: "🇺🇸",
    weightClass: "Heavyweight",
    style: "Float & Sting",
    keyWeapon: "Jab speed + lateral movement",
    identity: "Redefined heavyweight boxing with impossible speed and ring generalship.",
    accent: "#F5C451",

    styleIdentity: [
      "Lateral movement master",
      "Long-range jab architect",
      "Anti-pressure specialist",
      "Rhythm disruptor",
    ],

    signatureCombos: [
      { name: "Ali Jab", steps: ["jab", "jab", "right cross", "pivot exit"] },
      { name: "Rope-a-Dope Counter", steps: ["shell on ropes", "absorb", "right hand counter", "pivot off"] },
      { name: "Float Sequence", steps: ["lateral step", "jab", "jab", "step back"] },
    ],

    movementDNA: {
      type: "Dancing Counter",
      description: "Constant lateral movement. Makes opponents miss, punishes lunges. Controls tempo with jab.",
      tags: ["footwork", "counter", "lateral", "distance control"],
    },

    whatToStudy: [
      "Jab timing and snap",
      "Lateral footwork exits",
      "Pull-counter right hand",
      "Rope-a-dope shell positioning",
    ],

    habitsToMimick: [
      "Never be stationary — always moving laterally",
      "Use jab to control range and set up counters",
      "Pivot after every combination",
      "Absorb strategically to drain opponent",
    ],

    drills: [
      "Lateral shuffle × 5 min shadow",
      "Jab-pivot drill on mitts",
      "Pull-counter: slip right, cross left",
      "Rope-a-dope shell vs slow partner shots",
    ],

    weaknesses: [
      "Later career absorbed too much punishment",
      "Movement speed declined with age",
      "Rope-a-dope is high-risk if chin weakens",
    ],

    famousFights: [
      { fight: "Ali vs Foreman", year: 1974, note: "Rumble in the Jungle. Rope-a-dope masterclass." },
      { fight: "Ali vs Frazier I", year: 1971, note: "Greatest rivalry opener. Float vs pressure." },
      { fight: "Ali vs Liston I", year: 1964, note: "Speed that redefined heavyweights." },
    ],

    relatedKeywords: ["jab", "footwork", "counter", "lateral movement", "pivot"],
  },

  {
    id: "naoya-inoue",
    name: "Naoya Inoue",
    nickname: "The Monster",
    country: "🇯🇵",
    weightClass: "Super Bantamweight",
    style: "Pressure-Counter Hybrid",
    keyWeapon: "Left hook to the body",
    identity: "Most dangerous pound-for-pound fighter alive. Breaks opponents physically and mentally.",
    accent: "#F97316",

    styleIdentity: [
      "Elite body attack specialist",
      "Explosive counter timing",
      "Pressure walking with angles",
      "Psychological destruction",
    ],

    signatureCombos: [
      { name: "Monster Entry", steps: ["jab", "left hook body", "right hand head"] },
      { name: "Counter Cross", steps: ["slip inside", "right cross", "left hook"] },
      { name: "Body-Head Switch", steps: ["feint head", "left hook body", "right uppercut"] },
    ],

    movementDNA: {
      type: "Cat-Like Pressure",
      description: "Rhythmic step-in, explosive burst, reset. Patient stalking until the perfect opening appears.",
      tags: ["pressure", "timing", "explosive", "patient"],
    },

    whatToStudy: [
      "Body jab as a setup tool",
      "Inside slip to right hand counter",
      "Left hook to the liver",
      "Controlled pressure walking",
    ],

    habitsToMimick: [
      "Vary target between head and body constantly",
      "Wait patiently — never force punches",
      "Use jab to measure distance before attacking",
      "Stay physically dominant in clinches",
    ],

    drills: [
      "Body jab + left hook body × 50 reps",
      "Slip drill: inside slip → counter cross",
      "Heavy bag: 3-shot bursts to alternating targets",
      "Speed bag for timing sharpness",
    ],

    weaknesses: [
      "Rarely tested at higher weight classes",
      "Elite counterpunchers can time his entries",
      "Limited by weight class ceiling",
    ],

    famousFights: [
      { fight: "Inoue vs Donaire II", year: 2022, note: "War of the year. Body attack dominance." },
      { fight: "Inoue vs Nery", year: 2024, note: "Devastating power on full display." },
      { fight: "Inoue vs Tapales", year: 2023, note: "Undisputed unification. Monster unleashed." },
    ],

    relatedKeywords: ["body attack", "counter", "pressure", "liver shot"],
  },

  {
    id: "dmitry-bivol",
    name: "Dmitry Bivol",
    nickname: "The Russian",
    country: "🇷🇺",
    weightClass: "Light Heavyweight",
    style: "Soviet Fundamentals",
    keyWeapon: "Distance control + right hand",
    identity: "Textbook Soviet fundamentals executed at elite level. Calm, methodical, suffocating.",
    accent: "#3B82F6",

    styleIdentity: [
      "Distance control architect",
      "Calm tempo fighter",
      "Right hand setup specialist",
      "Defensive efficiency master",
    ],

    signatureCombos: [
      { name: "Soviet Straight", steps: ["jab", "jab", "right cross", "left hook exit"] },
      { name: "Distance Punish", steps: ["step back", "jab stop", "right cross"] },
      { name: "Body Setup", steps: ["right hook body", "right hand head", "pivot"] },
    ],

    movementDNA: {
      type: "Distance Sniper",
      description: "Constantly measuring. Uses jab as a measuring tool and stopper. Patient accumulation of points and damage.",
      tags: ["distance", "fundamentals", "patient", "systematic"],
    },

    whatToStudy: [
      "Jab as distance control tool",
      "Right hand after jab feint",
      "Backward pivot exit",
      "Shoulder roll defense",
    ],

    habitsToMimick: [
      "Maintain perfect punching range at all times",
      "Never lean in — stay upright and balanced",
      "Use jab to reset opponent's timing",
      "Exit after every combination with movement",
    ],

    drills: [
      "Jab-pivot footwork pattern × 5 min shadow",
      "Right hand timing drill on mitts",
      "Range maintenance: stay at jab distance vs partner",
      "Shoulder roll drill on double-end bag",
    ],

    weaknesses: [
      "Can be too defensive and conservative early",
      "Rarely throws in high volume",
      "Elite speed fighters can steal rounds",
    ],

    famousFights: [
      { fight: "Bivol vs Canelo", year: 2022, note: "Upset of the decade. Distance control perfection." },
      { fight: "Bivol vs Beterbiev", year: 2024, note: "Clash of champions. Technical vs power." },
      { fight: "Bivol vs Sullivan Barrera", year: 2019, note: "Complete domination clinic." },
    ],

    relatedKeywords: ["distance control", "jab", "right hand", "fundamentals", "Soviet"],
  },

  {
    id: "vasyl-lomachenko",
    name: "Vasyl Lomachenko",
    nickname: "Hi-Tech",
    country: "🇺🇦",
    weightClass: "Lightweight",
    style: "Matrix Footwork",
    keyWeapon: "Angles + pivot combinations",
    identity: "The most technically refined fighter of his era. Creates angles no one else imagines.",
    accent: "#A855F7",

    styleIdentity: [
      "Angle creation genius",
      "Pivot-based attack system",
      "Pressure with movement",
      "Orthodox-southpaw hybrid tactics",
    ],

    signatureCombos: [
      { name: "Matrix Pivot", steps: ["jab", "pivot left 90°", "left hook", "pivot right"] },
      { name: "Hi-Tech Entry", steps: ["step left", "right cross", "pivot", "body hook exit"] },
      { name: "Shoulder Feint", steps: ["shoulder roll feint", "step angle", "lead hook"] },
    ],

    movementDNA: {
      type: "Angle-Heavy Spider",
      description: "Never fights straight. Constant pivoting, circling, and angle cutting. Makes opponents punch at air.",
      tags: ["angles", "footwork", "pivot", "technical"],
    },

    whatToStudy: [
      "90-degree pivot after jab",
      "Southpaw stance switch feint",
      "Shoulder roll inside counter",
      "Lateral exit after combinations",
    ],

    habitsToMimick: [
      "Never stay in front of opponent after punching",
      "Pivot every 2–3 shots minimum",
      "Use stance feints to disrupt opponent timing",
      "Attack from unexpected angles, not straight lines",
    ],

    drills: [
      "Pivot drill: jab-pivot × 10 each side",
      "Angle shadow: punch-pivot-exit pattern",
      "Stance switch feint on double-end bag",
      "Mirror drill: copy opponent's movement then counter",
    ],

    weaknesses: [
      "Slow starter — takes rounds to read opponent",
      "Size disadvantage vs bigger naturally-sized fighters",
      "Early rounds can be lost to aggression",
    ],

    famousFights: [
      { fight: "Lomachenko vs Salido II", year: 2014, note: "Second professional fight. Masterclass despite loss." },
      { fight: "Lomachenko vs Rigondeaux", year: 2017, note: "Angles dismantled one of boxing's greats." },
      { fight: "Lomachenko vs Lopez", year: 2020, note: "Late surge. Pivot game in full display." },
    ],

    relatedKeywords: ["pivot", "angles", "footwork", "technical", "counter"],
  },

  {
    id: "canelo-alvarez",
    name: "Canelo Álvarez",
    nickname: "Canelo",
    country: "🇲🇽",
    weightClass: "Super Middleweight",
    style: "Counter-Pressure Hybrid",
    keyWeapon: "Check hook + left hook counter",
    identity: "Mexican warrior who became a technical mastermind. Combines timing with devastating power.",
    accent: "#F59E0B",

    styleIdentity: [
      "Intelligent counter puncher",
      "Elite shoulder roll defense",
      "Body attack patient builder",
      "Power at any range",
    ],

    signatureCombos: [
      { name: "Check Hook", steps: ["step left 45°", "left hook counter", "right hand follow"] },
      { name: "Canelo Counter", steps: ["shoulder roll", "right hand counter", "left hook"] },
      { name: "Body Builder", steps: ["jab body", "left hook body", "right hand head"] },
    ],

    movementDNA: {
      type: "Pressure Counter",
      description: "Walks forward methodically. Uses shoulder roll to invite punches, counters explosively. Patient but lethal.",
      tags: ["counter", "pressure", "shoulder roll", "timing"],
    },

    whatToStudy: [
      "Shoulder roll technique",
      "Check hook mechanics",
      "Body shot patience and setup",
      "Right hand timing off jab",
    ],

    habitsToMimick: [
      "Roll shoulders to make punches glance off",
      "Step diagonally to create hook angles",
      "Target the body 10 rounds, head shot in round 11",
      "Stay calm when opponent rushes",
    ],

    drills: [
      "Shoulder roll on double-end bag",
      "Check hook footwork pattern",
      "Body shot ladder: jab-jab body-hook body",
      "Counter right hand timing on mitts",
    ],

    weaknesses: [
      "Lost points to pure movers like Bivol",
      "Southpaw angles can disrupt his counter timing",
      "Slower output than some elite opponents",
    ],

    famousFights: [
      { fight: "Canelo vs GGG I", year: 2017, note: "War of the decade. Counter vs pressure masterclass." },
      { fight: "Canelo vs Kovalev", year: 2019, note: "Calculated body-head finish." },
      { fight: "Canelo vs Bivol", year: 2022, note: "Rare loss — speed and distance beat him." },
    ],

    relatedKeywords: ["counter", "shoulder roll", "check hook", "body attack", "Mexican style"],
  },

  {
    id: "gennady-golovkin",
    name: "Gennady Golovkin",
    nickname: "GGG",
    country: "🇰🇿",
    weightClass: "Middleweight",
    style: "Soviet Triple G Pressure",
    keyWeapon: "Double jab + right hand",
    identity: "Most feared middleweight of his era. Relentless pressure with nuclear right hand.",
    accent: "#10B981",

    styleIdentity: [
      "High-volume pressure fighter",
      "Double jab setup system",
      "Body work to open the head",
      "Relentless forward momentum",
    ],

    signatureCombos: [
      { name: "GGG Double Jab", steps: ["jab", "jab", "right cross", "left hook body"] },
      { name: "Body Opener", steps: ["right hook body", "left hook body", "right hand head"] },
      { name: "Triple Attack", steps: ["jab", "right hand", "left hook", "right hook"] },
    ],

    movementDNA: {
      type: "Relentless Forward Walker",
      description: "Never stops coming. Uses double jab to set up right hand. High punch output wears down any opponent.",
      tags: ["pressure", "volume", "relentless", "power"],
    },

    whatToStudy: [
      "Double jab setup for right hand",
      "Body shot combinations",
      "High-punch-output maintenance",
      "Closing distance against movement",
    ],

    habitsToMimick: [
      "Throw at least 50 punches every round",
      "Use double jab before every power shot",
      "Always cut off the ring systematically",
      "Never stop moving forward",
    ],

    drills: [
      "Double jab + right hand × 100 reps heavy bag",
      "Volume drill: 30 punches in 15 sec",
      "Ring cutting shadow footwork",
      "Body-head combination on heavy bag",
    ],

    weaknesses: [
      "Pure counters can find him coming in",
      "Elite movers can outpoint him",
      "Headfirst style invites counter left hooks",
    ],

    famousFights: [
      { fight: "GGG vs Canelo I", year: 2017, note: "Brutal firefight. Volume vs counter perfection." },
      { fight: "GGG vs Lemieux", year: 2015, note: "Jaw-dropping KO power on display." },
      { fight: "GGG vs Kell Brook", year: 2016, note: "Right hand dominance from round 1." },
    ],

    relatedKeywords: ["double jab", "pressure", "volume", "right hand", "body attack"],
  },

  {
    id: "floyd-mayweather",
    name: "Floyd Mayweather",
    nickname: "Money / TBE",
    country: "🇺🇸",
    weightClass: "Super Welterweight",
    style: "Philly Shell Master",
    keyWeapon: "Right hand lead + check hook",
    identity: "50-0. The most complete defensive fighter in boxing history. Never hurt. Never beaten.",
    accent: "#94A3B8",

    styleIdentity: [
      "Philly shell defensive genius",
      "Right hand lead ambush",
      "Counter timing perfection",
      "Psychological ring general",
    ],

    signatureCombos: [
      { name: "Shell Counter", steps: ["Philly shell roll", "right hand lead", "left hook"] },
      { name: "Catch Counter", steps: ["catch jab on shoulder", "right hand counter", "pivot exit"] },
      { name: "Check Hook Exit", steps: ["opponent rushes", "step left", "left hook check", "pivot away"] },
    ],

    movementDNA: {
      type: "Defensive Ambush",
      description: "Makes you miss, makes you pay. Shell defense invites punches. Counters are faster than attacks.",
      tags: ["defensive", "counter", "Philly shell", "ambush"],
    },

    whatToStudy: [
      "Philly shell guard position",
      "Shoulder roll mechanics",
      "Right hand lead timing",
      "Check hook footwork",
    ],

    habitsToMimick: [
      "Make opponent miss before throwing",
      "Lead shoulder always protecting chin",
      "Pivot off the wall under pressure",
      "Stay calm no matter what happens",
    ],

    drills: [
      "Shell guard: absorb jabs on shoulder × 100",
      "Right hand lead timing on mitts",
      "Check hook pivot drill with partner",
      "Double-end bag: make it miss, then counter",
    ],

    weaknesses: [
      "Low offensive output can lose rounds",
      "Pure pressure fighters complicate his timing",
      "Requires elite chin and timing — hard to copy",
    ],

    famousFights: [
      { fight: "Mayweather vs Canelo", year: 2013, note: "Shoulder roll vs Mexican pressure. Perfect gameplan." },
      { fight: "Mayweather vs Pacquiao", year: 2015, note: "Right hand leads and pivots shut out southpaw." },
      { fight: "Mayweather vs Hatton", year: 2007, note: "Check hook KO. Shell to death." },
    ],

    relatedKeywords: ["Philly shell", "counter", "defense", "shoulder roll", "check hook"],
  },

  {
    id: "manny-pacquiao",
    name: "Manny Pacquiao",
    nickname: "Pac-Man",
    country: "🇵🇭",
    weightClass: "Welterweight",
    style: "Southpaw Blitz",
    keyWeapon: "Left straight + combination speed",
    identity: "8-division world champion. Southpaw blitz speed that overwhelmed any defence.",
    accent: "#FCD34D",

    styleIdentity: [
      "Southpaw angles",
      "Ultra-high combination speed",
      "Forward pressure with angles",
      "Left straight devastation",
    ],

    signatureCombos: [
      { name: "Pac Blitz", steps: ["step right", "left straight", "right hook", "left hook", "right cross"] },
      { name: "Southpaw Angle", steps: ["step outside lead foot", "left straight", "right hook"] },
      { name: "Speed Rush", steps: ["jab", "left cross", "right hook", "left hook", "left cross"] },
    ],

    movementDNA: {
      type: "Southpaw Whirlwind",
      description: "Steps outside orthodox lead foot. Fires 6-punch combinations at angles. Never predictable.",
      tags: ["southpaw", "speed", "angles", "combination"],
    },

    whatToStudy: [
      "Southpaw angle step (outside lead foot)",
      "Left straight as power shot",
      "High-speed combination flow",
      "Feint step to create opening",
    ],

    habitsToMimick: [
      "Always step to your power side",
      "Link combinations — never throw singles",
      "Use angles to get inside guard",
      "Stay in range — don't retreat, pivot instead",
    ],

    drills: [
      "Left straight + right hook × 50 reps heavy bag",
      "Southpaw angle step drill in shadow",
      "Speed combination: 5 punches in 2 sec on mitts",
      "Southpaw double-end bag",
    ],

    weaknesses: [
      "Right hand counterpunchers time his straight",
      "Pure defensive fighters neutralise his rushes",
      "Later career: chin became vulnerable",
    ],

    famousFights: [
      { fight: "Pacquiao vs De La Hoya", year: 2008, note: "Southpaw speed made Oscar look slow." },
      { fight: "Pacquiao vs Hatton", year: 2009, note: "Left hand KO that shook the world." },
      { fight: "Pacquiao vs Margarito", year: 2010, note: "8-division history. Total domination." },
    ],

    relatedKeywords: ["southpaw", "speed", "combination", "angles", "left straight"],
  },

  {
    id: "roberto-duran",
    name: "Roberto Durán",
    nickname: "Manos de Piedra",
    country: "🇵🇦",
    weightClass: "Lightweight",
    style: "Stone Hands Pressure",
    keyWeapon: "Short right hand + infighting",
    identity: "Hands of Stone. The most natural fighter who ever lived. Street-level instincts, elite pressure.",
    accent: "#DC2626",

    styleIdentity: [
      "Infighting master",
      "Ferocious short puncher",
      "Psychological intimidator",
      "Street-level instinct fighter",
    ],

    signatureCombos: [
      { name: "Stone Entry", steps: ["step inside", "right short", "left hook body", "clinch break right hand"] },
      { name: "Infight Burst", steps: ["jab to close range", "short right", "left hook", "right uppercut"] },
      { name: "Cut Off", steps: ["cut ring angle", "jab", "short right hook", "body left"] },
    ],

    movementDNA: {
      type: "Street Pressure",
      description: "Gets inside immediately. Short, violent punching from close range. Wears opponents down physically and mentally.",
      tags: ["infighting", "pressure", "short punching", "intimidation"],
    },

    whatToStudy: [
      "Getting inside jab range safely",
      "Short right hand mechanics",
      "Clinch-break punching",
      "Ring cutting footwork",
    ],

    habitsToMimick: [
      "Get inside opponent's comfortable range",
      "Use head pressure to disturb balance",
      "Short punches hit harder than looping shots",
      "Intimidate with intensity from the opening bell",
    ],

    drills: [
      "Short uppercut on heavy bag × 3 min",
      "Inside range shadow: stay at clinch distance",
      "Ring cutting drill: chase partner around ring",
      "Body work burst: 10 body shots in 5 seconds",
    ],

    weaknesses: [
      "No Más — lacked motivation against Leonard II",
      "Vulnerable to speed at long range",
      "Weight management issues at higher classes",
    ],

    famousFights: [
      { fight: "Durán vs Leonard I", year: 1980, note: "Broke Leonard's rhythm with pressure and infighting." },
      { fight: "Durán vs DeJesus", year: 1972, note: "Pure instinct. Lightweight destruction." },
      { fight: "Durán vs Moore", year: 1983, note: "Power and will. Hands of Stone at his best." },
    ],

    relatedKeywords: ["infighting", "short punch", "pressure", "body attack", "ring cutting"],
  },
];

export function getFighter(id) {
  return FIGHTERS.find((f) => f.id === id) || null;
}
