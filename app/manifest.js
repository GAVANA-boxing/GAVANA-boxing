export default function manifest() {
  return {
    name: "Gavana Boxing",
    short_name: "Gavana",
    description: "Boxing reels, AI coach, and fighter community.",
    start_url: "/en/reels",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#070707",
    theme_color: "#070707",
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
        description: "Watch boxing reels",
        url: "/en/reels",
        icons: [{ src: "/icons/gavana-icon.svg", sizes: "any" }],
      },
      {
        name: "Upload Reel",
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
      {
        name: "Challenges",
        short_name: "Challenges",
        description: "Weekly boxing challenges",
        url: "/en/challenges",
        icons: [{ src: "/icons/gavana-icon.svg", sizes: "any" }],
      },
    ],
  };
}
