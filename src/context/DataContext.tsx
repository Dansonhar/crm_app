import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import { notifyTeam, formatEventAlert, priorityEmoji } from '@/lib/telegram';
import {
  fetchAllData,
  persistEntity,
  flattenNotes,
  type PersistableEntity,
} from '@/lib/api';
import {
  clients as seedClients,
  projects as seedProjects,
  invoices as seedInvoices,
  tasks as seedTasks,
  leads as seedLeads,
  activities as seedActivities,
  clientNotes as seedNotes,
  avatarColors,
} from '@/data/mockData';
import type {
  Activity,
  ActivityType,
  Client,
  ClientNote,
  ClientStatus,
  Deliverable,
  Invoice,
  InvoiceStatus,
  Lead,
  LeadStage,
  Priority,
  Project,
  ProjectStatus,
  Task,
} from '@/types';

interface DataContextValue {
  clients: Client[];
  addClient: (input: {
    name: string;
    company: string;
    email: string;
    phone: string;
    industry?: string;
    website?: string;
    address?: string;
    status?: ClientStatus;
    telegramChatId?: string;
    telegramUsername?: string;
  }) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  projects: Project[];
  addProject: (input: {
    name: string;
    clientId: string;
    clientName: string;
    deadline: string;
    budget: number;
    status?: ProjectStatus;
    team?: string[];
    deliverables?: { label: string; done?: boolean }[];
  }) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleDeliverable: (projectId: string, deliverableId: string) => void;

  invoices: Invoice[];
  addInvoice: (input: {
    clientId: string;
    clientName: string;
    amount: number;
    dueDate: string;
    status: InvoiceStatus;
    label: string;
  }) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  tasks: Task[];
  addTask: (input: {
    title: string;
    priority: Priority;
    dueDate: string;
    clientId?: string;
    clientName?: string;
    category: string;
  }) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;

  leads: Lead[];
  addLead: (input: {
    clientName: string;
    company: string;
    dealValue: number;
    source: string;
    priority: Priority;
    nextFollowUp: string;
    stage?: LeadStage;
  }) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;

  notes: Record<string, ClientNote[]>;
  addNote: (clientId: string, content: string, author: string) => void;
  deleteNote: (clientId: string, noteId: string) => void;

  activities: Activity[];
  logMessageSent: (clientId: string, clientName: string, preview: string) => void;

  // True while the initial load from the database is in flight. Pages use this
  // to show a loading state on refresh instead of a premature "not found".
  loading: boolean;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

let invoiceCounter = 2055;

export function DataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(seedClients);
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [invoices, setInvoices] = useState<Invoice[]>(seedInvoices);
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [leads, setLeads] = useState<Lead[]>(seedLeads);
  const [notes, setNotes] = useState<Record<string, ClientNote[]>>(seedNotes);
  const [activities, setActivities] = useState<Activity[]>(seedActivities);

  // Becomes true once the initial load from the database has finished. Until
  // then we don't persist, so we never overwrite saved data with empty seeds.
  const hydratedRef = useRef(false);
  const [loading, setLoading] = useState(true);

  // Load persisted CRM state from the SQLite-backed API on mount.
  useEffect(() => {
    let cancelled = false;
    fetchAllData()
      .then((data) => {
        if (cancelled) return;
        setClients(data.clients ?? []);
        setLeads(data.leads ?? []);
        setProjects(data.projects ?? []);
        setInvoices(data.invoices ?? []);
        setTasks(data.tasks ?? []);
        setActivities(data.activities ?? []);
        setNotes(data.notes ?? {});
        // Keep new invoice numbers ahead of anything already stored.
        for (const inv of data.invoices ?? []) {
          const n = Number(String(inv.number ?? '').replace(/\D/g, ''));
          if (Number.isFinite(n) && n > invoiceCounter) invoiceCounter = n;
        }
      })
      .catch((err) => {
        console.warn('Could not load saved data:', err instanceof Error ? err.message : err);
      })
      .finally(() => {
        if (cancelled) return;
        hydratedRef.current = true;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist each entity back to the database whenever it changes (debounced).
  usePersistEntity('clients', clients, (v) => v, hydratedRef);
  usePersistEntity('leads', leads, (v) => v, hydratedRef);
  usePersistEntity('projects', projects, (v) => v, hydratedRef);
  usePersistEntity('invoices', invoices, (v) => v, hydratedRef);
  usePersistEntity('tasks', tasks, (v) => v, hydratedRef);
  usePersistEntity('activities', activities, (v) => v, hydratedRef);
  usePersistEntity('notes', notes, flattenNotes, hydratedRef);

  function notify(text: string) {
    notifyTeam(text).catch((err) => {
      console.warn('Telegram notification failed:', err instanceof Error ? err.message : err);
    });
  }

  function logActivity(input: { type: ActivityType; description: string; clientId?: string; clientName?: string }) {
    const activity: Activity = {
      id: `a${Date.now()}-${Math.round(performance.now() * 1000)}`,
      type: input.type,
      description: input.description,
      timestamp: new Date().toISOString(),
      clientId: input.clientId,
      clientName: input.clientName,
    };
    setActivities((prev) => [activity, ...prev]);
  }

  function addClient(input: {
    name: string;
    company: string;
    email: string;
    phone: string;
    industry?: string;
    website?: string;
    address?: string;
    status?: ClientStatus;
    telegramChatId?: string;
    telegramUsername?: string;
  }) {
    const newClient: Client = {
      id: `c${Date.now()}`,
      name: input.name,
      company: input.company,
      email: input.email || 'unknown@example.com',
      phone: input.phone || '—',
      status: input.status ?? 'lead',
      industry: input.industry?.trim() || 'General',
      website: input.website?.trim() ?? '',
      address: input.address?.trim() ?? '',
      lastContacted: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
      avatarColor: avatarColors[clients.length % avatarColors.length],
      tags: ['New'],
      ...(input.telegramChatId?.trim() ? { telegramChatId: input.telegramChatId.trim() } : {}),
      ...(input.telegramUsername?.trim() ? { telegramUsername: input.telegramUsername.trim() } : {}),
    };
    setClients((prev) => [newClient, ...prev]);
    logActivity({
      type: 'note',
      description: `${newClient.name} (${newClient.company}) was added as a new client`,
      clientId: newClient.id,
      clientName: newClient.name,
    });
    return newClient;
  }

  function updateClient(id: string, updates: Partial<Client>) {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }

  function deleteClient(id: string) {
    const client = clients.find((c) => c.id === id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    setProjects((prev) => prev.filter((p) => p.clientId !== id));
    setInvoices((prev) => prev.filter((i) => i.clientId !== id));
    setTasks((prev) => prev.filter((t) => t.clientId !== id));
    setNotes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (client) {
      logActivity({ type: 'note', description: `${client.name} (${client.company}) was removed as a client` });
    }
  }

  function addProject(input: {
    name: string;
    clientId: string;
    clientName: string;
    deadline: string;
    budget: number;
    status?: ProjectStatus;
    team?: string[];
    deliverables?: { label: string; done?: boolean }[];
  }) {
    const baseDeliverables = (input.deliverables ?? []).filter((d) => d.label.trim());
    const deliverables: Deliverable[] =
      baseDeliverables.length > 0
        ? baseDeliverables.map((d, i) => ({ id: `d${Date.now()}-${i}`, label: d.label.trim(), done: Boolean(d.done) }))
        : [{ id: `d${Date.now()}`, label: 'Kickoff & discovery', done: false }];
    const newProject: Project = {
      id: `p${Date.now()}`,
      name: input.name,
      clientId: input.clientId,
      clientName: input.clientName,
      deadline: input.deadline,
      progress: progressFromDeliverables(deliverables),
      status: input.status ?? 'on-track',
      team: input.team ?? [],
      budget: input.budget,
      deliverables,
    };
    setProjects((prev) => [newProject, ...prev]);
    logActivity({
      type: 'project',
      description: `New project "${newProject.name}" created for ${newProject.clientName}`,
      clientId: newProject.clientId,
      clientName: newProject.clientName,
    });
    notify(
      formatEventAlert(
        '📁 A new project has been created.',
        [
          { label: '🛠️ Project', value: newProject.name },
          { label: '🏢 Client', value: newProject.clientName },
          { label: '💵 Budget', value: `RM${newProject.budget.toLocaleString()}`, bold: true },
          { label: '📅 Deadline', value: newProject.deadline },
        ],
        ['Confirm the kickoff date with the client', 'Assign team members', 'Set milestone check-ins'],
      ),
    );
    return newProject;
  }

  function updateProject(id: string, updates: Partial<Project>) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const merged = { ...p, ...updates };
        // Progress always follows the ticked deliverables.
        if (updates.deliverables) merged.progress = progressFromDeliverables(merged.deliverables);
        return merged;
      }),
    );
    const project = projects.find((p) => p.id === id);
    if (project && updates.status && updates.status !== project.status) {
      logActivity({
        type: 'project',
        description: `${project.name} status changed to ${formatProjectStatus(updates.status)}`,
        clientId: project.clientId,
        clientName: project.clientName,
      });
    }
  }

  function deleteProject(id: string) {
    const project = projects.find((p) => p.id === id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (project) {
      logActivity({
        type: 'project',
        description: `Project "${project.name}" was deleted`,
        clientId: project.clientId,
        clientName: project.clientName,
      });
    }
  }

  function toggleDeliverable(projectId: string, deliverableId: string) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== projectId
          ? p
          : (() => {
              const deliverables = p.deliverables.map((d) =>
                d.id === deliverableId ? { ...d, done: !d.done } : d,
              );
              return { ...p, deliverables, progress: progressFromDeliverables(deliverables) };
            })(),
      ),
    );
  }

  function addInvoice(input: {
    clientId: string;
    clientName: string;
    amount: number;
    dueDate: string;
    status: InvoiceStatus;
    label: string;
  }) {
    invoiceCounter += 1;
    const newInvoice: Invoice = {
      id: `i${Date.now()}`,
      number: `INV-${invoiceCounter}`,
      clientId: input.clientId,
      clientName: input.clientName,
      amount: input.amount,
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: input.dueDate,
      status: input.status,
      items: [{ label: input.label || 'Professional services', amount: input.amount }],
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    logActivity({
      type: 'invoice',
      description: `Invoice ${newInvoice.number} created for ${newInvoice.clientName}`,
      clientId: newInvoice.clientId,
      clientName: newInvoice.clientName,
    });
    notify(
      formatEventAlert(
        '🧾 A new invoice has been issued.',
        [
          { label: '🧾 Invoice', value: newInvoice.number },
          { label: '🏢 Client', value: newInvoice.clientName },
          { label: '💵 Amount', value: `RM${newInvoice.amount.toLocaleString()}`, bold: true },
          { label: '📅 Due Date', value: newInvoice.dueDate },
        ],
        ['Confirm the invoice was sent to the client', 'Add to accounts receivable tracking', 'Set a payment reminder'],
      ),
    );
    return newInvoice;
  }

  function updateInvoice(id: string, updates: Partial<Invoice>) {
    const invoice = invoices.find((i) => i.id === id);
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    if (invoice && updates.status && updates.status !== invoice.status) {
      logActivity({
        type: 'invoice',
        description: `Invoice ${invoice.number} marked as ${updates.status}`,
        clientId: invoice.clientId,
        clientName: invoice.clientName,
      });
      if (updates.status === 'paid') {
        notify(
          formatEventAlert(
            '💰 A payment has been received.',
            [
              { label: '🧾 Invoice', value: invoice.number },
              { label: '🏢 Client', value: invoice.clientName },
              { label: '💵 Amount', value: `RM${invoice.amount.toLocaleString()}`, bold: true },
            ],
            ['Confirm funds received in accounting', 'Send a receipt or thank-you note', 'Update the invoice status in your records'],
          ),
        );
      }
    }
  }

  function deleteInvoice(id: string) {
    const invoice = invoices.find((i) => i.id === id);
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    if (invoice) {
      logActivity({
        type: 'invoice',
        description: `Invoice ${invoice.number} was deleted`,
        clientId: invoice.clientId,
        clientName: invoice.clientName,
      });
    }
  }

  function addTask(input: {
    title: string;
    priority: Priority;
    dueDate: string;
    clientId?: string;
    clientName?: string;
    category: string;
  }) {
    const newTask: Task = {
      id: `t${Date.now()}`,
      title: input.title,
      priority: input.priority,
      dueDate: input.dueDate,
      clientId: input.clientId,
      clientName: input.clientName,
      status: 'pending',
      category: input.category || 'General',
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  }

  function updateTask(id: string, updates: Partial<Task>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t)),
    );
  }

  function addLead(input: {
    clientName: string;
    company: string;
    dealValue: number;
    source: string;
    priority: Priority;
    nextFollowUp: string;
    stage?: LeadStage;
  }) {
    const newLead: Lead = {
      id: `l${Date.now()}`,
      clientName: input.clientName,
      company: input.company,
      dealValue: input.dealValue,
      source: input.source || 'Other',
      priority: input.priority,
      nextFollowUp: input.nextFollowUp,
      stage: input.stage ?? 'new',
      avatarColor: avatarColors[leads.length % avatarColors.length],
    };
    setLeads((prev) => [newLead, ...prev]);
    logActivity({
      type: 'deal',
      description: `New lead "${newLead.clientName}" (${newLead.company}) added to pipeline`,
      clientName: newLead.clientName,
    });
    notify(
      formatEventAlert(
        '🆕 A new sales lead has entered the pipeline.',
        [
          { label: '👤 Contact', value: newLead.clientName },
          { label: '🏢 Company', value: newLead.company },
          { label: '💵 Deal Value', value: `RM${newLead.dealValue.toLocaleString()}`, bold: true },
          { label: '📣 Source', value: newLead.source },
          {
            label: '🔥 Priority',
            value: `${priorityEmoji(newLead.priority)} ${newLead.priority.charAt(0).toUpperCase() + newLead.priority.slice(1)}`,
          },
          { label: '📍 Pipeline Stage', value: stageDisplayLabels[newLead.stage] },
        ],
        ['Contact the lead within 24 hours', 'Assign an account manager', 'Schedule an introduction meeting'],
      ),
    );
    return newLead;
  }

  function updateLead(id: string, updates: Partial<Lead>) {
    const lead = leads.find((l) => l.id === id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    if (lead && updates.stage && updates.stage !== lead.stage) {
      logActivity({
        type: 'deal',
        description: `${lead.clientName} deal moved to ${formatLeadStage(updates.stage)}`,
        clientName: lead.clientName,
      });
      if (updates.stage === 'won') {
        notify(
          formatEventAlert(
            '🎉 A deal has been won — congratulations!',
            [
              { label: '👤 Client', value: lead.clientName },
              { label: '🏢 Company', value: lead.company },
              { label: '💵 Deal Value', value: `RM${lead.dealValue.toLocaleString()}`, bold: true },
            ],
            ['Kick off client onboarding', 'Assign a project owner', 'Send the welcome package and contract'],
          ),
        );
      } else if (updates.stage === 'lost') {
        notify(
          formatEventAlert(
            '📉 A deal was marked as lost.',
            [
              { label: '👤 Client', value: lead.clientName },
              { label: '🏢 Company', value: lead.company },
              { label: '💵 Deal Value', value: `RM${lead.dealValue.toLocaleString()}` },
            ],
            ['Log the reason for the loss', 'Review the pipeline for lessons learned', 'Re-engage in 90 days'],
          ),
        );
      }
    }
  }

  function deleteLead(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }

  function addNote(clientId: string, content: string, author: string) {
    const client = clients.find((c) => c.id === clientId);
    const note: ClientNote = {
      id: `n${Date.now()}`,
      author,
      content,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setNotes((prev) => ({ ...prev, [clientId]: [note, ...(prev[clientId] ?? [])] }));
    logActivity({
      type: 'note',
      description: `Note added for ${client?.name ?? 'client'}`,
      clientId,
      clientName: client?.name,
    });
  }

  function deleteNote(clientId: string, noteId: string) {
    setNotes((prev) => ({ ...prev, [clientId]: (prev[clientId] ?? []).filter((n) => n.id !== noteId) }));
  }

  function logMessageSent(clientId: string, clientName: string, preview: string) {
    logActivity({
      type: 'message',
      description: `Sent a Telegram message to ${clientName}: "${preview}"`,
      clientId,
      clientName,
    });
  }

  return (
    <DataContext.Provider
      value={{
        clients,
        addClient,
        updateClient,
        deleteClient,
        projects,
        addProject,
        updateProject,
        deleteProject,
        toggleDeliverable,
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        leads,
        addLead,
        updateLead,
        deleteLead,
        notes,
        addNote,
        deleteNote,
        activities,
        logMessageSent,
        loading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

// Debounced persistence of one entity slice to the database. Skips writes until
// the initial hydration has completed (guarded by `enabledRef`).
function usePersistEntity<T>(
  entity: PersistableEntity,
  value: T,
  toRows: (value: T) => unknown[],
  enabledRef: MutableRefObject<boolean>,
) {
  useEffect(() => {
    if (!enabledRef.current) return;
    const handle = setTimeout(() => {
      persistEntity(entity, toRows(value)).catch((err) => {
        console.warn(`Failed to save ${entity}:`, err instanceof Error ? err.message : err);
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
}

function formatProjectStatus(status: ProjectStatus) {
  return status.replace('-', ' ');
}

// Progress is derived from how many deliverables are ticked: none ticked → 0%,
// all ticked → 100%, otherwise the average completion across the checklist.
function progressFromDeliverables(deliverables: Deliverable[]) {
  if (deliverables.length === 0) return 0;
  const done = deliverables.filter((d) => d.done).length;
  return Math.round((done / deliverables.length) * 100);
}

function formatLeadStage(stage: LeadStage) {
  return stage[0].toUpperCase() + stage.slice(1);
}

const stageDisplayLabels: Record<LeadStage, string> = {
  new: 'New Lead',
  contacted: 'Contacted',
  proposal: 'Proposal Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
