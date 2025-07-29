import { useState } from 'react';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fonction pour fermer la sidebar après navigation
  const navigateAndClose = (path) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  // Fonction pour déterminer les boutons selon le rôle
  const getSidebarButtons = () => {
    if (!user) {
      return [
        {
          label: 'Accueil',
          onClick: () => navigateAndClose('/'),
          icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
        },
        {
          label: 'Connexion',
          onClick: () => navigateAndClose('/login'),
          icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1'
        }
      ];
    }

    const commonButtons = [
      {
        label: 'Accueil',
        onClick: () => navigateAndClose('/'),
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
      }
    ];

    if (user.role === 'admin') {
      return [
        ...commonButtons,
        {
          label: 'dashboard admin',
          onClick: () => navigateAndClose('/admin-dashboard'),
          icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4'
        },
        {
          label: 'Base de données',
          onClick: () => navigateAndClose('/admin/pharmacies/database'),
          icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4'
        },
        {
          label: 'Demandes création',
          onClick: () => navigateAndClose('/admin/pharmacy-requests'),
          icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
        },

        {
          label: 'Demandes modification',
          onClick: () => navigateAndClose('/admin/modification-requests'),
          icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
        },
        {
          label: 'Sélectionner pharmacie',
          onClick: () => navigateAndClose('/admin/select-pharmacy-for-medicaments'),
          icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
        },
        {
          label: 'Images médicaments',
          onClick: () => navigateAndClose('/admin/ManageMedicamentImages'),
          icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
        }
      ];
    } else {
      return [
        ...commonButtons,
        {
          label: 'Mon panier',
          onClick: () => navigateAndClose('/panier'),
          icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13a2 2 0 100 4 2 2 0 000-4zM9 19a2 2 0 11-4 0 2 2 0 014 0z'
        },
        {
          label: 'Demande pharmacie',
          onClick: () => navigateAndClose('/demande-pharmacie'),
          icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
        },

        {
          label: 'dashboard client',
          onClick: () => navigateAndClose('/client-dashboard'),
          icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
        },


        {
          label: 'Ma demande',
          onClick: () => navigateAndClose('/ma-demande-pharmacie'),
          icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
        },
        {
          label: 'Connexion pharmacie',
          onClick: () => navigateAndClose('/pharmacie/connexion'),
          icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z'
        }
      ];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* AppBar */}
      <header className={`bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={toggleSidebar}
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                </div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                PharmOne
              </h1>
            </div>
          </div>

          <nav className="hidden lg:flex items-center space-x-6">

             <button 
              onClick={() => navigate('/medicaments')} 
              className="px-4 py-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              Medicaments
            </button>       

            <button 
              onClick={() => navigate('/pharmacies')} 
              className="px-4 py-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              Pharmacies proches
            </button>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-3 py-2 bg-slate-100 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{user.prenom?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-slate-700 font-medium">{user.prenom}</span>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <button 
                onClick={() => navigate('/login')} 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
              >
                Connexion
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Overlay pour mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 lg:hidden top-0"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed top-0 left-0 h-screen z-50 transition-all duration-300 ease-in-out bg-white border-r border-slate-200 shadow-lg
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isSidebarCollapsed ? 'w-16' : 'w-64'}
        `}>
          {/* Sidebar Header */}
          <div className={`p-4 border-b border-slate-200 flex items-center mt-16 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isSidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">Navigation</h2>
                  {user && (
                    <p className="text-xs text-slate-500 capitalize">{user.role || 'Client'}</p>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <button 
                className="hidden lg:block p-2 rounded-lg hover:bg-slate-100 transition-colors" 
                onClick={toggleCollapse}
              >
                <svg className={`w-4 h-4 text-slate-600 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button 
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors" 
                onClick={toggleSidebar}
              >
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            {getSidebarButtons().map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                className={`
                  w-full text-left px-3 py-3 rounded-lg transition-all duration-200 
                  text-slate-700 hover:text-blue-600 hover:bg-blue-50 
                  border border-transparent hover:border-blue-100
                  flex items-center group
                  ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}
                `}
                title={isSidebarCollapsed ? button.label : ''}
              >
                <svg className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'flex-shrink-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={button.icon} />
                </svg>
                {!isSidebarCollapsed && (
                  <span className="font-medium">{button.label}</span>
                )}
                
                {/* Tooltip pour sidebar collapsed */}
                {isSidebarCollapsed && (
                  <div className="absolute left-16 bg-slate-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {button.label}
                  </div>
                )}
              </button>
            ))}

            {/* Bouton de déconnexion pour utilisateurs connectés */}
            {user && (
              <div className="pt-4 mt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full text-left px-3 py-3 rounded-lg transition-all duration-200 
                    text-red-600 hover:text-red-700 hover:bg-red-50 
                    border border-transparent hover:border-red-100
                    flex items-center group
                    ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}
                  `}
                  title={isSidebarCollapsed ? 'Se déconnecter' : ''}
                >
                  <svg className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'flex-shrink-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {!isSidebarCollapsed && (
                    <span className="font-medium">Se déconnecter</span>
                  )}
                  
                  {/* Tooltip pour sidebar collapsed */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-16 bg-slate-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Se déconnecter
                    </div>
                  )}
                </button>
              </div>
            )}
          </nav>
        </aside>

        {/* Contenu principal */}
        <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}