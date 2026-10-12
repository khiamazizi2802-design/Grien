import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ShieldCheck, Zap, CreditCard, Users } from 'lucide-react';

const NotificationToast = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const handleNotification = (e) => {
            const { type, title, message } = e.detail;
            const id = Date.now();
            setNotifications(prev => [...prev, { id, type, title, message }]);
            
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, 6000);
        };

        window.addEventListener('green-notification', handleNotification);
        return () => window.removeEventListener('green-notification', handleNotification);
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <ShieldCheck className="text-[var(--accent-primary)]" size={18} />;
            case 'payment': return <CreditCard className="text-[var(--accent-primary)]" size={18} />;
            case 'transfer': return <Users className="text-[var(--accent-primary)]" size={18} />;
            case 'surge': return <Zap className="text-[var(--accent-primary)]" size={18} />;
            default: return <Bell className="text-[var(--accent-primary)]" size={18} />;
        }
    };

    return (
        <div className="fixed top-6 right-6 z-[999] flex flex-col gap-4 pointer-events-none">
            <AnimatePresence>
                {notifications.map((n) => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="w-80 bg-[#0D1421]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl pointer-events-auto flex gap-4"
                    >
                        <div className="mt-1">{getIcon(n.type)}</div>
                        <div className="flex-1">
                            <p className="text-xs md:text-sm lg:text-base font-black uppercase text-white tracking-tighter">{n.title}</p>
                            <p className="text-[10px] md:text-xs lg:text-sm text-gray-400 font-medium mt-1 leading-relaxed">{n.message}</p>
                        </div>
                        <button 
                            onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))}
                            className="h-fit p-1 hover:bg-white/5 rounded-lg text-gray-600 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export const triggerNotification = (type, title, message) => {
    const event = new CustomEvent('green-notification', { detail: { type, title, message } });
    window.dispatchEvent(event);
};

export default NotificationToast;
