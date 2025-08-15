// // C:\reactjs node mongodb\pharmacie-frontend\src\pages\admin\AssignDatabasePage.jsx
// import { useEffect, useState } from 'react';
// import axios from 'axios';
// import { useAuth } from '../../hooks/useAuth';
// import { useNavigate } from 'react-router-dom';

// export default function AssignDatabasePage() {
//   const { user, token } = useAuth();
//   const navigate = useNavigate();
//   const [pharmacies, setPharmacies] = useState([]);
//   const [selectedDB, setSelectedDB] = useState('');
//   const [message, setMessage] = useState('');

//   useEffect(() => {
//     if (!token) return;

//     axios.get('http://localhost:3001/api/admin/pharmacies', {
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     })
//       .then(res => setPharmacies(res.data.data.pharmacies))
//       .catch(err => {
//         console.error('Erreur chargement pharmacies', err);
//         setMessage('❌ Erreur lors du chargement des pharmacies');
//       });
//   }, [token]);

//   const handleAssign = (pharmacyId) => {
//     if (!selectedDB) return setMessage('❌ Veuillez sélectionner une base de données.');

//     axios.post(`http://localhost:3001/api/admin/pharmacy/${pharmacyId}/assign-db`, {
//       nomBaseMedicament: selectedDB
//     }, {
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     })
//       .then(res => {
//         setMessage(res.data.message);
//         // Refresh pharmacies list to reflect updated baseMedicament
//         axios.get('http://localhost:3001/api/admin/pharmacies', {
//           headers: { Authorization: `Bearer ${token}` }
//         })
//           .then(res => setPharmacies(res.data.data.pharmacies))
//           .catch(err => console.error('Erreur rechargement pharmacies', err));
//       })
//       .catch(err => {
//         console.error(err);
//         setMessage('❌ Erreur lors de l\'assignation: ' + (err.response?.data?.message || err.message));
//       });
//   };

//   return (
//     <div className="p-6 max-w-5xl mx-auto">
//       <h2 className="text-2xl font-bold mb-4">🔗 Associer une base de données à une pharmacie</h2>
//       {message && <p className={`mb-4 ${message.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}

//       <label className="block mb-4">
//         Sélectionner une base de données :
//         <select
//           value={selectedDB}
//           onChange={(e) => setSelectedDB(e.target.value)}
//           className="mt-1 border px-3 py-2 rounded w-full"
//         >
//           <option value="">-- Choisir une base --</option>
//           <option value="pharmacie_alpha">pharmacie_alpha</option>
//           <option value="pharmacie_beta">pharmacie_beta</option>
//           <option value="pharmacie_nova">pharmacie_nova</option>
//           <option value="pharmacie_omega">pharmacie_omega</option>
//           <option value="pharmacie_test">pharmacie_test</option>
//           <option value="pharmacie_first">pharmacie_first</option>

//         </select>
//       </label>

//       <ul className="space-y-4">
//         {pharmacies.map(pharma => (
//           <li key={pharma._id} className="p-4 bg-white rounded shadow border">
//             <p><strong>{pharma.pharmacieInfo.nomPharmacie}</strong> ({pharma.email})</p>
//             <p>Localisation : {pharma.pharmacieInfo.adresseGoogleMaps}</p>
//             <p>DB assignée actuelle : {pharma.pharmacieInfo.baseMedicament || 'Aucune'}</p>
//             <button
//               onClick={() => handleAssign(pharma._id)}
//               className="mt-2 bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
//             >
//               Assigner la base sélectionnée
//             </button>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }