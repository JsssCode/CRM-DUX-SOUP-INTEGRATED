
import { Stage, Lead } from './types';

export const STAGES = [
  Stage.LEAD,
  Stage.QUALIFIED,
  Stage.PROPOSAL,
  Stage.NEGOTIATION,
  Stage.WON
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: '1',
    name: 'Sarah Connor',
    company: 'SkyNet Solutions',
    email: 'sarah@skynet.io',
    linkedinUrl: 'https://linkedin.com/in/sarahconnor',
    value: 12000,
    stage: Stage.LEAD,
    source: 'Dux-Soup',
    lastActivity: new Date().toISOString(),
    notes: 'Interested in AI security protocols.',
    interactions: [],
    // Added missing tasks property to satisfy Lead interface
    tasks: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: '2',
    name: 'Arthur Dent',
    company: 'Galactic Travels',
    email: 'arthur@42.com',
    value: 5000,
    stage: Stage.QUALIFIED,
    source: 'Manual',
    lastActivity: new Date().toISOString(),
    notes: 'Looking for a lift to the nearest star system.',
    interactions: [],
    // Added missing tasks property to satisfy Lead interface
    tasks: [],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: '3',
    name: 'Ellen Ripley',
    company: 'Weyland-Yutani',
    email: 'ripley@weyland.com',
    value: 45000,
    stage: Stage.PROPOSAL,
    source: 'Dux-Soup',
    lastActivity: new Date().toISOString(),
    notes: 'Extermination services proposal pending.',
    interactions: [],
    // Added missing tasks property to satisfy Lead interface
    tasks: [],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  }
];
