export type ClientStatus = 'active' | 'inactive' | 'lead';

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: ClientStatus;
  industry: string;
  website: string;
  address: string;
  lastContacted: string;
  createdAt: string;
  avatarColor: string;
  tags: string[];
  telegramChatId?: string;
  telegramUsername?: string;
}

export type LeadStage =
  | 'new'
  | 'contacted'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export type Priority = 'low' | 'medium' | 'high';

export interface Lead {
  id: string;
  clientName: string;
  company: string;
  dealValue: number;
  source: string;
  priority: Priority;
  nextFollowUp: string;
  stage: LeadStage;
  avatarColor: string;
}

export type ProjectStatus = 'on-track' | 'at-risk' | 'delayed' | 'completed';

export interface Deliverable {
  id: string;
  label: string;
  done: boolean;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  deadline: string;
  progress: number;
  status: ProjectStatus;
  team: string[];
  deliverables: Deliverable[];
  budget: number;
}

export type InvoiceStatus = 'paid' | 'pending' | 'overdue';

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: { label: string; amount: number }[];
}

export type TaskStatus = 'pending' | 'completed';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  dueDate: string;
  clientId?: string;
  clientName?: string;
  status: TaskStatus;
  category: string;
}

export type ActivityType =
  | 'note'
  | 'call'
  | 'email'
  | 'meeting'
  | 'invoice'
  | 'project'
  | 'deal'
  | 'message';

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  clientId?: string;
  clientName?: string;
}

export interface ClientNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}
