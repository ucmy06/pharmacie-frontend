// src/components/Pharmacy/PharmacyProfile.js
import { useEffect, useState } from 'react';
import { updateProfile, getCurrentUser } from '../../services/userService';

export default function PharmacyProfile() {
  const [pharmacie, setPharmacie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const fetchPharmacie = async () => {
      try {
        const res = await getCurrentUser();
        setPharmacie(res.data.data.user);
      } catch (err) {
        console.error('Erreur chargement profil', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPharmacie();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPharmacie({
      ...pharmacie,
      pharmacieInfo: {
        ...pharmacie.pharmacieInfo,
        [name]: type === 'checkbox' ? checked : value
      }
    });
  };

  const handleHeureChange = (jour, champ, valeur) => {
    const heures = { ...pharmacie.pharmacieInfo.heuresOuverture };
    heures[jour][champ] = valeur;
    setPharmacie({
      ...pharmacie,
      pharmacieInfo: {
        ...pharmacie.pharmacieInfo,
        heuresOuverture: heures
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ pharmacieInfo: pharmacie.pharmacieInfo });
      setFeedback('Profil mis à jour avec succès ✅');
    } catch (err) {
      setFeedback('Erreur lors de la mise à jour ❌');
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">🛠️ Modifier le Profil de la Pharmacie</h2>

      {feedback && <div className="mb-4 text-sm text-blue-700">{feedback}</div>}

      <div className="mb-4">
        <label className="block mb-1">Photo (URL)</label>
        <input
          name="photoPharmacie"
          type="text"
          value={pharmacie.pharmacieInfo.photoPharmacie || ''}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Proposez-vous la livraison ?</label>
        <input
          name="livraisonDisponible"
          type="checkbox"
          checked={pharmacie.pharmacieInfo.livraisonDisponible}
          onChange={handleChange}
          className="mr-2"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">🕒 Heures d'ouverture</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(pharmacie.pharmacieInfo.heuresOuverture).map(([jour, data]) => (
            <div key={jour} className="border p-2 rounded">
              <label className="block font-semibold capitalize">{jour}</label>
              <div className="flex items-center mt-1">
                <span className="mr-2">Début:</span>
                <input
                  type="time"
                  value={data.debut}
                  onChange={(e) => handleHeureChange(jour, 'debut', e.target.value)}
                  className="border p-1 mr-2"
                />
                <span className="mr-2">Fin:</span>
                <input
                  type="time"
                  value={data.fin}
                  onChange={(e) => handleHeureChange(jour, 'fin', e.target.value)}
                  className="border p-1"
                />
              </div>
              <div className="mt-2">
                <label className="mr-2">Ouvert ?</label>
                <input
                  type="checkbox"
                  checked={data.ouvert}
                  onChange={(e) => handleHeureChange(jour, 'ouvert', e.target.checked)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">🧑‍⚕️ Garde</h3>
        <div className="flex items-center mb-2">
          <label className="mr-2">En garde ?</label>
          <input
            type="checkbox"
            name="estDeGarde"
            checked={pharmacie.pharmacieInfo.estDeGarde}
            onChange={handleChange}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="date"
            name="periodeGarde.debut"
            value={pharmacie.pharmacieInfo.periodeGarde?.debut || ''}
            onChange={(e) =>
              setPharmacie({
                ...pharmacie,
                pharmacieInfo: {
                  ...pharmacie.pharmacieInfo,
                  periodeGarde: {
                    ...pharmacie.pharmacieInfo.periodeGarde,
                    debut: e.target.value
                  }
                }
              })
            }
            className="border p-2"
            placeholder="Début garde"
          />
          <input
            type="date"
            name="periodeGarde.fin"
            value={pharmacie.pharmacieInfo.periodeGarde?.fin || ''}
            onChange={(e) =>
              setPharmacie({
                ...pharmacie,
                pharmacieInfo: {
                  ...pharmacie.pharmacieInfo,
                  periodeGarde: {
                    ...pharmacie.pharmacieInfo.periodeGarde,
                    fin: e.target.value
                  }
                }
              })
            }
            className="border p-2"
            placeholder="Fin garde"
          />
        </div>
      </div>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Enregistrer les modifications
      </button>
    </form>
  );
}
