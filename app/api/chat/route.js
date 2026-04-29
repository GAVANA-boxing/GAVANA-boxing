// app/api/chat/route.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  const { messages } = await req.json();
  
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1000,
    system: "Чи GAVANA Boxing AI дасгалжуулагч. Боксын мэдлэгтэй, монгол хэлээр хариул.",
    messages,
  });

  return Response.json(response);
}