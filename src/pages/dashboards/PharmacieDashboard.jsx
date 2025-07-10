

const PharmacieDashboard = ({ user }) => {
  const pharmacie = user.pharmacieInfo;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Pharmacie : {pharmacie?.nomPharmacie}</h1>
      <p>Adresse Google Maps : {pharmacie?.adresseGoogleMaps}</p>
      <p>Livraison : {pharmacie?.livraisonDisponible ? 'Oui' : 'Non'}</p>
      <p>Statut : {pharmacie?.statutDemande}</p>
    </div>
  );
};
export default PharmacieDashboard;
