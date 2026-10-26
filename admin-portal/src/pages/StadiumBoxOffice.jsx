import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Ticket, Trophy, Calendar, MapPin, Users, 
    Star, ShieldCheck, ChevronRight, Zap, CreditCard, ShoppingBag,
    Layout, Layers, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRide } from '../context/RideContext';
import { useAuth } from '../context/AuthContext';
import { calculateShuttleFare, getShuttleFareConfig, estimateDistanceKm } from '../utils/shuttleFareHelper';

const StadiumBoxOffice = () => {
    const navigate = useNavigate();
    const { addVenueTicket } = useRide();
    const { user } = useAuth();
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [pickupLocation, setPickupLocation] = useState(() => user?.address || 'Mörfelder Landstraße 362, Frankfurt');

    const shuttleConfig = getShuttleFareConfig();
    const currentVenue = selectedEvent?.venue || 'Deutsche Bank Park';
    const distanceKm = estimateDistanceKm(pickupLocation, currentVenue);
    const perTicketShuttleFare = calculateShuttleFare(distanceKm, shuttleConfig);
    const ticketBaseTotal = selectedTier ? selectedTier.price * quantity : 0;
    const shuttleTotal = selectedTier ? perTicketShuttleFare * quantity : 0;
    const grandTotal = ticketBaseTotal + shuttleTotal;

    const [events] = useState(() => {
        const saved = localStorage.getItem('green_stadium_events');
        const defaultEvents = [
            {
                id: 'evt-1',
                title: 'Champions League Final',
                date: 'MAY 24, 2024',
                time: '20:45',
                venue: 'Grien Stadium Arena',
                image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
                status: 'HIGH DEMAND',
                tiers: [
                    { id: 't1', name: 'Silver (Normal Ticket)', price: 85, color: 'bg-white/10' },
                    { id: 't2', name: 'Gold (Premium)', price: 450, color: 'bg-brand/20', premium: true },
                    { id: 't3', name: 'Diamond (VIP)', price: 1200, color: 'bg-amber-500/20', ultra: true }
                ]
            },
            {
                id: 'evt-2',
                title: 'World Tour: Midnight Neon',
                date: 'JUNE 12, 2024',
                time: '19:30',
                venue: 'Grien Stadium Arena',
                image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
                status: 'SELLING FAST',
                tiers: [
                    { id: 't1', name: 'Floor Access', price: 125, color: 'bg-white/10' },
                    { id: 't2', name: 'Premium Gallery', price: 320, color: 'bg-brand/20', premium: true }
                ]
            }
        ];

        if (saved) {
            const raw = JSON.parse(saved);
            const published = raw.filter(e => e.published).map(e => ({
                id: e.id,
                title: e.name,
                date: e.date,
                time: e.time,
                venue: 'Grien Stadium Arena',
                image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
                status: 'LIVE',
                tiers: e.tiers.map(t => ({
                    id: t.id,
                    name: t.name,
                    price: t.price,
                    color: t.name.includes('VIP') ? 'bg-brand/20' : 'bg-white/10',
                    premium: t.name.includes('VIP')
                }))
            }));
            return published.length > 0 ? published : defaultEvents;
        }
        return defaultEvents;
    });

    const handlePurchase = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const ticket = {
                id: `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                event: selectedEvent.title,
                tier: selectedTier.name,
                baseTicketPrice: selectedTier.price * quantity,
                shuttleFare: shuttleTotal,
                price: grandTotal,
                date: selectedEvent.date,
                time: selectedEvent.time,
                quantity,
                venue: selectedEvent.venue,
                pickupLocation,
                distanceKm,
                guestName: user?.name || 'Anonymous Passenger'
            };
            addVenueTicket(ticket);
            setIsProcessing(false);
            setShowSuccess(true);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans relative overflow-x-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="relative z-10 p-6 pb-24 max-w-lg mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-10 pt-8">
                    <button
                        onClick={() => navigate('/greens')}
                        className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white hover:border-brand/40 transition-all shadow-lg active:scale-90"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="text-right">
                        <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Box Office</h1>
                        <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.4em] text-brand mt-1">Official Event Hub</p>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {!selectedEvent ? (
                        <motion.div 
                            key="list"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <div className="relative mb-8">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                <input 
                                    placeholder="SEARCH EVENTS..." 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-xs md:text-sm lg:text-base font-black uppercase tracking-widest focus:outline-none focus:border-brand/40 transition-all"
                                />
                            </div>

                            <div className="space-y-4">
                                {events.map(event => (
                                    <button
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        className="w-full relative group overflow-hidden rounded-[2.5rem] border border-white/10 transition-all hover:border-brand/40"
                                    >
                                        <div className="absolute inset-0 z-0">
                                            <img src={event.image} alt={event.title} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                        </div>

                                        <div className="relative z-10 p-8 text-left h-[240px] flex flex-col justify-end">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="px-3 py-1 bg-brand text-black text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest rounded-full">
                                                    {event.status}
                                                </div>
                                                <div className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                                                    <Trophy size={10} /> {event.venue}
                                                </div>
                                            </div>
                                            <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-2">{event.title}</h3>
                                            <div className="flex items-center gap-4 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-white/60">
                                                <span className="flex items-center gap-1.5"><Calendar size={12} className="text-brand" /> {event.date}</span>
                                                <span className="flex items-center gap-1.5"><Zap size={12} className="text-brand" /> {event.time}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="details"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="space-y-8"
                        >
                            {/* Selected Event Header */}
                            <div className="relative rounded-[3rem] overflow-hidden border border-white/20 h-64 shadow-2xl">
                                <img src={selectedEvent.image} className="absolute inset-0 w-full h-full object-cover" alt="" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
                                <button 
                                    onClick={() => {setSelectedEvent(null); setSelectedTier(null);}}
                                    className="absolute top-6 left-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-all"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="absolute bottom-8 left-8 right-8">
                                    <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-2">{selectedEvent.title}</h3>
                                    <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.4em] text-brand">{selectedEvent.venue}</p>
                                </div>
                            </div>

                            {/* Ticket Tier Selection */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.5em] text-white/40 mb-6">Select Tier Access</h4>
                                {selectedEvent.tiers.map(tier => (
                                    <button
                                        key={tier.id}
                                        onClick={() => setSelectedTier(tier)}
                                        className={`w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between relative overflow-hidden group ${selectedTier?.id === tier.id ? 'border-brand' : 'border-white/5 bg-white/5'}`}
                                    >
                                        <div className={`absolute inset-0 ${tier.color} opacity-40 group-hover:opacity-60 transition-opacity`} />
                                        <div className="relative z-10 flex items-center gap-4 text-left">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 border border-white/10 ${selectedTier?.id === tier.id ? 'text-brand' : 'text-white/40'}`}>
                                                {tier.ultra ? <Trophy size={24} /> : tier.premium ? <Star size={24} /> : <Ticket size={24} />}
                                            </div>
                                            <div>
                                                <p className="text-lg font-black italic uppercase tracking-tight text-white">{tier.name}</p>
                                                <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-white/40">{tier.ultra ? 'Full Concierge & Transport' : tier.premium ? 'Express Access & Lounge' : 'General Admission'}</p>
                                            </div>
                                        </div>
                                        <div className="relative z-10 text-right">
                                            <p className="text-2xl font-black italic text-brand tracking-tighter">€{tier.price}</p>
                                            {selectedTier?.id === tier.id && <div className="w-2 h-2 rounded-full bg-brand ml-auto mt-2 shadow-[0_0_10px_var(--brand)]" />}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Quantity, Pickup Location & Fare Summary */}
                            {selectedTier && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6"
                                >
                                    {/* Pickup Location Input */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-brand flex items-center gap-2">
                                            <MapPin size={14} /> Pickup Location (For Included VIP Shuttle)
                                        </label>
                                        <input 
                                            type="text"
                                            value={pickupLocation}
                                            onChange={(e) => setPickupLocation(e.target.value)}
                                            placeholder="Enter your Hotel, Airport or Address..."
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-xs font-medium text-white focus:outline-none focus:border-brand transition-all"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div>
                                            <h4 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-white/40">Quantity</h4>
                                            <div className="flex items-center gap-6 mt-2">
                                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all">-</button>
                                                <span className="text-2xl font-black italic text-white">{quantity}</span>
                                                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all">+</button>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <h4 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-white/40">Total Settlement</h4>
                                            <p className="text-4xl font-black italic text-brand tracking-tighter mt-1">€{grandTotal.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    {/* Dynamic Tiered Price Breakdown */}
                                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
                                        <div className="flex justify-between text-white/70">
                                            <span>Ticket Base ({quantity}x {selectedTier.name})</span>
                                            <span className="font-bold text-white">€{ticketBaseTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-white/70">
                                            <span className="flex items-center gap-1.5 text-brand font-medium">
                                                <span>🚌 VIP Shuttle ({distanceKm} km to {currentVenue})</span>
                                            </span>
                                            <span className="font-bold text-brand">€{shuttleTotal.toFixed(2)}</span>
                                        </div>
                                        <p className="text-[9px] text-white/40 pt-1 border-t border-white/5">
                                            Tiered Shuttle Tariff: {shuttleConfig.baseKm}km = €{shuttleConfig.basePrice.toFixed(2)} base, +€{shuttleConfig.stepFee.toFixed(2)} per +{shuttleConfig.stepKm}km.
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 space-y-4">
                                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-brand/10 border border-brand/20">
                                            <ShieldCheck size={18} className="text-brand" />
                                            <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-brand">Secure Checkout Powered by GreenS Payment Hub</p>
                                        </div>

                                        <button
                                            onClick={handlePurchase}
                                            disabled={isProcessing}
                                            className="w-full h-16 bg-brand text-black font-black uppercase tracking-[0.3em] italic rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(var(--brand-rgb),0.3)] flex items-center justify-center gap-4"
                                        >
                                            {isProcessing ? (
                                                <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                                            ) : (
                                                <><CreditCard size={20} strokeWidth={2.5} /> AUTHORIZE PURCHASE</>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Success Overlay */}
                <AnimatePresence>
                    {showSuccess && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
                        >
                            <motion.div 
                                initial={{ scale: 0.8, y: 50 }}
                                animate={{ scale: 1, y: 0 }}
                                className="w-full max-w-sm bg-white rounded-[3rem] p-10 text-center space-y-8"
                            >
                                <div className="w-24 h-24 bg-brand/10 rounded-full mx-auto flex items-center justify-center text-brand">
                                    <ShoppingBag size={48} strokeWidth={3} className="animate-bounce" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-black">MISSION SECURED</h3>
                                    <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-black/40 mt-3">Your Digital Ticket Ledger has been updated</p>
                                </div>
                                <div className="p-6 rounded-[2rem] bg-black/5 border border-black/5 text-left space-y-3">
                                    <div className="flex justify-between items-center text-[10px] md:text-xs lg:text-sm font-black uppercase">
                                        <span className="text-black/40">Event</span>
                                        <span className="text-black italic">{selectedEvent.title}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] md:text-xs lg:text-sm font-black uppercase">
                                        <span className="text-black/40">Quantity</span>
                                        <span className="text-black italic">{quantity} Tickets</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/order/tracker')}
                                    className="w-full h-14 bg-black text-white font-black uppercase tracking-widest italic rounded-2xl hover:scale-[1.02] transition-all"
                                >
                                    View Digital Tickets
                                </button>
                                <button
                                    onClick={() => setShowSuccess(false)}
                                    className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors"
                                >
                                    Back to Box Office
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StadiumBoxOffice;
