// C:\reactjs node mongodb\pharmacie-frontend\src\pages\admin\AdminConnectDatabase.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../utils/axiosConfig';

export default function AdminConnectDatabase() {
  const { user, token, isLoading } = useAuth();
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacie, setSelectedPharmacie] = useState('');
  const [baseMedicament, setBaseMedicament] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoading || !token || !user || user.role !== 'admin') {
      if (!isLoading) {
        navigate('/login');
      }
      return;
    }

    const fetchPharmacies = async () => {
      try {
        const response = await axiosInstance.get('/api/admin/pharmacies');
        if (response.data.success) {
          setPharmacies(response.data.data.pharmacies || []);
        } else {
          setError(response.data.message || 'Erreur lors du chargement');
        }
      } catch (err) {
        console.error('❌ Erreur chargement pharmacies:', err);
        setError(err.response?.data?.message || 'Erreur serveur');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacies();
  }, [navigate, token, user, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPharmacie || !baseMedicament) {
      setError('Veuillez sélectionner une pharmacie et une base de données');
      return;
    }

    try {
      const response = await axiosInstance.post(
        `/api/admin/pharmacy/${selectedPharmacie}/assign-db`,
        { nomBaseMedicament: baseMedicament }
      );
      if (response.data.success) {
        alert('Base de données connectée avec succès !');
        setBaseMedicament('');
        setSelectedPharmacie('');
        setError(null);
        const updatedResponse = await axiosInstance.get('/api/admin/pharmacies');
        setPharmacies(updatedResponse.data.data.pharmacies || []);
      } else {
        setError(response.data.message || 'Erreur lors de l\'association');
      }
    } catch (err) {
      console.error('❌ Erreur connexion base:', err);
      setError(err.response?.data?.message || 'Erreur serveur');
    }
  };

  if (loading || isLoading) {
    return <div className="p-6 text-lg font-semibold text-white">Chargement...</div>;
  }

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
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Connecter une base de médicaments</h1>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        {error && <p className="text-red-600 mb-6">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Sélectionner une pharmacie</label>
            <select
              value={selectedPharmacie}
              onChange={(e) => setSelectedPharmacie(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">--Choisir une pharmacie--</option>
              {pharmacies.map((pharma) => (
                <option key={pharma._id} value={pharma._id}>
                  {pharma.pharmacieInfo.nomPharmacie || pharma.nom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Nom de la base de données</label>
            <select
              value={baseMedicament}
              onChange={(e) => setBaseMedicament(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">--Choisir une base--</option>
              <option value="pharmacie_alpha">Pharmacie Alpha</option>
              <option value="pharmacie_beta">Pharmacie Beta</option>
              <option value="pharmacie_nova">Pharmacie Nova</option>
              <option value="pharmacie_omega">Pharmacie Omega</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            disabled={loading}
          >
            Connecter la base
          </button>
        </form>
        <button
          onClick={() => navigate('/admin-dashboard')}
          className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
}