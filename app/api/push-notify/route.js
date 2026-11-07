import { withAuth } from "@/lib/withAuth";
import { pushCopy, PUSH_KINDS } from "@/lib/pushCopy";

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
  const accessToken = await getFcmAccessToken();
  if (!accessToken) return [];
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${recipientId}/fcmTokens`;
  try {
    const snap = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!snap.ok) return [];
    const data = await snap.json();
    return (data.documents || []).map((d) => d.fields?.token?.stringValue).filter(Boolean);
  } catch {
    return [];
  }
}

/** The language the recipient uses the app in (saved with their notification token); null if unknown. */
async function getRecipientLocale(recipientId, accessToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${recipientId}?mask.fieldPaths=locale`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.fields?.locale?.stringValue || null;
  } catch {
    return null;
  }
}

export const POST = withAuth(async (req, { uid }) => {
  const accessToken = await getFcmAccessToken();
  if (!accessToken) return Response.json({ sent: 0, note: "FCM service account not configured" });

  if (isRateLimited(uid)) return Response.json({ error: "Rate limited" }, { status: 429 });

  // The sender says what happened; the words and the link are chosen here, in the recipient's language,
  // so nobody can push free text to another person.
  const { recipientId, kind, actorName } = await req.json().catch(() => ({}));
  if (typeof recipientId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(recipientId)) return Response.json({ error: "Invalid recipientId" }, { status: 400 });
  if (typeof kind !== "string" || !Object.hasOwn(PUSH_KINDS, kind)) return Response.json({ error: "Invalid kind" }, { status: 400 });
  if (recipientId === uid) return Response.json({ sent: 0 }); // no self-notify

  const locale = await getRecipientLocale(recipientId, accessToken);
  const { title, body, url } = pushCopy(kind, { locale, actorName: typeof actorName === "string" ? actorName : "", actorId: uid });

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
            notification: { title, body },
            webpush: {
              notification: {
                icon: "/icons/icon-192.png",
                badge: "/icons/badge-96.png",
              },
              fcm_options: { link: url },
            },
          },
        }),
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return Response.json({ sent });
});
