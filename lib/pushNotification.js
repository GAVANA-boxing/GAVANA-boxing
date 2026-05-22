/**
 * Fire-and-forget push notification helper.
 * Requires a valid Firebase ID token to call /api/push-notify.
 * Silently no-ops if the API key is missing or the request fails.
 */
export async function sendPushNotification({ recipientId, title, body, url, token }) {
  if (!recipientId || !title) return;
  try {
    await fetch("/api/push-notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ recipientId, title, body: body || "", url: url || "/" }),
    });
  } catch {
    // push is optional — never block the main action
  }
}
