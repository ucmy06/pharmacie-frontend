// C:\reactjs node mongodb\pharmacie-frontend\src\pages\pharmacie\ConnexionPharmacie.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

export default function PharmacyLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!token || !user) {
      setError('Vous devez être connecté en tant que client');
      console.warn('⚠️ [PharmacyLogin] Aucun client connecté');
      navigate('/login');
      setLoading(false);
      return;
    }

    const payload = {
      email: form.email,
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
      const res = await axios.post('http://localhost:3001/api/pharmacies/login', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('✅ [PharmacyLogin] Réponse:', res.data);
      const { token: pharmacyToken, pharmacie } = res.data;

      // Log détaillé du token décodé
      const decodedToken = JSON.parse(atob(pharmacyToken.split('.')[1]));
      console.log('🔑 [PharmacyLogin] Decoded pharmacyToken:', JSON.stringify(decodedToken, null, 2));

      localStorage.setItem('pharmacyToken', pharmacyToken);
      localStorage.setItem('pharmacyInfo', JSON.stringify(pharmacie));

      navigate(res.data.doitChangerMotDePasse ? '/pharmacie/change-password' : '/pharmacie/dashboard');
    } catch (err) {
      console.error('❌ [PharmacyLogin] Erreur:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded">
      <h2 className="text-2xl font-bold mb-4">Connexion Pharmacie</h2>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email pharmacie"
          value={form.email}
          onChange={handleChange}
          className="w-full p-2 border my-2 rounded"
          required
          disabled={loading}
        />
        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
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
    </div>
  );
}