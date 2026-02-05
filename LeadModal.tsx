
import React, { useState, useEffect } from 'react';
import { Lead, Stage } from '../types';
import { useApp } from '../App';
import { STAGES } from '../constants';
import { 
  X, 
  Linkedin, 
  Mail, 
  Phone, 
  MessageSquare, 
  Sparkles,
  Calendar,
  Building2,
  Trash2
} from 'lucide-react';
import { analyzeLeadQuality, generateFollowUpEmail } from '../services/geminiService';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead;
}

const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, lead }) => {
  const { addLead, updateLead, deleteLead } = useApp();
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    company: '',
    email: '',
    value: 0,
    stage: Stage.LEAD,
    source: 'Manual',
    notes: ''
  });
  const [aiScore, setAiScore] = useState<string>('Click analyze to get AI insights');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData(lead);
      setAiScore('Click analyze to get AI insights');
    } else {
      setFormData({
        name: '',
        company: '',
        email: '',
        value: 0,
        stage: Stage.LEAD,
        source: 'Manual',
        notes: ''
      });
    }
  }, [lead, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (lead) {
      updateLead(lead.id, formData);
    } else {
      addLead(formData as any);
    }
    onClose();
  };

  const handleAnalyze = async () => {
    if (!formData.name) return;
    setIsAnalyzing(true);
    const result = await analyzeLeadQuality(formData as Lead);
    setAiScore(result);
    setIsAnalyzing(false);
  };

  const handleDelete = () => {
    if (lead && window.confirm('Are you sure you want to delete this lead?')) {
      deleteLead(lead.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
        {/* Profile Sidebar */}
        <div className="md:w-80 bg-slate-50 p-8 border-r border-slate-200">
          <div className="text-center mb-8">
            <img 
              src={`https://ui-avatars.com/api/?name=${formData.name || 'User'}&size=128&background=random`} 
              className="w-32 h-32 rounded-3xl mx-auto border-4 border-white shadow-lg mb-4" 
            />
            <h3 className="text-xl font-bold text-slate-900">{formData.name || 'New Lead'}</h3>
            <p className="text-slate-500 text-sm font-medium">{formData.company || 'Company Name'}</p>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Lead Health</div>
              <div className="flex items-center justify-between mb-2">
                 <span className="text-xs font-bold text-slate-700">AI Score</span>
                 <Sparkles size={14} className="text-indigo-500" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                {isAnalyzing ? "Processing..." : aiScore}
              </p>
              {!isAnalyzing && (
                <button 
                  onClick={handleAnalyze}
                  className="w-full mt-3 py-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all"
                >
                  Refresh Intelligence
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button className="flex-1 p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-all flex justify-center">
                <Linkedin size={20} />
              </button>
              <button className="flex-1 p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all flex justify-center">
                <Mail size={20} />
              </button>
              <button className="flex-1 p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all flex justify-center">
                <Phone size={20} />
              </button>
            </div>
            
            {lead && (
               <button 
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm"
               >
                <Trash2 size={16} /> Remove Lead
               </button>
            )}
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">{lead ? 'Edit Details' : 'Create New Lead'}</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Company</label>
                <input 
                  type="text" 
                  value={formData.company}
                  onChange={e => setFormData({...formData, company: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Estimated Value ($)</label>
                <input 
                  type="number" 
                  value={formData.value}
                  onChange={e => setFormData({...formData, value: Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pipeline Stage</label>
                <select 
                  value={formData.stage}
                  onChange={e => setFormData({...formData, stage: e.target.value as Stage})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium"
                >
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value={Stage.LOST}>Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Lead Source</label>
                <select 
                  value={formData.source}
                  onChange={e => setFormData({...formData, source: e.target.value as any})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium"
                >
                  <option value="Manual">Manual Entry</option>
                  <option value="Dux-Soup">Dux-Soup LinkedIn</option>
                  <option value="Referral">Referral</option>
                  <option value="Inbound">Inbound Contact</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Internal Notes & Context</label>
            <textarea 
              rows={4}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Record conversation history, specific needs, or objections..."
            ></textarea>
          </div>

          <div className="mt-10 flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all transform active:scale-[0.98]"
            >
              {lead ? 'Update Profile' : 'Save New Lead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadModal;
