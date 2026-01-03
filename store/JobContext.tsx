import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { JobApplication, JobStatus } from '../types';
import { MOCK_JOBS } from '../constants';

interface JobContextType {
  jobs: JobApplication[];
  addJob: (job: Omit<JobApplication, 'id' | 'lastUpdated'>) => void;
  updateJob: (id: string, updates: Partial<JobApplication>) => void;
  deleteJob: (id: string) => void;
  getJobStats: () => { total: number; interview: number; offer: number; rejected: number; active: number };
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<JobApplication[]>(() => {
    const saved = localStorage.getItem('mycrm-jobs');
    return saved ? JSON.parse(saved) : MOCK_JOBS;
  });

  useEffect(() => {
    localStorage.setItem('mycrm-jobs', JSON.stringify(jobs));
  }, [jobs]);

  const addJob = useCallback((job: Omit<JobApplication, 'id' | 'lastUpdated'>) => {
    const newJob: JobApplication = {
      ...job,
      id: crypto.randomUUID(),
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setJobs((prev) => [newJob, ...prev]);
  }, []);

  const updateJob = useCallback((id: string, updates: Partial<JobApplication>) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : job
      )
    );
  }, []);

  const deleteJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id));
  }, []);

  const getJobStats = useCallback(() => {
    const total = jobs.length;
    const interview = jobs.filter((j) => j.status === JobStatus.INTERVIEW).length;
    const offer = jobs.filter((j) => j.status === JobStatus.OFFER).length;
    const rejected = jobs.filter((j) => j.status === JobStatus.REJECTED).length;
    const active = jobs.filter((j) => j.status === JobStatus.APPLIED || j.status === JobStatus.INTERVIEW).length;
    return { total, interview, offer, rejected, active };
  }, [jobs]);

  return (
    <JobContext.Provider value={{ jobs, addJob, updateJob, deleteJob, getJobStats }}>
      {children}
    </JobContext.Provider>
  );
};

export const useJobStore = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobStore must be used within a JobProvider');
  }
  return context;
};
