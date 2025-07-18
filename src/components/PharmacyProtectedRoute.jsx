// src/components/PharmacyProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

export default function PharmacyProtectedRoute({ children }) {
  const pharmacyToken = localStorage.getItem('pharmacyToken');

  if (!pharmacyToken) {
    return <Navigate to="/pharmacie/connexion" />;
  }

  return children;
}
