import { verifyIdToken } from "@/lib/verifyAuth";

const PROJECT_ID = "gavana-boxing-89a22";
const FCM_V1_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

// Debounce: one rank notification per user per 20 hours (server memory)
const _lastSent = new Map();
function shouldSend(uid) {
  const last = _lastSent.get(uid) || 0;
  if (Date.now() - last < 20 * 60 * 60 * 1000) return false;
  _lastSent.set(uid, Date.now());
  return true;
}

let _cachedToken = null;
let _tokenExpiry = 0;

async function getFcmAccessToken() {
  if (_cachedToken && Date.now() < _tokenExpiry - 60_000) return _cachedToken;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) return null;
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const credentials = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    const auth = new GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/firebase.messaging"] });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    _cachedToken = tokenResponse.token;
    _tokenExpiry = Date.now() + 3_600_000;
    return _cachedToken;
  } catch { return null; }
}

async function getFcmTokens(uid, accessToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}/fcmTokens`;
  try {
    const snap = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!snap.ok) return [];
    const data = await snap.json();
    return (data.documents || []).map((d) => d.fields?.token?.stringValue).filter(Boolean);
  } catch { return []; }
}

export async function POST(req) {
  const uid = await verifyIdToken(req);
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { rank, locale = "en" } = await req.json();
  if (!rank || typeof rank !== "number" || rank < 1 || rank > 500) {
    return Response.json({ sent: 0 });
  }

  if (!shouldSend(uid)) return Response.json({ sent: 0, note: "already_sent" });

  const accessToken = await getFcmAccessToken();
  if (!accessToken) return Response.json({ sent: 0, note: "no_fcm" });

  const tokens = await getFcmTokens(uid, accessToken);
  if (!tokens.length) return Response.json({ sent: 0 });

  const RANK_TITLES = {
    en: `🏆 You're #${rank} this week!`,
    mn: `🏆 Энэ долоо хоногт та #${rank}-р байрт байна!`,
    ko: `🏆 이번 주 당신은 #${rank}위입니다!`,
  };
  const RANK_BODIES = {
    en: rank <= 3  ? "Top 3! Keep that momentum going." : rank <= 10 ? "Top 10 — keep pushing." : "Keep training to move up.",
    mn: rank <= 3  ? "Шилдэг 3! Урагшлаа." : rank <= 10 ? "Шилдэг 10 — үргэлжлүүл." : "Дээшлэхийн тулд үргэлжлүүлэн сурга.",
    ko: rank <= 3  ? "상위 3위! 계속 나아가세요." : rank <= 10 ? "상위 10위 — 계속 도전하세요." : "더 올라가려면 계속 훈련하세요.",
  };

  const title = RANK_TITLES[locale] || RANK_TITLES.en;
  const body  = RANK_BODIES[locale]  || RANK_BODIES.en;

  const results = await Promise.allSettled(
    tokens.map((token) =>
      fetch(FCM_V1_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            webpush: {
              notification: { icon: "/icons/gavana-icon.svg", badge: "/icons/gavana-icon.svg" },
              fcm_options: { link: `/${locale}/leaderboard` },
            },
          },
        }),
      })
    )
  );

  return Response.json({ sent: results.filter((r) => r.status === "fulfilled").length });
}
