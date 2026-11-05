import { verifyIdToken } from "@/lib/verifyAuth";

/**
 * Wraps a Next.js App Router route handler so the caller's Firebase ID token is
 * verified before the handler runs. Previously every route repeated the same
 * `const uid = await verifyIdToken(req); if (!uid) 401` dance — this makes that
 * one chokepoint, so a logged-out request can never reach handler logic and the
 * 401 shape is identical everywhere.
 *
 * The verified uid is passed to the handler on the context object:
 *   export const POST = withAuth(async (req, { uid }) => { ... });
 *
 * The context also carries anything Next passes (e.g. `params` for dynamic
 * segments), so destructure `{ uid, params }` as needed.
 */
export function withAuth(handler) {
  return async function (req, ctx) {
    const uid = await verifyIdToken(req);
    if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
    return handler(req, { ...(ctx || {}), uid });
  };
}

/** Comma-separated ADMIN_UIDS env, parsed once per call. */
function adminUidSet() {
  return (process.env.ADMIN_UIDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Like withAuth, but additionally requires the verified uid to be listed in the
 * ADMIN_UIDS env. Returns 403 for a signed-in non-admin.
 */
export function withAdmin(handler) {
  return withAuth(async (req, ctx) => {
    const admins = adminUidSet();
    if (!admins.length || !admins.includes(ctx.uid)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(req, ctx);
  });
}
