// C:\reactjs node mongodb\pharmacie-frontend\src\components\Auth\Login.js

import { useState } from 'react';
import { loginUser } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';


export default function Login() {
  const [form, setForm] = useState({ email: '', motDePasse: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginUser(form);
      console.log('🔥 Réponse complète du serveur :', res.data);

      // ✅ VÉRIFICATION DE LA STRUCTURE DE LA RÉPONSE
      if (!res.data || !res.data.success) {
        console.error('❌ Réponse invalide:', res.data);
        throw new Error('Réponse invalide du serveur');
      }

      if (!res.data.data || !res.data.data.user || !res.data.data.token) {
        console.error('❌ Données manquantes:', res.data.data);
        throw new Error('Données utilisateur manquantes');
      }

      // ✅ DÉCODAGE DU TOKEN
      const { user, token } = res.data.data;
      let decoded;
      try {
        decoded = jwtDecode(token);
        console.log('🔑 Token décodé:', decoded);
      } catch (error) {
        console.error('❌ Erreur de décodage du token:', error);
        throw new Error('Token invalide');
      }

      // ✅ VÉRIFIER LE RÔLE PHARMACIE
      if (decoded.role === 'pharmacie') {
        setError('Vous ne pouvez pas vous connecter en tant que pharmacie sur cette page. Veuillez d\'abord vous connecter en tant que client.');
        setLoading(false);
        return;
      }

      // ✅ CONNEXION DE L'UTILISATEUR
      login(user, token);
      localStorage.setItem('pharmacyToken', token);
      localStorage.setItem('userInfo', JSON.stringify(user));

      console.log('🔑 Token stocké:', token);
      console.log('🔑 User info:', user);
      const { role } = res.data.data.user;

      // ✅ GESTION DU MOT DE PASSE TEMPORAIRE
      if (res.data.motDePasseTemporaire === true) {
        console.log('⚠️ Mot de passe temporaire détecté - Redirection vers changement');
        navigate('/change-password', {
          state: {
            isTemporary: true,
            message: 'Veuillez changer votre mot de passe temporaire',
          },
          replace: true,
        });
        return;
      }

      // ✅ REDIRECTION SELON LE RÔLE
      console.log('🎯 Redirection selon le rôle:', role);
      let redirectPath = '/client-dashboard';

      if (role === 'admin') {
        redirectPath = '/admin-dashboard';
        console.log('👑 Redirection vers admin dashboard');
      } else if (role === 'client') {
        console.log('👤 Redirection vers client dashboard');
      } else {
        console.error('❌ Rôle inconnu:', role);
        throw new Error('Rôle utilisateur non reconnu');
      }

      navigate(redirectPath, { replace: true });

    } catch (err) {
      console.error('❌ Erreur de connexion:', err);
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setError('Veuillez vérifier votre email avant de vous connecter');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Erreur lors de la connexion. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-40"></div>
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-cyan-400 rounded-full animate-pulse opacity-30"></div>
        <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-pink-400 rounded-full animate-bounce opacity-50"></div>
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>

        <form
          onSubmit={handleSubmit}
          className="relative bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8 w-96 shadow-2xl"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Connexion</h2>
            <p className="text-gray-300 text-sm">Accédez à votre espace PharmOne</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg animate-pulse">
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="relative">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                E-mail
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => handleFocus('email')}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300 ${
                    focusedField === 'email' ? 'transform scale-105 shadow-lg shadow-cyan-500/25' : ''
                  } ${form.email ? 'border-green-400/50' : ''}`}
                  placeholder="votre@email.com"
                />
                {form.email && (
                  <div className="absolute right-3 top-3 text-green-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <label
                htmlFor="motDePasse"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="motDePasse"
                  name="motDePasse"
                  value={form.motDePasse}
                  onChange={handleChange}
                  onFocus={() => handleFocus('motDePasse')}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300 ${
                    focusedField === 'motDePasse' ? 'transform scale-105 shadow-lg shadow-cyan-500/25' : ''
                  } ${form.motDePasse ? 'border-green-400/50' : ''}`}
                  placeholder="Votre mot de passe"
                />
                {form.motDePasse && (
                  <div className="absolute right-3 top-3 text-green-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative z-10">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion en cours...
                  </div>
                ) : (
                  'Se connecter'
                )}
              </div>
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-cyan-400 hover:text-cyan-300 underline transition-colors duration-300"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <div className="text-center pt-4 border-t border-white/20">
              <p className="text-gray-400 text-sm">
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-300"
                >
                  S'inscrire
                </button>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}