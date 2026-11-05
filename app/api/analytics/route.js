import { NextResponse } from "next/server";
import { FUNNEL_EVENT_NAMES } from "@/lib/funnelSteps";

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
  "client_error",
  // Activation funnel (lib/funnelSteps.js)
  ...FUNNEL_EVENT_NAMES,
]);

const str = (v, max = 128) => String(v ?? "").slice(0, max);
const int = (v) => String(Math.max(0, Math.round(Number(v) || 0)));

// Best-effort per-instance rate limit (serverless → per-instance, not global,
// but enough to blunt casual anonymous write spam to analytics_events).
const _hits = new Map(); // ip -> timestamps[]
const RL_MAX = 30;
const RL_WINDOW = 60_000;
function rateLimited(ip) {
  const now = Date.now();
  const arr = (_hits.get(ip) || []).filter((t) => now - t < RL_WINDOW);
  arr.push(now);
  _hits.set(ip, arr);
  if (_hits.size > 5000) _hits.clear(); // bound memory
  return arr.length > RL_MAX;
}

export async function POST(request) {
  try {
    const { event, props = {} } = await request.json();
    if (!event || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ ok: false, reason: "unknown_event" });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (rateLimited(ip)) {
      return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });
    }

    const token = await getToken();
    if (!token) return NextResponse.json({ ok: true, stored: false });

    // Write to analytics_events collection
    const body = {
      fields: {
        event:     { stringValue: event },
        url:       { stringValue: str(props.url, 256) },
        ts:        { integerValue: String(props.ts || Date.now()) },
        archetype: { stringValue: str(props.archetype) },
        locale:    { stringValue: str(props.locale, 8) },
        score:     { doubleValue: Number(props.score || 0) },
        // Funnel identity + timing (lib/funnel.js)
        anonId:    { stringValue: str(props.anonId, 64) },
        uid:       { stringValue: str(props.uid, 64) },
        first:     { booleanValue: props.first === true },
        ms:        { integerValue: int(props.ms) },
        hits:      { integerValue: int(props.hits) },
        meta:      { stringValue: str(props.meta, 64) },
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
