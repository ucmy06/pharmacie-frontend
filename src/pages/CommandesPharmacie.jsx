// C:\reactjs node mongodb\pharmacie-frontend\src\components\CommandesPharmacie.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import io from 'socket.io-client';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Badge,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

const CommandesPharmacie = () => {
  const [commandes, setCommandes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [socket, setSocket] = useState(null);

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

    // Demander la permission pour les notifications push
    const setupPushNotifications = async () => {
      if ('Notification' in window && 'serviceWorker' in navigator) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('✅ Permission de notification accordée');
          try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('✅ Service Worker enregistré:', registration);

            // Obtenir la clé publique VAPID depuis le backend
            const vapidResponse = await axios.get('http://localhost:3001/api/client/vapid-public-key', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const vapidPublicKey = vapidResponse.data.publicKey;

            // S'abonner aux notifications push
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });
            console.log('✅ Abonnement push créé:', subscription);

            // Envoyer l'abonnement au backend
            await axios.post(
              'http://localhost:3001/api/client/subscribe',
              subscription,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✅ Abonnement push envoyé au backend');
          } catch (error) {
            console.error('❌ Erreur configuration notifications push:', error);
            toast.error('Erreur lors de la configuration des notifications push');
          }
        }
      }
    };

    // Fonction pour convertir la clé VAPID en Uint8Array
    const urlBase64ToUint8Array = (base64String) => {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    };

    setupPushNotifications();

    // Initialiser WebSocket
    const newSocket = io('http://localhost:3001', {
      auth: { token: `Bearer ${token}` },
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('📡 [WebSocket] Connecté:', pharmacyId);
      newSocket.emit('joinPharmacie', pharmacyId);
    });

    newSocket.on('nouvelleCommande', ({ commande, notification }) => {
      console.log('🔔 [WebSocket] Nouvelle commande:', commande);
      setCommandes((prev) => [commande, ...prev]);
      setNotifications((prev) => [notification, ...prev]);
      toast.success(notification.message, {
        duration: 5000,
        position: 'top-right',
        style: {
          background: '#4caf50',
          color: '#fff',
          fontSize: '16px',
        },
      });
      // Jouer un son (optionnel)
      const audio = new Audio('/notification.mp3');
      audio.play().catch((err) => console.error('❌ Erreur lecture son:', err));
    });

    newSocket.on('disconnect', () => {
      console.log('📡 [WebSocket] Déconnecté:', pharmacyId);
    });

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

    return () => {
      newSocket.disconnect();
      console.log('📡 [WebSocket] Déconnecté:', pharmacyId);
    };
  }, []);

  const handleVoirDetails = async (commandeId) => {
    try {
      const token = localStorage.getItem('pharmacyToken');
      const response = await axios.get(`http://localhost:3001/api/client/commandes/${commandeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('✅ [handleVoirDetails] Détails:', response.data);
      setSelectedCommande(response.data.commande);
      setOpenDialog(true);
    } catch (error) {
      console.error('❌ [handleVoirDetails] Erreur:', JSON.stringify(error.response?.data, null, 2));
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des détails');
    }
  };

  const handleUpdateStatut = async (commandeId, nouveauStatut) => {
    try {
      const token = localStorage.getItem('pharmacyToken');
      const response = await axios.put(
        'http://localhost:3001/api/pharmacies/commandes/statut',
        { commandeId, statut: nouveauStatut },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ [handleUpdateStatut] Réponse:', response.data);
      setCommandes((prev) =>
        prev.map((cmd) =>
          cmd._id === commandeId ? { ...cmd, statut: nouveauStatut } : cmd
        )
      );
      if (selectedCommande && selectedCommande._id === commandeId) {
        setSelectedCommande({ ...selectedCommande, statut: nouveauStatut });
      }
      toast.success('Statut mis à jour avec succès');
    } catch (error) {
      console.error('❌ [handleUpdateStatut] Erreur:', JSON.stringify(error.response?.data, null, 2));
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const handleMarquerLue = async (notificationId) => {
    try {
      const token = localStorage.getItem('pharmacyToken');
      const response = await axios.put(
        `http://localhost:3001/api/client/notifications/${notificationId}/lu`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ [handleMarquerLue] Réponse:', response.data);
      setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));
      toast.success('Notification marquée comme lue');
    } catch (error) {
      console.error('❌ [handleMarquerLue] Erreur:', JSON.stringify(error.response?.data, null, 2));
      toast.error(error.response?.data?.message || 'Erreur lors du marquage de la notification');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCommande(null);
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Toaster />
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Typography variant="h5" sx={{ mb: 3 }}>
        Commandes
      </Typography>
      {commandes.length === 0 ? (
        <Typography>Aucune commande trouvée</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID Commande</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {commandes.map((commande) => (
                <TableRow key={commande._id}>
                  <TableCell>{commande._id}</TableCell>
                  <TableCell>
                    {commande.userId?.nom} {commande.userId?.prenom}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={commande.statut}
                      onChange={(e) => handleUpdateStatut(commande._id, e.target.value)}
                      size="small"
                    >
                      <MenuItem value="en_attente">En attente</MenuItem>
                      <MenuItem value="en_cours">En cours</MenuItem>
                      <MenuItem value="terminée">Terminée</MenuItem>
                      <MenuItem value="annulée">Annulée</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>{commande.total} FCFA</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleVoirDetails(commande._id)}
                    >
                      Voir détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Détails de la commande #{selectedCommande?._id}</DialogTitle>
        <DialogContent>
          {selectedCommande && (
            <Box>
              <Typography variant="body1">
                <strong>Client :</strong> {selectedCommande.userId?.nom} {selectedCommande.userId?.prenom}
              </Typography>
              <Typography variant="body1">
                <strong>Email :</strong> {selectedCommande.userId?.email}
              </Typography>
              <Typography variant="body1">
                <strong>Statut :</strong> {selectedCommande.statut}
              </Typography>
              <Typography variant="body1">
                <strong>Total :</strong> {selectedCommande.total} FCFA
              </Typography>
              <Typography variant="body1">
                <strong>Livraison :</strong> {selectedCommande.livraison ? 'Oui' : 'Non'}
              </Typography>
              {selectedCommande.livraison && selectedCommande.adresseLivraison && (
                <Typography variant="body1">
                  <strong>Adresse de livraison :</strong> {selectedCommande.adresseLivraison.adresseTexte || 'Non spécifiée'}
                  {selectedCommande.adresseLivraison.latitude && selectedCommande.adresseLivraison.longitude && (
                    <span>
                      {' '}
                      (Lat: {selectedCommande.adresseLivraison.latitude}, Lon: {selectedCommande.adresseLivraison.longitude})
                    </span>
                  )}
                </Typography>
              )}
              <Typography variant="h6" sx={{ mt: 2 }}>
                Médicaments :
              </Typography>
              <List>
                {selectedCommande.medicaments.map((med, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`${med.nom} - Quantité: ${med.quantite}`}
                      secondary={`Prix unitaire: ${med.prix} FCFA`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant="h5" sx={{ mt: 4, mb: 3 }}>
        Notifications
        <Badge badgeContent={notifications.length} color="primary" sx={{ ml: 2 }}>
          <NotificationsIcon />
        </Badge>
      </Typography>
      {notifications.length === 0 ? (
        <Typography>Aucune notification trouvée</Typography>
      ) : (
        <List>
          {notifications.map((notif) => (
            <ListItem
              key={notif._id}
              secondaryAction={
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => handleMarquerLue(notif._id)}
                >
                  Marquer comme lue
                </Button>
              }
              sx={{ mb: 1, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}
            >
              <ListItemText primary={notif.message} secondary={new Date(notif.date).toLocaleString()} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default CommandesPharmacie;