// C:\reactjs node mongodb\pharmacie-frontend\src\pages\pharmacie\ConnexionsList.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:3001';

export default function ConnexionsList() {
  const navigate = useNavigate();
  const [connexions, setConnexions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0, limit: 50 });

  useEffect(() => {
    const pharmacyToken = localStorage.getItem('pharmacyToken');
    if (!pharmacyToken) {
      toast.error('Vous devez vous connecter à la pharmacie');
      navigate('/pharmacie/connexion');
      return;
    }

    // Récupérer les connexions
    const fetchConnexions = async (page = 1) => {
      try {
        const response = await axios.get(`${API_URL}/api/pharmacies/connexions-clients`, {
          headers: { Authorization: `Bearer ${pharmacyToken}` },
          params: { page, limit: pagination.limit },
        });

        console.log('🔍 Réponse API /connexions-clients:', response.data);

        if (response.data.success) {
          setConnexions(response.data.data.connexions);
          setPagination(response.data.data.pagination);
        } else {
          toast.error('Erreur lors de la récupération des connexions');
        }
      } catch (error) {
        console.error('❌ Erreur récupération connexions:', error.response?.data || error.message);
        toast.error(error.response?.data?.message || 'Erreur lors de la récupération des connexions');
      } finally {
        setLoading(false);
      }
    };

    fetchConnexions(pagination.current);
  }, [navigate, pagination.current, pagination.limit]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((prev) => ({ ...prev, current: newPage }));
      setLoading(true);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Chargement des connexions...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">
        Liste des connexions à la pharmacie
      </h1>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
        {connexions.length === 0 ? (
          <p className="text-gray-600">Aucune connexion trouvée.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Nom</th>
                    <th className="py-3 px-6 text-left">Prénom</th>
                    <th className="py-3 px-6 text-left">Email</th>
                    <th className="py-3 px-6 text-left">Téléphone</th>
                    <th className="py-3 px-6 text-left">Date de connexion</th>
                    <th className="py-3 px-6 text-left">Type</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm font-light">
                  {connexions.map((connexion) => (
                    <tr
                      key={connexion._id}
                      className="border-b border-gray-200 hover:bg-gray-100"
                    >
                      <td className="py-3 px-6 text-left whitespace-nowrap">
                        {connexion.informationsUtilisateur.nom}
                      </td>
                      <td className="py-3 px-6 text-left">
                        {connexion.informationsUtilisateur.prenom}
                      </td>
                      <td className="py-3 px-6 text-left">
                        {connexion.informationsUtilisateur.email}
                      </td>
                      <td className="py-3 px-6 text-left">
                        {connexion.informationsUtilisateur.telephone || 'Non spécifié'}
                      </td>
                      <td className="py-3 px-6 text-left">
                        {new Date(connexion.dateConnexion).toLocaleString()}
                      </td>
                      <td className="py-3 px-6 text-left">
                        {connexion.typeConnexion}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-4 flex justify-between items-center">
                <p className="text-gray-600">
                  Affichage de {connexions.length} sur {pagination.total} connexions
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.current + 1)}
                    disabled={pagination.current === pagination.pages}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        <button
          onClick={() => navigate('/pharmacie/dashboard')}
          className="mt-6 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
}