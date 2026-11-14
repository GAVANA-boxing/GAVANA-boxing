// The request the AI drill builder sends to /api/chat. Pure, so the one thing that broke it can be
// tested: /api/chat keeps only the first 800 characters of a message, and the JSON instruction
// is at the END of this one — the fighter context must travel in `coachContext` (system prompt),
// never inside the message.

export const CHAT_MESSAGE_LIMIT = 800; // app/api/chat/route.js: m.content.slice(0, 800)

export function buildDrillRequest({ area, type, context = "", locale = "en" }) {
  const prompt = `Generate exactly 5 boxing drills for the area: ${area}, drill type: ${type}.
Return ONLY valid JSON array, no markdown, no explanation:
[{"name":"...","difficulty":"Beginner|Intermediate|Advanced","duration":"...","steps":["step1","step2","step3"]}]`;
  return {
    messages: [{ role: "user", content: prompt }],
    persona: "analyst",
    locale,
    coachContext: context || null,
  };
}
