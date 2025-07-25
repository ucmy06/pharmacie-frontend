import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !user.token) return;

    axios
      .get('http://localhost:3001/api/admin/pharmacy-requests?statut=en_attente', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
      .then((res) => setDemandes(res.data.data.demandes))
      .catch((err) => {
        console.error('❌ Erreur API admin :', err);
        setError('Erreur lors du chargement des demandes.');
      });
  }, [user]);

  if (isLoading) return <div>Chargement du tableau de bord admin...</div>;
  if (!user) return <div>Utilisateur non connecté.</div>;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Bienvenue Admin, {user.prenom} {user.nom}</h2>
      <p className="text-gray-600 mb-6">Email : {user.email}</p>

      <h3 className="text-xl font-semibold mb-3">📥 Demandes de pharmacies</h3>
      {error && <p className="text-red-500">{error}</p>}

      {demandes.length === 0 ? (
        <p>Aucune demande pour l’instant.</p>
      ) : (
        <ul className="space-y-4">
          {demandes.map((demande, index) => (
            <li key={index} className="bg-white p-4 shadow rounded border">
              <p>
                <strong>Pharmacie :</strong> {demande.pharmacieInfo?.nomPharmacie || 'N/A'}
              </p>
              <p>
                <strong>Contact :</strong> {demande.pharmacieInfo?.telephone || 'N/A'} -{' '}
                {demande.email}
              </p>
              <p>
                <strong>Localisation :</strong> {demande.pharmacieInfo?.localisation || 'N/A'}
              </p>
              {demande.clientId && (
                <p>
                  <strong>Demande faite par :</strong> {demande.clientId.prenom}{' '}
                  {demande.clientId.nom} ({demande.clientId.email})
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={() => navigate('/admin/pharmacy-requests')}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-4"
      >
        📄 Voir toutes les demandes
      </button>
      <button
        onClick={() => navigate('/admin/modification-requests')}
        className="mt-6 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mr-4"
      >
        📝 Voir les demandes de modification
      </button>
      <button
        onClick={() => navigate('/admin/assign-database')}
        className="mt-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-4"
      >
        ⚙️ Associer une base de médicaments à une pharmacie
      </button>
      <button
        onClick={handleLogout}
        className="mt-6 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Se déconnecter
      </button>
    </div>
  );
}