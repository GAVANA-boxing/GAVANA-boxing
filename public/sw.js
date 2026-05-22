const CACHE = "gavana-v2";
const PRECACHE = ["/offline", "/icons/gavana-icon.svg", "/icons/gavana-maskable.svg"];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {}))
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch (network-first, static asset cache, offline fallback) ────────────────
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && (
          url.pathname.startsWith("/_next/static/") ||
          url.pathname.startsWith("/icons/")
        )) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(e.request);
        if (cached) return cached;
        if (e.request.mode === "navigate") {
          return caches.match("/offline") || new Response("Offline", { status: 503 });
        }
        return new Response("Network error", { status: 503 });
      })
  );
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (e) => {
  let payload = {};
  try { payload = e.data?.json() ?? {}; } catch { payload = { title: "GAVANA", body: e.data?.text() || "" }; }

  const title    = payload.title || "GAVANA Boxing";
  const body     = payload.body  || "";
  const icon     = payload.icon  || "/icons/gavana-icon.svg";
  const badge    = payload.badge || "/icons/gavana-icon.svg";
  const clickUrl = payload.url   || "/";

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      vibrate: [100, 50, 100],
      data: { url: clickUrl },
      actions: [{ action: "open", title: "Open" }],
    })
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const targetUrl = e.notification.data?.url || "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const match = wins.find((w) => w.url.includes(self.location.origin));
      if (match) { match.focus(); match.navigate(targetUrl); return; }
      clients.openWindow(targetUrl);
    })
  );
});
