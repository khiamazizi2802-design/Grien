import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, MessageSquare, Heart, Share2, MoreHorizontal, 
    Sparkles, Zap, Shield, Calendar, Users, UserPlus, Star, LayoutGrid, Image as ImageIcon, Video, Flag,
    MessageCircle
} from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useRide } from '../context/RideContext';
import { triggerNotification } from '../components/NotificationToast';

const UserProfilePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const { rideStatus, mutualFriends, setMutualFriends } = useRide();
    
    // Fallback if no state passed
    const friend = location.state?.friend || { 
        name: 'Marcus V.', 
        username: '@marcus_v', 
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', 
        status: 'Online', 
        rank: 'Green',
        mutuals: 12
    };

    const [activeTab, setActiveTab] = useState('posts');
    const [showRedFlagModal, setShowRedFlagModal] = useState(false);
    const isAlreadyFriend = mutualFriends.some(m => m.id === friend.id || m.name === friend.name);
    const [friendStatus, setFriendStatus] = useState(() => isAlreadyFriend ? 'added' : 'none');
    const [flagReason, setFlagReason] = useState('');

    // Social Interaction State
    const [likedPosts, setLikedPosts] = useState({});
    const [postComments, setPostComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [showComments, setShowComments] = useState({});
    const [activeShareMenu, setActiveShareMenu] = useState(null);

    const posts = [
        { 
            id: 1, 
            type: 'image',
            img: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80", 
            caption: "Vibe at Skyline Club tonight is unmatched. 🍸✨", 
            likes: 42, 
            comments: 5,
            time: "2h ago"
        },
        { 
            id: 2, 
            type: 'image',
            img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80", 
            caption: "Found this hidden gem. GreenRide took me right to the door. #RadarDiscovery", 
            likes: 89, 
            comments: 12,
            time: "5h ago"
        },
        { 
            id: 3, 
            type: 'text',
            content: "Who's heading to the Neon Bistro later? Proposing a 50/50 split on the group table. 🤙",
            likes: 15, 
            comments: 21,
            time: "Yesterday"
        }
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-brand/30 transition-colors duration-300">
            {/* Header / Cover */}
            <div className="relative h-48 w-full bg-[var(--bg-secondary)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-brand/20 to-[var(--bg-primary)] opacity-40" />
                <button 
                    onClick={() => {
                        if (rideStatus !== 'idle') {
                            navigate('/green-ride');
                        } else {
                            navigate(-1);
                        }
                    }}
                    className="absolute top-8 left-6 w-12 h-12 bg-[var(--bg-primary)]/80 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-brand z-20 shadow-xl"
                >
                    <ArrowLeft size={24} />
                </button>
                <button className="absolute top-8 right-6 w-12 h-12 bg-[var(--bg-primary)]/80 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-[var(--text-primary)] z-20 shadow-xl">
                    <Share2 size={20} />
                </button>
            </div>

            <div className="relative z-10 px-6 -mt-16 pb-32 max-w-lg mx-auto">
                {/* Profile Info */}
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <div className="w-32 h-32 rounded-[2.5rem] p-1 bg-gradient-to-tr from-brand to-brand-end shadow-2xl">
                            <img src={friend.avatar} alt={friend.name} className="w-full h-full rounded-[2.3rem] bg-[var(--bg-secondary)] border-4 border-[var(--bg-primary)]" />
                        </div>
                        <div className="absolute bottom-2 right-2 w-8 h-8 bg-brand border-4 border-[var(--bg-primary)] rounded-full flex items-center justify-center text-dark-900">
                            <Shield size={14} strokeWidth={3} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-[var(--text-primary)]">{friend.name}</h1>
                            <Star size={18} className="text-brand fill-brand animate-pulse" />
                        </div>
                        <p className="text-brand font-black uppercase tracking-[0.2em] text-[10px] md:text-xs lg:text-sm italic">{friend.username}</p>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <div className="px-6 py-3 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-center shadow-sm">
                            <span className="block text-xl font-black italic text-[var(--text-primary)]">{friend.mutuals}</span>
                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-900">Mutuals</span>
                        </div>
                        <div className="px-6 py-3 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-center shadow-sm">
                            <span className="block text-xl font-black italic text-[var(--text-primary)]">428</span>
                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-900">Reputation</span>
                        </div>
                        <div className="px-6 py-3 bg-brand/10 border border-brand/20 rounded-2xl text-center">
                            <span className="block text-xl font-black italic text-brand">{friend.rank}</span>
                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-brand">Status</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full mt-8">
                        <div className="flex gap-4">
                            <button 
                                onClick={() => {
                                    if (friendStatus === 'none') {
                                        setFriendStatus('pending');
                                    } else if (friendStatus === 'pending') {
                                        setFriendStatus('added');
                                        const isAlreadyFriend = mutualFriends.some(m => m.id === friend.id || m.name === friend.name);
                                        if (!isAlreadyFriend) {
                                            setMutualFriends(prev => [
                                                ...prev,
                                                {
                                                    id: friend.id || `u-${Date.now()}`,
                                                    name: friend.name,
                                                    username: friend.username || `@${friend.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                                                    avatar: friend.avatar || friend.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`,
                                                    status: friend.status || 'Online',
                                                    mutuals: friend.mutuals || 5,
                                                    rank: friend.rank || 'New Member'
                                                }
                                            ]);
                                        }
                                    } else {
                                        setFriendStatus('none');
                                        setMutualFriends(prev => prev.filter(m => m.id !== friend.id && m.name !== friend.name));
                                    }
                                }}
                                className={`flex-[2] py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] md:text-xs lg:text-sm italic transition-all flex items-center justify-center gap-2 shadow-xl ${
                                    friendStatus === 'added' ? 'bg-white text-dark-950 shadow-white/20' : 
                                    friendStatus === 'pending' ? 'bg-amber-500 text-white animate-pulse shadow-amber-500/20' :
                                    'bg-[#1A1A1A] text-white shadow-black/20'
                                }`}
                            >
                                <UserPlus size={16} />
                                {friendStatus === 'added' ? 'Friends' : friendStatus === 'pending' ? 'Pending Request' : 'Add Friend'}
                            </button>
                            <button className="flex-1 py-5 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] md:text-xs lg:text-sm italic text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-all shadow-sm">
                                Message
                            </button>
                        </div>
                        <button className="w-full py-5 bg-[#1A1A1A] text-white border border-white/10 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] md:text-xs lg:text-sm italic hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl">
                            Invite to Social Group
                        </button>
                    </div>

                    {/* BEHAVIORAL FLAGS */}
                    <div className="flex gap-3 mt-4 w-full px-2">
                        <button 
                            onClick={() => alert(`GREEN FLAG: Positive appraisal sent to ${friend.name}'s profile.`)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand/10 border border-brand/20 rounded-xl group hover:bg-brand/20 transition-all shadow-sm"
                        >
                            <Flag size={14} className="text-brand group-hover:scale-110 transition-transform" fill="currentColor" />
                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.2em] text-brand">Green Flag</span>
                        </button>
                        <button 
                            onClick={() => setShowRedFlagModal(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/20 rounded-xl group hover:bg-red-500/20 transition-all"
                        >
                            <Flag size={14} className="text-red-500 group-hover:scale-110 transition-transform" fill="currentColor" />
                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.2em] text-red-500">Red Flag</span>
                        </button>
                    </div>
                </div>

                {/* RED FLAG MODAL */}
                <AnimatePresence>
                    {showRedFlagModal && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                onClick={() => setShowRedFlagModal(false)}
                                className="absolute inset-0 bg-dark-950/90 backdrop-blur-xl"
                            />
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative w-full max-w-sm bg-dark-900 border border-red-500/20 rounded-[2.5rem] p-8 space-y-6 shadow-[0_20px_50px_rgba(239,68,68,0.2)]"
                            >
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto border border-red-500/20">
                                        <Flag size={32} fill="currentColor" />
                                    </div>
                                    <h3 className="text-xl font-black italic uppercase text-white">Initiate Red Flag?</h3>
                                    <div className="py-2 px-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                                        <p className="text-[7px] text-red-500 font-black uppercase tracking-[0.2em] leading-relaxed">
                                            ENFORCEMENT PROTOCOL: 3 FLAGS IN 2 MONTHS = 1 YEAR BLOCK. REPEAT VIOLATION = PERMANENT BAN.
                                        </p>
                                    </div>
                                    <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                                        Warning: This report will be audited. Abuse of the flagging system may result in your own account being flagged.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-400 uppercase tracking-widest ml-2 italic">State Violation Reason</p>
                                    <textarea 
                                        value={flagReason}
                                        onChange={(e) => setFlagReason(e.target.value)}
                                        placeholder="Type reason here..."
                                        className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-black italic text-white placeholder:text-gray-700 focus:border-red-500/50 outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => {
                                            if(!flagReason.trim()) {
                                                alert("MANDATORY: You must provide a reason for the Red Flag.");
                                                return;
                                            }
                                            alert(`MISSION LOGGED: Red Flag initiated against ${friend.name}.\nAudit in progress.`);
                                            setShowRedFlagModal(false);
                                            setFlagReason('');
                                        }}
                                        className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-xs md:text-sm lg:text-base shadow-lg shadow-red-500/20"
                                    >
                                        Submit Flag
                                    </button>
                                    <button 
                                        onClick={() => setShowRedFlagModal(false)}
                                        className="flex-1 py-4 bg-white/5 text-gray-500 rounded-2xl font-black uppercase text-xs md:text-sm lg:text-base hover:bg-white/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Tabs */}
                <div className="flex gap-8 border-b border-white/5 mt-12 mb-8 px-4">
                    {[
                        { id: 'posts', label: 'Timeline', icon: LayoutGrid },
                        { id: 'media', label: 'Media', icon: ImageIcon },
                        { id: 'clips', label: 'Clips', icon: Video }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 pb-4 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-brand' : 'text-gray-500'}`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Social Feed (Posts) */}
                <div className="space-y-8">
                    {posts.map((post) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={post.id} 
                            className="bg-dark-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                                        <img src={friend.avatar} alt="" className="w-full h-full" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] md:text-xs lg:text-sm font-black uppercase italic text-white leading-none">{friend.name}</h4>
                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-600 uppercase tracking-widest">{post.time}</span>
                                    </div>
                                </div>
                                <button className="text-gray-600 hover:text-white transition-colors">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                            {post.type === 'image' && (
                                <div className="aspect-square w-full overflow-hidden">
                                    <img src={post.img} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="p-6 space-y-4">
                                {post.caption && (
                                    <p className="text-xs md:text-sm lg:text-base font-medium text-gray-300 leading-relaxed italic">{post.caption}</p>
                                )}
                                {post.content && (
                                    <div className="p-6 bg-brand/5 border border-brand/10 rounded-2xl italic">
                                        <p className="text-sm font-bold text-white leading-relaxed">{post.content}</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-6">
                                        <button 
                                            onClick={() => setLikedPosts(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                                            className="flex items-center gap-2 group"
                                        >
                                            <Heart 
                                                size={18} 
                                                className={`${likedPosts[post.id] ? 'text-brand fill-brand' : 'text-gray-500'} group-hover:text-brand transition-colors`} 
                                            />
                                            <span className={`text-[10px] md:text-xs lg:text-sm font-black ${likedPosts[post.id] ? 'text-white' : 'text-gray-600'} group-hover:text-white`}>
                                                {likedPosts[post.id] ? post.likes + 1 : post.likes}
                                            </span>
                                        </button>
                                        <button 
                                            onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                                            className="flex items-center gap-2 group"
                                        >
                                            <MessageSquare 
                                                size={18} 
                                                className={`${showComments[post.id] ? 'text-brand' : 'text-gray-500'} group-hover:text-brand transition-colors`} 
                                            />
                                            <span className="text-[10px] md:text-xs lg:text-sm font-black text-gray-600 group-hover:text-white">
                                                {post.comments + (postComments[post.id]?.length || 0)}
                                            </span>
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <button 
                                            onClick={() => setActiveShareMenu(activeShareMenu === post.id ? null : post.id)}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeShareMenu === post.id ? 'bg-brand text-dark-950 shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'bg-white/5 text-gray-500 hover:text-brand'}`}
                                        >
                                            <Share2 size={16} />
                                        </button>

                                        {/* Platform Share Menu */}
                                        <AnimatePresence>
                                            {activeShareMenu === post.id && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.9, x: 10 }}
                                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, x: 10 }}
                                                    className="absolute bottom-full right-0 mb-3 bg-dark-950 border border-white/10 rounded-2xl p-2 flex gap-2 shadow-2xl z-50 whitespace-nowrap"
                                                >
                                                    {[
                                                        { id: 'whatsapp', icon: MessageCircle, color: 'text-emerald-500', label: 'WhatsApp' },
                                                        { id: 'insta', icon: ImageIcon, color: 'text-pink-500', label: 'Instagram' },
                                                        { id: 'messenger', icon: MessageSquare, color: 'text-blue-500', label: 'Messenger' },
                                                        { id: 'sms', icon: Zap, color: 'text-brand', label: 'Message' }
                                                    ].map((platform) => (
                                                        <button 
                                                            key={platform.id}
                                                            onClick={() => {
                                                                triggerNotification('SIGNAL TRANSMITTED', `Opening ${platform.label}...`);
                                                                setActiveShareMenu(null);
                                                                
                                                                // Deep Link Logic
                                                                const text = encodeURIComponent(`${post.caption || 'Check this out on GreenRide!'} #RadarRide`);
                                                                const links = {
                                                                    whatsapp: `https://wa.me/?text=${text}`,
                                                                    insta: `https://instagram.com/`,
                                                                    messenger: `https://www.messenger.com/`,
                                                                    sms: `sms:?body=${text}`
                                                                };
                                                                
                                                                window.open(links[platform.id], '_blank');
                                                            }}
                                                            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all group"
                                                        >
                                                            <platform.icon size={16} className={`${platform.color} group-hover:scale-110 transition-transform`} />
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Dynamic Comment Section */}
                                <AnimatePresence>
                                    {showComments[post.id] && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                                                {postComments[post.id]?.map((comment, idx) => (
                                                    <div key={idx} className="flex gap-2 items-start animate-in slide-in-from-left-2">
                                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand italic shrink-0">@You</span>
                                                        <p className="text-[10px] md:text-xs lg:text-sm text-gray-300 font-medium italic">{comment}</p>
                                                    </div>
                                                ))}
                                                <div className="relative group">
                                                    <input 
                                                        value={commentInputs[post.id] || ''}
                                                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && commentInputs[post.id]?.trim()) {
                                                                setPostComments(prev => ({ 
                                                                    ...prev, 
                                                                    [post.id]: [...(prev[post.id] || []), commentInputs[post.id]] 
                                                                }));
                                                                setCommentInputs(prev => ({ ...prev, [post.id]: '' }));
                                                            }
                                                        }}
                                                        placeholder="Write a secure comment..." 
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-[10px] md:text-xs lg:text-sm font-black italic text-white placeholder:text-gray-700 focus:border-brand/40 outline-none transition-all"
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <Zap size={10} className="text-brand opacity-40 group-focus-within:animate-pulse" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
