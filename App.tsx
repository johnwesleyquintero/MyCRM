import React, { useState } from 'react';
import { JobProvider } from './store/JobContext';
import { Dashboard } from './components/Dashboard';
import { JobTable } from './components/JobTable';
import { KanbanBoard } from './components/KanbanBoard';
import { NeuralLink } from './components/NeuralLink';
import { JobDetailModal } from './components/JobDetailModal';
import { LayoutGrid, List, BarChart3, Plus, Sparkles, Layers } from 'lucide-react';
import { JobApplication, ViewMode } from './types';

const AppContent: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [isNeuralLinkOpen, setIsNeuralLinkOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (job: JobApplication | null = null) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col h-16 md:h-screen sticky top-0 z-40">
        <div className="p-4 flex items-center space-x-2 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
            J
          </div>
          <span className="text-xl font-bold text-white tracking-tight">JobOps</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-x-auto md:overflow-visible flex md:flex-col md:space-x-0 space-x-4">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <BarChart3 size={18} />
            <span>Mission Control</span>
          </button>
          
          <button 
             onClick={() => setView('kanban')}
             className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <LayoutGrid size={18} />
            <span>Pipeline (Kanban)</span>
          </button>

          <button 
             onClick={() => setView('table')}
             className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'table' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <List size={18} />
            <span>All Applications</span>
          </button>

           <button 
             onClick={() => setView('timeline')}
             className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'timeline' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <Layers size={18} />
            <span>Timeline</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
             <div className="flex items-center space-x-2 mb-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-xs font-medium text-slate-400">System Status</span>
             </div>
             <p className="text-xs text-slate-500">All systems operational. API Key Configured.</p>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] md:h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-xl font-bold text-slate-800 capitalize">{view === 'dashboard' ? 'Mission Control' : view}</h1>
          
          <div className="flex items-center space-x-4">
             <button 
                onClick={() => setIsNeuralLinkOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10 group"
             >
               <Sparkles size={16} className="text-indigo-400 group-hover:text-indigo-300"/>
               <span className="text-sm font-medium">Neural Link</span>
             </button>

             <button 
                onClick={() => handleOpenModal(null)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
             >
               <Plus size={16} />
               <span className="text-sm font-medium">New App</span>
             </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
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
    </div>
  );
};

export default function App() {
  return (
    <JobProvider>
      <AppContent />
    </JobProvider>
  );
}
