import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Phone, Mail, ArrowRight, RefreshCw, Zap, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const VerificationPage = () => {
    const { user, verify } = useAuth();
    const navigate = useNavigate();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(30);
    const [verificationCode, setVerificationCode] = useState('');
    const [toastMessage, setToastMessage] = useState(null);
    const inputRefs = useRef([]);

    // Generate code on mount
    useEffect(() => {
        const generated = Math.floor(100000 + Math.random() * 900000).toString();
        setVerificationCode(generated);
        
        const toastTimer = setTimeout(() => {
            setToastMessage(`[Guardian Secure Dispatch] Your 2-Factor Authentication code is: ${generated}`);
        }, 8000); // 8-second delay after mount so user can see it arrive in real-time

        return () => clearTimeout(toastTimer);
    }, []);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const handleInput = (index, value) => {
        if (isNaN(value)) return;
        const newCode = [...code];
        newCode[index] = value.substring(value.length - 1);
        setCode(newCode);

        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleSubmit = async () => {
        setIsVerifying(true);
        setError('');
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const finalCode = code.join('');
        if (finalCode === verificationCode) {
            verify();
            sessionStorage.removeItem('registration_pending_verification');
            
            // Redirect to correct page based on user role
            const role = user?.role;
            if (role === 'passenger') {
                navigate('/home');
            } else if (role === 'driver') {
                navigate('/driver');
            } else if (role === 'staff') {
                if (user?.onboarded !== true) {
                    navigate('/green-id-pending');
                } else {
                    navigate('/manager');
                }
            } else if (role === 'super_admin') {
                navigate('/admin');
            } else {
                navigate('/manager');
            }
        } else {
            setError('Invalid Verification Code. Please try again.');
            setIsVerifying(false);
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0].focus();
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6 font-sans text-[var(--text-primary)] relative overflow-hidden">
            {/* Guardian Secure Dispatch Toast */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="fixed top-6 left-6 right-6 md:left-auto md:w-96 md:right-6 bg-dark-950/90 border border-brand/30 backdrop-blur-xl p-5 rounded-2xl shadow-[0_0_50px_rgba(33,255,165,0.15)] z-50 flex gap-4 items-start"
                    >
                        <div className="p-2 bg-brand/10 rounded-xl text-brand shrink-0">
                            <ShieldCheck size={20} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest leading-none">Security Dispatch</p>
                            <p className="text-xs md:text-sm lg:text-base text-gray-300 font-bold leading-snug">
                                A secure 2FA code has been routed to your registered device:
                            </p>
                            <div className="flex items-center gap-2 mt-2 bg-white/5 px-3 py-2 rounded-lg border border-white/5 w-fit">
                                <span className="text-sm font-black text-brand tracking-widest monospace">{verificationCode}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setToastMessage(null)}
                            className="text-gray-500 hover:text-white ml-auto text-xs md:text-sm lg:text-base font-bold leading-none"
                        >
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/30 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/20 blur-[120px] rounded-full" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-10 space-y-4">
                    <div className="w-20 h-20 bg-brand/10 rounded-3xl flex items-center justify-center text-brand mx-auto border border-brand/20 shadow-[0_0_40px_rgba(33,255,165,0.1)]">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">Identity <span className="text-brand">Verification</span></h1>
                    <p className="text-gray-500 text-[10px] md:text-xs lg:text-sm font-bold uppercase tracking-[0.4em] leading-none">Dual-Channel Security Protocol Active</p>
                </div>

                <div className="glass-panel p-10 rounded-[3rem] border border-white/10 space-y-8 backdrop-blur-3xl bg-white/[0.02]">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="p-3 bg-brand/10 rounded-xl text-brand"><Phone size={18} /></div>
                            <div>
                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Phone Verification</p>
                                <p className="text-sm font-bold text-[var(--text-primary)] italic">+49 ••• ••• ••42</p>
                            </div>
                            <div className="ml-auto flex items-center gap-1 text-[8px] md:text-[10px] lg:text-xs font-black text-white uppercase">
                                <ShieldCheck size={10} /> SENT
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="p-3 bg-brand/10 rounded-xl text-brand"><Mail size={18} /></div>
                            <div>
                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Email Verification</p>
                                <p className="text-sm font-bold text-[var(--text-primary)] italic">{user?.email || '••••@green.com'}</p>
                            </div>
                            <div className="ml-auto flex items-center gap-1 text-[8px] md:text-[10px] lg:text-xs font-black text-white uppercase">
                                <ShieldCheck size={10} /> SENT
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between gap-3">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => inputRefs.current[index] = el}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={e => handleInput(index, e.target.value)}
                                    onKeyDown={e => handleKeyDown(index, e)}
                                    className="w-full aspect-square bg-white/5 border border-white/10 rounded-2xl text-center text-2xl font-black text-brand focus:border-brand/50 outline-none transition-all"
                                />
                            ))}
                        </div>

                        {error && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-[10px] md:text-xs lg:text-sm font-black uppercase text-center tracking-widest italic">{error}</motion.p>
                        )}

                        <button 
                            onClick={handleSubmit}
                            disabled={isVerifying || code.some(d => !d)}
                            className="w-full py-6 bg-brand text-dark-950 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-3 overflow-hidden group"
                        >
                            {isVerifying ? (
                                <RefreshCw size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <span>Verify Access</span>
                                    <Zap size={18} className="group-hover:scale-125 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>

                    <div className="text-center">
                        <button 
                            disabled={resendTimer > 0}
                            onClick={() => {
                                const newGenerated = Math.floor(100000 + Math.random() * 900000).toString();
                                setVerificationCode(newGenerated);
                                setToastMessage(`[Guardian Secure Dispatch] Your 2-Factor Authentication code is: ${newGenerated}`);
                                setResendTimer(30);
                            }}
                            className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-600 hover:text-brand transition-colors disabled:opacity-50"
                        >
                            {resendTimer > 0 ? `Resend ZAP Code in ${resendTimer}s` : 'Resend Verification Code'}
                        </button>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-widest">
                        Protected by <span className="text-brand">Guardian AI</span> Neural Shield v4.0
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default VerificationPage;

