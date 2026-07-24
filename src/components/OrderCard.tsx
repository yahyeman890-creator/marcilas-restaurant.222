import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Phone, User, Clock, Package } from 'lucide-react';
import type { Order } from '@/types';
import { formatETB, formatDateTime, timeAgo, getStatusInfo, paymentStatusInfo } from '@/lib/utils';
import { StarRating } from '@/components/StarRating';

interface OrderCardProps {
  order: Order;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

export function OrderCard({ order, children, defaultOpen = false }: OrderCardProps) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const statusInfo = getStatusInfo(order.status);
  const payInfo = paymentStatusInfo(order.payment_status);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
            <Package size={18} className="text-brand-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`badge ${statusInfo.color}`}>{statusInfo.label}</span>
              <span className={`badge ${payInfo.color}`}>{payInfo.label}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{order.customer_name}</p>
            <p className="text-xs text-gray-400">{timeAgo(order.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-bold text-sm text-gray-900">{formatETB(order.total)}</span>
          {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 animate-slide-up">
          {/* Customer info */}
          <div className="grid sm:grid-cols-2 gap-2 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User size={14} className="text-gray-400 shrink-0" />
              <span className="truncate">{order.customer_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={14} className="text-gray-400 shrink-0" />
              <span>{order.customer_phone}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600 sm:col-span-2">
              <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
              <span>{order.delivery_address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={14} className="text-gray-400 shrink-0" />
              <span>{formatDateTime(order.created_at)}</span>
            </div>
          </div>

          {order.notes && (
            <div className="mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-sm text-amber-700">
              <span className="font-medium">Note: </span>{order.notes}
            </div>
          )}

          {/* Items */}
          <div className="space-y-1.5 mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</p>
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex-1">
                  <span className="text-gray-700 font-medium">{item.food_name}</span>
                  <span className="text-gray-400 ml-2">× {item.quantity}</span>
                </div>
                <span className="text-gray-600">{formatETB(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 mb-3">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-brand-600">{formatETB(order.total)}</span>
          </div>

          {/* Driver info */}
          {order.driver_name && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
              <User size={14} className="text-blue-500" />
              <span>Driver: <strong>{order.driver_name}</strong></span>
              {order.driver_phone && (
                <a href={`tel:${order.driver_phone}`} className="ml-auto flex items-center gap-1 text-blue-600 hover:underline">
                  <Phone size={13} /> {order.driver_phone}
                </a>
              )}
            </div>
          )}

          {/* Actions */}
          {children}
        </div>
      )}
    </div>
  );
}
