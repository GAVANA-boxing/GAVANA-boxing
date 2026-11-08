// Launch readiness: which production settings are in place. Booleans only — never values.
// Shown on the owner-only /admin/evolution page. Pure over `env` (tested).
import { stripeSaleStatus } from "@/lib/server/stripeConfig";

export function launchReadiness(env = process.env) {
  const has = (k) => !!(env[k] && String(env[k]).trim());
  const sale = stripeSaleStatus();
  return [
    { key: "service-account", ok: has("FIREBASE_SERVICE_ACCOUNT_BASE64"), required: true,
      what: "XP, streaks and daily missions are written by the server (/api/score/session); also Stripe activation and the AI quota." },
    { key: "openai", ok: has("OPENAI_API_KEY"), required: true,
      what: "AI coach chat, after-round debrief, weekly plan. Without it users see 'AI coach unavailable'." },
    { key: "admin", ok: has("ADMIN_UIDS") && has("ADMIN_SESSION_SECRET"), required: true,
      what: "Admin pages (moderation, this page). Fail closed without them." },
    { key: "site-url", ok: has("NEXT_PUBLIC_SITE_URL"), required: false,
      what: "Public address for share links, sitemap, metadata (defaults to gavana-boxing.vercel.app)." },
    { key: "core-mode", ok: env.NEXT_PUBLIC_CORE_MODE !== "false", required: true,
      what: "Core loop only; feed / reels / sparring stay hidden until moderation exists." },
    { key: "pro-sale", ok: sale.enabled, required: false,
      what: "GAVANA Pro can be bought (Stripe key, webhook secret, MNT price, service account)." },
    { key: "fixtures-off", ok: env.NEXT_PUBLIC_VISUAL_FIXTURES !== "1", required: true,
      what: "Test-only /visual pages must be off in production." },
  ];
}
