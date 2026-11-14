// "Back" that always goes somewhere: the previous page when there is one, otherwise `fallback`.
// (router.back() does nothing when the page was opened directly — a shared link, a refresh in a
// new tab, the return from a payment page — and pages without the bottom nav had no way out.)
export function backOr(router, fallback) {
  if (typeof window !== "undefined" && window.history.length > 1) router.back();
  else router.push(fallback);
}
