// C:\reactjs node mongodb\pharmacie-frontend\src\pages\PharmaciesProches.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import path from 'path-browserify'; // Pour React

const API_URL = 'http://localhost:3001';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c / 1000; // Retour en km
};

// Nouvelle fonction pour vérifier si ouverte maintenant
const isOpenNow = (heuresOuverture) => {
  if (!heuresOuverture) return false;
  const now = new Date();
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const jour = jours[now.getDay()];
  const heureActuelle = now.toTimeString().slice(0, 5); // HH:MM

  const horaireJour = heuresOuverture[jour];
  if (!horaireJour || !horaireJour.ouvert) return false;
  return heureActuelle >= horaireJour.debut && heureActuelle <= horaireJour.fin;
};

const getCoordinates = (adresse) => {
  if (!adresse) return null;

  const matchGoogle = adresse.match(/q=([-.\d]+),([-.\d]+)/);
  if (matchGoogle) {
    return { latitude: parseFloat(matchGoogle[1]), longitude: parseFloat(matchGoogle[2]) };
  }

  const matchEmbed = adresse.match(/!2d([-.\d]+)!3d([-.\d]+)/);
  if (matchEmbed) {
    return { latitude: parseFloat(matchEmbed[2]), longitude: parseFloat(matchEmbed[1]) };
  }

  if (adresse.includes('maps.app.goo.gl')) {
    console.warn(`URL raccourcie non supportée: ${adresse}`);
    return null;
  }

  return null;
};

export default function PharmaciesProches() {
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState([]);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gardeOpenPharmacies, setGardeOpenPharmacies] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Veuillez vous connecter pour voir les pharmacies');
      toast.error('Veuillez vous connecter pour voir les pharmacies');
      setLoading(false);
      return;
    }

    // Géolocalisation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => {
          console.error('❌ Erreur géolocalisation:', err);
          setError('Erreur lors de la récupération de votre position (tri par date par défaut)');
          toast.warn('Position non disponible, tri par date récente');
          setLoading(false);
        }
      );
    } else {
      setError('Géolocalisation non supportée');
      toast.error('Géolocalisation non supportée');
      setLoading(false);
    }

    // Fetch pharmacies
    axios.get(`${API_URL}/api/pharmacies`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => {
        if (response.data.success) {
          const allPharmacies = response.data.data.pharmacies;
          setPharmacies(allPharmacies);

          // Filtrage et tri pour pharmacies de garde ouvertes
          const filteredGardeOpen = allPharmacies
            .filter(pharma => pharma.pharmacieInfo.estDeGarde && isOpenNow(pharma.pharmacieInfo.heuresOuverture));

          // Tri par distance si position disponible, sinon par date d'approbation descendante
          const sortedGardeOpen = position
            ? filteredGardeOpen.sort((a, b) => {
                const coordA = getCoordinates(a.pharmacieInfo.adresseGoogleMaps);
                const coordB = getCoordinates(b.pharmacieInfo.adresseGoogleMaps);
                if (!coordA || !coordB) return 0;
                const distA = calculateDistance(position.latitude, position.longitude, coordA.latitude, coordA.longitude);
                const distB = calculateDistance(position.latitude, position.longitude, coordB.latitude, coordB.longitude);
                return distA - distB;
              })
            : filteredGardeOpen.sort((a, b) => new Date(b.pharmacieInfo.dateApprobation) - new Date(a.pharmacieInfo.dateApprobation));

          setGardeOpenPharmacies(sortedGardeOpen);
        } else {
          setError(response.data.message || 'Erreur lors du chargement');
          toast.error(response.data.message || 'Erreur lors du chargement');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ Erreur chargement pharmacies:', err);
        setError('Erreur serveur: ' + (err.response?.data?.message || err.message));
        toast.error('Erreur serveur: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      });
  }, []);

  const sortedPharmacies = position
    ? [...pharmacies].sort((a, b) => {
        const coordA = getCoordinates(a.pharmacieInfo.adresseGoogleMaps);
        const coordB = getCoordinates(b.pharmacieInfo.adresseGoogleMaps);
        if (!coordA || !coordB) return 0;
        const distA = calculateDistance(position.latitude, position.longitude, coordA.latitude, coordA.longitude);
        const distB = calculateDistance(position.latitude, position.longitude, coordB.latitude, coordB.longitude);
        return distA - distB;
      })
    : pharmacies;

  if (loading) {
    return <div className="p-6 text-lg text-white">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Pharmacies à proximité</h1>

      {/* Nouvelle section : Pharmacies de garde ouvertes */}
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Pharmacies de garde ouvertes actuellement</h2>
      {gardeOpenPharmacies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {gardeOpenPharmacies.map((pharma) => {
            const coord = getCoordinates(pharma.pharmacieInfo.adresseGoogleMaps);
            const distance = position && coord
              ? calculateDistance(position.latitude, position.longitude, coord.latitude, coord.longitude).toFixed(2)
              : 'Inconnue';
            return (
              <div key={pharma._id} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center">
                  {pharma.pharmacieInfo.photoPharmacie?.cheminFichier ? (
                    <img
                      src={`${API_URL}/api/images/pharmacies/${path.basename(pharma.pharmacieInfo.photoPharmacie.cheminFichier)}`}
                      alt={pharma.pharmacieInfo.nomPharmacie}
                      className="w-16 h-16 object-cover mr-4 rounded-lg"
                      onError={(e) => console.error(`❌ Échec chargement image:`, e)}
                    />
                  ) : (
                    <div className="w-16 h-16 mr-4 flex items-center justify-center bg-gray-200 text-gray-600 rounded-lg">
                      Aucune photo
                    </div>
                  )}
                  <div>
                    <h2
                      className="text-lg font-bold mb-2 text-gray-800 cursor-pointer hover:underline"
                      onClick={() => navigate(`/pharmacies/${pharma._id}/profil`, { state: { pharmacyName: pharma.pharmacieInfo.nomPharmacie } })}
                    >
                      {pharma.pharmacieInfo.nomPharmacie || `${pharma.nom} ${pharma.prenom}`}
                    </h2>
                    <p className="text-gray-600">Distance: {distance} km</p>
                    <p className="text-gray-600">Adresse: {pharma.pharmacieInfo.adresseGoogleMaps || 'Non spécifiée'}</p>
                    <p className="text-green-600 font-bold">De garde et ouverte !</p>
                    <button
                      onClick={() => navigate(`/medicaments/${pharma._id}`, { state: { pharmacyName: pharma.pharmacieInfo.nomPharmacie } })}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      Voir les médicaments
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-600 mb-8">Aucune pharmacie de garde ouverte actuellement.</p>
      )}

      {/* Autres pharmacies (inchangées, triées par distance) */}
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Autres pharmacies à proximité</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPharmacies.map((pharma) => {
          const coord = getCoordinates(pharma.pharmacieInfo.adresseGoogleMaps);
          const distance = position && coord
            ? calculateDistance(position.latitude, position.longitude, coord.latitude, coord.longitude).toFixed(2)
            : 'Inconnue';
          return (
            <div key={pharma._id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                {pharma.pharmacieInfo.photoPharmacie?.cheminFichier ? (
                  <img
                    src={`${API_URL}/api/images/pharmacies/${path.basename(pharma.pharmacieInfo.photoPharmacie.cheminFichier)}`}
                    alt={pharma.pharmacieInfo.nomPharmacie}
                    className="w-16 h-16 object-cover mr-4 rounded-lg"
                    onError={(e) => console.error(`❌ Échec chargement image:`, e)}
                  />
                ) : (
                  <div className="w-16 h-16 mr-4 flex items-center justify-center bg-gray-200 text-gray-600 rounded-lg">
                    Aucune photo
                  </div>
                )}
                <div>
                  <h2
                    className="text-lg font-bold mb-2 text-gray-800 cursor-pointer hover:underline"
                    onClick={() => navigate(`/pharmacies/${pharma._id}/profil`, { state: { pharmacyName: pharma.pharmacieInfo.nomPharmacie } })}
                  >
                    {pharma.pharmacieInfo.nomPharmacie || `${pharma.nom} ${pharma.prenom}`}
                  </h2>
                  <p className="text-gray-600">Distance: {distance} km</p>
                  <p className="text-gray-600">Adresse: {pharma.pharmacieInfo.adresseGoogleMaps || 'Non spécifiée'}</p>
                  <button
                    onClick={() => navigate(`/medicaments/${pharma._id}`, { state: { pharmacyName: pharma.pharmacieInfo.nomPharmacie } })}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Voir les médicaments
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}