// HMAC-signed admin session token, verifiable in both the Node API route and
// the edge middleware (proxy.js) via Web Crypto. The token is `uid.exp.sig`
// where sig = HMAC-SHA256("uid.exp", ADMIN_SESSION_SECRET). Without the secret
// the token cannot be forged — knowing an admin uid is no longer enough.

const enc = new TextEncoder();

function b64url(buf) {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

/** Sign `uid` into a tamper-proof session token. Throws if the secret is unset. */
export async function signAdminSession(uid, ttlSeconds = 60 * 60 * 24) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET not set");
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${uid}.${exp}`;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

/** Verify a session token. Returns the uid if valid and unexpired, else null. */
export async function verifyAdminSession(token) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [uid, exp, sig] = parts;
  if (!uid || !exp) return null;
  if (Number(exp) * 1000 < Date.now()) return null;
  const key = await hmacKey(secret);
  const expected = b64url(await crypto.subtle.sign("HMAC", key, enc.encode(`${uid}.${exp}`)));
  // length-safe compare
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0 ? uid : null;
}
