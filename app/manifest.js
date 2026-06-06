export default function manifest() {
  return {
    name: "GAVANA Boxing",
    short_name: "GAVANA",
    description: "AI punch scoring, Fighter Card, real-time challenges — the boxing app built for fighters.",
    start_url: "/mn/feed",
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
    shortcuts: [
      {
        name: "Reels",
        short_name: "Reels",
        description: "Watch boxing training reels",
        url: "/en/reels",
        icons: [{ src: "/icons/gavana-icon.svg", sizes: "any" }],
      },
      {
        name: "Train",
        short_name: "Train",
        description: "Start an AI training session",
        url: "/en/train",
        icons: [{ src: "/icons/gavana-icon.svg", sizes: "any" }],
      },
      {
        name: "Upload",
        short_name: "Upload",
        description: "Upload a new boxing reel",
        url: "/en/upload",
        icons: [{ src: "/icons/gavana-icon.svg", sizes: "any" }],
      },
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "View your training dashboard",
        url: "/en/dashboard",
        icons: [{ src: "/icons/gavana-icon.svg", sizes: "any" }],
      },
    ],
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
        label: "GAVANA Boxing — Fighter community & reels",
      },
    ],
  };
}
