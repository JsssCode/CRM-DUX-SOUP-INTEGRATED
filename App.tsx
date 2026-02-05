
import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Kanban, 
  Bell, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  TrendingUp,
  HardDrive,
  RefreshCw,
  X,
  CheckCircle2,
  UserCircle2,
  UserPlus2,
  ArrowRight,
  Zap,
  Key,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Lead, Stage, Notification, User, CRMState } from './types';
import { INITIAL_LEADS } from './constants';
import PipelineView from './components/PipelineView';
import Dashboard from './components/Dashboard';
import LeadModal from './components/LeadModal';
import DuxSoupImport from './components/DuxSoupImport';

// Context
interface AppContextType {
  state: CRMState;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastActivity'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  selectUser: (user: User) => void;
  addUser: (name: string, role: string) => void;
  logout: () => void;
  markNotificationRead: (id: string) => void;
  addNotification: (title: string, message: string, type: Notification['type']) => void;
  connectLocalFile: () => Promise<void>;
  isSynced: boolean;
  fileName: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredLeads: Lead[];
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

const ApiKeyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      // Check if API key is already in env
      if (process.env.API_KEY && process.env.API_KEY !== 'undefined') {
        setHasKey(true);
        return;
      }

      // Check window.aistudio bridge
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Fallback for non-aistudio environments where process.env might be provided later
        setHasKey(true); 
      }
    };
    checkKey();
  }, []);

  const handleOpenPicker = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Per instructions: assume success immediately and proceed
      setHasKey(true);
    }
  };

  if (hasKey === null) return null;

  if (!hasKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-500 rounded-full blur-[80px]"></div>
        </div>
        
        <div className="w-full max-w-md z-10 animate-in zoom-in-95 duration-500 text-center">
          <div className="bg-blue-600/20 inline-flex p-6 rounded-[2.5rem] mb-8 border border-blue-500/30 shadow-2xl">
            <ShieldCheck size={48} className="text-blue-400" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-4">Connection Required</h1>
          <p className="text-slate-400 font-medium mb-8 leading-relaxed">
            To enable AI-powered lead analysis and automated follow-ups, Nexus needs to connect to your Gemini API key.
          </p>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-[2.5rem] shadow-2xl mb-8">
            <button 
              onClick={handleOpenPicker}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-500 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 mb-4"
            >
              <Key size={20} />
              Connect Gemini API
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
            >
              Learn about Billing & Keys <ExternalLink size={12} />
            </a>
          </div>
          
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">Secure • Private • Professional</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CRMState>(() => {
    const saved = localStorage.getItem('nexus_crm_data');
    if (saved) return JSON.parse(saved);
    return {
      leads: INITIAL_LEADS,
      notifications: [
        { id: 'n1', title: 'Welcome', message: 'Nexus CRM is ready for your sales!', type: 'success', timestamp: new Date().toISOString(), read: false }
      ],
      users: [
        { id: 'u1', name: 'Default Agent', role: 'Sales Lead' }
      ],
      currentUser: null
    };
  });

  const [fileHandle, setFileHandle] = useState<any>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('nexus_crm_data', JSON.stringify(state));
  }, [state]);

  const saveToDisk = useCallback(async (data: CRMState) => {
    if (!fileHandle) return;
    try {
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      setIsSynced(true);
    } catch (err) {
      console.error('Failed to write to local file:', err);
      setIsSynced(false);
    }
  }, [fileHandle]);

  useEffect(() => {
    if (fileHandle) {
      saveToDisk(state);
    }
  }, [state, fileHandle, saveToDisk]);

  const connectLocalFile = async () => {
    try {
      // @ts-ignore
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'CRM Database', accept: { 'application/json': ['.json'] } }],
        multiple: false
      });
      setFileHandle(handle);
      setFileName(handle.name);
      const file = await handle.getFile();
      const content = await file.text();
      if (content) {
        setState(JSON.parse(content));
        addNotification('Local Sync Active', `Connected to ${handle.name}`, 'success');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        try {
          // @ts-ignore
          const handle = await window.showSaveFilePicker({
            suggestedName: 'nexus_db.json',
            types: [{ description: 'CRM Database', accept: { 'application/json': ['.json'] } }]
          });
          setFileHandle(handle);
          setFileName(handle.name);
          saveToDisk(state);
        } catch (saveErr) {}
      }
    }
  };

  const addLead = (leadData: any) => {
    const newLead: Lead = {
      ...leadData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      interactions: leadData.interactions || [],
      tasks: leadData.tasks || [],
    };
    setState(prev => ({ ...prev, leads: [newLead, ...prev.leads] }));
    addNotification('Lead Added', `${newLead.name} was added to pipeline.`, 'info');
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setState(prev => ({
      ...prev,
      leads: prev.leads.map(l => l.id === id ? { ...l, ...updates, lastActivity: new Date().toISOString() } : l)
    }));
  };

  const deleteLead = (id: string) => {
    setState(prev => ({ ...prev, leads: prev.leads.filter(l => l.id !== id) }));
  };

  const selectUser = (user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
  };

  const addUser = (name: string, role: string) => {
    const newUser: User = { id: Math.random().toString(36).substr(2, 9), name, role };
    setState(prev => ({ ...prev, users: [...prev.users, newUser] }));
    addNotification('User Created', `${name} joined the team.`, 'success');
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const markNotificationRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  };

  const addNotification = (title: string, message: string, type: Notification['type']) => {
    setState(prev => ({
      ...prev,
      notifications: [
        { id: Math.random().toString(36).substr(2, 9), title, message, type, timestamp: new Date().toISOString(), read: false },
        ...prev.notifications
      ].slice(0, 20)
    }));
  };

  const filteredLeads = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return state.leads;
    return state.leads.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.company.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.notes.toLowerCase().includes(q)
    );
  }, [state.leads, searchQuery]);

  return (
    <AppContext.Provider value={{ 
      state, addLead, updateLead, deleteLead, selectUser, addUser, logout, 
      markNotificationRead, addNotification, connectLocalFile, 
      isSynced, fileName, searchQuery, setSearchQuery, filteredLeads
    }}>
      {children}
    </AppContext.Provider>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, logout, markNotificationRead, isSynced, searchQuery, setSearchQuery } = useApp();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = state.notifications.filter(n => !n.read).length;

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Pipeline', icon: Kanban, path: '/pipeline' },
    { label: 'Contacts', icon: Users, path: '/contacts' },
    { label: 'Dux-Soup Hub', icon: Zap, path: '/dux-soup' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <TrendingUp size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight uppercase tracking-[0.2em]">Nexus</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 space-y-4">
          <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${isSynced ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
            <HardDrive size={18} className={isSynced ? 'text-green-400' : 'text-slate-500'} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isSynced ? 'text-green-400' : 'text-slate-500'}`}>
              {isSynced ? 'OS Sync Active' : 'Offline Mode'}
            </span>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all border-t border-slate-800"
          >
            <LogOut size={20} />
            <span className="font-medium">Switch User</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-full border border-slate-200 w-96 group focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white transition-all">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Quick search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none" 
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative transition-colors">
                <Bell size={20} />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-white">{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">Notifications</div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {state.notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">No notifications</div>
                    ) : (
                      state.notifications.map(n => (
                        <div key={n.id} onClick={() => markNotificationRead(n.id)} className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}>
                          <p className="font-bold text-sm text-slate-800">{n.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{state.currentUser?.name}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{state.currentUser?.role}</p>
              </div>
              <img src={`https://ui-avatars.com/api/?name=${state.currentUser?.name}&background=0D8ABC&color=fff`} className="w-10 h-10 rounded-xl shadow-sm border border-slate-100" />
            </div>
          </div>
        </header>
        <section className="flex-1 overflow-auto p-8 custom-scrollbar">{children}</section>
      </main>
    </div>
  );
};

const UserSelection: React.FC = () => {
  const { state, selectUser, addUser } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Sales Rep');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      addUser(newName.trim(), newRole);
      setNewName('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-500 rounded-full blur-[80px]"></div>
      </div>
      
      <div className="w-full max-w-4xl z-10 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-12">
          <div className="bg-blue-600 inline-flex p-5 rounded-[2rem] mb-6 shadow-2xl shadow-blue-500/40">
            <TrendingUp size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Who's selling today?</h1>
          <p className="text-slate-400 mt-3 font-medium">Select your profile to enter the workspace</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.users.map(user => (
            <button 
              key={user.id}
              onClick={() => selectUser(user)}
              className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-8 rounded-[2.5rem] flex flex-col items-center text-center group hover:bg-slate-700/80 hover:border-blue-500/50 transition-all hover:-translate-y-1 shadow-xl"
            >
              <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random&size=128`} className="w-20 h-20 rounded-[1.5rem] mb-6 shadow-lg border-2 border-slate-700 group-hover:border-blue-500 transition-colors" />
              <h3 className="text-xl font-bold text-white mb-1">{user.name}</h3>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{user.role}</p>
              <div className="mt-6 flex items-center gap-2 text-blue-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Enter Dashboard <ArrowRight size={14} />
              </div>
            </button>
          ))}

          {showAddForm ? (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4">
               <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-wider text-sm"><UserPlus2 size={18} /> New Agent</h3>
               <form onSubmit={handleCreate} className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Name</label>
                    <input autoFocus required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold" placeholder="Agent Name" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Role</label>
                    <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold">
                      <option>Sales Rep</option>
                      <option>Account Executive</option>
                      <option>Admin</option>
                    </select>
                 </div>
                 <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-blue-600 text-white text-sm font-black rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">Create</button>
                 </div>
               </form>
            </div>
          ) : (
            <button 
              onClick={() => setShowAddForm(true)}
              className="border-2 border-dashed border-slate-700 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-500 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Plus size={32} />
              </div>
              <span className="font-bold">Add Team Member</span>
            </button>
          )}
        </div>
        
        <p className="mt-12 text-center text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">Local-First Storage • No Password Required</p>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useApp();
  if (!state.currentUser) return <UserSelection />;
  return <Layout>{children}</Layout>;
};

const Contacts: React.FC = () => {
  const { filteredLeads } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Active Contacts</h2>
          <p className="text-slate-500 font-medium text-sm">Double-click a row to open profile</p>
        </div>
        <button onClick={handleAddNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-blue-200 transition-all active:scale-95">
          <Plus size={20} /> Add Contact
        </button>
      </div>
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prospect</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stage</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deal Value</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Channel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-medium italic">No matches found. Try a different search term.</td>
                </tr>
              ) : (
                filteredLeads.map(lead => (
                  <tr 
                    key={lead.id} 
                    onDoubleClick={() => handleEdit(lead)}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer select-none"
                    title="Double-click to view profile"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <img src={`https://ui-avatars.com/api/?name=${lead.name}&background=random`} className="w-10 h-10 rounded-xl shadow-sm border border-white" />
                        <div>
                          <p className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{lead.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{lead.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-lg border border-slate-200">
                        {lead.stage}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-black text-slate-700 text-sm">
                      ${lead.value.toLocaleString()}
                    </td>
                    <td className="px-8 py-5">
                       <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${lead.source === 'Dux-Soup' ? 'text-blue-600' : 'text-slate-400'}`}>
                         {lead.source === 'Dux-Soup' && <Zap size={12} className="fill-blue-500 text-blue-500" />}
                         {lead.source}
                       </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <LeadModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingLead(null); }} 
        lead={editingLead || undefined} 
      />
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const { connectLocalFile, isSynced, fileName, state } = useApp();
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-900">System Preferences</h2>
        <p className="text-slate-500 font-medium">Workspace configuration and data security</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6">
          <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase tracking-wider text-sm"><HardDrive className="text-blue-600" size={20} /> Data Storage</h3>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Nexus CRM uses <strong>Local-First Storage</strong>. All leads, tasks, and users are stored in a single JSON file on your machine.
          </p>
          {isSynced ? (
            <div className="p-5 bg-green-50 border border-green-200 rounded-[1.5rem] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 text-white rounded-xl"><CheckCircle2 size={18} /></div>
                <div>
                  <p className="text-sm font-bold text-green-800">Connected</p>
                  <p className="text-[10px] text-green-600 font-black uppercase">{fileName}</p>
                </div>
              </div>
              <button onClick={connectLocalFile} className="p-2 text-green-700 hover:bg-green-100 rounded-xl transition-all"><RefreshCw size={16} /></button>
            </div>
          ) : (
            <button onClick={connectLocalFile} className="w-full bg-slate-900 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"><HardDrive size={20} /> Connect Local Database</button>
          )}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6">
          <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase tracking-wider text-sm"><Users className="text-indigo-600" size={20} /> Team Members</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
            {state.users.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <img src={`https://ui-avatars.com/api/?name=${u.name}&size=64`} className="w-8 h-8 rounded-lg" />
                <div>
                  <p className="text-sm font-bold text-slate-800">{u.name}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ApiKeyGuard>
      <AppProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/pipeline" element={<ProtectedRoute><PipelineView /></ProtectedRoute>} />
            <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
            <Route path="/dux-soup" element={<ProtectedRoute><DuxSoupImport /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AppProvider>
    </ApiKeyGuard>
  );
};

export default App;