import Stripe from "stripe";

import { firestorePatch } from "@/lib/server/firestore";

// Pro status lives on users/{uid} (clients can't write these fields — firestore.rules);
// the Stripe customer id goes to billing/{uid}, a server-only collection, for the portal.
async function updateUserSubscription(uid, tierId, status) {
  if (!uid) {
    // No uid in Stripe metadata — cannot attribute the subscription. Never write
    // to users/undefined; log loudly so it's visible, and let the caller ack.
    console.error("stripe/webhook: event has no metadata.uid — cannot attribute subscription", { tierId, status });
    return { skipped: "no-uid" };
  }
  // firestorePatch throws when the service account is missing or the write fails, so
  // Stripe gets a 503 and retries instead of the user paying without getting Pro.
  await firestorePatch(`users/${uid}`, {
    subscription: status,
    subscriptionTier: tierId || "",
    subscriptionUpdatedAt: new Date().toISOString(),
  });
  return { ok: true };
}

async function saveCustomer(uid, customer) {
  if (!uid || !customer) return;
  await firestorePatch(`billing/${uid}`, { stripeCustomerId: String(customer), updatedAt: new Date().toISOString() });
}

// All paid plans are app Pro (monthly / yearly).
const tierOf = (t) => (t ? "pro" : "");

export async function POST(req) {
  const stripeKey     = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) return new Response("Stripe not configured", { status: 503 });

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
  const body   = await req.text();
  const sig    = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  const obj    = event.data.object;
  const uid    = obj.metadata?.uid || obj.subscription_data?.metadata?.uid;
  const tierId = obj.metadata?.tierId || obj.subscription_data?.metadata?.tierId;

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await updateUserSubscription(uid, tierOf(tierId), obj.status);
        if (uid) await saveCustomer(uid, obj.customer);
        break;
      case "customer.subscription.deleted":
        await updateUserSubscription(uid, "", "canceled");
        break;
      case "checkout.session.completed":
        if (obj.mode === "subscription" && obj.metadata?.uid) {
          await updateUserSubscription(obj.metadata.uid, tierOf(obj.metadata.tierId), "active");
          await saveCustomer(obj.metadata.uid, obj.customer);
        }
        break;
    }
  } catch (err) {
    console.error("stripe/webhook: Firestore write failed:", err.message);
    return new Response("Service unavailable — retry later", { status: 503 });
  }

  return new Response("ok");
}
