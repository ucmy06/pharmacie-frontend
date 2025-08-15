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
  const imageCache = new Map();

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
          console.log('WebSocket connecté:', socket.id);
          const userRoom = `user_${user.id}`;
          socket.emit('joinRoom', userRoom);
          console.log('Rejoint salle WebSocket:', userRoom);
        });

        socket.on('connect_error', (error) => {
          console.error('Erreur connexion WebSocket:', error);
          toast.error('Erreur de connexion WebSocket');
        });

        socket.on('disconnect', (reason) => {
          console.log('WebSocket déconnecté, raison:', reason);
        });

        socket.on('roomJoined', (data) => {
          console.log('Salle rejointe confirmée:', data);
        });

        // Écouter les nouvelles notifications
        socket.on('nouvelleNotification', (data) => {
          console.log('Nouvelle notification reçue:', data);
          if (data && data.notification) {
            setNotifications((prev) => [data.notification, ...prev]);
            toast.info(`Notification: ${data.notification.message}`);
            playNotificationSound();
          }
        });

        // Écouter les nouvelles commandes
        socket.on('nouvelleCommande', (data) => {
          console.log('Nouvelle commande reçue:', data);
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
          console.log('Changement statut reçu:', data);
          
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
          console.log('Notification marquée comme lue:', data);
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
          console.log('Pong reçu:', data);
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
        console.error('Erreur initialisation:', error);
        setError('Erreur lors de l\'initialisation');
      }
    };

    const setupPushNotifications = async () => {
      if ('Notification' in window && 'serviceWorker' in navigator) {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('Permission de notification accordée');
            
            // Enregistrer le service worker
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker enregistré:', registration);

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
            console.log('Abonnement push créé:', subscription);

            await axios.post(
              `${API_URL}/api/client/subscribe`,
              subscription,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Abonnement push envoyé au backend');
          } else {
            console.warn('Permission de notification refusée');
          }
        } catch (error) {
          console.error('Erreur configuration notifications push:', error);
          toast.error('Erreur lors de la configuration des notifications push');
        }
      } else {
        console.warn('Notifications push non supportées par le navigateur');
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
        audio.play().catch((err) => console.error('Erreur lecture son:', err));
      } catch (error) {
        console.error('Erreur création audio:', error);
      }
    };

    // Charger les commandes
    const loadCommandes = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/client/commandes`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { statut: statutFilter || undefined },
        });
        console.log('Réponse API commandes:', response.data);
        if (response.data.success) {
          setCommandes(response.data.data.commandes);
        } else {
          setError(response.data.message || 'Erreur lors du chargement des commandes');
          toast.error(response.data.message || 'Erreur lors du chargement des commandes');
        }
      } catch (err) {
        console.error('Erreur chargement commandes:', err);
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
        console.log('Réponse API notifications:', response.data);
        if (response.data.success) {
          setNotifications(response.data.data.notifications);
        } else {
          console.error('Erreur réponse notifications:', response.data.message);
        }
      } catch (err) {
        console.error('Erreur chargement notifications:', err);
        toast.error('Erreur lors du chargement des notifications');
      }
    };

    // Service Worker listener
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.action === 'playNotificationSound') {
        playNotificationSound();
      }
      if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
        console.log('Message du Service Worker:', event.data);
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

      console.log('Nettoyage des ressources...');

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
        console.log('WebSocket déconnecté');
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
        console.log('Notification marquée comme lue:', notificationId);
        toast.success('Notification marquée comme lue');
        
        // Mettre à jour localement
        setNotifications((prev) =>
          prev.map((notif) => 
            notif._id === notificationId ? { ...notif, lu: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Erreur marquage notification:', error);
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
            h1 { font-size: 24px; color: #1f2937; }
            .commande-details { margin-bottom: 20px; }
            .medicament { display: flex; align-items: center; margin: 10px 0; padding: 10px; background: #f9fafb; border-radius: 8px; }
            .medicament-icon { width: 50px; height: 50px; background: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px; color: #6b7280; font-weight: bold; }
            .total { font-weight: bold; margin-top: 20px; font-size: 18px; color: #059669; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Commande #${commande._id.substring(0, 8)}</h1>
          </div>
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
                    <div class="medicament-icon">M</div>
                    <span><strong>${item.nom}</strong> (x${item.quantite}) - ${item.prix * item.quantite} FCFA</span>
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

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'en_attente':
        return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white';
      case 'en_cours':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
      case 'terminée':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'annulée':
        return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    }
  };

  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'en_attente':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
      case 'en_cours':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>;
      case 'terminée':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>;
      case 'annulée':
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>;
      default:
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="text-lg font-medium text-slate-700">Chargement des commandes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const unreadNotifications = notifications.filter((notif) => !notif.lu);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="z-50"
      />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center">
                <svg className="w-10 h-10 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Mes Commandes
              </h1>
              <p className="text-slate-600 mt-2">
                {commandes.length} commande{commandes.length > 1 ? 's' : ''} au total
              </p>
            </div>
            
            {/* Filtre par statut */}
            <div className="flex items-center space-x-4">
              <label className="text-slate-700 font-medium">Filtrer par statut:</label>
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              >
                <option value="">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="en_cours">En cours</option>
                <option value="terminée">Terminée</option>
                <option value="annulée">Annulée</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications non lues */}
        {unreadNotifications.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5-5V7c0-2.209-1.791-4-4-4S7 4.791 7 7v5l-5 5h5m4 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Notifications ({unreadNotifications.length})
            </h2>
            <div className="space-y-4">
              {unreadNotifications.map((notif) => (
                <div key={notif._id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-slate-800 font-medium mb-2">{notif.message}</p>
                      <p className="text-sm text-slate-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(notif.date).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMarquerLue(notif._id)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Marquer comme lu</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commandes */}
        {commandes.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-700 mb-4">Aucune commande trouvée</h3>
            <p className="text-slate-600 text-lg">
              {statutFilter 
                ? `Aucune commande avec le statut "${statutFilter.replace('_', ' ')}"`
                : "Vous n'avez pas encore passé de commande"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {commandes.map((commande) => (
              <div key={commande._id} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105">
                {/* Header de la commande */}
                <div className="bg-gradient-to-r from-slate-700 to-gray-800 text-white p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold">
                      Commande #{commande._id.substring(0, 8)}
                    </h2>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(commande.statut)}`}>
                      {getStatusIcon(commande.statut)}
                      <span>{commande.statut.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="text-slate-200 space-y-2">
                    <p className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <strong>Pharmacie:</strong>&nbsp;{commande.pharmacyId?.pharmacieInfo?.nomPharmacie || 'Inconnu'}
                    </p>
                    <p className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <strong>Type:</strong>&nbsp;{commande.livraison ? 'Livraison' : 'Récupération en pharmacie'}
                    </p>
                    {commande.livraison && (
                      <p className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span><strong>Adresse:</strong>&nbsp;{commande.adresseLivraison?.adresseTexte || 'Non spécifiée'}</span>
                      </p>
                    )}
                    <p className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <strong>Date:</strong>&nbsp;{new Date(commande.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Corps de la commande */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z" />
                    </svg>
                    Médicaments ({commande.medicaments.length})
                  </h3>
                  
                  <div className="space-y-3 mb-6">
                    {commande.medicaments.map((item, index) => (
                      <div key={`${item.medicamentId || index}`} className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center space-x-4">
                          {/* Icône médicament au lieu d'image */}
                          <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                            M
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800 mb-1">{item.nom}</h4>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                Quantité: {item.quantite}
                              </span>
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                                {item.prix * item.quantite} FCFA
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-800">Total de la commande:</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {commande.total} FCFA
                      </span>
                    </div>
                  </div>

                  {/* Bouton d'impression */}
                  <button
                    onClick={() => handlePrintCommande(commande)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Imprimer la commande</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message si aucune notification */}
        {notifications.length === 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mt-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5-5V7c0-2.209-1.791-4-4-4S7 4.791 7 7v5l-5 5h5m4 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Aucune notification</h3>
            <p className="text-slate-600">Vous n'avez aucune notification pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}