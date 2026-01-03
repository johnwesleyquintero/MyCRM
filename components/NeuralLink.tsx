import React, { useState } from 'react';
import { X, Send, Bot, Sparkles, Trash2 } from 'lucide-react';
import { SimpleMarkdown } from '../utils/markdown';
import { useNeuralLink } from '../hooks/useNeuralLink';

interface NeuralLinkProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NeuralLink: React.FC<NeuralLinkProps> = ({ isOpen, onClose }) => {
  const { messages, isThinking, handleSend, handleClearChat, messagesEndRef } = useNeuralLink(isOpen);
  const [input, setInput] = useState('');

  const onSendClick = () => {
    handleSend(input);
    setInput('');
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={onClose} 
      />

      {/* Slide-over Panel (Right Side Always) */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50 flex-shrink-0">
          <div className="flex items-center space-x-2 text-indigo-600">
             <Sparkles size={18} />
             <span className="font-bold text-slate-800">Neural Link</span>
          </div>
          <div className="flex items-center space-x-1">
               <button onClick={handleClearChat} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-rose-500 transition-colors" title="Clear Memory">
                  <Trash2 size={16} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                  <X size={20} />
              </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
              }`}>
                {msg.role === 'model' && (
                  <div className="flex items-center space-x-2 mb-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <Bot size={12} /> <span>WesAI</span>
                  </div>
                )}
                {/* Render with Markdown only for model messages, raw text for user for speed */}
                {msg.role === 'model' ? (
                    <SimpleMarkdown content={msg.content} className="text-slate-700" />
                ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
                
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
              onKeyDown={(e) => e.key === 'Enter' && onSendClick()}
              disabled={isThinking}
            />
            <button 
              onClick={onSendClick}
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
    </>
  );
};
