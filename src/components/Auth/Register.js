// C:\reactjs node mongodb\pharmacie-frontend\src\components\Auth\Register.js
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Effacer les messages d'erreur quand l'utilisateur modifie les champs
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const validateForm = () => {
    if (!form.nom.trim()) {
      setError('Le nom est requis');
      return false;
    }
    if (!form.prenom.trim()) {
      setError('Le prénom est requis');
      return false;
    }
    if (!form.email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    if (!form.telephone.trim()) {
      setError('Le téléphone est requis');
      return false;
    }
    if (!form.motDePasse) {
      setError('Le mot de passe est requis');
      return false;
    }
    if (form.motDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (form.motDePasse !== form.confirmerMotDePasse) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    
    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Format d\'email invalide');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Enlever le champ confirmerMotDePasse avant d'envoyer
      const { confirmerMotDePasse, ...userData } = form;
      
      const res = await registerUser(userData);
      
      if (res.data.success) {
        setSuccess('Compte créé avec succès ! Vérifiez votre email pour activer votre compte.');
        
        // Réinitialiser le formulaire
        setForm({
          nom: '',
          prenom: '',
          email: '',
          motDePasse: '',
          confirmerMotDePasse: '',
          telephone: '',
        });
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
      
    } catch (err) {
      console.error('Erreur inscription:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Créer un compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Rejoignez PharmOne dès aujourd'hui
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* Messages d'erreur et succès */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Nom */}
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                Nom *
              </label>
              <input
                id="nom"
                name="nom"
                type="text"
                required
                value={form.nom}
                onChange={handleChange}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Votre nom"
              />
            </div>
            
            {/* Prénom */}
            <div>
              <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">
                Prénom *
              </label>
              <input
                id="prenom"
                name="prenom"
                type="text"
                required
                value={form.prenom}
                onChange={handleChange}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Votre prénom"
              />
            </div>
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="votre@email.com"
              />
            </div>
            
            {/* Téléphone */}
            <div>
              <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                Téléphone *
              </label>
              <input
                id="telephone"
                name="telephone"
                type="tel"
                required
                value={form.telephone}
                onChange={handleChange}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Votre numéro de téléphone"
              />
            </div>
            
            {/* Mot de passe */}
            <div>
              <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700">
                Mot de passe *
              </label>
              <input
                id="motDePasse"
                name="motDePasse"
                type="password"
                required
                value={form.motDePasse}
                onChange={handleChange}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Minimum 6 caractères"
              />
            </div>
            
            {/* Confirmer mot de passe */}
            <div>
              <label htmlFor="confirmerMotDePasse" className="block text-sm font-medium text-gray-700">
                Confirmer le mot de passe *
              </label>
              <input
                id="confirmerMotDePasse"
                name="confirmerMotDePasse"
                type="password"
                required
                value={form.confirmerMotDePasse}
                onChange={handleChange}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Confirmez votre mot de passe"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création en cours...
                </div>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Déjà un compte ?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-green-600 hover:text-green-500"
              >
                Se connecter
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}