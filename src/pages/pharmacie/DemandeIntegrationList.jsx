import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../hooks/useAuth';

const API_URL = 'http://localhost:3001';

export default function DemandeIntegrationList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inputs, setInputs] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('pharmacyToken');
    if (!token || !user?.pharmaciesAssociees?.length) {
      navigate('/pharmacie/connexion');
      return;
    }

    const pharmacyId = user.pharmaciesAssociees[0].pharmacyId;

    const fetchDemandes = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/pharmacies/demandes-integration`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { pharmacyId },
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
  }, [navigate, user]);

  const handleInputChange = (demandeId, field, value) => {
    setInputs((prev) => ({
      ...prev,
      [demandeId]: {
        ...prev[demandeId],
        [field]: value,
      },
    }));
  };

  const handleApprouver = async (demandeId) => {
    const password = inputs[demandeId]?.password;
    if (!password) {
      toast.error('Veuillez entrer un mot de passe temporaire');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/pharmacies/valider-demande-integration`,
        { demandeId, statut: 'approuvee', password },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('pharmacyToken')}` },
          params: { pharmacyId: user.pharmaciesAssociees[0].pharmacyId },
        }
      );

      if (response.data.success) {
        toast.success('Demande approuvée avec succès');
        setDemandes(demandes.filter((d) => d._id !== demandeId));
        setInputs((prev) => {
          const { [demandeId]: _, ...rest } = prev;
          return rest;
        });
      } else {
        toast.error(response.data.message || 'Erreur lors de l\'approbation');
      }
    } catch (err) {
      console.error('❌ Erreur approbation demande:', err);
      toast.error(err.response?.data?.message || 'Erreur serveur');
    }
  };

  const handleRejeter = async (demandeId) => {
    const motifRejet = inputs[demandeId]?.motifRejet;
    if (!motifRejet) {
      toast.error('Veuillez entrer un motif de rejet');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/pharmacies/valider-demande-integration`,
        { demandeId, statut: 'rejetee', motifRejet },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('pharmacyToken')}` },
          params: { pharmacyId: user.pharmaciesAssociees[0].pharmacyId },
        }
      );

      if (response.data.success) {
        toast.success('Demande rejetée avec succès');
        setDemandes(demandes.filter((d) => d._id !== demandeId));
        setInputs((prev) => {
          const { [demandeId]: _, ...rest } = prev;
          return rest;
        });
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
                    type="password"
                    placeholder="Mot de passe temporaire pour l'employé"
                    value={inputs[demande._id]?.password || ''}
                    onChange={(e) => handleInputChange(demande._id, 'password', e.target.value)}
                    className="p-2 border rounded"
                  />
                  <button
                    onClick={() => handleApprouver(demande._id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                    disabled={!inputs[demande._id]?.password}
                  >
                    Approuver
                  </button>
                  <input
                    type="text"
                    placeholder="Motif du rejet"
                    value={inputs[demande._id]?.motifRejet || ''}
                    onChange={(e) => handleInputChange(demande._id, 'motifRejet', e.target.value)}
                    className="p-2 border rounded"
                  />
                  <button
                    onClick={() => handleRejeter(demande._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                    disabled={!inputs[demande._id]?.motifRejet}
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