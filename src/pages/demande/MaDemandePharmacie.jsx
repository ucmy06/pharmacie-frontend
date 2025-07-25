import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

export default function MaDemandePharmacie() {
  const { token } = useAuth();
  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDemande = async () => {
      try {
        const res = await axios.get(
          'http://localhost:3001/api/demande-pharmacie/ma-demande',
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setDemande(res.data.data.demandePharmacie);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors de la récupération de la demande');
      } finally {
        setLoading(false);
      }
    };

    fetchDemande();
  }, [token]);

  if (loading) return <p>Chargement en cours...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!demande || demande.statutDemande === 'aucune')
    return <p>Aucune demande de pharmacie en cours.</p>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Statut de ma demande de pharmacie</h2>

      <div className="mb-4">
        <strong>Statut :</strong>{' '}
        <span
          className={
            demande.statutDemande === 'approuvee'
              ? 'text-green-600'
              : demande.statutDemande === 'rejetee'
              ? 'text-red-600'
              : 'text-yellow-600'
              
          }
        >
          {demande.statutDemande.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="mb-4">
        <strong>Date de la demande :</strong>{' '}
        {new Date(demande.dateDemande).toLocaleDateString()}
      </div>

      {demande.statutDemande === 'rejetee' && demande.motifRejet && (
        <div className="mb-4 text-red-700">
          <strong>Motif du rejet :</strong> {demande.motifRejet}
        </div>
      )}

      <div className="mb-4">
        <strong>Nom de la pharmacie :</strong> {demande.informationsPharmacie?.nomPharmacie || '-'}
      </div>
      <div className="mb-4">
        <strong>Adresse Google Maps :</strong>{' '}
        {demande.informationsPharmacie?.adresseGoogleMaps ? (
          <a
            href={demande.informationsPharmacie.adresseGoogleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Voir sur Google Maps
          </a>
        ) : (
          '-'
        )}
      </div>
      <div className="mb-4">
        <strong>Email :</strong> {demande.informationsPharmacie?.emailPharmacie || '-'}
      </div>
      <div className="mb-4">
        <strong>Téléphone :</strong> {demande.informationsPharmacie?.telephonePharmacie || '-'}
      </div>

      {demande.informationsPharmacie?.photoPharmacie && (
        <div className="mb-4">
          <strong>Photo de la pharmacie :</strong>
          <br />
          <img
            src={`http://localhost:3001/${demande.informationsPharmacie.photoPharmacie.replace(/\\/g, '/')}`}
            alt=""
            className="max-w-full h-auto rounded mt-2"
          />
        </div>
      )}

      {demande.informationsPharmacie?.documentsVerification?.length > 0 && (
        <div>
          <strong>Documents de vérification :</strong>
          <ul className="list-disc list-inside mt-2">
            {demande.informationsPharmacie.documentsVerification.map((doc, index) => (
              <li key={index}>
                <a
                  href={`http://localhost:3001/${doc.cheminFichier.replace(/\\/g, '/')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {doc.nomFichier}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
