// C:\reactjs node mongodb\pharmacie-frontend\src\pages\Panier.jsx

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

export default function Panier() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [paniers, setPaniers] = useState({}); // { pharmacieId: { medicaments: [], total: 0, pharmacieInfo: {} } }
  const [error, setError] = useState(null);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    // Charger la position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        (err) => {
          console.error('❌ Erreur géolocalisation:', err);
          setError('Impossible de récupérer votre position');
        }
      );
    }

    // Ajouter l'article du state (si redirection depuis Medicaments.jsx)
    if (state && state.medicament && state.pharmacieId) {
      addToPanier(state.pharmacieId, state.medicament);
    }
  }, [state]);

  const addToPanier = async (pharmacieId, medicament) => {
    try {
      // Récupérer les infos de la pharmacie
      const res = await axios.get(`${API_URL}/api/pharmacies/${pharmacieId}`);
      if (!res.data.success) {
        setError('Erreur lors de la récupération de la pharmacie');
        return;
      }

      const pharmacieInfo = res.data.pharmacie.pharmacieInfo;

      setPaniers((prev) => {
        const panier = prev[pharmacieId] || { medicaments: [], total: 0, pharmacieInfo };
        const existing = panier.medicaments.find(m => m.medicamentId === medicament._id);
        if (existing) {
          existing.quantite += 1;
          panier.total += medicament.prix;
        } else {
          panier.medicaments.push({
            medicamentId: medicament._id,
            nom: medicament.nom,
            quantite: 1,
            prixUnitaire: medicament.prix
          });
          panier.total += medicament.prix;
        }

        return { ...prev, [pharmacieId]: panier };
      });
    } catch (err) {
      console.error('❌ Erreur ajout panier:', err);
      setError('Erreur serveur');
    }
  };

  const handleCommander = async (pharmacieId, livraison) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        navigate('/client/connexion');
        return;
      }

      const panier = paniers[pharmacieId];
      if (!panier || panier.medicaments.length === 0) {
        setError('Panier vide');
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/client/commandes`,
        {
          pharmacieId,
          medicaments: panier.medicaments,
          livraison,
          adresseLivraison: livraison && position ? { ...position, adresseTexte: 'Position actuelle' } : undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPaniers((prev) => {
          const newPaniers = { ...prev };
          delete newPaniers[pharmacieId];
          return newPaniers;
        });
        alert('Commande passée avec succès !');
      } else {
        setError(response.data.message || 'Erreur lors de la commande');
      }
    } catch (err) {
      console.error('❌ Erreur commande:', err);
      setError('Erreur serveur');
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Votre Panier</h1>
      {error && <p className="text-red-600 mb-6">{error}</p>}
      {Object.keys(paniers).length === 0 ? (
        <p className="text-gray-600">Votre panier est vide.</p>
      ) : (
        Object.entries(paniers).map(([pharmacieId, { medicaments, total, pharmacieInfo }]) => (
          <div key={pharmacieId} className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800">{pharmacieInfo.nomPharmacie || 'Pharmacie'}</h2>
            <div className="space-y-2">
              {medicaments.map((item) => (
                <div key={item.medicamentId} className="flex justify-between">
                  <p>{item.nom} (x{item.quantite})</p>
                  <p>{item.quantite * item.prixUnitaire} FCFA</p>
                </div>
              ))}
              <p className="font-bold">Total: {total} FCFA</p>
            </div>
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => handleCommander(pharmacieId, false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Récupérer en pharmacie
              </button>
              <button
                disabled={!pharmacieInfo.livraisonDisponible || !position}
                onClick={() => handleCommander(pharmacieId, true)}
                className={`px-4 py-2 rounded-lg ${
                  !pharmacieInfo.livraisonDisponible || !position ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Commander avec livraison
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}