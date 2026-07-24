import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Phone, Lock, Shield, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardPath } from '@/contexts/AuthContext';

export function StaffLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password, 'staff');
      const stored = localStorage.getItem('marcilas_user');
      if (stored) {
        const user = JSON.parse(stored);
        const redirect = searchParams.get('redirect');
        if (redirect) {
          navigate(redirect);
        } else {
          navigate(getDashboardPath(user.role));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-4">
            <Shield className="text-brand-400" size={32} />
          </div>
          <h1 className="font-display font-bold text-2xl text-white">Staff Portal</h1>
          <p className="text-gray-400 text-sm mt-1">Marcilas Restaurant — Authorized personnel only</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-900/40 border border-red-800 text-red-300 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09XXXXXXXX"
                className="w-full rounded-xl bg-gray-900 border border-gray-700 text-white pl-11 pr-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl bg-gray-900 border border-gray-700 text-white pl-11 pr-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 active:scale-95 transition disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Sign In'}
          </button>
        </form>

        <button
          onClick={() => navigate('/menu')}
          className="mt-6 flex items-center gap-2 text-gray-400 hover:text-white text-sm mx-auto transition"
        >
          <ArrowLeft size={16} /> Back to website
        </button>
      </div>
    </div>
  );
}
