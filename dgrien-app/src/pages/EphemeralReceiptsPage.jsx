import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Clock, Mail, ShieldCheck, Receipt, 
    Trash2, ExternalLink, Sparkles, Zap, MapPin, Share2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EphemeralReceiptsPage = () => {
    const navigate = useNavigate();
    
    const [receipts, setReceipts] = useState([
        {
            id: 'REC-001',
            venue: 'Eco-Park Central',
            service: 'Premium Valet + Car Wash',
            price: 45.00,
            time: '2h ago',
            expiresIn: 79200, // seconds (22 hours)
            emailSent: true
        },
        {
            id: 'REC-002',
            venue: 'Skyline Stadium',
            service: 'VIP Matchday Ticket (2x)',
            price: 250.00,
            time: '5h ago',
            expiresIn: 68400, // seconds (19 hours)
            emailSent: true
        },
        {
            id: 'REC-003',
            venue: 'Luxe Hotel',
            service: 'Gourmet Dinner Split',
            price: 85.50,
            time: '8h ago',
            expiresIn: 57600, // seconds (16 hours)
            emailSent: true
        }
    ]);

    // Timer logic to update countdowns
    useEffect(() => {
        const interval = setInterval(() => {
            setReceipts(prev => prev.map(r => ({
                ...r,
                expiresIn: Math.max(0, r.expiresIn - 1)
            })).filter(r => r.expiresIn > 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    return (
        <div className="min-h-screen bg-dark-950 text-white font-sans selection:bg-brand/30 pb-20">
            {/* Header */}
            <header className="p-8 flex justify-between items-center bg-dark-900/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/greens')}
                        className="w-12 h-12 bg-dark-950 border border-white/10 rounded-2xl flex items-center justify-center text-brand hover:scale-110 transition-all"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter uppercase">Daily Mission Log</h1>
                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-brand">Ephemeral 24h Receipts</p>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                    <Clock size={20} className="animate-pulse" />
                </div>
            </header>

            <main className="p-6 max-w-lg mx-auto space-y-6">
                {/* Protocol Banner */}
                <div className="bg-brand/5 border border-brand/20 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-[50px] rounded-full" />
                    <div className="relative z-10 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand/20 flex items-center justify-center text-brand shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                            <ShieldCheck size={24} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-black italic uppercase tracking-tight">Privacy Protocol Active</h3>
                            <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                                ALL APP-LEVEL RECEIPTS ARE AUTO-PURGED AFTER 24 HOURS. AN ARCHIVAL COPY HAS BEEN DISPATCHED TO YOUR REGISTERED EMAIL.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Receipt List */}
                <div className="space-y-4">
                    <h4 className="text-[10px] md:text-xs lg:text-sm text-gray-500 font-black uppercase tracking-[0.3em] px-2 italic">Active Missions ({receipts.length})</h4>
                    
                    <AnimatePresence mode="popLayout">
                        {receipts.map((receipt) => (
                            <motion.div 
                                key={receipt.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-dark-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4 group hover:border-brand/20 transition-all relative overflow-hidden"
                            >
                                {/* Countdown Overlay */}
                                <div className="absolute top-0 right-0 px-4 py-2 bg-brand/10 text-brand text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest border-l border-b border-brand/20 rounded-bl-2xl">
                                    Purge in: {formatTime(receipt.expiresIn)}
                                </div>

                                <div className="flex justify-between items-start pt-2">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/5 rounded-2xl text-brand group-hover:scale-110 transition-transform">
                                            <Receipt size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">{receipt.venue}</p>
                                            <h5 className="text-sm font-black italic tracking-tight text-white uppercase">{receipt.service}</h5>
                                            <p className="text-[7px] text-gray-600 font-bold uppercase tracking-widest">{receipt.id} • {receipt.time}</p>
                                        </div>
                                    </div>
                                    <p className="text-xl font-black italic text-brand">€{receipt.price.toFixed(2)}</p>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {receipt.emailSent && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-brand/5 border border-brand/10 rounded-lg">
                                                <Mail size={10} className="text-brand" />
                                                <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-brand tracking-widest">Archived to Email</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 bg-white/5 text-gray-500 rounded-lg hover:text-white transition-colors">
                                            <Share2 size={16} />
                                        </button>
                                        <button className="p-2 bg-white/5 text-gray-500 rounded-lg hover:text-white transition-colors">
                                            <ExternalLink size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {receipts.length === 0 && (
                        <div className="py-20 text-center space-y-4 opacity-30">
                            <Zap size={48} className="mx-auto text-gray-500" />
                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest">No active missions in the last 24h.</p>
                        </div>
                    )}
                </div>

                {/* Footer Disclaimer */}
                <div className="p-6 text-center space-y-2 opacity-50">
                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.4em]">Green Sentinel Security v1.0</p>
                    <p className="text-[7px] text-gray-600 font-bold uppercase">All transaction metadata is encrypted and handled per GDPR mission protocols.</p>
                </div>
            </main>
        </div>
    );
};

export default EphemeralReceiptsPage;
