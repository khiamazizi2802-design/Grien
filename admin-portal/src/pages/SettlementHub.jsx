import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    History, 
    Zap, 
    ArrowLeft, 
    Download, 
    Share2, 
    CheckCircle2, 
    CreditCard, 
    Users,
    ChevronRight,
    TrendingUp,
    Receipt
} from 'lucide-react';

const SettlementHub = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([
        { 
            id: '#GRN-9821', 
            venue: 'The Skyline Club', 
            date: 'Yesterday, 23:45', 
            total: '€142.50', 
            yourPart: '€35.62', 
            splitWith: 4,
            status: 'Settled',
            items: ['Bottle Service', 'Truffle Fries']
        },
        { 
            id: '#GRN-9784', 
            venue: 'Blue Velvet Bar', 
            date: '28 Apr, 22:12', 
            total: '€64.00', 
            yourPart: '€64.00', 
            splitWith: 1,
            status: 'Settled',
            items: ['Signature Mojito x2', 'Nachos']
        }
    ]);

    return (
        <div className="relative w-full min-h-screen bg-[#0B121E] font-sans text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0B121E]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <button 
                    onClick={() => navigate('/greens')}
                    className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/5"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="text-center">
                    <h1 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-brand">Settlement Hub</h1>
                    <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">The Morning After Ledger</p>
                </div>
                <div className="w-10 h-10 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center text-brand">
                    <History size={18} />
                </div>
            </header>

            <main className="p-6 max-w-lg mx-auto space-y-8 pb-32">
                
                {/* MONTHLY SUMMARY CARD */}
                <section className="bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={120} className="text-brand" /></div>
                    <div className="relative z-10 space-y-4">
                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-[0.2em]">April Expenditure</p>
                        <h2 className="text-4xl font-black italic tracking-tighter leading-none">€412.30</h2>
                        <div className="flex gap-4 pt-4">
                            <div className="flex-1 p-3 bg-dark-950/40 rounded-2xl border border-white/5">
                                <p className="text-[7px] font-black text-gray-500 uppercase mb-1">Your Part</p>
                                <p className="text-sm font-black italic text-white leading-none">€210.15</p>
                            </div>
                            <div className="flex-1 p-3 bg-dark-950/40 rounded-2xl border border-white/5">
                                <p className="text-[7px] font-black text-gray-500 uppercase mb-1">Social Splits</p>
                                <p className="text-sm font-black italic text-brand leading-none">12 Times</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TRANSACTION HISTORY */}
                <section className="space-y-4">
                    <h3 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-gray-500 ml-2">Recent Settlements</h3>
                    
                    <div className="space-y-3">
                        {history.map((tx, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:bg-white/10 transition-all group cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-black italic uppercase text-white">{tx.venue}</p>
                                            <span className="px-2 py-0.5 bg-white/10 text-white text-[7px] font-black rounded uppercase">Settled</span>
                                        </div>
                                        <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest">{tx.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black italic text-white leading-none">{tx.yourPart}</p>
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase mt-1">Total: {tx.total}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <Users size={12} className="text-gray-500" />
                                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-gray-400 uppercase">{tx.splitWith > 1 ? `Split with ${tx.splitWith}` : 'Personal'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Receipt size={12} className="text-gray-500" />
                                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-gray-400 uppercase">{tx.items.length} Items</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-brand transition-colors"><Download size={14} /></button>
                                        <button className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-brand transition-colors"><Share2 size={14} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* TAX COMPLIANCE INFO */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <h4 className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-white tracking-widest mb-1">Fiscal Precision</h4>
                        <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-500 font-bold leading-relaxed uppercase">
                            All receipts are digitally signed and optimized for DATEV/SKR03 exports. Your Morning After Ledger is a certified financial record.
                        </p>
                    </div>
                </div>

            </main>

            {/* Floating Action */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0B121E] via-[#0B121E]/95 to-transparent">
                <button 
                    onClick={() => navigate('/greens')}
                    className="w-full py-5 bg-brand text-dark-900 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] shadow-[0_0_50px_rgba(52,211,153,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    Back to Radar
                </button>
            </div>
        </div>
    );
};

export default SettlementHub;
