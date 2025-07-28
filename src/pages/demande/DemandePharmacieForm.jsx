import { useState } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && ['image/jpeg', 'image/png'].includes(file.type)) {
      setPhotoPharmacie(file);
      console.log('📸 [DemandePharmacieForm] Photo sélectionnée:', file.name);
    } else {
      setMessage('Erreur : Veuillez sélectionner une image JPEG ou PNG.');
    }
  };

  const handleDocumentsChange = (e) => {
    const files = Array.from(e.target.files).filter(file =>
      ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)
    );
    setDocumentsVerification(files);
    console.log('📄 [DemandePharmacieForm] Documents sélectionnés:', files.map(f => f.name));
    if (files.length !== e.target.files.length) {
      setMessage('Erreur : Certains fichiers ne sont pas des JPEG, PNG ou PDF.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!photoPharmacie) {
      setMessage('Erreur : Une photo de la pharmacie est requise.');
      setLoading(false);
      return;
    }
    if (documentsVerification.length === 0) {
      setMessage('Erreur : Au moins un document justificatif est requis.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      for (const key in form) {
        formData.append(key, form[key]);
      }
      formData.append('photoPharmacie', photoPharmacie);
      documentsVerification.forEach(file => {
        formData.append('documentsVerification', file);
      });

      console.log('📤 [DemandePharmacieForm] Envoi FormData:', {
        nomPharmacie: form.nomPharmacie,
        adresseGoogleMaps: form.adresseGoogleMaps,
        emailPharmacie: form.emailPharmacie,
        telephonePharmacie: form.telephonePharmacie,
        photoPharmacie: photoPharmacie?.name,
        documentsVerification: documentsVerification.map(f => f.name),
      });

      const res = await axiosInstance.post('/api/client/demande-pharmacie', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('✅ [DemandePharmacieForm] Réponse serveur:', res.data);
      setMessage('✅ Demande envoyée avec succès.');
      navigate('/ma-demande-pharmacie');
    } catch (error) {
      console.error('❌ [DemandePharmacieForm] Erreur lors de la demande:', error);
      setMessage(error.response?.data?.message || 'Erreur lors de l’envoi de la demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 shadow-md rounded-lg bg-white mt-8">
      <h2 className="text-2xl font-bold mb-4">Faire une demande de pharmacie</h2>

      {message && (
        <div className={`mb-4 p-2 rounded text-white ${message.includes('Erreur') ? 'bg-red-600' : 'bg-blue-600'}`}>
          {message}
        </div>
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
          <label className="block font-medium mb-1">Photo de la pharmacie (JPEG/PNG)</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            required
            className="w-full"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Documents justificatifs (JPEG/PNG/PDF)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            multiple
            onChange={handleDocumentsChange}
            required
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