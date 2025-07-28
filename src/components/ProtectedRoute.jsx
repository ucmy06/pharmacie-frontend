// C:\reactjs node mongodb\pharmacie-frontend\src\components\ProtectedRoute.jsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { user, token, isLoading } = useAuth();

  console.log('🔒 [ProtectedRoute] État auth:', { user, token: token ? token.slice(0, 10) + '...' : 'NULL', isLoading });

  if (isLoading) {
    console.log('⏳ [ProtectedRoute] Chargement en cours...');
    return <div>Chargement...</div>;
  }

  if (!token || !user || user.role !== 'admin') {
    console.warn('⚠️ [ProtectedRoute] Accès non autorisé:', { hasToken: !!token, hasUser: !!user, role: user?.role });
    return <Navigate to="/login" />;
  }

  console.log('✅ [ProtectedRoute] Accès autorisé pour:', user.email);
  return children;
}