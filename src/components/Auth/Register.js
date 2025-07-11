// Register.jsx
import { useState } from 'react';
import { registerUser } from '../../services/authService';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    confirmerMotDePasse: '',
    telephone: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleFocus = (fieldName) => setFocusedField(fieldName);
  const handleBlur = () => setFocusedField('');

  const validateForm = () => {
    if (!form.nom.trim()) return setError('Le nom est requis');
    if (!form.prenom.trim()) return setError('Le prénom est requis');
    if (!form.telephone.trim()) return setError('Le téléphone est requis');
    if (!form.email.trim()) return setError("L'email est requis");
    if (!form.motDePasse) return setError('Le mot de passe est requis');
    if (form.motDePasse.length < 6) return setError('Mot de passe min. 6 caractères');
    if (form.motDePasse !== form.confirmerMotDePasse) return setError('Mots de passe différents');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return setError("Format d'email invalide");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { confirmerMotDePasse, ...userData } = form;
      const res = await registerUser(userData);
      if (res.data.success) {
        setSuccess('Compte créé avec succès ! Vérifiez votre email.');
        setForm({ nom: '', prenom: '', email: '', motDePasse: '', confirmerMotDePasse: '', telephone: '' });
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const getFieldValidation = (field) => {
    switch (field) {
      case 'nom': return form.nom.trim().length > 0;
      case 'prenom': return form.prenom.trim().length > 0;
      case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
      case 'telephone': return form.telephone.trim().length > 0;
      case 'motDePasse': return form.motDePasse.length >= 6;
      case 'confirmerMotDePasse': return form.confirmerMotDePasse === form.motDePasse && form.motDePasse.length >= 6;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-40"></div>
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-cyan-400 rounded-full animate-pulse opacity-30"></div>
        <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-pink-400 rounded-full animate-bounce opacity-50"></div>
      </div>

      <div className="relative group w-full max-w-xl">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>

        <form 
          onSubmit={handleSubmit}
          className="relative bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8 w-full shadow-2xl"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Créer un compte</h2>
            <p className="text-gray-300 text-sm">Rejoignez PharmOne dès aujourd'hui</p>
          </div>

          {error && <p className="bg-red-500/10 text-red-300 p-3 rounded mb-4 text-sm animate-pulse">{error}</p>}
          {success && <p className="bg-green-500/10 text-green-300 p-3 rounded mb-4 text-sm animate-bounce">{success}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300">Nom *</label>
              <input name="nom" type="text" value={form.nom} onChange={handleChange} onFocus={() => handleFocus('nom')} onBlur={handleBlur} placeholder="Nom" className="input" />
            </div>
            <div>
              <label className="text-sm text-gray-300">Prénom *</label>
              <input name="prenom" type="text" value={form.prenom} onChange={handleChange} onFocus={() => handleFocus('prenom')} onBlur={handleBlur} placeholder="Prénom" className="input" />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm text-gray-300">Téléphone *</label>
            <input name="telephone" type="tel" value={form.telephone} onChange={handleChange} onFocus={() => handleFocus('telephone')} onBlur={handleBlur} placeholder="Téléphone" className="input" />
          </div>

          <div className="mt-4">
            <label className="text-sm text-gray-300">Email *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} onFocus={() => handleFocus('email')} onBlur={handleBlur} placeholder="Email" className="input" />
          </div>

          <div className="mt-4">
            <label className="text-sm text-gray-300">Mot de passe *</label>
            <input name="motDePasse" type="password" value={form.motDePasse} onChange={handleChange} onFocus={() => handleFocus('motDePasse')} onBlur={handleBlur} placeholder="Mot de passe" className="input" />
          </div>

          <div className="mt-4">
            <label className="text-sm text-gray-300">Confirmer mot de passe *</label>
            <input name="confirmerMotDePasse" type="password" value={form.confirmerMotDePasse} onChange={handleChange} onFocus={() => handleFocus('confirmerMotDePasse')} onBlur={handleBlur} placeholder="Confirmez" className="input" />
          </div>

          <button type="submit" disabled={loading} className="mt-6 w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95">
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>

          <p className="text-center text-gray-400 text-sm mt-4">
            Déjà un compte ?{' '}
            <button type="button" onClick={() => navigate('/login')} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-300">
              Se connecter
            </button>
          </p>
        </form>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.75rem;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          color: white;
          placeholder-color: rgba(255, 255, 255, 0.5);
          outline: none;
          transition: all 0.3s ease;
        }
        .input:focus {
          border-color: #22d3ee;
          box-shadow: 0 0 0 2px #22d3ee44;
        }
      `}</style>
    </div>
  );
}
