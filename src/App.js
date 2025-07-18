import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Home from './components/Home';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResendVerificationPage from './pages/ResendVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedDashboard from './pages/ProtectedDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ClientDashboard from './pages/dashboards/ClientDashboard';
import PharmacieDashboard from './pages/dashboards/PharmacieDashboard';
import PharmacyRequestsPage from './pages/admin/PharmacyRequestsPage';
import DemandePharmacieForm from './pages/demande/DemandePharmacieForm';
import MaDemandePharmacie from './pages/demande/MaDemandePharmacie';
import ConnexionPharmacie from './pages/pharmacie/ConnexionPharmacie';
import ChangePharmacyPassword from './pages/pharmacie/ChangePharmacyPassword';
import PharmacyProfile from './pages/pharmacie/PharmacyProfile';
import ProtectedRoute from './components/ProtectedRoute';
import PharmacyProtectedRoute from './components/PharmacyProtectedRoute';

import './App.css';

function App() {
  useEffect(() => {
    fetch('http://localhost:3001/api/health')
      .then(res => res.json())
      .then(data => console.log('Health check:', data.message))
      .catch(err => console.error('Erreur de connexion au backend:', err));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/resend-verification" element={<ResendVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<ProtectedDashboard />} />
        <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/client-dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
        
        {/* Protection pharmacie */}
        <Route 
          path="/pharmacie/dashboard" 
          element={
            
              <PharmacieDashboard />
            
          } 
        />
        <Route 
          path="/pharmacie/profil" 
          element={
            <PharmacyProtectedRoute>
              <PharmacyProfile />
            </PharmacyProtectedRoute>
          } 
        />
        <Route path="/pharmacie/connexion" element={<ConnexionPharmacie />} />
        <Route path="/connexion-pharmacie" element={<Navigate to="/pharmacie/connexion" />} />
        <Route path="/pharmacie/change-password" element={<PharmacyProtectedRoute><ChangePharmacyPassword/></PharmacyProtectedRoute>}/>
        
        <Route path="/admin/pharmacy-requests" element={<ProtectedRoute><PharmacyRequestsPage /></ProtectedRoute>} />
        <Route path="/demande-pharmacie" element={<DemandePharmacieForm />} />
        <Route path="/ma-demande-pharmacie" element={<ProtectedRoute><MaDemandePharmacie /></ProtectedRoute>} />
        <Route path="*" element={<div>404 - Page non trouvée</div>} />
      </Routes>
    </Router>
  );
}

export default App;
