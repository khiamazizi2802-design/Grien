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

        const cleanEmail = email.trim().toLowerCase();
        const cleanPassword = password.trim();

        setTimeout(async () => {
            try {
                // 1. Prüfen, ob es ein registrierter Partner (Hotel- oder Stadion-Manager) ist
                const registeredPartners = JSON.parse(localStorage.getItem('green_registered_partners') || '[]');
                const matchedPartner = registeredPartners.find(
                    p => p.email?.toLowerCase() === cleanEmail && (!p.password || p.password === cleanPassword)
                );

                if (matchedPartner) {
                    localStorage.setItem('green_current_partner', JSON.stringify(matchedPartner));
                    sessionStorage.setItem('simulator_active_role', 'manager');
                    setSuccessMsg(`Willkommen, ${matchedPartner.name || matchedPartner.businessName}! Ihr Live-Dashboard wird geladen...`);
                    setIsAuthenticating(false);

                    setTimeout(() => {
                        const targetMode = matchedPartner.partnerType === 'SM' ? 'stadium' : 'hotel';
                        navigate(`/manager?mode=${targetMode}`);
                    }, 800);
                    return;
                }

                // 2. Ansonsten normale Authentifizierung
                const res = await login(cleanEmail, cleanPassword);
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

                setSuccessMsg('Signature Matched. Initiating Director Cockpit...');
                setIsAuthenticating(false);

                sessionStorage.removeItem('registration_pending_verification');

                setTimeout(() => {
                    navigate('/admin');
                }, 800);
            } catch (err) {
                console.error(err);
                setIsAuthenticating(false);
                setLoginError('Secure authentication gateway offline.');
            }
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 font-sans text-slate-800 relative overflow-hidden">
            {/* Floating Moving Background Ambient Glows (Outside Card) */}
            <motion.div 
                animate={{ 
                    x: [0, 50, -30, 0], 
                    y: [0, -40, 30, 0], 
                    scale: [1, 1.2, 0.9, 1] 
                }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-emerald-200/35 blur-[130px] rounded-full pointer-events-none" 
            />
            <motion.div 
                animate={{ 
                    x: [0, -60, 40, 0], 
                    y: [0, 50, -30, 0], 
                    scale: [1, 1.15, 0.95, 1] 
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-32 -right-32 w-[550px] h-[550px] bg-teal-200/35 blur-[130px] rounded-full pointer-events-none" 
            />
            <motion.div 
                animate={{ 
                    scale: [1, 1.25, 1], 
                    opacity: [0.25, 0.5, 0.25] 
                }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-emerald-100/40 blur-[150px] rounded-full pointer-events-none" 
            />

            <button 
                onClick={() => navigate('/')}
                className="absolute top-8 left-8 w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all shadow-sm z-50"
            >
                <ArrowLeft size={20} />
            </button>

            <div className="w-full max-w-md bg-white border border-slate-200/80 p-8 md:p-10 rounded-[32px] shadow-[0_15px_45px_rgba(0,0,0,0.05)]">
                
                {/* Visual Header */}
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5 shadow-sm">
                        {isBlocked ? (
                            <ShieldAlert size={38} className="text-red-500 animate-bounce" />
                        ) : (
                            <Fingerprint size={40} />
                        )}
                    </div>

                    <h1 className="text-3xl font-black tracking-tight italic uppercase text-slate-900">
                        Grien <span className="text-emerald-600">Portal</span>
                    </h1>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                        System Login
                    </p>
                </div>

                {/* Form Content */}
                <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-4">
                    
                    {/* User Feedbacks / Errors / Successes */}
                    <AnimatePresence mode="wait">
                        {loginError && (
                            <motion.div 
                                initial={{ opacity: 0, y: -8 }} 
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold"
                            >
                                <ShieldAlert size={18} className="shrink-0" />
                                <div>{loginError}</div>
                            </motion.div>
                        )}
                        {successMsg && (
                            <motion.div 
                                initial={{ opacity: 0, y: -8 }} 
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs font-bold"
                            >
                                <CheckCircle2 size={18} className="shrink-0" />
                                <div>{successMsg}</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-3">
                        
                        {/* Email Input */}
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="email"
                                name="login_email"
                                autoComplete="off"
                                placeholder="E-Mail-Adresse"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-slate-400 focus:bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-colors"
                                required
                                disabled={isBlocked || isAuthenticating}
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setLoginError(''); }}
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                name="login_password"
                                autoComplete="new-password"
                                placeholder="Passwort"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-slate-400 focus:bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-colors"
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
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-2 mt-3 transition-all ${
                            isBlocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 
                            isAuthenticating ? 'bg-emerald-600 text-white cursor-wait opacity-80' :
                            'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99]'
                        }`}
                    >
                        {isAuthenticating ? 'Authentifizierung...' : isBlocked ? 'Gesperrt' : (
                            <>
                                Log In <ChevronRight size={18} />
                            </>
                        )}
                    </button>

                </form>

            </div>
        </div>
    );
};

export default Login;
