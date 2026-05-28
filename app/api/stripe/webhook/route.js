import Stripe from "stripe";

const PROJECT_ID = "gavana-boxing-89a22";

let _cachedToken  = null;
let _tokenExpiry  = 0;

async function getFirestoreAccessToken() {
  if (_cachedToken && Date.now() < _tokenExpiry - 60_000) return _cachedToken;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) return null;
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const credentials = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/datastore"],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    _cachedToken  = tokenResponse.token;
    _tokenExpiry  = Date.now() + 3_600_000;
    return _cachedToken;
  } catch (e) {
    console.error("Firestore token error:", e);
    return null;
  }
}

async function updateUserSubscription(uid, tierId, status) {
  const accessToken = await getFirestoreAccessToken();
  if (!accessToken) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 not configured — cannot write subscription");
  }

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=subscription&updateMask.fieldPaths=subscriptionTier&updateMask.fieldPaths=subscriptionUpdatedAt`;
  await fetch(url, {
    method:  "PATCH",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      fields: {
        subscription:          { stringValue: status },
        subscriptionTier:      { stringValue: tierId || "" },
        subscriptionUpdatedAt: { stringValue: new Date().toISOString() },
      },
    }),
  });
}

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
  } catch (err) {
    console.error("stripe/webhook: Firestore write failed:", err.message);
    return new Response("Service unavailable — retry later", { status: 503 });
  }

  return new Response("ok");
}
