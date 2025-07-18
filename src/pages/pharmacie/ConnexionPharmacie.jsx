
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

    // 🔎 Vérification client connecté
    if (!token || !user) {
      console.warn('Aucun client connecté. Redirection...');
      setError('Vous devez être connecté en tant que client pour accéder à cette page');
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
        telephone: user.telephone
      }
    };

    console.log('📤 Données envoyées au backend :', payload);
    console.log('📦 Token client envoyé :', token);

    try {
      const res = await axios.post(
        'http://localhost:3001/api/pharmacies/login',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Connexion pharmacie réussie :', res.data);

      const tokenPharmacie = res.data.token;
      const pharmacieData = res.data.pharmacie;

      // 🔐 Stockage des infos
      localStorage.setItem('pharmacyToken', tokenPharmacie);
      localStorage.setItem('pharmacyInfo', JSON.stringify(pharmacieData));
      localStorage.setItem('clientInfo', JSON.stringify(user));

      if (res.data.doitChangerMotDePasse) {
        console.log('🔐 Redirection vers changement de mot de passe');
        navigate('/pharmacie/change-password');
      } else {
        console.log('🚀 Redirection vers dashboard pharmacie');
        navigate('/pharmacie/dashboard');
      }

    } catch (err) {
      console.error('❌ Erreur de connexion pharmacie :', err);

      if (err.response) {
        console.warn('🛑 Erreur backend :', err.response.data);
        setError(err.response.data?.message || 'Erreur de connexion à la pharmacie');
      } else if (err.request) {
        console.warn('📡 Aucune réponse serveur');
        setError('Impossible de contacter le serveur');
      } else {
        console.warn('⚠️ Erreur inconnue');
        setError('Erreur lors de la connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded">
      <h2 className="text-2xl font-bold mb-4">Connexion Pharmacie</h2>

      {user && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-700">
            Connecté en tant que : {user.prenom} {user.nom}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

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
