// Push-only service worker for Garage Ace PWA.
// Handles background push events -> shows a system notification and updates
// the app-icon badge. Does NOT cache any app assets (no offline behavior).

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  event.waitUntil(handlePush(event));
});

async function handlePush(event) {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    try {
      payload = { title: "Garage Ace", body: event.data ? event.data.text() : "" };
    } catch {
      payload = {};
    }
  }

  const title = payload.title || "Garage Ace";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag || undefined,
    data: { url: payload.url || "/", ...(payload.data || {}) },
  };

  // Update app-icon badge count if provided.
  try {
    if (typeof payload.badge_count === "number" && self.navigator?.setAppBadge) {
      if (payload.badge_count > 0) {
        await self.navigator.setAppBadge(payload.badge_count);
      } else if (self.navigator.clearAppBadge) {
        await self.navigator.clearAppBadge();
      }
    }
  } catch (err) {
    // ignore
  }

  await self.registration.showNotification(title, options);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const clientsArr = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientsArr) {
        try {
          const url = new URL(client.url);
          if (url.origin === self.location.origin) {
            await client.focus();
            if ("navigate" in client) {
              try { await client.navigate(targetUrl); } catch { /* ignore */ }
            }
            return;
          }
        } catch { /* ignore */ }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});
