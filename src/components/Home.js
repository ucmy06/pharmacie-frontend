import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen font-sans relative overflow-hidden">
      {/* Background floating elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-blue-300 rounded-full opacity-20 animate-float" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-green-300 rounded-full opacity-20 animate-float" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-purple-300 rounded-full opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/3 right-1/3 w-12 h-12 bg-yellow-300 rounded-full opacity-20 animate-float" style={{animationDelay: '1.5s'}}></div>
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="bg-gradient-to-r from-blue-500 to-green-500" style={{
          backgroundImage: 'radial-gradient(#4facfe 0.5px, transparent 0.5px)',
          backgroundSize: '10px 10px'
        }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-blue-600">
              Pharm<span className="text-green-500">One</span>
            </h1>
            <div className="hidden md:flex space-x-4">
              <Link 
                to="/login" 
                className="px-4 py-2 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-all duration-200"
              >
                Se connecter
              </Link>
              <Link 
                to="/register" 
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 animate-pulse"
              >
                Créer un compte
              </Link>
            </div>
            <button className="md:hidden text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-4xl">
            <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-6 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              Bienvenue sur <span className="text-blue-600">Pharm</span><span className="text-green-500">One</span>
            </h1>
            <p className={`text-xl sm:text-2xl text-gray-600 mb-10 transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              Trouvez facilement vos médicaments disponibles dans les pharmacies autour de vous.
            </p>
            <div className={`flex flex-col sm:flex-row justify-center gap-4 transition-all duration-1000 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <Link 
                to="/register" 
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 text-lg hover:scale-105 transform shadow-lg hover:shadow-xl"
              >
                Créer un compte
              </Link>
              <Link 
                to="/login" 
                className="px-8 py-3 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-all duration-200 text-lg hover:scale-105 transform shadow-lg hover:shadow-xl"
              >
                Se connecter
              </Link>
            </div>
          </div>
          
          {/* Floating medicine illustration */}
          <div className="mt-16 relative w-64 h-64">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Pharmacie icon avec animation */}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-48 w-48 text-blue-400 animate-float" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="1.5" 
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                  />
                </svg>
                
                {/* Croix de pharmacie */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-16 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="w-16 h-6 bg-green-500 rounded-full absolute animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Features section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Recherche rapide</h3>
              <p className="text-gray-600">Trouvez vos médicaments en quelques clics</p>
            </div>

            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Géolocalisation</h3>
              <p className="text-gray-600">Pharmacies les plus proches de vous</p>
            </div>

            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Disponibilité 24/7</h3>
              <p className="text-gray-600">Informations en temps réel</p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>© 2025 PharmOne. Tous droits réservés.</p>
        </footer>
      </div>

      {/* Styles CSS personnalisés */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}