// C:\reactjs node mongodb\pharmacie-frontend\src\pages\VerifyEmailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Vérification en cours...');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const verify = async () => {
      console.log("🔑 Token reçu dans l'URL:", token);
      console.log("🔑 Longueur du token:", token?.length);
      
      if (!token) {
        setMessage("Token manquant dans l'URL");
        setSuccess(false);
        setLoading(false);
        return;
      }

      try {
        console.log("🚀 Envoi de la requête de vérification...");
        
        const response = await axiosInstance.get(`/api/auth/verify-email/${token}`);
        
        console.log("✅ Réponse reçue:", response.data);
        
        setMessage(response.data.message || "Email vérifié avec succès!");
        setSuccess(true);
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          navigate('/login', { 
            state: { message: "Votre email a été vérifié. Vous pouvez maintenant vous connecter." }
          });
        }, 3000);
        
      } catch (error) {
        console.error("❌ Erreur lors de la vérification:", error);
        
        let errorMessage = "Erreur de vérification";
        
        if (error.response) {
          // Erreur de réponse du serveur
          console.error("📊 Status:", error.response.status);
          console.error("📊 Data:", error.response.data);
          errorMessage = error.response.data?.message || `Erreur ${error.response.status}`;
        } else if (error.request) {
          // Erreur de requête (pas de réponse)
          console.error("📡 Aucune réponse reçue:", error.request);
          errorMessage = "Impossible de contacter le serveur";
        } else {
          // Autre erreur
          console.error("⚠️ Erreur:", error.message);
          errorMessage = error.message;
        }
        
        setMessage(errorMessage);
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {loading ? (
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          ) : (
            <div className={`text-6xl mb-4 ${success ? 'text-green-500' : 'text-red-500'}`}>
              {success ? "✅" : "❌"}
            </div>
          )}
          
          <h1 className={`text-2xl font-bold mb-4 ${success ? 'text-green-600' : 'text-red-600'}`}>
            {loading ? "Vérification..." : success ? "Succès" : "Erreur"}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          {!loading && (
            <div className="space-y-3">
              {success ? (
                <div className="text-sm text-green-600">
                  <p>🎉 Votre compte est maintenant actif!</p>
                  <p>Redirection vers la connexion...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Aller à la connexion
                  </button>
                  <button
                    onClick={() => navigate('/resend-verification')}
                    className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Renvoyer l'email de vérification
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;