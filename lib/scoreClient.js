"use client";
// Client → server-authoritative progression. Posts the session outcome to
// /api/score/session, which recomputes XP/streak server-side and writes the
// user doc via the service account. On 503 (service account not configured yet)
// or any error it returns { ok:false, code } so the caller falls back to the
// legacy client write — keeping the app working until the server path + rules
// are deployed.

import { getLocalDateKey, getPreviousLocalDateKey } from "@/lib/utils";

/** Local (user-timezone) date keys the server uses for streak bookkeeping. */
export function buildDateKeys(now = new Date()) {
  const todayKey = getLocalDateKey(now);
  const yesterdayKey = getPreviousLocalDateKey(now);
  const twoDaysAgoKey = getLocalDateKey(new Date(now.getTime() - 2 * 86400000));
  const monthKey = todayKey.slice(0, 7);
  return { todayKey, yesterdayKey, twoDaysAgoKey, monthKey };
}

/**
 * A failed scoring call → { ok: false, code }. "not_configured" (the server has no service
 * account: fall back, nothing to retry) only when the route itself says so; any other failure —
 * including a 503 from the platform in front of the route — is a retryable "error".
 */
export function scoreFailure(status, body) {
  if (status === 503 && body?.code === "not_configured") return { ok: false, code: "not_configured" };
  return { ok: false, code: "error", status };
}

export async function commitSessionProgression(user, payload) {
  try {
    const token = user ? await user.getIdToken() : null;
    const res = await fetch("/api/score/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return scoreFailure(res.status, await res.json().catch(() => null));
    return await res.json();
  } catch {
    return { ok: false, code: "error" };
  }
}
