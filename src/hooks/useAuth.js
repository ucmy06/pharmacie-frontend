// C:\reactjs node mongodb\pharmacie-frontend\src\hooks\useAuth.js
import { useContext, createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('userToken'));

  useEffect(() => {
    if (token) {
      const storedUser = JSON.parse(localStorage.getItem('userInfo'));
      setUser(storedUser);
    }
  }, [token]);

  // ✅ AJOUT : fonction login accessible par les composants
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('userInfo', JSON.stringify(userData));
    localStorage.setItem('userToken', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
