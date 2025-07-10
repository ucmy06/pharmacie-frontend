// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register'; // ✅ Ajouté ici
import Home from './components/Home'; // ✅
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResendVerificationPage from './pages/ResendVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedDashboard from './pages/ProtectedDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ClientDashboard from './pages/dashboards/ClientDashboard';
import PharmacieDashboard from './pages/dashboards/PharmacieDashboard';
import './App.css'; // Assurez-vous que ce fichier existe pour les styles

function App() {
  useEffect(() => {
    fetch('http://localhost:3001/api/health')
      .then(res => res.json())
      .then(data => console.log(data))
      .catch(err => console.error('Erreur de connexion au backend', err));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> {/* ✅ Cela fonctionnera maintenant */}
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/resend-verification" element={<ResendVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<ProtectedDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} /> {/* Ajouté pour l'admin */}
        <Route path="/client-dashboard" element={<ClientDashboard />} /> {/* Ajouté pour le client */}
        <Route path="/pharmacie-dashboard" element={<PharmacieDashboard />} /> {/* Ajouté pour la pharmacie */}



      </Routes>
    </Router>
  );
}

export default App;
