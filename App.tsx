
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
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
  MessageSquare, 
  Zap,
  TrendingUp,
  Download,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { Lead, Stage, Notification, User, CRMState } from './types';
import { INITIAL_LEADS, STAGES } from './constants';
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
  login: (email: string) => void;
  logout: () => void;
  markNotificationRead: (id: string) => void;
  addNotification: (title: string, message: string, type: Notification['type']) => void;
  connectLocalFile: () => Promise<void>;
  isSynced: boolean;
  fileName: string | null;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
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
      user: null
    };
  });

  const [fileHandle, setFileHandle] = useState<any>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Persistence to LocalStorage (as fallback)
  useEffect(() => {
    localStorage.setItem('nexus_crm_data', JSON.stringify(state));
  }, [state]);

  // Persistence to OS File System
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
        const data = JSON.parse(content);
        setState(data);
        addNotification('Local Sync Active', `Connected to ${handle.name} on your Mac.`, 'success');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        // Fallback to Save Picker if file doesn't exist
        try {
          // @ts-ignore
          const handle = await window.showSaveFilePicker({
            suggestedName: 'nexus_db.json',
            types: [{ description: 'CRM Database', accept: { 'application/json': ['.json'] } }]
          });
          setFileHandle(handle);
          setFileName(handle.name);
          saveToDisk(state);
        } catch (saveErr) {
          console.error("User cancelled file pickers");
        }
      }
    }
  };

  const addLead = (leadData: any) => {
    const newLead: Lead = {
      ...leadData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, leads: [newLead, ...prev.leads] }));
    addNotification('Lead Added', `${newLead.name} from ${newLead.company} was added.`, 'info');
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

  const login = (email: string) => {
    setState(prev => ({ ...prev, user: { id: 'u1', name: email.split('@')[0], email, isLoggedIn: true } }));
  };

  const logout = () => {
    setState(prev => ({ ...prev, user: null }));
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

  return (
    <AppContext.Provider value={{ 
      state, addLead, updateLead, deleteLead, login, logout, 
      markNotificationRead, addNotification, connectLocalFile, 
      isSynced, fileName 
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Protected Layout
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, logout, markNotificationRead, isSynced } = useApp();
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
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">NEXUS CRM</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                location.pathname === item.path 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 space-y-4">
          {isSynced ? (
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex items-center gap-3">
              <div className="relative">
                <HardDrive size={18} className="text-green-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              </div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Live Sync Active</span>
            </div>
          ) : (
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex items-center gap-3 opacity-50">
              <HardDrive size={18} className="text-slate-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Local Mode Only</span>
            </div>
          )}
          
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all border-t border-slate-800"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-full border border-slate-200 w-96">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search leads, companies..." 
              className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Notifications</h3>
                    <button className="text-xs text-blue-600 hover:underline">Mark all as read</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {state.notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 italic text-sm">No notifications</div>
                    ) : (
                      state.notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                          onClick={() => markNotificationRead(n.id)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-sm text-slate-800">{n.title}</span>
                            <span className="text-[10px] text-slate-400">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{state.user?.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Admin</p>
              </div>
              <img 
                src={`https://ui-avatars.com/api/?name=${state.user?.name}&background=0D8ABC&color=fff`} 
                alt="Profile" 
                className="w-10 h-10 rounded-xl border border-slate-200 shadow-sm"
              />
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-auto p-8 custom-scrollbar">
          {children}
        </section>
      </main>
    </div>
  );
};

// Login Screen
const Login: React.FC = () => {
  const { state, login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Automatically redirect if already logged in
  useEffect(() => {
    if (state.user) {
      navigate('/', { replace: true });
    }
  }, [state.user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      login(email);
      // The useEffect above will handle redirection once the state updates
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500 rounded-full blur-[120px]"></div>
      </div>
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 z-10 border border-slate-200">
        <div className="text-center mb-8">
          <div className="bg-blue-600 inline-flex p-3 rounded-2xl mb-4 shadow-xl shadow-blue-200">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Nexus CRM</h1>
          <p className="text-slate-500 mt-2">Sign in to your sales workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Work Email</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input 
              required
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] transform"
          >
            Enter Dashboard
          </button>
        </form>

        <div className="mt-8 text-center space-y-2">
           <p className="text-xs text-slate-400">
             Local Storage Auth Enabled • Privacy First
           </p>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useApp();
  if (!state.user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const Contacts: React.FC = () => {
  const { state, deleteLead } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Contacts</h2>
          <p className="text-slate-500">Manage all your potential customers and their data</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all"
        >
          <Plus size={20} /> Add Contact
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name & Company</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pipeline Stage</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Value</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Source</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Activity</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.leads.map(lead => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${lead.name}&background=random`} 
                      className="w-10 h-10 rounded-full border border-slate-200"
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-900">{lead.name}</div>
                      <div className="text-xs text-slate-500 font-medium">{lead.company}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    lead.stage === Stage.WON ? 'bg-green-100 text-green-700' :
                    lead.stage === Stage.LOST ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {lead.stage}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                  ${lead.value.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2 text-xs text-slate-600">
                      {lead.source === 'Dux-Soup' ? <Zap size={14} className="text-yellow-500" /> : <Users size={14} className="text-blue-500" />}
                      {lead.source}
                   </div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {new Date(lead.lastActivity).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => deleteLead(lead.id)}
                    className="text-slate-300 hover:text-red-500 p-2 group-hover:bg-red-50 rounded-lg transition-all"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <LeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const { connectLocalFile, isSynced, fileName } = useApp();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500">Configure your CRM environment and local OS storage</p>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <HardDrive className="text-blue-600" size={20} /> Mac OS Local Storage (No Backend)
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            Connect a JSON file on your computer. All changes will be saved directly to your disk, making your data permanent even if browser cache is cleared.
          </p>
          
          {isSynced ? (
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <HardDrive size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-800">Live Syncing Active</p>
                  <p className="text-[10px] text-green-600 uppercase font-bold tracking-widest">{fileName}</p>
                </div>
              </div>
              <button 
                onClick={connectLocalFile}
                className="text-xs font-bold text-green-700 hover:underline flex items-center gap-1"
              >
                <RefreshCw size={12} /> Change File
              </button>
            </div>
          ) : (
            <button 
              onClick={connectLocalFile}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
            >
              <HardDrive size={20} /> Select Local Database File
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Zap className="text-yellow-500" size={20} /> Automation Integration
          </h3>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="font-semibold text-slate-900">Dux-Soup Extension</p>
              <p className="text-xs text-slate-500">Automatically sync LinkedIn leads</p>
            </div>
            <span className="bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Connected</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MessageSquare className="text-blue-500" size={20} /> AI Sales Assistant
          </h3>
          <p className="text-sm text-slate-600 mb-4">Gemini API is used for follow-up generation and lead quality analysis.</p>
          <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-xs font-medium border border-blue-100">
            Status: Active (using global system key)
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">Manual Export</h3>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all">
            <Download size={18} /> Download Snapshot (.json)
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/pipeline" element={<ProtectedRoute><PipelineView /></ProtectedRoute>} />
          <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
          <Route path="/dux-soup" element={<ProtectedRoute><DuxSoupImport /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
