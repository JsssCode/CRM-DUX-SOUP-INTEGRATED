
import React, { useState } from 'react';
import { useApp } from '../App';
import { Stage } from '../types';
import { 
  Zap, 
  Linkedin, 
  FileJson, 
  Download, 
  Upload,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const DuxSoupImport: React.FC = () => {
  const { addLead, addNotification } = useApp();
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleManualImport = () => {
    if (!importText.trim()) return;
    setIsProcessing(true);
    
    // Simulating parser for Dux-Soup CSV/JSON format
    setTimeout(() => {
      try {
        // Mocking an import logic
        const mockLead = {
          name: importText.split('\n')[0].substring(0, 30) || 'Imported Lead',
          company: 'LinkedIn Prospect',
          email: 'unknown@linkedin.com',
          value: Math.floor(Math.random() * 10000) + 1000,
          stage: Stage.LEAD,
          source: 'Dux-Soup',
          notes: 'Imported via Dux-Soup Hub manual paste.'
        };
        
        addLead(mockLead as any);
        setImportText('');
        setSuccess(true);
        addNotification('Dux-Soup Sync', 'New lead synced from LinkedIn automation.', 'success');
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        alert('Failed to parse data. Please check format.');
      } finally {
        setIsProcessing(false);
      }
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <div className="bg-yellow-400 p-3 rounded-2xl shadow-lg shadow-yellow-100">
          <Zap size={32} className="text-white fill-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dux-Soup Automation Hub</h2>
          <p className="text-slate-500">Sync your LinkedIn prospecting activity directly into your pipeline</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Upload size={18} className="text-blue-600" /> Webhook Integration
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Use this endpoint in your Dux-Soup Remote Control settings to automatically push new leads.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-300 flex items-center justify-between">
              <code className="text-[10px] text-slate-600 font-mono">https://nexus-crm-api.local/webhook/dux-soup</code>
              <button className="text-[10px] font-bold text-blue-600 hover:underline">Copy Link</button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-2">Automated Actions</h3>
            <ul className="space-y-3">
              {[
                'Auto-tag LinkedIn visits as "Qualified"',
                'Assign new messages to Sales Reps',
                'Generate AI summary for connection requests'
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3 text-xs text-slate-600">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileJson size={18} className="text-indigo-600" /> Manual Data Paste
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Paste raw JSON or CSV data from your Dux-Soup exports to quickly seed your database.
          </p>
          <textarea 
            className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono mb-4 min-h-[200px]"
            placeholder="Paste your Dux-Soup export here..."
            value={importText}
            onChange={e => setImportText(e.target.value)}
          ></textarea>
          <button 
            onClick={handleManualImport}
            disabled={isProcessing}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              success 
                ? 'bg-green-500 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100'
            }`}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : success ? (
              <><CheckCircle2 size={20} /> Imported Successfully!</>
            ) : (
              <><Download size={20} /> Process Import</>
            )}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4">
        <AlertTriangle className="text-blue-600 shrink-0" size={24} />
        <div>
          <h4 className="font-bold text-blue-900 text-sm">Integration Note</h4>
          <p className="text-xs text-blue-700 leading-relaxed mt-1">
            Nexus CRM is designed to handle Dux-Soup payloads efficiently. For optimal performance, ensure your Dux-Soup settings include the "Full Profile" data capture to enable Gemini AI deeper analysis of prospects.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DuxSoupImport;
