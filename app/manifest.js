import { showRoute } from "@/lib/coreRoutes";

export default function manifest() {
  return {
    name: "GAVANA Boxing",
    short_name: "GAVANA",
    description: "20 секундийн сүүдрийн бокс: камер цохилт, хамгаалалтыг чинь ажиглаад дараагийн раундад засах нэг зүйлийг хэлнэ.",
    start_url: "/mn/home",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#0B0B0C",
    theme_color: "#0B0B0C",
    prefer_related_applications: false,
    categories: ["sports", "health", "fitness"],
    lang: "mn",
    // PNG 192 + 512 are what Android needs for the install prompt; SVG kept for
    // browsers that prefer it. Maskable = full-bleed square (the OS crops it).
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/gavana-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    // Only pages a user can actually open (core mode hides the social features).
    shortcuts: [
      { name: "Бэлтгэл", short_name: "Бэлтгэл", description: "Раунд эхлүүлэх", url: "/mn/train" },
      { name: "Ghost Round", short_name: "Ghost", description: "Дасгалжуулагчтай jab–cross дагаж хий", url: "/mn/ghost" },
      { name: "Дэвшил", short_name: "Дэвшил", description: "Цол, оноо, бэлтгэлүүд", url: "/mn/progress" },
      { name: "Reels", short_name: "Reels", description: "Watch boxing training reels", url: "/mn/reels" },
    ]
      .filter((sc) => showRoute(sc.url))
      .map((sc) => ({ ...sc, icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] })),
  };
}
