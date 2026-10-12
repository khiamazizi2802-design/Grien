import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Search, UserPlus, ShieldCheck, 
    CheckCircle2, Loader2, User, Building2,
    Zap, Sparkles, ChevronRight, Fingerprint,
    Scan, Cpu, Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StaffOnboarding = () => {
    const navigate = useNavigate();
    const [searchId, setSearchId] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [foundStaff, setFoundStaff] = useState(null);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSearch = () => {
        if (!searchId) return;
        setIsSearching(true);
        setFoundStaff(null);
        setShowSuccess(false);
        // Simulated network delay
        setTimeout(() => {
            setIsSearching(false);
            setFoundStaff({
                id: searchId,
                name: 'Julian R.',
                role: 'Senior Personnel',
                avatar: 'Julian',
                status: 'Verified',
                level: 'Alpha-9',
                clearance: 'Unrestricted'
            });
        }, 1500);
    };

    const handleFinalize = () => {
        setIsFinalizing(true);
        setTimeout(() => {
            // Persist the new staff member with default permissions
            const existingStaff = JSON.parse(localStorage.getItem('green_staff_list') || '[]');
            const newStaff = {
                ...foundStaff,
                onboardedAt: new Date().toISOString(),
                permissions: ['Overview', 'Orders'], // Immediate access to Dashboard and Order Hub
                assignedRole: 'Service Staff'
            };
            localStorage.setItem('green_staff_list', JSON.stringify([...existingStaff, newStaff]));
            
            setIsFinalizing(false);
            setFoundStaff(null);
            setSearchId('');
            setShowSuccess(true);
            
            // Clear success message after 4 seconds
            setTimeout(() => setShowSuccess(false), 4000);
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-dark-950 text-primary font-sans p-6 md:p-12 relative overflow-hidden">
            {/* Background Aesthetics - Tactical Layer */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--brand) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-violet-500/5 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/3" />
            
            {/* Animated Scanline */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                <motion.div 
                    initial={{ y: '-100%' }}
                    animate={{ y: '100%' }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-full h-px bg-gradient-to-r from-transparent via-brand to-transparent shadow-[0_0_15px_var(--brand)]"
                />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-20">
                    <button 
                        onClick={() => navigate('/manager')}
                        className="w-14 h-14 bg-glass border border-main rounded-2xl flex items-center justify-center text-secondary hover:text-brand hover:border-brand/40 transition-all shadow-xl backdrop-blur-xl group"
                    >
                        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-primary leading-none">Staff <span className="text-brand">Onboarding</span></h1>
                    </div>
                    <div className="w-14" />
                </div>

                <div className="grid grid-cols-1 gap-12">
                    {/* SUCCESS NOTIFICATION */}
                    <AnimatePresence>
                        {showSuccess && (
                            <motion.div 
                                initial={{ opacity: 0, y: -20, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -20, height: 0 }}
                                className="bg-brand/10 border border-brand/20 rounded-[2.5rem] p-8 flex items-center gap-6 overflow-hidden shadow-[0_20px_50px_rgba(52,211,153,0.05)]"
                            >
                                <div className="w-16 h-16 bg-brand text-dark-950 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand/20"><CheckCircle2 size={32} /></div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-black italic uppercase text-primary tracking-tight leading-none">Personnel Onboarded</h4>
                                    <p className="text-[10px] md:text-xs lg:text-sm font-bold text-brand uppercase tracking-[0.2em] mt-1.5 opacity-80">Baseline Authorized: Dashboard & Order Command</p>
                                </div>
                                <div className="px-6 py-2 bg-brand/10 border border-brand/20 rounded-full">
                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-brand tracking-widest">Protocol Active</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* SEARCH CONSOLE */}
                    <div className="bg-glass border border-main rounded-[3.5rem] p-1 shadow-2xl relative group overflow-hidden">
                        <div className="bg-dark-900 rounded-[3.2rem] p-10 md:p-14 space-y-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-brand pointer-events-none"><Fingerprint size={200} /></div>
                            
                            <div className="space-y-3 relative">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
                                    <h3 className="text-2xl font-black italic uppercase text-primary tracking-tight leading-none">Locate Personnel</h3>
                                </div>
                                <p className="text-[11px] md:text-sm lg:text-base font-bold text-secondary uppercase tracking-widest leading-relaxed max-w-md opacity-70">
                                    Input the Grien ID number to add staff to your profile.
                                </p>
                            </div>

                            <div className="relative group/input">
                                <div className="absolute inset-0 bg-brand/5 blur-xl rounded-3xl opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                                <div className="relative bg-btn-sec border border-main rounded-3xl overflow-hidden focus-within:border-brand/50 transition-all">
                                    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-brand/40 group-focus-within/input:text-brand transition-colors">
                                        <Scan size={24} />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="ST-XXXX-XXXX" 
                                        value={searchId}
                                        onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="w-full bg-transparent py-8 pl-20 pr-40 text-2xl font-black uppercase tracking-[0.25em] text-primary outline-none placeholder:text-secondary/20" 
                                    />
                                    <button 
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 px-10 py-5 bg-brand text-dark-950 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                    >
                                        {isSearching ? <Loader2 size={18} className="animate-spin" /> : <><Search size={18} /> Search</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RESULTS SECTION */}
                    <AnimatePresence mode="wait">
                        {foundStaff && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -30 }}
                                className="space-y-10"
                            >
                                <div className="bg-glass border border-brand/20 rounded-[4rem] p-1 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-brand/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="bg-dark-900 rounded-[3.8rem] p-10 flex flex-col md:flex-row items-center gap-12 relative z-10">
                                        <div className="relative group/avatar">
                                            <div className="absolute -inset-4 bg-brand/20 blur-2xl rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                                            <div className="w-40 h-40 rounded-[3rem] bg-btn-sec border-2 border-brand/20 p-1.5 relative z-10 overflow-hidden">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${foundStaff.avatar}`} alt="Avatar" className="w-full h-full rounded-[2.5rem] shadow-2xl object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/60 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-brand tracking-widest">Profile Hub</span>
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-dark-950 border-4 border-dark-900 shadow-xl z-20">
                                                <CheckCircle2 size={24} />
                                            </div>
                                        </div>

                                        <div className="flex-1 text-center md:text-left space-y-4 relative">
                                            <div className="absolute top-0 right-0">
                                                <button 
                                                    onClick={handleFinalize}
                                                    disabled={isFinalizing}
                                                    className="w-16 h-16 bg-brand text-dark-950 rounded-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl shadow-brand/20 group"
                                                >
                                                    {isFinalizing ? (
                                                        <Loader2 size={24} className="animate-spin" />
                                                    ) : (
                                                        <UserPlus size={28} />
                                                    )}
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
                                                    <h4 className="text-4xl md:text-5xl font-black italic uppercase text-primary tracking-tighter leading-none">{foundStaff.name}</h4>
                                                    <div className="px-4 py-1.5 bg-brand/10 text-brand rounded-full text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest border border-brand/20 flex items-center gap-2">
                                                        <ShieldCheck size={12} /> SECURED NODE
                                                    </div>
                                                </div>
                                                <p className="text-sm font-bold text-secondary uppercase tracking-[0.3em] opacity-60 italic">{foundStaff.role}</p>
                                            </div>
                                            
                                            <div className="flex items-center justify-center md:justify-start gap-8 pt-2 border-t border-main">
                                                <div className="text-center md:text-left">
                                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest opacity-40">Access Level</p>
                                                    <p className="text-lg font-black italic text-primary uppercase">{foundStaff.level}</p>
                                                </div>
                                                <div className="text-center md:text-left">
                                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest opacity-40">Clearance</p>
                                                    <p className="text-lg font-black italic text-brand uppercase">{foundStaff.clearance}</p>
                                                </div>
                                                <div className="text-center md:text-left">
                                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest opacity-40">Status</p>
                                                    <p className="text-lg font-black italic text-green-500 uppercase tracking-tighter">Active</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-20 text-center pb-20">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-main" />
                        <ShieldCheck size={16} className="text-secondary opacity-30" />
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-main" />
                    </div>
                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-secondary uppercase tracking-[0.5em] italic opacity-40">
                        Personnel must possess an active Grien ID for protocol compliance.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StaffOnboarding;
