import api from './api';

export const getCurrentUser = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);
