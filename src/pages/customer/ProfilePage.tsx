import { Link } from 'react-router-dom';
import { User, Phone, Shield, Calendar, UtensilsCrossed, ClipboardList, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import { CustomerHeader } from '@/components/Headers';

export function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="font-display font-bold text-xl text-gray-900 mb-6">My Profile</h1>

        {/* Profile card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-2xl font-bold font-display">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-gray-900">{user.full_name}</h2>
              <span className="badge bg-brand-50 text-brand-700 border-brand-100 capitalize">{user.role}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <User size={18} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Full Name</p>
                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Phone size={18} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Phone Number</p>
                <p className="text-sm font-medium text-gray-900">{user.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Shield size={18} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Account Type</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{user.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Calendar size={18} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Member Since</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(user.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link to="/menu" className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition">
            <UtensilsCrossed size={24} className="text-brand-600" />
            <span className="text-sm font-medium text-gray-700">Browse Menu</span>
          </Link>
          <Link to="/orders" className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition">
            <ClipboardList size={24} className="text-brand-600" />
            <span className="text-sm font-medium text-gray-700">My Orders</span>
          </Link>
        </div>

        <button
          onClick={logout}
          className="btn-secondary w-full py-3 text-red-600 hover:bg-red-50 hover:border-red-200"
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </div>
  );
}
