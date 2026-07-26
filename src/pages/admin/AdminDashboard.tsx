import { useState, useEffect, useCallback } from 'react';
import { Users, UtensilsCrossed, ClipboardList, BarChart3, DollarSign, ShoppingBag, TrendingUp, Loader2, Receipt, History } from 'lucide-react';
import { supabase, AUTH_FUNCTION_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useOrdersRealtime } from '@/hooks/useRealtimeOrders';
import type { Profile, Food, Order, Category } from '@/types';
import { StaffHeader } from '@/components/Headers';
import { AdminUsersTab } from '@/pages/admin/AdminUsersTab';
import { AdminFoodsTab } from '@/pages/admin/AdminFoodsTab';
import { AdminOrdersTab } from '@/pages/admin/AdminOrdersTab';
import { AdminRevenueTab } from '@/pages/admin/AdminRevenueTab';
import { ZReportsHistoryTab } from '@/pages/admin/ZReportsHistoryTab';
import { ZReportModal } from '@/components/ZReportModal';
import { formatETB } from '@/lib/utils';

type Tab = 'overview' | 'orders' | 'foods' | 'users' | 'revenue' | 'zreport' | 'history';

export function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [zReportOpen, setZReportOpen] = useState(false);
  const [todayClosed, setTodayClosed] = useState(false);

  const loadData = useCallback(async () => {
    const [profilesRes, foodsRes, ordersRes, categoriesRes, todayReportRes] = await Promise.all([
      fetch(`${AUTH_FUNCTION_URL}?action=list-users`, {
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY },
      }).then((r) => r.json()).then((d) => ({ data: d.users ?? [], error: null })).catch(() => ({ data: [], error: null })),
      supabase.from('foods').select('*, category:categories(*)').order('created_at', { ascending: false }),
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('z_reports').select('id').eq('business_date', new Date().toISOString().slice(0, 10)).maybeSingle(),
    ]);
    setProfiles(profilesRes.data ?? []);
    setFoods(foodsRes.data ?? []);
    setOrders(ordersRes.data ?? []);
    setCategories(categoriesRes.data ?? []);
    setTodayClosed(!!todayReportRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time: re-fetch orders whenever anything changes
  useOrdersRealtime(loadData);

  const activeOrders = orders.filter((o) => !o.z_report_id);
  const totalRevenue = activeOrders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total), 0);
  const totalOrders = activeOrders.length;
  const pendingOrders = activeOrders.filter((o) => o.status === 'pending').length;
  const totalCustomers = profiles.filter((p) => p.role === 'customer').length;
  const totalStaff = profiles.filter((p) => p.role !== 'customer').length;

  const tabs: { value: Tab; label: string; icon: typeof Users }[] = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'orders', label: 'Orders', icon: ClipboardList },
    { value: 'foods', label: 'Foods', icon: UtensilsCrossed },
    { value: 'users', label: 'Users', icon: Users },
    { value: 'revenue', label: 'Revenue', icon: DollarSign },
    { value: 'zreport', label: 'Z Report', icon: Receipt },
    { value: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <StaffHeader title="Admin Dashboard" subtitle={user?.full_name} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === t.value ? 'bg-brand-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : tab === 'overview' ? (
          <div>
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <StatCard icon={DollarSign} label="Total Revenue" value={formatETB(totalRevenue)} color="text-green-600 bg-green-50" />
              <StatCard icon={ShoppingBag} label="Total Orders" value={totalOrders} color="text-blue-600 bg-blue-50" />
              <StatCard icon={TrendingUp} label="Pending Orders" value={pendingOrders} color="text-amber-600 bg-amber-50" />
              <StatCard icon={Users} label="Total Users" value={profiles.length} color="text-purple-600 bg-purple-50" />
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {/* Recent orders */}
              <div className="card p-5">
                <h3 className="font-semibold text-sm text-gray-900 mb-4">Recent Orders</h3>
                <div className="space-y-2">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{order.customer_name}</p>
                        <p className="text-xs text-gray-400">{order.status}</p>
                      </div>
                      <span className="font-semibold text-gray-900 shrink-0">{formatETB(order.total)}</span>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-sm text-gray-400">No orders yet.</p>}
                </div>
              </div>

              {/* Staff overview */}
              <div className="card p-5">
                <h3 className="font-semibold text-sm text-gray-900 mb-4">Staff Overview</h3>
                <div className="space-y-3">
                  <StaffRow label="Customers" count={totalCustomers} color="bg-amber-100 text-amber-700" />
                  <StaffRow label="Cashiers" count={profiles.filter((p) => p.role === 'cashier').length} color="bg-blue-100 text-blue-700" />
                  <StaffRow label="Drivers" count={profiles.filter((p) => p.role === 'driver').length} color="bg-green-100 text-green-700" />
                  <StaffRow label="Admins" count={profiles.filter((p) => p.role === 'admin').length} color="bg-brand-100 text-brand-700" />
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    <span className="font-bold text-gray-900">{totalStaff}</span> staff members total
                  </p>
                </div>
              </div>
            </div>

            {/* Food summary */}
            <div className="card p-5 mt-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-4">Menu Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {categories.map((cat) => {
                  const count = foods.filter((f) => f.category?.slug === cat.slug).length;
                  return (
                    <div key={cat.id} className="p-3 rounded-xl bg-gray-50">
                      <p className="text-sm font-medium text-gray-700">{cat.name}</p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-400">items</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : tab === 'orders' ? (
          <AdminOrdersTab orders={orders} onRefresh={loadData} />
        ) : tab === 'zreport' ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
              <Receipt size={28} className="text-brand-600" />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900 mb-2">Daily Closing (Z Report)</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-2">
              Generate a Z Report to close today's business day. All open orders will be archived
              with their totals. New orders will belong to the next business day.
            </p>
            {todayClosed ? (
              <div className="mb-4">
                <span className="badge bg-green-50 text-green-700 border-green-100">
                  Today's business day is already closed
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
                Only one Z Report can be generated per business day. No orders will be deleted.
              </p>
            )}
            <button onClick={() => setZReportOpen(true)} className="btn-primary" disabled={todayClosed}>
              <Receipt size={16} /> Generate Z Report
            </button>
          </div>
        ) : tab === 'history' ? (
          <ZReportsHistoryTab />
        ) : tab === 'foods' ? (
          <AdminFoodsTab foods={foods} categories={categories} onRefresh={loadData} />
        ) : tab === 'users' ? (
          <AdminUsersTab profiles={profiles} onRefresh={loadData} />
        ) : (
          <AdminRevenueTab orders={orders} onResetStats={async () => {
            await supabase.from('orders').update({ payment_status: 'unpaid' }).eq('payment_status', 'paid').is('z_report_id', null);
            await loadData();
          }} />
        )}
      </div>

      <ZReportModal open={zReportOpen} onClose={() => setZReportOpen(false)} onGenerated={loadData} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: string | number; color: string }) {
  return (
    <div className="card p-4">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-2`}>
        <Icon size={20} />
      </div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-bold text-xl text-gray-900">{value}</p>
    </div>
  );
}

function StaffRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-sm font-bold`}>{count}</span>
        <span className="text-sm text-gray-700">{label}</span>
      </div>
    </div>
  );
}
