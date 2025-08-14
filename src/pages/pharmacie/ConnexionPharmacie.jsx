import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ConnexionPharmacie() {
  const [form, setForm] = useState({ password: '' });
  const [emailPharmacie, setEmailPharmacie] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, token } = useAuth();

  useEffect(() => {
    console.log('🔍 [PharmacyLogin] État initial:', { user });
    if (!user || !token) {
      setError('Vous devez être connecté en tant que client');
      console.warn('⚠️ [PharmacyLogin] Aucun client connecté');
      toast.error('Vous devez être connecté en tant que client');
      navigate('/login');
      return;
    }

    // Récupérer l'email depuis pharmaciesAssociees
    const pharmacy = user.pharmaciesAssociees?.[0]; // Prend la première pharmacie associée
    if (!pharmacy || !pharmacy.pharmacyId) {
      setError('Aucune pharmacie associée trouvée');
      console.warn('⚠️ [PharmacyLogin] Aucune pharmacie associée:', { userId: user?._id });
      toast.error('Aucune pharmacie associée trouvée');
      return;
    }

    // Requête API pour récupérer l'email de la pharmacie
    const fetchPharmacyEmail = async () => {
      try {
        console.log('📤 [PharmacyLogin] Récupération email pharmacie:', pharmacy.pharmacyId);
        const res = await axios.get(`http://localhost:3001/api/pharmacies/by-id/${pharmacy.pharmacyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const pharmacyEmail = res.data.email;
        setEmailPharmacie(pharmacyEmail);
        console.log('✅ [PharmacyLogin] Email pharmacie récupéré:', pharmacyEmail);
      } catch (err) {
        console.error('❌ [PharmacyLogin] Erreur récupération email:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });
        setError('Erreur lors de la récupération des informations de la pharmacie');
        toast.error('Erreur lors de la récupération des informations de la pharmacie');
      }
    };

    fetchPharmacyEmail();
  }, [user, token, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!emailPharmacie) {
      setError('Aucune pharmacie associée trouvée');
      console.warn('⚠️ [PharmacyLogin] Aucune pharmacie associée:', { userId: user?._id });
      toast.error('Aucune pharmacie associée trouvée');
      setLoading(false);
      return;
    }

    const payload = {
      email: emailPharmacie,
      motDePasse: form.password,
      clientConnecte: {
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
      },
    };

    console.log('📤 [PharmacyLogin] Payload:', payload);

    try {
      console.log('📤 [PharmacyLogin] Appel API:', 'http://localhost:3001/api/pharmacies/login');
      const res = await axios.post('http://localhost:3001/api/pharmacies/login', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('✅ [PharmacyLogin] Réponse:', res.data);
      const { token: pharmacyToken, pharmacie, doitChangerMotDePasse } = res.data;

      // Log détaillé du token décodé
      const decodedToken = JSON.parse(atob(pharmacyToken.split('.')[1]));
      console.log('🔑 [PharmacyLogin] Decoded pharmacyToken:', JSON.stringify(decodedToken, null, 2));

      localStorage.setItem('pharmacyToken', pharmacyToken);
      localStorage.setItem('pharmacyInfo', JSON.stringify(pharmacie));

      toast.success('Connexion à la pharmacie réussie');
      navigate(doitChangerMotDePasse ? '/pharmacie/change-password' : '/pharmacie/dashboard');
    } catch (err) {
      console.error('❌ [PharmacyLogin] Erreur API:', {
        url: err.config?.url,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      const errorMessage = err.response?.data?.message || 'Erreur de connexion';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded">
      <ToastContainer />
      <h2 className="text-2xl font-bold mb-4">Connexion Pharmacie</h2>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      {emailPharmacie && (
        <>
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
            Email Pharmacie: {emailPharmacie}
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              name="password"
              placeholder="Mot de passe de la pharmacie"
              value={form.password}
              onChange={handleChange}
              className="w-full p-2 border my-2 rounded"
              required
              disabled={loading}
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white p-2 mt-2 rounded hover:bg-green-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}