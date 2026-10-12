import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Settings, Heart, MessageSquare, Share2, MoreHorizontal, 
    Sparkles, Zap, Shield, ShieldCheck, Camera, Edit3, Star, LayoutGrid, Image as ImageIcon, Video, Plus,
    ShieldAlert, Flag, Handshake, Users, Bell, UserPlus, Check, Trash2, X as CloseIcon, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';
import { triggerNotification } from '../components/NotificationToast';
import { doc, updateDoc, collection, addDoc, getDocs, setDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db as fbDb, storage as fbStorage } from '../config/firebase';

const MyProfilePage = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuth();

    const [localAvatar, setLocalAvatar] = useState(() => {
        return user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Alex'}`;
    });

    useEffect(() => {
        if (user) {
            setLocalAvatar(user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || 'Alex'}`);
        }
    }, [user]);

    const [mockComplaints, setMockComplaints] = useState([]);

    const [activeTab, setActiveTab] = useState('posts');
    const [showRequests, setShowRequests] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null); // 0-100 or null
    const [isUploading, setIsUploading] = useState(false);

    const { incomingRequests, setIncomingRequests, setMutualFriends } = useRide();

    const [selectedPostId, setSelectedPostId] = useState(null);
    const [newCommentText, setNewCommentText] = useState("");
    const [myPosts, setMyPosts] = useState([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);

    // --- Load posts from Firestore on mount ---
    useEffect(() => {
        if (!user?.email) return;
        const loadPosts = async () => {
            setIsLoadingPosts(true);
            try {
                const postsCol = collection(fbDb, 'users', user.email.toLowerCase(), 'posts');
                const q = query(postsCol, orderBy('createdAt', 'desc'));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    setMyPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                } else if (user?.isDemo) {
                    // Demo users: seed sample posts into state (not Firestore)
                    setMyPosts([
                        {
                            id: 'demo-1',
                            type: 'image',
                            img: "https://images.unsplash.com/photo-1574096079513-d8259312b785?w=800&q=80",
                            caption: "Nothing beats the atmosphere at Green Underground tonight. ⚡",
                            likes: 124, comments: 2, time: "1h ago", liked: false,
                            commentsList: [
                                { id: 1, author: "Alex S.", text: "This looks absolutely incredible! 🔥", time: "30m ago" },
                                { id: 2, author: "Sofia M.", text: "Best vibe in town!", time: "10m ago" }
                            ]
                        },
                        {
                            id: 'demo-2',
                            type: 'video',
                            img: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80",
                            caption: "Testing the new 'Midnight Neon' cocktail. Pure art. 🍸",
                            likes: 215, comments: 1, time: "Yesterday", liked: false,
                            commentsList: [
                                { id: 1, author: "Elena R.", text: "That cocktail is a masterpiece! 🍸", time: "4h ago" }
                            ]
                        }
                    ]);
                }
            } catch (e) {
                console.error('Failed to load posts from Firestore:', e);
            } finally {
                setIsLoadingPosts(false);
            }
        };
        loadPosts();
    }, [user?.email]);

    const selectedPost = myPosts.find(p => String(p.id) === String(selectedPostId));

    const toggleLike = async (postId) => {
        setMyPosts(prevPosts => prevPosts.map(p => {
            if (String(p.id) === String(postId)) {
                const liked = !p.liked;
                return { ...p, liked, likes: liked ? p.likes + 1 : p.likes - 1 };
            }
            return p;
        }));
        // Persist like count to Firestore (skip for demo posts)
        if (!user?.isDemo && user?.email && !String(postId).startsWith('demo-')) {
            try {
                const post = myPosts.find(p => String(p.id) === String(postId));
                if (post) {
                    const newLiked = !post.liked;
                    await updateDoc(
                        doc(fbDb, 'users', user.email.toLowerCase(), 'posts', String(postId)),
                        { likes: newLiked ? post.likes + 1 : post.likes - 1, liked: newLiked }
                    );
                }
            } catch (e) { console.error('Failed to update like:', e); }
        }
    };

    const handleAddComment = async (postId) => {
        if (!newCommentText.trim()) return;
        const newComment = {
            id: Date.now(),
            author: user.name || 'Member',
            text: newCommentText,
            time: 'Just now'
        };
        setMyPosts(prevPosts => prevPosts.map(p => {
            if (String(p.id) === String(postId)) {
                return {
                    ...p,
                    comments: p.comments + 1,
                    commentsList: [...(p.commentsList || []), newComment]
                };
            }
            return p;
        }));
        setNewCommentText("");
        triggerNotification("COMMENT SECURELY POSTED", "SUCCESS");
        // Persist comment to Firestore
        if (!user?.isDemo && user?.email && !String(postId).startsWith('demo-')) {
            try {
                const post = myPosts.find(p => String(p.id) === String(postId));
                const updatedComments = [...(post?.commentsList || []), newComment];
                await updateDoc(
                    doc(fbDb, 'users', user.email.toLowerCase(), 'posts', String(postId)),
                    { comments: (post?.comments || 0) + 1, commentsList: updatedComments }
                );
            } catch (e) { console.error('Failed to save comment:', e); }
        }
    };

    // --- Upload helper: file → Firebase Storage → download URL ---
    const uploadToStorage = (file, path) => {
        return new Promise((resolve, reject) => {
            const storageRef = ref(fbStorage, path);
            const task = uploadBytesResumable(storageRef, file);
            task.on(
                'state_changed',
                (snap) => {
                    const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                    setUploadProgress(pct);
                },
                reject,
                async () => {
                    const url = await getDownloadURL(task.snapshot.ref);
                    resolve(url);
                }
            );
        });
    };

    const handleReelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        setUploadProgress(0);
        try {
            let mediaUrl;
            const postId = String(Date.now());
            if (user?.email && !user?.isDemo) {
                mediaUrl = await uploadToStorage(
                    file,
                    `posts/${user.email.toLowerCase()}/${postId}/media`
                );
            } else {
                mediaUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80";
            }
            const newReel = {
                id: postId,
                type: 'video',
                img: mediaUrl,
                videoUrl: mediaUrl,
                caption: `New Reel: ${file.name.replace(/\.[^/.]+$/, "")} 🎬`,
                likes: 0, comments: 0,
                time: 'Just now', liked: false, commentsList: [],
                createdAt: new Date().toISOString()
            };
            setMyPosts(prev => [newReel, ...prev]);
            setActiveTab('reels');
            // Save metadata to Firestore
            if (user?.email && !user?.isDemo) {
                const postsCol = collection(fbDb, 'users', user.email.toLowerCase(), 'posts');
                await setDoc(doc(postsCol, postId), newReel);
            }
            triggerNotification("REEL SECURELY UPLOADED", "SUCCESS");
        } catch (err) {
            console.error('Reel upload failed:', err);
            triggerNotification("UPLOAD FAILED", "ERROR");
        } finally {
            setIsUploading(false);
            setUploadProgress(null);
        }
    };

    const handleMomentUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        setUploadProgress(0);
        try {
            let mediaUrl;
            const postId = String(Date.now());
            if (user?.email && !user?.isDemo) {
                mediaUrl = await uploadToStorage(
                    file,
                    `posts/${user.email.toLowerCase()}/${postId}/media`
                );
            } else {
                mediaUrl = URL.createObjectURL(file);
            }
            const newMoment = {
                id: postId,
                type: 'image',
                img: mediaUrl,
                caption: `New Moment: ${file.name.replace(/\.[^/.]+$/, "")} 📸`,
                likes: 0, comments: 0,
                time: 'Just now', liked: false, commentsList: [],
                createdAt: new Date().toISOString()
            };
            setMyPosts(prev => [newMoment, ...prev]);
            setActiveTab('posts');
            // Save metadata to Firestore
            if (user?.email && !user?.isDemo) {
                const postsCol = collection(fbDb, 'users', user.email.toLowerCase(), 'posts');
                await setDoc(doc(postsCol, postId), newMoment);
            }
            triggerNotification("NEW MOMENT POSTED", "SUCCESS");
        } catch (err) {
            console.error('Moment upload failed:', err);
            triggerNotification("UPLOAD FAILED", "ERROR");
        } finally {
            setIsUploading(false);
            setUploadProgress(null);
        }
    };

    const displayedPosts = activeTab === 'reels' 
        ? myPosts.filter(p => p.type === 'video') 
        : myPosts;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-brand/30 transition-colors duration-300">
            {/* Header / Cover */}
            <div className="relative h-56 w-full bg-[var(--bg-secondary)] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1550966841-3ee7adac1af0?w=1200&q=80" className="w-full h-full object-cover opacity-20" alt="Cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-primary)]" />
                
                <button 
                    onClick={() => navigate('/home')}
                    className="absolute top-12 left-6 w-12 h-12 bg-[var(--bg-primary)]/80 backdrop-blur-md border border-[var(--border-main)] rounded-2xl flex items-center justify-center text-brand z-20 shadow-xl"
                >
                    <ArrowLeft size={24} />
                </button>
                
                {/* Social Requests Button - Top Right */}
                <button 
                    onClick={() => setShowRequests(true)}
                    className="absolute top-12 right-6 w-12 h-12 bg-[var(--bg-primary)]/80 backdrop-blur-md border border-[var(--border-main)] rounded-2xl flex items-center justify-center text-black z-20 shadow-xl group transition-all active:scale-95"
                >
                    <Users size={22} className="group-hover:text-brand transition-colors" />
                    {incomingRequests.length > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[var(--bg-primary)] shadow-[0_0_12px_#ef4444] animate-pulse" />
                    )}
                </button>

            </div>

            <div className="relative z-10 px-6 -mt-20 pb-32 max-w-lg mx-auto">
                {/* Profile Info */}
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                        <div className="w-40 h-40 rounded-[3rem] p-1.5 bg-gradient-to-tr from-brand via-brand-end to-brand shadow-[0_0_50px_rgba(52,211,153,0.3)]">
                            <img src={localAvatar} alt={user.name} className="w-full h-full rounded-[2.8rem] bg-[var(--bg-secondary)] border-8 border-[var(--bg-primary)] shadow-inner" />
                        </div>

                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-center gap-3">
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">{user.name}</h1>
                            <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center text-dark-900">
                                <Star size={14} fill="currentColor" />
                            </div>
                        </div>
                        <p className="text-brand font-black uppercase tracking-[0.3em] text-xs md:text-sm lg:text-base italic">{user.username}</p>
                    </div>

                    <div className="flex gap-4 mt-8 w-full">
                        <div className="flex-1 px-4 py-5 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-[2.5rem] text-center shadow-sm">
                            <span className="block text-4xl font-black italic text-brand leading-none drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">{user?.greenFlags || 0}</span>
                            <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-black/60 mt-1">Green Flags</span>
                        </div>
                        {user?.redFlags > 0 && (
                            <div className="flex-1 px-4 py-4 bg-red-500/5 border border-red-500/20 rounded-[2rem] text-center">
                                <span className="block text-2xl font-black italic text-red-500">{user.redFlags}</span>
                                <span className="text-[7px] font-black uppercase tracking-widest text-red-500">Red Flags</span>
                            </div>
                        )}
                    </div>

                    {/* Hidden Inputs */}
                    <input 
                        type="file" 
                        id="profile-pic-input" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file && user?.email) {
                                setIsUploading(true);
                                setUploadProgress(0);
                                try {
                                    let avatarUrl;
                                    if (!user?.isDemo) {
                                        avatarUrl = await uploadToStorage(
                                            file,
                                            `avatars/${user.email.toLowerCase()}/profile`
                                        );
                                    } else {
                                        // Demo fallback: use object URL
                                        avatarUrl = URL.createObjectURL(file);
                                    }
                                    setLocalAvatar(avatarUrl);
                                    const userDocRef = doc(fbDb, 'users', user.email.toLowerCase());
                                    await updateDoc(userDocRef, { avatar: avatarUrl });
                                    setUser({ ...user, avatar: avatarUrl });
                                    triggerNotification("AVATAR SECURELY UPDATED", "SUCCESS");
                                } catch (err) {
                                    console.error("Failed to upload avatar:", err);
                                    triggerNotification("AVATAR UPDATE FAILED", "ERROR");
                                } finally {
                                    setIsUploading(false);
                                    setUploadProgress(null);
                                }
                            }
                        }} 
                    />
                    <input 
                        type="file" 
                        id="reel-upload-input" 
                        className="hidden" 
                        accept="video/*" 
                        onChange={handleReelUpload} 
                    />
                    <input 
                        type="file" 
                        id="moment-upload-input" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleMomentUpload} 
                    />

                    {/* Identity Upload Center - Hardened High Contrast */}
                    <div className="w-full mt-10 p-1.5 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-[3rem] flex gap-2 shadow-2xl">
                        <button 
                            onClick={() => document.getElementById('profile-pic-input').click()}
                            className="flex-1 py-5 bg-[#1A1A1A] text-white border border-white/10 rounded-[2.5rem] font-black uppercase tracking-[0.2em] italic text-[10px] md:text-xs lg:text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                        >
                            <Camera size={16} /> Update Avatar
                        </button>
                        <button 
                            onClick={() => document.getElementById('reel-upload-input').click()}
                            className="flex-1 py-5 bg-[#1A1A1A] text-white border border-white/10 rounded-[2.5rem] font-black uppercase tracking-[0.2em] italic text-[10px] md:text-xs lg:text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                        >
                            <Video size={16} /> Post Reel
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex justify-between border-b border-white/5 mt-16 mb-8 px-6">
                    {[
                        { id: 'posts', label: 'Timeline', icon: LayoutGrid },
                        { id: 'reels', label: 'My Reels', icon: Video },
                        { id: 'complaints', label: 'Complaints', icon: ShieldAlert }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center gap-2 pb-4 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] italic transition-all relative ${activeTab === tab.id ? 'text-brand' : 'text-gray-900 opacity-60 hover:opacity-100'}`}
                        >
                            <tab.icon size={20} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div layoutId="my-tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-brand rounded-t-full shadow-[0_0_10px_var(--brand-glow)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Upload progress overlay */}
                {isUploading && (
                    <div className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-md flex flex-col items-center justify-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center">
                            <Loader2 size={36} className="text-brand animate-spin" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-sm font-black uppercase tracking-widest text-white">Uploading to Firebase</p>
                            <p className="text-brand font-black text-2xl">{uploadProgress ?? 0}%</p>
                        </div>
                        <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress ?? 0}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Grid Content */}
                <div className="w-full">
                    <AnimatePresence mode="wait">
                        {activeTab === 'complaints' ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                {mockComplaints.length > 0 ? (
                                    mockComplaints.map(c => (
                                        <div key={c.id} className="p-6 bg-white/5 rounded-[2rem] border border-white/5 flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500"><Flag size={20} /></div>
                                                <div>
                                                    <p className="text-sm font-black italic uppercase text-white">{c.business}</p>
                                                    <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{c.reason}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setMockComplaints(prev => prev.filter(i => i.id !== c.id))}
                                                className="px-4 py-2 bg-brand/10 border border-brand/20 text-brand rounded-xl text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest hover:bg-brand hover:text-dark-900 transition-all flex items-center gap-2"
                                            >
                                                <Handshake size={12} /> Revoke Flag
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center space-y-4">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-600 mx-auto"><ShieldCheck size={32} /></div>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-gray-500 tracking-[0.2em]">All accounts are in good standing.</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {displayedPosts.map((post) => (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileTap={{ scale: 0.97 }}
                                        key={post.id} 
                                        onClick={() => setSelectedPostId(post.id)}
                                        className="aspect-[3/4] bg-dark-900 border border-white/5 rounded-[2.5rem] overflow-hidden relative group cursor-pointer"
                                    >
                                        <img src={post.img} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                            <div className="flex items-center gap-1.5">
                                                <Heart size={12} className={`transition-colors ${post.liked ? 'text-red-500 fill-red-500' : 'text-brand fill-brand'}`} />
                                                <span className="text-[10px] md:text-xs lg:text-sm font-black">{post.likes}</span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                                                <MoreHorizontal size={14} />
                                            </div>
                                        </div>
                                        {post.type === 'video' && (
                                            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                                                <Video size={14} className="text-white" />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                                {/* Add Post Placeholder */}
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => document.getElementById('moment-upload-input').click()}
                                    className="aspect-[3/4] border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 text-gray-600 hover:text-brand hover:border-brand/40 transition-all bg-white/5"
                                >
                                    <div className="w-12 h-12 rounded-full bg-dark-950 border border-white/10 flex items-center justify-center">
                                        <Plus size={24} />
                                    </div>
                                    <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest">New Moment</span>
                                </motion.button>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Social Signals Overlay */}
            <AnimatePresence>
                {showRequests && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md"
                        onClick={() => setShowRequests(false)}
                    >
                        <motion.div 
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-lg bg-[var(--bg-primary)] rounded-t-[3rem] sm:rounded-[3.5rem] p-8 border-t sm:border border-[var(--border-main)] shadow-2xl space-y-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">Social Signals</h2>
                                    <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-brand">Incoming Connections</p>
                                </div>
                                <button 
                                    onClick={() => setShowRequests(false)}
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10"
                                >
                                    <CloseIcon size={20} />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar pr-2">
                                {incomingRequests.length > 0 ? (
                                    incomingRequests.map((req) => (
                                        <div key={req.id} className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-[2.5rem] flex items-center justify-between group hover:border-brand/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-[1.2rem] border-2 border-brand/20 p-1">
                                                    <img src={req.image} alt="" className="w-full h-full rounded-[0.8rem] object-cover" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black italic uppercase text-black tracking-tight">{req.name}</p>
                                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-brand uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                                                        <Sparkles size={10} /> Secure Signal Sent
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setIncomingRequests(prev => prev.filter(r => r.id !== req.id));
                                                        setMutualFriends(prev => [
                                                            ...prev,
                                                            {
                                                                id: req.id,
                                                                name: req.name,
                                                                username: `@${req.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                                                                avatar: req.image || req.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.name}`,
                                                                status: 'Online',
                                                                mutuals: Math.floor(Math.random() * 5) + 1,
                                                                rank: 'New Connection'
                                                            }
                                                        ]);
                                                        triggerNotification("CONNECTION ESTABLISHED", "SUCCESS");
                                                    }}
                                                    className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center text-dark-900 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/20"
                                                >
                                                    <Check size={20} />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setIncomingRequests(prev => prev.filter(r => r.id !== req.id));
                                                        triggerNotification("SIGNAL PURGED", "INFO");
                                                    }}
                                                    className="w-12 h-12 rounded-2xl bg-black/5 border border-black/10 flex items-center justify-center text-black/40 hover:text-red-400 hover:border-red-400/30 transition-all"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center space-y-4 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-700 mx-auto">
                                            <Bell size={32} />
                                        </div>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-gray-600 tracking-[0.2em]">No pending social signals.</p>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => setShowRequests(false)}
                                className="w-full py-5 bg-white/5 border border-white/10 rounded-[2.5rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all"
                            >
                                Dismiss All
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Immersive Lightbox Modal */}
            <AnimatePresence>
                {selectedPostId !== null && selectedPost && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
                        onClick={() => setSelectedPostId(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 30, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full max-w-md bg-[var(--bg-primary)] border border-[var(--border-main)] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Top Media Bar */}
                            <div className="relative aspect-[4/5] w-full bg-black flex items-center justify-center overflow-hidden">
                                {selectedPost.type === 'video' ? (
                                    <div className="w-full h-full relative bg-black">
                                        <video 
                                            src={selectedPost.videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-pouring-a-drink-into-a-glass-41714-large.mp4"} 
                                            controls 
                                            autoPlay 
                                            loop
                                            className="w-full h-full object-cover" 
                                        />
                                    </div>
                                ) : (
                                    <img 
                                        src={selectedPost.img} 
                                        alt="" 
                                        className="w-full h-full object-cover" 
                                    />
                                )}
                                
                                {/* Transparent Glass Header Overlay */}
                                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border border-brand/40 p-0.5 bg-black/50">
                                            <img src={localAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black italic uppercase text-white leading-none tracking-tight">{user.name}</p>
                                            <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-brand tracking-widest mt-1">{selectedPost.time}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedPostId(null)}
                                        className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 hover:scale-105 active:scale-95 transition-all shadow-lg"
                                    >
                                        <CloseIcon size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Details Panel */}
                            <div className="p-6 flex flex-col flex-1 space-y-4 max-h-[45vh] overflow-y-auto no-scrollbar">
                                {/* Caption */}
                                <p className="text-sm text-[var(--text-primary)] font-semibold tracking-tight leading-relaxed">
                                    {selectedPost.caption}
                                </p>

                                {/* Action bar */}
                                <div className="flex items-center justify-between border-y border-[var(--border-main)] py-3">
                                    <div className="flex items-center gap-6">
                                        <button 
                                            onClick={() => toggleLike(selectedPost.id)}
                                            className="flex items-center gap-2 group"
                                        >
                                            <Heart 
                                                size={20} 
                                                className={`transition-all duration-300 ${
                                                    selectedPost.liked 
                                                        ? 'text-red-500 fill-red-500 scale-110' 
                                                        : 'text-[var(--text-primary)] opacity-70 group-hover:opacity-100 group-hover:scale-110'
                                                }`} 
                                            />
                                            <span className="text-xs md:text-sm lg:text-base font-black italic uppercase tracking-wider">
                                                {selectedPost.likes} <span className="text-[10px] md:text-xs lg:text-sm font-medium tracking-normal lowercase text-[var(--text-secondary)]">likes</span>
                                            </span>
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <MessageSquare size={20} className="text-[var(--text-primary)] opacity-70" />
                                            <span className="text-xs md:text-sm lg:text-base font-black italic uppercase tracking-wider">
                                                {selectedPost.comments} <span className="text-[10px] md:text-xs lg:text-sm font-medium tracking-normal lowercase text-[var(--text-secondary)]">comments</span>
                                            </span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            triggerNotification("LINK COPIED TO CLIPBOARD", "SUCCESS");
                                        }}
                                        className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-main)] flex items-center justify-center hover:bg-brand/10 hover:text-brand hover:scale-105 active:scale-95 transition-all text-[var(--text-primary)] opacity-70 hover:opacity-100"
                                    >
                                        <Share2 size={14} />
                                    </button>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-brand">Secure Comments</h4>
                                    <div className="space-y-2">
                                        {selectedPost.commentsList && selectedPost.commentsList.length > 0 ? (
                                            selectedPost.commentsList.map(comment => (
                                                <div key={comment.id} className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl flex flex-col gap-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs md:text-sm lg:text-base font-black italic uppercase text-brand tracking-tight">{comment.author}</span>
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-black/40 uppercase tracking-widest">{comment.time}</span>
                                                    </div>
                                                    <p className="text-xs md:text-sm lg:text-base text-[var(--text-primary)]/80 leading-snug">{comment.text}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-[10px] md:text-xs lg:text-sm text-black/40 font-bold uppercase tracking-widest py-2">No comments yet. Secure line active.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Add comment input */}
                                <div className="flex gap-2 pt-2">
                                    <input 
                                        type="text" 
                                        value={newCommentText}
                                        onChange={(e) => setNewCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddComment(selectedPost.id);
                                        }}
                                        placeholder="Add secure comment..." 
                                        className="flex-1 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl text-xs md:text-sm lg:text-base placeholder:text-black/30 focus:outline-none focus:border-brand/40"
                                    />
                                    <button 
                                        onClick={() => handleAddComment(selectedPost.id)}
                                        className="px-4 bg-brand text-dark-900 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-md shadow-brand/10"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyProfilePage;
