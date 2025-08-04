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

  // Calculer le progrès de remplissage du formulaire
  const calculateProgress = () => {
    let progress = 0;
    const totalFields = 6;
    
    // Nom (16.67% du progrès total)
    if (form.nom.trim().length > 0) {
      progress += form.nom.trim().length >= 2 ? 16.67 : (form.nom.trim().length / 2) * 16.67;
    }
    
    // Prénom (16.67% du progrès total)
    if (form.prenom.trim().length > 0) {
      progress += form.prenom.trim().length >= 2 ? 16.67 : (form.prenom.trim().length / 2) * 16.67;
    }
    
    // Téléphone (16.67% du progrès total)
    if (form.telephone.trim().length > 0) {
      progress += form.telephone.trim().length >= 10 ? 16.67 : (form.telephone.trim().length / 10) * 16.67;
    }
    
    // Email (16.67% du progrès total)
    if (form.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(form.email)) {
        progress += 16.67; // Email valide
      } else {
        progress += (form.email.length / 15) * 16.67; // Progression partielle
      }
    }
    
    // Mot de passe (16.67% du progrès total)
    if (form.motDePasse) {
      progress += form.motDePasse.length >= 6 ? 16.67 : (form.motDePasse.length / 6) * 16.67;
    }
    
    // Confirmation mot de passe (16.67% du progrès total)
    if (form.confirmerMotDePasse) {
      if (form.confirmerMotDePasse === form.motDePasse && form.motDePasse.length >= 6) {
        progress += 16.67;
      } else {
        progress += (form.confirmerMotDePasse.length / form.motDePasse.length) * 8.33; // Progression partielle
      }
    }
    
    return Math.min(progress, 100); // Limiter à 100%
  };

  const formProgress = calculateProgress();

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
    <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen font-sans relative overflow-hidden">
      {/* Floating background elements with bouncing animations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Cercle 1 - Mouvement diagonal complexe */}
        <div
          className="absolute w-24 h-24 rounded-full opacity-25 animate-bounce-diagonal-1"
          style={{ 
            background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.6), rgba(34, 197, 94, 0.6))',
            animationDuration: '10s',
            animationTimingFunction: 'linear'
          }}
        ></div>
        
        {/* Cercle 2 - Mouvement vertical */}
        <div
          className="absolute w-32 h-32 rounded-full opacity-20 animate-bounce-vertical-1"
          style={{ 
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.6), rgba(236, 72, 153, 0.6))',
            animationDuration: '12s',
            animationTimingFunction: 'linear',
            animationDelay: '2s'
          }}
        ></div>
        
        {/* Cercle 3 - Mouvement horizontal */}
        <div
          className="absolute w-28 h-28 rounded-full opacity-25 animate-bounce-horizontal-1"
          style={{ 
            background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.6), rgba(59, 130, 246, 0.6))',
            animationDuration: '14s',
            animationTimingFunction: 'linear',
            animationDelay: '4s'
          }}
        ></div>
        
        {/* Cercle 4 - Mouvement diagonal inverse */}
        <div
          className="absolute w-20 h-20 rounded-full opacity-30 animate-bounce-diagonal-2"
          style={{ 
            background: 'linear-gradient(225deg, rgba(236, 72, 153, 0.6), rgba(147, 51, 234, 0.6))',
            animationDuration: '11s',
            animationTimingFunction: 'linear',
            animationDelay: '1s'
          }}
        ></div>
        
        {/* Cercle 5 - Mouvement complexe */}
        <div
          className="absolute w-26 h-26 rounded-full opacity-20 animate-bounce-complex-1"
          style={{ 
            background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.6), rgba(236, 72, 153, 0.6))',
            animationDuration: '16s',
            animationTimingFunction: 'linear',
            animationDelay: '3s'
          }}
        ></div>
        
        {/* Cercle 6 - Mouvement vertical inverse */}
        <div
          className="absolute w-22 h-22 rounded-full opacity-25 animate-bounce-vertical-2"
          style={{ 
            background: 'linear-gradient(45deg, rgba(34, 197, 94, 0.6), rgba(147, 51, 234, 0.6))',
            animationDuration: '13s',
            animationTimingFunction: 'linear',
            animationDelay: '5s'
          }}
        ></div>
        
        {/* Cercle 7 - Mouvement en spirale */}
        <div
          className="absolute w-18 h-18 rounded-full opacity-30 animate-bounce-spiral"
          style={{ 
            background: 'linear-gradient(270deg, rgba(168, 85, 247, 0.6), rgba(34, 197, 94, 0.6))',
            animationDuration: '18s',
            animationTimingFunction: 'linear',
            animationDelay: '6s'
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
        <div className="w-full max-w-xl">
          {/* Card */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
            {/* Header */}
            <div className="text-center py-8 px-6 bg-gradient-to-r from-blue-50 to-green-50 border-b border-white/30">
              <h2 className="text-3xl font-bold text-blue-700">Créer un compte</h2>
              <p className="text-gray-600 mt-2">Rejoignez PharmOne dès aujourd'hui</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Feedback */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm text-center animate-pulse">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-lg text-sm text-center animate-bounce">
                  {success}
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom */}
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    id="nom"
                    name="nom"
                    type="text"
                    value={form.nom}
                    onChange={handleChange}
                    onFocus={() => handleFocus('nom')}
                    onBlur={handleBlur}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300 ${
                      focusedField === 'nom'
                        ? 'ring-2 ring-blue-400 shadow-md'
                        : 'border-gray-300 hover:border-blue-400'
                    } ${getFieldValidation('nom') ? 'border-green-400' : ''}`}
                    placeholder="GUENOUKPATI"
                  />
                  {getFieldValidation('nom') && (
                    <div className="mt-1 text-green-500 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Valide
                    </div>
                  )}
                </div>

                {/* Prénom */}
                <div>
                  <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    id="prenom"
                    name="prenom"
                    type="text"
                    value={form.prenom}
                    onChange={handleChange}
                    onFocus={() => handleFocus('prenom')}
                    onBlur={handleBlur}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300 ${
                      focusedField === 'prenom'
                        ? 'ring-2 ring-blue-400 shadow-md'
                        : 'border-gray-300 hover:border-blue-400'
                    } ${getFieldValidation('prenom') ? 'border-green-400' : ''}`}
                    placeholder="Malike"
                  />
                  {getFieldValidation('prenom') && (
                    <div className="mt-1 text-green-500 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Valide
                    </div>
                  )}
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  value={form.telephone}
                  onChange={handleChange}
                  onFocus={() => handleFocus('telephone')}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300 ${
                    focusedField === 'telephone'
                      ? 'ring-2 ring-blue-400 shadow-md'
                      : 'border-gray-300 hover:border-blue-400'
                  } ${getFieldValidation('telephone') ? 'border-green-400' : ''}`}
                  placeholder="+228 98 35 04 49"
                />
                {getFieldValidation('telephone') && (
                  <div className="mt-1 text-green-500 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Valide
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => handleFocus('email')}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300 ${
                    focusedField === 'email'
                      ? 'ring-2 ring-blue-400 shadow-md'
                      : 'border-gray-300 hover:border-blue-400'
                  } ${getFieldValidation('email') ? 'border-green-400' : ''}`}
                  placeholder="votre@email.com"
                />
                {getFieldValidation('email') && (
                  <div className="mt-1 text-green-500 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Valide
                  </div>
                )}
              </div>

              {/* Mot de passe */}
              <div>
                <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <input
                  id="motDePasse"
                  name="motDePasse"
                  type="password"
                  value={form.motDePasse}
                  onChange={handleChange}
                  onFocus={() => handleFocus('motDePasse')}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300 ${
                    focusedField === 'motDePasse'
                      ? 'ring-2 ring-blue-400 shadow-md'
                      : 'border-gray-300 hover:border-blue-400'
                  } ${getFieldValidation('motDePasse') ? 'border-green-400' : ''}`}
                  placeholder="•••••••"
                />
                {getFieldValidation('motDePasse') && (
                  <div className="mt-1 text-green-500 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Min. 6 caractères
                  </div>
                )}
              </div>

              {/* Confirmer mot de passe */}
              <div>
                <label htmlFor="confirmerMotDePasse" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer mot de passe *
                </label>
                <input
                  id="confirmerMotDePasse"
                  name="confirmerMotDePasse"
                  type="password"
                  value={form.confirmerMotDePasse}
                  onChange={handleChange}
                  onFocus={() => handleFocus('confirmerMotDePasse')}
                  onBlur={handleBlur}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300 ${
                    focusedField === 'confirmerMotDePasse'
                      ? 'ring-2 ring-blue-400 shadow-md'
                      : 'border-gray-300 hover:border-blue-400'
                  } ${getFieldValidation('confirmerMotDePasse') ? 'border-green-400' : 'border-red-300'}`}
                  placeholder="•••••••"
                />
                {form.confirmerMotDePasse && (
                  <div className="mt-1 text-sm flex items-center">
                    {getFieldValidation('confirmerMotDePasse') ? (
                      <>
                        <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-green-500">Correspond</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className="text-red-500">Ne correspond pas</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mécanisme d'animation du bouton */}
              <div className="relative h-28 overflow-hidden">
                {/* Engrenages décoratifs multiples */}
                <div className="absolute left-2 top-2 opacity-15">
                  <div 
                    className="w-10 h-10 border-2 border-blue-400 rounded-full animate-spin-slow"
                    style={{ 
                      background: `conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #3b82f6 60deg, #3b82f6 120deg, transparent 120deg, transparent 180deg, #3b82f6 180deg, #3b82f6 240deg, transparent 240deg, transparent 300deg, #3b82f6 300deg, #3b82f6 360deg)`,
                      animationDuration: `${8 - (formProgress / 15)}s`
                    }}
                  ></div>
                </div>
                <div className="absolute right-2 top-1 opacity-15">
                  <div 
                    className="w-8 h-8 border-2 border-green-400 rounded-full animate-spin-reverse"
                    style={{ 
                      background: `conic-gradient(from 0deg, transparent 0deg, transparent 45deg, #22c55e 45deg, #22c55e 90deg, transparent 90deg, transparent 135deg, #22c55e 135deg, #22c55e 180deg, transparent 180deg, transparent 225deg, #22c55e 225deg, #22c55e 270deg, transparent 270deg, transparent 315deg, #22c55e 315deg, #22c55e 360deg)`,
                      animationDuration: `${6 - (formProgress / 20)}s`
                    }}
                  ></div>
                </div>
                <div className="absolute left-16 top-3 opacity-10">
                  <div 
                    className="w-6 h-6 border-2 border-purple-400 rounded-full animate-spin-slow"
                    style={{ 
                      background: `conic-gradient(from 0deg, transparent 0deg, transparent 90deg, #a855f7 90deg, #a855f7 180deg, transparent 180deg, transparent 270deg, #a855f7 270deg, #a855f7 360deg)`,
                      animationDuration: `${5 - (formProgress / 25)}s`
                    }}
                  ></div>
                </div>

                {/* Barre de progression multi-segments */}
                <div className="absolute left-1/2 transform -translate-x-1/2 top-1 w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-500 ease-out relative"
                    style={{ width: `${formProgress}%` }}
                  >
                    {/* Effet de brillance */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                  </div>
                </div>

                {/* Indicateurs de progression détaillés */}
                <div className="absolute left-1/2 transform -translate-x-1/2 top-5 text-xs text-gray-500 font-medium text-center">
                  {formProgress < 20 && "🚀 Commencez votre inscription..."}
                  {formProgress >= 20 && formProgress < 40 && "📝 Continuez à remplir..."}
                  {formProgress >= 40 && formProgress < 60 && "📧 Ajoutez votre email..."}
                  {formProgress >= 60 && formProgress < 80 && "🔒 Sécurisez votre compte..."}
                  {formProgress >= 80 && formProgress < 95 && "🔄 Confirmez votre mot de passe..."}
                  {formProgress >= 95 && "✅ Tout est prêt ! Créez votre compte"}
                </div>

                {/* Compteur de progression */}
                <div className="absolute right-4 top-4 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-bold text-gray-600">
                  {Math.round(formProgress)}%
                </div>

                {/* Bouton avec animation de montée progressive */}
                <div 
                  className="absolute w-full transition-all duration-700 ease-out"
                  style={{ 
                    transform: `translateY(${112 - (formProgress * 0.8)}px)`,
                    opacity: formProgress > 5 ? 1 : 0.2
                  }}
                >
                  <button
                    type="submit"
                    disabled={loading || formProgress < 85}
                    className={`w-full py-3 px-4 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-500 transform shadow-md ${
                      formProgress >= 85
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
                        Création en cours...
                      </div>
                    ) : formProgress >= 95 ? (
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        Créer mon compte
                      </div>
                    ) : (
                      `Créer mon compte (${Math.round(formProgress)}%)`
                    )}
                  </button>
                </div>
              </div>

              {/* Links */}
              <div className="text-center pt-4 border-t border-gray-100 mt-6">
                <p className="text-gray-500 text-sm">
                  Déjà un compte ?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-blue-600 font-medium hover:text-blue-800 transition-colors duration-200 underline"
                  >
                    Se connecter
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Animations CSS */}
      <style jsx>{`
        /* Animations de rebond pour les cercles */
        @keyframes bounceDiagonal1 {
          0% { transform: translate(0px, 0px); }
          25% { transform: translate(calc(100vw - 96px), calc(25vh)); }
          50% { transform: translate(calc(75vw), calc(100vh - 96px)); }
          75% { transform: translate(calc(25vw), calc(75vh)); }
          100% { transform: translate(0px, 0px); }
        }
        
        @keyframes bounceVertical1 {
          0% { transform: translate(calc(85vw), 0px); }
          50% { transform: translate(calc(85vw), calc(100vh - 128px)); }
          100% { transform: translate(calc(85vw), 0px); }
        }
        
        @keyframes bounceHorizontal1 {
          0% { transform: translate(0px, calc(70vh)); }
          50% { transform: translate(calc(100vw - 112px), calc(70vh)); }
          100% { transform: translate(0px, calc(70vh)); }
        }
        
        @keyframes bounceDiagonal2 {
          0% { transform: translate(calc(100vw - 80px), 0px); }
          25% { transform: translate(calc(30vw), calc(35vh)); }
          50% { transform: translate(0px, calc(100vh - 80px)); }
          75% { transform: translate(calc(70vw), calc(65vh)); }
          100% { transform: translate(calc(100vw - 80px), 0px); }
        }
        
        @keyframes bounceComplex1 {
          0% { transform: translate(calc(25vw), calc(15vh)); }
          12.5% { transform: translate(calc(65vw), calc(5vh)); }
          25% { transform: translate(calc(90vw), calc(25vh)); }
          37.5% { transform: translate(calc(70vw), calc(45vh)); }
          50% { transform: translate(calc(45vw), calc(35vh)); }
          62.5% { transform: translate(calc(15vw), calc(55vh)); }
          75% { transform: translate(calc(5vw), calc(75vh)); }
          87.5% { transform: translate(calc(35vw), calc(85vh)); }
          100% { transform: translate(calc(25vw), calc(15vh)); }
        }
        
        @keyframes bounceVertical2 {
          0% { transform: translate(calc(10vw), calc(100vh - 88px)); }
          50% { transform: translate(calc(10vw), 0px); }
          100% { transform: translate(calc(10vw), calc(100vh - 88px)); }
        }
        
        @keyframes bounceSpiral {
          0% { transform: translate(calc(50vw), calc(20vh)) rotate(0deg); }
          25% { transform: translate(calc(80vw), calc(50vh)) rotate(90deg); }
          50% { transform: translate(calc(50vw), calc(80vh)) rotate(180deg); }
          75% { transform: translate(calc(20vw), calc(50vh)) rotate(270deg); }
          100% { transform: translate(calc(50vw), calc(20vh)) rotate(360deg); }
        }

        .animate-bounce-diagonal-1 {
          animation: bounceDiagonal1 var(--animation-duration, 10s) linear infinite;
        }
        
        .animate-bounce-vertical-1 {
          animation: bounceVertical1 var(--animation-duration, 12s) linear infinite;
        }
        
        .animate-bounce-horizontal-1 {
          animation: bounceHorizontal1 var(--animation-duration, 14s) linear infinite;
        }
        
        .animate-bounce-diagonal-2 {
          animation: bounceDiagonal2 var(--animation-duration, 11s) linear infinite;
        }
        
        .animate-bounce-complex-1 {
          animation: bounceComplex1 var(--animation-duration, 16s) linear infinite;
        }
        
        .animate-bounce-vertical-2 {
          animation: bounceVertical2 var(--animation-duration, 13s) linear infinite;
        }
        
        .animate-bounce-spiral {
          animation: bounceSpiral var(--animation-duration, 18s) linear infinite;
        }

        /* Animations pour les engrenages */
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 6s linear infinite;
        }
      `}</style>
    </div>
  );
}