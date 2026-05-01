import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["en", "mn", "ko"],
  defaultLocale: "en",
});

export const config = {
  matcher: ["/", "/(en|mn|ko)/:path*"],
};
