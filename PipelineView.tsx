
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
  ChevronRight
} from 'lucide-react';
import LeadModal from './LeadModal';
import { generateFollowUpEmail } from '../services/geminiService';

const PipelineView: React.FC = () => {
  const { state, updateLead } = useApp();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);

  const getLeadsByStage = (stage: Stage) => state.leads.filter(l => l.stage === stage);

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
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sales Pipeline</h2>
          <p className="text-sm text-slate-500">Drag and drop leads to update their status</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 flex items-center gap-2">
             <DollarSign size={14} className="text-green-500" />
             Pipeline: ${state.leads.reduce((a, b) => a + b.value, 0).toLocaleString()}
           </div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 h-full custom-scrollbar min-h-0">
        {STAGES.map(stage => {
          const leads = getLeadsByStage(stage);
          const stageValue = leads.reduce((sum, l) => sum + l.value, 0);

          return (
            <div 
              key={stage} 
              className="flex-shrink-0 w-80 flex flex-col h-full bg-slate-100/50 rounded-2xl border border-slate-200"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleStageDrop(e, stage)}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-700 text-sm uppercase tracking-widest">{stage}</h3>
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {leads.length}
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  ${stageValue.toLocaleString()}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-2 space-y-3 custom-scrollbar">
                {leads.map(lead => (
                  <div 
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onClick={() => handleLeadClick(lead)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                         <img src={`https://ui-avatars.com/api/?name=${lead.name}&background=random`} className="w-8 h-8 rounded-lg" />
                         <div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{lead.name}</h4>
                            <p className="text-[10px] text-slate-500 font-medium truncate w-32">{lead.company}</p>
                         </div>
                      </div>
                      <button className="text-slate-300 hover:text-slate-600">
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 text-sm">
                        <DollarSign size={14} className="text-green-500" />
                        {lead.value.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2">
                         {lead.source === 'Dux-Soup' && <Zap size={14} className="text-yellow-500" />}
                         <button 
                            onClick={(e) => handleAIAction(e, lead)}
                            className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors tooltip relative"
                         >
                           {aiLoadingId === lead.id ? (
                             <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                           ) : (
                             <Sparkles size={14} />
                           )}
                         </button>
                      </div>
                    </div>
                  </div>
                ))}
                {leads.length === 0 && (
                  <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium uppercase tracking-widest">
                    Empty Stage
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
