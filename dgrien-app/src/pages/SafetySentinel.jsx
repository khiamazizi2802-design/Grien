import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    ShieldAlert, 
    ZapOff, 
    ArrowLeft, 
    Gavel, 
    Lock,
    HelpCircle,
    Info
} from 'lucide-react';

const SafetySentinel = () => {
    const navigate = useNavigate();

    return (
        <div className="relative w-full min-h-screen bg-[#080B12] font-sans text-white flex flex-col items-center justify-center p-8">
            {/* Background Red Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-red-600/10 blur-[150px] rounded-full" />
            </div>

            <main className="relative z-10 max-w-sm w-full space-y-10 text-center">
                
                {/* ICON OF AUTHORITY */}
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-32 h-32 bg-red-500/10 border-2 border-red-500/30 rounded-[3.5rem] flex items-center justify-center text-red-500 mx-auto shadow-[0_0_50px_rgba(239,68,68,0.2)]"
                >
                    <ShieldAlert size={64} className="animate-pulse" />
                </motion.div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-red-500 leading-none">System Restriction</h1>
                    <p className="text-xs md:text-sm lg:text-base text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                        Your GREEN profile has been flagged for <span className="text-white">Behavioral Inconsistency</span>. Tactical access is currently restricted.
                    </p>
                </div>

                {/* DETAILS GRID */}
                <div className="grid grid-cols-1 gap-4 text-left">
                    {[
                        { icon: Gavel, title: 'Compliance Violation', desc: 'Protocol violation detected during recent Night Crew session.' },
                        { icon: ZapOff, title: 'Neural Disconnect', desc: 'Real-time GPS validation failed multiple handshakes.' },
                        { icon: Lock, title: 'Temporary Lock', desc: 'System restriction will expire in 14:22:10.' }
                    ].map((item, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
                                <item.icon size={20} />
                            </div>
                            <div>
                                <h4 className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-white tracking-widest mb-1">{item.title}</h4>
                                <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-500 font-bold leading-relaxed uppercase">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ACTION BLOCK */}
                <div className="space-y-4 pt-6">
                    <button 
                        onClick={() => navigate('/greens')}
                        className="w-full py-5 bg-white text-dark-900 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        Review Protocol
                        <Info size={14} />
                    </button>
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-full py-4 bg-white/5 border border-white/10 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all"
                    >
                        Exit Terminal
                    </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[8px] md:text-[10px] lg:text-xs font-black text-gray-600 uppercase tracking-widest pt-8">
                    <HelpCircle size={12} />
                    Contacting Sentinel Support...
                </div>

            </main>
        </div>
    );
};

export default SafetySentinel;
