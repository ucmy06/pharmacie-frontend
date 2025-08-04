import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import io from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
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
  ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const API_URL = 'http://localhost:3001';
const socket = io(API_URL, {
  withCredentials: true,
  extraHeaders: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

export default function AdminDashboard() {
  const { user, token, isLoading } = useAuth();
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

            await axios.post(
              `${API_URL}/api/client/subscribe`,
              subscription,
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        } catch (error) {
          console.error('❌ Erreur configuration notifications push:', error);
          toast.error('Erreur lors de la configuration des notifications push');
        }
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

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.action === 'playNotificationSound') {
        const audio = new Audio('/notification.mp3');
        audio.play().catch((err) => console.error('❌ Erreur lecture son:', err));
      }
    });

    const fetchDashboardStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          console.log('🟢 [AdminDashboard] resume:', response.data.data.resume);
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-blue-600 font-medium">Chargement du tableau de bord admin...</span>
        </div>
      </div>
    );
  }

  if (error || !dashboardStats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200">
          <div className="text-red-600 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
            <p>{error || 'Erreur lors du chargement des données.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { resume, pharmaciesParStatut, activiteRecente, alertes, evolutionInscriptions, evolutionCommandes, commandesParPharmacie } = dashboardStats;

  const inscriptionLabels = evolutionInscriptions?.map((item) => `${item._id.month}/${item._id.year}`) || [];
  const inscriptionData = evolutionInscriptions?.map((item) => item.count) || [];

  const pharmacieStatutLabels = pharmaciesParStatut?.map((item) => {
    const statuts = {
      'approuvee': 'Approuvées',
      'en_attente': 'En attente',
      'rejetee': 'Rejetées'
    };
    return statuts[item._id] || item._id || 'Inconnu';
  }) || [];
  const pharmacieStatutData = pharmaciesParStatut?.map((item) => item.count) || [];

  const commandeLabels = evolutionCommandes?.map((item) => `${item._id.month}/${item._id.year}`) || [];
  const commandeData = evolutionCommandes?.map((item) => item.count) || [];

  const commandesParPharmacieLabels = commandesParPharmacie?.map((item) => item.pharmacieNom || 'Inconnu') || [];
  const commandesParPharmacieData = commandesParPharmacie?.map((item) => item.count) || [];

  const commandeStatutLabels = ['En Attente', 'En Cours', 'Livrées', 'Annulées'];
  const commandeStatutData = [
    resume.commandesEnAttente || 0,
    resume.commandesEnCours || 0,
    resume.commandesLivrees || 0,
    resume.commandesAnnulees || 0
  ];

  const colorPalette = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <ToastContainer position="top-right" theme="colored" />

      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                <span className="text-white text-2xl font-bold">👑</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Tableau de bord Administrateur
                </h1>
                <p className="text-gray-600">
                  Bienvenue, <strong className="text-blue-600">{user.prenom} {user.nom}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Utilisateurs</p>
                <p className="text-3xl font-bold text-gray-900">{resume.totalUsers || 0}</p>
                <p className="text-green-600 text-sm mt-1">↗ +{resume.nouvellesInscriptions || 0} cette semaine</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <span className="text-blue-600 text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pharmacies</p>
                <p className="text-3xl font-bold text-gray-900">{resume.totalPharmacies || 0}</p>
                <p className="text-orange-600 text-sm mt-1">{resume.demandesEnAttente || 0} en attente</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <span className="text-green-600 text-2xl">🏥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Clients</p>
                <p className="text-3xl font-bold text-gray-900">{resume.totalClients || 0}</p>
                <p className="text-blue-600 text-sm mt-1">👤 Total clients</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <span className="text-blue-600 text-2xl">👤</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Commandes</p>
                <p className="text-3xl font-bold text-gray-900">{resume.totalCommandes || 0}</p>
                <p className="text-blue-600 text-sm mt-1">{resume.commandesEnAttente || 0} en attente</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <span className="text-purple-600 text-2xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Commandes En Attente</p>
                <p className="text-3xl font-bold text-gray-900">{resume.commandesEnAttente || 0}</p>
                <p className="text-blue-600 text-sm mt-1">⏳ En attente</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <span className="text-blue-600 text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Commandes En Cours</p>
                <p className="text-3xl font-bold text-gray-900">{resume.commandesEnCours || 0}</p>
                <p className="text-yellow-600 text-sm mt-1">⏳ En traitement</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl">
                <span className="text-yellow-600 text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Commandes Livrées</p>
                <p className="text-3xl font-bold text-gray-900">{resume.commandesLivrees || 0}</p>
                <p className="text-green-600 text-sm mt-1">✅ Complétées</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-xl">
                <span className="text-emerald-600 text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Commandes Annulées</p>
                <p className="text-3xl font-bold text-gray-900">{resume.commandesAnnulees || 0}</p>
                <p className="text-red-600 text-sm mt-1">❌ Annulées</p>
              </div>
              <div className="bg-red-100 p-3 rounded-xl">
                <span className="text-red-600 text-2xl">❌</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alertes */}
        {alertes && alertes.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                🚨 Alertes importantes 
                <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">{alertes.length}</span>
              </h2>
              <div className="grid gap-4">
                {alertes.map((alerte, index) => (
                  <div key={index} className={`p-4 rounded-xl border-l-4 ${
                    alerte.type === 'warning' 
                      ? 'bg-yellow-50 border-yellow-400' 
                      : 'bg-blue-50 border-blue-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${
                        alerte.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                      }`}>
                        {alerte.message}
                      </span>
                      <button
                        onClick={() => navigate(alerte.link || '/admin/pharmacy-requests')}
                        className={`px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200 ${
                          alerte.type === 'warning' 
                            ? 'bg-yellow-500 hover:bg-yellow-600' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                      >
                        {alerte.action || 'Voir'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Graphiques principaux */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {inscriptionLabels.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                📈 Évolution des inscriptions
              </h3>
              <Line
                data={{
                  labels: inscriptionLabels.reverse(),
                  datasets: [
                    {
                      label: 'Nouvelles inscriptions',
                      data: inscriptionData.reverse(),
                      borderColor: colorPalette.primary,
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      fill: true,
                      tension: 0.4,
                      borderWidth: 3,
                      pointBackgroundColor: colorPalette.primary,
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointRadius: 6,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { 
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { weight: 'bold' }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleColor: '#fff',
                      bodyColor: '#fff',
                      borderColor: colorPalette.primary,
                      borderWidth: 1,
                    },
                  },
                  scales: { 
                    y: { 
                      beginAtZero: true,
                      grid: { color: 'rgba(0, 0, 0, 0.05)' },
                      ticks: { font: { weight: 'bold' } }
                    },
                    x: {
                      grid: { color: 'rgba(0, 0, 0, 0.05)' },
                      ticks: { font: { weight: 'bold' } }
                    }
                  },
                }}
              />
            </div>
          )}

          {pharmacieStatutLabels.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                🏥 Statut des pharmacies
              </h3>
              <Doughnut
                data={{
                  labels: pharmacieStatutLabels,
                  datasets: [
                    {
                      data: pharmacieStatutData,
                      backgroundColor: [colorPalette.secondary, colorPalette.accent, colorPalette.danger],
                      borderColor: ['#fff', '#fff', '#fff'],
                      borderWidth: 3,
                      hoverBorderWidth: 4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { 
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { weight: 'bold' }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleColor: '#fff',
                      bodyColor: '#fff',
                    },
                  },
                }}
              />
            </div>
          )}
        </div>

        {/* Graphiques secondaires */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {commandeLabels.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                📊 Évolution des commandes
              </h3>
              <Line
                data={{
                  labels: commandeLabels.reverse(),
                  datasets: [
                    {
                      label: 'Commandes par mois',
                      data: commandeData.reverse(),
                      borderColor: colorPalette.secondary,
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      fill: true,
                      tension: 0.4,
                      borderWidth: 3,
                      pointBackgroundColor: colorPalette.secondary,
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointRadius: 6,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { 
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { weight: 'bold' }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleColor: '#fff',
                      bodyColor: '#fff',
                      borderColor: colorPalette.secondary,
                      borderWidth: 1,
                    },
                  },
                  scales: { 
                    y: { 
                      beginAtZero: true,
                      grid: { color: 'rgba(0, 0, 0, 0.05)' },
                      ticks: { font: { weight: 'bold' } }
                    },
                    x: {
                      grid: { color: 'rgba(0, 0, 0, 0.05)' },
                      ticks: { font: { weight: 'bold' } }
                    }
                  },
                }}
              />
            </div>
          )}

          {commandesParPharmacieLabels.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                🏆 Top 10 Pharmacies
              </h3>
              <Bar
                data={{
                  labels: commandesParPharmacieLabels,
                  datasets: [
                    {
                      label: 'Nombre de commandes',
                      data: commandesParPharmacieData,
                      backgroundColor: colorPalette.purple,
                      borderColor: '#6D28D9',
                      borderWidth: 2,
                      borderRadius: 8,
                      borderSkipped: false,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { 
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { weight: 'bold' }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleColor: '#fff',
                      bodyColor: '#fff',
                      borderColor: colorPalette.purple,
                      borderWidth: 1,
                    },
                  },
                  scales: { 
                    y: { 
                      beginAtZero: true,
                      grid: { color: 'rgba(0, 0, 0, 0.05)' },
                      ticks: { font: { weight: 'bold' } }
                    },
                    x: {
                      grid: { display: false },
                      ticks: { 
                        font: { weight: 'bold' },
                        maxRotation: 45,
                      }
                    }
                  },
                }}
              />
            </div>
          )}

          {commandeStatutData.some(count => count > 0) && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                📦 Répartition des statuts des commandes
              </h3>
              <Doughnut
                data={{
                  labels: commandeStatutLabels,
                  datasets: [
                    {
                      data: commandeStatutData,
                      backgroundColor: [colorPalette.accent, colorPalette.purple, colorPalette.secondary, colorPalette.danger],
                      borderColor: ['#fff', '#fff', '#fff', '#fff'],
                      borderWidth: 3,
                      hoverBorderWidth: 4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { weight: 'bold' }
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleColor: '#fff',
                      bodyColor: '#fff',
                    },
                  },
                }}
              />
            </div>
          )}
        </div>

        {/* Section inférieure */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              🔔 Notifications 
              <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">{notifications.length}</span>
            </h2>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📭</div>
                  <p className="text-gray-500">Aucune notification</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div key={notification._id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-gray-800 font-medium">{notification.message}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(notification.date).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          {notification.commandeId && (
                            <button
                              onClick={() => handleViewCommande(notification.commandeId)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              Voir détails
                            </button>
                          )}
                          <button
                            onClick={() => handleMarquerLu(notification._id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              📅 Activités récentes
            </h2>
            <div className="max-h-80 overflow-y-auto">
              {activiteRecente.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📊</div>
                  <p className="text-gray-500">Aucune activité récente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activiteRecente.map((activite) => (
                    <div key={activite._id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          activite.role === 'pharmacie' ? 'bg-green-100 text-green-600' :
                          activite.role === 'client' ? 'bg-blue-100 text-blue-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {activite.role === 'pharmacie' ? '🏥' : 
                           activite.role === 'client' ? '👤' : '👑'}
                        </div>
                        <div className="flex-1">
                          {activite.role === 'pharmacie' ? (
                            <p className="text-gray-800 font-medium">
                              <span className="text-green-600">{activite.pharmacieInfo.nomPharmacie}</span>
                            </p>
                          ) : (
                            <p className="text-gray-800 font-medium">
                              {activite.nom} {activite.prenom}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            {activite.email} • {new Date(activite.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}