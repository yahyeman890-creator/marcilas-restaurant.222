import { useState, useEffect, useCallback } from 'react';
import { Truck, MapPin, Phone, CheckCircle2, Navigation, Loader2, Package, Crosshair, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useOrdersRealtime } from '@/hooks/useRealtimeOrders';
import { useNotifications } from '@/hooks/useNotifications';
import type { Order } from '@/types';
import { StaffHeader } from '@/components/Headers';
import { DeliveryMap } from '@/components/DeliveryMap';
import { formatETB, formatDateTime } from '@/lib/utils';

export function DriverDashboard() {
  const { user } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState<'available' | 'active' | 'delivered'>('available');
  const [mapOrder, setMapOrder] = useState<Order | null>(null);
  const gps = useGeolocation();
  const { notifyOrderReady } = useNotifications();

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
    setAvailableOrders((prev) => {
      // Notify for any newly-ready orders not previously seen
      const prevIds = new Set(prev.map((o) => o.id));
      (availRes.data ?? []).forEach((o) => {
        if (!prevIds.has(o.id)) notifyOrderReady(o.id, o.customer_name);
      });
      return availRes.data ?? [];
    });
    setMyOrders(myRes.data ?? []);
    setLoading(false);
  }, [user, notifyOrderReady]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Real-time: re-fetch whenever an order assigned to this driver changes
  useOrdersRealtime(loadOrders);

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

  async function captureDriverLocation() {
    try {
      await gps.getLocation();
    } catch {
      // error handled in hook
    }
  }

  const activeDeliveries = myOrders.filter((o) => o.status === 'out_for_delivery');
  const deliveredOrders = myOrders.filter((o) => o.status === 'delivered');

  const displayOrders = tab === 'available' ? availableOrders : tab === 'active' ? activeDeliveries : deliveredOrders;

  const mapCustomerMarker =
    mapOrder && mapOrder.delivery_lat && mapOrder.delivery_lng
      ? { lat: mapOrder.delivery_lat, lng: mapOrder.delivery_lng, label: mapOrder.customer_name, color: 'red' as const }
      : null;

  const mapDriverMarker =
    gps.lat && gps.lng
      ? { lat: gps.lat, lng: gps.lng, label: 'You', color: 'blue' as const }
      : null;

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

        {/* Driver location capture */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Crosshair size={18} className="text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Your Location</p>
                <p className="text-xs text-gray-500">
                  {gps.lat ? `${gps.lat.toFixed(6)}, ${gps.lng?.toFixed(6)}` : 'Not captured yet'}
                </p>
              </div>
            </div>
            <button
              onClick={captureDriverLocation}
              disabled={gps.loading}
              className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
            >
              {gps.loading ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
              {gps.lat ? 'Re-capture' : 'Capture My Location'}
            </button>
          </div>
          {gps.error && (
            <p className="text-xs text-red-500 mt-2">{gps.error}</p>
          )}
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
                    <span>
                      {order.delivery_lat && order.delivery_lng
                        ? `GPS: ${order.delivery_lat.toFixed(6)}, ${order.delivery_lng.toFixed(6)}`
                        : order.delivery_address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-brand-600 shrink-0" />
                    <a href={`tel:${order.customer_phone}`} className="hover:underline">{order.customer_phone}</a>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {tab === 'available' && (
                    <button
                      onClick={() => acceptOrder(order.id)}
                      disabled={updating === order.id}
                      className="btn-primary flex-1 py-2.5"
                    >
                      {updating === order.id ? <Loader2 size={16} className="animate-spin" /> : <><Navigation size={16} /> Accept Delivery</>}
                    </button>
                  )}
                  {tab === 'active' && (
                    <>
                      <button
                        onClick={() => setMapOrder(order)}
                        disabled={!order.delivery_lat || !order.delivery_lng}
                        className="btn-secondary flex-1 py-2.5 disabled:opacity-50"
                      >
                        <MapPin size={16} /> View Map
                      </button>
                      <button
                        onClick={() => markDelivered(order.id)}
                        disabled={updating === order.id}
                        className="btn-primary flex-1 py-2.5 bg-green-600 hover:bg-green-700"
                      >
                        {updating === order.id ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Delivered</>}
                      </button>
                    </>
                  )}
                  {tab === 'delivered' && (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium w-full">
                      <CheckCircle2 size={16} /> Delivered successfully
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Modal */}
      {mapOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMapOrder(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h3 className="font-display font-bold text-lg text-gray-900">Delivery Location</h3>
                <p className="text-sm text-gray-500">{mapOrder.customer_name} · {mapOrder.customer_phone}</p>
              </div>
              <button onClick={() => setMapOrder(null)} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 min-h-[400px] relative">
              {mapCustomerMarker ? (
                <DeliveryMap
                  customerMarker={mapCustomerMarker}
                  driverMarker={mapDriverMarker}
                  showRoute={!!mapDriverMarker}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No GPS coordinates for this order
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 space-y-2">
              {!gps.lat && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <Crosshair size={16} className="text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Capture your location to see the route to the customer.
                  </p>
                </div>
              )}
              <a
                href={`https://www.openstreetmap.org/directions?from=${gps.lat ?? ''}%2C${gps.lng ?? ''}&to=${mapOrder.delivery_lat}%2C${mapOrder.delivery_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                <Navigation size={16} /> Open in Maps
              </a>
            </div>
          </div>
        </div>
      )}
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
