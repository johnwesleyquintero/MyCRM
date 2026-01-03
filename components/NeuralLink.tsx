import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import { geminiService, formatJobsForContext } from '../services/geminiService';
import { useJobStore } from '../store/JobContext';
import { ChatMessage, JobStatus } from '../types';

interface NeuralLinkProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NeuralLink: React.FC<NeuralLinkProps> = ({ isOpen, onClose }) => {
  const { jobs, addJob, updateJob } = useJobStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', content: "I'm WesAI, your JobOps Copilot. How can I assist you today?", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Prepare context
    const jobsContext = formatJobsForContext(jobs);
    const history = messages.map(m => ({ role: m.role as 'user' | 'model', content: m.content }));

    try {
      const response = await geminiService.chat(userMsg.content, jobsContext, history);
      
      // Execute Tools if any
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const call of response.functionCalls) {
          const args = call.args as any;
          
          if (call.name === 'addJob') {
            addJob({
              company: args.company,
              role: args.role,
              status: (args.status as JobStatus) || JobStatus.APPLIED,
              link: args.link || '',
              notes: args.notes || 'Added via Neural Link',
              dateApplied: new Date().toISOString().split('T')[0]
            });
            // Append a system confirmation message locally (simulated)
            // Ideally we feed this back to the LLM, but for single-turn UI simplicity:
            setMessages(prev => [...prev, { 
              id: Date.now().toString(), 
              role: 'model', 
              content: `✅ I've created the application for **${args.company}** as ${args.role}.`, 
              timestamp: Date.now() 
            }]);
          } 
          
          if (call.name === 'updateStatus') {
             // Find job by fuzzy match on company name
             const jobToUpdate = jobs.find(j => j.company.toLowerCase().includes(args.companyName.toLowerCase()));
             if (jobToUpdate) {
                updateJob(jobToUpdate.id, { 
                   status: args.newStatus as JobStatus,
                   notes: jobToUpdate.notes + (args.notes ? `\n\n**Update:** ${args.notes}` : '')
                });
                setMessages(prev => [...prev, { 
                  id: Date.now().toString(), 
                  role: 'model', 
                  content: `🔄 Status updated for **${jobToUpdate.company}** to ${args.newStatus}.`, 
                  timestamp: Date.now() 
                }]);
             } else {
               setMessages(prev => [...prev, { 
                  id: Date.now().toString(), 
                  role: 'model', 
                  content: `⚠️ I couldn't find a job matching "${args.companyName}".`, 
                  timestamp: Date.now() 
                }]);
             }
          }
        }
      }

      // If there is text response (and not just a function call specific message we handled above)
      if (response.text && (!response.functionCalls || response.functionCalls.length === 0)) {
         setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: response.text || '', timestamp: Date.now() }]);
      }

    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "System Malfunction. Check console.", timestamp: Date.now() }]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 z-50 flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50">
        <div className="flex items-center space-x-2 text-indigo-600">
           <Sparkles size={18} />
           <span className="font-bold text-slate-800">Neural Link</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
            }`}>
              {msg.role === 'model' && (
                <div className="flex items-center space-x-2 mb-1 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <Bot size={12} /> <span>WesAI</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isThinking && (
           <div className="flex justify-start">
             <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150" />
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative">
          <input
            type="text"
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            placeholder="Add job or ask status..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isThinking}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          WesAI can take actions. Try "Add Netflix, Senior Engineer, Applied today".
        </p>
      </div>
    </div>
  );
};
