import React, { useState, useEffect } from 'react';
import { JobApplication, JobStatus, CustomFieldDefinition } from '../types';
import { X, Save, Trash, ExternalLink, Eye, PenTool, Sparkles, Loader2 } from 'lucide-react';
import { useJobStore } from '../store/JobContext';
import { SimpleMarkdown } from '../utils/markdown';
import { geminiService } from '../services/geminiService';
import { useToast } from '../store/ToastContext';

interface JobDetailModalProps {
  job: JobApplication | null;
  isOpen: boolean;
  onClose: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, isOpen, onClose }) => {
  const { updateJob, addJob } = useJobStore();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<Partial<JobApplication>>({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);
  
  // Smart Fill State
  const [isSmartFilling, setIsSmartFilling] = useState(false);
  const [showSmartFillInput, setShowSmartFillInput] = useState(false);
  const [smartFillText, setSmartFillText] = useState('');

  useEffect(() => {
    // Load custom field definitions
    const savedFields = localStorage.getItem('mycrm-custom-fields');
    if (savedFields) {
      try {
        setCustomFieldDefs(JSON.parse(savedFields));
      } catch (e) {
        setCustomFieldDefs([]);
      }
    }

    if (job) {
      setFormData(job);
      setShowSmartFillInput(false);
    } else {
      setFormData({
        status: JobStatus.APPLIED,
        dateApplied: new Date().toISOString().split('T')[0],
        customFields: {}
      });
      // Suggest smart fill for new jobs
      setShowSmartFillInput(false); 
    }
    setIsPreviewMode(!!job);
  }, [job, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomFieldChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...(prev.customFields || {}),
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    if (job) {
      updateJob(job.id, formData);
    } else {
      if (formData.company && formData.role) {
        addJob(formData as any);
      }
    }
    onClose();
  };

  const handleSmartFill = async () => {
    if (!smartFillText.trim()) return;
    setIsSmartFilling(true);
    try {
      const result = await geminiService.parseJobDescription(smartFillText);
      setFormData(prev => ({
        ...prev,
        company: result.company || prev.company,
        role: result.role || prev.role,
        location: result.location || prev.location,
        salary: result.salary || prev.salary,
        notes: (prev.notes || '') + (result.summary ? `### AI Summary\n${result.summary}\n\n**Skills:** ${result.skills}` : '')
      }));
      showToast('Smart Fill applied successfully!', 'success');
      setShowSmartFillInput(false);
    } catch (error) {
      console.error(error);
      showToast('Smart Fill failed. Check API Key.', 'error');
    } finally {
      setIsSmartFilling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">
              {job ? 'Edit Application' : 'New Application'}
            </h2>
            {!job && !showSmartFillInput && (
              <button 
                onClick={() => setShowSmartFillInput(true)}
                className="ml-2 flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full hover:bg-indigo-200 transition-colors"
              >
                <Sparkles size={12} />
                <span>Smart Fill</span>
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Smart Fill Overlay Section */}
        {showSmartFillInput && (
          <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 animate-in fade-in slide-in-from-top-2">
            <label className="block text-xs font-bold text-indigo-800 uppercase tracking-wide mb-2 flex justify-between">
              <span>Paste Job Description</span>
              <button onClick={() => setShowSmartFillInput(false)} className="text-indigo-400 hover:text-indigo-600"><X size={14}/></button>
            </label>
            <textarea
              className="w-full p-3 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-2"
              rows={3}
              placeholder="Paste the full job description text here..."
              value={smartFillText}
              onChange={(e) => setSmartFillText(e.target.value)}
            />
            <div className="flex justify-end">
              <button 
                onClick={handleSmartFill}
                disabled={isSmartFilling || !smartFillText}
                className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSmartFilling ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>Auto-Fill Details</span>
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
               <input 
                  name="company" 
                  value={formData.company || ''} 
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                  placeholder="e.g. Acme Corp"
               />
            </div>
            <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
               <input 
                  name="role" 
                  value={formData.role || ''} 
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                  placeholder="e.g. Senior Product Designer"
               />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
               <select 
                  name="status" 
                  value={formData.status || JobStatus.APPLIED} 
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
               >
                 {Object.values(JobStatus).map(s => <option key={s} value={s}>{s}</option>)}
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Date Applied</label>
               <input 
                  type="date"
                  name="dateApplied" 
                  value={formData.dateApplied || ''} 
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Job Link</label>
               <div className="flex">
                 <input 
                    name="link" 
                    value={formData.link || ''} 
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-l-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                    placeholder="https://..."
                 />
                 {formData.link && (
                    <a href={formData.link} target="_blank" rel="noreferrer" className="bg-slate-100 border border-l-0 border-slate-300 px-3 flex items-center justify-center rounded-r-lg hover:bg-slate-200">
                       <ExternalLink size={14} className="text-slate-600"/>
                    </a>
                 )}
               </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
             <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between bg-slate-100/50">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes & Intel</label>
                 <button 
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="flex items-center space-x-1 text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                 >
                    {isPreviewMode ? <><PenTool size={12}/> <span>Edit</span></> : <><Eye size={12}/> <span>Preview</span></>}
                 </button>
             </div>
             
             {isPreviewMode ? (
                 <div className="p-3 min-h-[150px] bg-white text-sm text-slate-700 overflow-y-auto max-h-60">
                     {formData.notes ? (
                         <SimpleMarkdown content={formData.notes} />
                     ) : (
                         <span className="text-slate-400 italic">No notes added yet. Switch to edit mode to add intel.</span>
                     )}
                 </div>
             ) : (
                 <textarea 
                    name="notes"
                    value={formData.notes || ''} 
                    onChange={handleChange}
                    rows={6}
                    className="w-full p-3 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 bg-white block"
                    placeholder="- Use markdown for rich notes..."
                 />
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
             <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Next Action</label>
                <input 
                    name="nextAction" 
                    value={formData.nextAction || ''} 
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" 
                    placeholder="e.g. Follow up email"
                 />
             </div>
             <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Due Date</label>
                <input 
                    type="date"
                    name="nextActionDate" 
                    value={formData.nextActionDate || ''} 
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" 
                 />
             </div>
          </div>
          
          {/* Custom Fields Section */}
          {(customFieldDefs.length > 0 || formData.salary || formData.location) && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
               <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Additional Details</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                    <input 
                       name="location"
                       value={formData.location || ''}
                       onChange={handleChange}
                       className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Salary Expectation</label>
                    <input 
                       name="salary"
                       value={formData.salary || ''}
                       onChange={handleChange}
                       className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                       placeholder="e.g. $120k - $150k"
                    />
                 </div>
                 {customFieldDefs.map((field) => (
                   <div key={field.id}>
                     <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                     <div className="relative">
                       <input 
                          type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                          value={formData.customFields?.[field.id] || ''} 
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder={field.type === 'url' ? 'https://...' : ''}
                       />
                       {field.type === 'url' && formData.customFields?.[field.id] && (
                          <a 
                            href={formData.customFields[field.id]} 
                            target="_blank" 
                            rel="noreferrer"
                            className="absolute right-2 top-2 text-slate-400 hover:text-indigo-600"
                          >
                            <ExternalLink size={14} />
                          </a>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
            <Save size={16} />
            <span>Save Application</span>
          </button>
        </div>
      </div>
    </div>
  );
};