// C:\reactjs node mongodb\pharmacie-frontend\src\utils\axiosConfig.js
import axios from 'axios';

// Configuration de base pour axios
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour les requêtes
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('🚀 Requête envoyée:', config.method?.toUpperCase(), config.url);
    
    // Ajouter le token si disponible
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Erreur requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Réponse reçue:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Erreur réponse:', error.response?.status, error.response?.data);
    
    // Gérer les erreurs d'authentification
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Rediriger vers login si nécessaire
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;