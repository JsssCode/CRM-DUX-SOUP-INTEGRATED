
import React from 'react';
import { useApp } from '../App';
import { Stage, Task } from '../types';
import { 
  DollarSign, 
  Users, 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  Zap,
  ListTodo,
  AlertCircle,
  CheckCircle2,
  Calendar,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const { state, openLeadModal } = useApp();

  const totalValue = state.leads.reduce((sum, l) => sum + l.value, 0);
  const activeLeads = state.leads.filter(l => l.stage !== Stage.WON && l.stage !== Stage.LOST).length;
  const wonValue = state.leads.filter(l => l.stage === Stage.WON).reduce((sum, l) => sum + l.value, 0);

  const pendingTasks: { task: Task; leadName: string; leadId: string }[] = [];
  state.leads.forEach(l => {
    l.tasks?.filter(t => !t.completed).forEach(t => {
      pendingTasks.push({ task: t, leadName: l.name, leadId: l.id });
    });
  });

  const sortedTasks = pendingTasks
    .sort((a, b) => {
      // Priority first
      if (a.task.priority === 'High' && b.task.priority !== 'High') return -1;
      if (a.task.priority !== 'High' && b.task.priority === 'High') return 1;
      // Then target date
      return new Date(a.task.targetDate).getTime() - new Date(b.task.targetDate).getTime();
    })
    .slice(0, 8);

  const pipelineData = [
    { name: 'Lead', count: state.leads.filter(l => l.stage === Stage.LEAD).length },
    { name: 'Qualified', count: state.leads.filter(l => l.stage === Stage.QUALIFIED).length },
    { name: 'Proposal', count: state.leads.filter(l => l.stage === Stage.PROPOSAL).length },
    { name: 'Negotiation', count: state.leads.filter(l => l.stage === Stage.NEGOTIATION).length },
  ];

  const recentLeads = [...state.leads]
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    .slice(0, 5);

  const stats = [
    { label: 'Pipeline Value', value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: 'bg-blue-100 text-blue-600' },
    { label: 'Active Deals', value: activeLeads, icon: TrendingUp, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Won Revenue', value: `$${wonValue.toLocaleString()}`, icon: BarChart3, color: 'bg-green-100 text-green-600' },
    { label: 'Open Actions', value: pendingTasks.length, icon: ListTodo, color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Section: Action Items (Light Theme) */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-extrabold text-2xl text-slate-900 flex items-center gap-3">
              <Zap size={28} className="text-yellow-500 fill-yellow-500" /> Critical Action Items
            </h3>
            <p className="text-sm text-slate-500 mt-1">High-priority tasks requiring your immediate attention</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Status</span>
            <span className="text-lg font-black text-blue-600">{pendingTasks.length} Pending</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedTasks.map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => openLeadModal(item.leadId, 'tasks')}
              className="bg-slate-50 border border-slate-100 p-5 rounded-3xl hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={14} className="text-blue-400" />
              </div>
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${item.task.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  {item.task.priority}
                </span>
                <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Clock size={12} className="text-blue-400" />
                  Due: {new Date(item.task.targetDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <p className="text-sm font-bold text-slate-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">{item.task.title}</p>
              <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-200/50">
                <img src={`https://ui-avatars.com/api/?name=${item.leadName}&background=random`} className="w-5 h-5 rounded-md" />
                <span className="text-[10px] text-slate-500 font-bold truncate">@{item.leadName}</span>
              </div>
            </div>
          ))}
          {sortedTasks.length === 0 && (
            <div className="col-span-full py-16 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm"><CheckCircle size={32} className="text-green-500" /></div>
              <div>
                <p className="text-slate-800 font-bold">You're all caught up!</p>
                <p className="text-xs text-slate-500">No pending high-priority actions found across all leads.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4 group hover:shadow-md transition-all">
            <div className={`p-4 rounded-2xl ${stat.color} group-hover:scale-105 transition-transform`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 h-full">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-extrabold text-slate-900 text-xl">Pipeline Distribution</h3>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Stages</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-200"></div> Capacity</div>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem' }} 
                  />
                  <Bar dataKey="count" radius={[12, 12, 0, 0]} barSize={40}>
                     {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col">
          <h3 className="font-extrabold text-slate-900 text-xl mb-8 flex items-center gap-3">
            <Clock size={24} className="text-blue-500" /> Recent Activity
          </h3>
          <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {recentLeads.length === 0 ? (
               <div className="text-center py-20 text-slate-400 italic text-sm">No recent activity</div>
            ) : (
              recentLeads.map(lead => (
                <div key={lead.id} onClick={() => openLeadModal(lead.id)} className="flex gap-4 items-start pb-6 border-b border-slate-100 last:border-0 last:pb-0 group cursor-pointer">
                  <img src={`https://ui-avatars.com/api/?name=${lead.name}&background=random`} className="w-12 h-12 rounded-2xl group-hover:scale-105 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">{lead.name}</h4>
                      <span className="text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-black uppercase border border-blue-100">{lead.stage}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{lead.company}</p>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                      <Clock size={10} />
                      {new Date(lead.lastActivity).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
