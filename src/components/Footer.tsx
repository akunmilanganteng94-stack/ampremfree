import React from 'react';
import { Cpu, MessageCircle, ExternalLink, ShieldCheck, Heart, Terminal } from 'lucide-react';

interface FooterProps {
  channelLink: string;
  adminWaLink: string;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  channelLink,
  adminWaLink,
  onOpenAdmin
}) => {
  return (
    <footer className="w-full mt-16 border-t border-slate-900 bg-black/60 backdrop-blur-xl relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-900">
          
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-xl font-black font-tech tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400">
                AZRYLPREM
              </span>
            </div>
            <p className="text-xs font-mono text-cyan-300 font-semibold tracking-wide">
              Premium Utility Platform
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Infrastruktur utilitas dark-tech modern dengan perlindungan privasi tanpa kredensial, enkripsi proxy backend, dan sinkronisasi real-time.
            </p>
          </div>

          {/* Quick links & contacts */}
          <div className="space-y-3">
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              OFFICIAL CONTACTS
            </h5>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <a
                  href={adminWaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Admin WhatsApp: {adminWaLink.replace('https://wa.me/', '+')}</span>
                </a>
              </li>
              <li>
                <a
                  href={channelLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  <span>Official WhatsApp Channel</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Security & Architecture Specs */}
          <div className="space-y-3">
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              SECURITY SPECIFICATION
            </h5>
            <div className="space-y-2 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Zero User Password Collection</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>External API Key Enclave (Backend Only)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Firebase Authentication & ABAC Rules</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>
            © {new Date().getFullYear()} AZRYLPREM. All systems verified and operational.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-cyan-400/80">LATENCY &lt; 250ms</span>
            <span className="text-[11px] text-emerald-400/80">PROXY_READY</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
