import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, BedDouble, ShieldCheck, Sparkles, MapPin, Clock, Info, ChevronRight, 
    Play, Heart, Share2, Menu, Box, ShoppingBag, LayoutGrid, Ticket, Trophy, Music, Crown
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const PartnerDetailsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const isDemo = user?.isDemo;
    
    const venue = location.state?.venue || {
        name: "The Skyline Club",
        offer: "VIP Entry + 1 Drink",
        img: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80",
        color: "text-violet-400"
    };

    const venueCategory = (venue.category || '').toLowerCase();
    const venueName = (venue.name || '').toLowerCase();
    const isStadium = venueCategory === 'stadium' || venueName.includes('stadium') || venueName.includes('arena') || venueName.includes('stadion');

    const [isLiked, setIsLiked] = useState(false);
    const [mediaItems, setMediaItems] = useState([]);
    const [activeMedia, setActiveMedia] = useState(null);
    const [isLoadingFeed, setIsLoadingFeed] = useState(true);
    const [selectedTicketCategory, setSelectedTicketCategory] = useState('all');

    const ticketCategories = [
        { id: 'all', label: 'Alle Eintrittskarten', sub: 'Gesamter Eventplan', icon: Ticket },
        { id: 'football', label: 'Fußball & Sport', sub: 'Spiele & Turniere', icon: Trophy },
        { id: 'concerts', label: 'Konzerte & Shows', sub: 'Live Performances', icon: Music },
        { id: 'vvip', label: 'VVIP & Logen', sub: 'Exklusive Plätze', icon: Crown },
    ];

    // Dynamic Live Feed sync
    useEffect(() => {
        if (!venue.email) {
            setIsLoadingFeed(false);
            return;
        }

        // Demo fallback data if user is demo and venue is default
        const isDemoVenue = ['manager@green.de', 'restaurant@green.de', 'club@green.de', 'hotel@green.de', 'stadium@green.de'].includes(venue.email.toLowerCase());
        
        if (isDemo && isDemoVenue) {
            const demoFeed = [
                {
                    id: 1,
                    type: 'image',
                    url: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&q=80",
                    title: "Last Friday's Neon Glow",
                    description: "A breathtaking night with DJ Neon. The energy was electric from start to finish!",
                    managerNote: "Next week we're doubling the laser count. Don't miss it!"
                },
                {
                    id: 2,
                    type: 'video',
                    url: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&q=80",
                    title: "Signature Cocktail Prep",
                    description: "Behind the scenes: Crafting the 'Green Emerald' - our top-rated mix.",
                    managerNote: "Our mixologists use only organic mint from our local greenhouse."
                },
                {
                    id: 3,
                    type: 'image',
                    url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80",
                    title: "Vibe Check: Rooftop Lounge",
                    description: "Unparalleled views and premium atmosphere. The perfect sunset spot.",
                    managerNote: "Happy hour starts at 6:00 PM precisely. Get there early for the best view."
                },
                {
                    id: 4,
                    type: 'image',
                    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
                    title: "The Gold Leaf Burger",
                    description: "Our world-famous Wagyu burger with 24k gold leaf. A taste of luxury.",
                    managerNote: "Available only on weekends. Booking highly recommended."
                }
            ];
            setMediaItems(demoFeed);
            setActiveMedia(demoFeed[0]);
            setIsLoadingFeed(false);
            return;
        }

        // Real Firestore query for non-demo users or custom accounts
        setIsLoadingFeed(true);
        const postsCol = collection(db, 'users', venue.email.toLowerCase(), 'posts');
        const q = query(postsCol, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                items.push({
                    id: docSnap.id,
                    type: data.type || 'image',
                    url: data.url || data.fileUrl || '',
                    title: data.title || data.caption || 'Partner Update',
                    description: data.description || data.caption || 'No description provided.',
                    managerNote: data.managerNote || 'Active Operations'
                });
            });
            setMediaItems(items);
            if (items.length > 0) {
                setActiveMedia(items[0]);
            } else {
                setActiveMedia(null);
            }
            setIsLoadingFeed(false);
        }, (err) => {
            console.error("Failed to fetch partner live feed:", err);
            setIsLoadingFeed(false);
        });

        return () => unsubscribe();
    }, [venue.email, isDemo]);

    const handleShare = () => {
        if (venue && navigator.share) {
            navigator.share({
                title: venue.name,
                text: venue.offer,
                url: window.location.href,
            }).catch(console.error);
        } else {
            alert('Sharing: ' + (venue?.name || 'Venue'));
        }
    };

    const isWashHub = venue.name?.toLowerCase().includes('wash');
    const isHotel = venue.category === 'hotel' || venue.name?.toLowerCase().includes('luxe') || venue.name?.toLowerCase().includes('hotel');

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-primary font-sans relative pb-24">
            {/* Hero Section */}
            <div className="relative h-[45vh] bg-[var(--bg-secondary)] overflow-hidden rounded-b-[4rem] shadow-2xl">
                <img src={venue.img} alt={venue.name} className="w-full h-full object-cover opacity-90 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <header className="absolute top-0 left-0 w-full p-6 pt-12 flex justify-between items-center z-20">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="w-12 h-12 bg-amber-400 text-black rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-all border-2 border-white/20 hover:bg-amber-300"
                        id="back-button"
                    >
                        <ArrowLeft size={24} strokeWidth={3} />
                    </button>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsLiked(!isLiked)}
                            title="Like Venue"
                            className={`w-12 h-12 backdrop-blur-xl rounded-2xl flex items-center justify-center border-2 transition-all active:scale-90 ${isLiked ? 'bg-white text-red-500 border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-black/40 border-white/20 text-white hover:border-white/50'}`}
                        >
                            <Heart size={20} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} />
                        </button>
                        <button 
                            onClick={handleShare}
                            title="Share Venue"
                            className="w-12 h-12 bg-red-600 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border-2 border-white/20 hover:bg-red-500 active:scale-90 transition-all shadow-lg"
                        >
                            <Share2 size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </header>

                <div className="absolute bottom-10 left-0 w-full px-8 z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-brand/20 border border-brand/30 rounded-full">
                            <ShieldCheck size={12} className="text-brand" />
                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-brand">Verified Partner</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">{venue.name}</h1>
                    
                    <div className="flex flex-col gap-2 mt-3 text-gray-400">
                        {venue.address ? (
                            <div className="flex items-center gap-1.5">
                                <MapPin size={12} className="text-brand" />
                                <span className="text-[9px] md:text-[11px] lg:text-xs font-bold uppercase tracking-widest">{venue.address}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <MapPin size={12} className="text-brand" />
                                <span className="text-[9px] md:text-[11px] lg:text-xs font-bold uppercase tracking-widest">Digital Network Partner</span>
                            </div>
                        )}
                        {venue.workingHours && (
                            <div className="flex items-center gap-1.5">
                                <Clock size={12} className="text-brand" />
                                <span className="text-[9px] md:text-[11px] lg:text-xs font-bold uppercase tracking-widest">{venue.workingHours}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 max-w-lg mx-auto space-y-10 -mt-6 relative z-20">
                {/* Reward Banner */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-[2.5rem] bg-brand text-black shadow-2xl shadow-brand/20 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest opacity-80">Active Membership Reward</p>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">{venue.offer}</h2>
                    </div>
                    <div className="w-12 h-12 bg-black/10 rounded-2xl flex items-center justify-center">
                        <Sparkles size={24} />
                    </div>
                </motion.div>

                {/* Primary Action Section */}
                <section className="space-y-4">
                    <button 
                        onClick={() => navigate('/venue/menu', { state: { venueName: venue.name, venueAddress: venue.address, venueOffer: venue.offer, emailKey: venue.emailKey, email: venue.email, category: venue.category } })}
                        className="w-full p-6 bg-[var(--bg-secondary)] border border-brand/30 rounded-[3rem] flex items-center justify-between group hover:border-brand/60 transition-all shadow-xl"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                                <Menu size={28} />
                            </div>
                             <div className="text-left">
                                <h4 className="text-xl font-black italic uppercase tracking-tighter text-primary">OFFERS</h4>
                            </div>
                        </div>
                        <ChevronRight size={24} className="text-secondary group-hover:text-brand transition-colors" />
                    </button>
                </section>

                {/* Ticket & Event Category Selector - STADIUMS ONLY */}
                {isStadium && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-lg md:text-xl font-black italic uppercase tracking-tighter flex items-center gap-2 text-[var(--text-primary)]">
                                <Ticket size={20} className="text-brand" /> Ticket Kategorien
                            </h3>
                            <span className="text-[9px] md:text-[11px] font-black text-brand uppercase tracking-widest bg-brand/10 px-3 py-1 rounded-full border border-brand/20">
                                Wähle deine Eintrittskarte
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {ticketCategories.map((cat) => {
                                const IconComponent = cat.icon;
                                const isSelected = selectedTicketCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            setSelectedTicketCategory(cat.id);
                                            navigate('/venue/menu', { 
                                                state: { 
                                                    venueName: venue.name, 
                                                    venueAddress: venue.address, 
                                                    venueOffer: venue.offer, 
                                                    emailKey: venue.emailKey, 
                                                    email: venue.email, 
                                                    category: venue.category, 
                                                    ticketCategoryFilter: cat.id 
                                                } 
                                            });
                                        }}
                                        className={`p-4 rounded-[2rem] border transition-all text-left flex flex-col justify-between group cursor-pointer shadow-md bg-[var(--bg-secondary)] ${
                                            isSelected 
                                                ? 'border-2 border-brand ring-2 ring-brand/20 shadow-lg scale-[1.02]' 
                                                : 'border-[var(--border-main)] hover:border-brand/50 hover:bg-brand/5'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-brand/20 text-brand border border-brand/40 shadow-sm' : 'bg-brand/10 text-brand'}`}>
                                                <IconComponent size={20} />
                                            </div>
                                            <ChevronRight size={16} className={isSelected ? 'text-brand' : 'text-gray-400 group-hover:text-brand'} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs md:text-sm font-black uppercase tracking-wider italic leading-tight text-[var(--text-primary)]">{cat.label}</h4>
                                            <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest mt-0.5 text-[var(--text-secondary)] opacity-70">
                                                {cat.sub}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Partner Feed */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                            <LayoutGrid size={20} className="text-brand" /> Live Feed
                        </h3>
                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Updates from Manager</span>
                    </div>

                    {isLoadingFeed ? (
                        <div className="py-12 text-center text-xs md:text-sm lg:text-base text-gray-500 font-bold uppercase tracking-widest">
                            Syncing Feed...
                        </div>
                    ) : mediaItems.length > 0 && activeMedia ? (
                        <>
                            <motion.div key={activeMedia.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative rounded-[3rem] overflow-hidden bg-[var(--bg-secondary)] border border-white/5 aspect-video shadow-2xl">
                                <img src={activeMedia.url} alt={activeMedia.title} className="w-full h-full object-cover" />
                                {activeMedia.type === 'video' && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-brand/90 flex items-center justify-center text-dark-950 shadow-2xl"><Play size={32} className="ml-1" /></div>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute bottom-0 left-0 w-full p-6">
                                    <h4 className="text-lg font-black italic uppercase text-white leading-tight drop-shadow-md">{activeMedia.title}</h4>
                                    <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-gray-200 mt-1 uppercase tracking-wider line-clamp-2 drop-shadow-sm">{activeMedia.description}</p>
                                </div>
                            </motion.div>

                            <div className="p-6 bg-dark-900 border border-white/5 rounded-[2.5rem] relative">
                                <div className="absolute -top-3 left-8 px-3 py-1 bg-brand text-black rounded-full text-[7px] font-black uppercase tracking-widest">Manager's Dispatch 💬</div>
                                <p className="text-[11px] md:text-sm lg:text-base font-bold italic text-primary leading-relaxed">{activeMedia.managerNote}</p>
                            </div>

                            <div className="flex gap-4 overflow-x-auto no-scrollbar px-2">
                                {mediaItems.map((item) => (
                                    <button 
                                        key={item.id} 
                                        onClick={() => setActiveMedia(item)} 
                                        className={`flex-shrink-0 w-24 h-24 rounded-3xl overflow-hidden border-2 transition-all ${activeMedia.id === item.id ? 'border-brand scale-105 shadow-lg shadow-brand/20' : 'border-white/10 opacity-70 hover:opacity-100'}`}
                                    >
                                        <img src={item.url} className="w-full h-full object-cover" alt="Thumbnail" />
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="py-16 text-center space-y-4 bg-[var(--bg-secondary)]/25 rounded-[3rem] border border-dashed border-white/10">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-gray-600">
                                <Info size={30} />
                            </div>
                            <div>
                                <p className="text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-gray-400">No updates yet</p>
                                <p className="text-[8px] md:text-[10px] lg:text-xs font-bold uppercase tracking-widest text-gray-600 mt-2 px-8">The manager has not published any live updates or feeds for this location.</p>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default PartnerDetailsPage;
