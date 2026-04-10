// Service Worker for Glammed Nails Admin Push Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'New Notification', body: event.data.text() };
  }

  const title = payload.title || 'Glammed Nails';
  const options = {
    body: payload.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: payload.tag || 'default',
    data: payload.data || {},
    requireInteraction: payload.requireInteraction || false,
    renotify: true,
    vibrate: payload.vibrate || [200, 100, 200],
    silent: false,
    actions: payload.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/admin/bookings';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // If admin tab already open, focus it
      for (const client of clients) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
