// C:\reactjs node mongodb\pharmacie-frontend\src\pages\ForgotPasswordPage.jsx
import React, { useState } from 'react';
import axiosInstance from '../utils/axiosConfig'; // 🔁 au lieu de 'axios'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      const res = await axiosInstance.post('/api/auth/forgot-password', { email });
      setMsg(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur");
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">🔑 Mot de passe oublié</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          className="border p-2 w-full mb-3"
          placeholder="Votre email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Envoyer</button>
      </form>
      {msg && <p className="text-green-600 mt-3">{msg}</p>}
      {error && <p className="text-red-600 mt-3">{error}</p>}
    </div>
  );
};

export default ForgotPasswordPage;
