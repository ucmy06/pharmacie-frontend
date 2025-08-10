// C:\reactjs node mongodb\pharmacie-frontend\src\pages\pharmacie\DemandeIntegrationList.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:3001';

export default function DemandeIntegrationList() {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('pharmacyToken');
    if (!token) {
      navigate('/pharmacie/connexion');
      return;
    }

    const fetchDemandes = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/pharmacies/demandes-integration`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setDemandes(response.data.data);
        } else {
          setError(response.data.message || 'Erreur lors du chargement des demandes');
        }
      } catch (err) {
        console.error('❌ Erreur récupération demandes:', err);
        setError(err.response?.data?.message || 'Erreur serveur');
      } finally {
        setLoading(false);
      }
    };

    fetchDemandes();
  }, [navigate]);

  const handleApprouver = async (demandeId, messageApprobation) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/pharmacies/valider-demande-integration`,
        { demandeId, statut: 'approuvee', messageApprobation },
        { headers: { Authorization: `Bearer ${localStorage.getItem('pharmacyToken')}` } }
      );

      if (response.data.success) {
        toast.success('Demande approuvée avec succès');
        setDemandes(demandes.filter(d => d._id !== demandeId));
      } else {
        toast.error(response.data.message || 'Erreur lors de l\'approbation');
      }
    } catch (err) {
      console.error('❌ Erreur approbation demande:', err);
      toast.error(err.response?.data?.message || 'Erreur serveur');
    }
  };

  const handleRejeter = async (demandeId, motifRejet) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/pharmacies/valider-demande-integration`,
        { demandeId, statut: 'rejetee', motifRejet },
        { headers: { Authorization: `Bearer ${localStorage.getItem('pharmacyToken')}` } }
      );

      if (response.data.success) {
        toast.success('Demande rejetée avec succès');
        setDemandes(demandes.filter(d => d._id !== demandeId));
      } else {
        toast.error(response.data.message || 'Erreur lors du rejet');
      }
    } catch (err) {
      console.error('❌ Erreur rejet demande:', err);
      toast.error(err.response?.data?.message || 'Erreur serveur');
    }
  };

  if (loading) return <div className="p-6 text-lg text-gray-800">Chargement...</div>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Demandes d'intégration</h1>
      <div className="bg-white rounded-lg shadow-lg p-6">
        {demandes.length === 0 ? (
          <p className="text-gray-600">Aucune demande d'intégration en attente.</p>
        ) : (
          <div className="space-y-4">
            {demandes.map((demande) => (
              <div key={demande._id} className="border p-4 rounded-lg">
                <p><strong>Nom :</strong> {demande.prenom} {demande.nom}</p>
                <p><strong>Email :</strong> {demande.email}</p>
                <p><strong>Téléphone :</strong> {demande.telephone}</p>
                <p><strong>Message :</strong> {demande.message || 'Aucun message'}</p>
                <p><strong>Date :</strong> {new Date(demande.dateDemande).toLocaleString()}</p>
                <div className="mt-4 flex gap-4">
                  <input
                    type="text"
                    placeholder="Mot de passe ou message pour l'employé"
                    onChange={(e) => demande.messageApprobation = e.target.value}
                    className="p-2 border rounded"
                  />
                  <button
                    onClick={() => handleApprouver(demande._id, demande.messageApprobation)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Approuver
                  </button>
                  <input
                    type="text"
                    placeholder="Motif du rejet"
                    onChange={(e) => demande.motifRejet = e.target.value}
                    className="p-2 border rounded"
                  />
                  <button
                    onClick={() => handleRejeter(demande._id, demande.motifRejet)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}