//C:\reactjs node mongodb\pharmacie-frontend\src\pages\demande\DemandePharmacieForm.jsx

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

export default function DemandePharmacieForm() {
  const { token } = useAuth();
  const [form, setForm] = useState({
    nomPharmacie: '',
    adresseGoogleMaps: '',
    emailPharmacie: '',
    telephonePharmacie: '',
  });
  const [photoPharmacie, setPhotoPharmacie] = useState(null);
  const [documentsVerification, setDocumentsVerification] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = e => {
    setPhotoPharmacie(e.target.files[0]);
  };

  const handleDocumentsChange = e => {
    setDocumentsVerification(Array.from(e.target.files));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      for (const key in form) {
        formData.append(key, form[key]);
      }
      if (photoPharmacie) {
        formData.append('photoPharmacie', photoPharmacie);
      }
      documentsVerification.forEach(file => {
        formData.append('documentsVerification', file);
      });

      await axios.post(
        'http://localhost:3001/api/demande-pharmacie/creer',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setMessage('✅ Demande envoyée avec succès.');
    } catch (error) {
      console.error('Erreur lors de la demande :', error);
      setMessage(error.response?.data?.message || 'Erreur lors de l’envoi de la demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 shadow-md rounded-lg bg-white mt-8">
      <h2 className="text-2xl font-bold mb-4">Faire une demande de pharmacie</h2>

      {message && (
        <div className="mb-4 p-2 rounded text-white bg-blue-600">{message}</div>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
        <input
          type="text"
          name="nomPharmacie"
          value={form.nomPharmacie}
          onChange={handleChange}
          placeholder="Nom de la pharmacie"
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="adresseGoogleMaps"
          value={form.adresseGoogleMaps}
          onChange={handleChange}
          placeholder="Lien Google Maps"
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="email"
          name="emailPharmacie"
          value={form.emailPharmacie}
          onChange={handleChange}
          placeholder="Email professionnel"
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="telephonePharmacie"
          value={form.telephonePharmacie}
          onChange={handleChange}
          placeholder="Téléphone professionnel"
          required
          className="w-full border p-2 rounded"
        />

        <div>
          <label className="block font-medium mb-1">Photo de la pharmacie</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Documents justificatifs</label>
          <input
            type="file"
            multiple
            onChange={handleDocumentsChange}
            className="w-full"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
        </button>
      </form>
    </div>
  );
}
