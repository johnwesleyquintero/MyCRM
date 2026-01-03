import React, { useState, useEffect } from 'react';
import { JobApplication, JobStatus } from '../types';
import { X, Save, Trash, ExternalLink, Eye, PenTool } from 'lucide-react';
import { useJobStore } from '../store/JobContext';
import { SimpleMarkdown } from '../utils/markdown';

interface JobDetailModalProps {
  job: JobApplication | null;
  isOpen: boolean;
  onClose: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, isOpen, onClose }) => {
  const { updateJob, addJob } = useJobStore();
  const [formData, setFormData] = useState<Partial<JobApplication>>({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    if (job) {
      setFormData(job);
    } else {
      setFormData({
        status: JobStatus.APPLIED,
        dateApplied: new Date().toISOString().split('T')[0],
      });
    }
    // Default to preview mode if viewing an existing job, edit mode if creating new
    setIsPreviewMode(!!job);
  }, [job, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (job) {
      updateJob(job.id, formData);
    } else {
      // Basic validation
      if (formData.company && formData.role) {
        addJob(formData as any);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {job ? 'Edit Application' : 'New Application'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          <div className="grid grid-cols-2 gap-6">
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

          <div className="grid grid-cols-3 gap-6">
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

          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
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