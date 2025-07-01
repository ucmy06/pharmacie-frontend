// src/components/Auth/Login.js
import { useState } from 'react';
import { loginUser } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth'; // ✅ import nommé
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ email: '', motDePasse: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await loginUser(form);
      login(res.data.data.user, res.data.data.token);
      navigate('/'); // rediriger après connexion (ex: tableau de bord)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la connexion');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Connexion</h2>

      {error && <div className="text-red-500 mb-3">{error}</div>}

      <input
        type="email"
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        required
        className="border p-2 w-full mb-3"
      />
      <input
        type="password"
        name="motDePasse"
        value={form.motDePasse}
        onChange={handleChange}
        placeholder="Mot de passe"
        required
        className="border p-2 w-full mb-3"
      />

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
        Se connecter
      </button>

      <div className="mt-4 text-sm">
        <a href="/forgot-password" className="text-blue-600 hover:underline">
          Mot de passe oublié ?
        </a>
      </div>
    </form>
  );
}
