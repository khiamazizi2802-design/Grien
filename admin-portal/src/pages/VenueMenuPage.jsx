import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Plus, Sparkles, BellRing, Info, ChevronRight, Search, 
    ShieldCheck, ShoppingBag, MapPin, X, QrCode, Ticket, CreditCard, Wallet, Check, Zap, BedDouble, Trash2,
    Landmark, ExternalLink
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRide } from '../context/RideContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { safeSetItem } from '../utils/storageHelper';

const TouchSwipeableContainer = ({ children, className, ...props }) => {
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        let isDown = false;
        let startX = 0;
        let startY = 0;
        let scrollLeft = 0;
        let velocity = 0;
        let lastTime = 0;
        let lastX = 0;
        let lastY = 0;
        let animationFrameId = null;
        let isDragging = false;
        const dragThreshold = 6;
        let totalMoved = 0;

        const onMouseDown = (e) => {
            isDown = true;
            isDragging = false;
            totalMoved = 0;
            el.style.scrollSnapType = 'none';
            startX = e.pageX - el.offsetLeft;
            scrollLeft = el.scrollLeft;
            lastX = e.pageX;
            lastTime = Date.now();
            velocity = 0;
            cancelAnimationFrame(animationFrameId);
        };

        const onMouseLeave = () => {
            if (!isDown) return;
            isDown = false;
            el.style.scrollSnapType = 'x mandatory';
            applyMomentum();
        };

        const onMouseUp = () => {
            if (!isDown) return;
            isDown = false;
            el.style.scrollSnapType = 'x mandatory';
            applyMomentum();
        };

        const onMouseMove = (e) => {
            if (!isDown) return;
            const x = e.pageX - el.offsetLeft;
            const walk = (x - startX) * 1.5;
            
            const distanceX = Math.abs(e.pageX - lastX);
            totalMoved += distanceX;
            if (totalMoved > dragThreshold) {
                isDragging = true;
            }

            e.preventDefault();
            el.scrollLeft = scrollLeft - walk;

            const now = Date.now();
            const timeDiff = now - lastTime;
            if (timeDiff > 0) {
                velocity = (e.pageX - lastX) / timeDiff;
            }
            lastX = e.pageX;
            lastTime = now;
        };

        const onTouchStart = (e) => {
            isDown = true;
            isDragging = false;
            totalMoved = 0;
            el.style.scrollSnapType = 'none';
            startX = e.touches[0].pageX - el.offsetLeft;
            startY = e.touches[0].pageY - el.offsetTop;
            scrollLeft = el.scrollLeft;
            lastX = e.touches[0].pageX;
            lastY = e.touches[0].pageY;
            lastTime = Date.now();
            velocity = 0;
            cancelAnimationFrame(animationFrameId);
        };

        const onTouchEnd = () => {
            if (!isDown) return;
            isDown = false;
            el.style.scrollSnapType = 'x mandatory';
            applyMomentum();
        };

        const onTouchMove = (e) => {
            if (!isDown) return;
            const touch = e.touches[0];
            const x = touch.pageX - el.offsetLeft;
            const y = touch.pageY - el.offsetTop;
            
            const dx = touch.pageX - lastX;
            const dy = touch.pageY - lastY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            totalMoved += distance;
            if (totalMoved > dragThreshold) {
                isDragging = true;
            }

            if (Math.abs(dx) > Math.abs(dy)) {
                if (e.cancelable) e.preventDefault();
                e.stopPropagation();
            }

            const walk = (x - startX) * 1.2;
            el.scrollLeft = scrollLeft - walk;

            const now = Date.now();
            const timeDiff = now - lastTime;
            if (timeDiff > 0) {
                velocity = dx / timeDiff;
            }
            lastX = touch.pageX;
            lastY = touch.pageY;
            lastTime = now;
        };

        const applyMomentum = () => {
            if (Math.abs(velocity) < 0.1) return;
            
            const step = () => {
                el.scrollLeft -= velocity * 15;
                velocity *= 0.95;

                if (Math.abs(velocity) > 0.1 && !isDown) {
                    animationFrameId = requestAnimationFrame(step);
                } else if (!isDown) {
                    el.style.scrollSnapType = 'x mandatory';
                }
            };
            step();
        };

        const onClick = (e) => {
            if (isDragging) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        el.addEventListener('mousedown', onMouseDown);
        el.addEventListener('mouseleave', onMouseLeave);
        el.addEventListener('mouseup', onMouseUp);
        el.addEventListener('mousemove', onMouseMove);

        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchend', onTouchEnd, { passive: true });
        el.addEventListener('touchmove', onTouchMove, { passive: false });
        el.addEventListener('click', onClick, true);

        return () => {
            el.removeEventListener('mousedown', onMouseDown);
            el.removeEventListener('mouseleave', onMouseLeave);
            el.removeEventListener('mouseup', onMouseUp);
            el.removeEventListener('mousemove', onMouseMove);

            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchend', onTouchEnd);
            el.removeEventListener('touchmove', onTouchMove);
            el.removeEventListener('click', onClick, true);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div ref={containerRef} className={className} {...props}>
            {children}
        </div>
    );
};

const VenueMenuPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { socket } = useSocket();
    const { user } = useAuth();
    const isDemo = user?.isDemo;
    
    const ctxState = location.state?.paymentFlowContext || location.state || {};
    const venueName = ctxState.venueName || "Skyline Club";
    const venueAddress = ctxState.venueAddress || "";
    const venueOffer = ctxState.venueOffer || "FREE ENTRY + 1 DRINK";
    const isTakeawayMode = ctxState.isTakeawayMode || false;
    const venueEmail = ctxState.email || 'hotel@green.de';
    
    const passedCategory = ctxState.category;
    const isParking = false;
    const isHotel = passedCategory === 'hotel' || venueName.toLowerCase().includes('hotel') || venueName.toLowerCase().includes('luxe');
    const isStadium = passedCategory === 'stadium' || venueName.toLowerCase().includes('stadium') || venueName.toLowerCase().includes('arena');
    const isDining = passedCategory === 'restaurant' || venueName.toLowerCase().includes('dining') || venueName.toLowerCase().includes('restaurant') || venueName.toLowerCase().includes('bistro') || venueName.toLowerCase().includes('eat') || venueName.toLowerCase().includes('food') || venueName.toLowerCase().includes('cafe') || venueName.toLowerCase().includes('cafǸ') || venueName.toLowerCase().includes('diner') || venueName.toLowerCase().includes('steakhouse') || venueName.toLowerCase().includes('gastronomy') || venueName.toLowerCase().includes('sushi') || venueName.toLowerCase().includes('pizza') || venueName.toLowerCase().includes('kitchen');
    const isClub = passedCategory === 'club' || passedCategory === 'bar' || ((venueName.toLowerCase().includes('club') || venueName.toLowerCase().includes('disco') || venueName.toLowerCase().includes('lounge') || venueName.toLowerCase().includes('night') || venueName.toLowerCase().includes('bar') || venueName.toLowerCase().includes('festival') || venueName.toLowerCase().includes('event') || venueName.toLowerCase().includes('underground')) && !isDining && !isHotel && !isStadium);
    const isFootballTicket = location.state?.ticketCategoryFilter === 'football' || (isStadium && location.state?.ticketCategoryFilter !== 'concerts' && location.state?.ticketCategoryFilter !== 'vvip');

    const isGroupActive = localStorage.getItem('green_group_state') === 'active';
    const [commerceMode, setCommerceMode] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('green_partners_data');
        if (stored) {
            try {
                const partners = JSON.parse(stored);
                if (partners[venueName] && partners[venueName].commerceMode !== undefined) {
                    setCommerceMode(partners[venueName].commerceMode);
                }
            } catch (e) {}
        }
    }, [venueName]);

    const [cart, setCart] = useState(location.state?.existingCart || []);
    const { venueTickets, setVenueTickets } = useRide();
    const [dynamicClubTickets, setDynamicClubTickets] = useState([]);
    const [showTicketHub, setShowTicketHub] = useState(false);
    const [showTablePicker, setShowTablePicker] = useState(false);
    const [selectedTable, setSelectedTable] = useState(location.state?.selectedTable || null);
    const [selectedImage, setSelectedImage] = useState(null);

    const [activeFilter, setActiveFilter] = useState("All");

    const [showPaymentTerminal, setShowPaymentTerminal] = useState(location.state?.showPaymentTerminal || false);
    const [paymentStep, setPaymentStep] = useState(location.state?.paymentStep || 'table'); // 'table', 'guest', 'method'
    const [paymentMethod, setPaymentMethod] = useState(() => {
        if (location.state?.paymentMethod) {
            const parsed = Number(location.state.paymentMethod);
            return isNaN(parsed) ? location.state.paymentMethod : parsed;
        }
        try {
            const activeId = localStorage.getItem('green_active_payment_id');
            if (activeId) {
                const parsed = Number(activeId);
                return isNaN(parsed) ? activeId : parsed;
            }
        } catch (e) {}
        return null;
    });
    const [externalMethod, setExternalMethod] = useState(null);
    const [guestName, setGuestName] = useState(location.state?.guestName || "");
    const [guestDetails, setGuestDetails] = useState({
        firstName: '',
        lastName: '',
        address: '',
        email: '',
        phone: '',
        zip: '',
        city: '',
        idNumber: '',
        companyName: '',
        companyAddress: '',
        dob: '',
        cardNumber: '',
        cardExpiry: '',
        cardCvv: '',
        checkIn: '',
        checkOut: '',
        stayDuration: 1,
        bookingType: 'private',
        hasShuttleService: false,
        shuttlePersons: 1,
        shuttleLuggage: 1,
        shuttlePickupAddress: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [attendees, setAttendees] = useState([]); // For stadium multi-ticket personalization
    const [lastOrderDetails, setLastOrderDetails] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState("");

    const [venueProvisions, setVenueProvisions] = useState({ hotelStadium: 5.0, fnb: 0.0 });

    useEffect(() => {
        const fetchProvisions = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'system_config', 'provisions'));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setVenueProvisions({
                        hotelStadium: parseFloat(data.hotelStadiumPercent) || 5.0,
                        fnb: parseFloat(data.fnbPercent) || 0.0
                    });
                }
            } catch (e) {
                console.warn("Could not fetch provisions", e);
            }
        };
        fetchProvisions();
    }, []);

    const hotelCategories = [];
    const diningCategories = [];
    const stadiumCategories = [];
    const clubCategories = [];

    // Dynamic hotel categories helper to resolve from local room inventory
    const getDynamicHotelCategories = (roomsList) => {
        let currentHotelCategories = [...hotelCategories];
        let roomsToUse = [];
        
        if (Array.isArray(roomsList) && roomsList.length > 0) {
            roomsToUse = roomsList;
        } else {
            try {
                const savedRooms = localStorage.getItem('green_hotel_rooms');
                if (savedRooms) {
                    roomsToUse = JSON.parse(savedRooms);
                }
            } catch (err) {
                console.error("Failed to parse manual hotel rooms from local storage:", err);
            }
        }
        
        if (!Array.isArray(roomsToUse) || roomsToUse.length === 0) {
            roomsToUse = []; // CLEANED MOCK DATA
        }

        const uniqueCategories = {};
        roomsToUse.forEach(room => {
            const catName = room.name || 'Standard Room';
            const bed = room.bedLayout || 'Double';
            const displayName = `${catName} (${bed} Bed)`;
            const price = parseFloat(room.price) || 150.00;
            const key = `${catName}_${bed}`;
            if (!uniqueCategories[key]) {
                uniqueCategories[key] = {
                    id: `dynamic-room-${room.id}`,
                    name: displayName,
                    price: price,
                    desc: `Individually managed luxury suite. Category: ${catName}. Bed Layout: ${bed}. Modern room automation, ambient light, and 24/7 service.`,
                    image: bed === 'Single' 
                        ? "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=400&fit=crop"
                        : bed === 'Double'
                        ? "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=400&fit=crop"
                        : "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=400&fit=crop",
                    tags: ["Rooms", "Luxury", "Hotel Room"] // Crucial tag so checkout flow recognizes it as room booking
                };
            }
        });
        const dynamicRoomItems = Object.values(uniqueCategories);
        currentHotelCategories = currentHotelCategories.map(cat => {
            if (cat.name === "Zimmer (Rooms)") {
                return {
                    ...cat,
                    items: dynamicRoomItems
                };
            }
            return cat;
        });
        return currentHotelCategories;
    };

    const defaultCategories = isStadium ? stadiumCategories : isClub ? clubCategories : isHotel ? getDynamicHotelCategories() : isDining ? diningCategories : [];

    const [menuCategories, setMenuCategories] = useState(defaultCategories);

    // Dynamic AI Neural Catalog sync effect
    useEffect(() => {
        let emailKey = location.state?.emailKey || location.state?.email?.replace(/[^a-zA-Z0-9]/g, '_');
        if (!emailKey) {
            if (isHotel) emailKey = 'hotel_green_de';
            else if (isStadium) emailKey = 'stadium_green_de';
            else if (venueName.toLowerCase().includes('gala') || venueName.toLowerCase().includes('event') || venueName.toLowerCase().includes('show') || venueName.toLowerCase().includes('festival')) emailKey = 'event_green_de';
            else if (venueName.toLowerCase().includes('club') || venueName.toLowerCase().includes('velvet')) emailKey = 'club_green_de';
            else emailKey = 'restaurant_green_de';
        }

        const bizType = passedCategory === 'hotel' ? 'HM' :
                        passedCategory === 'stadium' ? 'SM' :
                        passedCategory === 'club' ? 'CM' :
                        passedCategory === 'bar' ? 'BM' :
                        passedCategory === 'restaurant' ? 'RM' :
                        passedCategory === 'event' ? 'VM' :
                        isHotel ? 'HM' : 
                        isStadium ? 'SM' : 
                        (venueName.toLowerCase().includes('gala') || venueName.toLowerCase().includes('event') || venueName.toLowerCase().includes('show') || venueName.toLowerCase().includes('festival') || venueName.toLowerCase().includes('party')) ? 'VM' :
                        (venueName.toLowerCase().includes('bar') || venueName.toLowerCase().includes('lounge')) ? 'BM' : 
                        (venueName.toLowerCase().includes('club') || venueName.toLowerCase().includes('velvet') || venueName.toLowerCase().includes('disco') || venueName.toLowerCase().includes('night')) ? 'CM' : 
                        'RM';
        
        const fetchDynamicMenu = async () => {
            let customItems = null;

            // 1. Try local backup first
            try {
                const saved = localStorage.getItem(`green_published_menu_${bizType}_${emailKey}`);
                if (saved) {
                    customItems = JSON.parse(saved);
                }
            } catch (e) {
                console.error('Failed to parse local menu backup:', e);
            }

            // 2. Try Firestore for real-time sync
            try {
                const docRef = doc(db, 'business_menus', location.state?.email?.toLowerCase() || emailKey);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data && Array.isArray(data.items) && data.items.length > 0) {
                        customItems = data.items;
                    }
                }
            } catch (fbError) {
                console.warn('Firestore menu lookup bypassed/failed:', fbError.message);
            }

            // 2.5 Try fetching venue_events (Tickets from Ticket Hub)
            try {
                const eventsRef = doc(db, 'venue_events', location.state?.email?.toLowerCase() || emailKey);
                const eventsSnap = await getDoc(eventsRef);
                if (eventsSnap.exists()) {
                    const data = eventsSnap.data();
                    if (data && Array.isArray(data.events)) {
                        const publishedEvents = data.events.filter(e => e.published && (!e.context || e.context === bizType));
                        publishedEvents.forEach(evt => {
                            evt.tiers.forEach(tier => {
                                if (!customItems) customItems = [];
                                    let evtDesc = `Date: ${evt.date}, Time: ${evt.time}`;
                                    if (evt.endTime) evtDesc += ` - ${evt.endTime}`;
                                    if (evt.address) evtDesc += ` • Location: ${evt.address}`;
                                    
                                    customItems.push({
                                        id: `ticket-${evt.id}-${tier.name}`,
                                        name: `${evt.name} - ${tier.name}`,
                                        price: tier.price,
                                        description: evtDesc,
                                        image: tier.files?.[0]?.url || tier.file?.url || evt.file?.url || evt.image || 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=400&h=400&fit=crop',
                                    category: 'Tickets'
                                });
                            });
                        });
                    }
                }
            } catch (fbError) {
                console.warn('Firestore events lookup bypassed/failed:', fbError.message);
            }

            // 3. Re-group custom items by category
            if (customItems && customItems.length > 0) {
                const grouped = {};
                customItems.forEach(item => {
                    const catName = item.category || 'General';
                    if (!grouped[catName]) grouped[catName] = [];
                    grouped[catName].push({
                        id: item.id ? String(item.id) : `custom-${Math.random()}`,
                        name: item.name,
                        price: parseFloat(item.price) || 0.00,
                        desc: item.description || '',
                        image: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
                        gallery: Array.isArray(item.gallery) && item.gallery.length > 0 ? item.gallery : [item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop'],
                        tags: [item.category || 'General']
                    });
                });

                // If B2C user is viewing a hotel, inject the B2B manually added rooms
                if (isHotel) {
                    try {
                        const mgrRef = doc(db, 'users', venueEmail.toLowerCase());
                        const mgrSnap = await getDoc(mgrRef);
                        let roomsToUse = [];
                        if (mgrSnap.exists()) {
                            const data = mgrSnap.data();
                            if (Array.isArray(data.hotelRooms)) {
                                roomsToUse = data.hotelRooms;
                            }
                        }
                        if (roomsToUse.length === 0) {
                            const savedRooms = localStorage.getItem('green_hotel_rooms');
                            if (savedRooms) {
                                roomsToUse = JSON.parse(savedRooms);
                            }
                        }
                        if (roomsToUse.length === 0) {
                            roomsToUse = [
                                { id: '101', name: 'Deluxe King Suite', tier: 'Deluxe', status: 'occupied', guest: 'Julian R.', price: 280, cleanStatus: 'clean', bedLayout: 'Double' },
                                { id: '102', name: 'Deluxe King Suite', tier: 'Deluxe', status: 'available', guest: null, price: 280, cleanStatus: 'clean', bedLayout: 'Double' },
                                { id: '103', name: 'Spa Balcony Suite', tier: 'Premium', status: 'cleaning', guest: null, price: 420, cleanStatus: 'cleaning', bedLayout: 'Double' },
                                { id: '104', name: 'Spa Balcony Suite', tier: 'Premium', status: 'occupied', guest: 'Sarah J.', price: 420, cleanStatus: 'clean', bedLayout: 'Double' },
                                { id: '201', name: 'Emerald Suite', tier: 'Executive', status: 'available', guest: null, price: 650, cleanStatus: 'clean', bedLayout: 'Double' },
                                { id: '202', name: 'Emerald Suite', tier: 'Executive', status: 'occupied', guest: 'Elena M.', price: 650, cleanStatus: 'clean', bedLayout: 'Double' },
                                { id: '301', name: 'Zenith Penthouse', tier: 'Presidential', status: 'available', guest: null, price: 1800, cleanStatus: 'clean', bedLayout: 'Triple' }
                            ];
                        }

                        const uniqueCategories = {};
                        roomsToUse.forEach(room => {
                            const catName = room.name || 'Standard Room';
                            const bed = room.bedLayout || 'Double';
                            const displayName = `${catName} (${bed} Bed)`;
                            const price = parseFloat(room.price) || 150.00;
                            const key = `${catName}_${bed}`;
                            if (!uniqueCategories[key]) {
                                uniqueCategories[key] = {
                                    id: `dynamic-room-${room.id}`,
                                    name: displayName,
                                    price: price,
                                    desc: `Individually managed luxury suite. Category: ${catName}. Bed Layout: ${bed}. Modern room automation, ambient light, and 24/7 service.`,
                                    image: bed === 'Single' 
                                        ? "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=400&fit=crop"
                                        : bed === 'Double'
                                        ? "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=400&fit=crop"
                                        : "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=400&fit=crop",
                                    tags: ["Rooms", "Luxury", "Hotel Room"]
                                };
                            }
                        });
                        grouped["Zimmer (Rooms)"] = Object.values(uniqueCategories);
                    } catch (e) {
                        console.error("Failed to parse manual hotel rooms inside fetchDynamicMenu:", e);
                    }
                }

                // Inject tickets from Ticket Hub (Manager Dashboard)
                try {
                    const savedEvents = localStorage.getItem(`green_stadium_events_${emailKey}`);
                    if (savedEvents) {
                        const rawEvents = JSON.parse(savedEvents);
                        // Ticket Hub events are sometimes saved with published:false if just created
                        // We will just show all events here for the demo, or filter by published
                        const ticketItems = [];
                        rawEvents.forEach(evt => {
                            if (evt.tiers) {
                                evt.tiers.forEach((t, tIdx) => {
                                    let evtDesc = `Entry ticket for ${evt.name || evt.title}. Date: ${evt.date}, Time: ${evt.time}`;
                                    if (evt.endTime) evtDesc += ` - ${evt.endTime}`;
                                    if (evt.address) evtDesc += ` • Location: ${evt.address}`;
                                    evtDesc += `. Allocation: ${t.quantity - (t.sold || 0)} available.`;
                                    
                                    ticketItems.push({
                                        id: `dynamic-${evt.id}-${t.id || tIdx}`,
                                        name: `${evt.name || evt.title} - ${t.name}`,
                                        price: Number(t.price) || 20.00,
                                        desc: evtDesc,
                                        image: t.files?.[0]?.url || t.file?.url || evt.file?.url || evt.image || (tIdx % 2 === 0 
                                            ? "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop" 
                                            : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop"),
                                        tags: ["Ticket", t.name.includes('VIP') ? "VIP" : "Standard"]
                                    });
                                });
                            }
                        });
                        if (ticketItems.length > 0) {
                            grouped["Ticket Hub"] = ticketItems;
                        }
                    }
                } catch (e) {
                    console.error("Failed to inject Ticket Hub events:", e);
                }

                const dynamicCategories = Object.keys(grouped).map(catName => ({
                    name: catName,
                    items: grouped[catName]
                }));

                setMenuCategories(dynamicCategories);
            } else if (isHotel) {
                try {
                    const mgrRef = doc(db, 'users', venueEmail.toLowerCase());
                    const mgrSnap = await getDoc(mgrRef);
                    if (mgrSnap.exists()) {
                        const data = mgrSnap.data();
                        if (Array.isArray(data.hotelRooms)) {
                            setMenuCategories(getDynamicHotelCategories(data.hotelRooms));
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch hotel rooms from Firestore for default categories:", e);
                }
            }
        };

        fetchDynamicMenu();
    }, [isHotel, isStadium, location.state, venueName]);

    const hasTicketsInCart = !isHotel && (isStadium || cart.some(item => 
        item.tags?.includes('Ticket') || 
        item.tags?.includes('Fast-Lane') || 
        item.tags?.includes('VIP') ||
        item.id.startsWith('t') || 
        item.id.startsWith('st') ||
        item.id.startsWith('dynamic')
    ));

    const hasFoodOrDrinksInCart = cart.some(item => !item.tags?.includes('Ticket') && !item.tags?.includes('Fast-Lane') && !item.tags?.includes('VIP') && !item.id.startsWith('t') && !item.id.startsWith('st') && !item.id.startsWith('dynamic'));

    const isRemote = !isTakeawayMode && !location.state?.selectedTable && !isHotel;

    const isItemTicket = (item) => isStadium || 
        item.tags?.includes('Ticket') || 
        item.tags?.includes('Fast-Lane') || 
        item.tags?.includes('VIP') ||
        item.tags?.includes('Tickets') ||
        item.name?.toLowerCase().includes('ticket') ||
        item.name?.toLowerCase().includes('pass') ||
        item.name?.toLowerCase().includes('vip') ||
        item.id.startsWith('t') || 
        item.id.startsWith('st') ||
        item.id.startsWith('dynamic');

    const triggerToast = (msg) => {
        setToastMsg(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleOrder = (item) => {
        const itemIsTicket = isItemTicket(item);

        if (!isHotel && !isStadium) {
            if (itemIsTicket) {
                if (hasFoodOrDrinksInCart) {
                    triggerToast("Tickets must be purchased separately. Please clear your food/drink cart first.");
                    return;
                }
            } else {
                if (isRemote) {
                    triggerToast("Food & Drinks können nur direkt vor Ort am Tisch bestellt werden.");
                    return;
                }
                if (hasTicketsInCart) {
                    triggerToast("Food and drinks can only be ordered at the business place. Please complete your ticket purchase first.");
                    return;
                }
            }
        }
        setCart([...cart, item]);
    };

    // Load dynamic tickets logic merged into fetchDynamicMenu

    // Sync states when returning from payment method page or location state changes
    useEffect(() => {
        if (location.state) {
            const ctx = location.state.paymentFlowContext || location.state;
            if (ctx.showPaymentTerminal !== undefined) {
                setShowPaymentTerminal(ctx.showPaymentTerminal);
            }
            if (ctx.paymentStep !== undefined) {
                setPaymentStep(ctx.paymentStep);
            }
            if (ctx.existingCart !== undefined) {
                setCart(ctx.existingCart);
            }
            if (ctx.selectedTable !== undefined) {
                setSelectedTable(ctx.selectedTable);
            }
            if (ctx.guestName !== undefined) {
                setGuestName(ctx.guestName);
            }
            if (ctx.guestDetails !== undefined) {
                setGuestDetails(ctx.guestDetails);
            }
            if (ctx.attendees !== undefined) {
                setAttendees(ctx.attendees);
            }
        }

        // Sync active payment method from location state or localStorage
        let activeId = null;
        if (location.state?.paymentMethod !== undefined) {
            activeId = location.state.paymentMethod;
        } else {
            try {
                activeId = localStorage.getItem('green_active_payment_id');
            } catch (e) {}
        }
        
        if (activeId !== null && activeId !== undefined) {
            const parsed = Number(activeId);
            setPaymentMethod(isNaN(parsed) ? activeId : parsed);
        }
    }, [location.state]);

    // Auto-initialize attendees for stadium or club event tickets
    useEffect(() => {
        if (showPaymentTerminal && paymentStep === 'guest' && (isStadium || isClub)) {
            const ticketItems = cart.filter(item => item.id.startsWith('st') || item.id.startsWith('t'));
            const totalTickets = ticketItems.length;
            if (totalTickets > 1) {
                // Initialize or maintain attendee list (excluding lead guest)
                setAttendees(prev => {
                    if (prev.length === totalTickets - 1) return prev;
                    return Array(totalTickets - 1).fill(null).map((_, i) => prev[i] || { name: '', email: '', phone: '' });
                });
            } else {
                setAttendees([]);
            }
        }
    }, [showPaymentTerminal, paymentStep, isStadium, isClub, cart]);

    const getPaymentMethods = () => {
        try {
            const savedMethods = localStorage.getItem('green_payment_methods');
            if (savedMethods) {
                const methods = JSON.parse(savedMethods);
                if (methods && methods.length > 0) {
                    return methods.map(m => {
                        let label = m.provider || m.type || 'Secure Card';
                        let icon = CreditCard;
                        
                        if (m.type === 'Credit Card' || !m.type) {
                            const last4Digits = m.last4 ? m.last4.replace(/\s/g, '').slice(-4) : '4242';
                            label = `${m.provider || 'Card'} (•••• ${last4Digits})`;
                            icon = CreditCard;
                        } else if (m.type === 'Bank Account') {
                            const last4Digits = m.iban ? m.iban.replace(/\s/g, '').slice(-4) : '5678';
                            label = `${m.provider || 'Bank'} (•••• ${last4Digits})`;
                            icon = Landmark;
                        } else if (m.type === 'PayPal') {
                            label = `PayPal (${m.email || 'alex.p@uplink.net'})`;
                            icon = Wallet;
                        } else if (m.type === 'Klarna') {
                            label = `Klarna (${m.provider || 'Klarna'})`;
                            icon = Sparkles;
                        } else if (m.type === 'Revolut') {
                            label = `Revolut (${m.provider || 'Revolut'})`;
                            icon = Zap;
                        }
                        
                        return {
                            id: m.id, // Real numeric ID from secure bank hub
                            label,
                            icon
                        };
                    });
                }
            }
        } catch (e) {
            console.error('Failed to get dynamic payment methods:', e);
        }

        if (isDemo) {
            return [
                { id: 1, label: 'Mastercard (•••• 4242)', icon: CreditCard },
                { id: 2, label: 'Deutsche Bank (•••• 5678)', icon: Landmark },
                { id: 3, label: 'PayPal (alex.p@uplink.net)', icon: Wallet }
            ];
        }
        return [];
    };

    const isBooking = isHotel || cart.some(item => 
        item.category?.toLowerCase().includes('room') || 
        item.category?.toLowerCase().includes('zimmer') || 
        item.name?.toLowerCase().includes('room') || 
        item.name?.toLowerCase().includes('suite') || 
        item.name?.toLowerCase().includes('zimmer')
    );

    const baseHotelMethods = [
        { id: 'room_charge', label: 'Charge to Room (Folio)', icon: BedDouble },
        { id: 'external', label: 'External Card', icon: CreditCard }
    ];

    if (guestDetails.bookingType === 'business' && guestDetails.ccNumber) {
        const last4 = guestDetails.ccNumber.replace(/\s/g, '').slice(-4);
        baseHotelMethods.push({ 
            id: 'company_card', 
            label: `Company Card (•••• ${last4 || 'XXXX'})`, 
            icon: CreditCard 
        });
    }

    // Deduplicate payment methods by ID to avoid duplicate card cards showing
    const rawMethods = (isHotel || isBooking ? [
        ...baseHotelMethods,
        ...getPaymentMethods()
    ] : [
        ...getPaymentMethods()
    ]).filter(m => {
        if (isBooking && m.id === 'room_charge') return false;
        return true;
    });

    const activePaymentMethods = Array.from(
        new Map(rawMethods.map(m => [String(m.id), m])).values()
    );

    useEffect(() => {
        if (showPaymentTerminal && paymentStep === 'method') {
            const activeIds = activePaymentMethods.map(m => String(m.id));
            if (!paymentMethod || !activeIds.includes(String(paymentMethod))) {
                if (activeIds.length > 0) {
                    setPaymentMethod(activePaymentMethods[0].id);
                }
            }
        }
    }, [showPaymentTerminal, paymentStep, isBooking, paymentMethod, cart]);

    const getCheckoutLabel = () => {
        if (isHotel || isBooking) return 'BOOK ROOM';
        if (hasTicketsInCart) return 'BUY TICKETS';
        return 'SEND ORDER';
    };

    const handleCheckout = () => {
        // 1. If they are booking a hotel room or browsing hotel catalog:
        // Skip room/table selector pop-up entirely because room is assigned at check-in / booking!
        if (isHotel || isBooking) {
            setPaymentStep('guest');
            setShowPaymentTerminal(true);
            return;
        }

        // 2. If they are buying event/stadium/club tickets:
        if (hasTicketsInCart) {
            setPaymentStep('guest');
            setShowPaymentTerminal(true);
            return;
        }

        // 3. If group is active (and no tickets in cart):
        if (isGroupActive) {
            if (!selectedTable) {
                setPaymentStep('table');
                setShowPaymentTerminal(true);
                return;
            }
            confirmPayment();
            return;
        }

        // 4. Food or drinks in venue:
        if (!selectedTable) {
            setPaymentStep('table');
            setShowPaymentTerminal(true);
            return;
        }

        setPaymentStep('method');
        setShowPaymentTerminal(true);
    };

    const confirmPayment = () => {
        setIsProcessing(true);
        
        // Simulation delay
        setTimeout(async () => {
            const isRoomCharge = String(paymentMethod) === 'room_charge';
            
            let paymentMethodName = paymentMethod;
            if (paymentMethod) {
                const matched = getPaymentMethods().find(m => String(m.id) === String(paymentMethod));
                if (matched) {
                    paymentMethodName = matched.label;
                }
            }
            
            // --- STRIPE INTENT FOR VENUE COMMISSIONS ---
            if (!isGroupActive && !isRoomCharge && paymentMethod !== 'cash') {
                try {
                    let commissionPercent = venueProvisions.fnb;
                    if (isBooking || isHotel || isStadium) {
                        commissionPercent = venueProvisions.hotelStadium;
                    }
                    const applicationFeeAmount = Math.round(totalCost * (commissionPercent / 100) * 100);
                    const wsUrl = import.meta.env.VITE_WS_URL || `http://${window.location.hostname}:3001`;
                    const backendUrl = wsUrl.replace(/^ws/, 'http');
                    
                    await fetch(`${backendUrl}/api/payment/stripe/intent`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            amount: Math.round(totalCost * 100), 
                            currency: 'eur',
                            applicationFeeAmount: applicationFeeAmount
                        })
                    });
                } catch (e) {
                    console.error("Venue Stripe Request failed:", e);
                }
            }
            // -------------------------------------------
            
            const newTicket = {
                id: `#${Date.now()}`,
                type: (isStadium && hasTicketsInCart) ? 'stadium_ticket' : (isClub && hasTicketsInCart) ? 'club_ticket' : isParking ? 'parking' : isBooking ? 'booking' : (isHotel ? 'room_service' : 'order'),
                venueName,
                venueAddress,
                venueOffer,
                tableId: isStadium ? 'E-Ticket' : isClub ? 'Club-Pass' : hasTicketsInCart ? 'E-Ticket' : isParking ? 'Valet-Pass' : isBooking ? 'Check-in Assigned' : selectedTable,
                guestName: isBooking ? `${guestDetails.firstName} ${guestDetails.lastName}`.trim() : guestName,
                guestDetails: (isBooking || isStadium || isClub || hasTicketsInCart) ? guestDetails : null,
                attendees: (isStadium || isClub) ? attendees : [],
                items: [...cart],
                total: totalCost,
                paymentMethod: isGroupActive ? 'group_tab' : (paymentMethod === 'external' ? externalMethod : paymentMethodName),
                paymentStatus: isGroupActive ? 'UNPAID' : 'PAID',
                orderStatus: isBooking ? 'CONFIRMED' : (hasTicketsInCart ? 'PENDING' : (isGroupActive ? 'GROUP ORDER' : ((isStadium || isClub) ? 'DISPATCHED' : 'PENDING'))),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            if (isGroupActive) {
                try {
                    const currentTab = JSON.parse(localStorage.getItem('green_group_tab') || '[]');
                    const newTabItems = cart.map(item => ({
                        member: 'YOU',
                        item: item.name,
                        price: item.price,
                        status: 'pending',
                        payer: 'self'
                    }));
                    localStorage.setItem('green_group_tab', JSON.stringify([...currentTab, ...newTabItems]));
                } catch (e) {
                    console.error('Failed to sync new order items with group tab:', e);
                }
            }
            
            setVenueTickets(prev => [newTicket, ...prev]);
            setLastOrderDetails(newTicket);
            
            // Emit real-time WebSocket event for the UX Lab ecosystem
            if (socket) {
                console.log('📡 Emitting submit-uxlab-event for ticket:', newTicket.id);
                socket.emit('submit-uxlab-event', newTicket);
            }
            
            // ── REAL-TIME MANAGER DASHBOARD SYNCHRONIZATION ──
            try {
                const managerOrders = JSON.parse(localStorage.getItem('green_active_orders') || '[]');
                
                let managerItemNames = [];
                if (newTicket.items && newTicket.items.length > 0) {
                    managerItemNames = newTicket.items;
                } else if (newTicket.venueOffer) {
                    managerItemNames = [{ name: newTicket.venueOffer.name || 'Premium Stay Package', quantity: 1 }];
                } else {
                    managerItemNames = [{ name: 'Standard Booking', quantity: 1 }];
                }

                // Map payment display
                let paymentDisplay = 'Online';
                if (isRoomCharge) paymentDisplay = 'Room Charge';
                // Map type display
                let typeDisplay = 'Dine-In';
                if (isBooking) typeDisplay = 'Stay Booking';
                else if (isHotel) typeDisplay = 'Room Service';
                else if (isStadium && hasTicketsInCart) typeDisplay = 'Stadium E-Ticket';
                else if (isClub && hasTicketsInCart) typeDisplay = 'Club Event Ticket';

                const managerOrder = {
                    id: newTicket.id,
                    venueEmail: venueEmail.toLowerCase(),
                    customerEmail: user?.email ? user.email.toLowerCase() : 'guest@green.de',
                    guest: guestDetails?.companyName ? `${newTicket.guestName} (${guestDetails.companyName})` : (newTicket.guestName || 'Anonymous Guest'),
                    company: guestDetails?.companyName || null,
                    items: managerItemNames,
                    total: typeof newTicket.total === 'number' ? newTicket.total.toFixed(2) : String(newTicket.total),
                    status: isBooking ? 'Booked' : 'Received',
                    type: typeDisplay,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: Date.now(),
                    payment: paymentDisplay,
                    table: (!isBooking && !isHotel && !isStadium && !isClub && !hasTicketsInCart) ? newTicket.tableId : null,
                    room: (isBooking || isHotel) ? (newTicket.tableId && newTicket.tableId !== 'Check-in Assigned' ? newTicket.tableId : String(Math.floor(100 + Math.random() * 400))) : null,
                    checkIn: isBooking ? 'May 19' : null,
                    checkOut: isBooking ? 'May 21' : null
                };

                // Push to Firestore
                await addDoc(collection(db, 'orders'), managerOrder);
                
                // Also keep local copy for backward compatibility in some views
                const updatedOrders = [managerOrder, ...managerOrders];
                safeSetItem('green_active_orders', JSON.stringify(updatedOrders));

                // Sync to stadium/club events sold counts
                const savedEvents = localStorage.getItem('green_stadium_events');
                if (savedEvents && (isStadium || isClub)) {
                    const events = JSON.parse(savedEvents);
                    const updatedEvents = events.map(evt => {
                        // Check if venueName or event name matches
                        const matchesVenue = evt.name.toLowerCase().includes(venueName.toLowerCase()) || venueName.toLowerCase().includes(evt.name.toLowerCase());
                        if (matchesVenue) {
                            return {
                                ...evt,
                                tiers: evt.tiers.map(t => {
                                    // Match cart item names with tier names
                                    const purchasedItem = cart.find(cItem => cItem.name.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(cItem.name.toLowerCase()));
                                    if (purchasedItem) {
                                        return { ...t, sold: (t.sold || 0) + (purchasedItem.quantity || 1) };
                                    }
                                    return t;
                                })
                            };
                        }
                        return evt;
                    });
                    safeSetItem('green_stadium_events', JSON.stringify(updatedEvents));
                }

                // Dispatch cross-iframe update events
                if (window.parent) {
                    window.parent.dispatchEvent(new CustomEvent('green-orders-updated'));
                    window.parent.dispatchEvent(new CustomEvent('green-stadium-events-updated'));
                }
            } catch (e) {
                console.warn('Failed to sync order with Manager Dashboard (non-fatal):', e);
            }
            
            // Log Simulated Dispatch
            if (isStadium) {
                console.log(`🎟️ STADIUM TICKET DISPATCH:`);
                console.log(`- Lead: ${guestName} (${guestDetails.email})`);
                attendees.forEach((a, i) => {
                    console.log(`- Attendee #${i+2}: ${a.name || 'Anonymous'} (${a.email || 'SMS Invite'})`);
                    if (!a.email) {
                        console.log(`  > SMS INVITE SENT TO: ${a.phone || 'SYSTEM GENERATED'}`);
                    }
                });
            }

            setCart([]);
            setIsProcessing(false);
            setShowPaymentTerminal(false);
            
            if (isGroupActive) {
                navigate('/order/tracker', {
                    state: {
                        cart: newTicket.items,
                        venueName: newTicket.venueName,
                        venueAddress: newTicket.venueAddress,
                        venueOffer: newTicket.venueOffer,
                        orderId: newTicket.id,
                        tableId: newTicket.tableId,
                        paymentStatus: 'UNPAID',
                        orderStatus: isBooking ? 'CONFIRMED' : (hasTicketsInCart ? 'PENDING' : 'GROUP ORDER'),
                        guestName: newTicket.guestName,
                        guestEmail: newTicket.guestDetails?.email,
                        guestPhone: newTicket.guestDetails?.phone,
                        guestDetails: newTicket.guestDetails,
                        attendees: newTicket.attendees,
                        totalCost: newTicket.total
                    }
                });
            } else {
                setShowTicketHub(true);
            }

            const successMsg = isGroupActive
                ? `Group order sent for Table ${selectedTable || 'BAR'}! Added to Group Tab ledger.`
                : isStadium 
                    ? `Mission Secured. Personalized tickets dispatched to ${guestName} and ${attendees.length} guests.`
                    : isHotel 
                        ? `Request Sent for Room ${selectedTable}. Added to Folio.` 
                        : `Order Sent for Table ${selectedTable}. Payment Pending.`;
            
            triggerToast(successMsg);
        }, 2000);
    };

    // duplicate triggerToast removed: const triggerToast = (msg) => {
        // setToastMsg duplicate removed
        // setShowToast duplicate removed
        // setTimeout duplicate removed
    // duplicate triggerToast ended

    // getCheckoutLabel moved above handleCheckout

    const totalCost = cart.reduce((sum, item) => sum + item.price, 0) * (isBooking ? (guestDetails.stayDuration || 1) : 1);

    return (
        <div className="min-h-full bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans relative pb-32">
            <AnimatePresence>
                {showToast && (
                    <motion.div 
                        initial={{ y: -100, opacity: 0, x: "-50%" }} 
                        animate={{ y: 24, opacity: 1, x: "-50%" }} 
                        exit={{ y: -100, opacity: 0, x: "-50%" }} 
                        className="fixed top-0 left-1/2 z-[200] w-[90%] max-w-md px-6 py-4 bg-black border border-white/10 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex items-center gap-4"
                    >
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand border border-brand/20">
                            <Zap size={20} className="fill-brand" />
                        </div>
                        <div>
                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-brand mb-1">Operational Protocol</p>
                            <p className="text-[11px] md:text-sm lg:text-base font-bold text-white uppercase leading-relaxed">{toastMsg}</p>
                        </div>
                        <div className="ml-auto w-1 h-8 bg-white/5 rounded-full relative overflow-hidden">
                            <motion.div 
                                initial={{ height: "100%" }} 
                                animate={{ height: 0 }} 
                                transition={{ duration: 3, ease: "linear" }}
                                className="absolute bottom-0 left-0 right-0 bg-brand/40"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-white/5 px-6 pb-6 flex items-center justify-between safe-top-padding">
                <button onClick={() => navigate(-1)} className="w-12 h-12 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center text-[var(--text-primary)] border border-[var(--border-main)]"><ArrowLeft size={24} /></button>
                <div className="text-center">
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter text-[var(--text-primary)]">{venueName}</h1>
                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-brand tracking-[0.2em]">Live Digital Menu</p>
                </div>
                <div className="flex items-center gap-3 relative">
                    <AnimatePresence>
                        {venueTickets.length > 0 && (
                            <motion.button 
                                initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                onClick={() => setShowTicketHub(true)}
                                className="w-12 h-12 bg-[var(--bg-secondary)] border-2 border-brand/40 rounded-2xl flex items-center justify-center text-brand transition-all relative"
                                style={{ 
                                    boxShadow: '0 0 20px var(--brand-glow), inset 0 0 10px var(--brand-glow)'
                                }}
                            >
                                <Ticket size={22} className="relative z-10" />
                                <motion.div 
                                    animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-0 bg-brand/20 rounded-2xl blur-md"
                                />
                                {venueTickets.length > 1 && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--text-primary)] text-[var(--bg-primary)] text-[9px] md:text-[11px] lg:text-xs font-black rounded-full flex items-center justify-center shadow-lg">
                                        {venueTickets.length}
                                    </div>
                                )}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            <main className="p-6 max-w-lg mx-auto space-y-8">
                {/* Order Protocol Warning Removed for Remote Browsing */}

                {/* Kategorie-Schnellwahl-Leiste (Wischbares Menü oben) */}
                <TouchSwipeableContainer className="flex gap-2.5 overflow-x-auto no-scrollbar py-2 px-1 mb-2 snap-x">
                    {menuCategories.map((cat, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => {
                                const element = document.getElementById(`cat-section-${idx}`);
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                            }}
                            className="px-4 py-2.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-main)]/30 hover:border-brand/40 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-white whitespace-nowrap active:scale-95 transition-all shadow-md snap-start"
                        >
                            {cat.name}
                        </button>
                    ))}
                </TouchSwipeableContainer>

                {menuCategories.map((cat, idx) => (
                    <section key={idx} id={`cat-section-${idx}`} className="space-y-4 pt-2">
                        <div className="flex items-center gap-4">
                            <h2 className="text-base font-black italic uppercase tracking-tighter text-[var(--text-primary)]">{cat.name}</h2>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-brand/20 to-transparent" />
                        </div>
                        
                        {/* Horizontale Wischbahn (Lane) */}
                        <TouchSwipeableContainer className="flex overflow-x-auto no-scrollbar gap-5 py-2 px-1 snap-x snap-mandatory">
                            {cat.items.map((item) => (
                                <div key={item.id} 
                                     onClick={() => commerceMode && handleOrder(item)}
                                     className="bg-[var(--bg-secondary)]/55 border border-white/5 rounded-[2.5rem] p-4 flex flex-col hover:border-brand/40 transition-all group w-[220px] sm:w-[240px] flex-shrink-0 snap-start relative overflow-hidden cursor-pointer active:scale-98"
                                     style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                                    <div 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const itemGallery = Array.isArray(item.gallery) && item.gallery.length > 0 ? item.gallery : [item.image];
                                            setSelectedImage({ 
                                                gallery: itemGallery, 
                                                activeIndex: 0, 
                                                title: item.name, 
                                                description: item.desc || item.description, 
                                                price: item.price, 
                                                item: item,
                                                ticketType: item.ticketType,
                                                category: item.category
                                            });
                                        }} 
                                        className="relative h-28 w-full rounded-[2rem] overflow-hidden mb-3 cursor-zoom-in group/img"
                                    >
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent opacity-60" />
                                        {Array.isArray(item.gallery) && item.gallery.length > 1 && (
                                            <div className="absolute top-2 right-2 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-full text-[8px] md:text-[10px] font-black uppercase text-white tracking-widest border border-white/20">
                                                📷 {item.gallery.length} Photos
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-[11px] md:text-sm lg:text-base font-black italic uppercase text-[var(--text-primary)] mb-1 leading-snug truncate" title={item.name}>{item.name}</h3>
                                    <p className="text-[9px] md:text-[11px] lg:text-xs text-[var(--text-primary)] opacity-50 font-medium uppercase tracking-tight line-clamp-2 mb-4 h-6 leading-tight">{item.desc}</p>
                                    <div className="flex justify-between items-center mt-auto">
                                        <span className="text-xs md:text-sm lg:text-base font-black italic text-brand">€{item.price.toFixed(2)}</span>
                                        {commerceMode && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOrder(item);
                                                }} 
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg active:scale-90 transition-all ${
                                                    !isItemTicket(item) && isRemote 
                                                        ? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-main)] opacity-50 cursor-not-allowed' 
                                                        : 'bg-brand text-dark-900 shadow-brand/20'
                                                }`}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </TouchSwipeableContainer>
                    </section>
                ))}
            </main>

            {commerceMode && cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/90 to-transparent z-50 safe-bottom-padding">
                    <div className="max-w-lg mx-auto flex gap-4">
                        <button onClick={() => setCart([])} className="px-6 py-5 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">Cancel</button>
                        <button onClick={handleCheckout} className="flex-1 py-6 bg-[var(--text-primary)] text-[var(--bg-primary)] border border-[var(--border-main)] rounded-[2rem] flex items-center justify-between px-8 group transition-all shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)]">
                            <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] italic text-[var(--bg-primary)]">
                                {getCheckoutLabel()}
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-black italic text-[var(--bg-primary)]">€{totalCost.toFixed(2)}</span>
                                <ChevronRight size={22} className="text-[var(--bg-primary)] group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Payment Terminal Bottom Sheet */}
            <AnimatePresence>
                {showPaymentTerminal && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPaymentTerminal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div 
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} 
                            className="bg-[var(--bg-primary)] border-t border-white/10 rounded-t-[3.5rem] p-8 pb-12 space-y-8 shadow-2xl relative z-10 w-full max-w-lg"
                        >
                            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto" />
                            
                            <AnimatePresence mode="wait">
                                {paymentStep === 'table' ? (
                                    <motion.div key="table" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                        <div className="text-center space-y-2">
                                            <h3 className="text-2xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter">Identify Your {isHotel ? 'Room' : 'Table'}</h3>
                                            <p className="text-[10px] md:text-xs lg:text-sm text-brand font-black uppercase tracking-[0.3em]">Operational Location Required</p>
                                        </div>
                                        <div className="grid grid-cols-4 gap-4">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
                                                const isOccupied = !isHotel && [3, 7, 10].includes(num); // Simulated occupied tables for non-hotels
                                                return (
                                                    <button 
                                                        key={num} 
                                                        disabled={isOccupied}
                                                        onClick={() => { setSelectedTable(num); }}
                                                        className={`h-16 rounded-2xl border text-lg font-black transition-all relative overflow-hidden ${
                                                            selectedTable === num ? 'bg-brand border-brand text-white' : 
                                                            isOccupied ? 'bg-red-500/5 border-red-500/20 text-red-500/30 cursor-not-allowed' :
                                                            'bg-[var(--bg-secondary)] border-[var(--border-main)] text-[var(--text-secondary)] hover:border-brand/30 hover:text-[var(--text-primary)]'
                                                        }`}
                                                    >
                                                        {num}
                                                        {isOccupied && (
                                                            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="relative group">
                                            <input 
                                                type="text" 
                                                placeholder={`Or Type ${isHotel ? 'Room' : 'Table'} Number...`}
                                                className="w-full py-5 px-8 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-400 focus:border-brand/50 outline-none transition-all"
                                                value={selectedTable && selectedTable !== 'BAR' && selectedTable !== 'Front Desk' ? selectedTable : ''}
                                                onChange={(e) => setSelectedTable(e.target.value)}
                                            />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-gray-400 tracking-widest italic">Manual Entry</div>
                                        </div>
                                        <button 
                                            onClick={() => { 
                                                const tbl = selectedTable || (isHotel ? 'Front Desk' : 'BAR');
                                                if (!selectedTable) setSelectedTable(tbl);
                                                
                                                // Group mode: always bypass payment method step, confirm directly as UNPAID
                                                if (isGroupActive) {
                                                    confirmPayment();
                                                } else {
                                                    setPaymentStep('method');
                                                }
                                            }} 
                                            className={`w-full py-6 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] transition-all shadow-xl ${selectedTable ? 'bg-brand text-white shadow-brand/20' : 'bg-[var(--bg-secondary)] border border-[var(--border-main)] text-[var(--text-secondary)]'}`}
                                        >
                                            {selectedTable && selectedTable !== 'BAR' && selectedTable !== 'Front Desk' ? `Confirm ${isHotel ? 'Room' : 'Table'} ${isGroupActive ? '→ Group Tab' : ''}` : (isHotel ? 'Contacting Front Desk' : 'Ordering at the Bar')}
                                        </button>
                                    </motion.div>
                                ) : paymentStep === 'guest' ? (
                                    <motion.div key="guest" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                        <div className="text-center space-y-2 relative">
                                            <button onClick={() => setShowPaymentTerminal(false)} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--text-primary)] transition-all"><ArrowLeft size={20} /></button>
                                            
                                            {hasTicketsInCart && (
                                                <button 
                                                    onClick={() => setAttendees([...attendees, { name: '', email: '', phone: '' }])}
                                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-black border border-white/10 text-white rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 group transition-all hover:border-brand/40"
                                                >
                                                    <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                                                </button>
                                            )}

                                            <h3 className="text-2xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter">
                                                {(isHotel || isBooking) ? 'Guest Registration' : (isStadium || isClub) ? 'YOUR TICKET' : 'Guest Verification'}
                                            </h3>
                                            {((isHotel || isBooking) || (!isStadium && !isClub)) && (
                                                <p className="text-[10px] md:text-xs lg:text-sm text-brand font-black uppercase tracking-[0.3em]">
                                                    {(isHotel || isBooking) ? 'Full Check-in Protocol' : `Room #${selectedTable} Security Check`}
                                                </p>
                                            )}
                                        </div>
                                        
                                        <div className={`space-y-4 ${ (isHotel || isBooking || isStadium || isClub) ? 'max-h-[50vh] overflow-y-auto pr-2 no-scrollbar px-1' : ''}`}>
                                            {(isHotel || isBooking || (!hasTicketsInCart && !isStadium && !isClub)) ? (
                                                <div className="space-y-6">
                                                    <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-[2rem] p-1.5 relative overflow-hidden">
                                                        <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-brand rounded-full transition-all duration-300 ease-out ${guestDetails.bookingType === 'business' ? 'left-[calc(50%+3px)]' : 'left-1.5'}`} />
                                                        <button 
                                                            onClick={() => setGuestDetails({...guestDetails, bookingType: 'private'})}
                                                            className={`flex-1 py-4 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest relative z-10 transition-colors ${guestDetails.bookingType === 'private' ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                                        >
                                                            Private Booking
                                                        </button>
                                                        <button 
                                                            onClick={() => setGuestDetails({...guestDetails, bookingType: 'business'})}
                                                            className={`flex-1 py-4 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest relative z-10 transition-colors ${guestDetails.bookingType === 'business' ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                                        >
                                                            Business Booking
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Vorname / First Name</label>
                                                            <input 
                                                                type="text" placeholder="John"
                                                                className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-400/40 focus:border-brand/50 outline-none transition-all"
                                                                value={guestDetails.firstName || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setGuestDetails({...guestDetails, firstName: val});
                                                                    setGuestName(val + ' ' + (guestDetails.lastName || ''));
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Nachname / Surname</label>
                                                            <input 
                                                                type="text" placeholder="Doe"
                                                                className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-400/40 focus:border-brand/50 outline-none transition-all"
                                                                value={guestDetails.lastName || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setGuestDetails({...guestDetails, lastName: val});
                                                                    setGuestName((guestDetails.firstName || '') + ' ' + val);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">E-Mail / Email Address</label>
                                                            <input 
                                                                type="email" placeholder="john.doe@example.com"
                                                                className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-400/40 focus:border-brand/50 outline-none transition-all"
                                                                value={guestDetails.email}
                                                                onChange={(e) => setGuestDetails({...guestDetails, email: e.target.value})}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Telefon / Phone Number</label>
                                                            <input 
                                                                type="tel" placeholder="+49 152..."
                                                                className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-400/40 focus:border-brand/50 outline-none transition-all"
                                                                value={guestDetails.phone}
                                                                onChange={(e) => setGuestDetails({...guestDetails, phone: e.target.value})}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Straße & Hausnr. / Address</label>
                                                        <input 
                                                            type="text" placeholder="Hauptstraße 12"
                                                            className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-400/40 focus:border-brand/50 outline-none transition-all"
                                                            value={guestDetails.address}
                                                            onChange={(e) => setGuestDetails({...guestDetails, address: e.target.value})}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">PLZ / Zip Code</label>
                                                            <input 
                                                                type="text" placeholder="60311"
                                                                className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-400/40 focus:border-brand/50 outline-none transition-all"
                                                                value={guestDetails.zip}
                                                                onChange={(e) => setGuestDetails({...guestDetails, zip: e.target.value})}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Ort / City</label>
                                                            <input 
                                                                type="text" placeholder="Frankfurt"
                                                                className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-400/40 focus:border-brand/50 outline-none transition-all"
                                                                value={guestDetails.city}
                                                                onChange={(e) => setGuestDetails({...guestDetails, city: e.target.value})}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Ausweisnr. / Passport ID</label>
                                                            <input 
                                                                type="text" placeholder="C00000000"
                                                                className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-400/40 focus:border-brand/50 outline-none transition-all"
                                                                value={guestDetails.idNumber}
                                                                onChange={(e) => setGuestDetails({...guestDetails, idNumber: e.target.value})}
                                                            />
                                                        </div>
                                                        {isFootballTicket && (
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500 flex items-center justify-between">
                                                                    <span>Stadion Platzwahl</span>
                                                                    <span className="text-brand text-[8px] font-black uppercase">Optional</span>
                                                                </label>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const seatMapUrl = localStorage.getItem('green_stadium_seatmap_link') || localStorage.getItem('green_stadium_api_link') || 'https://tickets.verein.de/saalplan-wahlen';
                                                                            window.open(seatMapUrl, '_blank');
                                                                            setGuestDetails(prev => ({ ...prev, seatSelected: true, placeType: 'sitzplatz' }));
                                                                        }}
                                                                        className="py-3 px-2 bg-brand/15 hover:bg-brand/25 border border-brand/40 hover:border-brand rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-brand flex items-center justify-center gap-1 transition-all cursor-pointer"
                                                                    >
                                                                        <span>💺 SITZPLATZ</span>
                                                                        <ExternalLink className="w-3 h-3" />
                                                                    </button>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const standingMapUrl = localStorage.getItem('green_stadium_standing_link') || localStorage.getItem('green_stadium_seatmap_link') || localStorage.getItem('green_stadium_api_link') || 'https://tickets.verein.de/stehplatz-wahlen';
                                                                            window.open(standingMapUrl, '_blank');
                                                                            setGuestDetails(prev => ({ ...prev, seatSelected: true, placeType: 'stehplatz' }));
                                                                        }}
                                                                        className="py-3 px-2 bg-brand/15 hover:bg-brand/25 border border-brand/40 hover:border-brand rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-brand flex items-center justify-center gap-1 transition-all cursor-pointer"
                                                                    >
                                                                        <span>🧍 STEHPLATZ</span>
                                                                        <ExternalLink className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-brand">Check-In / Arrival</label>
                                                            <input 
                                                                type="date"
                                                                className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-brand/50 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] focus:border-brand outline-none transition-all"
                                                                value={guestDetails.checkIn}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    let dur = guestDetails.stayDuration;
                                                                    if (val && guestDetails.checkOut) {
                                                                        const diff = new Date(guestDetails.checkOut) - new Date(val);
                                                                        dur = diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 1;
                                                                    }
                                                                    setGuestDetails({...guestDetails, checkIn: val, stayDuration: dur});
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-brand">Check-Out / Departure</label>
                                                            <input 
                                                                type="date"
                                                                className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-brand/50 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] focus:border-brand outline-none transition-all"
                                                                value={guestDetails.checkOut}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    let dur = guestDetails.stayDuration;
                                                                    if (guestDetails.checkIn && val) {
                                                                        const diff = new Date(val) - new Date(guestDetails.checkIn);
                                                                        dur = diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 1;
                                                                    }
                                                                    setGuestDetails({...guestDetails, checkOut: val, stayDuration: dur});
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                         <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Anzahl Personen / Guests Count</label>
                                                         <select 
                                                             className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] focus:border-brand outline-none transition-all"
                                                             value={guestDetails.guestsCount || 1}
                                                             onChange={(e) => setGuestDetails({...guestDetails, guestsCount: Number(e.target.value)})}
                                                         >
                                                             <option value={1}>1 Person (Single Guest)</option>
                                                             <option value={2}>2 Personen (Double / Pair)</option>
                                                             <option value={3}>3 Personen (Family / Group)</option>
                                                             <option value={4}>4+ Personen (Suite / VIP Group)</option>
                                                         </select>
                                                     </div>

                                                      {/* OPTIONAL VIP HOTEL SHUTTLE SERVICE CARD */}
                                                      <div className="shuttle-dark-card p-5 bg-[#0f172a] border border-brand/40 rounded-2xl space-y-4 shadow-xl">
                                                          <div className="flex items-center justify-between">
                                                              <div className="flex items-center gap-3">
                                                                  <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand font-black">
                                                                       transfer
                                                                  </div>
                                                                  <div>
                                                                      <h4 className="text-sm font-black italic uppercase text-white tracking-wider" style={{ color: '#ffffff !important' }}>Hotel Shuttle Service (Optional)</h4>
                                                                      <p className="shuttle-text-sub text-[9px] font-bold uppercase tracking-widest" style={{ color: '#cbd5e1 !important' }}>Bequemer Transfer zum Hotel / Flughafen / Stadion</p>
                                                                  </div>
                                                              </div>
                                                              <label className="relative inline-flex items-center cursor-pointer">
                                                                  <input 
                                                                      type="checkbox"
                                                                      className="sr-only peer"
                                                                      checked={guestDetails.hasShuttleService || false}
                                                                      onChange={(e) => setGuestDetails({...guestDetails, hasShuttleService: e.target.checked})}
                                                                  />
                                                                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                                                              </label>
                                                          </div>

                                                          {guestDetails.hasShuttleService && (
                                                              <motion.div 
                                                                  initial={{ opacity: 0, height: 0 }}
                                                                  animate={{ opacity: 1, height: 'auto' }}
                                                                  exit={{ opacity: 0, height: 0 }}
                                                                  className="space-y-4 pt-3 border-t border-gray-700"
                                                              >
                                                                  <div className="space-y-1">
                                                                      <label className="shuttle-label-green text-[8px] md:text-[10px] font-black uppercase tracking-widest" style={{ color: '#21ffa5 !important' }}>Abholadresse / Pickup Address</label>
                                                                      <input 
                                                                          type="text"
                                                                          placeholder="z.B. Flughafen Frankfurt Terminal 1 / Hbf"
                                                                          className="w-full py-3.5 px-4 bg-[#1e293b] border border-brand/40 rounded-xl text-xs font-bold text-white focus:border-brand outline-none placeholder-gray-400"
                                                                          style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}
                                                                          value={guestDetails.shuttlePickupAddress || ''}
                                                                          onChange={(e) => setGuestDetails({...guestDetails, shuttlePickupAddress: e.target.value})}
                                                                      />
                                                                  </div>

                                                                  <div className="grid grid-cols-2 gap-4">
                                                                      <div className="space-y-1">
                                                                          <div className="flex items-center justify-between">
                                                                              <label className="shuttle-label-green text-[8px] md:text-[10px] font-black uppercase tracking-widest" style={{ color: '#21ffa5 !important' }}>Personen Anzahl</label>
                                                                              {guestDetails.bookingType === 'business' && (
                                                                                  <span className="text-[8px] text-brand font-bold uppercase tracking-widest" style={{ color: '#21ffa5 !important' }}>Business Transfer</span>
                                                                              )}
                                                                          </div>
                                                                          {guestDetails.bookingType === 'business' ? (
                                                                              <input 
                                                                                  type="number"
                                                                                  min="1"
                                                                                  max="100"
                                                                                  placeholder="z.B. 10 Personen"
                                                                                  className="w-full py-3.5 px-4 bg-[#1e293b] border border-brand/40 rounded-xl text-xs font-black uppercase tracking-widest text-white focus:border-brand outline-none"
                                                                                  style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}
                                                                                  value={guestDetails.shuttlePersons || 1}
                                                                                  onChange={(e) => setGuestDetails({...guestDetails, shuttlePersons: Math.max(1, parseInt(e.target.value) || 1)})}
                                                                              />
                                                                          ) : (
                                                                              <select
                                                                                  className="w-full py-3.5 px-4 bg-[#1e293b] border border-brand/40 rounded-xl text-xs font-black uppercase tracking-widest text-white focus:border-brand outline-none"
                                                                                  style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}
                                                                                  value={guestDetails.shuttlePersons || 1}
                                                                                  onChange={(e) => setGuestDetails({...guestDetails, shuttlePersons: Number(e.target.value)})}
                                                                              >
                                                                                  <option value={1} className="bg-[#1e293b] text-white font-bold" style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}>1 Person</option>
                                                                                  <option value={2} className="bg-[#1e293b] text-white font-bold" style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}>2 Personen</option>
                                                                                  <option value={3} className="bg-[#1e293b] text-white font-bold" style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}>3 Personen</option>
                                                                                  <option value={4} className="bg-[#1e293b] text-white font-bold" style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}>4 Personen</option>
                                                                                  <option value={5} className="bg-[#1e293b] text-white font-bold" style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}>5+ Personen (VIP Van)</option>
                                                                              </select>
                                                                          )}
                                                                      </div>

                                                                      <div className="space-y-1">
                                                                          <div className="flex items-center justify-between">
                                                                              <label className="shuttle-label-green text-[8px] md:text-[10px] font-black uppercase tracking-widest" style={{ color: '#21ffa5 !important' }}>Gepäck Anzahl</label>
                                                                              {guestDetails.bookingType === 'business' && (
                                                                                  <span className="text-[8px] text-brand font-bold uppercase tracking-widest" style={{ color: '#21ffa5 !important' }}>Business Transfer</span>
                                                                              )}
                                                                          </div>
                                                                          {guestDetails.bookingType === 'business' ? (
                                                                              <input 
                                                                                  type="number"
                                                                                  min="0"
                                                                                  max="100"
                                                                                  placeholder="z.B. 12 Koffer"
                                                                                  className="w-full py-3.5 px-4 bg-[#1e293b] border border-brand/40 rounded-xl text-xs font-black uppercase tracking-widest text-white focus:border-brand outline-none"
                                                                                  style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}
                                                                                  value={guestDetails.shuttleLuggage !== undefined ? guestDetails.shuttleLuggage : 1}
                                                                                  onChange={(e) => setGuestDetails({...guestDetails, shuttleLuggage: Math.max(0, parseInt(e.target.value) || 0)})}
                                                                              />
                                                                          ) : (
                                                                              <select
                                                                                  className="w-full py-3.5 px-4 bg-[#1e293b] border border-brand/40 rounded-xl text-xs font-black uppercase tracking-widest text-white focus:border-brand outline-none"
                                                                                  style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}
                                                                                  value={guestDetails.shuttleLuggage || 1}
                                                                                  onChange={(e) => setGuestDetails({...guestDetails, shuttleLuggage: Number(e.target.value)})}
                                                                              >
                                                                                  <option value={0} className="bg-[#1e293b] text-white font-bold" style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}>Kein Gepäck (Handgepäck)</option>
                                                                                  <option value={1} className="bg-[#1e293b] text-white font-bold" style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}>1 Koffer / Tasche</option>
                                                                                  <option value={2} className="bg-[#1e293b] text-white font-bold" style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}>2 Koffer / Taschen</option>
                                                                                  <option value={3} className="bg-[#1e293b] text-white font-bold" style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}>3 Koffer / Taschen</option>
                                                                                  <option value={4} className="bg-[#1e293b] text-white font-bold" style={{ color: '#ffffff !important', backgroundColor: '#1e293b !important' }}>4+ Koffer (Großgepäck)</option>
                                                                              </select>
                                                                          )}
                                                                      </div>
                                                                  </div>

                                                                  {/* Shuttle Price Telemetry Banner */}
                                                                  <div className="p-3.5 bg-[#1e293b] border border-brand/40 rounded-xl flex items-center justify-between shadow-md">
                                                                      <div>
                                                                          <span className="shuttle-label-green text-[9px] font-black uppercase tracking-widest block" style={{ color: '#21ffa5 !important' }}>Shuttle Service Aufschlüsselung</span>
                                                                          <span className="shuttle-text-sub text-[10px] font-bold" style={{ color: '#e2e8f0 !important' }}>
                                                                              {(guestDetails.shuttlePersons || 1)}x Passagier (€10,00 / Person) • {(guestDetails.shuttleLuggage || 1)} Koffer
                                                                          </span>
                                                                      </div>
                                                                      <div className="text-right">
                                                                          <span className="shuttle-text-sub text-[8px] font-bold block uppercase" style={{ color: '#cbd5e1 !important' }}>Gesamt Shuttle</span>
                                                                          <span className="shuttle-label-green text-base font-black italic" style={{ color: '#21ffa5 !important' }}>
                                                                              €{((guestDetails.shuttlePersons || 1) * 10.00).toFixed(2)}
                                                                          </span>
                                                                      </div>
                                                                  </div>
                                                              </motion.div>
                                                          )}
                                                      </div>

                                                    {guestDetails.bookingType === 'business' && (
                                                        <>
                                                            <div className="mt-6 pt-4 border-t border-white/5 space-y-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 bg-brand rounded-full" />
                                                                    <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.2em] text-brand">Company Invoicing Details (Optional)</p>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Firmenname / Company Name</label>
                                                                        <input 
                                                                            type="text" placeholder="Green Corp Ltd."
                                                                            className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-400/40 focus:border-brand/50 outline-none transition-all"
                                                                            value={guestDetails.companyName}
                                                                            onChange={(e) => setGuestDetails({...guestDetails, companyName: e.target.value})}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Firmenadresse / Company Address</label>
                                                                        <input 
                                                                            type="text" placeholder="Zeil 106, 60313 Frankfurt"
                                                                            className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-400/40 focus:border-brand/50 outline-none transition-all"
                                                                            value={guestDetails.companyAddress}
                                                                            onChange={(e) => setGuestDetails({...guestDetails, companyAddress: e.target.value})}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-6 pt-4 border-t border-white/5 space-y-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 bg-brand rounded-full" />
                                                                    <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.2em] text-brand">Deposit Information / Kaution</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Kreditkartennummer / Company Card Number</label>
                                                                    <input 
                                                                        type="text" placeholder="•••• •••• •••• ••••"
                                                                        className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-400/40 focus:border-brand/50 outline-none transition-all"
                                                                        value={guestDetails.ccNumber || ''}
                                                                        onChange={(e) => setGuestDetails({...guestDetails, ccNumber: e.target.value})}
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Ablaufdatum / Expiry Date</label>
                                                                        <input 
                                                                            type="text" placeholder="MM/YY"
                                                                            className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-400/40 focus:border-brand/50 outline-none transition-all"
                                                                            value={guestDetails.ccExpiry || ''}
                                                                            onChange={(e) => setGuestDetails({...guestDetails, ccExpiry: e.target.value})}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500">Prüfziffer / CVC</label>
                                                                        <input 
                                                                            type="text" placeholder="123"
                                                                            className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-400/40 focus:border-brand/50 outline-none transition-all"
                                                                            value={guestDetails.ccCvv || ''}
                                                                            onChange={(e) => setGuestDetails({...guestDetails, ccCvv: e.target.value})}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-left space-y-4">
                                                    <div className="px-2">
                                                        <div>
                                                            <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-wider mb-1 block pl-2 opacity-70">Full Name</span>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Primary Holder..."
                                                                className="w-full py-5 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-500 focus:border-brand/50 outline-none transition-all"
                                                                value={guestName}
                                                                onChange={(e) => setGuestName(e.target.value)}
                                                            />
                                                        </div>
                                                        {(hasTicketsInCart || isStadium || isClub) && (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                                                <div>
                                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-wider mb-1 block pl-2 opacity-70">Address</span>
                                                                    <input 
                                                                        type="text" placeholder="Street & Number..."
                                                                        className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-500"
                                                                        value={guestDetails.address}
                                                                        onChange={(e) => setGuestDetails({...guestDetails, address: e.target.value})}
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-wider mb-1 block pl-2 opacity-70">ZIP / PLZ</span>
                                                                        <input 
                                                                            type="text" placeholder="12345"
                                                                            className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-500"
                                                                            value={guestDetails.zip}
                                                                            onChange={(e) => setGuestDetails({...guestDetails, zip: e.target.value})}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-wider mb-1 block pl-2 opacity-70">City</span>
                                                                        <input 
                                                                            type="text" placeholder="Berlin"
                                                                            className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-500"
                                                                            value={guestDetails.city}
                                                                            onChange={(e) => setGuestDetails({...guestDetails, city: e.target.value})}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {isFootballTicket && (
                                                                    <div className="sm:col-span-2 space-y-2">
                                                                        <div className="flex items-center justify-between pl-2">
                                                                            <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-wider opacity-70">
                                                                                Stadion Platzwahl (Fußball • Optional)
                                                                            </span>
                                                                            <span className="text-[8px] text-brand font-black uppercase tracking-widest bg-brand/10 px-2.5 py-0.5 rounded-full border border-brand/20">
                                                                                Optional
                                                                            </span>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const seatMapUrl = localStorage.getItem('green_stadium_seatmap_link') || localStorage.getItem('green_stadium_api_link') || 'https://tickets.verein.de/saalplan-wahlen';
                                                                                    window.open(seatMapUrl, '_blank');
                                                                                    setGuestDetails(prev => ({ ...prev, seatSelected: true, placeType: 'sitzplatz' }));
                                                                                }}
                                                                                className="w-full py-4 px-4 bg-brand/15 hover:bg-brand/25 border-2 border-brand/40 hover:border-brand rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest text-brand flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                                                                            >
                                                                                <span>💺 SITZPLATZ WÄHLEN</span>
                                                                                <ExternalLink className="w-4 h-4" />
                                                                            </button>
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const standingMapUrl = localStorage.getItem('green_stadium_standing_link') || localStorage.getItem('green_stadium_seatmap_link') || localStorage.getItem('green_stadium_api_link') || 'https://tickets.verein.de/stehplatz-wahlen';
                                                                                    window.open(standingMapUrl, '_blank');
                                                                                    setGuestDetails(prev => ({ ...prev, seatSelected: true, placeType: 'stehplatz' }));
                                                                                }}
                                                                                className="w-full py-4 px-4 bg-brand/15 hover:bg-brand/25 border-2 border-brand/40 hover:border-brand rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest text-brand flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                                                                            >
                                                                                <span>🧍 STEHPLATZ WÄHLEN</span>
                                                                                <ExternalLink className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {(hasTicketsInCart || isStadium || isClub) && (
                                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-4 px-2">
                                                            <div>
                                                                <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-wider mb-1 block pl-2 opacity-70">Email Address</span>
                                                                <input 
                                                                    type="email" placeholder="Personal Email..."
                                                                    className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-500"
                                                                    value={guestDetails.email}
                                                                    onChange={(e) => setGuestDetails({...guestDetails, email: e.target.value})}
                                                                />
                                                            </div>
                                                            {!hasTicketsInCart && (
                                                                <div>
                                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-wider mb-1 block pl-2 opacity-70">Phone Number</span>
                                                                    <input 
                                                                        type="tel" placeholder="Mobile Number (SMS Delivery)..."
                                                                        className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-500"
                                                                        value={guestDetails.phone}
                                                                        onChange={(e) => setGuestDetails({...guestDetails, phone: e.target.value})}
                                                                    />
                                                                </div>
                                                            )}
                                                            
                                                            {hasTicketsInCart && attendees.length > 0 && (
                                                                <div className="mt-8 space-y-10">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="flex-1 h-px bg-[var(--border-main)]/5" />
                                                                        <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.5em] text-[var(--text-secondary)]/30">Additional Members</p>
                                                                        <div className="flex-1 h-px bg-[var(--border-main)]/5" />
                                                                    </div>
                                                                    {attendees.map((attendee, idx) => (
                                                                        <div key={idx} className="space-y-3 p-6 bg-[var(--bg-secondary)]/50 border border-[var(--border-main)] rounded-[2rem]">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]/60 italic">Member #{idx + 2}</p>
                                                                                <div className="flex items-center gap-3">
                                                                                    <button 
                                                                                        onClick={() => setAttendees(attendees.filter((_, i) => i !== idx))}
                                                                                        className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                                                                                    >
                                                                                        <Trash2 size={12} />
                                                                                    </button>
                                                                                    <ShieldCheck size={14} className="text-brand opacity-40" />
                                                                                </div>
                                                                            </div>
                                                                            <input 
                                                                                type="text" placeholder="Full Name..."
                                                                                className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)]"
                                                                                value={attendee.name}
                                                                                onChange={(e) => {
                                                                                    const newAttendees = [...attendees];
                                                                                    newAttendees[idx] = { ...newAttendees[idx], name: e.target.value };
                                                                                    setAttendees(newAttendees);
                                                                                }}
                                                                            />
                                                                            <input 
                                                                                type="email" placeholder="Email Address..."
                                                                                className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)]"
                                                                                value={attendee.email}
                                                                                onChange={(e) => {
                                                                                    const newAttendees = [...attendees];
                                                                                    newAttendees[idx] = { ...newAttendees[idx], email: e.target.value };
                                                                                    setAttendees(newAttendees);
                                                                                }}
                                                                            />
                                                                            <input 
                                                                                type="text" placeholder="Geburtsdatum (DD.MM.YYYY)"
                                                                                className="w-full py-4 px-6 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-primary)]"
                                                                                value={attendee.dob || ''}
                                                                                onChange={(e) => {
                                                                                    const newAttendees = [...attendees];
                                                                                    newAttendees[idx] = { ...newAttendees[idx], dob: e.target.value };
                                                                                    setAttendees(newAttendees);
                                                                                }}
                                                                            />
                                                                            <div className="p-3 bg-brand/5 border border-brand/10 rounded-xl">
                                                                                <p className="text-[7px] font-black text-brand uppercase tracking-widest leading-tight">
                                                                                    * Unregistered users will receive a registration invite via Email to secure their ticket.
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <button 
                                            onClick={() => {
                                                if (isHotel || isBooking) {
                                                    setPaymentStep('method');
                                                } else {
                                                    if (hasTicketsInCart) {
                                                        const missingAttendeeData = attendees.some(a => !a.name || !a.email || !a.dob);
                                                        if (missingAttendeeData) {
                                                            triggerToast('Bitte fülle Name, Email und DOB für alle Begleitpersonen aus.');
                                                            return;
                                                        }
                                                        setPaymentStep('method');
                                                    } else {
                                                        setPaymentStep(isGroupActive ? 'table' : 'method');
                                                    }
                                                }
                                            }}
                                            disabled={(isHotel || isBooking) ? (!guestDetails.firstName || !guestDetails.lastName || !guestDetails.email || !guestDetails.phone || !guestDetails.address || !guestDetails.zip || !guestDetails.city || !guestDetails.idNumber || !guestDetails.dob || !guestDetails.checkIn || !guestDetails.checkOut || (guestDetails.bookingType === 'business' && (!guestDetails.companyName || !guestDetails.companyAddress || !guestDetails.ccNumber || !guestDetails.ccExpiry || !guestDetails.ccCvv))) : (hasTicketsInCart ? (!guestName || !guestDetails.email || !guestDetails.address || !guestDetails.zip || !guestDetails.city || !guestDetails.dob) : !guestName)}
                                            className={`w-full py-6 rounded-[2.5rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] transition-all shadow-xl ${((isHotel || isBooking) ? (guestDetails.firstName && guestDetails.lastName && guestDetails.email && guestDetails.phone && guestDetails.address && guestDetails.zip && guestDetails.city && guestDetails.idNumber && guestDetails.dob && guestDetails.checkIn && guestDetails.checkOut && (guestDetails.bookingType !== 'business' || (guestDetails.companyName && guestDetails.companyAddress && guestDetails.ccNumber && guestDetails.ccExpiry && guestDetails.ccCvv))) : (hasTicketsInCart ? (guestName && guestDetails.email && guestDetails.address && guestDetails.zip && guestDetails.city && guestDetails.dob) : guestName)) ? 'bg-brand text-white shadow-brand/20' : 'bg-[var(--bg-secondary)] border border-[var(--border-main)] text-[var(--text-secondary)]/50'}`}
                                        >
                                            {(isHotel || isBooking) ? 'Complete Registration' : (isStadium || isClub || hasTicketsInCart) ? `Authorize Tickets` : 'Continue to Settlement'}
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                        <div className="text-center space-y-2 relative">
                                            <button 
                                                onClick={() => {
                                                    const hasGuestStep = hasTicketsInCart || isHotel || isBooking;
                                                    if (hasGuestStep) {
                                                        setPaymentStep('guest');
                                                    } else {
                                                        setShowPaymentTerminal(false);
                                                    }
                                                }} 
                                                className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--text-primary)] transition-all"
                                            >
                                                <ArrowLeft size={20} />
                                            </button>
                                            <h3 className="text-2xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter">Settlement Method</h3>
                                            <p className="text-[10px] md:text-xs lg:text-sm text-brand font-black uppercase tracking-[0.3em]">{(isHotel || isBooking) ? `Hotel Room Booking ${guestDetails.firstName || guestName ? `• ${guestDetails.firstName || guestName} ${guestDetails.lastName || ''}` : ''}` : (isStadium || isClub || hasTicketsInCart) ? `E-Ticket Authorization ${guestName ? `• ${guestName}` : ''}` : `Table #${selectedTable}${guestName ? ` • ${guestName}` : ''}`} • €{totalCost.toFixed(2)}</p>
                                        </div>
                                        
                                        <div className="flex items-center justify-between px-2 mb-4">
                                            <h3 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-gray-500 italic">Active Channels</h3>
                                            <button 
                                                onClick={() => navigate('/payment/methods', {
                                                    state: {
                                                        paymentFlowContext: {
                                                            existingCart: cart,
                                                            venueName,
                                                            venueOffer,
                                                            category: passedCategory,
                                                            isTakeawayMode,
                                                            selectedTable,
                                                            guestName,
                                                            guestDetails,
                                                            attendees,
                                                            showPaymentTerminal: true,
                                                            paymentStep: 'method'
                                                        }
                                                    }
                                                })}
                                                className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-widest border-b border-brand/30 pb-0.5"
                                            >
                                                Manage Methods
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {activePaymentMethods.map(method => {
                                                let Icon = method.icon || CreditCard;
                                                let displayLabel = method.label;

                                                // 2. Map sub-options dynamically to parent button for External Card
                                                if (method.id === 'external' && externalMethod) {
                                                    if (externalMethod === 'mastercard') { displayLabel = 'Credit Card'; Icon = CreditCard; }
                                                    else if (externalMethod === 'paypal') { displayLabel = 'PayPal'; Icon = Wallet; }
                                                    else if (externalMethod === 'klarna') { displayLabel = 'Klarna'; Icon = Sparkles; }
                                                    else if (externalMethod === 'revolut') { displayLabel = 'Revolut'; Icon = Zap; }
                                                }

                                                const isSelected = paymentMethod !== null && paymentMethod !== undefined && String(paymentMethod) === String(method.id);
                                                
                                                return (
                                                    <div key={method.id} className="space-y-2">
                                                        <button 
                                                            onClick={() => {
                                                                setPaymentMethod(method.id);
                                                                if (method.id !== 'external') setExternalMethod(null);
                                                                try {
                                                                    localStorage.setItem('green_active_payment_id', String(method.id));
                                                                } catch (e) {
                                                                    console.error('Failed to sync active method selection to storage:', e);
                                                                }
                                                            }}
                                                            className={`w-full p-5 rounded-3xl border flex items-center justify-between group transition-all ${isSelected ? 'bg-brand border-brand text-white' : 'bg-[var(--bg-secondary)] border-[var(--border-main)] text-[var(--text-primary)] hover:border-brand/30'}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-black/10' : 'bg-black/10'}`}>
                                                                    <Icon size={20} />
                                                                </div>
                                                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest">{displayLabel}</span>
                                                            </div>
                                                            {isSelected && <Check size={18} />}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <button 
                                            onClick={confirmPayment}
                                            disabled={!paymentMethod || isProcessing}
                                            className="w-full py-6 bg-[var(--text-primary)] text-[var(--bg-primary)] border border-[var(--border-main)] rounded-[2.5rem] flex items-center justify-center gap-4 group transition-all shadow-2xl disabled:opacity-30 relative overflow-hidden"
                                        >
                                            {isProcessing ? (
                                                <div className="w-6 h-6 border-3 border-white/30 border-t-[var(--bg-primary)] rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <ShieldCheck size={20} className="text-brand" />
                                                    <span className="text-xs md:text-sm lg:text-base font-black uppercase tracking-[0.2em] italic text-[var(--bg-primary)]">
                                                        {isHotel && paymentMethod === 'room_charge' ? 'AUTHORIZE ROOM CHARGE' : 'CONFIRM & SEND ORDER'}
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* TICKET HUB SHEET */}
            <AnimatePresence>
                {showTicketHub && (
                    <div className="fixed inset-0 z-[120] flex items-end justify-center">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setShowTicketHub(false)} 
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="bg-[var(--bg-primary)] border-t border-white/10 rounded-t-[3.5rem] p-8 pb-12 space-y-8 shadow-2xl relative z-10 w-full max-w-lg overflow-y-auto max-h-[80vh] no-scrollbar">
                             <div className="w-12 h-1 bg-white/10 rounded-full mx-auto" />
                            <div className="text-center pt-2 relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand text-white rounded-full text-[7px] font-black uppercase tracking-[0.3em] shadow-lg whitespace-nowrap">Operational Hub 🛰️</div>
                                <h3 className="text-2xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter mt-4">Active Missions & Bookings</h3>
                            </div>

                            <div className="space-y-4">
                                {venueTickets.map((ticket) => {
                                    let locationLabel = 'Table';
                                    let displayTitle = 'Digital Order';
                                    
                                    if (ticket.type === 'booking') {
                                        locationLabel = 'Status';
                                        displayTitle = 'Hotel Booking';
                                    } else if (ticket.type === 'room_service') {
                                        locationLabel = 'Room';
                                        displayTitle = 'Room Service';
                                    } else if (ticket.type === 'stadium_ticket' || ticket.type === 'club_ticket') {
                                        locationLabel = 'Ticket';
                                        displayTitle = 'Digital Ticket';
                                    } else if (ticket.type === 'parking') {
                                        locationLabel = 'Pass';
                                        displayTitle = 'Parking Pass';
                                    }

                                    // Dynamic Status Mapping from B2B Manager Dashboard
                                    let currentStatus = ticket.orderStatus || 'PENDING';
                                    try {
                                        const savedOrders = JSON.parse(localStorage.getItem('green_active_orders') || '[]');
                                        const matchedOrder = savedOrders.find(o => String(o.id) === String(ticket.id));
                                        if (matchedOrder) {
                                            const b2bStatus = matchedOrder.status;
                                            if (ticket.type === 'booking') {
                                                if (b2bStatus === 'Received' || b2bStatus === 'Booked') {
                                                    currentStatus = 'CONFIRMED';
                                                } else if (b2bStatus === 'Check-In' || b2bStatus === 'Staying') {
                                                    currentStatus = 'CHECKED IN';
                                                } else if (b2bStatus === 'Departed') {
                                                    currentStatus = 'CHECKED OUT';
                                                } else {
                                                    currentStatus = b2bStatus.toUpperCase();
                                                }
                                            } else {
                                                if (b2bStatus === 'Received' || b2bStatus === 'Preparing') {
                                                    currentStatus = 'PENDING';
                                                } else if (b2bStatus === 'Ready') {
                                                    currentStatus = 'READY';
                                                } else if (b2bStatus === 'Served' || b2bStatus === 'Paid' || b2bStatus === 'Departed') {
                                                    currentStatus = 'SERVED';
                                                } else {
                                                    currentStatus = b2bStatus.toUpperCase();
                                                }
                                            }
                                        }
                                    } catch (e) {
                                        console.error('Failed to resolve dynamic ticket status:', e);
                                    }
                                    
                                    return (
                                        <div 
                                            key={ticket.id}
                                            className="bg-[var(--bg-secondary)] border border-white/5 p-5 rounded-[2.5rem] flex items-center justify-between group hover:border-brand/30 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand border border-brand/20">
                                                    {ticket.type === 'parking' ? <QrCode size={24} /> : (ticket.type === 'stadium_ticket' || ticket.type === 'booking') ? <Ticket size={24} /> : ticket.type === 'service' ? <Sparkles size={24} /> : <ShoppingBag size={24} />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="text-sm font-black italic uppercase text-[var(--text-primary)] leading-none">{displayTitle}</h4>
                                                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded ${ticket.paymentStatus === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                            {ticket.paymentStatus}
                                                        </span>
                                                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500`}>
                                                            ORDER: {currentStatus}
                                                        </span>
                                                    </div>
                                                    <p className="text-[9px] md:text-[11px] lg:text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                                        {ticket.venueName} • {locationLabel} #{ticket.tableId} • {ticket.timestamp}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    navigate('/order/tracker', { 
                                                        state: { 
                                                            cart: ticket.items, 
                                                            venueName: ticket.venueName, 
                                                            venueAddress: ticket.venueAddress,
                                                            tableId: ticket.tableId, 
                                                            orderId: ticket.id, 
                                                            paymentMethod: ticket.paymentMethod, 
                                                            paymentStatus: ticket.paymentStatus, 
                                                            orderStatus: ticket.orderStatus,
                                                            guestName: ticket.guestName,
                                                            guestEmail: ticket.guestDetails?.email,
                                                            guestPhone: ticket.guestDetails?.phone,
                                                            guestDetails: ticket.guestDetails,
                                                            attendees: ticket.attendees,
                                                            totalCost: ticket.total
                                                        } 
                                                    });
                                                    setShowTicketHub(false);
                                                }}
                                                className="px-5 py-2.5 bg-black text-white rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                                            >
                                                Open
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {venueTickets.length === 0 && (
                                <div className="py-12 text-center">
                                    <p className="text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-gray-600 italic">No Active Tickets Detected</p>
                                </div>
                            )}

                            <button 
                                onClick={() => setShowTicketHub(false)}
                                className="w-full py-5 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                            >
                                Dismiss Hub
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* TABLE PICKER SHEET */}
            <AnimatePresence>
                {showTablePicker && (
                    <div className="fixed inset-0 z-[130] flex items-end justify-center">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTablePicker(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-[var(--bg-primary)] border-t border-white/10 rounded-t-[3.5rem] p-8 pb-12 space-y-8 shadow-2xl relative z-10 w-full max-w-lg">
                             <div className="w-12 h-1 bg-white/10 rounded-full mx-auto" />
                             <div className="text-center pt-2 relative">
                                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand text-white rounded-full text-[7px] font-black uppercase tracking-[0.3em] shadow-lg whitespace-nowrap">Select Your {isHotel ? 'Room' : 'Table'} Number 📍</div>
                                 <h3 className="text-2xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter mt-4">Identify Your Location</h3>
                             </div>
                            <div className="grid grid-cols-4 gap-4 py-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                                    <button 
                                        key={num} 
                                        onClick={() => { setSelectedTable(num); setShowTablePicker(false); }}
                                        className={`h-16 rounded-2xl border text-lg font-black transition-all ${selectedTable === num ? 'bg-brand border-brand text-[var(--bg-primary)] shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-white/5 border-white/10 text-gray-500 hover:border-brand/30'}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>

                            {/* Manual Entry for Room/Table */}
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    placeholder={`Enter ${isHotel ? 'Room' : 'Table'} Number Manually...`}
                                    className="w-full py-5 px-8 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-[var(--text-primary)] placeholder:text-gray-400 focus:border-brand/50 outline-none transition-all"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setSelectedTable(e.target.value);
                                            setShowTablePicker(false);
                                        }
                                    }}
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-gray-600 tracking-widest">Press Enter</div>
                            </div>
                            <button onClick={() => { setSelectedTable(isHotel ? 'Front Desk' : 'Bar'); setShowTablePicker(false); }} className="w-full py-5 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-secondary)]">
                                {isHotel ? 'Contacting Front Desk' : 'Ordering at the Bar'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Fullscreen Multi-Photo Gallery Lightbox Carousel */}
            <AnimatePresence>
                {selectedImage && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setSelectedImage(null)} 
                            className="absolute inset-0 bg-black/95 backdrop-blur-2xl" 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }} 
                            className="relative z-10 max-w-4xl w-full bg-[var(--bg-primary)] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl p-4 md:p-6 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col"
                        >
                            <div className="flex justify-between items-center px-2 shrink-0">
                                <div>
                                    <h3 className="text-lg md:text-xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter truncate">{selectedImage.title}</h3>
                                    <p className="text-[10px] md:text-xs font-black uppercase text-brand tracking-widest mt-0.5 flex items-center gap-2">
                                        <span>Foto {(selectedImage.activeIndex || 0) + 1} von {(selectedImage.gallery || [selectedImage.url]).length}</span>
                                        {selectedImage.ticketType && (
                                            <span className="px-2 py-0.5 rounded-full bg-brand/20 text-brand border border-brand/40 text-[9px]">
                                                {selectedImage.ticketType}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setSelectedImage(null)}
                                    className="px-5 py-2.5 bg-brand text-white rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0"
                                >
                                    Schließen ✕
                                </button>
                            </div>

                            {/* Main Active Photo Viewport with Controls */}
                            <div className="relative h-[32vh] md:h-[38vh] rounded-[2.5rem] overflow-hidden border border-white/5 bg-black flex items-center justify-center group/carousel shrink-0">
                                <img 
                                    src={(selectedImage.gallery || [selectedImage.url])[selectedImage.activeIndex || 0]} 
                                    alt={selectedImage.title} 
                                    className="w-full h-full object-contain max-h-[38vh] transition-all duration-300" 
                                />

                                {/* Previous Arrow */}
                                {(selectedImage.gallery || []).length > 1 && (
                                    <button 
                                        onClick={() => {
                                            const total = selectedImage.gallery.length;
                                            const prevIdx = (selectedImage.activeIndex - 1 + total) % total;
                                            setSelectedImage({ ...selectedImage, activeIndex: prevIdx });
                                        }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-black/60 border border-white/20 text-white flex items-center justify-center font-black text-xl hover:bg-brand transition-all active:scale-90 shadow-2xl backdrop-blur-md"
                                    >
                                        ‹
                                    </button>
                                )}

                                {/* Next Arrow */}
                                {(selectedImage.gallery || []).length > 1 && (
                                    <button 
                                        onClick={() => {
                                            const total = selectedImage.gallery.length;
                                            const nextIdx = (selectedImage.activeIndex + 1) % total;
                                            setSelectedImage({ ...selectedImage, activeIndex: nextIdx });
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-black/60 border border-white/20 text-white flex items-center justify-center font-black text-xl hover:bg-brand transition-all active:scale-90 shadow-2xl backdrop-blur-md"
                                    >
                                        ›
                                    </button>
                                )}
                            </div>

                            {/* Bottom Thumbnail Gallery Strip */}
                            {(selectedImage.gallery || []).length > 1 && (
                                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 px-1 shrink-0">
                                    {selectedImage.gallery.map((thumbUrl, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage({ ...selectedImage, activeIndex: idx })}
                                            className={`relative w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                                                idx === (selectedImage.activeIndex || 0)
                                                    ? 'border-brand scale-105 shadow-[0_0_15px_var(--brand-glow)]'
                                                    : 'border-white/10 opacity-50 hover:opacity-100'
                                            }`}
                                        >
                                            <img src={thumbUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Ticket / Item Description Box */}
                            {(selectedImage.description || selectedImage.item?.desc || selectedImage.item?.description) && (
                                <div className="bg-[var(--bg-secondary)]/70 border border-white/10 rounded-2xl p-4 text-left space-y-2 shrink-0">
                                    <h4 className="text-xs font-black uppercase text-brand tracking-widest flex items-center gap-2">
                                        <span>Beschreibung & Ausstattung</span>
                                    </h4>
                                    <p className="text-xs md:text-sm text-[var(--text-primary)] opacity-90 leading-relaxed font-medium whitespace-pre-line">
                                        {selectedImage.description || selectedImage.item?.desc || selectedImage.item?.description}
                                    </p>
                                </div>
                            )}

                            {/* Footer with Price and Add to Cart Action */}
                            <div className="flex justify-between items-center pt-2 border-t border-white/10 shrink-0">
                                <div>
                                    <span className="text-[10px] uppercase font-black tracking-widest text-[var(--text-primary)] opacity-60 block">Preis</span>
                                    <span className="text-lg md:text-2xl font-black italic text-brand">
                                        €{(selectedImage.price || selectedImage.item?.price || 0).toFixed(2)}
                                    </span>
                                </div>
                                {selectedImage.item && commerceMode && (
                                    <button 
                                        onClick={() => {
                                            handleOrder(selectedImage.item);
                                            setSelectedImage(null);
                                        }}
                                        className="px-6 py-3 bg-brand text-white rounded-2xl text-xs md:text-sm font-black uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <Plus size={18} /> Ticket Hinzufügen
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VenueMenuPage;
