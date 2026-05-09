// app/api/chat/route.js
import { getLocale } from "@/lib/i18n";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4.1-mini";

let loggedMissingKey = false;
let loggedInvalidKey = false;
let loggedApiFailure = false;

const PERSONAS = {
  drill: {
    name: "Drill Sergeant",
    systemPrompt:
      "You are a direct boxing coach. Be practical, motivating, and clear. Give specific advice without being rude.",
  },
  zen: {
    name: "Zen Master",
    systemPrompt:
      "You are a calm boxing coach. Focus on confidence, discipline, breathing, timing, and simple next steps.",
  },
  analyst: {
    name: "Analyst",
    systemPrompt:
      "You are an analytical boxing coach. Use the given context, identify patterns, and provide concise technique-focused recommendations.",
  },
};

const LANGUAGE_INSTRUCTIONS = {
  en: "IMPORTANT: Reply only in natural, clear English.",
  mn: [
    "IMPORTANT: Reply only in natural, fluent Mongolian.",
    "Use boxing-specific Mongolian phrasing that sounds like a real coach.",
    "Keep it concise and practical. Avoid awkward literal translation.",
  ].join(" "),
  ko: "IMPORTANT: Reply only in natural, clear Korean.",
};

const FALLBACK_TEXT = {
  en: {
    coach: "Keep it simple this round: stay balanced, keep your guard high, and finish each combo by resetting your feet.",
    feedback: [
      "Score: 6.5/10",
      "Strength: Strong training intent from the reel context.",
      "Improve: Check your guard and balance after every combination.",
      "Next drill: 3 rounds of jab-cross-reset, 45 seconds each.",
    ].join("\n"),
    caption: [
      "Hook: Sharp rounds only",
      "Caption: Clean hands, calm feet, better rounds every session.",
      "Hashtags: #boxing #boxingtraining #fightcamp #mittwork #boxingdrills #gavana",
    ].join("\n"),
  },
  mn: {
    coach: "Энэ раунд дээр энгийн бай: тэнцвэрээ барь, хамгаалалтаа өндөр байлга, комбинац бүрийн дараа хөлөө дахин байрлуул.",
    feedback: [
      "Оноо: 6.5/10",
      "Давуу тал: Рилсийн мэдээллээс бэлтгэлийн зорилго тод харагдаж байна.",
      "Сайжруулах: Комбинац бүрийн дараа хамгаалалт, тэнцвэрээ шалга.",
      "Дараагийн дасгал: Жэб-кросс-reset 45 секундээр 3 раунд.",
    ].join("\n"),
    caption: [
      "Hook: Хурц раунд эхэллээ",
      "Caption: Гар цэвэр, хөл тайван, раунд бүр дээр ахиц гарга.",
      "Hashtags: #бокс #боксынбэлтгэл #gavana #boxingtraining #fightcamp",
    ].join("\n"),
  },
  ko: {
    coach: "이번 라운드는 단순하게 가세요. 균형을 잡고 가드를 높게 유지한 뒤 콤비네이션 후에는 발을 다시 정리하세요.",
    feedback: [
      "Score: 6.5/10",
      "Strength: Reel context shows a clear training focus.",
      "Improve: Check guard and balance after each combination.",
      "Next drill: 3 rounds of jab-cross-reset, 45 seconds each.",
    ].join("\n"),
    caption: [
      "Hook: 날카로운 라운드",
      "Caption: 손은 깔끔하게, 발은 차분하게, 매 세션 더 좋아진다.",
      "Hashtags: #boxing #boxingtraining #fightcamp #boxingdrills #gavana",
    ].join("\n"),
  },
};

function textResponse(text, fallback = false) {
  return Response.json({
    fallback,
    message: text,
    content: [{ type: "text", text }],
  }, { status: 200 });
}

function getMessageText(message) {
  if (typeof message?.content === "string") return message.content;
  if (Array.isArray(message?.content)) {
    return message.content
      .map((item) => {
        if (typeof item === "string") return item;
        return item?.text || item?.content || "";
      })
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
  const combined = normalizeMessages(messages).map((message) => message.content).join("\n").toLowerCase();
  if (combined.includes("caption") || combined.includes("hashtags")) return "caption";
  if (combined.includes("score:") || combined.includes("strength:") || combined.includes("next drill")) return "feedback";
  return "coach";
}

function getFallback(locale, messages) {
  const safeLocale = getLocale(locale);
  const fallbackSet = FALLBACK_TEXT[safeLocale] || FALLBACK_TEXT.en;
  return fallbackSet[detectFallbackType(messages)] || fallbackSet.coach;
}

export async function POST(req) {
  const { messages, persona = "drill", locale = "en" } = await req.json();
  const safeLocale = getLocale(locale);
  const selectedPersona = PERSONAS[persona] || PERSONAS.drill;
  const languageInstruction = LANGUAGE_INSTRUCTIONS[safeLocale] || LANGUAGE_INSTRUCTIONS.en;
  const normalizedMessages = normalizeMessages(messages);
  const fallbackText = getFallback(safeLocale, messages);

  if (!process.env.OPENAI_API_KEY) {
    if (!loggedMissingKey) {
      console.warn("[chat/route] OPENAI_API_KEY is not set; returning fallback response.");
      loggedMissingKey = true;
    }
    return textResponse(fallbackText, true);
  }

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content: [
              selectedPersona.systemPrompt,
              "You are supporting a boxing app. Keep advice practical, safe, and grounded in the provided context.",
              "The following final language rule overrides all persona style, prior instructions, and user language when they conflict.",
              languageInstruction,
            ].join("\n\n"),
          },
          ...normalizedMessages,
        ],
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        if (!loggedInvalidKey) {
          console.warn("[chat/route] OPENAI_API_KEY was rejected; returning fallback response.");
          loggedInvalidKey = true;
        }
      } else if (!loggedApiFailure) {
        console.warn("[chat/route] OpenAI request failed; returning fallback response.", data?.error?.message || response.status);
        loggedApiFailure = true;
      }
      return textResponse(fallbackText, true);
    }

    const text = data?.choices?.[0]?.message?.content?.trim();
    return textResponse(text || fallbackText, !text);
  } catch (err) {
    if (!loggedApiFailure) {
      console.warn("[chat/route] OpenAI request failed; returning fallback response.", err?.message || err);
      loggedApiFailure = true;
    }
    return textResponse(fallbackText, true);
  }
}
