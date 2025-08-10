// C:\reactjs node mongodb\pharmacie-frontend\src\pages\demande\DemandePharmacieForm.jsx
import { useState, useRef } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Upload, MapPin, Phone, Mail, Building, ExternalLink } from 'lucide-react';

export default function DemandePharmacieForm() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nomPharmacie: '',
    adresseGoogleMaps: '',
    emailPharmacie: '',
    telephonePharmacie: '',
  });
  const [photoPharmacie, setPhotoPharmacie] = useState(null);
  const [documentsVerification, setDocumentsVerification] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '', show: false });
  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const showAlert = (type, message) => {
    setAlert({ type, message, show: true });
    setTimeout(() => setAlert({ ...alert, show: false }), 7000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (alert.show && alert.type === 'error') {
      setAlert({ ...alert, show: false });
    }
    if (name === 'nomPharmacie' && value.length > 3) {
      handlePharmacySearch(value);
    } else {
      setSearchResults([]);
    }
  };

  const handlePharmacySearch = (pharmacyName) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(true);
      // Données simulées réalistes pour des pharmacies à Lomé, Togo
      const mockResults = [
        {
          name: 'Pharmacie de la Paix',
          address: 'Avenue de la Paix, Lomé, Togo',
          googleMapsUrl: 'https://www.google.com/maps?q=6.130698,1.215362',
          coordinates: { lat: 6.130698, lng: 1.215362 },
        },
        {
          name: 'Pharmacie du Mono',
          address: 'Boulevard du Mono, Bè, Lomé, Togo',
          googleMapsUrl: 'https://www.google.com/maps?q=6.135547,1.204876',
          coordinates: { lat: 6.135547, lng: 1.204876 },
        },
        {
          name: 'Pharmacie Adawlato',
          address: 'Avenue de la Libération, Adawlato, Lomé, Togo',
          googleMapsUrl: 'https://www.google.com/maps?q=6.140876,1.217345',
          coordinates: { lat: 6.140876, lng: 1.217345 },
        },
        {
          name: 'Pharmacie Centrale',
          address: 'Centre-ville, Lomé, Togo',
          googleMapsUrl: 'https://www.google.com/maps?q=6.125145,1.210567',
          coordinates: { lat: 6.125145, lng: 1.210567 },
        },
      ].filter((result) =>
        result.name.toLowerCase().includes(pharmacyName.toLowerCase())
      );
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 500);
  };

  const handleAddressSelect = (result) => {
    setForm({ ...form, adresseGoogleMaps: result.googleMapsUrl });
    setSelectedAddress(result.address);
    setSearchResults([]);
    showAlert('success', 'Adresse sélectionnée avec succès');
  };

  const openGoogleMaps = () => {
    const searchQuery = form.nomPharmacie || 'pharmacie';
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(searchQuery + ' Lomé Togo')}`, '_blank');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && ['image/jpeg', 'image/png'].includes(file.type) && file.size <= 5 * 1024 * 1024) {
      setPhotoPharmacie(file);
      showAlert('success', `Photo "${file.name}" sélectionnée`);
    } else {
      showAlert('error', 'Veuillez sélectionner une image JPEG/PNG (max 5MB).');
    }
  };

  const handleDocumentsChange = (e) => {
    const files = Array.from(e.target.files).filter(
      (file) =>
        ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type) && file.size <= 10 * 1024 * 1024
    );
    setDocumentsVerification(files);
    if (files.length !== e.target.files.length) {
      showAlert('warning', 'Certains fichiers ont été ignorés (JPEG, PNG, PDF, max 10MB).');
    } else if (files.length > 0) {
      showAlert('success', `${files.length} document(s) sélectionné(s)`);
    }
  };

  const validateStep1 = () => {
    if (!form.nomPharmacie || !form.adresseGoogleMaps || !form.emailPharmacie || !form.telephonePharmacie) {
      showAlert('error', 'Veuillez remplir tous les champs obligatoires.');
      return false;
    }
    if (!form.emailPharmacie.includes('@') || !form.emailPharmacie.includes('.')) {
      showAlert('error', 'Veuillez entrer une adresse email valide.');
      return false;
    }
    const phoneRegex = /^\+?\d{8,}$/;
    if (!phoneRegex.test(form.telephonePharmacie)) {
      showAlert('error', 'Veuillez entrer un numéro de téléphone valide (au moins 8 chiffres).');
      return false;
    }
    // Validation du format de l'URL Google Maps
    const googleMapsRegex = /^(https:\/\/www\.google\.com\/maps\?q=-?\d+\.\d+,-?\d+\.\d+)|(https:\/\/maps\.app\.goo\.gl\/[a-zA-Z0-9]+)/;
    if (!googleMapsRegex.test(form.adresseGoogleMaps)) {
      showAlert('error', 'Veuillez entrer une URL Google Maps valide (ex: https://www.google.com/maps?q=6.125698,1.225362 ou https://maps.app.goo.gl/...).');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!photoPharmacie) {
      showAlert('error', 'Une photo de la pharmacie est requise.');
      return false;
    }
    if (documentsVerification.length === 0) {
      showAlert('error', 'Au moins un document justificatif est requis.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setLoading(true);

    try {
      const formData = new FormData();
      for (const key in form) {
        formData.append(key, form[key]);
      }
      formData.append('photoPharmacie', photoPharmacie);
      documentsVerification.forEach((file) => formData.append('documentsVerification', file));

      const res = await axiosInstance.post('/api/client/demande-pharmacie', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showAlert('success', res.data.message || 'Demande envoyée avec succès !');
      navigate('/ma-demande-pharmacie');
    } catch (error) {
      console.error('❌ [DemandePharmacieForm] Erreur:', error);
      showAlert('error', error.response?.data?.message || 'Erreur lors de l’envoi. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const AlertComponent = () => {
    if (!alert.show) return null;
    const alertStyles = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    };
    const AlertIcon = alert.type === 'success' ? CheckCircle : AlertCircle;

    return (
      <div className={`fixed top-4 right-4 max-w-md p-4 rounded-lg border-l-4 shadow-lg ${alertStyles[alert.type]}`}>
        <div className="flex items-center">
          <AlertIcon className="w-5 h-5 mr-3" />
          <p className="text-sm font-medium">{alert.message}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
      <AlertComponent />
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Building className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Demande de Pharmacie</h1>
          <p className="text-gray-600">Rejoignez notre réseau de pharmacies partenaires</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              1
            </div>
            <div className="text-sm ml-2 mr-4">Informations</div>
          </div>
          <div className={`w-20 h-1 ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
          <div className="flex items-center">
            <div className="text-sm mr-2 ml-4">Documents</div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              2
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <p className="text-gray-600 mb-4">Veuillez entrer les informations de votre pharmacie. Assurez-vous que l'adresse Google Maps est correcte.</p>
              <div className="relative">
                <Building className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="nomPharmacie"
                  value={form.nomPharmacie}
                  onChange={handleChange}
                  placeholder="Nom de la pharmacie"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
                {isSearching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
                  </div>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-3 border-b bg-gray-50">
                    <p className="text-sm font-medium text-gray-700">Adresses suggérées :</p>
                  </div>
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => handleAddressSelect(result)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <p className="font-medium text-gray-800">{result.name}</p>
                      <p className="text-sm text-gray-600">{result.address}</p>
                    </div>
                  ))}
                  <div className="p-3">
                    <button
                      type="button"
                      onClick={() => setSearchResults([])}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Effacer les suggestions
                    </button>
                  </div>
                </div>
              )}

              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  name="adresseGoogleMaps"
                  value={form.adresseGoogleMaps}
                  onChange={handleChange}
                  placeholder="Ex: https://www.google.com/maps?q=6.125698,1.225362"
                  className="w-full pl-12 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
                <button
                  type="button"
                  onClick={openGoogleMaps}
                  className="absolute right-2 top-2 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              {selectedAddress && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-700">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Adresse sélectionnée: {selectedAddress}
                  </p>
                </div>
              )}

              <small className="text-gray-500 block -mt-2">
                Tapez le nom de votre pharmacie pour voir les suggestions d'adresses, ou entrez un lien Google Maps valide (ex: https://www.google.com/maps?q=6.125698,1.225362 ou https://maps.app.goo.gl/...).
              </small>

              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="emailPharmacie"
                  value={form.emailPharmacie}
                  onChange={handleChange}
                  placeholder="Email professionnel"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="telephonePharmacie"
                  value={form.telephonePharmacie}
                  onChange={handleChange}
                  placeholder="Téléphone professionnel (ex: +228 XX XX XX XX)"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700"
              >
                Continuer
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Documents requis</h2>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  ← Retour
                </button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Documents nécessaires :</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Photo de la façade de votre pharmacie (JPEG/PNG, max 5MB)</li>
                  <li>• Licence d'exploitation</li>
                  <li>• Diplôme de pharmacien</li>
                  <li>• Justificatif d'adresse commercial</li>
                </ul>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-2">Photo de la pharmacie *</label>
                <div className="border-2 border-solid border-gray-300 rounded-lg p-6 text-center hover:border-green-400">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="photo-upload"
                    required
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <span className="text-green-600 font-medium">Cliquez pour sélectionner</span>
                    <p className="text-xs text-gray-400 mt-1">JPEG ou PNG, max 5MB</p>
                  </label>
                  {photoPharmacie && <p className="text-sm text-green-600 mt-2">✓ {photoPharmacie.name}</p>}
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-2">Documents justificatifs *</label>
                <div className="border-2 border-solid border-gray-300 rounded-lg p-6 text-center hover:border-green-400">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    multiple
                    onChange={handleDocumentsChange}
                    className="hidden"
                    id="docs-upload"
                    required
                  />
                  <label htmlFor="docs-upload" className="cursor-pointer">
                    <span className="text-green-600 font-medium">Sélectionner les documents</span>
                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG ou PDF, max 10MB chacun</p>
                  </label>
                  {documentsVerification.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {documentsVerification.map((file, index) => (
                        <p key={index} className="text-sm text-green-600">✓ {file.name}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer la demande'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}