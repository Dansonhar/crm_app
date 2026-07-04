import { createContext, useContext, useState, type ReactNode } from 'react';
import { notifyTeam, formatNotification } from '@/lib/telegram';
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
  addClient: (input: { name: string; company: string; email: string; phone: string }) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  projects: Project[];
  addProject: (input: {
    name: string;
    clientId: string;
    clientName: string;
    deadline: string;
    budget: number;
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

  function addClient(input: { name: string; company: string; email: string; phone: string }) {
    const newClient: Client = {
      id: `c${Date.now()}`,
      name: input.name,
      company: input.company,
      email: input.email || 'unknown@example.com',
      phone: input.phone || '—',
      status: 'lead',
      industry: 'General',
      website: '',
      address: '',
      lastContacted: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
      avatarColor: avatarColors[clients.length % avatarColors.length],
      tags: ['New'],
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

  function addProject(input: { name: string; clientId: string; clientName: string; deadline: string; budget: number }) {
    const newProject: Project = {
      id: `p${Date.now()}`,
      name: input.name,
      clientId: input.clientId,
      clientName: input.clientName,
      deadline: input.deadline,
      progress: 0,
      status: 'on-track',
      team: [],
      budget: input.budget,
      deliverables: [{ id: `d${Date.now()}`, label: 'Kickoff & discovery', done: false }],
    };
    setProjects((prev) => [newProject, ...prev]);
    logActivity({
      type: 'project',
      description: `New project "${newProject.name}" created for ${newProject.clientName}`,
      clientId: newProject.clientId,
      clientName: newProject.clientName,
    });
    notify(
      formatNotification('New Project Created', {
        Project: newProject.name,
        Client: newProject.clientName,
        Budget: `$${newProject.budget.toLocaleString()}`,
        Deadline: newProject.deadline,
      }),
    );
    return newProject;
  }

  function updateProject(id: string, updates: Partial<Project>) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
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
          : {
              ...p,
              deliverables: p.deliverables.map((d) =>
                d.id === deliverableId ? { ...d, done: !d.done } : d,
              ),
            },
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
      formatNotification('New Invoice Issued', {
        Invoice: newInvoice.number,
        Client: newInvoice.clientName,
        Amount: `$${newInvoice.amount.toLocaleString()}`,
        'Due Date': newInvoice.dueDate,
      }),
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
          formatNotification('Payment Received', {
            Invoice: invoice.number,
            Client: invoice.clientName,
            Amount: `$${invoice.amount.toLocaleString()}`,
          }),
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
      formatNotification('New Lead Added', {
        Contact: newLead.clientName,
        Company: newLead.company,
        'Deal Value': `$${newLead.dealValue.toLocaleString()}`,
        Source: newLead.source,
        Priority: newLead.priority.charAt(0).toUpperCase() + newLead.priority.slice(1),
      }),
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
          formatNotification('Deal Won', {
            Client: lead.clientName,
            Company: lead.company,
            'Deal Value': `$${lead.dealValue.toLocaleString()}`,
          }),
        );
      } else if (updates.stage === 'lost') {
        notify(
          formatNotification('Deal Lost', {
            Client: lead.clientName,
            Company: lead.company,
            'Deal Value': `$${lead.dealValue.toLocaleString()}`,
          }),
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
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

function formatProjectStatus(status: ProjectStatus) {
  return status.replace('-', ' ');
}

function formatLeadStage(stage: LeadStage) {
  return stage[0].toUpperCase() + stage.slice(1);
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
