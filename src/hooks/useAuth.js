import { useContext, createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token')); // Changé de 'userToken' à 'token'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 [useAuth] Initialisation avec token:', token ? token.slice(0, 10) + '...' : 'NULL');
    if (token) {
      try {
        const storedUser = localStorage.getItem('userInfo');
        console.log('🔐 [useAuth] userInfo brut:', storedUser);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log('✅ [useAuth] Utilisateur chargé:', parsedUser);
        } else {
          console.warn('⚠️ [useAuth] userInfo absent');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ [useAuth] Erreur parsing userInfo:', error);
        localStorage.removeItem('userInfo');
        setUser(null);
      }
    } else {
      console.warn('⚠️ [useAuth] Token absent');
      setUser(null);
    }
    setIsLoading(false);
  }, [token]);

  const login = (authToken, userData) => { // Inversé l'ordre pour correspondre à Login.js
    console.log('🔐 [useAuth] Connexion:', { userData, token: authToken.slice(0, 10) + '...' });
    setToken(authToken);
    setUser(userData);
    localStorage.setItem('token', authToken); // Changé de 'userToken' à 'token'
    localStorage.setItem('userInfo', JSON.stringify(userData));
  };

  const logout = () => {
    console.log('🔐 [useAuth] Déconnexion');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('pharmacyToken'); // Nettoyage
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