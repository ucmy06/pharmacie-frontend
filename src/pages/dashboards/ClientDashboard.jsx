// C:\reactjs node mongodb\pharmacie-frontend\src\pages\dashboards\ClientDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';

const API_URL = 'http://localhost:3001';

export default function ClientDashboard() {
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState({
    totalCommandes: 0,
    commandesEnCours: 0,
    commandesTerminees: 0,
    commandesAnnulees: 0,
    pharmaciesProches: 0,
    panierItems: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Charger les statistiques du client
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const token = localStorage.getItem('token');
        
        // Utiliser les vrais endpoints comme dans CommandesClient.jsx
        const [commandesRes, panierRes, pharmaciesRes] = await Promise.all([
          // Récupérer toutes les commandes pour calculer les stats
          fetch(`${API_URL}/api/client/commandes`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(res => res.json()),
          
          // Récupérer le panier (à adapter selon votre API)
          fetch(`${API_URL}/api/panier`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(res => res.json()).catch(() => ({ data: { items: [] } })),
          
          // Récupérer les pharmacies proches (à adapter selon votre API)
          fetch(`${API_URL}/api/pharmacies/nearby`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(res => res.json()).catch(() => ({ data: { count: 0 } }))
        ]);

        // Traiter les données des commandes comme dans CommandesClient.jsx
        if (commandesRes.success && commandesRes.data && commandesRes.data.commandes) {
          const commandes = commandesRes.data.commandes;
          
          // Calculer les statistiques à partir des vraies données
          const totalCommandes = commandes.length;
          const commandesEnCours = commandes.filter(cmd => 
            cmd.statut === 'en_attente' || cmd.statut === 'en_cours'
          ).length;
          const commandesTerminees = commandes.filter(cmd => 
            cmd.statut === 'terminée'
          ).length;
          const commandesAnnulees = commandes.filter(cmd => 
            cmd.statut === 'annulée'
          ).length;

          setStats({
            totalCommandes,
            commandesEnCours,
            commandesTerminees,
            commandesAnnulees,
            pharmaciesProches: pharmaciesRes.data?.count || 0,
            panierItems: panierRes.data?.items?.length || 0
          });

          // Prendre les 5 commandes les plus récentes
          setRecentOrders(commandes.slice(0, 5));
        } else {
          console.error('Erreur structure réponse commandes:', commandesRes);
          // Valeurs par défaut en cas d'erreur
          setStats({
            totalCommandes: 0,
            commandesEnCours: 0,
            commandesTerminees: 0,
            commandesAnnulees: 0,
            pharmaciesProches: 0,
            panierItems: 0
          });
        }

      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        setStats({
          totalCommandes: 0,
          commandesEnCours: 0,
          commandesTerminees: 0,
          commandesAnnulees: 0,
          pharmaciesProches: 0,
          panierItems: 0
        });
      } finally {
        setLoadingStats(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Utilisateur non connecté</h2>
          <Link to="/login" className="text-blue-600 hover:underline mt-2 inline-block">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête de bienvenue */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Bienvenue, {user.prenom} {user.nom}
        </h1>
        <p className="opacity-90">
          Gérez vos commandes et découvrez les pharmacies près de chez vous
        </p>
      </div>

      {/* Statistiques - Version corrigée sans livraison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commandes</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingStats ? '...' : stats.totalCommandes}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingStats ? '...' : stats.commandesEnCours}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Terminées</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingStats ? '...' : stats.commandesTerminees}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pharmacies proches</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingStats ? '...' : stats.pharmaciesProches}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides - Sans livraison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div className="space-y-3">
            <Link
              to="/pharmacies"
              className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Pharmacies proches</p>
                <p className="text-sm text-gray-600">Trouvez une pharmacie près de vous</p>
              </div>
            </Link>

            <Link
              to="/commandes"
              className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Mes commandes</p>
                <p className="text-sm text-gray-600">Suivez vos commandes</p>
              </div>
            </Link>

            <Link
              to="/medicaments"
              className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Rechercher médicaments</p>
                <p className="text-sm text-gray-600">Trouvez vos médicaments</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Commandes récentes */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Commandes récentes</h2>
          {loadingStats ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Commande de médicaments</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')} - {order.pharmacyId?.pharmacieInfo?.nomPharmacie || 'Pharmacie inconnue'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.medicaments?.length || 0} médicament(s) - {order.total} FCFA
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.statut === 'terminée' ? 'bg-green-100 text-green-800' :
                    order.statut === 'en_cours' || order.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                    order.statut === 'annulée' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.statut?.replace('_', ' ') || 'Statut inconnu'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="h-12 w-12 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">Aucune commande récente</p>
              <Link
                to="/pharmacies"
                className="text-blue-600 hover:underline text-sm"
              >
                Commencer vos achats
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Section informative - Sans livraison */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations utiles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Récupération en pharmacie</h3>
            <p className="text-sm text-blue-700">
              Commandez en ligne et récupérez vos médicaments directement en pharmacie
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Support 24/7</h3>
            <p className="text-sm text-green-700">
              Notre équipe est disponible 24h/24 pour vous aider
            </p>
          </div>
        </div>
      </div>

      {/* Demande de pharmacie (si applicable) */}
      {user.demandePharmacie && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Votre demande de pharmacie</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">
                  {user.demandePharmacie.informationsPharmacie?.nomPharmacie || 'Demande en cours'}
                </p>
                <p className="text-sm text-blue-700">
                  Statut: <span className="font-medium">{user.demandePharmacie.statutDemande}</span>
                </p>
              </div>
              <Link
                to="/ma-demande-pharmacie"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Voir les détails
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}