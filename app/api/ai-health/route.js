export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  return Response.json({
    openai: hasOpenAI ? "configured" : "MISSING — add OPENAI_API_KEY to .env.local",
  });
}
