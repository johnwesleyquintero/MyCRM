import { JobStatus } from '../types';

/**
 * Checks if a job is "stale" (hasn't been updated in more than 14 days).
 * Excludes jobs that are Rejected, Archived, or in Offer stage.
 * 
 * @param dateString The ISO date string of the last update
 * @param status The current status of the job
 * @returns boolean
 */
export const isJobStale = (dateString: string, status: JobStatus): boolean => {
  if (status === JobStatus.REJECTED || status === JobStatus.ARCHIVED || status === JobStatus.OFFER) {
    return false;
  }
  
  if (!dateString) return false;

  const lastUpdate = new Date(dateString);
  const diffTime = Math.abs(new Date().getTime() - lastUpdate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 14;
};
