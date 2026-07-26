import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, RotateCcw, Calendar } from 'lucide-react';
import type { Order } from '@/types';
import { formatETB, formatDate } from '@/lib/utils';

const COMPLETED_STATES: string[] = ['completed', 'delivered', 'paid'];
import { ConfirmDialog } from '@/components/ConfirmDialog';

type Period = 'day' | 'week' | 'month' | 'year' | 'all';

interface Props {
  orders: Order[];
  onResetStats: () => void;
}

export function AdminRevenueTab({ orders, onResetStats }: Props) {
  const [period, setPeriod] = useState<Period>('all');
  const [showReset, setShowReset] = useState(false);
  const [, setResetting] = useState(false);

  const completedOrders = useMemo(
    () => orders.filter((o) => COMPLETED_STATES.includes(o.status)),
    [orders],
  );

  const filtered = useMemo(() => {
    if (period === 'all') return completedOrders;
    const now = new Date();
    const start = new Date(now);
    if (period === 'day') start.setHours(0, 0, 0, 0);
    else if (period === 'week') start.setDate(now.getDate() - 7);
    else if (period === 'month') start.setMonth(now.getMonth() - 1);
    else if (period === 'year') start.setFullYear(now.getFullYear() - 1);
    return completedOrders.filter((o) => new Date(o.created_at) >= start);
  }, [completedOrders, period]);

  const totalRevenue = filtered.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const orderCount = filtered.length;
  const avgOrder = orderCount > 0 ? totalRevenue / orderCount : 0;

  const periodLabels: Record<Period, string> = {
    day: 'Today',
    week: 'Last 7 days',
    month: 'Last 30 days',
    year: 'Last 12 months',
    all: 'All time',
  };

  async function handleReset() {
    setResetting(true);
    await onResetStats();
    setResetting(false);
    setShowReset(false);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-stretch sm:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                period === p
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowReset(true)}
          className="btn-secondary shrink-0 text-red-600 hover:bg-red-50 border-red-200"
        >
          <RotateCcw size={16} /> Reset Stats
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="card p-5">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-3">
            <DollarSign size={20} />
          </div>
          <p className="text-xs text-gray-400">Revenue ({periodLabels[period]})</p>
          <p className="font-bold text-2xl text-gray-900">{formatETB(totalRevenue)}</p>
        </div>
        <div className="card p-5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <ShoppingBag size={20} />
          </div>
          <p className="text-xs text-gray-400">Paid Orders</p>
          <p className="font-bold text-2xl text-gray-900">{orderCount}</p>
        </div>
        <div className="card p-5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <TrendingUp size={20} />
          </div>
          <p className="text-xs text-gray-400">Average Order</p>
          <p className="font-bold text-2xl text-gray-900">{formatETB(avgOrder)}</p>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" /> Paid Orders Breakdown
        </h3>
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No paid orders in this period.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between text-sm py-2.5 border-b border-gray-50 last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{order.customer_name}</p>
                  <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                </div>
                <span className="font-semibold text-green-600 shrink-0">{formatETB(order.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showReset}
        title="Reset Revenue Statistics"
        destructive
        confirmLabel="Reset Stats"
        message={
          <>
            This will reset all revenue statistics to zero by marking paid orders as unpaid.
            <br />
            <strong>The orders themselves will NOT be deleted.</strong>
          </>
        }
        requireText="RESET"
        onConfirm={handleReset}
        onClose={() => setShowReset(false)}
      />
    </div>
  );
}
