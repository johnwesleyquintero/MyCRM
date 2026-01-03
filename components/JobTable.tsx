
import React, { useState, useMemo, useEffect } from 'react';
import { useJobStore } from '../store/JobContext';
import { StatusBadge } from './StatusBadge';
import { StatusSelect } from './StatusSelect';
import { ExternalLink, Edit2, Trash2, Search, Calendar, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, AlertCircle } from 'lucide-react';
import { JobApplication, JobStatus, CustomFieldDefinition } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface JobTableProps {
  onEdit: (job: JobApplication) => void;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  key: keyof JobApplication | 'nextActionDate';
  direction: SortDirection;
}

export const JobTable: React.FC<JobTableProps> = ({ onEdit }) => {
  const { jobs, deleteJob, updateJob } = useJobStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'lastUpdated', direction: null });
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [jobToDelete, setJobToDelete] = useState<JobApplication | null>(null);

  // Load Custom Fields Definitions
  useEffect(() => {
    const saved = localStorage.getItem('mycrm-custom-fields');
    if (saved) {
      try {
        setCustomFields(JSON.parse(saved));
      } catch(e) {
        console.error("Failed to load custom fields", e);
      }
    }
  }, []);

  // Helper to check if job is stale (> 14 days since update)
  const isStale = (dateString: string, status: JobStatus) => {
     if (status === JobStatus.REJECTED || status === JobStatus.ARCHIVED || status === JobStatus.OFFER) return false;
     const lastUpdate = new Date(dateString);
     const diffTime = Math.abs(new Date().getTime() - lastUpdate.getTime());
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
     return diffDays > 14;
  };

  // 1. Filter Logic
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch = 
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, statusFilter]);

  // 2. Sort Logic
  const sortedJobs = useMemo(() => {
    if (!sortConfig.direction) return filteredJobs;

    return [...filteredJobs].sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredJobs, sortConfig]);

  // Handler for column header clicks
  const handleSort = (key: keyof JobApplication) => {
    let direction: SortDirection = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }

    setSortConfig({ key, direction });
  };

  const handleStatusChange = (jobId: string, newStatus: JobStatus) => {
    updateJob(jobId, { status: newStatus });
  };

  // Helper to render sort icon
  const getSortIcon = (key: keyof JobApplication) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="text-slate-300 opacity-0 group-hover:opacity-50 transition-opacity" />;
    if (sortConfig.direction === 'asc') return <ArrowUp size={14} className="text-indigo-600" />;
    if (sortConfig.direction === 'desc') return <ArrowDown size={14} className="text-indigo-600" />;
    return <ArrowUpDown size={14} className="text-slate-300" />;
  };

  // Helper to render clickable header
  const SortableHeader = ({ label, field, className = "" }: { label: string, field: keyof JobApplication, className?: string }) => (
    <th 
      className={`px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100 transition-colors select-none ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {getSortIcon(field)}
      </div>
    </th>
  );

  const handleDeleteClick = (job: JobApplication, e: React.MouseEvent) => {
    e.stopPropagation();
    setJobToDelete(job);
  };

  const confirmDelete = () => {
    if (jobToDelete) {
      deleteJob(jobToDelete.id);
      setJobToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <ConfirmModal 
        isOpen={!!jobToDelete}
        onClose={() => setJobToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Application"
        message={`Are you sure you want to permanently delete the application for ${jobToDelete?.company}? This action cannot be undone.`}
      />

      {/* Controls: Search & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Search */}
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

        {/* Filter Dropdown */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative w-full md:w-48">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={14} className="text-slate-500" />
             </div>
             <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'ALL')}
                className="pl-9 pr-8 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-sm appearance-none cursor-pointer text-slate-700 font-medium"
             >
                <option value="ALL">All Statuses</option>
                {Object.values(JobStatus).map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
             </select>
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ArrowDown size={12} className="text-slate-400" />
             </div>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {sortedJobs.map((job) => (
          <div key={job.id} onClick={() => onEdit(job)} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col space-y-3 active:scale-[0.99] transition-transform">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-slate-900">{job.company}</h3>
                <p className="text-sm text-slate-600">{job.role}</p>
              </div>
              <StatusSelect 
                status={job.status} 
                onChange={(s) => handleStatusChange(job.id, s)} 
                compact
              />
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

            {customFields.length > 0 && (
              <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-2">
                 {customFields.map(field => {
                    const val = job.customFields?.[field.id];
                    if (!val) return null;
                    return (
                       <div key={field.id} className="text-xs">
                          <span className="text-slate-400 mr-1">{field.label}:</span>
                          <span className="text-slate-700 font-medium">
                            {field.type === 'url' ? (
                               <a href={val} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-blue-500 hover:underline">Link</a>
                            ) : val}
                          </span>
                       </div>
                    );
                 })}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
               {job.link ? (
                 <a href={job.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-slate-400 hover:text-blue-600 flex items-center space-x-1 text-xs">
                    <ExternalLink size={12} /> <span>Job Desc</span>
                 </a>
               ) : <span />}
               
               <div className="flex space-x-3">
                  <button onClick={(e) => handleDeleteClick(job, e)} className="p-1 text-slate-400 hover:text-rose-600 bg-slate-50 rounded transition-colors">
                      <Trash2 size={16} />
                  </button>
                  <button className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded font-medium flex items-center space-x-1 hover:bg-slate-200 transition-colors">
                      <span>Details</span>
                      <ChevronRight size={12} />
                  </button>
               </div>
            </div>
          </div>
        ))}
         {sortedJobs.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
               No applications found.
            </div>
         )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-visible bg-white rounded-lg shadow border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <SortableHeader label="Company" field="company" />
              <SortableHeader label="Role" field="role" />
              <SortableHeader label="Status" field="status" />
              
              {customFields.map((field) => (
                <th key={field.id} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {field.label}
                </th>
              ))}

              <SortableHeader label="Applied" field="dateApplied" />
              <SortableHeader label="Next Action" field="nextActionDate" />
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {sortedJobs.map((job) => {
              const stale = isStale(job.lastUpdated, job.status);
              return (
              <tr key={job.id} onClick={() => onEdit(job)} className="hover:bg-slate-50 transition-colors group cursor-pointer relative">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {stale && (
                        <div className="relative group/tooltip flex items-center justify-center">
                             <AlertCircle size={14} className="text-amber-400" />
                             <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/tooltip:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                Stale: No updates &gt; 14 days
                            </div>
                        </div>
                    )}
                    <div className="text-sm font-medium text-slate-900">{job.company}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-600">{job.role}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* Inline Status Editor */}
                  <StatusSelect 
                    status={job.status} 
                    onChange={(s) => handleStatusChange(job.id, s)} 
                  />
                </td>

                {customFields.map((field) => (
                  <td key={field.id} className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {field.type === 'url' && job.customFields?.[field.id] ? (
                       <a 
                         href={job.customFields[field.id]} 
                         target="_blank" 
                         rel="noreferrer"
                         onClick={e => e.stopPropagation()}
                         className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                       >
                         <ExternalLink size={14} /> <span>Link</span>
                       </a>
                    ) : (
                       <span className="truncate max-w-[150px] block" title={job.customFields?.[field.id] || ''}>
                         {job.customFields?.[field.id] || '-'}
                       </span>
                    )}
                  </td>
                ))}

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
                  <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {job.link && (
                      <a href={job.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-slate-400 hover:text-blue-600 transition-colors">
                        <ExternalLink size={16} />
                      </a>
                    )}
                    <button className="text-slate-400 hover:text-blue-600 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={(e) => handleDeleteClick(job, e)} className="text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
            
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6 + customFields.length} className="px-6 py-12 text-center text-slate-400 text-sm">
                  No active applications. Use Neural Link to add one!
                </td>
              </tr>
            )}

            {jobs.length > 0 && sortedJobs.length === 0 && (
               <tr>
                <td colSpan={6 + customFields.length} className="px-6 py-12 text-center text-slate-400 text-sm">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search size={24} className="text-slate-300" />
                    <p>No applications match current filters.</p>
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
