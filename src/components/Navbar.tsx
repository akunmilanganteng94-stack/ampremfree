import React, { useState } from 'react';
import { Terminal, Shield, MessageCircle, ShieldAlert, Cpu, Sparkles, Activity } from 'lucide-react';

interface NavbarProps {
  activeTab: 'home' | 'verif' | 'bulk' | 'activity';
  setActiveTab: (tab: 'home' | 'verif' | 'bulk' | 'activity') => void;
  adminWaLink: string;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  adminWaLink,
  onOpenAdmin,
  isAdminLoggedIn
}) => {
  const [secretClicks, setSecretClicks] = useState(0);

  const handleSecretBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = secretClicks + 1;
    if (next >= 5) {
      setSecretClicks(0);
      onOpenAdmin();
    } else {
      setSecretClicks(next);
      setTimeout(() => setSecretClicks(0), 3000);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/70 backdrop-blur-xl border-b border-cyan-500/20 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-400/40 group-hover:border-cyan-300 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400 font-tech">
                  AZRYLPREM
                </span>
                <span 
                  onClick={handleSecretBadgeClick}
                  className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 select-none cursor-default"
                  title="AZRYLPREM Core"
                >
                  v2.5
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-semibold uppercase">
                  SYSTEM ONLINE
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              [DASHBOARD]
            </button>
            <button
              onClick={() => setActiveTab('verif')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'verif'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              [MENU VERIF]
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'bulk'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              [MENU BULK]
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'activity'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>[ACTIVITY]</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* WhatsApp Admin button */}
            <a
              href={adminWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium transition-all duration-200 hover:scale-105 shadow-sm"
              title="Hubungi Admin WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              <span className="hidden sm:inline">WA ADMIN</span>
            </a>

            {/* Admin Portal Toggle - ONLY VISIBLE WHEN ADMIN IS ACTIVELY LOGGED IN */}
            {isAdminLoggedIn && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono transition-all duration-200 cursor-pointer bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.3)] animate-pulse"
                title="Buka Admin Control Center"
              >
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">ADMIN [ACTIVE]</span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/70 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold whitespace-nowrap ${
              activeTab === 'home' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('verif')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold whitespace-nowrap ${
              activeTab === 'verif' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
            }`}
          >
            Verif
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold whitespace-nowrap ${
              activeTab === 'bulk' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
            }`}
          >
            Bulk
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold whitespace-nowrap ${
              activeTab === 'activity' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
            }`}
          >
            Activity
          </button>
        </div>

      </div>
    </header>
  );
};
