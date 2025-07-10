import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import ClientDashboard from './dashboards/ClientDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import PharmacieDashboard from './dashboards/PharmacieDashboard';


const ProtectedDashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get('/api/auth/me'); // Assure-toi que ce endpoint existe et retourne les infos utilisateur
        setUser(res.data.user);
      } catch (err) {
        navigate('/login');
      }
    };

    fetchUser();
  }, [navigate]);

  if (!user) {
    return <div className="text-center py-10">Chargement...</div>;
  }

  switch (user.role) {
    case 'client':
      return <ClientDashboard user={user} />;
    case 'pharmacie':
      return <PharmacieDashboard user={user} />;
    case 'admin':
      return <AdminDashboard user={user} />;
    default:
      return <div>Rôle inconnu</div>;
  }
};

export default ProtectedDashboard;
