import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, Clock, XCircle, MessageSquare } from 'lucide-react';
import { triggerNotification } from './NotificationToast';

const ShuttleMessagingModal = ({ isOpen, onClose, cluster, shuttleFare = 10, onSendSuccess, onToggleGuestAcceptance }) => {
    if (!isOpen || !cluster) return null;

    const [messageType, setMessageType] = useState('96h'); // Default to 4 Days (96h) Before Flight
    const [customText, setCustomText] = useState('');
    const [sending, setSending] = useState(false);

    const defaultTexts = {
        '96h': `Advance Flight Notice (4 Days Prior): Hello {name}! Your GREEN VIP Shuttle to {hotel} is pre-reserved for your arrival at {airport}. Exclusive Rate: €${shuttleFare}.00 / person. Please accept your seat to lock fleet planning.`,
        '48h': `Pre-Flight Reminder (48h): Hello {name}! Confirm your GREEN VIP Shuttle to {hotel} arriving at {airport} on {date}. Group Rate: €${shuttleFare}.00 / person. Tap to accept.`,
        '24h': `Final Pre-Flight Notice (24h): Your arrival shuttle to {hotel} is ready at {airport} ({time}). Rate: €${shuttleFare}.00 per guest. Tap to confirm luggage & seat.`,
        'custom': customText || `Exclusive Shuttle Offer to {hotel}: €${shuttleFare}.00 per passenger.`
    };

    const handleSendAdvanceMessages = () => {
        setSending(true);
        setTimeout(() => {
            setSending(false);
            triggerNotification('success', 'Pre-Flight Offer Sent', `4-Day Advance shuttle notification sent to ${cluster.guests.length} guests for €${shuttleFare}.00/person.`);
            if (onSendSuccess) onSendSuccess(cluster.id);
            onClose();
        }, 800);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-2xl bg-dark-900 border border-brand/30 rounded-[3rem] p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden"
                >
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/40 text-brand flex items-center justify-center">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Pre-Flight Guest Offer (4 Days Prior)</h3>
                                <p className="text-[10px] md:text-xs font-bold text-brand uppercase tracking-widest">Rate: €{shuttleFare}.00 / Person • {cluster.targetHotel}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                            <X size={18} />
                        </button>
                    </div>

                    {/* CLUSTER SUMMARY BAR */}
                    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-wrap justify-between items-center gap-3">
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase">Origin ➔ Destination</p>
                            <p className="text-sm font-black italic text-white uppercase">{cluster.origin} ➔ {cluster.targetHotel}</p>
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase">Luggage & Fleet Split</p>
                            <p className="text-sm font-black italic text-cyan-400">{cluster.bagsCount} Bags • {cluster.vehiclesNeeded} {cluster.vehiclesNeeded > 1 ? 'Vehicles' : 'Vehicle'} Required</p>
                        </div>
                    </div>

                    {/* TIMING TABS */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Advance Dispatch Timing</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { id: '96h', label: '4 Days Prior', sub: 'Best Planning' },
                                { id: '48h', label: '2 Days Prior', sub: 'Confirmation' },
                                { id: '24h', label: '1 Day Prior', sub: 'Final Notice' },
                                { id: 'custom', label: 'Custom Text', sub: 'Manual' }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setMessageType(t.id)}
                                    className={`p-3 rounded-2xl border text-left transition-all ${messageType === t.id ? 'bg-brand/20 border-brand text-brand' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                                >
                                    <p className="text-xs font-black uppercase">{t.label}</p>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase">{t.sub}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* MESSAGE PREVIEW */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Message Preview (Sent via Push / SMS)</label>
                        {messageType === 'custom' ? (
                            <textarea
                                value={customText}
                                onChange={e => setCustomText(e.target.value)}
                                placeholder={`Enter message... (shuttle price: €${shuttleFare}.00 / guest)`}
                                className="w-full h-24 p-4 bg-black/50 border border-white/10 rounded-2xl text-xs font-bold text-white outline-none focus:border-brand/50"
                            />
                        ) : (
                            <div className="p-4 bg-black/50 border border-white/10 rounded-2xl text-xs font-bold text-gray-300 leading-relaxed">
                                {defaultTexts[messageType].replace('{name}', 'Guest Group').replace('{hotel}', cluster.targetHotel).replace('{airport}', cluster.origin).replace('{date}', 'Friday').replace('{time}', cluster.timeWindow)}
                            </div>
                        )}
                    </div>

                    {/* GUEST ACCEPTANCE LIST */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Guest Acceptance Status ({cluster.guests.filter(g => g.status === 'accepted').length}/{cluster.guests.length} Confirmed)</label>
                            <span className="text-[10px] font-bold text-brand uppercase">Click status to simulate response</span>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                            {cluster.guests.map((g) => (
                                <div 
                                    key={g.id} 
                                    onClick={() => onToggleGuestAcceptance && onToggleGuestAcceptance(cluster.id, g.id)}
                                    className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center cursor-pointer hover:border-brand/40 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-xs font-black text-white">
                                            {g.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white">{g.name}</p>
                                            <p className="text-[9px] font-bold text-gray-500 uppercase">{g.flight} • {g.bags} Bags</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 border ${
                                        g.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                        g.status === 'declined' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                        'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                    }`}>
                                        {g.status === 'accepted' && <><CheckCircle2 size={12} /> Accepted (€{shuttleFare})</>}
                                        {g.status === 'declined' && <><XCircle size={12} /> Declined</>}
                                        {g.status === 'pending' && <><Clock size={12} /> Pending Offer</>}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="pt-2 flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black uppercase text-gray-400 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSendAdvanceMessages}
                            disabled={sending}
                            className="flex-1 py-3.5 bg-brand text-dark-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <Send size={14} /> {sending ? 'Sending Notifications...' : `Send 4-Day Advance Offers (€${shuttleFare}/Guest)`}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ShuttleMessagingModal;
