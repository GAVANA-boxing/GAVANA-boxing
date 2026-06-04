import { verifyIdToken } from "@/lib/verifyAuth";

const PROJECT_ID = "gavana-boxing-89a22";

// In-memory rate limit: max 20 push notifications per uid per minute.
const _rateMap = new Map();
function isRateLimited(uid) {
  const now = Date.now();
  const entry = _rateMap.get(uid) || { count: 0, reset: now + 60_000 };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 60_000; }
  entry.count++;
  _rateMap.set(uid, entry);
  return entry.count > 20;
}
const FCM_V1_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

let _cachedToken = null;
let _tokenExpiry = 0;

async function getFcmAccessToken() {
  if (_cachedToken && Date.now() < _tokenExpiry - 60_000) return _cachedToken;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) return null;
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const credentials = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    _cachedToken = tokenResponse.token;
    _tokenExpiry = Date.now() + 3_600_000;
    return _cachedToken;
  } catch (e) {
    console.error("FCM token error:", e);
    return null;
  }
}

async function getFcmTokens(recipientId) {
  const API_KEY = "AIzaSyDwVdR5oVYSXQbWL4jqNSNx9cqKuKxqt6c";
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${recipientId}/fcmTokens?key=${API_KEY}`;
  try {
    const snap = await fetch(url);
    if (!snap.ok) return [];
    const data = await snap.json();
    return (data.documents || []).map((d) => d.fields?.token?.stringValue).filter(Boolean);
  } catch {
    return [];
  }
}

export async function POST(req) {
  const uid = await verifyIdToken(req);
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const accessToken = await getFcmAccessToken();
  if (!accessToken) return Response.json({ sent: 0, note: "FCM service account not configured" });

  if (isRateLimited(uid)) return Response.json({ error: "Rate limited" }, { status: 429 });

  const { recipientId, title, body, url, archetype } = await req.json();
  if (!recipientId || !title) return Response.json({ error: "Missing recipientId or title" }, { status: 400 });
  if (typeof title !== "string" || title.length > 120) return Response.json({ error: "Invalid title" }, { status: 400 });
  if (body && (typeof body !== "string" || body.length > 300)) return Response.json({ error: "Invalid body" }, { status: 400 });
  if (recipientId === uid) return Response.json({ sent: 0 }); // no self-notify

  // Archetype-specific notification boost
  const ARCH_SUFFIX = {
    pressure:   { en: " Keep pushing forward.", mn: " Урагшлаа!", ko: " 계속 밀어붙이세요." },
    outboxer:   { en: " Work your range.", mn: " Зайгаа хадгал.", ko: " 거리를 유지하세요." },
    counter:    { en: " Wait for the perfect moment.", mn: " Мөчийг хүлээ.", ko: " 완벽한 순간을 기다리세요." },
    explosive:  { en: " Explode on command.", mn: " Тэсрэлтийн хүч!", ko: " 폭발하세요!" },
    technician: { en: " Precision is power.", mn: " Нарийвчлал бол хүч.", ko: " 정밀함이 힘입니다." },
  };
  let enrichedBody = body || "";
  if (archetype && ARCH_SUFFIX[archetype]) {
    // Detect locale from recipientId's stored data — not feasible here, default to en
    enrichedBody = (body || "") + (ARCH_SUFFIX[archetype].en || "");
    if (enrichedBody.length > 300) enrichedBody = body; // safety
  }

  const tokens = await getFcmTokens(recipientId);
  if (tokens.length === 0) return Response.json({ sent: 0 });

  const results = await Promise.allSettled(
    tokens.map((token) =>
      fetch(FCM_V1_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body: enrichedBody },
            webpush: {
              notification: {
                icon: "/icons/gavana-icon.svg",
                badge: "/icons/gavana-icon.svg",
              },
              fcm_options: { link: url || "/" },
            },
          },
        }),
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return Response.json({ sent });
}
