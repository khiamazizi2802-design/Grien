import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, UserPlus, Users, Wallet, CreditCard, Star, Search, X, Check, 
    ArrowRight, User, Wine, Utensils, BedDouble, Map, Compass, Gem, Sparkles, Zap, GlassWater, ChevronRight, Trophy, Ticket, Activity, MapPin, Droplets, Target,
    ShieldCheck, Crown, UserCheck, QrCode, ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sheet from '../components/Sheet';

import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';
import { db } from '../config/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

const GreenSPage = ({ embedMode = false, onCloseEmbed }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { venueTickets, mutualFriends } = useRide();
    const [showTicketHub, setShowTicketHub] = useState(false);
    
    // --- Group Flow States (Hoisted to top for safe initialization across all hooks) ---
    const [groupState, setGroupState] = useState(() => {
        return localStorage.getItem('green_group_state') || null;
    });
    const [invitedFriends, setInvitedFriends] = useState(() => {
        try {
            const saved = localStorage.getItem('green_invited_friends');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [groupRole, setGroupRole] = useState(() => localStorage.getItem('green_group_role') || 'admin');

    const [hasActiveOrder, setHasActiveOrder] = useState(true); // Mock order state
    const [hasNewPass, setHasNewPass] = useState(false);
    
    React.useEffect(() => {
        const checkPass = () => {
            const pass = localStorage.getItem('green_parking_pass');
            if (pass) setHasNewPass(true);
        };
        checkPass();
        window.addEventListener('storage', checkPass);
        const interval = setInterval(checkPass, 2000);
        return () => {
            window.removeEventListener('storage', checkPass);
            clearInterval(interval);
        };
    }, []);

    const [orderTimeLeft, setOrderTimeLeft] = useState("05:12");
    
    // --- State for Social Features ---
    const allFriends = mutualFriends.map(m => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar || m.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`,
        status: m.status || 'Online'
    }));

    const defaultGroupFriends = React.useMemo(() => {
        return user?.isDemo ? [
            { name: 'Marcus V.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus' },
            { name: 'Elena R.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena' },
            { name: 'Julian K.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julian' }
        ] : [];
    }, [user]);

    // --- State for Fair-Split Budgeting ---
    const [totalBudget, setTotalBudget] = useState('12');
    const [friendCount, setFriendCount] = useState(3);
    const [isCalculating, setIsCalculating] = useState(false);
    const [splitSuccess, setSplitSuccess] = useState(false);
    const [isSplitOptionsOpen, setIsSplitOptionsOpen] = useState(false);
    const [isDissolveWarningOpen, setIsDissolveWarningOpen] = useState(false);
    const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false);
    const [paymentChoice, setPaymentChoice] = useState('split'); // 'split' or 'all'
    const [splitMode, setSplitMode] = useState('individual'); // 'individual' | 'split_all' | 'cover_all'

    // --- Group Role & Member Payment State ---
    const [isPayShareOpen, setIsPayShareOpen] = useState(false);
    const [payShareMethod, setPayShareMethod] = useState(null);
    const [payShareProcessing, setPayShareProcessing] = useState(false);
    const [payShareDone, setPayShareDone] = useState(() => localStorage.getItem('green_member_paid_self') === 'true');
    // Map of friend name → true/false (paid status seen by admin)
    const [memberPaidStatus, setMemberPaidStatus] = useState({});

    // Poll member payment statuses every 2s (simulates real-time sync via localStorage)
    React.useEffect(() => {
        const pollStatuses = () => {
            const friendList = JSON.parse(localStorage.getItem('green_invited_friends') || '[]');
            const statusMap = {};
            friendList.forEach(f => {
                const key = `green_member_paid_${f.name.replace(/\s/g, '_')}`;
                statusMap[f.name] = localStorage.getItem(key) === 'true';
            });
            // Also check defaults if demo user
            if (user?.isDemo) {
                ['Marcus V.', 'Elena R.', 'Julian K.'].forEach(name => {
                    const key = `green_member_paid_${name.replace(/\s/g, '_')}`;
                    if (!(name in statusMap)) statusMap[name] = localStorage.getItem(key) === 'true';
                });
            }
            setMemberPaidStatus(statusMap);
        };
        pollStatuses();
        const interval = setInterval(pollStatuses, 2000);
        return () => clearInterval(interval);
    }, []);

    // Automatic Real-Time Simulation for Group Member Join Actions
    React.useEffect(() => {
        if (groupState === 'waiting') {
            const timers = [];
            invitedFriends.forEach((friend, idx) => {
                const timer = setTimeout(() => {
                    setInvitedFriends(prev => prev.map(f => f.id === friend.id ? { ...f, status: 'Joined' } : f));
                }, 1000 + idx * 800);
                timers.push(timer);
            });

            const activeTimer = setTimeout(() => {
                setGroupRole('admin');
                localStorage.setItem('green_group_role', 'admin');
                setGroupState('active');
            }, 1200 + invitedFriends.length * 800);
            timers.push(activeTimer);

            return () => timers.forEach(clearTimeout);
        }
    }, [groupState]);

    // Real-Time Group Tab Ledger
    const [groupTab, setGroupTab] = useState([]);

    React.useEffect(() => {
        if (!user) return;
        const emailKey = user.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'default';
        const isDemoUser = user.email.toLowerCase().endsWith('@green.de');
        try {
            const saved = localStorage.getItem(`green_group_tab_${emailKey}`);
            if (saved) {
                setGroupTab(JSON.parse(saved));
            } else if (isDemoUser) {
                setGroupTab([
                    { id: 'item-1', member: 'YOU', item: 'VIP Club Entry Pass', price: 45.00, status: 'pending', payer: 'self' },
                    { id: 'item-2', member: 'Marcus V.', item: 'Champions League Ticket', price: 45.00, status: 'pending', payer: 'self' },
                    { id: 'item-3', member: 'Elena R.', item: 'Neon Lounge Cocktail', price: 12.00, status: 'pending', payer: 'self' },
                    { id: 'item-4', member: 'Julian K.', item: 'Gourmet Dining Plate', price: 28.00, status: 'pending', payer: 'self' }
                ]);
            } else {
                setGroupTab([]);
            }
        } catch (e) {
            console.error(e);
        }
    }, [user]);

    React.useEffect(() => {
        if (!user) return;
        const emailKey = user.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'default';
        localStorage.setItem(`green_group_tab_${emailKey}`, JSON.stringify(groupTab));
    }, [groupTab, user]);

    const togglePayer = (memberName) => {
        setGroupTab(prev => prev.map(item => {
            if (item.member === memberName) {
                return { ...item, payer: item.payer === 'self' ? 'cover' : 'self' };
            }
            return item;
        }));
    };

    const setPayAll = (shouldPayAll) => {
        // Update raw groupTab items (for friends that DO have items)
        setGroupTab(prev => prev.map(item => {
            if (item.member !== 'YOU') {
                return { ...item, payer: shouldPayAll ? 'cover' : 'self' };
            }
            return item;
        }));
        // Also update split mode for UI-level totals
        setSplitMode(shouldPayAll ? 'cover_all' : 'split_all');
    };

    const calculatedShare = (parseFloat(totalBudget) / friendCount).toFixed(2);

    const executePaymentChoice = (choice) => {
        setPaymentChoice(choice);
        setIsCalculating(true);
        setTimeout(() => {
            setIsCalculating(false);
            setSplitSuccess(true);
            setGroupTab(prev => prev.map(item => ({ ...item, status: 'settled' })));
            // Clear all member paid statuses on final settlement
            ['Marcus V.', 'Elena R.', 'Julian K.'].forEach(name => {
                localStorage.removeItem(`green_member_paid_${name.replace(/\s/g, '_')}`);
            });
            setTimeout(() => {
                setShowReceipt(true);
                setSplitSuccess(false);
            }, 800);
        }, 1500);
    };

    const handleMemberPayShare = () => {
        if (!payShareMethod) return;
        setPayShareProcessing(true);
        setTimeout(() => {
            setPayShareProcessing(false);
            setPayShareDone(true);
            setIsPayShareOpen(false);
            // Persist to localStorage so admin can see it
            localStorage.setItem('green_member_paid_self', 'true');
            // Also write under user's name for admin polling
            const myName = localStorage.getItem('green_member_name') || 'Marcus V.';
            localStorage.setItem(`green_member_paid_${myName.replace(/\s/g, '_')}`, 'true');
        }, 1800);
    };

    const isCategoryActive = (categoryId) => {
        return groupTab.some(item => {
            const name = item.item.toLowerCase();
            if (categoryId === 'club') return name.includes('club') || name.includes('pass') || name.includes('vip');
            if (categoryId === 'restaurant') return name.includes('dining') || name.includes('plate') || name.includes('food') || name.includes('gourmet') || name.includes('eat');
            if (categoryId === 'bar') return name.includes('cocktail') || name.includes('lounge') || name.includes('drink') || name.includes('bar');
            if (categoryId === 'event') return name.includes('ticket') || name.includes('league') || name.includes('event');
            if (categoryId === 'hotel') return name.includes('hotel') || name.includes('stay') || name.includes('room');
            return false;
        });
    };

    const lifestyleEntities = [
        { id: 'hotel', label: 'Hotels', icon: BedDouble, color: 'text-black', offer: 'Late Checkout' },
        { id: 'stadium', label: 'Stadiums', icon: Trophy, color: 'text-black', offer: 'Match Day VIP' }
    ];

    const [selectedOffer, setSelectedOffer] = useState(null);
    const [sharingToFriend, setSharingToFriend] = useState(false);
    
    // --- State for Group Formation Flow (Persisted in LocalStorage) ---

    const activeFriendsCount = invitedFriends.length > 0 ? invitedFriends.length : 3;
    const memberCount = activeFriendsCount + 1;

    React.useEffect(() => {
        if (groupState) {
            localStorage.setItem('green_group_state', groupState);
        } else {
            localStorage.removeItem('green_group_state');
        }
    }, [groupState]);

    React.useEffect(() => {
        localStorage.setItem('green_invited_friends', JSON.stringify(invitedFriends));
    }, [invitedFriends]);
    const [showReceipt, setShowReceipt] = useState(false);
    const [shareLocation, setShareLocation] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [supportType, setSupportType] = useState('feedback'); // 'feedback' or 'complaint'
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([]);

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        
        const userMsg = { id: Date.now(), text: chatInput, sender: 'user', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => [...prev, userMsg]);
        setChatInput('');

        // Mock Admin Response
        setTimeout(() => {
            const adminMsg = { 
                id: Date.now() + 1, 
                text: supportType === 'feedback' 
                    ? "Received. Our Super Admin has been notified of your feedback. Anything else?" 
                    : "Operation Alert: A Super Admin is reviewing your complaint. Please stay on the line.", 
                sender: 'admin', 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            };
            setMessages(prev => [...prev, adminMsg]);
        }, 1500);
    };

    // --- Dynamic Slider Constraints ---
    const containerRef = React.useRef(null);
    const embeddedContainerRef = React.useRef(null);

    // --- Promoted Event Selector ---
    const promotedEvent = React.useMemo(() => {
        const saved = localStorage.getItem('green_stadium_events');
        if (saved) {
            try {
                const raw = JSON.parse(saved);
                const published = raw.filter(e => e.published);
                if (published.length > 0) {
                    const first = published[0];
                    return {
                        title: first.name,
                        image: first.image || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
                        status: 'Live Marketplace',
                        actionText: 'SECURE TICKETS NOW'
                    };
                }
            } catch (e) {
                console.error('Failed to parse green_stadium_events:', e);
            }
        }
        return null;
    }, [user]);

    return (
        <div className="min-h-full bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans relative overflow-x-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className={embedMode ? "relative z-10 p-1 pb-6 max-w-lg mx-auto" : "relative z-10 p-6 pb-24 max-w-lg mx-auto min-h-[100dvh] overflow-y-auto no-scrollbar"}>
                {/* Header */}
                {!embedMode && (
                    <header className="flex items-center justify-between mb-8 safe-top-padding">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/home')}
                                className="w-12 h-12 bg-[var(--bg-secondary)] border border-white/10 rounded-2xl flex items-center justify-center text-brand hover:border-brand/40 transition-all shadow-lg active:scale-90"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-white">GreenS</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {venueTickets.length > 0 && (
                                <motion.button 
                                    animate={{ 
                                        opacity: [0.7, 1, 0.7], 
                                        scale: [1, 1.1, 1],
                                        boxShadow: ['0 0 20px rgba(255,255,255,0.1)', '0 0 40px rgba(255,255,255,0.2)', '0 0 20px rgba(255,255,255,0.1)']
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    onClick={() => {
                                        setShowTicketHub(true);
                                    }}
                                    className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/30 text-brand flex items-center justify-center relative transition-all shadow-lg active:scale-90"
                                >
                                    <Ticket size={22} />
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-dark-900 text-[9px] md:text-[11px] lg:text-xs font-black rounded-full flex items-center justify-center border-2 border-brand shadow-lg">
                                        {venueTickets.length}
                                    </span>
                                </motion.button>
                            )}
                            <div className="w-12 h-12 rounded-full border-2 border-brand/20 p-1 overflow-hidden">
                                 <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Alex'}`} className="w-full h-full rounded-full" alt="profile" />
                            </div>
                        </div>
                    </header>
                )}
                {/* Promoted Stadium Event Banner */}
                {promotedEvent && (
                    <section className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                        <button 
                            onClick={() => navigate('/discovery', { state: { category: 'stadium' } })}
                            className="w-full relative h-64 rounded-[3rem] overflow-hidden border border-white/20 group shadow-2xl"
                        >
                            <img 
                                src={promotedEvent.image} 
                                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[2s]" 
                                alt="Stadium" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                            
                            <div className="absolute top-6 left-6 px-4 py-1.5 bg-brand text-black text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] rounded-full shadow-lg">
                                {promotedEvent.status}
                            </div>
                            
                            <div className="absolute bottom-8 left-8 text-left">
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-tight whitespace-pre-line">
                                    {promotedEvent.title}
                                </h2>
                                <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand mt-2 flex items-center gap-2">
                                    <Trophy size={12} /> {promotedEvent.actionText}
                                </p>
                            </div>
                            
                            <div className="absolute bottom-8 right-8 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 group-hover:bg-brand group-hover:text-black transition-all">
                                <ArrowRight size={24} />
                            </div>
                        </button>
                    </section>
                )}

                {/* --- INNER CIRCLE HUB --- */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <div />
                        <div className="flex items-center gap-3 bg-[var(--bg-secondary)] border border-white/5 p-1.5 rounded-full">
                            <span className={`text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest ${shareLocation ? 'text-brand' : 'text-gray-500'}`}>Share Location</span>
                            <button 
                                onClick={() => {
                                    if (!shareLocation) {
                                        if (navigator.geolocation) {
                                            navigator.geolocation.getCurrentPosition(
                                                (position) => {
                                                    setShareLocation(true);
                                                },
                                                (error) => {
                                                    alert("Standortzugriff verweigert oder fehlgeschlagen.");
                                                    setShareLocation(false);
                                                }
                                            );
                                        } else {
                                            alert("Standort wird auf diesem Gerät nicht unterstützt.");
                                        }
                                    } else {
                                        setShareLocation(false);
                                    }
                                }}
                                className={`w-10 h-5 rounded-full relative transition-all duration-300 border ${shareLocation ? 'bg-brand/20 border-brand' : 'bg-[var(--bg-tertiary)] border-white/10'}`}
                            >
                                <motion.div 
                                    animate={{ x: shareLocation ? 20 : 2 }}
                                    className={`absolute top-0.5 w-3.5 h-3.5 rounded-full shadow-lg ${shareLocation ? 'bg-brand' : 'bg-gray-700'}`}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 px-2">
                        <button 
                            onClick={() => navigate('/friends')}
                            className="group relative w-full bg-[var(--bg-secondary)] border border-white/5 rounded-[2.5rem] p-6 flex items-center justify-between hover:border-brand/40 transition-all overflow-hidden shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-brand/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-16 h-16 rounded-3xl bg-brand/20 border-2 border-brand/40 flex items-center justify-center text-brand group-hover:scale-110 transition-transform shadow-lg shadow-brand/20">
                                    <Users size={32} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-black italic tracking-tighter uppercase text-black leading-tight">Manage Circle</h3>
                                    <p className="text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-black mt-1.5">{5 + mutualFriends.length} Active Network Connections</p>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-600 group-hover:text-brand transition-colors relative z-10">
                                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    </div>
                </section>



                {/* --- PREMIUM FAIR-SPLIT ENGINE & GROUP FORMATION --- */}
                <section className="mb-10">
                    <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand/10 blur-[60px] rounded-full pointer-events-none" />
                        
                        <div className="flex items-center gap-2 pt-2">
                            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                                <Gem size={20} />
                            </div>
                            <h2 className="text-xl font-black italic tracking-tighter uppercase text-white">Fair-Split Pro</h2>
                        </div>
                        <div className="absolute -top-3 left-8 px-4 py-1 bg-brand text-black rounded-full text-[7px] font-black uppercase tracking-[0.3em] shadow-lg">
                            {groupState === 'active' ? 'Network Engine Active ⚡' : 'Social Gateway 🛰️'}
                        </div>

                        <AnimatePresence mode="wait">
                            {!groupState ? (
                                <motion.div 
                                    key="init"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="text-center py-6 space-y-6"
                                >
                                    <div className="w-20 h-20 bg-brand/10 rounded-full mx-auto flex items-center justify-center text-brand">
                                        <Users size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black italic tracking-tighter uppercase text-black">Form Social Group</h3>
                                        <p className="text-[10px] md:text-xs lg:text-sm text-black font-black uppercase tracking-widest mt-2 px-8">Create a group to sync real-time venue splits with your circle.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setGroupState('forming');
                                            setGroupRole('admin');
                                            localStorage.setItem('green_group_role', 'admin');
                                        }}
                                        className="w-full py-6 rounded-2xl bg-black text-white font-black uppercase tracking-[0.3em] italic text-xs md:text-sm lg:text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)]"
                                    >
                                        Activate Group Network
                                    </button>
                                </motion.div>
                            ) : groupState === 'forming' ? (
                                <motion.div 
                                    key="forming"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-gray-500 italic">Select Friends to Invite</h4>
                                        <button 
                                            onClick={() => setGroupState(null)}
                                            className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-brand hover:underline"
                                        >
                                            Back
                                        </button>
                                    </div>
                                    <div className="flex overflow-x-auto no-scrollbar gap-5 py-2 px-1">
                                        {allFriends.map(friend => (
                                            <button 
                                                key={friend.id}
                                                onClick={() => {
                                                    if (invitedFriends.some(f => f.id === friend.id)) {
                                                        setInvitedFriends(invitedFriends.filter(f => f.id !== friend.id));
                                                    } else {
                                                        setInvitedFriends([...invitedFriends, { ...friend, status: 'Pending' }]);
                                                    }
                                                }}
                                                className={`flex-shrink-0 flex flex-col items-center gap-2 group transition-all ${invitedFriends.some(f => f.id === friend.id) ? 'scale-110' : 'opacity-70 hover:opacity-100'}`}
                                            >
                                                <div className={`w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 transition-all shadow-xl ${invitedFriends.some(f => f.id === friend.id) ? 'border-brand' : 'border-white/5 group-hover:border-brand/40'}`}>
                                                    <img src={friend.avatar} alt={friend.name} className="w-full h-full" />
                                                </div>
                                                <span className={`text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest transition-colors ${invitedFriends.some(f => f.id === friend.id) ? 'text-brand' : 'text-gray-500'}`}>
                                                    {friend.name.split(' ')[0]}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => setGroupState('waiting')}
                                        disabled={invitedFriends.length === 0}
                                        className="w-full py-5 rounded-2xl bg-[#1A1A1A] text-white font-black uppercase tracking-[0.2em] italic text-[10px] md:text-xs lg:text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl disabled:opacity-30"
                                    >
                                        Send Invitations ({invitedFriends.length})
                                    </button>
                                </motion.div>
                            ) : groupState === 'waiting' ? (
                                <motion.div 
                                    key="waiting"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-8 py-4"
                                >
                                    <div className="text-center space-y-3">
                                        <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 px-4 py-2 rounded-full">
                                            <div className="w-2 h-2 rounded-full bg-brand" />
                                            <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand">Waiting for acceptance...</span>
                                        </div>
                                        <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-500 font-bold uppercase tracking-widest">A joining link has been sent to your circle.</p>
                                    </div>

                                    <div className="space-y-3">
                                        {invitedFriends.map((f, i) => (
                                            <div key={i} className="flex items-center justify-between bg-[var(--bg-tertiary)] p-4 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <img src={f.avatar} className="w-8 h-8 rounded-lg" alt="" />
                                                    <span className="text-xs md:text-sm lg:text-base font-black italic uppercase text-white">{f.name}</span>
                                                </div>
                                                <span className={`text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest ${f.status === 'Joined' ? 'text-brand' : 'text-amber-400'}`}>
                                                    {f.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="active"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-8"
                                >

                                    {/* Role Selection Badge */}
                                    <div className="flex items-center bg-black/5 p-4 rounded-3xl border border-black/10 gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${groupRole === 'admin' ? 'bg-brand/10 text-brand' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {groupRole === 'admin' ? <ShieldCheck size={18} /> : <UserCheck size={18} />}
                                        </div>
                                        <div>
                                            <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-wider text-black">
                                                {groupRole === 'admin' ? 'Group Leader (Admin)' : 'Circle Member'}
                                            </span>
                                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                                {groupRole === 'admin' ? 'Full ledger & settlement control' : 'Real-time billing synchronization'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* ROLE-TOGGLED VIEW */}
                                    {groupRole === 'admin' ? (
                                        /* ADMIN CONTROL INTERFACE */
                                        <div className="space-y-6">
                                            {/* Table / Seat Link status */}
                                            <div className="bg-black/5 p-5 rounded-[2rem] border border-black/10 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-brand/10 rounded-2xl flex items-center justify-center text-brand">
                                                        <Gem size={20} />
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-black/40">Persistent Venue Table Link</span>
                                                        <h4 className="text-sm font-black italic uppercase text-black mt-0.5">
                                                            {totalBudget && totalBudget !== '12' ? `Table Seat #${totalBudget}` : 'Table Link Not Locked'}
                                                        </h4>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => setIsTableSelectorOpen(true)}
                                                    className="px-4 py-2.5 bg-black text-white text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                >
                                                    Establish Link
                                                </button>
                                            </div>

                                            {/* Ledger Balance Summary Card */}
                                            <div className="greens-ledger-card bg-[#111] border border-white/5 p-6 rounded-[2.5rem] space-y-6 text-white relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-6 opacity-5 text-brand rotate-12">
                                                    <Users size={120} />
                                                </div>
                                                
                                                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                                    <div>
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Live Ledger Balance</span>
                                                        <h3 className="text-3xl font-black italic uppercase text-brand mt-1">
                                                            € {groupTab.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                                                        </h3>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Equal Share</span>
                                                        <p className="greens-equal-share text-sm font-black italic text-white mt-1" style={{ color: '#ffffff' }}>
                                                            € {((groupTab.reduce((sum, item) => sum + item.price, 0)) / (invitedFriends.length + 1)).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Live Friends Payment Badges */}
                                                <div className="space-y-3">
                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500 px-1">Circle Network Status</span>
                                                    
                                                    <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-1 no-scrollbar">
                                                        {/* YOU */}
                                                        <div className="greens-friend-card flex items-center justify-between bg-[#161616] p-3 rounded-xl border border-white/10" style={{ backgroundColor: '#161616', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                                            <span className="greens-friend-name text-[10px] md:text-xs lg:text-sm font-black text-white" style={{ color: '#ffffff' }}>YOU (Leader)</span>
                                                            <span className="text-[7px] font-black uppercase tracking-widest bg-brand/10 border border-brand/20 text-brand px-2.5 py-1 rounded-full">Admin Host</span>
                                                        </div>

                                                        {/* FRIENDS */}
                                                        {(invitedFriends.length > 0 ? invitedFriends : defaultGroupFriends).map((friend, i) => {
                                                            const isPaid = memberPaidStatus[friend.name];
                                                            const isCovered = groupTab.some(item => item.member === friend.name && item.payer === 'cover') || splitMode === 'cover_all';
                                                            return (
                                                                <div key={i} className="greens-friend-card flex items-center justify-between bg-[#161616] p-3 rounded-xl border border-white/10" style={{ backgroundColor: '#161616', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                                                    <span className="greens-friend-name text-[10px] md:text-xs lg:text-sm font-black text-white" style={{ color: '#ffffff' }}>{friend.name}</span>
                                                                    <div>
                                                                        {isCovered ? (
                                                                            <span className="text-[7px] font-black uppercase tracking-widest bg-brand/10 border border-brand/20 text-brand px-2.5 py-1 rounded-full">
                                                                                Host Covered 🤝
                                                                            </span>
                                                                        ) : isPaid ? (
                                                                            <span className="text-[7px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full">
                                                                                ✓ Paid
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[7px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full animate-pulse">
                                                                                ⏳ Pending
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Control Panel */}
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() => setIsSplitOptionsOpen(true)}
                                                    className="w-full py-5 bg-black text-white rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] italic shadow-xl active:scale-[0.98] transition-all hover:bg-neutral-900 border border-neutral-800"
                                                >
                                                    Open Settle Dashboard
                                                </button>
                                                
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => {
                                                            const pending = groupTab.filter(item => item.status === 'pending');
                                                            if (pending.length > 0) {
                                                                setIsDissolveWarningOpen(true);
                                                            } else {
                                                                setGroupState(null);
                                                                setInvitedFriends([]);
                                                                localStorage.removeItem('green_group_state');
                                                                localStorage.removeItem('green_invited_friends');
                                                                localStorage.removeItem('green_group_role');
                                                            }
                                                        }}
                                                        className="py-4 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest transition-all"
                                                    >
                                                        Dissolve Group
                                                    </button>
                                                    <button
                                                        onClick={() => setShowReceipt(true)}
                                                        className="py-4 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest transition-all"
                                                    >
                                                        View Receipt
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* MEMBER NETWORK HUB */
                                        <div className="space-y-5">
                                            {/* Network Connection Banner */}
                                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-3xl flex gap-3 text-left">
                                                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
                                                    <Activity size={16} />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-wider text-amber-500">Connected to Group Network</span>
                                                    <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-600 font-bold uppercase tracking-wide mt-1 leading-relaxed">
                                                        You are active on the Host's ledger session. Table seats, venue orders, and offers are synchronized in real-time.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Share & Order Summary Card */}
                                            {(() => {
                                                const myName = localStorage.getItem('green_member_name') || 'Marcus V.';
                                                const grandTotal = groupTab.reduce((sum, item) => sum + item.price, 0);
                                                const myShare = grandTotal / (invitedFriends.length + 1);
                                                const myItems = groupTab.filter(item => item.member === myName);
                                                const isPaidSelf = payShareDone;

                                                return (
                                                    <div className="greens-ledger-card bg-[#111] border border-white/5 p-6 rounded-[2.5rem] space-y-5 text-white relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-brand">
                                                            <Wallet size={120} />
                                                        </div>

                                                        <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                                            <div>
                                                                <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Your Equal Share</span>
                                                                <h3 className={`text-3xl font-black italic uppercase mt-1 ${isPaidSelf ? 'text-brand' : 'text-amber-500'}`}>
                                                                    € {myShare.toFixed(2)}
                                                                </h3>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Group Settle Target</span>
                                                                <p className="greens-equal-share text-sm font-black italic text-white mt-1" style={{ color: '#ffffff' }}>
                                                                    € {grandTotal.toFixed(2)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Member Items Detail */}
                                                        <div className="space-y-2">
                                                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Your Session Items</span>
                                                            {myItems.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {myItems.map((item, idx) => (
                                                                         <div key={idx} className="greens-friend-card flex justify-between items-center text-[10px] md:text-xs lg:text-sm bg-[#161616] p-3 rounded-xl border border-white/10" style={{ backgroundColor: '#161616', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                                                             <span className="greens-friend-name font-bold text-gray-300" style={{ color: '#d1d5db' }}>{item.item}</span>
                                                                             <span className="greens-friend-name font-black text-white" style={{ color: '#ffffff' }}>€ {item.price.toFixed(2)}</span>
                                                                         </div>
                                                                     ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-500 font-bold uppercase py-2 px-1">No separate items purchased yet</p>
                                                            )}
                                                        </div>

                                                        {/* Real-time Order Feed */}
                                                        <div className="space-y-2 pt-2 border-t border-white/5">
                                                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Live Circle Ledger</span>
                                                            <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1 no-scrollbar">
                                                                {groupTab.map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between items-center text-[9px] md:text-[11px] lg:text-xs text-gray-400">
                                                                        <span>{item.member}: {item.item}</span>
                                                                        <span className="font-black italic">€ {item.price.toFixed(2)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Payment Action CTA */}
                                                        <div className="pt-4">
                                                            {isPaidSelf ? (
                                                                <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-2xl flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                                        <Check size={18} strokeWidth={3} />
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-wider text-emerald-400">Share Settle Complete</span>
                                                                        <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                                            Paid via {payShareMethod === 'visa' ? 'Visa •••• 4242' : payShareMethod === 'mc' ? 'Mastercard •••• 8881' : 'Apple Pay'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setIsPayShareOpen(true)}
                                                                    className="w-full py-4.5 bg-amber-500 text-black font-black uppercase tracking-widest rounded-2xl text-[10px] md:text-xs lg:text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber-500/10 flex items-center justify-center gap-2"
                                                                >
                                                                    <CreditCard size={14} /> Pay My Share (€ {myShare.toFixed(2)})
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* TICKET HUB SHEET */}
                <AnimatePresence>
                    {showTicketHub && (
                        <div className="fixed inset-0 z-[120] flex items-end justify-center">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }} 
                                onClick={() => setShowTicketHub(false)} 
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                            />
                            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="bg-[var(--bg-primary)] border-t border-white/10 rounded-t-[3.5rem] p-8 pb-12 space-y-8 shadow-2xl relative z-10 w-full max-w-lg overflow-y-auto max-h-[80vh] no-scrollbar">
                                 <div className="w-12 h-1 bg-white/10 rounded-full mx-auto" />
                                <div className="text-center pt-2 relative">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand text-white rounded-full text-[7px] font-black uppercase tracking-[0.3em] shadow-lg whitespace-nowrap">Operational Hub 🛰️</div>
                                    <h3 className="text-2xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter mt-4">Active Missions & Bookings</h3>
                                </div>

                                <div className="space-y-4">
                                    {venueTickets.map((ticket) => {
                                        let locationLabel = 'Table';
                                        let displayTitle = 'Digital Order';
                                        
                                        if (ticket.type === 'booking') {
                                            locationLabel = 'Status';
                                            displayTitle = 'Hotel Booking';
                                        } else if (ticket.type === 'room_service') {
                                            locationLabel = 'Room';
                                            displayTitle = 'Room Service';
                                        } else if (ticket.type === 'stadium_ticket' || ticket.type === 'club_ticket') {
                                            locationLabel = 'Ticket';
                                            displayTitle = 'Digital Ticket';
                                        } else if (ticket.type === 'parking') {
                                            locationLabel = 'Pass';
                                            displayTitle = 'Parking Pass';
                                        }

                                        // Dynamic Status Mapping from B2B Manager Dashboard
                                        let currentStatus = ticket.orderStatus || 'PENDING';
                                        try {
                                            const savedOrders = JSON.parse(localStorage.getItem('green_active_orders') || '[]');
                                            const matchedOrder = savedOrders.find(o => String(o.id) === String(ticket.id));
                                            if (matchedOrder) {
                                                const b2bStatus = matchedOrder.status;
                                                if (ticket.type === 'booking') {
                                                    if (b2bStatus === 'Received' || b2bStatus === 'Booked') {
                                                        currentStatus = 'CONFIRMED';
                                                    } else if (b2bStatus === 'Check-In' || b2bStatus === 'Staying') {
                                                        currentStatus = 'CHECKED IN';
                                                    } else if (b2bStatus === 'Departed') {
                                                        currentStatus = 'CHECKED OUT';
                                                    } else {
                                                        currentStatus = b2bStatus.toUpperCase();
                                                    }
                                                } else {
                                                    if (b2bStatus === 'Received' || b2bStatus === 'Preparing') {
                                                        currentStatus = 'PENDING';
                                                    } else if (b2bStatus === 'Ready') {
                                                        currentStatus = 'READY';
                                                    } else if (b2bStatus === 'Served' || b2bStatus === 'Paid' || b2bStatus === 'Departed') {
                                                        currentStatus = 'SERVED';
                                                    } else {
                                                        currentStatus = b2bStatus.toUpperCase();
                                                    }
                                                }
                                            }
                                        } catch (e) {
                                            console.error('Failed to resolve dynamic ticket status:', e);
                                        }
                                        
                                        return (
                                            <div 
                                                key={ticket.id}
                                                className="bg-[var(--bg-secondary)] border border-white/5 p-5 rounded-[2.5rem] flex items-center justify-between group hover:border-brand/30 transition-all cursor-pointer"
                                                onClick={() => {
                                                    navigate('/order/tracker', { 
                                                        state: { 
                                                            cart: ticket.items, 
                                                            venueName: ticket.venueName, 
                                                            venueAddress: ticket.venueAddress,
                                                            tableId: ticket.tableId, 
                                                            orderId: ticket.id, 
                                                            paymentMethod: ticket.paymentMethod, 
                                                            paymentStatus: ticket.paymentStatus, 
                                                            orderStatus: currentStatus,
                                                            guestName: ticket.guestName
                                                        } 
                                                    });
                                                }}
                                            >
                                                <div className="flex items-center gap-4 pointer-events-none">
                                                    <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand border border-brand/20">
                                                        {ticket.type === 'parking' ? <QrCode size={24} /> : (ticket.type === 'stadium_ticket' || ticket.type === 'booking') ? <Ticket size={24} /> : ticket.type === 'service' ? <Sparkles size={24} /> : <ShoppingBag size={24} />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="text-sm font-black italic uppercase text-[var(--text-primary)] leading-none">{displayTitle}</h4>
                                                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded ${ticket.paymentStatus === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                                {ticket.paymentStatus}
                                                            </span>
                                                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500`}>
                                                                ORDER: {currentStatus}
                                                            </span>
                                                        </div>
                                                        <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                                            {ticket.venueName} • {locationLabel} #{ticket.tableId} • {ticket.timestamp}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button 
                                                    className="px-5 py-2.5 bg-black text-white rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black tracking-widest uppercase hover:bg-brand active:scale-95 transition-all pointer-events-none"
                                                >
                                                    Open
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- CHIPS / SOCIAL LEDGER SHEETS & DIALOGS --- */}
                <Sheet isOpen={isSplitOptionsOpen} onClose={() => setIsSplitOptionsOpen(false)} className="rounded-t-[3.5rem]">
                    <div className="p-6 space-y-8 pb-12">
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 bg-brand/10 rounded-full mx-auto flex items-center justify-center text-brand shadow-lg shadow-brand/10">
                                <Users size={32} />
                            </div>
                            <h3 className="text-3xl font-black italic tracking-tighter uppercase text-white">Settle Group Tab</h3>
                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-gray-500">Manage payment responsibilities before closing the tab</p>
                        </div>

                        {/* Interactive Tab List */}
                        <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-6 space-y-4 shadow-inner">
                            <div className="flex justify-between items-center text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-neutral-400 pb-2 border-b border-neutral-800">
                                <span>Circle Member</span>
                                <span>Spent Total</span>
                                <span>Tab Payment Responsibility</span>
                            </div>
                            
                            <div className="space-y-4 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                                {/* Admin (YOU) */}
                                {(() => {
                                    const friendList = invitedFriends.length > 0 ? invitedFriends : defaultGroupFriends;
                                    const grandTotal = groupTab.reduce((sum, item) => sum + item.price, 0);
                                    const memberCount = 1 + friendList.length;
                                    const equalShare = grandTotal / memberCount;
                                    const yourRaw = groupTab.filter(item => item.member === 'YOU').reduce((sum, item) => sum + item.price, 0);
                                    const yourDisplay = splitMode === 'split_all' ? equalShare : yourRaw;
                                    return (
                                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center text-brand text-[10px] md:text-xs lg:text-sm font-black italic animate-pulse">YOU</div>
                                                <span className="text-[11px] md:text-sm lg:text-base font-black text-white">Project Leader</span>
                                            </div>
                                            <span className={`text-xs md:text-sm lg:text-base font-black italic ${splitMode === 'split_all' ? 'text-amber-400' : 'text-white'}`}>€ {yourDisplay.toFixed(2)}</span>
                                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest bg-brand/10 border border-brand/35 text-brand px-3 py-1.5 rounded-full">Pays Own Tab</span>
                                        </div>
                                    );
                                })()}

                                {/* Friends mapping */}
                                {(() => {
                                    const friendList = invitedFriends.length > 0 ? invitedFriends : defaultGroupFriends;
                                    const grandTotal = groupTab.reduce((sum, item) => sum + item.price, 0);
                                    const memberCount = 1 + friendList.length;
                                    const equalShare = grandTotal / memberCount;

                                    return friendList.map((friend, idx) => {
                                        const friendSpent = groupTab.filter(item => item.member === friend.name).reduce((sum, item) => sum + item.price, 0);
                                        const isCoveredRaw = groupTab.some(item => item.member === friend.name && item.payer === 'cover');
                                        const isCovered = isCoveredRaw || splitMode === 'cover_all';
                                        const displayAmount = splitMode === 'split_all' ? equalShare : splitMode === 'cover_all' ? 0 : friendSpent;

                                        return (
                                            <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <img src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`} className="w-8 h-8 rounded-lg" alt="" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] md:text-sm lg:text-base font-black text-white">{friend.name}</span>
                                                        <div className="mt-1">
                                                            {isCovered ? (
                                                                <span className="inline-flex items-center gap-1 text-[7px] font-black uppercase tracking-wider bg-brand/10 border border-brand/20 text-brand px-2 py-0.5 rounded-full">
                                                                    Covered 🤝
                                                                </span>
                                                            ) : memberPaidStatus[friend.name] ? (
                                                                <span className="inline-flex items-center gap-1 text-[7px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                                                                    ✓ Paid
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[7px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full animate-pulse">
                                                                    ⏳ Pending
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`text-xs md:text-sm lg:text-base font-black italic ${splitMode === 'split_all' ? 'text-amber-400' : splitMode === 'cover_all' ? 'text-gray-600 line-through' : 'text-white/90'}`}>€ {displayAmount.toFixed(2)}</span>
                                                <button
                                                    onClick={() => {
                                                        setSplitMode('individual');
                                                        togglePayer(friend.name);
                                                    }}
                                                    className={`text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border transition-all active:scale-95 ${
                                                        isCovered 
                                                            ? 'bg-brand border-brand text-black font-black' 
                                                            : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                                                    }`}
                                                >
                                                    {isCovered ? 'Covered by Host 🤝' : 'Friend Pays Self'}
                                                </button>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* Liability Breakdown */}
                        {(() => {
                            const friendList = invitedFriends.length > 0 ? invitedFriends : defaultGroupFriends;
                            const grandTotal = groupTab.reduce((sum, item) => sum + item.price, 0);
                            const memberCount = 1 + friendList.length;
                            const equalShare = grandTotal / memberCount;

                            let yourTotal, friendsTotal;
                            if (splitMode === 'split_all') {
                                yourTotal = equalShare;
                                friendsTotal = equalShare * friendList.length;
                            } else if (splitMode === 'cover_all') {
                                yourTotal = grandTotal;
                                friendsTotal = 0;
                            } else {
                                yourTotal = groupTab.filter(item => item.member === 'YOU' || item.payer === 'cover').reduce((sum, item) => sum + item.price, 0);
                                friendsTotal = groupTab.filter(item => item.member !== 'YOU' && item.payer === 'self').reduce((sum, item) => sum + item.price, 0);
                            }

                            return (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`border p-5 rounded-3xl text-center transition-all ${splitMode === 'cover_all' ? 'bg-brand/10 border-brand/40' : 'bg-neutral-900 border-neutral-800'}`}>
                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-neutral-500 uppercase tracking-widest">Your Settle Total</span>
                                        <h4 className="text-2xl font-black italic text-brand mt-1">€ {yourTotal.toFixed(2)}</h4>
                                        {splitMode !== 'individual' && <p className="text-[7px] text-neutral-500 uppercase tracking-widest mt-1">{splitMode === 'cover_all' ? 'Covering Everyone' : 'Equal Share'}</p>}
                                    </div>
                                    <div className={`border p-5 rounded-3xl text-center transition-all ${splitMode === 'split_all' ? 'bg-amber-500/10 border-amber-500/40' : 'bg-neutral-900 border-neutral-800'}`}>
                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-neutral-500 uppercase tracking-widest">Friends Settle Total</span>
                                        <h4 className={`text-2xl font-black italic mt-1 ${splitMode === 'split_all' ? 'text-amber-400' : 'text-white'}`}>€ {friendsTotal.toFixed(2)}</h4>
                                        {splitMode !== 'individual' && <p className="text-[7px] text-neutral-500 uppercase tracking-widest mt-1">{splitMode === 'cover_all' ? 'Covered by You' : `${friendList.length}× equal share`}</p>}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Decision Actions */}
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPayAll(true)}
                                    className={`flex-1 py-5 border text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-all ${splitMode === 'cover_all' ? 'bg-brand border-brand text-black' : 'bg-neutral-950 border-neutral-800 text-white hover:bg-neutral-900'}`}
                                >
                                    Cover All
                                </button>
                                <button
                                    onClick={() => setPayAll(false)}
                                    className={`flex-1 py-5 border text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-all ${splitMode === 'split_all' ? 'bg-amber-500 border-amber-500 text-black' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'}`}
                                >
                                    Split All
                                </button>
                            </div>
                            
                            <button
                                onClick={() => {
                                    setIsSplitOptionsOpen(false);
                                    executePaymentChoice('split');
                                }}
                                className="w-full py-6 bg-brand text-dark-900 rounded-2xl text-[11px] md:text-sm lg:text-base font-black uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-[0.98] transition-all"
                            >
                                Process Tab Settlement (Total € {groupTab.reduce((sum, item) => sum + item.price, 0).toFixed(2)})
                            </button>
                            
                            <button 
                                onClick={() => setIsSplitOptionsOpen(false)}
                                className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all"
                            >
                                Cancel Settlement
                            </button>
                        </div>
                    </div>
                </Sheet>

                {/* --- MEMBER PAY SHARE SHEET --- */}
                <Sheet isOpen={isPayShareOpen} onClose={() => setIsPayShareOpen(false)} className="rounded-t-[3.5rem]">
                    <div className="p-6 space-y-8 pb-12">
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 bg-amber-500/10 rounded-full mx-auto flex items-center justify-center text-amber-500">
                                <Wallet size={32} />
                            </div>
                            <h3 className="text-3xl font-black italic tracking-tighter uppercase text-white">Pay My Share</h3>
                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-amber-500">Settle your equal share of the active tab</p>
                        </div>

                        {/* Cost breakdown */}
                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 text-center">
                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-neutral-500 uppercase tracking-widest">Amount to Pay</span>
                            <h4 className="text-3xl font-black italic text-amber-400 mt-1">
                                € {((groupTab.reduce((sum, item) => sum + item.price, 0)) / (invitedFriends.length + 1)).toFixed(2)}
                            </h4>
                        </div>

                        {/* Payment methods */}
                        <div className="space-y-3">
                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-neutral-400 px-1">Select Saved Payment Method</span>
                            <div className="flex flex-col gap-3">
                                {[
                                    { id: 'visa', label: 'Visa •• 4242', icon: CreditCard },
                                    { id: 'mc', label: 'Mastercard •• 8881', icon: CreditCard },
                                    { id: 'apple', label: 'Apple Pay', icon: Wallet }
                                ].map((method) => {
                                    const Icon = method.icon;
                                    return (
                                        <button
                                            key={method.id}
                                            onClick={() => setPayShareMethod(method.id)}
                                            className={`p-5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                                                payShareMethod === method.id 
                                                    ? 'bg-amber-500/10 border-amber-500 text-white font-black' 
                                                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${payShareMethod === method.id ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-900 text-neutral-500'}`}>
                                                    <Icon size={16} />
                                                </div>
                                                <span className="text-xs md:text-sm lg:text-base font-bold uppercase tracking-wider">{method.label}</span>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payShareMethod === method.id ? 'border-amber-500 bg-amber-500' : 'border-neutral-700'}`}>
                                                {payShareMethod === method.id && <Check size={12} className="text-black font-black" strokeWidth={3} />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Confirm button */}
                        <button
                            onClick={handleMemberPayShare}
                            disabled={!payShareMethod || payShareProcessing}
                            className="w-full py-6 bg-amber-500 text-black font-black uppercase tracking-widest rounded-2xl text-[11px] md:text-sm lg:text-base shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                        >
                            {payShareProcessing ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    <span>Authorizing Transaction...</span>
                                </div>
                            ) : (
                                <span>Confirm Payment</span>
                            )}
                        </button>
                    </div>
                </Sheet>

                {/* --- DISSOLVE BLOCKED WARNING SHEET --- */}
                <Sheet isOpen={isDissolveWarningOpen} onClose={() => setIsDissolveWarningOpen(false)} className="rounded-t-[3.5rem]">
                    <div className="p-6 space-y-8 pb-12 text-center">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full mx-auto flex items-center justify-center text-red-500 animate-bounce">
                            <Zap size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black italic tracking-tighter uppercase text-white">Tab Settle Required</h3>
                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-red-500">Unsettled Charges Detected on Circle Ledger</p>
                        </div>
                        
                        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-left space-y-4">
                            <div className="flex justify-between items-center text-xs md:text-sm lg:text-base font-black uppercase text-neutral-400 pb-2 border-b border-neutral-800">
                                <span>Pending Tab Items</span>
                                <span>Cost</span>
                            </div>
                            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2 no-scrollbar">
                                {groupTab.filter(item => item.status === 'pending').map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs md:text-sm lg:text-base">
                                        <span className="font-bold text-white">{item.member} <span className="text-[10px] md:text-xs lg:text-sm text-neutral-500 font-normal">({item.item})</span></span>
                                        <span className="font-black text-brand">€ {item.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-[10px] md:text-xs lg:text-sm text-neutral-500 font-bold uppercase tracking-wide leading-relaxed">
                            You cannot dissolve the circle until the tab has been fully settled by the Admin or split among members.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => {
                                    setIsDissolveWarningOpen(false);
                                    setIsSplitOptionsOpen(true);
                                }}
                                className="w-full py-5 bg-brand text-dark-900 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-[0.98] transition-all"
                            >
                                Open Settle Dashboard
                            </button>
                            <button 
                                onClick={() => setIsDissolveWarningOpen(false)}
                                className="w-full py-5 bg-neutral-900 text-white border border-neutral-800 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest hover:bg-neutral-800 active:scale-[0.98] transition-all"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </Sheet>

                {/* --- SELECT ACTIVE TABLE SHEET --- */}
                <Sheet isOpen={isTableSelectorOpen} onClose={() => setIsTableSelectorOpen(false)} className="rounded-t-[3.5rem]">
                    <div className="p-6 space-y-8 pb-12">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-brand/10 rounded-full mx-auto flex items-center justify-center text-brand animate-pulse">
                                <Gem size={32} />
                            </div>
                            <h3 className="text-3xl font-black italic tracking-tighter uppercase text-white">Select Active Table</h3>
                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-brand">Establish Persistent Venue Session Link</p>
                        </div>

                        {/* Manual Table input */}
                        <div className="relative">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400 font-black italic text-xl">#</div>
                            <input 
                                type="text" 
                                placeholder="Enter Table or Seat #"
                                value={totalBudget}
                                onChange={(e) => setTotalBudget(e.target.value)}
                                className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-[2rem] py-5 pl-12 pr-6 text-xl font-black italic text-white focus:outline-none focus:border-brand shadow-inner transition-all"
                            />
                        </div>

                        {/* Quick Grid Select */}
                        <div className="space-y-3">
                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-neutral-400">Quick Selection</span>
                            <div className="grid grid-cols-5 gap-3">
                                {[1, 3, 5, 8, 12, 15, 18, 22, 27, 30].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTotalBudget(String(t))}
                                        className={`py-3 rounded-2xl text-xs md:text-sm lg:text-base font-black italic transition-all ${
                                            String(totalBudget) === String(t)
                                                ? 'bg-brand text-black scale-105 border-brand'
                                                : 'bg-neutral-900 text-white border border-neutral-800 hover:border-neutral-700'
                                        }`}
                                    >
                                        T-{t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Confirm Trigger */}
                        <button 
                            onClick={() => setIsTableSelectorOpen(false)}
                            className="w-full py-6 bg-brand text-dark-900 rounded-2xl text-[11px] md:text-sm lg:text-base font-black uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-[0.98] transition-all"
                        >
                            Confirm & Lock Table Link
                        </button>
                    </div>
                </Sheet>

                {/* --- SLIDING SOCIAL RECEIPT SHEET --- */}
                <Sheet isOpen={showReceipt} onClose={() => setShowReceipt(false)} className="rounded-t-[3.5rem]">
                    <div className="p-4 space-y-8 pb-12">
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 bg-brand/10 rounded-full mx-auto flex items-center justify-center text-brand">
                                <Check size={32} strokeWidth={3} />
                            </div>
                            <h3 className="text-3xl font-black italic tracking-tighter uppercase">Verified Receipt</h3>
                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-gray-500 italic">Fair-Split Pro #88D600</p>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] relative overflow-hidden text-white">
                            <div className="absolute top-0 right-0 p-8 opacity-10 text-brand rotate-12">
                                <Zap size={100} />
                            </div>
                            
                            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-neutral-400">Venue / Event</span>
                                <span className="text-xs md:text-sm lg:text-base font-black italic uppercase text-white">Social Night Hub</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs md:text-sm lg:text-base font-black uppercase italic text-neutral-400">
                                    <span>Member Breakdown</span>
                                    <span>Contribution</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center text-brand text-[10px] md:text-xs lg:text-sm font-black italic animate-pulse">YOU</div>
                                            <div>
                                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-white">Project Leader</span>
                                                <p className="text-[7px] text-neutral-400 uppercase tracking-widest mt-0.5">
                                                    Your items + {groupTab.filter(item => item.member !== 'YOU' && item.payer === 'cover').length} covered friends
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs md:text-sm lg:text-base font-black italic text-brand">
                                            € {groupTab.filter(item => item.member === 'YOU' || item.payer === 'cover').reduce((sum, i) => sum + i.price, 0).toFixed(2)}
                                        </span>
                                    </div>
                                    {(invitedFriends.length > 0 ? invitedFriends : defaultGroupFriends).map((f, i) => {
                                        const isCovered = groupTab.some(item => item.member === f.name && item.payer === 'cover');
                                        const friendSpent = groupTab.filter(item => item.member === f.name).reduce((sum, item) => sum + item.price, 0);
                                        return (
                                            <div key={i} className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <img src={f.avatar} className="w-8 h-8 rounded-lg" alt="" />
                                                    <div>
                                                        <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-white">{f.name}</span>
                                                        <p className="text-[7px] text-neutral-400 uppercase tracking-widest mt-0.5">
                                                            {isCovered ? 'Covered by Host 🤝' : 'Paid Self'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs md:text-sm lg:text-base font-black italic text-white/90">
                                                    € {isCovered ? '0.00' : friendSpent.toFixed(2)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-brand/20 flex justify-between items-center">
                                <span className="text-lg font-black italic uppercase tracking-tighter text-white">Total Amount</span>
                                <span className="text-2xl font-black italic text-brand tracking-tighter">€ {groupTab.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => alert("Receipt shared with all members!")}
                                className="w-full py-5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-neutral-800 transition-all shadow-sm active:scale-[0.98]"
                            >
                                Send to All Members
                            </button>
                            <button 
                                onClick={() => setShowReceipt(false)}
                                className="w-full py-5 bg-black hover:bg-neutral-900 text-white rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl active:scale-[0.98]"
                            >
                                Close Ledger
                            </button>
                        </div>
                    </div>
                </Sheet>
                
                {/* --- SUPPORT & FEEDBACK --- */}
                <section className="mb-10">
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => { setSupportType('feedback'); setIsSupportOpen(true); }}
                            className="p-6 bg-white/5 border border-white/5 rounded-[2rem] flex flex-col items-center gap-3 hover:border-brand/40 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                                <Sparkles size={24} />
                            </div>
                            <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500 group-hover:text-white">Give Feedback</span>
                        </button>
                        <button 
                            onClick={() => { setSupportType('complaint'); setIsSupportOpen(true); }}
                            className="p-6 bg-white/5 border border-white/5 rounded-[2rem] flex flex-col items-center gap-3 hover:border-red-500/40 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                <Zap size={24} />
                            </div>
                            <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500 group-hover:text-white">File Complaint</span>
                        </button>
                    </div>
                </section>

                {/* --- SUPPORT CHAT SHEET --- */}
                <Sheet isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} className="rounded-t-[3.5rem] !p-0">
                    <div className="flex flex-col h-[70vh] bg-[var(--bg-primary)]">
                        {/* Chat Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[var(--bg-secondary)]/50">
                            <div className="flex items-center gap-4">
                                <div />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-brand" />
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-brand tracking-widest">{supportType === 'feedback' ? 'Feedback' : 'Complaint'}</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsSupportOpen(false)} className="text-gray-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                            {messages.map((msg) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={msg.id} 
                                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`max-w-[80%] p-4 rounded-3xl text-xs md:text-sm lg:text-base font-bold leading-relaxed ${
                                        msg.sender === 'user' 
                                        ? 'bg-brand text-dark-950 rounded-tr-none' 
                                        : 'bg-[var(--bg-secondary)] border border-white/10 text-[var(--text-primary)] rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-gray-600 mt-1 px-2">{msg.time}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-[var(--bg-secondary)] border-t border-white/5" style={{ backgroundColor: 'rgba(var(--bg-secondary-rgb, 13, 20, 33), 0.5)' }}>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder={supportType === 'feedback' ? "Share your thoughts..." : "Describe the issue..."}
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="w-full bg-[var(--bg-primary)] border border-white/10 rounded-2xl py-5 pl-6 pr-16 text-xs md:text-sm lg:text-base font-bold text-white focus:outline-none focus:border-brand/40 transition-all"
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    className="absolute right-2 top-2 bottom-2 px-4 bg-brand text-dark-950 rounded-xl font-black uppercase text-[10px] md:text-xs lg:text-sm tracking-widest active:scale-90 transition-all"
                                >
                                    Send
                                </button>
                            </div>
                            <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest text-center mt-4 italic">
                                SECURE CHANNEL: AES-256 ENCRYPTION ACTIVE
                            </p>
                        </div>
                    </div>
                </Sheet>

                {/* Offer Detail Sheet */}
                <Sheet isOpen={!!selectedOffer} onClose={() => { setSelectedOffer(null); setSharingToFriend(false); }} className="rounded-t-[3rem]">
                    {selectedOffer && (
                        <div className="space-y-8 pb-12">
                            <div className="text-center space-y-4">
                                <div className={`w-20 h-20 rounded-[2rem] mx-auto flex items-center justify-center bg-white/5 border border-white/10 ${selectedOffer.color}`}>
                                    <selectedOffer.icon size={40} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter">{selectedOffer.label} <span className="text-brand">Exclusive</span></h3>
                                    <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-gray-500 mt-2">Verified Partner Offer</p>
                                </div>
                            </div>

                            <div className="p-8 rounded-[2.5rem] bg-brand/5 border border-brand/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10 text-brand">
                                    <Sparkles size={80} />
                                </div>
                                <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-brand mb-2">Current Reward</p>
                                <h4 className="text-4xl font-black italic tracking-tighter uppercase">{selectedOffer.offer}</h4>
                                <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-gray-400 mt-6 uppercase tracking-widest leading-relaxed">
                                    Redeemable via Radar Ride. Valid for the next 4 hours at participating locations.
                                </p>
                            </div>

                            {!sharingToFriend ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => navigate('/discovery', { state: { category: selectedOffer.id } })}
                                        className="py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest hover:bg-brand/10 transition-all text-brand">
                                        Browse Venues
                                    </button>
                                    <button 
                                        onClick={() => setSharingToFriend(true)}
                                        className="py-5 bg-brand text-dark-900 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-105 transition-all"
                                    >
                                        Share with Friend
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500 px-2">Select Friend to Invite</h4>
                                        <div className="grid grid-cols-4 gap-4">
                                            {[1, 2, 3, 4].map(i => (
                                                <button key={i} className="flex flex-col items-center gap-2 group">
                                                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 p-1 group-hover:border-brand/40 group-focus:border-brand transition-all">
                                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 50}`} className="w-full h-full rounded-xl" />
                                                    </div>
                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-gray-500">Friend {i}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-white">Split Hospitality Costs?</p>
                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase mt-1">Ride is charged to leader; split only venue items</p>
                                            </div>
                                            <div className="w-12 h-6 bg-brand/20 rounded-full relative cursor-pointer border border-brand/30">
                                                <div className="absolute right-1 top-1 w-4 h-4 bg-brand rounded-full shadow-lg" />
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => {
                                            alert("Invitation launched! Proposing a 50/50 split to your friend.");
                                            setSelectedOffer(null);
                                        }}
                                        className="neon-button w-full py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 mt-4"
                                    >
                                        Activate Access <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </Sheet>
            </div>
        </div>
    );
};

export default GreenSPage;
