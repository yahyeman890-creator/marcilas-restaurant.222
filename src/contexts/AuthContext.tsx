import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, AUTH_FUNCTION_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (fullName: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'marcilas_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  async function login(phone: string, password: string) {
    let res: Response;
    try {
      res = await fetch(`${AUTH_FUNCTION_URL}?action=login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ phone, password }),
      });
    } catch {
      throw new Error('Cannot connect to the server. Please check your internet connection and try again.');
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new Error('Server returned an invalid response. Please try again.');
    }

    if (!res.ok) throw new Error(data.error || 'Invalid phone number or password');
    setUser(data.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
  }

  async function register(fullName: string, phone: string, password: string) {
    let res: Response;
    try {
      res = await fetch(`${AUTH_FUNCTION_URL}?action=register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ full_name: fullName, phone, password }),
      });
    } catch {
      throw new Error('Cannot connect to the server. Please check your internet connection and try again.');
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new Error('Server returned an invalid response. Please try again.');
    }

    if (!res.ok) throw new Error(data.error || 'Registration failed');
    setUser(data.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  async function refreshUser() {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, is_active, created_at')
      .eq('id', user.id)
      .maybeSingle();
    if (data) {
      setUser(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin': return '/admin';
    case 'cashier': return '/cashier';
    case 'driver': return '/driver';
    default: return '/menu';
  }
}
