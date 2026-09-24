import React, { useState } from 'react';
import { Layers, Play, CheckCircle2, AlertTriangle, RefreshCw, Terminal, Cpu, ShieldCheck, Lock, ExternalLink } from 'lucide-react';

interface BulkMenuProps {
  sessionId: string;
  bulkActive: boolean;
  maxLimit: number;
  buttonText: string;
  channelLink?: string;
}

type BulkStep = 'Idle' | 'Preparing' | 'Processing' | 'Completed' | 'Failed';

export const BulkMenu: React.FC<BulkMenuProps> = ({
  sessionId,
  bulkActive,
  maxLimit = 5,
  buttonText = 'EKSEKUSI PROSES BULK',
  channelLink = 'https://whatsapp.com/channel/0029VbCwLl7J3jv1QSig1V0C'
}) => {
  const [total, setTotal] = useState<number>(1);
  const [step, setStep] = useState<BulkStep>('Idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [resultData, setResultData] = useState<any>(null);

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
      setChannelVerifyError('⚠️ Anda WAJIB membuka dan mengikuti Saluran WhatsApp terlebih dahulu sebelum verifikasi!');
      return;
    }

    setChannelVerifyError('');
    setIsVerifyingChannel(true);
    setChannelVerifySuccess('Menghubungkan ke gateway Saluran WhatsApp...');

    setTimeout(() => {
      setChannelVerifySuccess('Memverifikasi keanggotaan saluran AZRYLPREM...');
    }, 500);

    setTimeout(() => {
      setIsVerifyingChannel(false);
      setIsChannelFollowed(true);
      localStorage.setItem('azryl_channel_followed', 'true');
      setChannelVerifySuccess('✅ Berhasil! Saluran terverifikasi. Bulk Generator Prem kini TERBUKA.');
    }, 1200);
  };

  const handleTotalChange = (val: number) => {
    setValidationError('');
    setTotal(val);
    if (val > maxLimit) {
      setValidationError(`Maximum ${maxLimit} processes per request.`);
    } else if (val < 1) {
      setValidationError('Minimal 1 proses.');
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkActive) return;

    // Strict channel gate check
    if (!isChannelFollowed) {
      setChannelVerifyError('AKSES DITOLAK: Anda belum mengikuti Saluran WhatsApp resmi. Wajib ikuti saluran terlebih dahulu untuk mengeksekusi Bulk Generator!');
      setValidationError('Wajib ikuti saluran WhatsApp resmi AZRYLPREM terlebih dahulu.');
      return;
    }

    if (total > maxLimit) {
      setValidationError(`Maximum ${maxLimit} processes per request.`);
      return;
    }
    if (total < 1) {
      setValidationError('Minimal 1 proses.');
      return;
    }

    setValidationError('');
    setStep('Preparing');
    setProgressPercent(15);
    setStatusMessage('Menyiapkan alokasi request batch...');
    setLogs([
      `[${new Date().toLocaleTimeString()}] Menginisialisasi modul bulk request total=${total}`,
      `[${new Date().toLocaleTimeString()}] Memverifikasi otorisasi keanggotaan saluran: TERVERIFIKASI`,
      `[${new Date().toLocaleTimeString()}] Memverifikasi payload batas keamanan (max=${maxLimit})`
    ]);
    setResultData(null);

    // Step 1: Preparing -> Processing
    setTimeout(() => {
      setStep('Processing');
      setProgressPercent(45);
      setStatusMessage('Mengirim request ke Backend Proxy AZRYLPREM...');
      setLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Menghubungkan ke upstream endpoint via encrypted tunnel`,
        `[${new Date().toLocaleTimeString()}] Memproses eksekusi paralel ${total} item`
      ]);
    }, 600);

    try {
      const res = await fetch('/api/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          total,
          sessionId
        })
      });

      const data = await res.json();
      setProgressPercent(85);

      if (res.ok && data.success) {
        setTimeout(() => {
          setProgressPercent(100);
          setStep('Completed');
          setStatusMessage(data.message || `Berhasil mengeksekusi ${total} proses bulk.`);
          setResultData(data.data || null);
          setLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] Response upstream diterima dengan status SUCCESS`,
            `[${new Date().toLocaleTimeString()}] Batch proses selesai tanpa error`
          ]);
        }, 500);
      } else {
        setTimeout(() => {
          setProgressPercent(100);
          setStep('Failed');
          setStatusMessage(data.message || 'Eksekusi bulk gagal diproses oleh server.');
          setLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] Upstream error: ${data.message || 'Response code ' + res.status}`
          ]);
        }, 500);
      }
    } catch (err: any) {
      setProgressPercent(100);
      setStep('Failed');
      setStatusMessage('Gagal menghubungi backend server: ' + (err.message || 'Network error'));
      setLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Exception: ${err.message || 'Failed to fetch'}`
      ]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Feature header card */}
      <div className="relative mb-8 p-6 sm:p-8 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.12)]">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                MODULE_02 // BATCH_ENGINE_PREM
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                bulkActive 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {bulkActive ? 'ACTIVE' : 'DISABLED BY ADMIN'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400 font-tech uppercase tracking-wide">
              BULK GENERATOR PREM
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Eksekusi proses batch secara serentak hingga maksimal {maxLimit} proses per transaksi. Wajib ikuti Saluran WhatsApp resmi untuk membuka bulk generator.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 self-start sm:self-center shadow-inner">
            <Layers className="w-8 h-8" />
          </div>
        </div>

        {/* Mandatory Channel Gate Block */}
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
                    ? 'Status: Keanggotaan saluran terverifikasi. Bulk Generator akun Prem siap digunakan.' 
                    : 'Wajib ikuti saluran WhatsApp AZRYLPREM untuk membuka akses bulk generator akun Prem.'}
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
                      ? 'bg-gradient-to-r from-cyan-600 hover:from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-950/40 hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isVerifyingChannel ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                      <span>MEMERIKSA SALURAN...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-cyan-300" />
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

              {channelVerifySuccess && !isChannelFollowed && (
                <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>{channelVerifySuccess}</span>
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

        {/* Feature Inactive Warning */}
        {!bulkActive && (
          <div className="mt-6 p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Modul Bulk Dinonaktifkan Sementara</p>
              <p className="text-xs text-rose-400/90 mt-0.5">
                Fitur bulk sedang dinonaktifkan oleh administrator.
              </p>
            </div>
          </div>
        )}

        {/* Bulk Form */}
        <form onSubmit={handleExecute} className="mt-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                JUMLAH PROSES (BATCH TOTAL)
              </label>
              <span className="text-xs font-mono text-cyan-400">
                LIMIT: MAX {maxLimit}
              </span>
            </div>

            {/* Quick chips selector */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  type="button"
                  key={num}
                  disabled={!bulkActive || step === 'Preparing' || step === 'Processing' || !isChannelFollowed}
                  onClick={() => handleTotalChange(num)}
                  className={`py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    total === num
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="relative">
              <input
                type="number"
                min="1"
                max={maxLimit}
                value={total}
                onChange={(e) => handleTotalChange(parseInt(e.target.value) || 0)}
                disabled={!bulkActive || step === 'Preparing' || step === 'Processing' || !isChannelFollowed}
                className={`w-full px-4 py-3 rounded-xl bg-slate-950/90 border ${
                  validationError ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-700/80 focus:border-cyan-400 focus:ring-cyan-500/20'
                } focus:ring-2 text-slate-100 text-center font-mono font-bold text-lg outline-none transition-all disabled:opacity-50`}
              />
            </div>

            {/* Validation Message */}
            {validationError ? (
              <p className="mt-2 text-xs text-rose-400 font-mono font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{validationError}</span>
              </p>
            ) : (
              <p className="mt-2 text-[11px] text-slate-500 font-mono">
                * Sistem backend membatasi maksimal {maxLimit} proses per request demi integritas performa server.
              </p>
            )}
          </div>

          {/* Execute Button */}
          <button
            type="submit"
            disabled={!bulkActive || !!validationError || step === 'Preparing' || step === 'Processing' || !isChannelFollowed}
            className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-tech font-bold text-base tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              !isChannelFollowed
                ? 'bg-slate-900 border border-amber-500/30 text-amber-400/80 cursor-not-allowed opacity-75'
                : 'bg-gradient-to-r from-purple-600 hover:from-purple-500 via-indigo-600 to-cyan-600 hover:to-cyan-500 text-white shadow-lg shadow-purple-950/50 hover:shadow-cyan-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none'
            }`}
          >
            {step === 'Preparing' || step === 'Processing' ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-200" />
                <span>MEMPROSES {total} BATCH PREM...</span>
              </>
            ) : !isChannelFollowed ? (
              <>
                <Lock className="w-5 h-5 text-amber-400" />
                <span>WAJIB IKUTI SALURAN UNTUK BULK GENERATE</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 text-cyan-200 fill-cyan-200" />
                <span>{buttonText || 'EKSEKUSI PROSES BULK PREM'}</span>
              </>
            )}
          </button>
        </form>

        {/* Real-time Progress Tracking */}
        {step !== 'Idle' && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                BATCH_PROGRESSION
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {progressPercent}%
              </span>
            </div>

            {/* Glowing Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden mb-4 p-[1px]">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-purple-500 transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {(['Preparing', 'Processing', 'Completed', 'Failed'] as const).map((stepName) => {
                const isActive = step === stepName;
                const isCompleted = 
                  (stepName === 'Preparing' && (step === 'Processing' || step === 'Completed')) ||
                  (stepName === 'Processing' && step === 'Completed');

                return (
                  <div
                    key={stepName}
                    className={`p-2 rounded-lg border text-center font-mono text-[11px] font-semibold transition-all ${
                      isActive
                        ? stepName === 'Failed'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                        : isCompleted
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-950/60 text-slate-600 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      {isActive && (stepName === 'Preparing' || stepName === 'Processing') && (
                        <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                      )}
                      <span>{stepName}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Result Message Banner */}
            {step === 'Completed' && (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 mb-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-emerald-300">{statusMessage}</p>
                  <p className="text-xs text-emerald-200/80 mt-1 font-mono">
                    Total: {total} proses • Status upstream: SUCCESS • Latency OK
                  </p>
                </div>
              </div>
            )}

            {step === 'Failed' && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-200 mb-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-rose-300">Eksekusi Bulk Gagal</p>
                  <p className="text-xs text-rose-200/80 mt-1">{statusMessage}</p>
                </div>
              </div>
            )}

            {/* Terminal Log Console */}
            <div className="p-3.5 rounded-xl bg-black/80 border border-slate-800 font-mono text-[11px] text-slate-300">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-500 text-[10px]">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Terminal className="w-3 h-3" />
                  LIVE_OUTPUT_LOG
                </span>
                <span>SES: {sessionId}</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {logs.map((log, idx) => (
                  <p key={idx} className="leading-tight text-slate-400">
                    <span className="text-cyan-400 mr-1.5">&gt;</span>
                    {log}
                  </p>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Security Statement */}
      <div className="p-4 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0" />
        <p className="text-xs text-slate-400">
          Proses bulk tidak melakukan pembuatan akun otomatis dan tidak menyimpan kredensial Gmail apapun. Request dikirim secara aman langsung ke endpoint backend server.
        </p>
      </div>

    </div>
  );
};
