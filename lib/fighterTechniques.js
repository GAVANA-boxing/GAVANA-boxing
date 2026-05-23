// Fighter-specific technique lessons.
// Each lesson: fighter's unique mechanic + transferable coach cue + drill steps.
// teachingBlocks types: "FOOT" | "WEIGHT" | "ANGLE" | "GUARD"
// difficulty: "beginner" | "intermediate" | "advanced"

export const FIGHTER_TECHNIQUES = {
  "mike-tyson": [
    {
      title: "Peekaboo Entry",
      difficulty: "intermediate",
      teachingBlocks: [
        { type: "FOOT",   value: "Lead foot anchors — rear foot drives the slip step in" },
        { type: "WEIGHT", value: "Rear hip loads during the slip — hook is pre-charged" },
        { type: "ANGLE",  value: "Slip outside their jab line, enter at 45° to their body" },
        { type: "GUARD",  value: "High guard stays active throughout entry — no drop" },
      ],
      explanation:
        "Tyson slips the opponent's jab to the outside while stepping in simultaneously, transitioning from defensive bob to explosive hook. The guard stays high throughout, protecting the temple during the gap between slip and strike.",
      coachNotes:
        "When you slip a jab, your weight naturally loads the rear hip. That's your hook already charged. Don't waste it — slip and fire are one motion, not two.",
      drillSteps: [
        "Shadow: imagine the incoming jab, slip outside left, feel weight shift to rear hip",
        "Partner: slow jabs incoming — slip outside 10 reps each side, guard stays high",
        "Add counter: immediately after the slip, release left hook to body — don't reach for the head",
        "Speed build: partner throws fight-speed jabs, you slip and counter without telegraphing",
      ],
    },
    {
      title: "Weight Load & Explode",
      difficulty: "beginner",
      teachingBlocks: [
        { type: "FOOT",   value: "Rear foot is the power base — never lifts before the hook lands" },
        { type: "WEIGHT", value: "Full load onto rear foot → hip fire → shoulder → fist" },
        { type: "ANGLE",  value: "Straight entry — power comes from vertical axis rotation" },
        { type: "GUARD",  value: "Lead hand up while loading — don't drop to cock the hook" },
      ],
      explanation:
        "Before every Tyson hook, weight shifts fully onto the rear foot — the 'load'. Hips then fire like a spring, driving the shoulder through the punch. The fist arrives after the hip, not before.",
      coachNotes:
        "The punch is already done before your arm moves. Hip fires → shoulder follows → arm is the delivery vehicle. Practice the sequence: foot → hip → shoulder → fist.",
      drillSteps: [
        "Stand square, rock weight from lead to rear foot and feel the hip shift fully",
        "Add shoulder rotation to the rear-weight position — notice it naturally winds the hook",
        "Shadow: throw hooks from this loaded position, feel the explosion upward and across",
        "Heavy bag: intentional weight load before each hook — pause 1 sec on load, then fire",
      ],
    },
    {
      title: "Short Right Inside",
      difficulty: "advanced",
      teachingBlocks: [
        { type: "FOOT",   value: "Chest-to-chest range — weight centered, no room to step" },
        { type: "WEIGHT", value: "Body rotation drives the punch — arm extension is minimal" },
        { type: "ANGLE",  value: "Vertical fist straight down the middle — no arc, no telegraphing" },
        { type: "GUARD",  value: "Lead hand guides/controls space while punching hand drives" },
      ],
      explanation:
        "Inside clinch range, Tyson throws compact vertical-fist right hands straight down the middle. At close range a full cross has no room to develop — the short right uses body rotation and elbow alignment instead of extension.",
      coachNotes:
        "When you're inside and the cross has no room, rotate the fist vertical and drive through the elbow. Think 'push with your back, not your arm.'",
      drillSteps: [
        "Get in close stance, practice short vertical-fist rights from hip height",
        "Focus on shoulder driving into the punch — the arm doesn't extend, the body does",
        "Clinch bag: get chest-to-bag, throw short rights from body rotation only",
        "Partner pads in close: safely practice the distance where only short shots land",
      ],
    },
  ],

  "muhammad-ali": [
    {
      title: "Lead Foot Pivot Exit",
      difficulty: "intermediate",
      teachingBlocks: [
        { type: "FOOT",   value: "Lead foot ball is the pivot post — rear foot pushes it" },
        { type: "WEIGHT", value: "Rear foot pushes, weight transfers through the pivot arc" },
        { type: "ANGLE",  value: "Exit 45–90° to the side — out of the counter line" },
        { type: "GUARD",  value: "Guard maintained during pivot, resets on the new angle" },
      ],
      explanation:
        "After landing a jab, Ali pivots on the lead foot, rotating 45–90° to create a new angle. This puts him to the opponent's side where they cannot immediately counter. The pivot is powered by pushing off the rear foot.",
      coachNotes:
        "After your jab lands, your lead foot is already planted — use it as a post. Push off the rear foot, swivel on the ball of the lead foot. You exit the danger zone automatically.",
      drillSteps: [
        "Shadow: throw jab, then pivot 45° left on lead foot ball — practice until completely smooth",
        "Floor tape: jab from A, land at B (45° off the original line), make it consistent",
        "Pivot to attack: jab, pivot, immediate left hook from the new angle",
        "Partner: they throw a single jab, you jab-and-exit 5 reps — they cannot reach your new position",
      ],
    },
    {
      title: "Float — Toes, Not Heels",
      difficulty: "beginner",
      teachingBlocks: [
        { type: "FOOT",   value: "Weight permanently on balls of feet — heels never fully plant" },
        { type: "WEIGHT", value: "Slight forward bias — never heel-heavy or leaning back" },
        { type: "ANGLE",  value: "Zero re-weight delay enables instant direction change" },
        { type: "GUARD",  value: "Relaxed guard — tension kills foot speed" },
      ],
      explanation:
        "Ali's weight is always forward on the balls of the feet. This allows instant direction change. Heel-weighted stance requires a re-weight before any movement — that delay is what opponents time.",
      coachNotes:
        "Stand flat-footed and try to take a quick step. Now stand on balls of feet and try. Feel the difference? That's what Ali had over everyone. Forward weight = zero reaction delay.",
      drillSteps: [
        "Standing hold: rise onto balls of feet for 60 seconds, feel the calf and thigh engagement",
        "Shadow with awareness: never let heels fully touch during active movement phases",
        "Lateral shuffle: 3 left, 3 right, no pause between direction changes",
        "Jab series from float: maintain toe-weight throughout a 20-jab flurry",
      ],
    },
    {
      title: "Snap & Retract",
      difficulty: "beginner",
      teachingBlocks: [
        { type: "FOOT",   value: "Footwork stays active — no weight commitment on a jab" },
        { type: "WEIGHT", value: "Jab fires without forward weight transfer — stay ready to move" },
        { type: "ANGLE",  value: "Punch travels equal distance out and back — not one-way" },
        { type: "GUARD",  value: "Guard reforms before opponent can counter — retraction is defense" },
      ],
      explanation:
        "Ali's punches snap back to guard faster than most fighters throw. This prevents counter-punching during recovery, and the recoil energy from retraction adds speed to the next punch.",
      coachNotes:
        "Think of every punch as a round trip, not a one-way trip. Train the retraction as hard as the extension. If you're slow returning, your guard is open. Fast retraction = built-in counter defense.",
      drillSteps: [
        "Speed bag: focus on retraction speed matching extension speed — they should be equal",
        "Shadow: jab out, count 1-second return to guard — make return equal to extension time",
        "Double-end bag: rebound timing forces fast retraction — use this tool daily",
        "Wall touch: touch wall with jab hand, retract before count '2' — measures reflex speed",
      ],
    },
  ],

  "naoya-inoue": [
    {
      title: "High-Low Switch",
      difficulty: "intermediate",
      teachingBlocks: [
        { type: "FOOT",   value: "Mid-range, both feet stable — switching levels, not distance" },
        { type: "WEIGHT", value: "Hip rotation drives each punch independently" },
        { type: "ANGLE",  value: "Head shot sets guard high, body shot takes the exposed angle" },
        { type: "GUARD",  value: "Watch opponent's elbow lift — that's your entry signal" },
      ],
      explanation:
        "Inoue throws a visible jab to the head, forcing the guard up. The moment the opponent's elbows rise, the body is exposed. His follow-up drops to the liver or solar plexus — two zones now unguarded.",
      coachNotes:
        "Guards cannot be everywhere at once. Make them commit to one zone, then attack the other. Head threat opens body. Body threat opens head. Practice both switches until the decision is automatic.",
      drillSteps: [
        "Mitt drill: coach calls 'high' or 'low' mid-combination — boxer must switch targets instantly",
        "Double jab: first jab to head, watch opponent guard react, second jab drops to body",
        "Shadow: every combination must switch levels at least once",
        "Heavy bag: tape high and low zones, alternate within each combination",
      ],
    },
    {
      title: "Counter Right Hand",
      difficulty: "advanced",
      teachingBlocks: [
        { type: "FOOT",   value: "Slip shifts rear foot outside — creates counter platform" },
        { type: "WEIGHT", value: "Slip weight shifts → weight snaps back to power the counter" },
        { type: "ANGLE",  value: "Slip outside their jab, right hand fires through the center lane" },
        { type: "GUARD",  value: "Present low guard to bait — tighten to slip before punching" },
      ],
      explanation:
        "Inoue baits the jab by presenting a slightly low guard. The moment the jab commits, he slips outside and returns his right hand through the open center lane — catching the opponent mid-extension.",
      coachNotes:
        "Slip BEFORE the punch arrives, not as it arrives. The timing gap creates safety. Practice until the slip is automatic — the counter is the easy part once the slip is timed.",
      drillSteps: [
        "Partner drill: slow jabs incoming, boxer slips outside 20 reps — counter not yet added",
        "Add counter: slip and immediately return right hand — partner absorbs on guard",
        "Visualize the opening: when they extend, the center opens — your right hand goes there",
        "Speed progression: slow × 10, medium × 10, full speed × 10 over multiple sessions",
      ],
    },
    {
      title: "Compact Hook, Close Range",
      difficulty: "intermediate",
      teachingBlocks: [
        { type: "FOOT",   value: "Inside range — no stepping, body rotates on fixed feet" },
        { type: "WEIGHT", value: "Short hip burst — no full body uncoiling needed" },
        { type: "ANGLE",  value: "Elbow locked at 90°, body turns the arc — arm just follows" },
        { type: "GUARD",  value: "Lead hand controls opponent's space while hook loads" },
      ],
      explanation:
        "Inside range, Inoue generates hook power without full arm extension. Force comes from a short hip burst with the elbow fixed at 90°. The punch travels 12–15cm but carries full rotational power from the trunk.",
      coachNotes:
        "Short hooks are a body rotation skill, not an arm skill. Fix elbow at 90°, body turns, fist follows. Imagine your torso is the engine and your arm is simply attached to it.",
      drillSteps: [
        "Stand 3 inches from heavy bag, throw left hooks using only hip and shoulder rotation",
        "Elbow must stay at 90° — if it opens, you're using arm not body",
        "Clinch position: from body clinch, rotate trunk and throw compact left hooks",
        "Compare power: full hook vs. compact hook on the bag — bag travel should be similar",
      ],
    },
  ],

  "dmitry-bivol": [
    {
      title: "Jab Rhythm & Reset",
      difficulty: "intermediate",
      teachingBlocks: [
        { type: "FOOT",   value: "Orthodox, mobile between jabs — step forward with each" },
        { type: "WEIGHT", value: "Light weight on lead foot — jab weight never fully commits" },
        { type: "ANGLE",  value: "Same jab line, different timing — rhythm not angle is the variable" },
        { type: "GUARD",  value: "Guard resets fully between rhythm jabs — never drop between" },
      ],
      explanation:
        "Bivol establishes a predictable jab rhythm for 2–3 punches, training the opponent's defense to expect it. Then he changes timing — throwing the next jab slightly late or early — landing as the opponent resets their guard.",
      coachNotes:
        "Rhythm is a trap. Establish a beat, then break it once. The opponent's body memorizes the rhythm and responds automatically. Be one punch off-pattern when they're least ready.",
      drillSteps: [
        "Count jabs: 1-2-3 then PAUSE (guard drops), then 4th jab lands",
        "Speed variation: slow-slow-fast or fast-fast-SLOW — vary without telegraphing",
        "Double jab: throw first, let it land, feel opponent react, THEN throw second at new guard position",
        "Partner: call which rhythm to break, practice adapting mid-combination",
      ],
    },
    {
      title: "Guard Recovery Movement",
      difficulty: "beginner",
      teachingBlocks: [
        { type: "FOOT",   value: "Lateral step accompanies every guard reset — always moving" },
        { type: "WEIGHT", value: "Step left or right — direction doesn't matter, moving does" },
        { type: "ANGLE",  value: "Exit laterally, not backward — stay in range while recovering" },
        { type: "GUARD",  value: "Arms return to guard during the step, not after it" },
      ],
      explanation:
        "After every combination, Bivol moves laterally while returning to guard. He never stands still to reset. This makes him a moving target during the vulnerable recovery phase, preventing counters while his arms are returning.",
      coachNotes:
        "Build the habit of moving left OR right as the last punch retracts. Never be in the same spot after a combination. Footwork is the period at the end of every sentence.",
      drillSteps: [
        "Shadow: throw 3-punch combo, then mandatory 2 steps lateral before stopping",
        "Heavy bag: hit the bag, push off, take 2–3 steps while guard resets",
        "Partner: after each combination, move before partner can touch you",
        "Timer drill: 3 seconds hitting, 1 second moving — never be stationary during the off-second",
      ],
    },
    {
      title: "Optimal Range Discipline",
      difficulty: "intermediate",
      teachingBlocks: [
        { type: "FOOT",   value: "Footwork calibrates range — step in if too far, back if too close" },
        { type: "WEIGHT", value: "Balanced weight enables instant recalibration in either direction" },
        { type: "ANGLE",  value: "Stay on center line at optimal distance — no chasing" },
        { type: "GUARD",  value: "Active guard at all times — range control removes the need to slip" },
      ],
      explanation:
        "Bivol maintains the exact distance where both his jab and cross land with full extension. He uses footwork to continuously recalibrate — never chasing, never retreating more than necessary.",
      coachNotes:
        "Find your optimal range: extend your jab. Where it just fully extends is your range. Train footwork to maintain that distance automatically. When opponents close, step back. When they back up, step in.",
      drillSteps: [
        "Range finder: extend jab fully, mark where fist lands — use that as your floor marker",
        "Partner: maintain optimal range while they try to change distance for 2 minutes",
        "Small room drill: stay at jab range — no wild hooks, control the gap throughout",
        "Footwork circuit: shadow box an imaginary opponent at constant distance for 3 min rounds",
      ],
    },
  ],

  "vasyl-lomachenko": [
    {
      title: "Outside Foot Entry",
      difficulty: "intermediate",
      teachingBlocks: [
        { type: "FOOT",   value: "Right foot plants outside their lead foot — the entry IS the step" },
        { type: "WEIGHT", value: "Weight transfers naturally onto outside foot on entry" },
        { type: "ANGLE",  value: "Outside foot closes their cross angle, opens center lane for left straight" },
        { type: "GUARD",  value: "Guard maintained during the placement step — don't drop to step" },
      ],
      explanation:
        "Lomachenko steps his right foot outside the opponent's lead foot before engaging. This closes the opponent's most dangerous hand while opening a clear center lane for his left straight.",
      coachNotes:
        "Foot position is punch permission. Outside foot = left straight is clear. Inside foot = you're in their danger zone. Place that foot first before throwing anything — one placement gives you the best punch and removes theirs.",
      drillSteps: [
        "Against partner, practice only stepping outside their foot 20 reps before any punch",
        "Add the punch: outside foot placement, then left straight down the center",
        "Partner check: after foot placement, partner tries their right cross — it should miss",
        "Speed entry: from distance, explosive single step to outside position, immediate left straight",
      ],
    },
    {
      title: "Angle Change Mid-Combination",
      difficulty: "advanced",
      teachingBlocks: [
        { type: "FOOT",   value: "Lead foot pivots between punches — this creates the angle change" },
        { type: "WEIGHT", value: "Weight shifts with each pivot to maintain power at new angle" },
        { type: "ANGLE",  value: "Each punch in the combination arrives from a different direction" },
        { type: "GUARD",  value: "Guard maintained during pivots — punching doesn't stop guard" },
      ],
      explanation:
        "Lomachenko changes body angle while throwing — he doesn't plant and punch from one position. Each punch in the combination comes from a slightly different angle, making defense impossible because guards can only face one direction.",
      coachNotes:
        "Throw a 1-2 but pivot your lead foot 45° between the jab and the cross. The cross now comes from a completely different angle. One combination, two directions — the opponent needs two different guards.",
      drillSteps: [
        "Shadow: 1-2 with 15° pivot between punches — practice until the pivot feels natural",
        "Heavy bag: hit from front, pivot 45°, hit again, pivot 90° — same combination from 3 angles",
        "Slow-motion partner: punch from 5 different positions around them",
        "Speed build: 1 minute of constant angle changes with guard maintained — never punch twice from same spot",
      ],
    },
    {
      title: "Direction Change Feint",
      difficulty: "advanced",
      teachingBlocks: [
        { type: "FOOT",   value: "Commit to one direction, read opponent weight load, immediately reverse" },
        { type: "WEIGHT", value: "Begin weight loading in feint direction — then snap back" },
        { type: "ANGLE",  value: "Feint line and real line should be 90° apart minimum" },
        { type: "GUARD",  value: "Guard stays up during feints — don't drop arms while misdirecting" },
      ],
      explanation:
        "Lomachenko begins moving in one direction, reads the opponent's weight shift, then instantly reverses. The opponent's feet are already committed to the wrong direction — they cannot cover the new angle in time.",
      coachNotes:
        "Movement creates commitment. When an opponent chases you left, their weight loads left. The moment you see that weight load, go right. Their own momentum becomes your opening.",
      drillSteps: [
        "Solo: shuffle left 3 steps, immediately right 3 — 50 reps, no hesitation between",
        "Add body language: lean left before going right, sell the direction before reversing",
        "Partner: they must follow your movement, read when their weight commits, then change direction",
        "Apply to sparring: feint and move first — create openings through misdirection before punching",
      ],
    },
  ],

  "canelo-alvarez": [
    {
      title: "Shoulder Roll Defense",
      difficulty: "intermediate",
      teachingBlocks: [
        { type: "FOOT",   value: "Weight shifts to rear foot simultaneously with shoulder roll" },
        { type: "WEIGHT", value: "Rear weight is the foundation — no rear weight = no roll" },
        { type: "ANGLE",  value: "Shoulder presents rounded surface — punch slides off outward" },
        { type: "GUARD",  value: "Right hand by jaw, left arm diagonal — both active at once" },
      ],
      explanation:
        "Canelo's rear shoulder rotates forward as a straight punch arrives, deflecting it outward off the rounded surface. Weight shifts to the rear foot simultaneously, taking him offline. The elbow tucks to protect ribs from the same punch if it drops.",
      coachNotes:
        "The shoulder roll is weight management: shift rear, shoulder turns, nothing to hit. When timed correctly, the defender is always outside the punch — safest position in boxing.",
      drillSteps: [
        "Mirror: practice rear shoulder forward roll without incoming punch — feel the natural mechanics",
        "Partner light touch: partner presses palm toward your face, roll so shoulder deflects",
        "Always combine with weight shift: roll must be accompanied by rear-foot transfer",
        "Add counter: shoulder roll, feel the cross land on shoulder, return short left hook from rolled position",
      ],
    },
    {
      title: "Duck & Short Hook Counter",
      difficulty: "advanced",
      teachingBlocks: [
        { type: "FOOT",   value: "Lead foot stays planted as anchor during the duck" },
        { type: "WEIGHT", value: "Duck loads the left hip — hook is pre-charged by the duck itself" },
        { type: "ANGLE",  value: "Head moves offline (not just down) — 45° to the left" },
        { type: "GUARD",  value: "Duck is defensive cover AND hook setup simultaneously" },
      ],
      explanation:
        "When an opponent extends a jab, Canelo ducks just below the punch and from that low position fires a short lead hook into the exposed ribs or chin. The duck takes him offline while naturally loading the left hook.",
      coachNotes:
        "The duck sets up the counter automatically. When you duck properly — head offline, not just bent forward — your left hip naturally loads. The hook is half-done by the duck itself.",
      drillSteps: [
        "Solo: practice the duck alone — head must move offline (left), not just downward",
        "Partner press: partner extends jab slowly, you duck and feel which hook naturally follows",
        "Add counter: duck, pause to confirm position, then release left hook to marked target",
        "Speed build: reduce the pause over sessions until duck-and-counter is one fluid movement",
      ],
    },
    {
      title: "Body Pattern Accumulation",
      difficulty: "beginner",
      teachingBlocks: [
        { type: "FOOT",   value: "Mid-range, stable base — same footwork for all body shots" },
        { type: "WEIGHT", value: "Full hip rotation into each body shot — real force, not taps" },
        { type: "ANGLE",  value: "Jab body, cross body, hook body — same range, pattern not power" },
        { type: "GUARD",  value: "Maintain head protection between body shots — don't drop guard" },
      ],
      explanation:
        "Canelo throws body shots in patterns, not individual punches. Three or four body shots condition the opponent's guard to protect the body — then the pattern breaks upward to the exposed head. Body shots must be real to force genuine guard response.",
      coachNotes:
        "Body shots are investments. Each one forces the opponent to think about their ribs. By punch 5 or 6, their guard drifts down automatically. Commit to real body shots — the brain ignores fake threats.",
      drillSteps: [
        "Heavy bag: alternate left-right body shots 20 reps, hip rotation into each one",
        "Pattern set: jab body, cross body, hook body — then switch last punch to head spontaneously",
        "Partner mitts: 4 body calls then 1 surprise head call — boxer transitions instantly",
        "Sparring intent: attack the body for a full round — head punches only as the final switch",
      ],
    },
  ],

  "gennady-golovkin": [
    {
      title: "Triple Jab Setup",
      difficulty: "beginner",
      teachingBlocks: [
        { type: "FOOT",   value: "Step forward with each jab — close distance progressively" },
        { type: "WEIGHT", value: "Forward pressure adds force to each successive jab" },
        { type: "ANGLE",  value: "Straight jab line — hook follows the natural shoulder position" },
        { type: "GUARD",  value: "High guard between jabs — opponent tries to counter in the gaps" },
      ],
      explanation:
        "GGG throws three jabs in sequence, each edging closer and disrupting rhythm. By the third jab the opponent is reactive and backing up, leaving a gap for the hook that follows naturally.",
      coachNotes:
        "Three jabs teach the opponent to defend jabs. The hook comes from nowhere because they're still solving for jab three. Each jab must be real — telegraphed jabs teach opponents when to expect the hook.",
      drillSteps: [
        "Shadow: triple jab rhythm until it flows — one beat between each, stepping forward",
        "Heavy bag: triple jab with forward pressure, move into the bag on each jab",
        "Partner: triple jab, then partner signals when to throw hook — builds reactive hook timing",
        "Sparring: commit to triple jab sets, resist switching to cross early, let the setup build",
      ],
    },
    {
      title: "Systematic Ring Cut",
      difficulty: "intermediate",
      teachingBlocks: [
        { type: "FOOT",   value: "Diagonal steps — 45° forward left, 45° forward right, alternating" },
        { type: "WEIGHT", value: "Balanced weight enables equal comfort cutting either direction" },
        { type: "ANGLE",  value: "Move toward where they're going, not where they are" },
        { type: "GUARD",  value: "Active guard while cutting — never drop guard during footwork" },
      ],
      explanation:
        "GGG angles his steps to cut off escape routes, reducing the ring diameter with each exchange. The footwork is diagonal — one step left angled forward, then right angled forward, herding toward the corner.",
      coachNotes:
        "Cutting the ring is about reducing options, not closing distance. Move at 45° angles toward where the opponent wants to go — not toward where they are. You arrive before them.",
      drillSteps: [
        "Floor exercise: mark ring corners, move opponent toward one corner using only diagonal steps",
        "Shadow: 45° forward angling left and right alternately while staying on center line",
        "Partner: they try to circle out, you cut off using only angled footwork — no grabbing",
        "Rope drill: force partner to ropes using only positioning and footwork over 2-minute rounds",
      ],
    },
    {
      title: "In-Close Right Hand",
      difficulty: "advanced",
      teachingBlocks: [
        { type: "FOOT",   value: "Step inside at 45° angle — access the right hand lane" },
        { type: "WEIGHT", value: "Body weight drives the compact right — shoulder forward through punch" },
        { type: "ANGLE",  value: "Down the middle, compact — elbow drives punch, not arm extension" },
        { type: "GUARD",  value: "Lead hand controls opponent's guard position during entry" },
      ],
      explanation:
        "GGG steps inside at 45° (outside their jab line), compresses the distance, then fires a short right hand with elbow driving through — not a full extension cross, but a driving punch with body weight behind it.",
      coachNotes:
        "Inside range, extension equals no power. The in-close right hand is a driving motion — elbow forward, body rotates into it. Throw your shoulder through the punch rather than extending your arm.",
      drillSteps: [
        "Heavy bag: chest within 6 inches, throw right hands from body rotation only",
        "Compare power: full cross vs. compact right — on the bag, both should move it equally",
        "Step-in drill: start at mid range, one step inside, immediately compact right — no pause",
        "Partner pads in close: practice stopping inside their jab range and throwing compact right safely",
      ],
    },
  ],

  "floyd-mayweather": [
    {
      title: "Philly Shell Position",
      difficulty: "intermediate",
      teachingBlocks: [
        { type: "FOOT",   value: "Orthodox stance, weight slightly to rear — ready to roll or exit" },
        { type: "WEIGHT", value: "Rear weight bias enables shoulder roll and lateral exits" },
        { type: "ANGLE",  value: "Right shoulder angled forward presents the deflection surface" },
        { type: "GUARD",  value: "Right hand by jaw, left arm diagonal, shoulder protects simultaneously" },
      ],
      explanation:
        "Mayweather's right hand rests against his jaw, left arm angles diagonally across the body to intercept body shots, right shoulder naturally deflects straight punches. All three guards work simultaneously from one relaxed position.",
      coachNotes:
        "The Philly Shell is not a waiting posture — it's a counter-punching position. The shoulder deflects a punch, your arm is already at their guard, your counter fires before they finish extending.",
      drillSteps: [
        "Mirror: hold Philly Shell position for 60 seconds — right hand by jaw, left arm diagonal, shoulder forward",
        "Walk one full round in Shell position — feel what's protected without anything incoming",
        "Partner light touch: partner taps shoulder area, practice rolling — let shoulder absorb",
        "Counter from Shell: partner jabs, shoulder deflects, immediate left hand return — no cocking",
      ],
    },
    {
      title: "Catch & Counter",
      difficulty: "advanced",
      teachingBlocks: [
        { type: "FOOT",   value: "Footwork stays active during catch — don't plant both feet" },
        { type: "WEIGHT", value: "No weight commitment during catch — stay mobile throughout" },
        { type: "ANGLE",  value: "Catch guides their jab offline, counter fires through the center" },
        { type: "GUARD",  value: "Catch hand guides, other hand counters — both active simultaneously" },
      ],
      explanation:
        "Mayweather's rear hand catches the jab — not blocks it. The catch absorbs force and guides the jab offline, his right counter fires through the opening before the opponent's guard has reformed. Catch and counter overlap — they are not sequential.",
      coachNotes:
        "The catch-and-counter is timing, not strength. You're redirecting the punch, not stopping it. Practice until the counter begins before the catch finishes — the overlap is the key. Sequential is too slow.",
      drillSteps: [
        "Solo: practice catching motion — palm facing opponent, turn inward to 'catch' imaginary jab",
        "Partner: slow jabs, catch with rear hand 20 reps — focus on guide, not block",
        "Add counter: catch the jab, right hand counter simultaneously — practice until one motion",
        "Speed build: slow × 10, medium × 10, full speed × 10 over multiple sessions",
      ],
    },
    {
      title: "Lead Right Disruption",
      difficulty: "intermediate",
      teachingBlocks: [
        { type: "FOOT",   value: "Orthodox, step-out with lead right for range extension" },
        { type: "WEIGHT", value: "Lead weight transfer adds reach without telegraphing the punch" },
        { type: "ANGLE",  value: "Lead right arrives from unexpected lead-hand position — no windup" },
        { type: "GUARD",  value: "Shell position enables instant counter after lead right lands" },
      ],
      explanation:
        "From orthodox stance, Mayweather shoots his lead right — not as a power punch but as a timing disruptor. It arrives before opponents expect a power punch from the lead hand, breaking their rhythm and forcing a guard adjustment.",
      coachNotes:
        "The lead right is a chess move, not a knockout punch. When opponents are too comfortable in their rhythm, this resets everything. Use it when you want to change the flow of the round.",
      drillSteps: [
        "Shadow: practice lead right from Shell — fast, compact, and immediate, no loading",
        "Heavy bag: throw lead right as first punch (not jab), feel the unusual entry angle",
        "Partner: use lead right as a 'reset' punch whenever their combination flow gets comfortable",
        "Follow-up: lead right opens the left side — immediately follow with conventional combinations",
      ],
    },
  ],

  "manny-pacquiao": [
    {
      title: "Southpaw Foot Position",
      difficulty: "beginner",
      teachingBlocks: [
        { type: "FOOT",   value: "Right foot steps outside opponent's lead foot before engaging" },
        { type: "WEIGHT", value: "Weight transfers naturally onto outside right foot on entry" },
        { type: "ANGLE",  value: "Outside foot closes their cross angle, opens center lane for left straight" },
        { type: "GUARD",  value: "Maintain guard during the placement step — don't drop to step" },
      ],
      explanation:
        "Pacquiao's right foot steps outside the opponent's lead foot before engaging. This closes their right cross while opening a direct lane for his left straight through the center — the highest-percentage punch in southpaw boxing.",
      coachNotes:
        "Foot position is punch permission. Outside foot = left straight is clear. Inside foot = you're in their danger zone. Place that foot first before throwing anything — one placement gives you the best punch and removes theirs.",
      drillSteps: [
        "Against partner, practice only stepping outside their foot 20 reps before any punch",
        "Add the punch: outside foot placement, then left straight down the center",
        "Partner check: after foot placement, partner tries their right cross — it should miss",
        "Speed entry: from distance, explosive single step to outside position, immediate left straight",
      ],
    },
    {
      title: "Explosive Zero-Step",
      difficulty: "intermediate",
      teachingBlocks: [
        { type: "FOOT",   value: "No prep step — first movement is the real movement at full speed" },
        { type: "WEIGHT", value: "No preliminary weight loading before entry — no observable tell" },
        { type: "ANGLE",  value: "Entry angle established by foot placement, not forward body lean" },
        { type: "GUARD",  value: "Guard up from stillness — don't drop arms before explosion" },
      ],
      explanation:
        "Pacquiao's first movement is explosive — he never telegraphs an entry with a preliminary weight shift. He's already in full motion at full speed on the first movement, removing the observable tell that opponents use to time counters.",
      coachNotes:
        "Most fighters take a 'prep step' before entering — a small shuffle before the real movement. This telegraph is what opponents read. Practice explosive first-step from complete stillness. The first movement must be at fight speed.",
      drillSteps: [
        "Reactive sprint: start stationary, partner signals, explode to heavy bag at full speed immediately",
        "Shadow from freeze: stand completely still, then explode into full combination — no prep movement",
        "Film yourself: watch for small weight shifts before entries — eliminate any observable tells",
        "Footwork ladder: explosive first step in and out of ladder — trains explosive neural response",
      ],
    },
    {
      title: "Southpaw High-Low Left",
      difficulty: "intermediate",
      teachingBlocks: [
        { type: "FOOT",   value: "Stable base — both shots fired from same foot position" },
        { type: "WEIGHT", value: "Hip rotation drives both — weight shifts with each independently" },
        { type: "ANGLE",  value: "First left high angle, second left drops to body angle below guard" },
        { type: "GUARD",  value: "Watch their guard response — elbow rising is your entry signal" },
      ],
      explanation:
        "Pacquiao throws his left to the head, observes the guard rising, and immediately drops the second left to the body. The sequence happens faster than a guard can adjust — the nervous system can't retract a guard already in motion.",
      coachNotes:
        "The guard responds to threats, not locations. Make the head threat obvious, then punish the body. Only works if the head punch is genuine — a fake doesn't trigger a real guard response.",
      drillSteps: [
        "Double left drill: 1st left to head level, pause, 2nd left drops to body level",
        "Speed build: reduce the pause between head and body lefts over sessions until seamless",
        "Watch the guard: ask partner to show their guard — notice how long it takes to drop from high to low",
        "Heavy bag: tape two zones, practice left-high then left-low as one combination",
      ],
    },
  ],

  "roberto-duran": [
    {
      title: "Inside Head Control",
      difficulty: "advanced",
      teachingBlocks: [
        { type: "FOOT",   value: "Inside range — both fighters close, weight centered and grounded" },
        { type: "WEIGHT", value: "Stable body weight in clinch — use weight for control, not movement" },
        { type: "ANGLE",  value: "Lead hand guides head into alignment for the punching hand's angle" },
        { type: "GUARD",  value: "Control hand is an active tool, not passive — it guides and blocks" },
      ],
      explanation:
        "Duran uses his lead hand to control the opponent's head position before throwing inside punches. One hand guides, the other hits. The controlling hand prevents the opponent from creating angles to escape and aligns them for the punching hand.",
      coachNotes:
        "Head control is leverage. When you control where someone's head faces, you control what they can see and where they can hit. The control hand is more valuable than the punch in close range.",
      drillSteps: [
        "Partner drill: place lead hand on partner's shoulder (light pressure) before throwing body shot",
        "Clinch position: establish head control, create body shot opening, safely exit",
        "Shadow: throw all inside combinations with one hand as 'guide' and one as 'hitter'",
        "3-beat sequence: lead hand touches → body rotates → punching hand follows",
      ],
    },
    {
      title: "Rhythm Disruption",
      difficulty: "intermediate",
      teachingBlocks: [
        { type: "FOOT",   value: "Footwork rhythm varies with punch rhythm — unpredictable on both" },
        { type: "WEIGHT", value: "Weight loading speed varies — sometimes explosive, sometimes deliberate" },
        { type: "ANGLE",  value: "Same angle, different timing — confusion comes from when, not where" },
        { type: "GUARD",  value: "Guard timing also varies — don't be readable from any position" },
      ],
      explanation:
        "Duran deliberately varies punch timing — sometimes faster, sometimes with a hesitation — creating an off-beat pattern that disrupts opponents' counter-timing. Consistent rhythm is predictable. Duran makes each punch arrival time unpredictable.",
      coachNotes:
        "Rhythm is a double-edged weapon. Your rhythm helps you land combinations. But predictable rhythm helps opponents counter. Learn to throw the same combinations at different speeds within the same round.",
      drillSteps: [
        "Metronome drill: punch to a beat, then deliberately fall off by half a count",
        "Shadow with counts: 1-2-3 at normal speed, then 1-2...3 with pause, then 1...2-3 rushing",
        "Heavy bag: 1-minute rounds alternating fast combinations and slow deliberate single shots",
        "Partner: they try to counter-time your punches — vary rhythm until they can't predict",
      ],
    },
    {
      title: "Pressure Walk-In",
      difficulty: "intermediate",
      teachingBlocks: [
        { type: "FOOT",   value: "Continuous forward steps — never retreat, never pause mid-advance" },
        { type: "WEIGHT", value: "Forward weight bias throughout — absorb on forward lean" },
        { type: "ANGLE",  value: "Walk straight at them — forward pressure forces back into ropes" },
        { type: "GUARD",  value: "Chin down, forehead forward — take shots on the hardest skull bone" },
      ],
      explanation:
        "Duran walks through jabs using forward lean and chin-down head position to absorb on the forehead, not the chin. Constant forward pressure means the opponent can never fully load a punch — he's always arriving before they reset.",
      coachNotes:
        "Walking through punches requires correct head position — chin down, forehead forward. The forehead is hard. The chin is not. Take shots on the hardest part of your skull while moving forward.",
      drillSteps: [
        "Walk drill: chin down, forehead forward — walk toward partner who throws light jabs on forehead",
        "Pressure rounds: spend one full sparring round walking forward without stopping regardless of incoming",
        "Head position check: film yourself walking in — chin must be down, head tilted not upright",
        "Alternative to slipping: when you'd normally slip, bend knees slightly and lean in — different response, same threat",
      ],
    },
  ],
};
