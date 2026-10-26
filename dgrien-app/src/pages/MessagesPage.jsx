import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, MessageSquare, Mail, Gift, Sparkles, User, Tag, 
    ArrowRight, Check, X, ShieldAlert, BadgePercent, Bookmark, Plus, Send, RefreshCw,
    MessageCircle, Users, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MessagesPage = () => {
    const { user } = useAuth();
    const isDemo = user?.isDemo;
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'messages', 'offers', 'friends'
    const [selectedItem, setSelectedItem] = useState(null); // Full offer detail modal
    const [isClaiming, setIsClaiming] = useState(false); // Claim loading indicator
    const [claimSuccess, setClaimSuccess] = useState(false); // Claim success state

    // Chat Thread active state
    const [activeChatThread, setActiveChatThread] = useState(null); // Contact object if actively chatting
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef(null);

    // Toast notifications state
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Auto-scroll chat thread to bottom
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeChatThread]);

    // Friends list (Customers who are friends)
    const [friendsList, setFriendsList] = useState([]);

    // Chat threads state manager
    const [chatHistory, setChatHistory] = useState({});

    // General inbox feed items
    const [inboxItems, setInboxItems] = useState([]);

    useEffect(() => {
        setFriendsList([]);
        setChatHistory({});
        setInboxItems([]);
    }, [isDemo]);

    // Load custom offers from localStorage on mount (demo only)
    useEffect(() => {
        if (!isDemo) return;
        const savedCustom = localStorage.getItem('green_custom_offers');
        if (savedCustom) {
            const parsed = JSON.parse(savedCustom);
            setInboxItems(prev => {
                const staticItems = prev.filter(item => !item.id.toString().startsWith('custom-offer-'));
                return [...parsed, ...staticItems];
            });
        }
    }, [isDemo]);

    const filteredItems = inboxItems.filter(item => {
        if (activeTab === 'messages') return item.type === 'message';
        if (activeTab === 'offers') return item.type === 'offer';
        return true;
    });

    // Chat dispatch engine with smart reply logic
    const handleSendChatMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const currentContact = activeChatThread.name;
        const newMsg = {
            sender: 'YOU',
            text: chatInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedMessages = [...(chatHistory[currentContact] || []), newMsg];
        setChatHistory({
            ...chatHistory,
            [currentContact]: updatedMessages
        });
        setChatInput('');

        // Smart reply simulation
        setTimeout(() => {
            let replyText = "Got it! Synchronizing on the Green Grid. 👍";
            if (currentContact.includes('Sergei')) {
                replyText = "Understood Alex! I am heading over to your location right now. See you soon! 🚗";
            } else if (currentContact.includes('Sarah')) {
                replyText = "Perfect, splitting the ride on Greens now! Let's meet at the pick-up slot. 👥";
            } else if (currentContact.includes('Marcus')) {
                replyText = "Ledger split verified! Let me know where we go next time! 🤝";
            } else if (currentContact.includes('Elena')) {
                replyText = "Awesome! Grabbed a spot. Come inside soon! 🥂";
            } else if (currentContact.includes('Green Underground')) {
                replyText = "A manager has been notified. We are fast-tracking your experience tonight! 🍾";
            }

            const responseMsg = {
                sender: currentContact,
                text: replyText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setChatHistory(prev => ({
                ...prev,
                [currentContact]: [...(prev[currentContact] || []), responseMsg]
            }));
            triggerToast(`New transmission from ${currentContact}! 💬`);
        }, 1500);
    };

    const handleClaimOffer = (offer) => {
        setIsClaiming(true);
        setClaimSuccess(false);

        // Simulate secure server dispatch for the voucher offer
        setTimeout(() => {
            setIsClaiming(false);
            setClaimSuccess(true);
            triggerToast(`Voucher for ${offer.sender} sent to passenger@green.de! 📧`);
        }, 2000);
    };

    // Open chat thread with specific contact
    const handleStartChat = (contact) => {
        setActiveChatThread({
            name: contact.name || contact.sender,
            role: contact.role,
            avatar: contact.avatar
        });
    };

    return (
        <div className="min-h-full bg-dark-950 text-primary font-sans relative pb-32 overflow-y-auto no-scrollbar">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-24 left-0 w-80 h-80 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />

            {/* Notification Toast */}
            <AnimatePresence>
                {showToast && (
                    <motion.div 
                        initial={{ y: -50, opacity: 0, x: "-50%" }} 
                        animate={{ y: 20, opacity: 1, x: "-50%" }} 
                        exit={{ y: -50, opacity: 0, x: "-50%" }} 
                        className="fixed top-12 left-1/2 z-[100] px-6 py-3.5 bg-brand text-dark-950 font-black italic uppercase text-[10px] md:text-xs lg:text-sm rounded-full shadow-2xl flex items-center gap-3 whitespace-nowrap"
                    >
                        <Sparkles size={14} className="fill-dark-900 animate-spin" />
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {!activeChatThread ? (
                <>
                    {/* Header Column */}
                    <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-main pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-6 px-6 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <button 
                            onClick={() => navigate('/home')} 
                            className="w-12 h-12 bg-dark-900 rounded-2xl flex items-center justify-center text-primary border border-main hover:border-brand transition-all active:scale-95"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div className="text-center">
                            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Green Inbox</h1>
                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-brand tracking-[0.22em]">Authorized Direct Grid</p>
                        </div>
                        <div className="w-12 h-12" /> {/* Spacer */}
                    </header>

                    <main className="p-6 max-w-lg mx-auto space-y-8">
                        {/* Tab Switcher including Friends List */}
                        <div className="grid grid-cols-4 gap-1.5 bg-white/[0.03] border border-white/5 p-1 rounded-[2rem]">
                            {[
                                { id: 'all', label: 'All Feed' },
                                { id: 'messages', label: 'Inbox' },
                                { id: 'offers', label: 'Offers' },
                                { id: 'friends', label: 'Friends 👥' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-3 rounded-xl text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-brand text-dark-950 shadow-md font-black' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Security Policy Alert Banner */}
                        <div className="bg-white/[0.01] border border-white/5 p-5 rounded-[2.5rem] flex gap-4 text-left relative overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.01)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                            <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
                                <ShieldAlert size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.2em] text-brand">Direct Transmission Protocol</span>
                                <p className="text-[10px] md:text-xs lg:text-sm text-gray-400 font-bold uppercase leading-relaxed">
                                    To protect passenger privacy, you will only receive direct chat transmissions from verified staff, drivers, managers, and customers who are in your Friends list.
                                </p>
                            </div>
                        </div>

                        {/* Friends List Tab Section */}
                        {activeTab === 'friends' ? (
                            <div className="space-y-5">
                                {friendsList.map((friend, idx) => (
                                    <div 
                                        key={idx}
                                        className="w-full text-left rounded-[2.5rem] p-6 flex items-center justify-between gap-4 transition-all shadow-xl relative overflow-hidden"
                                        style={{ 
                                            backgroundColor: '#161616', 
                                            border: '2px solid rgba(255, 255, 255, 0.15)',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                        }}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            {/* Avatar with Online/Offline indicator */}
                                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/5 border border-white/20 shrink-0 relative">
                                                <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#161616] ${friend.status === 'Online' ? 'bg-brand' : 'bg-gray-600'}`} />
                                            </div>
                                            
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-black italic uppercase text-primary truncate leading-none">{friend.name}</h4>
                                                <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-wider block mt-1.5 text-secondary">{friend.role}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleStartChat(friend)}
                                            className="px-5 py-3.5 bg-brand hover:scale-105 active:scale-95 text-dark-950 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-wider rounded-2xl transition-all shadow-lg flex items-center gap-2"
                                            style={{ backgroundColor: 'var(--brand)' }}
                                        >
                                            Chat Now <MessageCircle size={14} className="fill-dark-950" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Message & Offers List Tab Section (All solid dark, high contrast card buttons) */
                            <div className="space-y-5">
                                {filteredItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            if (item.type === 'offer') {
                                                setSelectedItem(item);
                                                setClaimSuccess(false);
                                                setIsClaiming(false);
                                            } else {
                                                handleStartChat(item);
                                            }
                                        }}
                                        className="w-full text-left rounded-[2.5rem] p-6 flex items-start gap-4 transition-all hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden shadow-xl"
                                        style={{ 
                                            backgroundColor: '#161616', 
                                            border: '2px solid rgba(255, 255, 255, 0.15)',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                        }}
                                    >
                                        {/* Accent type border */}
                                        <div className={`absolute top-0 bottom-0 left-0 w-[4px] ${item.type === 'offer' ? 'bg-brand' : 'bg-blue-400'}`} />

                                        {/* Avatar */}
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/5 border border-white/20 shrink-0 relative shadow-inner">
                                            <img src={item.avatar} alt={item.sender} className="w-full h-full object-cover" />
                                        </div>

                                        {/* Message / Offer Preview Content */}
                                        <div className="flex-1 space-y-2 min-w-0">
                                            <div className="flex justify-between items-center gap-2">
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-black italic uppercase truncate leading-none text-primary">{item.sender}</h4>
                                                    <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-wider block mt-1.5 text-secondary">{item.role}</span>
                                                </div>
                                                <span className="text-[9px] md:text-[11px] lg:text-xs font-bold uppercase shrink-0 text-secondary">{item.time}</span>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs md:text-sm lg:text-base font-black uppercase italic tracking-tight truncate text-brand">{item.subject}</p>
                                                <p className="text-xs md:text-sm lg:text-base font-medium leading-relaxed truncate text-secondary">{item.preview}</p>
                                            </div>

                                            <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                                                <span className={`text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${item.type === 'offer' ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                                    {item.tag}
                                                </span>
                                                <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-brand flex items-center gap-1.5 italic">
                                                    {item.type === 'offer' ? 'Claim Offer' : 'Open Chat'} <ArrowRight size={12} />
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}

                                {filteredItems.length === 0 && (
                                    <div className="py-20 text-center space-y-4">
                                        <MessageSquare size={36} className="text-gray-600 mx-auto opacity-30" />
                                        <p className="text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-gray-600 italic">No items found in this category</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </>
            ) : (
                /* Fully Interactive Chat Thread View Window */
                <div className="min-h-full flex flex-col bg-dark-950 text-primary relative">
                    {/* Sticky Chat Header */}
                    <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-main pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-6 px-6 flex items-center gap-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <button 
                            onClick={() => setActiveChatThread(null)} 
                            className="w-12 h-12 bg-dark-900 rounded-2xl flex items-center justify-center text-primary border border-main hover:border-brand transition-all active:scale-95"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        
                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-dark-900 border border-main relative shrink-0">
                            <img src={activeChatThread.avatar} alt={activeChatThread.name} className="w-full h-full object-cover" />
                        </div>

                        <div className="text-left min-w-0">
                            <h3 className="text-base font-black italic uppercase tracking-tight text-primary leading-none truncate">{activeChatThread.name}</h3>
                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-brand tracking-[0.2em] block mt-1.5 truncate">{activeChatThread.role}</span>
                        </div>
                    </header>

                    {/* Scrollable Chat Area */}
                    <div className="flex-1 p-6 space-y-4 overflow-y-auto no-scrollbar pb-36 max-w-lg mx-auto w-full">
                        <div className="py-4 text-center">
                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-gray-500">
                                🔒 Secure End-to-End Encryption
                            </span>
                        </div>

                        {(chatHistory[activeChatThread.name] || []).map((msg, idx) => {
                            const isMe = msg.sender === 'YOU';
                            return (
                                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                                    <div className={`max-w-[85%] rounded-[2rem] p-5 shadow-lg border text-left ${isMe ? 'bg-brand text-dark-950 border-brand/20 rounded-tr-none' : 'bg-[#161616] text-white border-white/10 rounded-tl-none'}`}>
                                        <p className="text-xs md:text-sm lg:text-base font-bold leading-relaxed break-words" style={isMe ? { color: '#090d16' } : { color: '#ffffff' }}>
                                            {msg.text}
                                        </p>
                                        <span className={`text-[8px] md:text-[10px] lg:text-xs font-black block mt-2 text-right uppercase tracking-wider ${isMe ? 'text-dark-950/60' : 'text-gray-500'}`}>
                                            {msg.time} {isMe && '✓✓'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Sticky Bottom Chat Input Bar */}
                    <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-dark-950 via-dark-950/90 to-transparent z-40">
                        <form onSubmit={handleSendChatMessage} className="max-w-lg mx-auto flex gap-3 relative">
                            <input 
                                type="text"
                                placeholder={`Write secure message to ${activeChatThread.name}...`}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                className="w-full bg-dark-900 border border-main text-primary rounded-[2rem] p-5 pr-16 text-xs md:text-sm lg:text-base font-bold focus:border-brand/40 outline-none shadow-2xl placeholder:text-gray-500"
                            />
                            <button 
                                type="submit"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 bg-brand text-dark-950 rounded-full flex items-center justify-center shadow-lg active:scale-90 hover:scale-105 transition-all"
                                style={{ backgroundColor: 'var(--brand)' }}
                            >
                                <Send size={16} className="fill-dark-950" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Bottom Sheet detail modal for Exclusive Partner Offers */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-[60] flex items-end justify-center">
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedItem(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />

                        {/* Sheet */}
                        <motion.div 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-dark-900 border-t border-main rounded-t-[3.5rem] p-8 pb-12 space-y-8 shadow-2xl relative z-10 w-full max-w-lg overflow-y-auto max-h-[85vh] no-scrollbar text-center text-primary"
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto -mt-2 mb-2" />

                            <div className="flex items-center gap-4 text-left pb-4 border-b border-white/5">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                                    <img src={selectedItem.avatar} alt={selectedItem.sender} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black italic uppercase tracking-tighter leading-none">{selectedItem.sender}</h4>
                                    <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-brand tracking-[0.2em] mt-1.5">{selectedItem.role}</p>
                                    <span className="text-[7px] text-gray-500 font-bold uppercase tracking-widest block mt-1">{selectedItem.time}</span>
                                </div>
                            </div>

                            <div className="space-y-4 text-left">
                                <span className={`inline-block text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${selectedItem.type === 'offer' ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                    {selectedItem.tag}
                                </span>
                                <h3 className="text-lg font-black italic uppercase tracking-tight leading-snug text-primary">{selectedItem.subject}</h3>
                                <p className="text-xs md:text-sm lg:text-base font-bold leading-relaxed p-6 rounded-3xl border border-main bg-dark-950 text-primary">
                                    {selectedItem.content}
                                </p>
                            </div>

                            {/* Verification Loading States for Offers */}
                            {selectedItem.type === 'offer' && (isClaiming || claimSuccess) && (
                                <div className="p-6 rounded-3xl bg-dark-950 border border-main text-center space-y-4">
                                    {isClaiming && (
                                        <div className="space-y-3">
                                            <RefreshCw size={24} className="text-brand animate-spin mx-auto" />
                                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand">Verifying Digital Signature...</p>
                                        </div>
                                    )}
                                    {claimSuccess && (
                                        <div className="space-y-2">
                                            <div className="w-10 h-10 rounded-full bg-brand/15 border border-brand/30 text-brand flex items-center justify-center mx-auto">
                                                <CheckCircle2 size={20} className="text-brand" />
                                            </div>
                                            <p className="text-xs md:text-sm lg:text-base font-black uppercase italic text-white pt-1">Voucher Securely Dispatched! 📧</p>
                                            <p className="text-[10px] md:text-xs lg:text-sm font-bold leading-relaxed text-secondary">
                                                The exclusive access perk has been successfully sent to <span className="text-white font-black inline-block">passenger@green.de</span>. Please check your inbox!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tactical Actions inside detail modal */}
                            <div className="space-y-3">
                                {selectedItem.type === 'offer' ? (
                                    <button 
                                        onClick={() => handleClaimOffer(selectedItem)}
                                        disabled={isClaiming || claimSuccess}
                                        className={`w-full py-5 font-black uppercase tracking-[0.2em] italic text-xs md:text-sm lg:text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${claimSuccess ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5' : 'bg-brand text-dark-950 hover:scale-[1.02]'}`}
                                        style={claimSuccess ? {} : { backgroundColor: 'var(--brand)' }}
                                    >
                                        {claimSuccess ? 'Offer Claimed ✓' : isClaiming ? 'Claiming perk...' : selectedItem.actionText} <ArrowRight size={14} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => {
                                            setSelectedItem(null);
                                            navigate(selectedItem.actionRoute);
                                        }}
                                        className="w-full py-5 bg-brand text-dark-950 font-black uppercase tracking-[0.2em] italic text-xs md:text-sm lg:text-base rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                        style={{ backgroundColor: 'var(--brand)' }}
                                    >
                                        {selectedItem.actionText} <ArrowRight size={14} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => setSelectedItem(null)}
                                    className="w-full py-5 bg-white/5 text-white font-black uppercase tracking-[0.2em] text-[10px] md:text-xs lg:text-sm rounded-2xl hover:bg-white/10 transition-all border border-white/5 active:scale-95"
                                >
                                    Dismiss Details
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MessagesPage;
