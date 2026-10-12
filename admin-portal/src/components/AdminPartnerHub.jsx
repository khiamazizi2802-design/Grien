import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Eye, ShoppingCart, Star, MessageSquare, ChevronRight, Store, ArrowLeft } from 'lucide-react';
import { triggerNotification } from './NotificationToast';

const defaultPartners = {
    "Black Forest Fleet VIP": { 
        visibilityMode: true, 
        commerceMode: true, 
        followers: 4800, 
        rating: 4.9,
        type: 'Flotte',
        feedbacks: [
            { type: 'highlight', text: 'Erstklassige Mercedes Maybach Flotte & pünktliche Fahrer.', user: 'Dr. Michael S.' },
            { type: 'highlight', text: 'Nahtloser PBefG Transfer zum Flughafen.', user: 'Elena V.' }
        ]
    },
    "Grand Hotel Europäischer Hof": { 
        visibilityMode: true, 
        commerceMode: true, 
        followers: 2150, 
        rating: 4.8,
        type: 'Hotel',
        feedbacks: [
            { type: 'highlight', text: 'Exzellenter Valet & Chauffeur-Service direkt von der Lobbylounge.', user: 'Concierge Jean' }
        ]
    },
    "Signal Iduna Stadium VIP Hub": { 
        visibilityMode: true, 
        commerceMode: true, 
        followers: 5300, 
        rating: 4.9,
        type: 'Stadion',
        feedbacks: [
            { type: 'highlight', text: 'Schneller Shuttle-Transfer nach dem Spielende direkt zur VIP-Lounge.', user: 'Max R.' },
            { type: 'idea', text: 'Mehr E-Ladesäulen im VIP Bereich wünschenswert.', user: 'Julia V.' }
        ]
    }
};

const AdminPartnerHub = () => {
    const [partners, setPartners] = useState({});
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [activeFeedbackTab, setActiveFeedbackTab] = useState('highlights');

    useEffect(() => {
        const stored = localStorage.getItem('green_partners_data');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed["Skyline Club"] || parsed["The Grid Bar"]) {
                    setPartners(defaultPartners);
                    localStorage.setItem('green_partners_data', JSON.stringify(defaultPartners));
                } else {
                    setPartners(parsed);
                }
            } catch (e) {
                setPartners(defaultPartners);
            }
        } else {
            setPartners(defaultPartners);
            localStorage.setItem('green_partners_data', JSON.stringify(defaultPartners));
        }
    }, []);

    const updatePartner = (name, key, value) => {
        const updated = {
            ...partners,
            [name]: {
                ...partners[name],
                [key]: value
            }
        };
        setPartners(updated);
        localStorage.setItem('green_partners_data', JSON.stringify(updated));
        
        triggerNotification(
            'success', 
            `Partner Updated`, 
            `${name} ${key === 'commerceMode' ? 'Commerce' : 'Visibility'} is now ${value ? 'ACTIVE' : 'DISABLED'}`
        );
    };

    if (selectedPartner) {
        const data = partners[selectedPartner];
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 pb-32">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedPartner(null)} className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition-all">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{selectedPartner}</h3>
                        <p className="text-[10px] md:text-xs font-black text-brand uppercase tracking-widest mt-1">{data.type} • {data.followers} Followers</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Master Switches */}
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6 shadow-xl">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/50 mb-2">Master Controls</h4>
                        
                        <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <Eye size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white uppercase tracking-wider">Visibility Mode</p>
                                    <p className="text-[10px] text-gray-500 font-bold">Appears in App Searches</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => updatePartner(selectedPartner, 'visibilityMode', !data.visibilityMode)}
                                className={`w-14 h-7 rounded-full relative transition-all duration-300 border ${data.visibilityMode ? 'bg-blue-500/20 border-blue-500' : 'bg-gray-800 border-white/10'}`}
                            >
                                <motion.div 
                                    animate={{ x: data.visibilityMode ? 28 : 4 }}
                                    className={`absolute top-1 w-5 h-5 rounded-full shadow-lg ${data.visibilityMode ? 'bg-blue-500' : 'bg-gray-500'}`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                                    <ShoppingCart size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white uppercase tracking-wider">Commerce Mode (Phase 2)</p>
                                    <p className="text-[10px] text-gray-500 font-bold">Enables Checkout & POS</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => updatePartner(selectedPartner, 'commerceMode', !data.commerceMode)}
                                className={`w-14 h-7 rounded-full relative transition-all duration-300 border ${data.commerceMode ? 'bg-brand/20 border-brand' : 'bg-gray-800 border-white/10'}`}
                            >
                                <motion.div 
                                    animate={{ x: data.commerceMode ? 28 : 4 }}
                                    className={`absolute top-1 w-5 h-5 rounded-full shadow-lg ${data.commerceMode ? 'bg-brand' : 'bg-gray-500'}`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Feedback Panel */}
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/50">Feedback Hub</h4>
                            <div className="flex items-center gap-2">
                                <Star className="text-brand" fill="currentColor" size={16} />
                                <span className="text-lg font-black text-white">{data.rating.toFixed(1)}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 mb-4 bg-black/40 p-1 rounded-xl">
                            {['highlights', 'complaints', 'ideas'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveFeedbackTab(tab)}
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                        activeFeedbackTab === tab 
                                        ? 'bg-white/10 text-white shadow-md' 
                                        : 'text-gray-500 hover:text-white/80'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar max-h-[300px]">
                            {data.feedbacks
                                .filter(f => {
                                    if (activeFeedbackTab === 'highlights') return f.type === 'highlight';
                                    if (activeFeedbackTab === 'complaints') return f.type === 'complaint';
                                    if (activeFeedbackTab === 'ideas') return f.type === 'idea';
                                    return true;
                                })
                                .map((fb, idx) => (
                                <div key={idx} className="p-3 bg-black/30 border border-white/5 rounded-xl">
                                    <p className="text-xs text-white/90 leading-relaxed font-medium">"{fb.text}"</p>
                                    <p className="text-[9px] text-brand uppercase font-black tracking-widest mt-2">— {fb.user}</p>
                                </div>
                            ))}
                            {data.feedbacks.filter(f => {
                                if (activeFeedbackTab === 'highlights') return f.type === 'highlight';
                                if (activeFeedbackTab === 'complaints') return f.type === 'complaint';
                                if (activeFeedbackTab === 'ideas') return f.type === 'idea';
                                return true;
                            }).length === 0 && (
                                <div className="text-center py-8 text-gray-600 text-xs font-black uppercase tracking-widest">
                                    No {activeFeedbackTab} yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:border-white/20 transition-all duration-500 rounded-3xl p-6">
                <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">Partner Hub <span className="text-brand">Network</span></h3>
                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest mt-1">Manage Visibility & Commerce Modes</p>
                </div>
                <div className="w-12 h-12 bg-brand/10 border border-brand/30 rounded-2xl flex items-center justify-center text-brand">
                    <Building2 size={20} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(partners).map(([name, data]) => (
                    <button 
                        key={name}
                        onClick={() => setSelectedPartner(name)}
                        className="group relative bg-white/5 border border-white/5 rounded-[2rem] p-6 text-left hover:border-brand/40 hover:bg-white/10 transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-black/50 rounded-xl flex items-center justify-center text-white border border-white/10 group-hover:border-brand/30">
                                    <Store size={20} />
                                </div>
                                <div className="flex gap-2">
                                    {data.visibilityMode && (
                                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest rounded-lg">Visible</span>
                                    )}
                                    {data.commerceMode && (
                                        <span className="px-2 py-1 bg-brand/20 text-brand text-[8px] font-black uppercase tracking-widest rounded-lg">Commerce</span>
                                    )}
                                </div>
                            </div>
                            
                            <h4 className="text-lg font-black text-white italic tracking-tighter uppercase mb-1">{name}</h4>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{data.type} • {data.followers} Followers</p>
                            
                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-white/50 group-hover:text-brand transition-colors">
                                <span className="text-[9px] font-black uppercase tracking-widest">Manage Partner</span>
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AdminPartnerHub;
