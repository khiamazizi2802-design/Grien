import React, { useState } from 'react';
import {
    X,
    LayoutDashboard,
    User,
    Building2,
    Car,
    Wallet,
    MessageSquare,
    Settings,
    ChevronRight,
    ToggleRight,
    TrendingUp,
    Map,
    FileText,
    ShieldCheck,
    Briefcase,
    History,
    CreditCard,
    HelpCircle,
    Bell,
    LogOut,
    CheckCircle,
    Handshake,
    Scale,
    ShieldAlert,
    Zap,
    Globe,
    Bot,
    Users,
    Utensils,
    Languages,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose, currentRole = 'driver', onItemClick }) => {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const [langSearch, setLangSearch] = useState('');
    const [isLangExpanded, setIsLangExpanded] = useState(false);

    const allLanguages = [
        { code: 'en', name: 'English', native: 'English' },
        { code: 'de', name: 'German', native: 'Deutsch' },
        { code: 'fa', name: 'Persian', native: 'فارسی' },
        { code: 'fr', name: 'French', native: 'Français' },
        { code: 'es', name: 'Spanish', native: 'Español' },
        { code: 'it', name: 'Italian', native: 'Italiano' },
        { code: 'tr', name: 'Turkish', native: 'Türkçe' },
        { code: 'ar', name: 'Arabic', native: 'العربية' },
        { code: 'zh', name: 'Chinese', native: '中文' },
        { code: 'ja', name: 'Japanese', native: '日本語' },
        { code: 'ru', name: 'Russian', native: 'Русский' }
    ];

    const filteredLangs = allLanguages.filter(l => 
        l.name.toLowerCase().includes(langSearch.toLowerCase()) || 
        l.native.toLowerCase().includes(langSearch.toLowerCase()) ||
        l.code.toLowerCase().includes(langSearch.toLowerCase())
    );
    const managerContext = localStorage.getItem('green_manager_context') || 'RM';

    const getAdaptiveLabel = (id, baseLabel) => {
        if (currentRole !== 'manager') return baseLabel;
        
        switch(id) {
            case 'overview':
                if (managerContext === 'HM') return "Palace Mission Control";
                if (managerContext === 'SM') return "Arena Mission Control";
                if (managerContext === 'WM') return "Bay Mission Control";
                if (managerContext === 'PM') return "Gate Control Hub";
                if (managerContext === 'BM' || managerContext === 'CM') return "Venue Mission Control";
                return "Service Mission Control";
            case 'menu':
                if (managerContext === 'HM') return "In-Suite Catalog";
                if (managerContext === 'SM') return "Arena Catalog";
                if (managerContext === 'WM') return "Service Matrix";
                if (managerContext === 'PM') return "Spot Allocation";
                if (managerContext === 'BM' || managerContext === 'CM') return "Nightlife Catalog";
                return "Intelligence & Catalog";
            case 'staff':
                return "Intelligence Staff";
            case 'compliance':
                return (managerContext === 'PM' || managerContext === 'WM') ? "Legal Center" : "Compliance Vault";
            default:
                return baseLabel;
        }
    };

    let menuSections = [
        {
            title: "Admin Area",
            role: ['super_admin'],
            items: [
                { id: 'command-deck', icon: LayoutDashboard, label: "Global Command", badge: "Live" },
                { id: 'customer-service', icon: MessageSquare, label: "Customer Service", badge: "Live" },
                { id: 'staff-hub', icon: Users, label: "Intelligence Staff" },
                { id: 'settlements', icon: Wallet, label: "Settlement Matrix", role: ['super_admin'] },
                { id: 'agents', icon: Bot, label: "Agent Hub", role: ['super_admin'], badge: "Active" },
                { id: 'fleet', icon: Car, label: "Fleet Hub" },
                { id: 'hotels', icon: Building2, label: "Hotels Hub" },
                { id: 'clubs', icon: Zap, label: "Clubs & Bars" },
                { id: 'events', icon: Map, label: "Event Grid" },
                { id: 'system-doors', icon: Globe, label: "Portal Doors" }
            ]
        },
        {
            title: "Night Life",
            role: ['passenger'],
            items: [
                { id: 'night-crew', icon: Zap, label: "Night Crew", badge: "Social" },
                { id: 'nearby-partners', icon: Map, label: "Hotspots", subtext: "Hotels & Clubs" }
            ]
        },
        {
            title: "My Dashboard",
            role: ['manager', 'admin', 'staff'],
            items: [
                { id: 'overview', icon: ToggleRight, label: getAdaptiveLabel('overview', "Live Operations"), badge: "Active" },
                { id: 'financials', icon: TrendingUp, label: "Net Sales", value: "€142.50" },
                { id: 'stats', icon: History, label: "Business Pulse", subtext: "Real-time" },
                { id: 'demand', icon: Map, label: "Network Map", badge: "Live" }
            ]
        },
        {
            title: "My Profile",
            role: ['driver', 'manager', 'admin', 'super_admin', 'staff'],
            items: [
                { id: 'personal-data', icon: User, label: "My Profile" },
                { id: 'profile-pic', icon: CheckCircle, label: "Verification" }
            ]
        },
        {
            title: "Company",
            role: ['manager', 'admin', 'staff'],
            items: [
                { id: 'compliance', icon: Building2, label: getAdaptiveLabel('compliance', "Company Documents") },
                { id: 'menu', icon: Utensils, label: getAdaptiveLabel('menu', "Manage Menu"), badge: "AI Scan" },
                { id: 'fleet', icon: Briefcase, label: "My Fleet" },
                { id: 'financials', icon: CreditCard, label: "Money Earned" },
                { id: 'staff', icon: Handshake, label: "Staff Hub", badge: "New" }
            ]
        },
        {
            title: "Payments",
            role: ['driver', 'manager', 'admin', 'staff'],
            items: [
                { id: 'history', icon: History, label: "Past Earnings" },
                { id: 'payouts', icon: Wallet, label: "Payouts", role: ['manager', 'admin'] }
            ]
        },
        {
            title: "MESSAGES & SUPPORT",
            role: ['driver', 'manager', 'admin', 'staff'],
            items: [
                { id: 'inbox', icon: Bell, label: "Inbox", badge: "2" },
                { id: 'support', icon: MessageSquare, label: "Help & Support" }
            ]
        },
        {
            title: "SETTINGS",
            role: ['driver', 'manager', 'admin', 'super_admin', 'staff'],
            items: [
                ...(currentRole === 'driver' ? [{ id: 'navigation-settings', icon: Map, label: "Map Preference", subtext: "Google / Apple Maps" }] : []),
                { id: 'settings', icon: Settings, label: "App Settings" }
            ]
        }
    ];

    // Filter sections and items based on role AND permissions
    const filteredSections = menuSections
        .filter(section => !section.role || section.role.includes(currentRole))
        .map(section => ({
            ...section,
            items: section.items.filter(item => {
                // Role check
                const roleMatch = !item.role || item.role.includes(currentRole);
                if (!roleMatch) return false;

                // Permission check for Staff
                if (currentRole === 'staff') {
                    // Mock: Staff only has access to specific IDs unless defined otherwise
                    const staffPermissions = user?.permissions || ['overview', 'orders', 'feed', 'inbox', 'support', 'settings'];
                    return staffPermissions.includes(item.id);
                }

                return true;
            })
        }))
        .filter(section => section.items.length > 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-[320px] z-[101] bg-[#0B121E] border-r border-white/5 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">Green</h2>
                                <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.4em] text-brand/60 mt-1 italic">
                                    {currentRole.replace('_', ' ')} GRID SYSTEM
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
                            {filteredSections.map((section, idx) => (
                                <div key={idx} className="space-y-3">
                                    <h3 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-brand/60 px-2 italic">
                                        {section.title}
                                    </h3>
                                    <div className="space-y-1">
                                        {section.items.map((item, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    if (onItemClick) onItemClick(item.id);
                                                    onClose();
                                                }}
                                                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-xl bg-dark-800 text-gray-500 group-hover:text-brand transition-colors">
                                                        <item.icon size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-black italic uppercase tracking-tight text-white group-hover:text-brand transition-colors">
                                                            {item.label}
                                                        </p>
                                                        {(item.subtext || item.value) && (
                                                            <p className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-500 uppercase">
                                                                {item.subtext || item.value}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {item.badge && (
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black bg-brand/10 text-brand px-2 py-0.5 rounded-full uppercase">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                    {item.status && (
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full uppercase">
                                                            {item.status}
                                                        </span>
                                                    )}
                                                    <ChevronRight size={14} className="text-gray-700 group-hover:text-brand transition-colors" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/5 space-y-3">
                            {currentRole !== 'passenger' && (user?.role === 'super_admin') && (
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={() => window.open('/home', '_blank')}
                                        className="w-full p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 font-black uppercase tracking-widest text-xs md:text-sm lg:text-base flex items-center justify-center gap-2 hover:bg-blue-500 hover:text-white transition-all"
                                    >
                                        <Globe size={16} />
                                        Customer Portal
                                    </button>
                                    <button
                                        onClick={() => window.open('/driver', '_blank')}
                                        className="w-full p-4 rounded-2xl bg-brand/10 border border-brand/20 text-brand font-black uppercase tracking-widest text-xs md:text-sm lg:text-base flex items-center justify-center gap-2 hover:bg-brand hover:text-dark-900 transition-all"
                                    >
                                        <Car size={16} />
                                        Driver Portal
                                    </button>
                                    <button
                                        onClick={() => window.open('/manager', '_blank')}
                                        className="w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black uppercase tracking-widest text-xs md:text-sm lg:text-base flex items-center justify-center gap-2 hover:bg-amber-500 hover:text-white transition-all"
                                    >
                                        <Briefcase size={16} />
                                        Manager Portal
                                    </button>
                                </div>
                            )}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between px-2 mb-1">
                                    <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-brand/60 italic">Language Hub</span>
                                    <Languages size={14} className="text-brand/40" />
                                </div>
                                <div className="relative">
                                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                                    <input 
                                        type="text"
                                        placeholder="Search language..."
                                        value={langSearch}
                                        onChange={(e) => {
                                            setLangSearch(e.target.value);
                                            setIsLangExpanded(true);
                                        }}
                                        onFocus={() => setIsLangExpanded(true)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-10 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest focus:border-brand/40 outline-none"
                                    />
                                </div>
                                {isLangExpanded && (
                                    <div className="max-h-40 overflow-y-auto no-scrollbar bg-dark-900/50 border border-white/5 rounded-2xl p-2 space-y-1">
                                        {filteredLangs.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    i18n.changeLanguage(lang.code);
                                                    setIsLangExpanded(false);
                                                    setLangSearch('');
                                                }}
                                                className={`w-full p-3 rounded-xl flex items-center justify-between transition-all ${i18n.language === lang.code ? 'bg-brand/10 text-brand border border-brand/20' : 'hover:bg-white/5 text-gray-500'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase">{lang.name}</span>
                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-bold opacity-40">{lang.native}</span>
                                                </div>
                                                {i18n.language === lang.code && <CheckCircle size={12} />}
                                            </button>
                                        ))}
                                        {filteredLangs.length === 0 && (
                                            <p className="text-[8px] md:text-[10px] lg:text-xs text-center text-gray-600 p-4 uppercase font-black">No matches found</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button className="w-full p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 font-black uppercase tracking-widest text-xs md:text-sm lg:text-base flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all group">
                                <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                                Sign Out
                            </button>
                            <div className="flex flex-col items-center gap-2 mt-4">
                                {currentRole === 'passenger' && (
                                    <button 
                                        onClick={() => {
                                            if (onItemClick) onItemClick('privacy');
                                            onClose();
                                        }}
                                        className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.3em] text-brand hover:text-white transition-colors"
                                    >
                                        Privacy Manifesto
                                    </button>
                                )}
                                <p className="text-center text-[8px] md:text-[10px] lg:text-xs text-gray-600 font-black uppercase tracking-[0.4em] italic">
                                    Version 1.2.0-{currentRole.toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;



