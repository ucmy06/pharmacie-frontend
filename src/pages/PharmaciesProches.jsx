import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance en mètres
};

export default function PharmaciesProches() {
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState([]);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Veuillez vous connecter pour voir les pharmacies');
      setLoading(false);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        (err) => {
          console.error('❌ Erreur géolocalisation:', err);
          setError('Erreur lors de la récupération de votre position');
          setLoading(false);
        }
      );
    } else {
      setError('Géolocalisation non supportée par votre navigateur');
      setLoading(false);
    }

    axios.get(`${API_URL}/api/pharmacies`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        if (response.data.success) {
          setPharmacies(response.data.data.pharmacies);
        } else {
          setError(response.data.message || 'Erreur lors du chargement');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ Erreur chargement pharmacies:', err);
        setError('Erreur serveur: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      });
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchError('Veuillez entrer un nom de médicament');
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/medicaments/search`, {
        params: { nom: searchTerm },
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('🔍 [handleSearch] Réponse:', response.data);

      if (response.data.success) {
        const results = response.data.data.pharmacies
          .filter(pharma => pharma.medicaments.length > 0)
          .map(pharma => ({
            pharmacie: pharma.pharmacie,
            medicaments: pharma.medicaments
          }));
        setSearchResults(results);
      } else {
        setSearchError(response.data.message || 'Erreur lors de la recherche');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('❌ Erreur recherche médicaments:', err);
      setSearchError('Erreur serveur: ' + (err.response?.data?.message || err.message));
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const getCoordinates = (adresse) => {
    if (!adresse) return null;

    // Format 1: Google Maps URL avec q=lat,lng
    const matchGoogle = adresse.match(/q=([-.\d]+),([-.\d]+)/);
    if (matchGoogle) {
      return { latitude: parseFloat(matchGoogle[1]), longitude: parseFloat(matchGoogle[2]) };
    }

    // Format 2: Google Maps Embed iframe
    const matchEmbed = adresse.match(/!2d([-.\d]+)!3d([-.\d]+)/);
    if (matchEmbed) {
      return { latitude: parseFloat(matchEmbed[2]), longitude: parseFloat(matchEmbed[1]) };
    }

    // Format 3: URL raccourcie maps.app.goo.gl
    if (adresse.includes('maps.app.goo.gl')) {
      console.warn(`URL raccourcie non supportée: ${adresse}`);
      return null;
    }

    return null;
  };

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
    return <p className="p-6 text-red-600">{error}</p>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Pharmacies à proximité</h1>

      {/* Champ de recherche et bouton */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un médicament..."
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <button
          onClick={handleSearch}
          disabled={searchLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {searchLoading ? 'Recherche...' : 'Rechercher'}
        </button>
      </div>

      {/* Résultats de recherche */}
      {searchError && <p className="text-red-600 mb-4">{searchError}</p>}
      {searchResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Résultats de la recherche</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((result) => (
              result.medicaments.map((med) => (
                <div key={`${result.pharmacie.id}-${med._id}`} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center">
                    {med.images && med.images.length > 0 ? (
                      <img
                        src={`${API_URL}${med.images[0].cheminFichier}`}
                        alt={med.nom}
                        className="w-16 h-16 object-cover mr-4"
                      />
                    ) : (
                      <div className="w-16 h-16 mr-4 flex items-center justify-center bg-gray-200 text-gray-600">
                        Aucune image
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{med.nom}</h3>
                      {med.nom_generique && <p className="text-gray-600">Générique: {med.nom_generique}</p>}
                      <p className="text-gray-600">Pharmacie: {result.pharmacie.nom}</p>
                      <p className="text-gray-600">Prix: {med.prix} Francs</p>
                      <p className="text-gray-600">Stock: {med.quantite_stock}</p>
                      <button
                        onClick={() => navigate(`/medicaments/${result.pharmacie.id}`)}
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      >
                        Voir tous les médicaments de cette pharmacie
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ))}
          </div>
        </div>
      )}

      {/* Liste des pharmacies */}
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Pharmacies à proximité</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPharmacies.map((pharma) => {
          const coord = getCoordinates(pharma.pharmacieInfo.adresseGoogleMaps);
          const distance = position && coord
            ? (calculateDistance(position.latitude, position.longitude, coord.latitude, coord.longitude) / 1000).toFixed(2)
            : 'Inconnue';
          return (
            <div key={pharma._id} className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-bold mb-2 text-gray-800">{pharma.pharmacieInfo.nomPharmacie || `${pharma.nom} ${pharma.prenom}`}</h2>
              <p className="text-gray-600">Distance: {distance} km</p>
              <p className="text-gray-600">Adresse: {pharma.pharmacieInfo.adresseGoogleMaps || 'Non spécifiée'}</p>
              <button
                onClick={() => navigate(`/medicaments/${pharma._id}`)}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Voir les médicaments
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}