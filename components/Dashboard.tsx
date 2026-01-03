import React, { useEffect, useState } from 'react';
import { useJobStore } from '../store/JobContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Briefcase, CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';
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

  // Calculate recent activity
  const recentApps = jobs.filter(j => {
     const appDate = new Date(j.dateApplied);
     const sevenDaysAgo = new Date();
     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
     return appDate > sevenDaysAgo;
  }).length;

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

      {/* Charts & Timeline Stub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-2">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Pipeline Distribution</h3>
          {/* 
            Recharts ResponsiveContainer fix:
            Ensuring parent has explicit width and minWidth prevents "width(-1)" calculation errors 
            that occur when the container is inside certain grid/flex layouts.
          */}
          <div className="h-64 w-full" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
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

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Insights</h3>
           <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-sm text-indigo-800 font-medium">Weekly Velocity</p>
                <p className="text-indigo-600 text-xs mt-1">You applied to <span className="font-bold">{recentApps}</span> jobs this week. Keep up the momentum!</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                 <p className="text-sm text-slate-700 font-medium">Data Health</p>
                 <p className="text-slate-500 text-xs mt-1">{jobs.length} total records tracked.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};