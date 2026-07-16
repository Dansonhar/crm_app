import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Mail, Phone, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { ClientStatusButton } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ClientFormFields, emptyClientForm } from '@/components/clients/ClientFormFields';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';
import { useUrlState } from '@/lib/useUrlState';
import type { ClientStatus } from '@/types';

const filters: { label: string; value: ClientStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Lead', value: 'lead' },
  { label: 'Inactive', value: 'inactive' },
];

export function Clients() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { clients, addClient, updateClient } = useData();
  const { showToast } = useToast();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [statusFilter, setStatusFilter] = useUrlState('status', 'all');
  const [modalOpen, setModalOpen] = useState(Boolean((location.state as { openNew?: boolean } | null)?.openNew));
  const [form, setForm] = useState(emptyClientForm);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuery(q);
  }, [searchParams]);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesQuery =
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.company.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [clients, query, statusFilter]);

  function handleAddClient() {
    if (!form.name || !form.company) {
      showToast('Name and company are required.', 'error');
      return;
    }
    addClient(form);
    showToast(`${form.name} was added to your clients.`, 'success');
    setForm(emptyClientForm);
    setModalOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        description={`${clients.length} total clients across your agency`}
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition-colors hover:bg-brand-600"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Add Client
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients..."
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
        {filtered.map((client) => (
          <div
            key={client.id}
            onClick={() => navigate(`/clients/${client.id}`)}
            className="flex w-full cursor-pointer items-center gap-3 p-4 text-left transition-colors active:bg-slate-50 dark:active:bg-white/[0.03]"
          >
            <Avatar name={client.name} color={client.avatarColor} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold text-slate-800 dark:text-white">{client.name}</p>
                <ChevronRight className="size-4 shrink-0 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">{client.company}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <ClientStatusButton status={client.status} onChange={(status) => updateClient(client.id, { status })} />
                <span className="text-xs text-slate-400">{formatDate(client.lastContacted)}</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-slate-400">No clients match your search.</div>
        )}
      </Card>

      {/* Desktop table */}
      <Card className="hidden overflow-hidden p-0 sm:block">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-white/5 dark:text-slate-500">
                <th className="px-5 py-3.5 font-semibold">Client</th>
                <th className="px-5 py-3.5 font-semibold">Contact</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Last Contacted</th>
                <th className="w-10 px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50 dark:border-white/[0.03] dark:hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={client.name} color={client.avatarColor} size="sm" />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">{client.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{client.company}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Mail className="size-3.5" /> {client.email}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Phone className="size-3.5" /> {client.phone}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <ClientStatusButton status={client.status} onChange={(status) => updateClient(client.id, { status })} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                    {formatDate(client.lastContacted)}
                  </td>
                  <td className="px-5 py-3.5">
                    <ChevronRight className="size-4 text-slate-300 dark:text-slate-600" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">
                    No clients match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Client">
        <ClientFormFields values={form} onChange={setForm} showStatus={false} />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setModalOpen(false)}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleAddClient}
            className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Add Client
          </button>
        </div>
      </Modal>
    </div>
  );
}
