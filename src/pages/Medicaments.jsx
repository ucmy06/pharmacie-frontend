// src/components/Medicaments.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Medicaments = () => {
  const { pharmacyId } = useParams();
  const [medicaments, setMedicaments] = useState([]);
  const [filteredMedicaments, setFilteredMedicaments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const API_URL = 'http://localhost:3001';

  const addToCart = async (medicament) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/cart/add`,
        {
          medicamentId: medicament._id,
          pharmacyId: pharmacyId,
          quantity: 1,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      console.log('🔍 [addToCart] Réponse:', response.data);
      toast.success(response.data.message);
    } catch (error) {
      console.error('❌ [addToCart] Erreur:', error);
      if (error.response?.status === 404) {
        toast.error('Ressource non trouvée. Vérifiez l\'endpoint ou les données.');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Requête invalide.');
      } else {
        toast.error('Erreur lors de l\'ajout au panier');
      }
    }
  };

  useEffect(() => {
    const fetchMedicaments = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/medicaments/pharmacy/${pharmacyId}/medicaments`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('🔍 [fetchMedicaments] Réponse complète:', response.data);
        console.log(
          '🔍 [fetchMedicaments] Détails des médicaments:',
          response.data.data.medicaments.map((med) => ({
            nom: med.nom,
            images: med.images?.length ? med.images : 'Aucune image',
          }))
        );
        setMedicaments(response.data.data.medicaments);
        setFilteredMedicaments(response.data.data.medicaments);
        setLoading(false);
      } catch (error) {
        console.error('❌ [fetchMedicaments] Erreur:', error);
        toast.error('Erreur lors du chargement des médicaments');
        setLoading(false);
      }
    };
    fetchMedicaments();
  }, [pharmacyId]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = medicaments.filter((med) =>
        med.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (med.nom_generique && med.nom_generique.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredMedicaments(filtered);
    } else {
      setFilteredMedicaments(medicaments);
    }
  }, [searchTerm, medicaments]);

  if (loading) return <div>Chargement...</div>;
  if (!filteredMedicaments.length && !searchTerm) return <div>Aucun médicament trouvé</div>;

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />
      <h2 className="text-2xl font-bold mb-4">Médicaments disponibles</h2>
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un médicament..."
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>
      {filteredMedicaments.length === 0 && searchTerm && (
        <div className="text-red-600 mb-4">Aucun médicament trouvé pour "{searchTerm}"</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredMedicaments.map((med) => (
          <div key={med._id} className="border p-4 rounded-lg flex items-center">
            {med.images && med.images.length > 0 && med.images[0].nomFichier ? (
              <img
                src={`${API_URL}/api/images/medicaments/${med.images[0].nomFichier}`}
                alt={med.nom}
                className="w-16 h-16 object-cover mr-4"
                onError={(e) => {
                  console.error(
                    `❌ [Medicaments] Échec chargement image: ${API_URL}/api/images/medicaments/${med.images[0].nomFichier}`,
                    e
                  );
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 mr-4 flex items-center justify-center text-gray-600">
                Aucune image
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold">{med.nom}</h3>
              <p>Prix: {med.prix} FCFA</p>
              <p>Stock: {med.quantite_stock}</p>
              <p>{med.est_sur_ordonnance ? 'Sur ordonnance' : 'Sans ordonnance'}</p>
              <p>Catégorie: {med.categorie || 'Non spécifiée'}</p>
              <p>Forme: {med.forme || 'Non spécifiée'}</p>
              {med.date_peremption && (
                <p>Date de péremption: {new Date(med.date_peremption).toLocaleDateString()}</p>
              )}
              {med.dosage && <p>Dosage: {med.dosage}</p>}
              {med.code_barre && <p>Code barre: {med.code_barre}</p>}
              <button
                onClick={() => addToCart(med)}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={med.quantite_stock === 0}
              >
                Ajouter au panier
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Medicaments;