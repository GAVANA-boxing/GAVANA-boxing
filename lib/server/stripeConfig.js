// Which Pro plans can actually be bought on this deployment. Pro is only for sale when
// every piece is in place — checkout key, price, webhook secret and the service account
// the webhook needs to switch Pro on. Otherwise the app shows Pro as "not open yet"
// instead of a button that would take money without activating anything.

export function proPriceIds() {
  return {
    monthly: process.env.STRIPE_PRICE_PRO || "",
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
  };
}

export function stripeSaleStatus() {
  const ids = proPriceIds();
  const base =
    !!process.env.STRIPE_SECRET_KEY &&
    !!process.env.STRIPE_WEBHOOK_SECRET &&
    !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const monthly = base && ids.monthly.startsWith("price_");
  const yearly = base && ids.yearly.startsWith("price_");
  return { enabled: monthly || yearly, plans: { monthly, yearly } };
}
