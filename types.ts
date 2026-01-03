export enum JobStatus {
  APPLIED = 'Applied',
  INTERVIEW = 'Interview',
  OFFER = 'Offer',
  REJECTED = 'Rejected',
  ARCHIVED = 'Archived'
}

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'date' | 'url' | 'number';
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  dateApplied: string;
  lastUpdated: string;
  link?: string;
  notes?: string; // Markdown supported
  nextAction?: string;
  nextActionDate?: string;
  salary?: string;
  location?: string;
  contacts?: string;
  customFields?: Record<string, string>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

export type ViewMode = 'dashboard' | 'kanban' | 'table' | 'timeline';