// C:\reactjs node mongodb\pharmacie-frontend\src\services\authService.js
import axiosInstance from '../utils/axiosConfig';

// Utiliser axiosInstance partout pour la cohérence avec vos logs
export const loginUser = async (credentials) => {
  const response = await axiosInstance.post('/api/auth/login', credentials);
  return response;
};

export const registerUser = async (data) => {
  const response = await axiosInstance.post('/api/auth/register', data);
  return response;
};

export const forgotPassword = async (data) => {
  const response = await axiosInstance.post('/api/auth/forgot-password', data);
  return response;
};

export const resetPassword = async (data) => {
  const response = await axiosInstance.post('/api/auth/reset-password', data);
  return response;
};

export const verifyEmail = async (token) => {
  const response = await axiosInstance.get(`/api/auth/verify-email/${token}`);
  return response;
};

export const resendVerificationEmail = async (data) => {
  const response = await axiosInstance.post('/api/auth/resend-verification', data);
  return response;
};

// Récupérer le profil utilisateur
export const getProfile = async () => {
  const response = await axiosInstance.get('/api/auth/profile');
  return response;
};

// Alternative avec /me si vous préférez
export const getMe = async () => {
  const response = await axiosInstance.get('/api/auth/me');
  return response;
};

// Mettre à jour le profil utilisateur
export const updateProfile = async (data) => {
  const response = await axiosInstance.put('/api/auth/profile', data);
  return response;
};

// Changer le mot de passe
export const changePassword = async (data) => {
  const response = await axiosInstance.put('/api/auth/password', data);
  return response;
};

// Demande de création de compte pharmacie
export const demandeComptePharmacie = async (formData) => {
  const response = await axiosInstance.post('/api/auth/demande-pharmacie', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

// Connexion à une pharmacie
export const connexionPharmacie = async (data) => {
  const response = await axiosInstance.post('/api/auth/connexion-pharmacie', data);
  return response;
};

// Pas de vraie route logout côté backend pour les JWT, mais on peut nettoyer le frontend
export const logoutUser = () => {
  // Retourner une promesse résolue pour la compatibilité
  return Promise.resolve({ data: { success: true, message: 'Déconnexion réussie' } });
};