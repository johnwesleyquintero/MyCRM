import React, { useState } from 'react';
import { JobProvider } from './store/JobContext';
import { ToastProvider } from './store/ToastContext';
import { Dashboard } from './components/Dashboard';
import { JobTable } from './components/JobTable';
import { KanbanBoard } from './components/KanbanBoard';
import { NeuralLink } from './components/NeuralLink';
import { JobDetailModal } from './components/JobDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { 
  LayoutGrid, 
  List, 
  BarChart3, 
  Plus, 
  Sparkles, 
  Layers, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Database
} from 'lucide-react';
import { JobApplication, ViewMode } from './types';

const LogoIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="w-5 h-5"
  >
    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 12h.01" />
  </svg>
);

const AppContent: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [isNeuralLinkOpen, setIsNeuralLinkOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleOpenModal = (job: JobApplication | null = null) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const SidebarItem = ({ 
    icon: Icon, 
    label, 
    isActive, 
    onClick 
  }: { 
    icon: any, 
    label: string, 
    isActive: boolean, 
    onClick: () => void 
  }) => (
    <button 
      onClick={onClick}
      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group overflow-hidden whitespace-nowrap ${
        isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
      }`}
      title={isSidebarCollapsed ? label : ''}
    >
      <div className="flex-shrink-0">
        <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
      </div>
      <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
        {label}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside 
        className={`${
          isSidebarCollapsed ? 'md:w-20' : 'md:w-64'
        } bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col h-16 md:h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out border-r border-slate-800 shadow-2xl`}
      >
        {/* Sidebar Header */}
        <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'} border-b border-slate-800 transition-all duration-300`}>
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <LogoIcon />
            </div>
            <span className={`text-xl font-bold text-white tracking-tight whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              JobOps
            </span>
          </div>
          
          {/* Collapse Toggle (Desktop only) */}
          {!isSidebarCollapsed && (
             <button 
               onClick={() => setIsSidebarCollapsed(true)}
               className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
             >
               <ChevronLeft size={16} />
             </button>
          )}
        </div>

        {/* Collapsed Toggle Button (Centered when collapsed) */}
        {isSidebarCollapsed && (
          <div className="hidden md:flex justify-center w-full py-2 border-b border-slate-800">
             <button 
               onClick={() => setIsSidebarCollapsed(false)}
               className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
             >
               <ChevronRight size={16} />
             </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2 overflow-x-auto md:overflow-visible flex md:flex-col md:space-x-0 space-x-2 custom-scrollbar">
          <SidebarItem 
            icon={BarChart3} 
            label="Mission Control" 
            isActive={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
          />
          <SidebarItem 
            icon={LayoutGrid} 
            label="Pipeline" 
            isActive={view === 'kanban'} 
            onClick={() => setView('kanban')} 
          />
          <SidebarItem 
            icon={List} 
            label="Applications" 
            isActive={view === 'table'} 
            onClick={() => setView('table')} 
          />
          <SidebarItem 
            icon={Layers} 
            label="Timeline" 
            isActive={view === 'timeline'} 
            onClick={() => setView('timeline')} 
          />
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 space-y-3">
           <SidebarItem 
            icon={Settings} 
            label="Settings" 
            isActive={false} 
            onClick={() => setIsSettingsOpen(true)} 
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] md:h-screen overflow-hidden bg-slate-50 relative">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-30">
          <h1 className="text-xl font-bold text-slate-800 capitalize flex items-center space-x-2">
            <span>{view === 'dashboard' ? 'Mission Control' : view}</span>
            {view === 'dashboard' && <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">v2.3</span>}
          </h1>
          
          <div className="flex items-center space-x-4">
             <button 
                onClick={() => setIsNeuralLinkOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10 group border border-slate-800"
             >
               <Sparkles size={16} className="text-indigo-400 group-hover:text-indigo-300 transition-colors"/>
               <span className="text-sm font-medium">Neural Link</span>
             </button>

             <button 
                onClick={() => handleOpenModal(null)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
             >
               <Plus size={16} />
               <span className="text-sm font-medium">New App</span>
             </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto h-full">
            {view === 'dashboard' && <Dashboard />}
            {view === 'table' && <JobTable onEdit={handleOpenModal} />}
            {view === 'kanban' && <KanbanBoard onEdit={handleOpenModal} />}
            {view === 'timeline' && (
              <div className="flex items-center justify-center h-full text-slate-400 flex-col">
                <Layers size={48} className="mb-4 text-slate-300"/>
                <p>Timeline view coming in v2.4</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Overlays */}
      <NeuralLink isOpen={isNeuralLinkOpen} onClose={() => setIsNeuralLinkOpen(false)} />
      <JobDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} job={editingJob} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <JobProvider>
        <AppContent />
      </JobProvider>
    </ToastProvider>
  );
}