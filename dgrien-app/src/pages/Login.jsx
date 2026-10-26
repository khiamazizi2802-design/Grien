import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Fingerprint, ArrowLeft, ShieldAlert, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    const [attempts, setAttempts] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        setEmail('');
        setPassword('');
    }, []);


    const handleLoginSubmit = (e) => {
        e.preventDefault();
        if (isBlocked) {
            setLoginError('CRITICAL LOCKDOWN: Core credentials node blocked. Contact security.');
            return;
        }

        setLoginError('');
        setSuccessMsg('');
        setIsAuthenticating(true);

        // 1.2 second mock cryptographic check delay for biometric/cyber aesthetics
        setTimeout(async () => {
            try {
                const res = await login(email, password);
                if (!res.success) {
                    const newAttempts = attempts + 1;
                    setAttempts(newAttempts);
                    setIsAuthenticating(false);

                    if (newAttempts >= 3) {
                        setIsBlocked(true);
                        setLoginError('CRITICAL LOCKOUT: 3 failed verification cycles. Node quarantined.');
                    } else {
                        setLoginError(`${res.message || 'Signal not matched.'} (${newAttempts}/3 failed attempts)`);
                    }
                    return;
                }

                setSuccessMsg('Signature Matched. Initiating tunnel...');
                setIsAuthenticating(false);

                sessionStorage.removeItem('registration_pending_verification');

                setTimeout(() => {
                    const loggedUser = res.user;
                    if (loggedUser.role === 'passenger') {
                        navigate('/home');
                    } else if (loggedUser.role === 'driver') {
                        navigate('/driver');
                    } else if (loggedUser.role === 'staff') {
                        if (loggedUser.onboarded !== true) {
                            navigate('/green-id-pending');
                        } else {
                            navigate('/manager');
                        }
                    } else if (loggedUser.role === 'super_admin') {
                        navigate('/admin');
                    } else {
                        navigate('/manager');
                    }
                }, 800);
            } catch (err) {
                console.error(err);
                setIsAuthenticating(false);
                setLoginError('Secure authentication gateway offline.');
            }
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 font-sans text-[var(--text-primary)] relative overflow-hidden">
            {/* Cyber Grid Background */}
            <div className="absolute inset-0 cyber-grid-bg opacity-[0.03] pointer-events-none" />
            
            {/* Ambient Blurred Overlays */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-brand/5 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute bottom-10 right-10 text-[var(--text-muted)]/10 text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.5em] rotate-90 origin-left">
                SYSTEM_ONBOARDING_MODULE: v2.4
            </div>

            <button 
                onClick={() => navigate('/')}
                className="absolute top-8 left-8 w-12 h-12 bg-[var(--bg-secondary)]/50 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-brand z-[100] hover:scale-110 transition-all shadow-2xl"
            >
                <ArrowLeft size={24} />
            </button>

            <div className="w-full max-w-lg relative z-10 bg-[var(--bg-secondary)]/50 backdrop-blur-2xl border border-white/5 p-8 md:p-10 rounded-[40px] shadow-2xl">
                
                {/* Visual Scanner Module */}
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="relative group mb-6">
                        <motion.div 
                            animate={isAuthenticating ? { scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] } : {}}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            className={`absolute inset-0 rounded-[2.5rem] blur-[40px] transition-all duration-500 ${
                                isBlocked ? 'bg-red-500' : successMsg ? 'bg-brand' : 'bg-brand-mid'
                            }`} 
                        />
                        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center relative z-10 glass-panel border transition-all duration-500 ${
                            isBlocked ? 'border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' :
                            successMsg ? 'border-brand text-brand shadow-[0_0_30px_rgba(var(--accent-primary-rgb),0.2)]' :
                            isAuthenticating ? 'border-brand text-brand animate-pulse' : 'border-white/10 text-brand'
                        }`}>
                            {isBlocked ? (
                                <ShieldAlert size={44} className="animate-bounce" />
                            ) : (
                                <Fingerprint size={48} className="drop-shadow-glow" />
                            )}
                            
                            {/* Scanning Sweep Laser Animation */}
                            {isAuthenticating && (
                                <motion.div 
                                    initial={{ y: -40 }}
                                    animate={{ y: 40 }}
                                    transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                                    className="absolute left-0 right-0 h-0.5 bg-brand shadow-[0_0_10px_currentColor]"
                                />
                            )}
                        </div>
                    </div>

                    <h1 className="text-4xl font-black tracking-tighter italic uppercase text-[var(--text-primary)]">
                        Grien <span className="text-brand">Portal</span>
                    </h1>
                    {(isBlocked || successMsg || isAuthenticating) && (
                        <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mt-2 italic">
                            {isBlocked ? 'ACCESS DENIED' : successMsg ? 'DECRYPTING SHELL' : 'HANDSHAKE ACTIVE'}
                        </p>
                    )}
                </div>

                {/* Form Content */}
                <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-5">
                    
                    {/* User Feedbacks / Errors / Successes */}
                    <AnimatePresence mode="wait">
                        {loginError && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs md:text-sm lg:text-base font-bold leading-normal"
                            >
                                <ShieldAlert size={20} className="shrink-0" />
                                <div>{loginError}</div>
                            </motion.div>
                        )}
                        {successMsg && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="p-4 bg-brand/10 border border-brand/20 rounded-2xl flex items-center gap-3 text-brand text-xs md:text-sm lg:text-base font-bold leading-normal"
                            >
                                <CheckCircle2 size={20} className="shrink-0" />
                                <div>{successMsg}</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-4">
                        
                        {/* Email Input */}
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="email"
                                name="login_email"
                                autoComplete="off"
                                placeholder="Security Email Signature"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand/40 text-sm font-bold text-[var(--text-primary)] placeholder:text-gray-400/60 transition-colors"
                                required
                                disabled={isBlocked || isAuthenticating}
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setLoginError(''); }}
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="password"
                                name="login_password"
                                autoComplete="new-password"
                                placeholder="Access Password"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand/40 text-sm font-bold text-[var(--text-primary)] placeholder:text-gray-400/60 transition-colors"
                                required
                                disabled={isBlocked || isAuthenticating}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
                            />
                        </div>

                    </div>

                    <button
                        type="submit"
                        disabled={isBlocked || isAuthenticating}
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm lg:text-base shadow-xl flex items-center justify-center gap-2 mt-4 transition-all duration-300 ${
                            isBlocked ? 'bg-white/5 text-red-500/30 border border-red-500/10 cursor-not-allowed shadow-none' : 
                            isAuthenticating ? 'bg-brand-mid/20 text-brand border border-brand/20 cursor-wait' :
                            'bg-brand text-dark-950 hover:shadow-brand-glow hover:scale-[1.02] active:scale-95'
                        }`}
                    >
                        {isAuthenticating ? 'Decrypting Network...' : isBlocked ? 'quarantined' : (
                            <>
                                Log In <ChevronRight size={18} />
                            </>
                        )}
                    </button>

                </form>



                <p className="mt-6 text-center text-[var(--text-muted)] text-[11px] md:text-sm lg:text-base font-black uppercase tracking-widest">
                    <Link to="/signup" className="text-brand hover:underline">Create Account</Link>
                </p>

            </div>
        </div>
    );
};

export default Login;
