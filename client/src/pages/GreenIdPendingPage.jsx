import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Copy, CheckCircle2, Clock, LogOut, Sparkles } from 'lucide-react';

const GreenIdPendingPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [pulse, setPulse] = useState(false);

    // Pull Green ID from user object or localStorage fallback
    const greenId = user?.greenId || localStorage.getItem('green_pending_id') || 'GRN-XXXX-XXXX';
    const userName = user?.name || 'New Member';
    const userRole = user?.role === 'driver' ? 'Driver / Pilot' : 'Staff Member';

    useEffect(() => {
        // Pulse animation every 3 seconds
        const interval = setInterval(() => setPulse(p => !p), 3000);
        return () => clearInterval(interval);
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(greenId).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">

            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/8 blur-[160px] rounded-full" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand/5 blur-[120px] rounded-full" />
            </div>

            {/* Floating particle dots */}
            {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-brand/30"
                    style={{
                        top: `${10 + (i * 7) % 80}%`,
                        left: `${5 + (i * 13) % 90}%`,
                    }}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.8, 1] }}
                    transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
                />
            ))}

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-full max-w-lg relative z-10 space-y-6"
            >
                {/* Header card */}
                <div className="bg-[var(--bg-secondary)]/60 backdrop-blur-2xl border border-white/8 rounded-[3rem] p-10 text-center shadow-2xl relative overflow-hidden">
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent" />

                    {/* Success icon */}
                    <motion.div
                        animate={{ scale: pulse ? 1.05 : 1, boxShadow: pulse ? '0 0 40px rgba(0,200,100,0.3)' : '0 0 20px rgba(0,200,100,0.1)' }}
                        transition={{ duration: 1.2 }}
                        className="w-24 h-24 rounded-[2.5rem] bg-brand/10 border border-brand/30 flex items-center justify-center mx-auto mb-8 relative"
                    >
                        <ShieldCheck size={42} className="text-brand" />
                        <motion.div
                            className="absolute -top-1 -right-1 w-6 h-6 bg-brand rounded-full flex items-center justify-center"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <CheckCircle2 size={14} className="text-dark-950" />
                        </motion.div>
                    </motion.div>

                    <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2">
                        Registration <span className="text-brand">Complete</span>
                    </h1>
                    <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-[11px] md:text-sm lg:text-base">
                        Welcome to the Grien Network, {userName}
                    </p>
                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-600 uppercase tracking-widest mt-1">
                        {userRole}
                    </p>
                </div>

                {/* Green ID Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                    className="bg-gradient-to-br from-brand/15 via-brand/8 to-transparent border border-brand/25 rounded-[2.5rem] p-8 relative overflow-hidden shadow-[0_0_60px_rgba(0,200,100,0.1)]"
                >
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
                    <div className="absolute -top-6 -right-6 w-32 h-32 bg-brand/5 rounded-full blur-2xl" />

                    <div className="flex items-center gap-3 mb-5">
                        <Sparkles size={14} className="text-brand" />
                        <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand uppercase tracking-[0.25em]">Your Unique Grien ID</p>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <p className="text-4xl font-black font-mono tracking-widest text-white">
                            {greenId}
                        </p>
                        <button
                            onClick={handleCopy}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest transition-all border ${
                                copied
                                    ? 'bg-brand text-dark-950 border-brand shadow-[0_0_20px_var(--brand-glow)]'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-brand/40 hover:text-brand'
                            }`}
                        >
                            {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-500 font-bold mt-4 uppercase tracking-wider">
                        Share this ID with your Manager so they can onboard you
                    </p>
                </motion.div>

                {/* Waiting card */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.5 }}
                    className="bg-[var(--bg-secondary)]/40 backdrop-blur-xl border border-white/8 rounded-[2.5rem] p-8 space-y-5"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Clock size={18} className="text-amber-400" />
                        </div>
                        <div>
                            <p className="text-[11px] md:text-sm lg:text-base font-black text-white uppercase tracking-widest mb-1">Waiting for Manager Onboarding</p>
                            <p className="text-[10px] md:text-xs lg:text-sm text-[var(--text-muted)] font-medium leading-relaxed">
                                Your account is registered but not yet active. Your Manager must enter your Grien ID in their dashboard to link you to the business and activate your access.
                            </p>
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-3 pl-2">
                        {[
                            { step: '01', label: 'Share your Grien ID with your Manager', done: true },
                            { step: '02', label: 'Manager searches your Grien ID in their dashboard', done: false },
                            { step: '03', label: 'Manager activates your account + sets permissions', done: false },
                            { step: '04', label: 'You receive access and can log in to your dashboard', done: false },
                        ].map(({ step, label, done }) => (
                            <div key={step} className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] md:text-[10px] lg:text-xs font-black shrink-0 border ${
                                    done ? 'bg-brand border-brand text-dark-950' : 'bg-white/5 border-white/10 text-gray-500'
                                }`}>
                                    {done ? <CheckCircle2 size={12} /> : step}
                                </div>
                                <p className={`text-[10px] md:text-xs lg:text-sm font-bold ${done ? 'text-brand' : 'text-gray-500'}`}>{label}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Instant Tactical Bypass approval button for sandbox mode */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="p-1 bg-gradient-to-r from-brand/20 via-brand/40 to-brand/20 rounded-[2.5rem] shadow-lg shadow-brand/10"
                >
                    <button
                        onClick={async () => {
                            try {
                                if (user && user.email) {
                                    // 1. Force update user profile in local storage
                                    const updatedProfile = { ...user, onboarded: true };
                                    
                                    // 2. Update Firestore users collection
                                    const { db } = await import('../config/firebase');
                                    const { doc, setDoc } = await import('firebase/firestore');
                                    await setDoc(doc(db, 'users', user.email.toLowerCase()), updatedProfile);
                                    
                                    // 3. Dispatch global reload event or state update
                                    alert("TACTICAL BYPASS GRANTED: Account activated successfully! Redirecting to Dashboard...");
                                    
                                    // Force navigation based on role
                                    if (user.role === 'driver') {
                                        navigate('/driver');
                                    } else {
                                        navigate('/manager');
                                    }
                                    
                                    // Hard reload page to refresh Auth state
                                    window.location.reload();
                                } else {
                                    // If no user context (e.g. mock session), simulate onboarding manually
                                    alert("TACTICAL BYPASS: Redirecting to Driver Dashboard...");
                                    navigate('/driver');
                                }
                            } catch (e) {
                                console.error("Bypass failed:", e);
                                navigate(user?.role === 'driver' ? '/driver' : '/manager');
                            }
                        }}
                        className="w-full py-5 bg-[var(--bg-secondary)] border border-brand/20 rounded-[2.4rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.25em] text-brand hover:bg-brand hover:text-dark-950 hover:border-brand transition-all flex items-center justify-center gap-3 cursor-pointer"
                    >
                        <Sparkles size={16} /> Bypass Onboarding (Instant Approved)
                    </button>
                </motion.div>

                {/* Logout button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.65 }}
                    onClick={handleLogout}
                    className="w-full py-4 bg-white/5 border border-white/8 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
                >
                    <LogOut size={14} />
                    Return to Home
                </motion.button>
            </motion.div>
        </div>
    );
};

export default GreenIdPendingPage;
