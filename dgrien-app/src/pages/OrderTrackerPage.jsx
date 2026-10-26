import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRide } from '../context/RideContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, CheckCircle, Loader2, 
    Sparkles, 
    Receipt, 
    MapPin, 
    Star, 
    Zap, 
    Box, 
    Utensils, 
    ShieldCheck, 
    Plus,
    ArrowLeft,
    Banknote,
    QrCode,
    Ticket,
    CreditCard,
    Smartphone,
    ShoppingBag,
    Check,
    BedDouble,
    Download,
    Mail,
    Building2,
    Calendar,
    Users,
    Key,
    X,
    Send
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const OrderTrackerPage = () => {
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const cart = location.state?.cart || [];
    const venueName = location.state?.venueName || "The Skyline Club";
    const venueOffer = location.state?.venueOffer || "Free Entry + 1 Drink";
    const orderId = location.state?.orderId;
    const tableId = location.state?.tableId || "Unknown";
    
    // 1. Detect if this is a Hotel / Room / Stay Booking
    const isHotelBookingContext = 
        location.state?.orderType === 'booking' || 
        location.state?.orderType === 'hotel' || 
        location.state?.bookingType === 'hotel' ||
        tableId === 'Check-in Assigned' ||
        venueName.toLowerCase().includes('hotel') || 
        venueName.toLowerCase().includes('luxe') || 
        venueName.toLowerCase().includes('resort') ||
        venueName.toLowerCase().includes('palace') ||
        cart.some(item => 
            item.name.toLowerCase().includes('room') || 
            item.name.toLowerCase().includes('suite') || 
            item.name.toLowerCase().includes('bed') ||
            item.category === 'Rooms' ||
            item.category === 'Suites' ||
            item.tags?.includes('Hotel') ||
            item.tags?.includes('Suite') ||
            item.tags?.includes('Room') ||
            item.tags?.includes('Rooms') ||
            item.tags?.includes('Booking')
        );

    // 2. Detect if this is an explicit Stadium / Event Ticket order (STRICTLY NOT HOTEL)
    const isExplicitStadiumOrTicket = !isHotelBookingContext && (
        location.state?.isStadiumTicket || 
        location.state?.orderType === 'stadium' || 
        location.state?.orderType === 'stadium_ticket' || 
        location.state?.orderType === 'club_ticket' ||
        tableId === 'E-Ticket' ||
        tableId === 'Club-Pass' ||
        venueName.toLowerCase().includes('stadium') || 
        venueName.toLowerCase().includes('arena') ||
        cart.some(item => 
            item.tags?.includes('Ticket') || 
            item.tags?.includes('Fast-Lane') || 
            item.name.toLowerCase().includes('ticket') || 
            item.name.toLowerCase().includes('eintritt') || 
            item.name.toLowerCase().includes('pass') ||
            item.id?.startsWith('t') || 
            item.id?.startsWith('st') ||
            item.id?.startsWith('dynamic')
        )
    );

    const isHotel = isHotelBookingContext;
    const isBooking = isHotelBookingContext;
    const isStadium = !isHotelBookingContext && (venueName.toLowerCase().includes('stadium') || venueName.toLowerCase().includes('arena'));
    const isParking = false;
    const guestName = location.state?.guestName;
    const guestDetails = location.state?.guestDetails;
    const isGroupActive = localStorage.getItem('green_group_state') === 'active';
    const totalCost = location.state?.totalCost ?? cart.reduce((sum, item) => sum + item.price, 0);

    // Check if the order is a ticket order (e.g. Club entry, Event ticket, Stadium seat)
    const hasTickets = isExplicitStadiumOrTicket;
    const isStadiumTicket = isExplicitStadiumOrTicket;

    const orderIdValue = location.state?.orderId || Date.now();
    const { socket } = useSocket();
    const { user } = useAuth();
    const { setVenueTickets } = useRide();

    const [guestEmail, setGuestEmail] = useState(location.state?.guestEmail || (user?.email ? user.email : "gast@khiam-green.de"));
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [tempEmail, setTempEmail] = useState(guestEmail);
    const guestPhone = location.state?.guestPhone || (user?.phone ? user.phone : "+49 176 12345678");

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const [customQrCode, setCustomQrCode] = useState(() => {
        return location.state?.stadiumQrCode || 
               localStorage.getItem(`green_order_qr_${orderIdValue}`) || 
               null;
    });

    useEffect(() => {
        const syncQr = () => {
            const stored = localStorage.getItem(`green_order_qr_${orderIdValue}`);
            if (stored) setCustomQrCode(stored);
        };
        syncQr();
        window.addEventListener('storage', syncQr);
        return () => window.removeEventListener('storage', syncQr);
    }, [orderIdValue]);

    const handleOpenEmailModal = () => {
        setShowEmailModal(true);
    };

    const handleSendEmailConfirmation = () => {
        if (isSendingEmail) return;
        setIsSendingEmail(true);
        setTimeout(() => {
            setIsSendingEmail(false);
            setEmailSent(true);
            triggerToast(`📧 Reservierungsbestätigung an ${guestEmail} gesendet! ✨`);
        }, 1200);
    };
    
    const [progress, setProgress] = useState(100);
    const [eta, setEta] = useState(0);
    const [statusText, setStatusText] = useState(hasTickets ? "E-Tickets & Bestätigung Bereit 🎟️" : "Bestätigt");
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [showPaymentOptions, setShowPaymentOptions] = useState(false);
    const [paymentStep, setPaymentStep] = useState('paying'); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [selectedSavedCard, setSelectedSavedCard] = useState(null);
    const [rating, setRating] = useState(0);
    const [feedbackTags, setFeedbackTags] = useState([]);
    const [wantsPacking, setWantsPacking] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(location.state?.paymentStatus || 'PAID');
    const [cashWaiting, setCashWaiting] = useState(false);

    const handleResendEmail = () => {
        setGuestEmail(tempEmail);
        setIsEditingEmail(false);
        setSecondsLeft(10);
        triggerToast(`Bestätigungs-Link erneut gesendet an ${tempEmail}! 📧`);
        
        try {
            const savedOrders = JSON.parse(localStorage.getItem('green_active_orders') || '[]');
            const updated = savedOrders.map(o => o.id === orderIdValue ? { ...o, guest: o.guest.includes('(') ? `${guestName} (${tempEmail})` : tempEmail } : o);
            localStorage.setItem('green_active_orders', JSON.stringify(updated));
        } catch (e) {}
    };

    const [orderStatus, setOrderStatus] = useState(() => {
        return location.state?.orderStatus || 'CONFIRMED';
    });
    
    const [secondsLeft, setSecondsLeft] = useState(10);

    const handleVerifyEmail = () => {
        setOrderStatus('TICKET_DISPATCHED');
        setStatusText("Tickets per E-Mail zugestellt! 🎟️");
        setProgress(80);
        setEta(0);
        triggerToast("E-Mail erfolgreich verifiziert! ✨");
        setActiveItems(prev => prev.map(item => ({ ...item, status: 'sent' })));
        
        try {
            const savedOrders = JSON.parse(localStorage.getItem('green_active_orders') || '[]');
            const updated = savedOrders.map(o => o.id === orderIdValue ? { ...o, status: 'Ready' } : o);
            localStorage.setItem('green_active_orders', JSON.stringify(updated));
            if (window.parent) {
                window.parent.dispatchEvent(new CustomEvent('green-orders-updated'));
            }
        } catch (e) {}
    };

    const handleConfirmReceipt = () => {
        setOrderStatus('RECEIVED');
        setStatusText("Einlass-Tickets aktiv 📱");
        setProgress(100);
        setEta(0);
        triggerToast("Ticket-Empfang erfolgreich bestätigt! 🎟️");
        
        try {
            const savedOrders = JSON.parse(localStorage.getItem('green_active_orders') || '[]');
            const updated = savedOrders.map(o => o.id === orderIdValue ? { ...o, status: 'Served' } : o);
            localStorage.setItem('green_active_orders', JSON.stringify(updated));
            if (window.parent) {
                window.parent.dispatchEvent(new CustomEvent('green-orders-updated'));
            }
        } catch (e) {}
    };

    useEffect(() => {
        let timeout;
        if (orderStatus === 'TICKET_GENERATING') {
            setProgress(50);
            setStatusText("Ticket wird generiert...");
            timeout = setTimeout(() => {
                navigate('/order/receipt', { 
                    state: { 
                        ...location.state, 
                        totalCost
                    } 
                });
            }, 2000);
        }
        return () => clearTimeout(timeout);
    }, [orderStatus, navigate, location.state]);
    
    useEffect(() => {
        if (orderStatus === 'GROUP ORDER') {
            setProgress(60);
            setEta(5);
            setStatusText("Added to Active Group Tab");
        }
    }, [orderStatus]);
    
    // Live Mission Ticket State
    const [activeItems, setActiveItems] = useState(
        cart.map(item => ({ ...item, status: ['DISPATCHED', 'TICKET_DISPATCHED', 'RECEIVED'].includes(orderStatus) ? 'sent' : 'pending' }))
    );


    const [valetStep, setValetStep] = useState('idle');
    const [valetName] = useState("Marco S.");
    const [valetEta, setValetEta] = useState(25);
    const [tipAmount, setTipAmount] = useState(0);
    const [parkingPass, setParkingPass] = useState(null);
    const [showFullQR, setShowFullQR] = useState(false);

    useEffect(() => {
        const checkPass = () => {
            const pass = localStorage.getItem('green_parking_pass');
            if (pass) setParkingPass(JSON.parse(pass));
        };
        checkPass();
        window.addEventListener('storage', checkPass);
        return () => window.removeEventListener('storage', checkPass);
    }, []);

    const feedbackOptions = [
        { label: 'Service', emoji: '⚡' },
        { label: 'Atmosphere', emoji: '✨' },
        { label: 'Cleanliness', emoji: '💎' },
        { label: 'Premium', emoji: '🏆' }
    ];

    useEffect(() => {
        if (!socket) return;

        const handlePaymentCleared = (data) => {
            if (data.orderId === orderIdValue) {
                setCashWaiting(false);
                setPaymentStep('rating');
                triggerToast("Payment Confirmed • Thank you! ✨");
            }
        };

        socket.on('payment-cleared', handlePaymentCleared);
        return () => socket.off('payment-cleared', handlePaymentCleared);
    }, [socket, orderIdValue]);

    useEffect(() => {
        if (!socket) return;

        const handleGuestMessage = (data) => {
            if (String(data.orderId) === String(orderIdValue)) {
                triggerToast(`🛎️ PARTNER: "${data.message}"`);
            }
        };

        socket.on('new-guest-message', handleGuestMessage);
        return () => socket.off('new-guest-message', handleGuestMessage);
    }, [socket, orderIdValue]);

    useEffect(() => {
        if (hasTickets) return; // Custom flow for tickets
        
        // DEMO: Auto-serve order or dispatch tickets after 10 seconds for demonstration
        const timer = setTimeout(() => {
            if (orderStatus === 'PENDING') {
                const finalStatus = (isStadium || isParking) ? 'DISPATCHED' : 'SERVED';
                setOrderStatus(finalStatus);
                setStatusText((isStadium || isParking) ? "Tickets Dispatched! 🎟️" : "Enjoy your meal! ✨");
                setProgress(100);
                setEta(0);
                
                const msg = (isStadium || isParking) 
                    ? `${isParking ? 'Pass' : 'Tickets'} Sent to Communications Hub 📱`
                    : `Order Served • Table ${tableId} 🍽️`;
                
                triggerToast(msg);
            }
        }, 8000);
        return () => clearTimeout(timer);
    }, [orderStatus, isStadium, isParking, tableId, hasTickets]);

    useEffect(() => {
        // Simulate SMS/Email being opened after 4 seconds of dispatch
        if (hasTickets && orderStatus === 'TICKET_DISPATCHED') {
            // Strictly wait for manual confirmation via "Empfang bestätigen" button in Email 2
        } else if (!hasTickets && (isStadium || isParking) && orderStatus === 'DISPATCHED') {
            const timer = setTimeout(() => {
                setOrderStatus('RECEIVED');
                triggerToast("Receipt Acknowledged • Access Protocol Active 📱");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [orderStatus, isStadium, isParking, hasTickets]);

    useEffect(() => {
        const checkStatus = () => {
            if (!orderIdValue) return;
            const savedOrders = JSON.parse(localStorage.getItem('green_active_orders') || '[]');
            const currentOrder = savedOrders.find(o => o.id === orderIdValue);
            
            if (currentOrder) {
                if (currentOrder.status === 'Paid' || currentOrder.status === 'Verified') {
                    setPaymentStatus('PAID');
                    setCashWaiting(false);
                    if (paymentStep !== 'rating') {
                        setPaymentStep('rating');
                        triggerToast("Payment Verified by Staff! ✨");
                    }
                }

                const b2bStatus = currentOrder.status; // 'Received', 'Booked', 'Check-In', 'Staying', 'Departed', 'Preparing', 'Ready', 'Served', etc.
                
                if (currentOrder.type === 'Stay Booking') {
                    // For Room stay bookings
                    if (b2bStatus === 'Received' || b2bStatus === 'Booked') {
                        setOrderStatus('CONFIRMED');
                        setStatusText("Booking Confirmed • Awaiting Check-In 🏨");
                        setProgress(30);
                    } else if (b2bStatus === 'Check-In' || b2bStatus === 'Staying') {
                        setOrderStatus('CHECKED IN');
                        setStatusText("Welcome! Checked In to Room 🔑");
                        setProgress(75);
                    } else if (b2bStatus === 'Departed') {
                        setOrderStatus('CHECKED OUT');
                        setStatusText("Departed • Thank you for your stay! ✨");
                        setProgress(100);
                        setEta(0);
                    } else {
                        setOrderStatus(b2bStatus.toUpperCase());
                    }
                } else if (hasTickets || currentOrder.type === 'Stadium E-Ticket' || currentOrder.type === 'Club Event Ticket') {
                    // For ticket/event purchases
                    if (b2bStatus === 'Received' || b2bStatus === 'Preparing') {
                        setOrderStatus('CONFIRMED');
                        setStatusText("E-Tickets & Bestätigung Bereit! 🎟️");
                        setProgress(60);
                    } else if (b2bStatus === 'Ready') {
                        if (orderStatus !== 'RECEIVED') {
                            setOrderStatus('TICKET_DISPATCHED');
                            setStatusText("Tickets per E-Mail zugestellt! 🎟️");
                            setProgress(80);
                        }
                    } else if (b2bStatus === 'Served' || b2bStatus === 'Paid' || b2bStatus === 'Verified') {
                        setOrderStatus('RECEIVED');
                        setStatusText("Einlass-Tickets aktiv 📱");
                        setProgress(100);
                        setEta(0);
                    } else {
                        setOrderStatus(b2bStatus.toUpperCase());
                    }
                } else {
                    // For general services/orders
                    if (b2bStatus === 'Received') {
                        setOrderStatus('ORDER RECEIVED');
                        setStatusText(isWashHub ? "Service Scheduled 🧼" : "Order Received • Preparing soon 🍳");
                        setProgress(30);
                    } else if (b2bStatus === 'Preparing') {
                        setOrderStatus('PREPARING');
                        setStatusText(isWashHub ? "Service Scheduled • Preparing 💦" : "Preparing Your Selection 🍽️");
                        setProgress(60);
                    } else if (b2bStatus === 'Ready') {
                        setOrderStatus('READY');
                        setStatusText(isWashHub ? "Service Complete • Vehicle Ready 🚗" : "Order Ready for Collection 🥡");
                        setProgress(80);
                    } else if (b2bStatus === 'Served' || b2bStatus === 'Departed' || b2bStatus === 'Paid') {
                        setOrderStatus('SERVED');
                        setStatusText(isWashHub ? "Service Finalized 🧼" : "Enjoy your meal! ✨");
                        setProgress(100);
                        setEta(0);
                    } else {
                        setOrderStatus(b2bStatus.toUpperCase());
                    }
                }
            }
        };

        const pollTimer = setInterval(checkStatus, 2000);
        window.addEventListener('storage', checkStatus);
        return () => {
            clearInterval(pollTimer);
            window.removeEventListener('storage', checkStatus);
        };
    }, [orderId, statusText]);

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleSettleTab = () => {
        if (hasTickets && orderStatus !== 'RECEIVED' && orderStatus !== 'PENDING_EMAIL_VERIFICATION') {
            triggerToast("Bitte bestätigen Sie den Empfang der Tickets in E-Mail 2! 🎟️");
            return;
        }
        if (hasTickets && orderStatus === 'PENDING_EMAIL_VERIFICATION') {
            handleVerifyEmail();
            return;
        }
        if (orderStatus === 'GROUP ORDER' || isGroupActive || location.state?.paymentMethod === 'group_tab' || location.state?.paymentStatus === 'UNPAID') {
            navigate('/greens');
            return;
        }
        if (paymentStatus === 'PAID' || paymentStatus === 'BILLED TO ROOM') {
            navigate('/order/receipt', { 
                state: { 
                    cart, 
                    venueName, 
                    tableId, 
                    totalCost, 
                    orderId: orderIdValue,
                    isHotel,
                    guestName,
                    paymentStatus,
                    guestDetails
                } 
            });
            return;
        }
        if (orderStatus !== 'SERVED') {
            triggerToast("Order in preparation • Settle once served! 🍽️");
            return;
        }
        setPaymentStep('paying');
        setShowPaymentOptions(true);
    };

    const handleProcessPayment = () => {
        if (selectedMethod === 'cash') {
            setCashWaiting(true);
            socket.emit('request-cash-payment', {
                tableId,
                orderId: orderIdValue,
                amount: totalCost,
                guestName: user?.name || "Guest"
            });
            triggerToast("Cash Request Sent • Please wait for staff.");
            return;
        }

        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setPaymentStep('rating');
            setPaymentStatus('PAID');
            
            // Sync with global hub
            setVenueTickets(prev => prev.map(t => 
                t.id === orderIdValue ? { ...t, paymentStatus: 'PAID', orderStatus: 'SERVED' } : t
            ));
            
            triggerToast("Payment Successful • Digital Receipt Sent ✨");
        }, 2000);
    };

    const handleFinish = () => {
        if (isWashHub) {
            setValetStep('tracking');
            triggerToast(`Valet Dispatched • ${valetName} is picking up your vehicle ⚡`);
            const timer = setInterval(() => {
                setValetEta(prev => Math.max(5, prev - 1));
            }, 60000);
            return () => clearInterval(timer);
        } else {
            triggerToast("Night Rated! Your ride is prioritized. ⚡");
            setTimeout(() => navigate('/green-ride'), 2000);
        }
    };

    const toggleTag = (tag) => {
        setFeedbackTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const vibeImage = "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80&fit=crop";

    return (
        <div className="min-h-screen bg-dark-950 text-primary font-sans relative pb-48">
            <AnimatePresence>
                {showToast && (
                    <motion.div initial={{ y: -50, opacity: 0, x: "-50%" }} animate={{ y: 20, opacity: 1, x: "-50%" }} exit={{ y: -50, opacity: 0, x: "-50%" }} className="fixed top-12 left-1/2 z-[100] px-6 py-3 bg-brand text-dark-950 font-black italic uppercase text-[10px] md:text-xs lg:text-sm rounded-full shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center gap-3 whitespace-nowrap">
                        <Zap size={14} className="fill-dark-900" />
                        {toastMessage}
                    </motion.div>
                )}

                {/* Ticket Generation Floating Alert */}
                {hasTickets && orderStatus === 'TICKET_GENERATING' && (
                    <motion.div 
                        initial={{ y: -100, opacity: 0, x: "-50%" }} 
                        animate={{ y: 20, opacity: 1, x: "-50%" }} 
                        exit={{ y: -100, opacity: 0, x: "-50%" }} 
                        className="fixed top-16 left-1/2 z-[90] w-[calc(100%-2rem)] max-w-md bg-black/90 backdrop-blur-md border border-brand/30 rounded-3xl p-5 shadow-[0_20px_50px_rgba(var(--brand),0.25)] flex items-start gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand border border-brand/20 shrink-0">
                            <Loader2 size={24} className="animate-spin" />
                        </div>
                        <div className="flex-1 space-y-1 text-left">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-brand tracking-widest">System Processing</h4>
                                <span className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Jetzt</span>
                            </div>
                            <p className="text-xs md:text-sm lg:text-base font-black uppercase italic text-white leading-none pt-0.5">Ticket wird generiert...</p>
                            <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-400 font-medium leading-relaxed pt-1">
                                Dein Kauf war erfolgreich. Dein sicheres PDF-Ticket wird erstellt.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Simulated Email / SMS Floating Alerts */}
                {hasTickets && orderStatus === 'PENDING_EMAIL_VERIFICATION' && (
                    <motion.div 
                        initial={{ y: -100, opacity: 0, x: "-50%" }} 
                        animate={{ y: 20, opacity: 1, x: "-50%" }} 
                        exit={{ y: -100, opacity: 0, x: "-50%" }} 
                        className="fixed top-16 left-1/2 z-[90] w-[calc(100%-2rem)] max-w-md bg-black/90 backdrop-blur-md border border-amber-500/30 rounded-3xl p-5 shadow-[0_20px_50px_rgba(245,158,11,0.25)] flex items-start gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shrink-0">
                            <Clock size={24} className="animate-pulse" />
                        </div>
                        <div className="flex-1 space-y-1 text-left">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-amber-500 tracking-widest">Posteingang • Ticket Services</h4>
                                <span className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Jetzt</span>
                            </div>
                            <p className="text-xs md:text-sm lg:text-base font-black uppercase italic text-white leading-none pt-0.5">Bitte verifizieren Sie Ihren Ticketkauf</p>
                            <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-400 font-medium leading-relaxed pt-1">
                                Bestätigungslink gesendet an <strong className="text-gray-200">{guestEmail}</strong>. Verifizieren Sie Ihre E-Mail, um Ihre Eintrittskarten freizuschalten.
                            </p>
                            <div className="pt-2.5 flex items-center justify-between gap-2">
                                <button 
                                    onClick={handleVerifyEmail}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/15"
                                >
                                    Jetzt verifizieren 📧
                                </button>
                                <span className="text-[8px] md:text-[10px] lg:text-xs text-gray-500 font-black uppercase tracking-wider">
                                    Auto-Verify in {secondsLeft}s
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {hasTickets && orderStatus === 'TICKET_DISPATCHED' && (
                    <motion.div 
                        initial={{ y: -100, opacity: 0, x: "-50%" }} 
                        animate={{ y: 20, opacity: 1, x: "-50%" }} 
                        exit={{ y: -100, opacity: 0, x: "-50%" }} 
                        className="fixed top-16 left-1/2 z-[90] w-[calc(100%-2rem)] max-w-md bg-black/90 backdrop-blur-md border border-green-500/30 rounded-3xl p-5 shadow-[0_20px_50px_rgba(34,197,94,0.25)] flex items-start gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20 shrink-0">
                            <Smartphone size={24} className="animate-bounce" />
                        </div>
                        <div className="flex-1 space-y-1 text-left">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-green-500 tracking-widest">Neue SMS • KhiamGreen</h4>
                                <span className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Jetzt</span>
                            </div>
                            <p className="text-xs md:text-sm lg:text-base font-black uppercase italic text-white leading-none pt-0.5">Tickets per E-Mail gesendet! 📧</p>
                            <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-400 font-medium leading-relaxed pt-1">
                                Benachrichtigung an <strong className="text-gray-200">{guestPhone}</strong>. Die Tickets für <span className="text-green-400 font-black italic">{venueName}</span> wurden erfolgreich an Ihre E-Mail <strong className="text-white">{guestEmail}</strong> gesendet.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative h-72 bg-dark-900 overflow-hidden rounded-b-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-b border-white/10">
                <img src={vibeImage} alt="Venue Vibe" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute top-0 left-0 w-full p-6 pt-12 flex justify-between items-center z-10">
                    <button onClick={() => navigate(-1)} className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10 hover:border-brand transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <button 
                        onClick={handleSettleTab} 
                        className={`px-6 py-3 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl transition-all ${
                            orderStatus === 'GROUP ORDER'
                                ? 'bg-brand text-dark-900 shadow-brand/20'
                                : paymentStatus === 'PAID' || paymentStatus === 'BILLED TO ROOM' 
                                    ? 'bg-brand text-dark-900 shadow-brand/20' 
                                    : orderStatus === 'SERVED' 
                                        ? 'bg-brand text-dark-900 shadow-brand/20' 
                                        : 'bg-white/10 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {orderStatus === 'GROUP ORDER' ? 'Group Tab' : paymentStatus === 'PAID' ? (isHotel ? 'Close Folio' : (isStadium || isParking || hasTickets) ? 'Close Mission' : 'Close Table') : paymentStatus === 'BILLED TO ROOM' ? 'View Folio' : orderStatus === 'SERVED' ? 'Settle Bill' : 'Order Pending'}
                    </button>
                </div>
                <div className="absolute bottom-8 left-0 w-full px-8 z-10 text-center">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-xl">{venueName}</h1>
                    <p className="text-[10px] md:text-xs lg:text-sm text-brand font-black uppercase tracking-[0.3em] mt-2 drop-shadow-xl">
                        {tableId === 'Check-in Assigned' ? 'Room Booking' : (isHotel ? 'Room' : 'Table')} {tableId === 'Check-in Assigned' ? '' : tableId} {guestName && `• ${guestName}`}
                    </p>
                </div>
            </div>

            <div id="ticket-receipt-container" className="max-w-lg mx-auto p-6 space-y-8 -mt-6 relative z-20">
                {isWashHub && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-black border-2 border-white/10 rounded-[3rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] relative">
                        <div className="relative h-48">
                            <img src="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80&fit=crop" alt="Wash Hub Facility" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        </div>
                        <div className="absolute -top-3 left-8 px-4 py-1 bg-brand text-black rounded-full text-[7px] font-black uppercase tracking-[0.3em] shadow-lg">Partner Location 📍</div>
                        <div className="p-8 space-y-8">
                            <div className="flex items-start gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand border border-brand/20 shadow-lg shadow-brand/10"><MapPin size={24} /></div>
                                <div>
                                    <h4 className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-brand tracking-[0.2em] mb-1.5">Operational Station</h4>
                                    <p className="text-base font-black text-white uppercase italic tracking-tight">Industrial District 42, 10117 Berlin</p>
                                    <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-gray-400 mt-1.5 uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={10} /> Open until 04:00 AM • Valet Available
                                    </p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-white/10">
                                <div className="flex items-center gap-2 mb-5"><Zap size={14} className="text-brand" /><h4 className="text-[11px] md:text-sm lg:text-base font-black uppercase text-white tracking-[0.2em]">Active Member Privileges</h4></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/10 hover:border-brand/30 transition-all">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase mb-1.5 tracking-widest">VIP Perk</p>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-extrabold text-white uppercase leading-tight">Free Espresso Lounge Access</p>
                                    </div>
                                    <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/10 hover:border-brand/30 transition-all">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase mb-1.5 tracking-widest">Returning</p>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-extrabold text-white uppercase leading-tight">20% Off Next Detailing</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}


                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <Receipt size={18} className="text-gray-500" />
                            <h3 className="text-sm font-black italic uppercase tracking-widest text-gray-500">
                                {isHotelBookingContext ? 'Your Reservation' : 'Your Ticket'}
                            </h3>
                        </div>
                        
                        {isWashHub && (
                            <motion.div 
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="w-12 h-12 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Receipt size={20} strokeWidth={2.5} />
                                </motion.div>
                            </motion.div>
                        )}
                    </div>
                    <div className="bg-dark-900 border border-main rounded-3xl p-6 space-y-4 shadow-lg">
                        {cart.length === 0 ? (
                            <p className="text-xs md:text-sm lg:text-base text-gray-500 font-bold uppercase tracking-widest text-center py-4">No items ordered.</p>
                        ) : isWashHub ? (
                            cart.map((item, index) => (
                                <div key={index} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand border border-white/10 group-hover:border-brand/40 transition-all">
                                            {item.tags?.includes('Drinks') ? <Utensils size={18} /> : <Sparkles size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-xs md:text-sm lg:text-base font-black italic uppercase text-white">{item.name}</p>
                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-widest">{item.tags?.[0] || 'Wash Service'}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black italic text-brand">€{item.price.toFixed(2)}</p>
                                </div>
                            ))
                        ) : (
                            <div className="space-y-4">
                                {activeItems.map((item, index) => {
                                    const isConfirmedContext = isBooking || hasTickets || (isHotel && (item.tags?.includes('Rooms') || item.tags?.includes('Booking') || item.category === 'Rooms' || item.name.toLowerCase().includes('room')));
                                    const isItemConfirmed = ['received', 'sent', 'served'].includes(item.status) || isConfirmedContext;
                                    
                                    return (
                                        <div key={index} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border transition-all ${isItemConfirmed ? 'border-brand/40 text-brand' : 'border-white/10 text-gray-500'}`}>
                                                    {isItemConfirmed ? <CheckCircle size={18} /> : <Loader2 size={18} className="animate-spin" />}
                                                </div>
                                                <div>
                                                    <p className={`text-xs md:text-sm lg:text-base font-black italic uppercase transition-colors ${isItemConfirmed ? 'text-primary' : 'text-gray-500'}`}>{item.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${isItemConfirmed || ['served'].includes(item.status) ? 'bg-brand/10 text-brand' : 'bg-white/5 text-gray-600'}`}>
                                                            {isConfirmedContext && !['received', 'sent', 'served'].includes(item.status) ? 'Confirmed' : item.status === 'received' ? 'Received' : item.status === 'sent' ? 'Sent' : item.status === 'served' ? 'Served' : 'Pending'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm font-black italic text-brand">€{item.price.toFixed(2)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {hasTickets && orderStatus === 'PENDING_EMAIL_VERIFICATION' && (
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 mt-2 space-y-4 text-left">
                                <div className="text-center space-y-1">
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-amber-500 uppercase tracking-[0.2em]">Sicherheitsüberprüfung</p>
                                    <p className="text-[11px] md:text-sm lg:text-base font-extrabold text-white uppercase italic tracking-tight">Warte auf E-Mail-Bestätigung...</p>
                                </div>
                                <p className="text-[9.5px] text-gray-400 font-medium leading-relaxed text-center px-2">
                                    Bitte verifizieren Sie den Kauf über den Bestätigungslink, den wir an Ihre verifizierte E-Mail-Adresse gesendet haben.
                                </p>
                                
                                <div className="space-y-2 pt-2.5 border-t border-white/5">
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Empfänger-E-Mail-Adresse</p>
                                    {isEditingEmail ? (
                                        <div className="flex gap-2">
                                            <input 
                                                type="email"
                                                value={tempEmail}
                                                onChange={(e) => setTempEmail(e.target.value)}
                                                className="flex-1 bg-black border border-amber-500/40 rounded-xl px-3 py-2 text-xs md:text-sm lg:text-base font-bold text-white focus:outline-none focus:border-amber-500"
                                            />
                                            <button 
                                                onClick={handleResendEmail}
                                                className="px-4 py-2 bg-amber-500 text-black text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                                            >
                                                Senden
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5">
                                            <span className="text-xs md:text-sm lg:text-base font-bold text-amber-500">{guestEmail}</span>
                                            <button 
                                                onClick={() => setIsEditingEmail(true)}
                                                className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-400 hover:text-white uppercase tracking-widest border-b border-gray-600/30 pb-0.5"
                                            >
                                                Ändern & Neu senden
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="pt-2">
                                    <button 
                                        onClick={handleVerifyEmail}
                                        className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.2em] text-amber-500 transition-all shadow-md shadow-amber-500/5"
                                    >
                                        E-Mail verifizieren (Simulation) 📧
                                    </button>
                                </div>
                            </div>
                        )}

                        {hasTickets && (orderStatus === 'TICKET_DISPATCHED' || orderStatus === 'RECEIVED') && (
                            <div className="bg-glass border border-brand/20 rounded-2xl p-5 mt-2 space-y-4 text-left relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-[50px] rounded-full -mr-10 -mt-10" />
                                
                                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center border border-brand/20"><Ticket size={20} /></div>
                                        <div>
                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-[0.25em]">E-MAIL-EINGANG 2</p>
                                            <p className="text-xs md:text-sm lg:text-base font-black italic uppercase text-primary tracking-tight">Ihre Eintrittskarten sind da! 🎟️</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded text-[7px] font-black uppercase tracking-widest ${orderStatus === 'RECEIVED' ? 'bg-brand text-dark-900 shadow-[0_0_15px_var(--brand)]' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'}`}>
                                        {orderStatus === 'RECEIVED' ? 'BESTÄTIGT' : 'UNBESTÄTIGT'}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] md:text-xs lg:text-sm text-gray-400 font-medium leading-relaxed">
                                        {orderStatus === 'RECEIVED' 
                                            ? "Vielen Dank! Sie haben den Erhalt der Eintrittskarten erfolgreich bestätigt. Die Tickets sind in Ihrer Wallet aktiv und bereit für den Einlass."
                                            : "Die originalen Tickets wurden von unserem System generiert. Bitte bestätigen Sie den Empfang der E-Mail unten, um die Eintrittskarten für den Einlass freizuschalten."}
                                    </p>

                                    <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-2.5">
                                        <div className="flex justify-between items-center text-[9px] md:text-[11px] lg:text-xs"><span className="text-gray-500 font-bold uppercase tracking-wider">Veranstaltung:</span><span className="text-white font-black uppercase italic">{venueName}</span></div>
                                        <div className="flex justify-between items-center text-[9px] md:text-[11px] lg:text-xs"><span className="text-gray-500 font-bold uppercase tracking-wider">Empfänger:</span><span className="text-green-400 font-black">{guestEmail}</span></div>
                                        <div className="flex justify-between items-center text-[9px] md:text-[11px] lg:text-xs"><span className="text-gray-500 font-bold uppercase tracking-wider">Ticket Typ:</span><span className="text-brand font-black uppercase italic">Mobile E-Ticket</span></div>
                                        <div className="flex justify-between items-center text-[9px] md:text-[11px] lg:text-xs"><span className="text-gray-500 font-bold uppercase tracking-wider">Status:</span><span className={`px-2 py-0.5 rounded font-black text-[7px] tracking-widest uppercase ${orderStatus === 'RECEIVED' ? 'bg-brand/10 text-brand' : 'bg-amber-500/10 text-amber-500'}`}>{orderStatus === 'RECEIVED' ? 'AKTIV' : 'WARTE AUF BESTÄTIGUNG'}</span></div>
                                    </div>

                                    {orderStatus === 'TICKET_DISPATCHED' ? (
                                        <div className="pt-1">
                                            <button 
                                                onClick={handleConfirmReceipt}
                                                className="w-full py-3 bg-brand text-dark-900 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.25em] shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                            >
                                                Empfang bestätigen 🎟️
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-brand/5 border border-brand/20 rounded-xl flex items-center justify-center gap-3 text-brand">
                                            <CheckCircle size={16} />
                                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest">Empfang am {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uhr bestätigt • Eintritt aktiv</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {guestDetails && isBooking && (
                            <div className="bg-glass border border-brand/20 rounded-2xl p-5 mt-2 space-y-3 relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-[50px] rounded-full -mr-10 -mt-10" />
                                <div className="flex items-center gap-2 mb-2 relative z-10">
                                    <div className="w-1.5 h-1.5 bg-brand rounded-full" />
                                    <h4 className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-brand tracking-[0.2em] leading-none">Registration Overview</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-2 relative z-10">
                                    <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-1">
                                        <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest block">Check-In</span>
                                        <span className="text-xs md:text-sm lg:text-base font-black italic text-white block">{guestDetails.checkIn || 'N/A'}</span>
                                    </div>
                                    <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-1">
                                        <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest block">Check-Out</span>
                                        <span className="text-xs md:text-sm lg:text-base font-black italic text-white block">{guestDetails.checkOut || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-2 relative z-10">
                                    <div className="flex justify-between items-center text-[9px] md:text-[11px] lg:text-xs">
                                        <span className="text-gray-500 font-bold uppercase tracking-wider">Booking Type:</span>
                                        <span className={`font-black uppercase tracking-widest ${guestDetails.bookingType === 'business' ? 'text-brand' : 'text-white'}`}>
                                            {guestDetails.bookingType === 'business' ? 'Business' : 'Private'}
                                        </span>
                                    </div>
                                    {guestDetails.bookingType === 'business' && guestDetails.companyName && (
                                        <>
                                            <div className="flex justify-between items-center text-[9px] md:text-[11px] lg:text-xs">
                                                <span className="text-gray-500 font-bold uppercase tracking-wider">Company:</span>
                                                <span className="text-white font-black uppercase italic truncate max-w-[150px]">{guestDetails.companyName}</span>
                                            </div>
                                            {guestDetails.companyAddress && (
                                                <div className="flex justify-between items-center text-[9px] md:text-[11px] lg:text-xs">
                                                    <span className="text-gray-500 font-bold uppercase tracking-wider">Address:</span>
                                                    <span className="text-gray-300 font-black uppercase italic truncate max-w-[150px]">{guestDetails.companyAddress}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-dashed border-main space-y-3 mt-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500">
                                    {(isStadium || hasTickets) ? t('ticketStatus') : isParking ? 'Pass Status' : isWashHub ? 'Service Status' : isBooking ? t('bookingStatus') : t('orderStatus')}
                                </span>
                                <span className={`text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-2 ${
                                    orderStatus === 'GROUP ORDER'
                                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                        : orderStatus === 'PENDING_EMAIL_VERIFICATION'
                                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                                            : ['SERVED', 'DISPATCHED', 'TICKET_DISPATCHED', 'RECEIVED'].includes(orderStatus) 
                                                ? 'bg-green-500/10 text-green-500' 
                                                : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                    {['PENDING', 'PENDING_EMAIL_VERIFICATION'].includes(orderStatus) && <Loader2 size={10} className="animate-spin" />}
                                    {orderStatus === 'PENDING_EMAIL_VERIFICATION' 
                                        ? (hasTickets ? 'WAITING FOR EMAIL' : 'ORDER RECEIVED') 
                                        : orderStatus === 'TICKET_DISPATCHED' 
                                            ? (hasTickets ? 'SMS DELIVERED' : 'READY') 
                                            : (orderStatus === 'SERVED' && isBooking) 
                                                ? 'CHECKED IN' 
                                                : (orderStatus === 'CONFIRMED' ? t('confirmed') : orderStatus)} {['PENDING', 'PENDING_EMAIL_VERIFICATION'].includes(orderStatus) && `| 00:${secondsLeft < 10 ? '0'+secondsLeft : secondsLeft}`}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500">{t('paymentStatus')}</span>
                                <span className={`text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                    hasTickets || paymentStatus === 'PAID' || paymentStatus === 'BILLED TO ROOM' 
                                        ? 'bg-green-500/10 text-green-500' 
                                        : (paymentStatus === 'UNPAID' && isGroupActive)
                                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black'
                                            : paymentStatus === 'UNPAID'
                                                ? 'bg-red-500/20 text-red-400 border border-red-500/20 font-black'
                                                : 'bg-red-500/10 text-red-500'
                                }`}>
                                    {hasTickets ? t('paid') : paymentStatus === 'PAID' ? t('paid') : (paymentStatus === 'UNPAID' && isGroupActive ? 'PAYMENTS PENDING' : paymentStatus)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-gray-500">{t('totalCharged')}</span>
                                <span className="text-2xl font-black italic text-brand">€{totalCost.toFixed(2)}</span>
                            </div>

                            <div className="pt-3 border-t border-dashed border-main/40 mt-3">
                                <button
                                    onClick={handleOpenEmailModal}
                                    className={`w-full py-3.5 px-4 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 ${
                                        emailSent
                                            ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                                            : 'bg-brand text-black hover:bg-brand/90 shadow-brand/20'
                                    }`}
                                >
                                    {emailSent ? (
                                        <>
                                            <CheckCircle size={14} className="text-green-400" />
                                            <span>{t('emailConfirmationSent')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Mail size={14} />
                                            <span>{t('sendEmailConfirmation')}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-primary via-bg-primary/90 to-transparent z-40">
                    <div className="max-w-lg mx-auto space-y-3">
                        <button onClick={() => navigate(-1)} className="w-full py-4 bg-black border border-white/10 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest transition-all text-white flex items-center justify-center gap-2 shadow-xl hover:bg-neutral-900 active:scale-95">
                            {t('backToMenu')}
                        </button>
                        <button 
                            onClick={handleSettleTab} 
                            className="w-full py-5 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all bg-black text-white border border-white/20"
                        >
                            {(orderStatus === 'GROUP ORDER' || isGroupActive || location.state?.paymentMethod === 'group_tab' || location.state?.paymentStatus === 'UNPAID')
                                ? 'Go to Group Tab Ledger'
                                : paymentStatus === 'PAID' 
                                    ? (isHotel ? t('closeFolio') : (isStadium || isParking || hasTickets) ? t('closeMission') : t('closeTable')) 
                                    : t('settleTab')}
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showPaymentOptions && (
                    <div className="fixed inset-0 z-[60] flex items-end justify-center">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPaymentOptions(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} className="bg-dark-950 border-t border-x border-main rounded-t-[3.5rem] p-8 pb-12 space-y-8 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative z-10 w-full max-w-lg overflow-y-auto no-scrollbar max-h-[90vh]">
                            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-2" />
                            
                                {cashWaiting ? (
                                    <div className="space-y-6 py-10 text-center">
                                        <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center text-brand mx-auto mb-4 border border-brand/20"><Banknote size={40} /></div>
                                        <h3 className="text-2xl font-black italic uppercase text-primary">Pending Staff</h3>
                                        <p className="text-[10px] md:text-xs lg:text-sm text-gray-500 font-bold uppercase tracking-widest leading-relaxed px-12">Please have €{totalCost.toFixed(2)} ready. A staff member is approaching {isHotel ? 'Room' : isWashHub ? 'Ticket' : 'Table'} {tableId} to collect your payment.</p>
                                        <button onClick={() => setCashWaiting(false)} className="text-[10px] md:text-xs lg:text-sm font-black text-red-500 uppercase tracking-widest border-b border-red-500/30 pb-1">Cancel & Pay with Card</button>
                                    </div>
                                ) : valetStep === 'tracking' ? (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
                                        <div className="text-center space-y-4">
                                            <div className="w-24 h-24 rounded-full mx-auto p-1 bg-brand/20 border-2 border-brand/40 shadow-[0_0_40px_rgba(255,255,255,0.1)] relative overflow-hidden group">
                                                <img 
                                                    src="/C:/Users/AURUMPC/.gemini/antigravity/brain/70a19bc6-0053-4f6e-95c5-85cd3079991d/valet_agent_marco_1777755675315.png" 
                                                    alt="Valet Agent Marco"
                                                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-brand/20 to-transparent" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black italic uppercase text-primary tracking-tighter">Valet Returning</h3>
                                                <p className="text-[10px] md:text-xs lg:text-sm text-brand font-black uppercase tracking-[0.3em]">Vehicle: Black Porsche 911</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-dark-900 border border-main rounded-3xl p-6 text-center space-y-1"><p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Return ETA</p><p className="text-2xl font-black italic text-primary">{valetEta}m</p></div>
                                            <div className="bg-dark-900 border border-main rounded-3xl p-6 text-center space-y-1"><p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-500 uppercase tracking-widest">Valet Agent</p><p className="text-2xl font-black italic text-brand">{valetName}</p></div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-2"><p className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-primary tracking-widest">Add a Tip for {valetName}</p><p className="text-sm font-black italic text-brand">€{tipAmount}</p></div>
                                            <div className="flex gap-2">
                                                {[2, 5, 10, 20].map((amt) => (
                                                    <button key={amt} onClick={() => setTipAmount(amt)} className={`flex-1 py-4 rounded-2xl border text-xs md:text-sm lg:text-base font-black transition-all ${tipAmount === amt ? 'bg-brand border-brand text-black shadow-lg' : 'bg-dark-900 border-main text-gray-500'}`}>€{amt}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <button onClick={() => { triggerToast("Tip Confirmed! Thank you for the support. ✨"); setTimeout(() => navigate('/greens'), 2000); }} className="w-full py-6 bg-brand text-dark-900 rounded-[2.5rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20 transition-all active:scale-95">Finish & Head Out</button>
                                    </div>
                                ) : paymentStep === 'rating' ? (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="text-center space-y-2">
                                            <h3 className="text-2xl font-black italic uppercase text-primary tracking-tighter">Rate Your {isWashHub ? 'Service' : 'Night'}</h3>
                                            <p className="text-[10px] md:text-xs lg:text-sm text-brand font-black uppercase tracking-[0.3em]">Transaction Successful</p>
                                        </div>
                                        <div className="flex justify-center gap-4">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button key={star} onClick={() => setRating(star)} className="transition-all active:scale-75">
                                                    <Star 
                                                        size={40} 
                                                        className={rating >= star ? "fill-black text-black" : "text-gray-800"} 
                                                        style={rating >= star ? { filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.1))' } : {}} 
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {feedbackOptions.map((opt) => (
                                                <button key={opt.label} onClick={() => toggleTag(opt.label)} className={`px-4 py-3 rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest border transition-all ${feedbackTags.includes(opt.label) ? 'bg-brand border-brand text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-dark-900 border-main text-gray-500 hover:border-brand/30'}`}>{opt.emoji} {opt.label}</button>
                                            ))}
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <button 
                                                onClick={() => {
                                                    setVenueTickets(prev => prev.map(t => t.id === orderIdValue ? { ...t, paymentStatus: 'PAID', orderStatus: 'SERVED' } : t));
                                                    handleFinish();
                                                }}
                                                className="w-full py-6 bg-black text-white rounded-[2.5rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4 group"
                                            >
                                                {isWashHub ? 'Whistle Valet Now' : 'Whistle Ride Now'}
                                                <Zap size={18} className="fill-white group-hover:scale-110 transition-transform" />
                                            </button>
                                            {!isWashHub && (
                                                <button onClick={() => { triggerToast("Rating Saved! drivers notified. ✨"); setTimeout(() => navigate('/green-ride'), 2000); }} className="w-full py-5 bg-black border border-main rounded-[2.5rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-white/60 hover:text-white transition-all">Whistle Later</button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-center space-y-2">
                                            <h3 className="text-2xl font-black italic uppercase text-primary tracking-tighter">Settle Bill</h3>
                                            <p className="text-[10px] md:text-xs lg:text-sm text-brand font-black uppercase tracking-[0.3em]">Order Served • {isHotel ? 'Room' : 'Table'} {tableId}</p>
                                        </div>
                                        <div className="bg-dark-900 border border-main rounded-3xl p-8 text-center space-y-2">
                                            <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-600 uppercase tracking-widest">Final Amount</p>
                                            <h2 className="text-5xl font-black italic text-primary">€{totalCost.toFixed(2)}</h2>
                                            <p className="text-[7px] font-black text-green-500/60 uppercase tracking-widest pt-2">Order Status: SERVED</p>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-600 uppercase tracking-widest ml-4">Select Method</p>
                                            {[
                                                ...(isHotel ? [{ id: 'room_charge', name: 'Billed to Room', icon: BedDouble, color: 'text-white' }] : []),
                                                { id: 'card', name: 'Credit / Bank Card', icon: CreditCard, color: 'text-white' },
                                                { id: 'paypal', name: 'PayPal', icon: Smartphone, color: 'text-[#0070ba]' },
                                                { id: 'klarna', name: 'Klarna', icon: ShoppingBag, color: 'text-[#ffb3c7]' }
                                            ].map((method) => {
                                                const isSelected = selectedMethod === method.id;
                                                return (
                                                    <div key={method.id} className="space-y-2">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedMethod(method.id);
                                                                if (method.id !== 'card') setSelectedSavedCard(null);
                                                            }} 
                                                            className={`w-full p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all ${isSelected ? 'bg-black border-brand text-white shadow-[0_0_30px_rgba(255,255,255,0.1)] scale-[1.02]' : 'bg-dark-900 border-main hover:border-brand/30'}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isSelected ? 'bg-white/10 text-white' : 'bg-dark-950 text-gray-600'}`}>
                                                                    <method.icon size={24} />
                                                                </div>
                                                                <span className={`text-xs md:text-sm lg:text-base font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-gray-500'}`}>{method.name}</span>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-black" />
                                                                </div>
                                                            )}
                                                        </button>

                                                        {/* Secure Hub Saved Cards */}
                                                        {method.id === 'card' && isSelected && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                className="grid grid-cols-1 gap-2 pl-4 pr-2"
                                                            >
                                                                {[
                                                                    { id: 'personal', label: 'Personal Visa', last4: '4421', type: 'VISA' },
                                                                    { id: 'business', label: 'Corporate Card', last4: '8892', type: 'MC' }
                                                                ].map(card => (
                                                                    <button 
                                                                        key={card.id}
                                                                        onClick={() => setSelectedSavedCard(card.id)}
                                                                        className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${selectedSavedCard === card.id ? 'bg-black border-brand text-white shadow-lg' : 'bg-dark-900 border-main text-gray-500 hover:border-brand/20'}`}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[8px] md:text-[10px] lg:text-xs font-black ${selectedSavedCard === card.id ? 'bg-white/10 text-white' : 'bg-white/5'}`}>{card.type}</div>
                                                                            <div className="text-left">
                                                                                <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest">{card.label}</p>
                                                                                <p className={`text-[8px] md:text-[10px] lg:text-xs font-bold uppercase tracking-[0.2em] ${selectedSavedCard === card.id ? 'text-white/40' : 'text-gray-600'}`}>**** **** **** {card.last4}</p>
                                                                            </div>
                                                                        </div>
                                                                        {selectedSavedCard === card.id && <Check size={14} className="text-brand" />}
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-4">
                                            <button onClick={() => setShowPaymentOptions(false)} className="flex-1 py-6 bg-dark-900 border border-main rounded-[2.5rem] text-[11px] md:text-sm lg:text-base font-black uppercase tracking-widest text-gray-500 hover:text-primary transition-all">Cancel</button>
                                            <button 
                                                onClick={handleProcessPayment} 
                                                disabled={isProcessing || !selectedMethod || (selectedMethod === 'card' && !selectedSavedCard)} 
                                                className="flex-[2] py-6 bg-black text-white border-2 border-brand rounded-[2.5rem] text-[11px] md:text-sm lg:text-base font-black uppercase tracking-[0.3em] shadow-xl shadow-brand/20 transition-all active:scale-95 flex items-center justify-center gap-4 relative overflow-hidden disabled:opacity-30"
                                            >
                                                {isProcessing ? (
                                                    <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />Verifying...</>
                                                ) : (
                                                    <>{isHotel ? 'Authorize Folio Charge' : `Secure Pay €${totalCost.toFixed(2)}`}<ShieldCheck size={18} className="fill-white" /></>
                                                )}
                                                {isProcessing && <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />}
                                            </button>
                                        </div>
                                    </>
                                )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Full Screen QR Modal */}
            <AnimatePresence>
                {showFullQR && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-dark-950/95 backdrop-blur-3xl flex items-center justify-center p-8"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-sm bg-white rounded-[4rem] p-12 space-y-12 shadow-[0_0_100px_rgba(255,255,255,0.1)] text-dark-900"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Gate Entry</h2>
                                <p className="text-[10px] md:text-xs lg:text-sm font-bold uppercase tracking-[0.4em] text-gray-400 italic">High-Contrast Optical Key</p>
                            </div>

                            <div className="aspect-square bg-dark-900 rounded-[3rem] p-10 relative overflow-hidden flex items-center justify-center shadow-2xl">
                                <QrCode size={180} className="text-white" />
                                <motion.div 
                                    animate={{ y: [-150, 150, -150] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 right-0 h-1 bg-brand shadow-[0_0_20px_var(--brand)]"
                                />
                            </div>

                            <div className="space-y-6 pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-gray-400">License Plate</span>
                                    <span className="text-sm font-black italic uppercase">{parkingPass?.plate}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-gray-400">Location</span>
                                    <span className="text-sm font-black italic uppercase text-brand">P-Level 3, B-12</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowFullQR(false)}
                                className="w-full py-6 bg-dark-900 text-white rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all active:scale-95"
                            >
                                Exit Scan View
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* E-Mail Reservation Confirmation Voucher Modal */}
            <AnimatePresence>
                {showEmailModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 overflow-y-auto"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 30 }}
                            className="w-full max-w-lg bg-dark-950 border border-main/60 rounded-[2.5rem] shadow-2xl overflow-hidden text-white my-auto"
                        >
                            {/* Header */}
                            <div className="bg-dark-900 px-6 py-5 border-b border-main flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-white">
                                            {isStadiumTicket ? t('emailStadiumVoucherTitle') : t('emailVoucherTitle')}
                                        </h3>
                                        <p className="text-[10px] md:text-xs text-brand font-bold uppercase tracking-widest">
                                            {isStadiumTicket ? t('officialStadiumVoucher') : t('officialVoucher')}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowEmailModal(false)}
                                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Email Container / Body */}
                            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">
                                {/* Email Meta Header */}
                                <div className="bg-dark-900/80 border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                        <span className="text-gray-500 font-bold uppercase text-[9px] md:text-[10px]">{t('recipient')}:</span>
                                        <span className="font-mono font-bold text-brand">{guestEmail}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                        <span className="text-gray-500 font-bold uppercase text-[9px] md:text-[10px]">{t('sender')}:</span>
                                        <span className="font-mono text-gray-300">
                                            {isStadiumTicket ? 'tickets@khiam-green.de' : 'reservierung@green-hotels.de'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-bold uppercase text-[9px] md:text-[10px]">{t('subject')}:</span>
                                        <span className="font-bold text-white text-[11px] truncate max-w-[240px]">
                                            {isStadiumTicket ? t('emailStadiumVoucherTitle') : t('emailVoucherTitle')} #{String(orderIdValue).slice(-6)} - {venueName}
                                        </span>
                                    </div>
                                </div>

                                {/* Email Voucher Preview Card */}
                                <div className="bg-white text-dark-950 rounded-3xl p-6 space-y-5 shadow-xl relative overflow-hidden">
                                    <div className="border-b-2 border-dashed border-gray-200 pb-4 text-center space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-600">
                                            {isStadiumTicket ? 'GREEN STADIUM & ARENA • E-TICKET' : 'GREEN HOTELS & RESORTS'}
                                        </p>
                                        <h4 className="text-lg font-black uppercase italic tracking-tight text-dark-950">{venueName || (isStadiumTicket ? 'Olympiastadion Berlin' : 'Grand Hotel & Resort')}</h4>
                                        <p className="text-[10px] font-bold text-gray-500 flex items-center justify-center gap-1">
                                            <MapPin size={12} className="text-emerald-600" />
                                            {location.state?.venueAddress || (isStadiumTicket ? 'Olympischer Platz 3, 14053 Berlin' : 'Kurfürstendamm 100, 10709 Berlin')}
                                        </p>
                                    </div>

                                    {/* Confirmation Badge */}
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={18} className="text-emerald-600" />
                                            <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                                                {isStadiumTicket ? t('stadiumTicketConfirmed') : t('reservationConfirmed')}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white px-2 py-0.5 rounded-md">{t('paid')} ✓</span>
                                    </div>

                                    {/* Conditional Grid: Stadium Event Times OR Hotel Check-in */}
                                    {isStadiumTicket ? (
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div className="bg-gray-50 rounded-2xl p-3 space-y-1">
                                                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                                                    <Clock size={11} className="text-emerald-600" /> Spiel- / Eventzeit
                                                </p>
                                                <p className="font-black text-dark-950">24. Mai 2026</p>
                                                <p className="text-[10px] font-bold text-emerald-700">Anpfiff: 20:30 Uhr</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-2xl p-3 space-y-1">
                                                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                                                    <Zap size={11} className="text-emerald-600" /> Stadion Einlass
                                                </p>
                                                <p className="font-black text-dark-950">Gate B / Block 4</p>
                                                <p className="text-[10px] font-bold text-gray-500">ab 18:30 Uhr</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div className="bg-gray-50 rounded-2xl p-3 space-y-1">
                                                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                                                    <Calendar size={11} className="text-emerald-600" /> {t('checkIn')}
                                                </p>
                                                <p className="font-black text-dark-950">19. Mai 2026</p>
                                                <p className="text-[10px] font-bold text-gray-500">ab 15:00 Uhr</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-2xl p-3 space-y-1">
                                                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                                                    <Calendar size={11} className="text-emerald-600" /> {t('checkOut')}
                                                </p>
                                                <p className="font-black text-dark-950">21. Mai 2026</p>
                                                <p className="text-[10px] font-bold text-gray-500">bis 11:00 Uhr</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Ticket Holder & Details */}
                                    <div className="space-y-3 pt-1 border-t border-gray-100 text-xs">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                                                <Ticket size={13} className="text-emerald-600" /> {isStadiumTicket ? 'Sitzplatz / Kategorie:' : `${t('roomQuantity')}:`}
                                            </span>
                                            <span className="font-black text-dark-950">
                                                {cart.map(i => `${i.quantity || 1}x ${i.name}`).join(', ') || (isStadiumTicket ? '1x VIP Lounge Ticket (Block B, Reihe 12)' : '1x Delux (Single Bed)')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                                                <Users size={13} className="text-emerald-600" /> {isHotelBookingContext ? 'Gast / Inhaber:' : 'Ticket-Inhaber:'}
                                            </span>
                                            <span className="font-black text-dark-950">
                                                {guestName || user?.displayName || 'Azizi Khiam'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                                                <CreditCard size={13} className="text-emerald-600" /> {t('billing')}:
                                            </span>
                                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] uppercase">
                                                {t('paid')} (Online Card)
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                                            <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                                                🚐 Shuttle-Service:
                                            </span>
                                            {guestDetails?.hasShuttleService ? (
                                                <div className="text-right">
                                                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] uppercase inline-block">
                                                        ✓ Gebucht ({guestDetails?.shuttlePersons || 1} Pers. • {guestDetails?.shuttleLuggage || 0} Koffer)
                                                    </span>
                                                    {guestDetails?.shuttlePickupAddress && (
                                                        <span className="block text-[9px] text-gray-500 font-medium truncate max-w-[200px]">
                                                            📍 {guestDetails.shuttlePickupAddress}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md text-[10px] uppercase">
                                                    Nicht gebucht
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* High-Contrast Optical Scan QR-Code inside E-Mail Confirmation Voucher */}
                                    {isStadiumTicket && (
                                        <div className="pt-3 border-t border-gray-100 text-center space-y-2">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('opticalScanKey')}</p>
                                            
                                            {customQrCode ? (
                                                <div className="space-y-2">
                                                    <div className="w-32 h-32 bg-white rounded-2xl mx-auto p-2 flex items-center justify-center shadow-lg border-2 border-emerald-500 overflow-hidden">
                                                        {customQrCode.startsWith('http://') || customQrCode.startsWith('https://') ? (
                                                            <QrCode size={96} className="text-dark-950" />
                                                        ) : (
                                                            <img src={customQrCode} alt="Stadion E-Ticket QR Code" className="w-full h-full object-contain" />
                                                        )}
                                                    </div>
                                                    {(customQrCode.startsWith('http://') || customQrCode.startsWith('https://')) && (
                                                        <a 
                                                            href={customQrCode} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all"
                                                        >
                                                            🎟️ In Wallet / Stadion-Link öffnen
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-28 h-28 bg-dark-950 rounded-2xl mx-auto p-3 flex items-center justify-center relative overflow-hidden shadow-lg border-2 border-emerald-500">
                                                    <QrCode size={84} className="text-white" />
                                                    <motion.div 
                                                        animate={{ y: [-40, 40, -40] }}
                                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                        className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_10px_#10b981]"
                                                    />
                                                </div>
                                            )}

                                            <p className="text-[9px] font-mono font-bold text-emerald-700">
                                                {customQrCode ? `STADION-SCAN KEY (#TK-${String(orderIdValue).slice(-6)})` : `CODE: ST-${String(orderIdValue).slice(-5)}-OPTICAL-KEY`}
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-3 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">{t('totalCharged')}</p>
                                            <p className="text-xl font-black text-dark-950 italic">€{totalCost.toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">
                                                {isHotelBookingContext ? t('bookingId') : 'Ticket ID'}
                                            </p>
                                            <p className="text-xs font-mono font-bold text-emerald-700">
                                                {isHotelBookingContext ? `#BK-${String(orderIdValue).slice(-6)}` : `#TK-${String(orderIdValue).slice(-6)}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="p-6 bg-dark-900 border-t border-main flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        handleSendEmailConfirmation();
                                        setTimeout(() => setShowEmailModal(false), 1500);
                                    }}
                                    disabled={isSendingEmail}
                                    className="w-full py-4 bg-brand text-black rounded-2xl text-xs md:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-xl shadow-brand/20 hover:bg-brand-bright transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSendingEmail ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin text-black" />
                                            <span>{t('sendingEmail')}</span>
                                        </>
                                    ) : emailSent ? (
                                        <>
                                            <CheckCircle size={16} className="text-black" />
                                            <span>{t('resendEmail')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            <span>{t('sendEmailNow')}</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowEmailModal(false)}
                                    className="w-full py-3 bg-dark-950 border border-main/50 text-gray-400 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                                >
                                    {t('close')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrderTrackerPage;
