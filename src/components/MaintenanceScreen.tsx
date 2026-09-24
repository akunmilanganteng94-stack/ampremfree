import React from 'react';
import { AlertTriangle, Wrench, Shield, MessageCircle } from 'lucide-react';

interface MaintenanceScreenProps {
  adminWaLink: string;
  onAdminBypass: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  adminWaLink,
  onAdminBypass
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-20">
      <div className="w-full max-w-lg p-8 rounded-3xl bg-slate-950/90 border border-amber-500/40 backdrop-blur-2xl shadow-2xl shadow-amber-950/30 text-center">
        
        <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-6 animate-pulse">
          <Wrench className="w-10 h-10" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
            SYSTEM_MAINTENANCE_IN_PROGRESS
          </span>
        </div>

        <h1 className="text-3xl font-extrabold font-tech tracking-wider text-slate-100 uppercase">
          AZRYLPREM SEDANG MAINTENANCE
        </h1>

        <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
          Sistem sedang menjalani upgrade keamanan dan optimalisasi server berkala. Layanan verifikasi dan bulk akan segera aktif kembali.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={adminWaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all shadow-lg"
          >
            <MessageCircle className="w-4 h-4" />
            <span>KONTAK ADMIN WA</span>
          </a>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-600">
          AZRYLPREM KERNEL • SCHEDULED UPGRADE PROTOCOL
        </div>

      </div>
    </div>
  );
};
