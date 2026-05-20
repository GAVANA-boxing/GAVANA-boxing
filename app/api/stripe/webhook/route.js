import Stripe from "stripe";

async function updateUserSubscription(uid, tierId, status) {
  const PROJECT = "gavana-boxing-89a22";
  const API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyDwVdR5oVYSXQbWL4jqNSNx9cqKuKxqt6c";
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}?key=${API_KEY}&updateMask.fieldPaths=subscription&updateMask.fieldPaths=subscriptionTier&updateMask.fieldPaths=subscriptionUpdatedAt`;
  await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        subscription:            { stringValue: status },
        subscriptionTier:        { stringValue: tierId || "" },
        subscriptionUpdatedAt:   { stringValue: new Date().toISOString() },
      },
    }),
  });
}

export async function POST(req) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) return new Response("Stripe not configured", { status: 503 });

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  const obj = event.data.object;
  const uid = obj.metadata?.uid || obj.subscription_data?.metadata?.uid;
  const tierId = obj.metadata?.tierId || obj.subscription_data?.metadata?.tierId;

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await updateUserSubscription(uid, tierId, obj.status === "active" ? "active" : obj.status);
      break;
    case "customer.subscription.deleted":
      await updateUserSubscription(uid, "", "cancelled");
      break;
    case "checkout.session.completed":
      if (obj.mode === "subscription" && obj.metadata?.uid) {
        await updateUserSubscription(obj.metadata.uid, obj.metadata.tierId, "active");
      }
      break;
  }

  return new Response("ok");
}
