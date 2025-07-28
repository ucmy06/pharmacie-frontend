import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function PharmacyRequestsPage() {
  const { user, token, isLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 [PharmacyRequestsPage] État auth:', { user, token: token ? token.slice(0, 10) + '...' : 'NULL', isLoading });
    const fetchRequests = async () => {
      setLoading(true);
      try {
        console.log('📋 [PharmacyRequestsPage] Récupération des demandes avec token:', token?.slice(0, 10) + '...');
        const response = await axiosInstance.get('/api/admin/pharmacy-requests', {
          params: { statut: 'en_attente', page: 1, limit: 10 },
        });
        console.log('✅ [PharmacyRequestsPage] Réponse brute:', JSON.stringify(response.data, null, 2));
        if (!response.data.success) {
          throw new Error(response.data.message || 'Échec de la récupération des demandes');
        }
        const requestsData = Array.isArray(response.data.data) ? response.data.data : response.data.data?.requests || [];
        console.log('✅ [PharmacyRequestsPage] Demandes extraites:', requestsData);
        setRequests(requestsData);
      } catch (err) {
        console.error('❌ [PharmacyRequestsPage] Erreur lors du chargement des demandes:', err);
        setError(err.message || 'Erreur lors du chargement des demandes');
      } finally {
        setLoading(false);
      }
    };
    if (token && user?.role === 'admin' && !isLoading) {
      fetchRequests();
    } else {
      console.warn('⚠️ [PharmacyRequestsPage] Accès bloqué:', { user, token, isLoading });
    }
  }, [token, user, isLoading]);

  const handleAction = async (requestId, action) => {
    setLoading(true);
    try {
      console.log(`🔄 [PharmacyRequestsPage] Action ${action} pour demande:`, requestId);
      const response = await axiosInstance.post(`/api/admin/pharmacy-requests/${requestId}/${action}`, {
        commentaire: action === 'approve' ? 'Demande approuvée' : 'Demande rejetée - Veuillez vérifier les informations fournies.',
      });
      console.log(`✅ [PharmacyRequestsPage] Demande ${action}:`, response.data);
      setRequests((prev) => prev.filter((req) => req._id !== requestId));
    } catch (err) {
      console.error(`❌ [PharmacyRequestsPage] Erreur action ${action}:`, err);
      setError(err.response?.data?.message || `Erreur lors de l'action ${action}`);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    console.log('⏳ [PharmacyRequestsPage] Chargement en cours...');
    return <div>Chargement des données...</div>;
  }

  if (!user || !token || user.role !== 'admin') {
    console.error('🚫 [PharmacyRequestsPage] Accès non autorisé:', {
      hasUser: !!user,
      hasToken: !!token,
      role: user?.role,
    });
    return (
      <div>
        Accès non autorisé.
        <button
          onClick={() => navigate('/login')}
          className="mt-2 text-blue-600 underline"
        >
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-green-700 mb-4">
          📋 Gérer les demandes de pharmacies
        </h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        {loading && <p className="text-gray-600 mb-4">Chargement en cours...</p>}

        <ul className="space-y-4">
          {requests.length > 0 ? (
            requests.map((request) => (
              <li key={request._id} className="p-4 border rounded">
                <p><strong>Utilisateur :</strong> {request.prenom} {request.nom}</p>
                <p><strong>Email utilisateur :</strong> {request.email}</p>
                <p><strong>Téléphone utilisateur :</strong> {request.telephone}</p>
                <p><strong>Pharmacie :</strong> {request.informationsPharmacie?.nomPharmacie || 'N/A'}</p>
                <p><strong>Adresse :</strong> {request.informationsPharmacie?.adresseGoogleMaps ? (
                  <a
                    href={request.informationsPharmacie.adresseGoogleMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Voir sur Google Maps
                  </a>
                ) : 'N/A'}</p>
                <p><strong>Email pharmacie :</strong> {request.informationsPharmacie?.emailPharmacie || 'N/A'}</p>
                <p><strong>Téléphone pharmacie :</strong> {request.informationsPharmacie?.telephonePharmacie || 'N/A'}</p>
                <p><strong>Statut :</strong> {request.statutDemande.replace('_', ' ').toUpperCase()}</p>
                <p><strong>Date :</strong> {request.dateDemande ? new Date(request.dateDemande).toLocaleDateString() : 'N/A'}</p>
                {request.informationsPharmacie?.photoPharmacie?.cheminFichier && (
                  <div className="mb-4">
                    <strong>Photo de la pharmacie :</strong>
                    <br />
                    <img
                      src={`http://localhost:3001/${request.informationsPharmacie.photoPharmacie.cheminFichier.replace(/\\/g, '/')}`}
                      alt="Photo de la pharmacie"
                      className="max-w-full h-auto rounded mt-2"
                    />
                    <p>
                      <a
                        href={`http://localhost:3001/${request.informationsPharmacie.photoPharmacie.cheminFichier.replace(/\\/g, '/')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Télécharger la photo
                      </a>
                    </p>
                  </div>
                )}
                {request.informationsPharmacie?.documentsVerification?.length > 0 && (
                  <div className="mb-4">
                    <strong>Documents de vérification :</strong>
                    <ul className="list-disc list-inside mt-2">
                      {request.informationsPharmacie.documentsVerification.map((doc, index) => (
                        <li key={index}>
                          <a
                            href={`http://localhost:3001/${doc.cheminFichier.replace(/\\/g, '/')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            {doc.nomFichier}
                          </a>
                          {(doc.nomFichier.endsWith('.png') || doc.nomFichier.endsWith('.jpg') || doc.nomFichier.endsWith('.jpeg')) && (
                            <div className="mt-2">
                              <img
                                src={`http://localhost:3001/${doc.cheminFichier.replace(/\\/g, '/')}`}
                                alt={doc.nomFichier}
                                className="max-w-full h-auto rounded"
                              />
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleAction(request._id, 'approve')}
                    disabled={loading}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => handleAction(request._id, 'reject')}
                    disabled={loading}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Rejeter
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li>Aucune demande en attente.</li>
          )}
        </ul>

        <button
          onClick={() => navigate('/admin-dashboard')}
          className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
}