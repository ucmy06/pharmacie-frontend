// usePharmacyAuth.js - Version corrigée
import { useContext, createContext, useState, useEffect } from 'react';

const PharmacyAuthContext = createContext();

export function PharmacyAuthProvider({ children }) {
  const [pharmacy, setPharmacy] = useState(null);
  const [pharmacyToken, setPharmacyToken] = useState(localStorage.getItem('pharmacyToken'));

  useEffect(() => {
    if (pharmacyToken) {
      const storedPharmacy = JSON.parse(localStorage.getItem('pharmacyInfo'));
      setPharmacy(storedPharmacy);
    }
  }, [pharmacyToken]);

  // ✅ AJOUT : Fonction login pour pharmacie
  const loginPharmacie = (pharmacyData, token) => {
    setPharmacy(pharmacyData);
    setPharmacyToken(token);
    localStorage.setItem('pharmacyInfo', JSON.stringify(pharmacyData));
    localStorage.setItem('pharmacyToken', token);
  };

  // ✅ AJOUT : Fonction logout pour pharmacie
  const logoutPharmacie = () => {
    setPharmacy(null);
    setPharmacyToken(null);
    localStorage.removeItem('pharmacyInfo');
    localStorage.removeItem('pharmacyToken');
    localStorage.removeItem('clientInfo'); // Nettoyer aussi les infos client
  };

  return (
    <PharmacyAuthContext.Provider value={{ 
      pharmacy, 
      pharmacyToken, 
      loginPharmacie, 
      logoutPharmacie,
      setPharmacy, 
      setPharmacyToken 
    }}>
      {children}
    </PharmacyAuthContext.Provider>
  );
}

export function usePharmacyAuth() {
  return useContext(PharmacyAuthContext);
}