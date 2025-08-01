// C:\reactjs node mongodb\pharmacie-frontend\src\pages\demande\MaDemandePharmacie.jsx

import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import { useAuth } from '../../hooks/useAuth';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

export default function MaDemandePharmacie() {
  const { token } = useAuth();
  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDemande = async () => {
      try {
        const res = await axiosInstance.get('/api/client/ma-demande-pharmacie');
        console.log('📋 Réponse serveur:', res.data);
        setDemande(res.data.data);
      } catch (err) {
        console.error('❌ Erreur récupération demande:', err);
        setError(err.response?.data?.message || 'Erreur lors de la récupération de la demande');
      } finally {
        setLoading(false);
      }
    };

    fetchDemande();
  }, [token]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-pulse text-lg text-gray-600">Chargement de votre demande...</div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-md mx-4 mt-6">
        <p className="text-red-700 font-medium">{error}</p>
      </div>
    );

  if (!demande || demande.statutDemande === 'aucune') {
    return (
      <div className="max-w-xl mx-auto p-8 text-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl shadow-lg mt-10">
        <PhotoIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Aucune demande en cours</h2>
        <p className="text-gray-500">Vous n'avez pas encore soumis de demande de pharmacie.</p>
      </div>
    );
  }

  const statut = demande.statutDemande;
  const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const getStatusConfig = () => {
    switch (statut) {
      case 'approuvee':
        return { label: 'Approuvée', icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100' };
      case 'rejetee':
        return { label: 'Rejetée', icon: XCircleIcon, color: 'text-red-600', bg: 'bg-red-100' };
      case 'en_attente':
        return { label: 'En attente', icon: ClockIcon, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      default:
        return { label: 'Inconnu', icon: ClockIcon, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const { label: statutLabel, icon: StatutIcon, color, bg } = getStatusConfig();

  return (
    <div className="max-w-2xl mx-auto p-5 md:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
          Ma Demande de Pharmacie
        </h1>
        <p className="text-gray-500">Suivi en temps réel de votre demande</p>
      </div>

      {/* Status Card */}
      <div className={`flex items-center gap-3 p-4 rounded-xl ${bg} ${color} mb-6 shadow-md`}>
        <StatutIcon className="w-8 h-8" />
        <div>
          <p className="font-semibold text-lg">{statutLabel}</p>
          <p className="text-sm opacity-80">
            Demandée le {formatDate(demande.dateDemande)}
          </p>
        </div>
      </div>

      {/* Rejection Reason (if any) */}
      {statut === 'rejetee' && demande.motifRejet && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6 animate-fade-in">
          <h3 className="font-bold text-red-700 flex items-center gap-2">
            <XCircleIcon className="w-5 h-5" /> Motif du rejet
          </h3>
          <p className="text-red-600 mt-1">{demande.motifRejet}</p>
        </div>
      )}

      {/* Pharmacy Info */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-5 border-b pb-2">Informations de la pharmacie</h2>

        <div className="space-y-5">
          {/* Nom */}
          <div className="flex items-start gap-3">
            <span className="text-blue-600 mt-1">
              <PhotoIcon className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm text-gray-500">Nom de la pharmacie</p>
              <p className="font-medium text-gray-800">
                {demande.informationsPharmacie?.nomPharmacie || 'Non renseigné'}
              </p>
            </div>
          </div>

          {/* Adresse */}
          <div className="flex items-start gap-3">
            <span className="text-blue-600 mt-1">
              <MapPinIcon className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm text-gray-500">Adresse</p>
              {demande.informationsPharmacie?.adresseGoogleMaps ? (
                <a
                  href={demande.informationsPharmacie.adresseGoogleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                >
                  Voir sur Google Maps ↗
                </a>
              ) : (
                <p className="text-gray-500 italic">Non fournie</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <span className="text-blue-600 mt-1">
              <EnvelopeIcon className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-800">
                {demande.informationsPharmacie?.emailPharmacie || '—'}
              </p>
            </div>
          </div>

          {/* Téléphone */}
          <div className="flex items-start gap-3">
            <span className="text-blue-600 mt-1">
              <PhoneIcon className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm text-gray-500">Téléphone</p>
              <p className="font-medium text-gray-800">
                {demande.informationsPharmacie?.telephonePharmacie || '—'}
              </p>
            </div>
          </div>

          {/* Photo de la pharmacie */}
          {demande.informationsPharmacie?.photoPharmacie && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Photo de la pharmacie</p>
              <img
                src={`http://localhost:3001/${demande.informationsPharmacie.photoPharmacie.cheminFichier.replace(/\\/g, '/')}`}
                alt="Photo de la pharmacie"
                className="w-full max-h-64 object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
              />
            </div>
          )}

          {/* Documents de vérification */}
          {demande.informationsPharmacie?.documentsVerification?.length > 0 && (
            <div className="mt-5 pt-5 border-t">
              <p className="text-sm text-gray-500 mb-3">Documents joints</p>
              <ul className="space-y-2">
                {demande.informationsPharmacie.documentsVerification.map((doc, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <DocumentIcon className="w-4 h-4 text-gray-500" />
                    <a
                      href={`http://localhost:3001/${doc.cheminFichier.replace(/\\/g, '/')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {doc.nomFichier}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-gray-400 text-sm mt-8">
        Mise à jour : {formatDate(new Date())}
      </p>
    </div>
  );
}