import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    Clock, 
    ArrowLeft, 
    MapPin, 
    ShoppingBag, 
    Car, 
    ShieldCheck, 
    ChevronRight,
    MessageSquare,
    Phone,
    Info,
    QrCode,
    X
} from 'lucide-react';

const MissionControlPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [order, setOrder] = useState(null);
    const [driverEta, setDriverEta] = useState(5);
    const [driverDistance, setDriverDistance] = useState(2.4);
    const [prepTime, setPrepTime] = useState(8);
    const [isQRFullScreen, setIsQRFullScreen] = useState(false);

    const qrCodeImage = "/C:/Users/AURUMPC/.gemini/antigravity/brain/70a19bc6-0053-4f6e-95c5-85cd3079991d/parking_qr_code_1777756601233.png";

    useEffect(() => {
        const loadOrder = () => {
            const saved = JSON.parse(localStorage.getItem('green_active_orders') || '[]');
            if (saved.length > 0) {
                setOrder(saved[0]);
            } else {
                // Mock parking order for demo if none exists
                setOrder({ id: 'PRK-992', venueName: 'Eco-Park Central', status: 'Active' });
            }
        };

        loadOrder();
        
        const timer = setInterval(() => {
            setPrepTime(p => Math.max(0, p - 1));
            setDriverEta(e => Math.max(0, e - 1));
            setDriverDistance(d => Math.max(0.1, +(d - 0.1).toFixed(1)));
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    const isParking = false;
    const isReady = prepTime === 0;

    return (
        <div className="relative w-full min-h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)] overflow-x-hidden pb-24">
            {/* Background Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/5">
                    <ArrowLeft size={18} />
                </button>
                <div className="text-center">
                    <h1 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-brand">Mission Control</h1>
                    <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">Active Operation Terminal</p>
                </div>
                <div className="w-10 h-10 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center text-brand">
                    <Zap size={18} fill="currentColor" />
                </div>
            </header>

            <main className="p-6 max-w-lg mx-auto space-y-6">
                
                {/* PRIMARY LOGIC CARD (Context Aware) */}
                <section className="bg-[var(--bg-secondary)] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        {isParking ? <QrCode size={100} /> : <Clock size={100} />}
                    </div>
                    
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${isParking || isReady ? 'bg-brand/20 border-brand text-brand' : 'bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse'}`}>
                                {isParking ? <QrCode size={28} /> : <ShoppingBag size={28} />}
                            </div>
                            <div>
                                <h2 className="text-xl font-black italic uppercase tracking-tighter">
                                    {isParking ? 'PARKING LOGIC' : 'TAKEAWAY LOGIC'}
                                </h2>
                                <p className={`text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest ${isParking || isReady ? 'text-brand' : 'text-amber-500'}`}>
                                    {isParking ? 'Active Access Pass' : (isReady ? 'Ready for Pickup' : 'Preparation in Progress')}
                                </p>
                            </div>
                        </div>

                        {isParking ? (
                            <div className="space-y-6">
                                <div className="flex justify-center py-4 group cursor-pointer" onClick={() => setIsQRFullScreen(true)}>
                                    <div className="aspect-square w-48 bg-white p-3 rounded-[2rem] shadow-[0_0_40px_rgba(16,185,129,0.2)] border-2 border-brand/30 relative overflow-hidden">
                                        <img src={qrCodeImage} alt="Entry Pass" className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-white opacity-0 group-hover:opacity-100 uppercase">Tap to Scan</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase mb-1">Assigned Spot</p>
                                        <p className="text-xl font-black italic text-[var(--text-primary)]">Level -1, B12</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase mb-1">Validity</p>
                                        <p className="text-xl font-black italic text-[var(--text-primary)]">24 Hours</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase mb-1">Time Remaining</p>
                                    <p className="text-2xl font-black italic text-[var(--text-primary)] leading-none">{isReady ? '00:00' : `${prepTime}m`}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase mb-1">Items in Bag</p>
                                    <p className="text-2xl font-black italic text-[var(--text-primary)] leading-none">{order?.items?.length || 2}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* INTERCEPT CARD */}
                <section className="bg-[var(--bg-secondary)] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><Car size={100} /></div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                    <Car size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black italic uppercase tracking-tighter">
                                        {isParking ? 'VALET INTERCEPT' : 'RIDE INTERCEPT'}
                                    </h2>
                                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-blue-400 uppercase tracking-widest">
                                        {isParking ? 'Agent: Marco S.' : 'Driver: Marcus H.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase mb-1">Arrival ETA</p>
                                <p className="text-2xl font-black italic text-[var(--text-primary)] leading-none">{driverEta}m</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase mb-1">Distance</p>
                                <p className="text-2xl font-black italic text-[var(--text-primary)] leading-none">{driverDistance}km</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* INTEL BANNER */}
                <div className="bg-brand/10 border border-brand/20 p-6 rounded-[2.5rem] flex items-start gap-4">
                    <ShieldCheck size={20} className="text-brand flex-shrink-0 mt-1" />
                    <div className="space-y-2">
                        <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand">Operation Protocol</p>
                        <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-brand/80 leading-relaxed uppercase">
                            {isParking 
                                ? "Scan your QR pass at the entrance gate. If using Valet, pull into the green zone and hand over your keys to Marco S."
                                : "Collect your takeaway first — the driver will wait 2 minutes. The vehicle trunk is auto-unlocked for your bags."}
                        </p>
                    </div>
                </div>

                <button onClick={() => navigate('/greens')} className="w-full py-6 bg-white/5 border border-white/10 rounded-[2.5rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-all">Back to Greens Hub</button>
            </main>

            {/* Full Screen QR */}
            <AnimatePresence>
                {isQRFullScreen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black flex items-center justify-center p-8">
                        <button onClick={() => setIsQRFullScreen(false)} className="absolute top-12 right-8 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white"><X size={24} /></button>
                        <div className="space-y-12 text-center w-full">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Entry QR Pass</h2>
                                <p className="text-[10px] md:text-xs lg:text-sm text-brand font-black uppercase tracking-[0.3em]">Brightness Authorized</p>
                            </div>
                            <div className="aspect-square w-full max-w-[400px] mx-auto bg-white p-8 rounded-[3rem]">
                                <img src={qrCodeImage} alt="Entry Pass Full" className="w-full h-full object-contain" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MissionControlPage;
