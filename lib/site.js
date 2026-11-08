// The app's public address — one place. Set NEXT_PUBLIC_SITE_URL to the custom domain when
// there is one; share cards, share text, referral links, sitemap and metadata all follow it.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://gavana-boxing.vercel.app").replace(/\/+$/, "");
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");
