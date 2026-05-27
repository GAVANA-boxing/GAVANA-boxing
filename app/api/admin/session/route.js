import { cookies } from "next/headers";
import { verifyIdToken } from "@/lib/verifyAuth";

const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

export async function POST(req) {
  const uid = await verifyIdToken(req);
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const adminUids = (process.env.ADMIN_UIDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!adminUids.length || !adminUids.includes(uid)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, uid, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    path:     "/",
    maxAge:   COOKIE_MAX_AGE,
  });

  return Response.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return Response.json({ ok: true });
}
