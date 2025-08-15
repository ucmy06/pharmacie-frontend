import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function PharmacyProfile() {
  const [pharmacie, setPharmacie] = useState(null);
  const [modifiableFields, setModifiableFields] = useState({
    heuresOuverture: {
      lundi: { ouvert: false, debut: '', fin: '' },
      mardi: { ouvert: false, debut: '', fin: '' },
      mercredi: { ouvert: false, debut: '', fin: '' },
      jeudi: { ouvert: false, debut: '', fin: '' },
      vendredi: { ouvert: false, debut: '', fin: '' },
      samedi: { ouvert: false, debut: '', fin: '' },
      dimanche: { ouvert: false, debut: '', fin: '' }
    },
    // livraisonDisponible: false,
    periodeGarde: { debut: '', fin: '' }
  });
  const [demandeModification, setDemandeModification] = useState({
    nom: '',
    email: '',
    numero: '',
    positionGoogleMaps: '',
    photo: null
  });
  const [passwordFields, setPasswordFields] = useState({
    ancienMotDePasse: '',
    nouveauMotDePasse: '',
    confirmNouveauMotDePasse: ''
  });
  const [error, setError] = useState('');
  const token = localStorage.getItem('pharmacyToken');
  const navigate = useNavigate();

  // Fonction pour formater une date ISO en yyyy-MM-dd
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // Retourne yyyy-MM-dd
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get('http://localhost:3001/api/pharmacies/mon-profil', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Réponse API:', res.data);
        if (res.data.success && res.data.pharmacie) {
          setPharmacie(res.data.pharmacie);
          setModifiableFields({
            heuresOuverture: res.data.pharmacie.pharmacieInfo?.heuresOuverture || modifiableFields.heuresOuverture,
            livraisonDisponible: res.data.pharmacie.pharmacieInfo?.livraisonDisponible || false,
            periodeGarde: {
              debut: formatDateForInput(res.data.pharmacie.pharmacieInfo?.periodeGarde?.debut),
              fin: formatDateForInput(res.data.pharmacie.pharmacieInfo?.periodeGarde?.fin)
            }
          });
        } else {
          setError('Structure de réponse inattendue');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement du profil');
      }
    }
    if (token) fetchData();
    else navigate('/pharmacie/connexion');
  }, [token, navigate]);

  const handleDirectChange = async () => {
    try {
      await axios.put(
        'http://localhost:3001/api/pharmacies/horaires',
        { heuresOuverture: modifiableFields.heuresOuverture },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await axios.put(
        'http://localhost:3001/api/pharmacies/garde',
        { 
          estDeGarde: !!modifiableFields.periodeGarde.debut, 
          periodeGarde: {
            debut: modifiableFields.periodeGarde.debut ? new Date(modifiableFields.periodeGarde.debut) : null,
            fin: modifiableFields.periodeGarde.fin ? new Date(modifiableFields.periodeGarde.fin) : null
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await axios.put(
        'http://localhost:3001/api/pharmacies/livraison',
        { livraisonDisponible: modifiableFields.livraisonDisponible },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedProfile = await axios.get('http://localhost:3001/api/pharmacies/mon-profil', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (updatedProfile.data.success && updatedProfile.data.pharmacie) {
        setPharmacie(updatedProfile.data.pharmacie);
        setModifiableFields({
          heuresOuverture: updatedProfile.data.pharmacie.pharmacieInfo?.heuresOuverture || modifiableFields.heuresOuverture,
          livraisonDisponible: updatedProfile.data.pharmacie.pharmacieInfo?.livraisonDisponible || false,
          periodeGarde: {
            debut: formatDateForInput(updatedProfile.data.pharmacie.pharmacieInfo?.periodeGarde?.debut),
            fin: formatDateForInput(updatedProfile.data.pharmacie.pharmacieInfo?.periodeGarde?.fin)
          }
        });
        localStorage.setItem('pharmacyInfo', JSON.stringify(updatedProfile.data.pharmacie));
        alert('Informations mises à jour');
      } else {
        setError('Erreur lors de la récupération du profil mis à jour');
      }
    } catch (err) {
      console.error('Erreur mise à jour:', err);
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDemandeModification = async (e) => {
  e.preventDefault();
  try {
    const formData = new FormData();
    for (const key in demandeModification) {
      if (key === 'photo' && demandeModification[key]) {
        formData.append('photo', demandeModification[key]);
      } else if (demandeModification[key]) {
        formData.append(key, demandeModification[key]);
      }
    }
    const res = await axios.post('http://localhost:3001/api/pharmacies/demande-modification', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    alert(res.data.message || 'Demande envoyée à l"admin');
    setDemandeModification({ nom: '', email: '', numero: '', positionGoogleMaps: '', photo: null });
  } catch (err) {
    console.error('Erreur demande modification:', err);
    const errorMessage = err.response?.data?.message || 'Erreur lors de l"envoi de la demande';
    setError(errorMessage);
    if (errorMessage.includes('Cast to string failed')) {
      setError('Erreur de format pour la photo. Veuillez réessayer avec une image valide.');
    }
  }
};

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordFields.nouveauMotDePasse !== passwordFields.confirmNouveauMotDePasse) {
      return setError('Les nouveaux mots de passe ne correspondent pas');
    }
    try {
      const res = await axios.put(
        'http://localhost:3001/api/pharmacies/profile/change-password',
        {
          ancienMotDePasse: passwordFields.ancienMotDePasse,
          nouveauMotDePasse: passwordFields.nouveauMotDePasse
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || 'Mot de passe mis à jour avec succès');
      setPasswordFields({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmNouveauMotDePasse: '' });
    } catch (err) {
      console.error('Erreur changement mot de passe:', err);
      setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
    }
  };

  if (!pharmacie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-lg font-medium text-gray-700">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Profil Pharmacie</h1>
          <p className="text-gray-600">Gérez les informations de votre pharmacie</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informations actuelles */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 ml-4">Informations actuelles</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-600">Nom</span>
                <span className="text-gray-800">{pharmacie.pharmacieInfo?.nomPharmacie || `${pharmacie.prenom} ${pharmacie.nom}`}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-600">Email</span>
                <span className="text-gray-800">{pharmacie.email}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-600">Téléphone</span>
                <span className="text-gray-800">{pharmacie.telephone || 'Non spécifié'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-600">Adresse</span>
                <span className="text-gray-800 text-right">{pharmacie.pharmacieInfo?.adresseGoogleMaps || 'Non spécifié'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-600">Livraison</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${pharmacie.pharmacieInfo?.livraisonDisponible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {pharmacie.pharmacieInfo?.livraisonDisponible ? 'Disponible' : 'Non disponible'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-600">De garde</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${pharmacie.pharmacieInfo?.estDeGarde ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                  {pharmacie.pharmacieInfo?.estDeGarde ? 'Oui' : 'Non'}
                </span>
              </div>
              <div className="py-3">
                <span className="font-semibold text-gray-600 block mb-2">Période de garde</span>
                <span className="text-gray-800">
                  {pharmacie.pharmacieInfo?.periodeGarde?.debut && pharmacie.pharmacieInfo?.periodeGarde?.fin
                    ? `du ${new Date(pharmacie.pharmacieInfo.periodeGarde.debut).toLocaleDateString()} au ${new Date(pharmacie.pharmacieInfo.periodeGarde.fin).toLocaleDateString()}`
                    : 'Non définie'}
                </span>
              </div>
            </div>

            {/* Horaires */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Horaires d'ouverture</h3>
              <div className="space-y-2">
                {Object.entries(pharmacie.pharmacieInfo?.heuresOuverture || {}).map(([jour, horaires]) => (
                  <div key={jour} className="flex justify-between items-center py-2 px-4 rounded-lg bg-gray-50">
                    <span className="font-medium text-gray-700 capitalize">{jour}</span>
                    <span className={`px-3 py-1 text-sm rounded-full ${horaires.ouvert ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {horaires.ouvert ? `${horaires.debut} - ${horaires.fin}` : 'Fermé'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo */}
            {pharmacie.pharmacieInfo?.photoPharmacie?.cheminFichier && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Photo de la pharmacie</h3>
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={`http://localhost:3001/${pharmacie.pharmacieInfo.photoPharmacie.cheminFichier.replace(/\\/g, '/')}`}
                    alt="Pharmacie"
                    className="w-full h-48 object-cover"
                    onError={(e) => console.error('Erreur chargement image:', e)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sections modifiables */}
          <div className="space-y-8">
            {/* Modification directe */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-green-100 rounded-xl">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 ml-4">Modifications rapides</h2>
              </div>

              {/* Horaires */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-700">Horaires d'ouverture</h3>
                {Object.keys(modifiableFields.heuresOuverture).map((jour) => (
                  <div key={jour} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-700 capitalize">{jour}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={modifiableFields.heuresOuverture[jour].ouvert}
                          onChange={(e) =>
                            setModifiableFields({
                              ...modifiableFields,
                              heuresOuverture: {
                                ...modifiableFields.heuresOuverture,
                                [jour]: { ...modifiableFields.heuresOuverture[jour], ouvert: e.target.checked }
                              }
                            })
                          }
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${modifiableFields.heuresOuverture[jour].ouvert ? 'bg-green-600' : 'bg-gray-300'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${modifiableFields.heuresOuverture[jour].ouvert ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-700">Ouvert</span>
                      </label>
                    </div>
                    {modifiableFields.heuresOuverture[jour].ouvert && (
                      <div className="flex space-x-3">
                        <input
                          type="time"
                          value={modifiableFields.heuresOuverture[jour].debut}
                          onChange={(e) =>
                            setModifiableFields({
                              ...modifiableFields,
                              heuresOuverture: {
                                ...modifiableFields.heuresOuverture,
                                [jour]: { ...modifiableFields.heuresOuverture[jour], debut: e.target.value }
                              }
                            })
                          }
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <input
                          type="time"
                          value={modifiableFields.heuresOuverture[jour].fin}
                          onChange={(e) =>
                            setModifiableFields({
                              ...modifiableFields,
                              heuresOuverture: {
                                ...modifiableFields.heuresOuverture,
                                [jour]: { ...modifiableFields.heuresOuverture[jour], fin: e.target.value }
                              }
                            })
                          }
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Période de garde */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Période de garde</h3>
                <div className="flex space-x-3">
                  <input
                    type="date"
                    value={modifiableFields.periodeGarde.debut}
                    onChange={(e) =>
                      setModifiableFields({
                        ...modifiableFields,
                        periodeGarde: { ...modifiableFields.periodeGarde, debut: e.target.value }
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={modifiableFields.periodeGarde.fin}
                    onChange={(e) =>
                      setModifiableFields({
                        ...modifiableFields,
                        periodeGarde: { ...modifiableFields.periodeGarde, fin: e.target.value }
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Livraison */}
              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modifiableFields.livraisonDisponible}
                    onChange={(e) => setModifiableFields({ ...modifiableFields, livraisonDisponible: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${modifiableFields.livraisonDisponible ? 'bg-green-600' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${modifiableFields.livraisonDisponible ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
                  </div>
                  <span className="ml-3 text-lg font-medium text-gray-700">Livraison disponible</span>
                </label>
              </div>

              <button 
                onClick={handleDirectChange} 
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                Enregistrer les modifications
              </button>
            </div>

            {/* Changer le mot de passe */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 ml-4">Sécurité</h2>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ancien mot de passe</label>
                  <input
                    type="password"
                    value={passwordFields.ancienMotDePasse}
                    onChange={(e) => setPasswordFields({ ...passwordFields, ancienMotDePasse: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={passwordFields.nouveauMotDePasse}
                    onChange={(e) => setPasswordFields({ ...passwordFields, nouveauMotDePasse: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le nouveau mot de passe</label>
                  <input
                    type="password"
                    value={passwordFields.confirmNouveauMotDePasse}
                    onChange={(e) => setPasswordFields({ ...passwordFields, confirmNouveauMotDePasse: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Changer le mot de passe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Demande de modification */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-purple-100 rounded-xl">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Demande de modification</h2>
              <p className="text-gray-600">Les modifications seront validées par un administrateur</p>
            </div>
          </div>

          <form onSubmit={handleDemandeModification} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau nom</label>
              <input
                type="text"
                placeholder="Nom de la pharmacie"
                value={demandeModification.nom}
                onChange={(e) => setDemandeModification({ ...demandeModification, nom: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nouvel email</label>
              <input
                type="email"
                placeholder="nouveau@email.com"
                value={demandeModification.email}
                onChange={(e) => setDemandeModification({ ...demandeModification, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau téléphone</label>
              <input
                type="text"
                placeholder="+228 XX XX XX XX"
                value={demandeModification.numero}
                onChange={(e) => setDemandeModification({ ...demandeModification, numero: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Position Google Maps</label>
              <input
                type="text"
                placeholder="Lien Google Maps"
                value={demandeModification.positionGoogleMaps}
                onChange={(e) => setDemandeModification({ ...demandeModification, positionGoogleMaps: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Photo de la pharmacie</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setDemandeModification({ ...demandeModification, photo: e.target.files[0] })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                Envoyer la demande
              </button>
            </div>
          </form>
        </div>

        {/* Bouton retour */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/pharmacie/dashboard')}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au tableau de bord
          </button>
        </div>
      </div>
    </div>
  );
}