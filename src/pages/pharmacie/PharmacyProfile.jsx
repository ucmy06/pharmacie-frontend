// C:\reactjs node mongodb\pharmacie-frontend\src\components\PharmacyProfile.jsx
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
    livraisonDisponible: false,
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
    alert(res.data.message || 'Demande envoyée à l’admin');
    setDemandeModification({ nom: '', email: '', numero: '', positionGoogleMaps: '', photo: null });
  } catch (err) {
    console.error('Erreur demande modification:', err);
    const errorMessage = err.response?.data?.message || 'Erreur lors de l’envoi de la demande';
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

  if (!pharmacie) return <p>Chargement...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Profil Pharmacie</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Informations de la pharmacie */}
      <div className="bg-white p-4 shadow rounded mb-8">
        <h3 className="text-lg font-semibold mb-2">Informations actuelles</h3>
        <p><strong>Nom:</strong> {pharmacie.pharmacieInfo?.nomPharmacie || `${pharmacie.prenom} ${pharmacie.nom}`}</p>
        <p><strong>Email:</strong> {pharmacie.email}</p>
        <p><strong>Téléphone:</strong> {pharmacie.telephone || 'Non spécifié'}</p>
        <p><strong>Adresse:</strong> {pharmacie.pharmacieInfo?.adresseGoogleMaps || 'Non spécifié'}</p>
        <p><strong>Livraison disponible:</strong> {pharmacie.pharmacieInfo?.livraisonDisponible ? 'Oui' : 'Non'}</p>
        <p><strong>De garde:</strong> {pharmacie.pharmacieInfo?.estDeGarde ? 'Oui' : 'Non'}</p>
        <p>
          <strong>Période de garde:</strong>{' '}
          {pharmacie.pharmacieInfo?.periodeGarde?.debut && pharmacie.pharmacieInfo?.periodeGarde?.fin
            ? `du ${new Date(pharmacie.pharmacieInfo.periodeGarde.debut).toLocaleDateString()} au ${new Date(pharmacie.pharmacieInfo.periodeGarde.fin).toLocaleDateString()}`
            : 'Non définie'}
        </p>
        <h4 className="font-semibold mt-4">Horaires d'ouverture:</h4>
        {Object.entries(pharmacie.pharmacieInfo?.heuresOuverture || {}).map(([jour, horaires]) => (
          <p key={jour}>
            {jour.charAt(0).toUpperCase() + jour.slice(1)}:{' '}
            {horaires.ouvert ? `${horaires.debut} - ${horaires.fin}` : 'Fermé'}
          </p>
        ))}
        {pharmacie.pharmacieInfo?.photoPharmacie?.cheminFichier && (
          <div>
            <strong>Photo de la pharmacie:</strong>
            <img
              src={`http://localhost:3001/${pharmacie.pharmacieInfo.photoPharmacie.cheminFichier.replace(/\\/g, '/')}`}
              alt="Pharmacie"
              className="mt-2 max-w-xs"
              onError={(e) => console.error('Erreur chargement image:', e)}
            />
          </div>
        )}
      </div>

      {/* Modification directe */}
      <div className="bg-white p-4 shadow rounded mb-8">
        <h3 className="text-lg font-semibold mb-2">Informations modifiables</h3>
        {Object.keys(modifiableFields.heuresOuverture).map((jour) => (
          <div key={jour} className="mb-2">
            <label className="block font-semibold">{jour.charAt(0).toUpperCase() + jour.slice(1)}</label>
            <label className="inline-flex items-center mr-4">
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
              />
              <span className="ml-2">Ouvert</span>
            </label>
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
              disabled={!modifiableFields.heuresOuverture[jour].ouvert}
              className="p-2 border mr-2"
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
              disabled={!modifiableFields.heuresOuverture[jour].ouvert}
              className="p-2 border"
            />
          </div>
        ))}
        <div className="mb-2">
          <label className="block font-semibold">Période de garde</label>
          <input
            type="date"
            value={modifiableFields.periodeGarde.debut}
            onChange={(e) =>
              setModifiableFields({
                ...modifiableFields,
                periodeGarde: { ...modifiableFields.periodeGarde, debut: e.target.value }
              })
            }
            className="p-2 border mr-2"
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
            className="p-2 border"
          />
        </div>
        <label className="block my-2">
          <input
            type="checkbox"
            checked={modifiableFields.livraisonDisponible}
            onChange={(e) => setModifiableFields({ ...modifiableFields, livraisonDisponible: e.target.checked })}
          /> Livraison disponible
        </label>
        <button onClick={handleDirectChange} className="bg-green-600 text-white p-2 mt-2">
          Enregistrer
        </button>
      </div>

      {/* Changer le mot de passe */}
      <div className="bg-white p-4 shadow rounded mb-8">
        <h3 className="text-lg font-semibold mb-2">Changer le mot de passe</h3>
        <form onSubmit={handlePasswordChange}>
          <input
            type="password"
            name="ancienMotDePasse"
            placeholder="Ancien mot de passe"
            value={passwordFields.ancienMotDePasse}
            onChange={(e) => setPasswordFields({ ...passwordFields, ancienMotDePasse: e.target.value })}
            className="w-full p-2 border my-1"
            required
          />
          <input
            type="password"
            name="nouveauMotDePasse"
            placeholder="Nouveau mot de passe"
            value={passwordFields.nouveauMotDePasse}
            onChange={(e) => setPasswordFields({ ...passwordFields, nouveauMotDePasse: e.target.value })}
            className="w-full p-2 border my-1"
            required
          />
          <input
            type="password"
            name="confirmNouveauMotDePasse"
            placeholder="Confirmer nouveau mot de passe"
            value={passwordFields.confirmNouveauMotDePasse}
            onChange={(e) => setPasswordFields({ ...passwordFields, confirmNouveauMotDePasse: e.target.value })}
            className="w-full p-2 border my-1"
            required
          />
          <button className="bg-blue-600 text-white p-2 mt-2">Changer le mot de passe</button>
        </form>
      </div>

      {/* Demande de modification */}
      <div className="bg-white p-4 shadow rounded">
        <h3 className="text-lg font-semibold mb-2">Demande de modification</h3>
        <form onSubmit={handleDemandeModification}>
          <input
            type="text"
            placeholder="Nouveau nom"
            value={demandeModification.nom}
            onChange={(e) => setDemandeModification({ ...demandeModification, nom: e.target.value })}
            className="w-full p-2 border my-1"
          />
          <input
            type="email"
            placeholder="Nouvel email"
            value={demandeModification.email}
            onChange={(e) => setDemandeModification({ ...demandeModification, email: e.target.value })}
            className="w-full p-2 border my-1"
          />
          <input
            type="text"
            placeholder="Nouveau numéro de téléphone"
            value={demandeModification.numero}
            onChange={(e) => setDemandeModification({ ...demandeModification, numero: e.target.value })}
            className="w-full p-2 border my-1"
          />
          <input
            type="text"
            placeholder="Nouvelle position Google Maps"
            value={demandeModification.positionGoogleMaps}
            onChange={(e) => setDemandeModification({ ...demandeModification, positionGoogleMaps: e.target.value })}
            className="w-full p-2 border my-1"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setDemandeModification({ ...demandeModification, photo: e.target.files[0] })}
            className="w-full p-2 border my-1"
          />
          <button className="bg-blue-600 text-white p-2 mt-2">Envoyer demande</button>
        </form>
      </div>

      <button
        onClick={() => navigate('/pharmacie/dashboard')}
        className="bg-gray-600 text-white p-2 mt-4 w-full"
      >
        Retour au tableau de bord
      </button>
    </div>
  );
}