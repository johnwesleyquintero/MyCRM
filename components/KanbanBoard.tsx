import React from 'react';
import { useJobStore } from '../store/JobContext';
import { JobStatus, JobApplication } from '../types';
import { StatusBadge } from './StatusBadge';
import { MoreHorizontal, Plus } from 'lucide-react';

interface KanbanBoardProps {
  onEdit: (job: JobApplication) => void;
}

const COLUMNS = [
  { id: JobStatus.APPLIED, label: 'Applied' },
  { id: JobStatus.INTERVIEW, label: 'Interviewing' },
  { id: JobStatus.OFFER, label: 'Offers' },
  { id: JobStatus.REJECTED, label: 'Rejected' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onEdit }) => {
  const { jobs, updateJob } = useJobStore();

  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    e.dataTransfer.setData('jobId', jobId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: JobStatus) => {
    const jobId = e.dataTransfer.getData('jobId');
    if (jobId) {
      updateJob(jobId, { status });
    }
  };

  return (
    <div className="flex h-full overflow-x-auto space-x-4 pb-4">
      {COLUMNS.map((col) => {
        const colJobs = jobs.filter((j) => j.status === col.id);
        
        return (
          <div
            key={col.id}
            className="flex-shrink-0 w-80 bg-slate-50 rounded-lg border border-slate-200 flex flex-col max-h-[calc(100vh-12rem)]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column Header */}
            <div className="p-3 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-slate-50 rounded-t-lg z-10">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-700 text-sm">{col.label}</span>
                <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                  {colJobs.length}
                </span>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <Plus size={16} />
              </button>
            </div>

            {/* Cards Area */}
            <div className="p-2 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
              {colJobs.map((job) => (
                <div
                  key={job.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, job.id)}
                  onClick={() => onEdit(job)}
                  className="bg-white p-3 rounded shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-semibold text-slate-900 leading-tight">{job.company}</h3>
                    <button className="text-slate-300 group-hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mb-2 truncate">{job.role}</p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-slate-400">{job.dateApplied}</span>
                    {job.nextAction && (
                       <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 truncate max-w-[120px]">
                         Next: {job.nextAction}
                       </span>
                    )}
                  </div>
                </div>
              ))}
              {colJobs.length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-200 rounded flex items-center justify-center text-slate-300 text-xs">
                  Drop Here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
