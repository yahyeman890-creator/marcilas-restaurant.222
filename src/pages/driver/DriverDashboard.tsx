import { useState, useEffect, useCallback } from 'react';
import { Truck, MapPin, Phone, User, CheckCircle2, Navigation, Loader2, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Order } from '@/types';
import { StaffHeader } from '@/components/Headers';
import { formatETB, formatDateTime } from '@/lib/utils';

export function DriverDashboard() {
  const { user } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState<'available' | 'active' | 'delivered'>('available');

  const loadOrders = useCallback(async () => {
    if (!user) return;
    const [availRes, myRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('status', 'ready')
        .is('driver_id', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false }),
    ]);
    setAvailableOrders(availRes.data ?? []);
    setMyOrders(myRes.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function acceptOrder(orderId: string) {
    if (!user) return;
    setUpdating(orderId);
    await supabase
      .from('orders')
      .update({
        driver_id: user.id,
        driver_name: user.full_name,
        driver_phone: user.phone,
        status: 'out_for_delivery',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);
    setUpdating(null);
    loadOrders();
  }

  async function markDelivered(orderId: string) {
    setUpdating(orderId);
    await supabase
      .from('orders')
      .update({ status: 'delivered', updated_at: new Date().toISOString() })
      .eq('id', orderId);
    setUpdating(null);
    loadOrders();
  }

  const activeDeliveries = myOrders.filter((o) => o.status === 'out_for_delivery');
  const deliveredOrders = myOrders.filter((o) => o.status === 'delivered');

  const displayOrders = tab === 'available' ? availableOrders : tab === 'active' ? activeDeliveries : deliveredOrders;

  return (
    <div className="min-h-screen bg-gray-50">
      <StaffHeader title="Driver Dashboard" subtitle={user?.full_name} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard icon={Package} label="Available" value={availableOrders.length} color="text-cyan-600 bg-cyan-50" />
          <StatCard icon={Truck} label="In Transit" value={activeDeliveries.length} color="text-indigo-600 bg-indigo-50" />
          <StatCard icon={CheckCircle2} label="Delivered" value={deliveredOrders.length} color="text-green-600 bg-green-50" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { value: 'available' as const, label: 'Available' },
            { value: 'active' as const, label: 'My Active' },
            { value: 'delivered' as const, label: 'Delivered' },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
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
        ) : displayOrders.length === 0 ? (
          <div className="text-center py-16">
            <Truck size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              {tab === 'available' ? 'No orders waiting for delivery.' : tab === 'active' ? 'No active deliveries.' : 'No completed deliveries yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayOrders.map((order) => (
              <div key={order.id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900">{order.customer_name}</span>
                      <span className="text-xs text-gray-400">{formatDateTime(order.created_at)}</span>
                    </div>
                    <p className="font-bold text-brand-600">{formatETB(order.total)}</p>
                  </div>
                  <Package size={20} className="text-gray-300" />
                </div>

                {/* Items */}
                <div className="space-y-1 mb-3 p-2.5 rounded-lg bg-gray-50">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.food_name} × {item.quantity}</span>
                      <span className="text-gray-500">{formatETB(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Customer info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="text-brand-600 shrink-0" />
                    <span>{order.delivery_address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-brand-600 shrink-0" />
                    <a href={`tel:${order.customer_phone}`} className="hover:underline">{order.customer_phone}</a>
                  </div>
                </div>

                {/* Actions */}
                {tab === 'available' && (
                  <button
                    onClick={() => acceptOrder(order.id)}
                    disabled={updating === order.id}
                    className="btn-primary w-full py-2.5"
                  >
                    {updating === order.id ? <Loader2 size={16} className="animate-spin" /> : <><Navigation size={16} /> Accept Delivery</>}
                  </button>
                )}
                {tab === 'active' && (
                  <button
                    onClick={() => markDelivered(order.id)}
                    disabled={updating === order.id}
                    className="btn-primary w-full py-2.5 bg-green-600 hover:bg-green-700"
                  >
                    {updating === order.id ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Mark as Delivered</>}
                  </button>
                )}
                {tab === 'delivered' && (
                  <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    <CheckCircle2 size={16} /> Delivered successfully
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Truck; label: string; value: number; color: string }) {
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
