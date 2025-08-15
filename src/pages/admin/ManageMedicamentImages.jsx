import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from '../../utils/axiosConfig';
import { useAuth } from '../../hooks/useAuth';

export default function ManageMedicamentImages() {
  const { user, token, isLoading } = useAuth();
  const navigate = useNavigate();
  const [medicaments, setMedicaments] = useState([]);
  const [selectedMedicament, setSelectedMedicament] = useState('');
  const [files, setFiles] = useState([]);
  const [editImageId, setEditImageId] = useState(null); // Pour suivre l'image en cours de modification
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Charger la liste des médicaments
  useEffect(() => {
    if (!token || isLoading) return;

    const fetchMedicaments = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/api/medicaments/search');
        console.log('🔍 [fetchMedicaments] Réponse complète:', JSON.stringify(res.data, null, 2));
        const allMeds = res.data.data.pharmacies.flatMap(pharma => pharma.medicaments);
        const uniqueDrugs = [...new Set(allMeds.map(med => med.nom))].map(nom => {
          const matchingMeds = allMeds.filter(med => med.nom === nom);
          const images = matchingMeds.reduce((acc, med) => {
            if (med.images && med.images.length > 0) {
              return [...acc, ...med.images];
            }
            return acc;
          }, []);

          // Supprimer les doublons d'images en se basant sur cheminFichier
          const uniqueImages = Array.from(
            new Map(images.map(img => [img.cheminFichier, img])).values()
          );

          return { nom, images: uniqueImages };
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

  // Gérer la sélection des fichiers
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 3) {
      setMessage('❌ Maximum 3 images autorisées');
      return;
    }
    setFiles(selectedFiles);
  };

  // Télécharger une nouvelle image
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

  // Modifier une image existante
  const handleEditImage = async (nom, imageId) => {
    if (!files.length) {
      setMessage('❌ Veuillez sélectionner une nouvelle image pour la modification.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('images', files[0]); // Une seule image pour la modification

    try {
      const res = await axiosInstance.put(`/api/admin/drug/image/${nom}/${imageId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(res.data.message || '✅ Image modifiée avec succès');
      setMedicaments(medicaments.map(med =>
        med.nom === nom
          ? { ...med, images: res.data.data }
          : med
      ));
      setFiles([]);
      setEditImageId(null);
    } catch (err) {
      console.error('❌ Erreur modification image:', err);
      setMessage('❌ Erreur lors de la modification: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une image
  const handleDeleteImage = async (nom, imageId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette image ?')) return;

    setLoading(true);
    try {
      const res = await axiosInstance.delete(`/api/admin/drug/image/${nom}/${imageId}`);
      setMessage(res.data.message || '✅ Image supprimée avec succès');
      setMedicaments(medicaments.map(med =>
        med.nom === nom
          ? { ...med, images: res.data.data }
          : med
      ));
    } catch (err) {
      console.error('❌ Erreur suppression image:', err);
      setMessage('❌ Erreur lors de la suppression: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Rendu du composant
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg font-semibold text-gray-700 animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!user || !token || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg font-semibold text-red-600">
          Accès non autorisé.
          <button
            onClick={() => navigate('/login')}
            className="mt-2 text-blue-600 underline hover:text-blue-800 transition duration-200"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-blue-700 mb-6 flex items-center">
          <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Gérer les images des médicaments
        </h2>

        {message && (
          <p className={`mb-6 p-4 rounded-lg ${message.includes('❌') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            {message}
          </p>
        )}

        {loading && (
          <div className="flex items-center justify-center mb-6">
            <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
            </svg>
            <span className="ml-2 text-gray-600">Chargement en cours...</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un médicament
            </label>
            <select
              value={selectedMedicament}
              onChange={(e) => {
                setSelectedMedicament(e.target.value);
                setEditImageId(null); // Réinitialiser le mode édition
                setFiles([]);
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choisir un médicament --</option>
              {medicaments.map((med) => (
                <option key={med.nom} value={med.nom}>
                  {med.nom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {editImageId ? 'Nouvelle image pour remplacer' : 'Images du médicament (jusqu\'à 3)'}
            </label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              multiple={!editImageId} // Multiple uniquement pour l'ajout
              onChange={handleFileChange}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={editImageId ? () => handleEditImage(selectedMedicament, editImageId) : handleUpload}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-300 disabled:opacity-50"
            disabled={loading || !selectedMedicament || files.length === 0}
          >
            {editImageId ? 'Modifier l\'image' : 'Ajouter les images'}
          </button>
          {editImageId && (
            <button
              onClick={() => {
                setEditImageId(null);
                setFiles([]);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-300"
            >
              Annuler la modification
            </button>
          )}
        </div>

        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Liste des médicaments</h3>
        <ul className="space-y-6">
          {medicaments.map((med) => (
            <li key={med.nom} className="p-6 bg-gray-50 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center flex-wrap">
                {med.images && med.images.length > 0 ? (
                  <div className="flex gap-4 mr-6 flex-wrap">
                    {med.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={`http://localhost:3001${image.cheminFichier}`}
                          alt={`${med.nom} image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-md shadow-sm"
                          onError={(e) => {
                            console.error(`❌ [ManageMedicamentImages] Échec chargement image: http://localhost:3001${image.cheminFichier}`, e);
                            e.target.src = 'http://localhost:3001/Uploads/medicaments/default.jpg';
                          }}
                        />
                        <div className="absolute top-0 right-0 flex gap-1">
                          <button
                            onClick={() => {
                              setSelectedMedicament(med.nom);
                              setEditImageId(image._id);
                              setFiles([]);
                            }}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white p-1 rounded-full text-xs"
                            title="Modifier l'image"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteImage(med.nom, image._id)}
                            className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full text-xs"
                            title="Supprimer l'image"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-20 h-20 mr-6 flex items-center justify-center bg-gray-200 text-gray-600 rounded-md">
                    Aucune image
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold text-gray-800">{med.nom}</p>
                  <p className="text-sm text-gray-600">{med.images.length} image(s)</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <button
          onClick={() => navigate('/admin-dashboard')}
          className="mt-8 bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-300"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
}