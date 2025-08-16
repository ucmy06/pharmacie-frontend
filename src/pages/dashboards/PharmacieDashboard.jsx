// src/components/PharmacieDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:3001';

export default function PharmacieDashboard() {
  const navigate = useNavigate();
  const [pharmacie, setPharmacie] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [stats, setStats] = useState({
    totalCommandes: 0,
    commandesEnAttente: 0,
    commandesEnCours: 0,
    commandesTerminees: 0,
    commandesAnnulees: 0,
    chiffreAffaires: 0
  });
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isCreatedBy, setIsCreatedBy] = useState(false);
  const [socketInstance, setSocketInstance] = useState(null);

  useEffect(() => {
    const pharmacyToken = localStorage.getItem('pharmacyToken');
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const pharmacyInfo = JSON.parse(localStorage.getItem('pharmacyInfo') || '{}');

    if (!pharmacyToken) {
      console.error('❌ Aucun pharmacyToken trouvé');
      toast.error('Vous devez vous connecter à la pharmacie');
      navigate('/pharmacie/connexion');
      return;
    }

    if (!userInfo._id) {
      console.error('❌ userInfo._id non défini');
      toast.error('Informations utilisateur manquantes');
      navigate('/login');
      return;
    }

    // Configurer Socket.io
    const socket = io(API_URL, {
      auth: { token: pharmacyToken },
      autoConnect: true,
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocketInstance(socket);

    const initializeData = async () => {
      try {
        setLoading(true);

        // Récupérer le profil
        const profilResponse = await axios.get(`${API_URL}/api/pharmacies/mon-profil`, {
          headers: { Authorization: `Bearer ${pharmacyToken}` },
        });

        if (profilResponse.data.success && profilResponse.data.pharmacie) {
          setPharmacie(profilResponse.data.pharmacie);
          const isCreatedBy = profilResponse.data.pharmacie.pharmacieInfo.createdBy?.toString() === userInfo._id?.toString();
          setIsCreatedBy(isCreatedBy);
        }

        // Récupérer les commandes pour calculer les statistiques
        const commandesResponse = await axios.get(`${API_URL}/api/pharmacies/commandes`, {
          headers: { Authorization: `Bearer ${pharmacyToken}` },
        });

        if (commandesResponse.data.success) {
          const commandesData = commandesResponse.data.data.commandes || [];
          setCommandes(commandesData);

          // Calculer les statistiques
          const totalCommandes = commandesData.length;
          const commandesEnAttente = commandesData.filter(cmd => cmd.statut === 'en_attente').length;
          const commandesEnCours = commandesData.filter(cmd => cmd.statut === 'en_cours').length;
          const commandesTerminees = commandesData.filter(cmd => cmd.statut === 'terminée').length;
          const commandesAnnulees = commandesData.filter(cmd => cmd.statut === 'annulée').length;
          const chiffreAffaires = commandesData
            .filter(cmd => cmd.statut === 'terminée')
            .reduce((total, cmd) => total + (cmd.total || 0), 0);

          setStats({
            totalCommandes,
            commandesEnAttente,
            commandesEnCours,
            commandesTerminees,
            commandesAnnulees,
            chiffreAffaires
          });
        }

        // Récupérer les notifications
        const notificationsResponse = await axios.get(`${API_URL}/api/pharmacies/notifications`, {
          headers: { Authorization: `Bearer ${pharmacyToken}` },
        });

        if (notificationsResponse.data.success) {
          setNotifications(notificationsResponse.data.data.notifications || []);
        }

      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        toast.error(error.response?.data?.message || 'Erreur lors du chargement des données');
        if (error.response?.status === 401) {
          localStorage.removeItem('pharmacyToken');
          localStorage.removeItem('pharmacyInfo');
          navigate('/pharmacie/connexion');
        }
      } finally {
        setLoading(false);
      }
    };

    // Configuration des événements WebSocket
    socket.on('connect', () => {
      console.log('✅ WebSocket connecté:', socket.id);
      if (pharmacyInfo._id) {
        socket.emit('joinRoom', `user_${pharmacyInfo._id}`);
      }
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Erreur de connexion socket:', err.message);
      toast.error('Erreur de connexion WebSocket');
    });

    socket.on('nouvelleCommande', (data) => {
      console.log('🔔 Nouvelle commande reçue:', data);
      if (data.commande) {
        setCommandes(prev => [data.commande, ...prev]);
        setStats(prev => ({
          ...prev,
          totalCommandes: prev.totalCommandes + 1,
          commandesEnAttente: prev.commandesEnAttente + 1
        }));
      }
      if (data.notification) {
        setNotifications(prev => [data.notification, ...prev]);
        toast.info(`Nouvelle commande: ${data.notification.message}`);
      }
      playNotificationSound();
    });

    socket.on('changementStatutCommande', (data) => {
      console.log('🔔 Changement de statut reçu:', data);
      if (data.commande) {
        setCommandes(prev =>
          prev.map(cmd =>
            cmd._id === data.commande._id ? { ...cmd, statut: data.commande.statut } : cmd
          )
        );
        // Recalculer les stats
        recalculateStats();
      }
      if (data.notification) {
        setNotifications(prev => [data.notification, ...prev]);
        toast.info(`Mise à jour: ${data.notification.message}`);
      }
      playNotificationSound();
    });

    socket.on('demandeIntegration', (data) => {
      console.log('📬 Nouvelle demande d\'intégration:', data);
      setNotifications(prev => [...prev, { 
        message: `Nouvelle demande d'intégration de ${data.clientNom}`,
        date: new Date(),
        lu: false
      }]);
      toast.info(`Nouvelle demande d'intégration de ${data.clientNom}`);
      playNotificationSound();
    });

    const playNotificationSound = () => {
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(err => console.error('❌ Erreur lecture son:', err));
      } catch (error) {
        console.error('❌ Erreur création audio:', error);
      }
    };

    const recalculateStats = () => {
      setCommandes(currentCommandes => {
        const totalCommandes = currentCommandes.length;
        const commandesEnAttente = currentCommandes.filter(cmd => cmd.statut === 'en_attente').length;
        const commandesEnCours = currentCommandes.filter(cmd => cmd.statut === 'en_cours').length;
        const commandesTerminees = currentCommandes.filter(cmd => cmd.statut === 'terminée').length;
        const commandesAnnulees = currentCommandes.filter(cmd => cmd.statut === 'annulée').length;
        const chiffreAffaires = currentCommandes
          .filter(cmd => cmd.statut === 'terminée')
          .reduce((total, cmd) => total + (cmd.total || 0), 0);

        setStats({
          totalCommandes,
          commandesEnAttente,
          commandesEnCours,
          commandesTerminees,
          commandesAnnulees,
          chiffreAffaires
        });

        return currentCommandes;
      });
    };

    initializeData();

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('connect_error');
        socket.off('nouvelleCommande');
        socket.off('changementStatutCommande');
        socket.off('demandeIntegration');
        socket.disconnect();
      }
    };
  }, [navigate]);

  const handleLogout = () => {
    if (socketInstance) {
      socketInstance.disconnect();
    }
    localStorage.removeItem('pharmacyToken');
    localStorage.removeItem('pharmacyInfo');
    toast.success('Déconnexion réussie');
    navigate('/pharmacie/connexion');
  };

  const getImageUrl = (cheminFichier) => {
    if (!cheminFichier) {
      return '/default-pharmacy-image.jpg';
    }
    const cleanPath = cheminFichier.replace(/\\/g, '/').replace(/^Uploads\//, '');
    return `${API_URL}/Uploads/${cleanPath}`;
  };

  const handleMarquerLue = async (notificationId) => {
    try {
      const pharmacyToken = localStorage.getItem('pharmacyToken');
      const pharmacyInfo = JSON.parse(localStorage.getItem('pharmacyInfo') || '{}');
      
      const response = await axios.put(
        `${API_URL}/api/notifications/${notificationId}/marquer-lue`,
        { pharmacyId: pharmacyInfo._id },
        { headers: { Authorization: `Bearer ${pharmacyToken}` } }
      );
      
      if (response.data.success) {
        setNotifications(prev =>
          prev.map(notif => 
            notif._id === notificationId ? { ...notif, lu: true } : notif
          )
        );
        toast.success('Notification marquée comme lue');
      }
    } catch (error) {
      console.error('❌ Erreur marquage notification:', error);
      toast.error('Erreur lors du marquage de la notification');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="text-lg font-medium text-slate-700">Chargement du dashboard...</div>
        </div>
      </div>
    );
  }

  if (!pharmacie || !pharmacie.pharmacieInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Informations manquantes</h3>
          <p className="text-red-600">Impossible de charger les informations de la pharmacie.</p>
        </div>
      </div>
    );
  }

  const { nom, email, telephone, pharmacieInfo } = pharmacie;
  const unreadNotifications = notifications.filter(notif => !notif.lu);
  const recentCommandes = commandes.slice(0, 5);

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
      
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header avec informations de la pharmacie */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={getImageUrl(pharmacieInfo?.photoPharmacie?.cheminFichier)}
                  alt={`Pharmacie ${pharmacieInfo.nomPharmacie}`}
                  onError={() => setImageError(true)}
                  className={`w-full h-full object-cover ${imageError ? 'hidden' : ''}`}
                />
                {imageError && (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 text-3xl font-bold">
                    {pharmacieInfo.nomPharmacie?.charAt(0) || 'P'}
                  </div>
                )}
              </div>
              {pharmacieInfo.estDeGarde && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  DE GARDE
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {pharmacieInfo.nomPharmacie || nom}
              </h1>
              <div className="space-y-2 text-slate-600">
                <p className="flex items-center justify-center lg:justify-start">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {email}
                </p>
                {telephone && (
                  <p className="flex items-center justify-center lg:justify-start">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {telephone}
                  </p>
                )}
                {pharmacieInfo.adresseGoogleMaps && (
                  <p className="flex items-center justify-center lg:justify-start">
                    <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {pharmacieInfo.adresseGoogleMaps}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Commandes</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalCommandes}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">En Attente</p>
                <p className="text-2xl font-bold text-orange-600">{stats.commandesEnAttente}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">En Cours</p>
                <p className="text-2xl font-bold text-blue-600">{stats.commandesEnCours}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Terminées</p>
                <p className="text-2xl font-bold text-green-600">{stats.commandesTerminees}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Annulées</p>
                <p className="text-2xl font-bold text-red-600">{stats.commandesAnnulees}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">CA Total</p>
                <p className="text-2xl font-bold text-purple-600">{stats.chiffreAffaires.toLocaleString()} FCFA</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides et données */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Actions rapides */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Actions rapides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/pharmacie/commandes')}
                className="relative bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <div className="text-left">
                    <p className="font-semibold">Gérer commandes</p>
                    <p className="text-sm opacity-90">Traiter les commandes</p>
                  </div>
                </div>
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold animate-pulse">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigate('/pharmacie/profil')}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="text-left">
                    <p className="font-semibold">Modifier profil</p>
                    <p className="text-sm opacity-90">Mettre à jour infos</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/pharmacie/demandes-integration')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div className="text-left">
                    <p className="font-semibold">Demandes intégration</p>
                    <p className="text-sm opacity-90">Gérer les demandes</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/pharmacie/connexions')}
                className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white p-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                  <div className="text-left">
                    <p className="font-semibold">Voir connexions</p>
                    <p className="text-sm opacity-90">Gérer les accès</p>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-6 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-semibold">Se déconnecter</span>
            </button>
          </div>

          {/* Commandes récentes */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Commandes récentes ({recentCommandes.length})
            </h2>
            
            {recentCommandes.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentCommandes.map((commande) => (
                  <div key={commande._id} className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {commande.userId?.prenom} {commande.userId?.nom}
                        </p>
                        <p className="text-sm text-slate-600">#{commande._id.slice(-8)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        commande.statut === 'terminée' ? 'bg-green-100 text-green-800' :
                        commande.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                        commande.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                        commande.statut === 'annulée' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {commande.statut?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-slate-600">
                      <span>{commande.medicaments?.length || 0} médicament(s)</span>
                      <span className="font-semibold text-green-600">{commande.total} FCFA</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(commande.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-slate-600 text-lg">Aucune commande récente</p>
                <p className="text-slate-500 text-sm">Les nouvelles commandes apparaîtront ici</p>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        {unreadNotifications.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5V7c0-2.209-1.791-4-4-4S7 4.791 7 7v5l-5 5h5m4 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Notifications non lues ({unreadNotifications.length})
            </h2>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {unreadNotifications.slice(0, 10).map((notif) => (
                <div key={notif._id} className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-slate-800 font-medium mb-2">{notif.message}</p>
                      <p className="text-sm text-slate-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(notif.date).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    {notif._id && (
                      <button
                        onClick={() => handleMarquerLue(notif._id)}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Marquer lu</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informations système */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Informations système
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
                Connexion temps réel
              </h3>
              <p className="text-sm text-blue-700">
                {socketInstance?.connected ? 
                  '✅ Connecté - Notifications en temps réel actives' : 
                  '❌ Déconnecté - Reconnexion en cours...'
                }
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Statut pharmacie
              </h3>
              <p className="text-sm text-green-700">
                {pharmacieInfo.estDeGarde ? 
                  '🟢 En garde - Service disponible 24h/24' : 
                  '🟡 Service normal - Horaires standards'
                }
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
              <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Dernière mise à jour
              </h3>
              <p className="text-sm text-purple-700">
                {new Date().toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}