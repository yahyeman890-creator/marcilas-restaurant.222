import { useState, useEffect } from 'react';
import { Search, Loader2, ClipboardList } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus } from '@/types';
import { OrderCard } from '@/components/OrderCard';
import { ORDER_STATUSES, formatETB } from '@/lib/utils';

interface Props {
  orders: Order[];
  onRefresh: () => void;
}

export function AdminOrdersTab({ orders, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return o.customer_name.toLowerCase().includes(q) || o.customer_phone.includes(q);
    }
    return true;
  });

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdating(orderId);
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
    setUpdating(null);
    onRefresh();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name or phone..."
            className="input pl-11"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input sm:w-44">
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="mb-4 p-3 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-between">
        <span className="text-sm text-gray-600">Showing {filtered.length} orders</span>
        <span className="text-sm font-bold text-brand-700">
          Total: {formatETB(filtered.reduce((s, o) => s + Number(o.total), 0))}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-400 text-sm">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order}>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-gray-500 font-medium">Change status:</label>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                  disabled={updating === order.id}
                  className="input py-1.5 text-xs w-auto"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {updating === order.id && <Loader2 size={14} className="animate-spin text-gray-400" />}
              </div>
            </OrderCard>
          ))}
        </div>
      )}
    </div>
  );
}
