import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import { useAuth } from '../../hooks/useAuth';

export default function ManageMedicamentImages() {
  const { user, token, isLoading } = useAuth();
  const navigate = useNavigate();
  const [medicaments, setMedicaments] = useState([]);
  const [selectedMedicament, setSelectedMedicament] = useState('');
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || isLoading) return;

    const fetchMedicaments = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/api/medicaments/search');
        console.log('🔍 [fetchMedicaments] Réponse complète:', JSON.stringify(res.data, null, 2));
        const allMeds = res.data.data.pharmacies.flatMap(pharma => pharma.medicaments);
        console.log('🔍 [fetchMedicaments] allMeds:', allMeds.map(med => ({
          nom: med.nom,
          images: med.images || 'Aucune'
        })));
        const uniqueDrugs = [...new Set(allMeds.map(med => med.nom))].map(nom => {
          const matchingMeds = allMeds.filter(med => med.nom === nom);
          const images = matchingMeds.reduce((acc, med) => {
            if (med.images && med.images.length > 0) {
              return [...acc, ...med.images];
            }
            return acc;
          }, []);
          return { nom, images };
        });
        console.log('🔍 [fetchMedicaments] uniqueDrugs:', uniqueDrugs);
        setMedicaments(uniqueDrugs);
      } catch (err) {
        console.error('❌ Erreur chargement médicaments:', err);
        setMessage('❌ Erreur lors du chargement des médicaments: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchMedicaments();
  }, [token, isLoading]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 3) {
      setMessage('❌ Maximum 3 images autorisées');
      return;
    }
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (!selectedMedicament) {
      setMessage('❌ Veuillez sélectionner un médicament.');
      return;
    }
    if (files.length === 0) {
      setMessage('❌ Veuillez sélectionner au moins une image.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    formData.append('nom', selectedMedicament);

    try {
      const res = await axiosInstance.post('/api/admin/drug/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(res.data.message || '✅ Images téléchargées avec succès');
      setMedicaments(medicaments.map(med =>
        med.nom === selectedMedicament
          ? { ...med, images: res.data.data }
          : med
      ));
      setFiles([]);
      setSelectedMedicament('');
    } catch (err) {
      console.error('❌ Erreur upload images:', err);
      setMessage('❌ Erreur lors du téléchargement: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div>Chargement...</div>;

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
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📸 Gérer les images des médicaments</h2>
      {message && <p className={`mb-4 ${message.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
      {loading && <p className="text-gray-600 mb-4">Chargement en cours...</p>}

      <label className="block mb-4">
        Sélectionner un médicament :
        <select
          value={selectedMedicament}
          onChange={(e) => setSelectedMedicament(e.target.value)}
          className="mt-1 border px-3 py-2 rounded w-full"
        >
          <option value="">-- Choisir un médicament --</option>
          {medicaments.map((med) => (
            <option key={med.nom} value={med.nom}>
              {med.nom}
            </option>
          ))}
        </select>
      </label>

      <div className="mb-4">
        <label className="block mb-2">Images du médicament (jusqu'à 3)</label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          multiple
          onChange={handleFileChange}
          className="border px-3 py-2 rounded w-full"
        />
      </div>

      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        Télécharger les images
      </button>

      <h3 className="text-xl font-bold mt-6 mb-4">Médicaments</h3>
      <ul className="space-y-4">
        {medicaments.map((med) => (
          <li key={med.nom} className="p-4 bg-white rounded shadow border">
            <div className="flex items-center">
              {med.images && med.images.length > 0 ? (
                <div className="flex gap-4 mr-4">
                  {med.images.map((image, index) => (
                    <img
                      key={index}
                      src={`http://localhost:3001${image.cheminFichier}`}
                      alt={`${med.nom} image ${index + 1}`}
                      className="w-16 h-16 object-cover"
                      onError={(e) => console.error(`❌ [ManageMedicamentImages] Échec chargement image: http://localhost:3001${image.cheminFichier}`, e)}
                    />
                  ))}
                </div>
              ) : (
                <div className="w-16 h-16 mr-4 flex items-center justify-center bg-gray-200 text-gray-600">
                  Aucune image
                </div>
              )}
              <div>
                <p><strong>{med.nom}</strong></p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={() => navigate('/admin-dashboard')}
        className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
      >
        Retour au tableau de bord
      </button>
    </div>
  );
}