import React from 'react';
import { motion } from 'framer-motion';
import { 
    ArrowLeft, Clock, MapPin, User, Zap, 
    Shield, History, TrendingUp, Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RideHistoryHub = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const userEmailKey = user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'default';
    const isDemo = user?.isDemo;

    const getServiceIcon = (service) => {
        const s = (service || '').toUpperCase();
        if (s.includes('PREMIUM')) return Shield;
        if (s.includes('CYBER') || s.includes('DISPATCH')) return Zap;
        return Clock;
    };

    const localHistory = React.useMemo(() => {
        try {
            const data = localStorage.getItem(`green_ride_history_${userEmailKey}`);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error(e);
        }
        return [];
    }, [userEmailKey]);

    const displayHistory = React.useMemo(() => {
        if (localHistory && localHistory.length > 0) {
            return localHistory.map(ride => ({
                ...ride,
                icon: getServiceIcon(ride.service)
            }));
        }
        if (isDemo) {
            return [
                { id: 1, service: 'CYBERDISPATCH', date: 'TODAY, 18:42', price: '€ 14.20', destination: 'Cyber Terrace 42', driver: 'SERGEI K.', icon: Zap },
                { id: 2, service: 'PREMIUM RIDE', date: 'YESTERDAY, 21:15', price: '€ 22.50', destination: 'Neo Tokyo Central', driver: 'ELENA R.', icon: Shield },
                { id: 3, service: 'CLASSIC', date: '14 FEB, 09:30', price: '€ 8.90', destination: 'Uplink Tower', driver: 'MARCUS V.', icon: Clock }
            ];
        }
        return [];
    }, [localHistory, isDemo]);

    const memberSince = React.useMemo(() => {
        if (isDemo) return "JAN '24";
        if (user?.createdAt) {
            try {
                const date = typeof user.createdAt.toDate === 'function' ? user.createdAt.toDate() : new Date(user.createdAt);
                const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                return `${months[date.getMonth()]} '${String(date.getFullYear()).slice(-2)}`;
            } catch (e) {
                // ignore
            }
        }
        return "NEW";
    }, [isDemo, user]);

    return (
        <div className="min-h-screen bg-dark-950 text-primary font-sans relative pb-32 transition-colors duration-300">
            <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-main pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-6 px-6 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <button 
                    onClick={() => navigate(-1)}
                    className="w-12 h-12 bg-dark-900 border border-main rounded-2xl flex items-center justify-center text-primary shadow-sm active:scale-95 transition-all"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-black italic tracking-tighter uppercase text-primary">Ride History</h1>
                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] text-secondary mt-0.5">Fleet Mission Log</p>
                </div>
                <div className="w-12 h-12 bg-dark-900 border border-main rounded-2xl flex items-center justify-center text-primary">
                    <History size={24} />
                </div>
            </header>

            <main className="p-6 max-w-lg mx-auto space-y-10 pt-8">
                {/* Stats Section */}
                <section className="grid grid-cols-2 gap-4">
                    <div className="p-8 bg-dark-900 border border-main rounded-[2.5rem] relative shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden group text-left">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <TrendingUp size={60} className="text-brand" />
                        </div>
                        <div className="relative z-10 text-center space-y-2">
                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-brand">Fleet Stats ⚡</p>
                            <h2 className="text-4xl font-black italic tracking-tighter text-primary">{displayHistory.length}</h2>
                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-secondary">Total Trips</p>
                        </div>
                    </div>
                    <div className="p-8 bg-dark-900 border border-main rounded-[2.5rem] relative shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden group text-left">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Trophy size={60} className="text-brand" />
                        </div>
                        <div className="relative z-10 text-center space-y-2">
                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-brand">Network Tier 💎</p>
                            <h2 className="text-2xl font-black italic tracking-tighter text-primary">{memberSince}</h2>
                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-secondary">Member Since</p>
                        </div>
                    </div>
                </section>

                {/* Past Services List */}
                <section className="space-y-4">
                    <h3 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-secondary px-2 italic text-left">Past Services</h3>
                    <div className="space-y-4">
                        {displayHistory.map((ride, i) => (
                            <motion.div 
                                key={ride.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-dark-900 border border-main rounded-[2.5rem] p-8 group hover:border-primary transition-all shadow-[0_15px_35px_rgba(0,0,0,0.05)]"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-dark-950 rounded-2xl flex items-center justify-center text-primary border border-main group-hover:scale-110 transition-transform">
                                            <ride.icon size={24} />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-xs md:text-sm lg:text-base font-black italic tracking-widest text-primary uppercase">{ride.service}</h4>
                                            <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest mt-1">{ride.date}</p>
                                        </div>
                                    </div>
                                    <p className="text-base font-black italic text-primary">{ride.price}</p>
                                </div>
                                
                                <div className="space-y-4 pt-6 border-t border-main text-left">
                                    <div className="flex items-center gap-3">
                                        <MapPin size={14} className="text-gray-500" />
                                        <p className="text-sm font-black italic text-primary opacity-80 uppercase tracking-tight">{ride.destination}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <User size={14} className="text-gray-500" />
                                        <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-secondary">Driver: {ride.driver}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>

            <div className="fixed bottom-0 left-0 right-0 px-6 pt-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] bg-gradient-to-t from-dark-950 via-dark-950/90 to-transparent">
                <button 
                    onClick={() => navigate(-1)}
                    className="w-full py-6 border border-main rounded-[2.5rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                    style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                >
                    Return to Mission Hub
                </button>
            </div>
        </div>
    );
};

export default RideHistoryHub;
