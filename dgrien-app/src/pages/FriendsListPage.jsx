import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Search, UserPlus, MoreVertical, MessageSquare, 
    Zap, Heart, Shield, Sparkles, X, UserCheck, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';

const FriendsListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { mutualFriends } = useRide();
    const [searchQuery, setSearchQuery] = useState('');

    const friends = mutualFriends;

    const filteredFriends = friends.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        f.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-brand/30">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-end/5 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 p-6 pb-32 max-w-lg mx-auto min-h-screen">
                {/* Header */}
                <header className="flex items-center justify-between mb-8 pt-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/greens')}
                            className="w-12 h-12 bg-[var(--bg-secondary)] border border-white/10 rounded-2xl flex items-center justify-center text-brand hover:border-brand/40 transition-all shadow-lg active:scale-90"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Inner Circle</h1>
                            <p className="text-brand font-black uppercase tracking-[0.2em] text-[8px] md:text-[10px] lg:text-xs italic mt-1">{friends.length} Active Connections</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => alert("Invite link copied to clipboard!")}
                        className="w-12 h-12 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center text-brand hover:bg-brand hover:text-dark-900 transition-all"
                    >
                        <UserPlus size={20} />
                    </button>
                </header>

                {/* Search Bar */}
                <div className="relative mb-8 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search members..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)]/50 backdrop-blur-md border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-brand/40 transition-all shadow-2xl placeholder:text-gray-600"
                    />
                </div>

                {/* Friend List Grid */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredFriends.map((friend) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={friend.id}
                                onClick={() => navigate(`/profile/${friend.id}`, { state: { friend } })}
                                className="group bg-[var(--bg-secondary)]/40 border border-white/5 rounded-[2.5rem] p-4 flex items-center justify-between hover:border-brand/30 transition-all shadow-xl cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar with Status Ring */}
                                    <div className="relative">
                                        <div className={`w-16 h-16 rounded-2xl p-0.5 border-2 ${friend.status === 'Online' ? 'border-brand' : 'border-gray-700'}`}>
                                            <img src={friend.avatar} alt={friend.name} className="w-full h-full rounded-xl bg-dark-800" />
                                        </div>
                                        {friend.status === 'Online' && (
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand border-2 border-dark-950 rounded-full" />
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black italic uppercase tracking-tight text-white">{friend.name}</h3>
                                            <span className="text-[7px] bg-brand/10 text-brand px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest">{friend.rank}</span>
                                        </div>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-500 uppercase tracking-widest">{friend.username}</p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <div className="flex items-center gap-1">
                                                <Users size={10} className="text-gray-600" />
                                                <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-600 uppercase">{friend.mutuals} Mutuals</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Sparkles size={10} className="text-brand" />
                                                <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase">{friend.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] border border-white/5 flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand/30 transition-all active:scale-90">
                                        <MessageSquare size={18} />
                                    </button>
                                    <button className="w-10 h-10 rounded-xl bg-dark-800 border border-white/5 flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand/30 transition-all active:scale-90">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredFriends.length === 0 && (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-gray-600">
                                <X size={30} />
                            </div>
                            <p className="text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-gray-500">No members found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FriendsListPage;
