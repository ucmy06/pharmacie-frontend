// C:\reactjs node mongodb\pharmacie-frontend\src\utils\axiosConfig.js

import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  timeout: 30000, // Augmenté à 30 secondes pour gérer les requêtes lentes
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🚀 [axiosInstance] Token brut:', token);
    if (token && typeof token === 'string' && token.includes('.') && !token.includes('[object Object]')) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🚀 [axiosInstance] Token ajouté:', `Bearer ${token.slice(0, 10)}...`);
    } else {
      console.warn('⚠️ [axiosInstance] Token invalide ou manquant:', token);
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      console.warn('⚠️ [axiosInstance] Token supprimé de localStorage');
    }
    console.log('🚀 [axiosInstance] Requête envoyée:', config.method?.toUpperCase(), config.url, config.params || '');
    return config;
  },
  (error) => {
    console.error('❌ [axiosInstance] Erreur requête:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ [axiosInstance] Réponse reçue:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ [axiosInstance] Erreur réponse:', error.response?.status, error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.warn('⚠️ [axiosInstance] Token non valide, déconnexion');
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;