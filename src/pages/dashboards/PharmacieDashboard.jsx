// src/components/PharmacieDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:3001';
const socket = io(API_URL, {
  autoConnect: false, // Attendre la connexion explicite
  withCredentials: true,
});

export default function PharmacieDashboard() {
  const navigate = useNavigate();
  const [pharmacie, setPharmacie] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isCreatedBy, setIsCreatedBy] = useState(false);

  useEffect(() => {
    const pharmacyToken = localStorage.getItem('pharmacyToken');
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

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

    // Configurer Socket.io avec pharmacyToken
    socket.auth = { token: pharmacyToken };
    socket.connect();

    // Récupérer le profil
    axios
      .get(`${API_URL}/api/pharmacies/mon-profil`, {
        headers: { Authorization: `Bearer ${pharmacyToken}` },
      })
      .then((res) => {
        console.log('🔍 Réponse API /mon-profil:', JSON.stringify(res.data, null, 2));
        if (res.data.success && res.data.pharmacie) {
          setPharmacie(res.data.pharmacie);
          const isCreatedBy = res.data.pharmacie.pharmacieInfo.createdBy?.toString() === userInfo._id?.toString();
          console.log('🔍 pharmacieInfo.createdBy:', res.data.pharmacie.pharmacieInfo.createdBy);
          console.log('🔍 userInfo._id:', userInfo._id);
          console.log('🔍 isCreatedBy:', isCreatedBy);
          setIsCreatedBy(isCreatedBy);
          socket.emit('joinPharmacie', res.data.pharmacie._id);
        } else {
          console.error('❌ Structure de réponse inattendue:', res.data);
          toast.error('Erreur lors du chargement du profil');
          navigate('/pharmacie/connexion');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ Erreur chargement profil pharmacie:', err.response?.data || err.message);
        toast.error(err.response?.data?.message || 'Erreur lors du chargement du profil');
        localStorage.removeItem('pharmacyToken');
        localStorage.removeItem('pharmacyInfo');
        navigate('/pharmacie/connexion');
      });

    // Récupérer les notifications non lues
    axios
      .get(`${API_URL}/api/pharmacies/notifications`, {
        headers: { Authorization: `Bearer ${pharmacyToken}` },
      })
      .then((res) => {
        if (res.data.success) {
          console.log('🔔 Notifications reçues:', res.data.data.notifications);
          setNotifications(res.data.data.notifications);
        }
      })
      .catch((err) => {
        console.error('❌ Erreur chargement notifications:', err.response?.data || err.message);
        toast.warn('Impossible de charger les notifications');
      });

    // Écouter les événements WebSocket
    socket.on('connect', () => console.log('✅ Connecté au socket'));
    socket.on('connect_error', (err) => console.error('❌ Erreur de connexion socket:', err.message));
    socket.on('nouvelleCommande', (data) => {
      console.log('🔔 Nouvelle commande reçue via WebSocket:', data);
      setNotifications((prev) => [...prev, data.notification]);
      toast.info(`Nouvelle commande: ${data.notification.message}`);
    });
    socket.on('demandeIntegration', (data) => {
      console.log('📬 Nouvelle demande d\'intégration:', data);
      setNotifications((prev) => [...prev, { message: `Nouvelle demande d'intégration de ${data.clientNom}` }]);
      toast.info(`Nouvelle demande d'intégration de ${data.clientNom}`);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('nouvelleCommande');
      socket.off('demandeIntegration');
      socket.disconnect();
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('pharmacyToken');
    localStorage.removeItem('pharmacyInfo');
    socket.disconnect();
    toast.success('Déconnexion réussie');
    navigate('/pharmacie/connexion');
  };

  const getImageUrl = (cheminFichier) => {
    if (!cheminFichier) {
      console.log('📷 Aucun chemin d\'image fourni, utilisation de l\'image par défaut');
      return '/default-pharmacy-image.jpg';
    }
    const cleanPath = cheminFichier.replace(/\\/g, '/').replace(/^Uploads\//, '');
    const url = `${API_URL}/Uploads/${cleanPath}`;
    console.log('📷 URL de l\'image générée:', url);
    return url;
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Chargement...</div>;
  }

  if (!pharmacie || !pharmacie.pharmacieInfo) {
    return <div className="p-6 text-red-600">Informations pharmacie manquantes.</div>;
  }

  const { nom, email, telephone, pharmacieInfo } = pharmacie;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">
        Tableau de bord de la Pharmacie
      </h1>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32 mb-4">
            <img
              src={getImageUrl(pharmacieInfo?.photoPharmacie?.cheminFichier)}
              alt={`Pharmacie ${pharmacieInfo.nomPharmacie || 'inconnue'}`}
              onError={() => {
                console.log('❌ Erreur de chargement de l\'image:', pharmacieInfo?.photoPharmacie?.cheminFichier);
                setImageError(true);
              }}
              className={`w-full h-full object-cover rounded-full border-2 border-gray-200 ${imageError ? 'hidden' : ''}`}
            />
            {imageError && (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full text-gray-600 text-sm">
                Image non disponible
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            {pharmacieInfo.nomPharmacie || nom}
          </h2>
        </div>
        <div className="space-y-4">
          <p className="text-gray-700">
            <strong>Email :</strong> {email}
          </p>
          <p className="text-gray-700">
            <strong>Téléphone :</strong> {telephone || 'Non spécifié'}
          </p>
          <p className="text-gray-700">
            <strong>Adresse :</strong>{' '}
            {pharmacieInfo.adresseGoogleMaps || 'Non spécifiée'}
          </p>
          <p className="text-gray-700">
            <strong>Livraison disponible :</strong>{' '}
            {pharmacieInfo.livraisonDisponible ? 'Oui' : 'Non'}
          </p>
          <p className="text-gray-700">
            <strong>Statut de garde :</strong>{' '}
            {pharmacieInfo.estDeGarde ? 'En garde' : 'Hors garde'}
          </p>
        </div>
        <div className="mt-6 flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => navigate('/pharmacie/profil')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Modifier le profil
          </button>
          <button
            onClick={() => navigate('/pharmacie/commandes')}
            className="relative bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Gérer les commandes
            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {notifications.length}
              </span>
            )}
          </button>
            <button
              onClick={() => navigate('/pharmacie/demandes-integration')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Gérer les demandes d'intégration
            </button>
          
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}