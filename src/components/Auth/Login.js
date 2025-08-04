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

  // Calculer le progrès de remplissage du formulaire
  const calculateProgress = () => {
    let progress = 0;
    
    // Email: 50% du progrès total
    if (form.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(form.email)) {
        progress += 50; // Email valide
      } else {
        progress += (form.email.length / 20) * 50; // Progression partielle basée sur la longueur
      }
    }
    
    // Mot de passe: 50% du progrès total
    if (form.motDePasse) {
      progress += (form.motDePasse.length / 8) * 50; // Progression basée sur la longueur (8 caractères = 100%)
    }
    
    return Math.min(progress, 100); // Limiter à 100%
  };

  const formProgress = calculateProgress();

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
      console.log('🔥 [Login] Réponse complète du serveur :', res.data);
      if (!res.data || !res.data.success) {
        console.error('❌ [Login] Réponse invalide:', res.data);
        throw new Error('Réponse invalide du serveur');
      }
      if (!res.data.data || !res.data.data.user || !res.data.data.token) {
        console.error('❌ [Login] Données manquantes:', res.data.data);
        throw new Error('Données utilisateur manquantes');
      }
      const { user, token } = res.data.data;
      if (typeof token !== 'string' || !token.includes('.')) {
        console.error('❌ [Login] Token invalide:', token);
        throw new Error('Token JWT invalide reçu');
      }
      let decoded;
      try {
        decoded = jwtDecode(token);
        console.log('🔑 [Login] Token décodé:', decoded);
      } catch (error) {
        console.error('❌ [Login] Erreur de décodage du token:', error);
        throw new Error('Token invalide');
      }
      if (decoded.role === 'pharmacie') {
        setError('Vous ne pouvez pas vous connecter en tant que pharmacie sur cette page. Veuillez d\'abord vous connecter en tant que client.');
        setLoading(false);
        return;
      }
      console.log('🔑 [Login] Stockage token:', token.slice(0, 10) + '...');
      localStorage.setItem('token', token);
      localStorage.setItem('userInfo', JSON.stringify(user));
      localStorage.removeItem('pharmacyToken');
      console.log('🔑 [Login] Token stocké:', localStorage.getItem('token'));
      console.log('🔑 [Login] User info:', user);
      login(token, user);
      if (res.data.motDePasseTemporaire === true) {
        console.log('⚠️ [Login] Mot de passe temporaire détecté - Redirection vers changement');
        navigate('/change-password', {
          state: { isTemporary: true, message: 'Veuillez changer votre mot de passe temporaire' },
          replace: true,
        });
        return;
      }
      console.log('🎯 [Login] Redirection selon le rôle:', user.role);
      let redirectPath = '/client-dashboard';
      if (user.role === 'admin') {
        redirectPath = '/admin-dashboard';
        console.log('👑 [Login] Redirection vers admin dashboard');
      } else if (user.role === 'client') {
        console.log('👤 [Login] Redirection vers client dashboard');
      } else {
        console.error('❌ [Login] Rôle inconnu:', user.role);
        throw new Error('Rôle utilisateur non reconnu');
      }
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('❌ [Login] Erreur de connexion:', err);
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
    <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen font-sans relative overflow-hidden">
      {/* Floating background elements with bouncing animations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Cercle 1 - Mouvement diagonal */}
        <div
          className="absolute w-32 h-32 rounded-full opacity-30 animate-bounce-diagonal-1"
          style={{ 
            background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.6), rgba(34, 197, 94, 0.6))',
            animationDuration: '8s',
            animationTimingFunction: 'linear'
          }}
        ></div>
        
        {/* Cercle 2 - Mouvement vertical */}
        <div
          className="absolute w-40 h-40 rounded-full opacity-25 animate-bounce-vertical-1"
          style={{ 
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.6), rgba(236, 72, 153, 0.6))',
            animationDuration: '10s',
            animationTimingFunction: 'linear',
            animationDelay: '2s'
          }}
        ></div>
        
        {/* Cercle 3 - Mouvement horizontal */}
        <div
          className="absolute w-36 h-36 rounded-full opacity-30 animate-bounce-horizontal-1"
          style={{ 
            background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.6), rgba(59, 130, 246, 0.6))',
            animationDuration: '12s',
            animationTimingFunction: 'linear',
            animationDelay: '4s'
          }}
        ></div>
        
        {/* Cercle 4 - Mouvement diagonal inverse */}
        <div
          className="absolute w-28 h-28 rounded-full opacity-35 animate-bounce-diagonal-2"
          style={{ 
            background: 'linear-gradient(225deg, rgba(236, 72, 153, 0.6), rgba(147, 51, 234, 0.6))',
            animationDuration: '9s',
            animationTimingFunction: 'linear',
            animationDelay: '1s'
          }}
        ></div>
        
        {/* Cercle 5 - Mouvement complexe */}
        <div
          className="absolute w-24 h-24 rounded-full opacity-25 animate-bounce-complex-1"
          style={{ 
            background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.6), rgba(236, 72, 153, 0.6))',
            animationDuration: '15s',
            animationTimingFunction: 'linear',
            animationDelay: '3s'
          }}
        ></div>
        
        {/* Cercle 6 - Mouvement vertical inverse */}
        <div
          className="absolute w-30 h-30 rounded-full opacity-30 animate-bounce-vertical-2"
          style={{ 
            background: 'linear-gradient(45deg, rgba(34, 197, 94, 0.6), rgba(147, 51, 234, 0.6))',
            animationDuration: '11s',
            animationTimingFunction: 'linear',
            animationDelay: '5s'
          }}
        ></div>
      </div>

      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="bg-gradient-to-r from-blue-500 to-green-500"
          style={{
            backgroundImage: 'radial-gradient(#4facfe 0.5px, transparent 0.5px)',
            backgroundSize: '10px 10px',
          }}
        ></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
            {/* Header */}
            <div className="text-center py-8 px-6 bg-gradient-to-r from-blue-50 to-green-50 border-b border-white/30">
              <h2 className="text-3xl font-bold text-blue-700">Connexion</h2>
              <p className="text-gray-600 mt-2">Accédez à votre espace PharmOne</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm text-center animate-pulse">
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300 ${
                      focusedField === 'email'
                        ? 'ring-2 ring-blue-400 shadow-md'
                        : 'border-gray-300 hover:border-blue-400'
                    } ${form.email ? 'border-green-400' : ''}`}
                    placeholder="votre@email.com"
                  />
                  {form.email && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300 ${
                      focusedField === 'motDePasse'
                        ? 'ring-2 ring-blue-400 shadow-md'
                        : 'border-gray-300 hover:border-blue-400'
                    } ${form.motDePasse ? 'border-green-400' : ''}`}
                    placeholder="Votre mot de passe"
                  />
                  {form.motDePasse && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Mécanisme d'animation du bouton */}
              <div className="relative h-24 overflow-hidden">
                {/* Engrenages décoratifs */}
                <div className="absolute left-4 top-2 opacity-20">
                  <div 
                    className="w-8 h-8 border-2 border-blue-400 rounded-full animate-spin-slow"
                    style={{ 
                      background: `conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #3b82f6 60deg, #3b82f6 120deg, transparent 120deg, transparent 180deg, #3b82f6 180deg, #3b82f6 240deg, transparent 240deg, transparent 300deg, #3b82f6 300deg, #3b82f6 360deg)`,
                      animationDuration: `${6 - (formProgress / 20)}s`
                    }}
                  ></div>
                </div>
                <div className="absolute right-4 top-1 opacity-20">
                  <div 
                    className="w-6 h-6 border-2 border-green-400 rounded-full animate-spin-reverse"
                    style={{ 
                      background: `conic-gradient(from 0deg, transparent 0deg, transparent 45deg, #22c55e 45deg, #22c55e 90deg, transparent 90deg, transparent 135deg, #22c55e 135deg, #22c55e 180deg, transparent 180deg, transparent 225deg, #22c55e 225deg, #22c55e 270deg, transparent 270deg, transparent 315deg, #22c55e 315deg, #22c55e 360deg)`,
                      animationDuration: `${4 - (formProgress / 25)}s`
                    }}
                  ></div>
                </div>

                {/* Barre de progression */}
                <div className="absolute left-1/2 transform -translate-x-1/2 top-1 w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
                    style={{ width: `${formProgress}%` }}
                  ></div>
                </div>

                {/* Texte de progression */}
                <div className="absolute left-1/2 transform -translate-x-1/2 top-4 text-xs text-gray-500 font-medium">
                  {formProgress < 25 && "Commencez à saisir..."}
                  {formProgress >= 25 && formProgress < 50 && "Continuez..."}
                  {formProgress >= 50 && formProgress < 80 && "Presque prêt..."}
                  {formProgress >= 80 && formProgress < 100 && "Finalisez..."}
                  {formProgress >= 100 && "✓ Prêt à se connecter !"}
                </div>

                {/* Bouton avec animation de montée */}
                <div 
                  className="absolute w-full transition-all duration-700 ease-out"
                  style={{ 
                    transform: `translateY(${96 - (formProgress * 0.7)}px)`,
                    opacity: formProgress > 10 ? 1 : 0.3
                  }}
                >
                  <button
                    type="submit"
                    disabled={loading || formProgress < 80}
                    className={`w-full py-3 px-4 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-500 transform shadow-md ${
                      formProgress >= 80 
                        ? 'bg-gradient-to-r from-blue-600 to-green-500 text-white hover:from-blue-700 hover:to-green-600 hover:scale-[1.02] active:scale-95 hover:shadow-lg cursor-pointer' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Connexion en cours...
                      </div>
                    ) : formProgress >= 100 ? (
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        Se connecter
                      </div>
                    ) : (
                      `Se connecter (${Math.round(formProgress)}%)`
                    )}
                  </button>
                </div>
              </div>

              {/* Links */}
              <div className="text-center pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-blue-600 hover:text-blue-800 underline transition-colors duration-200"
                >
                  Mot de passe oublié ?
                </button>
                <p className="text-gray-500 text-sm mt-2">
                  Pas encore de compte ?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="text-blue-600 font-medium hover:text-blue-800 transition-colors duration-200"
                  >
                    S'inscrire
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Animations CSS */}
      <style jsx>{`
        /* Animation de rebond diagonal 1 (coin supérieur gauche vers coin inférieur droit) */
        @keyframes bounceDiagonal1 {
          0% { 
            transform: translate(0px, 0px); 
          }
          25% { 
            transform: translate(calc(100vw - 128px), calc(25vh)); 
          }
          50% { 
            transform: translate(calc(75vw), calc(100vh - 128px)); 
          }
          75% { 
            transform: translate(calc(25vw), calc(75vh)); 
          }
          100% { 
            transform: translate(0px, 0px); 
          }
        }
        
        /* Animation de rebond vertical 1 */
        @keyframes bounceVertical1 {
          0% { 
            transform: translate(calc(80vw), 0px); 
          }
          50% { 
            transform: translate(calc(80vw), calc(100vh - 160px)); 
          }
          100% { 
            transform: translate(calc(80vw), 0px); 
          }
        }
        
        /* Animation de rebond horizontal 1 */
        @keyframes bounceHorizontal1 {
          0% { 
            transform: translate(0px, calc(60vh)); 
          }
          50% { 
            transform: translate(calc(100vw - 144px), calc(60vh)); 
          }
          100% { 
            transform: translate(0px, calc(60vh)); 
          }
        }
        
        /* Animation de rebond diagonal 2 (coin supérieur droit vers coin inférieur gauche) */
        @keyframes bounceDiagonal2 {
          0% { 
            transform: translate(calc(100vw - 112px), 0px); 
          }
          25% { 
            transform: translate(calc(25vw), calc(30vh)); 
          }
          50% { 
            transform: translate(0px, calc(100vh - 112px)); 
          }
          75% { 
            transform: translate(calc(75vw), calc(70vh)); 
          }
          100% { 
            transform: translate(calc(100vw - 112px), 0px); 
          }
        }
        
        /* Animation complexe en forme de 8 */
        @keyframes bounceComplex1 {
          0% { 
            transform: translate(calc(20vw), calc(20vh)); 
          }
          12.5% { 
            transform: translate(calc(60vw), calc(10vh)); 
          }
          25% { 
            transform: translate(calc(80vw), calc(30vh)); 
          }
          37.5% { 
            transform: translate(calc(60vw), calc(50vh)); 
          }
          50% { 
            transform: translate(calc(40vw), calc(40vh)); 
          }
          62.5% { 
            transform: translate(calc(20vw), calc(60vh)); 
          }
          75% { 
            transform: translate(calc(10vw), calc(80vh)); 
          }
          87.5% { 
            transform: translate(calc(30vw), calc(70vh)); 
          }
          100% { 
            transform: translate(calc(20vw), calc(20vh)); 
          }
        }
        
        /* Animation de rebond vertical 2 (inverse) */
        @keyframes bounceVertical2 {
          0% { 
            transform: translate(calc(15vw), calc(100vh - 120px)); 
          }
          50% { 
            transform: translate(calc(15vw), 0px); 
          }
          100% { 
            transform: translate(calc(15vw), calc(100vh - 120px)); 
          }
        }

        .animate-bounce-diagonal-1 {
          animation: bounceDiagonal1 var(--animation-duration, 8s) linear infinite;
        }
        
        .animate-bounce-vertical-1 {
          animation: bounceVertical1 var(--animation-duration, 10s) linear infinite;
        }
        
        .animate-bounce-horizontal-1 {
          animation: bounceHorizontal1 var(--animation-duration, 12s) linear infinite;
        }
        
        .animate-bounce-diagonal-2 {
          animation: bounceDiagonal2 var(--animation-duration, 9s) linear infinite;
        }
        
        .animate-bounce-complex-1 {
          animation: bounceComplex1 var(--animation-duration, 15s) linear infinite;
        }
        
        .animate-bounce-vertical-2 {
          animation: bounceVertical2 var(--animation-duration, 11s) linear infinite;
        }

        /* Animations pour les engrenages */
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 6s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 4s linear infinite;
        }
      `}</style>
    </div>
  );
}