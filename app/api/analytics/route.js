import { NextResponse } from "next/server";

const PROJECT_ID = "gavana-boxing-89a22";
let _cachedToken = null;
let _tokenExpiry = 0;

async function getToken() {
  if (_cachedToken && Date.now() < _tokenExpiry - 60_000) return _cachedToken;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) return null;
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const credentials = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    const auth = new GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/datastore"] });
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();
    _cachedToken = token;
    _tokenExpiry = Date.now() + 3_600_000;
    return token;
  } catch { return null; }
}

const ALLOWED_EVENTS = new Set([
  "session_started","session_completed","score_achieved",
  "dna_unlocked","dna_viewed","dna_shared","dna_compared",
  "streak_extended","streak_broken","mission_completed",
  "challenge_sent","challenge_accepted","reel_shared",
  "upgrade_viewed","upgrade_clicked","subscribed",
  "onboarding_started","onboarding_completed",
]);

export async function POST(request) {
  try {
    const { event, props = {} } = await request.json();
    if (!event || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ ok: false, reason: "unknown_event" });
    }

    const token = await getToken();
    if (!token) return NextResponse.json({ ok: true, stored: false });

    // Write to analytics_events collection
    const body = {
      fields: {
        event:     { stringValue: event },
        url:       { stringValue: String(props.url || "") },
        ts:        { integerValue: String(props.ts || Date.now()) },
        archetype: { stringValue: String(props.archetype || "") },
        locale:    { stringValue: String(props.locale || "") },
        score:     { doubleValue: Number(props.score || 0) },
        createdAt: { timestampValue: new Date().toISOString() },
      },
    };

    await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/analytics_events`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
