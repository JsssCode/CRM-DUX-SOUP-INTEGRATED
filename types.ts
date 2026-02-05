
export enum Stage {
  LEAD = 'Lead',
  QUALIFIED = 'Qualified',
  PROPOSAL = 'Proposal',
  NEGOTIATION = 'Negotiation',
  WON = 'Won',
  LOST = 'Lost'
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
  email: string;
  isLoggedIn: boolean;
}

export interface CRMState {
  leads: Lead[];
  notifications: Notification[];
  user: User | null;
}
