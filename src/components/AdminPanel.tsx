import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Terminal, 
  Lock, 
  Key, 
  LogOut, 
  Settings, 
  BarChart3, 
  Users, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Save, 
  RefreshCw, 
  Sliders, 
  Database, 
  Link as LinkIcon, 
  Cpu, 
  Send,
  Play
} from 'lucide-react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  auth, 
  db, 
  loginOrRegisterAdmin, 
  logoutAdmin, 
  verifyAdminStatus, 
  PRIMARY_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  SUPER_ADMIN_EMAILS 
} from '../firebase';
import { WebsiteConfig, SiteStats, ActivityLog, ApiLogItem } from '../types';

interface AdminPanelProps {
  onBackToApp: () => void;
  config: WebsiteConfig;
  onUpdateConfig: (newConfig: WebsiteConfig) => void;
  stats: SiteStats;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onBackToApp,
  config,
  onUpdateConfig,
  stats
}) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>('');

  // Email/Pass Form State - Defaulted to official admin credentials
  const [emailInput, setEmailInput] = useState<string>(PRIMARY_ADMIN_EMAIL);
  const [passInput, setPassInput] = useState<string>(DEFAULT_ADMIN_PASSWORD);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Admin Active Tab
  const [adminTab, setAdminTab] = useState<'stats' | 'activities' | 'settings' | 'logs' | 'tester'>('stats');

  // Terminal Typing Animation State
  const [terminalText, setTerminalText] = useState<string>('');
  const [terminalDone, setTerminalDone] = useState<boolean>(false);

  // Settings Editable State
  const [formConfig, setFormConfig] = useState<WebsiteConfig>(config);
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Activity Logs Table State
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [actPage, setActPage] = useState<number>(1);
  const [actLimit] = useState<number>(10);
  const [actTotalPages, setActTotalPages] = useState<number>(1);
  const [actSearch, setActSearch] = useState<string>('');
  const [actFeature, setActFeature] = useState<string>('ALL');
  const [isActLoading, setIsActLoading] = useState<boolean>(false);

  // API Error Logs State
  const [apiLogs, setApiLogs] = useState<ApiLogItem[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState<boolean>(false);

  // Tester Tool State
  const [testEmail, setTestEmail] = useState<string>('test.admin@gmail.com');
  const [testBulkTotal, setTestBulkTotal] = useState<number>(1);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Keep formConfig in sync when parent config updates
  useEffect(() => {
    setFormConfig(config);
  }, [config]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setAuthLoading(true);
      if (user) {
        setCurrentUser(user);
        const authorized = await verifyAdminStatus(user);
        setIsAuthorized(authorized);
        if (!authorized) {
          setAuthError(`Akses Ditolak. Akun ${user.email || user.uid} bukan administrator resmi.`);
        } else {
          setAuthError('');
        }
      } else {
        setCurrentUser(null);
        setIsAuthorized(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Terminal Typing Effect when Admin is Authorized
  useEffect(() => {
    if (!isAuthorized) return;

    const fullLines = [
      '«SYSTEM INITIALIZED',
      'FIREBASE CONNECTED',
      'DATABASE ONLINE',
      'API STATUS: ONLINE',
      'ADMIN ACCESS: GRANTED»'
    ].join('\n');

    let currentIdx = 0;
    setTerminalText('');
    setTerminalDone(false);

    const timer = setInterval(() => {
      if (currentIdx < fullLines.length) {
        setTerminalText(fullLines.slice(0, currentIdx + 1));
        currentIdx++;
      } else {
        setTerminalDone(true);
        clearInterval(timer);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [isAuthorized]);

  // Fetch Activities for Admin Table
  const fetchAdminActivities = async (page = 1) => {
    setIsActLoading(true);
    try {
      const url = `/api/activities?page=${page}&limit=${actLimit}${actFeature !== 'ALL' ? `&feature=${actFeature}` : ''}${actSearch ? `&search=${encodeURIComponent(actSearch)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setActivities(data.data || []);
        if (data.pagination) {
          setActPage(data.pagination.page);
          setActTotalPages(data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.warn('Failed to load admin activities:', err);
    } finally {
      setIsActLoading(false);
    }
  };

  // Fetch API Logs
  const fetchApiLogs = async () => {
    setIsLogsLoading(true);
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.success) {
        setApiLogs(data.data || []);
      }
    } catch (err) {
      console.warn('Failed to load API logs:', err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      if (adminTab === 'activities') fetchAdminActivities(actPage);
      if (adminTab === 'logs') fetchApiLogs();
    }
  }, [isAuthorized, adminTab, actPage, actFeature]);

  // Handle Admin Gmail/Password Sign-in & Registration
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');
    try {
      const res = await loginOrRegisterAdmin(emailInput, passInput);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setIsAuthorized(true);
      } else {
        setAuthError(res.error || 'Gagal login admin. Periksa Gmail dan password Anda.');
      }
    } catch (err: any) {
      setAuthError('Gagal login: ' + (err.message || 'Periksa email dan password admin Anda.'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logoutAdmin();
    setCurrentUser(null);
    setIsAuthorized(false);
  };

  // Handle Save Settings to Firestore & Backend
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('Menyimpan perubahan ke Firestore & Server...');

    try {
      // 1. Sync to backend API
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formConfig)
      });
      const data = await res.json();

      // 2. Sync to Firestore `/settings/config`
      try {
        const docRef = doc(db, 'settings', 'config');
        await setDoc(docRef, {
          ...formConfig,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (fErr) {
        console.warn('Firestore direct write notice:', fErr);
      }

      if (data.success) {
        onUpdateConfig(formConfig);
        setSaveStatus('Konfigurasi website berhasil disimpan dan disinkronkan ke seluruh user!');
        setTimeout(() => setSaveStatus(''), 4000);
      } else {
        setSaveStatus('Gagal menyimpan ke server: ' + (data.message || 'Error'));
      }
    } catch (err: any) {
      setSaveStatus('Terjadi kesalahan koneksi saat menyimpan: ' + err.message);
    }
  };

  // Test Verif or Bulk directly
  const runDirectTest = async (type: 'verif' | 'bulk') => {
    setIsTesting(true);
    setTestResponse(null);
    try {
      if (type === 'verif') {
        const res = await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testEmail, sessionId: 'ADMIN-TEST-ENV' })
        });
        const data = await res.json();
        setTestResponse({ type: 'VERIF', status: res.status, data });
      } else {
        const res = await fetch('/api/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ total: testBulkTotal, sessionId: 'ADMIN-TEST-ENV' })
        });
        const data = await res.json();
        setTestResponse({ type: 'BULK', status: res.status, data });
      }
    } catch (err: any) {
      setTestResponse({ error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  // If loading auth state
  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center font-mono text-cyan-400 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p className="text-sm">MEMVERIFIKASI KREDENSIAL FIREBASE...</p>
        </div>
      </div>
    );
  }

  // --- LOGIN SCREEN IF NOT AUTHENTICATED OR NOT AUTHORIZED ---
  if (!currentUser || !isAuthorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 relative z-10">
        <div className="relative p-6 sm:p-8 rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-950/40">
          
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 mb-3">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black font-tech uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-sky-200 to-cyan-400">
              AZRYLPREM ADMIN PANEL
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Khusus akun administrator resmi. Autentikasi aman melalui Firebase Auth.
            </p>
          </div>

          {authError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Official Admin Profile Banner */}
          <div className="mb-5 p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs font-mono">
            <div className="truncate">
              <span className="text-[10px] text-purple-400 block uppercase font-bold">AKUN ADMIN RESMI</span>
              <span className="text-slate-200 font-semibold truncate">{PRIMARY_ADMIN_EMAIL}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmailInput(PRIMARY_ADMIN_EMAIL);
                setPassInput(DEFAULT_ADMIN_PASSWORD);
              }}
              className="px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[10px] font-bold transition-all cursor-pointer flex-shrink-0"
            >
              [Auto-Fill]
            </button>
          </div>

          {/* Email & Password Admin Form (No Google Login) */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-semibold text-slate-300 uppercase mb-1">
                GMAIL ADMIN
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="apriliazril67@gmail.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-slate-200 text-xs font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-semibold text-slate-300 uppercase mb-1">
                PASSWORD ADMIN
              </label>
              <input
                type="password"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-slate-200 text-xs font-mono outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 hover:from-purple-500 to-indigo-600 text-white font-tech font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-purple-950/40 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
            >
              {isLoggingIn ? 'MEMVERIFIKASI KREDENSIAL...' : 'MASUK ADMIN CONTROL CENTER'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <button
              onClick={onBackToApp}
              className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
            >
              ← Kembali ke Dashboard Pengunjung
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- AUTHORIZED ADMIN CONTROL CENTER ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Bar with Terminal Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Terminal Screen (with required typing animation) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-black/90 border border-cyan-500/40 font-mono text-xs shadow-[0_0_25px_rgba(6,182,212,0.15)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-500 text-[11px]">
            <div className="flex items-center gap-2 text-cyan-400">
              <Terminal className="w-4 h-4" />
              <span className="font-bold tracking-wider">AZRYLPREM ADMIN CONTROL CENTER // SHELL_v2.5</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400 font-bold">ONLINE</span>
            </div>
          </div>

          {/* Typing Terminal Display */}
          <div className="py-4 text-emerald-400 font-mono whitespace-pre-line leading-relaxed min-h-[110px]">
            {terminalText}
            {!terminalDone && <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse" />}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>ADMIN UID: <strong className="text-cyan-300 font-mono">{currentUser.uid.slice(0, 14)}...</strong></span>
            <span>EMAIL: <strong className="text-purple-300">{currentUser.email}</strong></span>
          </div>
        </div>

        {/* Admin Quick Action Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                SESSION STATUS
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                SUPER_ADMIN
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-200">
              {currentUser.displayName || currentUser.email}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Akses penuh untuk mengubah konten website, fitur bulk/verif, dan memantau telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800">
            <button
              onClick={onBackToApp}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition-all cursor-pointer text-center"
            >
              Mode User
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-mono font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        {[
          { id: 'stats', label: 'STATISTICS', icon: BarChart3 },
          { id: 'activities', label: 'USER ACTIVITY', icon: Activity },
          { id: 'settings', label: 'WEBSITE SETTINGS', icon: Settings },
          { id: 'logs', label: 'ERROR / API LOGS', icon: Database },
          { id: 'tester', label: 'QUICK API TESTER', icon: Play }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: STATISTICS */}
      {adminTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">TOTAL VISITORS</span>
              <p className="text-3xl font-black font-tech text-cyan-400 mt-2">
                {stats.totalVisitors.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Akumulasi pengunjung platform</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">ACTIVE USERS</span>
              <p className="text-3xl font-black font-tech text-purple-400 mt-2">
                {stats.activeUsers}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">User online aktif (10m)</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">VERIF REQUESTS</span>
              <p className="text-3xl font-black font-tech text-sky-400 mt-2">
                {stats.verifRequests}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Total verifikasi diproses</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">BULK REQUESTS</span>
              <p className="text-3xl font-black font-tech text-indigo-400 mt-2">
                {stats.bulkRequests}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Total transaksi batch</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">SUCCESSFUL REQUESTS</span>
              <p className="text-3xl font-black font-tech text-emerald-400 mt-2">
                {stats.successfulRequests}
              </p>
              <p className="text-[11px] text-emerald-500/80 mt-1">Response code 200/OK</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">FAILED REQUESTS</span>
              <p className="text-3xl font-black font-tech text-rose-400 mt-2">
                {stats.failedRequests}
              </p>
              <p className="text-[11px] text-rose-400/80 mt-1">Error/Timeout terdeteksi</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 col-span-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">TODAY'S ACTIVITY</span>
              <p className="text-3xl font-black font-tech text-amber-400 mt-2">
                {stats.todayActivity}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Frekuensi interaksi platform hari ini</p>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: USER ACTIVITY TABLE */}
      {adminTab === 'activities' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">FILTER:</span>
              {['ALL', 'VERIF', 'BULK', 'GATE'].map((feat) => (
                <button
                  key={feat}
                  onClick={() => setActFeature(feat)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-semibold cursor-pointer ${
                    actFeature === feat ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-950 text-slate-400'
                  }`}
                >
                  {feat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari sesi atau kata kunci..."
                value={actSearch}
                onChange={(e) => setActSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAdminActivities(1)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none w-full sm:w-56"
              />
              <button
                onClick={() => fetchAdminActivities(1)}
                className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isActLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table: TIME | ACTION | STATUS | SESSION */}
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">TIME</th>
                    <th className="py-3 px-4">ACTION</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">SESSION</th>
                    <th className="py-3 px-4 text-right">LATENCY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                        Tidak ada log aktivitas ditemukan.
                      </td>
                    </tr>
                  ) : (
                    activities.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-200 mr-2">{item.action}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                            {item.feature}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'Success' || item.status === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.status === 'Failed'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-bold whitespace-nowrap">
                          {item.sessionId}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap">
                          {item.responseTime ? `${item.responseTime} ms` : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-t border-slate-800 text-xs font-mono text-slate-400">
              <span>Halaman {actPage} dari {actTotalPages}</span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={actPage <= 1}
                  onClick={() => setActPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  disabled={actPage >= actTotalPages}
                  onClick={() => setActPage(p => p + 1)}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WEBSITE SETTINGS (SAVED TO FIRESTORE) */}
      {adminTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold font-tech text-slate-100 uppercase">
                  Konfigurasi Website & Kontrol Modul
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pengaturan langsung disinkronkan ke database Firestore dan seluruh pengunjung secara live.
                </p>
              </div>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-mono text-xs font-bold shadow-lg shadow-cyan-950/40 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>SIMPAN PERUBAHAN</span>
              </button>
            </div>

            {saveStatus && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{saveStatus}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Nama Website */}
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 uppercase">
                  NAMA WEBSITE
                </label>
                <input
                  type="text"
                  value={formConfig.siteName}
                  onChange={(e) => setFormConfig({ ...formConfig, siteName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Batas Bulk */}
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 uppercase">
                  BATAS BULK MAKSIMAL (PER REQUEST)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formConfig.maxBulkLimit}
                  onChange={(e) => setFormConfig({ ...formConfig, maxBulkLimit: parseInt(e.target.value) || 5 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Link Channel WhatsApp */}
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 uppercase">
                  LINK CHANNEL WHATSAPP (GATE)
                </label>
                <input
                  type="url"
                  value={formConfig.channelLink}
                  onChange={(e) => setFormConfig({ ...formConfig, channelLink: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Link WhatsApp Admin */}
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 uppercase">
                  LINK WHATSAPP ADMIN
                </label>
                <input
                  type="url"
                  value={formConfig.adminWaLink}
                  onChange={(e) => setFormConfig({ ...formConfig, adminWaLink: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Teks Tombol Verif */}
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 uppercase">
                  TEKS TOMBOL VERIF
                </label>
                <input
                  type="text"
                  value={formConfig.verifButtonText}
                  onChange={(e) => setFormConfig({ ...formConfig, verifButtonText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Teks Tombol Bulk */}
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 uppercase">
                  TEKS TOMBOL BULK
                </label>
                <input
                  type="text"
                  value={formConfig.bulkButtonText}
                  onChange={(e) => setFormConfig({ ...formConfig, bulkButtonText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Deskripsi Website */}
              <div className="md:col-span-2">
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 uppercase">
                  DESKRIPSI WEBSITE
                </label>
                <textarea
                  rows={2}
                  value={formConfig.description}
                  onChange={(e) => setFormConfig({ ...formConfig, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Banner Pengumuman */}
              <div className="md:col-span-2">
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1 uppercase">
                  BANNER PENGUMUMAN / BROADCAST
                </label>
                <input
                  type="text"
                  value={formConfig.announcement}
                  onChange={(e) => setFormConfig({ ...formConfig, announcement: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

            </div>

            {/* Feature Toggles */}
            <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Maintenance Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-200 block">STATUS MAINTENANCE</span>
                  <span className="text-[11px] text-slate-500">Kunci akses pengunjung</span>
                </div>
                <input
                  type="checkbox"
                  checked={formConfig.maintenanceMode}
                  onChange={(e) => setFormConfig({ ...formConfig, maintenanceMode: e.target.checked })}
                  className="w-5 h-5 accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Verif Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-200 block">MENU VERIF AKTIF</span>
                  <span className="text-[11px] text-slate-500">Aktifkan request Gmail</span>
                </div>
                <input
                  type="checkbox"
                  checked={formConfig.verifActive}
                  onChange={(e) => setFormConfig({ ...formConfig, verifActive: e.target.checked })}
                  className="w-5 h-5 accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Bulk Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-200 block">MENU BULK AKTIF</span>
                  <span className="text-[11px] text-slate-500">Aktifkan request bulk</span>
                </div>
                <input
                  type="checkbox"
                  checked={formConfig.bulkActive}
                  onChange={(e) => setFormConfig({ ...formConfig, bulkActive: e.target.checked })}
                  className="w-5 h-5 accent-cyan-500 cursor-pointer"
                />
              </div>

            </div>

          </div>
        </form>
      )}

      {/* TAB 4: API & ERROR LOGS */}
      {adminTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <h4 className="text-sm font-bold font-tech uppercase text-slate-200">
                TELEMETRI & LOG BACKEND PROXY
              </h4>
              <p className="text-xs text-slate-400">
                Memantau status HTTP, error upstream, dan response time request backend.
              </p>
            </div>
            <button
              onClick={fetchApiLogs}
              className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLogsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">TIMESTAMP</th>
                    <th className="py-3 px-4">METHOD</th>
                    <th className="py-3 px-4">ENDPOINT</th>
                    <th className="py-3 px-4">HTTP STATUS</th>
                    <th className="py-3 px-4">DURATION</th>
                    <th className="py-3 px-4">MESSAGE / DETAIL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {apiLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                        Belum ada catatan log error/API terbaru.
                      </td>
                    </tr>
                  ) : (
                    apiLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-bold text-cyan-300">
                          {log.method}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-purple-300">
                          {log.endpoint}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${
                            log.status < 400 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                          {log.durationMs} ms
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                          {log.message}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: QUICK API TESTER */}
      {adminTab === 'tester' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Test Send */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h4 className="text-base font-bold font-tech uppercase text-cyan-400 flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span>TEST ENDPOINT /api/send</span>
            </h4>
            <p className="text-xs text-slate-400">
              Kirim request uji coba ke backend proxy verifikasi.
            </p>
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">EMAIL UJI COBA</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 outline-none"
              />
            </div>
            <button
              onClick={() => runDirectTest('verif')}
              disabled={isTesting}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {isTesting ? 'MENGUJI...' : 'EKSEKUSI TEST VERIF'}
            </button>
          </div>

          {/* Test Bulk */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h4 className="text-base font-bold font-tech uppercase text-purple-400 flex items-center gap-2">
              <Play className="w-4 h-4" />
              <span>TEST ENDPOINT /api/bulk</span>
            </h4>
            <p className="text-xs text-slate-400">
              Kirim request uji coba ke backend proxy bulk.
            </p>
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">JUMLAH BATCH</label>
              <input
                type="number"
                min="1"
                max={5}
                value={testBulkTotal}
                onChange={(e) => setTestBulkTotal(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 outline-none"
              />
            </div>
            <button
              onClick={() => runDirectTest('bulk')}
              disabled={isTesting}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {isTesting ? 'MENGUJI...' : 'EKSEKUSI TEST BULK'}
            </button>
          </div>

          {/* Test Response Viewer */}
          {testResponse && (
            <div className="md:col-span-2 p-5 rounded-2xl bg-black/90 border border-slate-800 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-slate-400">
                <span className="text-cyan-400">RAW_TEST_RESPONSE</span>
                <span>STATUS: {testResponse.status || 'N/A'}</span>
              </div>
              <pre className="text-slate-300 overflow-x-auto p-2 bg-slate-950 rounded-lg">
                {JSON.stringify(testResponse, null, 2)}
              </pre>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
