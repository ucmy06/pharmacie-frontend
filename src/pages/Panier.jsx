import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:3001';

export default function Panier() {
  const navigate = useNavigate();
  const [paniers, setPaniers] = useState([]);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    const fetchPaniers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Veuillez vous connecter pour voir votre panier');
          navigate('/client/connexion');
          return;
        }

        const response = await axios.get(`${API_URL}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('🔍 [fetchPaniers] Réponse:', response.data);

        if (response.data.success) {
          setPaniers(response.data.data);
        } else {
          setError('Erreur lors de la récupération du panier');
        }
      } catch (err) {
        console.error('❌ [fetchPaniers] Erreur:', err);
        setError('Erreur serveur: ' + (err.response?.data?.message || err.message));
      }
    };

    fetchPaniers();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        (err) => {
          console.error('❌ Erreur géolocalisation:', err);
          setError('Impossible de récupérer votre position');
        }
      );
    }
  }, [navigate]);

  const handleCommander = async (pharmacyId, livraison) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/client/connexion');
        return;
      }

      const panier = paniers.find(p => p.pharmacyId === pharmacyId);
      if (!panier || panier.medicaments.length === 0) {
        setError('Panier vide');
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/client/commandes`,
        {
          pharmacyId,
          medicaments: panier.medicaments,
          livraison,
          adresseLivraison: livraison && position ? { ...position, adresseTexte: 'Position actuelle' } : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPaniers(prev => prev.filter(p => p.pharmacyId !== pharmacyId));
        toast.success('Commande passée avec succès !');
      } else {
        setError(response.data.message || 'Erreur lors de la commande');
      }
    } catch (err) {
      console.error('❌ Erreur commande:', err);
      setError('Erreur serveur: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Votre Panier</h1>
      {error && <p className="text-red-600 mb-6">{error}</p>}
      {paniers.length === 0 ? (
        <p className="text-gray-600">Votre panier est vide.</p>
      ) : (
        paniers.map(({ pharmacyId, medicaments, total, pharmacieInfo }) => (
          <div key={pharmacyId} className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800">{pharmacieInfo.nomPharmacie || 'Pharmacie'}</h2>
            <div className="space-y-2">
              {medicaments.map((item) => (
                <div key={item.medicamentId} className="flex justify-between items-center">
                  <div className="flex items-center">
                    {item.image ? (
                      <img
                        src={`${API_URL}/api/images/medicaments/${item.image.nomFichier}`}
                        alt={item.nom}
                        className="w-12 h-12 object-cover mr-4 rounded"
                        onError={(e) => console.error(`❌ [Panier] Échec chargement image: ${API_URL}/api/images/medicaments/${item.image.nomFichier}`, e)}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 mr-4 flex items-center justify-center rounded">
                        Aucune image
                      </div>
                    )}
                    <p>{item.nom} (x{item.quantite})</p>
                  </div>
                  <p>{item.quantite * item.prixUnitaire} FCFA</p>
                </div>
              ))}
              <p className="font-bold">Total: {total} FCFA</p>
            </div>
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => handleCommander(pharmacyId, false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Récupérer en pharmacie
              </button>
              <button
                disabled={!pharmacieInfo.livraisonDisponible || !position}
                onClick={() => handleCommander(pharmacyId, true)}
                className={`px-4 py-2 rounded-lg ${
                  !pharmacieInfo.livraisonDisponible || !position ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Commander avec livraison
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}