import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["en", "mn"],
  defaultLocale: "en",
});

export const config = {
  matcher: ["/", "/(en|mn)/:path*"],
};