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
    console.log('🔍 [CommandesClient] Utilisateur connecté:', user);
    if (!user?.id) {
      console.log('🚫 [CommandesClient] Aucun utilisateur connecté, redirection vers /login');
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    let socket = null;
    let cleanupExecuted = false;

    const initializeConnection = async () => {
      try {
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

        socket.on('nouvelleNotification', (data) => {
          console.log('🔔 [CommandesClient] Nouvelle notification reçue:', data);
          if (data && data.notification) {
            setNotifications((prev) => [data.notification, ...prev]);
            toast.info(`Notification: ${data.notification.message}`);
            playNotificationSound();
          }
        });

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

        socket.on('changementStatutCommande', (data) => {
          console.log('🔔 [CommandesClient] Changement statut reçu:', data);
          if (data && data.commande) {
            setCommandes((prev) =>
              prev.map((cmd) =>
                cmd._id === data.commande._id ? { ...cmd, statut: data.commande.statut } : cmd
              )
            );
            if (data.notification) {
              setNotifications((prev) => [data.notification, ...prev]);
            }
            toast.info(`Mise à jour: ${data.notification?.message || 'Statut modifié'}`);
            playNotificationSound();
          }
        });

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

        socket.on('pong', (data) => {
          console.log('🏓 [CommandesClient] Pong reçu:', data);
        });

        setTimeout(() => {
          if (socket && socket.connected) {
            socket.emit('ping', { userId: user.id, timestamp: new Date().toISOString() });
          }
        }, 2000);

        await setupPushNotifications();
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
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('✅ [CommandesClient] Service Worker enregistré:', registration);
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

    initializeConnection();

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
    console.log('🔄 [CommandesClient] État de chargement actif, bouton non rendu');
    return <div className="p-6 text-white">Chargement...</div>;
  }

  if (error) {
    console.log('❌ [CommandesClient] Erreur détectée, bouton non rendu:', error);
    return (
      <div className="p-6 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      {/* Bouton Retour au tableau de bord (flottant en haut à gauche) */}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={() => {
            console.log('🚀 [CommandesClient] Tentative de navigation, utilisateur:', user);
            try {
              if (user?.role === 'client') {
                navigate('/client/dashboard');
              } else if (user?.role === 'pharmacie') {
                navigate('/pharmacie/dashboard');
              } else {
                navigate('/dashboard');
                console.warn('⚠️ [CommandesClient] Rôle utilisateur non défini, redirection par défaut vers /dashboard');
              }
            } catch (err) {
              console.error('❌ [CommandesClient] Erreur de navigation:', err);
              toast.error('Erreur lors de la redirection vers le tableau de bord');
            }
          }}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          aria-label="Retourner au tableau de bord"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Retour
        </button>
      </div>

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
                <strong>Pharmacie:</strong>{" "}
                {commande.pharmacyId?.pharmacieInfo?.nomPharmacie || 'Inconnu'}
              </p>
              <p className="text-gray-600">
                <strong>Type:</strong>{" "}
                {commande.livraison ? 'Livraison' : 'Récupération en pharmacie'}
              </p>
              {commande.livraison && (
                <p className="text-gray-600">
                  <strong>Adresse:</strong>{" "}
                  {commande.adresseLivraison?.adresseTexte || 'Non spécifiée'}
                </p>
              )}
              <p className="text-gray-600">
                <strong>Statut:</strong>
                <span
                  className={`ml-2 px-2 py-1 rounded text-sm ${
                    commande.statut === 'en_attente'
                      ? 'bg-yellow-100 text-yellow-800'
                      : commande.statut === 'en_cours'
                      ? 'bg-blue-100 text-blue-800'
                      : commande.statut === 'terminée'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {commande.statut.replace('_', ' ')}
                </span>
              </p>
              <p className="text-gray-600">
                <strong>Date:</strong>{" "}
                {new Date(commande.createdAt).toLocaleString()}
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
                          onError={({ currentTarget }) => {
                            console.error(
                              `❌ [CommandesClient] Échec chargement image: ${API_URL}/Uploads/medicaments/${item.image.nomFichier}`
                            );
                            currentTarget.src = '/default-medicament.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 mr-2 flex items-center justify-center rounded">
                          Aucune image
                        </div>
                      )}
                      <span>
                        {item.nom} (x{item.quantite}) -{' '}
                        {item.prix * item.quantite} FCFA
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

      <div className="mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-gray-600">Aucune notification.</p>
        ) : (
          <div className="space-y-2">
            {notifications
              .filter((notif) => !notif.lu)
              .map((notif) => (
                <div
                  key={notif._id}
                  className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-800">{notif.message}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(notif.date).toLocaleString()}
                      </p>
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