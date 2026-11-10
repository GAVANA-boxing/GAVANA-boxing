// Browser calls to /api/coach/* with the signed-in user's ID token. Never throws: returns
// { ok, status, data }. `tz` (Date#getTimezoneOffset) lets the server count "today" locally.
export async function coachApi(user, path, { method = "GET", body } = {}) {
  try {
    if (!user?.getIdToken) return { ok: false, status: 401, data: {} };
    const token = await user.getIdToken();
    const tz = new Date().getTimezoneOffset();
    const url = method === "GET" ? `${path}${path.includes("?") ? "&" : "?"}tz=${tz}` : path;
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}
