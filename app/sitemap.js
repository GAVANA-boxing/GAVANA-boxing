import { showRoute } from "@/lib/coreRoutes";
import { SITE_URL } from "@/lib/site";

export default function sitemap() {
  const base = SITE_URL;
  const locales = ["en", "mn", "ko"];
  const now = new Date().toISOString();

  // Public pages only — and only those a visitor can open (core mode hides the social ones).
  const publicRoutes = [
    { path: "",                priority: 1.0, changeFreq: "weekly" },
    { path: "/train",          priority: 0.9, changeFreq: "weekly" },
    { path: "/ghost",          priority: 0.8, changeFreq: "weekly" },
    { path: "/mitts",          priority: 0.7, changeFreq: "weekly" },
    { path: "/tour",           priority: 0.6, changeFreq: "weekly" },
    { path: "/bag",            priority: 0.6, changeFreq: "weekly" },
    { path: "/coach",          priority: 0.7, changeFreq: "weekly" },
    { path: "/drills",         priority: 0.5, changeFreq: "weekly" },
    { path: "/feed",           priority: 0.9, changeFreq: "daily" },
    { path: "/fighters",       priority: 0.8, changeFreq: "weekly" },
    { path: "/leaderboard",    priority: 0.8, changeFreq: "daily" },
    { path: "/events",         priority: 0.7, changeFreq: "weekly" },
    { path: "/challenges",     priority: 0.7, changeFreq: "daily" },
    { path: "/gyms",           priority: 0.6, changeFreq: "weekly" },
    { path: "/discover",       priority: 0.6, changeFreq: "daily" },
    { path: "/reels",          priority: 0.6, changeFreq: "daily" },
    { path: "/privacy",        priority: 0.3, changeFreq: "monthly" },
    { path: "/terms",          priority: 0.3, changeFreq: "monthly" },
  ].filter(({ path }) => !path || showRoute(path));

  return locales.flatMap((locale) =>
    publicRoutes.map(({ path, priority, changeFreq }) => ({
      url: `${base}/${locale}${path}`,
      lastModified: now,
      changeFrequency: changeFreq,
      priority,
      // hreflang: tells search engines the three pages are translations of each other.
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}${path}`])) },
    }))
  );
}
