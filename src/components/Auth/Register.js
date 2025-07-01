// src/components/Auth/Register.js
import { useState } from 'react';
import { registerUser } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth'; // ✅ import nommé

export default function Register() {
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    telephone: '',
  });
  const [error, setError] = useState(null);
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await registerUser(form);
      login(res.data.data.user, res.data.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l’inscription');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4 font-semibold">Inscription Client</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}

      <input name="nom" value={form.nom} onChange={handleChange} placeholder="Nom" className="border p-2 w-full mb-2" />
      <input name="prenom" value={form.prenom} onChange={handleChange} placeholder="Prénom" className="border p-2 w-full mb-2" />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="border p-2 w-full mb-2" />
      <input name="telephone" value={form.telephone} onChange={handleChange} placeholder="Téléphone" className="border p-2 w-full mb-2" />
      <input name="motDePasse" type="password" value={form.motDePasse} onChange={handleChange} placeholder="Mot de passe" className="border p-2 w-full mb-4" />

      <button className="bg-green-600 text-white px-4 py-2 rounded w-full">Créer un compte</button>
    </form>
  );
}
