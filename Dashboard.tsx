
import React from 'react';
import { useApp } from '../App';
import { Stage } from '../types';
import { 
  DollarSign, 
  Users, 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const { state } = useApp();

  const totalValue = state.leads.reduce((sum, l) => sum + l.value, 0);
  const activeLeads = state.leads.filter(l => l.stage !== Stage.WON && l.stage !== Stage.LOST).length;
  const wonValue = state.leads.filter(l => l.stage === Stage.WON).reduce((sum, l) => sum + l.value, 0);

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
    { label: 'Total Pipeline Value', value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: 'bg-blue-100 text-blue-600' },
    { label: 'Active Opportunities', value: activeLeads, icon: TrendingUp, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Converted Revenue', value: `$${wonValue.toLocaleString()}`, icon: BarChart3, color: 'bg-green-100 text-green-600' },
    { label: 'Total Leads', value: state.leads.length, icon: Users, color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 group hover:shadow-md transition-all">
            <div className={`p-3 rounded-xl ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-slate-800 text-xl">Pipeline Health</h3>
            <span className="text-xs text-slate-400 font-medium">Updated 5m ago</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                   {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 text-xl mb-6 flex items-center gap-2">
            <Clock size={20} className="text-blue-500" /> Recent Activity
          </h3>
          <div className="space-y-6">
            {recentLeads.map(lead => (
              <div key={lead.id} className="flex gap-4 items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="relative">
                  <img src={`https://ui-avatars.com/api/?name=${lead.name}&background=random`} className="w-10 h-10 rounded-xl" />
                  {lead.source === 'Dux-Soup' && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-0.5 rounded-full border-2 border-white">
                      <Zap size={8} className="text-white fill-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{lead.name}</h4>
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">{lead.stage}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate">{lead.company}</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{new Date(lead.lastActivity).toLocaleDateString()} at {new Date(lead.lastActivity).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2.5 text-blue-600 font-bold text-xs bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
            View All Activities
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
