import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Shield, Receipt, ArrowRight, X, User as UserIcon, Beer, Utensils, Ticket, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QRCodeGenerator from '../components/QRCodeGenerator';

const NightCrew = () => {
    const navigate = useNavigate();
    const [hasGroup, setHasGroup] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupMembers, setGroupMembers] = useState([
        { id: 1, name: 'You (Captain)', role: 'admin', spent: 0 },
        { id: 2, name: 'Lukas M.', role: 'member', spent: 45.50 },
        { id: 3, name: 'Sarah K.', role: 'member', spent: 12.00 }
    ]);

    const [ledger, setLedger] = useState([
        { id: 101, user: 'Lukas M.', item: '3x Gin Tonic', location: 'Skyline Club', price: 36.00, time: '23:45' },
        { id: 102, user: 'Lukas M.', item: 'Entry Fee', location: 'Skyline Club', price: 9.50, time: '23:40' },
        { id: 103, user: 'Sarah K.', item: 'Mineral Water', location: 'Skyline Club', price: 12.00, time: '00:12' }
    ]);

    const totalSpent = ledger.reduce((acc, curr) => acc + curr.price, 0);

    const handleCreateGroup = () => {
        if (!groupName) return;
        setHasGroup(true);
    };

    return (
        <div className="min-h-screen bg-dark-950 text-white p-6 font-sans">
            <div className="max-w-2xl mx-auto space-y-12 pb-24">
                
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/greens')}
                            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-brand transition-all"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Night <span className="text-brand">Crew</span></h1>
                            <p className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-500 uppercase tracking-widest mt-1 italic">Hospitality Ledger & Social Settlement</p>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand border border-brand/20">
                        <Users size={24} />
                    </div>
                </div>

                {!hasGroup ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-10 glass-panel rounded-[3rem] space-y-8 text-center"
                    >
                        <div className="w-20 h-20 bg-brand/5 border border-brand/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <UserPlus size={40} className="text-brand" />
                        </div>
                        <h2 className="text-2xl font-black italic uppercase text-white">Start Crew</h2>
                        <p className="text-xs md:text-sm lg:text-base text-gray-400 leading-relaxed uppercase font-bold tracking-widest">Create a group to share rides, split bills, and use the QR Hospitality Ledger.</p>
                        
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="Enter Crew Name (e.g. VIP Knights)" 
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-sm font-black outline-none focus:border-brand/40 transition-all placeholder:text-gray-700 italic uppercase tracking-widest"
                            />
                            <button 
                                onClick={handleCreateGroup}
                                className="w-full py-5 bg-brand text-dark-950 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Activate Night Crew
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-12">
                        {/* THE MASTER QR */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-10 glass-panel rounded-[3.5rem] flex flex-col items-center space-y-8 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent" />
                            <div className="text-center">
                                <h3 className="text-2xl font-black italic uppercase text-white tracking-tight">{groupName}</h3>
                                <p className="text-[10px] md:text-xs lg:text-sm font-bold text-brand uppercase tracking-[0.4em] mt-2">Group ID: #NC-9821</p>
                            </div>

                            <QRCodeGenerator value={`RADAR_GROUP_9821_${Date.now()}`} size={240} />

                            <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10">
                                <Shield size={14} className="text-brand" />
                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-400 italic">Verified Group Ledger Active</span>
                            </div>

                            <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-500 font-bold uppercase tracking-widest text-center px-8 leading-relaxed italic">
                                Show this QR at any Partner Hotel, Bar, or Club to add items to your group ledger.
                            </p>
                        </motion.div>

                        {/* CREW AUDIT (ADMIN ONLY) */}
                        <div className="space-y-8">
                            <div className="flex justify-between items-end px-4">
                                <h3 className="text-xl font-black italic uppercase tracking-tighter">Crew Audit</h3>
                                <div className="text-right">
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase">Total Debt</p>
                                    <p className="text-2xl font-black italic text-brand">€{totalSpent.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {ledger.map((item) => (
                                    <div key={item.id} className="p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between group hover:border-brand/20 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                                                {item.item.includes('Drink') ? <Beer size={20} /> : item.item.includes('Food') ? <Utensils size={20} /> : <Ticket size={20} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-brand italic">{item.user}</span>
                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-600 uppercase tracking-widest">• {item.time}</span>
                                                </div>
                                                <h4 className="text-lg font-black italic uppercase text-white tracking-tight">{item.item}</h4>
                                                <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">at {item.location}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black italic text-white tracking-tighter">€{item.price.toFixed(2)}</p>
                                            <button className="text-[8px] md:text-[10px] lg:text-xs font-black text-red-500 uppercase tracking-widest mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Dispute</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SETTLEMENT PREVIEW */}
                        <div className="p-8 bg-dark-900 border border-brand/10 rounded-[3rem] space-y-6">
                            <div className="flex items-center gap-3">
                                <Receipt size={20} className="text-brand" />
                                <h3 className="text-xl font-black italic uppercase tracking-tighter">Ride Settlement</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between text-xs md:text-sm lg:text-base font-bold text-gray-400 uppercase tracking-widest">
                                    <span>Hospitality Total</span>
                                    <span className="text-white">€{totalSpent.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs md:text-sm lg:text-base font-bold text-gray-400 uppercase tracking-widest">
                                    <span>Est. Return Ride</span>
                                    <span className="text-white">€14.50</span>
                                </div>
                                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                    <p className="text-sm font-black italic uppercase text-brand">Checkout Value</p>
                                    <p className="text-3xl font-black italic text-white tracking-tighter">€{(totalSpent + 14.5).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Nav Hint */}
            <div className="fixed bottom-0 left-0 w-full p-8 bg-gradient-to-t from-dark-950 to-transparent pointer-events-none">
                <div className="max-w-2xl mx-auto flex justify-center">
                    <div className="bg-brand/10 border border-brand/20 backdrop-blur-xl px-10 py-5 rounded-[2rem] pointer-events-auto">
                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-[0.4em] italic leading-none">Scanning Active • Proactive Fraud Shield v1.4</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NightCrew;
