import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

const API_URL = 'http://localhost:3001';

// 🔍 Fonction pour résoudre les URLs courtes Google Maps
async function resolveGoogleMapsUrl(shortUrl) {
  console.log('🔄 Résolution de l\'URL courte:', shortUrl);
  
  try {
    // Utiliser fetch avec mode 'no-cors' pour éviter les problèmes CORS
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(shortUrl)}`);
    const data = await response.json();
    
    if (data.contents) {
      // Chercher les coordonnées dans le contenu HTML
      const coords = extractCoordinatesFromHtml(data.contents);
      if (coords) {
        console.log('✅ Coordonnées extraites de l\'URL courte:', coords);
        return coords;
      }
    }
  } catch (error) {
    console.log('❌ Erreur lors de la résolution de l\'URL courte:', error);
  }
  
  // Fallback: essayer de suivre la redirection manuellement
  try {
    const proxyUrl = `https://cors-anywhere.herokuapp.com/${shortUrl}`;
    const response = await fetch(proxyUrl, { method: 'HEAD' });
    const finalUrl = response.url;
    console.log('🔄 URL finale après redirection:', finalUrl);
    return extractCoordinates(finalUrl);
  } catch (error) {
    console.log('❌ Fallback échoué:', error);
    return null;
  }
}

// 🔍 Fonction pour extraire les coordonnées du HTML
function extractCoordinatesFromHtml(html) {
  const patterns = [
    /"coords":\[([^,]+),([^,]+)\]/,
    /"center":\{"lat":([^,]+),"lng":([^}]+)\}/,
    /center=([^,]+),([^&]+)/,
    /@([^,]+),([^,]+),/
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const latitude = parseFloat(match[1]);
      const longitude = parseFloat(match[2]);
      
      if (!isNaN(latitude) && !isNaN(longitude) && 
          latitude >= -90 && latitude <= 90 && 
          longitude >= -180 && longitude <= 180) {
        return { latitude, longitude };
      }
    }
  }
  return null;
}

// 🔍 Fonction pour extraire les coordonnées de l'URL Google Maps
function extractCoordinates(url) {
  console.log('🔍 URL à analyser:', url);
  
  if (!url || typeof url !== 'string') {
    console.log('❌ URL invalide ou manquante');
    return null;
  }

  const cleanUrl = url.trim();
  console.log('🧹 URL nettoyée:', cleanUrl);

  // Patterns pour capturer différents formats d'URL Google Maps
  const patterns = [
    /maps\?q=([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)/,
    /maps\/place\/@([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)/,
    /maps\/@([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)/,
    /q=([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)/,
    /ll=([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)/,
    /center=([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)/,
    /([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/
  ];

  for (let i = 0; i < patterns.length; i++) {
    const match = cleanUrl.match(patterns[i]);
    if (match) {
      const latitude = parseFloat(match[1]);
      const longitude = parseFloat(match[2]);
      
      if (!isNaN(latitude) && !isNaN(longitude) && 
          latitude >= -90 && latitude <= 90 && 
          longitude >= -180 && longitude <= 180) {
        
        console.log('✅ Coordonnées extraites avec le pattern', i + 1, ':', { latitude, longitude });
        return { latitude, longitude };
      }
    }
  }
  
  console.log('❌ Aucun pattern ne correspond à l\'URL');
  return null;
}

// 🔍 Fonction principale pour obtenir les coordonnées
async function getCoordinates(url) {
  if (!url) return null;
  
  // Si c'est déjà une URL avec coordonnées
  if (url.includes('q=') || url.includes('@')) {
    return extractCoordinates(url);
  }
  
  // Si c'est une URL courte Google Maps
  if (url.includes('maps.app.goo.gl') || url.includes('goo.gl')) {
    return await resolveGoogleMapsUrl(url);
  }
  
  // Essayer l'extraction directe
  return extractCoordinates(url);
}

export default function PharmacyProfile() {
  const { pharmacyId } = useParams();
  const navigate = useNavigate();
  const { token, isLoading } = useAuth();
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState(null);
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [mapKey, setMapKey] = useState(0);

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
          
          // Extraire les coordonnées de l'adresse Google Maps
          const info = response.data.pharmacie.pharmacieInfo || {};
          if (info.adresseGoogleMaps) {
            setLoadingCoords(true);
            console.log('🔄 Extraction des coordonnées pour:', info.adresseGoogleMaps);
            
            try {
              const coordinates = await getCoordinates(info.adresseGoogleMaps);
              setCoords(coordinates);
              setMapKey(prev => prev + 1);
              console.log('📍 Coordonnées finales:', coordinates);
            } catch (error) {
              console.error('❌ Erreur lors de l\'extraction des coordonnées:', error);
            } finally {
              setLoadingCoords(false);
            }
          }
        } else {
          setError(response.data.message || 'Erreur lors du chargement du profil');
        }
      } catch (err) {
        console.error('❌ Erreur lors de la récupération de la pharmacie :', err);
        setError('Erreur serveur: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacy();
  }, [pharmacyId, token, isLoading]);

  if (loading) return <div className="p-6 text-lg text-gray-800">Chargement...</div>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!pharmacy) return <p className="p-6 text-gray-600">Pharmacie non trouvée.</p>;

  const info = pharmacy.pharmacieInfo || {};

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">
        {info.nomPharmacie || 'Pharmacie'}
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* 📷 Image */}
        {info.photoPharmacie?.cheminFichier ? (
          <img
            src={`${API_URL}/${info.photoPharmacie.cheminFichier.replace(/^\/+/, '')}`}
            alt={info.nomPharmacie}
            className="w-32 h-32 object-cover mb-4 rounded-lg"
            onError={(e) =>
              console.error(`❌ Échec du chargement de l'image: ${e.target.src}`, e)
            }
          />
        ) : (
          <div className="w-32 h-32 mb-4 flex items-center justify-center bg-gray-200 text-gray-600 rounded-lg">
            Aucune photo
          </div>
        )}

        {/* 📄 Infos */}
        <div className="space-y-2">
          <p className="text-gray-600">
            <strong>Adresse :</strong>{' '}
            {info.adresseGoogleMaps ? (
              <a
                href={info.adresseGoogleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                Voir sur Google Maps
              </a>
            ) : (
              'Non spécifiée'
            )}
          </p>
          <p className="text-gray-600">
            <strong>Téléphone :</strong> {info.telephone || pharmacy.telephone || 'Non spécifié'}
          </p>
          <p className="text-gray-600">
            <strong>Email :</strong> {pharmacy.email || 'Non spécifié'}
          </p>
          <p className="text-gray-600">
            <strong>Livraison :</strong> {info.livraisonDisponible ? 'Disponible' : 'Non disponible'}
          </p>
          <p className="text-gray-600">
            <strong>De garde :</strong> {info.estDeGarde ? 'Oui' : 'Non'}
          </p>
        </div>

        {/* 🕒 Heures d'ouverture */}
        {info.heuresOuverture && (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Heures d'ouverture</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(info.heuresOuverture).map(([day, hours]) => (
                <p key={day} className="text-gray-600">
                  <strong className="capitalize">{day} :</strong>{' '}
                  {hours.ouvert ? `${hours.debut} - ${hours.fin}` : 'Fermé'}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* 🗺️ Carte */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Localisation sur la carte</h2>
          
          {/* Affichage des informations de debug */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p><strong>URL Google Maps :</strong> {info.adresseGoogleMaps || 'Non définie'}</p>
            <p><strong>Coordonnées extraites :</strong> {coords ? `${coords.latitude}, ${coords.longitude}` : 'Aucune'}</p>
            {loadingCoords && <p className="text-blue-600">🔄 Extraction des coordonnées en cours...</p>}
          </div>

          {loadingCoords ? (
            <div className="h-80 w-full rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center text-gray-500">
                <div className="animate-spin text-4xl mb-2">🔄</div>
                <p className="font-medium">Chargement de la carte...</p>
                <p className="text-sm">Extraction des coordonnées GPS...</p>
              </div>
            </div>
          ) : coords ? (
            <div className="h-80 w-full rounded-lg overflow-hidden border-2 border-gray-200">
              <MapContainer
                key={mapKey}
                center={[coords.latitude, coords.longitude]}
                zoom={15}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
                className="rounded-lg"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[coords.latitude, coords.longitude]}>
                  <Popup>
                    <div className="text-center">
                      <strong>{info.nomPharmacie || 'Pharmacie'}</strong>
                      <br />
                      {info.telephone && <span>📞 {info.telephone}</span>}
                      <br />
                      {info.estDeGarde && <span className="text-green-600">🟢 De garde</span>}
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          ) : (
            <div className="h-80 w-full rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="font-medium">Carte non disponible</p>
                <p className="text-sm">Coordonnées GPS non trouvées</p>
                {info.adresseGoogleMaps && (
                  <p className="text-xs mt-2 break-all">URL: {info.adresseGoogleMaps}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 📦 Bouton */}
        <button
          onClick={() => navigate(`/medicaments/${pharmacyId}`)}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          Voir les médicaments
        </button>
      </div>
    </div>
  );
}