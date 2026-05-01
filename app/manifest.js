export default function manifest() {
  return {
    name: "Gavana Boxing",
    short_name: "Gavana",
    description: "Boxing reels, AI coach, and fighter community.",
    start_url: "/en/reels",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#070707",
    theme_color: "#070707",
    categories: ["sports", "health", "fitness", "social"],
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
  };
}
