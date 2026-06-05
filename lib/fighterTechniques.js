// Fighter-specific technique lessons.
// Each lesson teaches the fighter's unique mechanic + universal coaching principle.
// teachingBlocks types: "FOOT" | "WEIGHT" | "ANGLE" | "GUARD"
// difficulty: "beginner" | "intermediate" | "advanced"

export const FIGHTER_TECHNIQUES = {

  // ── Mike Tyson ──────────────────────────────────────────────────────────────
  "mike-tyson": [
    {
      title: "Peekaboo Entry",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Lead foot anchors the slip; rear foot drives the step inward" },
        { type: "WEIGHT", value: "Rear hip loads on the slip — hook is already pre-charged" },
        { type: "ANGLE",  value: "Slip outside their jab line, enter at 45° to their centerline" },
        { type: "GUARD",  value: "High guard stays active throughout — no drop during entry" },
      ],
      explanation:
        "Slip outside the jab and step in simultaneously — defense and offense in one motion, no gap between. The high guard removes the window where most fighters get countered mid-entry. When both actions happen at once, there's nothing for the opponent to punish.",
      bodyCue:
        "Feel the rear hip load the moment your head dips — if the hip hasn't moved, the hook has nothing behind it.",
      commonMistake:
        "Dropping the guard during the slip to generate power. Your chin is exposed at the exact moment you're trying to land.",
      coachNotes:
        "Slip and fire are one motion. If you think 'slip, then hook' — you're too slow. Think 'enter' and let the body do both.",
      drillSteps: [
        "Shadow: imagine the incoming jab, slip outside left, feel weight shift to rear hip — guard stays high",
        "Partner slow jabs: slip outside 10 reps each side, no counter yet — perfect the entry",
        "Add counter: immediately after the slip, release left hook to body — don't reach for the head",
        "Speed build: partner throws fight-speed jabs, slip and counter without telegraphing",
      ],
    },
    {
      title: "Weight Load & Explode",
      difficulty: "beginner",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Rear foot is the power base — never lifts before the hook lands" },
        { type: "WEIGHT", value: "Full load onto rear foot → hip → shoulder → fist, in sequence" },
        { type: "ANGLE",  value: "Vertical axis rotation — power comes from the ground, not the arm" },
        { type: "GUARD",  value: "Lead hand stays up during the load — no drop to cock the hook" },
      ],
      explanation:
        "The punch fires from the ground. Weight loads fully onto the rear foot first, hips fire like a spring, the shoulder follows, and the fist arrives last. If the arm moves before the hip, the punch has no knockout power regardless of how hard you swing.",
      bodyCue:
        "Feel the rear foot pressing hard into the floor before anything else moves — that floor pressure is where the power starts.",
      commonMistake:
        "Rushing the punch before the weight has fully transferred. Arm-only hooks have no knockout power regardless of extension or arm speed.",
      coachNotes:
        "The punch is already done before your arm moves. Hip fires → shoulder follows → arm delivers. Practice the sequence slow enough to feel all three steps.",
      drillSteps: [
        "Stand square, rock weight from lead to rear foot — feel the hip shift fully before moving to next step",
        "Add shoulder rotation from the rear-weight position — it naturally winds the hook",
        "Shadow: throw hooks from the loaded position, feel the explosion upward from the floor",
        "Heavy bag: pause 1 sec on the load, then fire — until the load becomes automatic",
      ],
    },
    {
      title: "Short Right Inside",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Chest-to-chest range — weight centered, no room to step out" },
        { type: "WEIGHT", value: "Body rotation drives the punch — arm extension is minimal" },
        { type: "ANGLE",  value: "Vertical fist straight down the middle — no arc, no telegraph" },
        { type: "GUARD",  value: "Lead hand controls head/space while punching hand drives through" },
      ],
      explanation:
        "At clinch range there's no room for a full cross. Body rotation drives a vertical-fist right down the center — same power delivery, zero space required. The elbow, not the arm, is the engine. Extension at this distance creates a push with no snap.",
      bodyCue:
        "Feel your back shoulder driving into the punch — if you feel the arm extending, you're too far away for this version.",
      commonMistake:
        "Trying to extend a full cross from inside range. Arm extension at close distance drains power and telegraphs the punch before it lands.",
      coachNotes:
        "Think 'push with your shoulder through the elbow' — not 'extend your arm.' At inside range, the shoulder is the strike.",
      drillSteps: [
        "Get in close stance, practice short vertical-fist rights from hip height, arm barely extends",
        "Focus on shoulder driving into the punch — the arm doesn't extend, the body rotates through",
        "Clinch bag: get chest-to-bag, throw short rights from body rotation only",
        "Partner pads in close: practice the distance where only short shots are possible",
      ],
    },
  ],

  // ── Muhammad Ali ────────────────────────────────────────────────────────────
  "muhammad-ali": [
    {
      title: "Lead Foot Pivot Exit",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Lead foot ball is the pivot post — rear foot pushes it around" },
        { type: "WEIGHT", value: "Rear foot pushes, weight transfers through the pivot arc" },
        { type: "ANGLE",  value: "Exit 45–90° to the side — out of every counter-punching line" },
        { type: "GUARD",  value: "Guard maintained during pivot, resets clean on the new angle" },
      ],
      explanation:
        "Jab, then pivot on the lead foot ball — the rear foot pushes. You exit 45–90° sideways, out of any counter line, while the opponent is still processing your jab. One punch creates two results: damage and a free exit.",
      bodyCue:
        "Feel the rear foot pressing the floor to power the pivot — the lead foot ball should feel like a spinning post under you.",
      commonMistake:
        "Pivoting on the heel instead of the ball of the foot. Heel pivots are slower, wider, and collapse the stance on exit.",
      coachNotes:
        "After your jab lands, the lead foot is already planted — use it as a post. Push off the rear foot, swivel. You exit the danger zone automatically.",
      drillSteps: [
        "Shadow: throw jab, then pivot 45° left on lead foot ball — practice until smooth",
        "Floor tape: mark target spots at 45° — jab from A, land feet at B consistently",
        "Pivot to attack: jab, pivot, immediate left hook from the new angle",
        "Partner: they throw single jab, you jab-and-exit 5 reps — they cannot reach your new position",
      ],
    },
    {
      title: "Float — Toes, Not Heels",
      difficulty: "beginner",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Weight permanently on balls of feet — heels never fully plant" },
        { type: "WEIGHT", value: "Slight forward bias — never heel-heavy or leaning back" },
        { type: "ANGLE",  value: "Zero re-weight delay = instant direction change in any direction" },
        { type: "GUARD",  value: "Relaxed guard — tension in the arms kills foot speed" },
      ],
      explanation:
        "Heel-weighted stance requires a re-weight step before any movement. Ball-of-foot stance has zero re-weight delay. That delay is what opponents time. Remove it permanently and their counter-timing stops working.",
      bodyCue:
        "Feel light, like your heels could lift off at any moment — if your calves aren't slightly engaged, you're already too flat.",
      commonMistake:
        "Heel-walking between combinations. Flat feet between punches kills reaction time exactly when you need to move instantly.",
      coachNotes:
        "Stand flat-footed and try a quick step. Now stand on the balls and try. That difference is what Ali had over everyone. Forward weight = zero reaction delay.",
      drillSteps: [
        "Hold for 60 seconds on balls of feet — feel the calf and thigh engagement activate",
        "Shadow with awareness: heels never fully touch during active movement phases",
        "Lateral shuffle 3 left / 3 right, no pause between direction changes",
        "20-jab flurry while maintaining toe-weight throughout — never let heels drop",
      ],
    },
    {
      title: "Snap & Retract",
      difficulty: "beginner",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Footwork stays active — no weight commitment on a jab" },
        { type: "WEIGHT", value: "Jab fires without forward weight transfer — stay ready to move" },
        { type: "ANGLE",  value: "Punch travels equal distance out and back — not a one-way trip" },
        { type: "GUARD",  value: "Guard reforms before opponent can counter — retraction is defense" },
      ],
      explanation:
        "Every punch is a round trip, not a one-way trip. The retraction must be equal in speed to the extension. Slow retraction means the guard is open during recovery. Fast retraction closes the guard before the opponent can exploit it.",
      bodyCue:
        "Feel the recoil pulling your guard back — the snap home should feel like a rubber band releasing, not a conscious pull.",
      commonMistake:
        "Leaving the jab extended to admire where it landed. The moment of follow-through is when you're most exposed to counters.",
      coachNotes:
        "Train the retraction as hard as the extension. If your return is slow, your guard is open. Fast retraction = built-in counter defense.",
      drillSteps: [
        "Speed bag: focus on retraction speed — return should match extension in timing",
        "Shadow: jab out, count retraction equal to extension — both halves are the same",
        "Double-end bag: rebound timing forces fast retraction — use this daily",
        "Wall touch: touch wall with jab hand, retract before count '2' — measures reflex speed",
      ],
    },
  ],

  // ── Naoya Inoue ─────────────────────────────────────────────────────────────
  "naoya-inoue": [
    {
      title: "High-Low Switch",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Mid-range, feet stable — switching targets, not distance" },
        { type: "WEIGHT", value: "Hip drives each punch independently — no combined load" },
        { type: "ANGLE",  value: "Head shot draws guard up; body shot takes the exposed angle below" },
        { type: "GUARD",  value: "Watch opponent's elbow rise — that's the entry signal to go low" },
      ],
      explanation:
        "A genuine head threat forces the guard up. Two guards cannot coexist simultaneously. When the elbows rise, the body is exposed. The switch only works if the head punch is real — a fake won't produce a real guard response.",
      bodyCue:
        "Feel your eyes tracking the opponent's guard movement — the body shot only fires when you see their elbows actually rising.",
      commonMistake:
        "Throwing head-body as a preset combination regardless of guard response. Predetermined switches become patterns that experienced opponents read and counter.",
      coachNotes:
        "Make them commit to one zone, then attack the other. Head threatens, body opens. Body threatens, head opens. Practice both until the decision is automatic.",
      drillSteps: [
        "Mitt drill: coach calls 'high' or 'low' mid-combination — boxer switches instantly",
        "Double jab: first to head, watch guard react, second drops to body on elbow rise",
        "Shadow: every combination must switch levels at least once",
        "Heavy bag: tape high and low zones, alternate within each combination",
      ],
    },
    {
      title: "Counter Right Hand",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Slip shifts rear foot outside — creates the counter platform" },
        { type: "WEIGHT", value: "Slip weight shifts outward → snaps back to power the counter" },
        { type: "ANGLE",  value: "Slip outside their jab, right hand fires through the center lane" },
        { type: "GUARD",  value: "Present slightly low guard to bait — tighten to slip before contact" },
      ],
      explanation:
        "Bait the jab by presenting a slightly low guard. The moment the jab commits, slip outside before contact and fire the right hand through the center — catching the opponent while they're mid-extension, guard not yet reformed.",
      bodyCue:
        "Feel your weight shifting outward during the slip — the counter should feel like releasing energy the slip already stored.",
      commonMistake:
        "Slipping as the punch arrives rather than before it. You need to be outside before contact, not as contact happens — the timing gap is the entire point.",
      coachNotes:
        "Slip BEFORE the punch arrives. The timing gap creates safety. Practice until the slip is automatic — the counter is easy once the slip is timed.",
      drillSteps: [
        "Partner slow jabs: slip outside 20 reps — focus only on timing, no counter yet",
        "Add counter: slip and return right hand simultaneously — partner absorbs on guard",
        "Visualize the lane: when they extend, center opens — your right hand belongs there",
        "Speed progression: slow × 10, medium × 10, full speed × 10 across multiple sessions",
      ],
    },
    {
      title: "Compact Hook, Close Range",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Inside range — body rotates on fixed feet, no stepping needed" },
        { type: "WEIGHT", value: "Short hip burst — no full body uncoiling, no room for it" },
        { type: "ANGLE",  value: "Elbow fixed at 90°, body turns the arc — arm just travels with it" },
        { type: "GUARD",  value: "Lead hand controls the space while hook loads from hip" },
      ],
      explanation:
        "Inside range removes arm extension as a power source. The elbow stays fixed at 90° — body rotation carries the punch. 12 centimeters of travel, full rotational power from the trunk. The torso is the engine; the arm is just attached.",
      bodyCue:
        "Feel your elbow staying at 90° as your body rotates — if the arm straightens, you've switched from rotation power to arm power.",
      commonMistake:
        "Trying to extend the hook at close range. Full arm extension at inside distance creates a pushing motion with no snap — all effort, no power.",
      coachNotes:
        "Short hooks are a body rotation skill, not an arm skill. Fix elbow at 90°, body turns, fist follows. Imagine your torso carries the punch and your arm just happens to be attached.",
      drillSteps: [
        "Stand 3 inches from heavy bag, throw left hooks using only hip and shoulder rotation",
        "Elbow must stay at 90° — if it opens, you're using arm not body",
        "Clinch position: from body clinch, rotate trunk and throw compact left hooks",
        "Compare: full hook vs. compact hook on the bag — bag travel should be similar if technique is correct",
      ],
    },
  ],

  // ── Dmitry Bivol ────────────────────────────────────────────────────────────
  "dmitry-bivol": [
    {
      title: "Jab Rhythm & Reset",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Orthodox, mobile between jabs — step forward with each one" },
        { type: "WEIGHT", value: "Light weight on lead foot — jab never fully commits weight" },
        { type: "ANGLE",  value: "Same jab line, different timing — rhythm not angle is the variable" },
        { type: "GUARD",  value: "Guard resets fully between rhythm jabs — no drop between" },
      ],
      explanation:
        "Establish a predictable jab rhythm for 2–3 punches, training the opponent's defense to expect the next one. Then break the timing — slightly late or early. The guard responds to pattern, not threat. When the pattern breaks, the guard resets on the wrong beat.",
      bodyCue:
        "Feel the deliberate pause before the off-rhythm jab — that pause is the trap, not the jab itself.",
      commonMistake:
        "Changing the power of the jabs to signal the 'real' one. Rhythm disruption is about timing variation only — power changes are visible and telegraphed.",
      coachNotes:
        "Rhythm is a trap. Establish a beat, then break it once. The opponent's body memorizes the rhythm — be one punch off-pattern when they're least ready.",
      drillSteps: [
        "Count jabs: 1-2-3 normal pace, PAUSE, 4th jab on the reset — feel the gap work",
        "Speed variation: slow-slow-fast or fast-fast-SLOW — vary without any body telegraph",
        "Double jab: land first, feel opponent react, THEN throw second at new guard position",
        "Partner: they try to counter-time your jabs — vary rhythm until they consistently miss",
      ],
    },
    {
      title: "Guard Recovery Movement",
      difficulty: "beginner",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Lateral step accompanies every guard reset — always moving" },
        { type: "WEIGHT", value: "Step left or right — direction doesn't matter, movement does" },
        { type: "ANGLE",  value: "Exit laterally not backward — stay at range while recovering" },
        { type: "GUARD",  value: "Arms return to guard during the step, not after it" },
      ],
      explanation:
        "After every combination, move laterally while the guard returns. Never stand still to reset. The recovery phase is the most vulnerable moment — moving during it turns a stationary target into a moving one at zero extra cost.",
      bodyCue:
        "Feel your feet moving as the last punch retracts — the step should overlap with the arm returning, not follow it.",
      commonMistake:
        "Resetting guard while standing still. Flat feet after a combination is an open invitation to counter during your most vulnerable moment.",
      coachNotes:
        "Build the habit of moving left OR right as the last punch retracts. Never be in the same spot after a combination. Footwork is the period at the end of every sentence.",
      drillSteps: [
        "Shadow: throw 3-punch combo, then mandatory 2 lateral steps before stopping",
        "Heavy bag: hit the bag, push off, take 2–3 steps while guard resets",
        "Partner: after each combination, move before partner can touch you",
        "Timer drill: 3 seconds hitting, 1 second moving — never stationary during the off-second",
      ],
    },
    {
      title: "Optimal Range Discipline",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Footwork calibrates range — step in if too far, back if too close" },
        { type: "WEIGHT", value: "Balanced weight enables instant recalibration either direction" },
        { type: "ANGLE",  value: "Stay at center line at optimal distance — no chasing needed" },
        { type: "GUARD",  value: "Active guard at all times — range control removes the need to slip" },
      ],
      explanation:
        "There is exactly one distance where jab and cross both land at full extension and full power. Too close or too far and both punches lose effectiveness. All footwork is about maintaining that one distance continuously.",
      bodyCue:
        "Feel the tension between staying at optimal range and the instinct to chase or retreat — consciously hold the gap against both impulses.",
      commonMistake:
        "Chasing the opponent when they back up. Abandoning optimal range to stay close changes your punch angles and forces you to punch while stepping, which removes body weight from the punch.",
      coachNotes:
        "Find your range: extend your jab fully — where it just reaches is your distance. Train footwork to maintain that gap automatically. When they close, step back. When they retreat, step in. Equal.",
      drillSteps: [
        "Range finder: extend jab fully, mark where fist lands — that distance is your floor",
        "Partner: maintain optimal range while they actively try to change distance for 2 minutes",
        "Small room drill: stay at jab range throughout — no wild hooks, only ranged shots",
        "Shadow box at constant imaginary distance for 3-minute rounds — feel the range discipline",
      ],
    },
  ],

  // ── Vasyl Lomachenko ────────────────────────────────────────────────────────
  "vasyl-lomachenko": [
    {
      title: "Outside Foot Entry",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Right foot plants outside their lead foot — this IS the entry" },
        { type: "WEIGHT", value: "Weight transfers onto outside foot naturally on landing" },
        { type: "ANGLE",  value: "Outside foot closes their cross angle, opens center for left straight" },
        { type: "GUARD",  value: "Guard maintained during the foot placement — no drop to step" },
      ],
      explanation:
        "Right foot outside their lead foot: one step that removes their cross angle and opens your left straight lane. Foot position is punch permission. That placement gives you the best punch and removes their most dangerous one — all in one movement.",
      bodyCue:
        "Feel your right foot fully clear of their lead foot before any punch — if it's not fully outside, don't throw.",
      commonMistake:
        "Stepping beside their foot rather than outside it. 'Beside' keeps you in their cross line. 'Outside' removes their cross angle entirely — the difference is a few centimeters with major consequences.",
      coachNotes:
        "Foot position is punch permission. Outside foot = left straight is clear. Inside foot = you're in their danger zone. Place the foot first, always, before throwing anything.",
      drillSteps: [
        "Against partner: practice only stepping outside their foot 20 reps — no punch yet",
        "Add the punch: outside foot placement, then left straight down the center",
        "Partner check: after foot placement, partner tries their right cross — it should miss cleanly",
        "Speed entry: from distance, explosive step to outside position, immediate left straight",
      ],
    },
    {
      title: "Angle Change Mid-Combination",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Lead foot pivots between punches — this is what creates the angle" },
        { type: "WEIGHT", value: "Weight shifts with each pivot to maintain power on new angles" },
        { type: "ANGLE",  value: "Each punch in the combination arrives from a different direction" },
        { type: "GUARD",  value: "Guard maintained during pivots — punching doesn't stop guarding" },
      ],
      explanation:
        "Guards face one direction. Multiple angles require multiple adjustments, and no one can make two adjustments simultaneously. A pivot between punches means the combination arrives from different directions — the defense is always one position behind.",
      bodyCue:
        "Feel the lead foot pivoting between punches — if you're not feeling the pivot, you're punching from a fixed position and defeating the purpose.",
      commonMistake:
        "Punching then pivoting as two separate actions. The pivot must happen during the combination, not as a reset after it. Sequential is too slow to create the overlap that makes this work.",
      coachNotes:
        "Throw a 1-2 but pivot your lead foot 45° between the jab and cross. The cross arrives from a different angle. Same combination, two directions — the opponent needs two different guards.",
      drillSteps: [
        "Shadow: 1-2 with 15° pivot between punches — practice until pivot feels natural within the flow",
        "Heavy bag: hit from front, pivot 45°, hit again, pivot 90° — same combination from 3 positions",
        "Slow-motion partner: punch from 5 different positions around them in one flow",
        "Speed build: 1 minute constant angle changes with guard maintained throughout",
      ],
    },
    {
      title: "Direction Change Feint",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Commit to one direction, read opponent weight shift, instantly reverse" },
        { type: "WEIGHT", value: "Begin weight loading in feint direction, then snap back the opposite" },
        { type: "ANGLE",  value: "Feint line and real line should be 90° apart minimum to create gap" },
        { type: "GUARD",  value: "Guard stays up during feints — don't drop arms while misdirecting" },
      ],
      explanation:
        "Movement creates commitment. When an opponent chases you left, their weight loads left. The moment that weight loads, reverse direction — their own momentum is now working against them. You arrive at the new position before their feet can adjust.",
      bodyCue:
        "Feel the opponent's weight pressure against you in the feint direction — that resistance is your signal to reverse.",
      commonMistake:
        "Changing direction before the opponent has committed weight. Reverse too early and it's just a shuffle with no effect. Wait for their weight to load — then reverse.",
      coachNotes:
        "Movement creates commitment. When they chase you left, their weight loads left. The moment you feel that load, go right. Their own momentum becomes your opening.",
      drillSteps: [
        "Solo: shuffle left 3, immediately right 3 — 50 reps, no hesitation between directions",
        "Add body language: lean left before going right, sell the direction before reversing",
        "Partner: they must follow your movement — read when their weight commits, then change",
        "Apply to sparring: feint and move first, create openings through misdirection before punching",
      ],
    },
  ],

  // ── Canelo Alvarez ──────────────────────────────────────────────────────────
  "canelo-alvarez": [
    {
      title: "Shoulder Roll Defense",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Weight shifts to rear foot simultaneously with shoulder roll" },
        { type: "WEIGHT", value: "Rear weight is the foundation — no rear weight means no real roll" },
        { type: "ANGLE",  value: "Rounded shoulder surface deflects the punch outward, not into you" },
        { type: "GUARD",  value: "Right hand by jaw, left arm diagonal — both active at once" },
      ],
      explanation:
        "Rear weight and shoulder forward happen simultaneously. The rounded surface deflects the punch outward. Combined with the offline weight shift, there's nothing for the opponent to land on — and you're already in counter position when they miss.",
      bodyCue:
        "Feel your rear shoulder rising forward as weight shifts back — both movements are simultaneous, never one then the other.",
      commonMistake:
        "Rolling the shoulder without shifting weight to the rear foot. The roll alone leaves you flat-footed on the power line — you deflect the punch but stay in range of the next one.",
      coachNotes:
        "The shoulder roll is weight management: shift rear, shoulder turns, nothing to hit. When timed correctly, the defender is always outside the punch — safest position in boxing.",
      drillSteps: [
        "Mirror: practice rear shoulder forward roll without incoming — feel the natural mechanics",
        "Partner light touch: partner presses palm toward face, roll so shoulder deflects",
        "Always combine: roll must be accompanied by rear-foot weight transfer every time",
        "Add counter: roll, feel the cross land on shoulder, return short left hook from rolled position",
      ],
    },
    {
      title: "Duck & Short Hook Counter",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Lead foot stays planted as anchor — rear foot doesn't move" },
        { type: "WEIGHT", value: "Duck loads the left hip — hook is pre-charged by the duck itself" },
        { type: "ANGLE",  value: "Head moves offline at 45° to the left — not straight down" },
        { type: "GUARD",  value: "Duck is defense and hook setup simultaneously — one movement" },
      ],
      explanation:
        "The duck pre-charges the hook. When the head moves offline left, the left hip naturally loads. The hook is already half-done by the time you're ready to throw it — duck correctly and the counter is automatic. One movement creates both defense and offense.",
      bodyCue:
        "Feel your head moving offline to the left (not just downward) — a straight duck goes forward into the punch, not away from it.",
      commonMistake:
        "Ducking straight down without going offline. A straight duck brings your head onto the punching line instead of off it — you absorb the punch on the top of your head instead of avoiding it.",
      coachNotes:
        "The duck sets up the counter automatically. When you duck properly — head offline, not just bent forward — your left hip naturally loads. The hook is half-done by the duck itself.",
      drillSteps: [
        "Solo duck practice: head must move offline left, not just downward — 20 reps",
        "Partner press: partner extends jab slowly, you duck offline and feel which hook naturally follows",
        "Add counter: duck, pause to confirm position, then release left hook to marked target",
        "Speed build: reduce the pause over sessions until duck-and-counter is one fluid motion",
      ],
    },
    {
      title: "Body Pattern Accumulation",
      difficulty: "beginner",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Mid-range, stable base — same footwork for all accumulated shots" },
        { type: "WEIGHT", value: "Full hip rotation into each body shot — real force, not feelers" },
        { type: "ANGLE",  value: "Jab body, cross body, hook body — same range, pattern not angle" },
        { type: "GUARD",  value: "Maintain head protection between body shots — guard never drops" },
      ],
      explanation:
        "Each body shot forces the opponent to consciously protect their ribs. By shot four or five, the guard drifts down without a decision being made. The head punch at the end lands on a guard that has partially lowered itself. Accumulation only works if every body shot is a genuine threat.",
      bodyCue:
        "Feel real hip rotation into each body shot — if you're not feeling the ribs compress against the bag, the shot isn't real enough to force a guard response.",
      commonMistake:
        "Throwing body shots at half power to 'set them up.' The brain ignores fake threats. Accumulation only works if each shot is a genuine threat the opponent cannot ignore.",
      coachNotes:
        "Body shots are investments. Each one forces the opponent to think about their ribs. By punch 5 or 6, their guard drifts down automatically. Commit to real body shots — the brain ignores fake threats.",
      drillSteps: [
        "Heavy bag: alternate left-right body shots 20 reps, full hip rotation into each one",
        "Pattern set: jab body, cross body, hook body — then switch last punch to head spontaneously",
        "Partner mitts: 4 body calls then 1 surprise head call — boxer transitions instantly",
        "Sparring intent: attack the body for a full round — head punches only as the final switch",
      ],
    },
  ],

  // ── Gennady Golovkin ────────────────────────────────────────────────────────
  "gennady-golovkin": [
    {
      title: "Triple Jab Setup",
      difficulty: "beginner",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Step forward with each jab — close distance progressively" },
        { type: "WEIGHT", value: "Forward pressure adds weight to each successive jab" },
        { type: "ANGLE",  value: "Straight jab line — hook follows the natural shoulder position" },
        { type: "GUARD",  value: "High guard between jabs — opponent tries to counter in the gaps" },
      ],
      explanation:
        "Three jabs establish a pattern. By the third, the opponent is solving for jab. The hook arrives from the same hand, same position — unrecognized as a different punch until it's too late to adjust the guard.",
      bodyCue:
        "Feel your steps closing the distance progressively — each jab should land slightly closer than the last.",
      commonMistake:
        "Telegraphing the hook by dropping the left shoulder before throwing it. The hook must emerge from the same position as the jabs — any shoulder drop is readable at full speed.",
      coachNotes:
        "Three jabs teach the opponent to defend jabs. The hook comes from nowhere because they're still solving for jab three. Each jab must be real — telegraphed jabs teach opponents when to expect the hook.",
      drillSteps: [
        "Shadow: triple jab rhythm, stepping forward, one beat between each — smooth before adding hook",
        "Heavy bag: triple jab with forward pressure, move into the bag on each jab",
        "Partner: triple jab, partner signals when to throw hook — builds reactive timing",
        "Sparring: commit to triple jab sets, resist switching to cross early, let the setup build",
      ],
    },
    {
      title: "Systematic Ring Cut",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Diagonal steps — 45° forward left and 45° forward right, alternating" },
        { type: "WEIGHT", value: "Balanced weight enables equal comfort cutting either direction" },
        { type: "ANGLE",  value: "Move toward where they're going, not where they currently are" },
        { type: "GUARD",  value: "Active guard while cutting — never drop during footwork patterns" },
      ],
      explanation:
        "Diagonal footwork cuts escape routes, reducing the available ring with each exchange. You move toward where they want to go — not toward where they are. You arrive at the destination before they do, and their escape route is gone.",
      bodyCue:
        "Feel your diagonal steps arriving before the opponent — you're moving toward their destination, so you get there first.",
      commonMistake:
        "Moving straight toward the opponent to cut them off. Straight pressure they can easily circle around. Diagonal angles remove the escape route instead of just reducing distance.",
      coachNotes:
        "Cutting the ring is about reducing options, not closing distance. Move at 45° angles toward where the opponent wants to go — not toward where they are. You arrive before them.",
      drillSteps: [
        "Floor exercise: mark corners, move imaginary opponent toward corner using diagonal steps only",
        "Shadow: 45° forward angling left and right alternately while maintaining center line",
        "Partner: they try to circle out, you cut off using only angled footwork — no grabbing",
        "Rope drill: force partner to ropes using only positioning and diagonal footwork",
      ],
    },
    {
      title: "In-Close Right Hand",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Step inside at 45° to access the right hand lane" },
        { type: "WEIGHT", value: "Body weight drives the compact right — shoulder forward through" },
        { type: "ANGLE",  value: "Down the middle, compact — elbow drives the punch, not the arm" },
        { type: "GUARD",  value: "Lead hand controls opponent's guard during the inside step" },
      ],
      explanation:
        "Step inside at 45° to access the right hand lane. At inside range, a compact right hand using the shoulder as the driving force delivers the same power as a full cross — in 15 centimeters of travel instead of full extension.",
      bodyCue:
        "Feel your shoulder driving through the punch rather than your hand extending — if you feel the elbow straightening, you've switched to arm power.",
      commonMistake:
        "Extending a full cross at close range. At inside distance, arm extension creates a push with no snap. The power comes from body weight driving through the elbow — not from arm extension.",
      coachNotes:
        "Inside range, extension equals no power. The in-close right hand is a driving motion — elbow forward, body rotates into it. Throw your shoulder through the punch, not your arm.",
      drillSteps: [
        "Heavy bag: chest within 6 inches, throw right hands from body rotation only — arm barely extends",
        "Compare: full cross vs. compact right on the bag — bag travel should be similar if done correctly",
        "Step-in drill: start mid-range, one step inside, immediately compact right — no pause",
        "Partner pads in close: practice stopping inside their jab range and throwing compact right",
      ],
    },
  ],

  // ── Floyd Mayweather ────────────────────────────────────────────────────────
  "floyd-mayweather": [
    {
      title: "Philly Shell Position",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Orthodox stance, weight slightly rear — ready to roll or exit" },
        { type: "WEIGHT", value: "Rear weight bias enables shoulder roll and lateral exits" },
        { type: "ANGLE",  value: "Right shoulder angled forward presents the deflection surface" },
        { type: "GUARD",  value: "Right hand by jaw, left arm diagonal, shoulder protects simultaneously" },
      ],
      explanation:
        "Right hand at the jaw, left arm diagonal, right shoulder forward — three layers of defense from one relaxed position. When timed correctly, the shoulder deflects before you need to actively react. You're always outside the punch before it reaches you.",
      bodyCue:
        "Feel the relaxed weight of your right hand against your jaw — tension in the arm kills the shoulder roll reflex.",
      commonMistake:
        "Holding the Shell position rigidly as a static pose. It works through relaxation and reactive rolling, not through tense defensive holding. Rigid = slow.",
      coachNotes:
        "The Philly Shell is not a waiting posture — it's a counter-punching position. The shoulder deflects, your arm is already at their guard, the counter fires before they finish extending.",
      drillSteps: [
        "Mirror: hold Shell for 60 seconds — right hand by jaw, left arm diagonal, shoulder forward",
        "Walk one full round in Shell — feel what's covered without anything incoming",
        "Partner light touch: partner taps shoulder area, practice rolling with shoulder, not arm",
        "Counter from Shell: partner jabs, shoulder deflects, immediate left hand return — no cocking",
      ],
    },
    {
      title: "Catch & Counter",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Footwork active during catch — never plant both feet to receive" },
        { type: "WEIGHT", value: "No weight commitment during catch — stay completely mobile" },
        { type: "ANGLE",  value: "Catch guides jab offline, counter fires through the center lane" },
        { type: "GUARD",  value: "Catch hand guides their jab, other hand counters simultaneously" },
      ],
      explanation:
        "The catch is a guide, not a block. The rear hand redirects the jab offline while the counter fires through the opening — both happen simultaneously. The gap between catch and counter is where opponents land the next shot. Remove the gap.",
      bodyCue:
        "Feel the catch hand guiding the jab offline while the counter hand is already moving — both hands active at the same time, not one then the other.",
      commonMistake:
        "Catching the jab then countering as two distinct movements. Sequential catch-and-counter is too slow — the opponent has already started their follow-up before your counter is halfway there.",
      coachNotes:
        "The catch-and-counter is timing, not strength. You're redirecting the punch, not stopping it. Train until the counter begins before the catch finishes — the overlap is the entire key.",
      drillSteps: [
        "Solo: practice catching motion — palm facing opponent, turn inward to guide imaginary jab",
        "Partner slow jabs: catch with rear hand 20 reps — guide not block, feel the difference",
        "Add counter: catch the jab, right hand counter simultaneously — one motion",
        "Speed build: slow × 10, medium × 10, full speed × 10 across multiple sessions",
      ],
    },
    {
      title: "Lead Right Disruption",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Orthodox, slight lead-weight step extends reach without telegraphing" },
        { type: "WEIGHT", value: "Lead weight transfer adds reach — no backward loading movement" },
        { type: "ANGLE",  value: "Lead right arrives from unexpected hand position — no windup signal" },
        { type: "GUARD",  value: "Shell position enables instant counter after lead right lands" },
      ],
      explanation:
        "The lead right disrupts because it arrives before opponents expect a power punch from that hand. Opponents are calibrated to read orthodox combinations. A power punch from the lead hand breaks the pattern before it starts.",
      bodyCue:
        "Feel the lead right arriving without any loading movement — it should almost surprise you when it lands in training.",
      commonMistake:
        "Loading or cocking the lead right before throwing it. Any backward movement telegraphs the punch and removes all disruption value — it becomes a slow, readable power punch.",
      coachNotes:
        "The lead right is a chess move, not a knockout punch. When opponents are too comfortable in their rhythm, this resets everything. Use it when you want to change the flow of the round.",
      drillSteps: [
        "Shadow: practice lead right from Shell — fast, compact, no loading movement",
        "Heavy bag: throw lead right as first punch (not jab), feel the unusual entry angle",
        "Partner: use lead right as a 'reset' punch whenever their flow gets comfortable",
        "Follow-up: lead right opens the left side — immediately follow with conventional combinations",
      ],
    },
  ],

  // ── Manny Pacquiao ──────────────────────────────────────────────────────────
  "manny-pacquiao": [
    {
      title: "Southpaw Foot Position",
      difficulty: "beginner",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Right foot steps outside opponent's lead foot before engaging" },
        { type: "WEIGHT", value: "Weight transfers onto outside right foot naturally on landing" },
        { type: "ANGLE",  value: "Outside foot closes their cross angle, opens center lane for left" },
        { type: "GUARD",  value: "Guard maintained during the placement step — no drop to step" },
      ],
      explanation:
        "Right foot outside their lead foot closes their most dangerous punch (the right cross) while opening a direct center lane for the left straight. One step removes their best weapon and gives you yours — all in one placement.",
      bodyCue:
        "Feel your right foot fully clear of their lead foot before throwing — if it's not fully outside, don't throw the left.",
      commonMistake:
        "Stepping beside their foot rather than outside it. 'Beside' keeps you in their cross line. 'Outside' removes their cross angle entirely — the difference of a few centimeters changes everything.",
      coachNotes:
        "Foot position is punch permission. Outside foot = left straight is clear. Inside foot = you're in their danger zone. Place that foot first before throwing anything.",
      drillSteps: [
        "Against partner: practice only stepping outside their foot 20 reps — no punch added yet",
        "Add the punch: outside foot placement, then left straight down the center",
        "Partner check: after foot placement, partner tries their right cross — it should miss cleanly",
        "Speed entry: from distance, explosive step to outside position, immediate left straight",
      ],
    },
    {
      title: "Explosive Zero-Step",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "No prep step — first movement is the real movement at full speed" },
        { type: "WEIGHT", value: "No preliminary weight loading before entry — no observable tell" },
        { type: "ANGLE",  value: "Entry angle established by foot placement, not forward body lean" },
        { type: "GUARD",  value: "Guard up from stillness — don't drop arms before the explosion" },
      ],
      explanation:
        "The first movement is real movement at full speed. Most fighters take a small prep shuffle before entry — opponents read that shuffle and prepare. Remove the prep step and there's no signal to read. You're already arriving before they decide to react.",
      bodyCue:
        "Feel the stillness before the explosion — the first movement should feel sudden even to yourself.",
      commonMistake:
        "Taking a small shuffle step before the entry. That half-step is visible at full speed and gives opponents enough warning to prepare their counter before you arrive.",
      coachNotes:
        "Most fighters take a 'prep step' before entering — a small shuffle before the real movement. This telegraph is what opponents read. Practice explosive first-step from complete stillness.",
      drillSteps: [
        "Reactive sprint: start stationary, partner signals, explode to heavy bag at full speed immediately",
        "Shadow from freeze: stand completely still, then explode into full combination — no prep movement",
        "Film yourself: watch for small weight shifts before entries — eliminate any observable tells",
        "Footwork ladder: explosive first step in and out — trains the neural response to fire from stillness",
      ],
    },
    {
      title: "Southpaw High-Low Left",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Stable base — both shots fired from same foot position" },
        { type: "WEIGHT", value: "Hip drives both independently — weight shifts with each" },
        { type: "ANGLE",  value: "First left travels high angle, second left drops below the guard" },
        { type: "GUARD",  value: "Watch their guard response — elbow rising is the entry signal" },
      ],
      explanation:
        "Throw the left to the head genuinely — a fake doesn't produce a real guard response. Watch the elbows rise. The moment they do, the second left drops to the now-exposed body. Read and react; never preset.",
      bodyCue:
        "Feel your eyes tracking the guard response before committing the second left — the body shot only fires when you see the elbows actually lifting.",
      commonMistake:
        "Throwing head-body as a preset sequence regardless of guard response. The switch only works when the body shot follows a genuine head threat that moved the guard — preset combinations don't create real openings.",
      coachNotes:
        "Only works if the head punch is genuine — a fake doesn't trigger a real guard response. Commit to the head shot, watch the response, then decide. Read first, then switch.",
      drillSteps: [
        "Double left drill: 1st left to head level, pause, 2nd left drops to body level",
        "Speed build: reduce the pause between head and body lefts over sessions",
        "Watch the guard: ask partner to show their guard — notice how long it takes to drop from high to low",
        "Heavy bag: tape two zones, practice left-high then left-low as one reactive combination",
      ],
    },
  ],

  // ── Roberto Duran ────────────────────────────────────────────────────────────
  "roberto-duran": [
    {
      title: "Inside Head Control",
      difficulty: "advanced",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Inside range — weight centered and grounded, both fighters close" },
        { type: "WEIGHT", value: "Stable body weight used for control, not movement or momentum" },
        { type: "ANGLE",  value: "Lead hand guides head into alignment for the punching hand's lane" },
        { type: "GUARD",  value: "Control hand is active, not passive — it steers and blocks" },
      ],
      explanation:
        "Lead hand guides head position, punching hand follows. When you control where someone's head faces, you control what they can see and where they can reach. The control hand is more valuable than the punch — it creates the opening first.",
      bodyCue:
        "Feel your lead hand as a guiding tool, not a resting hand — it should feel like you're actively steering, not passively holding.",
      commonMistake:
        "Using the control hand passively. Placing a hand on the opponent's shoulder or head without active guidance doesn't create the alignment needed — it's just a touch, not a position change.",
      coachNotes:
        "Head control is leverage. When you control where someone's head faces, you control what they can see and where they can hit. The control hand is more valuable than the punch in close range.",
      drillSteps: [
        "Partner drill: lead hand on partner's shoulder (light pressure) before throwing body shot",
        "Clinch position: establish head control, create body shot opening, safely exit",
        "Shadow: throw all inside combinations with one hand as 'guide' and one as 'hitter'",
        "3-beat sequence: lead hand touches → body rotates → punching hand follows",
      ],
    },
    {
      title: "Rhythm Disruption",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Footwork rhythm varies with punch rhythm — both unpredictable" },
        { type: "WEIGHT", value: "Weight loading speed varies — explosive sometimes, deliberate others" },
        { type: "ANGLE",  value: "Same angle, different timing — confusion comes from when, not where" },
        { type: "GUARD",  value: "Guard timing also varies — don't be readable from any position" },
      ],
      explanation:
        "Vary punch timing, not punch power. Power changes are visible in the body before the punch arrives. Timing changes are invisible until the punch lands. Off-beat timing breaks the counter-timing patterns opponents develop within a round.",
      bodyCue:
        "Feel the deliberate pause or rush in your timing — the discomfort of breaking your own rhythm is exactly what creates the opening.",
      commonMistake:
        "Changing punch power instead of punch timing. Slowing a punch down is visible in the shoulder and arm before it lands. Changing when it arrives is invisible until it connects.",
      coachNotes:
        "Rhythm is a double-edged weapon. Your rhythm helps you land combinations. But predictable rhythm helps opponents counter. Learn to throw the same combinations at different speeds within the same round.",
      drillSteps: [
        "Metronome drill: punch to a beat, then deliberately fall off by half a count",
        "Shadow with counts: 1-2-3 at normal speed, then 1-2...3 with pause, then 1...2-3 rushing",
        "Heavy bag: 1-minute rounds alternating fast combinations and slow deliberate single shots",
        "Partner: they try to counter-time your punches — vary rhythm until they consistently miss",
      ],
    },
    {
      title: "Pressure Walk-In",
      difficulty: "intermediate",
      videoUrl: "", // Firebase Storage — .mp4 upload хий
      teachingBlocks: [
        { type: "FOOT",   value: "Continuous forward steps — never retreat, never pause mid-advance" },
        { type: "WEIGHT", value: "Forward weight bias throughout — absorb incoming on forward lean" },
        { type: "ANGLE",  value: "Walk straight at them — forward pressure forces back into the ropes" },
        { type: "GUARD",  value: "Chin down, forehead forward — absorb shots on the hardest skull bone" },
      ],
      explanation:
        "Forward lean and chin down means you absorb on the forehead, not the chin. Continuous forward pressure means the opponent can never fully load a counter — you're arriving before they reset. Pressure is a trained skill, not a personality type.",
      bodyCue:
        "Feel your forehead leading forward with chin tucked — if you feel your chin exposed, you're walking in upright instead of forward-leaning.",
      commonMistake:
        "Walking in with the head upright. An upright head walk-in presents the chin as a target. Chin down and forehead forward means you absorb on the hardest part of the skull while advancing.",
      coachNotes:
        "Walking through punches requires correct head position — chin down, forehead forward. The forehead is hard. The chin is not. Take shots on the hardest part while moving forward.",
      drillSteps: [
        "Walk drill: chin down, forehead forward — partner throws light jabs on your forehead as you advance",
        "Pressure rounds: spend one full sparring round walking forward without stopping regardless of incoming",
        "Head position check: film yourself walking in — chin must be down, head tilted not upright",
        "Alternative to slipping: when you'd normally slip, bend knees slightly and lean in instead",
      ],
    },
  ],
};
