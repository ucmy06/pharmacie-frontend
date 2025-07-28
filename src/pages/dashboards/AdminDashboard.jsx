// C:\reactjs node mongodb\pharmacie-frontend\src\pages\dashboards\AdminDashboard.jsx

import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, token, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <div>Chargement du tableau de bord admin...</div>;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">
          👑 Tableau de bord Administrateur
        </h1>

        <p className="text-gray-700 mb-4">
          Bienvenue, <strong>{user.prenom} {user.nom}</strong><br />
          Email : {user.email}
        </p>

        <div className="flex flex-col md:flex-row gap-4 mt-6 flex-wrap">
          <Link
            to="/admin/pharmacies/database"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
          >
            🗄️ Associer une base de données  
          </Link>
          <Link
            to="/admin/pharmacy-requests"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center"
          >
            📋 Gérer les demandes pharmacies demande de création
          </Link>
          <Link
            to="/admin/modification-requests"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-center"
          >
            🔄 Gérer les demandes de modification  
          </Link>
          <Link
            to="/admin/select-pharmacy-for-medicaments"
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-center"
          >
   🔄 sélectionnée une pharmacie
          </Link>
          <Link
            to="/admin/ManageMedicamentImages"
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-center"
          >

            🖼️ Gérer les images des médicaments
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