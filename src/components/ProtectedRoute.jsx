import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    setIsAuthenticated(!!token);

    // ⏱️ Ajout d’un petit délai pour simuler un rechargement
    const timeout = setTimeout(() => {
      setIsChecking(false);
    }, 500); // 500 ms

    return () => clearTimeout(timeout);
  }, []);

  if (isChecking) return <div>Chargement...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
}
