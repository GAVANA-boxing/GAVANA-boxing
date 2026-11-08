import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminSession";
import { CORE_MODE, NON_CORE_SEGMENTS } from "@/lib/coreRoutes";

const ADMIN_PATH = /^\/(mn|en|ko)\/admin(\/|$)/;
const LOCALE_SEGMENT = /^\/(mn|en|ko)\/([^/]+)/;
// /coach/<anything but chat> — coach profiles, applications, the coach dashboard.
const COACH_MARKET = /^\/(mn|en|ko)\/coach\/(?!chat(\/|$))[^/]+/;

export async function proxy(req) {
  const { pathname } = req.nextUrl;

  // Core-loop focus: anything outside Train → Score → Feedback → Progress
  // (feed, gyms, events, …) bounces to Home. Every deep link stays safe.
  if (CORE_MODE) {
    const m = pathname.match(LOCALE_SEGMENT);
    if (m && NON_CORE_SEGMENTS.has(m[2])) {
      return NextResponse.redirect(new URL(`/${m[1]}/home`, req.url));
    }
    // The Coach tab is the AI coach; the human-coach marketplace pages under it are hidden.
    const c = pathname.match(COACH_MARKET);
    if (c) return NextResponse.redirect(new URL(`/${c[1]}/coach`, req.url));
  }

  if (!ADMIN_PATH.test(pathname)) return NextResponse.next();

  const session = req.cookies.get("admin_session");
  const locale  = req.nextUrl.pathname.split("/")[1] || "mn";

  if (!session?.value) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }

  // The cookie is an HMAC-signed token, not a bare uid — a forged uid fails here.
  const uid = await verifyAdminSession(session.value);
  if (!uid) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }

  const adminUids = (process.env.ADMIN_UIDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (adminUids.length && !adminUids.includes(uid)) {
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(mn|en|ko)/:path*"],
};
