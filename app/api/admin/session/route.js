import { cookies } from "next/headers";
import { withAdmin } from "@/lib/withAuth";
import { signAdminSession } from "@/lib/adminSession";

const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

export const POST = withAdmin(async (req, { uid }) => {
  let token;
  try {
    token = await signAdminSession(uid, COOKIE_MAX_AGE);
  } catch {
    return Response.json({ error: "Admin sessions not configured" }, { status: 503 });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    path:     "/",
    maxAge:   COOKIE_MAX_AGE,
  });

  return Response.json({ ok: true });
});

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return Response.json({ ok: true });
}
