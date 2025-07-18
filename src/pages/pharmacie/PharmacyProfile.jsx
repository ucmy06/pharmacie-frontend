// C:\reactjs node mongodb\pharmacie-frontend\src\pages\pharmacie\PharmacyProfile.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function PharmacyProfile() {
  const [pharmacie, setPharmacie] = useState(null);
  const [modifiableFields, setModifiableFields] = useState({
    heuresOuverture: {}, // Structure complexe (par jour)
    livraisonDisponible: false,
    periodeGarde: ''
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

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get('http://localhost:3001/api/pharmacies/mon-profil', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPharmacie(res.data);
        setModifiableFields({
          heuresOuverture: res.data.pharmacieInfo?.heuresOuverture || {},
          livraisonDisponible: res.data.pharmacieInfo?.livraisonDisponible || false,
          periodeGarde: res.data.pharmacieInfo?.periodeGarde || ''
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement du profil');
      }
    }
    fetchData();
  }, [token]);

  const handleDirectChange = async () => {
    try {
      await axios.put('http://localhost:3001/api/pharmacies/update-profile', modifiableFields, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Informations mises à jour');
      // Mettre à jour le localStorage
      const updatedProfile = await axios.get('http://localhost:3001/api/pharmacies/mon-profil', {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.setItem('pharmacie', JSON.stringify(updatedProfile.data));
      setPharmacie(updatedProfile.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDemandeModification = async e => {
    e.preventDefault();
    try {
      const formData = new FormData();
      for (const key in demandeModification) {
        if (demandeModification[key]) {
          formData.append(key, demandeModification[key]);
        }
      }
      await axios.post('http://localhost:3001/api/pharmacies/demande-modification', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Demande envoyée à l’admin');
      setDemandeModification({ nom: '', email: '', numero: '', positionGoogleMaps: '', photo: null });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l’envoi de la demande');
    }
  };

  const handlePasswordChange = async e => {
    e.preventDefault();
    if (passwordFields.nouveauMotDePasse !== passwordFields.confirmNouveauMotDePasse) {
      return setError('Les nouveaux mots de passe ne correspondent pas');
    }
    try {
      await axios.put(
        'http://localhost:3001/api/pharmacies/profile/change-password',
        {
          ancienMotDePasse: passwordFields.ancienMotDePasse,
          nouveauMotDePasse: passwordFields.nouveauMotDePasse
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setError('');
      alert('Mot de passe mis à jour avec succès');
      setPasswordFields({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmNouveauMotDePasse: '' });
    } catch (err) {
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
        <p><strong>Numéro:</strong> {pharmacie.telephone || 'Non spécifié'}</p>
        <p><strong>Adresse:</strong> {pharmacie.pharmacieInfo?.adresseGoogleMaps || 'Non spécifié'}</p>
      </div>

      {/* Modification directe */}
      <div className="bg-white p-4 shadow rounded mb-8">
        <h3 className="text-lg font-semibold mb-2">Informations modifiables</h3>
        <textarea
          placeholder="Heures d'ouverture (JSON)"
          value={JSON.stringify(modifiableFields.heuresOuverture, null, 2)}
          onChange={e => {
            try {
              setModifiableFields({ ...modifiableFields, heuresOuverture: JSON.parse(e.target.value) });
            } catch {
              setError('Format JSON invalide pour les heures d’ouverture');
            }
          }}
          className="w-full p-2 border my-1 h-32"
        />
        <input
          type="text"
          placeholder="Période de garde"
          value={modifiableFields.periodeGarde}
          onChange={e => setModifiableFields({ ...modifiableFields, periodeGarde: e.target.value })}
          className="w-full p-2 border my-1"
        />
        <label className="block my-2">
          <input
            type="checkbox"
            checked={modifiableFields.livraisonDisponible}
            onChange={e => setModifiableFields({ ...modifiableFields, livraisonDisponible: e.target.checked })}
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
            onChange={e => setPasswordFields({ ...passwordFields, ancienMotDePasse: e.target.value })}
            className="w-full p-2 border my-1"
            required
          />
          <input
            type="password"
            name="nouveauMotDePasse"
            placeholder="Nouveau mot de passe"
            value={passwordFields.nouveauMotDePasse}
            onChange={e => setPasswordFields({ ...passwordFields, nouveauMotDePasse: e.target.value })}
            className="w-full p-2 border my-1"
            required
          />
          <input
            type="password"
            name="confirmNouveauMotDePasse"
            placeholder="Confirmer nouveau mot de passe"
            value={passwordFields.confirmNouveauMotDePasse}
            onChange={e => setPasswordFields({ ...passwordFields, confirmNouveauMotDePasse: e.target.value })}
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
            onChange={e => setDemandeModification({ ...demandeModification, nom: e.target.value })}
            className="w-full p-2 border my-1"
          />
          <input
            type="email"
            placeholder="Nouvel email"
            value={demandeModification.email}
            onChange={e => setDemandeModification({ ...demandeModification, email: e.target.value })}
            className="w-full p-2 border my-1"
          />
          <input
            type="text"
            placeholder="Nouveau numéro"
            value={demandeModification.numero}
            onChange={e => setDemandeModification({ ...demandeModification, numero: e.target.value })}
            className="w-full p-2 border my-1"
          />
          <input
            type="text"
            placeholder="Nouvelle position Google Maps"
            value={demandeModification.positionGoogleMaps}
            onChange={e => setDemandeModification({ ...demandeModification, positionGoogleMaps: e.target.value })}
            className="w-full p-2 border my-1"
          />
          <input
            type="file"
            onChange={e => setDemandeModification({ ...demandeModification, photo: e.target.files[0] })}
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