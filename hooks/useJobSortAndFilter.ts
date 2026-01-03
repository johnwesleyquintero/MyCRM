import { useMemo } from 'react';
import { JobApplication, JobStatus } from '../types';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: keyof JobApplication | 'nextActionDate';
  direction: SortDirection;
}

export const useJobSortAndFilter = (
  jobs: JobApplication[],
  searchQuery: string,
  statusFilter: JobStatus | 'ALL',
  sortConfig: SortConfig
) => {
  return useMemo(() => {
    // 1. Filter
    const filtered = jobs.filter((job) => {
      const matchesSearch =
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // 2. Sort
    if (!sortConfig.direction) return filtered;

    return [...filtered].sort((a, b) => {
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
  }, [jobs, searchQuery, statusFilter, sortConfig]);
};
