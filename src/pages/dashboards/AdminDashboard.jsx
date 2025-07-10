import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <div>Chargement du tableau de bord admin...</div>;
  if (!user) return <div>Utilisateur non connecté.</div>;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Bienvenue Admin, {user.prenom} {user.nom}</h2>
      <p>Email : {user.email}</p>

      <button
        onClick={handleLogout}
        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Se déconnecter
      </button>
    </div>
  );
}
