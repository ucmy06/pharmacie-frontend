// C:\reactjs-node-mongodb\pharmacie-frontend\src\pages\ResetPasswordPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');

    if (password !== confirmPassword) {
      setError("❌ Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const res = await axiosInstance.post('/api/auth/reset-password', {
        token,
        nouveauMotDePasse: password
      });
      setMsg(res.data.message || "✅ Mot de passe réinitialisé avec succès.");

      // Rediriger après 3 secondes
      setTimeout(() => {
        navigate('/login', {
          state: { message: "Votre mot de passe a été réinitialisé avec succès. Veuillez vous connecter." }
        });
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "❌ Erreur serveur");
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">🔄 Réinitialisation du mot de passe</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          className="border p-2 w-full mb-3"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          className="border p-2 w-full mb-3"
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
        <button 
          type="submit"
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors w-full"
        >
          Réinitialiser
        </button>
      </form>

      {msg && (
        <p className="text-green-600 mt-4 text-center">
          {msg} <br /> Redirection en cours...
        </p>
      )}
      {error && (
        <p className="text-red-600 mt-4 text-center">{error}</p>
      )}
    </div>
  );
};

export default ResetPasswordPage;
