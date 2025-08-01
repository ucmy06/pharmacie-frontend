// C:\reactjs node mongodb\pharmacie-frontend\src\pages\dashboards\CommandeDetails.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:3001';

export default function CommandeDetails() {
  const { user, token, isLoading } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [commande, setCommande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoading) return;

    if (!user || !token || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchCommande = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/client/commandes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setCommande(response.data.commande);
        } else {
          setError(response.data.message || 'Erreur lors du chargement de la commande');
          toast.error(response.data.message || 'Erreur lors du chargement de la commande');
        }
      } catch (err) {
        console.error('❌ Erreur chargement commande:', err);
        setError('Erreur serveur: ' + (err.response?.data?.message || err.message));
        toast.error('Erreur serveur: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchCommande();
  }, [user, token, id, navigate, isLoading]);

  if (isLoading || loading) {
    return <div className="p-6 text-white">Chargement des détails de la commande...</div>;
  }

  if (error || !commande) {
    return <div className="p-6 text-red-600">{error || 'Erreur lors du chargement des données.'}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <ToastContainer />
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">
          📋 Détails de la commande #{commande._id}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Informations générales</h2>
            <p><strong>Client :</strong> {commande.clientId.nom} {commande.clientId.prenom} ({commande.clientId.email})</p>
            <p><strong>Pharmacie :</strong> {commande.pharmacyId.pharmacieInfo.nomPharmacie}</p>
            <p><strong>Statut :</strong> {commande.statut}</p>
            <p><strong>Total :</strong> {commande.total} €</p>
            <p><strong>Livraison :</strong> {commande.livraison ? 'Oui' : 'Non'}</p>
            {commande.livraison && (
              <p><strong>Adresse de livraison :</strong> {commande.adresseLivraison}</p>
            )}
            <p><strong>Date :</strong> {new Date(commande.dateCommande).toLocaleString()}</p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Médicaments</h2>
            {commande.medicaments.length === 0 ? (
              <p className="text-gray-600">Aucun médicament.</p>
            ) : (
              <ul className="space-y-2">
                {commande.medicaments.map((item, index) => (
                  <li key={index} className="text-gray-800">
                    <p><strong>{item.nom}</strong></p>
                    <p>Quantité : {item.quantite}</p>
                    <p>Prix unitaire : {item.prixUnitaire} €</p>
                    {item.image && (
                      <img
                        src={`${API_URL}/Uploads/medicaments/${item.image}`}
                        alt={item.nom}
                        className="w-20 h-20 object-cover mt-2"
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/admin-dashboard')}
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
}