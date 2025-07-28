// C:\reactjs node mongodb\pharmacie-frontend\src\components\ClientProtectedRoute.jsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ClientProtectedRoute({ children }) {
  const { user, token, isLoading } = useAuth();

  console.log('🔒 [ClientProtectedRoute] État auth:', { user, token: token ? token.slice(0, 10) + '...' : 'NULL', isLoading });

  if (isLoading) {
    console.log('⏳ [ClientProtectedRoute] Chargement en cours...');
    return <div>Loading...</div>;
  }

  if (!token || !user || user.role !== 'client') {
    console.warn('❌ [ClientProtectedRoute] Accès non autorisé:', { hasToken: !!token, hasUser: !!user, role: user?.role });
    return <Navigate to="/login" />;
  }

  console.log('✅ [ClientProtectedRoute] Accès autorisé pour:', user.email);
  return children;
}