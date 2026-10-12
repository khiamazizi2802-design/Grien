import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, UserPlus, ChevronRight, Heart, MessageCircle, Share2, Plus, Zap, MapPin, Flag, Send, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../config/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';

const PostsFeed = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { mutualFriends, setMutualFriends } = useRide();
    
    // Notch State from LocalStorage
    const useSafeArea = localStorage.getItem('green_manager_use_safe_area') !== 'false';
    const notchAdjustment = parseInt(localStorage.getItem('green_manager_notch_adjustment') || (window.innerWidth < 768 ? '16' : '0'), 10);

    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Like system state
    const [likedPosts, setLikedPosts] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('green_posts_likes') || '{}');
        } catch {
            return {};
        }
    });

    // Custom comment system state
    const [postsComments, setPostsComments] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('green_posts_comments') || '{}');
        } catch {
            return {};
        }
    });
    const [showCommentsForPost, setShowCommentsForPost] = useState(null);
    const [newCommentText, setNewCommentText] = useState('');

    // Share system state
    const [showShareForPost, setShowShareForPost] = useState(null);
    const [selectedShareFriends, setSelectedShareFriends] = useState([]);

    // Create post state
    const [captionText, setCaptionText] = useState('');
    const [selectedMedia, setSelectedMedia] = useState('https://images.unsplash.com/photo-1549239120-0a4c321d1bc1?q=80&w=600&auto=format&fit=crop');

    // Dynamic Friends list loaded from Firestore
    const [friendsList, setFriendsList] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const q = query(collection(db, 'users'), limit(20));
                const querySnapshot = await getDocs(q);
                const loaded = [];
                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.email && data.email.toLowerCase() !== user?.email?.toLowerCase()) {
                        const name = data.name || 'Anonymous User';
                        const handle = '@' + name.toLowerCase().replace(/[^a-z0-9]/g, '');
                        loaded.push({
                            id: doc.id,
                            name: name,
                            handle: handle,
                            avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
                        });
                    }
                });
                
                setFriendsList(loaded);
            } catch (err) {
                console.error("Failed to fetch friends from Firestore:", err);
            }
        };
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen, user]);

    const [localPosts, setLocalPosts] = useState([]);

    React.useEffect(() => {
        const storedPosts = JSON.parse(localStorage.getItem('green_global_posts') || '[]');
        setLocalPosts(storedPosts);
    }, [isOpen]);

    const defaultPosts = [
        { id: 1, type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-city-traffic-at-night-1002-large.mp4', user: 'StreetVibes', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Street', likesCount: 12400, greenFlags: 842, caption: 'Cyber city vibes tonight. ⚡ #NeonRide' },
        { id: 101, type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-bartender-pouring-a-drink-into-a-glass-42544-large.mp4', user: 'SkylineBar', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Skyline', likesCount: 840, greenFlags: 2150, caption: 'New Summer Cocktails are here! 🍹 #SkylineVibes', isBusiness: true },
        { id: 2, type: 'photo', url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?q=80&w=1080&auto=format&fit=crop', user: 'ParisLover', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Paris', likesCount: 8420, greenFlags: 124, caption: 'Destination reached. The future is Green. 🗼' },
    ];

    const posts = [...localPosts, ...defaultPosts];

    // Toggle Like
    const handleLikeToggle = (postId) => {
        const updated = { ...likedPosts, [postId]: !likedPosts[postId] };
        setLikedPosts(updated);
        localStorage.setItem('green_posts_likes', JSON.stringify(updated));
    };

    // Format like count beautifully
    const getLikesDisplay = (post) => {
        const isLiked = likedPosts[post.id];
        let baseCount = post.likesCount || 0;
        if (isLiked) {
            baseCount += 1;
        }
        if (baseCount >= 1000) {
            return (baseCount / 1000).toFixed(1) + 'K';
        }
        return baseCount.toString();
    };

    // Comments System Handlers
    const handleOpenComments = (postId) => {
        setShowCommentsForPost(postId);
        setNewCommentText('');
    };

    const getCommentsForPost = (postId) => {
        return postsComments[postId] || [];
    };

    const handleAddComment = () => {
        if (!newCommentText.trim() || showCommentsForPost === null) return;
        const currentComments = postsComments[showCommentsForPost] || [];

        const newComment = {
            user: user?.name || 'You',
            avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'You'}`,
            text: newCommentText.trim(),
            time: 'Just now'
        };

        const updated = {
            ...postsComments,
            [showCommentsForPost]: [...currentComments, newComment]
        };

        setPostsComments(updated);
        localStorage.setItem('green_posts_comments', JSON.stringify(updated));
        setNewCommentText('');
    };

    // Share System Handlers
    const handleOpenShare = (postId) => {
        setShowShareForPost(postId);
        setSelectedShareFriends([]);
    };

    const toggleSelectShareFriend = (friendId) => {
        if (selectedShareFriends.includes(friendId)) {
            setSelectedShareFriends(prev => prev.filter(id => id !== friendId));
        } else {
            setSelectedShareFriends(prev => [...prev, friendId]);
        }
    };

    const handleShareSubmit = () => {
        if (selectedShareFriends.length === 0) return;
        alert(`✈️ Shared post successfully with ${selectedShareFriends.length} friends!`);
        setShowShareForPost(null);
    };

    // Upload Post Handler
    const handleUploadPost = () => {
        if (!captionText.trim()) {
            alert('Please add a caption to your post!');
            return;
        }

        const newPost = {
            id: Date.now(),
            type: 'photo',
            url: selectedMedia,
            user: 'You',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
            likesCount: 0,
            greenFlags: 1,
            caption: captionText.trim()
        };

        const storedPosts = JSON.parse(localStorage.getItem('green_global_posts') || '[]');
        const updated = [newPost, ...storedPosts];
        localStorage.setItem('green_global_posts', JSON.stringify(updated));
        setLocalPosts(updated);

        // Reset state
        setCaptionText('');
        setIsCreating(false);
        alert('🎉 Post successfully uploaded to Green Feed!');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed inset-0 z-[60] bg-black flex flex-col"
                >
                    {/* Top Controls */}
                    <header 
                        className="absolute top-0 left-0 right-0 pb-6 px-6 grid grid-cols-3 items-center z-[70] bg-gradient-to-b from-black/80 to-transparent transition-all duration-300" 
                        style={{ paddingTop: `calc(${useSafeArea ? 'env(safe-area-inset-top, 0px)' : '0px'} + ${notchAdjustment}px + 1.25rem)` }}
                    >
                        {/* Left: Search Bar */}
                        <div className="relative group">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isSearching ? 'text-brand' : 'text-gray-500'}`} size={16} />
                            <input 
                                type="text"
                                placeholder="Search friends..."
                                value={searchQuery}
                                onFocus={() => setIsSearching(true)}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-dark-900/40 backdrop-blur-xl border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[10px] md:text-xs lg:text-sm font-black italic text-white placeholder:text-gray-600 focus:border-brand/40 outline-none transition-all"
                            />
                            
                            {/* Search Results Dropdown */}
                            <AnimatePresence>
                                {isSearching && searchQuery.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full left-0 mt-2 bg-dark-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 shadow-2xl z-[80] w-[280px] sm:w-[320px]"
                                    >
                                        {friendsList
                                            .filter(f => 
                                                f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                f.handle.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map(f => {
                                                const isAlreadyFriend = mutualFriends.some(m => m.id === f.id);
                                                return (
                                                    <div key={f.id} className="p-3 flex items-center justify-between hover:bg-white/5 rounded-xl transition-all group">
                                                        <div className="flex items-center gap-3">
                                                            <img src={f.avatar} className="w-8 h-8 rounded-lg border border-white/10" alt="User" />
                                                            <div>
                                                                <p className="text-[10px] md:text-xs lg:text-sm font-black italic text-white">{f.name}</p>
                                                                <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-500 font-bold uppercase tracking-widest">{f.handle}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => {
                                                                    if (!isAlreadyFriend) {
                                                                        setMutualFriends(prev => [
                                                                            ...prev,
                                                                            {
                                                                                id: f.id,
                                                                                name: f.name,
                                                                                username: f.handle,
                                                                                avatar: f.avatar,
                                                                                status: 'Online',
                                                                                mutuals: Math.floor(Math.random() * 15) + 5,
                                                                                rank: 'New Member'
                                                                            }
                                                                        ]);
                                                                    }
                                                                }} 
                                                                className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${isAlreadyFriend ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-brand text-dark-950 shadow-[0_0_15px_rgba(52,211,153,0.4)] hover:scale-110 active:scale-95'}`}
                                                                title={isAlreadyFriend ? "Friends" : "Add Friend"}
                                                                disabled={isAlreadyFriend}
                                                            >
                                                                {isAlreadyFriend ? <Check size={18} /> : <UserPlus size={18} />}
                                                            </button>
                                                            <button 
                                                                onClick={() => { setIsSearching(false); setSearchQuery(''); navigate(`/profile/${f.id}`); onClose(); }} 
                                                                className="h-9 w-9 bg-black border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all shadow-xl"
                                                                title="View Profile"
                                                            >
                                                                <ChevronRight size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Middle: Centered Tabs */}
                        <div className="flex items-center justify-center gap-6">
                            <span className="text-white text-sm font-black italic tracking-tighter opacity-70 cursor-pointer hover:opacity-100 transition-opacity">Following</span>
                            <span className="text-white text-sm font-black italic tracking-tighter underline decoration-brand decoration-[3px] underline-offset-8 cursor-pointer">For You</span>
                        </div>

                        {/* Right: Close Button */}
                        <div className="flex justify-end">
                            <button onClick={onClose} className="w-10 h-10 bg-dark-900/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:border-brand/40 transition-all active:scale-90">
                                <X size={20} />
                            </button>
                        </div>
                    </header>

                    <div onClick={() => setIsSearching(false)} className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar">
                        {posts.map((post) => {
                            const isLiked = likedPosts[post.id];
                            return (
                                <div key={post.id} className="relative h-screen w-full snap-start overflow-hidden">
                                    {post.type === 'video' || post.url.startsWith('data:video') || post.url.endsWith('.mp4') || post.url.includes('mixkit') ? (
                                        <video
                                            src={post.url}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                        />
                                    ) : (
                                        <img src={post.url} alt="Post" className="w-full h-full object-cover" />
                                    )}

                                    {/* Interaction Sidebar (Neon Wireframes) */}
                                    <div className="absolute right-4 bottom-32 flex flex-col gap-6 items-center z-[70]">
                                        {user && (user.role === 'manager' || user.role === 'driver' || user.role === 'staff' || user.email?.toLowerCase() === 'driver@green.de') && (
                                            <button
                                                onClick={() => setIsCreating(true)}
                                                className="w-12 h-12 bg-brand rounded-full flex items-center justify-center text-dark-950 shadow-[0_0_20px_rgba(52,211,153,0.5)] mb-4 animate-bounce hover:scale-110 active:scale-95 transition-transform"
                                            >
                                                <Plus size={28} />
                                            </button>
                                        )}
                                        
                                        {/* LIKE BUTTON */}
                                        <button 
                                            onClick={() => handleLikeToggle(post.id)}
                                            className="flex flex-col items-center group active:scale-90 transition-transform"
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${isLiked ? 'bg-brand text-dark-950 border-brand shadow-[0_0_20px_rgba(52,211,153,0.5)]' : 'bg-black/60 backdrop-blur-md border-brand/50 text-brand shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:bg-brand/10'}`}>
                                                <Heart size={24} fill={isLiked ? "currentColor" : "none"} className="transition-all" />
                                            </div>
                                            <span className="text-[11px] md:text-sm lg:text-base font-black text-white mt-1.5 drop-shadow-lg">{getLikesDisplay(post)}</span>
                                        </button>

                                        {/* COMMENT BUTTON */}
                                        <button 
                                            onClick={() => handleOpenComments(post.id)}
                                            className="flex flex-col items-center group active:scale-90 transition-transform"
                                        >
                                            <div className="w-12 h-12 bg-black/60 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-white/10 transition-colors">
                                                <MessageCircle size={24} />
                                            </div>
                                            <span className="text-[11px] md:text-sm lg:text-base font-black text-white mt-1.5 drop-shadow-lg">
                                                {getCommentsForPost(post.id).length}
                                            </span>
                                        </button>

                                        {/* SHARE BUTTON */}
                                        <button 
                                            onClick={() => handleOpenShare(post.id)}
                                            className="flex flex-col items-center group active:scale-90 transition-transform"
                                        >
                                            <div className="w-12 h-12 bg-black/60 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-white/10 transition-colors">
                                                <Share2 size={24} />
                                            </div>
                                            <span className="text-[9px] md:text-[11px] lg:text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Share</span>
                                        </button>
                                    </div>

                                    {/* Content Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-black via-black/50 to-transparent z-[65]">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl border border-brand p-0.5 bg-dark-900">
                                                <img src={post.avatar} alt="User" className="w-full h-full rounded-lg" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black italic tracking-tighter text-white">@{post.user}</span>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className={`text-[8px] md:text-[10px] lg:text-xs ${post.isBusiness ? 'text-violet-400' : 'text-brand'} font-black uppercase tracking-widest flex items-center gap-1`}>
                                                        <div className={`w-1 h-1 ${post.isBusiness ? 'bg-violet-400' : 'bg-brand'} rounded-full animate-pulse`} /> {post.isBusiness ? 'Business Partner' : 'Official Pilot'}
                                                    </span>
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                                                        <Flag size={8} className="text-emerald-500" fill="currentColor" />
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-emerald-500">{post.greenFlags}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-200 font-medium leading-relaxed max-w-[80%]">{post.caption}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Interactive Comments Drawer */}
                    <AnimatePresence>
                        {showCommentsForPost !== null && (
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                className="absolute bottom-0 left-0 right-0 h-[60vh] bg-[#0A111E]/95 backdrop-blur-2xl border-t border-brand/20 rounded-t-[2rem] flex flex-col z-[90] p-6 shadow-2xl"
                            >
                                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 cursor-pointer" onClick={() => setShowCommentsForPost(null)} />
                                <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-4">
                                    <span className="text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-brand">Comments ({getCommentsForPost(showCommentsForPost).length})</span>
                                    <button onClick={() => setShowCommentsForPost(null)} className="text-secondary hover:text-primary active:scale-90">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-4">
                                    {getCommentsForPost(showCommentsForPost).map((c, i) => (
                                        <div key={i} className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <img src={c.avatar} className="w-8 h-8 rounded-lg border border-white/10 shrink-0" alt="Avatar" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] md:text-xs lg:text-sm font-black italic text-brand">@{c.user}</span>
                                                    <span className="text-[7px] text-gray-500 uppercase tracking-widest">{c.time}</span>
                                                </div>
                                                <p className="text-xs md:text-sm lg:text-base text-primary font-medium mt-1">{c.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 border-t border-white/5 flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Write a comment..."
                                        value={newCommentText}
                                        onChange={(e) => setNewCommentText(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
                                        className="flex-1 bg-btn-sec border border-main rounded-xl px-4 py-3 text-xs md:text-sm lg:text-base outline-none text-primary focus:border-brand/40 transition-colors"
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        className="px-4 bg-brand text-dark-900 rounded-xl text-xs md:text-sm lg:text-base font-black uppercase flex items-center justify-center gap-1 active:scale-95 transition-transform"
                                    >
                                        <Send size={12} />
                                        <span>Post</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Interactive Share Sheet */}
                    <AnimatePresence>
                        {showShareForPost !== null && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-[95]"
                            >
                                <div className="w-full max-w-[360px] bg-dark-900 border border-brand/20 rounded-[2rem] p-6 shadow-2xl space-y-6">
                                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                        <span className="text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-brand">Share with friends</span>
                                        <button onClick={() => setShowShareForPost(null)} className="text-secondary hover:text-primary active:scale-90">
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto no-scrollbar">
                                        {mutualFriends.map(f => {
                                            const isSelected = selectedShareFriends.includes(f.id);
                                            return (
                                                <div 
                                                    key={f.id} 
                                                    onClick={() => toggleSelectShareFriend(f.id)}
                                                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col items-center text-center gap-2 ${isSelected ? 'bg-brand/10 border-brand text-brand' : 'bg-dark-950 border-white/5 text-secondary hover:border-white/10'}`}
                                                >
                                                    <img src={f.avatar} className="w-12 h-12 rounded-xl border border-white/10" alt="Friend" />
                                                    <div>
                                                        <p className="text-[10px] md:text-xs lg:text-sm font-black italic text-primary">{f.name}</p>
                                                        <p className="text-[8px] md:text-[10px] lg:text-xs opacity-40 font-bold uppercase mt-0.5">{f.username}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={handleShareSubmit}
                                        disabled={selectedShareFriends.length === 0}
                                        className={`w-full py-4 rounded-xl text-xs md:text-sm lg:text-base font-black uppercase tracking-widest transition-all ${selectedShareFriends.length > 0 ? 'bg-brand text-dark-900 shadow-lg shadow-brand/20 active:scale-95' : 'bg-btn-sec text-muted cursor-not-allowed'}`}
                                    >
                                        Share Now ({selectedShareFriends.length})
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Post Creation Modal */}
                    <AnimatePresence>
                        {isCreating && (
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="absolute inset-0 z-[80] bg-[var(--bg-primary)] flex flex-col"
                            >
                                <header 
                                    className="pb-6 px-6 flex justify-between items-center border-b border-white/5 bg-gradient-to-b from-black/20 to-transparent transition-all duration-300" 
                                    style={{ paddingTop: `calc(${useSafeArea ? 'env(safe-area-inset-top, 0px)' : '0px'} + ${notchAdjustment}px + 1.25rem)` }}
                                >
                                    <button onClick={() => setIsCreating(false)} className="text-[var(--text-primary)] font-black uppercase text-xs md:text-sm lg:text-base tracking-widest active:scale-90 transition-transform">Cancel</button>
                                    <h3 className="font-black italic text-brand tracking-tighter uppercase">New Green Post</h3>
                                    <button 
                                        onClick={handleUploadPost} 
                                        disabled={!captionText.trim()} 
                                        className={`font-black uppercase text-xs md:text-sm lg:text-base tracking-widest transition-colors ${captionText.trim() ? 'text-brand active:scale-90 transition-transform' : 'text-gray-600 cursor-not-allowed'}`}
                                    >
                                        Share
                                    </button>
                                </header>

                                <div className="flex-1 p-8 flex flex-col items-center justify-center gap-8 overflow-y-auto no-scrollbar">
                                    <div 
                                        onClick={() => {
                                            // Cycle through some high-quality mock media options for sandbox testing
                                            const options = [
                                                'https://images.unsplash.com/photo-1549239120-0a4c321d1bc1?q=80&w=600&auto=format&fit=crop',
                                                'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=600&auto=format&fit=crop',
                                                'https://images.unsplash.com/photo-1533045607062-a5e2f75a74e5?q=80&w=600&auto=format&fit=crop'
                                            ];
                                            const nextIdx = (options.indexOf(selectedMedia) + 1) % options.length;
                                            setSelectedMedia(options[nextIdx]);
                                        }}
                                        className="w-full aspect-square rounded-[2rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 hover:border-brand/40 hover:text-brand transition-all cursor-pointer group relative overflow-hidden"
                                    >
                                        <img src={selectedMedia} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity" alt="Post preview" />
                                        <div className="relative z-10 w-16 h-16 rounded-full bg-dark-900 border border-white/5 flex items-center justify-center text-gray-400 mb-2 group-hover:scale-110 transition-transform shadow-lg">
                                            <Plus size={30} className="text-brand" />
                                        </div>
                                        <p className="relative z-10 font-black uppercase tracking-widest text-[9px] md:text-[11px] lg:text-xs text-white">Tap to change mock image</p>
                                    </div>

                                    <textarea
                                        placeholder="Add a caption to your mission..."
                                        value={captionText}
                                        onChange={(e) => setCaptionText(e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium text-[var(--text-primary)] outline-none resize-none h-24"
                                    />

                                    <div className="w-full flex gap-4">
                                        <div 
                                            onClick={() => alert("Mock: Picked Current Location!")}
                                            className="flex-1 p-4 bg-[var(--bg-secondary)] rounded-2xl border border-white/5 flex items-center gap-3 cursor-pointer hover:border-brand/20 active:scale-95 transition-transform"
                                        >
                                            <MapPin size={20} className="text-brand" />
                                            <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-400">Add Location</span>
                                        </div>
                                        <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-white/5">
                                            <Zap size={20} className="text-brand animate-pulse" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <button 
                                        onClick={handleUploadPost}
                                        className="w-full py-5 bg-brand text-dark-950 rounded-3xl font-black uppercase tracking-[0.4em] italic text-xs md:text-sm lg:text-base shadow-[0_0_30px_rgba(52,211,153,0.3)] active:scale-95 transition-transform"
                                    >
                                        Upload
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PostsFeed;
