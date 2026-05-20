import { verifyIdToken } from "@/lib/verifyAuth";

const FCM_URL = "https://fcm.googleapis.com/fcm/send";

// Send a web push notification to a user via FCM.
// Requires FIREBASE_FCM_SERVER_KEY env var (set in Firebase Console → Project Settings → Cloud Messaging).
// Reads recipient FCM tokens from Firestore REST API.
export async function POST(req) {
  const uid = await verifyIdToken(req);
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const SERVER_KEY = process.env.FIREBASE_FCM_SERVER_KEY;
  if (!SERVER_KEY) return Response.json({ sent: 0, note: "FCM_SERVER_KEY not configured" });

  const { recipientId, title, body, url } = await req.json();
  if (!recipientId || !title) return Response.json({ error: "Missing recipientId or title" }, { status: 400 });

  // Fetch recipient FCM tokens via Firestore REST API
  const PROJECT = "gavana-boxing-89a22";
  const API_KEY = "AIzaSyDwVdR5oVYSXQbWL4jqNSNx9cqKuKxqt6c";
  const tokensUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${recipientId}/fcmTokens?key=${API_KEY}`;

  let tokens = [];
  try {
    const snap = await fetch(tokensUrl);
    if (snap.ok) {
      const data = await snap.json();
      tokens = (data.documents || []).map((d) => d.fields?.token?.stringValue).filter(Boolean);
    }
  } catch { /* ignore — no tokens */ }

  if (tokens.length === 0) return Response.json({ sent: 0 });

  // Send to each token (FCM legacy HTTP API)
  const results = await Promise.allSettled(
    tokens.map((token) =>
      fetch(FCM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=${SERVER_KEY}`,
        },
        body: JSON.stringify({
          to: token,
          notification: { title, body: body || "", icon: "/icons/gavana-icon.svg" },
          webpush: { notification: { icon: "/icons/gavana-icon.svg", badge: "/icons/gavana-icon.svg" }, fcm_options: { link: url || "/" } },
        }),
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return Response.json({ sent });
}
