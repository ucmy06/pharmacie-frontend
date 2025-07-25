import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

export default function PharmacieDashboard() {
  const navigate = useNavigate();
  const [pharmacie, setPharmacie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('pharmacyToken');

    if (!token) {
      navigate('/pharmacie/connexion');
      return;
    }

    axios
      .get(`${API_URL}/api/pharmacies/mon-profil`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log('🔍 Réponse API complète:', res.data);
        if (res.data.success && res.data.pharmacie) {
          setPharmacie(res.data.pharmacie);
        } else {
          console.error('Structure de réponse inattendue:', res.data);
          navigate('/pharmacie/connexion');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ Erreur chargement profil pharmacie:', err);
        localStorage.removeItem('pharmacyToken');
        localStorage.removeItem('pharmacyInfo');
        navigate('/pharmacie/connexion');
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('pharmacyToken');
    localStorage.removeItem('pharmacyInfo');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userInfo');
    navigate('/pharmacie/connexion');
  };

  // Fonction pour construire l'URL de l'image
  const getImageUrl = (cheminFichier) => {
    if (!cheminFichier) {
      console.log('📷 Aucun chemin d\'image fourni, utilisation de l\'image par défaut');
      return '/default-pharmacy-image.jpg';
    }
    const cleanPath = cheminFichier.startsWith('Uploads/') ? cheminFichier.replace('Uploads/', '') : cheminFichier;
    const [type, filename] = cleanPath.split('/');
    const url = `${API_URL}/api/images/${type}/${filename}`;
    console.log('📷 URL de l\'image générée:', url);
    return url;
  };

  if (loading) {
    return <div className="p-6 text-white">Chargement...</div>;
  }

  if (!pharmacie || !pharmacie.pharmacieInfo) {
    return <div className="p-6 text-red-600">Informations pharmacie manquantes.</div>;
  }

  const { nom, email, telephone, pharmacieInfo } = pharmacie;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Tableau de bord de la Pharmacie</h1>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32 mb-4">
            <img
              src={getImageUrl(pharmacieInfo?.photoPharmacie?.cheminFichier)}
              alt={`Pharmacie ${pharmacieInfo.nomPharmacie || 'inconnue'}`}
              onError={() => {
                console.log('❌ Erreur de chargement de l\'image:', pharmacieInfo?.photoPharmacie?.cheminFichier);
                setImageError(true);
              }}
              className={`w-full h-full object-cover rounded-full border-2 border-gray-200 ${imageError ? 'hidden' : ''}`}
            />
            {imageError && (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full text-gray-600 text-sm">
                Image non disponible
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            {pharmacieInfo.nomPharmacie || nom}
          </h2>
        </div>
        <div className="space-y-4">
          <p className="text-gray-700">
            <strong>Email :</strong> {email}
          </p>
          <p className="text-gray-700">
            <strong>Téléphone :</strong> {telephone || 'Non spécifié'}
          </p>
          <p className="text-gray-700">
            <strong>Adresse :</strong>{' '}
            {pharmacieInfo.adresseGoogleMaps || 'Non spécifiée'}
          </p>
          <p className="text-gray-700">
            <strong>Livraison disponible :</strong>{' '}
            {pharmacieInfo.livraisonDisponible ? 'Oui' : 'Non'}
          </p>
          <p className="text-gray-700">
            <strong>Statut de garde :</strong>{' '}
            {pharmacieInfo.estDeGarde ? 'En garde' : 'Hors garde'}
          </p>
        </div>
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={() => navigate('/pharmacie/profil')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Modifier le profil
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}