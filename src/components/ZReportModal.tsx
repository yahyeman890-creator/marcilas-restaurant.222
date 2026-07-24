import { useState, useMemo } from 'react';
import { Printer, Download, X, Receipt, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Order, ZReport } from '@/types';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatETB, formatDateTime } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onGenerated: () => void;
}

export function ZReportModal({ open, onClose, onGenerated }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<'preview' | 'result'>('preview');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [report, setReport] = useState<ZReport | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const openOrders = useMemo<Order[]>([], []);

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      // Fetch all unclosed orders (no z_report_id) for today
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .is('z_report_id', null)
        .gte('business_date', '2000-01-01')
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      const orderList = orders ?? [];
      const totalOrders = orderList.length;
      const completedOrders = orderList.filter((o) => o.status === 'delivered').length;
      const cancelledOrders = orderList.filter((o) => o.status === 'cancelled').length;
      const totalRevenue = orderList
        .filter((o) => o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total), 0);

      // Get next report number
      const { data: lastReport } = await supabase
        .from('z_reports')
        .select('report_number')
        .order('report_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const reportNumber = (lastReport?.report_number ?? 0) + 1;

      const { data: newReport, error: insertError } = await supabase
        .from('z_reports')
        .insert({
          report_number: reportNumber,
          business_date: today,
          total_orders: totalOrders,
          completed_orders: completedOrders,
          cancelled_orders: cancelledOrders,
          total_revenue: totalRevenue,
          total_discounts: 0,
          order_snapshot: orderList,
          generated_by: user?.id ?? null,
          generated_by_name: user?.full_name ?? 'Unknown',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Tag all those orders with the z_report_id
      const orderIds = orderList.map((o) => o.id);
      if (orderIds.length > 0) {
        await supabase
          .from('orders')
          .update({ z_report_id: newReport.id })
          .in('id', orderIds);
      }

      setReport(newReport);
      setStep('result');
      onGenerated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate Z Report');
    } finally {
      setGenerating(false);
      setConfirmOpen(false);
    }
  }

  function handleClose() {
    setStep('preview');
    setReport(null);
    setError('');
    onClose();
  }

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    if (!report) return;
    const content = generateReportText(report);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `z-report-${report.report_number}-${report.business_date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Modal open={open} onClose={handleClose} title="Z Report — Daily Closing" size="lg">
      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {step === 'preview' ? (
        <ZReportPreview onGenerate={() => setConfirmOpen(true)} generating={generating} />
      ) : report ? (
        <div>
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-green-50 border border-green-100">
            <CheckCircle2 size={20} className="text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Z Report #{report.report_number} generated successfully. Today's orders are now closed.
            </span>
          </div>

          <div className="print-area">
            <ZReportDocument report={report} />
          </div>

          <div className="flex gap-3 mt-5 no-print">
            <button onClick={handlePrint} className="btn-secondary flex-1">
              <Printer size={16} /> Print
            </button>
            <button onClick={handleDownload} className="btn-secondary flex-1">
              <Download size={16} /> Download
            </button>
            <button onClick={handleClose} className="btn-primary flex-1">
              Done
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Generate Z Report"
        destructive
        confirmLabel="Close Day"
        message={
          <>
            This will close today's business day and archive all open orders into a Z Report.
            <br />
            <strong>New orders will belong to the next business day.</strong>
            <br />
            No orders will be deleted.
          </>
        }
        onConfirm={handleGenerate}
        onClose={() => setConfirmOpen(false)}
      />
    </Modal>
  );
}

function ZReportPreview({ onGenerate, generating }: { onGenerate: () => void; generating: boolean }) {
  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
        <Receipt size={28} className="text-brand-600" />
      </div>
      <h3 className="font-display font-bold text-lg text-gray-900 mb-2">Daily Closing (Z Report)</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
        Generate a Z Report to close today's business day. This will snapshot all open orders,
        calculate daily totals, and archive them. New orders will automatically be assigned to
        the next business day.
      </p>
      <button onClick={onGenerate} disabled={generating} className="btn-primary">
        {generating ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />}
        Generate Z Report
      </button>
    </div>
  );
}

export function ZReportDocument({ report }: { report: ZReport }) {
  const orders = report.order_snapshot ?? [];
  const paidRevenue = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-900 pb-4 mb-4">
        <h1 className="font-display font-bold text-xl text-gray-900">MARCILAS RESTAURANT</h1>
        <p className="text-xs text-gray-500">Dire Dawa, Ethiopia</p>
        <h2 className="font-display font-bold text-lg text-gray-800 mt-3">Z REPORT — Daily Closing</h2>
        <p className="text-sm text-gray-600">Report #{report.report_number}</p>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
        <div>
          <p className="text-gray-400 text-xs">Business Date</p>
          <p className="font-semibold text-gray-900">{report.business_date}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Generated At</p>
          <p className="font-semibold text-gray-900">{formatDateTime(report.generated_at)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Generated By</p>
          <p className="font-semibold text-gray-900">{report.generated_by_name}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Total Orders</p>
          <p className="font-semibold text-gray-900">{report.total_orders}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <SummaryBox label="Total Orders" value={report.total_orders.toString()} />
        <SummaryBox label="Completed" value={report.completed_orders.toString()} color="text-green-600" />
        <SummaryBox label="Cancelled" value={report.cancelled_orders.toString()} color="text-red-600" />
        <SummaryBox label="Discounts" value={formatETB(report.total_discounts)} color="text-orange-600" />
      </div>

      {/* Revenue */}
      <div className="p-4 rounded-xl bg-green-50 border border-green-100 mb-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-700">Total Cash-on-Delivery Revenue</span>
          <span className="font-bold text-xl text-green-700">{formatETB(report.total_revenue)}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-green-600">Paid orders total</span>
          <span className="text-sm font-medium text-green-600">{formatETB(paidRevenue)}</span>
        </div>
      </div>

      {/* Order list */}
      {orders.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-2">Orders ({orders.length})</h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <span className="font-medium text-gray-700">{order.customer_name}</span>
                  <span className="text-gray-400 ml-2">{order.status}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`badge ${order.payment_status === 'paid' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                    {order.payment_status}
                  </span>
                  <span className="font-semibold text-gray-900">{formatETB(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-3 text-center">
        <p className="text-xs text-gray-400">This report was generated electronically. Orders are archived and not deleted.</p>
      </div>
    </div>
  );
}

function SummaryBox({ label, value, color = 'text-gray-900' }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`font-bold text-lg ${color}`}>{value}</p>
    </div>
  );
}

function generateReportText(report: ZReport): string {
  const lines: string[] = [];
  lines.push('========================================');
  lines.push('       MARCILAS RESTAURANT');
  lines.push('       Dire Dawa, Ethiopia');
  lines.push('       Z REPORT — Daily Closing');
  lines.push('========================================');
  lines.push('');
  lines.push(`Report #:     ${report.report_number}`);
  lines.push(`Business Date: ${report.business_date}`);
  lines.push(`Generated At: ${formatDateTime(report.generated_at)}`);
  lines.push(`Generated By: ${report.generated_by_name}`);
  lines.push('');
  lines.push('--- SUMMARY ---');
  lines.push(`Total Orders:     ${report.total_orders}`);
  lines.push(`Completed Orders: ${report.completed_orders}`);
  lines.push(`Cancelled Orders: ${report.cancelled_orders}`);
  lines.push(`Total Discounts:  ${formatETB(report.total_discounts)}`);
  lines.push(`Total Revenue:    ${formatETB(report.total_revenue)}`);
  lines.push('');
  const orders = report.order_snapshot ?? [];
  if (orders.length > 0) {
    lines.push('--- ORDERS ---');
    orders.forEach((o, i) => {
      lines.push(`${i + 1}. ${o.customer_name} | ${o.status} | ${o.payment_status} | ${formatETB(o.total)}`);
    });
    lines.push('');
  }
  lines.push('========================================');
  lines.push('Orders are archived and not deleted.');
  lines.push('========================================');
  return lines.join('\n');
}
