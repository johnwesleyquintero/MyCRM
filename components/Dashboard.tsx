
import React, { useEffect, useState, useMemo } from 'react';
import { useJobStore } from '../store/JobContext';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Briefcase, CheckCircle, XCircle, Clock, Sparkles, TrendingUp, RefreshCw } from 'lucide-react';
import { geminiService, formatJobsForContext } from '../services/geminiService';

const COLORS = {
  APPLIED: '#60a5fa', // Blue 400
  INTERVIEW: '#fbbf24', // Amber 400
  OFFER: '#34d399', // Emerald 400
  REJECTED: '#94a3b8' // Slate 400
};

export const Dashboard: React.FC = () => {
  const { getJobStats, jobs } = useJobStore();
  const stats = getJobStats();
  const [dailyBriefing, setDailyBriefing] = useState<{ headline: string, content: string } | null>(null);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(false);

  const data = [
    { name: 'Applied', value: stats.total - stats.interview - stats.offer - stats.rejected, color: COLORS.APPLIED },
    { name: 'Interview', value: stats.interview, color: COLORS.INTERVIEW },
    { name: 'Offer', value: stats.offer, color: COLORS.OFFER },
    { name: 'Rejected', value: stats.rejected, color: COLORS.REJECTED },
  ];

  // Calculate recent activity (last 7 days)
  const recentApps = jobs.filter(j => {
     const appDate = new Date(j.dateApplied);
     const sevenDaysAgo = new Date();
     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
     return appDate > sevenDaysAgo;
  }).length;

  // Calculate Velocity Data (Weekly applications for last 6 weeks)
  const velocityData = useMemo(() => {
    const weeks: Record<string, number> = {};
    const today = new Date();
    
    // Initialize last 6 weeks with 0
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - (i * 7));
        const weekKey = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
        weeks[weekKey] = 0;
    }

    // Populate data
    jobs.forEach(job => {
        if (!job.dateApplied) return;
        const appDate = new Date(job.dateApplied);
        
        // Find if this date falls into one of our 6 weeks buckets
        const diffTime = Math.abs(today.getTime() - appDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays <= 42) {
            // Find the closest bucket
            const weekIndex = Math.floor(diffDays / 7);
            const bucketIndex = 5 - weekIndex; // 0 is oldest, 5 is current
            if (bucketIndex >= 0) {
               const d = new Date(today);
               d.setDate(today.getDate() - (weekIndex * 7));
               const weekKey = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
               if (weeks[weekKey] !== undefined) {
                   weeks[weekKey]++;
               }
            }
        }
    });

    return Object.entries(weeks).map(([name, value]) => ({ name, value }));
  }, [jobs]);


  // Load Daily Briefing on mount or refresh
  const fetchBriefing = async (forceRefresh: boolean = false) => {
    if (jobs.length === 0) return;

    // Use Cache if available and not forced
    const cached = sessionStorage.getItem('mycrm-daily-briefing-v2');
    if (!forceRefresh && cached) {
      try {
        setDailyBriefing(JSON.parse(cached));
        return;
      } catch (e) { /* ignore invalid cache */ }
    }

    setIsLoadingBriefing(true);
    const context = formatJobsForContext(jobs);
    
    try {
        const briefing = await geminiService.getDailyBriefing(context);
        setDailyBriefing(briefing);
        
        // Cache if valid
        if (briefing.headline !== "Configuration Required" && briefing.headline !== "System Offline") {
            sessionStorage.setItem('mycrm-daily-briefing-v2', JSON.stringify(briefing));
        }
    } catch (e) {
        console.log("AI briefing unavailable");
    } finally {
        setIsLoadingBriefing(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [jobs.length]); // Re-fetch only when job count changes dramatically (mostly on init)

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      
      {/* AI Daily Briefing Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-xl relative overflow-hidden border border-indigo-500/30">
        {/* Background Decorative Effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-2 mb-3">
             <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30 backdrop-blur-sm">
               <Sparkles size={16} className="text-indigo-300" />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300/80">Mission Intelligence</span>
          </div>
          
          <button 
            onClick={() => fetchBriefing(true)} 
            disabled={isLoadingBriefing}
            className={`p-2 rounded-lg text-indigo-300 hover:text-white hover:bg-white/10 transition-all ${isLoadingBriefing ? 'animate-spin opacity-50' : ''}`}
            title="Refresh Intelligence"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {isLoadingBriefing ? (
           <div className="animate-pulse space-y-3 max-w-2xl">
              <div className="h-6 bg-white/10 rounded w-1/3"></div>
              <div className="h-4 bg-white/5 rounded w-3/4"></div>
              <div className="h-4 bg-white/5 rounded w-1/2"></div>
           </div>
        ) : dailyBriefing ? (
          <div className="max-w-3xl relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight tracking-tight">{dailyBriefing.headline}</h2>
            <p className="text-indigo-100/80 text-sm md:text-base font-light leading-relaxed max-w-2xl">
              {dailyBriefing.content}
            </p>
          </div>
        ) : null}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-medium tracking-wide">Total Applications</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-medium tracking-wide">Active / Interview</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.active}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-medium tracking-wide">Offers</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.offer}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-slate-50 text-slate-500 rounded-lg">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-medium tracking-wide">Rejected</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.rejected}</h3>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Momentum Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-6">
             <div>
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <TrendingUp size={20} className="text-indigo-600"/> 
                    Application Momentum
                </h3>
                <p className="text-xs text-slate-500">Volume over last 6 weeks</p>
             </div>
             <div className="text-right">
                <span className="text-2xl font-bold text-slate-800">{recentApps}</span>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">This Week</p>
             </div>
           </div>
           
           <div className="h-56 w-full" style={{ minWidth: 0 }}>
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={velocityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                 <Tooltip 
                   cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                 />
                 <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Pipeline Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Pipeline Distribution</h3>
             <p className="text-xs text-slate-500">Current status breakdown</p>
          </div>
          <div className="h-56 w-full" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false}/>
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">System Health</h3>
           <div className="flex gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex-1">
                 <p className="text-sm text-slate-700 font-medium">Data Records</p>
                 <p className="text-slate-500 text-xs mt-1">{jobs.length} total tracked applications</p>
              </div>
               <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex-1">
                 <p className="text-sm text-slate-700 font-medium">Conversion Rate</p>
                 <p className="text-slate-500 text-xs mt-1">
                    {stats.total > 0 ? Math.round(((stats.offer + stats.interview) / stats.total) * 100) : 0}% Active/Offer Rate
                 </p>
              </div>
           </div>
        </div>
    </div>
  );
};
