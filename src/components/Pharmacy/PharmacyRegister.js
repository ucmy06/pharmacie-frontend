// src/components/Pharmacy/PharmacyRegister.js
import { useState } from 'react';
import { registerPharmacie } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth'; // ✅ import nommé

export default function PharmacyRegister() {
  const [form, setForm] = useState({
    email: '',
    motDePasse: '',
    telephone: '',
    nomPharmacie: '',
    adresseGoogleMaps: '',
    photoPharmacie: '',
    livraisonDisponible: false,
    documentsVerification: null
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // On utilise FormData car on envoie un fichier
      const data = new FormData();
      for (let key in form) {
        data.append(key, form[key]);
      }

      const res = await registerPharmacie(data);
      login(res.data.data.user, res.data.data.token);
      setSuccess("Demande envoyée avec succès. En attente de validation.");
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur serveur');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto" encType="multipart/form-data">
      <h2 className="text-xl mb-4 font-semibold">Inscription de Pharmacie</h2>
      
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}

      <input name="nomPharmacie" value={form.nomPharmacie} onChange={handleChange} placeholder="Nom de la pharmacie" className="border p-2 w-full mb-2" required />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email professionnel" className="border p-2 w-full mb-2" required />
      <input name="motDePasse" type="password" value={form.motDePasse} onChange={handleChange} placeholder="Mot de passe" className="border p-2 w-full mb-2" required />
      <input name="telephone" value={form.telephone} onChange={handleChange} placeholder="Téléphone" className="border p-2 w-full mb-2" required />
      <input name="adresseGoogleMaps" value={form.adresseGoogleMaps} onChange={handleChange} placeholder="Lien Google Maps" className="border p-2 w-full mb-2" />
      <input name="photoPharmacie" value={form.photoPharmacie} onChange={handleChange} placeholder="URL photo (facultatif)" className="border p-2 w-full mb-2" />

      <div className="mb-4">
        <label className="block mb-1">Document d’attestation (PDF ou image) :</label>
        <input type="file" name="documentsVerification" accept=".pdf,.png,.jpg,.jpeg" onChange={handleChange} className="w-full" required />
      </div>

      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          name="livraisonDisponible"
          checked={form.livraisonDisponible}
          onChange={handleChange}
          className="mr-2"
        />
        <label htmlFor="livraisonDisponible">Proposez-vous un service de livraison ?</label>
      </div>

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded w-full">
        Soumettre la demande
      </button>
    </form>
  );
}
