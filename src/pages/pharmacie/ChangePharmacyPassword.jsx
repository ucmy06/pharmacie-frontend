// C:\reactjs node mongodb\pharmacie-frontend\src\pages\pharmacie\ChangePharmacyPassword.jsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ChangePharmacyPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pharmacyToken, setPharmacyToken] = useState(null);
  const [pharmacyInfo, setPharmacyInfo] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('pharmacyToken');
    const info = localStorage.getItem('pharmacyInfo');

    console.log('🔍 Token trouvé:', token);
    console.log('ℹ️ Infos pharmacie:', info);

    if (!token) {
      console.log('❌ Pas de token, redirection vers connexion');
      navigate('/pharmacie/connexion');
      return;
    }

    setPharmacyToken(token);
    setPharmacyInfo(info ? JSON.parse(info) : null);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('pharmacyToken');
      console.log('🔑 Token utilisé:', token);
      
      if (!token) {
        setError('Session expirée, veuillez vous reconnecter');
        navigate('/pharmacie/connexion');
        return;
      }

      const response = await axios.post(
        'http://localhost:3001/api/pharmacies/changer-mot-de-passe',
        { nouveauMotDePasse: password },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('✅ Mot de passe changé avec succès:', response.data);
      
      // Rediriger vers le dashboard
      navigate('/pharmacie/dashboard');
      
    } catch (err) {
      console.error('❌ Erreur changement mot de passe:', err);
      
      if (err.response?.status === 401) {
        setError('Session expirée, veuillez vous reconnecter');
        localStorage.removeItem('pharmacyToken');
        localStorage.removeItem('pharmacyData');
        navigate('/pharmacie/connexion');
      } else {
        setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
      }
    } finally {
      setLoading(false);
    }
  };

   return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-6 bg-white shadow-lg rounded-lg">

        {/* Affichage token et infos pharmacie */}
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-300 rounded">
          <h3 className="font-semibold mb-2">Informations du localStorage</h3>
          <p><strong>Token pharmacie :</strong> {pharmacyToken ? pharmacyToken : 'Aucun token trouvé'}</p>
          <p><strong>Infos pharmacie :</strong></p>
          <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-2 rounded border border-gray-300 max-h-40 overflow-auto">
            {pharmacyInfo ? JSON.stringify(pharmacyInfo, null, 2) : 'Aucune info trouvée'}
          </pre>
        </div>

        {/* Ton formulaire de changement de mot de passe ici */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Changer votre mot de passe</h2>
          <p className="text-gray-600 mt-2">Veuillez définir un nouveau mot de passe sécurisé</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Entrez votre nouveau mot de passe"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirmez votre mot de passe"
              required
              minLength={6}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Changement en cours...' : 'Changer le mot de passe'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>⚠️ Choisissez un mot de passe sécurisé avec au moins 6 caractères</p>
        </div>
      </div>
    </div>
  );
}