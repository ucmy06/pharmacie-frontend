// C:\reactjs node mongodb\pharmacie-frontend\src\pages\CommandesClient.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../hooks/useAuth';

const API_URL = 'http://localhost:3001';
const socket = io(API_URL, {
  withCredentials: true,
  extraHeaders: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

export default function CommandesClient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [commandes, setCommandes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statutFilter, setStatutFilter] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token || !user) {
      setError('Veuillez vous connecter pour voir vos commandes');
      navigate('/login');
      return;
    }

    // Rejoindre la salle WebSocket pour l'utilisateur
    socket.emit('joinPharmacie', user.id);

    // Récupérer les commandes du client
    axios
      .get(`${API_URL}/api/client/commandes`, { // Changement d'URL
        headers: { Authorization: `Bearer ${token}` },
        params: { statut: statutFilter || undefined },
      })
      .then((res) => {
        console.log('🔍 Réponse API commandes:', res.data);
        if (res.data.success) {
          setCommandes(res.data.data.commandes);
        } else {
          setError(res.data.message || 'Erreur lors du chargement des commandes');
          toast.error(res.data.message || 'Erreur lors du chargement des commandes');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ Erreur chargement commandes:', err);
        setError(`Erreur serveur: ${err.response?.data?.message || err.message} (Code: ${err.response?.status || 'N/A'})`);
        toast.error(`Erreur serveur: ${err.response?.data?.message || err.message}`);
        setLoading(false);
      });

    // Récupérer les notifications
    axios
      .get(`${API_URL}/api/client/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success) {
          setNotifications(res.data.data.notifications);
        }
      })
      .catch((err) => {
        console.error('❌ Erreur chargement notifications:', err);
      });

    // Écouter les nouvelles commandes via WebSocket
    socket.on('nouvelleCommande', (data) => {
      console.log('🔔 Nouvelle commande reçue via WebSocket:', data);
      setCommandes((prev) => [data.commande, ...prev]);
      setNotifications((prev) => [...prev, data.notification]);
      toast.info(`Nouvelle commande: ${data.notification.message}`);
    });

    // Nettoyer la connexion WebSocket
    return () => {
      socket.off('nouvelleCommande');
    };
  }, [navigate, statutFilter, user]);

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
          <option value="en_preparation">En préparation</option>
          <option value="prete">Prête</option>
          <option value="livree">Livrée</option>
          <option value="annulee">Annulée</option>
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
                <strong>Statut:</strong> {commande.statut.replace('_', ' ')}
              </p>
              <p className="text-gray-600">
                <strong>Date:</strong> {new Date(commande.createdAt).toLocaleString()}
              </p>
              <h3 className="text-md font-semibold mt-4">Médicaments:</h3>
              <ul className="list-disc pl-5">
                {commande.medicaments.map((item) => (
                  <li key={item.medicamentId}>
                    <div className="flex items-center">
                      {item.image?.cheminFichier ? (
                        <img
                          src={`${API_URL}/api/images/medicaments/${item.image.nomFichier}`}
                          alt={item.nom}
                          className="w-12 h-12 object-cover mr-2 rounded"
                          onError={(e) => console.error(`❌ Échec chargement image: ${API_URL}/api/images/medicaments/${item.image.nomFichier}`, e)}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 mr-2 flex items-center justify-center rounded">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}