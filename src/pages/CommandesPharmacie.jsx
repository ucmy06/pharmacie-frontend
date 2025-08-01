// C:\reactjs node mongodb\pharmacie-frontend\src\components\CommandesPharmacie.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CommandesPharmacie = () => {
  const [commandes, setCommandes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const pharmacyInfo = JSON.parse(localStorage.getItem('pharmacyInfo') || '{}');
    const pharmacyId = pharmacyInfo._id;
    const token = localStorage.getItem('pharmacyToken');

    console.log('🔍 [CommandesPharmacie] Initialisation:', {
      pharmacyId,
      token: token?.slice(0, 10) + '...',
    });

    if (!pharmacyId || !token) {
      setError('Informations de pharmacie ou token manquant');
      console.warn('⚠️ [CommandesPharmacie] Données manquantes:', { pharmacyId, hasToken: !!token });
      toast.error('Informations de pharmacie ou token manquant');
      return;
    }

    const fetchCommandes = async () => {
      try {
        console.log('📤 [fetchCommandes] Envoi requête');
        const response = await axios.get('http://localhost:3001/api/pharmacies/commandes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('✅ [fetchCommandes] Réponse:', response.data);
        setCommandes(response.data.data.commandes);
      } catch (error) {
        console.error('❌ [fetchCommandes] Erreur:', JSON.stringify(error.response?.data, null, 2));
        const errorMessage = error.response?.data?.message || 'Erreur lors du chargement des commandes';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    };

    const fetchNotifications = async () => {
      try {
        console.log('📤 [fetchNotifications] Envoi requête');
        const response = await axios.get('http://localhost:3001/api/pharmacies/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('✅ [fetchNotifications] Réponse:', response.data);
        setNotifications(response.data.data.notifications);
      } catch (error) {
        console.error('❌ [fetchNotifications] Erreur:', JSON.stringify(error.response?.data, null, 2));
        const errorMessage = error.response?.data?.message || 'Erreur lors du chargement des notifications';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    };

    fetchCommandes();
    fetchNotifications();
  }, []);

  return (
    <div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <h2>Commandes</h2>
      <ul>
        {commandes.length === 0 && <li>Aucune commande trouvée</li>}
        {commandes.map((commande) => (
          <li key={commande._id}>
            Commande #{commande._id} - Statut: {commande.statut} - Total: {commande.total}
          </li>
        ))}
      </ul>
      <h2>Notifications</h2>
      <ul>
        {notifications.length === 0 && <li>Aucune notification trouvée</li>}
        {notifications.map((notif) => (
          <li key={notif._id}>{notif.message}</li>
        ))}
      </ul>
    </div>
  );
};

export default CommandesPharmacie;