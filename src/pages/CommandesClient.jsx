import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../hooks/useAuth';

const API_URL = 'http://localhost:3001';

export default function CommandesClient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [commandes, setCommandes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statutFilter, setStatutFilter] = useState('');
  const [socketInstance, setSocketInstance] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    let socket = null;
    let cleanupExecuted = false;

    const initializeConnection = async () => {
      try {
        // Initialiser Socket.IO
        socket = io(API_URL, {
          auth: { token: `Bearer ${token}` },
          autoConnect: true,
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000,
        });

        setSocketInstance(socket);

        // Configuration des événements Socket.IO
        socket.on('connect', () => {
          console.log('✅ [CommandesClient] WebSocket connecté:', socket.id);
          const userRoom = `user_${user.id}`;
          socket.emit('joinRoom', userRoom);
          console.log('📡 [CommandesClient] Rejoint salle WebSocket:', userRoom);
        });

        socket.on('connect_error', (error) => {
          console.error('❌ [CommandesClient] Erreur connexion WebSocket:', error);
          toast.error('Erreur de connexion WebSocket');
        });

        socket.on('disconnect', (reason) => {
          console.log('📡 [CommandesClient] WebSocket déconnecté, raison:', reason);
        });

        socket.on('roomJoined', (data) => {
          console.log('✅ [CommandesClient] Salle rejointe confirmée:', data);
        });

        // Écouter les nouvelles notifications
        socket.on('nouvelleNotification', (data) => {
          console.log('🔔 [CommandesClient] Nouvelle notification reçue:', data);
          if (data && data.notification) {
            setNotifications((prev) => [data.notification, ...prev]);
            toast.info(`Notification: ${data.notification.message}`);
            playNotificationSound();
          }
        });

        // Écouter les nouvelles commandes
        socket.on('nouvelleCommande', (data) => {
          console.log('🔔 [CommandesClient] Nouvelle commande reçue:', data);
          if (data && data.commande) {
            setCommandes((prev) => [data.commande, ...prev]);
            if (data.notification) {
              setNotifications((prev) => [data.notification, ...prev]);
            }
            toast.info(`Nouvelle commande: ${data.notification?.message || 'Commande créée'}`);
            playNotificationSound();
          }
        });

        // Écouter les changements de statut
        socket.on('changementStatutCommande', (data) => {
          console.log('🔔 [CommandesClient] Changement statut reçu:', data);
          
          if (data && data.commande) {
            // Mettre à jour les commandes
            setCommandes((prev) =>
              prev.map((cmd) =>
                cmd._id === data.commande._id ? { ...cmd, statut: data.commande.statut } : cmd
              )
            );
            
            // Ajouter la notification
            if (data.notification) {
              setNotifications((prev) => [data.notification, ...prev]);
            }
            
            // Afficher le toast
            toast.info(`Mise à jour: ${data.notification?.message || 'Statut modifié'}`);
            playNotificationSound();
          }
        });

        // Écouter quand une notification est marquée comme lue
        socket.on('notificationMarqueLue', (data) => {
          console.log('🔔 [CommandesClient] Notification marquée comme lue:', data);
          if (data && data.notificationId) {
            setNotifications((prev) =>
              prev.map((notif) => 
                notif._id === data.notificationId ? { ...notif, lu: true } : notif
              )
            );
          }
        });

        // Événement de test
        socket.on('pong', (data) => {
          console.log('🏓 [CommandesClient] Pong reçu:', data);
        });

        // Test de connexion
        setTimeout(() => {
          if (socket && socket.connected) {
            socket.emit('ping', { userId: user.id, timestamp: new Date().toISOString() });
          }
        }, 2000);

        // Setup push notifications
        await setupPushNotifications();

        // Charger les données
        await loadCommandes();
        await loadNotifications();

      } catch (error) {
        console.error('❌ [CommandesClient] Erreur initialisation:', error);
        setError('Erreur lors de l\'initialisation');
      }
    };

    const setupPushNotifications = async () => {
      if ('Notification' in window && 'serviceWorker' in navigator) {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('✅ [CommandesClient] Permission de notification accordée');
            
            // Enregistrer le service worker
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('✅ [CommandesClient] Service Worker enregistré:', registration);

            // Attendre que le service worker soit prêt
            await navigator.serviceWorker.ready;

            const vapidResponse = await axios.get(`${API_URL}/api/client/vapid-public-key`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const vapidPublicKey = vapidResponse.data.publicKey;

            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });
            console.log('✅ [CommandesClient] Abonnement push créé:', subscription);

            await axios.post(
              `${API_URL}/api/client/subscribe`,
              subscription,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✅ [CommandesClient] Abonnement push envoyé au backend');
          } else {
            console.warn('⚠️ [CommandesClient] Permission de notification refusée');
          }
        } catch (error) {
          console.error('❌ [CommandesClient] Erreur configuration notifications push:', error);
          toast.error('Erreur lors de la configuration des notifications push');
        }
      } else {
        console.warn('⚠️ [CommandesClient] Notifications push non supportées par le navigateur');
      }
    };

    const urlBase64ToUint8Array = (base64String) => {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    };

    const playNotificationSound = () => {
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch((err) => console.error('❌ [CommandesClient] Erreur lecture son:', err));
      } catch (error) {
        console.error('❌ [CommandesClient] Erreur création audio:', error);
      }
    };

    // Charger les commandes
    const loadCommandes = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/client/commandes`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { statut: statutFilter || undefined },
        });
        console.log('🔍 [CommandesClient] Réponse API commandes:', response.data);
        if (response.data.success) {
          setCommandes(response.data.data.commandes);
        } else {
          setError(response.data.message || 'Erreur lors du chargement des commandes');
          toast.error(response.data.message || 'Erreur lors du chargement des commandes');
        }
      } catch (err) {
        console.error('❌ [CommandesClient] Erreur chargement commandes:', err);
        setError(`Erreur serveur: ${err.response?.data?.message || err.message}`);
        toast.error(`Erreur serveur: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };

    // Charger les notifications
    const loadNotifications = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/client/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { showAll: true },
        });
        console.log('🔍 [CommandesClient] Réponse API notifications:', response.data);
        if (response.data.success) {
          setNotifications(response.data.data.notifications);
        } else {
          console.error('❌ [CommandesClient] Erreur réponse notifications:', response.data.message);
        }
      } catch (err) {
        console.error('❌ [CommandesClient] Erreur chargement notifications:', err);
        toast.error('Erreur lors du chargement des notifications');
      }
    };

    // Service Worker listener
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.action === 'playNotificationSound') {
        playNotificationSound();
      }
      if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
        console.log('📬 [CommandesClient] Message du Service Worker:', event.data);
        toast.info(`Notification push: ${event.data.message}`);
        playNotificationSound();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Initialiser la connexion
    initializeConnection();

    // Cleanup function
    return () => {
      if (cleanupExecuted) return;
      cleanupExecuted = true;

      console.log('🧹 [CommandesClient] Nettoyage des ressources...');

      if (socket) {
        socket.off('connect');
        socket.off('connect_error');
        socket.off('disconnect');
        socket.off('nouvelleCommande');
        socket.off('changementStatutCommande');
        socket.off('notificationMarqueLue');
        socket.off('nouvelleNotification');
        socket.off('roomJoined');
        socket.off('pong');
        socket.disconnect();
        console.log('📡 [CommandesClient] WebSocket déconnecté');
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }

      setSocketInstance(null);
    };
  }, [navigate, statutFilter, user]);

  // Fonction pour marquer une notification comme lue
  const handleMarquerLue = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/notifications/${notificationId}/marquer-lue`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        console.log('✅ [CommandesClient] Notification marquée comme lue:', notificationId);
        toast.success('Notification marquée comme lue');
        
        // Mettre à jour localement
        setNotifications((prev) =>
          prev.map((notif) => 
            notif._id === notificationId ? { ...notif, lu: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('❌ [CommandesClient] Erreur marquage notification:', error);
      toast.error('Erreur lors du marquage de la notification');
    }
  };

  const handlePrintCommande = (commande) => {
    const printContent = `
      <html>
        <head>
          <title>Commande #${commande._id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 24px; }
            .commande-details { margin-bottom: 20px; }
            .medicament { display: flex; align-items: center; margin: 10px 0; }
            .medicament img { width: 50px; height: 50px; margin-right: 10px; }
            .total { font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Commande #${commande._id}</h1>
          <div class="commande-details">
            <p><strong>Pharmacie:</strong> ${commande.pharmacyId?.pharmacieInfo?.nomPharmacie || 'Inconnu'}</p>
            <p><strong>Type:</strong> ${commande.livraison ? 'Livraison' : 'Récupération en pharmacie'}</p>
            ${commande.livraison ? `<p><strong>Adresse:</strong> ${commande.adresseLivraison?.adresseTexte || 'Non spécifiée'}</p>` : ''}
            <p><strong>Statut:</strong> ${commande.statut.replace('_', ' ')}</p>
            <p><strong>Date:</strong> ${new Date(commande.createdAt).toLocaleString()}</p>
          </div>
          <h2>Médicaments:</h2>
          <div>
            ${commande.medicaments
              .map(
                (item) => `
                  <div class="medicament">
                    ${item.image?.nomFichier ? `<img src="${API_URL}/Uploads/medicaments/${item.image.nomFichier}" alt="${item.nom}" />` : '<div style="width: 50px; height: 50px; background: #e5e7eb; display: flex; align-items: center; justify-content: center; margin-right: 10px;">Aucune image</div>'}
                    <span>${item.nom} (x${item.quantite}) - ${item.prix * item.quantite} FCFA</span>
                  </div>
                `
              )
              .join('')}
          </div>
          <p class="total">Total: ${commande.total} FCFA</p>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <div className="p-6 text-white">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Mes commandes</h1>
      
      <div className="mb-6">
        <label className="mr-2 text-gray-700">Filtrer par statut:</label>
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg"
        >
          <option value="">Tous</option>
          <option value="en_attente">En attente</option>
          <option value="en_cours">En cours</option>
          <option value="terminée">Terminée</option>
          <option value="annulée">Annulée</option>
        </select>
      </div>

      {commandes.length === 0 ? (
        <p className="text-gray-600">Aucune commande trouvée.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {commandes.map((commande) => (
            <div key={commande._id} className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-800">
                Commande #{commande._id}
              </h2>
              <p className="text-gray-600">
                <strong>Pharmacie:</strong> {commande.pharmacyId?.pharmacieInfo?.nomPharmacie || 'Inconnu'}
              </p>
              <p className="text-gray-600">
                <strong>Type:</strong> {commande.livraison ? 'Livraison' : 'Récupération en pharmacie'}
              </p>
              {commande.livraison && (
                <p className="text-gray-600">
                  <strong>Adresse:</strong> {commande.adresseLivraison?.adresseTexte || 'Non spécifiée'}
                </p>
              )}
              <p className="text-gray-600">
                <strong>Statut:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  commande.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                  commande.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                  commande.statut === 'terminée' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {commande.statut.replace('_', ' ')}
                </span>
              </p>
              <p className="text-gray-600">
                <strong>Date:</strong> {new Date(commande.createdAt).toLocaleString()}
              </p>
              
              <h3 className="text-md font-semibold mt-4">Médicaments:</h3>
              <ul className="list-disc pl-5">
                {commande.medicaments.map((item) => (
                  <li key={item.medicamentId}>
                    <div className="flex items-center">
                      {item.image?.nomFichier ? (
                        <img
                          src={`${API_URL}/Uploads/medicaments/${item.image.nomFichier}`}
                          alt={item.nom}
                          className="w-12 h-12 object-cover mr-2 rounded"
                          onError={(e) => {
                            console.error(`❌ [CommandesClient] Échec chargement image: ${API_URL}/Uploads/medicaments/${item.image.nomFichier}`, e);
                            e.target.src = '/default-medicament.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 mr-2 flex items-center justify-content-center rounded">
                          Aucune image
                        </div>
                      )}
                      <span>
                        {item.nom} (x{item.quantite}) - {item.prix * item.quantite} FCFA
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="font-bold mt-2">Total: {commande.total} FCFA</p>
              <button
                onClick={() => handlePrintCommande(commande)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Imprimer
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-gray-600">Aucune notification.</p>
        ) : (
          <div className="space-y-2">
            {notifications
              .filter((notif) => !notif.lu)
              .map((notif) => (
                <div key={notif._id} className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-800">{notif.message}</p>
                      <p className="text-sm text-gray-600">{new Date(notif.date).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => handleMarquerLue(notif._id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Marquer comme lu
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}