// C:\reactjs node mongodb\pharmacie-frontend\src\components\PharmacyProtectedRoute.jsx

import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode'; // Fixed import

export default function PharmacyProtectedRoute({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('pharmacyToken');
    console.log('PharmacyProtectedRoute: Token found:', !!token);

    if (token) {
      try {
        const decoded = jwtDecode(token); // Fixed usage
        console.log('PharmacyProtectedRoute: Decoded token:', decoded);
        if (decoded.role === 'pharmacie') {
          setIsAuthenticated(true);
        } else {
          console.log('PharmacyProtectedRoute: Non-pharmacie role:', decoded.role);
        }
      } catch (error) {
        console.error('PharmacyProtectedRoute: Error decoding token:', error);
      }
    }

    const timeout = setTimeout(() => {
      setIsChecking(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  if (isChecking) return <div>Chargement...</div>;

  if (!isAuthenticated) {
    console.log('PharmacyProtectedRoute: Redirecting to /pharmacie/connexion');
    return <Navigate to="/pharmacie/connexion" />;
  }

  return children;
}