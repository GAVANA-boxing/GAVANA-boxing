import Stripe from "stripe";
import { withAuth } from "@/lib/withAuth";
import { firestoreGet } from "@/lib/server/firestore";

const LOCALES = new Set(["mn", "ko", "en"]);

// Stripe customer portal: cancel, change card, see invoices. The customer id is saved by the
// webhook in billing/{uid} (server-only collection; clients have no rule for it).
export const POST = withAuth(async (req, { uid }) => {
  if (!process.env.STRIPE_SECRET_KEY) return Response.json({ error: "not_for_sale" }, { status: 503 });
  let body = {};
  try { body = await req.json(); } catch { /* empty body */ }
  const locale = LOCALES.has(body.locale) ? body.locale : "mn";
  try {
    const billing = await firestoreGet(`billing/${uid}`);
    const customer = billing?.stripeCustomerId;
    if (!customer) return Response.json({ error: "no_customer" }, { status: 404 });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
    const origin = req.headers.get("origin") || new URL(req.url).origin;
    const session = await stripe.billingPortal.sessions.create({ customer, return_url: `${origin}/${locale}/pro` });
    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/portal]", err?.message);
    return Response.json({ error: "portal_failed" }, { status: 500 });
  }
});
