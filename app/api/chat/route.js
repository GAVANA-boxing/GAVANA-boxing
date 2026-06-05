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

// ── Personas ──────────────────────────────────────────────────────────────────
const PERSONAS = {
  drill: {
    name: "Drill Sergeant",
    systemPrompt:
      "You are a direct, demanding boxing coach. Short sentences. Zero filler. " +
      "Every answer must be immediately actionable — something the fighter can do in the next round. " +
      "Correct technique errors sharply. No vague encouragement.",
  },
  zen: {
    name: "Zen Master",
    systemPrompt:
      "You are a calm boxing coach who teaches through body awareness and rhythm. " +
      "Focus on breathing, timing, and flow. Precise language, no noise.",
  },
  analyst: {
    name: "Analyst",
    systemPrompt:
      "You are a data-driven boxing coach. Reference numbers when provided. " +
      "Rank insights by impact. Lead with what matters most. Be specific.",
  },
  champion: {
    name: "Old Champion",
    systemPrompt:
      "You are a veteran boxing coach. You teach through experience — one concrete lesson per answer. " +
      "Warm but direct. You have earned the right to be honest.",
  },
};

// ── GAVANA platform context ───────────────────────────────────────────────────
const GAVANA_CONTEXT =
  "Platform: GAVANA — a combat sports training app. " +
  "Fighters use it to track sessions, improve technique, and compete. " +
  "Tone: sharp, technical, practical. Like a real boxing coach — not a fitness chatbot. " +
  "Max 5 sentences per response unless the user asks for a full breakdown.";

// ── Language instructions ─────────────────────────────────────────────────────
const LANGUAGE_INSTRUCTIONS = {
  en: [
    "LANGUAGE: Respond in English only.",
    "Be concise. One main insight per reply. No walls of text.",
  ].join(" "),

  mn: [
    "ХЭЛНИЙ ДҮРЭМ — ЭНЭ НЬ БУСАД БҮХНИЙГ ДАРДАГ:",
    "Та ЗӨВХӨН МОНГОЛ КИРИЛЛ ҮСГЭЭР хариулна. Кирилл үсэг гэдэг нь: А Б В Г Д Е Ж З И Й К Л М Н О Ө П Р С Т У Ү Ф Х Ц Ч Ш Щ Ъ Ь Э Ю Я.",
    "ХОРИГЛОНО: Латин/романчлагдсан монгол бичихийг огт хориглоно. 'Jab ih ondoor biel' гэх мэт бичих ОГТХОН ч болохгүй.",
    "Хэрэглэгч латинаар монголоор бичсэн ч (жишээ нь 'Jab herhen tsohih we'), та МОНГОЛ КИРИЛЛЭЭР хариулна.",
    "Тулааны нэр томьёо АНГЛИАР бичнэ: jab, cross, hook, uppercut, combo, guard, footwork, timing, rhythm, tempo, pivot, stance, drill, shadow, slip, roll, round, score.",
    "Бусад бүх үг МОНГОЛ КИРИЛЛЭЭР. Товч, хурц, практик.",
  ].join(" "),

  ko: [
    "LANGUAGE: Respond in Korean only.",
    "Keep combat terms in English when natural: combo, timing, guard, jab, footwork, score.",
    "Be concise and direct.",
  ].join(" "),
};

// ── Technique question detection ──────────────────────────────────────────────
const TECHNIQUE_PATTERNS = [
  /хэрхэн|яаж|яагаад|заа|тайлбарла/i,
  /алхам|дасгал|техник/i,
  /how\s+to|teach|explain|what\s+is|steps/i,
  /jab|cross|hook|uppercut|guard|footwork|stance|pivot|slip|roll|combo/i,
];

function isTechniqueQuestion(normalizedMsgs) {
  const lastUser = [...normalizedMsgs].reverse().find((m) => m.role === "user");
  if (!lastUser) return false;
  return TECHNIQUE_PATTERNS.some((re) => re.test(lastUser.content));
}

// ── JSON schema instructions (json_mode = true) ───────────────────────────────
const JSON_SCHEMA_INSTRUCTIONS = {
  en: [
    "RESPONSE FORMAT — return ONLY a valid JSON object, no prose outside it.",
    "Choose the correct variant based on the question type:",
    '"variant": "full" for detailed technique breakdowns (how-to, step-by-step, fix my X);',
    '"variant": "short" for quick tips, single concepts, motivational coaching (2–3 cues max);',
    '"variant": "conversational" for greetings, context questions, mindset, feelings, simple answers.',
    "Schema:",
    '{ "variant": "full" | "short" | "conversational",',
    '  "title": "emoji + 2–5 word title (omit for conversational)",',
    '  "keyCues": ["cue 1", "cue 2", "cue 3"],  // required for full/short, omit for conversational',
    '  "commonMistake": "One sentence.",          // full only',
    '  "drill": "One sentence with reps/sets.",   // full only',
    '  "nextAction": "One sentence.",             // full only',
    '  "message": "Plain text answer."            // conversational only — no bullet lists }',
    "keyCues max: full=4, short=3. Never mix message + keyCues.",
  ].join(" "),

  mn: [
    "ХАРИУЛТ ФОРМАТ — Зөвхөн хүчинтэй JSON объект, гадна текст огт байхгүй.",
    "Асуултын төрлөөс хамаарч variant сонго:",
    '"variant": "full" — техникийн нарийн тайлбар (яаж, алхам алхмаар, засах);',
    '"variant": "short" — хурдан зөвлөгөө, нэг ойлголт, урам өгөх (2–3 зааварчилгаа);',
    '"variant": "conversational" — мэндчилгээ, нөхцөл байдлын асуулт, мэдрэмж, энгийн хариулт.',
    "Схем:",
    '{ "variant": "full" | "short" | "conversational",',
    '  "title": "emoji + 2–5 үгтэй гарчиг (conversational-д орхи)",',
    '  "keyCues": ["зааварчилгаа 1", "зааварчилгаа 2"],  // full/short-д шаардлагатай',
    '  "commonMistake": "Нэг өгүүлбэр.",  // full-д л',
    '  "drill": "Нэг өгүүлбэр, давталт/хугацаатай.",  // full-д л',
    '  "nextAction": "Нэг өгүүлбэр.",  // full-д л',
    '  "message": "Цэвэр текст хариулт." }  // conversational-д л',
    "keyCues: full=4, short=3. МОНГОЛ КИРИЛЛЭЭР. Тулааны нэр томьёо АНГЛИАР: jab, cross, hook, guard, combo.",
  ].join(" "),

  ko: [
    "RESPONSE FORMAT — return ONLY valid JSON, no prose outside it.",
    "Choose variant: 'full' for technique breakdowns; 'short' for quick tips; 'conversational' for simple/context answers.",
    '{ "variant": "full" | "short" | "conversational",',
    '  "title": "emoji + title (skip for conversational)",',
    '  "keyCues": ["cue 1", "cue 2"],  // full/short only',
    '  "commonMistake": "One sentence.",  // full only',
    '  "drill": "One sentence.",  // full only',
    '  "nextAction": "One sentence.",  // full only',
    '  "message": "Plain answer."  // conversational only }',
    "All values in Korean except boxing terms.",
  ].join(" "),
};

// ── Structured output format ─────────────────────────────────────────────────
// Applied to EVERY response so the bubble renderer can parse sections/bullets.
const FORMAT_INSTRUCTIONS = {
  en: [
    "FORMAT — apply to every response without exception:",
    "Line 1: emoji + short title (2–5 words). Example: '🥊 Fix Your Jab'",
    "Then: bullet points starting with • for all cues, steps, observations. No paragraphs.",
    "Blank line before ⚠️ mistake section and before 🎯 drill section.",
    "⚠️ for mistakes/warnings (1 line), 🎯 for the drill/next step (1 line), 📊 for numbers/scores.",
    "Max 5 bullet points. Max 10 words per bullet. Never write a paragraph.",
    "Example:\n🥊 Fix Your Jab\n• Keep chin down\n• Extend from shoulder, not arm\n• Snap back to guard immediately\n\n⚠️ Mistake:\nPushing instead of snapping — kills power.\n\n🎯 Drill:\n30 jabs → guard each time. 3 sets.",
  ].join(" "),

  mn: [
    "ФОРМАТЫН ДҮРЭМ — бүх хариулт заавал:",
    "1-р мөр: emoji + богино гарчиг (2–5 үг). Жишээ: '🥊 Jab засах'",
    "Дараа нь: бүх зааварчилгааг • цэгтэй мөрөөр бичнэ. Параграф ХОРИГЛОНО.",
    "⚠️ алдаа болон 🎯 дасгал хэсгийн өмнө хоосон мөр.",
    "⚠️ — алдаа (1 мөр), 🎯 — дасгал (1 мөр), 📊 — score/тоон мэдээлэл.",
    "Хамгийн ихдээ 5 цэгт мөр. Мөр бүр 10-аас ихгүй үг.",
    "Жишээ:\n🥊 Jab засах\n• Эрүүгээ хамгаал\n• Мөрөөрөө чиглүүл\n• Guard руу хурдан буцаа\n\n⚠️ Алдаа:\nТүлхэж цохих — хүч алдана.\n\n🎯 Дасгал:\n30 jab → guard болгон. 3 сет.",
  ].join(" "),

  ko: [
    "FORMAT — apply to every response:",
    "Line 1: emoji + short title (2–5 words).",
    "Then: bullets (•) for all cues — no paragraphs.",
    "⚠️ mistake (1 line), 🎯 drill (1 line), blank line between sections.",
    "Max 5 bullets. Max 10 words per bullet.",
  ].join(" "),
};

// ── Cyrillic detection → force mn locale ─────────────────────────────────────
function detectLocale(messages, clientLocale) {
  const text = (Array.isArray(messages) ? messages : [])
    .map((m) => (typeof m?.content === "string" ? m.content : ""))
    .join(" ");
  // Any Cyrillic character in the conversation → mn
  if (/[Ѐ-ӿ]/.test(text)) return "mn";
  return getLocale(clientLocale);
}

// ── Message helpers ───────────────────────────────────────────────────────────
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
        .map((m) => ({
          role: m?.role === "assistant" ? "assistant" : "user",
          content: getMessageText(m),
        }))
        .filter((m) => m.content.trim())
    : [];
}

// ── Response helpers ──────────────────────────────────────────────────────────
function textResponse(text) {
  return Response.json({
    _source: "openai",
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
  return Response.json({
    aiError: true,
    _source: "error",
    message: msg,
    content: [{ type: "text", text: msg }],
  }, { status: 200 });
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isChatRateLimited(ip)) return Response.json({ error: "Rate limited" }, { status: 429 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  let { messages, persona = "drill", locale = "en", coachContext = null, json_mode = false } = body;

  if (!Array.isArray(messages)) messages = [];
  messages = messages.slice(-20).map((m) => ({
    ...m,
    content: typeof m?.content === "string" ? m.content.slice(0, 800) : m?.content,
  }));

  // Detect locale from message content (Cyrillic → mn overrides client value)
  const safeLocale = detectLocale(messages, locale);
  const normalizedMessages = normalizeMessages(messages);
  const selectedPersona = PERSONAS[persona] || PERSONAS.drill;
  const langInstruction = LANGUAGE_INSTRUCTIONS[safeLocale] || LANGUAGE_INSTRUCTIONS.en;
  const isTechQ = isTechniqueQuestion(normalizedMessages);
  const formatInstruction = json_mode
    ? (JSON_SCHEMA_INSTRUCTIONS[safeLocale] || JSON_SCHEMA_INSTRUCTIONS.en)
    : (FORMAT_INSTRUCTIONS[safeLocale] || FORMAT_INSTRUCTIONS.en);

  const hasKey = !!process.env.OPENAI_API_KEY;
  const keyHint = hasKey ? `sk-...${process.env.OPENAI_API_KEY.slice(-4)}` : "NOT SET";
  console.log(`[chat/route] KEY:${keyHint} locale:${safeLocale}(client:${locale}) persona:${persona} msgs:${normalizedMessages.length} technique:${isTechQ}`);

  if (!hasKey) {
    console.error("[chat/route] OPENAI_API_KEY is not configured — Vercel → Settings → Environment Variables.");
    return errorResponse(safeLocale, "OPENAI_API_KEY not configured");
  }

  // Order: language → persona → platform context → user context → format (closest to completion)
  const systemParts = [
    langInstruction,
    selectedPersona.systemPrompt,
    GAVANA_CONTEXT,
    coachContext && typeof coachContext === "string" ? coachContext.slice(0, 1200) : null,
    formatInstruction,
  ].filter(Boolean);

  const systemPrompt = systemParts.join("\n\n");

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const callOpts = {
      model: MODEL,
      max_tokens: 700,
      temperature: 0.65,
      messages: [
        { role: "system", content: systemPrompt },
        ...normalizedMessages,
      ],
    };
    if (json_mode) callOpts.response_format = { type: "json_object" };

    const completion = await client.chat.completions.create(callOpts);

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      console.error("[chat/route] OpenAI returned empty response.");
      return errorResponse(safeLocale, "Empty response from OpenAI");
    }
    console.log(`[chat/route] OpenAI success — tokens:${completion.usage?.total_tokens ?? "?"} locale:${safeLocale} json_mode:${json_mode}`);

    if (json_mode) {
      try {
        const structured = JSON.parse(raw);
        const cues = Array.isArray(structured.keyCues) ? structured.keyCues.map((c) => `• ${c}`).join("\n") : "";
        const text = [
          structured.title || "",
          cues,
          structured.commonMistake ? `\n⚠️ ${structured.commonMistake}` : "",
          structured.drill ? `\n🎯 ${structured.drill}` : "",
          structured.nextAction ? `\n✅ ${structured.nextAction}` : "",
        ].filter(Boolean).join("\n");
        return Response.json({ _source: "openai", structured, message: text, content: [{ type: "text", text }] }, { status: 200 });
      } catch {
        console.warn("[chat/route] JSON parse failed — falling back to plain text");
      }
    }

    return textResponse(raw);
  } catch (err) {
    const status = err?.status ?? err?.statusCode ?? "?";
    const code = err?.code ?? "";
    const msg = err?.message || String(err);
    const isAuth = status === 401 || code === "invalid_api_key";
    console.error(`[chat/route] OpenAI FAILED [${isAuth ? "AUTH/KEY" : `HTTP ${status}`}]: ${msg}`);
    if (isAuth) return errorResponse(safeLocale, "Invalid API key — check OPENAI_API_KEY in Vercel");
    return errorResponse(safeLocale, msg);
  }
}
