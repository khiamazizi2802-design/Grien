import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Users, Building2, Globe, ShieldCheck, Car } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import ThemeToggle from '../components/ThemeToggle';

const LandingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            if (user.role === 'passenger') {
                navigate('/home');
            } else if (user.role === 'driver') {
                navigate('/driver');
            } else if (user.role === 'super_admin') {
                navigate('/admin');
            } else {
                navigate('/manager');
            }
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col relative overflow-hidden">
            {/* --- COSMIC BACKGROUND --- */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-mid/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* --- HEADER / PARTNER GATE --- */}
            <header className="relative z-50 px-6 pt-14 pb-6 md:pt-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="font-black tracking-tighter text-3xl italic uppercase text-[var(--text-primary)]">Green</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <button 
                        onClick={() => navigate('/signup?mode=partner')}
                        className="icon-button w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                    >
                        <Building2 size={16} />
                    </button>
                </div>
            </header>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-2xl translate-y-[10vh]"
                >
                    <p className="text-xl text-[var(--text-secondary)] font-black max-w-2xl mx-auto uppercase tracking-widest leading-relaxed mb-12">
                        The Future of Urban Mobility is Green. Join the Elite Network of Drivers and Passengers.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={() => navigate('/signup?mode=passenger')}
                            className="neon-button px-12 py-5 rounded-3xl flex items-center justify-center gap-3 group"
                        >
                            Get Started <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button 
                            onClick={() => navigate('/login')}
                            className="secondary-button px-12 py-5 rounded-3xl text-xs md:text-sm lg:text-base"
                        >
                            Login
                        </button>
                    </div>
                </motion.div>
            </main>

        
</div>
    );
};

export default LandingPage;
