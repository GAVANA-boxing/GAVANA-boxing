// Shared server-side Firestore access over the REST API using the service
// account (FIREBASE_SERVICE_ACCOUNT_BASE64). Several routes hand-rolled their
// own token getter + field encoder; this centralizes it so the scoring
// endpoint (and future server writes) share one tested implementation.
//
// Writes done here run as the service account and therefore BYPASS Firestore
// security rules — which is exactly why rules can lock the client out of
// progression fields while the server remains the authoritative writer.

const PROJECT = "gavana-boxing-89a22";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

let _cachedToken = null;
let _tokenExpiry = 0;

/** Service-account access token (datastore scope), cached ~1h. null if unconfigured. */
export async function getServiceToken() {
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
  } catch {
    return null;
  }
}

/** Encode a plain JS value into a Firestore REST typed value. */
export function encodeValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  if (typeof v === "object") return { mapValue: { fields: encodeFields(v) } };
  return { stringValue: String(v) };
}

/** Encode a plain object into a Firestore REST `fields` map. */
export function encodeFields(obj) {
  const fields = {};
  for (const [k, val] of Object.entries(obj)) fields[k] = encodeValue(val);
  return fields;
}

/** Decode a single Firestore REST typed value back to plain JS. */
export function decodeValue(v) {
  if (!v || typeof v !== "object") return v;
  if ("nullValue" in v) return null;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("stringValue" in v) return v.stringValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in v) return decodeFields(v.mapValue.fields || {});
  return undefined;
}

/** Decode a Firestore REST `fields` map into a plain object. */
export function decodeFields(fields) {
  const out = {};
  for (const [k, val] of Object.entries(fields || {})) out[k] = decodeValue(val);
  return out;
}

/** GET a document. Returns the decoded data object, or null if missing. `path` is e.g. "users/abc". */
export async function firestoreGet(path, token) {
  const t = token || (await getServiceToken());
  if (!t) throw new Error("service-account-unconfigured");
  const res = await fetch(`${BASE}/${path}`, { headers: { Authorization: `Bearer ${t}` } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`firestore-get-failed:${res.status}`);
  const json = await res.json();
  return decodeFields(json.fields || {});
}

/** CREATE a document in a collection (auto-id). `data` is a plain object. Returns the REST response JSON. */
export async function firestoreCreate(collectionPath, data, token) {
  const t = token || (await getServiceToken());
  if (!t) throw new Error("service-account-unconfigured");
  const res = await fetch(`${BASE}/${collectionPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify({ fields: encodeFields(data) }),
  });
  if (!res.ok) throw new Error(`firestore-create-failed:${res.status}`);
  return res.json();
}

/**
 * PATCH (merge-update) a document, writing only the given fields. `path` is e.g.
 * "users/abc". Only the keys of `data` are in the update mask, so other fields
 * are untouched (equivalent to a client setDoc merge).
 */
export async function firestorePatch(path, data, token) {
  const t = token || (await getServiceToken());
  if (!t) throw new Error("service-account-unconfigured");
  const mask = Object.keys(data).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  const res = await fetch(`${BASE}/${path}?${mask}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify({ fields: encodeFields(data) }),
  });
  if (!res.ok) throw new Error(`firestore-patch-failed:${res.status}`);
  return res.json();
}

/** True when the service account is configured (so the server can write authoritatively). */
export async function serviceAccountReady() {
  return (await getServiceToken()) != null;
}
