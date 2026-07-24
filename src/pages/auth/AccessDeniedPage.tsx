import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth, getDashboardPath } from '@/contexts/AuthContext';

export function AccessDeniedPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="text-red-600" size={40} />
        </div>
        <h1 className="font-display font-bold text-3xl text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-8">
          You don't have permission to view this page. This area is restricted to authorized staff only.
        </p>
        <Link
          to={user ? getDashboardPath(user.role) : '/menu'}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white px-6 py-3 font-semibold text-sm hover:bg-brand-700 active:scale-95 transition"
        >
          <ArrowLeft size={18} /> Go to your dashboard
        </Link>
      </div>
    </div>
  );
}
