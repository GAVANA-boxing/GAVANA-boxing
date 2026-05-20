import { verifyIdToken } from "@/lib/verifyAuth";

const PROJECT_ID = "gavana-boxing-89a22";
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

  const { recipientId, title, body, url } = await req.json();
  if (!recipientId || !title) return Response.json({ error: "Missing recipientId or title" }, { status: 400 });

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
            notification: { title, body: body || "" },
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
