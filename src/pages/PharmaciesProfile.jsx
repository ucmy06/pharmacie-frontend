import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:3001';

// Fonction pour extraire les coordonnées
async function getCoordinates(url) {
  if (!url) {
    console.warn('⚠️ Aucune URL fournie pour getCoordinates');
    return null;
  }
  const patterns = [
    /q=([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)/,
    /@([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)/,
    /ll=([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)/,
    /center=([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)/,
    /([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/
  ];

  // Résolution des URLs courtes
  if (url.includes('maps.app.goo.gl')) {
    try {
      console.log('🔗 Résolution URL courte:', url);
      const response = await axios.head(url, { maxRedirects: 0, timeout: 5000 });
      const redirectUrl = response.headers.location || url;
      console.log('🔗 URL résolue:', redirectUrl);
      for (const pattern of patterns) {
        const match = redirectUrl.match(pattern);
        if (match) {
          const coords = { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
          console.log('📍 Coordonnées extraites:', coords);
          return coords;
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la résolution de l\'URL:', error.message);
      return null;
    }
  }

  // Parse direct
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const coords = { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
      console.log('📍 Coordonnées extraites directement:', coords);
      return coords;
    }
  }
  console.warn('⚠️ Aucune coordonnée trouvée pour l\'URL:', url);
  return null;
}

// Composant pour redimensionner la carte
function MapResizer({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      // Délai pour s'assurer que le DOM est prêt
      const timer = setTimeout(() => {
        map.invalidateSize();
        map.setView([coords.latitude, coords.longitude], 15);
        console.log('🗺️ Carte redimensionnée et centrée:', coords);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [coords, map]);
  return null;
}

// Fonction pour vérifier si ouverte maintenant
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

export default function PharmacyProfile() {
  const { pharmacyId } = useParams();
  const navigate = useNavigate();
  const { token, isLoading, user } = useAuth();
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState(null);
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading || !token) {
      setError('Veuillez vous connecter pour voir le profil');
      setLoading(false);
      return;
    }

    const fetchPharmacy = async () => {
      try {
        console.log('🔄 Récupération des données de la pharmacie:', pharmacyId);
        const response = await axios.get(`${API_URL}/api/pharmacies/${pharmacyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          console.log('✅ Données de la pharmacie récupérées:', response.data.pharmacie);
          setPharmacy(response.data.pharmacie);
          const info = response.data.pharmacie.pharmacieInfo || {};
          if (info.adresseGoogleMaps) {
            setLoadingCoords(true);
            console.log('🔄 Extraction des coordonnées pour:', info.adresseGoogleMaps);
            try {
              const coordinates = await getCoordinates(info.adresseGoogleMaps);
              setCoords(coordinates);
              console.log('📍 Coordonnées finales:', coordinates);
            } catch (error) {
              console.error('❌ Erreur lors de l\'extraction des coordonnées:', error);
              toast.warn('Impossible d\'extraire les coordonnées GPS');
            } finally {
              setLoadingCoords(false);
            }
          } else {
            console.warn('⚠️ Aucune adresse Google Maps fournie');
            setLoadingCoords(false);
          }
        } else {
          setError(response.data.message || 'Erreur lors du chargement du profil');
          toast.error(response.data.message || 'Erreur lors du chargement du profil');
        }
      } catch (err) {
        console.error('❌ Erreur lors de la récupération de la pharmacie:', err);
        setError('Erreur serveur: ' + (err.response?.data?.message || err.message));
        toast.error('Erreur serveur: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacy();
  }, [pharmacyId, token, isLoading]);

  const handleDemandeIntegration = async () => {
    if (!user || !token) {
      toast.error('Vous devez être connecté pour soumettre une demande');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/pharmacies/demande-integration`,
        { pharmacyId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Demande d\'intégration envoyée avec succès');
      } else {
        toast.error(response.data.message || 'Erreur lors de l\'envoi de la demande');
      }
    } catch (err) {
      console.error('❌ Erreur envoi demande intégration:', err);
      toast.error(err.response?.data?.message || 'Erreur serveur');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-xl text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-md mx-auto mt-20 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.175-5.5-2.971L4 12l2.5.029C7.71 10.175 9.66 9 12 9s4.29 1.175 5.5 2.971L20 12l-2.5.029c-.12 1.027-.537 1.971-1.172 2.672z" />
          </svg>
          <p className="text-gray-600 mt-4">Pharmacie non trouvée.</p>
        </div>
      </div>
    );
  }

  const info = pharmacy.pharmacieInfo || {};
  const isCurrentlyOpen = isOpenNow(info.heuresOuverture);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ToastContainer />
      
      {/* Header avec image de fond */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-blue-100 hover:text-white mb-6 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
          
          <div className="flex items-start space-x-6">
            {/* Photo de la pharmacie */}
            <div className="flex-shrink-0">
              {info.photoPharmacie?.cheminFichier ? (
                <img
                  src={`${API_URL}/${info.photoPharmacie.cheminFichier.replace(/^\/+/, '')}`}
                  alt={info.nomPharmacie}
                  className="w-32 h-32 object-cover rounded-xl shadow-lg border-4 border-white"
                  onError={(e) => console.error(`❌ Échec du chargement de l'image: ${e.target.src}`, e)}
                />
              ) : (
                <div className="w-32 h-32 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl shadow-lg border-4 border-white flex items-center justify-center">
                  <svg className="w-12 h-12 text-white opacity-70" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4">
                {info.nomPharmacie || 'Pharmacie'}
              </h1>
              
              {/* Badges de statut */}
              <div className="flex flex-wrap gap-3 mb-4">
                {info.estDeGarde && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Pharmacie de garde
                  </span>
                )}
                
                {isCurrentlyOpen ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    Ouverte maintenant
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-500 text-white">
                    <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                    Fermée
                  </span>
                )}
                
                {/* {info.livraisonDisponible && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500 text-white">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 004.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0015.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                    </svg>
                    Livraison disponible
                  </span>
                )} */}
              </div>

              {/* Informations de contact rapides */}
              <div className="flex flex-wrap gap-4 text-blue-100">
                {pharmacy.telephone && (
                  <a href={`tel:${pharmacy.telephone}`} className="flex items-center hover:text-white transition-colors duration-200">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    {pharmacy.telephone}
                  </a>
                )}
                
                {pharmacy.email && (
                  <a href={`mailto:${pharmacy.email}`} className="flex items-center hover:text-white transition-colors duration-200">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    {pharmacy.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Heures d'ouverture */}
            {info.heuresOuverture && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Heures d'ouverture
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(info.heuresOuverture).map(([day, hours]) => {
                    const isToday = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][new Date().getDay()] === day;
                    return (
                      <div key={day} className={`flex justify-between items-center p-3 rounded-lg ${isToday ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'}`}>
                        <span className={`font-medium capitalize ${isToday ? 'text-blue-800' : 'text-gray-700'}`}>
                          {day}
                          {isToday && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">Aujourd'hui</span>}
                        </span>
                        <span className={`${isToday ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
                          {hours.ouvert ? `${hours.debut} - ${hours.fin}` : 'Fermé'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Actions rapides
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate(`/medicaments/${pharmacyId}`)}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                    </svg>
                    Voir les médicaments
                  </div>
                </button>

                <button
                  onClick={handleDemandeIntegration}
                  disabled={submitting}
                  className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div className="flex items-center justify-center">
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        Demande d'intégration
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Informations de contact */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Informations
              </h3>
              
              <div className="space-y-4">
                {pharmacy.telephone && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Téléphone</p>
                      <a href={`tel:${pharmacy.telephone}`} className="text-sm text-blue-600 hover:text-blue-800">
                        {pharmacy.telephone}
                      </a>
                    </div>
                  </div>
                )}
                
                {pharmacy.email && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <a href={`mailto:${pharmacy.email}`} className="text-sm text-blue-600 hover:text-blue-800 break-all">
                        {pharmacy.email}
                      </a>
                    </div>
                  </div>
                )}

                {info.adresseGoogleMaps && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Adresse</p>
                      <a
                        href={info.adresseGoogleMaps}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Voir sur Google Maps
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Services
              </h3>
              
              <div className="space-y-3">
                <div className={`flex items-center p-3 rounded-lg ${info.estDeGarde ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Pharmacie de garde</span>
                  <span className="ml-auto text-xs">
                    {info.estDeGarde ? '✓' : '✗'}
                  </span>
                </div>
                
                <div className={`flex items-center p-3 rounded-lg ${info.livraisonDisponible ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-500'}`}>
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 004.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0015.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                  </svg>
                  {/* <span className="font-medium">Livraison à domicile</span>
                  <span className="ml-auto text-xs">
                    {info.livraisonDisponible ? '✓' : '✗'}
                  </span> */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carte - Section pleine largeur */}
        <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <svg className="w-6 h-6 mr-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Localisation
            </h2>
            
            {/* Informations de debug pour la carte */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-gray-700">URL Google Maps:</p>
                  <p className="text-gray-600 break-all">{info.adresseGoogleMaps || 'Non définie'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Coordonnées GPS:</p>
                  <p className="text-gray-600">
                    {coords ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}` : 'Non extraites'}
                  </p>
                </div>
              </div>
              {loadingCoords && (
                <div className="flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
                  <span>Extraction des coordonnées GPS en cours...</span>
                </div>
              )}
            </div>
          </div>

          <div className="relative h-96">
            {loadingCoords ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4 mx-auto"></div>
                  <p className="text-blue-700 font-medium">Chargement de la carte...</p>
                  <p className="text-blue-600 text-sm mt-1">Extraction des coordonnées GPS...</p>
                </div>
              </div>
            ) : coords ? (
              <MapContainer
                center={[coords.latitude, coords.longitude]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                className="rounded-b-xl"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[coords.latitude, coords.longitude]}>
                  <Popup className="custom-popup">
                    <div className="text-center p-2">
                      <h3 className="font-bold text-gray-800 mb-2">
                        {info.nomPharmacie || 'Pharmacie'}
                      </h3>
                      <div className="space-y-1 text-sm">
                        {pharmacy.telephone && (
                          <p className="flex items-center justify-center text-blue-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            {pharmacy.telephone}
                          </p>
                        )}
                        <div className="flex justify-center gap-2 mt-3">
                          {info.estDeGarde && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              De garde
                            </span>
                          )}
                          {isCurrentlyOpen && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Ouverte
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
                <MapResizer coords={coords} />
              </MapContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-b-xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Carte non disponible</h3>
                  <p className="text-gray-500 text-sm mb-2">Coordonnées GPS non trouvées</p>
                  {info.adresseGoogleMaps && (
                    <div className="mt-4">
                      <a
                        href={info.adresseGoogleMaps}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        Voir sur Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section d'actions en bas */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">Prêt à commander vos médicaments ?</h3>
            <p className="text-blue-100 mb-6">
              Découvrez tous les médicaments disponibles dans cette pharmacie et passez votre commande en ligne.
            </p>
            <button
              onClick={() => navigate(`/medicaments/${pharmacyId}`)}
              className="inline-flex items-center bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
              Consulter les médicaments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}