import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, Clock, AlertTriangle, DollarSign, Plus, Search, ChevronRight, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { InvoiceStatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { InvoiceStatus } from '@/types';

const filters: { label: string; value: InvoiceStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Overdue', value: 'overdue' },
];

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-surface-950 dark:text-slate-200';

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">{children}</label>;
}

export function Invoices() {
  const location = useLocation();
  const { clients, invoices, addInvoice, updateInvoice, deleteInvoice } = useData();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [addOpen, setAddOpen] = useState(Boolean((location.state as { openNew?: boolean } | null)?.openNew));
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId) ?? null;
  const [form, setForm] = useState({
    clientId: clients[0]?.id ?? '',
    amount: '',
    dueDate: new Date().toISOString().slice(0, 10),
    label: '',
  });

  const totals = useMemo(() => {
    const paid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    const pending = invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
    const overdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
    return { paid, pending, overdue, total: paid + pending + overdue };
  }, [invoices]);

  const filtered = useMemo(
    () =>
      invoices.filter((i) => {
        const matchesQuery =
          i.number.toLowerCase().includes(query.toLowerCase()) ||
          i.clientName.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [invoices, query, statusFilter],
  );

  function handleCreateInvoice() {
    const client = clients.find((c) => c.id === form.clientId);
    const amount = Number(form.amount);
    if (!client || !amount) {
      showToast('Select a client and enter an amount.', 'error');
      return;
    }
    addInvoice({
      clientId: client.id,
      clientName: client.name,
      amount,
      dueDate: form.dueDate,
      status: 'pending',
      label: form.label || 'Professional services',
    });
    showToast(`Invoice for ${client.name} created.`, 'success');
    setForm({ clientId: clients[0]?.id ?? '', amount: '', dueDate: new Date().toISOString().slice(0, 10), label: '' });
    setAddOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        description={`${invoices.length} invoices tracked this period`}
        actions={
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition-colors hover:bg-brand-600"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            New Invoice
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Billed" value={formatCurrency(totals.total)} icon={DollarSign} iconClass="bg-brand-500/10 text-brand-600 dark:text-brand-400" />
        <StatCard label="Paid" value={formatCurrency(totals.paid)} icon={CheckCircle2} iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Pending" value={formatCurrency(totals.pending)} icon={Clock} iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
        <StatCard label="Overdue" value={formatCurrency(totals.overdue)} icon={AlertTriangle} iconClass="bg-rose-500/10 text-rose-600 dark:text-rose-400" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoices..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-surface-900 dark:text-slate-200"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                  : 'bg-white text-slate-500 hover:bg-slate-100 dark:bg-surface-900 dark:text-slate-400 dark:hover:bg-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile card list */}
      <Card className="divide-y divide-slate-50 overflow-hidden p-0 dark:divide-white/[0.04] sm:hidden">
        {filtered.map((invoice) => (
          <button
            key={invoice.id}
            onClick={() => setSelectedInvoiceId(invoice.id)}
            className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors active:bg-slate-50 dark:active:bg-white/[0.03]"
          >
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 dark:text-white">{invoice.number}</p>
              <p className="truncate text-xs text-slate-400">{invoice.clientName}</p>
              <p className="mt-1 text-xs text-slate-400">Due {formatDate(invoice.dueDate)}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(invoice.amount)}</span>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-slate-400">No invoices match your search.</div>
        )}
      </Card>

      {/* Desktop table */}
      <Card className="hidden overflow-hidden p-0 sm:block">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-white/5 dark:text-slate-500">
                <th className="px-5 py-3.5">Invoice</th>
                <th className="px-5 py-3.5">Client</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="w-10 px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() => setSelectedInvoiceId(invoice.id)}
                  className="cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50 dark:border-white/[0.03] dark:hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-white">{invoice.number}</td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{invoice.clientName}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(invoice.amount)}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{formatDate(invoice.dueDate)}</td>
                  <td className="px-5 py-3.5">
                    <InvoiceStatusBadge status={invoice.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <ChevronRight className="size-4 text-slate-300 dark:text-slate-600" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                    No invoices match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Invoice">
        <div className="space-y-4">
          <div>
            <FieldLabel>Client</FieldLabel>
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className={inputClass}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} &middot; {c.company}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Retainer, project milestone, etc."
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Amount ($)</FieldLabel>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="5000"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel>Due Date</FieldLabel>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setAddOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">
              Cancel
            </button>
            <button onClick={handleCreateInvoice} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
              Create Invoice
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!selectedInvoice} onClose={() => setSelectedInvoiceId(null)} title={selectedInvoice?.number ?? ''}>
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{selectedInvoice.clientName}</p>
                <p className="text-xs text-slate-400">Issued {formatDate(selectedInvoice.issueDate)}</p>
              </div>
              <InvoiceStatusBadge status={selectedInvoice.status} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <p className="text-xs text-slate-400">Amount</p>
                <p className="mt-1 text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(selectedInvoice.amount)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <p className="text-xs text-slate-400">Due Date</p>
                <p className="mt-1 text-lg font-bold text-slate-800 dark:text-white">{formatDate(selectedInvoice.dueDate)}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Line Items</p>
              <div className="space-y-2">
                {selectedInvoice.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-2.5 text-sm dark:border-white/5">
                    <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Mark Status</p>
              <div className="flex gap-2">
                {(['pending', 'paid', 'overdue'] as InvoiceStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateInvoice(selectedInvoice.id, { status })}
                    className={cn(
                      'flex-1 rounded-xl border px-3 py-2 text-xs font-semibold capitalize transition-colors',
                      selectedInvoice.status === status
                        ? 'border-brand-400 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5',
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
              >
                <Trash2 className="size-4" /> Delete
              </button>
              <button
                onClick={() => setSelectedInvoiceId(null)}
                className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          if (!selectedInvoice) return;
          deleteInvoice(selectedInvoice.id);
          showToast(`Invoice ${selectedInvoice.number} was deleted.`, 'success');
          setSelectedInvoiceId(null);
        }}
        title="Delete this invoice?"
        description={`This will permanently remove invoice ${selectedInvoice?.number}. This can't be undone.`}
        confirmLabel="Delete Invoice"
      />
    </div>
  );
}
