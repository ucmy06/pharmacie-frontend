import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';

export default function Header() {
  const { user, logout } = useAuth();
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    // Update cart item count from localStorage
    const updateCartCount = () => {
      const savedPaniers = localStorage.getItem('paniers');
      if (savedPaniers) {
        const paniers = JSON.parse(savedPaniers);
        const totalItems = Object.values(paniers).reduce(
          (total, panier) => total + panier.medicaments.reduce((sum, item) => sum + item.quantite, 0),
          0
        );
        setCartItemCount(totalItems);
      } else {
        setCartItemCount(0);
      }
    };

    updateCartCount();
    // Listen for storage changes (e.g., from Panier.jsx)
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Pharmacie App</Link>
        <nav className="flex items-center gap-4">
          <Link to="/pharmacies" className="hover:underline">Pharmacies</Link>
          {user ? (
            <>
              <Link to="/panier" className="relative hover:underline">
                Panier
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-4 bg-red-600 text-white text-xs rounded-full px-2 py-1">
                    {cartItemCount}
                  </span>
                )}
              </Link>
              <button onClick={logout} className="hover:underline">Déconnexion</button>
            </>
          ) : (
            <Link to="/login" className="hover:underline">Connexion</Link>
          )}
        </nav>
      </div>
    </header>
  );
}