import { useState } from 'react';
import { Search, Loader2, ClipboardList, Trash2, CheckSquare, Square } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus } from '@/types';
import { OrderCard } from '@/components/OrderCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ORDER_STATUSES, formatETB } from '@/lib/utils';

interface Props {
  orders: Order[];
  onRefresh: () => void;
}

export function AdminOrdersTab({ orders, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [deleteAll, setDeleteAll] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return o.customer_name.toLowerCase().includes(q) || o.customer_phone.includes(q);
    }
    return true;
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        filtered.forEach((o) => next.delete(o.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((o) => next.add(o.id));
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdating(orderId);
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
    setUpdating(null);
    onRefresh();
  }

  async function handleSingleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from('orders').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    onRefresh();
  }

  async function handleBulkDelete() {
    setDeleting(true);
    const ids = Array.from(selected);
    await supabase.from('orders').delete().in('id', ids);
    setDeleting(false);
    setBulkDelete(false);
    clearSelection();
    onRefresh();
  }

  async function handleDeleteAll() {
    setDeleting(true);
    await supabase.from('orders').delete().gte('created_at', '2000-01-01');
    setDeleting(false);
    setDeleteAll(false);
    clearSelection();
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

      {/* Bulk action bar */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-3 p-2.5 rounded-xl bg-white border border-gray-100">
          <button onClick={toggleAll} className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-brand-600 transition">
            {allFilteredSelected ? <CheckSquare size={18} className="text-brand-600" /> : <Square size={18} className="text-gray-400" />}
            {allFilteredSelected ? 'Deselect all' : 'Select all'}
          </button>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <span className="text-sm text-gray-500">{selected.size} selected</span>
            )}
            {selected.size > 0 && (
              <button
                onClick={() => setBulkDelete(true)}
                className="btn-secondary text-red-600 hover:bg-red-50 border-red-200 py-1.5 px-3 text-xs"
              >
                <Trash2 size={14} /> Delete Selected
              </button>
            )}
            <button
              onClick={() => setDeleteAll(true)}
              className="btn-secondary text-red-600 hover:bg-red-50 border-red-200 py-1.5 px-3 text-xs"
            >
              <Trash2 size={14} /> Delete All
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-400 text-sm">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const isSelected = selected.has(order.id);
            return (
              <div key={order.id} className={`card overflow-hidden transition ${isSelected ? 'ring-2 ring-brand-400' : ''}`}>
                <div className="flex items-center gap-2 px-3 pt-3">
                  <button onClick={() => toggleOne(order.id)} className="shrink-0 p-1">
                    {isSelected ? <CheckSquare size={18} className="text-brand-600" /> : <Square size={18} className="text-gray-400" />}
                  </button>
                </div>
                <OrderCard order={order} defaultOpen={false}>
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
                    <button
                      onClick={() => setDeleteTarget(order)}
                      className="ml-auto btn-secondary text-red-600 hover:bg-red-50 border-red-200 py-1.5 px-3 text-xs"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </OrderCard>
              </div>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete Order"
          destructive
          confirmLabel="Delete"
          message={
            <>
              Delete the order from <strong>{deleteTarget.customer_name}</strong>?
              <br />
              This action cannot be undone.
            </>
          }
          onConfirm={handleSingleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <ConfirmDialog
        open={bulkDelete}
        title="Delete Selected Orders"
        destructive
        confirmLabel={`Delete ${selected.size} orders`}
        message={
          <>
            Delete <strong>{selected.size} selected order{selected.size > 1 ? 's' : ''}</strong>?
            <br />
            This action cannot be undone.
          </>
        }
        onConfirm={handleBulkDelete}
        onClose={() => setBulkDelete(false)}
      />

      <ConfirmDialog
        open={deleteAll}
        title="Delete ALL Orders"
        destructive
        confirmLabel="Delete Everything"
        requireText="DELETE ALL"
        message={
          <>
            This will permanently delete <strong>all {orders.length} orders</strong> and their items.
            <br />
            This action cannot be undone.
          </>
        }
        onConfirm={handleDeleteAll}
        onClose={() => setDeleteAll(false)}
      />

      {deleting && (
        <div className="fixed inset-0 z-40 bg-black/20 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-white" />
        </div>
      )}
    </div>
  );
}
