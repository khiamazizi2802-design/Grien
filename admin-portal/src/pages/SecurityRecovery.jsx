import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Key, Smartphone, Mail, ArrowRight, CheckCircle, ShieldAlert, Lock, Zap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SecurityRecovery = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState('verify'); // 'verify' | 'reset' | 'success'
    const [emailCode, setEmailCode] = useState('');
    const [smsCode, setSmsCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [strength, setStrength] = useState(0);

    const handleVerify = (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate verification
        setTimeout(() => {
            setIsLoading(false);
            setStep('reset');
        }, 1500);
    };

    const handleReset = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setStep('success');
        }, 2000);
    };

    useEffect(() => {
        // Simple strength calculator
        let s = 0;
        if (newPassword.length > 8) s++;
        if (/[A-Z]/.test(newPassword)) s++;
        if (/[0-9]/.test(newPassword)) s++;
        if (/[^A-Za-z0-9]/.test(newPassword)) s++;
        setStrength(s);
    }, [newPassword]);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center p-6 font-sans selection:bg-brand selection:text-dark-900">
            {/* Background Neural Network Aesthetic */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Header Card */}
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <ShieldCheck size={120} className="text-brand" />
                    </div>

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand border border-brand/20">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Security <span className="text-brand">Terminal</span></h1>
                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] text-gray-500 mt-1">Verification Protocol v4.2</p>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 'verify' && (
                                <motion.div
                                    key="verify"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-2">
                                        <h2 className="text-xl font-black italic uppercase tracking-tight">Identity Verification</h2>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-400 uppercase leading-relaxed">Please enter the 6-digit codes sent to your registered communication channels.</p>
                                    </div>

                                    <form onSubmit={handleVerify} className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2 group">
                                                <div className="flex items-center justify-between px-1">
                                                    <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest flex items-center gap-2">
                                                        <Mail size={12} /> Email Verification
                                                    </label>
                                                </div>
                                                    <input 
                                                        type="text" 
                                                        placeholder="0 0 0 0 0 0"
                                                        maxLength="6"
                                                        value={emailCode}
                                                        onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
                                                        className="w-full bg-[var(--bg-secondary)] border border-white/5 rounded-2xl p-5 text-center text-2xl font-black tracking-[0.5em] text-brand focus:border-brand/50 outline-none transition-all shadow-inner"
                                                    />
                                            </div>

                                            <div className="space-y-2 group">
                                                <div className="flex items-center justify-between px-1">
                                                    <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest flex items-center gap-2">
                                                        <Smartphone size={12} /> SMS Verification
                                                    </label>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    placeholder="0 0 0 0 0 0"
                                                    maxLength="6"
                                                    value={smsCode}
                                                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                                                    className="w-full bg-dark-950 border border-white/5 rounded-2xl p-5 text-center text-2xl font-black tracking-[0.5em] text-brand focus:border-brand/50 outline-none transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={emailCode.length < 6 || smsCode.length < 6 || isLoading}
                                            className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] italic text-xs md:text-sm lg:text-base flex items-center justify-center gap-3 transition-all ${emailCode.length === 6 && smsCode.length === 6 ? 'bg-brand text-dark-950 shadow-xl shadow-brand/20 active:scale-95' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}`}
                                        >
                                            {isLoading ? (
                                                <div className="w-5 h-5 border-4 border-dark-900 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>Authorize Keys <ArrowRight size={18} /></>
                                            )}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {step === 'reset' && (
                                <motion.div
                                    key="reset"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-2">
                                        <h2 className="text-xl font-black italic uppercase tracking-tight">Set New Password</h2>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-400 uppercase leading-relaxed">Verification successful. Please establish your new encrypted security credential.</p>
                                    </div>

                                    <form onSubmit={handleReset} className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest ml-1">New Password</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                                    <input 
                                                        type="password" 
                                                        placeholder="••••••••••••"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="w-full bg-[var(--bg-secondary)] border border-white/5 rounded-2xl p-5 pl-12 text-sm font-bold text-[var(--text-primary)] focus:border-brand outline-none transition-all shadow-inner"
                                                    />
                                                </div>
                                                {/* Password Strength Indicator */}
                                                <div className="flex gap-1.5 mt-2 px-1">
                                                    {[...Array(4)].map((_, i) => (
                                                        <div 
                                                            key={i} 
                                                            className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < strength ? (strength <= 2 ? 'bg-orange-500' : 'bg-brand') : 'bg-white/5'}`} 
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest ml-1">Confirm Password</label>
                                                <div className="relative">
                                                    <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                                    <input 
                                                        type="password" 
                                                        placeholder="••••••••••••"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="w-full bg-dark-950 border border-white/5 rounded-2xl p-5 pl-12 text-sm font-bold text-white focus:border-brand outline-none transition-all shadow-inner"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={strength < 3 || newPassword !== confirmPassword || isLoading}
                                            className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] italic text-xs md:text-sm lg:text-base flex items-center justify-center gap-3 transition-all ${strength >= 3 && newPassword === confirmPassword ? 'bg-brand text-dark-950 shadow-xl shadow-brand/20 active:scale-95' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}`}
                                        >
                                            {isLoading ? (
                                                <div className="w-5 h-5 border-4 border-dark-900 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>Apply Encryption <Zap size={18} /></>
                                            )}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {step === 'success' && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8 space-y-8"
                                >
                                    <div className="relative inline-block">
                                        <div className="absolute inset-0 bg-brand/20 blur-[40px] rounded-full animate-pulse" />
                                        <div className="w-24 h-24 bg-brand/10 border-2 border-brand rounded-full flex items-center justify-center text-brand relative z-10">
                                            <CheckCircle size={48} />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Security Hardened</h2>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Your credentials have been successfully updated across all neural nodes.</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="w-full py-5 bg-white text-dark-950 rounded-[2rem] font-black uppercase tracking-[0.2em] italic text-xs md:text-sm lg:text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        Return to Base <ArrowLeft size={18} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Meta */}
                <div className="mt-8 text-center flex items-center justify-center gap-2">
                    <ShieldAlert size={14} className="text-gray-600" />
                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-gray-600">Encrypted Session • Radar Neural Link</p>
                </div>
            </motion.div>
        </div>
    );
};

export default SecurityRecovery;
