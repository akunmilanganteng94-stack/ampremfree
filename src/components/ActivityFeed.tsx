import React, { useState, useEffect } from 'react';
import { Activity, Clock, RefreshCw, Search, Shield, Zap, CheckCircle2, AlertTriangle, Terminal } from 'lucide-react';
import { ActivityLog } from '../types';

export const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [featureFilter, setFeatureFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const url = `/api/activities?limit=25${featureFilter !== 'ALL' ? `&feature=${featureFilter}` : ''}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setActivities(json.data);
      }
    } catch (err) {
      console.warn('Failed to fetch activity feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [featureFilter]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchActivities();
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefresh, featureFilter, searchTerm]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 mb-6 shadow-[0_0_25px_rgba(6,182,212,0.1)]">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                SYSTEM_TELEMETRY // ANONYMIZED
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950 text-[10px] font-mono text-emerald-400 border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE FEED</span>
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400 font-tech uppercase tracking-wide">
              AKTIVITAS REAL-TIME
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Pantau arus aktivitas user secara real-time. Semua sesi pengguna dianonimkan (SES-XXXXXX) tanpa menyimpan data sensitif.
            </p>
          </div>

          {/* Refresh controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                autoRefresh
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              {autoRefresh ? 'AUTO-REFRESH [ON]' : 'AUTO-REFRESH [OFF]'}
            </button>
            <button
              onClick={fetchActivities}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
              title="Refresh sekarang"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'VERIF', 'BULK', 'GATE'].map((feat) => (
              <button
                key={feat}
                onClick={() => setFeatureFilter(feat)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  featureFilter === feat
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {feat}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari sesi atau action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchActivities()}
              className="w-full sm:w-64 pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

      </div>

      {/* Activity List Table */}
      <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">WAKTU</th>
                <th className="py-3 px-4">SESI ANONIM</th>
                <th className="py-3 px-4">FITUR / ACTION</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">RESPONSE TIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                    Belum ada data aktivitas yang sesuai filter.
                  </td>
                </tr>
              ) : (
                activities.map((act) => {
                  const isSuccess = act.status === 'Success' || act.status === 'Completed';
                  const isFailed = act.status === 'Failed';

                  return (
                    <tr key={act.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 font-bold">
                          {act.sessionId}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            act.feature === 'VERIF' ? 'bg-cyan-500/20 text-cyan-300' :
                            act.feature === 'BULK' ? 'bg-purple-500/20 text-purple-300' :
                            act.feature === 'GATE' ? 'bg-emerald-500/20 text-emerald-300' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {act.feature}
                          </span>
                          <span className="text-slate-300 font-medium">
                            {act.action}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSuccess
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isFailed
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {isSuccess && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {isFailed && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                          <span>{act.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right text-slate-400">
                        <span className="font-mono">
                          {act.responseTime ? `${act.responseTime} ms` : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
