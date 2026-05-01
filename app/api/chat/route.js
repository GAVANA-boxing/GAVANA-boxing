// app/api/chat/route.js
import Anthropic from "@anthropic-ai/sdk";
import { getLocale } from "@/lib/i18n";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
  mn: "IMPORTANT: Reply only in natural, fluent Mongolian. Use correct Mongolian grammar, clear meaning, and avoid awkward literal translations. Keep advice direct, simple, and easy to understand, like a helpful boxing coach speaking naturally.",
  ko: "IMPORTANT: Reply only in natural, clear Korean.",
};

export async function POST(req) {
  const { messages, persona = "drill", locale = "en" } = await req.json();
  const safeLocale = getLocale(locale);
  const selectedPersona = PERSONAS[persona] || PERSONAS.drill;
  const languageInstruction = LANGUAGE_INSTRUCTIONS[safeLocale] || LANGUAGE_INSTRUCTIONS.en;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1000,
    system: [
      selectedPersona.systemPrompt,
      "The following final language rule overrides all persona style, prior instructions, and user language when they conflict.",
      languageInstruction,
    ].join("\n\n"),
    messages,
  });

  return Response.json(response);
}
