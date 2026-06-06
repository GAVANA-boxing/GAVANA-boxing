export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://gavana-boxing.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/en/", "/mn/", "/ko/"],
        disallow: [
          "/en/admin/",
          "/mn/admin/",
          "/ko/admin/",
          "/en/onboarding",
          "/mn/onboarding",
          "/ko/onboarding",
          "/en/login",
          "/mn/login",
          "/ko/login",
          "/api/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
