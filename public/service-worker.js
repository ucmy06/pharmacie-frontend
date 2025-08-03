// Service Worker pour les notifications push
console.log('🔧 [ServiceWorker] Chargement du Service Worker...');

// Écouter les notifications push
self.addEventListener('push', (event) => {
  console.log('📬 [ServiceWorker] Notification push reçue');
  
  let data = {};
  
  try {
    if (event.data) {
      data = event.data.json();
      console.log('📬 [ServiceWorker] Données push:', data);
    }
  } catch (error) {
    console.error('❌ [ServiceWorker] Erreur parsing données push:', error);
    data = {
      title: 'Nouvelle notification',
      message: 'Vous avez reçu une nouvelle notification',
      icon: '/favicon.ico'
    };
  }

  // Configuration par défaut
  const defaultOptions = {
    title: data.title || 'Pharmacie App',
    body: data.message || 'Nouvelle notification',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.type || 'general',
    requireInteraction: true,
    silent: false,
    data: {
      url: data.url || 'http://localhost:3000/commandes',
      notificationId: data.notificationId,
      commandeId: data.commandeId,
      type: data.type,
      timestamp: data.timestamp || new Date().toISOString()
    }
  };

  // Options spécifiques selon le type
  switch (data.type) {
    case 'CHANGEMENT_STATUT':
      defaultOptions.title = '📦 Mise à jour de commande';
      defaultOptions.body = data.message;
      defaultOptions.tag = 'statut-' + data.commandeId;
      defaultOptions.actions = [
        {
          action: 'view-order',
          title: 'Voir la commande',
          icon: '/favicon.ico'
        },
        {
          action: 'close',
          title: 'Fermer',
          icon: '/favicon.ico'
        }
      ];
      break;

    case 'NOTIFICATION_PHARMACIE':
      defaultOptions.title = '🏪 Activité pharmacie';
      defaultOptions.body = data.message;
      defaultOptions.tag = 'pharmacie-' + data.commandeId;
      break;

    case 'NOUVELLE_COMMANDE':
      defaultOptions.title = '🛒 Nouvelle commande';
      defaultOptions.body = data.message;
      defaultOptions.tag = 'commande-' + data.commandeId;
      defaultOptions.requireInteraction = true;
      break;

    default:
      defaultOptions.title = '🔔 Notification';
      defaultOptions.body = data.message || 'Nouvelle notification';
  }

  // Afficher la notification
  const notificationPromise = self.registration.showNotification(
    defaultOptions.title,
    defaultOptions
  );

  // Informer tous les clients de la nouvelle notification
  const clientsPromise = self.clients.matchAll({ 
    includeUncontrolled: true, 
    type: 'window' 
  }).then((clients) => {
    console.log(`📡 [ServiceWorker] Informing ${clients.length} clients`);
    clients.forEach((client) => {
      try {
        client.postMessage({
          type: 'PUSH_NOTIFICATION',
          notificationId: data.notificationId,
          message: data.message,
          url: data.url,
          commandeId: data.commandeId,
          statut: data.statut,
          action: 'playNotificationSound',
          data: data
        });
        console.log('📡 [ServiceWorker] Message envoyé au client');
      } catch (error) {
        console.error('❌ [ServiceWorker] Erreur envoi message client:', error);
      }
    });
  });

  event.waitUntil(Promise.all([notificationPromise, clientsPromise]));
});

// Écouter les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('👆 [ServiceWorker] Clic sur notification:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || 'http://localhost:3000/commandes';
  const action = event.action;

  console.log('👆 [ServiceWorker] Action:', action, 'URL:', urlToOpen);

  // Gérer les actions spécifiques
  if (action === 'close') {
    return;
  }

  if (action === 'view-order' && event.notification.data?.commandeId) {
    const orderUrl = `http://localhost:3000/commandes`;
    event.waitUntil(openOrFocusWindow(orderUrl));
    return;
  }

  // Ouvrir ou focuser la fenêtre
  event.waitUntil(openOrFocusWindow(urlToOpen));
});

// Fonction pour ouvrir ou focuser une fenêtre
async function openOrFocusWindow(url) {
  try {
    const clients = await self.clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    });

    console.log(`🔍 [ServiceWorker] Recherche fenêtre pour ${url}, ${clients.length} clients trouvés`);

    // Chercher une fenêtre existante avec l'URL
    for (const client of clients) {
      if (client.url === url && 'focus' in client) {
        console.log('✅ [ServiceWorker] Fenêtre existante trouvée, focus');
        return client.focus();
      }
    }

    // Chercher une fenêtre de l'app
    for (const client of clients) {
      if (client.url.includes('localhost:3000') && 'focus' in client) {
        console.log('✅ [ServiceWorker] Fenêtre app trouvée, navigation');
        client.focus();
        if ('navigate' in client) {
          return client.navigate(url);
        }
        return;
      }
    }

    // Ouvrir une nouvelle fenêtre
    if (self.clients.openWindow) {
      console.log('🆕 [ServiceWorker] Ouverture nouvelle fenêtre');
      return self.clients.openWindow(url);
    }
  } catch (error) {
    console.error('❌ [ServiceWorker] Erreur ouverture fenêtre:', error);
  }
}

// Écouter l'installation du service worker
self.addEventListener('install', (event) => {
  console.log('🔧 [ServiceWorker] Installation');
  self.skipWaiting();
});

// Écouter l'activation du service worker
self.addEventListener('activate', (event) => {
  console.log('🔧 [ServiceWorker] Activation');
  event.waitUntil(self.clients.claim());
});

// Écouter les messages des clients
self.addEventListener('message', (event) => {
  console.log('📨 [ServiceWorker] Message reçu:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.action === 'ping') {
    event.ports[0].postMessage({ type: 'pong', timestamp: new Date().toISOString() });
  }
});

// Gestionnaire d'erreur global
self.addEventListener('error', (event) => {
  console.error('❌ [ServiceWorker] Erreur globale:', event.error);
});

console.log('✅ [ServiceWorker] Service Worker configuré');