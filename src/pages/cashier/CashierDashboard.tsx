import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, ChefHat, PackageCheck, DollarSign, ClipboardList, Loader2, Receipt } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/types';
import { StaffHeader } from '@/components/Headers';
import { OrderCard } from '@/components/OrderCard';
import { ZReportModal } from '@/components/ZReportModal';
import { ZReportsHistoryTab } from '@/pages/admin/ZReportsHistoryTab';
import { formatETB, getNextStatus } from '@/lib/utils';

type Tab = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'all' | 'history';

export function CashierDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('pending');
  const [updating, setUpdating] = useState<string | null>(null);
  const [zReportOpen, setZReportOpen] = useState(false);
  const [todayClosed, setTodayClosed] = useState(false);

  const loadOrders = useCallback(async () => {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .is('z_report_id', null)
      .order('created_at', { ascending: false });

    if (tab === 'pending') query = query.eq('status', 'pending');
    else if (tab === 'confirmed') query = query.eq('status', 'confirmed');
    else if (tab === 'preparing') query = query.eq('status', 'preparing');
    else if (tab === 'ready') query = query.eq('status', 'ready');

    const { data } = await query;
    setOrders(data ?? []);
    setLoading(false);

    const { data: todayReport } = await supabase
      .from('z_reports')
      .select('id')
      .eq('business_date', new Date().toISOString().slice(0, 10))
      .maybeSingle();
    setTodayClosed(!!todayReport);
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    loadOrders();
  }, [loadOrders]);

  async function updateOrderStatus(orderId: string, status: string) {
    setUpdating(orderId);
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
    setUpdating(null);
    loadOrders();
  }

  async function togglePayment(orderId: string, currentStatus: string) {
    setUpdating(orderId);
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    await supabase.from('orders').update({ payment_status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
    setUpdating(null);
    loadOrders();
  }

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: 'pending', label: 'New Orders' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'all', label: 'All' },
    { value: 'history', label: 'History' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <StaffHeader title="Cashier Dashboard" subtitle="Manage orders & payments" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon={ClipboardList} label="New" value={orders.filter((o) => o.status === 'pending').length} color="text-amber-600 bg-amber-50" />
          <StatCard icon={ChefHat} label="Preparing" value={orders.filter((o) => o.status === 'preparing').length} color="text-purple-600 bg-purple-50" />
          <StatCard icon={PackageCheck} label="Ready" value={orders.filter((o) => o.status === 'ready').length} color="text-cyan-600 bg-cyan-50" />
          <StatCard icon={DollarSign} label="Revenue" value={formatETB(orders.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total), 0))} color="text-green-600 bg-green-50" />
        </div>

        {/* Z Report button */}
        <div className="mb-4">
          <button onClick={() => setZReportOpen(true)} className="btn-primary w-full sm:w-auto" disabled={todayClosed}>
            <Receipt size={16} /> {todayClosed ? 'Today Already Closed' : 'Generate Z Report (Daily Closing)'}
          </button>
        </div>

        {tab === 'history' ? (
          <ZReportsHistoryTab />
        ) : (
        <>
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === t.value ? 'bg-brand-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No orders in this category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const next = getNextStatus(order.status);
              return (
                <OrderCard key={order.id} order={order} defaultOpen={order.status === 'pending'}>
                  <div className="flex flex-wrap gap-2">
                    {next && order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, next)}
                        disabled={updating === order.id}
                        className="btn-primary text-xs py-2"
                      >
                        {updating === order.id ? <Loader2 size={14} className="animate-spin" /> : null}
                        {order.status === 'pending' && <><CheckCircle2 size={14} /> Confirm Order</>}
                        {order.status === 'confirmed' && <><ChefHat size={14} /> Start Preparing</>}
                        {order.status === 'preparing' && <><PackageCheck size={14} /> Mark Ready</>}
                        {order.status === 'ready' && <><PackageCheck size={14} /> Send to Delivery</>}
                      </button>
                    )}
                    <button
                      onClick={() => togglePayment(order.id, order.payment_status)}
                      disabled={updating === order.id}
                      className={`btn text-xs py-2 ${
                        order.payment_status === 'paid'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      }`}
                    >
                      <DollarSign size={14} />
                      {order.payment_status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                    </button>
                  </div>
                </OrderCard>
              );
            })}
          </div>
        )}
        </>
        )}
      </div>

      <ZReportModal open={zReportOpen} onClose={() => setZReportOpen(false)} onGenerated={loadOrders} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof ClipboardList; label: string; value: string | number; color: string }) {
  return (
    <div className="card p-3.5">
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mb-2`}>
        <Icon size={18} />
      </div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-bold text-lg text-gray-900">{value}</p>
    </div>
  );
}
