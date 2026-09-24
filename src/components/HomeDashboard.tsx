import React from 'react';
import { Mail, Layers, Activity, ShieldCheck, Cpu, ArrowRight, MessageCircle, ExternalLink, Zap, Terminal, Lock, Globe } from 'lucide-react';
import { WebsiteConfig, SiteStats } from '../types';

interface HomeDashboardProps {
  config: WebsiteConfig;
  stats: SiteStats;
  onNavigateTab: (tab: 'home' | 'verif' | 'bulk' | 'activity') => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  config,
  stats,
  onNavigateTab
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero Cyber Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950/80 to-slate-950/90 border border-cyan-500/30 p-6 sm:p-10 shadow-[0_0_35px_rgba(6,182,212,0.15)]">
        
        {/* Glow corners */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                PREMIUM UTILITY SYSTEM
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                SYSTEM ONLINE
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400 font-tech tracking-wide uppercase leading-tight">
              {config.siteName || 'AZRYLPREM'}
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              {config.description || 'Platform utility dark-tech futuristik berkecepatan tinggi dengan integrasi proxy backend aman, generator akun premium Alight Motion VIP, dan eksekusi bulk batch terisolasi.'}
            </p>

            {/* Quick action buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigateTab('verif')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 hover:from-cyan-500 to-sky-600 text-white font-tech font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-cyan-950/50 hover:scale-[1.02] cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>GENERATE VERIF PREM</span>
                <ArrowRight className="w-4 h-4 opacity-75" />
              </button>

              <button
                onClick={() => onNavigateTab('bulk')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 font-tech font-bold text-sm tracking-wider uppercase transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>BULK GENERATE PREM</span>
                <ArrowRight className="w-4 h-4 opacity-75" />
              </button>

              <a
                href={config.adminWaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-500/40 font-tech font-bold text-sm tracking-wider uppercase transition-all hover:scale-[1.02]"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>HUBUNGI ADMIN</span>
              </a>
            </div>
          </div>

          {/* Quick Metrics Badge Column */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full lg:w-80">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">TOTAL VISITORS</span>
              <p className="text-2xl font-black font-tech text-cyan-400 mt-1">
                {stats.totalVisitors.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Live Counter</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">ACTIVE USERS</span>
              <p className="text-2xl font-black font-tech text-purple-400 mt-1">
                {stats.activeUsers}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-cyan-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Realtime Ping</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">VERIF PROCESSED</span>
              <p className="text-2xl font-black font-tech text-emerald-400 mt-1">
                {stats.verifRequests}
              </p>
              <div className="text-[10px] font-mono text-slate-500 mt-1">Via Secure Proxy</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">BULK BATCHES</span>
              <p className="text-2xl font-black font-tech text-sky-400 mt-1">
                {stats.bulkRequests}
              </p>
              <div className="text-[10px] font-mono text-slate-500 mt-1">Max 5 / request</div>
            </div>
          </div>

        </div>

      </div>

      {/* Main Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Verif */}
        <div 
          onClick={() => onNavigateTab('verif')}
          className="group relative p-6 rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-xl shadow-lg hover:shadow-cyan-950/40 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                MODULE 01
              </span>
            </div>
            <h3 className="text-xl font-bold font-tech text-slate-100 group-hover:text-cyan-300 transition-colors uppercase">
              Verifikasi & Generate Prem
            </h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Kirim permintaan verifikasi & generate akun Prem instan ke Gmail target. Wajib ikuti Saluran WhatsApp resmi untuk membuka akses generate.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-cyan-400 font-semibold">
            <span>BUKA GENERATOR VERIF</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Bulk */}
        <div 
          onClick={() => onNavigateTab('bulk')}
          className="group relative p-6 rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 backdrop-blur-xl shadow-lg hover:shadow-purple-950/40 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                MODULE 02
              </span>
            </div>
            <h3 className="text-xl font-bold font-tech text-slate-100 group-hover:text-purple-300 transition-colors uppercase">
              Bulk Generator Prem
            </h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Eksekusi batch proses pembuatan & verifikasi serentak hingga 5 antrean paralel. Memerlukan konfirmasi follow saluran WhatsApp resmi.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-purple-400 font-semibold">
            <span>BUKA BULK PROCESSOR</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Activity Feed */}
        <div 
          onClick={() => onNavigateTab('activity')}
          className="group relative p-6 rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 backdrop-blur-xl shadow-lg hover:shadow-emerald-950/40 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                MODULE 03
              </span>
            </div>
            <h3 className="text-xl font-bold font-tech text-slate-100 group-hover:text-emerald-300 transition-colors uppercase">
              Live Activity
            </h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Monitoring riwayat eksekusi sistem secara real-time. Menampilkan status, response time, dan session hash secara transparan.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
            <span>LIHAT ACTIVITY FEED</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* Security Architecture Guarantee */}
      <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h4 className="text-base font-bold font-tech uppercase tracking-wider text-slate-200">
            JAMINAN KEAMANAN & PRIVASI AZRYLPREM
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-slate-400">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-cyan-400 font-bold block mb-1">01 // NO LOGIN REQUIRED</span>
            Pengunjung biasa dapat langsung memakai seluruh fitur tanpa mendaftar akun atau memasukkan kata sandi apapun.
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-cyan-400 font-bold block mb-1">02 // BACKEND PROXY ONLY</span>
            Header rahasia dan kunci API eksternal disimpan eksklusif pada server environment. Browser Anda bersih dari paparan rahasia.
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-cyan-400 font-bold block mb-1">03 // MANDATORY CHANNEL PROTOCOL</span>
            Setiap pembuatan akun premium diverifikasi dengan gateway saluran WhatsApp untuk menjaga kuota server tetap seimbang.
          </div>
        </div>
      </div>

    </div>
  );
};
