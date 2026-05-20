export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const keyPrefix = process.env.OPENAI_API_KEY?.slice(0, 12) || "not set";

  return Response.json({
    openai: hasOpenAI ? "configured" : "MISSING — add OPENAI_API_KEY to .env.local",
    keyPrefix: hasOpenAI ? keyPrefix + "..." : "not set",
  });
}
