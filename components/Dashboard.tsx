import React from 'react';
import { useJobStore } from '../store/JobContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Briefcase, CheckCircle, XCircle, Clock } from 'lucide-react';

const COLORS = {
  APPLIED: '#60a5fa', // Blue 400
  INTERVIEW: '#fbbf24', // Amber 400
  OFFER: '#34d399', // Emerald 400
  REJECTED: '#94a3b8' // Slate 400
};

export const Dashboard: React.FC = () => {
  const { getJobStats, jobs } = useJobStore();
  const stats = getJobStats();

  const data = [
    { name: 'Applied', value: stats.total - stats.interview - stats.offer - stats.rejected, color: COLORS.APPLIED },
    { name: 'Interview', value: stats.interview, color: COLORS.INTERVIEW },
    { name: 'Offer', value: stats.offer, color: COLORS.OFFER },
    { name: 'Rejected', value: stats.rejected, color: COLORS.REJECTED },
  ];

  // Calculate recent activity (mock logic: applied in last 7 days)
  const recentApps = jobs.filter(j => {
     const appDate = new Date(j.dateApplied);
     const sevenDaysAgo = new Date();
     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
     return appDate > sevenDaysAgo;
  }).length;

  return (
    <div className="space-y-6">
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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                 <p className="text-sm text-red-800 font-medium">Needs Attention</p>
                 <p className="text-red-600 text-xs mt-1">2 applications haven't responded in 10+ days.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
