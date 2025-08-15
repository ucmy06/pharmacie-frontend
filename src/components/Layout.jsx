import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  // Journal pour déboguer l'état de l'utilisateur
  useEffect(() => {
    console.log('État de l\'utilisateur:', user);
  }, [user]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLogout = async () => {
    try {
      console.log('Déconnexion initiée');
      await logout();
      navigate('/login');
      setIsAccountMenuOpen(false);
      setIsSidebarOpen(false);
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      logout();
      navigate('/login');
      setIsAccountMenuOpen(false);
      setIsSidebarOpen(false);
    }
  };

  const navigateAndClose = (path) => {
    console.log(`Navigation vers: ${path}`);
    navigate(path);
    setIsSidebarOpen(false);
    setIsAccountMenuOpen(false);
  };

  const getSidebarButtons = () => {
    const hasAssociatedPharmacy = user && user.pharmaciesAssociees?.length > 0 && user.pharmaciesAssociees[0]?.pharmacyId;

    if (!user) {
      return [
        {
          label: 'Accueil',
          onClick: () => navigateAndClose('/'),
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        },
        {
          label: 'Connexion',
          onClick: () => navigateAndClose('/login'),
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
        }
      ];
    }

    const commonButtons = [
      {
        label: 'Accueil',
        onClick: () => navigateAndClose('/'),
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
      },
      {
        label: 'Mon profil',
        onClick: () => navigateAndClose('/profile'),
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      }
    ];

    if (user.role === 'admin') {
      return [
        ...commonButtons,
        {
          label: 'Dashboard Admin',
          onClick: () => navigateAndClose('/admin-dashboard'),
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        },
        {
          label: 'Base de données',
          onClick: () => navigateAndClose('/admin/pharmacies/database'),
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
        },
        {
          label: 'Demandes création',
          onClick: () => navigateAndClose('/admin/pharmacy-requests'),
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        },
        {
          label: 'Demandes modification',
          onClick: () => navigateAndClose('/admin/modification-requests'),
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        },
        {
          label: 'Images médicaments',
          onClick: () => navigateAndClose('/admin/ManageMedicamentImages'),
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        },
        {
          label: 'Gestion Clients',
          onClick: () => navigateAndClose('/admin/clients'),
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        },
        {
          label: 'Gestion Pharmacies',
          onClick: () => navigateAndClose('/admin/pharmacies'),
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        }
      ];
    } else {
      const clientButtons = [
        ...commonButtons,
        {
          label: 'Mon panier',
          onClick: () => navigateAndClose('/panier'),
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13a2 2 0 100 4 2 2 0 000-4zM9 19a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        },
        {
          label: 'Demande pharmacie',
          onClick: () => navigateAndClose('/demande-pharmacie'),
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        },
        {
          label: 'Dashboard Client',
          onClick: () => navigateAndClose('/client-dashboard'),
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        },
        {
          label: 'Ma demande',
          onClick: () => navigateAndClose('/ma-demande-pharmacie'),
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        }
      ];

      if (hasAssociatedPharmacy) {
        clientButtons.push({
          label: 'Connexion pharmacie',
          onClick: () => navigateAndClose('/pharmacie/connexion'),
          icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
        });
      }

      return clientButtons;
    }
  };

  const getAccountMenuOptions = () => {
    if (!user) return [];

    const options = [
      {
        label: 'Mon profil',
        onClick: () => navigateAndClose('/profile'),
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      },
      {
        label: 'Paramètres',
        onClick: () => navigateAndClose('/settings'),
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      }
    ];

    if (user.role === 'admin') {
      options.push({
        label: 'Gestion utilisateurs',
        onClick: () => navigateAndClose('/admin/users'),
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
      });
    }

    if (user.role === 'client') {
      options.push(
        {
          label: 'Mes commandes',
          onClick: () => navigateAndClose('/commandes'),
          icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M8 11h8m6 0a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a2 2 0 012-2h16z" /></svg>
        },
        {
          label: 'Mes favoris',
          onClick: () => navigateAndClose('/favorites'),
          icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        }
      );
    }

    return options;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* AppBar */}
      <header className={`bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
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
              onClick={() => navigateAndClose('/medicaments')} 
              className="px-4 py-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              Médicaments
            </button>       
            <button 
              onClick={() => navigateAndClose('/pharmacies')} 
              className="px-4 py-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              Pharmacies proches
            </button>
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    console.log('Clic sur le menu du compte');
                    setIsAccountMenuOpen(!isAccountMenuOpen);
                  }}
                  className="flex items-center space-x-3 px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{user.prenom?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="text-left">
                    <div className="text-slate-800 font-medium">{user.prenom} {user.nom}</div>
                    <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                  </div>
                  <svg className={`w-4 h-4 text-slate-500 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Menu déroulant du compte */}
                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                    {getAccountMenuOptions().map((option, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          console.log(`Clic sur ${option.label}`);
                          option.onClick();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-3 text-slate-700 transition-colors"
                      >
                        {option.icon}
                        <span>{option.label}</span>
                      </button>
                    ))}
                    <hr className="my-2 border-slate-200" />
                    <button
                      onClick={() => {
                        console.log('Clic sur Se déconnecter');
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center space-x-3 text-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => navigateAndClose('/login')} 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
              >
                Connexion
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Overlay pour fermer le menu compte */}
      {isAccountMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-30" 
          onClick={() => setIsAccountMenuOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed top-0 left-0 h-screen z-40 transition-all duration-300 ease-in-out bg-white border-r border-slate-200 shadow-lg
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isSidebarCollapsed ? 'w-16' : 'w-64'}
        `}>
          {/* Logo et titre */}
          <div className={`p-4 border-b border-slate-200 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className={`bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg ${isSidebarCollapsed ? 'w-10 h-10' : 'w-12 h-12'}`}>
                <div className={`bg-white rounded-full flex items-center justify-center ${isSidebarCollapsed ? 'w-6 h-6' : 'w-8 h-8'}`}>
                  <div className={`bg-blue-600 rounded-full ${isSidebarCollapsed ? 'w-3 h-3' : 'w-4 h-4'}`}></div>
                </div>
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    PharmOne
                  </h1>
                  {user && (
                    <p className="text-xs text-slate-500 capitalize">Espace {user.role}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bouton de collapse */}
          <div className={`px-4 py-2 border-b border-slate-200 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-end'}`}>
              <button 
                className="hidden lg:block p-2 rounded-lg hover:bg-slate-100 transition-colors" 
                onClick={toggleCollapse}
              >
                <svg className={`w-5 h-5 text-slate-600 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button 
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors" 
                onClick={toggleSidebar}
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
            {getSidebarButtons().map((button, index) => (
              <div key={index} className="relative">
                <button
                  onClick={() => {
                    console.log(`Clic sur ${button.label} (sidebar)`);
                    button.onClick();
                  }}
                  className={`
                    w-full text-left px-3 py-3 rounded-lg transition-all duration-200 
                    text-slate-700 hover:text-blue-600 hover:bg-blue-50 
                    border border-transparent hover:border-blue-100
                    flex items-center group
                    ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}
                  `}
                >
                  <div className={`${isSidebarCollapsed ? '' : 'flex-shrink-0'}`}>
                    {button.icon}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className="font-medium truncate">{button.label}</span>
                  )}
                </button>
                
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-slate-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {button.label}
                  </div>
                )}
              </div>
            ))}
            
            {user && (
              <div className="pt-4 mt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    console.log('Clic sur Se déconnecter (sidebar)');
                    handleLogout();
                  }}
                  className={`
                    w-full text-left px-3 py-3 rounded-lg transition-all duration-200 
                    text-red-600 hover:text-red-700 hover:bg-red-50 
                    border border-transparent hover:border-red-100
                    flex items-center group
                    ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}
                  `}
                >
                  <svg className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'flex-shrink-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {!isSidebarCollapsed && (
                    <span className="font-medium">Se déconnecter</span>
                  )}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-slate-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      Se déconnecter
                    </div>
                  )}
                </button>
              </div>
            )}
          </nav>

          {user && !isSidebarCollapsed && (
            <div className="pt-4 mt-4 border-t border-slate-200">
              <div className="px-3 py-2 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{user.prenom?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{user.prenom} {user.nom}</div>
                    <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>

        <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}