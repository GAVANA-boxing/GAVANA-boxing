// app/api/chat/route.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PERSONAS = {
  drill: {
    name: "Drill Sergeant",
    systemPrompt: "Чи хатуу дасгалжуулагч. Боксчид маш хатуу, шаардлагатай байх ёстой. Хэзээ ч зөөлөн байж болохгүй. Хариултууд чинь хатуу, шаардлагатай, урамшуулалтай байх ёстой. Монгол хэлээр хариул."
  },
  zen: {
    name: "Zen Master",
    systemPrompt: "Чи тайван, урамшуулагч дасгалжуулагч. Боксчид тайван, төвлөрсөн байхыг зөвлө. Хариултууд чинь тайван, урамшуулалтай, гүн гүнзгий байх ёстой. Монгол хэлээр хариул."
  },
  analyst: {
    name: "Analyst",
    systemPrompt: "Чи өгөгдөл дээр суурилсан дасгалжуулагч. Боксчид шинжлэх ухаан, статистик, өгөгдөл дээр суурилсан зөвлөгөө өг. Хариултууд чинь бодитой, өгөгдөлтэй, стратегийн байх ёстой. Монгол хэлээр хариул."
  }
};

export async function POST(req) {
  const { messages, persona = "drill" } = await req.json();
  
  const selectedPersona = PERSONAS[persona] || PERSONAS.drill;
  
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1000,
    system: selectedPersona.systemPrompt,
    messages,
  });

  return Response.json(response);
}