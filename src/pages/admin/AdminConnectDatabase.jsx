import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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

  const availableDatabases = [
    'pharmacie_alpha',
    'pharmacie_beta',
    'pharmacie_nova',
    'pharmacie_omega',
    'pharmacie_test',
    'pharmacie_first',
  ];

  useEffect(() => {
    if (isLoading || !token || !user || user.role !== 'admin') {
      if (!isLoading) navigate('/login');
      return;
    }

    const fetchPharmacies = async () => {
      try {
        const response = await axiosInstance.get('/api/admin/pharmacies');
        if (response.data.success) {
          setPharmacies(response.data.data.pharmacies || []);
        } else {
          setError(response.data.message || 'Erreur lors du chargement');
          toast.error(response.data.message || 'Erreur lors du chargement');
        }
      } catch (err) {
        console.error('❌ Erreur chargement pharmacies:', err);
        setError(err.response?.data?.message || 'Erreur serveur');
        toast.error(err.response?.data?.message || 'Erreur serveur');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacies();
  }, [navigate, token, user, isLoading]);

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!selectedPharmacie || !baseMedicament) {
      setError('Veuillez sélectionner une pharmacie et une base de données');
      toast.error('Veuillez sélectionner une pharmacie et une base de données');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/api/admin/pharmacy/${selectedPharmacie}/assign-db`,
        { nomBaseMedicament: baseMedicament }
      );
      if (response.data.success) {
        toast.success('Base de données connectée avec succès !');
        setBaseMedicament('');
        setSelectedPharmacie('');
        setError(null);
        const updatedResponse = await axiosInstance.get('/api/admin/pharmacies');
        setPharmacies(updatedResponse.data.data.pharmacies || []);
      } else {
        setError(response.data.message || 'Erreur lors de l\'association');
        toast.error(response.data.message || 'Erreur lors de l\'association');
      }
    } catch (err) {
      console.error('❌ Erreur connexion base:', err);
      setError(err.response?.data?.message || 'Erreur serveur');
      toast.error(err.response?.data?.message || 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (pharmacyId) => {
    if (!window.confirm('Voulez-vous vraiment déconnecter la base de données de cette pharmacie ?')) return;

    setLoading(true);
    try {
      const response = await axiosInstance.delete(`/api/admin/pharmacy/${pharmacyId}/assign-db`);
      if (response.data.success) {
        toast.success('Base de données déconnectée avec succès !');
        setError(null);
        const updatedResponse = await axiosInstance.get('/api/admin/pharmacies');
        setPharmacies(updatedResponse.data.data.pharmacies || []);
      } else {
        setError(response.data.message || 'Erreur lors de la déconnexion');
        toast.error(response.data.message || 'Erreur lors de la déconnexion');
      }
    } catch (err) {
      console.error('❌ Erreur déconnexion base:', err);
      setError(err.response?.data?.message || 'Erreur serveur');
      toast.error(err.response?.data?.message || 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center text-lg font-semibold text-gray-700 animate-pulse">
          <svg className="animate-spin h-6 w-6 text-blue-600 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
          </svg>
          Chargement...
        </div>
      </div>
    );
  }

  if (!user || !token || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg font-semibold text-red-600">
          Accès non autorisé.
          <button
            onClick={() => navigate('/login')}
            className="mt-2 text-blue-600 underline hover:text-blue-800 transition duration-200"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-blue-700 mb-6 flex items-center">
          <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Gérer les bases de données des pharmacies
        </h1>

        {error && (
          <p className="mb-6 p-4 rounded-lg bg-red-100 text-red-600">{error}</p>
        )}

        <form onSubmit={handleConnect} className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner une pharmacie
              </label>
              <select
                value={selectedPharmacie}
                onChange={(e) => setSelectedPharmacie(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">-- Choisir une pharmacie --</option>
                {pharmacies.map((pharma) => (
                  <option key={pharma._id} value={pharma._id}>
                    {pharma.pharmacieInfo.nomPharmacie || pharma.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la base de données
              </label>
              <select
                value={baseMedicament}
                onChange={(e) => setBaseMedicament(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">-- Choisir une base --</option>
                {availableDatabases.map((db) => (
                  <option key={db} value={db}>
                    {db}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-300 disabled:opacity-50"
            disabled={loading || !selectedPharmacie || !baseMedicament}
          >
            Connecter la base
          </button>
        </form>

        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Pharmacies associées</h2>
        <ul className="space-y-4">
          {pharmacies.map((pharma) => (
            <li key={pharma._id} className="p-4 bg-gray-50 rounded-lg shadow-md border border-gray-200 flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  {pharma.pharmacieInfo.nomPharmacie || pharma.nom}
                </p>
                <p className="text-sm text-gray-600">
                  Base de données : {pharma.pharmacieInfo.baseMedicament || 'Aucune'}
                </p>
              </div>
              {pharma.pharmacieInfo.baseMedicament && (
                <button
                  onClick={() => handleDisconnect(pharma._id)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition duration-300 disabled:opacity-50"
                  disabled={loading}
                >
                  Déconnecter
                </button>
              )}
            </li>
          ))}
        </ul>

        <button
          onClick={() => navigate('/admin-dashboard')}
          className="mt-8 bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-300"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
}