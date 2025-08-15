import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../hooks/useAuth';
import axios from '../utils/axiosConfig';
import debounce from 'lodash.debounce';

const API_URL = 'http://localhost:3001';

// Fonction utilitaire pour formater le prix
const formatPrice = (price) => price.toFixed(2) + ' Francs';

export default function Panier() {
  const { user, token, isLoading } = useAuth();
  const navigate = useNavigate();
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState(null);
  const [itemLoading, setItemLoading] = useState({}); // État pour le chargement par élément
  const [pendingUpdates, setPendingUpdates] = useState({}); // États des mises à jour en attente
  const updateTimeouts = useState(new Map())[0]; // Références des timeouts
  const imageCache = new Map();

  // Charger les paniers et la géolocalisation
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
          console.error('Erreur géolocalisation:', err);
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
          console.log('Données panier:', response.data.data);
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
          console.warn(`Trop de requêtes, nouvelle tentative dans ${retryAfter}ms`);
          await new Promise((resolve) => setTimeout(resolve, retryAfter));
          return fetchCarts(retryCount + 1, maxRetries);
        }
        console.error('Erreur chargement panier:', err);
        setError('Erreur serveur: ' + (err.response?.data?.message || err.message));
        toast.error('Erreur serveur: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    };

    fetchCarts();
  }, [user, token, navigate, isLoading]);

  // Fonction pour passer une commande
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
      pharmacyId: cart.pharmacyId,
      medicaments: cart.medicaments.map((item) => ({
        medicamentId: item.medicamentId,
        quantite: item.quantite,
        prix: item.prixUnitaire,
      })),
      livraison,
      adresseLivraison: livraison && position ? { ...position, adresseTexte: 'Position actuelle' } : undefined,
    };

    console.log('Données envoyées:', commandeData);

    try {
      const response = await axios.post(`${API_URL}/api/client/commandes`, commandeData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        toast.success('Commande passée avec succès !');
        // Supprimer le panier après commande réussie
        await axios.delete(`${API_URL}/api/cart/clear`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { cartId: cart._id },
        });
        setCarts((prevCarts) => prevCarts.filter((c) => c._id !== cart._id));
      } else {
        toast.error(response.data.message || 'Erreur lors de la commande');
      }
    } catch (err) {
      if (err.response?.status === 429 && retryCount < maxRetries) {
        const retryAfter = err.response.headers['retry-after']
          ? parseInt(err.response.headers['retry-after'], 10) * 1000
          : 1000 * (retryCount + 1);
        console.warn(`Trop de requêtes, nouvelle tentative dans ${retryAfter}ms`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        return handlePasserCommande(cart, livraison, retryCount + 1, maxRetries);
      }
      console.error('Erreur création commande:', err);
      toast.error('Erreur serveur: ' + (err.response?.data?.message || err.message));
    }
  };

  // Fonction pour vider le panier
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
      console.error('Erreur vidage panier:', err);
      toast.error('Erreur serveur: ' + (err.response?.data?.message || err.message));
    }
  };

  // Fonction pour supprimer un article
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
      console.error('Erreur suppression médicament:', err);
      toast.error('Erreur serveur: ' + (err.response?.data?.message || err.message));
    }
  };

  // Fonction pour mettre à jour la quantité avec debounce intelligent
  const updateQuantityImmediate = (cartId, medicamentId, newQuantity, action) => {
    const itemKey = `${cartId}-${medicamentId}`;
    
    // Mise à jour immédiate de l'interface
    setCarts((prevCarts) =>
      prevCarts.map((cart) =>
        cart._id === cartId
          ? {
              ...cart,
              medicaments: cart.medicaments.map((item) =>
                item.medicamentId === medicamentId
                  ? { ...item, quantite: newQuantity }
                  : item
              ),
              total: cart.medicaments.reduce((sum, item) =>
                item.medicamentId === medicamentId
                  ? sum + newQuantity * item.prixUnitaire
                  : sum + item.quantite * item.prixUnitaire,
                0
              ),
            }
          : cart
      )
    );

    // Marquer comme en attente
    setPendingUpdates(prev => ({ ...prev, [itemKey]: true }));

    // Annuler le timeout précédent s'il existe
    if (updateTimeouts.has(itemKey)) {
      clearTimeout(updateTimeouts.get(itemKey));
    }

    // Créer un nouveau timeout
    const timeoutId = setTimeout(async () => {
      setItemLoading((prev) => ({ ...prev, [itemKey]: true }));
      
      try {
        const response = await axios.put(
          `${API_URL}/api/cart/update`,
          { cartId, medicamentId, quantity: newQuantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          toast.success(`Quantité ${action === 'increase' ? 'augmentée' : action === 'decrease' ? 'réduite' : 'mise à jour'}`);
          // La mise à jour de l'interface a déjà été faite, pas besoin de refaire
        } else {
          toast.error(response.data.message || 'Erreur lors de la mise à jour');
          // Restaurer l'ancienne valeur en cas d'erreur
          window.location.reload(); // Solution simple, ou vous pouvez restaurer la valeur précédente
        }
      } catch (err) {
        console.error('Erreur mise à jour quantité:', err);
        toast.error('Erreur serveur: ' + (err.response?.data?.message || err.message));
        // Restaurer l'ancienne valeur en cas d'erreur
        window.location.reload();
      } finally {
        setItemLoading((prev) => ({ ...prev, [itemKey]: false }));
        setPendingUpdates(prev => ({ ...prev, [itemKey]: false }));
        updateTimeouts.delete(itemKey);
      }
    }, 800); // Délai de 800ms

    updateTimeouts.set(itemKey, timeoutId);
  };

  // Fonction pour mettre à jour la quantité avec debounce (ancien système, gardé pour compatibilité)
  const updateQuantity = useCallback(
    debounce(async (cartId, medicamentId, quantity, action) => {
      if (!cartId || !medicamentId) {
        toast.error('ID du panier ou du médicament manquant');
        return;
      }

      if (quantity < 1) {
        handleRemoveItem(cartId, medicamentId);
        return;
      }

      setItemLoading((prev) => ({ ...prev, [`${cartId}-${medicamentId}`]: true }));

      console.log('Envoi requête:', {
        url: `${API_URL}/api/cart/update`,
        cartId,
        medicamentId,
        quantity,
      });

      try {
        const response = await axios.put(
          `${API_URL}/api/cart/update`,
          { cartId, medicamentId, quantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          toast.success(`Quantité ${action === 'increase' ? 'augmentée' : action === 'decrease' ? 'réduite' : 'mise à jour'}`);
          setCarts((prevCarts) =>
            prevCarts.map((cart) =>
              cart._id === cartId
                ? {
                    ...cart,
                    medicaments: cart.medicaments.map((item) =>
                      item.medicamentId === medicamentId
                        ? { ...item, quantite: quantity }
                        : item
                    ),
                    total: cart.medicaments.reduce((sum, item) =>
                      item.medicamentId === medicamentId
                        ? sum + quantity * item.prixUnitaire
                        : sum + item.quantite * item.prixUnitaire,
                      0
                    ),
                  }
                : cart
            )
          );
        } else {
          toast.error(response.data.message || 'Erreur lors de la mise à jour');
        }
      } catch (err) {
        console.error('Erreur:', err);
        toast.error('Erreur serveur: ' + (err.response?.data?.message || err.message));
      } finally {
        setItemLoading((prev) => ({ ...prev, [`${cartId}-${medicamentId}`]: false }));
      }
    }, 500), // Délai de 500ms
    [token]
  );

  // Handlers pour incrémenter/décrémenter avec mise à jour immédiate
  const handleIncreaseQuantity = (cartId, medicamentId, currentQuantity) => {
    if (currentQuantity >= 1) {
      updateQuantityImmediate(cartId, medicamentId, currentQuantity + 1, 'increase');
    }
  };

  const handleDecreaseQuantity = (cartId, medicamentId, currentQuantity) => {
    if (currentQuantity > 1) {
      updateQuantityImmediate(cartId, medicamentId, currentQuantity - 1, 'decrease');
    } else {
      // Si quantité = 1, supprimer l'élément
      handleRemoveItem(cartId, medicamentId);
    }
  };

  // Handler pour la saisie manuelle de la quantité
  const handleQuantityChange = (cartId, medicamentId, value) => {
    const quantity = parseInt(value, 10);
    if (isNaN(quantity) || quantity < 1) {
      toast.error('Veuillez entrer une quantité valide (minimum 1)');
      return;
    }
    updateQuantityImmediate(cartId, medicamentId, quantity, 'manual');
  };

  // Rendu du composant
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="text-lg font-medium text-slate-700">Chargement des paniers...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!carts || carts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <ToastContainer 
          position="top-right" 
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          className="z-50"
        />
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              Panier Vide
            </h1>
            <p className="text-slate-600 text-lg mb-8 max-w-md mx-auto">
              Votre panier est actuellement vide. Explorez nos pharmacies pour découvrir nos produits.
            </p>
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <button
                onClick={() => navigate('/commandes')}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Voir mes commandes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="z-50"
      />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center mb-4 sm:mb-0">
            <svg className="w-10 h-10 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Mes Paniers
          </h1>
          <button
            onClick={() => navigate('/commandes')}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Mes commandes</span>
          </button>
        </div>

        {/* Paniers */}
        <div className="space-y-8">
          {carts.map((cart, cartIndex) => (
            <div key={cart.pharmacyId} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              {/* Pharmacy Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {cart.pharmacieInfo?.nomPharmacie || 'Pharmacie Inconnue'}
                    </h2>
                    <p className="text-blue-100 mt-1">
                      {cart.medicaments?.length || 0} article{(cart.medicaments?.length || 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {cart.medicaments && cart.medicaments.length > 0 ? (
                  <>
                    {/* Liste des médicaments */}
                    <div className="space-y-6 mb-8">
                      {cart.medicaments.map((item, index) => (
                        <div key={index} className="group">
                          {item && item.nom && item.prixUnitaire && item.quantite ? (
                            <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-100 transition-all duration-300 hover:shadow-lg hover:border-blue-200">
                              <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                                {/* Image */}
                                <div className="flex-shrink-0">
                                  {item.image?.nomFichier ? (
                                    <img
                                      src={
                                        imageCache.get(item.image.nomFichier) ||
                                        `${API_URL}/Uploads/medicaments/${item.image.nomFichier}`
                                      }
                                      alt={item.nom}
                                      className="w-24 h-24 object-cover rounded-2xl shadow-md border-2 border-white group-hover:scale-105 transition-transform duration-300"
                                      onLoad={(e) => imageCache.set(item.image.nomFichier, e.target.src)}
                                      onError={(e) => {
                                        e.target.src = `${API_URL}/Uploads/medicaments/default.jpg`;
                                        imageCache.set(item.image.nomFichier, e.target.src);
                                      }}
                                    />
                                  ) : (
                                    <div className="w-24 h-24 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 rounded-2xl border-2 border-white shadow-md">
                                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>

                                {/* Détails du produit */}
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-gray-800 mb-2">{item.nom}</h3>
                                  
                                  {/* Prix */}
                                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 mb-4">
                                    <p className="text-lg font-semibold text-green-800">
                                      {formatPrice(item.prixUnitaire * item.quantite)}
                                      <span className="text-sm text-green-600 ml-2">
                                        ({formatPrice(item.prixUnitaire)} x {item.quantite})
                                      </span>
                                    </p>
                                  </div>

                                  {/* Contrôles de quantité */}
                                  <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center bg-white rounded-2xl border-2 border-gray-200 p-1">
                                      <button
                                        onClick={() => handleDecreaseQuantity(cart._id, item.medicamentId, item.quantite)}
                                        className={`w-10 h-10 text-white rounded-xl transition-all duration-200 flex items-center justify-center transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                                          pendingUpdates[`${cart._id}-${item.medicamentId}`] 
                                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                            : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                                        }`}
                                        disabled={!cart._id || !item.medicamentId}
                                      >
                                        {itemLoading[`${cart._id}-${item.medicamentId}`] ? (
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : pendingUpdates[`${cart._id}-${item.medicamentId}`] ? (
                                          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        ) : (
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                          </svg>
                                        )}
                                      </button>
                                      
                                      <input
                                        type="number"
                                        min="1"
                                        value={item.quantite}
                                        onChange={(e) => handleQuantityChange(cart._id, item.medicamentId, e.target.value)}
                                        className={`w-16 h-10 text-center font-semibold bg-transparent focus:outline-none ${
                                          pendingUpdates[`${cart._id}-${item.medicamentId}`] 
                                            ? 'text-orange-600' 
                                            : 'text-gray-800'
                                        }`}
                                        disabled={!cart._id || !item.medicamentId}
                                      />
                                      
                                      <button
                                        onClick={() => handleIncreaseQuantity(cart._id, item.medicamentId, item.quantite)}
                                        className={`w-10 h-10 text-white rounded-xl transition-all duration-200 flex items-center justify-center transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                                          pendingUpdates[`${cart._id}-${item.medicamentId}`] 
                                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                            : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                                        }`}
                                        disabled={!cart._id || !item.medicamentId}
                                      >
                                        {itemLoading[`${cart._id}-${item.medicamentId}`] ? (
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : pendingUpdates[`${cart._id}-${item.medicamentId}`] ? (
                                          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        ) : (
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                          </svg>
                                        )}
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => handleRemoveItem(cart._id, item.medicamentId)}
                                      className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50"
                                      disabled={!cart._id || !item.medicamentId}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      <span>Supprimer</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                              <p className="text-red-600 font-semibold">Médicament invalide</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Total et actions */}
                    <div className="border-t border-gray-200 pt-8">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-gray-700">Total du panier :</span>
                          <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            {formatPrice(cart.total || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Boutons d'action */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                          onClick={() => handlePasserCommande(cart, false)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!cart._id || cart.medicaments.length === 0}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>Récupérer en pharmacie</span>
                        </button>

                        <button
                          onClick={() => handlePasserCommande(cart, true)}
                          disabled={!cart.pharmacieInfo?.livraisonDisponible || !position || !cart._id}
                          className={`font-semibold px-6 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 ${
                            !cart.pharmacieInfo?.livraisonDisponible || !position || !cart._id
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
                          }`}
                        >
                          {/* <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span>Livraison à domicile</span> */}
                        </button>

                        <button
                          onClick={() => handleClearCart(cart._id)}
                          className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold px-6 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!cart._id}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Vider le panier</span>
                        </button>
                      </div>

                      {/* Messages d'information */}
                      {(!cart.pharmacieInfo?.livraisonDisponible || !position) && (
                        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                          <div className="flex items-start space-x-3">
                            <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-amber-800">
                              {!position && (
                                <p className="font-medium mb-1">Position non disponible</p>
                              )}
                              {!cart.pharmacieInfo?.livraisonDisponible && (
                                <p className="font-medium mb-1">Livraison non disponible</p>
                              )}
                              <p className="text-sm text-amber-700">
                                {!position 
                                  ? "Veuillez autoriser l'accès à votre position pour la livraison."
                                  : "Cette pharmacie ne propose pas de service de livraison."
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg">Aucun médicament dans ce panier</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}