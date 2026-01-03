import React, { useState, useEffect } from 'react';
import { JobApplication, JobStatus, CustomFieldDefinition } from '../types';
import { X, Save, ExternalLink, Eye, PenTool, Sparkles, Loader2, FileText, Cpu, CheckCircle, AlertTriangle, Copy, ClipboardCheck } from 'lucide-react';
import { useJobStore } from '../store/JobContext';
import { SimpleMarkdown } from '../utils/markdown';
import { geminiService } from '../services/geminiService';
import { useToast } from '../store/ToastContext';

interface JobDetailModalProps {
  job: JobApplication | null;
  isOpen: boolean;
  onClose: () => void;
}

interface FitAnalysisResult {
  matches: string[];
  missing: string[];
  talkingPoints: string[];
  score: number;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, isOpen, onClose }) => {
  const { updateJob, addJob } = useJobStore();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<Partial<JobApplication>>({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'details' | 'architect'>('details');
  const [architectTab, setArchitectTab] = useState<'cover' | 'fit'>('cover');

  // Job Architect State
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
  const [fitAnalysis, setFitAnalysis] = useState<FitAnalysisResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  // Smart Fill State
  const [showSmartFillInput, setShowSmartFillInput] = useState(false);

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
    setActiveTab('details'); // Reset to details on open
    setGeneratedCoverLetter('');
    setFitAnalysis(null);
    setJobDescription('');
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
    if (!jobDescription.trim()) return;
    setIsGenerating(true);
    try {
      const result = await geminiService.parseJobDescription(jobDescription);
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
      // Auto-switch to details if we were in smart fill mode overlay
    } catch (error) {
      console.error(error);
      showToast('Smart Fill failed. Check API Key.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!jobDescription.trim()) {
      showToast('Please provide a Job Description first.', 'info');
      return;
    }
    setIsGenerating(true);
    try {
      const letter = await geminiService.generateCoverLetter(
        formData.company || 'the company', 
        formData.role || 'the role', 
        jobDescription
      );
      setGeneratedCoverLetter(letter);
    } catch (e) {
      showToast('Failed to generate cover letter.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFitAnalysis = async () => {
    if (!jobDescription.trim()) {
      showToast('Please provide a Job Description first.', 'info');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await geminiService.generateFitGapAnalysis(jobDescription);
      setFitAnalysis(result);
    } catch (e) {
      showToast('Failed to analyze fit.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    showToast('Copied to clipboard', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">
              {job ? 'Edit Application' : 'New Application'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-white flex flex-shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`mr-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'details' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={16} /> Details
          </button>
          <button
            onClick={() => setActiveTab('architect')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'architect' 
                ? 'border-purple-600 text-purple-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Cpu size={16} /> Job Architect (AI)
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
          {activeTab === 'details' ? (
            <div className="p-6 space-y-6">
              {!job && !showSmartFillInput && (
                <div className="flex justify-end mb-2">
                  <button 
                    onClick={() => { setShowSmartFillInput(true); setJobDescription(''); }}
                    className="flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors font-medium"
                  >
                    <Sparkles size={14} />
                    <span>Auto-Fill from JD</span>
                  </button>
                </div>
              )}

              {/* Smart Fill Overlay Section */}
              {showSmartFillInput && (
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-indigo-800 uppercase tracking-wide">Paste Job Description</label>
                    <button onClick={() => setShowSmartFillInput(false)} className="text-indigo-400 hover:text-indigo-600"><X size={14}/></button>
                  </div>
                  <textarea
                    className="w-full p-3 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-2 h-32"
                    placeholder="Paste the full job description text here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={handleSmartFill}
                      disabled={isGenerating || !jobDescription}
                      className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      <span>Extract Details</span>
                    </button>
                  </div>
                </div>
              )}

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

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                 <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between bg-slate-50">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
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
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
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
          ) : (
            // Architect Tab
            <div className="flex flex-col h-full">
              <div className="flex border-b border-slate-200 bg-white">
                 <button 
                  onClick={() => setArchitectTab('cover')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide text-center transition-colors ${architectTab === 'cover' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   Cover Letter
                 </button>
                 <button 
                  onClick={() => setArchitectTab('fit')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide text-center transition-colors ${architectTab === 'fit' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   Fit Gap Analysis
                 </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                 {/* Shared Input: Job Description */}
                 <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Job Description Context</label>
                    <textarea 
                       className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[100px]"
                       placeholder="Paste the full JD here to power the tools..."
                       value={jobDescription}
                       onChange={(e) => setJobDescription(e.target.value)}
                    />
                 </div>

                 {architectTab === 'cover' && (
                    <div className="space-y-4 animate-in fade-in">
                       <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold text-slate-800">Generated Draft</h3>
                          <button 
                             onClick={handleGenerateCoverLetter}
                             disabled={isGenerating || !jobDescription}
                             className="bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                          >
                             {isGenerating ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                             <span>Generate Letter</span>
                          </button>
                       </div>
                       
                       {generatedCoverLetter ? (
                         <div className="relative">
                            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm min-h-[300px] text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-serif">
                                <SimpleMarkdown content={generatedCoverLetter} />
                            </div>
                            <button 
                               onClick={() => copyToClipboard(generatedCoverLetter)}
                               className="absolute top-2 right-2 p-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                            >
                               {isCopied ? <ClipboardCheck size={16}/> : <Copy size={16}/>}
                            </button>
                         </div>
                       ) : (
                         <div className="border-2 border-dashed border-slate-200 rounded-lg h-48 flex flex-col items-center justify-center text-slate-400">
                            <FileText size={32} className="mb-2 opacity-20"/>
                            <p className="text-sm">Paste JD above and click generate.</p>
                         </div>
                       )}
                    </div>
                 )}

                 {architectTab === 'fit' && (
                    <div className="space-y-4 animate-in fade-in">
                       <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold text-slate-800">Fit Analysis</h3>
                          <button 
                             onClick={handleGenerateFitAnalysis}
                             disabled={isGenerating || !jobDescription}
                             className="bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                          >
                             {isGenerating ? <Loader2 size={14} className="animate-spin"/> : <Cpu size={14}/>}
                             <span>Analyze Fit</span>
                          </button>
                       </div>

                       {fitAnalysis ? (
                          <div className="space-y-6">
                             {/* Score */}
                             <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-4 ${fitAnalysis.score >= 80 ? 'border-emerald-500 text-emerald-600' : fitAnalysis.score >= 50 ? 'border-amber-500 text-amber-600' : 'border-rose-500 text-rose-600'}`}>
                                   {fitAnalysis.score}%
                                </div>
                                <div>
                                   <h4 className="font-bold text-slate-800">Match Score</h4>
                                   <p className="text-xs text-slate-500">Based on keyword overlap and core competencies.</p>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Matches */}
                                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                                   <h4 className="flex items-center gap-2 font-bold text-emerald-800 mb-3 text-sm">
                                      <CheckCircle size={16}/> Strong Matches
                                   </h4>
                                   <ul className="space-y-2">
                                      {fitAnalysis.matches.map((m, i) => (
                                         <li key={i} className="text-xs text-emerald-700 flex items-start gap-2">
                                            <span className="mt-1">•</span> {m}
                                         </li>
                                      ))}
                                   </ul>
                                </div>

                                {/* Gaps */}
                                <div className="bg-rose-50 rounded-lg p-4 border border-rose-100">
                                   <h4 className="flex items-center gap-2 font-bold text-rose-800 mb-3 text-sm">
                                      <AlertTriangle size={16}/> Missing / Gaps
                                   </h4>
                                   <ul className="space-y-2">
                                      {fitAnalysis.missing.map((m, i) => (
                                         <li key={i} className="text-xs text-rose-700 flex items-start gap-2">
                                            <span className="mt-1">•</span> {m}
                                         </li>
                                      ))}
                                   </ul>
                                </div>
                             </div>

                             {/* Talking Points */}
                             <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-slate-800 mb-3 text-sm">Suggested Interview Talking Points</h4>
                                <ul className="space-y-2">
                                   {fitAnalysis.talkingPoints.map((tp, i) => (
                                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                         <span className="text-indigo-500 mt-1">→</span> {tp}
                                      </li>
                                   ))}
                                </ul>
                             </div>
                          </div>
                       ) : (
                          <div className="border-2 border-dashed border-slate-200 rounded-lg h-48 flex flex-col items-center justify-center text-slate-400">
                            <Cpu size={32} className="mb-2 opacity-20"/>
                            <p className="text-sm">Paste JD above and click Analyze.</p>
                         </div>
                       )}
                    </div>
                 )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'details' && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3 flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
              <Save size={16} />
              <span>Save Application</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};