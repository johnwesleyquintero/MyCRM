
import React from 'react';
import { JobStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { ChevronDown } from 'lucide-react';

interface StatusSelectProps {
  status: JobStatus;
  onChange: (newStatus: JobStatus) => void;
  compact?: boolean;
}

export const StatusSelect: React.FC<StatusSelectProps> = ({ status, onChange, compact = false }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation(); // Prevent row click
    onChange(e.target.value as JobStatus);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
  };

  return (
    <div className="relative inline-block group" onClick={handleClick}>
      <div className="flex items-center gap-1 cursor-pointer">
        <StatusBadge status={status} />
        {!compact && (
          <ChevronDown 
            size={12} 
            className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity -ml-1" 
          />
        )}
      </div>
      
      {/* 
        Zero-dependency "Invisible Overlay" technique.
        Ensures native mobile dropdowns work perfectly and avoids 
        z-index/clipping issues common with custom dropdowns in scrollable tables.
      */}
      <select
        value={status}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none z-10"
        title="Change Status"
      >
        {Object.values(JobStatus).map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
};
