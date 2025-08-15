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
  const [selectedMedicament, setSelectedMedicament] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
    navigate(`/pharmacies/${medicament.pharmacyId}/profil`, { 
      state: { 
        pharmacyName: medicament.pharmacieInfo?.nomPharmacie || 'Pharmacie'
      } 
    });
  };

  // Fonctions pour la modal
  const openModal = (medicament) => {
    setSelectedMedicament(medicament);
    setCurrentImageIndex(0);
    setShowModal(true);
    document.body.style.overflow = 'hidden'; // Empêcher le scroll de la page
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMedicament(null);
    setCurrentImageIndex(0);
    document.body.style.overflow = 'unset'; // Restaurer le scroll
  };

  const nextImage = () => {
    if (selectedMedicament?.images) {
      setCurrentImageIndex((prev) => 
        prev === selectedMedicament.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedMedicament?.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedMedicament.images.length - 1 : prev - 1
      );
    }
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
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openModal(med)}
                      onError={(e) => {
                        console.error(`❌ [MedicamentsList] Échec chargement image: ${e.target.src}`);
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div 
                      className="w-20 h-20 flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg flex-shrink-0 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => openModal(med)}
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-lg font-bold text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => openModal(med)}
                    >
                      {med.nom}
                    </h3>
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
                    onClick={() => openModal(med)}
                    className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors text-sm"
                  >
                    Voir détails
                  </button>
                  
                  <button
                    onClick={() => addToCart(med)}
                    disabled={med.quantite_stock === 0}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      med.quantite_stock === 0 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {med.quantite_stock === 0 ? 'Rupture' : 'Ajouter'}
                  </button>
                  
                  <button
                    onClick={() => goToPharmacy(med)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                  >
                    Pharmacie
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de détails du médicament */}
      {showModal && selectedMedicament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header de la modal */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">{selectedMedicament.nom}</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Galerie d'images */}
                <div>
                  {selectedMedicament.images && selectedMedicament.images.length > 0 ? (
                    <div className="space-y-4">
                      {/* Image principale */}
                      <div className="relative">
                        <img
                          src={`${API_URL}/api/images/medicaments/${selectedMedicament.images[currentImageIndex].nomFichier || selectedMedicament.images[currentImageIndex].cheminFichier}`}
                          alt={selectedMedicament.nom}
                          className="w-full h-80 object-cover rounded-lg"
                          onError={(e) => {
                            console.error(`❌ [Modal] Échec chargement image: ${e.target.src}`);
                            e.target.src = '/api/placeholder/400/320';
                          }}
                        />
                        
                        {/* Navigation des images */}
                        {selectedMedicament.images.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>

                      {/* Miniatures */}
                      {selectedMedicament.images.length > 1 && (
                        <div className="flex space-x-2 overflow-x-auto">
                          {selectedMedicament.images.map((image, index) => (
                            <img
                              key={index}
                              src={`${API_URL}/api/images/medicaments/${image.nomFichier || image.cheminFichier}`}
                              alt={`${selectedMedicament.nom} ${index + 1}`}
                              className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 transition-all ${
                                index === currentImageIndex ? 'border-blue-500' : 'border-gray-300 hover:border-gray-400'
                              }`}
                              onClick={() => setCurrentImageIndex(index)}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-80 flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <p>Aucune image disponible</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Informations détaillées */}
                <div className="space-y-6">
                  {/* Prix et disponibilité */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{selectedMedicament.prix} FCFA</p>
                        <p className="text-sm text-gray-600">Prix unitaire</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${selectedMedicament.quantite_stock === 0 ? 'text-red-500' : 'text-green-600'}`}>
                          {selectedMedicament.quantite_stock === 0 ? 'Rupture de stock' : `${selectedMedicament.quantite_stock} en stock`}
                        </p>
                        <p className="text-sm text-gray-600">Disponibilité</p>
                      </div>
                    </div>
                  </div>

                  {/* Informations principales */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Informations du médicament</h3>
                    
                    {selectedMedicament.nom_generique && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Nom générique</p>
                        <p className="text-gray-900">{selectedMedicament.nom_generique}</p>
                      </div>
                    )}
                    
                    {selectedMedicament.categorie && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Catégorie</p>
                        <p className="text-gray-900">{selectedMedicament.categorie}</p>
                      </div>
                    )}
                    
                    {selectedMedicament.forme && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Forme pharmaceutique</p>
                        <p className="text-gray-900">{selectedMedicament.forme}</p>
                      </div>
                    )}
                    
                    {selectedMedicament.dosage && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Dosage</p>
                        <p className="text-gray-900">{selectedMedicament.dosage}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-gray-700">Type de prescription</p>
                      <p className={selectedMedicament.est_sur_ordonnance ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                        {selectedMedicament.est_sur_ordonnance ? '⚠️ Sur ordonnance uniquement' : '✅ Disponible sans ordonnance'}
                      </p>
                    </div>

                    {selectedMedicament.marque && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Marque</p>
                        <p className="text-gray-900">{selectedMedicament.marque}</p>
                      </div>
                    )}

                    {selectedMedicament.date_expiration && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Date d'expiration</p>
                        <p className="text-gray-900">{new Date(selectedMedicament.date_expiration).toLocaleDateString('fr-FR')}</p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {selectedMedicament.description && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedMedicament.description}</p>
                    </div>
                  )}

                  {/* Indications */}
                  {selectedMedicament.indications && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Indications</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedMedicament.indications}</p>
                    </div>
                  )}

                  {/* Contre-indications */}
                  {selectedMedicament.contre_indications && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">⚠️ Contre-indications</h3>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-800 leading-relaxed">{selectedMedicament.contre_indications}</p>
                      </div>
                    </div>
                  )}

                  {/* Effets secondaires */}
                  {selectedMedicament.effets_secondaires && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Effets secondaires possibles</h3>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-yellow-800 leading-relaxed">{selectedMedicament.effets_secondaires}</p>
                      </div>
                    </div>
                  )}

                  {/* Posologie */}
                  {selectedMedicament.posologie && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Posologie</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-800 leading-relaxed">{selectedMedicament.posologie}</p>
                      </div>
                    </div>
                  )}

                  {/* Informations sur la pharmacie */}
                  {selectedMedicament.pharmacieInfo && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">📍 Pharmacie</h3>
                      <p className="text-blue-600 font-medium">{selectedMedicament.pharmacieInfo.nomPharmacie}</p>
                      {selectedMedicament.pharmacieInfo.adresse && (
                        <p className="text-gray-600 text-sm mt-1">{selectedMedicament.pharmacieInfo.adresse}</p>
                      )}
                      {selectedMedicament.pharmacieInfo.telephone && (
                        <p className="text-gray-600 text-sm">📞 {selectedMedicament.pharmacieInfo.telephone}</p>
                      )}
                      {selectedMedicament.distance && (
                        <p className="text-gray-600 text-sm">📍 À {selectedMedicament.distance.toFixed(1)} km de vous</p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        addToCart(selectedMedicament);
                        closeModal();
                      }}
                      disabled={selectedMedicament.quantite_stock === 0}
                      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                        selectedMedicament.quantite_stock === 0 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {selectedMedicament.quantite_stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                    </button>
                    
                    <button
                      onClick={() => {
                        goToPharmacy(selectedMedicament);
                        closeModal();
                      }}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Voir la pharmacie
                    </button>
                  </div>

                  {/* Avertissement médical */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Avertissement médical</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>
                            Les informations présentées sont à titre indicatif uniquement. 
                            Consultez toujours un professionnel de santé avant de prendre un médicament. 
                            Ne modifiez jamais un traitement sans avis médical.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}