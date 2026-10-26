import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Trash2, ArrowLeft, Loader2, ChevronRight,
    Utensils, PlusCircle, Sparkles, Upload, BedDouble, Ticket, Check, Bus,
    CheckCircle2, Clock, X, Calendar, User, Mail, Phone, ShieldCheck,
    CheckSquare, Square, Bell, Search, ChevronDown, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { getShuttleFareConfig } from '../utils/shuttleFareHelper';

const getCategoryOptionsForContext = (ctx) => {
    if (ctx === 'HM') {
        return [
            { value: 'Doppelzimmer', label: 'Doppelzimmer / Comfort Suite' },
            { value: 'Einzelzimmer', label: 'Einzelzimmer' },
            { value: 'Deluxe Suite', label: 'Deluxe Suite' },
            { value: 'Executive Suite', label: 'Executive Suite' },
            { value: 'Penthouse', label: 'Presidential Penthouse' },
            { value: 'Family Suite', label: 'Familien Suite' },
            { value: 'Standard Room', label: 'Standard / Comfort Zimmer' },
            { value: 'Spa Suite', label: 'Spa & Wellness Suite' },
            { value: 'Shuttle Package', label: 'Zimmer + VIP Shuttle Package' }
        ];
    }
    if (ctx === 'SM' || ctx === 'VM') {
        return [
            { value: 'Fußball & Sport', label: '⚽ Fußball & Sport' },
            { value: 'Konzerte & Shows', label: '🎸 Konzerte & Shows' },
            { value: 'VVIP & Logen', label: '👑 VVIP & Logen' },
            { value: 'Events & Shows', label: '🎟️ Events & Shows' },
            { value: 'Bundesliga', label: '🏆 Bundesliga' },
            { value: 'Champions League', label: '⭐ Champions League' },
            { value: 'DFB-Pokal', label: '🥇 DFB-Pokal' },
            { value: 'Motorsport & Racing', label: '🏎️ Motorsport & Racing' },
            { value: 'Festival & Open Air', label: '🎪 Festival & Open Air' }
        ];
    }
    if (ctx === 'WM') {
        return [
            { value: 'Detailing', label: 'Wash & Detailing' },
            { value: 'Service', label: 'Interior Service' },
            { value: 'Addon', label: 'Addon & Extras' },
            { value: 'Drinks', label: 'Lobby Drinks & Soda' },
            { value: 'Coffee', label: 'Lobby Coffee & Snacks' }
        ];
    }
    if (ctx === 'PM') {
        return [
            { value: 'Standard', label: 'Standard Parking Bay' },
            { value: 'Utility', label: 'EV Charger Bay' },
            { value: 'Drinks', label: 'Vending Drinks' },
            { value: 'Coffee', label: 'Vending Coffee' }
        ];
    }
    if (ctx === 'BM') {
        return [
            { value: 'Food', label: 'Food / Dining' },
            { value: 'Drinks', label: 'Drinks & Beverages' },
            { value: 'Shisha', label: 'Shisha / Hookah' },
            { value: 'Coffee', label: 'Coffee & Hot Drinks' },
            { value: 'Breakfast', label: 'Breakfast / Frühstück' },
            { value: 'Dessert', label: 'Dessert & Sweets' }
        ];
    }
    if (ctx === 'CM') {
        return [
            { value: 'Tickets', label: 'Entry Tickets / Passes' },
            { value: 'VIP', label: 'VIP Table / Premium Booking' },
            { value: 'Drinks', label: 'Drinks & Beverages' },
            { value: 'Food', label: 'Food / Dining' },
            { value: 'Shisha', label: 'Shisha / Hookah' }
        ];
    }
    // Default RM (Restaurant)
    return [
        { value: 'Food', label: 'Food / Dining' },
        { value: 'Drinks', label: 'Drinks & Beverages' },
        { value: 'Coffee', label: 'Coffee & Hot Drinks' },
        { value: 'Breakfast', label: 'Breakfast / Frühstück' },
        { value: 'Dessert', label: 'Dessert & Sweets' }
    ];
};

const getTicketTypeOptionsForContext = (ctx) => {
    if (ctx === 'SM' || ctx === 'VM') {
        return [
            { value: 'Sitzplatz', label: '💺 Sitzplatz Ticket' },
            { value: 'Stehplatz', label: '🧍 Stehplatz / Block' },
            { value: 'VIP Box', label: '👑 VIP Box / Loge' },
            { value: 'Haupttribüne', label: '🏟️ Haupttribüne' },
            { value: 'Gegengerade', label: '🏟️ Gegengerade' },
            { value: 'Nordkurve', label: '🚩 Nordkurve' },
            { value: 'Südkurve', label: '🚩 Südkurve' },
            { value: 'Executive Lounge', label: '🥂 Executive Lounge Pass' },
            { value: 'Valet Package', label: '🅿️ Valet Package' }
        ];
    }
    return [
        { value: 'Standard', label: 'Standard Ticket' },
        { value: 'VIP', label: 'VIP Ticket' }
    ];
};

const getAIAssignedImage = (name, category, bizType) => {
    const lowercaseName = (name || '').toLowerCase();
    const lowercaseCat = (category || '').toLowerCase();
    
    if (bizType === 'WM') {
        if (lowercaseName.includes('wash') || lowercaseName.includes('clean')) {
            return 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=500&auto=format&fit=crop&q=60';
        }
        return 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=500&auto=format&fit=crop&q=60';
    }
    
    if (bizType === 'PM') {
        if (lowercaseName.includes('charge') || lowercaseName.includes('ev')) {
            return 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&auto=format&fit=crop&q=60';
        }
        return 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=500&auto=format&fit=crop&q=60';
    }
    
    if (bizType === 'HM') {
        if (lowercaseName.includes('spa') || lowercaseName.includes('massage') || lowercaseName.includes('well')) {
            return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=60';
        }
        if (lowercaseName.includes('valet') || lowercaseName.includes('car') || lowercaseName.includes('luggage')) {
            return 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&auto=format&fit=crop&q=60';
        }
        if (lowercaseName.includes('shuttle') || lowercaseName.includes('transport') || lowercaseName.includes('airport')) {
            return 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&auto=format&fit=crop&q=60';
        }
        return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=60';
    }

    if (bizType === 'SM') {
        if (lowercaseName.includes('plat') || lowercaseName.includes('food') || lowercaseName.includes('cater')) {
            return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60';
        }
        if (lowercaseName.includes('park') || lowercaseName.includes('gold')) {
            return 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=500&auto=format&fit=crop&q=60';
        }
        return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60';
    }

    if (bizType === 'VM') {
        if (lowercaseName.includes('ticket') || lowercaseName.includes('pass') || lowercaseName.includes('entry')) {
            return 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=60';
        }
        if (lowercaseName.includes('vip') || lowercaseName.includes('table') || lowercaseName.includes('premium')) {
            return 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60';
        }
        return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60';
    }

    // Default RM / BM / CM
    if (lowercaseName.includes('shisha') || lowercaseName.includes('hookah') || lowercaseCat.includes('shisha')) {
        return 'https://images.unsplash.com/photo-1542841791-1925b02a2bcb?w=500&auto=format&fit=crop&q=60';
    }
    if (lowercaseName.includes('burger') || lowercaseName.includes('beef') || lowercaseName.includes('meat') || lowercaseName.includes('cheeseburger')) {
        return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60';
    }
    if (lowercaseName.includes('fries') || lowercaseName.includes('potato') || lowercaseName.includes('chips')) {
        return 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60';
    }
    if (lowercaseName.includes('salad') || lowercaseName.includes('green') || lowercaseName.includes('vegetable')) {
        return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60';
    }
    if (lowercaseName.includes('mojito') || lowercaseName.includes('drink') || lowercaseName.includes('cocktail') || lowercaseName.includes('spritz') || lowercaseName.includes('wine') || lowercaseName.includes('beer') || lowercaseCat.includes('drink') || lowercaseCat.includes('beverage')) {
        return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=60';
    }
    if (lowercaseName.includes('sushi') || lowercaseName.includes('fish') || lowercaseName.includes('salmon')) {
        return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=60';
    }
    if (lowercaseName.includes('steak') || lowercaseName.includes('ribeye') || lowercaseName.includes('grill')) {
        return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60';
    }
    if (lowercaseName.includes('dessert') || lowercaseName.includes('cake') || lowercaseName.includes('tiramisu') || lowercaseName.includes('sweet') || lowercaseCat.includes('dessert') || lowercaseCat.includes('sweet')) {
        return 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=60';
    }
    if (lowercaseName.includes('coffee') || lowercaseName.includes('cappuccino') || lowercaseName.includes('espresso') || lowercaseName.includes('latte') || lowercaseName.includes('tea') || lowercaseCat.includes('coffee') || lowercaseCat.includes('hot drink')) {
        return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60';
    }
    if (lowercaseName.includes('breakfast') || lowercaseName.includes('egg') || lowercaseName.includes('frühstück') || lowercaseCat.includes('breakfast')) {
        return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=60';
    }
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';
};

const initialHotelReservations = [
    {
        id: 'RES-8841',
        guestName: 'Maximilian von Berg',
        guestEmail: 'm.vonberg@holding.de',
        guestPhone: '+49 171 4529810',
        roomType: 'Deluxe Suite mit Rheinblick',
        dates: '25. Okt - 28. Okt 2026 (3 Nächte)',
        checkInDate: '25.10.2026, 15:00 Uhr',
        guests: 2,
        totalPrice: 890,
        shuttleRequested: true,
        shuttleDetails: 'DGrien VIP Sprinter (Flughafen FRA)',
        bookingTimestamp: 'Heute, 10:45 Uhr',
        status: 'PENDING',
        notice24hSent: false,
    },
    {
        id: 'RES-8842',
        guestName: 'Dr. Sarah Lindemann',
        guestEmail: 'dr.lindemann@charite-alumni.de',
        guestPhone: '+49 160 8821944',
        roomType: 'Executive Suite',
        dates: '26. Okt - 29. Okt 2026 (3 Nächte)',
        checkInDate: '26.10.2026, 14:00 Uhr',
        guests: 1,
        totalPrice: 660,
        shuttleRequested: true,
        shuttleDetails: 'Business Shuttle ab Hauptbahnhof',
        bookingTimestamp: 'Heute, 09:12 Uhr',
        status: 'PENDING',
        notice24hSent: false,
    },
    {
        id: 'RES-8843',
        guestName: 'Thomas & Elena Weber',
        guestEmail: 't.weber@architekten-partner.com',
        guestPhone: '+49 176 3391028',
        roomType: 'Doppelzimmer / Comfort Suite',
        dates: '27. Okt - 31. Okt 2026 (4 Nächte)',
        checkInDate: '27.10.2026, 15:00 Uhr',
        guests: 2,
        totalPrice: 620,
        shuttleRequested: false,
        shuttleDetails: null,
        bookingTimestamp: 'Gestern, 18:30 Uhr',
        status: 'PENDING',
        notice24hSent: false,
    },
    {
        id: 'RES-8840',
        guestName: 'Sophie Laurent (VIP)',
        guestEmail: 'sophie.laurent@luxury-paris.fr',
        guestPhone: '+33 6 12 34 56 78',
        roomType: 'Presidential Penthouse',
        dates: '24. Okt - 27. Okt 2026 (3 Nächte)',
        checkInDate: '24.10.2026, 12:00 Uhr',
        guests: 3,
        totalPrice: 1950,
        shuttleRequested: true,
        shuttleDetails: 'DGrien VIP Sprinter (Flughafen FRA)',
        bookingTimestamp: '23. Okt, 14:15 Uhr',
        status: 'CONFIRMED',
        notice24hSent: true,
        confirmedAt: '23. Okt 2026, 16:00 Uhr'
    }
];

const MenuManagement = ({ managerContext: propContext }) => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [manualItems, setManualItems] = useState([]);
    const [hotelReservationEmail, setHotelReservationEmail] = useState('');
    const [stadiumApiLink, setStadiumApiLink] = useState('');
    const [stadiumSeatMapLink, setStadiumSeatMapLink] = useState('');
    const [shuttleBasePrice, setShuttleBasePrice] = useState(() => getShuttleFareConfig().basePrice);
    const [isPublishing, setIsPublishing] = useState(false);

    // Real Partner Account Detection vs Demo/Preview Mode
    const currentPartner = useMemo(() => {
        try {
            const saved = localStorage.getItem('green_current_partner');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return null;
    }, []);
    const isRealPartner = Boolean(currentPartner?.isRegisteredPartner);

    // Hotel Reservations & Bottom Sheet State
    const [isReservationSheetOpen, setIsReservationSheetOpen] = useState(false);
    const [reservations, setReservations] = useState(() => {
        try {
            const savedPartner = JSON.parse(localStorage.getItem('green_current_partner') || 'null');
            if (savedPartner?.isRegisteredPartner) {
                const partnerRes = localStorage.getItem(`grien_hotel_reservations_${savedPartner.id}`);
                return partnerRes ? JSON.parse(partnerRes) : [];
            }
            const saved = localStorage.getItem('grien_hotel_reservations');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return initialHotelReservations;
    });
    const [selectedReservationIds, setSelectedReservationIds] = useState([]);
    const [reservationFilter, setReservationFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'CONFIRMED'
    const [reservationSearchQuery, setReservationSearchQuery] = useState('');
    const [reservationToast, setReservationToast] = useState(null);

    const pendingReservations = useMemo(() => {
        return reservations.filter(r => r.status === 'PENDING');
    }, [reservations]);

    const confirmedReservations = useMemo(() => {
        return reservations.filter(r => r.status === 'CONFIRMED');
    }, [reservations]);

    const filteredReservations = useMemo(() => {
        return reservations.filter(r => {
            if (reservationFilter === 'PENDING') return r.status === 'PENDING';
            if (reservationFilter === 'CONFIRMED') return r.status === 'CONFIRMED';
            return true;
        }).filter(r => {
            if (!reservationSearchQuery) return true;
            const q = reservationSearchQuery.toLowerCase();
            return (
                r.guestName.toLowerCase().includes(q) ||
                r.id.toLowerCase().includes(q) ||
                r.roomType.toLowerCase().includes(q) ||
                r.guestEmail.toLowerCase().includes(q)
            );
        });
    }, [reservations, reservationFilter, reservationSearchQuery]);

    const saveReservations = (newRes) => {
        setReservations(newRes);
        try {
            if (isRealPartner && currentPartner?.id) {
                localStorage.setItem(`grien_hotel_reservations_${currentPartner.id}`, JSON.stringify(newRes));
            } else {
                localStorage.setItem('grien_hotel_reservations', JSON.stringify(newRes));
            }
        } catch (e) {}
    };

    const showReservationToast = (msg) => {
        setReservationToast(msg);
        setTimeout(() => {
            setReservationToast(null);
        }, 5000);
    };

    const handleConfirmSelected = () => {
        if (selectedReservationIds.length === 0) return;
        const nowStr = new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const updated = reservations.map(r => {
            if (selectedReservationIds.includes(r.id)) {
                return { ...r, status: 'CONFIRMED', notice24hSent: true, confirmedAt: nowStr };
            }
            return r;
        });
        saveReservations(updated);
        const count = selectedReservationIds.length;
        setSelectedReservationIds([]);
        showReservationToast(`✓ ${count} Reservierung(en) verbindlich bestätigt! Automatische 24h-Vorab-Nachricht wurde für die Gäste aktiviert.`);
    };

    const handleConfirmSingle = (id) => {
        const nowStr = new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const updated = reservations.map(r => {
            if (r.id === id) {
                return { ...r, status: 'CONFIRMED', notice24hSent: true, confirmedAt: nowStr };
            }
            return r;
        });
        saveReservations(updated);
        showReservationToast(`✓ Reservierung #${id} verbindlich bestätigt! Der Gast erhält 24h vor Anreise die Vorab-Begrüßung.`);
    };

    const handleToggleSelectAll = () => {
        const pendingInView = filteredReservations.filter(r => r.status === 'PENDING');
        const allPendingSelected = pendingInView.length > 0 && pendingInView.every(r => selectedReservationIds.includes(r.id));
        if (allPendingSelected) {
            setSelectedReservationIds(prev => prev.filter(id => !pendingInView.some(r => r.id === id)));
        } else {
            const newIds = new Set([...selectedReservationIds, ...pendingInView.map(r => r.id)]);
            setSelectedReservationIds(Array.from(newIds));
        }
    };

    const handleToggleSelectOne = (id) => {
        setSelectedReservationIds(prev => {
            if (prev.includes(id)) return prev.filter(item => item !== id);
            return [...prev, id];
        });
    };

    useEffect(() => {
        const updatePrice = () => setShuttleBasePrice(getShuttleFareConfig().basePrice);
        window.addEventListener('shuttleFareConfigUpdated', updatePrice);
        window.addEventListener('storage', updatePrice);
        return () => {
            window.removeEventListener('shuttleFareConfigUpdated', updatePrice);
            window.removeEventListener('storage', updatePrice);
        };
    }, []);
    
    const userEmailKey = user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'default';

    const getActiveContext = () => {
        if (propContext) return propContext;
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const queryMode = urlParams.get('mode');
            if (queryMode === 'hotel' || queryMode === 'HM') return 'HM';
            if (queryMode === 'stadium' || queryMode === 'SM') return 'SM';
        } catch (e) {}
        const saved = localStorage.getItem(`green_manager_context_${userEmailKey}`);
        if (saved && saved !== 'FM') return saved;
        return 'HM'; // Default to Hotel Manager!
    };

    const [managerContext, setManagerContext] = useState(getActiveContext);

    useEffect(() => {
        const ctx = getActiveContext();
        setManagerContext(ctx);
    }, [propContext, window.location.search]);

    const getCategoryOptions = () => getCategoryOptionsForContext(managerContext);
    const getTicketTypeOptions = () => getTicketTypeOptionsForContext(managerContext);

    // Load existing menu from Firestore and localStorage
    useEffect(() => {
        const loadExistingMenu = async () => {
            if (loading || !user) return;
            
            const ctx = getActiveContext();
            setManagerContext(ctx);
            
            const categories = getCategoryOptionsForContext(ctx);
            const defaultCat = categories.length > 0 ? categories[0].value : 'Food';

            let loadedItems = [];
            let savedEmail = localStorage.getItem(`green_hotel_reservation_email_${userEmailKey}`) || '';
            let savedApiLink = localStorage.getItem(`green_stadium_api_link_${userEmailKey}`) || '';
            let savedSeatMapLink = localStorage.getItem(`green_stadium_seatmap_link_${userEmailKey}`) || '';

            // 1. Fetch from Firestore
            try {
                const docRef = doc(db, 'business_menus', user?.email?.toLowerCase() || userEmailKey);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data && Array.isArray(data.items)) {
                        loadedItems = data.items;
                    }
                    if (data?.hotelReservationEmail) {
                        savedEmail = data.hotelReservationEmail;
                    }
                    if (data?.stadiumApiLink) {
                        savedApiLink = data.stadiumApiLink;
                    }
                    if (data?.stadiumSeatMapLink) {
                        savedSeatMapLink = data.stadiumSeatMapLink;
                    }
                }
            } catch (err) {
                console.warn('Firestore menu read failed:', err.message);
            }

            // 2. Fallback to local backup
            if (loadedItems.length === 0) {
                try {
                    const saved = localStorage.getItem(`green_published_menu_${ctx}_${userEmailKey}`);
                    if (saved) {
                        loadedItems = JSON.parse(saved);
                    }
                } catch (e) {
                    console.error('Failed to parse local menu backup:', e);
                }
            }

            if (isRealPartner && currentPartner?.receptionEmail) {
                savedEmail = currentPartner.receptionEmail;
            } else if (!savedEmail && loadedItems.length > 0) {
                savedEmail = loadedItems.find(i => i.reservationEmail)?.reservationEmail || '';
            }
            setHotelReservationEmail(savedEmail);
            setStadiumApiLink(savedApiLink);
            setStadiumSeatMapLink(savedSeatMapLink);

            // Set state. If empty, push a default row to start editing instantly.
            if (loadedItems.length > 0) {
                const sanitizedItems = loadedItems.map(item => ({
                    ...item,
                    category: (item.category && String(item.category).trim()) ? String(item.category).trim() : defaultCat,
                    ticketType: (item.ticketType && String(item.ticketType).trim()) ? String(item.ticketType).trim() : 'Sitzplatz',
                    hasShuttle: Boolean(item.hasShuttle)
                }));
                setManualItems(sanitizedItems);
            } else {
                setManualItems([{
                    id: Date.now(),
                    name: '',
                    price: '',
                    category: defaultCat,
                    ticketType: 'Sitzplatz',
                    hasShuttle: false,
                    description: '',
                    image: ''
                }]);
            }
        };

        loadExistingMenu();
    }, [user, loading, userEmailKey]);

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center p-20">
                <div className="text-xl font-black italic uppercase text-[#00e5ff] animate-pulse">
                    Grid Intelligence Loading...
                </div>
            </div>
        );
    }

    const publishManualMenu = async () => {
        // Filter out empty rows (e.g., no name and no price)
        const validItems = manualItems.filter(item => item.name.trim() !== '' || item.price.trim() !== '');

        if (validItems.length === 0) {
            alert('Please fill out at least one product with a Name and Price.');
            return;
        }

        setIsPublishing(true);
        try {
            const categories = getCategoryOptionsForContext(managerContext);
            const defaultCat = categories.length > 0 ? categories[0].value : 'Standard Room';

            const formattedItems = validItems.map((item, idx) => {
                const galleryUrls = item.gallery && item.gallery.length > 0 ? item.gallery : (item.image ? [item.image] : []);
                const finalCategory = (item.category && String(item.category).trim()) ? String(item.category).trim() : defaultCat;
                const finalTicketType = (item.ticketType && String(item.ticketType).trim()) ? String(item.ticketType).trim() : 'Sitzplatz';
                return {
                    id: item.id || (Date.now() + idx),
                    name: item.name.trim(),
                    price: item.price.trim(),
                    category: finalCategory,
                    ticketType: finalTicketType,
                    hasShuttle: Boolean(item.hasShuttle),
                    description: (item.description || '').trim(),
                    image: (item.image || galleryUrls[0] || '').trim() || getAIAssignedImage(item.name, finalCategory, managerContext),
                    gallery: galleryUrls,
                    stadiumQrCode: item.stadiumQrCode || '',
                    stadiumTicketLink: item.stadiumTicketLink || '',
                    status: 'verified'
                };
            });

            await setDoc(doc(db, 'business_menus', user?.email?.toLowerCase() || userEmailKey), {
                items: formattedItems,
                hotelReservationEmail: hotelReservationEmail.trim(),
                stadiumApiLink: stadiumApiLink.trim(),
                stadiumSeatMapLink: stadiumSeatMapLink.trim(),
                updatedAt: new Date().toISOString()
            });

            localStorage.setItem(`green_published_menu_${managerContext}_${userEmailKey}`, JSON.stringify(formattedItems));
            localStorage.setItem(`green_hotel_reservation_email_${userEmailKey}`, hotelReservationEmail.trim());
            localStorage.setItem(`green_stadium_api_link_${userEmailKey}`, stadiumApiLink.trim());
            localStorage.setItem(`green_stadium_seatmap_link_${userEmailKey}`, stadiumSeatMapLink.trim());
            alert(`Catalog finalized! ${formattedItems.length} items published live to the Green Grid.`);
            navigate(`/manager${window.location.search}`);
        } catch (err) {
            console.error('Failed to publish manual catalog:', err);
            localStorage.setItem(`green_published_menu_${managerContext}_${userEmailKey}`, JSON.stringify(validItems));
            localStorage.setItem(`green_hotel_reservation_email_${userEmailKey}`, hotelReservationEmail.trim());
            localStorage.setItem(`green_stadium_api_link_${userEmailKey}`, stadiumApiLink.trim());
            localStorage.setItem(`green_stadium_seatmap_link_${userEmailKey}`, stadiumSeatMapLink.trim());
            alert(`Catalog finalized locally (${validItems.length} items).`);
            navigate(`/manager${window.location.search}`);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleFieldChange = (index, field, value) => {
        const updated = [...manualItems];
        updated[index][field] = value;
        setManualItems(updated);
    };

    const handleRowImageUpload = (index, e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 800000) {
            alert('Image file is too large. Please select an image smaller than 800KB.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            handleFieldChange(index, 'image', reader.result);
        };
        reader.readAsDataURL(file);
    };

    const addNewRow = () => {
        const categories = getCategoryOptions();
        const defaultCat = categories.length > 0 ? categories[0].value : 'Food';
        setManualItems([...manualItems, {
            id: Date.now() + Math.random(),
            name: '',
            price: '',
            category: defaultCat,
            ticketType: 'Sitzplatz',
            hasShuttle: false,
            description: '',
            image: ''
        }]);
    };

    const removeItem = (id) => {
        // Keep at least one row
        if (manualItems.length === 1) {
            const categories = getCategoryOptions();
            const defaultCat = categories.length > 0 ? categories[0].value : 'Food';
            setManualItems([{
                id: Date.now(),
                name: '',
                price: '',
                category: defaultCat,
                ticketType: 'Sitzplatz',
                hasShuttle: false,
                description: '',
                image: ''
            }]);
            return;
        }
        setManualItems(manualItems.filter(item => item.id !== id));
    };

    return (
        <div className="space-y-10 pb-20 w-full">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-[#ffffff]">
                        {managerContext === 'HM' ? 'Zimmer Angebote' : managerContext === 'SM' ? 'Ticket Angebote' : 'Angebote'} <span className="text-[#00e5ff]">Hub</span>
                    </h1>
                    <p className="text-[#9ca3af] text-sm font-bold uppercase tracking-widest leading-none">
                        {managerContext === 'HM' ? 'Zimmer, Suiten, Fotos & Preise verwalten' : managerContext === 'SM' ? 'Event-Tickets, Sektoren & Preise verwalten' : 'Produkte & Angebote verwalten'}
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                    {/* Bulk Spreadsheet Editor Grid */}
                    <div className="dark-catalog-card bg-[#0a0f1c80] backdrop-blur-xl border border-[#ffffff1a] rounded-[2rem] p-0.5 shadow-2xl relative overflow-hidden">
                        <div className="dark-catalog-card bg-[#0a0f1c] rounded-[1.9rem] p-4 md:p-6 overflow-hidden space-y-4">
                            <div className="flex justify-between items-center px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-[#00e5ff1a] border border-[#00e5ff33] rounded-xl flex items-center justify-center text-[#00e5ff] shadow-md">
                                        {managerContext === 'HM' ? <BedDouble size={18} /> : managerContext === 'SM' ? <Ticket size={18} /> : <Utensils size={18} />}
                                    </div>
                                     <h3 className="text-lg font-black italic uppercase text-white tracking-tighter drop-shadow" style={{ color: '#ffffff' }}>
                                        {managerContext === 'HM' ? 'Zimmer & Suiten' : managerContext === 'SM' ? 'Tickets & Sektoren' : 'Angebote'} <span className="text-[#00e5ff]" style={{ color: '#00e5ff' }}>Katalog</span>
                                    </h3>
                                </div>
                                <button 
                                    onClick={addNewRow}
                                    className="px-4 py-2 bg-[#00e5ff1a] border border-[#00e5ff33] hover:border-[#00e5ff80] rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-[#00e5ff] tracking-widest flex items-center gap-2 hover:scale-[1.03] transition-all"
                                >
                                    <Plus size={12} /> {managerContext === 'HM' ? '+ Neues Zimmer' : managerContext === 'SM' ? '+ Neues Ticket' : '+ Neues Angebot'}
                                </button>
                            </div>

                            <div className="overflow-x-auto no-scrollbar rounded-2xl border border-[#ffffff1a]">
                                <datalist id="category-presets-list">
                                    {getCategoryOptions().map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </datalist>
                                <datalist id="tickettype-presets-list">
                                    {getTicketTypeOptions().map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </datalist>
                                <table className="w-full text-left border-collapse min-w-[850px]">
                                    <thead>
                                         <tr className="border-b border-[#ffffff1a] bg-[#ffffff14] text-[8px] md:text-[10px] lg:text-xs font-black text-white uppercase tracking-[0.2em]">
                                            <th className="p-3 pl-4 w-[20%] text-white font-black" style={{ color: '#ffffff' }}>{managerContext === 'HM' ? 'Zimmer / Suite Name' : managerContext === 'SM' ? 'Ticket / Sektor Name' : 'Bezeichnung'}</th>
                                            <th className="p-3 w-[15%] text-white font-black" style={{ color: '#ffffff' }}>{managerContext === 'SM' ? 'Event Kategorie' : 'Kategorie'}</th>
                                            {managerContext === 'SM' && (
                                                <th className="p-3 w-[13%] text-white font-black" style={{ color: '#ffffff' }}>Art von Ticket</th>
                                            )}
                                            {managerContext === 'SM' && (
                                                <th className="p-3 w-[14%] text-center text-white font-black" style={{ color: '#ffffff' }}>Shuttle-Service</th>
                                            )}
                                            <th className="p-3 w-[10%] text-center text-white font-black" style={{ color: '#ffffff' }}>{managerContext === 'HM' ? 'Preis / Nacht (€)' : 'Preis (€)'}</th>
                                             <th className="p-3 w-[22%] text-white font-black" style={{ color: '#ffffff' }}>Beschreibung & Ausstattung</th>
                                            <th className="p-3 w-[13%] text-white font-black" style={{ color: '#ffffff' }}>Fotos (Galerie)</th>
                                            <th className="p-3 pr-4 w-[3%] text-right text-white font-black" style={{ color: '#ffffff' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#ffffff1a]">
                                        {manualItems.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-white/[0.01] transition-all">
                                                {/* Name */}
                                                <td className="p-2.5 pl-4">
                                                        <input 
                                                            type="text" 
                                                            placeholder={managerContext === 'HM' ? 'z.B. Deluxe Ocean Suite' : managerContext === 'SM' ? 'z.B. VIP Loge Sektor A' : 'Bezeichnung'}
                                                            className="w-full bg-[#ffffff0d] border border-[#ffffff26] rounded-lg p-2 text-[10px] md:text-xs lg:text-sm font-bold text-white focus:border-[#00e5ff] outline-none placeholder-gray-400"
                                                            style={{ color: '#ffffff' }}
                                                            value={item.name}
                                                            onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                                                        />
                                                </td>
                                                {/* Category */}
                                                <td className="p-2.5">
                                                    <div className="relative flex items-center">
                                                        <input 
                                                            type="text" 
                                                            list="category-presets-list"
                                                            placeholder={managerContext === 'SM' ? 'z.B. Fußball' : 'Kategorie eingeben'}
                                                            className="w-full bg-[#ffffff0d] border border-[#ffffff26] rounded-xl p-2.5 pr-8 text-xs md:text-sm lg:text-base font-black uppercase italic text-[#00e5ff] focus:border-[#00e5ff] outline-none transition-all placeholder:text-gray-500 placeholder:normal-case placeholder:font-normal placeholder:not-italic"
                                                            style={{ color: '#00e5ff' }}
                                                            value={item.category || ''}
                                                            onChange={(e) => handleFieldChange(index, 'category', e.target.value)}
                                                        />
                                                        <button
                                                            type="button"
                                                            tabIndex={-1}
                                                            onClick={(e) => {
                                                                const input = e.currentTarget.previousElementSibling;
                                                                if (input) {
                                                                    input.focus();
                                                                    if (input.showPicker) {
                                                                        try { input.showPicker(); } catch (_) {}
                                                                    }
                                                                }
                                                            }}
                                                            className="absolute right-2 text-[#00e5ff] opacity-60 hover:opacity-100 transition-opacity p-1 cursor-pointer"
                                                            title="Vorschläge anzeigen / auswählen"
                                                        >
                                                            <ChevronRight size={13} className="rotate-90" />
                                                        </button>
                                                    </div>
                                                </td>
                                                {/* Ticket Type (Art von Ticket - Stadium Only) */}
                                                {managerContext === 'SM' && (
                                                    <td className="p-2.5">
                                                        <div className="relative flex items-center">
                                                            <input 
                                                                type="text" 
                                                                list="tickettype-presets-list"
                                                                placeholder="z.B. Sitzplatz"
                                                                className="w-full bg-[#ffffff0d] border border-[#ffffff26] rounded-xl p-2.5 pr-8 text-xs md:text-sm lg:text-base font-black uppercase italic text-[#00e5ff] focus:border-[#00e5ff] outline-none transition-all placeholder:text-gray-500 placeholder:normal-case placeholder:font-normal placeholder:not-italic"
                                                                style={{ color: '#00e5ff' }}
                                                                value={item.ticketType || ''}
                                                                onChange={(e) => handleFieldChange(index, 'ticketType', e.target.value)}
                                                            />
                                                            <button
                                                                type="button"
                                                                tabIndex={-1}
                                                                onClick={(e) => {
                                                                    const input = e.currentTarget.previousElementSibling;
                                                                    if (input) {
                                                                        input.focus();
                                                                        if (input.showPicker) {
                                                                            try { input.showPicker(); } catch (_) {}
                                                                        }
                                                                    }
                                                                }}
                                                                className="absolute right-2 text-[#00e5ff] opacity-60 hover:opacity-100 transition-opacity p-1 cursor-pointer"
                                                                title="Vorschläge anzeigen / auswählen"
                                                            >
                                                                <ChevronRight size={13} className="rotate-90" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                                {/* Shuttle-Service Tickmark (Stadium Only) */}
                                                {managerContext === 'SM' && (
                                                    <td className="p-2.5 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleFieldChange(index, 'hasShuttle', !item.hasShuttle)}
                                                            className={`w-full py-2.5 px-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all border shadow-sm ${
                                                                item.hasShuttle
                                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_14px_rgba(16,185,129,0.25)] hover:bg-emerald-500/30'
                                                                    : 'bg-[#ffffff08] text-slate-400 border-white/10 hover:border-white/25 hover:text-white'
                                                            }`}
                                                            title={item.hasShuttle ? 'Ticket beinhaltet Shuttle-Transfer (Klicken zum Deaktivieren)' : 'Ticket ohne Shuttle (Klicken zum Aktivieren)'}
                                                        >
                                                            <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all ${
                                                                item.hasShuttle ? 'bg-emerald-400 text-slate-950 font-black' : 'border border-slate-500 bg-white/5'
                                                            }`}>
                                                                {item.hasShuttle ? <Check size={12} strokeWidth={3.5} /> : null}
                                                            </div>
                                                            <span className="truncate flex items-center gap-1 font-bold">
                                                                <Bus size={13} className={item.hasShuttle ? 'text-emerald-400' : 'text-slate-500'} />
                                                                {item.hasShuttle ? 'Mit Shuttle' : 'Ohne Shuttle'}
                                                            </span>
                                                        </button>
                                                    </td>
                                                )}
                                                {/* Price */}
                                                <td className="p-2.5">
                                                    <input 
                                                        type="text" 
                                                        placeholder="0.00"
                                                        className="w-full bg-[#ffffff0d] border border-[#00e5ff44] rounded-xl p-2.5 text-xs md:text-sm lg:text-base font-black text-white focus:border-[#00e5ff] outline-none transition-all placeholder:text-gray-400 text-center"
                                                        style={{ color: '#ffffff' }}
                                                        value={item.price}
                                                        onChange={(e) => handleFieldChange(index, 'price', e.target.value)}
                                                    />
                                                </td>
                                                {/* Description */}
                                                <td className="p-2.5">
                                                        <input 
                                                            type="text" 
                                                            placeholder={managerContext === 'HM' ? 'z.B. King Bed, Balkon, Spa Zugang' : 'z.B. Fast-Lane Einlass, Catering'}
                                                            className="w-full bg-[#ffffff0d] border border-[#ffffff26] rounded-lg p-2 text-[9px] md:text-[11px] lg:text-xs font-bold text-white focus:border-[#00e5ff] outline-none placeholder-gray-400"
                                                            style={{ color: '#ffffff' }}
                                                            value={item.description || ''}
                                                            onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                                                        />
                                                </td>
                                                {/* Visual Asset Upload/URL Gallery */}
                                                <td className="p-2.5">
                                                    <div className="flex items-center gap-2 flex-wrap max-w-xs">
                                                        {/* Thumbnail gallery list */}
                                                        {(item.gallery && item.gallery.length > 0 ? item.gallery : (item.image ? [item.image] : [])).map((imgUrl, imgIdx) => (
                                                            <div key={imgIdx} className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#ffffff1a] shrink-0 group/rowthumb shadow-md">
                                                                <img src={imgUrl} alt="Thumb" className="w-full h-full object-cover" />
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const currentGallery = item.gallery && item.gallery.length > 0 ? item.gallery : (item.image ? [item.image] : []);
                                                                        const updatedGallery = currentGallery.filter((_, idx) => idx !== imgIdx);
                                                                        handleFieldChange(index, 'gallery', updatedGallery);
                                                                        handleFieldChange(index, 'image', updatedGallery[0] || '');
                                                                    }}
                                                                    className="absolute inset-0 bg-black/80 opacity-0 group-hover/rowthumb:opacity-100 flex items-center justify-center text-red-500 text-[8px] font-black uppercase transition-opacity"
                                                                >
                                                                    X
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {/* Add More Photos Upload Trigger */}
                                                        <label htmlFor={`file-upload-multi-${item.id}`} className="cursor-pointer px-2.5 py-1.5 bg-[#ffffff0d] border border-[#00e5ff4d] rounded-lg hover:bg-[#00e5ff1a] hover:text-[#00e5ff] transition-all flex items-center gap-1 shrink-0">
                                                            <Upload size={11} className="text-[#00e5ff]" />
                                                            <span className="text-[8px] font-black uppercase text-[#00e5ff] tracking-widest">+ Upload</span>
                                                        </label>
                                                        <input 
                                                            id={`file-upload-multi-${item.id}`}
                                                            type="file" 
                                                            accept="image/*" 
                                                            multiple
                                                            className="hidden" 
                                                            onChange={(e) => {
                                                                const files = Array.from(e.target.files);
                                                                if (!files.length) return;
                                                                files.forEach(file => {
                                                                    if (file.size > 800000) return alert('File size must be < 800KB');
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => {
                                                                        const currentGallery = item.gallery && item.gallery.length > 0 ? item.gallery : (item.image ? [item.image] : []);
                                                                        const updatedGallery = [...currentGallery, reader.result];
                                                                        handleFieldChange(index, 'gallery', updatedGallery);
                                                                        if (!item.image) handleFieldChange(index, 'image', reader.result);
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                });
                                                            }} 
                                                        />
                                                    </div>
                                                </td>
                                                {/* Delete button */}
                                                <td className="p-2.5 pr-4 text-right">
                                                    <button 
                                                        onClick={() => removeItem(item.id)} 
                                                        className="w-8 h-8 bg-[#ffffff0d] border border-[#ffffff1a] rounded-lg text-[#9ca3af] hover:text-red-500 hover:border-red-500/40 transition-all flex items-center justify-center inline-flex"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Hotel Reception Email Input Box */}
                            {managerContext === 'HM' && (
                                <div className="mt-4 p-4 md:p-5 bg-[#ffffff05] border border-[#00e5ff33] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[#00e5ff] font-black text-xs md:text-sm uppercase tracking-wider">
                                            <span className="text-base">📧</span>
                                            <span>Hotel Rezeption E-Mail (Automatischer Reservierungsversand)</span>
                                        </div>
                                        <p className="text-[10px] md:text-xs text-[#9ca3af]">
                                            Unser System sendet jede Kunden-Zimmerbuchung automatisch an diese zentral hinterlegte E-Mail-Adresse.
                                        </p>
                                    </div>
                                    <div className="w-full md:w-80">
                                        <input 
                                            type="email"
                                            placeholder="z.B. rezeption@hotel.de"
                                            className="w-full bg-[#ffffff0d] border border-[#00e5ff66] rounded-xl p-3 text-xs md:text-sm font-bold text-white focus:border-[#00e5ff] outline-none transition-all placeholder:text-gray-500 shadow-inner"
                                            style={{ color: '#ffffff' }}
                                            value={hotelReservationEmail}
                                            onChange={(e) => setHotelReservationEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Hotel Reservations Management Button (Triggers Bottom Sheet) */}
                            {managerContext === 'HM' && (
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsReservationSheetOpen(true)}
                                        className="w-full p-4 md:p-5 bg-gradient-to-r from-emerald-950/50 via-cyan-950/30 to-black/70 border border-emerald-500/40 hover:border-emerald-400 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 shadow-xl hover:shadow-emerald-500/10 group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform shadow-md">
                                                <BedDouble size={22} />
                                            </div>
                                            <div className="text-left space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs md:text-sm font-black uppercase text-white tracking-wider">
                                                        Gäste-Reservierungen annehmen & bestätigen
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black rounded-full uppercase tracking-wider">
                                                        Bottom Sheet Drawer
                                                    </span>
                                                </div>
                                                <p className="text-[10px] md:text-xs text-slate-300 font-normal">
                                                    Öffnet das Kontrollzentrum: Alle auf einmal bestätigen, einzeln auswählen & automatische 24h-Gäste-Garantie
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                            {pendingReservations.length > 0 ? (
                                                <div className="px-3.5 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 animate-pulse">
                                                    <Clock size={14} />
                                                    <span>{pendingReservations.length} Ausstehend</span>
                                                </div>
                                            ) : (
                                                <div className="px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-2">
                                                    <CheckCircle2 size={14} />
                                                    <span>Alle {confirmedReservations.length} Bestätigt</span>
                                                </div>
                                            )}
                                            <div className="px-4 py-2 bg-emerald-500 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md group-hover:bg-emerald-400 flex items-center gap-1.5 transition-colors">
                                                <span>Öffnen</span>
                                                <ChevronDown size={14} className="rotate-180" />
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* Stadion Hybrid Ticket-API & Sitzplatz-Wahl Gateway */}
                            {managerContext === 'SM' && (
                                <div className="mt-4 p-4 md:p-5 bg-[#ffffff05] border border-[#00e5ff33] rounded-2xl flex flex-col gap-4 shadow-lg">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[#00e5ff] font-black text-xs md:text-sm uppercase tracking-wider">
                                            <span className="text-base">⚡</span>
                                            <span>B2B Ticket-API & Live Sitzplatz-Wahl Gateway</span>
                                        </div>
                                        <p className="text-[10px] md:text-xs text-[#9ca3af]">
                                            Hybrid-Schnittstelle: Verbindet das Ticket-System per API oder leitet den Kunden per 1-Klick-Browser-Link direkt zur Saalplan-Sitzplatzwahl.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase text-cyan-300 tracking-wider flex items-center gap-1">
                                                <span>⚡ B2B Ticket-API Endpoint:</span>
                                            </label>
                                            <input 
                                                type="text"
                                                placeholder="https://ticket-system.verein.de/api/v1/tickets..."
                                                className="w-full bg-[#ffffff0d] border border-[#00e5ff66] rounded-xl p-2.5 text-xs font-mono font-bold text-cyan-200 focus:border-[#00e5ff] outline-none transition-all placeholder:text-gray-500 shadow-inner"
                                                style={{ color: '#00e5ff' }}
                                                value={stadiumApiLink}
                                                onChange={(e) => setStadiumApiLink(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase text-cyan-300 tracking-wider flex items-center gap-1">
                                                <span>💺 Stadion Saalplan / Sitzplatz-Wahl Link (Browser):</span>
                                            </label>
                                            <input 
                                                type="text"
                                                placeholder="https://tickets.verein.de/saalplan-wahlen..."
                                                className="w-full bg-[#ffffff0d] border border-[#00e5ff66] rounded-xl p-2.5 text-xs font-mono font-bold text-cyan-200 focus:border-[#00e5ff] outline-none transition-all placeholder:text-gray-500 shadow-inner"
                                                style={{ color: '#00e5ff' }}
                                                value={stadiumSeatMapLink}
                                                onChange={(e) => setStadiumSeatMapLink(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Finalize Button */}
                    <div className="pb-16 pt-2">
                        <button 
                            onClick={publishManualMenu}
                            disabled={isPublishing}
                            className="w-full py-5 bg-[#000000] text-[#ffffff] border border-[#00e5ff] rounded-[1.5rem] text-xs md:text-sm lg:text-base font-black uppercase tracking-[0.3em] shadow-lg hover:bg-[#00e5ff1a] hover:text-[#00e5ff] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isPublishing ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} /> Speichere Angebote...
                                </>
                            ) : (
                                <>
                                    {managerContext === 'HM' ? `ZIMMER-ANGEBOTE SPEICHERN & LIVE SCHALTEN (${manualItems.length})` : managerContext === 'SM' ? `TICKET-ANGEBOTE SPEICHERN & LIVE SCHALTEN (${manualItems.length})` : `ANGEBOTE SPEICHERN & LIVE SCHALTEN (${manualItems.length})`} <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
            </div>

            {/* BOTTOM SHEET: Hotel Reservierungen Verwalten */}
            <AnimatePresence>
                {isReservationSheetOpen && (
                    <div className="fixed inset-0 z-[200] flex flex-col justify-end overflow-hidden">
                        {/* Backdrop overlay (Leicht & performant ohne Render-Lag) */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsReservationSheetOpen(false)}
                            className="fixed inset-0 bg-black/85 backdrop-blur-sm cursor-pointer"
                        />

                        {/* Bottom Sheet Container (Zentriert, GPU-beschleunigt, flüssige 60FPS-Animation) */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
                            className="relative w-full max-w-5xl mx-auto max-h-[86vh] bg-gradient-to-b from-[#0f172a] via-[#090d16] to-[#040711] border-t-2 md:border-x-2 border-emerald-500/40 rounded-t-[2.5rem] shadow-[0_-25px_60px_rgba(0,0,0,0.9)] z-10 flex flex-col overflow-hidden will-change-transform transform-gpu"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Drag handle */}
                            <div className="pt-3 pb-1 flex justify-center">
                                <div className="w-14 h-1.5 bg-white/20 hover:bg-white/40 transition-colors rounded-full cursor-pointer" onClick={() => setIsReservationSheetOpen(false)} />
                            </div>

                            {/* Header */}
                            <div className="px-5 md:px-8 py-3.5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                                            <BedDouble size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg md:text-xl font-black italic uppercase tracking-wider text-white">
                                                Gäste-Reservierungen <span className="text-emerald-400">Management</span>
                                            </h2>
                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                                Verbindliche Zimmerfreigabe • Automatischer 24h-Vorab-Gästeservice
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 self-end md:self-auto">
                                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-black uppercase">
                                        {pendingReservations.length} Offen / {reservations.length} Gesamt
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsReservationSheetOpen(false)}
                                        className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Toast Notification inside Bottom Sheet */}
                            <AnimatePresence>
                                {reservationToast && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mx-5 md:mx-8 mt-3 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs md:text-sm font-black shadow-lg"
                                    >
                                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                                        <span>{reservationToast}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* 24h-Vorab-Garantie Info Banner */}
                            <div className="px-5 md:px-8 pt-3 pb-2">
                                <div className="p-3.5 bg-gradient-to-r from-blue-950/40 via-emerald-950/25 to-black/50 border border-blue-500/30 rounded-2xl flex items-start gap-3 shadow-md">
                                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                                        <Bell size={15} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                                            <span>Automatische 24h-Vorab-Garantie an Ihre Hotelgäste</span>
                                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">100% Gäste-Sicherheit</span>
                                        </h4>
                                        <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                                            Sobald Sie eine Buchung bestätigen, ist das Zimmer für den Kunden garantiert reserviert. Exakt <strong>24 Stunden vor Check-in</strong> erhält der Gast eine automatische Vorab-Begrüßung: <em>„Ihr Zimmer ist verbindlich für Sie reserviert und bereit – das Hotel freut sich auf Ihren Besuch!“</em>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Control Bar: Filter Tabs, Search & Multi-Select Actions */}
                            <div className="px-5 md:px-8 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 border-b border-white/5">
                                {/* Filter Tabs */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => setReservationFilter('ALL')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                            reservationFilter === 'ALL'
                                                ? 'bg-emerald-500 text-black shadow-md'
                                                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                                        }`}
                                    >
                                        Alle ({reservations.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReservationFilter('PENDING')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                            reservationFilter === 'PENDING'
                                                ? 'bg-amber-500 text-black shadow-md'
                                                : 'bg-white/5 text-slate-400 hover:text-amber-400 border border-white/10'
                                        }`}
                                    >
                                        <Clock size={12} />
                                        <span>Ausstehend ({pendingReservations.length})</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReservationFilter('CONFIRMED')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                            reservationFilter === 'CONFIRMED'
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                                                : 'bg-white/5 text-slate-400 hover:text-emerald-400 border border-white/10'
                                        }`}
                                    >
                                        <CheckCircle2 size={12} />
                                        <span>Bestätigt ({confirmedReservations.length})</span>
                                    </button>
                                </div>

                                {/* Search Bar */}
                                <div className="relative w-full md:w-60">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Gast, ID oder Zimmer..."
                                        value={reservationSearchQuery}
                                        onChange={(e) => setReservationSearchQuery(e.target.value)}
                                        className="w-full pl-8 pr-7 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                    {reservationSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setReservationSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Batch Selection Action Bar */}
                            <div className="px-5 md:px-8 py-2.5 bg-white/[0.02] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleToggleSelectAll}
                                        className="flex items-center gap-2 text-slate-300 hover:text-white font-bold cursor-pointer"
                                    >
                                        {filteredReservations.filter(r => r.status === 'PENDING').length > 0 &&
                                        filteredReservations.filter(r => r.status === 'PENDING').every(r => selectedReservationIds.includes(r.id)) ? (
                                            <CheckSquare size={16} className="text-emerald-400" />
                                        ) : (
                                            <Square size={16} className="text-slate-500" />
                                        )}
                                        <span>Alle offenen auswählen</span>
                                    </button>
                                    {selectedReservationIds.length > 0 && (
                                        <span className="text-slate-400">
                                            ({selectedReservationIds.length} ausgewählt)
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={selectedReservationIds.length === 0}
                                        onClick={handleConfirmSelected}
                                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <CheckCircle2 size={15} />
                                        <span>Ausgewählte bestätigen ({selectedReservationIds.length})</span>
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Reservations List */}
                            <div className="px-5 md:px-8 py-3.5 overflow-y-auto space-y-3 max-h-[46vh]">
                                {filteredReservations.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500 space-y-2">
                                        <BedDouble size={36} className="mx-auto opacity-30" />
                                        <p className="text-sm font-bold">Keine Reservierungen in dieser Ansicht gefunden.</p>
                                    </div>
                                ) : (
                                    filteredReservations.map((res) => {
                                        const isSelected = selectedReservationIds.includes(res.id);
                                        const isConfirmed = res.status === 'CONFIRMED';

                                        return (
                                            <div
                                                key={res.id}
                                                className={`p-3.5 md:p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 ${
                                                    isConfirmed
                                                        ? 'bg-emerald-950/15 border-emerald-500/30'
                                                        : isSelected
                                                        ? 'bg-blue-950/30 border-blue-500/50 shadow-md'
                                                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3 w-full md:w-auto">
                                                    {/* Selection Checkbox */}
                                                    {!isConfirmed ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleSelectOne(res.id)}
                                                            className="mt-0.5 cursor-pointer text-slate-400 hover:text-emerald-400 shrink-0"
                                                        >
                                                            {isSelected ? (
                                                                <CheckSquare size={18} className="text-emerald-400" />
                                                            ) : (
                                                                <Square size={18} className="text-slate-500" />
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <div className="mt-0.5 w-4.5 h-4.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                                                            <Check size={12} />
                                                        </div>
                                                    )}

                                                    {/* Reservation Info */}
                                                    <div className="space-y-1 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm font-black text-white">
                                                                {res.guestName}
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-cyan-400 font-bold">
                                                                {res.id}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">
                                                                Gebucht: {res.bookingTimestamp}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-300">
                                                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-emerald-300 font-black flex items-center gap-1.5">
                                                                <BedDouble size={12} className="text-emerald-400" />
                                                                {res.roomType}
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg flex items-center gap-1.5 text-slate-300">
                                                                <Calendar size={12} className="text-cyan-400" />
                                                                {res.dates}
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg flex items-center gap-1.5 text-slate-300">
                                                                <User size={12} className="text-amber-400" />
                                                                {res.guests} {res.guests === 1 ? 'Gast' : 'Gäste'}
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg flex items-center gap-1.5 text-slate-300">
                                                                <Mail size={12} className="text-blue-400" />
                                                                {res.guestEmail}
                                                            </span>
                                                        </div>

                                                        {/* VIP Shuttle Info */}
                                                        {res.shuttleRequested && (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-lg w-fit font-bold">
                                                                <Bus size={12} className="text-cyan-400" />
                                                                <span>VIP Shuttle gebucht: {res.shuttleDetails}</span>
                                                            </div>
                                                        )}

                                                        {/* 24h Notice Status when confirmed */}
                                                        {isConfirmed && (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg w-fit font-bold">
                                                                <ShieldCheck size={12} className="text-emerald-400" />
                                                                <span>24h-Vorab-Garantie aktiv • Kunde erhält am Vortag die Vorab-Begrüßung</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Price & Action Button */}
                                                <div className="flex items-center gap-3.5 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2.5 md:pt-0 border-white/5">
                                                    <div className="text-right">
                                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                                                            Gesamtbetrag
                                                        </span>
                                                        <span className="text-base font-black italic text-emerald-400 block">
                                                            €{res.totalPrice.toFixed(2)}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        {isConfirmed ? (
                                                            <div className="px-3.5 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                                                <CheckCircle2 size={14} className="text-emerald-400" />
                                                                <span>Bestätigt</span>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleConfirmSingle(res.id)}
                                                                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                                                            >
                                                                <Check size={13} />
                                                                <span>Bestätigen</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Bottom Sheet Footer */}
                            <div className="px-5 md:px-8 py-3 bg-black/70 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                <div className="text-slate-400 flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-emerald-400" />
                                    <span>Gäste-Garantie: Automatische Synchronisation mit der DGrien Buchungs-Cloud</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsReservationSheetOpen(false)}
                                    className="w-full sm:w-auto px-5 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                    Schließen
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MenuManagement;
