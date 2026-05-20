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
}
