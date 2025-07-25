import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

export default function PharmacyRequestsPage() {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) return;

      try {
        const response = await axios.get(
          'http://localhost:3001/api/admin/pharmacy-requests',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log('PharmacyRequestsPage: Réponse fetchRequests:', response.data);
        console.log('PharmacyRequestsPage: Requests reçus:', response.data.data?.requests || []);
        setRequests(response.data.data?.requests || []);
      } catch (error) {
        console.error('Erreur lors du chargement des demandes :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [token]);

  const handleUpdateRequest = async (userId, newStatut) => {
    try {
      let url = '';
      let data = {};

      if (newStatut === 'approuvee') {
        url = `http://localhost:3001/api/admin/pharmacy-requests/${userId}/approve`;
        data = { commentaire: 'Demande approuvée' };
      } else if (newStatut === 'rejetee') {
        const commentaire = prompt("Commentaire pour le rejet :");
        if (!commentaire) return alert("Commentaire requis !");
        url = `http://localhost:3001/api/admin/pharmacy-requests/${userId}/reject`;
        data = { commentaire };
      }

      // Utiliser POST au lieu de PUT
      await axios.post(url, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Mettre à jour l'état local
      setRequests((prev) =>
        prev.map((req) =>
          req._id === userId
            ? {
                ...req,
                demandePharmacie: {
                  ...req.demandePharmacie,
                  statutDemande: newStatut,
                },
              }
            : req
        )
      );

      alert(`Demande ${newStatut === 'approuvee' ? 'approuvée' : 'rejetée'} avec succès !`);
      
    } catch (error) {
      console.error('Erreur mise à jour du statut :', error);
      alert('Erreur lors de la mise à jour: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">📋 Demandes d'intégration de pharmacies</h1>
      {requests.length === 0 ? (
        <p>Aucune demande en attente.</p>
      ) : (
        <ul className="space-y-6">
          {requests.map((req) => {
            const info = req.demandePharmacie?.informationsPharmacie || {};
            const photo = info.photoPharmacie || null;
            const docs = info.documentsVerification || [];

            return (
              <li key={req._id} className="border rounded p-4 bg-white shadow">
                <p><strong>Pharmacie :</strong> {info.nomPharmacie || 'N/A'}</p>
                <p><strong>Email :</strong> {info.emailPharmacie || req.email}</p>
                <p><strong>Email utilisateur :</strong> {req.email}</p>
                <p><strong>Responsable :</strong> {req.prenom} {req.nom}</p>
                <p><strong>Téléphone utilisateur :</strong> {req.telephone}</p>
                <p><strong>Téléphone :</strong> {info.telephonePharmacie || req.telephone}</p>
                <p><strong>Adresse :</strong> {info.adresseGoogleMaps}</p>
                <p><strong>Statut de la demande :</strong> <span className="font-semibold">{req.demandePharmacie?.statutDemande || 'en attente'}</span></p>

                {photo && (
                  <div className="mt-3">
                    <strong>📸 Photo de la pharmacie :</strong><br />
                    <button
                      onClick={() => {
                        const cheminFichier = photo.cheminFichier?.replace(/\\/g, '/');
                        if (cheminFichier) {
                          window.open(`http://localhost:3001/${cheminFichier}`, '_blank');
                        }
                      }}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Consulter la photo
                    </button>
                  </div>
                )}

                {docs.length > 0 && (
                  <div className="mt-4">
                    <strong>📄 Documents justificatifs :</strong>
                    <ul className="list-disc list-inside mt-2">
                      {docs.map((doc, i) => {
                        const docPath = doc.cheminFichier?.replace(/\\/g, '/');
                        return (
                          <li key={i}>
                            <button
                              onClick={() => window.open(`http://localhost:3001/${docPath}`, '_blank')}
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              Consulter le document : {doc.nomFichier}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex gap-4">
                  <button
                    onClick={() => handleUpdateRequest(req._id, 'approuvee')}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    ✅ Valider
                  </button>
                  <button
                    onClick={() => handleUpdateRequest(req._id, 'rejetee')}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    ❌ Rejeter
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}