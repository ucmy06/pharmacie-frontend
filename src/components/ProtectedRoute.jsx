// C:\reactjs node mongodb\pharmacie-frontend\src\components\ProtectedRoute.jsx

import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode'; // Fixed import

export default function ProtectedRoute({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('pharmacyToken');
    console.log('ProtectedRoute: Token found:', !!token);

    if (token) {
      try {
        const decoded = jwtDecode(token); // Fixed usage
        console.log('ProtectedRoute: Decoded token:', decoded);
        if (decoded.role === 'admin') {
          setIsAuthenticated(true);
        } else {
          console.log('ProtectedRoute: Non-admin role:', decoded.role);
        }
      } catch (error) {
        console.error('ProtectedRoute: Error decoding token:', error);
      }
    }

    const timeout = setTimeout(() => {
      setIsChecking(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  if (isChecking) return <div>Chargement...</div>;

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Redirecting to /login');
    return <Navigate to="/login" />;
  }

  return children;
}