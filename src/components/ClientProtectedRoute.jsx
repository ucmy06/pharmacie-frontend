// C:\reactjs node mongodb\pharmacie-frontend\src\components\ClientProtectedRoute.jsx

import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

export default function ClientProtectedRoute({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('pharmacyToken');
    console.log('ClientProtectedRoute: Token found:', !!token);

    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('ClientProtectedRoute: Decoded token:', decoded);
        if (decoded.role === 'client') {
          setIsAuthenticated(true);
        } else {
          console.log('ClientProtectedRoute: Non-client role:', decoded.role);
        }
      } catch (error) {
        console.error('ClientProtectedRoute: Error decoding token:', error);
      }
    }

    const timeout = setTimeout(() => {
      setIsChecking(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  if (isChecking) return <div>Chargement...</div>;

  if (!isAuthenticated) {
    console.log('ClientProtectedRoute: Redirecting to /login');
    return <Navigate to="/login" />;
  }

  return children;
}