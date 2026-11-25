// Paying for Pro by bank transfer while card payments are not open (Stripe / QPay paused).
// Flow: the person sees the owner's bank details and THEIR reference code on the Pro page, sends
// the transfer with that code, then tells the owner; the owner grants Pro on /admin/pro (server
// writes — a client can never grant itself Pro). Pure rules here, tested in tests/manualPay.test.js.

/** The code a person writes in the transfer note. 8 chars of the account id: short, unique in practice. */
export function paymentReference(uid) {
  const id = String(uid || "").replace(/[^A-Za-z0-9]/g, "");
  return id.length >= 8 ? `G-${id.slice(0, 8)}` : null;
}

/** "G-AbC123xY" / "abc123xy" typed by the owner → the 8-char uid prefix, or null. */
export function parseReference(input) {
  const s = String(input || "").trim().replace(/^g-/i, "");
  return /^[A-Za-z0-9]{8}$/.test(s) ? s : null;
}

const clean = (v, max) => {
  const s = String(v ?? "").trim();
  return s && s.length <= max ? s : null;
};

/**
 * The owner's bank details from public config (Vercel env). All four must be set, otherwise there is
 * no manual-payment card at all — nothing is ever invented. → { bank, account, holder, contact } | null
 */
export function manualPayConfig(env = {}) {
  const bank = clean(env.NEXT_PUBLIC_PAY_BANK, 40);
  const account = clean(env.NEXT_PUBLIC_PAY_ACCOUNT, 40);
  const holder = clean(env.NEXT_PUBLIC_PAY_HOLDER, 60);
  const contact = clean(env.NEXT_PUBLIC_PAY_CONTACT, 80);
  return bank && account && holder && contact ? { bank, account, holder, contact } : null;
}

export const MANUAL_MAX_MONTHS = 12;

/**
 * The fields the server writes to users/{uid} to grant Pro for `months` (whole, 1–12). A grant made
 * while Pro is still running extends from its end, so paying early never wastes days.
 * → { subscription: "manual", subscriptionTier: "pro", proUntil, subscriptionUpdatedAt } | null
 */
export function grantFields(months, { now = Date.now(), currentProUntil = null } = {}) {
  const m = Number(months);
  if (!Number.isInteger(m) || m < 1 || m > MANUAL_MAX_MONTHS) return null;
  const cur = currentProUntil ? Date.parse(currentProUntil) : NaN;
  const from = Number.isFinite(cur) && cur > now ? cur : now;
  const until = new Date(from);
  until.setUTCMonth(until.getUTCMonth() + m);
  return {
    subscription: "manual",
    subscriptionTier: "pro",
    proUntil: until.toISOString(),
    subscriptionUpdatedAt: new Date(now).toISOString(),
  };
}
