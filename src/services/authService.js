// C:\reactjs node mongodb\pharmacie-frontend\src\services\authService.js
import api from './api';
import axiosInstance from '../utils/axiosConfig';

export const loginUser = async (credentials) => {
  const response = await axiosInstance.post('/api/auth/login', credentials);
  return response;
};
export const registerUser = (data) => api.post('/auth/register', data);
export const registerPharmacie = (data) => api.post('/auth/pharmacie', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);
export const getProfile = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/me', data);
export const changePassword = (data) => api.put('/auth/change-password', data);
export const logoutUser = () => api.post('/auth/logout');