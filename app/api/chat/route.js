// app/api/chat/route.js
import { getLocale } from "@/lib/i18n";
import OpenAI from "openai";

const _chatRateMap = new Map();
function isChatRateLimited(key) {
  const now = Date.now();
  const entry = _chatRateMap.get(key) || { count: 0, reset: now + 3_600_000 };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 3_600_000; }
  entry.count++;
  _chatRateMap.set(key, entry);
  return entry.count > 30;
}

const MODEL = "gpt-4o-mini";

// GAVANA platform context injected into every request
const GAVANA_CONTEXT =
  "You are coaching on GAVANA — a combat sports platform for boxers and fighters. " +
  "GAVANA tone: sharp, technical, fighter-like. Not a generic fitness app. Real coaches say more in less. " +
  "Content types on the platform: challenge (score-focused, competitive), educational (coach/explainer), lifestyle (supportive, lighter). " +
  "Adapt tone to context. Always be brief — max 4 sentences unless giving a structured breakdown.";

const PERSONAS = {
  drill: {
    name: "Drill Sergeant",
    systemPrompt:
      "You are a direct, demanding boxing coach. Short sentences, zero fluff. " +
      "Give sharp, actionable cues. Motivate through precision, not cheerleading. " +
      "Examples of your style: 'Guard drops after the jab — fix it.' / 'Reset your feet after every combo.' / 'Again. Cleaner this time.'",
  },
  zen: {
    name: "Zen Master",
    systemPrompt:
      "You are a calm, focused boxing coach who teaches through rhythm and body awareness. " +
      "Focus on breathing, timing, and flow — not scorelines. " +
      "Examples of your style: 'Breathe first, then punch.' / 'Guard is a habit, not a thought.' / 'Your timing is ahead of your rhythm — slow down to speed up.'",
  },
  analyst: {
    name: "Analyst",
    systemPrompt:
      "You are a precise, data-driven boxing coach who identifies patterns and gives score-aware feedback. " +
      "Reference numbers when given. Rank insights by impact. Lead with what matters most. " +
      "Examples of your style: 'Speed score is strong but power drops after 3-punch combos.' / 'Consistency is your ceiling — track it session to session.'",
  },
  champion: {
    name: "Old Champion",
    systemPrompt:
      "You are a wise, battle-hardened boxing veteran who has seen and lived everything in the sport. " +
      "You coach through experience and short stories — one lesson per answer, grounded in real ring moments. " +
      "Warm but direct. You've earned the right to be honest. " +
      "Examples of your style: 'I remember losing a fight because I dropped my guard in round 3. Don't make that mistake.' / " +
      "'The difference between good and great? The great ones train the basics harder.' / " +
      "'Fear isn't the enemy. Letting fear make your decisions — that's the enemy.'",
  },
};

const LANGUAGE_INSTRUCTIONS = {
  en: "IMPORTANT: Reply in natural English. Be concise — one key insight per response, no walls of text.",
  mn: [
    "IMPORTANT: Хариулт нь байгалийн монгол хэлтэй, товч байх ёстой.",
    "Combo, timing, rhythm, tempo, guard, jab, cross, pivot, footwork, reaction, ghost, score, streak, round зэрэг тулааны нэр томьёог АНГЛИАР бич — монгол боксын соёлд эдгээр нь байгалийн хэлбэртэй.",
    "Жишээ нь: 'Combo clean байна.', 'Timing жаахан хоцорч байна.', 'Guard задраад байна.', 'Ghost-оо давлаа.', 'Tempo сайн байна.'",
    "Богино, хурц, тулаанч дуу хоолойтой байгаарай. Урт текст, хиймэл эрч хүч биш.",
  ].join(" "),
  ko: "IMPORTANT: Reply in natural Korean. Be concise. Keep widely-used combat terms (combo, timing, guard, jab, footwork, score) in English when it sounds more natural.",
};

// Fallback pools — only used when OPENAI_API_KEY is not set
const FALLBACK_POOLS = {
  en: {
    coach: [
      "Guard stays up between punches. Combo means nothing if you drop your hands after.",
      "Breathing controls your timing. Exhale on impact, reset on defense.",
      "Reset your stance after every combo. Balance is where the next shot starts.",
    ],
    feedback: [
      "Score: 6.5/10\nStrength: Clean entry angles.\nImprove: Guard drops on the third punch — close that gap.\nNext drill: 3×45s jab-cross, guard check after every set.",
      "Score: 6.5/10\nStrength: Good rhythm on early combos.\nImprove: Footwork resets too slow after 3-punch sequences.\nNext drill: Shadow drill — punch, reset, pivot. 5 minutes.",
      "Score: 6.5/10\nStrength: Consistent tempo.\nImprove: Power drops late in session — work on hip rotation.\nNext drill: Single jab with full hip drive — 50 reps, focus over speed.",
    ],
    caption: [
      "Hook: Sharp. Fast. Focused.\nCaption: Clean hands, clean mind. Better every round.\nHashtags: #boxing #boxingtraining #fightcamp #mittwork #gavana",
      "Hook: Work nobody sees\nCaption: The round that misses the highlight reel still counts.\nHashtags: #boxing #grind #fightcamp #boxingdrills #gavana",
      "Hook: No off days\nCaption: Every session is a deposit. Stay consistent.\nHashtags: #boxing #boxinglife #fightcamp #gavana #boxingtraining",
    ],
  },
  mn: {
    coach: [
      "Guard combo хоорондоо унаад байна. Цохилт хийгээд гараа буцааж татаарай.",
      "Амьсгал нь timing-ийг удирддаг. Цохилтоор гарга, хамгаалалтад амаа.",
      "Combo бүрийн дараа stance-аа дахин тогтоо. Тэнцвэр — дараагийн цохилтын эхлэл.",
    ],
    feedback: [
      "Score: 6.5/10\nДавуу тал: Entry angle цэвэр байна.\nСайжруулах: 3 дахь цохилтод guard буурна — засаарай.\nДараагийн дасгал: Jab-cross 3×45 сек, set болгоны дараа guard шалгаарай.",
      "Score: 6.5/10\nДавуу тал: Эхний combo-д rhythm сайн байна.\nСайжруулах: 3 цохилтын дараа footwork reset удааширна.\nДараагийн дасгал: Shadow — цохилт, reset, pivot. 5 минут.",
      "Score: 6.5/10\nДавуу тал: Tempo тогтвортой.\nСайжруулах: Session-ийн сүүлд power буурна — бүсний эргэлт дээр ажиллаарай.\nДараагийн дасгал: Jab бүрт бүсний дүүрэн эргэлт — 50 удаа, хурд биш фокус.",
    ],
    caption: [
      "Hook: Ghost-оо давах хүртэл зогсохгүй.\nCaption: Tempo өсөж байна. Шинэ best гарна.\nHashtags: #бокс #боксынбэлтгэл #gavana #boxingtraining",
      "Hook: Өчигдрийн өөрийгөө давах өдөр.\nCaption: Score биш process. Давтамж бүр тооцоо.\nHashtags: #бокс #gavana #fightcamp #боксынбэлтгэл",
      "Hook: Хурц. Хурдтай. Анхаарал бүтэн.\nCaption: Clean work. Зогсохгүй.\nHashtags: #бокс #боксынбэлтгэл #gavana #boxing",
    ],
  },
  champion: {
    coach: [
      "Every great fighter I ever trained had one thing in common — they mastered the basics first. What basic are you neglecting?",
      "I've been knocked down more times than I can count. The ones who got back up faster always won in the long run.",
      "Don't chase the highlight reel. The rounds nobody films are the ones that build champions.",
    ],
    feedback: [
      "Score: 6.5/10\nWhat I see: Good instincts, raw edges.\nThe old me would say: 'Clean it up or it'll cost you when it counts.'\nNext step: Slow it down 30% and do it perfect. Speed comes after.",
      "Score: 6.5/10\nI've seen this before: Strong start, fades late.\nIn my day we called it 'gas tank problem.' It's fixable.\nNext drill: Add 2 more rounds at 60% intensity. Build the engine.",
      "Score: 6.5/10\nYour guard is telling me something — it drops when you're tired.\nI learned that lesson the hard way in my third fight.\nNext drill: Guard check after every combination. Make it a reflex.",
    ],
    caption: [
      "Hook: Some lessons only the ring can teach.\nCaption: Every session is a story. What chapter are you on?\nHashtags: #boxing #fightcamp #gavana #boxinglife",
      "Hook: Old school. New results.\nCaption: The fundamentals never go out of style.\nHashtags: #boxing #boxingtraining #gavana #champion",
    ],
  },
  ko: {
    coach: [
      "펀치 사이에 가드를 올려두세요. 콤보 후 손을 내리면 아무 의미가 없습니다.",
      "호흡이 타이밍을 제어합니다. 임팩트에서 내쉬고, 방어에서 리셋하세요.",
      "콤보 후에 스탠스를 리셋하세요. 균형이 다음 샷의 시작점입니다.",
    ],
    feedback: [
      "Score: 6.5/10\n강점: 진입 각도가 깔끔합니다.\n개선: 세 번째 펀치에서 가드가 내려갑니다 — 수정하세요.\n다음 훈련: 잽-크로스 3×45초, 매 세트 후 가드 체크.",
      "Score: 6.5/10\n강점: 초반 콤보의 리듬이 좋습니다.\n개선: 3타 후 풋워크 리셋이 느립니다.\n다음 훈련: 섀도우 — 펀치, 리셋, 피벗. 5분.",
      "Score: 6.5/10\n강점: 일관된 템포.\n개선: 후반에 파워가 떨어집니다 — 힙 회전을 강화하세요.\n다음 훈련: 잽마다 완전한 힙 드라이브 — 50회, 속도보다 집중.",
    ],
    caption: [
      "Hook: 날카롭게. 빠르게. 집중해서.\nCaption: 깔끔한 손, 맑은 정신. 매 라운드 더 나아진다.\nHashtags: #boxing #boxingtraining #fightcamp #gavana",
      "Hook: 아무도 보지 않는 훈련\nCaption: 하이라이트에 안 나오는 라운드도 카운트된다.\nHashtags: #boxing #grind #fightcamp #gavana",
    ],
  },
};

function textResponse(text, fallback = false) {
  return Response.json({
    fallback,
    _source: fallback ? "fallback" : "openai",
    message: text,
    content: [{ type: "text", text }],
  }, { status: 200 });
}

function errorResponse(locale, detail = "") {
  const base = locale === "mn"
    ? "AI коуч одоогоор боломжгүй байна."
    : locale === "ko"
    ? "AI 코치를 현재 사용할 수 없습니다."
    : "AI coach is currently unavailable.";
  const msg = detail ? `${base} (${detail})` : base;
  return Response.json({ aiError: true, _source: "error", message: msg, content: [{ type: "text", text: msg }] }, { status: 200 });
}

function getMessageText(message) {
  if (typeof message?.content === "string") return message.content;
  if (Array.isArray(message?.content)) {
    return message.content
      .map((item) => (typeof item === "string" ? item : item?.text || item?.content || ""))
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function normalizeMessages(messages) {
  return Array.isArray(messages)
    ? messages
        .map((message) => ({
          role: message?.role === "assistant" ? "assistant" : "user",
          content: getMessageText(message),
        }))
        .filter((message) => message.content.trim())
    : [];
}

function detectFallbackType(messages) {
  const combined = normalizeMessages(messages).map((m) => m.content).join("\n").toLowerCase();
  if (combined.includes("caption") || combined.includes("hashtags")) return "caption";
  if (combined.includes("score:") || combined.includes("strength:") || combined.includes("next drill") || combined.includes("/10")) return "feedback";
  return "coach";
}

function getFallback(locale, messages) {
  const safeLocale = getLocale(locale);
  const pool = FALLBACK_POOLS[safeLocale] || FALLBACK_POOLS.en;
  const type = detectFallbackType(messages);
  const options = pool[type] || pool.coach;
  return options[Math.floor(Math.random() * options.length)];
}

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isChatRateLimited(ip)) return Response.json({ error: "Rate limited" }, { status: 429 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  let { messages, persona = "drill", locale = "en", coachContext = null } = body;

  const MAX_MESSAGES = 20;
  const MAX_MSG_LEN = 800;
  if (!Array.isArray(messages)) messages = [];
  messages = messages.slice(-MAX_MESSAGES).map((m) => ({
    ...m,
    content: typeof m?.content === "string" ? m.content.slice(0, MAX_MSG_LEN) : m?.content,
  }));

  const safeLocale = getLocale(locale);
  const selectedPersona = PERSONAS[persona] || PERSONAS.drill;
  const languageInstruction = LANGUAGE_INSTRUCTIONS[safeLocale] || LANGUAGE_INSTRUCTIONS.en;
  const normalizedMessages = normalizeMessages(messages);

  const hasKey = !!process.env.OPENAI_API_KEY;
  const keyHint = hasKey ? `sk-...${process.env.OPENAI_API_KEY.slice(-4)}` : "NOT SET";
  console.log(`[chat/route] request — KEY:${keyHint} locale:${safeLocale} persona:${persona} msgs:${normalizedMessages.length}`);

  // No API key — return error (never silently serve canned responses)
  if (!hasKey) {
    console.error("[chat/route] OPENAI_API_KEY is not configured. Set it in Vercel → Settings → Environment Variables.");
    return errorResponse(safeLocale, "OPENAI_API_KEY not configured");
  }

  const systemPrompt = [
    selectedPersona.systemPrompt,
    GAVANA_CONTEXT,
    coachContext && typeof coachContext === "string" ? coachContext.slice(0, 1200) : null,
    "The following language rule overrides all persona style and prior instructions.",
    languageInstruction,
  ].filter(Boolean).join("\n\n");

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 600,
      messages: [
        { role: "system", content: systemPrompt },
        ...normalizedMessages,
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      console.error("[chat/route] OpenAI returned empty response.");
      return errorResponse(safeLocale, "Empty response from OpenAI");
    }
    console.log(`[chat/route] OpenAI success — model:${MODEL} tokens:${completion.usage?.total_tokens ?? "?"}`);
    return textResponse(text);
  } catch (err) {
    const status = err?.status ?? err?.statusCode ?? "?";
    const code = err?.code ?? "";
    const msg = err?.message || String(err);
    const isAuth = status === 401 || code === "invalid_api_key";
    console.error(`[chat/route] OpenAI error [${isAuth ? "AUTH/KEY" : `HTTP ${status}`}]: ${msg}`);
    if (isAuth) {
      return errorResponse(safeLocale, "Invalid API key — check OPENAI_API_KEY in Vercel");
    }
    return errorResponse(safeLocale, msg);
  }
}
