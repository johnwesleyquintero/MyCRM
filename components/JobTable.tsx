import React, { useState } from 'react';
import { useJobStore } from '../store/JobContext';
import { StatusBadge } from './StatusBadge';
import { ExternalLink, Edit2, Trash2, Search, Calendar, ChevronRight } from 'lucide-react';
import { JobApplication } from '../types';

interface JobTableProps {
  onEdit: (job: JobApplication) => void;
}

export const JobTable: React.FC<JobTableProps> = ({ onEdit }) => {
  const { jobs, deleteJob } = useJobStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = jobs.filter((job) => 
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex justify-between items-center">
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Mobile Card View (Visible on small screens) */}
      <div className="md:hidden space-y-3">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-slate-900">{job.company}</h3>
                <p className="text-sm text-slate-600">{job.role}</p>
              </div>
              <StatusBadge status={job.status} />
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-slate-500">
               <div className="flex items-center space-x-1">
                 <Calendar size={12} />
                 <span>{job.dateApplied}</span>
               </div>
               {job.nextAction && (
                 <div className="text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded">
                   Next: {job.nextAction}
                 </div>
               )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
               {job.link ? (
                 <a href={job.link} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 flex items-center space-x-1 text-xs">
                    <ExternalLink size={12} /> <span>Job Desc</span>
                 </a>
               ) : <span />}
               
               <div className="flex space-x-3">
                  <button onClick={() => deleteJob(job.id)} className="p-1 text-slate-400 hover:text-rose-600 bg-slate-50 rounded">
                      <Trash2 size={16} />
                  </button>
                  <button onClick={() => onEdit(job)} className="px-3 py-1 bg-slate-900 text-white text-xs rounded font-medium flex items-center space-x-1">
                      <span>Details</span>
                      <ChevronRight size={12} />
                  </button>
               </div>
            </div>
          </div>
        ))}
         {filteredJobs.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
               No applications found.
            </div>
         )}
      </div>

      {/* Desktop Table View (Hidden on small screens) */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow border border-slate-200">
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
            {filteredJobs.map((job) => (
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
            
            {/* Empty State: No Jobs at all */}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                  No active applications. Use Neural Link to add one!
                </td>
              </tr>
            )}

            {/* Empty State: No Matches found */}
            {jobs.length > 0 && filteredJobs.length === 0 && (
               <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search size={24} className="text-slate-300" />
                    <p>No applications match "{searchQuery}"</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};