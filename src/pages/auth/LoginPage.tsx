import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, UtensilsCrossed, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardPath } from '@/contexts/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      const stored = localStorage.getItem('marcilas_user');
      if (stored) {
        const user = JSON.parse(stored);
        navigate(getDashboardPath(user.role));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(phoneNum: string, pass: string) {
    setPhone(phoneNum);
    setPassword(pass);
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - branding */}
      <div className="lg:w-1/2 bg-brand-600 relative overflow-hidden flex items-center justify-center p-8 lg:p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-white"></div>
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white"></div>
        </div>
        <div className="relative z-10 text-white max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <UtensilsCrossed size={28} />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl">Marcilas</h1>
              <p className="text-brand-100 text-sm">Dire Dawa, Ethiopia</p>
            </div>
          </div>
          <h2 className="font-display font-bold text-3xl lg:text-4xl mb-4 leading-tight">
            Delicious food, delivered fast to your door.
          </h2>
          <p className="text-brand-100 text-lg">
            Order your favorite meals online and track delivery in real-time.
          </p>
          <div className="mt-8 flex gap-6">
            <div>
              <p className="text-3xl font-bold">35+</p>
              <p className="text-brand-100 text-sm">Menu items</p>
            </div>
            <div>
              <p className="text-3xl font-bold">30min</p>
              <p className="text-brand-100 text-sm">Avg. delivery</p>
            </div>
            <div>
              <p className="text-3xl font-bold">4.7</p>
              <p className="text-brand-100 text-sm">Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <h2 className="font-display font-bold text-2xl text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Log in to your Marcilas account</p>

          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09XXXXXXXX or +2519XXXXXXXX"
                  className="input pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input pl-11"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Log In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">Register</Link>
          </p>

          {/* Demo accounts */}
          <div className="mt-8 p-4 rounded-xl bg-white border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Demo Accounts — Click to fill</p>
            <div className="space-y-2">
              <button onClick={() => fillDemo('+251911000001', 'admin123')} className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition text-left">
                <div>
                  <span className="text-sm font-medium text-gray-800">Admin</span>
                  <span className="text-xs text-gray-400 ml-2">+251911000001 / admin123</span>
                </div>
                <span className="badge bg-brand-50 text-brand-700 border-brand-100">Full Access</span>
              </button>
              <button onClick={() => fillDemo('+251911000002', 'cashier123')} className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition text-left">
                <div>
                  <span className="text-sm font-medium text-gray-800">Cashier</span>
                  <span className="text-xs text-gray-400 ml-2">+251911000002 / cashier123</span>
                </div>
                <span className="badge bg-blue-50 text-blue-700 border-blue-100">Orders</span>
              </button>
              <button onClick={() => fillDemo('+251911000003', 'driver123')} className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition text-left">
                <div>
                  <span className="text-sm font-medium text-gray-800">Driver</span>
                  <span className="text-xs text-gray-400 ml-2">+251911000003 / driver123</span>
                </div>
                <span className="badge bg-green-50 text-green-700 border-green-100">Delivery</span>
              </button>
              <button onClick={() => fillDemo('+251911000004', 'customer123')} className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition text-left">
                <div>
                  <span className="text-sm font-medium text-gray-800">Customer</span>
                  <span className="text-xs text-gray-400 ml-2">+251911000004 / customer123</span>
                </div>
                <span className="badge bg-amber-50 text-amber-700 border-amber-100">Order Food</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
