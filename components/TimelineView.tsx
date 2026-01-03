import React from 'react';
import { useJobStore } from '../store/JobContext';
import { Calendar, Clock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { JobStatus } from '../types';

export const TimelineView: React.FC<{ onEdit: (job: any) => void }> = ({ onEdit }) => {
  const { jobs } = useJobStore();
  
  const today = new Date().toISOString().split('T')[0];

  // 1. Upcoming Actions (Future or Today)
  const upcoming = jobs
    .filter(j => j.nextAction && j.nextActionDate && j.nextActionDate >= today && j.status !== JobStatus.ARCHIVED && j.status !== JobStatus.REJECTED)
    .sort((a, b) => (a.nextActionDate || '').localeCompare(b.nextActionDate || ''));

  // 2. Recent History (Sorted by last updated)
  const history = [...jobs]
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  const isOverdue = (dateStr?: string) => {
    return dateStr && dateStr < today;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
      {/* LEFT COLUMN: UPCOMING AGENDA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-indigo-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={18} className="text-indigo-600" />
            <span>Upcoming Agenda</span>
          </h3>
          <span className="text-xs font-medium px-2 py-0.5 bg-white border border-indigo-100 rounded-full text-indigo-600">
            {upcoming.length} Tasks
          </span>
        </div>
        
        <div className="p-4">
          {upcoming.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>No upcoming actions scheduled.</p>
              <p className="text-xs mt-1">Add a "Next Action" to your applications.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((job) => (
                <div 
                  key={job.id} 
                  onClick={() => onEdit(job)}
                  className="group flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                >
                  <div className="flex-shrink-0 w-12 text-center pt-1">
                     <span className={`block text-xs font-bold uppercase ${job.nextActionDate === today ? 'text-red-600' : 'text-slate-500'}`}>
                        {formatDate(job.nextActionDate)}
                     </span>
                     {job.nextActionDate === today && <span className="text-[10px] text-red-500 font-medium">Today</span>}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">{job.company}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                        {job.status}
                      </span>
                    </div>
                    <p className="text-sm text-indigo-600 font-medium mt-0.5 flex items-center gap-1">
                      <ArrowRight size={12} /> {job.nextAction}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-1">{job.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIVITY LOG */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Clock size={18} className="text-slate-500" />
            <span>Recent Activity</span>
          </h3>
        </div>

        <div className="relative p-6">
          {/* Vertical Line */}
          <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-slate-200"></div>

          <div className="space-y-6">
            {history.slice(0, 10).map((job) => (
              <div key={job.id} className="relative pl-8 flex flex-col gap-1 cursor-pointer group" onClick={() => onEdit(job)}>
                {/* Dot */}
                <div className={`absolute left-[7px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 
                  ${job.status === JobStatus.OFFER ? 'bg-emerald-500' : 
                    job.status === JobStatus.REJECTED ? 'bg-slate-400' : 'bg-blue-500'}`} 
                />
                
                <div className="flex justify-between items-start">
                   <span className="text-xs text-slate-400 font-mono">{formatDate(job.lastUpdated)}</span>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-slate-200 group-hover:border-indigo-200 group-hover:shadow-sm transition-all">
                  <div className="flex justify-between items-center mb-1">
                     <span className="font-semibold text-slate-800 text-sm">{job.company}</span>
                     <span className={`text-[10px] px-1.5 rounded-full 
                        ${job.status === JobStatus.OFFER ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {job.status}
                     </span>
                  </div>
                  <p className="text-xs text-slate-600">{job.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};