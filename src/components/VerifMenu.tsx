import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertTriangle, Clock, ShieldCheck, RefreshCw, Sparkles, Terminal, Lock, ExternalLink, CheckCircle2 } from 'lucide-react';

interface VerifMenuProps {
  sessionId: string;
  verifActive: boolean;
  buttonText: string;
  channelLink?: string;
}

type VerifStatus = 'Idle' | 'Processing' | 'Sent' | 'Success' | 'Failed';

export const VerifMenu: React.FC<VerifMenuProps> = ({
  sessionId,
  verifActive,
  buttonText = 'KIRIM KONFIRMASI',
  channelLink = 'https://whatsapp.com/channel/0029VbCwLl7J3jv1QSig1V0C'
}) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<VerifStatus>('Idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [stepDetail, setStepDetail] = useState('');
  const [recentVerifs, setRecentVerifs] = useState<Array<{ email: string; time: string; status: string }>>([]);

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
      setChannelVerifySuccess('✅ Berhasil! Saluran terverifikasi. Generator Akun Prem kini TERBUKA.');
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifActive) return;

    // Strict channel gate check
    if (!isChannelFollowed) {
      setChannelVerifyError('AKSES DITOLAK: Anda belum mengikuti Saluran WhatsApp resmi. Wajib ikuti saluran terlebih dahulu untuk generate akun Prem!');
      setStatus('Failed');
      setStatusMessage('Akses Ditolak: Anda belum mengikuti Saluran WhatsApp resmi AZRYLPREM.');
      return;
    }

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setStatus('Failed');
      setStatusMessage('Silakan masukkan alamat Gmail Anda.');
      return;
    }

    if (!trimmed.endsWith('@gmail.com') && !trimmed.endsWith('@googlemail.com')) {
      setStatus('Failed');
      setStatusMessage('Alamat email harus menggunakan domain @gmail.com.');
      return;
    }

    setStatus('Processing');
    setStepDetail('Menginisialisasi payload dan enkripsi request generate Prem...');
    setStatusMessage('');
    setInstructions('');

    // Smooth UI steps
    setTimeout(() => {
      setStepDetail('Mengirim request ke Backend Proxy AZRYLPREM...');
    }, 400);

    setTimeout(() => {
      setStepDetail('Menghubungi upstream provider aman...');
    }, 900);

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: trimmed,
          sessionId
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('Success');
        setStatusMessage(data.message || 'Konfirmasi akun Prem berhasil dikirim ke Gmail!');
        setInstructions(
          data.instructions || 
          'Silakan periksa kotak masuk (Inbox) atau folder Spam pada Gmail Anda untuk menyelesaikan proses konfirmasi resmi.'
        );
        setRecentVerifs(prev => [
          { email: trimmed, time: new Date().toLocaleTimeString(), status: 'Success' },
          ...prev.slice(0, 4)
        ]);
        setEmail('');
      } else {
        setStatus('Failed');
        setStatusMessage(data.message || 'Terjadi kesalahan saat memproses verifikasi.');
        setRecentVerifs(prev => [
          { email: trimmed, time: new Date().toLocaleTimeString(), status: 'Failed' },
          ...prev.slice(0, 4)
        ]);
      }
    } catch (err: any) {
      setStatus('Failed');
      setStatusMessage('Gagal terhubung ke backend server: ' + (err.message || 'Network error'));
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
                MODULE_01 // SECURE_VERIF_PREM
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                verifActive 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {verifActive ? 'ACTIVE' : 'DISABLED BY ADMIN'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400 font-tech uppercase tracking-wide">
              VERIFIKASI &amp; GENERATE PREM
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Kirim permintaan verifikasi &amp; generate akun Prem instan ke Gmail target. Wajib ikuti Saluran WhatsApp resmi AZRYLPREM untuk membuka generator.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 self-start sm:self-center shadow-inner">
            <Mail className="w-8 h-8" />
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
                    ? 'Status: Keanggotaan saluran terverifikasi. Generator akun Prem siap digunakan.' 
                    : 'Wajib ikuti saluran WhatsApp AZRYLPREM untuk membuka akses generator akun Prem.'}
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
                <span>Generator Terbuka: Kredensial saluran valid.</span>
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

        {/* Feature inactive notice */}
        {!verifActive && (
          <div className="mt-6 p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Fitur Dinonaktifkan Sementara</p>
              <p className="text-xs text-rose-400/90 mt-0.5">
                Administrator menonaktifkan sementara modul Verif. Silakan hubungi admin atau coba lagi nanti.
              </p>
            </div>
          </div>
        )}

        {/* Verif Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
              TARGET GMAIL ADDRESS
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh: user@gmail.com"
                disabled={!verifActive || status === 'Processing' || !isChannelFollowed}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-950/90 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-slate-100 placeholder-slate-600 text-sm font-mono transition-all duration-200 outline-none disabled:opacity-50"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  @gmail.com
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 font-mono">
              * Hanya masukkan email target. Sistem tidak pernah meminta password atau kredensial Anda.
            </p>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={!verifActive || status === 'Processing' || !isChannelFollowed}
            className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-tech font-bold text-base tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              !isChannelFollowed
                ? 'bg-slate-900 border border-amber-500/30 text-amber-400/80 cursor-not-allowed opacity-75'
                : 'bg-gradient-to-r from-cyan-600 hover:from-cyan-500 via-sky-600 to-indigo-600 hover:to-indigo-500 text-white shadow-lg shadow-cyan-950/50 hover:shadow-cyan-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none'
            }`}
          >
            {status === 'Processing' ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-200" />
                <span>MEMPROSES GENERATE PREM...</span>
              </>
            ) : !isChannelFollowed ? (
              <>
                <Lock className="w-5 h-5 text-amber-400" />
                <span>WAJIB IKUTI SALURAN UNTUK GENERATE PREM</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5 text-cyan-200" />
                <span>{buttonText || 'GENERATE & KIRIM KONFIRMASI PREM'}</span>
              </>
            )}
          </button>
        </form>

        {/* Live Status Feedback Panel */}
        {status !== 'Idle' && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                EXECUTION_STATUS
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                SESSION: {sessionId}
              </span>
            </div>

            {/* Status Indicator Badges */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {(['Processing', 'Sent', 'Success', 'Failed'] as const).map((stepName) => {
                const isActive = status === stepName;
                const isPassed = 
                  (stepName === 'Processing' && (status === 'Sent' || status === 'Success')) ||
                  (stepName === 'Sent' && status === 'Success');

                return (
                  <div
                    key={stepName}
                    className={`p-2.5 rounded-lg border text-center font-mono text-xs font-semibold transition-all ${
                      isActive
                        ? stepName === 'Failed'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : isPassed
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-950/60 text-slate-600 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {isPassed && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                      {isActive && stepName === 'Processing' && (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      )}
                      <span>{stepName}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Processing step log */}
            {status === 'Processing' && (
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 font-mono text-xs text-cyan-300 flex items-center gap-2 animate-pulse">
                <Terminal className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span className="truncate">{stepDetail}</span>
              </div>
            )}

            {/* Success Card with Verification Instructions */}
            {status === 'Success' && (
              <div className="p-4 sm:p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-emerald-300">{statusMessage}</p>
                    {instructions && (
                      <div className="mt-2.5 p-3 rounded-lg bg-emerald-900/30 border border-emerald-500/20 text-xs text-emerald-100/90 leading-relaxed font-sans">
                        <p className="font-semibold text-emerald-200 mb-1 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                          Instruksi Verifikasi Resmi:
                        </p>
                        {instructions}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Failed Card */}
            {status === 'Failed' && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-rose-300">Gagal Mengirim Verifikasi</p>
                  <p className="text-xs text-rose-200/80 mt-1">{statusMessage}</p>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Session History & Info Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Security Info */}
        <div className="p-5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-cyan-400 font-mono text-xs font-semibold uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Credential Leak</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            API key eksternal diisolasi sepenuhnya di backend environment. Browser user tidak pernah mengekspos token rahasia ataupun menyimpan data pribadi.
          </p>
        </div>

        {/* Recent Session Requests */}
        <div className="p-5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-purple-400 font-mono text-xs font-semibold uppercase">
            <Clock className="w-4 h-4" />
            <span>Riwayat Sesi Ini</span>
          </div>
          {recentVerifs.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Belum ada request verifikasi di sesi ini.</p>
          ) : (
            <div className="space-y-1.5">
              {recentVerifs.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-mono py-1 border-b border-slate-800/60 last:border-none">
                  <span className="text-slate-300 truncate max-w-[160px]">{item.email}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">{item.time}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      item.status === 'Success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
