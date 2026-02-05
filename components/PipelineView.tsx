
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
  AlertCircle
} from 'lucide-react';
import LeadModal from './LeadModal';
import { generateFollowUpEmail } from '../services/geminiService';

const PipelineView: React.FC = () => {
  const { filteredLeads, updateLead } = useApp();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);

  const getLeadsByStage = (stage: Stage) => filteredLeads.filter(l => l.stage === stage);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

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
                  const highPriorityTask = pendingTasks.find(t => t.priority === 'High');

                  return (
                    <div 
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => handleLeadClick(lead)}
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

                      {/* Action Items Indicator */}
                      {pendingTasks.length > 0 && (
                        <div className={`mb-4 p-3 rounded-xl flex items-center gap-3 border ${highPriorityTask ? 'bg-red-50/50 border-red-100' : 'bg-orange-50/50 border-orange-100'}`}>
                           <ListTodo size={14} className={highPriorityTask ? 'text-red-500' : 'text-orange-500'} />
                           <div className="flex-1 min-w-0">
                              <p className={`text-[10px] font-bold truncate ${highPriorityTask ? 'text-red-800' : 'text-orange-800'}`}>
                                {highPriorityTask ? highPriorityTask.title : `${pendingTasks.length} pending actions`}
                              </p>
                           </div>
                           {highPriorityTask && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>}
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
      
      {selectedLead && (
        <LeadModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          lead={selectedLead}
        />
      )}
    </div>
  );
};

export default PipelineView;
