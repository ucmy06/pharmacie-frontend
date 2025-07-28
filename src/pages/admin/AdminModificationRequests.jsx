import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../utils/axiosConfig';

export default function AdminModificationRequests() {
  const { user, token, isLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestType, setRequestType] = useState('all');
  const [comment, setComment] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !token || !user || user.role !== 'admin') {
      if (!isLoading) {
        console.log('AdminModificationRequests: Accès non autorisé, redirection vers /login');
        setError('Veuillez vous connecter en tant qu\'admin.');
        navigate('/login');
      }
      return;
    }

    async function fetchRequests() {
      try {
        const res = await axiosInstance.get('/api/admin/modification-requests', {
          params: { type: requestType, statut: 'en_attente' }
        });
        console.log('AdminModificationRequests: Réponse fetchRequests:', res.data);
        if (res.data.success) {
          setRequests(res.data.data.requests || []);
        } else {
          setError(res.data.message || 'Erreur lors de la récupération des demandes');
        }
      } catch (err) {
        console.error('AdminModificationRequests: Erreur fetchRequests:', err);
        setError(err.response?.data?.message || 'Erreur lors de la récupération des demandes');
        if (err.response?.status === 403) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, [token, user, isLoading, navigate, requestType]);

  const handleAction = async (requestId, action, type) => {
    try {
      let endpoint;
      if (type === 'modification') {
        endpoint = `/api/admin/modification-requests/${requestId}/${action}`;
      } else if (type === 'suppression') {
        endpoint = `/api/admin/suppression-requests/${requestId}/${action}`;
      } else {
        throw new Error('Type de demande invalide');
      }

      const payload = action === 'reject' ? { commentaire: comment || 'Rejet sans commentaire' } : {};
      const res = await axiosInstance.post(endpoint, payload);
      alert(res.data.message || `Demande ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`);
      setComment('');
      const updatedRes = await axiosInstance.get('/api/admin/modification-requests', {
        params: { type: requestType, statut: 'en_attente' }
      });
      if (updatedRes.data.success) {
        setRequests(updatedRes.data.data.requests || []);
      }
    } catch (err) {
      console.error(`AdminModificationRequests: Erreur ${action} demande:`, err);
      setError(err.response?.data?.message || `Erreur lors de l'action ${action}`);
    }
  };

  if (loading || isLoading) return <p className="text-center">Chargement...</p>;

  if (!user || !token || user.role !== 'admin') {
    return (
      <div>
        Accès non autorisé.
        <button onClick={() => navigate('/login')} className="mt-2 text-blue-600 underline">
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Demandes de Pharmacies</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="mb-4">
        <label htmlFor="requestType" className="mr-2">Type de demande:</label>
        <select
          id="requestType"
          value={requestType}
          onChange={(e) => setRequestType(e.target.value)}
          className="border rounded p-2"
        >
          <option value="all">Toutes</option>
          <option value="modification">Modification</option>
          <option value="suppression">Suppression</option>
        </select>
      </div>
      {requests.length === 0 ? (
        <p>Aucune demande en attente.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 text-left">Pharmacie</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Détails</th>
                <th className="p-3 text-left">Photo</th>
                <th className="p-3 text-left">Statut</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const isModification = !!request.demandeModification;
                const details = isModification ? request.demandeModification : request.demandeSuppression;
                return (
                  <tr key={`${request._id}-${isModification ? 'mod' : 'sup'}`} className="border-t">
                    <td className="p-3">{request.nomPharmacie || 'N/A'}</td>
                    <td className="p-3">{isModification ? 'Modification' : 'Suppression'}</td>
                    <td className="p-3">
                      {isModification ? (
                        <div>
                          <p><strong>Nom:</strong> {request.demandeModification.nom || 'N/A'}</p>
                          <p><strong>Email:</strong> {request.demandeModification.email || 'N/A'}</p>
                          <p><strong>Téléphone:</strong> {request.demandeModification.numero || 'N/A'}</p>
                          <p><strong>Adresse:</strong> {request.demandeModification.positionGoogleMaps || 'N/A'}</p>
                        </div>
                      ) : (
                        <p>Demande de suppression de compte</p>
                      )}
                    </td>
                    <td className="p-3">
                      {isModification && request.demandeModification?.photo?.cheminFichier ? (
                        <img
                          src={`http://localhost:3001/Uploads/${request.demandeModification.photo.cheminFichier.replace(/^Uploads\/|uploads\//, '')}`}
                          alt={`Pharmacie ${request.nomPharmacie || 'inconnue'}`}
                          className="h-16 w-16 object-cover"
                          onError={(e) => console.error('Erreur chargement image:', {
                            url: e.target.src,
                            error: e,
                          })}
                        />
                      ) : (
                        'Aucune photo'
                      )}
                    </td>
                    <td className="p-3">{details.statut}</td>
                    <td className="p-3">{new Date(details.dateDemande).toLocaleDateString()}</td>
                    <td className="p-3 flex space-x-2">
                      {details.statut === 'en_attente' && (
                        <>
                          <button
                            onClick={() => handleAction(request._id, 'approve', isModification ? 'modification' : 'suppression')}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            Approuver
                          </button>
                          <div className="flex items-center">
                            <input
                              type="text"
                              placeholder="Commentaire de rejet"
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              className="border rounded p-1 mr-2"
                            />
                            <button
                              onClick={() => handleAction(request._id, 'reject', isModification ? 'modification' : 'suppression')}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                              disabled={!comment}
                            >
                              Rejeter
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <button
        onClick={() => navigate('/admin-dashboard')}
        className="bg-gray-600 text-white p-2 mt-4 w-full rounded hover:bg-gray-700"
      >
        Retour au tableau de bord
      </button>
    </div>
  );
}