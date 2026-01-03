import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, JobStatus } from '../types';
import { geminiService, formatJobsForContext } from '../services/geminiService';
import { useJobStore } from '../store/JobContext';

export const useNeuralLink = (isOpen: boolean) => {
  const { jobs, addJob, updateJob } = useJobStore();
  const [isThinking, setIsThinking] = useState(false);
  
  // Initialize from LocalStorage or Default
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('mycrm-chat-history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history");
      }
    }
    return [{ id: '0', role: 'model', content: "I'm WesAI, your JobOps Copilot. How can I assist you today?", timestamp: Date.now() }];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Sync scroll on updates
  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, isOpen, scrollToBottom]);

  // Persist messages to LocalStorage
  useEffect(() => {
    localStorage.setItem('mycrm-chat-history', JSON.stringify(messages));
  }, [messages]);

  const handleClearChat = useCallback(() => {
      const resetMsg: ChatMessage = { id: Date.now().toString(), role: 'model', content: "Memory cleared. Ready for new instructions.", timestamp: Date.now() };
      setMessages([resetMsg]);
      localStorage.setItem('mycrm-chat-history', JSON.stringify([resetMsg]));
  }, []);

  const handleSend = useCallback(async (input: string) => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
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
            // Append a system confirmation message locally
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
  }, [jobs, messages, addJob, updateJob]);

  return {
      messages,
      isThinking,
      handleSend,
      handleClearChat,
      messagesEndRef
  };
};
