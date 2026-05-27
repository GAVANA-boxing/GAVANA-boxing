import { NextResponse } from "next/server";

const ADMIN_PATH = /^\/(mn|en|ko)\/admin(\/|$)/;

export function proxy(req) {
  if (!ADMIN_PATH.test(req.nextUrl.pathname)) return NextResponse.next();

  const session = req.cookies.get("admin_session");
  const locale  = req.nextUrl.pathname.split("/")[1] || "mn";

  if (!session?.value) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }

  const adminUids = (process.env.ADMIN_UIDS || process.env.NEXT_PUBLIC_ADMIN_UIDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (adminUids.length && !adminUids.includes(session.value)) {
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(mn|en|ko)/admin/:path*"],
};
