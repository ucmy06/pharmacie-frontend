// C:\reactjs node mongodb\pharmacie-frontend\public\service-worker.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.message,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('http://localhost:3000/pharmacie/commandes')
  );
});