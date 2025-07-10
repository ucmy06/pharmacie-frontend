//C:\reactjs node mongodb\pharmacie-frontend\src\services\userService.js

import api from './api';

export const getCurrentUser = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);
