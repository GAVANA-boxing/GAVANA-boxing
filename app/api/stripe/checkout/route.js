import Stripe from "stripe";
import { verifyIdToken } from "@/lib/verifyAuth";

const PRICE_MAP = {
  fan:      process.env.STRIPE_PRICE_FAN,
  pro:      process.env.STRIPE_PRICE_PRO,
  champion: process.env.STRIPE_PRICE_CHAMPION,
};

export async function POST(req) {
  const uid = await verifyIdToken(req);
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return Response.json({ error: "Stripe not configured" }, { status: 503 });

  const { tierId, successUrl, cancelUrl } = await req.json();
  const priceId = PRICE_MAP[tierId];

  if (!priceId) return Response.json({ error: "Invalid tier" }, { status: 400 });

  // Stripe requires price IDs (price_...), not product IDs (prod_...)
  if (!priceId.startsWith("price_")) {
    return Response.json({
      error: `Invalid price ID for "${tierId}": got "${priceId}". Must start with price_ — go to Stripe Dashboard → Products → [product] → Prices and copy the Price ID.`,
    }, { status: 400 });
  }

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${req.headers.get("origin")}/en/creator/dashboard?subscribed=1`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/en/creator/dashboard`,
      metadata: { uid, tierId },
      subscription_data: { metadata: { uid, tierId } },
    });
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err?.message);
    return Response.json({ error: err?.message || "Stripe error" }, { status: 500 });
  }
}
