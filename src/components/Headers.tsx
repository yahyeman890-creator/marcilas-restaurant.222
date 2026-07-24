import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, UtensilsCrossed, ClipboardList, Menu, X, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { getDashboardPath } from '@/contexts/AuthContext';

export function CustomerHeader() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/menu" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
            <UtensilsCrossed className="text-white" size={20} />
          </div>
          <div className="hidden sm:block">
            <span className="font-display font-bold text-lg text-gray-900">Marcilas</span>
            <span className="text-xs text-gray-400 block leading-none -mt-0.5">Dire Dawa</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link to="/menu" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition">Menu</Link>
          {user && (
            <>
              <Link to="/orders" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition">My Orders</Link>
              <Link to="/profile" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition">Profile</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            className="relative p-2.5 rounded-xl hover:bg-gray-100 transition"
          >
            <ShoppingBag size={22} className="text-gray-700" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <Link to="/profile" className="hidden sm:flex p-2.5 rounded-xl hover:bg-gray-100 transition">
                <User size={22} className="text-gray-700" />
              </Link>

              <button
                onClick={() => { logout(); navigate('/menu'); }}
                className="hidden sm:flex p-2.5 rounded-xl hover:bg-gray-100 transition"
              >
                <LogOut size={22} className="text-gray-700" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-2 rounded-xl bg-brand-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-700 transition"
            >
              <LogIn size={18} /> Login
            </Link>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2.5 rounded-xl hover:bg-gray-100 transition"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            <Link to="/menu" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-sm font-medium">
              <UtensilsCrossed size={18} /> Menu
            </Link>
            {user ? (
              <>
                <Link to="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-sm font-medium">
                  <ClipboardList size={18} /> My Orders
                </Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-sm font-medium">
                  <User size={18} /> Profile
                </Link>
                <button
                  onClick={() => { logout(); setMenuOpen(false); navigate('/menu'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-sm font-medium text-left"
                >
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-sm font-medium text-brand-600"
                >
                  <LogIn size={18} /> Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700"
                >
                  <User size={18} /> Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

interface StaffHeaderProps {
  title: string;
  subtitle?: string;
}

export function StaffHeader({ title, subtitle }: StaffHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
            <UtensilsCrossed className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-display font-bold text-base text-gray-900 leading-none">{title}</h1>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-700">{user?.full_name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="p-2.5 rounded-xl hover:bg-gray-100 transition"
          >
            <LogOut size={20} className="text-gray-700" />
          </button>
        </div>
      </div>
    </header>
  );
}
