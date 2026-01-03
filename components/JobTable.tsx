import React from 'react';
import { useJobStore } from '../store/JobContext';
import { StatusBadge } from './StatusBadge';
import { ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { JobApplication } from '../types';

interface JobTableProps {
  onEdit: (job: JobApplication) => void;
}

export const JobTable: React.FC<JobTableProps> = ({ onEdit }) => {
  const { jobs, deleteJob } = useJobStore();

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Applied</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Next Action</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-slate-900">{job.company}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-slate-600">{job.role}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={job.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {job.dateApplied}
              </td>
               <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {job.nextAction ? (
                   <span className="flex flex-col">
                     <span>{job.nextAction}</span>
                     <span className="text-xs text-slate-400">{job.nextActionDate}</span>
                   </span>
                ) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-3">
                  {job.link && (
                    <a href={job.link} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600">
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <button onClick={() => onEdit(job)} className="text-slate-400 hover:text-blue-600">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteJob(job.id)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {jobs.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                No active applications. Use Neural Link to add one!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
