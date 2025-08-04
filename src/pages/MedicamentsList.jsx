// C:\reactjs node mongodb\pharmacie-frontend\src\pages\MedicamentsList.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:3001';

export default function MedicamentsList() {
  const navigate = useNavigate();
  const [medicaments, setMedicaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [forms, setForms] = useState([]);
  const [filters, setFilters] = useState({
    name: '',
    minPrice: '',
    maxPrice: '',
    category: '',
    form: '',
    availableOnly: false,
    sortByProximity: false,
    sortByPrice: '',
    prescriptionOnly: ''
  });
  const [position, setPosition] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Veuillez vous connecter pour voir les médicaments');
      toast.error('Veuillez vous connecter pour voir les médicaments');
      navigate('/client/connexion');
      setLoading(false);
      return;
    }

    // Obtenir la géolocalisation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          console.log('✅ [MedicamentsList] Position obtenue:', { latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        (err) => {
          console.error('❌ [MedicamentsList] Erreur géolocalisation:', err);
          toast.warn('Impossible de récupérer votre position pour le tri par proximité');
        }
      );
    }

    // Charger les filtres et médicaments
    initializeData();
  }, [navigate]);

  // Fonction pour initialiser les données
  const initializeData = async () => {
    await Promise.all([fetchFilters(), fetchMedicaments()]);
  };

  // Charger les catégories et formes
  const fetchFilters = async () => {
    try {
      console.log('🔍 [fetchFilters] Début récupération filtres...');
      const response = await axiosInstance.get('/api/medicaments/filters');
      
      if (response.data && response.data.success) {
        setCategories(response.data.data.categories || []);
        setForms(response.data.data.forms || []);
        console.log('✅ [fetchFilters] Filtres récupérés:', response.data.data);
      } else {
        console.warn('⚠️ [fetchFilters] Réponse inattendue:', response.data);
        toast.warn('Aucun filtre disponible');
      }
    } catch (err) {
      console.error('❌ [fetchFilters] Erreur:', err);
      toast.error('Erreur lors du chargement des filtres');
    }
  };

  const fetchMedicaments = async () => {
    try {
      console.log('🔍 [fetchMedicaments] Début récupération médicaments...');
      
      // Préparer les paramètres
      const params = {};
      
      // Ajouter les filtres seulement s'ils ont des valeurs
      if (filters.name && filters.name.trim()) params.name = filters.name.trim();
      if (filters.minPrice && filters.minPrice.trim()) params.minPrice = filters.minPrice;
      if (filters.maxPrice && filters.maxPrice.trim()) params.maxPrice = filters.maxPrice;
      if (filters.category && filters.category.trim()) params.category = filters.category;
      if (filters.form && filters.form.trim()) params.form = filters.form;
      if (filters.availableOnly) params.availableOnly = 'true';
      if (filters.sortByPrice && filters.sortByPrice.trim()) params.sortByPrice = filters.sortByPrice;
      if (filters.prescriptionOnly && filters.prescriptionOnly.trim()) {
        params.prescriptionOnly = filters.prescriptionOnly;
      }
      
      // Ajouter la géolocalisation si demandée et disponible
      if (filters.sortByProximity && position) {
        params.sortByProximity = 'true';
        params.latitude = position.latitude;
        params.longitude = position.longitude;
      }

      console.log('🔍 [fetchMedicaments] Envoi requête avec params:', params);
      
      const response = await axiosInstance.get('/api/medicaments/list', { params });
      
      console.log('✅ [fetchMedicaments] Réponse reçue:', response.data);

      if (response.data && response.data.success) {
        const medicamentsData = response.data.data || [];
        setMedicaments(medicamentsData);
        console.log('✅ [fetchMedicaments] Médicaments définis:', medicamentsData.length);
        
        if (medicamentsData.length === 0) {
          toast.info('Aucun médicament trouvé avec ces critères');
        }
      } else {
        const errorMsg = response.data?.message || 'Erreur lors du chargement des médicaments';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('❌ [fetchMedicaments] Erreur:', err);
      
      let errorMessage = 'Erreur lors du chargement des médicaments';
      
      if (err.response) {
        // Erreur de réponse du serveur
        switch (err.response.status) {
          case 401:
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
            localStorage.removeItem('token');
            navigate('/client/connexion');
            return;
          case 404:
            errorMessage = 'Aucun médicament ou pharmacie trouvé.';
            break;
          case 500:
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
            break;
          default:
            errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        // Erreur de réseau
        errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const applyFilters = () => {
    console.log('🔍 [applyFilters] Application des filtres:', filters);
    setLoading(true);
    setError(null); // Reset l'erreur
    fetchMedicaments();
  };

  const resetFilters = () => {
    setFilters({
      name: '',
      minPrice: '',
      maxPrice: '',
      category: '',
      form: '',
      availableOnly: false,
      sortByProximity: false,
      sortByPrice: '',
      prescriptionOnly: ''
    });
    setLoading(true);
    setError(null);
    fetchMedicaments();
  };

  const addToCart = async (medicament) => {
    try {
      console.log('🛒 [addToCart] Ajout au panier:', medicament);
      
      const response = await axiosInstance.post('/api/cart/add', {
        medicamentId: medicament._id,
        pharmacyId: medicament.pharmacyId,
        quantity: 1
      });

      console.log('✅ [addToCart] Réponse:', response.data);
      toast.success(response.data.message || 'Produit ajouté au panier');
    } catch (error) {
      console.error('❌ [addToCart] Erreur:', error);
      
      let errorMessage = 'Erreur lors de l\'ajout au panier';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
            localStorage.removeItem('token');
            navigate('/client/connexion');
            return;
          case 404:
            errorMessage = 'Médicament ou pharmacie non trouvé.';
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const goToPharmacy = (medicament) => {
    console.log('🏪 [goToPharmacy] Navigation vers pharmacie:', medicament.pharmacyId);
    navigate(`/client/pharmacie/${medicament.pharmacyId}`, { 
      state: { 
        pharmacyName: medicament.pharmacieInfo?.nomPharmacie || 'Pharmacie'
      } 
    });
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg text-gray-800">Chargement des médicaments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <div className="mt-4">
                <button
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    fetchMedicaments();
                  }}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Liste des Médicaments</h1>
        <p className="text-gray-600">Trouvez et achetez vos médicaments dans les pharmacies proches</p>
      </div>

      {/* Filtres */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Filtres de recherche</h2>
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Réinitialiser
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Rechercher par nom</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Nom du médicament..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Prix minimum (FCFA)</label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              placeholder="Min"
              min="0"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Prix maximum (FCFA)</label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              placeholder="Max"
              min="0"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Trier par prix</label>
            <select
              name="sortByPrice"
              value={filters.sortByPrice}
              onChange={handleFilterChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Aucun tri</option>
              <option value="asc">Prix croissant</option>
              <option value="desc">Prix décroissant</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Catégorie</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Forme</label>
            <select
              name="form"
              value={filters.form}
              onChange={handleFilterChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les formes</option>
              {forms.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Prescription</label>
            <select
              name="prescriptionOnly"
              value={filters.prescriptionOnly}
              onChange={handleFilterChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous</option>
              <option value="true">Sur ordonnance</option>
              <option value="false">Sans ordonnance</option>
            </select>
          </div>
          
          <div className="flex flex-col space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="availableOnly"
                checked={filters.availableOnly}
                onChange={handleFilterChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-gray-700">En stock uniquement</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="sortByProximity"
                checked={filters.sortByProximity}
                onChange={handleFilterChange}
                disabled={!position}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label className={`ml-2 ${!position ? 'text-gray-400' : 'text-gray-700'}`}>
                Trier par proximité {!position && '(géolocalisation requise)'}
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex space-x-3">
          <button
            onClick={applyFilters}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Recherche...' : 'Appliquer les filtres'}
          </button>
        </div>
      </div>

      {/* Résultats */}
      <div className="mb-4">
        <p className="text-gray-600">
          {medicaments.length > 0 
            ? `${medicaments.length} médicament${medicaments.length > 1 ? 's' : ''} trouvé${medicaments.length > 1 ? 's' : ''}`
            : 'Aucun médicament trouvé'
          }
        </p>
      </div>

      {medicaments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun médicament trouvé</h3>
          <p className="text-gray-500 mb-4">Essayez de modifier vos critères de recherche ou de supprimer certains filtres.</p>
          <button
            onClick={resetFilters}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medicaments.map((med) => (
            <div key={`${med.pharmacyId}-${med._id}`} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {med.images && med.images.length > 0 ? (
                    <img
                      src={`${API_URL}/api/images/medicaments/${med.images[0].nomFichier || med.images[0].cheminFichier}`}
                      alt={med.nom}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        console.error(`❌ [MedicamentsList] Échec chargement image: ${e.target.src}`);
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg flex-shrink-0">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{med.nom}</h3>
                    {med.nom_generique && (
                      <p className="text-sm text-gray-500 mb-2">Générique: {med.nom_generique}</p>
                    )}
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="font-semibold text-blue-600">{med.prix} FCFA</p>
                      <p>Stock: <span className={med.quantite_stock === 0 ? 'text-red-500' : 'text-green-600'}>{med.quantite_stock}</span></p>
                      {med.categorie && <p>Catégorie: {med.categorie}</p>}
                      {med.forme && <p>Forme: {med.forme}</p>}
                      <p className={med.est_sur_ordonnance ? 'text-orange-600' : 'text-green-600'}>
                        {med.est_sur_ordonnance ? 'Sur ordonnance' : 'Sans ordonnance'}
                      </p>
                      {med.pharmacieInfo && (
                        <p className="text-blue-600 font-medium">📍 {med.pharmacieInfo.nomPharmacie}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => addToCart(med)}
                    disabled={med.quantite_stock === 0}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      med.quantite_stock === 0 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {med.quantite_stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                  </button>
                  
                  <button
                    onClick={() => goToPharmacy(med)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Voir pharmacie
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}