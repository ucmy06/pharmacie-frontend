import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const API_URL = 'http://localhost:3001';

export default function PharmacyProfile() {
  const { pharmacyId } = useParams();
  const navigate = useNavigate();
  const { token, isLoading } = useAuth();
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoading || !token) {
      setError('Veuillez vous connecter pour voir le profil');
      setLoading(false);
      return;
    }

    const fetchPharmacy = async () => {
      try {
        console.log(`🔍 [fetchPharmacy] Récupération pour pharmacie ${pharmacyId}`);
        const response = await axios.get(`${API_URL}/api/pharmacies/${pharmacyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('🔍 [fetchPharmacy] Réponse:', response.data);
        if (response.data.success) {
          setPharmacy(response.data.pharmacie);
        } else {
          setError(response.data.message || 'Erreur lors du chargement du profil');
        }
      } catch (err) {
        console.error('❌ [fetchPharmacy] Erreur:', err);
        setError('Erreur serveur: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacy();
  }, [pharmacyId, token, isLoading]);

  if (loading) {
    return <div className="p-6 text-lg text-gray-800">Chargement...</div>;
  }

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  if (!pharmacy) {
    return <p className="p-6 text-gray-600">Pharmacie non trouvée.</p>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">{pharmacy.pharmacieInfo.nomPharmacie || 'Pharmacie'}</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        {pharmacy.pharmacieInfo.photoPharmacie?.cheminFichier ? (
          <img
            src={`${API_URL}${pharmacy.pharmacieInfo.photoPharmacie.cheminFichier}`}
            alt={pharmacy.pharmacieInfo.nomPharmacie}
            className="w-32 h-32 object-cover mb-4 rounded-lg"
            onError={(e) => console.error(`❌ [PharmacyProfile] Échec chargement image: ${API_URL}${pharmacy.pharmacieInfo.photoPharmacie.cheminFichier}`, e)}
          />
        ) : (
          <div className="w-32 h-32 mb-4 flex items-center justify-center bg-gray-200 text-gray-600 rounded-lg">
            Aucune photo
          </div>
        )}
        <p className="text-gray-600"><strong>Adresse :</strong> {pharmacy.pharmacieInfo.adresseGoogleMaps || 'Non spécifiée'}</p>
        <p className="text-gray-600"><strong>Téléphone :</strong> {pharmacy.telephone || 'Non spécifié'}</p>
        <p className="text-gray-600"><strong>Email :</strong> {pharmacy.email || 'Non spécifié'}</p>
        <p className="text-gray-600"><strong>Livraison :</strong> {pharmacy.pharmacieInfo.livraisonDisponible ? 'Disponible' : 'Non disponible'}</p>
        <p className="text-gray-600"><strong>De garde :</strong> {pharmacy.pharmacieInfo.estDeGarde ? 'Oui' : 'Non'}</p>
        {pharmacy.pharmacieInfo.heuresOuverture && (
          <div className="mt-4">
            <h2 className="text-lg font-bold text-gray-800">Heures d'ouverture</h2>
            {Object.entries(pharmacy.pharmacieInfo.heuresOuverture).map(([day, hours]) => (
              <p key={day} className="text-gray-600">
                <strong>{day.charAt(0).toUpperCase() + day.slice(1)} :</strong>{' '}
                {hours.ouvert ? `${hours.debut} - ${hours.fin}` : 'Fermé'}
              </p>
            ))}
          </div>
        )}
        <button
          onClick={() => navigate(`/medicaments/${pharmacyId}`)}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Voir les médicaments
        </button>
      </div>
    </div>
  );
}