import { verifyIdToken } from "@/lib/verifyAuth";

const PROJECT = "gavana-boxing-89a22";

const _reportRateMap = new Map();
function isReportRateLimited(uid) {
  const now = Date.now();
  const entry = _reportRateMap.get(uid) || { count: 0, reset: now + 3_600_000 };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 3_600_000; }
  entry.count++;
  _reportRateMap.set(uid, entry);
  return entry.count > 10;
}

const VALID_TARGET_TYPES = ["reel", "user", "comment", "event"];
const VALID_REASONS      = ["spam", "violence", "harassment", "misinform", "other"];

let _cachedToken = null;
let _tokenExpiry = 0;

async function getServiceAccountToken() {
  if (_cachedToken && Date.now() < _tokenExpiry - 60_000) return _cachedToken;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) return null;
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const credentials = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/datastore"],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    _cachedToken = tokenResponse.token;
    _tokenExpiry = Date.now() + 3_600_000;
    return _cachedToken;
  } catch { return null; }
}

export async function POST(req) {
  const reporterId = await verifyIdToken(req);
  if (!reporterId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (isReportRateLimited(reporterId)) return Response.json({ error: "Rate limited" }, { status: 429 });

  const { targetId, targetType = "reel", reason = "other", note = "" } = await req.json();
  if (!targetId) return Response.json({ error: "Missing targetId" }, { status: 400 });
  if (!VALID_TARGET_TYPES.includes(targetType)) return Response.json({ error: "Invalid targetType" }, { status: 400 });
  if (!VALID_REASONS.includes(reason)) return Response.json({ error: "Invalid reason" }, { status: 400 });

  const serviceToken = await getServiceAccountToken();
  if (!serviceToken) return Response.json({ error: "Server configuration error" }, { status: 500 });

  const body = {
    fields: {
      reporterId: { stringValue: reporterId },
      targetId:   { stringValue: targetId },
      targetType: { stringValue: targetType },
      reason:     { stringValue: reason },
      note:       { stringValue: note.slice(0, 500) },
      status:     { stringValue: "pending" },
      createdAt:  { timestampValue: new Date().toISOString() },
    },
  };

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/reports`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceToken}` },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) return Response.json({ error: "Failed to write report" }, { status: 500 });
  return Response.json({ ok: true });
}
