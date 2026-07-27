import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Package, MapPin, Phone, Clock, Truck, User, CheckCircle2, Navigation } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useOrdersRealtime } from '@/hooks/useRealtimeOrders';
import type { Order } from '@/types';
import { formatETB, formatDateTime, getStatusInfo, ORDER_STATUSES } from '@/lib/utils';
import { CustomerHeader } from '@/components/Headers';

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      setOrders(data ?? []);
    } catch {
      // network error — keep existing orders, don't freeze
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user) loadOrders(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useOrdersRealtime(
    loadOrders,
    user ? `customer_id=eq.${user.id}` : undefined,
  );

  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const pastOrders = orders.filter((o) => ['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="font-display font-bold text-xl text-gray-900 mb-6">My Orders</h1>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm mb-4">You haven't placed any orders yet.</p>
            <Link to="/menu" className="btn-primary">Browse Menu</Link>
          </div>
        ) : (
          <>
            {activeOrders.length > 0 && (
              <section className="mb-8">
                <h2 className="font-semibold text-sm text-gray-700 mb-3">Active Orders</h2>
                <div className="space-y-3">
                  {activeOrders.map((order) => (
                    <OrderCard key={order.id} order={order} active />
                  ))}
                </div>
              </section>
            )}

            {pastOrders.length > 0 && (
              <section>
                <h2 className="font-semibold text-sm text-gray-700 mb-3">Past Orders</h2>
                <div className="space-y-3">
                  {pastOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, active }: { order: Order; active?: boolean }) {
  const statusInfo = getStatusInfo(order.status);
  const currentStep = ORDER_STATUSES.find((s) => s.value === order.status)?.step ?? -1;

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${statusInfo.color}`}>{statusInfo.label}</span>
            <span className="text-xs text-gray-400">{formatDateTime(order.created_at)}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">{formatETB(order.total)}</p>
        </div>
        <Package size={20} className="text-gray-300" />
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        {order.order_items?.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {item.food_name} × {item.quantity}
            </span>
            <span className="text-gray-500">{formatETB(item.subtotal)}</span>
          </div>
        ))}
      </div>

      {/* Delivery info */}
      <div className="flex items-start gap-2 text-xs text-gray-500 mb-3 pt-3 border-t border-gray-50">
        <MapPin size={14} className="shrink-0 mt-0.5" />
        <span>{order.delivery_address}</span>
      </div>

      {/* Progress tracker for active orders */}
      {active && order.status !== 'cancelled' && (
        <div className="pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1">
            {ORDER_STATUSES.filter((s) => s.step >= 0 && s.step <= 5).map((status) => {
              const isCompleted = currentStep >= status.step;
              const isCurrent = currentStep === status.step;
              return (
                <div key={status.value} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      isCompleted
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-2 ring-brand-300 ring-offset-1' : ''}`}
                  >
                    {status.step + 1}
                  </div>
                  <span className={`text-[10px] mt-1 text-center hidden sm:block ${isCompleted ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {order.status === 'cancelled' && (
        <div className="pt-3 border-t border-gray-50">
          <p className="text-xs text-red-500 flex items-center gap-1">
            <Clock size={12} /> This order was cancelled
          </p>
        </div>
      )}

      {/* Driver contact card — shown when a driver has been assigned */}
      {order.driver_name && ['ready', 'out_for_delivery', 'delivered'].includes(order.status) && (
        <DriverContactCard
          driverName={order.driver_name}
          driverPhone={order.driver_phone}
          status={order.status}
        />
      )}
    </div>
  );
}

function DriverContactCard({
  driverName,
  driverPhone,
  status,
}: {
  driverName: string;
  driverPhone: string | null;
  status: string;
}) {
  const deliverySteps: { value: string; label: string; icon: typeof Truck }[] = [
    { value: 'ready', label: 'Driver Assigned', icon: User },
    { value: 'out_for_delivery', label: 'Out for Delivery', icon: Navigation },
    { value: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];
  const currentStepIdx = deliverySteps.findIndex((s) => s.value === status);

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
        {/* Driver info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0">
            {driverName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Truck size={14} className="text-blue-600 shrink-0" />
              <p className="font-semibold text-sm text-gray-900 truncate">Your Driver: {driverName}</p>
            </div>
            {driverPhone && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <Phone size={11} /> {driverPhone}
              </p>
            )}
          </div>
        </div>

        {/* Delivery status steps */}
        <div className="flex items-center gap-1 mb-3">
          {deliverySteps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={step.value} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition ${
                    isCompleted
                      ? 'bg-blue-600 text-white'
                      : isCurrent
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1'
                        : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <Icon size={13} />
                </div>
                <span
                  className={`text-[10px] mt-1 text-center leading-tight ${
                    isCompleted || isCurrent ? 'text-gray-800 font-medium' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Call button */}
        {driverPhone && status !== 'delivered' && (
          <a
            href={`tel:${driverPhone}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-95 transition shadow-sm"
          >
            <Phone size={16} /> Call Driver
          </a>
        )}

        {status === 'delivered' && (
          <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-100 text-green-700 font-semibold text-sm">
            <CheckCircle2 size={16} /> Delivered Successfully
          </div>
        )}
      </div>
    </div>
  );
}
