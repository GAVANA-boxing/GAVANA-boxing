import { SITE_URL } from "@/lib/site";
export default function robots() {
  const base = SITE_URL;
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
