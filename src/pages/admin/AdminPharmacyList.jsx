import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../utils/axiosConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminPharmacyList() {
  const { user, token, isLoading } = useAuth();
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoading || !token || !user || user.role !== 'admin') {
      if (!isLoading) navigate('/login');
      return;
    }

    const fetchPharmacies = async () => {
      try {
        const response = await axiosInstance.get('/api/admin/users', {
          params: { role: 'pharmacie' },
        });
        if (response.data.success) {
          setPharmacies(response.data.data.users || []);
        } else {
          setError(response.data.message || 'Erreur lors du chargement des pharmacies');
          toast.error(response.data.message || 'Erreur lors du chargement des pharmacies');
        }
      } catch (err) {
        console.error('❌ Erreur chargement pharmacies:', err);
        setError(err.response?.data?.message || 'Erreur serveur');
        toast.error(err.response?.data?.message || 'Erreur serveur');
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacies();
  }, [navigate, token, user, isLoading]);

  const handleToggleStatus = async (pharmacyId, isActive) => {
    const action = isActive ? 'désactiver' : 'activer';
    if (!window.confirm(`Voulez-vous vraiment ${action} cette pharmacie ?`)) return;

    setLoading(true);
    try {
      const response = await axiosInstance.put(`/api/admin/users/${pharmacyId}/status`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        toast.success(`Pharmacie ${action} avec succès`);
        setPharmacies(pharmacies.map(pharmacy =>
          pharmacy._id === pharmacyId ? { ...pharmacy, isActive: response.data.data.isActive } : pharmacy
        ));
      } else {
        setError(response.data.message || `Erreur lors de ${action} de la pharmacie`);
        toast.error(response.data.message || `Erreur lors de ${action} de la pharmacie`);
      }
    } catch (err) {
      console.error(`❌ Erreur ${action} pharmacie:`, err);
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
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-blue-700 mb-6 flex items-center">
          <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Gestion des Pharmacies
        </h1>

        {error && (
          <p className="mb-6 p-4 rounded-lg bg-red-100 text-red-600">{error}</p>
        )}

        <ul className="space-y-4">
          {pharmacies.map((pharmacy) => (
            <li key={pharmacy._id} className="p-4 bg-gray-50 rounded-lg shadow-md border border-gray-200 flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold text-gray-800">{pharmacy.pharmacieInfo.nomPharmacie || pharmacy.nom}</p>
                <p className="text-sm text-gray-600">Email: {pharmacy.email}</p>
                <p className="text-sm text-gray-600">Téléphone: {pharmacy.telephone}</p>
                <p className="text-sm text-gray-600">
                  Statut: <span className={pharmacy.isActive ? 'text-green-600' : 'text-red-600'}>
                    {pharmacy.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </p>
              </div>
              <button
                onClick={() => handleToggleStatus(pharmacy._id, pharmacy.isActive)}
                className={`font-semibold px-4 py-2 rounded-lg transition duration-300 disabled:opacity-50 ${
                  pharmacy.isActive
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                disabled={loading}
              >
                {pharmacy.isActive ? 'Désactiver' : 'Activer'}
              </button>
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