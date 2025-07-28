// C:\reactjs node mongodb\pharmacie-frontend\src\pages\admin\SelectPharmacyForMedicaments.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../utils/axiosConfig';

export default function SelectPharmacyForMedicaments() {
  const { user, token, isLoading } = useAuth();
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPharmacies = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/api/admin/pharmacies');
        if (!response.data.success) {
          throw new Error(response.data.message || 'Échec de la récupération des pharmacies');
        }
        setPharmacies(response.data.data.pharmacies || []);
      } catch (err) {
        console.error('❌ Erreur chargement pharmacies:', err);
        setError(err.response?.data?.message || 'Erreur lors du chargement des pharmacies');
      } finally {
        setLoading(false);
      }
    };

    if (token && user?.role === 'admin' && !isLoading) {
      fetchPharmacies();
    }
  }, [token, user, isLoading]);

  const handleSelect = () => {
    if (!selectedPharmacy) {
      setError('Veuillez sélectionner une pharmacie.');
      return;
    }
    navigate(`/admin/pharmacy/${selectedPharmacy}/manage-medicament-images`);
  };

  if (isLoading) return <div>Chargement...</div>;

  if (!user || !token || user.role !== 'admin') {
    return (
      <div>
        Accès non autorisé.
        <button onClick={() => navigate('/login')} className="mt-2 text-blue-600 underline">
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-purple-700 mb-4">
          🖼️ Sélectionner une pharmacie pour gérer les images des médicaments
        </h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {loading && <p className="text-gray-600 mb-4">Chargement en cours...</p>}
        <div className="mb-4">
          <label className="block mb-2">Sélectionner une pharmacie :</label>
          <select
            value={selectedPharmacy}
            onChange={(e) => setSelectedPharmacy(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Choisir une pharmacie --</option>
            {pharmacies.map((pharma) => (
              <option key={pharma._id} value={pharma._id}>
                {pharma.pharmacieInfo.nomPharmacie} ({pharma.pharmacieInfo.baseMedicament || 'Aucune base'})
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSelect}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          disabled={loading}
        >
          Continuer
        </button>
        <button
          onClick={() => navigate('/admin-dashboard')}
          className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Retour au tableau de bor
        </button>
      </div>
    </div>
  );
}
