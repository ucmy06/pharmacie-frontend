import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from '../utils/axiosConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:3001';

export default function Panier() {
  const { user, token, isLoading } = useAuth();
  const navigate = useNavigate();
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState(null);

  const imageCache = new Map();

  useEffect(() => {
    if (isLoading) return;

    if (!user || !token) {
      navigate('/login');
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        (err) => {
          console.error('❌ [Geolocation] Erreur:', err);
          toast.error('Impossible de récupérer votre position');
        }
      );
    } else {
      toast.error('Géolocalisation non supportée par votre navigateur');
    }

    const fetchCarts = async (retryCount = 0, maxRetries = 3) => {
      try {
        const response = await axios.get(`${API_URL}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          console.log('✅ [fetchCarts] Données panier:', response.data.data);
          setCarts(response.data.data || []);
        } else {
          setError(response.data.message || 'Erreur lors du chargement du panier');
          toast.error(response.data.message || 'Erreur lors du chargement du panier');
        }
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 429 && retryCount < maxRetries) {
          const retryAfter = err.response.headers['retry-after']
            ? parseInt(err.response.headers['retry-after'], 10) * 1000
            : 1000 * (retryCount + 1);
          console.warn(`⚠️ [fetchCarts] 429 Trop de requêtes, nouvelle tentative dans ${retryAfter}ms`);
          await new Promise((resolve) => setTimeout(resolve, retryAfter));
          return fetchCarts(retryCount + 1, maxRetries);
        }
        console.error('❌ [fetchCarts] Erreur chargement panier:', err);
        setError('Erreur serveur: ' + (err.response?.data?.message || err.message));
        toast.error('Erreur serveur: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    };

    fetchCarts();
  }, [user, token, navigate, isLoading]);

  const handlePasserCommande = async (cart, livraison, retryCount = 0, maxRetries = 3) => {
    if (!cart || !cart.pharmacyId || !cart.medicaments || cart.medicaments.length === 0) {
      toast.error('Le panier est vide ou invalide');
      return;
    }

    if (!cart._id) {
      toast.error('ID du panier manquant');
      return;
    }

    const commandeData = {
      pharmacyId: cart.pharmacyId, // Changé de pharmacieId à pharmacyId
      medicaments: cart.medicaments.map((item) => ({
        medicamentId: item.medicamentId,
        quantite: item.quantite,
        prix: item.prixUnitaire, // Changé de prixUnitaire à prix
      })),
      livraison,
      adresseLivraison: livraison && position ? { ...position, adresseTexte: 'Position actuelle' } : undefined,
    };

    console.log('🔍 [handlePasserCommande] Données envoyées:', commandeData);

    try {
      const response = await axios.post(`${API_URL}/api/client/commandes`, commandeData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        toast.success('Commande passée avec succès !');
        setCarts((prevCarts) => prevCarts.filter((c) => c._id !== cart._id));
        navigate('/commandes');
      } else {
        toast.error(response.data.message || 'Erreur lors de la commande');
      }
    } catch (err) {
      if (err.response?.status === 429 && retryCount < maxRetries) {
        const retryAfter = err.response.headers['retry-after']
          ? parseInt(err.response.headers['retry-after'], 10) * 1000
          : 1000 * (retryCount + 1);
        console.warn(`⚠️ [handlePasserCommande] 429 Trop de requêtes, nouvelle tentative dans ${retryAfter}ms`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        return handlePasserCommande(cart, livraison, retryCount + 1, maxRetries);
      }
      console.error('❌ [handlePasserCommande] Erreur création commande:', err);
      toast.error('Erreur serveur: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleClearCart = async (cartId) => {
    if (!cartId) {
      toast.error('ID du panier manquant');
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/api/cart/clear`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { cartId },
      });
      if (response.data.success) {
        toast.success('Panier vidé avec succès');
        setCarts((prevCarts) => prevCarts.filter((cart) => cart._id !== cartId));
      } else {
        toast.error(response.data.message || 'Erreur lors du vidage du panier');
      }
    } catch (err) {
      console.error('❌ [handleClearCart] Erreur vidage panier:', err);
      toast.error('Erreur serveur: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRemoveItem = async (cartId, medicamentId) => {
    if (!cartId || !medicamentId) {
      toast.error('ID du panier ou du médicament manquant');
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/api/cart/remove`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { cartId, medicamentId },
      });
      if (response.data.success) {
        toast.success('Médicament supprimé du panier');
        setCarts((prevCarts) =>
          prevCarts
            .map((cart) =>
              cart._id === cartId
                ? {
                    ...cart,
                    medicaments: cart.medicaments.filter((item) => item.medicamentId !== medicamentId),
                    total: cart.medicaments
                      .filter((item) => item.medicamentId !== medicamentId)
                      .reduce((sum, item) => sum + item.prixUnitaire * item.quantite, 0),
                  }
                : cart
            )
            .filter((cart) => cart.medicaments.length > 0)
        );
      } else {
        toast.error(response.data.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('❌ [handleRemoveItem] Erreur suppression médicament:', err);
      toast.error('Erreur serveur: ' + (err.response?.data?.message || err.message));
    }
  };

  if (isLoading || loading) {
    return <div className="p-6 text-white">Chargement des paniers...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!carts || carts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <ToastContainer />
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-blue-700 mb-6">🛒 Panier</h1>
          <p className="text-gray-600">Votre panier est vide.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <ToastContainer />
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">🛒 Paniers</h1>
        {carts.map((cart, cartIndex) => (
          <div key={cart.pharmacyId} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Pharmacie : {cart.pharmacieInfo?.nomPharmacie || 'Inconnue'}
            </h2>
            {cart.medicaments && cart.medicaments.length > 0 ? (
              <div>
                <ul className="space-y-4">
                  {cart.medicaments.map((item, index) => (
                    <li key={index} className="flex items-center space-x-4">
                      {item && item.nom && item.prixUnitaire && item.quantite ? (
                        <>
                          {item.image?.nomFichier ? (
                            <img
                              src={
                                imageCache.get(item.image.nomFichier) ||
                                `${API_URL}/Uploads/medicaments/${item.image.nomFichier}`
                              }
                              alt={item.nom}
                              className="w-20 h-20 object-cover"
                              onLoad={(e) => imageCache.set(item.image.nomFichier, e.target.src)}
                              onError={(e) => {
                                e.target.src = `${API_URL}/Uploads/medicaments/default.jpg`;
                                imageCache.set(item.image.nomFichier, e.target.src);
                              }}
                            />
                          ) : (
                            <div className="w-20 h-20 flex items-center justify-center bg-gray-200 text-gray-600">
                              Aucune image
                            </div>
                          )}
                          <div>
                            <p className="font-bold">{item.nom}</p>
                            <p>Quantité : {item.quantite}</p>
                            <p>Prix : {(item.prixUnitaire * item.quantite).toFixed(2)} €</p>
                            <button
                              onClick={() => handleRemoveItem(cart._id, item.medicamentId)}
                              className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                              disabled={!cart._id || !item.medicamentId}
                            >
                              Supprimer
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-red-600">Médicament invalide</p>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <p className="text-lg font-bold">Total : {cart.total ? cart.total.toFixed(2) : '0.00'} €</p>
                  <div className="mt-4 flex gap-4">
                    <button
                      onClick={() => handlePasserCommande(cart, false)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      disabled={!cart._id || cart.medicaments.length === 0}
                    >
                      Récupérer en pharmacie
                    </button>
                    <button
                      onClick={() => handlePasserCommande(cart, true)}
                      disabled={!cart.pharmacieInfo?.livraisonDisponible || !position || !cart._id}
                      className={`px-4 py-2 rounded-lg ${
                        !cart.pharmacieInfo?.livraisonDisponible || !position || !cart._id
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      Commander avec livraison
                    </button>
                    <button
                      onClick={() => handleClearCart(cart._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                      disabled={!cart._id}
                    >
                      Vider le panier
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Aucun médicament dans ce panier.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}