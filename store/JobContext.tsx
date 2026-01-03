import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { JobApplication, JobStatus } from '../types';
import { MOCK_JOBS } from '../constants';
import { useToast } from './ToastContext';

interface JobContextType {
  jobs: JobApplication[];
  isLoading: boolean;
  addJob: (job: Omit<JobApplication, 'id' | 'lastUpdated'>) => void;
  updateJob: (id: string, updates: Partial<JobApplication>) => void;
  deleteJob: (id: string) => void;
  getJobStats: () => { total: number; interview: number; offer: number; rejected: number; active: number };
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendUrl, setBackendUrl] = useState<string | null>(null);
  const { showToast } = useToast();

  // Initialize: Check for Backend URL and Load Data
  useEffect(() => {
    const url = localStorage.getItem('mycrm-backend-url');
    setBackendUrl(url);

    const loadData = async () => {
      setIsLoading(true);
      if (url) {
        try {
          // Fetch from Google Sheet
          const response = await fetch(url);
          const data = await response.json();
          // Ensure we received an array
          if (Array.isArray(data)) {
            setJobs(data);
            showToast('Sync complete: Data loaded from Cloud', 'success');
          } else {
             console.error("Invalid data format from backend", data);
             setJobs([]);
             showToast('Error loading data: Invalid format', 'error');
          }
        } catch (error) {
          console.error("Failed to fetch from backend:", error);
          // Fallback to local storage if offline or error
          const saved = localStorage.getItem('mycrm-jobs');
          setJobs(saved ? JSON.parse(saved) : []);
          showToast('Offline Mode: Loaded local data', 'info');
        }
      } else {
        // Local Storage Mode
        const saved = localStorage.getItem('mycrm-jobs');
        setJobs(saved ? JSON.parse(saved) : MOCK_JOBS);
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Sync to LocalStorage (Always backup locally)
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('mycrm-jobs', JSON.stringify(jobs));
    }
  }, [jobs, isLoading]);

  // Helper to send data to GAS
  const syncToBackend = useCallback(async (action: 'create' | 'update' | 'delete', data: any) => {
    if (!backendUrl) return;

    try {
      await fetch(backendUrl, {
        method: 'POST',
        body: JSON.stringify({ action, data }),
        headers: {
            'Content-Type': 'text/plain;charset=utf-8', 
        },
      });
      // Silent success for background syncs to avoid spam, 
      // but you could enable this for debugging:
      // showToast('Cloud sync successful', 'success');
    } catch (error) {
      console.error(`Failed to sync ${action} to backend:`, error);
      showToast(`Sync Failed: Could not ${action} record on cloud`, 'error');
    }
  }, [backendUrl, showToast]);

  const addJob = useCallback((job: Omit<JobApplication, 'id' | 'lastUpdated'>) => {
    const newJob: JobApplication = {
      ...job,
      id: crypto.randomUUID(),
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    
    setJobs((prev) => [newJob, ...prev]);
    syncToBackend('create', newJob);
    showToast(`Added application: ${job.company}`, 'success');
  }, [syncToBackend, showToast]);

  const updateJob = useCallback((id: string, updates: Partial<JobApplication>) => {
    const today = new Date().toISOString().split('T')[0];
    let updatedJobData: JobApplication | null = null;

    setJobs((prev) =>
      prev.map((job) => {
        if (job.id === id) {
          updatedJobData = { ...job, ...updates, lastUpdated: today };
          return updatedJobData;
        }
        return job;
      })
    );

    if (updatedJobData) {
      syncToBackend('update', updatedJobData);
      showToast('Application updated', 'success');
    }
  }, [syncToBackend, showToast]);

  const deleteJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id));
    syncToBackend('delete', { id });
    showToast('Application deleted', 'info');
  }, [syncToBackend, showToast]);

  const getJobStats = useCallback(() => {
    const total = jobs.length;
    const interview = jobs.filter((j) => j.status === JobStatus.INTERVIEW).length;
    const offer = jobs.filter((j) => j.status === JobStatus.OFFER).length;
    const rejected = jobs.filter((j) => j.status === JobStatus.REJECTED).length;
    const active = jobs.filter((j) => j.status === JobStatus.APPLIED || j.status === JobStatus.INTERVIEW).length;
    return { total, interview, offer, rejected, active };
  }, [jobs]);

  return (
    <JobContext.Provider value={{ jobs, isLoading, addJob, updateJob, deleteJob, getJobStats }}>
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