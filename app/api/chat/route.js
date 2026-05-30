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
  /хэрхэн|яаж|яагаад|заа|тайлбарла/i,          // mn: how, teach, explain
  /алхам|дасгал|техник/i,                         // mn: steps, drill, technique
  /how\s+to|teach|explain|what\s+is|steps/i,       // en
  /jab|cross|hook|uppercut|guard|footwork|stance|pivot|slip|roll|combo/i,
];

function isTechniqueQuestion(normalizedMsgs) {
  const lastUser = [...normalizedMsgs].reverse().find((m) => m.role === "user");
  if (!lastUser) return false;
  return TECHNIQUE_PATTERNS.some((re) => re.test(lastUser.content));
}

const TECHNIQUE_FORMAT = {
  mn: [
    "Техникийн асуултанд дараах бүтцээр хариулна:",
    "1) Товч тайлбар (1-2 өгүүлбэр)",
    "2) Алхам алхмаар зааварчилгаа (3-5 алхам)",
    "3) Нийтлэг алдаа (1-2)",
    "4) Дасгал (нэг тодорхой дасгал)",
    "Шаардлагатай бол аюулгүй байдлын зөвлөгөө нэм.",
  ].join(" "),
  en: [
    "For technique questions use this structure:",
    "1) Brief explanation (1-2 sentences)",
    "2) Step-by-step cues (3-5 steps)",
    "3) Common mistakes (1-2)",
    "4) One drill",
    "Add a safety note if relevant.",
  ].join(" "),
  ko: [
    "기술 질문에는 다음 형식으로 답변하세요:",
    "1) 간단한 설명, 2) 단계별 지침, 3) 흔한 실수, 4) 드릴 하나.",
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
  let { messages, persona = "drill", locale = "en", coachContext = null } = body;

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
  const techFormat = isTechQ ? (TECHNIQUE_FORMAT[safeLocale] || TECHNIQUE_FORMAT.en) : null;

  const hasKey = !!process.env.OPENAI_API_KEY;
  const keyHint = hasKey ? `sk-...${process.env.OPENAI_API_KEY.slice(-4)}` : "NOT SET";
  console.log(`[chat/route] KEY:${keyHint} locale:${safeLocale}(client:${locale}) persona:${persona} msgs:${normalizedMessages.length} technique:${isTechQ}`);

  if (!hasKey) {
    console.error("[chat/route] OPENAI_API_KEY is not configured — Vercel → Settings → Environment Variables.");
    return errorResponse(safeLocale, "OPENAI_API_KEY not configured");
  }

  // Language instruction goes FIRST in system prompt so it anchors the whole response
  const systemParts = [
    langInstruction,
    selectedPersona.systemPrompt,
    GAVANA_CONTEXT,
    coachContext && typeof coachContext === "string" ? coachContext.slice(0, 1200) : null,
    techFormat,
  ].filter(Boolean);

  const systemPrompt = systemParts.join("\n\n");

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 700,
      temperature: 0.65,
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
    console.log(`[chat/route] OpenAI success — tokens:${completion.usage?.total_tokens ?? "?"} locale:${safeLocale}`);
    return textResponse(text);
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
