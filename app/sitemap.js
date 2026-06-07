export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://gavana-boxing.vercel.app";
  const locales = ["en", "mn", "ko"];
  const now = new Date().toISOString();

  const publicRoutes = [
    { path: "/feed",           priority: 0.9, changeFreq: "daily" },
    { path: "/fighters",       priority: 0.8, changeFreq: "weekly" },
    { path: "/leaderboard",    priority: 0.8, changeFreq: "daily" },
    { path: "/coach",          priority: 0.7, changeFreq: "weekly" },
    { path: "/events",         priority: 0.7, changeFreq: "weekly" },
    { path: "/drills",         priority: 0.7, changeFreq: "weekly" },
    { path: "/challenges",     priority: 0.7, changeFreq: "daily" },
    { path: "/gyms",           priority: 0.6, changeFreq: "weekly" },
    { path: "/discover",       priority: 0.6, changeFreq: "daily" },
    { path: "/reels",          priority: 0.6, changeFreq: "daily" },
    { path: "/privacy",        priority: 0.3, changeFreq: "monthly" },
    { path: "/terms",          priority: 0.3, changeFreq: "monthly" },
  ];

  return locales.flatMap((locale) =>
    publicRoutes.map(({ path, priority, changeFreq }) => ({
      url: `${base}/${locale}${path}`,
      lastModified: now,
      changeFrequency: changeFreq,
      priority,
    }))
  );
}
