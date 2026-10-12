import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    CheckCircle2, 
    Receipt, 
    ArrowLeft, 
    Share2, 
    Download, 
    ShieldCheck, 
    Zap,
    MapPin,
    Star
} from 'lucide-react';
import { triggerNotification } from '../components/NotificationToast';

const OrderReceiptPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { cart = [], venueName = "The Skyline Club", venueAddress = "", tableId = "Unknown", totalCost = 0, orderId = Date.now(), guestName = null, paymentStatus = "PAID", guestDetails = {}, attendees = [] } = location.state || {};
    
    const isHotel = venueName.toLowerCase().includes('hotel') || venueName.toLowerCase().includes('luxe');
    const isBooking = cart.some(item => 
        item.category?.toLowerCase().includes('room') || 
        item.category?.toLowerCase().includes('zimmer') || 
        item.name?.toLowerCase().includes('room') || 
        item.name?.toLowerCase().includes('suite') || 
        item.name?.toLowerCase().includes('zimmer')
    ) || (isHotel && cart.some(item => item.tags?.includes('Luxury') || item.tags?.includes('Elite')));
    const stayDuration = isBooking ? (guestDetails.stayDuration || 1) : 1;
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async (action = 'download') => {
        try {
            setIsGenerating(true);
            setTimeout(() => {
                window.print();
                setIsGenerating(false);
            }, 500);
        } catch (error) {
            console.error("Print failed", error);
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-brand/30">
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #receipt-card, #receipt-card * {
                        visibility: visible;
                    }
                    #receipt-card {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        box-shadow: none !important;
                        border: none !important;
                    }
                }
                `}
            </style>
            
            {/* Backdrop Glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-lg mx-auto p-6 pt-16 pb-32">
                {/* Header */}
                <header className="flex justify-between items-center mb-12">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white/10 transition-all"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="text-center">
                        <h2 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.4em] text-brand">Final Ticket</h2>
                        <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Ref #{orderId}</p>
                    </div>
                    <button 
                        onClick={() => generatePDF('download')}
                        disabled={isGenerating}
                        className="w-12 h-12 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center text-brand disabled:opacity-50"
                    >
                        <Download size={20} />
                    </button>
                </header>

                {/* Success Banner */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12 space-y-4"
                >
                    <div className="relative inline-block">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
                            className="w-24 h-24 bg-black rounded-full flex items-center justify-center text-white shadow-[0_0_50px_rgba(0,0,0,0.2)]"
                        >
                            <CheckCircle2 size={48} strokeWidth={3} />
                        </motion.div>
                        <motion.div 
                            animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0, 0.1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-black rounded-full -z-10"
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">{isBooking ? 'Reservation Confirmed' : 'Mission Success'}</h1>
                        <p className="text-[10px] md:text-xs lg:text-sm text-gray-500 font-black uppercase tracking-[0.2em] mt-1 italic">
                            {isBooking ? `Hotel Booking • ${stayDuration} Night(s)` : `${isHotel ? 'Room' : 'Table'} ${tableId} • ${venueName}`}
                        </p>
                        {venueAddress && (
                            <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-300 font-bold uppercase tracking-widest text-center mt-2">
                                MADE BY GREEN • OFFICIAL RECEIPT • {new Date().toLocaleDateString()}
                            </p>
                        )}
                        {guestName && (
                            <p className="text-[9px] md:text-[11px] lg:text-xs text-brand font-black uppercase tracking-widest mt-1">Verified Guest: {guestName}</p>
                        )}
                    </div>
                </motion.div>

                {/* Main Receipt Card */}
                <motion.div 
                    id="receipt-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white border border-black/10 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group"
                >
                    {/* Decorative Receipt Cutout */}
                    <div className="absolute -top-3 left-0 right-0 flex justify-center gap-2">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className="w-4 h-6 bg-gray-50 rounded-full border border-black/5" />
                        ))}
                    </div>

                    <div className="space-y-8 pt-4">
                        <div className="flex items-center gap-3 pb-6 border-b border-black/5">
                            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand border border-brand/20">
                                <Receipt size={20} />
                            </div>
                            <div>
                                <h4 className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-black tracking-widest">Transaction Confirmed</h4>
                                <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                    {paymentStatus === 'BILLED TO ROOM' ? 'Settled to Room Folio' : 'Payment settled via Card'}
                                </p>
                            </div>
                        </div>

                        {/* Guest Registration */}
                        {(guestDetails?.dob || attendees.length > 0 || isBooking) && (
                            <div className="py-6 border-b border-black/5 space-y-4">
                                <h4 className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-black tracking-widest flex items-center gap-2">
                                    <ShieldCheck size={12} className="text-brand" /> {isBooking ? 'Booking & Guest Registration' : 'Guest Registration'}
                                </h4>
                                
                                {isBooking && (
                                    <div className="bg-gray-50 rounded-2xl p-4 border border-black/5 space-y-3">
                                        <div>
                                            <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-brand tracking-widest mb-1">Accommodation Info</p>
                                            <p className="text-xs md:text-sm lg:text-base font-black uppercase text-black italic">
                                                {venueName}
                                            </p>
                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                                                {venueAddress || 'The Skyline Club • Frankfurt'}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-gray-400 tracking-widest mb-0.5">Check-In</p>
                                                <p className="text-[10px] md:text-xs lg:text-sm font-black text-black">{guestDetails?.checkIn || '15:00'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-gray-400 tracking-widest mb-0.5">Check-Out</p>
                                                <p className="text-[10px] md:text-xs lg:text-sm font-black text-black">{guestDetails?.checkOut || '11:00'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <div className="bg-gray-50 rounded-2xl p-4 border border-black/5">
                                        <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-brand tracking-widest mb-1">
                                            {isBooking ? 'Primary Guest & Billing' : 'Lead Ticket Holder'}
                                        </p>
                                        <p className="text-xs md:text-sm lg:text-base font-black uppercase text-black italic">
                                            {guestDetails?.companyName ? `${guestDetails.companyName} (c/o ${guestName})` : guestName}
                                        </p>
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                                            {guestDetails?.companyName ? (guestDetails.companyAddress || 'N/A') : `${guestDetails?.address || 'N/A'}, ${guestDetails?.zip || ''} ${guestDetails?.city || ''}`}
                                        </p>
                                        {!isBooking && guestDetails?.dob && (
                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                                                DOB: {guestDetails?.dob}
                                            </p>
                                        )}
                                    </div>
                                    {attendees.map((attendee, idx) => (
                                        <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-black/5">
                                            <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-gray-400 tracking-widest mb-1">Member #{idx + 2}</p>
                                            <p className="text-xs md:text-sm lg:text-base font-black uppercase text-black italic">{attendee.name || 'Unregistered'}</p>
                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                                                DOB: {attendee.dob || 'N/A'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Items List */}
                        <div className="space-y-6">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center group/item">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black text-gray-200 italic">0{idx + 1}</span>
                                        <div>
                                            <p className="text-xs md:text-sm lg:text-base font-black italic uppercase text-black group-hover/item:text-brand transition-colors">
                                                {item.name} {isBooking && `(x${stayDuration} Nights)`}
                                            </p>
                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.tags?.[0] || 'Premium Selection'}</p>
                                            {(item.desc || item.description) && (
                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-brand uppercase tracking-widest mt-0.5 max-w-[200px] truncate">
                                                    {item.desc || item.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm font-black italic text-black group-hover/item:text-brand transition-colors">
                                        €{(item.price * (isBooking ? stayDuration : 1)).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Summary Footer */}
                        <div className="pt-8 border-t border-dashed border-black/10 space-y-4">
                            <div className="flex justify-between items-center text-gray-400">
                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest">Subtotal</span>
                                <span className="text-sm font-black italic">€{totalCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-400">
                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest">Tax (VAT 19%)</span>
                                <span className="text-sm font-black italic">Inc.</span>
                            </div>
                            <div className="flex justify-between items-center pt-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand">Total Settled</span>
                                    <span className="text-[7px] text-gray-300 font-bold uppercase tracking-widest">MADE BY GREEN</span>
                                </div>
                                <span className="text-4xl font-black italic text-black tracking-tighter">€{totalCost.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Scan Code */}
                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                        <div className="w-full h-12 bg-white flex items-center justify-center p-2 rounded-xl opacity-80 hover:opacity-100 transition-opacity">
                            <div className="w-full h-full border-y border-black flex gap-1 items-center justify-center">
                                {[...Array(30)].map((_, i) => (
                                    <div key={i} className={`h-full bg-black ${Math.random() > 0.5 ? 'w-0.5' : 'w-1'}`} />
                                ))}
                            </div>
                        </div>
                        <p className="text-[7px] font-black text-gray-700 uppercase tracking-[0.5em]">TICKET-AUTH-SECURE-992-X</p>
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 grid grid-cols-2 gap-4"
                >
                    <button 
                        onClick={() => generatePDF('download')}
                        disabled={isGenerating}
                        className="py-5 bg-black/5 border border-black/10 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-black hover:bg-black/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        <Download size={16} /> {isGenerating ? 'Processing...' : (isHotel ? 'Download Folio' : 'Download Receipt')}
                    </button>
                    <button 
                        onClick={() => navigate('/greens')}
                        className="py-5 bg-black text-white rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Zap size={16} fill="currentColor" /> {isHotel ? 'Close Folio' : 'Close Table'}
                    </button>
                </motion.div>

                {/* Footer Insight */}
                <div className="mt-12 text-center flex items-center justify-center gap-3 opacity-30">
                    <ShieldCheck size={14} className="text-brand" />
                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-black italic">MADE BY GREEN</p>
                </div>
            </div>
        </div>
    );
};

export default OrderReceiptPage;
