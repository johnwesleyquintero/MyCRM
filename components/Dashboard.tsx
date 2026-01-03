
import React, { useEffect, useState, useMemo } from 'react';
import { useJobStore } from '../store/JobContext';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Briefcase, CheckCircle, XCircle, Clock, Sparkles, TrendingUp } from 'lucide-react';
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
  const [dailyBriefing, setDailyBriefing] = useState<string | null>(null);

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
        // This is a rough approximation for visualization
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


  // Load Daily Briefing on mount
  useEffect(() => {
    const fetchBriefing = async () => {
      // Simple local cache to prevent spamming the API on every render
      const cached = sessionStorage.getItem('mycrm-daily-briefing');
      if (cached) {
        setDailyBriefing(cached);
        return;
      }
      
      if (jobs.length > 0) {
        const context = formatJobsForContext(jobs);
        try {
            const briefing = await geminiService.getDailyBriefing(context);
            setDailyBriefing(briefing);
            sessionStorage.setItem('mycrm-daily-briefing', briefing);
        } catch (e) {
            console.log("AI briefing unavailable");
        }
      }
    };
    fetchBriefing();
  }, [jobs]);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      
      {/* AI Daily Briefing Card */}
      {dailyBriefing && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white shadow-lg flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles size={20} className="text-white" />
            </div>
            <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-100 opacity-80 mb-1">WesAI Daily Strategic Focus</h3>
                <p className="text-sm font-medium leading-relaxed">{dailyBriefing}</p>
            </div>
        </div>
      )}

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
