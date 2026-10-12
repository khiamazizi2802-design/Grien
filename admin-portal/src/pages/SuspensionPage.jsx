import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Clock, LogOut, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SuspensionPage = () => {
    const { user, logout } = useAuth();
    
    // Logic to determine ban duration based on flags
    const getBanDuration = () => {
        if (user?.redFlags >= 9) return 'Permanent Deactivation';
        if (user?.redFlags >= 6) return '12 Month Suspension';
        if (user?.redFlags >= 3) return '6 Month Suspension';
        return 'Under Review';
    };

    const getRemainingTime = () => {
        if (user?.redFlags >= 9) return 'Access Terminated Forever';
        return '178 Days Remaining'; // Mock countdown
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8 relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-50" />
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl w-full bg-[#0D1421] border border-red-500/30 rounded-[3rem] p-12 relative z-10 shadow-2xl"
            >
                <div className="flex flex-col items-center text-center space-y-8">
                    <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 mb-4 animate-pulse">
                        <ShieldAlert size={48} />
                    </div>
                    
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">Access <span className="text-red-500">Revoked</span></h1>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest leading-relaxed max-w-md">
                            Your account has been suspended due to repeated behavioral violations of the Grien standards.
                        </p>
                    </div>

                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 text-center">
                            <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Ban Tier</p>
                            <p className="text-xl font-black italic text-red-500 uppercase leading-none">{getBanDuration()}</p>
                        </div>
                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 text-center">
                            <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Time to Restore</p>
                            <div className="flex items-center justify-center gap-2">
                                <Clock size={16} className="text-white" />
                                <p className="text-xl font-black italic text-white uppercase leading-none">{getRemainingTime()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
                        <h3 className="text-xs md:text-sm lg:text-base font-black uppercase text-gray-400 tracking-widest">Behavioral Ledger</h3>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${i <= (user?.redFlags || 0) ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5 border border-white/5 opacity-30'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${i <= (user?.redFlags || 0) ? 'bg-red-500' : 'bg-gray-600'}`} />
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-white">Strike {i}</span>
                                    </div>
                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase">Triggered</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full pt-8 space-y-4">
                        <button 
                            onClick={() => alert("Redirecting to Green Arbitration Hub... Maintain your dignity.")}
                            className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                        >
                            <MessageCircle size={16} /> Appeal This Decision
                        </button>
                        <button 
                            onClick={logout}
                            className="w-full py-5 bg-red-500 text-white rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-2xl shadow-red-500/20 hover:scale-105 transition-all flex items-center justify-center gap-3"
                        >
                            <LogOut size={16} /> Logout From Network
                        </button>
                    </div>
                    
                    <p className="text-[7px] font-black text-gray-700 uppercase tracking-[0.5em] mt-8">Secure Behavioral Lockdown Engine • v4.0.2</p>
                </div>
            </motion.div>
        </div>
    );
};

export default SuspensionPage;
