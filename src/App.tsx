import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth, verifyAdminStatus, testFirestoreConnection } from './firebase';
import { CyberBackground } from './components/CyberBackground';
import { ChannelGate } from './components/ChannelGate';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { VerifMenu } from './components/VerifMenu';
import { BulkMenu } from './components/BulkMenu';
import { ActivityFeed } from './components/ActivityFeed';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { WebsiteConfig, SiteStats } from './types';
import { Sparkles, Terminal } from 'lucide-react';

const DEFAULT_CONFIG: WebsiteConfig = {
  siteName: 'AZRYLPREM',
  description: 'AZRYLPREM - Modern, Futuristic, Dark-Tech Premium Utility Platform with Verif, Bulk, and Admin Control Center.',
  maintenanceMode: false,
  channelLink: 'https://whatsapp.com/channel/0029VbCwLl7J3jv1QSig1V0C',
  adminWaLink: 'https://wa.me/6285199219856',
  verifButtonText: 'KIRIM KONFIRMASI',
  bulkButtonText: 'EKSEKUSI PROSES BULK',
  maxBulkLimit: 5,
  verifActive: true,
  bulkActive: true,
  announcement: 'SYSTEM ONLINE • SELAMAT DATANG DI AZRYLPREM TERMINAL v2.5.0',
  announcementActive: true,
  updatedAt: new Date().toISOString()
};

const DEFAULT_STATS: SiteStats = {
  totalVisitors: 142,
  activeUsers: 8,
  verifRequests: 68,
  bulkRequests: 45,
  successfulRequests: 106,
  failedRequests: 7,
  todayActivity: 113,
  lastUpdated: new Date().toISOString()
};

export default function App() {
  // Session ID generation (anonymized)
  const [sessionId, setSessionId] = useState<string>('SES-INIT');
  const [hasClearedGate, setHasClearedGate] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'home' | 'verif' | 'bulk' | 'activity'>('home');
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  // Live Website Config & Stats
  const [config, setConfig] = useState<WebsiteConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<SiteStats>(DEFAULT_STATS);

  // Initialize Session & URL Check
  useEffect(() => {
    // Generate or retrieve persistent anonymous session
    let existingSession = sessionStorage.getItem('azryl_session_id');
    if (!existingSession) {
      const randHex = Math.random().toString(16).substring(2, 8).toUpperCase();
      existingSession = `SES-${randHex}`;
      sessionStorage.setItem('azryl_session_id', existingSession);
    }
    setSessionId(existingSession);

    // Check Gate Status
    const gateCleared = localStorage.getItem('azryl_gate_cleared');
    if (gateCleared === 'true') {
      setHasClearedGate(true);
    }

    // Check Secret Admin Route
    const checkIsAdminPath = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      return (
        path.startsWith('/admin') ||
        path.startsWith('/azryl-admin') ||
        hash === '#admin' ||
        hash === '#azryl-admin' ||
        search.includes('admin')
      );
    };

    if (checkIsAdminPath()) {
      setIsAdminView(true);
    }

    const handlePopState = () => {
      setIsAdminView(checkIsAdminPath());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    // Secret keyboard shortcut: Ctrl+Shift+A or Cmd+Shift+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminView(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Initial ping to backend
    fetch('/api/stats/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: existingSession })
    }).catch(() => {});

    // Initial stats fetch
    fetch('/api/stats')
      .then(res => res.json())
      .then(d => {
        if (d.success && d.data) setStats(d.data);
      })
      .catch(() => {});

    // Initial config fetch from backend
    fetch('/api/config')
      .then(res => res.json())
      .then(d => {
        if (d.success && d.data) setConfig(d.data);
      })
      .catch(() => {});

    // Test Firestore connectivity
    testFirestoreConnection();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Listen for Firebase Auth state to detect admin status
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      const isAdm = await verifyAdminStatus(user);
      setIsAdminLoggedIn(isAdm);
    });
    return () => unsub();
  }, []);

  // Real-time Firestore sync for website settings
  useEffect(() => {
    try {
      const docRef = doc(db, 'settings', 'config');
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data() as WebsiteConfig;
          setConfig(prev => ({
            ...prev,
            ...remoteData
          }));
        }
      }, (error) => {
        console.warn('Realtime config snapshot listener:', error);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore snapshot setup skipped:', err);
    }
  }, []);

  // Gate Unlock Handler
  const handleUnlockGate = () => {
    localStorage.setItem('azryl_gate_cleared', 'true');
    setHasClearedGate(true);

    // Log gate verification
    fetch('/api/log-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        action: 'CHANNEL_GATE_VERIFIED',
        feature: 'GATE',
        status: 'Success',
        responseTime: 100
      })
    }).catch(() => {});
  };

  // Switch to Admin View
  const handleOpenAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setIsAdminView(true);
  };

  // Back to Main App
  const handleBackToApp = () => {
    window.history.pushState({}, '', '/');
    setIsAdminView(false);
  };

  // Update config from Admin panel
  const handleUpdateConfig = (newConfig: WebsiteConfig) => {
    setConfig(newConfig);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col relative selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Decorative Matrix / Cyber Code Background */}
      <CyberBackground />

      {/* ADMIN CONTROL CENTER VIEW */}
      {isAdminView ? (
        <div className="relative z-10 flex-1">
          <Navbar 
            activeTab={activeTab}
            setActiveTab={(tab) => {
              handleBackToApp();
              setActiveTab(tab);
            }}
            adminWaLink={config.adminWaLink}
            onOpenAdmin={handleOpenAdmin}
            isAdminLoggedIn={isAdminLoggedIn}
          />
          <AdminPanel 
            onBackToApp={handleBackToApp}
            config={config}
            onUpdateConfig={handleUpdateConfig}
            stats={stats}
          />
          <Footer 
            channelLink={config.channelLink}
            adminWaLink={config.adminWaLink}
            onOpenAdmin={handleOpenAdmin}
          />
        </div>
      ) : !hasClearedGate ? (
        /* CHANNEL GATE VIEW (First-time visitors) */
        <ChannelGate 
          channelUrl={config.channelLink}
          onUnlocked={handleUnlockGate}
        />
      ) : config.maintenanceMode && !isAdminLoggedIn ? (
        /* MAINTENANCE SCREEN VIEW */
        <MaintenanceScreen 
          adminWaLink={config.adminWaLink}
          onAdminBypass={handleOpenAdmin}
        />
      ) : (
        /* REGULAR USER DASHBOARD VIEW (NO LOGIN REQUIRED) */
        <div className="relative z-10 flex-1 flex flex-col justify-between">
          
          <div>
            {/* Top Navigation */}
            <Navbar 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              adminWaLink={config.adminWaLink}
              onOpenAdmin={handleOpenAdmin}
              isAdminLoggedIn={isAdminLoggedIn}
            />

            {/* Announcement Broadcast Banner (Admin Controlled) */}
            {config.announcementActive && config.announcement && (
              <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-purple-950/60 border-b border-cyan-500/20 py-2 px-4 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-cyan-300 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 animate-pulse" />
                    <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200">
                      INFO
                    </span>
                    <span className="truncate">{config.announcement}</span>
                  </div>
                  <span className="hidden sm:inline text-[10px] text-slate-500">
                    SES: {sessionId}
                  </span>
                </div>
              </div>
            )}

            {/* Main Content by Tab */}
            <main>
              {activeTab === 'home' && (
                <HomeDashboard 
                  config={config}
                  stats={stats}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === 'verif' && (
                <VerifMenu 
                  sessionId={sessionId}
                  verifActive={config.verifActive}
                  buttonText={config.verifButtonText}
                  channelLink={config.channelLink}
                />
              )}

              {activeTab === 'bulk' && (
                <BulkMenu 
                  sessionId={sessionId}
                  bulkActive={config.bulkActive}
                  maxLimit={config.maxBulkLimit || 5}
                  buttonText={config.bulkButtonText}
                  channelLink={config.channelLink}
                />
              )}

              {activeTab === 'activity' && (
                <ActivityFeed />
              )}
            </main>
          </div>

          {/* Footer */}
          <Footer 
            channelLink={config.channelLink}
            adminWaLink={config.adminWaLink}
            onOpenAdmin={handleOpenAdmin}
          />

        </div>
      )}

    </div>
  );
}
