import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Search, Sparkles, Star, MapPin, Navigation, ArrowRight,
    Zap, Utensils, BedDouble, GlassWater, Trophy, Compass, ShieldCheck, Users, X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import Sheet from '../components/Sheet';
import GreenSPage from './GreenSPage';

const DiscoveryGallery = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    
    const [isToolsOpen, setIsToolsOpen] = useState(false);

    // Default to 'hotel' if no state passed
    const initialCategory = location.state?.category || 'hotel';
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active'
    const [searchQuery, setSearchQuery] = useState('');

    const categories = [
        { id: 'stadium', label: 'Stadium', icon: Trophy, color: 'text-amber-500' },
        { id: 'hotel', label: 'Hotels', icon: BedDouble, color: 'text-emerald-400' }
    ];

    const defaultVenues = [];

    const [venues, setVenues] = useState(defaultVenues);

    useEffect(() => {
        const fetchDynamicVenues = async () => {
            try {
                const q = query(collection(db, 'users'), where('role', '==', 'manager'));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const loaded = [];
                    querySnapshot.forEach(doc => {
                        const data = doc.data();
                        
                        // Ignore generic fleet managers (FM) in Discovery Gallery list
                        if (data.businessType === 'FM') return;

                        let category = 'restaurant';
                        if (data.businessType === 'BM') category = 'bar';
                        else if (data.businessType === 'CM') category = 'club';
                        else if (data.businessType === 'HM') category = 'hotel';
                        else if (data.businessType === 'SM') category = 'stadium';
                        else if (data.businessType === 'VM') category = 'event';

                        const emailKey = data.email ? data.email.replace(/[^a-zA-Z0-9]/g, '_') : 'default';

                        loaded.push({
                            id: doc.id,
                            category: category,
                            name: data.businessInfo?.legalName || data.businessName || data.name || "Unnamed Partner",
                            offer: data.businessInfo?.offer || "Exclusive Member Access",
                            discount: (data.businessInfo?.discount !== undefined && data.businessInfo?.discount !== '') ? data.businessInfo.discount : null,
                            rating: 4.8,
                            dist: "1.2km",
                            img: category === 'club' 
                                ? "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80"
                                : category === 'hotel'
                                ? "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
                                : category === 'bar'
                                ? "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80"
                                : category === 'stadium'
                                ? "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80"
                                : "https://images.unsplash.com/photo-1550966841-3ee7adac1af0?w=800&q=80",
                            tags: category === 'club' ? ["VIP", "Nightlife"] : ["Verified"],
                            emailKey: emailKey,
                            email: data.email || (doc.id.includes('@') ? doc.id : undefined),
                            address: data.businessInfo?.address || data.address || '',
                            workingHours: data.businessInfo?.workingHours || data.workingHours || ''
                        });
                    });
                    
                    if (loaded.length > 0) {
                        setVenues(loaded);
                    }
                }
            } catch (err) {
                console.error("Error fetching dynamic venues from Firestore:", err);
            }
        };
        fetchDynamicVenues();
    }, []);

    const filteredVenues = useMemo(() => {
        const userEmail = user?.email || '';
        const isDemoUser = user?.isDemo;

        return venues.filter(v => {
            const matchesCat = v.category === activeCategory;
            const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = activeFilter === 'all' || 
                                (activeFilter === 'active' && v.rating > 4.7);
            
            // Hide demo venues for non-demo users
            const isVenueDemo = ['manager@green.de', 'restaurant@green.de', 'club@green.de', 'hotel@green.de', 'stadium@green.de'].includes((v.email || '').toLowerCase());
            if (!isDemoUser && isVenueDemo) {
                return false;
            }

            return matchesCat && matchesSearch && matchesFilter;
        });
    }, [venues, activeCategory, searchQuery, activeFilter, user]);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-brand/30">
            {/* Premium Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-end/5 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 p-6 pb-32 max-w-lg mx-auto min-h-screen">
                {/* Header Section */}
                <header className="flex items-center justify-between mb-8 pt-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/home')}
                            className="w-12 h-12 bg-[var(--bg-secondary)] border border-white/10 rounded-2xl flex items-center justify-center text-brand hover:border-brand/40 transition-all shadow-lg active:scale-90"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Grien S</h1>
                            <p className="text-brand font-black uppercase tracking-[0.2em] text-[8px] md:text-[10px] lg:text-xs italic mt-1">Exclusive Venues & Stadiums</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsToolsOpen(true)}
                            className="p-3 bg-brand/10 border border-brand/30 rounded-2xl text-brand hover:bg-brand/20 active:scale-95 transition-all flex items-center gap-2 shadow-lg"
                            title="Grien Circle & Social Hub"
                        >
                            <Users size={20} />
                            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Circle & Tools</span>
                        </button>
                        <div className="p-3 bg-brand/10 border border-brand/20 rounded-2xl text-brand animate-pulse">
                            <Sparkles size={20} />
                        </div>
                    </div>
                </header>

                {/* Search Interaction */}
                <div className="space-y-4 mb-8">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search venues, offers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[var(--bg-secondary)] border border-white/10 rounded-[2rem] py-5 pl-14 pr-6 text-sm font-black italic text-[var(--text-primary)] placeholder:text-gray-600 focus:border-brand/50 focus:ring-0 transition-all outline-none"
                        />
                    </div>
                    
                    {/* Tactical Filter Bar */}
                    <div className="flex gap-2 p-1.5 bg-[var(--bg-secondary)]/50 border border-white/5 rounded-2xl">
                        {['all', 'active'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`flex-1 py-3 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest transition-all ${activeFilter === filter ? 'bg-brand text-dark-900 shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div 
                    className="overflow-x-auto no-scrollbar -mx-6 px-6 mb-10 scroll-smooth cursor-grab"
                    onMouseDown={(e) => {
                        const ele = e.currentTarget;
                        ele.style.cursor = 'grabbing';
                        ele.style.userSelect = 'none';
                        const startX = e.pageX - ele.offsetLeft;
                        const scrollLeft = ele.scrollLeft;
                        
                        const handleMouseMove = (moveEvent) => {
                            const x = moveEvent.pageX - ele.offsetLeft;
                            const walk = (x - startX) * 1.5;
                            ele.scrollLeft = scrollLeft - walk;
                        };
                        
                        const handleMouseUp = () => {
                            ele.style.cursor = 'grab';
                            ele.style.removeProperty('user-select');
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                    }}
                >
                    <div className="flex gap-6 pb-4 w-max">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex-shrink-0 flex flex-col items-center gap-4 transition-all duration-300 group ${activeCategory === cat.id ? 'scale-110' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}
                            >
                                <div className={`w-20 h-20 rounded-[1.75rem] flex items-center justify-center border-2 transition-all duration-300 ${activeCategory === cat.id ? 'bg-brand shadow-[0_0_30px_rgba(52,211,153,0.4)] border-brand text-dark-900' : 'bg-[var(--bg-secondary)] border-white/10 text-[var(--text-primary)]/60 group-hover:border-white/30'}`}>
                                    <cat.icon size={32} strokeWidth={2.5} className="transition-transform group-hover:scale-110" />
                                </div>
                                <span className={`text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] whitespace-nowrap transition-colors ${activeCategory === cat.id ? 'text-brand' : 'text-gray-500'}`}>
                                    {cat.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-6 pt-4 relative">
                    <div className="absolute -top-3 right-6 px-3 py-1 bg-brand text-black rounded-full text-[7px] font-black uppercase tracking-widest shadow-lg z-10">{filteredVenues.length} Results 🛰️</div>
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-xl font-black italic tracking-tighter uppercase text-white/80">Available Venues</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredVenues.length > 0 ? filteredVenues.map((venue) => (
                                <motion.button
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={venue.id}
                                    onClick={() => navigate('/partner/details', { state: { venue } })}
                                    className="relative group w-full bg-[var(--bg-secondary)]/40 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col hover:border-brand/30 transition-all shadow-2xl text-left"
                                >
                                    {/* Image Container with Badges */}
                                    <div className="relative h-48 w-full overflow-hidden">
                                        <img 
                                            src={venue.img} 
                                            alt={venue.name} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                        
                                        {/* Top Badges */}
                                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                            {venue.discount && (
                                                <div className="bg-brand text-dark-900 px-3 py-1.5 rounded-xl font-black italic text-xs md:text-sm lg:text-base shadow-lg shadow-brand/20">
                                                    {venue.discount} OFF
                                                </div>
                                            )}
                                            <div className="bg-[var(--bg-primary)]/80 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/10">
                                                <Star size={12} className="text-amber-400 fill-amber-400" />
                                                <span className="text-[10px] md:text-xs lg:text-sm font-black">{venue.rating}</span>
                                            </div>
                                        </div>

                                        {/* Bottom Overlay Label */}
                                        <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                            <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-white shadow-sm">Verified Venue</span>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-black italic tracking-tighter uppercase text-white leading-tight mb-1">{venue.name}</h3>
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <MapPin size={12} />
                                                    <span className="text-[10px] md:text-xs lg:text-sm font-bold uppercase tracking-widest">{venue.dist} Near You</span>
                                                </div>
                                            </div>
                                            <button className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                                                <ArrowRight size={18} />
                                            </button>
                                        </div>

                                        <div className="bg-[var(--bg-primary)]/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Zap size={18} className="text-brand fill-brand" />
                                                <span className="text-[11px] md:text-sm lg:text-base font-black italic tracking-tight text-white uppercase">{venue.offer}</span>
                                            </div>
                                            <Sparkles size={14} className="text-brand opacity-50" />
                                        </div>

                                        <div className="flex gap-2">
                                            {venue.tags.map(tag => (
                                                <span key={tag} className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </motion.button>
                            )) : (
                                <div className="py-20 text-center space-y-4 bg-[var(--bg-secondary)]/20 rounded-[3rem] border border-dashed border-white/10">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-gray-600">
                                        <Search size={30} />
                                    </div>
                                    <p className="text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-gray-500">No venues found in this area</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Grien Circle & Social Tools Modal Sheet */}
            <Sheet isOpen={isToolsOpen} onClose={() => setIsToolsOpen(false)} position="bottom" className="bg-[#0b0c10] text-white max-w-lg mx-auto border-brand/20">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                            <Users size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black italic uppercase text-white">Grien Circle & Social Hub</h3>
                            <p className="text-[9px] text-brand font-bold uppercase tracking-widest">Manage Circle • Fair Split • Location • Support</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsToolsOpen(false)}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-95"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="max-h-[75vh] overflow-y-auto no-scrollbar">
                    <GreenSPage embedMode={true} onCloseEmbed={() => setIsToolsOpen(false)} />
                </div>
            </Sheet>
        </div>
    );
};

export default DiscoveryGallery;
