
export enum Stage {
  LEAD = 'Lead',
  QUALIFIED = 'Qualified',
  PROPOSAL = 'Proposal',
  NEGOTIATION = 'Negotiation',
  WON = 'Won',
  LOST = 'Lost'
}

export type InteractionType = 'Call' | 'LinkedIn' | 'Email' | 'Note';

export interface Interaction {
  id: string;
  type: InteractionType;
  content: string;
  timestamp: string;
}

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskType = 'Follow-up' | 'Meeting' | 'Call' | 'Email' | 'LinkedIn' | 'Research';

export interface Task {
  id: string;
  title: string;
  targetDate: string;
  completedDate?: string;
  priority: TaskPriority;
  type: TaskType;
  completed: boolean;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  avatar?: string;
  value: number;
  stage: Stage;
  source: 'Manual' | 'Dux-Soup' | 'Referral' | 'Inbound';
  lastActivity: string;
  notes: string;
  interactions: Interaction[];
  tasks: Task[];
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface User {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface CRMState {
  leads: Lead[];
  notifications: Notification[];
  users: User[];
  currentUser: User | null;
}
