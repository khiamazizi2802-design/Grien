import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Send, ShieldAlert, Gift, Utensils, 
    MessageCircle, Handshake, Info, ShieldCheck, Sparkles 
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const ResolutionCenterPage = () => {
    const navigate = useNavigate();
    const { incidentId } = useParams();
    const [message, setMessage] = useState('');
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [isSent, setIsSent] = useState(false);

    const incidentData = {
        id: incidentId || 'GRN-421',
        customer: 'Alex Night',
        reason: 'Unsafe Driving Report',
        date: '02.05.2026',
        severity: 'High'
    };

    const offers = [
        { id: 'vvip', label: 'VVIP Access Pass', icon: Sparkles, desc: 'Complimentary skip-the-line and entry for 4.' },
        { id: 'refund', label: 'Full Refund', icon: Utensils, desc: 'Total reimbursement of the transaction.' },
        { id: 'voucher', label: '€50 Green Credit', icon: Gift, desc: 'Applicable to any service in the network.' }
    ];

    const handleSend = () => {
        if (!message) return;
        setIsSent(true);
        setTimeout(() => navigate('/manager'), 2000);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-brand/30 p-8 flex items-center justify-center relative overflow-hidden">
            {/* Background Aesthetic */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.05),transparent)]" />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl w-full bg-[var(--bg-secondary)] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative z-10"
            >
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* LEFT: Incident Overview */}
                    <div className="p-10 border-r border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                        <button 
                            onClick={() => navigate('/manager')}
                            className="w-12 h-12 bg-[var(--bg-tertiary)]/50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-brand transition-all mb-12"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <span className="text-[10px] md:text-xs lg:text-sm font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded">Dispute Incident</span>
                                <h1 className="text-4xl font-black italic uppercase tracking-tighter">Resolution <span className="text-brand">Center</span></h1>
                            </div>

                            <div className="p-8 bg-[var(--bg-primary)]/40 rounded-[2rem] border border-white/5 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500"><ShieldAlert size={28} /></div>
                                    <div>
                                        <p className="text-xs md:text-sm lg:text-base font-black uppercase text-gray-500">Incident ID</p>
                                        <p className="text-lg font-black italic text-white uppercase">{incidentData.id}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase">Customer</span>
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black text-white uppercase">{incidentData.customer}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase">Category</span>
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black text-red-400 uppercase">{incidentData.reason}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase">Incident Date</span>
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black text-white uppercase">{incidentData.date}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-6 bg-brand/5 border border-brand/20 rounded-2xl">
                                <Info size={20} className="text-brand shrink-0 mt-1" />
                                <p className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-400 leading-relaxed uppercase">
                                    You are reaching out to resolve a red flag. If the customer accepts your offer and pardon, the flag will be revoked instantly.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Resolution Workspace */}
                    <div className="p-10 flex flex-col h-full">
                        <AnimatePresence mode="wait">
                            {!isSent ? (
                                <motion.div 
                                    key="compose"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8 flex flex-col h-full"
                                >
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black italic uppercase text-white">Professional <span className="text-brand">Offer</span></h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {offers.map(offer => (
                                                <button 
                                                    key={offer.id}
                                                    onClick={() => setSelectedOffer(offer.id)}
                                                    className={`p-5 rounded-[1.5rem] border transition-all text-left group ${selectedOffer === offer.id ? 'bg-brand/10 border-brand' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedOffer === offer.id ? 'text-brand' : 'text-gray-500'}`}><offer.icon size={24} /></div>
                                                        <div>
                                                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-white tracking-widest">{offer.label}</p>
                                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase mt-1 leading-tight">{offer.desc}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4 flex flex-col min-h-[200px]">
                                        <h3 className="text-xl font-black italic uppercase text-white">Message to <span className="text-brand">Customer</span></h3>
                                        <div className="flex-1 relative">
                                            <textarea 
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder="Explain the situation and express your commitment to Green standards..."
                                                className="w-full h-full bg-[var(--bg-tertiary)] border border-white/10 rounded-[2rem] p-8 text-sm font-bold text-[var(--text-primary)] focus:border-brand/40 outline-none transition-all resize-none"
                                            />
                                            <div className="absolute bottom-6 right-6 flex gap-2">
                                                <div className="px-3 py-1 bg-dark-900/80 rounded-lg text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest border border-white/5">Tone: Professional</div>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleSend}
                                        disabled={!message || !selectedOffer}
                                        className="w-full py-6 bg-brand text-dark-900 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] md:text-xs lg:text-sm shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 disabled:grayscale disabled:hover:scale-100 flex items-center justify-center gap-4"
                                    >
                                        <Send size={18} /> Send Resolution Proposal
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-center space-y-6"
                                >
                                    <div className="w-24 h-24 bg-brand/10 rounded-[2.5rem] flex items-center justify-center text-brand shadow-[0_0_50px_rgba(52,211,153,0.3)] animate-bounce">
                                        <ShieldCheck size={48} />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Proposal <span className="text-brand">Transmitted</span></h2>
                                        <p className="text-gray-500 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest">Awaiting customer review and pardon status.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* Footer Branding */}
            <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[7px] font-black text-gray-700 uppercase tracking-[1em]">Secure Resolution Protocol • Green Engine</p>
        </div>
    );
};

export default ResolutionCenterPage;
