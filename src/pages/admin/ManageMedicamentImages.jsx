// C:\reactjs node mongodb\pharmacie-frontend\src\pages\admin\ManageMedicamentImages.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';

export default function ManageMedicamentImages() {
  const { token } = useAuth();
  const { pharmacyId } = useParams(); // Get pharmacyId from URL
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState([]);
  const [medicaments, setMedicaments] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(pharmacyId || '');
  const [selectedMedicament, setSelectedMedicament] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  // Load pharmacies
  useEffect(() => {
    if (!token) return;

    axios.get('http://localhost:3001/api/admin/pharmacies', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setPharmacies(res.data.data.pharmacies))
      .catch(err => {
        console.error('Erreur chargement pharmacies', err);
        setMessage('❌ Erreur lors du chargement des pharmacies');
      });
  }, [token]);

  // Load medications for selected pharmacy
  useEffect(() => {
    if (!selectedPharmacy) return;

    axios.get(`http://localhost:3001/api/admin/pharmacy/${selectedPharmacy}/medicaments`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setMedicaments(res.data.data.medicaments))
      .catch(err => {
        console.error('Erreur chargement médicaments', err);
        setMessage('❌ Erreur lors du chargement des médicaments: ' + (err.response?.data?.message || err.message));
      });
  }, [selectedPharmacy, token]);

  const handleUpload = async () => {
    if (!selectedPharmacy) {
      setMessage('❌ Veuillez sélectionner une pharmacie.');
      return;
    }
    if (!selectedMedicament) {
      setMessage('❌ Veuillez sélectionner un médicament.');
      return;
    }
    if (!file) {
      setMessage('❌ Veuillez sélectionner une image.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post(
        `http://localhost:3001/api/admin/pharmacy/${selectedPharmacy}/medicament/${selectedMedicament}/image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setMessage(res.data.message);
      // Refresh medicaments list
      const updatedMedicaments = await axios.get(
        `http://localhost:3001/api/admin/pharmacy/${selectedPharmacy}/medicaments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMedicaments(updatedMedicaments.data.data.medicaments);
      setFile(null); // Reset file input
      setSelectedMedicament(''); // Reset medicament selection
    } catch (err) {
      console.error('Erreur upload image', err);
      setMessage('❌ Erreur lors du téléchargement: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📸 Gérer les images des médicaments</h2>
      {message && <p className={`mb-4 ${message.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}

      {/* Pharmacy Selection */}
      <label className="block mb-4">
        Sélectionner une pharmacie :
        <select
          value={selectedPharmacy}
          onChange={(e) => {
            setSelectedPharmacy(e.target.value);
            setSelectedMedicament('');
            setMedicaments([]);
            navigate(`/admin/pharmacy/${e.target.value}/manage-medicament-images`);
          }}
          className="mt-1 border px-3 py-2 rounded w-full"
        >
          <option value="">-- Choisir une pharmacie --</option>
          {pharmacies.map(pharma => (
            <option key={pharma._id} value={pharma._id}>
              {pharma.pharmacieInfo.nomPharmacie} ({pharma.pharmacieInfo.baseMedicament || 'Aucune base'})
            </option>
          ))}
        </select>
      </label>

      {/* Medicament Selection */}
      {selectedPharmacy && (
        <label className="block mb-4">
          Sélectionner un médicament :
          <select
            value={selectedMedicament}
            onChange={(e) => setSelectedMedicament(e.target.value)}
            className="mt-1 border px-3 py-2 rounded w-full"
          >
            <option value="">-- Choisir un médicament --</option>
            {medicaments.map(med => (
              <option key={med._id} value={med._id}>
                {med.nom} ({med.nom_generique || 'N/A'})
              </option>
            ))}
          </select>
        </label>
      )}

      {/* File Input */}
      {selectedPharmacy && (
        <div className="mb-4">
          <label className="block mb-2">Image du médicament</label>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={(e) => setFile(e.target.files[0])}
            className="border px-3 py-2 rounded w-full"
          />
        </div>
      )}

      {/* Upload Button */}
      {selectedPharmacy && (
        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Télécharger l'image
        </button>
      )}

      {/* Medicaments List */}
      {selectedPharmacy && (
        <>
          <h3 className="text-xl font-bold mt-6 mb-4">Médicaments</h3>
          <ul className="space-y-4">
            {medicaments.map(med => (
              <li key={med._id} className="p-4 bg-white rounded shadow border">
                <div className="flex items-center">
                  {med.image && (
                    <img
                      src={`http://localhost:3001/Uploads/medicaments/${med.image.nomFichier}`}
                      alt={med.nom}
                      className="w-16 h-16 object-cover mr-4"
                    />
                  )}
                  <div>
                    <p><strong>{med.nom}</strong> ({med.nom_generique || 'N/A'})</p>
                    <p>{med.description || 'Aucune description'}</p>
                    <p>Prix: {med.prix ? `${med.prix} FCFA` : 'N/A'}</p>
                    <p>Stock: {med.quantite_stock || 'N/A'}</p>
                    <p>{med.est_sur_ordonnance ? 'Sur ordonnance' : 'Sans ordonnance'}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}