import { verifyIdToken } from "@/lib/verifyAuth";

export async function GET(req) {
  const uid = await verifyIdToken(req);
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const keyPrefix = process.env.OPENAI_API_KEY?.slice(0, 12) || "not set";

  return Response.json({
    openai: hasOpenAI ? "configured" : "MISSING",
    keyPrefix: hasOpenAI ? keyPrefix + "..." : "not set",
    node: process.version,
  });
}
