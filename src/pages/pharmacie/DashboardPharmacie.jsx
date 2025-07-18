// C:\reactjs node mongodb\pharmacie-frontend\src\pages\pharmacie\DashboardPharmacie.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function DashboardPharmacie() {
  const navigate = useNavigate();
  const [pharmacie, setPharmacie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pharmacyToken');

    if (!token) {
      navigate('/pharmacie/connexion');
      return;
    }

    axios.get('http://localhost:3001/api/pharmacies/mon-profil', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setPharmacie(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur chargement profil pharmacie:', err);
        localStorage.removeItem('pharmacyToken');
        localStorage.removeItem('pharmacyInfo');
        navigate('/pharmacie/connexion');
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('pharmacyToken');
    localStorage.removeItem('pharmacyInfo');
    navigate('/client-dashboard');
  };

  if (loading) return <div className="p-6">Chargement...</div>;

  if (!pharmacie || !pharmacie.pharmacieInfo) {
    return <div className="p-6 text-red-600">Informations pharmacie manquantes.</div>;
  }

  const { nom, email, pharmacieInfo } = pharmacie;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Tableau de bord - Pharmacie</h1>
      <div className="bg-white rounded shadow p-4">
        <p><strong>Nom:</strong> {nom}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Numéro:</strong> {pharmacieInfo.numeroPharmacie}</p>
        <p><strong>Livraison disponible:</strong> {pharmacieInfo.livraisonDisponible ? 'Oui' : 'Non'}</p>

        <div className="mt-4 flex gap-4">
          <button
            onClick={() => navigate('/pharmacie/profil')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Voir / Modifier Profil
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
