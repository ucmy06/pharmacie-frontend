// src/pages/dashboards/ClientDashboard.jsx
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export default function ClientDashboard() {
  const { user, token, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <div>Chargement du tableau de bord client...</div>;
  if (!user || !token) return <div>Utilisateur non connecté.</div>;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">
          👤 Tableau de bord Client
        </h1>

        <p className="text-gray-700 mb-4">
          Bienvenue, <strong>{user.prenom} {user.nom}</strong><br />
          Email : {user.email}
        </p>

        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <Link
            to="/demande-pharmacie"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
          >
            🏥 Faire une demande de pharmacie
          </Link>

          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            🔒 Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
