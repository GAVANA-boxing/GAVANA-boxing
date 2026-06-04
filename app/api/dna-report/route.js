import { NextResponse } from "next/server";

const PROJECT_ID = "gavana-boxing-89a22";

let _cachedToken = null;
let _tokenExpiry = 0;

async function getAccessToken() {
  if (_cachedToken && Date.now() < _tokenExpiry - 60_000) return _cachedToken;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) return null;
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const credentials = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    const auth = new GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/datastore"] });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    _cachedToken = tokenResponse.token;
    _tokenExpiry = Date.now() + 3_600_000;
    return _cachedToken;
  } catch { return null; }
}

async function firestoreGet(path) {
  const token = await getAccessToken();
  if (!token) throw new Error("No auth token");
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Firestore error ${res.status}`);
  return res.json();
}

function fsValue(field) {
  if (!field) return null;
  return field.stringValue ?? field.integerValue ?? field.doubleValue ?? field.booleanValue ?? field.nullValue ?? null;
}

export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const userDoc = await firestoreGet(`users/${userId}`);
    const fields = userDoc.fields || {};

    const dnaFields = fields.fighterDNA?.mapValue?.fields || {};
    const dna = {
      archetypeKey: fsValue(dnaFields.archetypeKey),
      confidence:   Number(fsValue(dnaFields.confidence) || 0),
      styleMix:     dnaFields.styleMix
        ? Object.fromEntries(Object.entries(dnaFields.styleMix.mapValue?.fields || {}).map(([k, v]) => [k, Number(fsValue(v) || 0)]))
        : null,
    };
    const streak = Number(fsValue(fields.dailyStreak) || 0);

    // Last 7 days sessions via query
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const token = await getAccessToken();
    const queryRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "training_sessions" }],
            where: {
              compositeFilter: {
                op: "AND",
                filters: [
                  { fieldFilter: { field: { fieldPath: "userId" }, op: "EQUAL", value: { stringValue: userId } } },
                  { fieldFilter: { field: { fieldPath: "createdAt" }, op: "GREATER_THAN_OR_EQUAL", value: { timestampValue: weekAgo.toISOString() } } },
                ],
              },
            },
            orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
            limit: 20,
          },
        }),
      }
    );

    const queryDocs = await queryRes.json();
    const sessions = (Array.isArray(queryDocs) ? queryDocs : [])
      .filter((d) => d.document)
      .map((d) => {
        const f = d.document.fields || {};
        return { score: Number(fsValue(f.score) || 0) };
      });

    const sessionCount = sessions.length;
    const avgScore = sessionCount > 0 ? sessions.reduce((s, d) => s + d.score, 0) / sessionCount : 0;
    const bestScore = sessionCount > 0 ? Math.max(...sessions.map((d) => d.score)) : 0;

    return NextResponse.json({
      userId,
      archetype: dna.archetypeKey,
      confidence: dna.confidence,
      styleMix: dna.styleMix,
      streak,
      weeklyStats: {
        sessionCount,
        avgScore: Math.round(avgScore * 10) / 10,
        bestScore: Math.round(bestScore * 10) / 10,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("DNA report error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
