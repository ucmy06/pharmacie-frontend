// C:\reactjs node mongodb\pharmacie-frontend\src\pages\dashboards\AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import io from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const API_URL = 'http://localhost:3001';
const socket = io(API_URL, {
  withCredentials: true,
  extraHeaders: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

export default function AdminDashboard() {
  const { user, token, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoading) return;

    if (!user || !token || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    // Demander la permission pour les notifications push
    const setupPushNotifications = async () => {
      if ('Notification' in window && 'serviceWorker' in navigator) {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('✅ Permission de notification accordée');
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('✅ Service Worker enregistré:', registration);

            const vapidResponse = await axios.get(`${API_URL}/api/client/vapid-public-key`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const vapidPublicKey = vapidResponse.data.publicKey;

            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });
            console.log('✅ Abonnement push créé:', subscription);

            await axios.post(
              `${API_URL}/api/client/subscribe`,
              subscription,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✅ Abonnement push envoyé au backend');
          } else {
            console.warn('⚠️ Permission de notification refusée');
          }
        } catch (error) {
          console.error('❌ Erreur configuration notifications push:', error);
          toast.error('Erreur lors de la configuration des notifications push');
        }
      } else {
        console.warn('⚠️ Notifications push non supportées par le navigateur');
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

    setupPushNotifications();

    // Écouter les messages du service worker pour jouer le son
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.action === 'playNotificationSound') {
        const audio = new Audio('/notification.mp3');
        audio.play().catch((err) => console.error('❌ Erreur lecture son:', err));
      }
    });

    // Fetch dashboard stats
    const fetchDashboardStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setDashboardStats(response.data.data);
        } else {
          setError(response.data.message || 'Erreur lors du chargement des statistiques');
          toast.error(response.data.message || 'Erreur lors du chargement des statistiques');
        }
      } catch (err) {
        console.error('❌ Erreur chargement statistiques:', err);
        setError('Erreur serveur: ' + (err.response?.data?.message || err.message));
        toast.error('Erreur serveur: ' + (err.response?.data?.message || err.message));
      }
    };

    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/admin/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setNotifications(response.data.data.notifications || []);
        }
      } catch (err) {
        console.error('❌ Erreur chargement notifications:', err);
        toast.error('Erreur lors du chargement des notifications');
      }
    };

    Promise.all([fetchDashboardStats(), fetchNotifications()]).then(() => {
      setLoading(false);
    });

    socket.on('nouvelleCommande', (data) => {
      console.log('🔔 Nouvelle commande reçue:', data);
      setNotifications((prev) => [...prev, data.notification]);
      toast.info(`Nouvelle commande: ${data.notification.message}`);
      const audio = new Audio('/notification.mp3');
      audio.play().catch((err) => console.error('❌ Erreur lecture son:', err));
    });

    socket.emit('joinPharmacie', user._id);

    return () => {
      socket.off('nouvelleCommande');
      navigator.serviceWorker.removeEventListener('message', () => {});
    };
  }, [user, token, navigate, isLoading]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarquerLu = async (notificationId) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/admin/notifications/${notificationId}/lu`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
        toast.success('Notification marquée comme lue');
      }
    } catch (err) {
      console.error('❌ Erreur marquage notification:', err);
      toast.error('Erreur lors du marquage de la notification');
    }
  };

  const handleViewCommande = (commandeId) => {
    navigate(`/admin/commande/${commandeId}`);
  };

  if (isLoading || loading) {
    return <div className="p-6 text-white">Chargement du tableau de bord admin...</div>;
  }

  if (error || !dashboardStats) {
    return <div className="p-6 text-red-600">{error || 'Erreur lors du chargement des données.'}</div>;
  }

  const { resume, pharmaciesParStatut, activiteRecente, alertes, evolutionInscriptions, evolutionCommandes, commandesParPharmacie } = dashboardStats;

  const inscriptionLabels = evolutionInscriptions?.map((item) => `${item._id.month}/${item._id.year}`) || [];
  const inscriptionData = evolutionInscriptions?.map((item) => item.count) || [];
  const pharmacieStatutLabels = pharmaciesParStatut?.map((item) => item._id || 'Inconnu') || [];
  const pharmacieStatutData = pharmaciesParStatut?.map((item) => item.count) || [];
  const commandeLabels = evolutionCommandes?.map((item) => `${item._id.month}/${item._id.year}`) || [];
  const commandeData = evolutionCommandes?.map((item) => item.count) || [];
  const commandesParPharmacieLabels = commandesParPharmacie?.map((item) => item.pharmacieNom || 'Inconnu') || [];
  const commandesParPharmacieData = commandesParPharmacie?.map((item) => item.count) || [];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <ToastContainer />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">
          👑 Tableau de bord Administrateur
        </h1>
        <p className="text-gray-700 mb-6">
          Bienvenue, <strong>{user.prenom} {user.nom}</strong> | Email : {user.email} |{' '}
          <button
            onClick={handleLogout}
            className="text-red-600 hover:underline"
          >
            Se déconnecter
          </button>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📊 Résumé</h2>
            <p><strong>Total utilisateurs :</strong> {resume.totalUsers || 0}</p>
            <p><strong>Pharmacies :</strong> {resume.totalPharmacies || 0}</p>
            <p><strong>Clients :</strong> {resume.totalClients || 0}</p>
            <p><strong>Administrateurs :</strong> {resume.totalAdmins || 0}</p>
            <p><strong>Demandes en attente :</strong> {resume.demandesEnAttente || 0}</p>
            <p><strong>Utilisateurs actifs aujourd'hui :</strong> {resume.utilisateursActifsAujourdhui || 0}</p>
            <p><strong>Nouvelles inscriptions (semaine) :</strong> {resume.nouvellesInscriptions || 0}</p>
            <p><strong>Total commandes :</strong> {resume.totalCommandes || 0}</p>
            <p><strong>Commandes en attente :</strong> {resume.commandesEnAttente || 0}</p>
            <p><strong>Commandes livrées :</strong> {resume.commandesLivrees || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🔔 Notifications ({notifications.length})</h2>
            {notifications.length === 0 ? (
              <p className="text-gray-600">Aucune notification.</p>
            ) : (
              <ul className="space-y-2">
                {notifications.map((notification) => (
                  <li key={notification._id} className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-800">{notification.message}</p>
                      <p className="text-sm text-gray-500">{new Date(notification.date).toLocaleString()}</p>
                    </div>
                    <div>
                      {notification.commandeId && (
                        <button
                          onClick={() => handleViewCommande(notification.commandeId)}
                          className="mr-2 text-blue-600 hover:underline"
                        >
                          Voir détails
                        </button>
                      )}
                      <button
                        onClick={() => handleMarquerLu(notification._id)}
                        className="text-blue-600 hover:underline"
                      >
                        Marquer comme lu
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🚨 Alertes</h2>
            {alertes.length === 0 ? (
              <p className="text-gray-600">Aucune alerte.</p>
            ) : (
              <ul className="space-y-2">
                {alertes.map((alerte, index) => (
                  <li key={index} className="text-gray-800">
                    <span className={`font-semibold ${alerte.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`}>
                      {alerte.message}
                    </span>
                    <button
                      onClick={() => navigate(alerte.link || '/admin/pharmacy-requests')}
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      {alerte.action || 'Voir'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {inscriptionLabels.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <Line
                data={{
                  labels: inscriptionLabels.reverse(),
                  datasets: [
                    {
                      label: 'Inscriptions par mois',
                      data: inscriptionData.reverse(),
                      borderColor: '#2563eb',
                      backgroundColor: 'rgba(37, 99, 235, 0.2)',
                      fill: true,
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Évolution des inscriptions' },
                  },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
          )}

          {pharmacieStatutLabels.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <Bar
                data={{
                  labels: pharmacieStatutLabels,
                  datasets: [
                    {
                      label: 'Pharmacies par statut',
                      data: pharmacieStatutData,
                      backgroundColor: ['#2563eb', '#10b981', '#ef4444'],
                      borderColor: ['#1e40af', '#047857', '#b91c1c'],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Répartition des pharmacies par statut' },
                  },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
          )}

          {commandeLabels.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <Line
                data={{
                  labels: commandeLabels.reverse(),
                  datasets: [
                    {
                      label: 'Commandes par mois',
                      data: commandeData.reverse(),
                      borderColor: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      fill: true,
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Évolution des commandes' },
                  },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
          )}

          {commandesParPharmacieLabels.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <Bar
                data={{
                  labels: commandesParPharmacieLabels,
                  datasets: [
                    {
                      label: 'Commandes par pharmacie',
                      data: commandesParPharmacieData,
                      backgroundColor: '#8b5cf6',
                      borderColor: '#6d28d9',
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Top 10 pharmacies par nombre de commandes' },
                  },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📅 Activités récentes</h2>
            {activiteRecente.length === 0 ? (
              <p className="text-gray-600">Aucune activité récente.</p>
            ) : (
              <ul className="space-y-2">
                {activiteRecente.map((activite) => (
                  <li key={activite._id} className="text-gray-800">
                    {activite.role === 'pharmacie' ? (
                      <p>
                        {activite.pharmacieInfo.nomPharmacie} ({activite.email}) inscrit le{' '}
                        {new Date(activite.createdAt).toLocaleDateString()}
                      </p>
                    ) : (
                      <p>
                        {activite.nom} {activite.prenom} ({activite.email}) inscrit le{' '}
                        {new Date(activite.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}