import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe,
    Smartphone,
    X,
    Search,
    Zap,
    Share2,
    Clock,
    Shield,
    HelpCircle,
    ChevronRight,
    Lock,
    LifeBuoy,
    ArrowLeft,
    Phone,
    Mail,
    MapPin,
    Camera,
    Box,
    ArrowRight,
    LogOut,
    Sparkles,
    Wallet,
    User,
    MessageSquare,
    Info,
    FileText,
    Languages,
    CheckCircle,
    CreditCard,
    Landmark,
    Coins,
    ShieldCheck,
    Edit2,
    Trash2,
    Star,
    GlassWater,
    Utensils,
    BedDouble,
    Droplets,
    Activity,
    Compass,
    Layers,
    Navigation,
    Bell,
    Heart,
    ShoppingBag,
    Users,
    Trophy,
    Car,
    UserCheck,
    Upload,
    Paperclip,
    Send
} from 'lucide-react';
import Radar from '../components/Radar';
import Sheet from '../components/Sheet';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import PostsFeed from '../components/PostsFeed';
import RatingComponent from '../components/RatingComponent';
import Bubbles from '../components/Bubbles';

import ThemeToggle from '../components/ThemeToggle';

const RenderIcon = ({ icon, size }) => {
    if (!icon) return <Clock size={size} />;
    if (typeof icon !== 'string') {
        const IconComponent = icon;
        return <IconComponent size={size} />;
    }
    const lower = icon.toLowerCase();
    if (lower.includes('shield')) return <Shield size={size} />;
    if (lower.includes('zap') || lower.includes('lightning')) return <Zap size={size} />;
    return <Clock size={size} />;
};

const Home = () => {
    const { logout, login, user } = useAuth();
    const navigate = useNavigate();
    const { t, setLang, lang, dir } = useLanguage();
    
    // NOTCH & SAFE AREA INTEGRATION
    const [useSafeArea, setUseSafeArea] = useState(() => {
        return localStorage.getItem('green_manager_use_safe_area') !== 'false';
    });
    const [notchAdjustment, setNotchAdjustment] = useState(() => {
        const saved = localStorage.getItem('green_manager_notch_adjustment');
        if (saved) {
            const parsed = parseInt(saved, 10);
            if (!isNaN(parsed)) return parsed;
        }
        return window.innerWidth < 768 ? 16 : 0;
    });
    const [isNotchPanelOpen, setIsNotchPanelOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('green_manager_use_safe_area', useSafeArea ? 'true' : 'false');
    }, [useSafeArea]);

    useEffect(() => {
        localStorage.setItem('green_manager_notch_adjustment', notchAdjustment.toString());
    }, [notchAdjustment]);
    
    const [nearbyVenue, setNearbyVenue] = useState(null);

    useEffect(() => {
        // HQ SENTINEL: Redirect non-passengers to their proper dashboards
        if (user) {
            if (user.role === 'driver') navigate('/driver');
            else if (user.role === 'manager' || user.role === 'staff') navigate('/manager');
            else if (user.role === 'super_admin') navigate('/admin');
        }

        // Simulate GPS detecting a nearby Manager ID after a short delay
        const timer = setTimeout(() => {
            setNearbyVenue({
                id: 'V-SKY-01',
                name: "Neon Bistro",
                offer: "20% OFF TOTAL BILL",
                type: "Organic Bistro"
            });
        }, 3000);
        return () => clearTimeout(timer);
    }, []);
    const [activeSheet, setActiveSheet] = useState(null);
    const [profileSubView, setProfileSubView] = useState(null); // null, 'account', 'history', 'help'
    const [helpSubView, setHelpSubView] = useState(null); // null, 'chat', 'dsgvo', 'app', 'email', 'delete_account'
    const [serviceDetailView, setServiceDetailView] = useState(null); // null, 'trips', 'tickets', 'rooms', 'order', 'waiter'
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);

    // GDPR/DSGVO 15-Day Account Deletion States
    const [deletionProtocolActive, setDeletionProtocolActive] = useState(false);
    const [deletionDeadline, setDeletionDeadline] = useState(null);
    const [confirmDeleteInput, setConfirmDeleteInput] = useState('');

    useEffect(() => {
        if (user && user.email) {
            const deletionState = localStorage.getItem(`green_account_deletion_${user.email.toLowerCase()}`);
            if (deletionState) {
                try {
                    const parsed = JSON.parse(deletionState);
                    if (parsed && parsed.status === 'scheduled') {
                        const deadlineDate = new Date(parsed.deadline);
                        const now = new Date();
                        if (now > deadlineDate) {
                            // 15 days have passed -> WIPE COMPLETELY!
                            performCompleteDataWipe(user.email.toLowerCase());
                        } else {
                            setDeletionProtocolActive(true);
                            setDeletionDeadline(parsed.deadline);
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse deletion state:', e);
                }
            }
        }
    }, [user]);

    const performCompleteDataWipe = (email) => {
        if (!email) return;
        
        // 1. Wipe all local storage keys for this user role prefix
        const role = user?.role || 'passenger';
        const prefix = `${role}_`;
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && (key.startsWith(prefix) || key.includes(email))) {
                localStorage.removeItem(key);
            }
        }
        
        // 2. Remove the specific deletion key
        localStorage.removeItem(`green_account_deletion_${email}`);
        
        // 3. Clear deletion states
        setDeletionProtocolActive(false);
        setDeletionDeadline(null);
        setConfirmDeleteInput('');
        
        // 4. Trigger logout
        logout();
        
        alert("GDPR PROTOCOL COMPLETED: Your account and all associated data have been permanently and irreversibly destroyed.");
    };

    const handleConfirmDeletion = () => {
        if (!user || !user.email) return;
        const now = new Date();
        const deadline = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
        
        const deletionState = {
            status: 'scheduled',
            email: user.email.toLowerCase(),
            scheduledAt: now.toISOString(),
            deadline: deadline.toISOString()
        };
        
        localStorage.setItem(`green_account_deletion_${user.email.toLowerCase()}`, JSON.stringify(deletionState));
        setDeletionDeadline(deadline.toISOString());
        setDeletionProtocolActive(true);
        setHelpSubView(null);
        setProfileSubView(null);
        setConfirmDeleteInput('');
    };

    const handleCancelDeletion = () => {
        if (!user || !user.email) return;
        localStorage.removeItem(`green_account_deletion_${user.email.toLowerCase()}`);
        setDeletionProtocolActive(false);
        setDeletionDeadline(null);
        alert("Deletion cancelled. Your account and data have been fully restored and secured!");
    };

    const handleSendChatMessage = () => {
        if (!chatInput.trim()) return;

        const userMsg = chatInput.trim();
        const updatedMessages = [...chatMessages, { sender: 'user', text: userMsg }];
        setChatMessages(updatedMessages);
        setChatInput('');
        setIsAiTyping(true);

        setTimeout(() => {
            let aiText = "I can help you retrieve information regarding your active tickets, trips, or order statuses. For any modifications, cancellations, or refund requests, please note that our support team's processing window is always 3 working days (3 Werktage).";
            
            const lowerMsg = userMsg.toLowerCase();
            if (lowerMsg.includes('ticket') || lowerMsg.includes('karte') || lowerMsg.includes('pass') || lowerMsg.includes('karten') || lowerMsg.includes('eintritt')) {
                aiText = "Your active venue and stadium tickets are safely listed in your personal hub. If you want to modify a booking, request a refund, or cancel a ticket, please note that our standard processing time is always 3 working days (3 Werktage).";
            } else if (lowerMsg.includes('trip') || lowerMsg.includes('ride') || lowerMsg.includes('fahrt') || lowerMsg.includes('dispat') || lowerMsg.includes('fahrten') || lowerMsg.includes('route')) {
                aiText = "All information regarding active rides or historic trip receipts can be found in your Ride History. For claims regarding lost items or fare adjustments, please note that our support team will process your request within 3 working days (3 Werktage).";
            } else if (lowerMsg.includes('order') || lowerMsg.includes('bestellung') || lowerMsg.includes('essen') || lowerMsg.includes('drink') || lowerMsg.includes('getränk') || lowerMsg.includes('bestellungen')) {
                aiText = "Your catering and venue orders are sent in real-time to the merchant. For order refunds, payment settlements, or dispute tickets, our secure merchant clearing cycle takes exactly 3 working days (3 Werktage).";
            } else if (lowerMsg.includes('zeit') || lowerMsg.includes('dauer') || lowerMsg.includes('tage') || lowerMsg.includes('werktage') || lowerMsg.includes('lange') || lowerMsg.includes('support') || lowerMsg.includes('bearbeit')) {
                aiText = "The standard processing period for all customer claims, ticket cancellations, and support inquiries is strictly 3 working days (3 Werktage). We process every request in the order it was received.";
            }

            setChatMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
            setIsAiTyping(false);
        }, 1200);
    };
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [editingPaymentId, setEditingPaymentId] = useState(null);
    const [walletStats, setWalletStats] = useState({
        totalSaved: 312.20
    });

    const [isSearchingMatch, setIsSearchingMatch] = useState(false);
    const [sharingMatch, setSharingMatch] = useState(null);
    const [showSharingDialog, setShowSharingDialog] = useState(false);
    const [hasUpdates, setHasUpdates] = useState(true);
    const { rideStatus, allowDashboardView } = useRide();

    useEffect(() => {
        if (rideStatus !== 'idle' && !allowDashboardView) {
            navigate('/green-ride');
        }
    }, [rideStatus, navigate, allowDashboardView]);

    const fileInputRef = useRef(null);

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

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

    const handleFindRide = (destination) => {
        setIsSearchingMatch(true);
        setActiveSheet(null); // Close the ride selection sheet

        // Simulate network lookup for sharing matches
        setTimeout(() => {
            setIsSearchingMatch(false);
            const mockMatch = {
                name: "Sarah M.",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
                rating: 4.9,
                distance: "0.8 km",
                pickup: "Cyber Terrace 42",
                personality: [
                    { emoji: "🎵", trait: "Loves Techno" },
                    { emoji: "🚭", trait: "Non-Smoker" },
                    { emoji: "☕", trait: "Deep Talks" }
                ],
                savings: "€ 8.50"
            };
            setSharingMatch(mockMatch);
            setShowSharingDialog(true);
        }, 2500);
    };

    const handleAddPayment = (type) => {
        const newId = Math.max(...paymentMethods.map(m => m.id), 0) + 1;
        let newMethod = { id: newId, type };

        switch (type) {
            case 'Credit Card':
                newMethod = { ...newMethod, provider: 'New Card', last4: '', name: '', expiry: '', cvv: '', icon: CreditCard };
                break;
            case 'Bank Account':
                newMethod = { ...newMethod, provider: 'New Bank', iban: '', bic: '', expiry: '', name: '', icon: Landmark };
                break;
            case 'PayPal':
                newMethod = { ...newMethod, provider: 'PayPal', email: '', icon: Shield };
                break;
            case 'Klarna':
                newMethod = { ...newMethod, provider: 'Klarna', status: 'Pending', icon: Zap };
                break;
            case 'Revolut':
                newMethod = { ...newMethod, provider: 'Revolut', email: '', icon: Shield };
                break;
            case 'Cash':
                newMethod = { ...newMethod, provider: 'Physical Cash', status: 'Active', icon: Coins };
                break;
            default:
                newMethod = { ...newMethod, provider: 'New Method', last4: '----', icon: Landmark };
        }

        setPaymentMethods([...paymentMethods, newMethod]);
        setEditingPaymentId(newId); // Immediately enter edit mode for the new method
    };

    const [userInfo, setUserInfo] = useState({
        firstName: 'Alex',
        lastName: 'Passenger',
        address: '123 Cyber Drive',
        zipCode: '10115',
        city: 'Berlin',
        email: 'alex.p@uplink.net',
        phone: '+49 151 2345678'
    });

    const [rideHistory, setRideHistory] = useState([]);
    const [favoriteDrivers, setFavoriteDrivers] = useState([]);

    const memberSince = React.useMemo(() => {
        const isDemoUser = user?.isDemo;
        if (isDemoUser) return "JAN '24";
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
    }, [user]);

    useEffect(() => {
        const isDemoUser = user?.isDemo;
        const emailKey = user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'default';

        if (user) {
            const nameParts = (user.name || '').split(' ');
            setUserInfo({
                firstName: nameParts[0] || 'Member',
                lastName: nameParts.slice(1).join(' ') || '',
                address: user.address || '',
                zipCode: user.zip || '',
                city: user.city || '',
                email: user.email || '',
                phone: user.phone || '',
                age: user.age || ''
            });
        }

        if (isDemoUser) {
            setFavoriteDrivers([
                { name: "Sergei K.", rating: 5.0, trips: 124, vehicle: "Tesla Model S - Black", status: "Available", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sergei" },
                { name: "Elena R.", rating: 4.9, trips: 89, vehicle: "Mercedes EQE", status: "In Ride", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena" },
                { name: "Marcus V.", rating: 5.0, trips: 256, vehicle: "Audi e-tron GT", status: "Available", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus" }
            ]);
            setPaymentMethods([
                { id: 1, type: 'Credit Card', provider: 'Mastercard', last4: '4242 4242 4242 4242', icon: CreditCard, name: 'Alex Passenger', expiry: '12/26', cvv: '123', status: 'Active' },
                { id: 2, type: 'Bank Account', provider: 'Deutsche Bank', iban: 'DE91 1007 0000 1234 5678 90', bic: 'DEUTDEBB', expiry: '01/30', name: 'Alex Passenger', status: 'Active', icon: Landmark },
                { id: 3, type: 'Digital Wallet', provider: 'PayPal', email: 'alex.p@uplink.net', icon: Shield, status: 'Active' },
                { id: 4, type: 'Cash', provider: 'Physical Cash', status: 'Always Active', icon: Coins },
            ]);
            setWalletStats({
                totalPaid: 1240.50,
                totalSaved: 312.20
            });
        } else {
            try {
                const storedFavs = localStorage.getItem(`green_favorite_drivers_${emailKey}`);
                if (storedFavs) {
                    setFavoriteDrivers(JSON.parse(storedFavs));
                } else {
                    setFavoriteDrivers([]);
                }
            } catch (e) {
                setFavoriteDrivers([]);
            }
            setPaymentMethods([
                { id: 4, type: 'Cash', provider: 'Physical Cash', status: 'Always Active', icon: Coins }
            ]);
            setWalletStats({
                totalPaid: 0.00,
                totalSaved: 0.00
            });
        }

        try {
            const data = localStorage.getItem(`green_ride_history_${emailKey}`);
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed.length > 0) {
                    setRideHistory(parsed);
                    return;
                }
            }
        } catch (e) {
            console.error(e);
        }

        if (isDemoUser) {
            setRideHistory([
                { id: 1, date: 'Today, 18:42', destination: 'Cyber Terrace 42', driver: 'Sergei K.', service: 'CyberDispatch', price: '€ 14.20', icon: Zap },
                { id: 2, date: 'Yesterday, 21:15', destination: 'Neo Tokyo Central', driver: 'Elena R.', service: 'Premium Ride', price: '€ 22.50', icon: Shield },
                { id: 3, date: '14 Feb, 09:30', destination: 'Uplink Tower', driver: 'Marcus V.', service: 'Classic', price: '€ 8.90', icon: Clock }
            ]);
        } else {
            setRideHistory([]);
        }
    }, [user]);

    const removeDriver = (name) => {
        setFavoriteDrivers(prev => {
            const updated = prev.filter(d => d.name !== name);
            const emailKey = user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'default';
            localStorage.setItem(`green_favorite_drivers_${emailKey}`, JSON.stringify(updated));
            return updated;
        });
    };

    const addDriverFromHistory = () => {
        const pool = [
            { name: "Sergei K.", rating: 5.0, trips: 124, vehicle: "Tesla Model S - Black", status: "Available", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sergei" },
            { name: "Elena R.", rating: 4.9, trips: 89, vehicle: "Mercedes EQE", status: "In Ride", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena" },
            { name: "Marcus V.", rating: 5.0, trips: 256, vehicle: "Audi e-tron GT", status: "Available", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus" }
        ];
        
        const currentNames = favoriteDrivers.map(d => d.name);
        const candidates = pool.filter(d => !currentNames.includes(d.name));
        
        if (candidates.length > 0) {
            setFavoriteDrivers(prev => {
                const updated = [...prev, candidates[0]];
                const emailKey = user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'default';
                localStorage.setItem(`green_favorite_drivers_${emailKey}`, JSON.stringify(updated));
                return updated;
            });
        } else {
            alert("All drivers from history are already in your favorites list!");
        }
    };

    // Mock distance for sharing trigger
    const distanceToNearestOrder = 0.8;

    const navItems = [
        { id: 'greenride', icon: Search, label: 'GreenRide' },
        { id: 'shop', icon: ShoppingBag, label: 'GrienShop' },
        { id: 'sharing', icon: Share2, label: 'GreenS' },
    ];

    const { isFTDOnly, setIsFTDOnly } = useRide();

    const safeNotch = isNaN(notchAdjustment) ? 0 : notchAdjustment;
    const safeTopStyle = useSafeArea ? `calc(var(--safe-top, 0px) + ${safeNotch}px)` : `${safeNotch}px`;
    const safeHeightStyle = useSafeArea ? `calc(100% - (var(--safe-top, 0px) + ${safeNotch}px))` : `calc(100% - ${safeNotch}px)`;

    return (
        <div 
            className="absolute left-0 right-0 bottom-0 overflow-hidden font-sans text-[var(--text-primary)] flex flex-col bg-[var(--bg-primary)] transition-all duration-300"
            style={{
                top: safeTopStyle,
                height: safeHeightStyle,
                minHeight: '100%'
            }}
        >
            {/* Account Deletion Protocol Grace Period Lockdown Screen */}
            <AnimatePresence>
                {deletionProtocolActive && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 text-left"
                    >
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)]" />
                        
                        <div className="max-w-md w-full bg-[#0D1421] border border-red-500/30 rounded-[3rem] p-8 md:p-10 space-y-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute -top-16 -right-16 w-48 h-48 bg-red-500/10 blur-[60px] rounded-full" />
                            
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 animate-pulse">
                                    <Trash2 size={40} className="fill-red-500/10" />
                                </div>
                                
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">Deletion <span className="text-red-500">Active</span></h1>
                                    <p className="text-red-500/80 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] italic">Account Scheduled for Destruction</p>
                                </div>
                            </div>

                            <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-[2rem] space-y-4">
                                <div className="flex items-center gap-2 text-red-500">
                                    <Shield size={16} />
                                    <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-wider">GDPR (DSGVO) Security Protocol</span>
                                </div>
                                <p className="text-[10px] md:text-xs lg:text-sm text-gray-400 font-bold uppercase tracking-wide leading-relaxed">
                                    Your account is scheduled for permanent deactivation and deletion. To comply with GDPR guidelines, all data is retained in a secure, encrypted quarantine for a **15-day grace period**. 
                                </p>
                                <p className="text-[10px] md:text-xs lg:text-sm text-gray-300 font-black uppercase tracking-wide leading-relaxed">
                                    If you change your mind, you can cancel this deletion now. If not, your account, payment credentials, trips, tickets, and active ledgers will be permanently and irreversibly destroyed on:
                                </p>
                                <div className="p-4 bg-black/40 rounded-xl border border-red-500/10 flex items-center justify-between">
                                    <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Permanent Deletion Date:</span>
                                    <span className="text-xs md:text-sm lg:text-base font-black text-red-500 italic uppercase">
                                        {deletionDeadline ? new Date(deletionDeadline).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Pending'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button 
                                    onClick={handleCancelDeletion}
                                    className="w-full py-5 bg-brand text-dark-950 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-2xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={16} /> Cancel Deletion & Restore
                                </button>
                                
                                <button 
                                    onClick={() => performCompleteDataWipe(user?.email?.toLowerCase())}
                                    className="w-full py-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-red-500 hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Zap size={16} /> Simulate 15 Days Passed (Wipe Now)
                                </button>
                            </div>
                            
                            <p className="text-center text-[7px] font-black text-gray-700 uppercase tracking-[0.4em]">GDPR Purge Daemon • Active</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        alert('File selected: ' + e.target.files[0].name + ' (Simulated Upload)');
                    }
                }}
            />

            {/* Background Atmosphere & Radar - Fixed Stack */}
            <div className="absolute inset-0 z-0">
                {!activeSheet && (
                    <>
                        <Bubbles />
                        <Radar hasUpdates={hasUpdates} />
                    </>
                )}
            </div>

            {/* UI Overlay - Top Column */}
            <header 
                className="relative z-20 px-8 pb-8 flex justify-between items-start"
                style={{
                    paddingTop: `calc(${useSafeArea ? 'env(safe-area-inset-top, 0px)' : '0px'} + ${notchAdjustment}px + 1.25rem)`
                }}
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setActiveSheet('profile')}
                        className="w-14 h-14 rounded-2xl border-2 border-[var(--accent-primary)] flex flex-col items-center justify-center p-0 overflow-hidden shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                        <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Alex'}`} alt="Profile" className="w-full h-full object-cover relative z-10" />
                    </button>

                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter text-[var(--text-primary)] uppercase">
                            {user?.name ? user.name.split(' ')[0] : userInfo.firstName}
                        </h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 relative z-50">
                    {/* Notch / Header Height Fit Controller */}
                    <button 
                        onClick={() => setIsNotchPanelOpen(!isNotchPanelOpen)}
                        className={`w-12 h-12 rounded-2xl bg-[var(--bg-secondary)] border flex items-center justify-center relative shadow-lg hover:scale-105 active:scale-95 transition-all ${notchAdjustment > 0 || useSafeArea ? 'border-brand/40 text-brand shadow-[0_0_15px_rgba(52,211,153,0.1)]' : 'border-[var(--border-main)] text-[var(--accent-primary)]'}`}
                        title="Notch & Safe Area Alignment"
                    >
                        <Smartphone size={20} className={notchAdjustment > 0 ? 'text-brand animate-pulse' : ''} />
                    </button>

                    {/* Inbox / Messages Button */}
                    <button
                        onClick={() => navigate('/messages')}
                        className="w-12 h-12 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-main)] flex items-center justify-center relative shadow-lg hover:scale-105 active:scale-95 transition-all text-[var(--accent-primary)]"
                    >
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand rounded-full border-2 border-[var(--bg-primary)] z-20 shadow-md animate-pulse" style={{ backgroundColor: 'var(--brand)' }} />
                        <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
                    </button>

                    {/* Language Switcher */}
                    <button
                        onClick={() => setActiveSheet('posts')}
                        className="w-12 h-12 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-main)] flex items-center justify-center relative shadow-lg hover:scale-105 active:scale-95 transition-all text-[var(--accent-primary)]"
                    >
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--accent-primary)] rounded-full border-2 border-[var(--bg-primary)] z-20 shadow-md" />
                        <Globe size={20} className="group-hover:rotate-12 transition-transform" />
                    </button>

                    {/* Notch Panel Dropdown - anchored to right edge of button group to prevent left cutoff */}
                    <AnimatePresence>
                        {isNotchPanelOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 w-72 bg-[#0B121E]/95 backdrop-blur-2xl border border-brand/20 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                                style={{ zIndex: 9999, top: 'calc(100% + 12px)' }}
                            >
                                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Smartphone size={14} className="text-brand" />
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-brand">Notch & Safe-Fit</span>
                                    </div>
                                    <button onClick={() => setIsNotchPanelOpen(false)} className="text-secondary hover:text-primary">
                                        <X size={14} />
                                    </button>
                                </div>
                                
                                <div className="space-y-4 text-left">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-secondary">Auto Safe Area</span>
                                        <button 
                                            onClick={() => setUseSafeArea(!useSafeArea)}
                                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${useSafeArea ? 'bg-brand' : 'bg-white/10'}`}
                                        >
                                            <div className={`w-4 h-4 bg-dark-950 rounded-full transition-transform ${useSafeArea ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-secondary">Custom Offset</span>
                                            <span className="text-xs md:text-sm lg:text-base font-black text-brand italic">{notchAdjustment}px</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => setNotchAdjustment(Math.max(0, notchAdjustment - 2))}
                                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-primary font-black"
                                            >
                                                -
                                            </button>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="60" 
                                                value={notchAdjustment}
                                                onChange={(e) => setNotchAdjustment(parseInt(e.target.value, 10))}
                                                className="flex-1 accent-brand h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <button 
                                                onClick={() => setNotchAdjustment(Math.min(60, notchAdjustment + 2))}
                                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-primary font-black"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2 pt-2">
                                        <button 
                                            onClick={() => setNotchAdjustment(0)}
                                            className={`py-1.5 rounded-lg border text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-wider transition-all ${notchAdjustment === 0 ? 'bg-brand/10 border-brand text-brand' : 'bg-white/5 border-white/5 text-secondary hover:text-primary'}`}
                                        >
                                            0px
                                            <span className="block text-[6px] opacity-40">Desktop</span>
                                        </button>
                                        <button 
                                            onClick={() => setNotchAdjustment(20)}
                                            className={`py-1.5 rounded-lg border text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-wider transition-all ${notchAdjustment === 20 ? 'bg-brand/10 border-brand text-brand' : 'bg-white/5 border-white/5 text-secondary hover:text-primary'}`}
                                        >
                                            20px
                                            <span className="block text-[6px] opacity-40">Compact</span>
                                        </button>
                                        <button 
                                            onClick={() => setNotchAdjustment(44)}
                                            className={`py-1.5 rounded-lg border text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-wider transition-all ${notchAdjustment === 44 ? 'bg-brand/10 border-brand text-brand' : 'bg-white/5 border-white/5 text-secondary hover:text-primary'}`}
                                        >
                                            44px
                                            <span className="block text-[6px] opacity-40">Sim Notch</span>
                                        </button>
                                    </div>
                                    
                                    <p className="text-[7px] text-gray-500 leading-normal uppercase tracking-wider">
                                        Fits UI automatically to notches, status bars, and custom cases. Live syncing active.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Simulated Matching Overlay */}
            {isSearchingMatch && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500"
                    style={{ background: 'rgba(11,14,17,0.88)', backdropFilter: 'blur(20px)' }}>
                    <div className="relative w-32 h-32 mb-8">
                        <div className="absolute inset-0 rounded-full" style={{ border: '4px solid var(--glass-border)' }} />
                        <div className="absolute inset-0 rounded-full border-t-transparent animate-spin" style={{ border: '4px solid var(--accent-primary)' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Zap size={40} style={{ color: 'var(--accent-primary)' }} />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white mb-2">Analyzing Grid</h2>
                    <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.4em] opacity-80" style={{ color: 'var(--accent-primary)' }}>Locating 1km Range Matches...</p>
                </div>
            )}


            {/* Main Action Area */}
            <main className="flex-1 relative z-10 pointer-events-none" />


            <div className="fixed safe-bottom-inset left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm">
                <nav className="backdrop-blur-3xl px-10 py-5 flex justify-between items-center rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] border-2"
                    style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)', backdropFilter: 'blur(40px)' }}>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'sharing') {
                                    navigate('/greens');
                                } else if (item.id === 'shop') {
                                    navigate('/shop');
                                } else if (item.id === 'greenride') {
                                    navigate('/green-ride');
                                } else {
                                    setActiveSheet(item.id);
                                }
                            }}
                            className="relative flex flex-col items-center gap-1.5 transition-all group"
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeSheet === item.id ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] scale-110 shadow-lg' : 'text-[var(--text-primary)] opacity-70 hover:opacity-100 hover:bg-[var(--text-primary)]/5'}`}>
                                <item.icon size={22} strokeWidth={2.5} />
                            </div>
                            <span className={`text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.2em] italic transition-all ${activeSheet === item.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)] opacity-60'}`}>{item.label}</span>
                            {activeSheet === item.id && (
                                <motion.div layoutId="nav-glow" className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-[var(--text-primary)] shadow-[0_0_10px_var(--text-primary)]" />
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Bottom Sheets Positioning */}

            <PostsFeed isOpen={activeSheet === 'posts'} onClose={() => setActiveSheet(null)} />

            <Sheet isOpen={activeSheet === 'sharing'} onClose={() => setActiveSheet(null)} className="rounded-t-[3rem]">
                <div className="space-y-6 pb-8">
                    <h3 className="text-xl font-black italic tracking-tighter uppercase" style={{ color: 'var(--accent-primary)' }}>Mission Sharing</h3>
                    {distanceToNearestOrder < 1 ? (
                        <div className="rounded-[2rem] p-8 text-center space-y-4" style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--accent-primary)' }}>
                            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-black text-white shadow-xl">
                                <Share2 size={24} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black italic tracking-tighter">JOIN & SAVE 20%</h4>
                                <p className="text-xs md:text-sm lg:text-base text-gray-400 mt-2 font-bold uppercase tracking-widest">Neighboring ride detected at {distanceToNearestOrder}km</p>
                            </div>
                            <button className="w-full py-4 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-black uppercase tracking-widest text-sm italic shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all border border-[var(--border-main)]"
                                style={{ borderColor: 'var(--border-main)' }}>Connect View</button>
                        </div>
                    ) : (
                        <div className="rounded-[2rem] p-8 text-center text-gray-500" style={{ background: 'var(--bg-secondary)' }}>
                            <p className="font-black uppercase tracking-widest text-xs md:text-sm lg:text-base">No neighbors detected in range</p>
                        </div>
                    )}
                </div>
            </Sheet>

            <Sheet isOpen={activeSheet === 'profile'} onClose={() => { setActiveSheet(null); setProfileSubView(null); setHelpSubView(null); setServiceDetailView(null); setIsEditingProfile(false); setEditingPaymentId(null); }} className="rounded-t-[3rem]">
                <div className="space-y-6 pb-12 px-2 overflow-y-auto max-h-[85vh]">
                    {!profileSubView ? (
                        <>
                            {/* Profile Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-3xl p-1 shadow-xl relative group overflow-hidden"
                                        style={{ background: 'var(--accent-primary)', boxShadow: '0 0 24px var(--accent-primary-glow)' }}>
                                        <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Alex'}`} alt="Me" className="w-full h-full rounded-2xl transition-transform group-hover:scale-110" style={{ background: 'var(--bg-secondary)' }} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic tracking-tighter uppercase">{userInfo.firstName} <span className="text-[10px] md:text-xs lg:text-sm ml-2 opacity-50 font-bold tracking-widest leading-none align-middle border border-white/10 px-2 py-0.5 rounded-md">#{user?.id || '482X'}</span></h3>
                                        <div className="flex items-center gap-2">
                                            <p className="font-black uppercase tracking-[0.2em] text-[10px] md:text-xs lg:text-sm italic" style={{ color: 'var(--accent-primary)' }}>{t('premiumStatus')}</p>
                                            <div className="w-1 h-1 rounded-full bg-[var(--accent-primary)]" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ThemeToggle />
                                    <button 
                                        onClick={() => {
                                            setActiveSheet(null);
                                            setProfileSubView(null);
                                            setHelpSubView(null);
                                            setServiceDetailView(null);
                                            setIsEditingProfile(false);
                                            setEditingPaymentId(null);
                                        }}
                                        className="w-10 h-10 rounded-2xl bg-[var(--bg-btn-sec)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* View Personal Hub button hidden as requested */}

                            {/* Wallet Section */}
                            <button 
                                onClick={() => navigate('/payment/methods')}
                                className="w-full text-left rounded-[2rem] p-6 relative overflow-hidden group transition-all hover:scale-[1.02] active:scale-[0.98] border border-[var(--border-main)] bg-[var(--bg-secondary)]"
                                style={{ boxShadow: '0 8px 30px rgba(var(--accent-primary-rgb), 0.05)' }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-2xl group-hover:rotate-12 transition-transform bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-main)]">
                                            <Wallet size={24} />
                                        </div>
                                        <h4 className="text-xl font-black italic tracking-tighter text-[var(--text-primary)] uppercase">{t('bankHub')}</h4>
                                    </div>
                                </div>
                            </button>

                            {/* Menu Options Grid */}
                            <div className="space-y-3">
                                <button onClick={() => setProfileSubView('language')} className="w-full p-5 rounded-2xl flex items-center justify-between group transition-all" style={{ background: 'var(--bg-btn-sec)', border: '1px solid var(--border-main)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-main)'}>
                                    <div className="flex items-center gap-4">
                                        <Globe size={20} className="group-hover:scale-110 transition-transform" style={{ color: 'var(--accent-primary)' }} />
                                        <span className="font-black italic tracking-tight uppercase text-base text-[var(--text-primary)]">{t('languagePreferences')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black text-gray-500 uppercase">{lang}</span>
                                        <ChevronRight size={18} className="text-gray-600 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                                <button onClick={() => setProfileSubView('favorites')} className="w-full p-5 rounded-2xl flex items-center justify-between group transition-all" style={{ background: 'var(--bg-btn-sec)', border: '1px solid var(--border-main)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-main)'}>
                                    <div className="flex items-center gap-4">
                                        <Heart size={20} className="group-hover:scale-110 transition-transform" style={{ color: 'var(--danger)' }} />
                                        <span className="font-black italic tracking-tight uppercase text-base text-[var(--text-primary)]">{t('favoriteDrivers')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[7px] font-black bg-danger/10 text-danger px-2 py-0.5 rounded-full uppercase">{favoriteDrivers.length} {t('saved')}</span>
                                        <ChevronRight size={18} className="text-gray-600 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>

                                <button onClick={() => navigate('/ride/history')} className="w-full p-5 rounded-2xl flex items-center justify-between group transition-all" style={{ background: 'var(--bg-btn-sec)', border: '1px solid var(--border-main)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-main)'}>
                                    <div className="flex items-center gap-4">
                                        <Clock size={20} className="group-hover:scale-110 transition-transform" style={{ color: 'var(--accent-primary)' }} />
                                        <span className="font-black italic tracking-tight uppercase text-base text-[var(--text-primary)]">{t('rideHistory')}</span>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-600 group-hover:translate-x-1 transition-transform" />
                                </button>

                                <button onClick={() => navigate('/account/settings')} className="w-full p-5 rounded-2xl flex items-center justify-between group transition-all" style={{ background: 'var(--bg-btn-sec)', border: '1px solid var(--border-main)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-main)'}>
                                    <div className="flex items-center gap-4">
                                        <Lock size={20} className="group-hover:scale-110 transition-transform" style={{ color: 'var(--accent-primary)' }} />
                                        <span className="font-black italic tracking-tight uppercase text-base text-[var(--text-primary)]">{t('accountSecurity')}</span>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-600 group-hover:translate-x-1 transition-transform" />
                                </button>

                                <button onClick={() => navigate('/family-hub')} className="w-full p-5 rounded-2xl flex items-center justify-between group transition-all" style={{ background: 'var(--bg-btn-sec)', border: '1px solid var(--border-main)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-main)'}>
                                    <div className="flex items-center gap-4">
                                        <Users size={20} className="group-hover:scale-110 transition-transform" style={{ color: 'var(--brand)' }} />
                                        <span className="font-black italic tracking-tight uppercase text-base text-[var(--text-primary)]">{t('familyHub')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[7px] font-black bg-brand/10 text-brand px-2 py-0.5 rounded-full uppercase">{t('parentPortal')}</span>
                                        <ChevronRight size={18} className="text-gray-600 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>

                                <button onClick={() => { setProfileSubView('help'); setHelpSubView(null); }} className="w-full p-5 rounded-2xl flex items-center justify-between group transition-all" style={{ background: 'var(--bg-btn-sec)', border: '1px solid var(--border-main)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-main)'}>
                                    <div className="flex items-center gap-4">
                                        <LifeBuoy size={20} className="group-hover:scale-110 transition-transform" style={{ color: 'var(--accent-primary)' }} />
                                        <span className="font-black italic tracking-tight uppercase text-base text-[var(--text-primary)]">{t('helpSupport')}</span>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-600 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                            {/* Secondary Actions */}
                            <div className="pt-4 space-y-4">
                                <button onClick={() => { logout(); navigate("/"); }} className="w-full p-5 bg-red-500/5 border border-red-500/20 text-red-500 font-black uppercase tracking-widest rounded-2xl flex items-center justify-between hover:bg-red-500/10 transition-all group">
                                    {t('logout')}
                                    <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>

                            </div>
                        </>
                    ) : profileSubView === 'language' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-4 mb-2">
                                <button
                                    onClick={() => setProfileSubView(null)}
                                    className="p-2 rounded-xl hover:scale-110 transition-all"
                                    style={{ background: 'var(--bg-secondary)', color: 'var(--brand)' }}
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h3 className="text-xl font-black italic tracking-tighter uppercase" style={{ color: 'var(--brand)' }}>{t('languageHub')}</h3>
                            </div>

                            <div className="relative mb-4">
                                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" />
                                <input 
                                    type="text"
                                    placeholder="Search global language..."
                                    value={langSearch}
                                    onChange={(e) => setLangSearch(e.target.value)}
                                    className="w-full bg-dark-900 border border-white/5 rounded-3xl p-5 pl-14 text-sm font-black uppercase tracking-widest focus:border-brand/40 outline-none"
                                />
                            </div>

                            <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
                                {filteredLangs.map(l => (
                                    <button
                                        key={l.code}
                                        onClick={() => {
                                            setLang(l.code);
                                            setProfileSubView(null);
                                        }}
                                        className={`w-full p-6 rounded-[2.5rem] flex items-center justify-between transition-all ${lang === l.code ? 'bg-brand/10 border-brand shadow-[0_0_20px_var(--brand-glow)]' : 'bg-[var(--bg-secondary)] border-[var(--border-main)] hover:border-brand/30'}`}
                                        style={{ border: '1px solid' }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black uppercase text-xs md:text-sm lg:text-base ${lang === l.code ? 'bg-brand text-dark-900' : 'bg-[var(--bg-secondary)] text-gray-500'}`}>
                                                {l.code}
                                            </div>
                                            <div className="text-left">
                                                <p className={`text-base font-black italic uppercase ${lang === l.code ? 'text-white' : 'text-gray-400'}`}>{l.name}</p>
                                                <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-gray-600">{l.native}</p>
                                            </div>
                                        </div>
                                        {lang === l.code && <CheckCircle size={20} className="text-brand" />}
                                    </button>
                                ))}
                                {filteredLangs.length === 0 && (
                                    <div className="py-12 text-center opacity-30 uppercase font-black tracking-widest text-[10px] md:text-xs lg:text-sm">No languages match your search</div>
                                )}
                            </div>
                        </div>
                    ) : profileSubView === 'history' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Ride History Header */}
                            <div className="flex items-center gap-4 mb-2">
                                <button
                                    onClick={() => setProfileSubView(null)}
                                    className="p-2 rounded-xl hover:scale-110 transition-all"
                                    style={{ background: 'var(--bg-secondary)', color: 'var(--brand)' }}
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h3 className="text-xl font-black italic tracking-tighter uppercase" style={{ color: 'var(--brand)' }}>Ride History</h3>
                            </div>

                             {/* Service Highlights */}
                             <div className="grid grid-cols-2 gap-4 pt-4">
                                 <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-[2rem] relative shadow-xl">
                                     <div className="absolute -top-3 left-6 px-3 py-1 bg-brand text-black rounded-full text-[7px] font-black uppercase tracking-[0.2em] shadow-lg">Fleet Stats ⚡</div>
                                     <p className="text-2xl font-black italic text-white text-center leading-none mt-2">{rideHistory.length}</p>
                                     <p className="text-[7px] uppercase font-black tracking-widest text-gray-500 text-center mt-2">Total Trips</p>
                                 </div>
                                 <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-[2rem] relative shadow-xl">
                                      <div className="absolute -top-3 left-6 px-3 py-1 bg-brand text-black rounded-full text-[7px] font-black uppercase tracking-[0.2em] shadow-lg">Network Tier 💎</div>
                                      <p className="text-2xl font-black italic text-white text-center leading-none mt-2">{memberSince}</p>
                                      <p className="text-[7px] uppercase font-black tracking-widest text-gray-500 text-center mt-2">Member Since</p>
                                  </div>
                             </div>

                            {/* History List */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] md:text-xs lg:text-sm text-gray-500 font-black uppercase tracking-[0.3em] px-2 italic">Past Services</h4>
                                <div className="space-y-3">
                                    {rideHistory.map(ride => (
                                        <div key={ride.id} className="p-5 rounded-3xl group transition-all" style={{ background: '#131820', border: '1px solid rgba(255,255,255,0.05)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-xl" style={{ background: '#1A2235', color: 'var(--brand)' }}>
                                                        <RenderIcon icon={ride.icon} size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand">{ride.service}</p>
                                                        <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-500 uppercase font-black">{ride.date}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-black italic text-[var(--text-primary)]">{ride.price}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={12} className="text-gray-600" />
                                                    <p className="text-xs md:text-sm lg:text-base font-black italic text-gray-300">{ride.destination}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <User size={12} className="text-gray-600" />
                                                    <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500">Driver: {ride.driver}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : profileSubView === 'favorites' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-12">
                            {/* Favorites Header */}
                            <div className="flex items-center gap-4 mb-2">
                                <button
                                    onClick={() => setProfileSubView(null)}
                                    className="p-2 rounded-xl hover:scale-110 transition-all"
                                    style={{ background: '#1A2235', color: 'var(--danger)' }}
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h3 className="text-xl font-black italic tracking-tighter uppercase text-[var(--text-primary)]">Favorite <span className="text-danger">Drivers</span></h3>
                            </div>

                            {/* Driver List */}
                            <div className="space-y-4">
                                {favoriteDrivers.map((driver, i) => (
                                    <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-main)] p-5 rounded-[2.5rem] group hover:border-danger/20 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/5 group-hover:border-danger/30 transition-all">
                                                    <img src={driver.img} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <h5 className="text-lg font-black italic text-[var(--text-primary)] tracking-tight uppercase leading-none">{driver.name}</h5>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Star size={10} className="text-amber-400 fill-amber-400" />
                                                        <span className="text-[10px] md:text-xs lg:text-sm font-black text-amber-400">{driver.rating}</span>
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs text-gray-500 font-bold ml-1 uppercase">{driver.trips} Trips</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`px-3 py-1 rounded-full text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest ${driver.status === 'Available' ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                                                    {driver.status}
                                                </div>
                                                <button
                                                    onClick={() => removeDriver(driver.name)}
                                                    className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-505/20 hover:bg-red-500 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                                                    title="Remove Driver"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5 group-hover:border-danger/10 transition-all">
                                            <div>
                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-gray-500 tracking-widest">Active Asset</p>
                                                <p className="text-[10px] md:text-xs lg:text-sm font-black italic text-gray-300 uppercase">{driver.vehicle}</p>
                                            </div>
                                            <button className="p-3 bg-danger text-white rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg shadow-danger/20">
                                                <Zap size={16} className="fill-white" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={addDriverFromHistory}
                                className="w-full py-5 border border-dashed border-[var(--border-main)] text-[var(--text-secondary)] font-black uppercase tracking-widest text-[10px] md:text-xs lg:text-sm rounded-[2rem] hover:border-danger/30 hover:text-danger transition-all cursor-pointer"
                            >
                                + Add New Favorite from History
                            </button>
                        </div>
                    ) : (profileSubView === 'perks' && user?.isDemo) ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-12">
                            {/* Perks Header */}
                            <div className="flex items-center gap-4 mb-2">
                                <button
                                    onClick={() => setProfileSubView(null)}
                                    className="p-2 rounded-xl hover:scale-110 transition-all"
                                    style={{ background: '#1A2235', color: 'var(--amber-400)' }}
                                >
                                    <ArrowLeft size={20} className="text-amber-400" />
                                </button>
                                <h3 className="text-xl font-black italic tracking-tighter uppercase text-amber-400">Founder Pioneer Perks</h3>
                            </div>

                            {/* Status Card */}
                            <div className="bg-amber-400/10 border border-amber-400/20 rounded-[2rem] p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 blur-[50px] rounded-full" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                                        <Star size={24} className="fill-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-amber-400">Green 10k Member</p>
                                        <h4 className="text-xl font-black italic tracking-tighter">Unlimited Partner Access</h4>
                                    </div>
                                </div>
                            </div>

                            {/* Offers List */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] md:text-xs lg:text-sm text-gray-500 font-black uppercase tracking-[0.3em] px-2 italic">Active Founder Offers</h4>
                                <div className="space-y-3">
                                    {[
                                        { shop: 'Grand Luxury Hotel & Spa', offer: 'FREE SPA ACCESS & LATE CHECKOUT', icon: BedDouble, category: 'Luxury Hotel', color: 'text-emerald-400' },
                                        { shop: 'Green Stadium Arena', offer: 'FREE VIP TICKET UPGRADE', icon: Trophy, category: 'Stadium VIP', color: 'text-amber-400' }
                                    ].map((perk, i) => (
                                        <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-main)] p-5 rounded-3xl group hover:border-amber-400/20 transition-all relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 bg-white/5 rounded-2xl ${perk.color}`}>
                                                        <perk.icon size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">{perk.category}</p>
                                                        <h5 className="text-sm font-black italic tracking-tight text-white uppercase">{perk.shop}</h5>
                                                    </div>
                                                </div>
                                                <div className="bg-amber-400/10 text-amber-400 text-[8px] md:text-[10px] lg:text-xs font-black px-2 py-1 rounded-lg border border-amber-400/20 uppercase">Active</div>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                                <p className="text-[11px] md:text-sm lg:text-base font-black italic tracking-widest text-amber-400">{perk.offer}</p>
                                                <button className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-white/40 hover:text-white transition-colors">Details →</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] text-center">
                                <p className="text-[10px] md:text-xs lg:text-sm text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                                    New offers are added every week. Show your <span className="text-amber-400">Founder Star</span> at any partner location to redeem.
                                </p>
                            </div>
                        </div>
                    ) : profileSubView === 'payments' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Payments Header */}
                            <div className="flex items-center gap-4 mb-2">
                                <button
                                    onClick={() => setProfileSubView(null)}
                                    className="p-2 bg-[var(--bg-secondary)] rounded-xl text-brand hover:scale-110 transition-all"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h3 className="text-xl font-black italic tracking-tighter uppercase text-brand">Payment Methods</h3>
                            </div>

                            {/* Payment Channel Status */}
                            <div className="bg-dark-900 border border-white/5 p-8 rounded-[2rem] space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand">Secure Channel</p>
                                        <h4 className="text-2xl font-black italic tracking-tighter text-white">BANK VERIFIED</h4>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand border border-brand/20">
                                        <ShieldCheck size={24} />
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-brand" />
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-gray-400">Encrypted Flow Active</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Landmark size={14} className="text-brand" />
                                        <span className="text-xs md:text-sm lg:text-base font-black italic">DE91 •••• 5678</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Methods List */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] md:text-xs lg:text-sm text-gray-500 font-black uppercase tracking-[0.3em] px-2 italic">Active Channels</h4>
                                <div className="space-y-3">
                                    {paymentMethods.map(method => (
                                        <div key={method.id} className="bg-[var(--bg-secondary)] border border-[var(--border-main)] p-5 rounded-3xl flex flex-col gap-4 group hover:border-brand/20 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-[var(--bg-secondary)] rounded-2xl text-brand group-hover:scale-110 transition-transform">
                                                        <method.icon size={20} />
                                                    </div>
                                                    {editingPaymentId === method.id ? (
                                                        <div>
                                                            <div className="space-y-3 mt-4">
                                                                <div className="bg-[var(--bg-primary)] p-4 rounded-2xl space-y-3 border border-[var(--border-main)]">
                                                                    <div className="space-y-1">
                                                                        <p className="text-[8px] md:text-[10px] lg:text-xs text-brand/60 uppercase font-black tracking-widest">Account Holder Name</p>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Full Name"
                                                                            value={method.name || ''}
                                                                            onChange={(e) => {
                                                                                const updated = paymentMethods.map(m => m.id === method.id ? { ...m, name: e.target.value } : m);
                                                                                setPaymentMethods(updated);
                                                                            }}
                                                                            className="bg-transparent border-none p-0 text-sm font-black italic text-white focus:ring-0 w-full"
                                                                        />
                                                                    </div>
                                                                    {method.type === 'Credit Card' ? (
                                                                        <div className="space-y-3">
                                                                            <div className="space-y-1">
                                                                                <p className="text-[8px] md:text-[10px] lg:text-xs text-brand/60 uppercase font-black tracking-widest">Card Number</p>
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="0000 0000 0000 0000"
                                                                                    value={method.last4 || ''}
                                                                                    onChange={(e) => {
                                                                                        const updated = paymentMethods.map(m => m.id === method.id ? { ...m, last4: e.target.value } : m);
                                                                                        setPaymentMethods(updated);
                                                                                    }}
                                                                                    className="bg-transparent border-none p-0 text-sm font-black italic text-white focus:ring-0 w-full"
                                                                                />
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div className="space-y-1">
                                                                                    <p className="text-[8px] md:text-[10px] lg:text-xs text-brand/60 uppercase font-black tracking-widest">Expiry Date</p>
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="MM/YY"
                                                                                        value={method.expiry || ''}
                                                                                        onChange={(e) => {
                                                                                            const updated = paymentMethods.map(m => m.id === method.id ? { ...m, expiry: e.target.value } : m);
                                                                                            setPaymentMethods(updated);
                                                                                        }}
                                                                                        className="bg-transparent border-none p-0 text-sm font-black italic text-white focus:ring-0 w-full"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <p className="text-[8px] md:text-[10px] lg:text-xs text-brand/60 uppercase font-black tracking-widest">CVV</p>
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="123"
                                                                                        maxLength={3}
                                                                                        value={method.cvv || ''}
                                                                                        onChange={(e) => {
                                                                                            const updated = paymentMethods.map(m => m.id === method.id ? { ...m, cvv: e.target.value } : m);
                                                                                            setPaymentMethods(updated);
                                                                                        }}
                                                                                        className="bg-transparent border-none p-0 text-sm font-black italic text-white focus:ring-0 w-full"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : method.type === 'Bank Account' ? (
                                                                        <div className="space-y-3">
                                                                            <div className="space-y-1">
                                                                                <p className="text-[8px] md:text-[10px] lg:text-xs text-brand/60 uppercase font-black tracking-widest">IBAN</p>
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="DE00 0000..."
                                                                                    value={method.iban || ''}
                                                                                    onChange={(e) => {
                                                                                        const updated = paymentMethods.map(m => m.id === method.id ? { ...m, iban: e.target.value } : m);
                                                                                        setPaymentMethods(updated);
                                                                                    }}
                                                                                    className="bg-transparent border-none p-0 text-sm font-black italic text-white focus:ring-0 w-full"
                                                                                />
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div className="space-y-1">
                                                                                    <p className="text-[8px] md:text-[10px] lg:text-xs text-brand/60 uppercase font-black tracking-widest">BIC</p>
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="AAAA BB CC"
                                                                                        value={method.bic || ''}
                                                                                        onChange={(e) => {
                                                                                            const updated = paymentMethods.map(m => m.id === method.id ? { ...m, bic: e.target.value } : m);
                                                                                            setPaymentMethods(updated);
                                                                                        }}
                                                                                        className="bg-transparent border-none p-0 text-sm font-black italic text-white focus:ring-0 w-full"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <p className="text-[8px] md:text-[10px] lg:text-xs text-brand/60 uppercase font-black tracking-widest">Expiry Date</p>
                                                                                    <input
                                                                                        type="text"
                                                                                        placeholder="MM/YYYY"
                                                                                        value={method.expiry || ''}
                                                                                        onChange={(e) => {
                                                                                            const updated = paymentMethods.map(m => m.id === method.id ? { ...m, expiry: e.target.value } : m);
                                                                                            setPaymentMethods(updated);
                                                                                        }}
                                                                                        className="bg-transparent border-none p-0 text-sm font-black italic text-white focus:ring-0 w-full"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-1">
                                                                            <p className="text-[8px] md:text-[10px] lg:text-xs text-brand/60 uppercase font-black tracking-widest">Email Address</p>
                                                                            <input
                                                                                type="email"
                                                                                value={method.email || ''}
                                                                                onChange={(e) => {
                                                                                    const updated = paymentMethods.map(m => m.id === method.id ? { ...m, email: e.target.value } : m);
                                                                                    setPaymentMethods(updated);
                                                                                }}
                                                                                className="bg-transparent border-none p-0 text-sm font-black italic text-white focus:ring-0 w-full"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="text-xs md:text-sm lg:text-base font-black italic text-white uppercase">{method.provider}</p>
                                                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500">
                                                                {method.last4 ? `Ending in •••• ${method.last4}` : method.email}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    {editingPaymentId === method.id ? (
                                                        <button
                                                            onClick={() => setEditingPaymentId(null)}
                                                            className="text-[10px] md:text-xs lg:text-sm text-brand font-black uppercase tracking-widest hover:scale-105 transition-all"
                                                        >
                                                            Save
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => setEditingPaymentId(method.id)}
                                                                className="p-2 text-gray-600 hover:text-brand transition-colors"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPaymentMethods(paymentMethods.filter(m => m.id !== method.id));
                                                                }}
                                                                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Add New Method Options */}
                            <div className="space-y-4 pt-2">
                                <h4 className="text-[10px] md:text-xs lg:text-sm text-gray-500 font-black uppercase tracking-[0.3em] px-2 italic">Add New Channel</h4>
                                <div className="grid grid-cols-2 gap-3 pb-8">
                                    <button
                                        onClick={() => handleAddPayment('Credit Card')}
                                        className="bg-dark-900 border border-white/10 p-5 rounded-3xl group hover:border-brand/30 transition-all flex flex-col items-center gap-2"
                                    >
                                        <CreditCard size={20} className="text-brand" />
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-400 font-bold group-hover:text-brand transition-colors">Card</span>
                                    </button>
                                    <button
                                        onClick={() => handleAddPayment('Bank Account')}
                                        className="bg-dark-900 border border-white/10 p-5 rounded-3xl group hover:border-brand/30 transition-all flex flex-col items-center gap-2"
                                    >
                                        <Landmark size={20} className="text-brand" />
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-400 font-bold group-hover:text-brand transition-colors">Bank</span>
                                    </button>
                                    <button
                                        onClick={() => handleAddPayment('PayPal')}
                                        className="bg-dark-900 border border-white/10 p-5 rounded-3xl group hover:border-[#0070ba]/30 transition-all flex flex-col items-center gap-2"
                                    >
                                        <div className="flex gap-1 text-[#0070ba]">
                                            <Zap size={20} className="fill-current" />
                                        </div>
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-400 font-bold group-hover:text-[#0070ba] transition-colors">PayPal</span>
                                    </button>
                                    <button
                                        onClick={() => handleAddPayment('Klarna')}
                                        className="bg-dark-900 border border-white/10 p-5 rounded-3xl group hover:border-[#ffb3c7]/30 transition-all flex flex-col items-center gap-2"
                                    >
                                        <Zap size={20} className="text-[#ffb3c7]" />
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-400 font-bold group-hover:text-[#ffb3c7] transition-colors">Klarna</span>
                                    </button>
                                    <button
                                        onClick={() => handleAddPayment('Revolut')}
                                        className="bg-dark-900 border border-white/10 p-5 rounded-3xl group hover:border-white/20 transition-all flex flex-col items-center gap-2"
                                    >
                                        <Shield size={20} className="text-white" />
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-400 font-bold group-hover:text-white transition-colors">Revolut</span>
                                    </button>
                                    <button
                                        onClick={() => handleAddPayment('Cash')}
                                        className="bg-dark-900 border border-white/10 p-5 rounded-3xl group hover:border-brand/30 transition-all flex flex-col items-center gap-2 col-span-2"
                                    >
                                        <Coins size={20} className="text-brand" />
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-400 font-bold group-hover:text-brand transition-colors">Physical Cash</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : profileSubView === 'help' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Help & Support Header */}
                            <div className="flex items-center gap-4 mb-2">
                                <button
                                    onClick={() => {
                                        if (serviceDetailView) {
                                            setServiceDetailView(null);
                                        } else if (helpSubView) {
                                            setHelpSubView(null);
                                        } else {
                                            setProfileSubView(null);
                                        }
                                    }}
                                    className="p-2 bg-[var(--bg-secondary)] rounded-xl text-brand hover:scale-110 transition-all"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h3 className="text-xl font-black italic tracking-tighter uppercase text-brand">
                                    {helpSubView === 'chat' ? 'AI Assistant' :
                                        helpSubView === 'dsgvo' ? 'Privacy Policy' :
                                        helpSubView === 'delete_account' ? 'Delete Account' :
                                            helpSubView === 'app' ? (
                                                serviceDetailView === 'trips' ? 'Premium Trips' :
                                                serviceDetailView === 'tickets' ? 'VIP Tickets' :
                                                serviceDetailView === 'rooms' ? 'Luxury Rooms' :
                                                serviceDetailView === 'order' ? 'Pre-Orders' :
                                                serviceDetailView === 'waiter' ? 'VIP Waiter' : 'Our Services'
                                            ) :
                                                helpSubView === 'email' ? 'Contact Us' : 'Help & Support'}
                                </h3>
                            </div>

                            {!helpSubView ? (
                                <>
                                    {/* Contact Channels */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] md:text-xs lg:text-sm text-gray-500 font-black uppercase tracking-[0.3em] px-2 italic">Direct Support</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => setHelpSubView('chat')} className="bg-brand/10 border border-brand/35 p-5 rounded-3xl group hover:scale-[1.02] transition-all flex flex-col items-center gap-3">
                                                <div className="p-3 bg-brand/20 rounded-2xl text-brand">
                                                    <MessageSquare size={24} />
                                                </div>
                                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest">AI Chat</span>
                                            </button>
                                            <button onClick={() => setHelpSubView('email')} className="bg-[var(--bg-secondary)] border border-[var(--border-main)] p-5 rounded-3xl group hover:scale-[1.02] transition-all flex flex-col items-center gap-3">
                                                <div className="p-3 bg-[var(--bg-secondary)] rounded-2xl text-brand">
                                                    <Mail size={24} />
                                                </div>
                                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-400">Email Us</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Legal & App Details */}
                                    <div className="space-y-4 pt-2">
                                        <h4 className="text-[10px] md:text-xs lg:text-sm text-gray-500 font-black uppercase tracking-[0.3em] px-2 italic">Privacy & Info</h4>
                                        <div className="space-y-2">
                                            <button onClick={() => navigate('/privacy')} className="w-full p-5 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl flex items-center justify-between group hover:border-brand/30 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <FileText className="text-brand" size={18} />
                                                    <div className="text-left">
                                                        <p className="font-black italic tracking-tight uppercase text-[10px] md:text-xs lg:text-sm">DSGVO (Germany)</p>
                                                        <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-500 uppercase font-black">Data Privacy Compliance</p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={14} className="text-gray-600" />
                                            </button>

                                            <button onClick={() => setHelpSubView('app')} className="w-full p-5 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl flex items-center justify-between group hover:border-brand/30 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <Info className="text-brand" size={18} />
                                                    <div className="text-left">
                                                        <p className="font-black italic tracking-tight uppercase text-[10px] md:text-xs lg:text-sm">App Information</p>
                                                        <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-500 uppercase font-black">Global Transport Services</p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={14} className="text-gray-600" />
                                            </button>

                                            <button 
                                                onClick={() => setHelpSubView('delete_account')} 
                                                className="w-full p-5 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center justify-between group hover:border-red-500/40 transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Trash2 className="text-red-500" size={18} />
                                                    <div className="text-left">
                                                        <p className="font-black italic tracking-tight uppercase text-[10px] md:text-xs lg:text-sm text-red-500">Delete Account</p>
                                                        <p className="text-[8px] md:text-[10px] lg:text-xs text-red-500/60 uppercase font-black">Permanent Data Purge</p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={14} className="text-red-500/40" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : helpSubView === 'chat' ? (
                                <div className="space-y-4 h-[50vh] flex flex-col">
                                    <div className="flex-1 bg-[var(--bg-secondary)]/50 rounded-[2rem] p-4 overflow-y-auto space-y-4 border border-[var(--border-main)] flex flex-col">
                                        <div className="space-y-4 flex-1">
                                            {chatMessages.map((msg, index) => (
                                                <div key={index} className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-brand text-dark-900' : 'bg-brand/20 text-brand'}`}>
                                                        {msg.sender === 'user' ? <User size={14} /> : <Zap size={14} />}
                                                    </div>
                                                    <div className={`p-3 rounded-2xl border border-[var(--border-main)] ${msg.sender === 'user' ? 'bg-brand text-dark-950 rounded-tr-none' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-tl-none'}`}>
                                                        <p className={`text-[8px] md:text-[10px] lg:text-xs uppercase font-black tracking-widest mb-1 ${msg.sender === 'user' ? 'text-dark-900/60' : 'text-brand'}`}>
                                                            {msg.sender === 'user' ? 'You' : 'Green AI'}
                                                        </p>
                                                        <p className="text-xs md:text-sm lg:text-base font-bold leading-relaxed">{msg.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {isAiTyping && (
                                                <div className="flex gap-3 max-w-[80%] animate-pulse">
                                                    <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
                                                        <Zap size={14} className="text-brand" />
                                                    </div>
                                                    <div className="bg-[var(--bg-secondary)] p-3 rounded-2xl rounded-tl-none border border-[var(--border-main)] text-[var(--text-muted)] text-xs md:text-sm lg:text-base italic">
                                                        Green AI is typing...
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-[var(--bg-secondary)] p-2 rounded-3xl border border-[var(--border-main)] flex items-center gap-2">
                                        <button className="p-3 text-[var(--text-muted)] hover:text-brand transition-colors"><Paperclip size={20} /></button>
                                        <input 
                                            type="text" 
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                                            placeholder="Describe your issue..." 
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-black italic text-[var(--text-primary)] placeholder:text-gray-500/60 px-2 outline-none" 
                                        />
                                        <button 
                                            onClick={handleSendChatMessage}
                                            className="p-3 bg-brand text-dark-900 rounded-2xl hover:scale-105 active:scale-95 transition-all"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </div>
                            ) : helpSubView === 'dsgvo' ? (
                                <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] p-6 rounded-[2rem] space-y-4 h-[50vh] overflow-y-auto scrollbar-hide">
                                    <h4 className="text-xs md:text-sm lg:text-base font-black italic text-brand uppercase tracking-widest border-b border-brand/20 pb-2">Datenschutzerklärung (DSGVO)</h4>
                                    <div className="space-y-4 text-[10px] md:text-xs lg:text-sm text-[var(--text-muted)] font-bold uppercase tracking-widest leading-relaxed">
                                        <p className="text-[var(--text-primary)]">1. Verantwortliche Stelle</p>
                                        <p>Green GmbH, Cyber Strasse 404, 10117 Berlin. info@greenmobility.de</p>
                                        <p className="text-[var(--text-primary)]">2. Datenerhebung</p>
                                        <p>Wir erheben Daten zur Durchführung von Transportdienstleistungen (Name, Standort, Zahlungsdaten) gemäß Art. 6 Abs. 1 lit. b DSGVO.</p>
                                        <p className="text-[var(--text-primary)]">3. Standorterfassung</p>
                                        <p>Echtzeit-Standortdaten werden nur während aktiver Fahrten oder bei der Suche nach Fahrern erfasst und nicht dauerhaft gespeichert.</p>
                                        <p className="text-[var(--text-primary)]">4. Ihre Rechte</p>
                                        <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Datenübertragbarkeit Ihrer gespeicherten Informationen.</p>
                                    </div>
                                </div>
                            ) : helpSubView === 'delete_account' ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] p-6 rounded-[2rem] space-y-4">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="p-3 bg-red-500/10 rounded-2xl text-red-500"><Shield size={24} /></div>
                                            <div>
                                                <h4 className="text-sm font-black italic uppercase text-red-500">Security Warning Protocol</h4>
                                                <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-red-500/60 tracking-widest">Account Deletion Scheduled</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-[10px] md:text-xs lg:text-sm text-[var(--text-muted)] font-bold uppercase tracking-wider leading-relaxed">
                                            <p className="text-[var(--text-primary)]">1. 15-Day Grace Period (DSGVO/GDPR)</p>
                                            <p>Your data is placed in secure quarantine for exactly 15 days. If you change your mind, cancel the deletion and restore everything instantly.</p>
                                            
                                            <p className="text-[var(--text-primary)]">2. Complete & Permanent Deletion</p>
                                            <p>If you do not restore your account within 15 days, our system automatically wipes all profiles, payment credentials, ride histories, and ledgers permanently.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 px-2">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Type "DELETE" to confirm your decision:</p>
                                        <input 
                                            type="text" 
                                            placeholder="Type DELETE here..."
                                            value={confirmDeleteInput}
                                            onChange={(e) => setConfirmDeleteInput(e.target.value)}
                                            className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-400 focus:border-red-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => setHelpSubView(null)}
                                            className="px-6 py-5 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                                        >
                                            Abort
                                        </button>
                                        <button 
                                            onClick={handleConfirmDeletion}
                                            disabled={confirmDeleteInput !== 'DELETE'}
                                            className={`flex-1 py-5 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest transition-all ${
                                                confirmDeleteInput === 'DELETE' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-[var(--bg-secondary)] border border-[var(--border-main)] text-[var(--text-secondary)]/50'
                                            }`}
                                        >
                                            Confirm Deletion
                                        </button>
                                    </div>
                                </div>
                            ) : helpSubView === 'app' ? (
                                <div className="space-y-4">
                                    {!serviceDetailView ? (
                                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] p-6 rounded-[2rem] space-y-4">
                                            <div className="flex items-center gap-4 mb-2">
                                                <div className="p-3 bg-brand/20 rounded-2xl text-brand"><Zap size={24} /></div>
                                                <div>
                                                    <h4 className="text-sm font-black italic uppercase">Green Services v1.2</h4>
                                                    <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-[var(--text-muted)] tracking-widest">Premium Core Network</p>
                                                </div>
                                            </div>
                                            <p className="text-[10px] md:text-xs lg:text-sm text-[var(--text-muted)] font-black uppercase tracking-widest leading-relaxed mb-4">
                                                Explore our five specialized premium lifestyle & transport service hubs:
                                            </p>
                                            <div className="space-y-3">
                                                {[
                                                    { id: 'trips', label: 'Premium Trips', desc: 'State-of-the-art electric & hybrid rides', icon: Car },
                                                    { id: 'tickets', label: 'VIP Tickets', desc: 'Access to clubs, bars & concert events', icon: Trophy },
                                                    { id: 'rooms', label: 'Luxury Rooms', desc: 'Direct booking of first-class hotel suites', icon: BedDouble },
                                                    { id: 'order', label: 'Pre-Orders', desc: 'Pre-order food & drinks directly in-app', icon: Utensils },
                                                    { id: 'waiter', label: 'VIP Waiter Call', desc: 'Call host directly to your table', icon: Bell }
                                                ].map(service => (
                                                    <button 
                                                        key={service.id}
                                                        onClick={() => setServiceDetailView(service.id)}
                                                        className="w-full flex items-center justify-between bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-main)] hover:border-brand/40 transition-all group hover:scale-[1.02] active:scale-[0.98] text-left"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-brand/10 group-hover:bg-brand/20 rounded-xl text-brand transition-colors">
                                                                <service.icon size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs md:text-sm lg:text-base font-black italic uppercase text-[var(--text-primary)]">{service.label}</p>
                                                                <p className="text-[8px] md:text-[10px] lg:text-xs text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">{service.desc}</p>
                                                            </div>
                                                        </div>
                                                        <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] p-8 rounded-[3rem] text-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                            {serviceDetailView === 'trips' && (
                                                <>
                                                    <div className="w-20 h-20 bg-brand/10 rounded-[2rem] mx-auto flex items-center justify-center text-brand"><Car size={40} /></div>
                                                    <h4 className="text-2xl font-black italic tracking-tighter uppercase text-brand">Premium Trips</h4>
                                                    <div className="space-y-4 text-xs md:text-sm lg:text-base font-bold uppercase tracking-widest text-[var(--text-muted)] leading-relaxed text-left max-w-sm mx-auto">
                                                        <p className="text-[var(--text-primary)]">🚗 Chauffeur-Service</p>
                                                        <p className="text-[10px] md:text-xs lg:text-sm pl-6 font-normal">Fahrten in modernsten Elektro- und Hybridfahrzeugen mit professionellen Fahrern.</p>
                                                        <p className="text-[var(--text-primary)]">📶 Premium Ausstattung</p>
                                                        <p className="text-[10px] md:text-xs lg:text-sm pl-6 font-normal">Kostenfreies WLAN, Erfrischungsgetränke und Ambientelicht an Bord jeder Fahrt.</p>
                                                        <p className="text-[var(--text-primary)]">🕒 24/7 Support</p>
                                                        <p className="text-[10px] md:text-xs lg:text-sm pl-6 font-normal">Immer für dich erreichbar. Bearbeitungszeit für Rückfragen stets innerhalb von 3 Werktagen.</p>
                                                    </div>
                                                    <button onClick={() => { setActiveSheet(null); setServiceDetailView(null); navigate('/green-ride'); }} className="w-full py-5 bg-brand text-dark-900 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">
                                                        Fahrt Buchen
                                                    </button>
                                                </>
                                            )}
                                            {serviceDetailView === 'tickets' && (
                                                <>
                                                    <div className="w-20 h-20 bg-brand/10 rounded-[2rem] mx-auto flex items-center justify-center text-brand"><Trophy size={40} /></div>
                                                    <h4 className="text-2xl font-black italic tracking-tighter uppercase text-brand">VIP Tickets</h4>
                                                    <div className="space-y-4 text-xs md:text-sm lg:text-base font-bold uppercase tracking-widest text-[var(--text-muted)] leading-relaxed text-left max-w-sm mx-auto">
                                                        <p className="text-[var(--text-primary)]">🎟️ Fast-Lane Einlass</p>
                                                        <p className="text-[10px] md:text-xs lg:text-sm pl-6 font-normal">VIP-Zugang zu exklusiven Konzert-Events, Bars und erstklassigen Partner-Clubs.</p>
                                                        <p className="text-[var(--text-primary)]">🎫 Digitale Wallet</p>
                                                        <p className="text-[10px] md:text-xs lg:text-sm pl-6 font-normal">E-Tickets werden sofort personalisiert und sicher in deiner Green Wallet hinterlegt.</p>
                                                        <p className="text-[var(--text-primary)]">🛡️ Käuferschutz</p>
                                                        <p className="text-[10px] md:text-xs lg:text-sm pl-6 font-normal">Sichere Ticketstornierungen und Erstattungen werden garantiert in 3 Werktagen geprüft.</p>
                                                    </div>
                                                    <button onClick={() => { setActiveSheet(null); setServiceDetailView(null); navigate('/greens'); }} className="w-full py-5 bg-brand text-dark-900 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">
                                                        Tickets Entdecken
                                                    </button>
                                                </>
                                            )}
                                            {serviceDetailView === 'rooms' && (
                                                <>
                                                    <div className="w-20 h-20 bg-brand/10 rounded-[2rem] mx-auto flex items-center justify-center text-brand"><BedDouble size={40} /></div>
                                                    <h4 className="text-2xl font-black italic tracking-tighter uppercase text-brand">Luxury Rooms</h4>
                                                    <div className="space-y-4 text-xs md:text-sm lg:text-base font-bold uppercase tracking-widest text-[var(--text-muted)] leading-relaxed text-left max-w-sm mx-auto">
                                                        <p className="text-[var(--text-primary)]">🏨 Erstklassige Hotels</p>
                                                        <p className="text-[10px] md:text-xs lg:text-sm pl-6 font-normal">Direkte Reservierung erstklassiger Partner-Hotelzimmer und Luxus-Suiten.</p>
                                                        <p className="text-[var(--text-primary)]">🥞 VIP Privilegien</p>
                                                        <p className="text-[10px] md:text-xs lg:text-sm pl-6 font-normal">Late Check-out, exklusiver Spa-Zugang und kostenloses Premium-Frühstück.</p>
                                                        <p className="text-[var(--text-primary)]">💰 Club Rabatte</p>
                                                        <p className="text-[10px] md:text-xs lg:text-sm pl-6 font-normal">Sonderkonditionen und Storno-Garantie (Bearbeitungsdauer maximal 3 Werktage).</p>
                                                    </div>
                                                    <button onClick={() => { setActiveSheet(null); setServiceDetailView(null); navigate('/greens'); }} className="w-full py-5 bg-brand text-dark-900 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">
                                                        Hotel Suchen
                                                    </button>
                                                </>
                                            )}
                                            {serviceDetailView === 'order' && (
                                                <>
                                                    <div className="w-20 h-20 bg-brand/10 rounded-[2rem] mx-auto flex items-center justify-center text-brand"><Utensils size={40} /></div>
                                                    <h4 className="text-2xl font-black italic tracking-tighter uppercase text-brand">Pre-Orders</h4>
                                                    <div className="space-y-4 text-xs md:text-sm lg:text-base font-bold uppercase tracking-widest text-[var(--text-muted)] leading-relaxed text-left max-w-sm mx-auto">
                                                        <p className="text-[var(--text-primary)]">🍸 Keine Warteschlangen</p>
                                                        <p className="text-[10px] md:text-xs lg:text-sm pl-6 font-normal">Speisen und Getränke vorab im Club oder direkt am Stadionplatz bestellen und bezahlen.</p>
                                                        <p className="text-[var(--text-primary)]">⚡ Express Abholung</p>
                                                        <p className="text-[10px] md:text-xs lg:text-sm pl-6 font-normal">Schnelle Zubereitung an reservierten Terminals ohne Barzahlungs-Stress.</p>
                                                        <p className="text-[var(--text-primary)]">🔐 Abrechnungsgarantie</p>
                                                        <p className="text-[10px] md:text-xs lg:text-sm pl-6 font-normal">Storno- und Rückerstattungsanträge werden lückenlos innerhalb von 3 Werktagen abgewickelt.</p>
                                                    </div>
                                                    <button onClick={() => { setActiveSheet(null); setServiceDetailView(null); navigate('/greens'); }} className="w-full py-5 bg-brand text-dark-900 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">
                                                        Karte Ansehen
                                                    </button>
                                                </>
                                            )}
                                            {serviceDetailView === 'waiter' && (
                                                <>
                                                    <div className="w-20 h-20 bg-brand/10 rounded-[2rem] mx-auto flex items-center justify-center text-brand"><Bell size={40} /></div>
                                                    <h4 className="text-2xl font-black italic tracking-tighter uppercase text-brand">VIP Waiter Call</h4>
                                                    <div className="space-y-4 text-xs md:text-sm lg:text-base font-bold uppercase tracking-widest text-[var(--text-muted)] leading-relaxed text-left max-w-sm mx-auto">
                                                        <p className="text-[var(--text-primary)]">🛎️ Kellner Rufen</p>
                                                        <p className="text-[10px] md:text-xs lg:text-sm pl-6 font-normal">Rufe den Tischservice in erstklassigen Partner-Venues mit nur einem Klick zu deinem Tisch.</p>
                                                        <p className="text-[var(--text-primary)]">🤵 Sofortiger Service</p>
                                                        <p className="text-[10px] md:text-xs lg:text-sm pl-6 font-normal">Kein Suchen oder Warten – schnelle Orderübermittlung direkt an das Serviceteam.</p>
                                                        <p className="text-[var(--text-primary)]">🛡️ Qualitätssicherung</p>
                                                        <p className="text-[10px] md:text-xs lg:text-sm pl-6 font-normal">Unsere Partnergarantie verspricht stets erstklassige Betreuung. Reklamationsprüfungen in 3 Werktagen.</p>
                                                    </div>
                                                    <button onClick={() => { setActiveSheet(null); setServiceDetailView(null); navigate('/greens'); }} className="w-full py-5 bg-brand text-dark-900 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">
                                                        Kellner Rufen
                                                    </button>
                                                </>
                                            )}
                                            
                                            <button 
                                                onClick={() => setServiceDetailView(null)}
                                                className="w-full py-4 bg-white/5 border border-white/10 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-[var(--text-primary)] hover:bg-white/10 transition-all"
                                            >
                                                Zurück zur Übersicht
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] p-8 rounded-[3rem] text-center space-y-6">
                                    <div className="w-20 h-20 bg-brand/10 rounded-full mx-auto flex items-center justify-center text-brand">
                                        <Mail size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black italic tracking-tighter uppercase text-brand">GreenEmail Access</h4>
                                        <p className="text-xs md:text-sm lg:text-base text-[var(--text-muted)] font-black uppercase tracking-widest mt-2 leading-relaxed">
                                            Send your official inquiries to our priority support channel:
                                        </p>
                                        <div className="mt-4 p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-main)] group hover:border-brand/50 transition-all cursor-pointer">
                                            <p className="text-lg font-black italic tracking-tight text-[var(--text-primary)]">support@greenemail.de</p>
                                        </div>
                                    </div>
                                    <p className="text-[8px] md:text-[10px] lg:text-xs text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">Response time: ~15 minutes</p>
                                </div>
                            )}

                            <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-600 text-center uppercase font-black tracking-widest px-8 mt-auto italic">
                                Green is committed to secure and transparent passenger transport services across Germany.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Account & Security Header */}
                            <div className="flex items-center gap-4 mb-2">
                                <button
                                    onClick={() => setProfileSubView(null)}
                                    className="p-2 bg-[var(--bg-secondary)] rounded-xl text-brand hover:scale-110 transition-all"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h3 className="text-xl font-black italic tracking-tighter uppercase text-brand">Account & Security</h3>
                            </div>

                            {/* Profile Customization Section */}
                            <div className="flex gap-4 p-4 bg-[var(--bg-secondary)]/50 border border-white/5 rounded-3xl">
                                <div className="w-20 h-20 rounded-2xl bg-dark-900 border-2 border-brand/20 overflow-hidden shrink-0">
                                    <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Alex'}`} alt="Me" className="w-full h-full" />
                                </div>
                                <div className="flex flex-col justify-center gap-3 flex-1">
                                    <div className="grid grid-cols-1 gap-2">
                                        <button
                                            onClick={handleUploadClick}
                                            className="py-3 px-4 bg-brand text-dark-900 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs lg:text-sm rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                        >
                                            <Upload size={14} />
                                            Update Profile Picture
                                        </button>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={handleUploadClick}
                                                className="py-2.5 px-2 bg-dark-900 border border-brand/20 text-brand font-black uppercase tracking-widest text-[8px] md:text-[10px] lg:text-xs rounded-xl flex items-center justify-center gap-1 hover:bg-brand/10 transition-all"
                                            >
                                                <Paperclip size={12} />
                                                Gallery
                                            </button>
                                            <button
                                                onClick={handleUploadClick}
                                                className="py-2.5 px-2 bg-dark-900 border border-white/10 text-white font-black uppercase tracking-widest text-[8px] md:text-[10px] lg:text-xs rounded-xl flex items-center justify-center gap-1 hover:bg-white/5 transition-all"
                                            >
                                                <Zap size={12} />
                                                Selfie
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                                        className="py-2 px-4 bg-dark-900 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] md:text-xs lg:text-sm rounded-xl hover:bg-[var(--bg-secondary)] transition-all mt-1"
                                    >
                                        {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
                                    </button>
                                </div>
                            </div>
                            {/* Personal Information Grid */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-2">
                                    <h4 className="text-[10px] md:text-xs lg:text-sm text-gray-500 font-black uppercase tracking-[0.3em] italic">Personal Records</h4>
                                    {isEditingProfile && (
                                        <button
                                            onClick={() => {
                                                setIsEditingProfile(false);
                                                alert("PROFILE UPDATED: Your personal records have been securely synchronized with the GRIEN Network.");
                                            }}
                                            className="px-4 py-2 bg-brand text-dark-900 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                        >
                                            Save Changes
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-dark-900 border border-white/5 p-4 rounded-2xl">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs text-brand/60 uppercase font-black tracking-widest mb-1">First Name</p>
                                        {isEditingProfile ? (
                                            <input
                                                type="text"
                                                value={userInfo.firstName}
                                                onChange={(e) => setUserInfo({ ...userInfo, firstName: e.target.value })}
                                                className="bg-transparent border-none p-0 text-sm font-black italic text-white focus:ring-0 w-full"
                                            />
                                        ) : (
                                            <p className="text-sm font-black italic">{userInfo.firstName}</p>
                                        )}
                                    </div>
                                    <div className="bg-dark-900 border border-white/5 p-4 rounded-2xl">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs text-brand/60 uppercase font-black tracking-widest mb-1">Last Name</p>
                                        {isEditingProfile ? (
                                            <input
                                                type="text"
                                                value={userInfo.lastName}
                                                onChange={(e) => setUserInfo({ ...userInfo, lastName: e.target.value })}
                                                className="bg-transparent border-none p-0 text-sm font-black italic text-white focus:ring-0 w-full"
                                            />
                                        ) : (
                                            <p className="text-sm font-black italic">{userInfo.lastName}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-dark-900 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
                                    <MapPin size={18} className="text-brand/40" />
                                    <div className="flex-1">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs text-brand/60 uppercase font-black tracking-widest mb-1">Address</p>
                                        {isEditingProfile ? (
                                            <input
                                                type="text"
                                                value={userInfo.address}
                                                onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                                                className="bg-transparent border-none p-0 text-sm font-black italic text-white focus:ring-0 w-full"
                                            />
                                        ) : (
                                            <p className="text-sm font-black italic">{userInfo.address}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-dark-900 border border-white/5 p-4 rounded-2xl">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs text-brand/60 uppercase font-black tracking-widest mb-1">Zip Code</p>
                                        {isEditingProfile ? (
                                            <input
                                                type="text"
                                                value={userInfo.zipCode}
                                                onChange={(e) => setUserInfo({ ...userInfo, zipCode: e.target.value })}
                                                className="bg-transparent border-none p-0 text-sm font-black italic text-white focus:ring-0 w-full"
                                            />
                                        ) : (
                                            <p className="text-sm font-black italic">{userInfo.zipCode}</p>
                                        )}
                                    </div>
                                    <div className="bg-dark-900 border border-white/5 p-4 rounded-2xl">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs text-brand/60 uppercase font-black tracking-widest mb-1">City</p>
                                        {isEditingProfile ? (
                                            <input
                                                type="text"
                                                value={userInfo.city}
                                                onChange={(e) => setUserInfo({ ...userInfo, city: e.target.value })}
                                                className="bg-transparent border-none p-0 text-sm font-black italic text-white focus:ring-0 w-full"
                                            />
                                        ) : (
                                            <p className="text-sm font-black italic">{userInfo.city}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-dark-900 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
                                    <Mail size={18} className="text-brand/40" />
                                    <div className="flex-1">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs text-brand/60 uppercase font-black tracking-widest mb-1">Email Address</p>
                                        {isEditingProfile ? (
                                            <input
                                                type="email"
                                                value={userInfo.email}
                                                onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                                                className="bg-transparent border-none p-0 text-sm font-black italic text-white focus:ring-0 w-full"
                                            />
                                        ) : (
                                            <p className="text-sm font-black italic">{userInfo.email}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-dark-900 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
                                    <Phone size={18} className="text-brand/40" />
                                    <div className="flex-1">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs text-brand/60 uppercase font-black tracking-widest mb-1">Phone Number</p>
                                        {isEditingProfile ? (
                                            <input
                                                type="tel"
                                                value={userInfo.phone}
                                                onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                                                className="bg-transparent border-none p-0 text-sm font-black italic text-white focus:ring-0 w-full"
                                            />
                                        ) : (
                                            <p className="text-sm font-black italic">{userInfo.phone}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Security & Password Section */}
                            <div className="space-y-4 pt-2">
                                <h4 className="text-[10px] md:text-xs lg:text-sm text-gray-500 font-black uppercase tracking-[0.3em] px-2 italic">Security Access</h4>
                                <div className="p-5 rounded-3xl space-y-4" style={{ background: 'var(--brand-glow)', border: '1px solid var(--glass-border)' }}>
                                    <button className="w-full py-4 text-white font-black uppercase tracking-widest text-xs md:text-sm lg:text-base italic rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-end))', boxShadow: '0 0 20px var(--brand-glow)' }}>
                                        <Lock size={16} />
                                        Change Password
                                    </button>

                                    <button 
                                        onClick={() => navigate('/privacy')}
                                        className="w-full py-3 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[9px] md:text-[11px] lg:text-xs italic rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                                    >
                                        <ShieldCheck size={14} className="text-brand" />
                                        Privacy Manifesto
                                    </button>

                                    <div className="flex flex-col gap-3">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs text-center text-gray-500 uppercase font-black tracking-widest">Choose Reset Channel</p>
                                        <div className="flex gap-2">
                                            <button className="flex-1 py-3 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-tighter flex items-center justify-center gap-2 transition-all bg-[var(--bg-secondary)] border border-[var(--border-main)]" onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}>
                                                <Mail size={12} style={{ color: 'var(--brand)' }} />
                                                Via Email
                                            </button>
                                            <button className="flex-1 py-3 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-tighter flex items-center justify-center gap-2 transition-all bg-[var(--bg-secondary)] border border-[var(--border-main)]" onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}>
                                                <Phone size={12} style={{ color: 'var(--brand)' }} />
                                                Via Phone
                                            </button>
                                        </div>
                                    </div>

                                    {/* APPLE/GOOGLE COMPLIANCE: ACCOUNT DELETION */}
                                    <div className="pt-4 border-t border-white/5">
                                        <button 
                                            onClick={() => {
                                                alert("DELETION REQUEST SENT: The Super Admin and service staff have been notified. A representative will contact you to verify and process your account deletion.");
                                            }}
                                            className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl font-black uppercase text-[10px] md:text-xs lg:text-sm tracking-[0.2em] border border-red-500/10 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
                                        >
                                            <Trash2 size={12} /> REQUEST DELETING ACCOUNT
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </Sheet>

            {/* Hidden Rating Trigger (For Testing) */}
            <button
                onClick={() => setActiveSheet('rating')}
                className="fixed top-4 right-4 z-50 p-2 opacity-10 hover:opacity-100"
            >
                <Sparkles size={16} />
            </button>

            <Sheet isOpen={activeSheet === 'rating'} onClose={() => setActiveSheet(null)} className="rounded-t-[3rem]">
                <RatingComponent />
                <button
                    onClick={() => setActiveSheet(null)}
                    className="w-full py-4 text-[var(--bg-primary)] rounded-2xl font-black uppercase tracking-widest text-sm"
                    style={{ background: 'var(--accent-primary)', boxShadow: '0 0 20px var(--accent-primary-glow)' }}
                >
                    Confirm Report
                </button>
            </Sheet>

            {/* Sharing Match Request Overlay/Sheet */}
            <Sheet isOpen={showSharingDialog} onClose={() => setShowSharingDialog(false)} className="rounded-t-[3.5rem]">
                <div className="space-y-8 pb-12 overflow-y-auto max-h-[85vh]">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ background: 'var(--brand-glow)', border: '1px solid var(--glass-border)', color: 'var(--brand)' }}>
                            <Sparkles size={14} className="animate-pulse" />
                            <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest italic">Shared Ride Match Found</span>
                        </div>
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Someone is heading<br /><span style={{ color: 'var(--brand)' }}>Your way</span></h2>
                        <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-500 font-black uppercase tracking-[0.3em] mt-2 italic">Matches your route within 1 km</p>
                    </div>

                    {/* Passenger Profile Card */}
                    <div className="rounded-[2.5rem] p-6 relative overflow-hidden group bg-[var(--bg-secondary)] border border-[var(--border-main)]">
                        <div className="absolute top-0 right-0 p-4">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-white" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-end))' }}>
                                <Star size={12} className="fill-white" />
                                <span className="text-xs md:text-sm lg:text-base font-black">{sharingMatch?.rating}</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-24 h-24 rounded-[2rem] p-1 shadow-2xl group-hover:scale-105 transition-transform" style={{ background: 'var(--dark-950)', border: '2px solid var(--glass-border)' }}>
                                <img src={sharingMatch?.avatar} alt="Passenger" className="w-full h-full rounded-[1.8rem]" style={{ background: 'var(--brand-glow)' }} />
                                <div className="absolute -bottom-2 right-0 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-end))' }}>
                                    <UserCheck size={16} />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-black italic tracking-tighter uppercase">{sharingMatch?.name}</h3>
                                <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-600 font-black uppercase tracking-widest mt-1 italic leading-relaxed">
                                    Pickup: {sharingMatch?.pickup} • <span style={{ color: 'var(--brand)' }}>{sharingMatch?.distance} Away</span>
                                </p>
                            </div>

                            {/* Personality Emojis */}
                            <div className="flex gap-3 pt-2">
                                {sharingMatch?.personality.map((p, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1 group/p relative">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl cursor-default transition-all bg-[var(--bg-primary)] border border-[var(--border-main)]" onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}>
                                            {p.emoji}
                                        </div>
                                        <span className="text-[7px] font-black uppercase tracking-widest text-gray-600 group-hover/p:text-brand transition-colors">{p.trait}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cost Benefit */}
                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                            <div>
                                <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-500 font-black uppercase tracking-widest">Est. Saving</p>
                                <p className="text-2xl font-black italic" style={{ color: 'var(--brand)' }}>-{sharingMatch?.savings}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-500 font-black uppercase tracking-widest leading-tight">Environmental Impact</p>
                                <p className="text-xs md:text-sm lg:text-base font-black italic text-white uppercase">CO2 Optimized ✨</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowSharingDialog(false)}
                            className="flex-1 py-5 border border-white/10 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500 hover:bg-white/5 transition-all"
                        >
                            Decline
                        </button>
                        <button
                            onClick={() => {
                                setShowSharingDialog(false);
                                navigate('/sharing-tracking');
                            }}
                            className="flex-[2] py-5 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.4em] italic hover:scale-[1.02] active:scale-[0.98] transition-all text-white"
                            style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-end))', boxShadow: '0 0 24px var(--brand-glow)' }}
                        >
                            Accept & Split
                        </button>
                    </div>
                </div>
            </Sheet>

            {/* Neural Permission Handshake (Store Compliance) */}
            <AnimatePresence>
                {!localStorage.getItem('green_permissions_granted') && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
                        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-3xl flex items-center justify-center p-6 md:p-12"
                    >
                        {/* Background Decor for iPad */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
                            <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-brand/10 rounded-full blur-[120px]" />
                            <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
                        </div>

                        <div className="max-w-sm md:max-w-md w-full relative overflow-hidden rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 text-center shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10 bg-neutral-900/80 backdrop-blur-3xl">
                            {/* Glowing Orbs */}
                            <div className="absolute -top-20 -left-20 w-40 md:w-64 h-40 md:h-64 bg-brand/20 rounded-full blur-[60px] md:blur-[80px]" />
                            <div className="absolute -bottom-20 -right-20 w-40 md:w-64 h-40 md:h-64 bg-blue-500/20 rounded-full blur-[60px] md:blur-[80px]" />
                            
                            <div className="relative z-10">
                                <div className="w-20 md:w-24 h-20 md:h-24 bg-gradient-to-br from-gray-900 to-black rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl mb-8 relative border border-white/10">
                                    <MapPin size={32} className="animate-bounce md:w-10 md:h-10" />
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 bg-brand rounded-full flex items-center justify-center shadow-lg border-2 border-[#1A1A1A]">
                                        <Camera size={14} className="text-black md:w-5 md:h-5" />
                                    </div>
                                </div>
                                
                                <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-4">Erlebnis Freischalten</h3>
                                
                                <p className="text-[11px] md:text-sm text-gray-400 font-medium leading-relaxed mb-8 px-1 md:px-4">
                                    Um dir das bestmögliche Erlebnis zu bieten und alle Funktionen der App optimal nutzen zu können, benötigt GREEN Zugriff auf deinen <strong className="text-white">Standort</strong> und deine <strong className="text-white">Kamera</strong>.
                                </p>

                                <div className="space-y-3">
                                    <button 
                                        onClick={() => {
                                            localStorage.setItem('green_permissions_granted', 'true');
                                            window.location.reload();
                                        }}
                                        className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs md:text-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 relative overflow-hidden group uppercase tracking-widest"
                                    >
                                        <div className="absolute inset-0 bg-brand translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                        <span className="relative z-10 group-hover:text-black transition-colors">Weiter</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Home;

