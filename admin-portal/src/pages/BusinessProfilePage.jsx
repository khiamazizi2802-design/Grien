import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Heart, MessageCircle, Share2, Star, 
    Utensils, ShoppingBag, MapPin, Globe, Clock, 
    ChevronRight, CheckCircle, Activity, Zap, Info,
    Plus, Play, ImageIcon, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BusinessProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('feed');
    const [isFollowed, setIsFollowed] = useState(false);

    // Mock Business Data
    const business = {
        name: id || 'Skyline Lounge',
        handle: `@${id?.toLowerCase().replace(/\s+/g, '_') || 'skyline_lounge'}`,
        type: 'VVIP Nightclub & Bar',
        rating: 4.9,
        reviews: 1240,
        followers: '24.1K',
        description: 'Frankfurt\'s premier rooftop experience. High-end mixology, curated beats, and the best sunset views in the city.',
        address: 'Taunustor 1, 60310 Frankfurt am Main',
        hours: 'Tue - Sun | 18:00 - 04:00',
        coverImage: 'https://images.unsplash.com/photo-1574096079513-d8259312b785?q=80&w=1200&auto=format&fit=crop',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id || 'Skyline'}`,
        posts: [
            { id: 1, type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-bartender-pouring-a-drink-into-a-glass-42544-large.mp4', likes: '1.2K', caption: 'Crafting the Weekend. 🍹 #Mixology' },
            { id: 2, type: 'photo', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800&auto=format&fit=crop', likes: '840', caption: 'Summer Terrace is now OPEN. ☀️' },
            { id: 3, type: 'photo', url: 'https://images.unsplash.com/photo-1551024601-8f230c6c64b9?q=80&w=800&auto=format&fit=crop', likes: '2.1K', caption: 'Tonight\'s Special: Wagyu Sliders. 🍔' }
        ],
        menuHighlights: [
            { name: 'Neon Martini', price: '€18.00', desc: 'Gin, Electric Blue Curacao, Citrus' },
            { name: 'Skyline Platter', price: '€42.00', desc: 'Premium Selection of Tapas' }
        ],
        offers: [
            { title: 'Sunset Happy Hour', desc: '50% off all cocktails from 18:00 to 20:00', code: 'SKY50' },
            { title: 'VVIP Table Perk', desc: 'Complimentary bottle of Champagne for groups of 6+', code: 'BUBBLES' }
        ]
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[#05080F] text-white font-sans pb-20 overflow-x-hidden">
            {/* Hero Section */}
            <header className="relative h-[40vh] w-full overflow-hidden">
                <img src={business.coverImage} className="w-full h-full object-cover opacity-60" alt="Cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05080F] via-transparent to-black/40" />
                
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center hover:bg-brand hover:text-dark-900 transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <button className="w-10 h-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center hover:bg-brand hover:text-dark-900 transition-all">
                        <Share2 size={20} />
                    </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end justify-between">
                    <div className="flex items-end gap-6">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-24 h-24 rounded-[2rem] border-4 border-brand bg-dark-900 overflow-hidden shadow-2xl relative z-10"
                        >
                            <img src={business.avatar} className="w-full h-full object-cover" alt="Logo" />
                        </motion.div>
                        <div className="mb-2 space-y-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{business.name}</h1>
                                <CheckCircle size={20} className="text-violet-400" />
                            </div>
                            <p className="text-brand text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em]">{business.type}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Profile Content */}
            <main className="px-6 py-8 space-y-10">
                {/* Stats & Actions */}
                <section className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
                    <div className="flex gap-8">
                        <div>
                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Followers</p>
                            <p className="text-xl font-black italic text-white leading-none mt-1">{business.followers}</p>
                        </div>
                        <div>
                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Rating</p>
                            <p className="text-xl font-black italic text-brand leading-none mt-1 flex items-center gap-1">{business.rating} <Star size={14} fill="currentColor" /></p>
                        </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button 
                            onClick={() => setIsFollowed(!isFollowed)}
                            className={`flex-1 md:flex-none px-10 py-4 ${isFollowed ? 'bg-white/5 border border-white/10 text-white' : 'bg-brand text-dark-900 shadow-[0_0_30px_rgba(33,255,165,0.3)]'} rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm lg:text-base transition-all`}
                        >
                            {isFollowed ? 'Following' : 'Follow'}
                        </button>
                        <button className="flex-1 md:flex-none px-10 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm lg:text-base hover:bg-white/10 transition-all">Message</button>
                    </div>
                </section>

                {/* Tabs */}
                <section className="border-b border-white/5">
                    <div className="flex gap-10 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'feed', label: 'Live Feed', icon: Activity },
                            { id: 'menu', label: 'Menu Catalog', icon: Utensils },
                            { id: 'offers', label: 'VVIP Offers', icon: Zap },
                            { id: 'info', label: 'Business Info', icon: Info }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 pb-4 border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-brand text-brand' : 'border-transparent text-gray-500'}`}
                            >
                                <tab.icon size={16} />
                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Tab Panels */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="min-h-[40vh]"
                    >
                        {activeTab === 'feed' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {business.posts.map((post, i) => (
                                    <motion.div 
                                        key={post.id} 
                                        variants={itemVariants}
                                        className="aspect-[9/16] bg-dark-900 rounded-[2.5rem] border border-white/5 relative overflow-hidden group cursor-pointer"
                                    >
                                        {post.type === 'video' ? (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white z-10"><Play size={20} fill="currentColor" /></div>
                                                <video src={post.url} className="w-full h-full object-cover opacity-80" muted loop autoPlay />
                                            </div>
                                        ) : (
                                            <img src={post.url} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" alt="Post" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                                            <p className="text-[10px] md:text-xs lg:text-sm font-bold text-white line-clamp-2">{post.caption}</p>
                                            <div className="flex items-center gap-3 mt-2 text-brand">
                                                <Heart size={12} fill="currentColor" />
                                                <span className="text-[8px] md:text-[10px] lg:text-xs font-black">{post.likes}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                <motion.div 
                                    variants={itemVariants}
                                    className="aspect-[9/16] border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-700 hover:border-brand/30 hover:text-brand/50 transition-all"
                                >
                                    <Plus size={32} />
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase mt-2">More Content Coming</p>
                                </motion.div>
                            </div>
                        )}

                        {activeTab === 'menu' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-black italic uppercase text-white px-2">Signature <span className="text-brand">Highlights</span></h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {business.menuHighlights.map((item, i) => (
                                        <motion.div 
                                            key={i} 
                                            variants={itemVariants}
                                            className="p-8 bg-[#0D1421] border border-white/5 rounded-[2.5rem] flex justify-between items-center group hover:border-brand/40 transition-all"
                                        >
                                            <div>
                                                <h4 className="text-xl font-black italic uppercase text-white">{item.name}</h4>
                                                <p className="text-[10px] md:text-xs lg:text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">{item.desc}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black italic text-brand leading-none">{item.price}</p>
                                                <button className="mt-2 text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500 hover:text-brand transition-all flex items-center gap-1">Add to Order <Plus size={10} /></button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                <button className="w-full py-6 bg-white/5 border border-white/10 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-gray-400 hover:text-white transition-all">View Full Digital Menu Hub</button>
                            </div>
                        )}

                        {activeTab === 'offers' && (
                            <div className="space-y-6">
                                {business.offers.map((offer, i) => (
                                    <motion.div 
                                        key={i} 
                                        variants={itemVariants}
                                        className="p-10 bg-gradient-to-br from-violet-900/20 to-brand/10 border border-brand/20 rounded-[3.5rem] relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                            <Zap size={64} className="text-brand" />
                                        </div>
                                        <div className="relative z-10 space-y-4">
                                            <div className="px-3 py-1 bg-brand text-dark-900 text-[8px] md:text-[10px] lg:text-xs font-black uppercase rounded-lg w-fit">Active Offer</div>
                                            <div>
                                                <h4 className="text-3xl font-black italic uppercase text-white tracking-tighter">{offer.title}</h4>
                                                <p className="text-sm font-bold text-gray-400 mt-1">{offer.desc}</p>
                                            </div>
                                            <div className="flex items-center gap-4 pt-4">
                                                <div className="px-6 py-3 bg-black/40 rounded-xl border border-white/10 font-black italic text-brand uppercase tracking-widest">{offer.code}</div>
                                                <button className="px-8 py-3 bg-brand text-dark-900 rounded-xl font-black uppercase text-[10px] md:text-xs lg:text-sm tracking-widest shadow-lg shadow-brand/20">Apply to Tab</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'info' && (
                            <motion.div variants={itemVariants} className="space-y-10">
                                <div className="space-y-6 bg-white/5 border border-white/10 rounded-[3rem] p-10">
                                    <h4 className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-[0.2em] mb-4">Location & Access</h4>
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-dark-900 rounded-2xl flex items-center justify-center text-brand"><MapPin size={28} /></div>
                                        <div>
                                            <p className="text-sm font-black italic text-white uppercase">{business.address}</p>
                                            <button className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest mt-1 hover:text-brand transition-all flex items-center gap-1">Open in Mission Control <ChevronRight size={10} /></button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 pt-4">
                                        <div className="w-14 h-14 bg-dark-900 rounded-2xl flex items-center justify-center text-brand"><Clock size={28} /></div>
                                        <div>
                                            <p className="text-sm font-black italic text-white uppercase">{business.hours}</p>
                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-emerald-500 uppercase tracking-widest mt-1">Open Now</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col items-center gap-3">
                                        <Globe size={24} className="text-gray-500" />
                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-gray-400">Website</span>
                                    </div>
                                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col items-center gap-3">
                                        <ShoppingBag size={24} className="text-gray-500" />
                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-gray-400">Store Front</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Floating Navigation (Profile Action) */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#05080F] to-transparent pointer-events-none z-50">
                <div className="max-w-md mx-auto w-full pointer-events-auto">
                    <button 
                        onClick={() => navigate('/venue/menu')}
                        className="w-full py-6 bg-brand text-dark-900 rounded-[2.5rem] font-black uppercase tracking-[0.4em] italic text-sm shadow-[0_10px_50px_rgba(33,255,165,0.4)] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <ShoppingBag size={20} />
                        Book Table & Order Menu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BusinessProfilePage;
