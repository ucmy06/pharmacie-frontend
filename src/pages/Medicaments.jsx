import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import { useAuth } from '../hooks/useAuth';

export default function Medicaments() {
  const { pharmacyId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user, token, isLoading } = useAuth();
  const [medicaments, setMedicaments] = useState([]);
  const [pharmacyName, setPharmacyName] = useState(state?.pharmacyName || 'Pharmacie');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || isLoading) {
      setError('Veuillez vous connecter pour voir les médicaments');
      setLoading(false);
      return;
    }

    const fetchMedicaments = async () => {
      try {
        console.log(`🔍 [fetchMedicaments] Récupération des médicaments pour pharmacie ${pharmacyId}`);
        const response = await axiosInstance.get(`/api/medicaments/pharmacy/${pharmacyId}/medicaments`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('🔍 [fetchMedicaments] Réponse:', response.data);

        if (response.data.success) {
          setMedicaments(response.data.data.medicaments);
        } else {
          setError(response.data.message || 'Erreur lors du chargement des médicaments');
        }
      } catch (err) {
        console.error('❌ Erreur chargement médicaments:', err);
        setError('Erreur serveur: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchMedicaments();
  }, [pharmacyId, token, isLoading]);

  if (loading) {
    return <div className="p-6 text-lg text-gray-800">Chargement...</div>;
  }

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">
        Médicaments de {pharmacyName}
      </h1>
      <button
        onClick={() => navigate('/pharmacies')}
        className="mb-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
      >
        Retour aux pharmacies
      </button>
      {medicaments.length === 0 ? (
        <p className="text-gray-600">Aucun médicament trouvé pour cette pharmacie.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medicaments.map((med) => (
            <div key={med._id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                {med.images && med.images.length > 0 ? (
                  <div className="flex gap-4 mr-4">
                    {med.images.map((image, index) => (
                      <img
                        key={index}
                        src={`http://localhost:3001${image.cheminFichier}`}
                        alt={`${med.nom} image ${index + 1}`}
                        className="w-16 h-16 object-cover"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-16 h-16 mr-4 flex items-center justify-center bg-gray-200 text-gray-600">
                    Aucune image
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{med.nom}</h2>
                  {med.nom_generique && <p className="text-gray-600">Générique: {med.nom_generique}</p>}
                  <p className="text-gray-600">{med.description || 'Aucune description'}</p>
                  <p className="text-gray-600">Prix: {med.prix} Francs</p>
                  <p className="text-gray-600">Stock: {med.quantite_stock}</p>
                  <p className="text-gray-600">
                    {med.est_sur_ordonnance ? 'Sur ordonnance' : 'Sans ordonnance'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}