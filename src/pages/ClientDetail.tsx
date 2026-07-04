import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  FolderKanban,
  Receipt,
  StickyNote,
  Clock,
  Plus,
  Trash2,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { ClientStatusBadge, InvoiceStatusBadge, ProjectStatusBadge, TagBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { AddProjectModal } from '@/components/projects/AddProjectModal';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils';
import { sendTelegramMessage } from '@/lib/telegram';
import type { ClientStatus } from '@/types';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-surface-950 dark:text-slate-200';

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">{children}</label>;
}

export function ClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients, projects, invoices, tasks, activities, notes: allNotes, updateClient, deleteClient, addNote, deleteNote, logMessageSent } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const client = clients.find((c) => c.id === clientId);

  const notes = clientId ? allNotes[clientId] ?? [] : [];
  const [newNote, setNewNote] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editForm, setEditForm] = useState(() => ({
    name: client?.name ?? '',
    company: client?.company ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    industry: client?.industry ?? '',
    website: client?.website ?? '',
    address: client?.address ?? '',
    status: (client?.status ?? 'active') as ClientStatus,
    telegramChatId: client?.telegramChatId ?? '',
    telegramUsername: client?.telegramUsername ?? '',
  }));

  const clientProjects = useMemo(() => projects.filter((p) => p.clientId === clientId), [projects, clientId]);
  const clientInvoices = useMemo(() => invoices.filter((i) => i.clientId === clientId), [invoices, clientId]);
  const clientTasks = useMemo(
    () => tasks.filter((t) => t.clientId === clientId && t.status === 'pending'),
    [tasks, clientId],
  );
  const clientActivities = useMemo(() => activities.filter((a) => a.clientId === clientId), [activities, clientId]);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">Client not found</p>
        <button
          onClick={() => navigate('/clients')}
          className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Back to Clients
        </button>
      </div>
    );
  }

  const totalBilled = clientInvoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = clientInvoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);

  function handleAddNote() {
    if (!newNote.trim() || !clientId) return;
    addNote(clientId, newNote.trim(), currentUser?.name ?? 'You');
    setNewNote('');
  }

  async function handleSendMessage() {
    if (!messageText.trim() || !clientId || !client) return;
    if (!client.telegramChatId) {
      showToast('Add a Telegram Chat ID for this client in Edit Profile first.', 'error');
      return;
    }
    setSendingMessage(true);
    try {
      await sendTelegramMessage(client.telegramChatId, messageText.trim());
      logMessageSent(clientId, client.name, messageText.trim().slice(0, 80));
      showToast(`Message queued for ${client.name} via Telegram — check the chat in a few seconds.`, 'success');
      setMessageText('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send message.', 'error');
    } finally {
      setSendingMessage(false);
    }
  }

  function handleDeleteClient() {
    showToast(`${client!.name} was removed from your clients.`, 'success');
    deleteClient(client!.id);
    navigate('/clients');
  }

  function openEditModal() {
    setEditForm({
      name: client!.name,
      company: client!.company,
      email: client!.email,
      phone: client!.phone,
      industry: client!.industry,
      website: client!.website,
      address: client!.address,
      status: client!.status,
      telegramChatId: client!.telegramChatId ?? '',
      telegramUsername: client!.telegramUsername ?? '',
    });
    setEditOpen(true);
  }

  function handleSaveProfile() {
    if (!editForm.name.trim() || !editForm.company.trim()) {
      showToast('Name and company are required.', 'error');
      return;
    }
    updateClient(client!.id, editForm);
    showToast('Client profile updated.', 'success');
    setEditOpen(false);
  }

  return (
    <div className="space-y-6">
      <Link
        to="/clients"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="size-4" /> Back to Clients
      </Link>

      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={client.name} color={client.avatarColor} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{client.name}</h1>
                <ClientStatusBadge status={client.status} />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{client.company} &middot; {client.industry}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {client.tags.map((t) => (
                  <TagBadge key={t}>{t}</TagBadge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteOpen(true)}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 dark:border-white/10 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10"
              aria-label="Delete client"
            >
              <Trash2 className="size-4" />
            </button>
            <button
              onClick={openEditModal}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Edit Profile
            </button>
            <button
              onClick={() => setProjectModalOpen(true)}
              className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 hover:bg-brand-600"
            >
              New Project
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Mail className="size-4 text-slate-400" /> {client.email}
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Phone className="size-4 text-slate-400" /> {client.phone}
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Globe className="size-4 text-slate-400" /> {client.website || '—'}
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <MapPin className="size-4 text-slate-400" /> {client.address || '—'}
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Calendar className="size-4 text-slate-400" /> Client since {formatDate(client.createdAt)}
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Send className="size-4 text-slate-400" />
                {client.telegramChatId
                  ? `Chat ID ${client.telegramChatId}${client.telegramUsername ? ` (@${client.telegramUsername})` : ''}`
                  : 'No Telegram chat linked'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send a Message</CardTitle>
              <Send className="size-4 text-slate-400" />
            </CardHeader>
            <CardContent className="space-y-3">
              {!client.telegramChatId ? (
                <p className="text-sm text-slate-400">
                  Add this client's Telegram Chat ID in <button onClick={openEditModal} className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Edit Profile</button> to send them a message.
                </p>
              ) : (
                <>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Write a message to send via Telegram, as AgencyFlow..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-surface-950"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !messageText.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="size-4" /> {sendingMessage ? 'Sending…' : 'Send via Telegram'}
                  </button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <p className="text-xs text-slate-400">Total Billed</p>
                <p className="mt-1 text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(totalBilled)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <p className="text-xs text-slate-400">Total Paid</p>
                <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow-up Reminders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {clientTasks.length === 0 && <p className="text-sm text-slate-400">No pending follow-ups.</p>}
              {clientTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{task.title}</p>
                    <p className="text-xs text-slate-400">{formatDate(task.dueDate)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Project History</CardTitle>
              <FolderKanban className="size-4 text-slate-400" />
            </CardHeader>
            <CardContent className="space-y-3">
              {clientProjects.length === 0 && <p className="text-sm text-slate-400">No projects yet.</p>}
              {clientProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3.5 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{project.name}</p>
                    <p className="text-xs text-slate-400">Due {formatDate(project.deadline)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${project.progress}%` }} />
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <Receipt className="size-4 text-slate-400" />
            </CardHeader>
            <CardContent className="space-y-2">
              {clientInvoices.length === 0 && <p className="text-sm text-slate-400">No invoices yet.</p>}
              {clientInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5 dark:border-white/5"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{invoice.number}</p>
                    <p className="text-xs text-slate-400">Due {formatDate(invoice.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {formatCurrency(invoice.amount)}
                    </span>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <StickyNote className="size-4 text-slate-400" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  placeholder="Add a note about this client..."
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-surface-950"
                />
                <button
                  onClick={handleAddNote}
                  className="flex items-center gap-1 rounded-xl bg-brand-500 px-3.5 text-sm font-semibold text-white hover:bg-brand-600"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              {notes.map((note) => (
                <div key={note.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3.5 dark:bg-white/5">
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{note.content}</p>
                    <p className="mt-1.5 text-xs text-slate-400">
                      {note.author} &middot; {formatDate(note.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => clientId && deleteNote(clientId, note.id)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500 dark:text-slate-600 dark:hover:bg-rose-500/10"
                    aria-label="Delete note"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
              {notes.length === 0 && <p className="text-sm text-slate-400">No notes yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-5 border-l border-slate-100 pl-5 dark:border-white/10">
                {clientActivities.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
                {clientActivities.map((activity) => (
                  <li key={activity.id} className="relative">
                    <span className="absolute -left-[25px] top-1 size-3 rounded-full border-2 border-white bg-brand-500 dark:border-surface-900" />
                    <p className="text-sm text-slate-700 dark:text-slate-200">{activity.description}</p>
                    <p className="text-xs text-slate-400">{timeAgo(activity.timestamp)}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Client Profile">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Full Name</FieldLabel>
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <FieldLabel>Company</FieldLabel>
              <input value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Email</FieldLabel>
              <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputClass} />
            </div>
            <div>
              <FieldLabel>Phone</FieldLabel>
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Industry</FieldLabel>
              <input value={editForm.industry} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })} className={inputClass} />
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ClientStatus })}
                className={inputClass}
              >
                <option value="active">Active</option>
                <option value="lead">Lead</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <FieldLabel>Website</FieldLabel>
            <input value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} className={inputClass} />
          </div>
          <div>
            <FieldLabel>Address</FieldLabel>
            <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Telegram Chat ID</FieldLabel>
              <input
                value={editForm.telegramChatId}
                onChange={(e) => setEditForm({ ...editForm, telegramChatId: e.target.value })}
                placeholder="e.g. 123456789"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel>Telegram Username</FieldLabel>
              <input
                value={editForm.telegramUsername}
                onChange={(e) => setEditForm({ ...editForm, telegramUsername: e.target.value })}
                placeholder="optional, for display only"
                className={inputClass}
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-slate-400">
            The client must message the bot at least once before you can message them. Run the server and check
            <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 dark:bg-white/10">GET /api/telegram/updates</code>
            to find their Chat ID.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">
              Cancel
            </button>
            <button onClick={handleSaveProfile} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      <AddProjectModal open={projectModalOpen} onClose={() => setProjectModalOpen(false)} lockedClientId={client.id} />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteClient}
        title="Delete this client?"
        description={`This will permanently remove ${client.name} along with their projects, invoices, tasks, and notes. This can't be undone.`}
        confirmLabel="Delete Client"
      />
    </div>
  );
}
