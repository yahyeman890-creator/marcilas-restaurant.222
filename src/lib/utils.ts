import type { OrderStatus, PaymentStatus, Order } from '@/types';

export const ORDER_STATUSES: { value: OrderStatus; label: string; color: string; step: number }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', step: 0 },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-700 border-blue-200', step: 1 },
  { value: 'preparing', label: 'Preparing', color: 'bg-purple-100 text-purple-700 border-purple-200', step: 2 },
  { value: 'ready', label: 'Ready for Delivery', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', step: 3 },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', step: 4 },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700 border-green-200', step: 5 },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', step: -1 },
];

export function getStatusInfo(status: OrderStatus) {
  return ORDER_STATUSES.find((s) => s.value === status) ?? ORDER_STATUSES[0];
}

export function getNextStatus(status: OrderStatus): OrderStatus | null {
  const order: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
  const idx = order.indexOf(status);
  if (idx === -1 || idx === order.length - 1) return null;
  return order[idx + 1];
}

export function formatETB(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${Math.round(num)} ETB`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} • ${formatTime(dateStr)}`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function isBusinessToday(order: Pick<Order, 'business_date'>): boolean {
  return order.business_date === new Date().toISOString().slice(0, 10);
}

const COMPLETED_STATES: string[] = ['completed', 'delivered', 'paid'];

export function sumShiftRevenue(orders: Order[]): number {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return orders
    .filter(
      (o) =>
        COMPLETED_STATES.includes(o.status) &&
        new Date(o.created_at) >= startOfToday,
    )
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
}

export function normalizePhone(phone: string): string | null {
  if (!phone) return null;
  let p = phone.trim().replace(/\s+/g, '');
  if (p.startsWith('+251')) p = p.slice(4);
  else if (p.startsWith('251')) p = p.slice(3);
  else if (p.startsWith('0')) p = p.slice(1);
  if (/^9\d{8}$/.test(p)) return '+251' + p;
  return null;
}

export function paymentStatusInfo(status: PaymentStatus): { label: string; color: string } {
  return status === 'paid'
    ? { label: 'Paid', color: 'bg-green-100 text-green-700 border-green-200' }
    : { label: 'Unpaid', color: 'bg-orange-100 text-orange-700 border-orange-200' };
}
