
import React, { useState } from 'react';
import { useApp } from '../App';
import { Stage, Lead } from '../types';
import { STAGES } from '../constants';
import { 
  MoreVertical, 
  MessageSquare, 
  DollarSign, 
  Zap,
  Sparkles,
  ChevronRight,
  ListTodo,
  AlertCircle,
  Clock
} from 'lucide-react';
import { generateFollowUpEmail } from '../services/geminiService';

const PipelineView: React.FC = () => {
  const { filteredLeads, updateLead, openLeadModal } = useApp();
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);

  const getLeadsByStage = (stage: Stage) => filteredLeads.filter(l => l.stage === stage);

  const handleAIAction = async (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    setAiLoadingId(lead.id);
    const content = await generateFollowUpEmail(lead);
    alert(`AI Generated Follow-up for ${lead.name}:\n\n${content}`);
    setAiLoadingId(null);
  };

  const handleStageDrop = (e: React.DragEvent, targetStage: Stage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      updateLead(leadId, { stage: targetStage });
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sales Pipeline</h2>
          <p className="text-sm text-slate-500 font-medium">Manage and move leads through your sales cycle</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 text-xs font-black text-slate-700 flex items-center gap-2 shadow-sm">
             <DollarSign size={16} className="text-green-500" />
             Pipeline: ${filteredLeads.reduce((a, b) => a + b.value, 0).toLocaleString()}
           </div>
        </div>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-6 h-full custom-scrollbar min-h-0">
        {STAGES.map(stage => {
          const leads = getLeadsByStage(stage);
          const stageValue = leads.reduce((sum, l) => sum + l.value, 0);

          return (
            <div 
              key={stage} 
              className="flex-shrink-0 w-80 flex flex-col h-full bg-slate-100/40 rounded-[2rem] border border-slate-200"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleStageDrop(e, stage)}
            >
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-600 text-[10px] uppercase tracking-[0.15em]">{stage}</h3>
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-lg text-[10px] font-black">
                    {leads.length}
                  </span>
                </div>
                <div className="text-[10px] font-black text-slate-400">
                  ${stageValue.toLocaleString()}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 space-y-3 custom-scrollbar">
                {leads.map(lead => {
                  const pendingTasks = lead.tasks?.filter(t => !t.completed) || [];

                  return (
                    <div 
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => openLeadModal(lead.id)}
                      className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 cursor-grab active:cursor-grabbing transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <img src={`https://ui-avatars.com/api/?name=${lead.name}&background=random`} className="w-10 h-10 rounded-xl shadow-sm border border-slate-50" />
                           <div className="min-w-0">
                              <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">{lead.name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate w-32">{lead.company}</p>
                           </div>
                        </div>
                        <button className="text-slate-300 hover:text-slate-600 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>

                      {/* Pending Action Items List */}
                      {pendingTasks.length > 0 && (
                        <div className="mb-4 space-y-2">
                           <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1 mb-1.5">
                              <ListTodo size={10} /> Pending Actions
                           </div>
                           {pendingTasks.slice(0, 3).map(task => (
                             <div 
                                key={task.id} 
                                onClick={(e) => { e.stopPropagation(); openLeadModal(lead.id, 'tasks'); }}
                                className={`p-2 rounded-xl flex items-center justify-between border cursor-pointer hover:scale-[1.02] transition-transform ${task.priority === 'High' ? 'bg-red-50/50 border-red-100' : 'bg-orange-50/50 border-orange-100'}`}
                             >
                                <div className="min-w-0 flex-1 pr-2">
                                  <p className={`text-[9px] font-bold truncate ${task.priority === 'High' ? 'text-red-800' : 'text-orange-800'}`}>
                                    {task.title}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                   <Clock size={8} className={task.priority === 'High' ? 'text-red-500' : 'text-orange-500'} />
                                   <span className={`text-[8px] font-black ${task.priority === 'High' ? 'text-red-600' : 'text-orange-600'}`}>
                                      {new Date(task.targetDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                   </span>
                                </div>
                             </div>
                           ))}
                           {pendingTasks.length > 3 && (
                             <p className="text-[8px] font-bold text-slate-400 text-center uppercase tracking-widest mt-1">+{pendingTasks.length - 3} more actions</p>
                           )}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 font-black text-slate-700 text-sm">
                          <DollarSign size={14} className="text-green-500" />
                          {lead.value.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                           {lead.source === 'Dux-Soup' && <Zap size={14} className="text-yellow-500 fill-yellow-500" />}
                           <button 
                              onClick={(e) => handleAIAction(e, lead)}
                              className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                           >
                             {aiLoadingId === lead.id ? (
                               <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                             ) : (
                               <Sparkles size={14} />
                             )}
                           </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {leads.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    No Leads
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineView;
