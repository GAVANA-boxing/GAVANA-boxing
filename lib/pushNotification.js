/**
 * Fire-and-forget push notification helper.
 * Requires a valid Firebase ID token to call /api/push-notify.
 * `kind` is one of lib/pushCopy.js PUSH_KINDS; the server writes the text in the recipient's language.
 * Silently no-ops if the request fails.
 */
export async function sendPushNotification({ recipientId, kind, actorName, token }) {
  if (!recipientId || !kind) return;
  try {
    await fetch("/api/push-notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ recipientId, kind, actorName: actorName || "" }),
    });
  } catch {
    // push is optional — never block the main action
  }
}
