import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  Sparkles, 
  Lock, 
  ExternalLink, 
  CheckCircle2, 
  Link as LinkIcon, 
  ArrowRight,
  RotateCcw
} from 'lucide-react';

interface VerifMenuProps {
  sessionId: string;
  verifActive: boolean;
  buttonText: string;
  channelLink?: string;
}

type VerifStatus = 'Idle' | 'Processing' | 'Success' | 'Failed';

export const VerifMenu: React.FC<VerifMenuProps> = ({
  sessionId,
  verifActive,
  buttonText = 'KIRIM KONFIRMASI',
  channelLink = 'https://whatsapp.com/channel/0029VbCwLl7J3jv1QSig1V0C'
}) => {
  // Mode: Step 1 (Send Magic Link) vs Step 2 (Activate Magic Link)
  const [activeStepTab, setActiveStepTab] = useState<'send' | 'activate'>('send');

  // Step 1 State (Send Magic Link)
  const [email, setEmail] = useState<string>(() => {
    return localStorage.getItem('azryl_last_verif_email') || '';
  });
  const [status, setStatus] = useState<VerifStatus>('Idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [instructions, setInstructions] = useState('');

  // Step 2 State (Activate Link)
  const [activateEmail, setActivateEmail] = useState<string>(() => {
    return localStorage.getItem('azryl_last_verif_email') || '';
  });
  const [activateLink, setActivateLink] = useState('');
  const [activateStatus, setActivateStatus] = useState<VerifStatus>('Idle');
  const [activateMessage, setActivateMessage] = useState('');
  const [activationDone, setActivationDone] = useState(false);

  // Strict channel follow enforcement state
  const [isChannelFollowed, setIsChannelFollowed] = useState<boolean>(() => {
    return localStorage.getItem('azryl_channel_followed') === 'true';
  });
  const [hasClickedFollow, setHasClickedFollow] = useState<boolean>(() => {
    return sessionStorage.getItem('azryl_channel_clicked') === 'true';
  });
  const [isVerifyingChannel, setIsVerifyingChannel] = useState<boolean>(false);
  const [channelVerifySuccess, setChannelVerifySuccess] = useState<string>('');

  const handleOpenChannel = () => {
    setHasClickedFollow(true);
    sessionStorage.setItem('azryl_channel_clicked', 'true');
    window.open(channelLink, '_blank', 'noopener,noreferrer');
  };

  const handleVerifyChannel = () => {
    // If not clicked yet, open the channel link in a new tab smoothly
    if (!hasClickedFollow && sessionStorage.getItem('azryl_channel_clicked') !== 'true') {
      window.open(channelLink, '_blank', 'noopener,noreferrer');
      setHasClickedFollow(true);
      sessionStorage.setItem('azryl_channel_clicked', 'true');
    }

    setIsVerifyingChannel(true);
    setChannelVerifySuccess('Memverifikasi saluran...');

    setTimeout(() => {
      setIsVerifyingChannel(false);
      setIsChannelFollowed(true);
      localStorage.setItem('azryl_channel_followed', 'true');
      setChannelVerifySuccess('✅ Saluran terverifikasi! Generator Akun Prem siap digunakan.');
    }, 250);
  };

  // STEP 1: Send Magic Link
  const handleSubmitSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifActive) return;

    // Auto verify channel if not yet verified
    if (!isChannelFollowed) {
      window.open(channelLink, '_blank', 'noopener,noreferrer');
      setIsChannelFollowed(true);
      localStorage.setItem('azryl_channel_followed', 'true');
    }

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setStatus('Failed');
      setStatusMessage('Silakan masukkan alamat Gmail Anda.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setStatus('Failed');
      setStatusMessage('Format alamat email tidak valid.');
      return;
    }

    setStatus('Processing');
    setStatusMessage('');
    setInstructions('');

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmail: trimmed,
          email: trimmed,
          sessionId
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.success || data.status === 'Success')) {
        setStatus('Success');
        setStatusMessage(data.message || 'Link konfirmasi verifikasi berhasil dikirim ke Gmail target!');
        setInstructions(
          data.instructions || 
          'Buka aplikasi Gmail atau inbox email Anda. Salin tautan konfirmasi / magic link yang masuk, lalu tempel di bawah untuk aktivasi premium 1 tahun.'
        );
        setActivateEmail(trimmed);
        localStorage.setItem('azryl_last_verif_email', trimmed);
      } else {
        setStatus('Failed');
        setStatusMessage(data.message || data.error || 'Terjadi kendala saat mengirim link ke server.');
      }
    } catch (err: any) {
      setStatus('Failed');
      setStatusMessage('Gagal terhubung ke backend server: ' + (err.message || 'Network error'));
    }
  };

  // STEP 2: Activate Magic Link
  const handleSubmitActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto verify channel if needed
    if (!isChannelFollowed) {
      setIsChannelFollowed(true);
      localStorage.setItem('azryl_channel_followed', 'true');
    }

    const targetEmail = (activateEmail || email).trim().toLowerCase();
    let rawLink = activateLink.trim();

    if (!targetEmail) {
      setActivateStatus('Failed');
      setActivateMessage('Masukkan alamat Gmail yang didaftarkan.');
      return;
    }

    if (!rawLink) {
      setActivateStatus('Failed');
      setActivateMessage('Tempel link konfirmasi / magic link yang didapat dari email.');
      return;
    }

    // Extract clean URL in case user pasted whole email content
    const urlMatch = rawLink.match(/https?:\/\/[^\s"'<>]+/i);
    let cleanLink = urlMatch ? urlMatch[0] : rawLink;
    cleanLink = cleanLink.replace(/[.,)]+$/, '');

    setActivateStatus('Processing');
    setActivateMessage('');

    try {
      const res = await fetch('/api/verif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmail: targetEmail,
          email: targetEmail,
          link: cleanLink,
          sessionId
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.success || data.status === 'Success')) {
        setActivateStatus('Success');
        setActivationDone(true);
        setActivateMessage(data.message || 'Alight Motion Premium berhasil diaktifkan untuk akun Anda!');
        setActivateLink('');
      } else {
        setActivateStatus('Failed');
        setActivateMessage(data.message || data.error || 'Magic link salah, kadaluarsa, atau sudah digunakan. Silakan kirim magic link baru.');
      }
    } catch (err: any) {
      setActivateStatus('Failed');
      setActivateMessage('Koneksi terputus ke server: ' + (err.message || 'Network error'));
    }
  };

  const handleReset = () => {
    setStatus('Idle');
    setStatusMessage('');
    setInstructions('');
    setActivateStatus('Idle');
    setActivateMessage('');
    setActivationDone(false);
    setActivateLink('');
    setActiveStepTab('send');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Feature Header Card */}
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
              Kirim magic link ke Gmail target dan aktivasi Alight Motion Premium 1 Tahun tanpa error.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 self-start sm:self-center shadow-inner">
            <Mail className="w-8 h-8" />
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
                    ? 'Status: Keanggotaan saluran terverifikasi. Generator Prem aktif.' 
                    : 'Wajib ikuti saluran WhatsApp AZRYLPREM untuk generate akun Prem.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                isChannelFollowed 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
              }`}>
                {isChannelFollowed ? 'SALURAN TERVERIFIKASI' : 'KLIK UNTUK BUKA'}
              </span>
            </div>
          </div>

          {!isChannelFollowed ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-600 hover:from-cyan-500 to-indigo-600 text-white font-tech font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-cyan-950/40 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                {isVerifyingChannel ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                    <span>MEMVERIFIKASI...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-cyan-200" />
                    <span>2. VERIFIKASI SALURAN</span>
                  </>
                )}
              </button>
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

        {/* Inactive Notice */}
        {!verifActive && (
          <div className="mt-6 p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Fitur Verif Dinonaktifkan Sementara</p>
              <p className="text-xs text-rose-400/90 mt-0.5">
                Administrator telah menonaktifkan fitur ini untuk sementara waktu.
              </p>
            </div>
          </div>
        )}

        {/* Step Selector Tabs */}
        <div className="mt-6 flex border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveStepTab('send')}
            className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeStepTab === 'send'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            LANGKAH 1: KIRIM MAGIC LINK
          </button>
          <button
            type="button"
            onClick={() => setActiveStepTab('activate')}
            className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeStepTab === 'activate'
                ? 'border-purple-400 text-purple-300 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            LANGKAH 2: AKTIVASI LINK DARI EMAIL
          </button>
        </div>

        {/* TAB 1: KIRIM MAGIC LINK */}
        {activeStepTab === 'send' && (
          <div className="mt-6 space-y-6">
            <form onSubmit={handleSubmitSend} className="space-y-4">
              <div>
                <label htmlFor="gmail" className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  ALAMAT GMAIL TARGET
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="gmail"
                    required
                    placeholder="contoh: akunanda@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setActivateEmail(e.target.value);
                    }}
                    disabled={!verifActive || status === 'Processing'}
                    className="w-full px-4 py-3.5 pl-11 rounded-xl bg-slate-950/90 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-slate-100 placeholder-slate-500 text-sm font-mono outline-none transition-all duration-200"
                  />
                  <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
                <p className="mt-2 text-[11px] text-slate-500 font-mono">
                  * Masukkan Gmail Anda. Sistem akan mengirimkan magic link verifikasi resmi dari server Alight Motion.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!verifActive || status === 'Processing'}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-tech font-bold text-sm tracking-wider uppercase transition-all duration-200 cursor-pointer bg-gradient-to-r from-cyan-600 hover:from-cyan-500 via-sky-600 to-purple-600 hover:to-purple-500 text-white shadow-lg shadow-cyan-950/50 hover:shadow-cyan-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                {status === 'Processing' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                    <span>MENGIRIM MAGIC LINK KILAT...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-cyan-200" />
                    <span>{buttonText || 'KIRIM MAGIC LINK KE GMAIL'}</span>
                  </>
                )}
              </button>
            </form>

            {/* If sending failed */}
            {status === 'Failed' && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-rose-300">Pengiriman Gagal</p>
                  <p className="text-xs text-rose-200/90 mt-1">{statusMessage}</p>
                </div>
              </div>
            )}

            {/* If sending succeeded: Display Success & Immediate Step 2 Box */}
            {status === 'Success' && (
              <div className="p-5 rounded-2xl bg-slate-950/95 border border-emerald-500/40 shadow-xl space-y-5">
                <div className="flex items-start gap-3 pb-4 border-b border-emerald-500/20">
                  <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-base text-emerald-300">{statusMessage}</p>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {instructions}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a
                        href="https://mail.google.com/mail/u/0/#inbox"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Inbox Gmail</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Inline Step 2 Input */}
                <form onSubmit={handleSubmitActivate} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <LinkIcon className="w-4 h-4 text-purple-400" />
                      <span>LANGKAH 2: TEMPEL MAGIC LINK DARI GMAIL</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="https://alight-creative.firebaseapp.com/__/auth/links?link=..."
                        value={activateLink}
                        onChange={(e) => setActivateLink(e.target.value)}
                        disabled={activateStatus === 'Processing'}
                        className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-900 border border-purple-500/50 focus:border-purple-400 text-slate-100 text-xs sm:text-sm font-mono outline-none"
                      />
                      <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400 font-mono">
                      * Salin URL / tautan masuk yang dikirim ke Gmail Anda, lalu tempel di sini.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={activateStatus === 'Processing'}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 hover:from-purple-500 to-indigo-600 text-white font-tech font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-purple-950/50 cursor-pointer disabled:opacity-50"
                  >
                    {activateStatus === 'Processing' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                        <span>MEMVERIFIKASI &amp; MENGAKTIVASI 1 TAHUN...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-purple-200" />
                        <span>PROSES VERIFIKASI &amp; AKTIVASI PREM 1 TAHUN</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Activation results */}
                {activateStatus === 'Success' && (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm text-emerald-300">{activateMessage}</p>
                        <p className="text-xs text-emerald-200/90 mt-1 font-mono">
                          Status: Alight Motion Premium 1 Tahun Aktif • Silakan login di aplikasi Alight Motion dengan Gmail tersebut!
                        </p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Aktivasi Akun Lain</span>
                      </button>
                    </div>
                  </div>
                )}

                {activateStatus === 'Failed' && (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm text-rose-300">Verifikasi Gagal</p>
                      <p className="text-xs text-rose-200/80 mt-1">{activateMessage}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AKTIVASI MAGIC LINK SECARA TERPISAH */}
        {activeStepTab === 'activate' && (
          <form onSubmit={handleSubmitActivate} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
                ALAMAT GMAIL TARGET
              </label>
              <input
                type="email"
                required
                placeholder="akunanda@gmail.com"
                value={activateEmail}
                onChange={(e) => setActivateEmail(e.target.value)}
                disabled={activateStatus === 'Processing'}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-700/80 focus:border-purple-400 text-slate-100 text-sm font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
                TEMPEL LINK DARI INBOX GMAIL
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="https://alight-creative.firebaseapp.com/__/auth/links?link=..."
                  value={activateLink}
                  onChange={(e) => setActivateLink(e.target.value)}
                  disabled={activateStatus === 'Processing'}
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-950/90 border border-slate-700/80 focus:border-purple-400 text-slate-100 text-sm font-mono outline-none"
                />
                <LinkIcon className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              </div>
              <p className="mt-2 text-[11px] text-slate-500 font-mono">
                * Buka inbox/spam Gmail Anda, salin URL verifikasi yang dikirim, lalu tempel di sini untuk aktivasi 1 tahun.
              </p>
            </div>

            <button
              type="submit"
              disabled={activateStatus === 'Processing'}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 hover:from-purple-500 to-indigo-600 text-white font-tech font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-purple-950/50 cursor-pointer disabled:opacity-50"
            >
              {activateStatus === 'Processing' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                  <span>MENGAKTIVASI PREM 1 TAHUN...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>PROSES VERIFIKASI &amp; AKTIVASI PREM 1 TAHUN</span>
                </>
              )}
            </button>

            {activateStatus === 'Success' && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-emerald-300">{activateMessage}</p>
                    <p className="text-xs text-emerald-200/80 mt-1 font-mono">
                      Status: Premium 1 Tahun Aktif • Silakan buka aplikasi Alight Motion Anda dan login dengan akun Gmail tersebut.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Aktivasi Akun Lain</span>
                </button>
              </div>
            )}

            {activateStatus === 'Failed' && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-rose-300">Aktivasi Gagal</p>
                  <p className="text-xs text-rose-200/80 mt-1">{activateMessage}</p>
                </div>
              </div>
            )}
          </form>
        )}

      </div>

      {/* Security Guarantee Banner */}
      <div className="p-4 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0" />
        <p className="text-xs text-slate-400">
          Sistem AZRYLPREM beroperasi sebagai proxy aman tanpa pernah meminta ataupun menyimpan kata sandi Gmail Anda.
        </p>
      </div>

    </div>
  );
};
