// app/api/ai-breakdown/route.js
// AI Breakdown for GAVANA reels — OpenAI + rule-based fallback

const MODEL = "gpt-4.1-mini";

let loggedMissingKey = false;
let loggedApiFailure = false;

// ─── Style detection ────────────────────────────────────────────────────────

const STYLES = [
  { key: "counter",   label: "Counter Puncher",   emoji: "🎯", re: /counter|react|slip|parry|wait for|timing/i },
  { key: "pressure",  label: "Pressure Fighter",  emoji: "💥", re: /pressure|forward|aggress|bag work|power|heavy bag/i },
  { key: "fastHands", label: "Fast Hands",        emoji: "⚡", re: /speed|fast|rapid|flurry|quick hands|volume/i },
  { key: "footwork",  label: "Footwork Boxer",    emoji: "👟", re: /footwork|movement|pivot|angle|shadow|ghost/i },
  { key: "southpaw",  label: "Southpaw",          emoji: "🔄", re: /southpaw|left.hand dominant|switch/i },
  { key: "muaythai",  label: "Muay Thai",         emoji: "🦵", re: /muay|thai|kick|knee|clinch|teep/i },
  { key: "technical", label: "Technical Boxer",   emoji: "📐", re: /technical|technique|form|guard work|fundamentals|stance/i },
];

const TECHNIQUES = [
  { key: "uppercut",  label: "Uppercut",          emoji: "⬆️", re: /uppercut/i },
  { key: "hook",      label: "Hook",              emoji: "↩️", re: /\bhook\b/i },
  { key: "jabCross",  label: "Jab-Cross",         emoji: "👊", re: /jab.?cross|1.?2|one.?two/i },
  { key: "jab",       label: "Jab",               emoji: "👊", re: /\bjab\b/i },
  { key: "cross",     label: "Cross",             emoji: "✋", re: /\bcross\b|straight right/i },
  { key: "slip",      label: "Slip & Dodge",      emoji: "🛡️", re: /slip|dodge|bob|weave|duck/i },
  { key: "pivot",     label: "Pivot",             emoji: "↩️", re: /pivot|cut angle/i },
  { key: "combo",     label: "Combo",             emoji: "💥", re: /combo|combination|sequence/i },
  { key: "footwork",  label: "Footwork",          emoji: "👟", re: /footwork|step|shuffle|lateral/i },
  { key: "timing",    label: "Timing",            emoji: "⏱️", re: /timing|rhythm|tempo|reaction/i },
];

// ─── Insight pools per style ─────────────────────────────────────────────────

const STYLE_POOLS = {
  counter: {
    strengths:   ["Reads distance well", "Sharp reaction timing", "Efficient punch selection", "Stays composed under pressure"],
    weaknesses:  ["Too passive early in rounds", "Guard opens when countering", "Predictable counter timing", "Waits too long to engage"],
    improves:    ["Use feints before your counter — don't wait for the obvious opening", "Stay unpredictable, vary your entry timing", "React, don't wait — there's a difference"],
    drills:      ["Slip-counter drill: 3×2min", "Mirror reaction work with partner", "Timing bag — counter on second swing"],
  },
  pressure: {
    strengths:   ["Strong forward pressure", "High output volume", "Forces opponent backward", "Physical conditioning shows"],
    weaknesses:  ["Guard drops when loading up power shots", "Recovers slow after missing", "Predictable attack patterns", "Too linear forward movement"],
    improves:    ["Keep hands higher as you press forward", "Short punches over big swings — more efficient", "Body shots open the head"],
    drills:      ["Heavy bag blitz: 30s on, 10s off × 6", "Catch-and-return padwork", "3-punch combo → push forward → reset"],
  },
  fastHands: {
    strengths:   ["High punch volume", "Sharp combo speed", "Quick follow-up shots", "Keeps opponent occupied"],
    weaknesses:  ["Power drops in fast exchanges", "Guard disappears during flurries", "Tires mid-round from high output", "Sacrifices accuracy for speed"],
    improves:    ["Slow down to speed up — 70% speed with full technique first", "End every combo with guard up", "Add a power shot at the end of speed combos"],
    drills:      ["Double-end bag: 3×2min max speed", "Speed-to-power drill: fast jab-jab, then power cross", "Breath-control combo: exhale every 3rd punch"],
  },
  footwork: {
    strengths:   ["Elusive target", "Good angle creation", "Controls ring space", "Makes opponent miss"],
    weaknesses:  ["Punches lack power from too much movement", "Sometimes too defensive", "Flat feet when planting to punch", "Angles without punching output"],
    improves:    ["Punch out of your pivots — don't just move", "Plant your lead foot before throwing power shots", "Use movement to set up — then commit"],
    drills:      ["Lateral step-and-jab: 3×90s", "Pivot drill: step-pivot-jab × 20 each side", "Cone footwork shadow boxing: 5min"],
  },
  southpaw: {
    strengths:   ["Uncomfortable angles for orthodox fighters", "Left cross is the power shot", "Unique stance creates confusion", "Rear hand jab sets up well"],
    weaknesses:  ["Right jab underused", "Stance switch timing is off", "Gets caught going to same side", "Head stays static"],
    improves:    ["Use your right jab more to set up the left cross", "Angle out to your right — get off the center line", "Practice the Orthodox vs Southpaw footwork matchup"],
    drills:      ["Southpaw jab-cross × 50", "Step-right-pivot-left cross: 3×2min", "Southpaw mirror footwork with partner"],
  },
  muaythai: {
    strengths:   ["Clinch control", "Powerful kicks and knees", "Good use of teep/push kick", "Aggressive forward pressure"],
    weaknesses:  ["Guard lower than boxing standard", "Head movement limited", "Vulnerable to boxing combos in close", "Telegraphs kicks"],
    improves:    ["Add head movement between attacks — not just blocking", "Establish the jab before going to kicks", "Use the teep to reset distance, not just attack"],
    drills:      ["Jab-teep × 30 each side", "Clinch position hold: 3×1min", "Boxing guard drill: 5min focus on hand position"],
  },
  technical: {
    strengths:   ["Clean technique", "Disciplined guard", "Precise punch execution", "Good fundamentals base"],
    weaknesses:  ["Too cautious — not enough output", "Slower to adapt in scrambles", "Predictable patterns", "Needs more volume"],
    improves:    ["Add volume — precision is great, but you need more output", "Work on react-and-counter, not just textbook sequences", "Pressure your training partners more"],
    drills:      ["Jab-cross-hook: 100 reps clean form", "Padwork: call-and-react with coach", "Freestyle round: 3min no planned combos"],
  },
};

// ─── Insight pools per technique ─────────────────────────────────────────────

const TECHNIQUE_CUES = {
  uppercut:  ["Drive from your legs, not just arms", "Set it up with a jab — don't telegraph", "Keep elbow in tight, not looping"],
  hook:      ["Pivot on lead foot as you throw", "Keep elbow at shoulder height", "Rotate hip with the shot, not just shoulder"],
  jabCross:  ["Jab to range-find, cross to score", "Return to guard between shots", "Step in on the jab, step out after the cross"],
  jab:       ["Snap it — don't push", "Return to guard immediately", "Use it to control distance"],
  cross:     ["Rotate hip fully into the shot", "Keep chin tucked on extension", "Follow up — don't admire it"],
  slip:      ["Slip to the outside of the jab", "Stay low and tight", "Counter immediately off the slip"],
  pivot:     ["Step with lead foot 45°, don't hop", "Stay balanced through the pivot", "Exit at an angle, not backwards"],
  combo:     ["The last punch ends with guard UP", "Breathe through the combination", "Don't telegraph the entry"],
  footwork:  ["Stay on your toes — not flat-footed", "Move the head with the feet", "Small steps beat big jumps"],
  timing:    ["Don't rush — let the opening come", "Match your breath to your rhythm", "Slow is smooth, smooth is fast"],
};

// ─── Next drills per technique ────────────────────────────────────────────────

const NEXT_DRILLS = {
  uppercut:  "Body-head-uppercut combo: 50 reps, focus on hip drive",
  hook:      "Pivot-hook drill: step left, pivot, throw hook — 3×2min",
  jabCross:  "Jab-cross with guard reset: 3×45s, return hands every rep",
  jab:       "Double jab — cross: 100 reps, focus on snap not push",
  cross:     "Cross with full hip rotation: slow × 30, then speed × 30",
  slip:      "Slip-and-counter: slip the jab, throw the cross — 3×2min",
  pivot:     "Step-pivot-jab: lead foot 45°, jab, reset — × 20 each side",
  combo:     "3-punch combo to guard hold: throw, end with both hands up — 50 reps",
  footwork:  "Lateral shadow box: step-punch-step, no flat feet — 5min",
  timing:    "Timing bag: catch second swing, counter — 3×2min",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function detectStyle(text) {
  for (const s of STYLES) {
    if (s.re.test(text)) return s;
  }
  return STYLES[STYLES.length - 1]; // technical fallback
}

function detectTechnique(text) {
  for (const t of TECHNIQUES) {
    if (t.re.test(text)) return t;
  }
  return TECHNIQUES.find(t => t.key === "combo"); // combo fallback
}

function buildFallback(reel) {
  const searchText = [
    reel.category || "",
    reel.description || "",
    reel.caption || "",
    reel.contentType || "",
    reel.type || "",
  ].join(" ");

  const style = detectStyle(searchText);
  const technique = detectTechnique(searchText);

  const pool = STYLE_POOLS[style.key] || STYLE_POOLS.technical;
  const cues = TECHNIQUE_CUES[technique.key] || TECHNIQUE_CUES.combo;

  return {
    style: style.label,
    styleEmoji: style.emoji,
    technique: technique.label,
    techniqueEmoji: technique.emoji,
    strengths: pickN(pool.strengths, 2),
    weaknesses: pickN(pool.weaknesses, 2),
    improve: pick(pool.improves),
    techniqueCue: pick(cues),
    nextDrill: NEXT_DRILLS[technique.key] || pick(pool.drills),
    isFallback: true,
  };
}

// ─── OpenAI call ──────────────────────────────────────────────────────────────

async function callOpenAI(reel) {
  const reelContext = [
    `Content type: ${reel.contentType || reel.type || "training"}`,
    reel.category ? `Category: ${reel.category}` : null,
    reel.description ? `Description: ${reel.description}` : null,
    reel.caption ? `Caption: ${reel.caption}` : null,
    reel.difficulty ? `Difficulty: ${reel.difficulty}` : null,
  ].filter(Boolean).join("\n");

  const system = `You are a sharp boxing analyst for GAVANA — a combat sports platform.
Analyze a reel and return a JSON breakdown.
Tone: fighter-like, concise, modern. NOT textbook. NOT robotic.
Think: "sharp coach watching ringside".
Always return valid JSON with exactly these keys:
{
  "style": string (e.g. "Counter Puncher"),
  "styleEmoji": string (single emoji),
  "technique": string (e.g. "Jab-Cross"),
  "techniqueEmoji": string (single emoji),
  "strengths": [string, string],
  "weaknesses": [string, string],
  "improve": string (1 sharp sentence),
  "techniqueCue": string (1 technical cue),
  "nextDrill": string (specific drill, 1 line)
}`;

  const user = `Reel to analyze:\n${reelContext}\n\nReturn breakdown JSON only.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      max_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  const parsed = JSON.parse(text);
  return { ...parsed, isFallback: false };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req) {
  try {
    const { reel } = await req.json();
    if (!reel) return Response.json({ error: "Missing reel" }, { status: 400 });

    if (!process.env.OPENAI_API_KEY) {
      if (!loggedMissingKey) {
        console.warn("[ai-breakdown] No OPENAI_API_KEY — using rule-based breakdown");
        loggedMissingKey = true;
      }
      return Response.json(buildFallback(reel));
    }

    try {
      const result = await callOpenAI(reel);
      return Response.json(result);
    } catch (err) {
      if (!loggedApiFailure) {
        console.warn("[ai-breakdown] OpenAI failed, using fallback:", err.message);
        loggedApiFailure = true;
      }
      return Response.json(buildFallback(reel));
    }
  } catch (err) {
    console.error("[ai-breakdown] Route error:", err.message);
    return Response.json({ error: "Failed to generate breakdown" }, { status: 500 });
  }
}
