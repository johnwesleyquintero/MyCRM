import React from 'react';
import { JobStatus } from '../types';

const statusColors: Record<JobStatus, string> = {
  [JobStatus.APPLIED]: 'bg-blue-100 text-blue-700 border-blue-200',
  [JobStatus.INTERVIEW]: 'bg-amber-100 text-amber-700 border-amber-200',
  [JobStatus.OFFER]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [JobStatus.REJECTED]: 'bg-slate-100 text-slate-500 border-slate-200',
  [JobStatus.ARCHIVED]: 'bg-gray-100 text-gray-500 border-gray-200',
};

export const StatusBadge: React.FC<{ status: JobStatus }> = ({ status }) => {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[status] || statusColors[JobStatus.APPLIED]}`}>
      {status}
    </span>
  );
};
