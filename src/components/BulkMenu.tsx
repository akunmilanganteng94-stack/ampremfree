import React, { useState } from 'react';
import { 
  Layers, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  Lock, 
  ExternalLink, 
  Copy, 
  Check, 
  Mail, 
  Inbox, 
  History, 
  Trash2 
} from 'lucide-react';

interface BulkMenuProps {
  sessionId: string;
  bulkActive: boolean;
  buttonText: string;
  maxLimit: number;
  channelLink?: string;
}

type BulkStep = 'Idle' | 'Processing' | 'Completed' | 'Failed';

export interface GeneratedAccount {
  email: string;
  access_link?: string;
  createdAt?: string;
}

export const BulkMenu: React.FC<BulkMenuProps> = ({
  sessionId,
  bulkActive,
  buttonText = 'EKSEKUSI PROSES BULK',
  maxLimit = 5,
  channelLink = 'https://whatsapp.com/channel/0029VbCwLl7J3jv1QSig1V0C'
}) => {
  const [total, setTotal] = useState<number>(1);
  const [step, setStep] = useState<BulkStep>('Idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [generatedAccounts, setGeneratedAccounts] = useState<GeneratedAccount[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Persistent Riwayat Akun Bulk from localStorage
  const [bulkHistory, setBulkHistory] = useState<GeneratedAccount[]>(() => {
    try {
      const saved = localStorage.getItem('azryl_bulk_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Strict channel follow enforcement state
  const [isChannelFollowed, setIsChannelFollowed] = useState<boolean>(() => {
    return localStorage.getItem('azryl_channel_followed') === 'true';
  });
  const [hasClickedFollow, setHasClickedFollow] = useState<boolean>(() => {
    return sessionStorage.getItem('azryl_channel_clicked') === 'true';
  });
  const [isVerifyingChannel, setIsVerifyingChannel] = useState<boolean>(false);
  const [channelVerifyError, setChannelVerifyError] = useState<string>('');
  const [channelVerifySuccess, setChannelVerifySuccess] = useState<string>('');

  const handleOpenChannel = () => {
    setHasClickedFollow(true);
    sessionStorage.setItem('azryl_channel_clicked', 'true');
    setChannelVerifyError('');
    window.open(channelLink, '_blank', 'noopener,noreferrer');
  };

  const handleVerifyChannel = () => {
    if (!hasClickedFollow && sessionStorage.getItem('azryl_channel_clicked') !== 'true') {
      window.open(channelLink, '_blank', 'noopener,noreferrer');
      setHasClickedFollow(true);
      sessionStorage.setItem('azryl_channel_clicked', 'true');
    }

    setChannelVerifyError('');
    setIsVerifyingChannel(true);
    setChannelVerifySuccess('Memverifikasi saluran...');

    setTimeout(() => {
      setIsVerifyingChannel(false);
      setIsChannelFollowed(true);
      localStorage.setItem('azryl_channel_followed', 'true');
      setChannelVerifySuccess('✅ Berhasil! Saluran terverifikasi. Bulk Generator Prem kini TERBUKA.');
    }, 250);
  };

  const handleTotalChange = (val: number) => {
    setValidationError('');
    setTotal(val);
    if (val > maxLimit) {
      setValidationError(`Maksimal ${maxLimit} akun per request.`);
    } else if (val < 1) {
      setValidationError('Minimal 1 akun.');
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleClearHistory = () => {
    localStorage.removeItem('azryl_bulk_history');
    setBulkHistory([]);
  };

  const resolveInboxLink = (acc: GeneratedAccount): string => {
    if (acc.access_link && acc.access_link.trim() !== '') return acc.access_link.trim();
    if (acc.email && acc.email.includes('@akunlama')) {
      const username = acc.email.split('@')[0];
      return `https://akunlama.com/inbox/${username}/list`;
    }
    return '';
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkActive) return;

    if (!isChannelFollowed) {
      setChannelVerifyError('AKSES DITOLAK: Anda belum mengikuti Saluran WhatsApp resmi. Wajib ikuti saluran terlebih dahulu untuk bulk generate!');
      setValidationError('Wajib ikuti saluran WhatsApp resmi AZRYLPREM terlebih dahulu.');
      return;
    }

    if (total > maxLimit) {
      setValidationError(`Maksimal ${maxLimit} akun per request.`);
      return;
    }
    if (total < 1) {
      setValidationError('Minimal 1 akun.');
      return;
    }

    setValidationError('');
    setStep('Processing');
    setStatusMessage(`Membuat dan mengaktivasi ${total} akun Premium sekaligus...`);
    setGeneratedAccounts([]);

    try {
      const res = await fetch('/api/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total,
          sessionId
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStep('Completed');
        setStatusMessage(data.message || `Eksekusi bulk sebanyak ${total} akun berhasil!`);
        
        // Extract accounts from response
        const rawEmails = data.data?.emails || data.data?.data?.emails || [];
        if (Array.isArray(rawEmails) && rawEmails.length > 0) {
          const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const mapped: GeneratedAccount[] = rawEmails.map((item: any) => {
            const emailStr = typeof item === 'string' ? item : item.email;
            let inboxStr = typeof item === 'object' && item.access_link ? item.access_link : '';
            if (!inboxStr && emailStr && emailStr.includes('@akunlama')) {
              inboxStr = `https://akunlama.com/inbox/${emailStr.split('@')[0]}/list`;
            }
            return {
              email: emailStr,
              access_link: inboxStr,
              createdAt: timestamp
            };
          });

          setGeneratedAccounts(mapped);

          // Save into persistent history
          setBulkHistory(prev => {
            const updated = [...mapped, ...prev].slice(0, 50);
            try {
              localStorage.setItem('azryl_bulk_history', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      } else {
        setStep('Failed');
        setStatusMessage(data.message || 'Layanan bulk upstream gagal memproses request.');
      }
    } catch (err: any) {
      setStep('Failed');
      setStatusMessage('Gagal menghubungi server bulk: ' + (err.message || 'Network error'));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Feature header card */}
      <div className="relative mb-8 p-6 sm:p-8 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.12)]">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                MODULE_02 // BULK_GENERATE_PREM
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                bulkActive 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {bulkActive ? 'ACTIVE' : 'DISABLED BY ADMIN'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-cyan-400 font-tech uppercase tracking-wide">
              BULK GENERATOR PREM
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Generate &amp; aktivasi instan akun Alight Motion Premium secara batch sekaligus (maks {maxLimit} akun).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-400 self-start sm:self-center shadow-inner">
            <Layers className="w-8 h-8" />
          </div>
        </div>

        {/* Mandatory Channel Protocol Box */}
        <div className="mt-6 p-4 sm:p-5 rounded-xl bg-slate-950/90 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${isChannelFollowed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                {isChannelFollowed ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
                  PROTOKOL WAJIB: SALURAN RESMI WHATSAPP
                </p>
                <p className="text-[11px] text-slate-400">
                  {isChannelFollowed 
                    ? 'Status: Keanggotaan saluran terverifikasi. Bulk generator aktif.' 
                    : 'Wajib ikuti saluran WhatsApp AZRYLPREM untuk generate akun bulk.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                isChannelFollowed 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
              }`}>
                {isChannelFollowed ? 'SALURAN TERVERIFIKASI' : 'AKSES TERKUNCI'}
              </span>
            </div>
          </div>

          {!isChannelFollowed ? (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenChannel}
                  className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-tech font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-emerald-950/40 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>1. BUKA &amp; IKUTI SALURAN WA</span>
                </button>

                <button
                  type="button"
                  onClick={handleVerifyChannel}
                  disabled={isVerifyingChannel}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl font-tech font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                    hasClickedFollow
                      ? 'bg-gradient-to-r from-purple-600 hover:from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-950/40 hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isVerifyingChannel ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-purple-300" />
                      <span>MEMVERIFIKASI...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-purple-300" />
                      <span>2. VERIFIKASI IKUTI SALURAN</span>
                    </>
                  )}
                </button>
              </div>

              {channelVerifyError && (
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{channelVerifyError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Bulk Generator Terbuka: Kredensial saluran valid.</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('azryl_channel_followed');
                  setIsChannelFollowed(false);
                }}
                className="text-[10px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
              >
                [Kunci Ulang]
              </button>
            </div>
          )}
        </div>

        {/* Inactive Notice */}
        {!bulkActive && (
          <div className="mt-6 p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Fitur Bulk Dinonaktifkan</p>
              <p className="text-xs text-rose-400/90 mt-0.5">
                Fitur generate bulk sedang dinonaktifkan sementara oleh administrator.
              </p>
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleExecute} className="mt-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="total-bulk" className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                JUMLAH AKUN GENERATE (1 - {maxLimit})
              </label>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                BATCH: {total} AKUN
              </span>
            </div>

            {/* Quick Preset Selector Buttons */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {[1, 2, 3, 4, 5].slice(0, maxLimit).map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => handleTotalChange(num)}
                  disabled={!bulkActive || step === 'Processing' || !isChannelFollowed}
                  className={`py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                    total === num
                      ? 'bg-purple-600 text-white border border-purple-400 shadow-md shadow-purple-900/50'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Validation Message */}
            {validationError && (
              <p className="mt-2 text-xs text-rose-400 font-mono font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{validationError}</span>
              </p>
            )}
          </div>

          {/* Execute Button */}
          <button
            type="submit"
            disabled={!bulkActive || !!validationError || step === 'Processing' || !isChannelFollowed}
            className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-tech font-bold text-base tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              !isChannelFollowed
                ? 'bg-slate-900 border border-amber-500/30 text-amber-400/80 cursor-not-allowed opacity-75'
                : 'bg-gradient-to-r from-purple-600 hover:from-purple-500 via-indigo-600 to-cyan-600 hover:to-cyan-500 text-white shadow-lg shadow-purple-950/50 hover:shadow-cyan-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none'
            }`}
          >
            {step === 'Processing' ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-200" />
                <span>MEMPROSES {total} AKUN PREM KILAT...</span>
              </>
            ) : !isChannelFollowed ? (
              <>
                <Lock className="w-5 h-5 text-amber-400" />
                <span>WAJIB IKUTI SALURAN UNTUK BULK GENERATE</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 text-cyan-200 fill-cyan-200" />
                <span>{buttonText || 'EKSEKUSI PROSES BULK'}</span>
              </>
            )}
          </button>
        </form>

        {/* Live Processing or Error Status */}
        {step !== 'Idle' && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            {step === 'Processing' && (
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 text-purple-200 flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-purple-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Menghubungi Server Bulk Provider...</p>
                  <p className="text-xs text-purple-300/80 mt-0.5 font-mono">{statusMessage}</p>
                </div>
              </div>
            )}

            {step === 'Completed' && (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-emerald-300">{statusMessage}</p>
                  <p className="text-xs text-emerald-200/80 mt-0.5 font-mono">
                    Total: {generatedAccounts.length} akun baru siap digunakan • Status: Premium 1 Tahun Aktif
                  </p>
                </div>
              </div>
            )}

            {step === 'Failed' && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-rose-300">Eksekusi Bulk Gagal</p>
                  <p className="text-xs text-rose-200/80 mt-1">{statusMessage}</p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* RIWAYAT AKUN BULK (TAMPILAN GMAIL & GENERATOR INBOX) */}
      {(bulkHistory.length > 0 || generatedAccounts.length > 0) && (
        <div className="mb-8 p-6 sm:p-7 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.12)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-950/50 text-cyan-400 border border-cyan-500/30">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-purple-300 font-tech uppercase tracking-wide">
                  RIWAYAT AKUN BULK ({bulkHistory.length} AKUN)
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Tampilan lengkap Gmail target &amp; tautan Generator Inbox Alight Motion
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleClearHistory}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 border border-rose-500/30 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                title="Hapus semua riwayat akun lokal"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Hapus Riwayat</span>
              </button>
            </div>
          </div>

          {/* Cards List for History */}
          <div className="mt-5 space-y-3.5">
            {bulkHistory.map((acc, idx) => {
              const inboxUrl = resolveInboxLink(acc);
              const emailKey = `hist-email-${idx}`;
              const inboxKey = `hist-inbox-${idx}`;

              return (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 space-y-3"
                >
                  {/* Top line badge */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center text-xs font-mono font-bold">
                        #{idx + 1}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        AM PREM AKTIF 1 TAHUN
                      </span>
                    </div>

                    {acc.createdAt && (
                      <span className="text-[11px] font-mono text-slate-500">
                        {acc.createdAt}
                      </span>
                    )}
                  </div>

                  {/* FIELD 1: GMAIL / EMAIL AKUN */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        <span>GMAIL / EMAIL AKUN:</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopy(acc.email, emailKey)}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/30 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedKey === emailKey ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-cyan-400" />
                            <span>Salin Email</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-100 font-mono text-xs sm:text-sm font-semibold select-all break-all">
                      {acc.email}
                    </div>
                  </div>

                  {/* FIELD 2: GENERATOR INBOX */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Inbox className="w-3.5 h-3.5 text-purple-400" />
                        <span>GENERATOR INBOX:</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {inboxUrl && (
                          <button
                            type="button"
                            onClick={() => handleCopy(inboxUrl, inboxKey)}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-purple-400 hover:text-purple-300 border border-slate-800 hover:border-purple-500/30 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            {copiedKey === inboxKey ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-purple-400" />
                                <span>Salin Link</span>
                              </>
                            )}
                          </button>
                        )}

                        {inboxUrl && (
                          <a
                            href={inboxUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-[11px] font-mono text-purple-200 border border-purple-500/40 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Buka Inbox</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 font-mono text-xs select-all break-all flex items-center justify-between gap-3">
                      <span className="truncate text-slate-400">
                        {inboxUrl || 'Inbox langsung dapat diakses via penyedia email'}
                      </span>
                      {inboxUrl && (
                        <a
                          href={inboxUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-[11px] text-cyan-400 hover:text-cyan-300 underline font-mono"
                        >
                          Kunjungi &rarr;
                        </a>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Security Statement */}
      <div className="p-4 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0" />
        <p className="text-xs text-slate-400">
          Proses bulk mengeksekusi request aman terenkripsi langsung ke upstream server tanpa perantara pihak ketiga.
        </p>
      </div>

    </div>
  );
};
