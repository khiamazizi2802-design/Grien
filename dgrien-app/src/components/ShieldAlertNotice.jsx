import React from 'react';
import { ShieldAlert, ExternalLink } from 'lucide-react';

const ShieldAlertNotice = () => (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
            <ShieldAlert size={40} />
        </div>
        <h1 className="text-2xl font-black italic uppercase tracking-wider mb-2">Director Admin Portal</h1>
        <p className="text-xs text-gray-400 max-w-md leading-relaxed mb-6">
            Das Administrator Dashboard wurde aus Sicherheitsgründen und zur Optimierung der mobilen Performance vom Kunden-App Build getrennt.
            <br /><br />
            Bitte nutzen Sie das offizielle <strong>Director Admin Web Portal</strong> im Desktop Web-Browser.
        </p>
        <a 
            href="http://localhost:5174" 
            target="_blank" 
            rel="noreferrer"
            className="px-8 py-4 bg-amber-500 text-dark-950 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-amber-400 transition-all shadow-lg flex items-center gap-2 active:scale-95"
        >
            Zum Admin Web Portal (Port 5174) <ExternalLink size={16} />
        </a>
    </div>
);

export default ShieldAlertNotice;
