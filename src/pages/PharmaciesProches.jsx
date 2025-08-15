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
  
  // États pour les filtres
  const [filterType, setFilterType] = useState('all'); // 'all', 'garde', 'open', 'livraison'
  const [sortType, setSortType] = useState('distance'); // 'distance', 'name', 'recent'
  const [searchTerm, setSearchTerm] = useState('');

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

  // Fonction pour filtrer les pharmacies
  const getFilteredPharmacies = () => {
    let filtered = [...pharmacies];

    // Filtrage par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(pharma => 
        pharma.pharmacieInfo.nomPharmacie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pharma.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pharma.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pharma.pharmacieInfo.adresseGoogleMaps?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par type
    switch (filterType) {
      case 'garde':
        filtered = filtered.filter(pharma => pharma.pharmacieInfo.estDeGarde);
        break;
      case 'open':
        filtered = filtered.filter(pharma => isOpenNow(pharma.pharmacieInfo.heuresOuverture));
        break;
      // case 'livraison':
      //   filtered = filtered.filter(pharma => pharma.pharmacieInfo.livraisonDisponible);
      //   break;
      default:
        break;
    }

    // Tri
    switch (sortType) {
      case 'distance':
        if (position) {
          filtered.sort((a, b) => {
            const coordA = getCoordinates(a.pharmacieInfo.adresseGoogleMaps);
            const coordB = getCoordinates(b.pharmacieInfo.adresseGoogleMaps);
            if (!coordA || !coordB) return 0;
            const distA = calculateDistance(position.latitude, position.longitude, coordA.latitude, coordA.longitude);
            const distB = calculateDistance(position.latitude, position.longitude, coordB.latitude, coordB.longitude);
            return distA - distB;
          });
        }
        break;
      case 'name':
        filtered.sort((a, b) => {
          const nameA = a.pharmacieInfo.nomPharmacie || `${a.nom} ${a.prenom}`;
          const nameB = b.pharmacieInfo.nomPharmacie || `${b.nom} ${b.prenom}`;
          return nameA.localeCompare(nameB);
        });
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.pharmacieInfo.dateApprobation) - new Date(a.pharmacieInfo.dateApprobation));
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredPharmacies = getFilteredPharmacies();

  const PharmacyCard = ({ pharma, isGarde = false }) => {
    const coord = getCoordinates(pharma.pharmacieInfo.adresseGoogleMaps);
    const distance = position && coord
      ? calculateDistance(position.latitude, position.longitude, coord.latitude, coord.longitude).toFixed(2)
      : 'Inconnue';

    const isCurrentlyOpen = isOpenNow(pharma.pharmacieInfo.heuresOuverture);

    return (
      <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 ${isGarde ? 'border-l-4 border-green-500' : ''}`}>
        <div className="flex items-start space-x-4">
          {pharma.pharmacieInfo.photoPharmacie?.cheminFichier ? (
            <img
              src={`${API_URL}/api/images/pharmacies/${path.basename(pharma.pharmacieInfo.photoPharmacie.cheminFichier)}`}
              alt={pharma.pharmacieInfo.nomPharmacie}
              className="w-20 h-20 object-cover rounded-lg"
              onError={(e) => console.error(`❌ Échec chargement image:`, e)}
            />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 rounded-lg">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          
          <div className="flex-1">
            <h2
              className="text-xl font-bold mb-2 text-gray-800 cursor-pointer hover:text-blue-600 transition-colors duration-200"
              onClick={() => navigate(`/pharmacies/${pharma._id}/profil`, { state: { pharmacyName: pharma.pharmacieInfo.nomPharmacie } })}
            >
              {pharma.pharmacieInfo.nomPharmacie || `${pharma.nom} ${pharma.prenom}`}
            </h2>
            
            {/* Badges de statut */}
            <div className="flex flex-wrap gap-2 mb-3">
              {pharma.pharmacieInfo.estDeGarde && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  De garde
                </span>
              )}
              
              {isCurrentlyOpen && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Ouverte
                </span>
              )}
              
              {pharma.pharmacieInfo.livraisonDisponible && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                  </svg>
                  Livraison
                </span>
              )}
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <p className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Distance: <span className="font-medium ml-1">{distance} km</span>
              </p>
              
              {pharma.telephone && (
                <p className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {pharma.telephone}
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => navigate(`/medicaments/${pharma._id}`, { state: { pharmacyName: pharma.pharmacieInfo.nomPharmacie } })}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Voir les médicaments
              </button>
              <button
                onClick={() => navigate(`/pharmacies/${pharma._id}/profil`, { state: { pharmacyName: pharma.pharmacieInfo.nomPharmacie } })}
                className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Profil
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-600">Chargement des pharmacies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-gray-100">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Pharmacies à proximité</h1>
        <p className="text-gray-600">Trouvez facilement les pharmacies près de chez vous</p>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Barre de recherche */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher une pharmacie
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nom de pharmacie, adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filtre par type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les pharmacies</option>
              <option value="garde">Pharmacies de garde</option>
              <option value="open">Pharmacies ouvertes</option>
              {/* <option value="livraison">Avec livraison</option> */}
            </select>
          </div>

          {/* Tri */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trier par
            </label>
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="distance">Distance</option>
              <option value="name">Nom alphabétique</option>
              <option value="recent">Plus récentes</option>
            </select>
          </div>
        </div>

        {/* Statistiques */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>Total: {filteredPharmacies.length} pharmacies</span>
            <span>De garde: {filteredPharmacies.filter(p => p.pharmacieInfo.estDeGarde).length}</span>
            <span>Ouvertes: {filteredPharmacies.filter(p => isOpenNow(p.pharmacieInfo.heuresOuverture)).length}</span>
            {/* <span>Avec livraison: {filteredPharmacies.filter(p => p.pharmacieInfo.livraisonDisponible).length}</span> */}
          </div>
        </div>
      </div>

      {/* Pharmacies de garde ouvertes - Section spéciale */}
      {gardeOpenPharmacies.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="bg-green-500 rounded-full p-2 mr-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Pharmacies de garde ouvertes maintenant</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gardeOpenPharmacies.map((pharma) => (
              <PharmacyCard key={`garde-${pharma._id}`} pharma={pharma} isGarde={true} />
            ))}
          </div>
        </div>
      )}

      {/* Toutes les pharmacies filtrées */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {filterType === 'all' ? 'Toutes les pharmacies' : 
           filterType === 'garde' ? 'Pharmacies de garde' :
           filterType === 'open' ? 'Pharmacies ouvertes' :
           'Pharmacies avec livraison'}
        </h2>
        
        {filteredPharmacies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPharmacies.map((pharma) => (
              <PharmacyCard key={pharma._id} pharma={pharma} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.175-5.5-2.971L4 12l2.5.029C7.71 10.175 9.66 9 12 9s4.29 1.175 5.5 2.971L20 12l-2.5.029c-.12 1.027-.537 1.971-1.172 2.672z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune pharmacie trouvée</h3>
            <p className="mt-1 text-sm text-gray-500">Essayez de modifier vos filtres de recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}