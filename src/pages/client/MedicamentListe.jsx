// // C:\reactjs node mongodb\pharmacie-frontend\src\pages\client\MedicamentList.jsx
// import { useEffect, useState } from 'react';
// import axios from 'axios';
// import { useAuth } from '../../hooks/useAuth';
// import { useParams } from 'react-router-dom';

// export default function MedicamentList() {
//   const { token } = useAuth();
//   const { pharmacyId } = useParams();
//   const [medicaments, setMedicaments] = useState([]);
//   const [message, setMessage] = useState('');
//   const [search, setSearch] = useState('');
//   const [page, setPage] = useState(1);
//   const [pagination, setPagination] = useState({});

//   useEffect(() => {
//     if (!token || !pharmacyId) return;

//     axios.get(`http://localhost:3001/api/client/pharmacy/${pharmacyId}/medicaments`, {
//       headers: { Authorization: `Bearer ${token}` },
//       params: { page, search }
//     })
//       .then(res => {
//         setMedicaments(res.data.data.medicaments);
//         setPagination(res.data.data.pagination);
//       })
//       .catch(err => {
//         console.error('Erreur chargement médicaments', err);
//         setMessage('❌ Erreur: ' + (err.response?.data?.message || err.message));
//       });
//   }, [token, pharmacyId, page, search]);

//   const handleSearch = (e) => {
//     setSearch(e.target.value);
//     setPage(1);
//   };

//   return (
//     <div className="p-6 max-w-5xl mx-auto">
//       <h2 className="text-2xl font-bold mb-4">💊 Médicaments</h2>
//       {message && <p className="mb-4 text-red-600">{message}</p>}

//       <input
//         type="text"
//         value={search}
//         onChange={handleSearch}
//         placeholder="Rechercher un médicament..."
//         className="mb-4 border px-3 py-2 rounded w-full"
//       />

//       <ul className="space-y-4">
//         {medicaments.map(med => (
//           <li key={med._id} className="p-4 bg-white rounded shadow border">
//             <div className="flex items-center">
//               {med.image && (
//                 <img
//                   src={`http://localhost:3001/Uploads/medicaments/${med.image.nomFichier}`}
//                   alt={med.nom}
//                   className="w-16 h-16 object-cover mr-4"
//                 />
//               )}
//               <div>
//                 <p><strong>{med.nom}</strong> ({med.nom_generique || 'N/A'})</p>
//                 <p>{med.description || 'Aucune description'}</p>
//                 <p>Prix: {med.prix ? `${med.prix} FCFA` : 'N/A'}</p>
//                 <p>Stock: {med.quantite_stock || 'N/A'}</p>
//                 <p>{med.est_sur_ordonnance ? 'Sur ordonnance' : 'Sans ordonnance'}</p>
//               </div>
//             </div>
//           </li>
//         ))}
//       </ul>

//       {pagination.pages > 1 && (
//         <div className="mt-4 flex justify-center">
//           <button
//             onClick={() => setPage(page - 1)}
//             disabled={page === 1}
//             className="mx-2 px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
//           >
//             Précédent
//           </button>
//           <span className="mx-2">Page {pagination.current} / {pagination.pages}</span>
//           <button
//             onClick={() => setPage(page + 1)}
//             disabled={page === pagination.pages}
//             className="mx-2 px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
//           >
//             Suivant
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }