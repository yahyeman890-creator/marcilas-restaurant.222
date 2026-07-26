import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CheckCircle2, ChefHat, PackageCheck, DollarSign, ClipboardList, Loader2, Receipt, Bell, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/types';
import { StaffHeader } from '@/components/Headers';
import { OrderCard } from '@/components/OrderCard';
import { ZReportModal } from '@/components/ZReportModal';
import { ZReportsHistoryTab } from '@/pages/admin/ZReportsHistoryTab';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { formatETB, getNextStatus, sumShiftRevenue } from '@/lib/utils';

function playNewOrderBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    osc.onended = () => ctx.close();
  } catch {
    // Audio not available — silent fallback
  }
}

type Tab = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'all' | 'history';

export function CashierDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allActiveOrders, setAllActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('pending');
  const [updating, setUpdating] = useState<string | null>(null);
  const [zReportOpen, setZReportOpen] = useState(false);
  const [todayClosed, setTodayClosed] = useState(false);
  const [newOrderToast, setNewOrderToast] = useState<string | null>(null);
  const knownOrderIds = useRef<Set<string>>(new Set());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const [tabRes, allRes, todayReportRes] = await Promise.all([
      query,
      supabase
        .from('orders')
        .select('*, order_items(*)')
        .is('z_report_id', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('z_reports')
        .select('id')
        .eq('business_date', new Date().toISOString().slice(0, 10))
        .maybeSingle(),
    ]);

    setOrders(tabRes.data ?? []);
    setAllActiveOrders(allRes.data ?? []);
    setLoading(false);

    if (knownOrderIds.current.size === 0 && allRes.data) {
      allRes.data.forEach((o) => knownOrderIds.current.add(o.id));
    }

    setTodayClosed(!!todayReportRes.data);
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    loadOrders();
  }, [loadOrders]);

  // Real-time: re-fetch on any order change, and notify on new orders
  useRealtimeOrders({
    onChange: (payload) => {
      loadOrders();
      if (payload.eventType === 'INSERT' && payload.new?.id) {
        const newId = payload.new.id as string;
        if (!knownOrderIds.current.has(newId)) {
          knownOrderIds.current.add(newId);
          playNewOrderBeep();
          const name = (payload.new as { customer_name?: string }).customer_name ?? 'New order';
          setNewOrderToast(`New order from ${name}`);
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setNewOrderToast(null), 4000);
        }
      }
    },
  });

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

  const newCount = useMemo(
    () => allActiveOrders.filter((o) => o.status === 'pending').length,
    [allActiveOrders],
  );
  const preparingCount = useMemo(
    () => allActiveOrders.filter((o) => o.status === 'confirmed' || o.status === 'preparing').length,
    [allActiveOrders],
  );
  const readyCount = useMemo(
    () => allActiveOrders.filter((o) => o.status === 'ready').length,
    [allActiveOrders],
  );
  const revenueToday = useMemo(
    () => sumShiftRevenue(allActiveOrders),
    [allActiveOrders],
  );

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
          <StatCard icon={ClipboardList} label="New" value={newCount} color="text-amber-600 bg-amber-50" />
          <StatCard icon={ChefHat} label="Preparing" value={preparingCount} color="text-purple-600 bg-purple-50" />
          <StatCard icon={PackageCheck} label="Ready" value={readyCount} color="text-cyan-600 bg-cyan-50" />
          <StatCard icon={DollarSign} label="Revenue" value={formatETB(revenueToday)} color="text-green-600 bg-green-50" />
        </div>

        {/* Z Report button */}
        <div className="mb-4">
          <button onClick={() => setZReportOpen(true)} className="btn-primary w-full sm:w-auto" disabled={todayClosed}>
            <Receipt size={16} /> {todayClosed ? 'Today Already Closed' : 'Generate Z Report (Daily Closing)'}
          </button>
        </div>

        {tab === 'history' ? (
          <div>
            <button
              onClick={() => setTab('pending')}
              className="btn-secondary mb-4"
            >
              <ArrowLeft size={16} /> Back to New Orders
            </button>
            <ZReportsHistoryTab />
          </div>
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
                    {next && order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, next)}
                        disabled={updating === order.id}
                        className="btn-primary text-xs py-2"
                      >
                        {updating === order.id ? <Loader2 size={14} className="animate-spin" /> : null}
                        {order.status === 'pending' && <><CheckCircle2 size={14} /> Confirm Order</>}
                        {order.status === 'confirmed' && <><ChefHat size={14} /> Start Preparing</>}
                        {order.status === 'preparing' && <><PackageCheck size={14} /> Mark Ready</>}
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2">
                        <PackageCheck size={14} /> Awaiting Driver
                      </span>
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

      {newOrderToast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 bg-white border border-brand-200 shadow-lg rounded-xl px-4 py-3 max-w-sm">
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
              <Bell size={18} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{newOrderToast}</p>
              <p className="text-xs text-gray-500">Check the New Orders tab</p>
            </div>
            <button onClick={() => setNewOrderToast(null)} className="ml-auto text-gray-400 hover:text-gray-600 shrink-0">
              ×
            </button>
          </div>
        </div>
      )}
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
