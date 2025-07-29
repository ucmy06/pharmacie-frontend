import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig'; // Utiliser axiosInstance
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:3001';

const categories = [
  'Analgésiques', 'Antibiotiques', 'Antipyrétiques', 'Anti-inflammatoires', 'Antihistaminiques', 'Antiviraux'
];
const forms = ['Comprimé', 'Gélule', 'Sirop', 'Injection', 'Crème', 'Pommade'];

export default function MedicamentsList() {
  const navigate = useNavigate();
  const [medicaments, setMedicaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    name: '',
    minPrice: '',
    maxPrice: '',
    category: '',
    form: '',
    availableOnly: false,
    sortByProximity: false,
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

    fetchMedicaments();
  }, []);

  const fetchMedicaments = async () => {
    try {
      const params = {
        ...filters,
        latitude: filters.sortByProximity && position ? position.latitude : undefined,
        longitude: filters.sortByProximity && position ? position.longitude : undefined,
        prescriptionOnly: filters.prescriptionOnly === '' ? undefined : filters.prescriptionOnly
      };

      console.log('🔍 [fetchMedicaments] Envoi requête avec params:', params);
      const response = await axiosInstance.get('/api/medicaments/list', { params });
      console.log('✅ [fetchMedicaments] Réponse complète:', JSON.stringify(response.data, null, 2));

      if (response.data.success) {
        setMedicaments(response.data.data);
        console.log('✅ [fetchMedicaments] Médicaments définis:', response.data.data.length);
      } else {
        setError(response.data.message || 'Erreur lors du chargement des médicaments');
        toast.error(response.data.message || 'Erreur lors du chargement des médicaments');
      }
    } catch (err) {
      console.error('❌ [fetchMedicaments] Erreur:', err);
      const errorMessage = err.response?.status === 404
        ? 'Aucun médicament ou pharmacie trouvé. Contactez l\'administrateur.'
        : 'Erreur serveur: ' + (err.response?.data?.message || err.message);
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
    setLoading(true);
    fetchMedicaments();
  };

  const addToCart = async (medicament) => {
    try {
      const response = await axiosInstance.post('/api/cart/add', {
        medicamentId: medicament._id,
        pharmacyId: medicament.pharmacyId,
        quantity: 1
      });

      console.log('✅ [addToCart] Réponse:', response.data);
      toast.success(response.data.message);
    } catch (error) {
      console.error('❌ [addToCart] Erreur:', error);
      const errorMessage = error.response?.status === 404
        ? 'Médicament ou pharmacie non trouvé.'
        : error.response?.data?.message || 'Erreur lors de l\'ajout au panier';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return <div className="p-6 text-lg text-gray-800">Chargement...</div>;
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
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Liste des Médicaments</h1>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Filtres</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Rechercher par nom</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Nom du médicament..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Prix minimum (FCFA)</label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              placeholder="Min"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Prix maximum (FCFA)</label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              placeholder="Max"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Catégorie</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Toutes</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Forme</label>
            <select
              name="form"
              value={filters.form}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Toutes</option>
              {forms.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Sur ordonnance</label>
            <select
              name="prescriptionOnly"
              value={filters.prescriptionOnly}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Tous</option>
              <option value="true">Sur ordonnance</option>
              <option value="false">Sans ordonnance</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="availableOnly"
              checked={filters.availableOnly}
              onChange={handleFilterChange}
              className="mr-2"
            />
            <label className="text-gray-700">En stock uniquement</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="sortByProximity"
              checked={filters.sortByProximity}
              onChange={handleFilterChange}
              className="mr-2"
            />
            <label className="text-gray-700">Trier par proximité</label>
          </div>
        </div>
        <button
          onClick={applyFilters}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Appliquer les filtres
        </button>
      </div>

      {medicaments.length === 0 ? (
        <p className="text-gray-600">Aucun médicament trouvé.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medicaments.map((med) => (
            <div key={`${med.pharmacyId}-${med._id}`} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                {med.images && med.images.length > 0 ? (
                  <img
                    src={`${API_URL}${med.images[0].cheminFichier}`}
                    alt={med.nom}
                    className="w-16 h-16 object-cover mr-4 rounded"
                    onError={(e) => console.error(`❌ [MedicamentsList] Échec chargement image: ${API_URL}${med.images[0].cheminFichier}`, e)}
                  />
                ) : (
                  <div className="w-16 h-16 mr-4 flex items-center justify-center bg-gray-200 text-gray-600 rounded">
                    Aucune image
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{med.nom}</h3>
                  {med.nom_generique && <p className="text-gray-600">Générique: {med.nom_generique}</p>}
                  <p className="text-gray-600">Pharmacie: {med.pharmacieInfo.nomPharmacie}</p>
                  <p className="text-gray-600">Prix: {med.prix} FCFA</p>
                  <p className="text-gray-600">Stock: {med.quantite_stock}</p>
                  <p className="text-gray-600">Catégorie: {med.categorie || 'Non spécifiée'}</p>
                  <p className="text-gray-600">Forme: {med.forme || 'Non spécifiée'}</p>
                  <p className="text-gray-600">{med.est_sur_ordonnance ? 'Sur ordonnance' : 'Sans ordonnance'}</p>
                  <button
                    onClick={() => addToCart(med)}
                    disabled={med.quantite_stock === 0}
                    className={`mt-2 px-4 py-2 rounded-lg ${
                      med.quantite_stock === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    Ajouter au panier
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