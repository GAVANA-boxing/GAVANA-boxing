// Fighter-specific context for the AI coach (app/api/chat/route.js). Matched as WHOLE WORDS:
// a substring test made "ali" fire inside "valid" (the drill builder's own JSON instruction).

// ── Fighter-specific context injection ───────────────────────────────────────
const FIGHTER_CONTEXT = {
  "tyson":      "Mike Tyson fought from inside range using peekaboo defense. His signature: explosive entry + short hooks from hip load.",
  "ali":        "Muhammad Ali used lateral movement, jab control, and pull-counters. He made opponents miss, then punished.",
  "inoue":      "Naoya Inoue attacks the body first to open the head. Patient pressure with explosive counter timing.",
  "bivol":      "Dmitry Bivol controls distance with a systematic jab. Guard resets after every punch. Never stationary.",
  "lomachenko": "Vasyl Lomachenko creates angles through pivots. He attacks from unexpected angles — never straight lines.",
  "canelo":     "Canelo uses shoulder roll to invite punches, then counters. Body shot patient builder — sets up the head shot.",
  "golovkin":   "GGG throws double jab before every power shot. High volume, relentless forward pressure, body work opener.",
  "mayweather": "Mayweather fights from Philly shell. Right hand lead disrupts opponents. Check hook on pressure. Defense = offense.",
  "pacquiao":   "Manny Pacquiao steps outside the lead foot (southpaw angle). 5-punch combinations in 2 seconds. Never single shots.",
  "duran":      "Roberto Duran gets inside immediately. Short punches, head pressure, psychological intimidation from bell 1.",
};

export function getFighterContext(messages) {
  const text = messages.map(m => typeof m?.content === 'string' ? m.content : '').join(' ').toLowerCase();
  for (const [key, ctx] of Object.entries(FIGHTER_CONTEXT)) {
    if (new RegExp(`(^|[^a-z])${key}([^a-z]|$)`).test(text)) return `Fighter context: ${ctx}`;
  }
  return null;
}

