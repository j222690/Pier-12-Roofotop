// Pier 12 Rooftop - Service Worker for Web Push Notifications
const CACHE_NAME = 'pier12-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Nova Reserva', body: event.data.text() };
  }

  const title = data.title || '🎉 Nova Reserva - Pier 12';
  const options = {
    body: data.body || 'Uma nova reserva foi confirmada.',
    icon: '/favicon.png',
    badge: '/pier12-icon-192.png',
    tag: data.reservationId || 'pier12-reservation',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      url: '/admin',
      reservationId: data.reservationId,
    },
    actions: [
      { action: 'open', title: 'Ver no painel' },
      { action: 'dismiss', title: 'Dispensar' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});