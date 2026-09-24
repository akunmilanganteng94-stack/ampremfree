import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, ArrowRight, MessageSquare, Terminal, CheckCircle2, Lock, AlertTriangle } from 'lucide-react';

interface ChannelGateProps {
  channelUrl: string;
  onUnlocked: () => void;
}

export const ChannelGate: React.FC<ChannelGateProps> = ({ channelUrl, onUnlocked }) => {
  const [clickedFollow, setClickedFollow] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFollowClick = () => {
    setClickedFollow(true);
    setErrorMessage('');
    sessionStorage.setItem('azryl_channel_clicked', 'true');
    window.open(channelUrl, '_blank', 'noopener,noreferrer');
  };

  const handleConfirmed = () => {
    if (!clickedFollow && sessionStorage.getItem('azryl_channel_clicked') !== 'true') {
      setErrorMessage('⚠️ Akses terkunci! Anda WAJIB mengklik tombol "1. BUKA & IKUTI CHANNEL" terlebih dahulu.');
      return;
    }

    setErrorMessage('');
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      localStorage.setItem('azryl_channel_followed', 'true');
      onUnlocked();
    }, 700);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-md relative">
        {/* Glow backdrop card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-indigo-500/20 to-purple-500/30 rounded-2xl blur-xl opacity-75 animate-pulse" />

        <div className="relative bg-slate-950/80 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/50">
          
          {/* Top Badge */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-800/80 mb-6">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase">GATE_AUTHENTICATION</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>ACCESS_REQUIRED</span>
            </div>
          </div>

          {/* Logo / Title */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 shadow-inner mb-4">
              <Terminal className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400 uppercase font-tech">
              AKSES AZRYLPREM
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
              Untuk dapat menggunakan seluruh fitur generator akun Prem di AZRYLPREM, Anda diwajibkan mengikuti Saluran WhatsApp resmi terlebih dahulu.
            </p>
          </div>

          {/* Channel Info Card */}
          <div className="mb-6 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">WhatsApp Channel Resmi</p>
              <p className="text-[11px] text-slate-400 truncate">Update server, config & info premium</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              OFFICIAL
            </span>
          </div>

          {/* Error Message if tried to skip */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleFollowClick}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 hover:from-emerald-500 to-teal-600 hover:to-teal-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>1. BUKA &amp; IKUTI CHANNEL WA</span>
            </button>

            <button
              onClick={handleConfirmed}
              disabled={isVerifying}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                clickedFollow
                  ? 'bg-gradient-to-r from-cyan-600 hover:from-cyan-500 to-indigo-600 hover:to-indigo-500 text-white shadow-lg shadow-cyan-950/40 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>MEMVERIFIKASI AKSES SALURAN...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>2. SAYA SUDAH MENGIKUTI</span>
                  <ArrowRight className="w-4 h-4 opacity-70" />
                </>
              )}
            </button>
          </div>

          {/* Transparent Gate Notice */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 leading-normal">
              Akses instan tanpa login atau registrasi akun. Klik "Buka &amp; Ikuti Channel WA" lalu tekan "Saya Sudah Mengikuti" untuk masuk ke dashboard utama.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
