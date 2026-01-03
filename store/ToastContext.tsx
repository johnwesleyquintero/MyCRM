import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[60] flex flex-col space-y-3 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`toast-enter pointer-events-auto flex items-center w-80 p-4 rounded-lg shadow-lg border backdrop-blur-sm ${
                toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex-shrink-0 mr-3">
               {toast.type === 'success' && <CheckCircle size={20} className="text-emerald-500" />}
               {toast.type === 'error' && <AlertCircle size={20} className="text-rose-500" />}
               {toast.type === 'info' && <Info size={20} className="text-blue-500" />}
            </div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button 
                onClick={() => removeToast(toast.id)}
                className="ml-3 text-slate-400 hover:text-slate-600 transition-colors"
            >
                <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};