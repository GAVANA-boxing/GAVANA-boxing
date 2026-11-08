import Stripe from "stripe";
import { withAuth } from "@/lib/withAuth";
import { proPriceIds, stripeSaleStatus } from "@/lib/server/stripeConfig";

const LOCALES = new Set(["mn", "ko", "en"]);

// GAVANA Pro checkout (monthly / yearly). Errors are codes; the page shows localized text.
export const POST = withAuth(async (req, { uid }) => {
  const sale = stripeSaleStatus();
  if (!sale.enabled) return Response.json({ error: "not_for_sale" }, { status: 503 });

  let body = {};
  try { body = await req.json(); } catch { /* empty body */ }
  const plan = body.plan === "yearly" ? "yearly" : "monthly";
  if (!sale.plans[plan]) return Response.json({ error: "plan_unavailable" }, { status: 400 });
  const locale = LOCALES.has(body.locale) ? body.locale : "mn";

  const origin = req.headers.get("origin") || new URL(req.url).origin;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
    const meta = { uid, tierId: "pro", plan };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: proPriceIds()[plan], quantity: 1 }],
      client_reference_id: uid,
      success_url: `${origin}/${locale}/pro?subscribed=1`,
      cancel_url: `${origin}/${locale}/pro`,
      metadata: meta,
      subscription_data: { metadata: meta },
    });
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err?.message);
    return Response.json({ error: "checkout_failed" }, { status: 500 });
  }
});
