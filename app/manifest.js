import { showRoute } from "@/lib/coreRoutes";

export default function manifest() {
  return {
    name: "GAVANA Boxing",
    short_name: "GAVANA",
    description: "Your camera is your boxing coach: a 60-second round, every punch counted, one thing to fix.",
    start_url: "/mn/home",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#0B0B0C",
    theme_color: "#0B0B0C",
    prefer_related_applications: false,
    categories: ["sports", "health", "fitness", "social"],
    lang: "en",
    icons: [
      {
        src: "/icons/gavana-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/gavana-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    // Only pages a user can actually open (core mode hides the social features).
    shortcuts: [
      { name: "Train", short_name: "Train", description: "Start a 60-second round", url: "/en/train" },
      { name: "Ghost Round", short_name: "Ghost", description: "Jab–cross with the coach's ghost", url: "/en/ghost" },
      { name: "Progress", short_name: "Progress", description: "Your level and sessions", url: "/en/progress" },
      { name: "Reels", short_name: "Reels", description: "Watch boxing training reels", url: "/en/reels" },
    ]
      .filter((sc) => showRoute(sc.url))
      .map((sc) => ({ ...sc, icons: [{ src: "/icons/gavana-icon.svg", sizes: "any" }] })),
    screenshots: [
      {
        src: "/icons/gavana-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        form_factor: "narrow",
        label: "GAVANA Boxing — AI-powered boxing training",
      },
      {
        src: "/icons/gavana-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        form_factor: "wide",
        label: "GAVANA Boxing — AI boxing coach",
      },
    ],
  };
}
