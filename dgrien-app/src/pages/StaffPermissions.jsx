import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Shield, Save, CheckCircle, XCircle, 
    LayoutDashboard, ShoppingBag, Star, Image as ImageIcon, 
    Users, Zap, Receipt, ShieldCheck, Settings, Utensils,
    Building2, Briefcase, CreditCard, Handshake, History, Wallet, Bell, MessageSquare, Globe, Car, ToggleRight, TrendingUp, Map,
    Layers, Target, Droplets, QrCode, Trophy, Activity, Ticket,
    Lock, Unlock, Fingerprint, ShieldAlert, Key, BedDouble, GlassWater
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const StaffPermissions = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    
    // Determine the initial context based on manager email/identity (Same as ManagerDashboard)
    const getInitialContext = () => {
        if (user?.businessType) return user.businessType;
        if (user?.email?.includes('bar')) return 'BM';
        if (user?.email?.includes('restaurant') || user?.email?.includes('food')) return 'RM';
        if (user?.email?.includes('hotel') || user?.email?.includes('palace')) return 'HM';
        if (user?.email?.includes('club') || user?.email?.includes('party')) return 'CM';
        if (user?.email?.includes('stadium')) return 'SM';
        return 'FM'; // Default to Fleet Manager
    };

    const userEmailKey = user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'default';
    const [managerContext, setManagerContext] = useState(() => localStorage.getItem(`green_manager_context_${userEmailKey}`) || getInitialContext());
    
    useEffect(() => {
        if (!loading && user) {
            setManagerContext(localStorage.getItem(`green_manager_context_${userEmailKey}`) || getInitialContext());
        }
    }, [user, loading, userEmailKey]);

    // Mock staff data
    const staff = {
        id: id || 'ST-1024',
        name: 'Lukas Meyer',
        role: managerContext === 'HM' ? 'Front Desk Lead' : managerContext === 'CM' ? 'VIP Host' : 'Floor Manager',
        avatar: 'Lukas',
        clearance: 'Alpha-Level'
    };

    const sidebarItems = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, category: 'Operations' },
        { 
            id: 'orders', 
            label: managerContext === 'HM' ? 'Room Service' : 
                   managerContext === 'CM' ? 'Bottle Service' : 'Live Orders', 
            icon: managerContext === 'HM' ? BedDouble : managerContext === 'CM' ? GlassWater : ShoppingBag,
            category: 'Operations', 
            hidden: ['FM', 'SM'].includes(managerContext) 
        },
        { id: 'stadium-seats', label: 'Ticket Hub', icon: Ticket, category: 'Operations', visible: managerContext === 'CM' || managerContext === 'SM' },
        { 
            id: 'fleet', 
            icon: managerContext === 'HM' ? Car : Briefcase, 
            label: managerContext === 'HM' ? 'Hotel Shuttle' : "My Fleet", 
            category: 'Operations', 
            visible: ['FM', 'HM'].includes(managerContext) 
        },

        { 
            id: 'qr-terminal', 
            label: managerContext === 'HM' ? 'Keycard Dispatch' :
                   managerContext === 'CM' ? 'Guestlist Scan' : 'Scan Terminal', 
            icon: QrCode, 
            category: 'Financial', 
            hidden: ['FM', 'CB', 'RM', 'SM', 'BM'].includes(managerContext) 
        },
        { 
            id: 'finance', 
            label: managerContext === 'HM' ? 'Nightly Audit' : 
                   managerContext === 'CM' ? 'Cover Revenue' : 'Financials', 
            icon: Receipt, 
            category: 'Financial' 
        },
        { 
            id: 'revenue', 
            icon: CreditCard, 
            label: managerContext === 'HM' ? 'ADR Matrix' : "Money Earned", 
            category: 'Financial' 
        },

        { id: 'staff', label: 'Team Hub', icon: Users, category: 'Admin' },
        { id: 'documents', label: 'Compliance', icon: ShieldCheck, category: 'Admin' },
        { id: 'sitting', label: 'Console Sitting', icon: Settings, category: 'Admin' },
        { id: 'menu', label: 'Menu Catalog', icon: managerContext === 'SM' ? Trophy : Utensils, category: 'Admin', hidden: managerContext === 'FM' },
        { id: 'business-docs', icon: Building2, label: "Company Documents", category: 'Admin' },
        { id: 'network', icon: Handshake, label: "Partner Requests", category: 'Admin' },

        { id: 'promotions', label: 'VIP Perks', icon: Star, category: 'Marketing', hidden: ['FM', 'SM'].includes(managerContext) },
        { id: 'feed', label: 'Live Feed', icon: Activity, category: 'Marketing', hidden: ['FM', 'SM'].includes(managerContext) },
    ];

    const [permissions, setPermissions] = useState({
        overview: true,
        orders: true,
        feed: true,
        'qr-terminal': true,
        promotions: false,
        staff: false,
        finance: false,
        documents: false,
        sitting: false,
        menu: false,
        'stadium-seats': false,
        fleet: false,
        revenue: false,
        'business-docs': false,
        network: false
    });

    if (loading) {
        return (
            <div className="w-screen h-screen bg-dark-950 flex items-center justify-center">
                <div className="text-xl font-black italic uppercase text-brand animate-pulse">
                    Grid Intelligence Loading...
                </div>
            </div>
        );
    }

    const togglePermission = (itemId) => {
        setPermissions(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const filteredItems = sidebarItems.filter(item => {
        if (item.hidden) return false;
        if (item.visible !== undefined) return item.visible;
        return true;
    });

    return (
        <div className="min-h-screen bg-dark-950 text-primary font-sans p-6 md:p-12 relative overflow-hidden">
            {/* Background Aesthetics - Tactical Layer */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--border-main) 1px, transparent 1px), linear-gradient(90deg, var(--border-main) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-violet-500/5 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/3" />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-16">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/manager')}
                            className="w-14 h-14 bg-glass border border-main rounded-2xl flex items-center justify-center text-secondary hover:text-brand hover:border-brand/40 transition-all shadow-xl backdrop-blur-xl group"
                        >
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="hidden md:block">
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Access <span className="text-brand">Matrix</span></h1>
                            <p className="text-[10px] md:text-xs lg:text-sm font-black text-secondary uppercase tracking-[0.3em] mt-2 opacity-50">Granular Portal Control Protocol</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => navigate('/manager')}
                        className="px-10 py-5 bg-brand text-dark-950 rounded-[2rem] text-xs md:text-sm lg:text-base font-black uppercase tracking-[0.3em] shadow-2xl shadow-brand/20 hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group"
                    >
                        <Save size={18} className="group-hover:rotate-12 transition-transform" /> Save Manifest
                    </button>
                </div>

                {/* Staff Tactical Profile */}
                <div className="bg-glass border border-main rounded-[4rem] p-1 shadow-2xl mb-16 relative group overflow-hidden">
                    <div className="bg-dark-900 rounded-[3.8rem] p-10 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-brand pointer-events-none"><Fingerprint size={200} /></div>
                        
                        <div className="relative group/avatar">
                            <div className="absolute -inset-4 bg-violet-500/20 blur-2xl rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                            <div className="w-40 h-40 rounded-[3.5rem] bg-btn-sec border-2 border-violet-500/20 p-1.5 relative z-10 overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.avatar}`} alt="Avatar" className="w-full h-full rounded-[3rem] shadow-2xl object-cover bg-violet-500/10" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-violet-500 rounded-2xl flex items-center justify-center text-primary border-4 border-dark-900 shadow-xl z-20">
                                <ShieldCheck size={24} />
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
                                    <h2 className="text-4xl md:text-5xl font-black italic uppercase text-primary tracking-tighter leading-none">{staff.name}</h2>
                                    <span className="px-5 py-1.5 bg-violet-500/10 text-violet-400 rounded-full text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest border border-violet-500/20 flex items-center gap-2">
                                        <Key size={12} /> {staff.id}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-secondary uppercase tracking-[0.4em] opacity-60 italic">{staff.role} • Security Level: Tactical</p>
                            </div>
                            
                            <div className="flex items-center justify-center md:justify-start gap-10 pt-4 border-t border-main">
                                <div>
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest opacity-40">Classification</p>
                                    <p className="text-lg font-black italic text-primary uppercase">{staff.clearance}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest opacity-40">Heartbeat</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-brand rounded-full animate-pulse shadow-[0_0_10px_var(--brand)]" />
                                        <p className="text-lg font-black italic text-brand uppercase tracking-tighter">Synchronized</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Permissions Grid */}
                <div className="space-y-16 pb-20">
                    {['Operations', 'Financial', 'Admin', 'Marketing'].map(category => (
                        <div key={category} className="space-y-8">
                            <div className="flex items-center gap-4 ml-6">
                                <div className="h-8 w-1 bg-brand rounded-full shadow-[0_0_15px_var(--brand)]" />
                                <h3 className="text-2xl font-black italic uppercase tracking-widest text-primary">{category} Controls</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredItems.filter(item => item.category === category).map(item => (
                                    <div 
                                        key={item.id} 
                                        onClick={() => togglePermission(item.id)}
                                        className={`p-1 rounded-[2.5rem] transition-all cursor-pointer group relative overflow-hidden ${permissions[item.id] ? 'bg-brand/20 border border-brand/40 shadow-[0_20px_50px_rgba(33,255,165,0.05)]' : 'bg-glass border border-main hover:border-brand/30'}`}
                                    >
                                        <div className={`p-8 rounded-[2.3rem] flex items-center justify-between transition-colors ${permissions[item.id] ? 'bg-dark-900/40 backdrop-blur-xl' : 'bg-transparent'}`}>
                                            <div className="flex items-center gap-6">
                                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${permissions[item.id] ? 'bg-brand text-dark-950 shadow-[0_0_30px_var(--brand)] rotate-[360deg]' : 'bg-btn-sec text-secondary group-hover:bg-brand/10 group-hover:text-brand'}`}>
                                                    <item.icon size={28} />
                                                </div>
                                                <div>
                                                    <p className="text-xl font-black italic uppercase text-primary tracking-tight leading-none">{item.label}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {permissions[item.id] ? <Unlock size={10} className="text-brand" /> : <Lock size={10} className="text-secondary opacity-40" />}
                                                        <p className={`text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.2em] ${permissions[item.id] ? 'text-brand' : 'text-secondary opacity-40'}`}>
                                                            {permissions[item.id] ? 'Access Authorized' : 'Access Revoked'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className={`w-14 h-7 rounded-full relative transition-all duration-300 border-2 ${permissions[item.id] ? 'bg-brand border-brand/50' : 'bg-black/40 border-main'}`}>
                                                <motion.div 
                                                    animate={{ x: permissions[item.id] ? 28 : 4 }}
                                                    className={`absolute top-1 w-4 h-4 rounded-full shadow-2xl transition-colors duration-300 ${permissions[item.id] ? 'bg-dark-950' : 'bg-secondary/40'}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StaffPermissions;
