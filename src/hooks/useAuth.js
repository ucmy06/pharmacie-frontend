import { useContext, createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 [useAuth] Initialisation avec token:', token ? token.slice(0, 10) + '...' : 'NULL');
    if (token) {
      try {
        const storedUser = localStorage.getItem('userInfo');
        console.log('🔐 [useAuth] userInfo brut:', storedUser);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Normaliser user.id à partir de _id
          const normalizedUser = {
            ...parsedUser,
            id: parsedUser._id,
          };
          setUser(normalizedUser);
          console.log('✅ [useAuth] Utilisateur chargé:', normalizedUser);
        } else {
          console.warn('⚠️ [useAuth] userInfo absent');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ [useAuth] Erreur parsing userInfo:', error);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
    } else {
      console.warn('⚠️ [useAuth] Token absent');
      setUser(null);
    }
    setIsLoading(false);
  }, [token]);

  const login = (authToken, userData) => {
    console.log('🔐 [useAuth] Connexion:', { userData, token: authToken.slice(0, 10) + '...' });
    // Normaliser userData pour inclure id
    const normalizedUserData = {
      ...userData,
      id: userData._id,
    };
    setToken(authToken);
    setUser(normalizedUserData);
    localStorage.setItem('token', authToken);
    localStorage.setItem('userInfo', JSON.stringify(normalizedUserData));
  };

  const logout = () => {
    console.log('🔐 [useAuth] Déconnexion');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('pharmacyToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}