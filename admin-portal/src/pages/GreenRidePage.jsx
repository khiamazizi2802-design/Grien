import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Tooltip, Polyline } from 'react-leaflet';
import L from 'leaflet';
import {
    MapPin,
    LocateFixed,
    ArrowLeft,
    CreditCard,
    Zap,
    Navigation,
    ChevronRight,
    Sparkles,
    Wallet,
    Banknote,
    Globe,
    ShoppingBag,
    X,
    Star,
    Smile,
    Send,
    MessageSquare,
    Phone,
    Users,
    Heart,
    Car,
    ShieldCheck,
    Lock,
    GripHorizontal,
    Smartphone
} from 'lucide-react';
import { useRide } from '../context/RideContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { triggerNotification } from '../components/NotificationToast';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

// Custom Marker Icon for Brands
const createBrandIcon = (logoUrl, status, isSelected, driverData) => L.divIcon({
    className: `custom-brand-icon ${status === 'stalled' ? 'stalled-driver' : ''} ${isSelected ? 'selected-node' : ''}`,
    html: `
        <div class="brand-marker-wrapper" style="
            position: relative;
            width: ${isSelected ? '140px' : '44px'}; 
            height: ${isSelected ? '140px' : '44px'}; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        ">
            <div style="
                width: ${isSelected ? '120px' : '38px'}; 
                height: ${isSelected ? '160px' : '38px'}; 
                background: ${isSelected ? 'rgba(255,255,255,0.95)' : '#FFF'}; 
                backdrop-filter: ${isSelected ? 'blur(10px)' : 'none'};
                border: ${isSelected ? '1px' : '2px'} solid #000; 
                border-radius: ${isSelected ? '20px' : '50%'}; 
                display: flex; 
                flex-direction: column;
                align-items: center; 
                justify-content: ${isSelected ? 'flex-start' : 'center'}; 
                box-shadow: ${isSelected ? '0 30px 60px rgba(0,0,0,0.25), 0 0 20px rgba(0,0,0,0.05)' : '0 4px 15px rgba(0,0,0,0.1)'};
                padding: ${isSelected ? '0px' : '8px'};
                position: relative;
                z-index: 2;
                overflow: hidden;
                transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
            ">
                ${isSelected ? `
                    <div style="width: 100%; height: 60px; background: #000; display: flex; align-items: center; justify-content: center; position: relative;">
                        <img src="${logoUrl}" style="width: 24px; height: 24px; filter: brightness(0) invert(1);" />
                        <div style="position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%); width: 40px; height: 40px; border-radius: 50%; border: 3px solid #FFF; overflow: hidden; background: #EEE; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                            <img src="${driverData?.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=driver'}" style="width: 100%; height: 100%; object-fit: cover;" />
                        </div>
                    </div>
                    <div style="margin-top: 25px; text-align: center; width: 100%; padding: 0 10px;">
                        <h4 style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #000; margin: 0; letter-spacing: -0.02em;">${driverData?.name || 'Driver'}</h4>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 3px; margin-top: 2px;">
                            <span style="color: #FFB800; font-size: 8px;">★</span>
                            <span style="font-size: 8px; font-weight: 800; color: #000;">${driverData?.rating || '4.9'}</span>
                        </div>
                        <div style="margin-top: 10px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 8px;">
                            <span style="font-size: 7px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #000; display: block;">Unit Ready</span>
                            <span style="font-size: 6px; font-weight: 700; text-transform: uppercase; color: rgba(0,0,0,0.4); display: block; margin-top: 2px;">Tap to Book Mission</span>
                        </div>
                    </div>
                ` : `
                    <img src="${logoUrl}" class="logo-ping" style="width: 100%; height: 100%; object-fit: contain;" />
                `}
            </div>
        </div>
    `,
    iconSize: [isSelected ? 140 : 44, isSelected ? 160 : 44],
    iconAnchor: [isSelected ? 70 : 22, isSelected ? 80 : 22],
});

// Helper to generate a Manhattan-style "street" path between two points
const generateSmartPath = (start, end) => {
    if (!start || !end || !start[0] || !start[1] || !end[0] || !end[1]) return [];
    const points = [start];
    // Create an intermediate point to simulate turning a corner
    points.push([start[0], end[1]]); 
    points.push(end);
    return points;
};

// Component to handle map centering and updates with a 7s "Free-Look" delay
const MapController = ({ center, rideActive, driverPos, pickupPos }) => {
    const map = useMap();
    const [lastInteraction, setLastInteraction] = useState(Date.now());

    useEffect(() => {
        const handleInteraction = () => setLastInteraction(Date.now());
        map.on('movestart dragstart zoomstart', handleInteraction);
        return () => map.off('movestart dragstart zoomstart', handleInteraction);
    }, [map]);

    useEffect(() => {
        const checkRecenter = setInterval(() => {
            if (Date.now() - lastInteraction > 7000) {
                if (rideActive && driverPos && driverPos[0] && driverPos[1] && pickupPos && pickupPos[0] && pickupPos[1]) {
                    // Auto-zoom to fit both driver and passenger
                    const bounds = L.latLngBounds([driverPos, pickupPos]);
                    map.fitBounds(bounds, { padding: [100, 100], animate: true, duration: 2, easeLinearity: 0.1 });
                } else if (center) {
                    map.setView(center, 14, { animate: true, duration: 2, easeLinearity: 0.1 });
                }
            }
        }, 1000);

        return () => clearInterval(checkRecenter);
    }, [center, map, lastInteraction, rideActive, driverPos, pickupPos]);

    return null;
};

const GreenRidePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { 
        rideStatus, setRideStatus, 
        driverInfo, setDriverInfo,
        allowDashboardView, setAllowDashboardView,
        isPoolingEnabled, calculatePrice, 
        isFTDOnly, setIsFTDOnly,
        serviceType, setServiceType,
        friendRequests, setFriendRequests
    } = useRide();
    const [pickup, setPickup] = useState('Main St 123 (Current)');
    const [destination, setDestination] = useState('');
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);
    const [showPaymentOptions, setShowPaymentOptions] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState({ name: 'Mastercard', icon: CreditCard, label: 'MC •••• 4242' });
    const [showTopNotification, setShowTopNotification] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [whistleEffectActive, setWhistleEffectActive] = useState(false);
    const [rating, setRating] = useState(0);
    const [selectedTags, setSelectedTags] = useState([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showRideSummary, setShowRideSummary] = useState(false);
    const [view, setView] = useState('dashboard');
    const [coRiderRating, setCoRiderRating] = useState(0);
    const [selectedCoRiderTags, setSelectedCoRiderTags] = useState({}); // Keyed by rider ID
    const [waitingSeconds, setWaitingSeconds] = useState(120); // 2 minute countdown
    const [showFriendConfirm, setShowFriendConfirm] = useState(null); // rider object
    const [mockCoRiders] = useState([
        { id: 'cr-1', name: 'Sarah L.', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
        { id: 'cr-2', name: 'James K.', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James' }
    ]);
    const [showPremiumBrands, setShowPremiumBrands] = useState(false);
    const [selectedSharedType, setSelectedSharedType] = useState('green3');
    const [paymentModalMode, setPaymentModalMode] = useState('select');
    const [currentCity, setCurrentCity] = useState('Frankfurt');
    const [showEndTripReasons, setShowEndTripReasons] = useState(false);
    const [endTripReason, setEndTripReason] = useState(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [userPaymentMethods, setUserPaymentMethods] = useState([]);
    const [isMiniMode, setIsMiniMode] = useState(false);
    const [sheetY, setSheetY] = useState(0);
    const [cardForm, setCardForm] = useState({ name: '', number: '', expiry: '', cvv: '' });
    const [bankForm, setBankForm] = useState({ name: '', iban: '', bic: '' });
    const [hasWhistled, setHasWhistled] = useState(false);
    const [selectedDriverId, setSelectedDriverId] = useState(null);
    const [showDriverProfile, setShowDriverProfile] = useState(null); // Holds the driver object
    const [targetDriver, setTargetDriver] = useState(null); // The locked driver for the next whistle
    const [showWhistleConfirm, setShowWhistleConfirm] = useState(null);
    const [showPoolRequest, setShowPoolRequest] = useState(null);
    const [poolPassengers, setPoolPassengers] = useState(3); // Default to 3, range 2-5
    const [showExpansionPrompt, setShowExpansionPrompt] = useState(false);
    
    // Live Location State
    const [pickupCoords, setPickupCoords] = useState([50.1109, 8.6821]); // Frankfurt Center
    const [destinationCoords, setDestinationCoords] = useState(null);
    const [liveDistance, setLiveDistance] = useState(2.4);
    const [liveETA, setLiveETA] = useState('8 min');
    const [searchingSeconds, setSearchingSeconds] = useState(0);

    const [pickupSuggestions, setPickupSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);
    const [isPickupFocused, setIsPickupFocused] = useState(false);
    const [isDestinationFocused, setIsDestinationFocused] = useState(false);
    const [streetCoordinates, setStreetCoordinates] = useState([]);
    const [stops, setStops] = useState([]);

    const calculateRoute = async (points) => {
        if (!points || points.length < 2) return;
        try {
            const coordsString = points.map(p => `${p[1]},${p[0]}`).join(';');
            const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?geometries=geojson`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const distanceKm = route.distance / 1000;
                const durationMin = Math.round(route.duration / 60);
                
                setLiveDistance(distanceKm);
                setLiveETA(`${durationMin} min`);
                
                const geojsonCoords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                setStreetCoordinates(geojsonCoords);
            }
        } catch (error) {
            console.error("OSRM Routing error:", error);
        }
    };

    const serializedStopsCoords = stops.map(s => s.coords ? s.coords.join(',') : '').join(';');
    useEffect(() => {
        const points = [pickupCoords, ...stops.map(s => s.coords), destinationCoords];
        const validPoints = points.filter(p => p !== null && p !== undefined);
        
        if (validPoints.length >= 2) {
            calculateRoute(validPoints);
        } else {
            setStreetCoordinates([]);
        }
    }, [pickupCoords, destinationCoords, serializedStopsCoords]);

    useEffect(() => {
        if (!isPickupFocused || !pickup || pickup === 'Main St 123 (Current)' || pickup.startsWith('Current Location')) {
            setPickupSuggestions([]);
            return;
        }
        const timer = setTimeout(() => {
            fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(pickup)}&format=json&bounded=1&viewbox=8.4,50.0,8.9,50.3`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setPickupSuggestions(data);
                })
                .catch(err => console.error("Pickup geocoding error:", err));
        }, 400);
        return () => clearTimeout(timer);
    }, [pickup, isPickupFocused]);

    useEffect(() => {
        if (!isDestinationFocused || !destination) {
            setDestinationSuggestions([]);
            return;
        }
        const timer = setTimeout(() => {
            fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&bounded=1&viewbox=8.4,50.0,8.9,50.3`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setDestinationSuggestions(data);
                })
                .catch(err => console.error("Destination geocoding error:", err));
        }, 400);
        return () => clearTimeout(timer);
    }, [destination, isDestinationFocused]);

    const handleStopChange = (index, value) => {
        const updated = [...stops];
        updated[index].address = value;
        setStops(updated);
        
        if (!value.trim()) {
            updated[index].suggestions = [];
            setStops(updated);
            return;
        }
        
        if (updated[index].timer) clearTimeout(updated[index].timer);
        updated[index].timer = setTimeout(() => {
            fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&bounded=1&viewbox=8.4,50.0,8.9,50.3`)
                .then(res => res.json())
                .then(data => {
                    const latest = [...stops];
                    if (latest[index] && Array.isArray(data)) {
                        latest[index].suggestions = data;
                        setStops(latest);
                    }
                })
                .catch(err => console.error("Stop geocoding error:", err));
        }, 400);
    };

    const addStopField = () => {
        setStops([...stops, { id: Date.now(), address: '', coords: null, suggestions: [] }]);
    };

    const removeStopField = (index) => {
        const updated = stops.filter((_, i) => i !== index);
        setStops(updated);
    };

    const sharedTypes = [
        { id: 'green3', label: 'Grien3', icon: Users, desc: '3 Seats Shared' },
        { id: 'greenmax', label: 'Grien Max', icon: Car, desc: '6+ Seats Van' }
    ];

    const driverTags = [
        { emoji: '🚀', label: 'Mach Flow' },
        { emoji: '🛡️', label: 'Shield Mode' },
        { emoji: '🥃', label: 'Green Vibe' },
        { emoji: '🧠', label: 'Smart Route' },
        { emoji: '✨', label: 'Void Clean' },
        { emoji: '🤝', label: 'Handshake' }
    ];

    const customerTags = [
        { emoji: '😊', label: 'Friendly' },
        { emoji: '🤫', label: 'Silent' },
        { emoji: '😇', label: 'Polite' },
        { emoji: '⌚', label: 'Punctual' },
        { emoji: '🛡️', label: 'Respectful' }
    ];

    // Simulation Sequence
    React.useEffect(() => {
        if (rideStatus === 'accepted' && !driverInfo?.isRealTime) {
            // Simulate driver arriving after 6 seconds
            const timer = setTimeout(() => {
                setRideStatus('arrived');
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [rideStatus, driverInfo]);

    React.useEffect(() => {
        let interval;
        if (rideStatus === 'arrived' && waitingSeconds > 0) {
            interval = setInterval(() => {
                setWaitingSeconds(prev => prev - 1);
            }, 1000);
        }
        
        // Auto-board after 4 seconds (Driver handles it)
        if (rideStatus === 'arrived' && !driverInfo?.isRealTime) {
            const boardingTimer = setTimeout(() => {
                setRideStatus('boarding');
                
                // Finalize boarding after 3 seconds
                setTimeout(() => {
                    setRideStatus('in_ride');
                    
                    // NEW: Simulate driver completing the trip after 10 seconds of driving
                    setTimeout(() => {
                        setRideStatus('completed');
                    }, 10000);
                }, 3000);
            }, 4000);
            return () => {
                clearInterval(interval);
                clearTimeout(boardingTimer);
            };
        }
        
        return () => clearInterval(interval);
    }, [rideStatus, waitingSeconds, driverInfo]);

    // Searching Timeout & Re-routing Logic
    React.useEffect(() => {
        let interval;
        if (rideStatus === 'searching') {
            interval = setInterval(() => {
                setSearchingSeconds(prev => prev + 1);
            }, 1000);
        } else {
            setSearchingSeconds(0);
        }
        return () => clearInterval(interval);
    }, [rideStatus]);

    React.useEffect(() => {
        if (rideStatus === 'searching' && searchingSeconds === 60) {
            triggerNotification('system', 'Expanding Search', 'No immediate response. Re-routing request to other nearby drivers...');
        }
    }, [rideStatus, searchingSeconds]);

    // Custom trigger: check if ride pickup/destination is within 2 km of any active campaign hotspot
    React.useEffect(() => {
        if (rideStatus === 'searching') {
            const hotspots = {
                'Zeil': [50.1139, 8.6876],
                'Frankfurt Airport': [50.0379, 8.5622],
                'Main-Taunus-Zentrum': [50.1175, 8.5280],
                'Hessen-Center': [50.1384, 8.7845]
            };

            const calculateDistance = (lat1, lon1, lat2, lon2) => {
                const R = 6371; // km
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = 
                    Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                return R * c;
            };

            const activeOffers = JSON.parse(localStorage.getItem('green_active_offers') || '[]');
            let offerTriggered = false;

            activeOffers.forEach(offer => {
                // If the offer has custom lat/lng/radius, use them; otherwise fallback to default presets
                const defaultHotspots = {
                    'Zeil': [50.1139, 8.6876],
                    'Frankfurt Airport': [50.0379, 8.5622],
                    'Main-Taunus-Zentrum': [50.1175, 8.5280],
                    'Hessen-Center': [50.1384, 8.7845]
                };
                const lat = offer.lat || (defaultHotspots[offer.shop] ? defaultHotspots[offer.shop][0] : null);
                const lng = offer.lng || (defaultHotspots[offer.shop] ? defaultHotspots[offer.shop][1] : null);
                const maxRadius = offer.radius || 2.0;

                if (lat !== null && lng !== null) {
                    const distToPickup = calculateDistance(pickupCoords[0], pickupCoords[1], lat, lng);
                    const distToDest = calculateDistance(destinationCoords[0], destinationCoords[1], lat, lng);

                    // Trigger if pickup or destination is within custom radius
                    if ((distToPickup <= maxRadius || distToDest <= maxRadius) && !offerTriggered) {
                        offerTriggered = true;

                        const customOffers = JSON.parse(localStorage.getItem('green_custom_offers') || '[]');
                        // Make sure we only add it once per ride booking session
                        const exists = customOffers.some(o => o.sender === offer.shop && o.subject.includes(offer.offer));

                        if (!exists) {
                            const newInboxOffer = {
                                id: `custom-offer-${Date.now()}`,
                                type: 'offer',
                                sender: offer.shop,
                                role: `Exclusive Partner Offer`,
                                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${offer.shop.replace(/\s+/g, '')}`,
                                subject: `Route Discount: ${offer.offer}! 🚀`,
                                preview: `Unlocked matching your route near ${offer.shop}. View details.`,
                                content: `Welcome Passenger! Your booked route starts or ends within a ${maxRadius.toFixed(1)} km radius of the ${offer.shop} zone. Because of this, the admin team has unlocked an exclusive ${offer.category} offer just for you: "${offer.offer}". Present this coupon or QR code upon arrival to claim your discount.`,
                                time: 'Just Now',
                                tag: `${offer.category} • Route Match 🎯`,
                                actionText: 'View Special Offer',
                                actionRoute: '/home'
                            };
                            localStorage.setItem('green_custom_offers', JSON.stringify([newInboxOffer, ...customOffers]));
                            triggerNotification('success', 'PARTNER OFFER UNLOCKED 🎯', `Exclusive voucher from ${offer.shop} added to your inbox!`);
                        }
                    }
                }
            });
        }
    }, [rideStatus, pickupCoords, destinationCoords]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;

        const newMessage = { sender: 'user', text: messageInput, timestamp: new Date() };
        setChatMessages([...chatMessages, newMessage]);
        setMessageInput('');

        // Mock reply
        setTimeout(() => {
            const reply = { sender: 'driver', text: "Got it! See you soon.", timestamp: new Date() };
            setChatMessages(prev => [...prev, reply]);
        }, 2000);
    };

    const toggleTag = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleAddCard = () => {
        const lastFour = cardForm.number.slice(-4);
        const newMethod = {
            id: `card-${Date.now()}`,
            name: 'Credit Card',
            icon: CreditCard,
            color: 'text-brand',
            label: `CC •••• ${lastFour}`
        };
        setUserPaymentMethods([...userPaymentMethods, newMethod]);
        setSelectedPayment(newMethod);
        setPaymentModalMode('select');
        setCardForm({ name: '', number: '', expiry: '', cvv: '' });
    };

    const handleAddBank = () => {
        const maskedIban = cardForm.iban ? `IBAN •••• ${cardForm.iban.slice(-4)}` : 'Bank Account';
        const newMethod = {
            id: `bank-${Date.now()}`,
            name: 'Bank Account',
            icon: Wallet,
            color: 'text-blue-400',
            label: maskedIban
        };
        setUserPaymentMethods([...userPaymentMethods, newMethod]);
        setSelectedPayment(newMethod);
        setPaymentModalMode('select');
        setBankForm({ name: '', iban: '', bic: '' });
    };

    const brands = [
        { name: 'VW', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg' },
        { name: 'Toyota', logo: 'https://www.vectorlogo.zone/logos/toyota/toyota-icon.svg' },
        { name: 'Ford', logo: 'https://www.vectorlogo.zone/logos/ford/ford-icon.svg' },
        { name: 'Peugeot', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg' },
        { name: 'Opel', logo: 'https://www.logo.wine/a/logo/Opel/Opel-Logo.wine.svg' },
        { name: 'Tesla', logo: 'https://www.vectorlogo.zone/logos/tesla/tesla-icon.svg' },
        { name: 'Mercedes', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg' },
        { name: 'BMW', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg' }
    ];

    const frankfurtStreets = [
        "Mainzer Landstraße", "Zeil", "Kaiserstraße", "Berger Straße", 
        "Hanauer Landstraße", "Eschersheimer Landstraße", "Leipziger Straße",
        "Schweizer Straße", "Bockenheimer Landstraße", "Taunusanlage"
    ];

    const { socket, drivers: socketDrivers } = useSocket();
    
    // Real-time socket events for Dispatch & Trip synchronization
    React.useEffect(() => {
        if (!socket) return;

        const handleRideAccepted = (data) => {
            if (data.passengerId === 'alex-passenger-id') {
                console.log('Real-Time Ride Accepted by Driver:', data.driver);
                setDriverInfo({
                    ...data.driver,
                    isRealTime: true // Flag to identify real-time socket sessions
                });
                setRideStatus('accepted');
                setShowTopNotification(true);
                triggerNotification('system', 'Ride Accepted', `${data.driver.name} is on the way!`);
            }
        };

        const handleDriverArrived = (data) => {
            if (data.passengerId === 'alex-passenger-id') {
                console.log('Real-Time Driver Arrived at pickup');
                setRideStatus('arrived');
                triggerNotification('system', 'Driver Arrived', 'Your driver has arrived at the pickup origin!');
            }
        };

        const handleStartRide = (data) => {
            if (data.passengerId === 'alex-passenger-id') {
                console.log('Real-Time Ride Started');
                setRideStatus('boarding');
                setTimeout(() => {
                    setRideStatus('in_ride');
                }, 2000);
            }
        };

        const handleCompleteRide = (data) => {
            if (data.passengerId === 'alex-passenger-id') {
                console.log('Real-Time Ride Completed');
                setRideStatus('completed');
                triggerNotification('system', 'Trip Completed', 'Thank you for choosing Grien!');
            }
        };

        const handleRideCanceled = (data) => {
            console.log('Ride canceled:', data);
            setRideStatus('idle');
        };

        const handleNoDrivers = (data) => {
            console.log('No drivers in 5km. Prompting expansion:', data);
            setShowExpansionPrompt(true);
        };

        const handlePoolMatchPending = (data) => {
            if (data.originalPassengerId === (user?.email || 'alex-passenger-id')) {
                setShowPoolRequest(data.newPassenger);
                triggerNotification('system', 'Pool Match Found', `${data.newPassenger.name} is on your route.`);
            }
        };

        const handlePoolMatchResult = (data) => {
            // If accepted and we are the passenger
            if (data.accepted && data.role === 'passenger' && data.originalPassengerId === (user?.email || 'alex-passenger-id')) {
                // We add them to our mock pool
                setShowPoolRequest(null);
                triggerNotification('success', 'Match Accepted', 'Route updated.');
            } else if (!data.accepted && data.originalPassengerId === (user?.email || 'alex-passenger-id')) {
                setShowPoolRequest(null);
                triggerNotification('system', 'Match Declined', 'Continuing private ride.');
            }
        };

        socket.on('ride-accepted', handleRideAccepted);
        socket.on('driver-arrived', handleDriverArrived);
        socket.on('start-ride', handleStartRide);
        socket.on('complete-ride', handleCompleteRide);
        socket.on('ride-canceled', handleRideCanceled);
        socket.on('no-drivers-found', handleNoDrivers);
        socket.on('pool-match-pending', handlePoolMatchPending);
        socket.on('pool-match-result', handlePoolMatchResult);

        return () => {
            socket.off('ride-accepted', handleRideAccepted);
            socket.off('driver-arrived', handleDriverArrived);
            socket.off('start-ride', handleStartRide);
            socket.off('complete-ride', handleCompleteRide);
            socket.off('ride-canceled', handleRideCanceled);
            socket.off('no-drivers-found', handleNoDrivers);
            socket.off('pool-match-pending', handlePoolMatchPending);
            socket.off('pool-match-result', handlePoolMatchResult);
        };
    }, [socket, setDriverInfo, setRideStatus]);

    // Emit ride-request to socket server when status changes to searching
    React.useEffect(() => {
        if (rideStatus === 'searching' && socket) {
            console.log('Emitting ride-request via sockets for Alex Passenger');
            
            const activeDistance = destinationCoords ? liveDistance : 8.4;
            const isPremiumActive = showPremiumBrands || !!selectedBrand;
            let finalBookingPrice;
            if (serviceType === 'max') {
                if (isPremiumActive) {
                    finalBookingPrice = calculatePrice(activeDistance, 1, 'premium_max').discountedPrice;
                } else {
                    const stdPricing = calculatePrice(activeDistance, 1, 'standard');
                    finalBookingPrice = (parseFloat(stdPricing.discountedPrice) * 1.5).toFixed(2);
                }
            } else if (serviceType === 'shared') {
                const sharedPricing = calculatePrice(activeDistance, poolPassengers, 'shared');
                finalBookingPrice = sharedPricing.discountedPrice;
            } else {
                const pricingType = isPremiumActive ? 'premium' : 'standard';
                const currentPricing = calculatePrice(activeDistance, 1, pricingType);
                finalBookingPrice = currentPricing.discountedPrice;
            }
            
            socket.emit('ride-request', {
                passengerId: user?.email || `guest-${Date.now()}`,
                passengerName: user?.name || 'Guest Passenger',
                pickup: pickup,
                destination: destination || 'Mainzer Landstraße 123',
                coords: { lat: pickupCoords[0], lng: pickupCoords[1] },
                rideType: (serviceType === 'max' && isPremiumActive) ? 'premium_max' : ((serviceType === 'standard' && isPremiumActive) ? 'premium' : serviceType),
                capacity: serviceType === 'max' ? 6 : (serviceType === 'shared' ? poolPassengers : 3),
                price: parseFloat(finalBookingPrice),
                paymentType: selectedPayment.name
            });
        }
    }, [rideStatus, socket, pickup, destination, pickupCoords, serviceType, selectedPayment, poolPassengers, liveDistance, destinationCoords, showPremiumBrands, selectedBrand]);
    
    // Ensure we always have drivers on the map even if socket is quiet
    const [demoDrivers] = useState([
        { id: 'd-1', lat: 50.115, lng: 8.680, brand: 'Tesla', status: 'Online', name: 'Marco S.', rating: 4.9, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco' },
        { id: 'd-2', lat: 50.108, lng: 8.665, brand: 'BMW', status: 'Nearby', name: 'Elena R.', rating: 4.8, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena' },
        { id: 'd-3', lat: 50.125, lng: 8.690, brand: 'Mercedes', status: 'Online', name: 'Klaus W.', rating: 5.0, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Klaus' }
    ]);

    const activeMarkers = socketDrivers?.length > 0 ? socketDrivers : demoDrivers;

    const handleExecute = async () => {
        if (!destination || hasWhistled || isProcessing) return;
        
        setHasWhistled(true);
        setWhistleEffectActive(true);
        setTimeout(() => setWhistleEffectActive(false), 1200);
        
        setIsProcessing(true);
        
        const activeDistance = destinationCoords ? liveDistance : 8.4;
        const isPremiumActive = showPremiumBrands || !!selectedBrand;
        let finalBookingPrice;
        if (serviceType === 'max') {
            if (isPremiumActive) {
                finalBookingPrice = calculatePrice(activeDistance, 1, 'premium_max').discountedPrice;
            } else {
                const stdPricing = calculatePrice(activeDistance, 1, 'standard');
                finalBookingPrice = (parseFloat(stdPricing.discountedPrice) * 1.5).toFixed(2);
            }
        } else if (serviceType === 'shared') {
            const sharedPricing = calculatePrice(activeDistance, poolPassengers, 'shared');
            finalBookingPrice = sharedPricing.discountedPrice;
        } else {
            const pricingType = isPremiumActive ? 'premium' : 'standard';
            const currentPricing = calculatePrice(activeDistance, isPoolingEnabled ? poolPassengers : 1, pricingType);
            finalBookingPrice = currentPricing.discountedPrice;
        }
        
        // STAGE 1: Stripe Test Mode Integration
        const wsUrl = import.meta.env.VITE_WS_URL || `http://${window.location.hostname}:3001`;
        const backendUrl = wsUrl.replace(/^ws/, 'http');
        let isMock = false;
        
        if (selectedPayment.id !== 'cash') {
            try {
                // Fetch latest provision rules
                let baseFee = 3.00;
                let increment = 2.00;
                try {
                    const docSnap = await getDoc(doc(fbDb, 'system_config', 'provisions'));
                    if (docSnap.exists()) {
                        const r = docSnap.data();
                        baseFee = parseFloat(r.fleetBaseFee) || 3.00;
                        increment = parseFloat(r.fleetIncrement) || 2.00;
                    }
                } catch(e) { console.warn("Could not fetch provision rules, using defaults", e); }
                
                const price = parseFloat(finalBookingPrice);
                // Math: 3 + floor(price / 30) * 2
                const calculatedProvision = baseFee + Math.floor(price / 30) * increment;
                const applicationFeeAmount = Math.round(calculatedProvision * 100); // Stripe uses cents

                const response = await fetch(`${backendUrl}/api/payment/stripe/intent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        amount: Math.round(price * 100), 
                        currency: 'eur',
                        applicationFeeAmount: applicationFeeAmount,
                        // Note: partnerStripeAccountId should be injected here once the driver is assigned, 
                        // or handled via Separate Charges and Transfers if driver is unknown at checkout.
                    })
                });
                const data = await response.json();
                isMock = data.isMock;
            } catch (err) {
                console.error("Stripe Sandbox Request failed:", err);
                isMock = true;
            }
        }
        
        setIsProcessing(false);
        setPaymentConfirmed(true);
        const paymentMsg = selectedPayment.id === 'cash' 
            ? `Payment set to Cash. Please pay €${finalBookingPrice} at destination.` 
            : isMock 
                ? `€${finalBookingPrice} authorized via simulated Sandbox gateway (${selectedPayment.label})` 
                : `€${finalBookingPrice} successfully charged via Stripe Sandbox (${selectedPayment.label})`;
                
        triggerNotification('payment', selectedPayment.id === 'cash' ? 'Cash Selected' : 'Payment Secured', paymentMsg);
        
        // STAGE 2: Payment Confirmed -> Search
        setTimeout(() => {
            setPaymentConfirmed(false);
            setRideStatus('searching');
            
            // If a specific driver was targeted on the map, auto-assign them after a short delay
            if (targetDriver) {
                setTimeout(() => {
                    setDriverInfo(targetDriver);
                    setTargetDriver(null);
                    setRideStatus('accepted');
                    setShowTopNotification(true);
                }, 2000);
            }
        }, 1500);
    };

    const handleGPSLocation = () => {
        console.log('GPS: handleGPSLocation called');
        if (!navigator.geolocation) {
            console.error('GPS: Geolocation not supported');
            alert('GPS not supported by your browser');
            return;
        }

        setPickup('Locating...');
        console.log('GPS: Requesting start');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('GPS: Success', position);
                const { latitude, longitude } = position.coords;
                setPickup(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
                setPickupCoords([latitude, longitude]);
                // In a real app, we would reverse geocode here
            },
            (error) => {
                console.error('Error getting location:', error);
                console.log('GPS: Error code', error.code, 'message', error.message);
                setPickup('GPS access denied / unavailable');
                alert(`GPS Error: ${error.message} (Code: ${error.code})`);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    };

    // Auto-hide Top Notification when it appears
    React.useEffect(() => {
        if (showTopNotification) {
            const timer = setTimeout(() => {
                setShowTopNotification(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showTopNotification]);

    // Force hide Top Notification if status changes from accepted
    React.useEffect(() => {
        if (rideStatus !== "accepted") { setShowTopNotification(false); }
    }, [rideStatus]);

    // Live Tracking Sync
    React.useEffect(() => {
        if ((rideStatus === 'accepted' || rideStatus === 'arrived' || rideStatus === 'in_ride') && driverInfo && socketDrivers) {
            const assignedDriver = socketDrivers.find(d => d.id === driverInfo.id);
            if (assignedDriver) {
                // Update local distance and ETA based on live socket data
                const dist = Math.sqrt(
                    Math.pow(assignedDriver.lat - pickupCoords[0], 2) + 
                    Math.pow(assignedDriver.lng - pickupCoords[1], 2)
                ) * 111; // Rough conversion to km
                
                setLiveDistance(dist);
                setLiveETA(`${Math.ceil(dist * 3)} min`);
                
                // Update driverInfo with latest coords for marker rendering if needed
                setDriverInfo(prev => ({ ...prev, lat: assignedDriver.lat, lng: assignedDriver.lng }));
            }
        }
    }, [socketDrivers, rideStatus, driverInfo, pickupCoords]);

    const renderBottomSheetContent = () => {
        if (isMiniMode && rideStatus === 'idle') {
            return (
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-1.5 rounded-full bg-[var(--brand)] opacity-30 mb-2" />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (hasWhistled || isProcessing) return;
                            setIsMiniMode(false);
                            handleExecute();
                        }}
                        disabled={hasWhistled || isProcessing}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all relative overflow-hidden group ${hasWhistled ? 'bg-gray-800 grayscale cursor-not-allowed' : 'bg-[var(--brand)] hover:scale-110 active:scale-95 shadow-[0_0_50px_var(--brand-glow)]'}`}
                        style={{ 
                            border: '4px solid white', 
                            boxShadow: hasWhistled ? 'none' : '0 0 30px var(--brand-glow), 0 10px 40px rgba(0,0,0,0.8)' 
                        }}
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {hasWhistled ? (
                            <ShieldCheck size={36} className="text-white/40 relative z-10" />
                        ) : (
                            <Zap size={36} className="text-white fill-white relative z-10" />
                        )}
                        
                        {/* Orbiting Ring for premium feel */}
                        {!hasWhistled && (
                            <>
                                <div className="absolute inset-0 border-2 border-white/30 rounded-full animate-[spin_3s_linear_infinite]" />
                                <div className="absolute inset-2 border border-white/10 rounded-full animate-[spin_5s_linear_reverse_infinite]" />
                            </>
                        )}
                    </button>
                    <div className="text-center pb-2">
                        <p className={`text-[10px] md:text-xs lg:text-sm font-black italic uppercase tracking-[0.4em] drop-shadow-md transition-colors ${hasWhistled ? 'text-white/20' : 'text-white'}`}>
                            Whistle
                        </p>
                    </div>
                </div>
            );
        }

        if (rideStatus === 'searching') {
            return (
                <div className="flex flex-col items-center justify-center py-12 space-y-8 relative">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-brand/10 border-t-brand animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Navigation size={32} className="text-brand" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-black italic uppercase text-black tracking-tighter">Scanning the Grid</h2>
                        <p className="text-[10px] md:text-xs lg:text-sm text-black/40 font-bold uppercase tracking-[0.3em]">Connecting to nearby Hubs...</p>
                    </div>
                    <div className="flex flex-col gap-3 w-full">
                        <div className="flex gap-2 items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-brand" style={{ animationDelay: '200ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-brand" style={{ animationDelay: '400ms' }} />
                        </div>
                        <button 
                            onClick={() => {
                                setRideStatus('idle');
                                setHasWhistled(false);
                            }}
                            className="w-full py-4 mt-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-white/40 hover:text-white/60 hover:bg-white/10 transition-all"
                        >
                            Cancel Search
                        </button>
                    </div>
                </div>
            );
        }

        if (rideStatus === 'idle') {
            return (
                <div className="space-y-3.5">
                    {/* Ultra-Mini Route Section */}
                    <div className="grid grid-cols-[1fr_auto] gap-2.5">
                        <div className="flex flex-col gap-3.5 flex-1">
                            {/* PICK-UP ORIGIN */}
                            <div className="space-y-1">
                                <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand uppercase tracking-widest block ml-2">Pick-up Origin</label>
                                <div className="relative">
                                    <div className="h-14 rounded-2xl flex items-center px-4 gap-4 bg-[#111A2E]/85 border border-white/20 focus-within:border-brand/60 focus-within:shadow-[0_0_15px_rgba(50,205,50,0.15)] transition-all">
                                        <div className="w-5 h-5 flex items-center justify-center text-brand">
                                            <LocateFixed size={16} />
                                        </div>
                                        <input
                                            value={pickup}
                                            onChange={(e) => setPickup(e.target.value)}
                                            onFocus={() => setIsPickupFocused(true)}
                                            onBlur={() => setTimeout(() => setIsPickupFocused(false), 200)}
                                            className="bg-transparent w-full focus:outline-none font-black text-[13px] text-white placeholder:text-white/40"
                                            placeholder="Pick-up origin address"
                                        />
                                    </div>
                                    {isPickupFocused && pickupSuggestions.length > 0 && (
                                        <div className="absolute left-0 right-0 top-15 z-[60] bg-[#111A2E] border border-white/20 rounded-2xl max-h-48 overflow-y-auto shadow-2xl p-2 space-y-1">
                                            {pickupSuggestions.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    onMouseDown={() => {
                                                        setPickupCoords([parseFloat(item.lat), parseFloat(item.lon)]);
                                                        setPickup(item.display_name);
                                                        setPickupSuggestions([]);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-[11px] md:text-sm lg:text-base font-bold text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors truncate"
                                                >
                                                    {item.display_name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* INTERMEDIATE STOPS */}
                            {stops.map((stop, idx) => (
                                <div key={stop.id} className="space-y-1">
                                    <div className="flex justify-between items-center ml-2">
                                        <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-amber-500 uppercase tracking-widest">Waypoint Stop {idx + 1}</label>
                                        <button 
                                            onClick={() => removeStopField(idx)}
                                            className="text-[9px] md:text-[11px] lg:text-xs font-black text-red-500 hover:text-red-400 uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-transform"
                                        >
                                            Remove Stop
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <div className="h-14 rounded-2xl flex items-center px-4 gap-4 bg-[#111A2E]/85 border border-amber-500/30 focus-within:border-amber-500/60 focus-within:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all">
                                            <div className="w-5 h-5 flex items-center justify-center text-amber-500 font-black text-[10px] md:text-xs lg:text-sm border border-amber-500/40 rounded-full">
                                                {idx + 1}
                                            </div>
                                            <input
                                                value={stop.address}
                                                onChange={(e) => handleStopChange(idx, e.target.value)}
                                                onFocus={() => {
                                                    const updated = [...stops];
                                                    updated[idx].isFocused = true;
                                                    setStops(updated);
                                                }}
                                                onBlur={() => {
                                                    setTimeout(() => {
                                                        const updated = [...stops];
                                                        if (updated[idx]) {
                                                            updated[idx].isFocused = false;
                                                            setStops(updated);
                                                        }
                                                    }, 200);
                                                }}
                                                className="bg-transparent w-full focus:outline-none font-black text-[13px] text-white placeholder:text-white/40"
                                                placeholder={`Address for Waypoint Stop ${idx + 1}`}
                                            />
                                        </div>
                                        {stop.isFocused && stop.suggestions && stop.suggestions.length > 0 && (
                                            <div className="absolute left-0 right-0 top-15 z-[60] bg-[#111A2E] border border-white/20 rounded-2xl max-h-48 overflow-y-auto shadow-2xl p-2 space-y-1">
                                                {stop.suggestions.map((item, sugIdx) => (
                                                    <button
                                                        key={sugIdx}
                                                        onMouseDown={() => {
                                                            const updated = [...stops];
                                                            updated[idx].coords = [parseFloat(item.lat), parseFloat(item.lon)];
                                                            updated[idx].address = item.display_name;
                                                            updated[idx].suggestions = [];
                                                            setStops(updated);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-[11px] md:text-sm lg:text-base font-bold text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors truncate"
                                                    >
                                                        {item.display_name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* TARGET DESTINATION */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-center ml-2">
                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand uppercase tracking-widest">Final Destination</label>
                                    <button 
                                        onClick={addStopField}
                                        className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand hover:text-brand-glow uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-transform"
                                    >
                                        + Add Stop
                                    </button>
                                </div>
                                <div className="relative">
                                    <div className="h-14 rounded-2xl flex items-center px-4 gap-4 bg-[#111A2E]/85 border border-white/20 focus-within:border-brand/60 focus-within:shadow-[0_0_15px_rgba(50,205,50,0.15)] transition-all">
                                        <div className="w-5 h-5 flex items-center justify-center text-brand">
                                            <MapPin size={16} />
                                        </div>
                                        <input
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                            onFocus={() => setIsDestinationFocused(true)}
                                            onBlur={() => setTimeout(() => setIsDestinationFocused(false), 200)}
                                            className="bg-transparent w-full focus:outline-none font-black text-[13px] text-white placeholder:text-white/40"
                                            placeholder="Final destination address"
                                        />
                                    </div>
                                    {isDestinationFocused && destinationSuggestions.length > 0 && (
                                        <div className="absolute left-0 right-0 top-15 z-[60] bg-[#111A2E] border border-white/20 rounded-2xl max-h-48 overflow-y-auto shadow-2xl p-2 space-y-1">
                                            {destinationSuggestions.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    onMouseDown={() => {
                                                        setDestinationCoords([parseFloat(item.lat), parseFloat(item.lon)]);
                                                        setDestination(item.display_name);
                                                        setDestinationSuggestions([]);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-[11px] md:text-sm lg:text-base font-bold text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors truncate"
                                                >
                                                    {item.display_name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleGPSLocation}
                            className="w-12 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg bg-[#111A2E]/85 border border-white/20 text-brand"
                            title="Use Current Location"
                        >
                            <Navigation size={20} />
                        </button>
                    </div>

                    <div
                        onClick={() => {
                            const next = !showPremiumBrands;
                            setShowPremiumBrands(next);
                            if (next) {
                                setServiceType('standard');
                            } else {
                                setSelectedBrand(null);
                            }
                        }}
                        className={`h-14 rounded-2xl flex items-center justify-between px-4 cursor-pointer transition-all border mb-2 ${showPremiumBrands ? 'scale-[1.02]' : 'opacity-90 hover:opacity-100'}`}
                        style={{ 
                            background: '#1A1A1A', 
                            borderColor: showPremiumBrands ? 'white' : 'rgba(255,255,255,0.1)',
                            boxShadow: showPremiumBrands ? '0 0 25px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 text-white`}>
                                <Car size={16} />
                            </div>
                            <div>
                                <p className="text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-white">Premium Fleet Selection</p>
                                <p className="text-[10px] md:text-xs lg:text-sm font-medium uppercase tracking-tighter mt-0.5 text-white/60">Choose specific vehicle marks</p>
                            </div>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-all bg-white/20`}>
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-md ${showPremiumBrands ? 'right-1' : 'left-1'}`} />
                        </div>
                    </div>

                    <AnimatePresence>
                        {showPremiumBrands && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="w-full origin-top overflow-x-auto no-scrollbar relative scroll-smooth"
                                style={{
                                    maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
                                }}
                            >
                                <div className="flex gap-6 px-12 w-max pb-6 items-center">
                                    {brands.map((brand, index) => {
                                        const isSelected = selectedBrand === brand.name;
                                        return (
                                            <button
                                                key={`${brand.name}-${index}`}
                                                onClick={() => {
                                                    setSelectedBrand(prev => {
                                                        const nextBrand = prev === brand.name ? null : brand.name;
                                                        if (nextBrand) setServiceType('standard');
                                                        return nextBrand;
                                                    });
                                                }}
                                                className="relative flex flex-col items-center gap-2 shrink-0 transition-all duration-300"
                                                style={{ transform: isSelected ? 'scale(1.15)' : 'scale(1)' }}
                                            >
                                                {isSelected && (
                                                    <div className="absolute inset-[-4px] rounded-2xl pointer-events-none"
                                                        style={{ background: 'var(--brand-glow)', filter: 'blur(6px)' }} />
                                                )}

                                                <div className="w-13 h-13 rounded-2xl flex items-center justify-center relative z-10 overflow-hidden shadow-xl"
                                                    style={{
                                                        background: '#ffffff',
                                                        border: isSelected ? '2px solid var(--brand)' : '2px solid rgba(255,255,255,0.1)',
                                                        boxShadow: isSelected
                                                            ? '0 0 16px var(--brand-glow), 0 4px 16px rgba(0,0,0,0.5)'
                                                            : '0 2px 8px rgba(0,0,0,0.4)',
                                                    }}>
                                                    <img
                                                        src={brand.logo}
                                                        alt={brand.name}
                                                        className="w-8 h-8 object-contain"
                                                    />
                                                </div>
                                                <span className="text-[7px] font-black uppercase text-black mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    {brand.name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div
                        onClick={() => setIsFTDOnly(!isFTDOnly)}
                        className={`h-14 rounded-2xl flex items-center justify-between px-4 cursor-pointer transition-all border mb-3 ${isFTDOnly ? 'scale-[1.02]' : 'opacity-90 hover:opacity-100'}`}
                        style={{ 
                            background: '#1A1A1A', 
                            borderColor: isFTDOnly ? 'white' : 'rgba(255,255,255,0.1)',
                            boxShadow: isFTDOnly ? '0 0 25px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 text-white`}>
                                <Zap size={16} />
                            </div>
                            <div>
                                <p className="text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-white">FTD Search Mode</p>
                                <p className="text-[10px] md:text-xs lg:text-sm font-medium uppercase tracking-tighter mt-0.5 text-white/60">Prioritize favorite drivers</p>
                            </div>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-all bg-white/20`}>
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-md ${isFTDOnly ? 'right-1' : 'left-1'}`} />
                        </div>
                    </div>

                    {/* Service Selection Hub */}
                    <div className="flex gap-2.5 mb-3">
                        {[
                            { 
                                id: 'standard', 
                                label: 'Grien', 
                                icon: Car, 
                                desc: (showPremiumBrands || selectedBrand) ? (selectedBrand ? `${selectedBrand} Premium` : 'Premium') : 'Standard', 
                                activeColor: '#000000', 
                                textColor: '#FFFFFF', 
                                glow: 'rgba(255,255,255,0.1)' 
                            },
                            { 
                                id: 'shared', 
                                label: 'Shared', 
                                icon: Users, 
                                desc: 'COMING SOON', 
                                activeColor: '#00A2FF', 
                                textColor: '#FFFFFF', 
                                glow: 'rgba(0,162,255,0.6)', 
                                locked: true 
                            },
                            { 
                                id: 'max', 
                                label: 'Grien Max', 
                                icon: Car, 
                                desc: (showPremiumBrands || selectedBrand) ? (selectedBrand ? `${selectedBrand} Max` : 'Premium Max') : '6+ Seats', 
                                activeColor: '#1A1A1A', 
                                textColor: '#FFFFFF', 
                                glow: 'rgba(0,0,0,0.6)' 
                            }
                        ].map((type) => {
                            const isSelected = serviceType === type.id;
                            const isLocked = type.locked;
                            
                            const mockDistance = destinationCoords ? liveDistance : 8.4; 
                            const activeDist = destination ? mockDistance : 0;
                            
                            let finalPrice = '0.00';
                            if (type.id === 'standard') {
                                const pricingType = (showPremiumBrands || selectedBrand) ? 'premium' : 'standard';
                                finalPrice = calculatePrice(activeDist, 1, pricingType).discountedPrice;
                            } else if (type.id === 'max') {
                                if (showPremiumBrands || selectedBrand) {
                                    finalPrice = calculatePrice(activeDist, 1, 'premium_max').discountedPrice;
                                } else {
                                    const stdPricing = calculatePrice(activeDist, 1, 'standard');
                                    finalPrice = (parseFloat(stdPricing.discountedPrice) * 1.5).toFixed(2);
                                }
                            } else if (type.id === 'shared') {
                                finalPrice = calculatePrice(activeDist, poolPassengers, 'shared').discountedPrice;
                            }
                            
                            const displayPrice = type.id === 'shared' ? 'COMING SOON' : (destination ? `€${finalPrice}` : '');

                            return (
                                <button
                                    key={type.id}
                                    disabled={isLocked}
                                    onClick={() => {
                                        if (isLocked) return;
                                        setServiceType(type.id);
                                        setIsPoolingEnabled(false);
                                        if (type.id === 'shared') {
                                            setShowPremiumBrands(false);
                                            setSelectedBrand(null);
                                        }
                                    }}
                                    className={`flex-1 py-3 px-2 rounded-xl border transition-all flex flex-col items-center gap-1 group relative overflow-hidden ${isSelected ? 'scale-105 shadow-[0_15px_40px_rgba(0,0,0,0.15)]' : 'bg-black/5 border-black/5'} ${isLocked ? 'opacity-60 cursor-not-allowed bg-black/5' : ''}`}
                                    style={{ 
                                        background: isSelected ? type.activeColor : 'rgba(0,0,0,0.04)',
                                        borderColor: isSelected ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)',
                                        boxShadow: isSelected ? `0 12px 35px ${type.glow}` : 'none'
                                    }}
                                >
                                    {isLocked && (
                                        <div className="absolute top-1.5 right-1.5 bg-black/40 text-white p-1 rounded-full flex items-center justify-center shadow-sm">
                                            <Lock size={10} />
                                        </div>
                                    )}
                                    <type.icon size={16} className={isSelected ? 'text-white' : 'text-black/40'} />
                                    <div className="text-center">
                                        <p className={`text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-black/60'}`}>{type.label}</p>
                                        <p className={`text-[6px] font-black uppercase tracking-tighter mt-0.5 ${type.id === 'shared' ? 'text-amber-600 font-black' : (isSelected ? 'text-white/70' : 'text-black/30')}`}>{type.desc}</p>
                                    </div>
                                    <div className="mt-1">
                                        <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest ${type.id === 'shared' ? 'text-amber-600' : (isSelected ? 'text-white' : 'text-black/40')}`}>
                                            {displayPrice}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Dynamischer Mitfahrer-Wähler bei Shared */}
                    {serviceType === 'shared' && (
                        <div className="p-3.5 rounded-2xl border mb-3 flex flex-col gap-2 animate-[fadeIn_0.25s_ease]"
                             style={{ 
                                 background: '#1A1A1A', 
                                 borderColor: 'rgba(255,255,255,0.1)',
                                 boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                             }}>
                            <p className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-white/50 text-center">
                                Geteilte Passagiere (Mitfahrer-Pool)
                            </p>
                            <div className="flex gap-2">
                                {[2, 3, 4, 5].map((count) => {
                                    const discounts = { 2: '25%', 3: '37.5%', 4: '43.75%', 5: '50%' };
                                    const driverBonuses = { 2: '125%', 3: '150%', 4: '175%', 5: '200%' };
                                    const isActive = poolPassengers === count;
                                    return (
                                        <button
                                            key={count}
                                            type="button"
                                            onClick={() => setPoolPassengers(count)}
                                            className={`flex-1 py-2 rounded-xl border flex flex-col items-center gap-0.5 transition-all hover:scale-105 active:scale-95 ${
                                                isActive 
                                                ? 'bg-[#00A2FF] border-transparent text-white shadow-lg shadow-[#00A2FF]/20' 
                                                : 'bg-black/35 border-white/5 text-white/50 hover:border-white/10 hover:text-white'
                                            }`}
                                        >
                                            <span className="text-[10px] md:text-xs lg:text-sm font-black">{count} Pers.</span>
                                            <span className="text-[7px] font-bold opacity-80">-{discounts[count]}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Minimalist Actions Hub */}
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowPaymentOptions(true)}
                            className="flex-1 h-14 bg-[#1A1A1A] border-none rounded-2xl flex items-center px-4 gap-3 hover:scale-[1.02] transition-all shadow-xl"
                        >
                            {React.createElement(selectedPayment.icon || CreditCard, { size: 18, className: "text-white" })}
                            <span className="text-[10px] md:text-xs lg:text-sm font-black text-white italic">{selectedPayment.label}</span>
                            <ChevronRight size={14} className="ml-auto text-white/40" />
                        </button>
                        
                        <button 
                            onClick={handleExecute}
                            disabled={hasWhistled || isProcessing}
                            className={`flex-[1.5] h-14 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl transition-all active:scale-95 ${hasWhistled ? 'bg-black/40 cursor-not-allowed border-white/5' : 'bg-black border-white/10 hover:border-white/20'}`}
                            style={{ 
                                boxShadow: whistleEffectActive 
                                    ? '0 0 60px rgba(255,255,255,0.6), inset 0 0 30px rgba(255,255,255,0.3)' 
                                    : hasWhistled 
                                        ? 'none'
                                        : '0 10px 30px rgba(0,0,0,0.5)' 
                            }}
                        >
                            {/* Sophisticated Shockwave Animation */}
                            <AnimatePresence>
                                {whistleEffectActive && (
                                    <>
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: [0, 0.5, 0], scale: 2.5 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className="absolute inset-0 bg-white/30 rounded-full blur-2xl pointer-events-none"
                                        />
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: [0, 0.8, 0], scale: 2 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                                            className="absolute inset-0 border-2 border-white/40 rounded-full pointer-events-none"
                                        />
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 1 }}
                                            animate={{ opacity: [0, 1, 0], scale: 1.5 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.6, ease: "circOut" }}
                                            className="absolute inset-0 bg-gradient-to-t from-brand/40 to-transparent pointer-events-none"
                                        />
                                    </>
                                )}
                            </AnimatePresence>

                            <div className="relative z-10 flex flex-col items-center">
                                <span className={`text-[11px] md:text-sm lg:text-base font-black uppercase tracking-[0.2em] transition-all ${hasWhistled ? 'text-white/20' : 'text-white'}`}>
                                    Whistle
                                    <Zap size={14} className={`inline-block ml-2 ${hasWhistled ? 'fill-white/20 text-white/20' : 'fill-white text-white animate-pulse'}`} />
                                </span>
                            </div>

                            {!hasWhistled && (
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </button>
                    </div>
                </div>
            );
        }

        if (rideStatus === 'in_ride' && driverInfo) {
            return (
                /* In-Ride View - Active Journey Mode */
                <div className="flex flex-col gap-5 pt-1">
                    {/* Status Header - Pulsing Live Indicator */}
                    <div className="flex items-center justify-between border-b border-black/5 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <div className="w-2.5 h-2.5 rounded-full absolute inset-0 opacity-75" style={{ background: 'var(--accent-primary)' }}></div>
                                <div className="w-2.5 h-2.5 rounded-full relative z-10" style={{ background: 'var(--accent-primary)' }}></div>
                            </div>
                            <span className="text-[11px] md:text-sm lg:text-base font-black uppercase tracking-[0.2em]" style={{ color: 'var(--accent-primary)' }}>Heading to Destination</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[var(--text-secondary)] opacity-60 text-[9px] md:text-[11px] lg:text-xs font-mono font-bold tracking-widest">{driverInfo.plate}</span>
                            <div className="h-4 w-[1px] bg-[var(--border-main)]" />
                            <div className="flex items-center gap-1">
                                <Star size={10} className="fill-yellow-400 text-yellow-400" />
                                <span className="text-[var(--text-primary)] text-[10px] md:text-xs lg:text-sm font-black">{driverInfo.rating}</span>
                            </div>
                        </div>
                    </div>

                    {/* Compact Driver/Vehicle Row with Price & Distance */}
                    <div className="flex items-center gap-3 p-3 rounded-2xl border shadow-sm relative overflow-hidden" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-main)' }}>
                        <img src={driverInfo.image} alt="Driver" className="w-12 h-12 rounded-xl object-cover shadow-md" style={{ border: '1.5px solid var(--border-main)' }} />
                        <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                                <h4 className="text-[var(--text-primary)] text-sm font-black italic uppercase">{driverInfo.name}</h4>
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
                                    <Sparkles size={8} className="text-[var(--accent-primary)]" />
                                    <span className="text-[7px] font-black uppercase tracking-tighter text-[var(--accent-primary)]">Auto Rating: 4.8</span>
                                </div>
                            </div>
                            <p className="text-[var(--text-secondary)] opacity-60 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-tight mt-0.5">{driverInfo.car} • {driverInfo.color}</p>

                            {/* Ride Stats: KM & Price */}
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex flex-col">
                                    <span className="text-[var(--text-secondary)] opacity-60 text-[7px] uppercase tracking-widest font-black">Distance</span>
                                    <span className="text-[var(--text-primary)] text-[10px] md:text-xs lg:text-sm font-black">{liveDistance.toFixed(1)} km</span>
                                </div>
                                <div className="w-[1px] h-5 bg-[var(--border-main)]" />
                                <div className="flex flex-col">
                                    <span className="text-[var(--text-secondary)] opacity-60 text-[7px] uppercase tracking-widest font-black">Est. Fare</span>
                                    <div className="flex items-center gap-2">
                                        {isPoolingEnabled && (
                                            <span className="text-[var(--text-secondary)] opacity-30 text-[8px] md:text-[10px] lg:text-xs line-through font-black">€{((showPremiumBrands || selectedBrand) ? parseFloat(calculatePrice(liveDistance, 1, 'premium').discountedPrice) : parseFloat(calculatePrice(liveDistance, 1, 'standard').discountedPrice) * (serviceType === 'max' ? 1.5 : 1)).toFixed(2)}</span>
                                        )}
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black" style={{ color: 'var(--accent-primary)' }}>
                                            €{(serviceType === 'max'
                                                ? ((showPremiumBrands || selectedBrand)
                                                    ? calculatePrice(liveDistance, 1, 'premium_max').discountedPrice
                                                    : (parseFloat(calculatePrice(liveDistance, 1, 'standard').discountedPrice) * 1.5).toFixed(2)
                                                )
                                                : (showPremiumBrands || selectedBrand)
                                                    ? calculatePrice(liveDistance, 1, 'premium').discountedPrice
                                                    : calculatePrice(liveDistance, isPoolingEnabled ? poolPassengers : 1, serviceType === 'shared' ? 'shared' : 'standard').discountedPrice
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                            <div className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-main)] shadow-sm">
                                <span className="block text-sm font-black italic text-[var(--accent-primary)]">{liveETA}</span>
                            </div>
                            <span className="text-[var(--text-secondary)] opacity-60 text-[7px] uppercase tracking-[0.2em] font-black">Remaining</span>
                        </div>
                    </div>

                    {/* Safety & Actions Grid */}
                    <div className="grid grid-cols-4 gap-2">
                        <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className="col-span-2 h-11 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border shadow-sm"
                            style={{
                                background: isFavorite ? 'rgba(255,105,180,0.1)' : 'var(--bg-secondary)',
                                borderColor: isFavorite ? '#FF69B4' : 'var(--border-main)',
                                color: isFavorite ? '#FF69B4' : 'var(--text-primary)'
                            }}
                        >
                            <Star size={14} className={isFavorite ? "fill-current" : ""} />
                            {isFavorite ? "Favorite Saved" : "Favorite Driver"}
                        </button>
                        <button 
                            onClick={() => setShowFeedbackModal(true)}
                            className="h-10 rounded-lg text-[9px] md:text-[11px] lg:text-xs font-black uppercase flex flex-col items-center justify-center gap-0.5 transition-all shadow-sm bg-[var(--bg-secondary)] border border-[var(--border-main)] text-[var(--text-primary)]"
                        >
                            <span>💬</span> Feedback
                        </button>
                        <button
                            onClick={() => setShowEndTripReasons(true)}
                            className="h-10 rounded-lg text-[9px] md:text-[11px] lg:text-xs font-black uppercase flex flex-col items-center justify-center gap-0.5 transition-all shadow-sm bg-red-500/10 border border-red-900/35 text-red-500"
                        >
                            <span>🛑</span> <span className="text-[6px]">End Early</span>
                        </button>
                    </div>
                </div>
            );
        }

        if (rideStatus === 'boarding') {
            return (
                <div className="flex flex-col items-center justify-center py-12 space-y-8">
                    <motion.div 
                        animate={{ scale: [1, 1.1, 1] }} 
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-24 h-24 rounded-[2.5rem] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]"
                    >
                        <ShoppingBag size={40} className="animate-pulse" />
                    </motion.div>
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter">Safe Boarding</h2>
                        <p className="text-[10px] md:text-xs lg:text-sm text-[var(--accent-primary)] font-black uppercase tracking-[0.4em]">Synchronizing Passenger Profile...</p>
                        <button 
                            onClick={() => setRideStatus('in_ride')}
                            className="mt-6 px-8 py-3.5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest transition-all shadow-2xl hover:scale-105 active:scale-95 border border-[var(--border-main)]"
                        >
                            Manual Boarding Confirm
                        </button>
                    </div>
                </div>
            );
        }

        if (rideStatus === 'completed' && driverInfo) {
            return (
                /* Completed View - Receipt & Rating */
                <div className="flex flex-col gap-5 pt-1">
                    {/* Success Header */}
                    <div className="text-center">
                        <h2 className="text-2xl font-black italic text-[var(--text-primary)] uppercase tracking-tighter">You've Arrived</h2>
                        <p className="text-[var(--text-secondary)] text-[10px] md:text-xs lg:text-sm uppercase tracking-[0.3em] mt-1">Ride Completed • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    {/* Receipt Card */}
                    <div className="rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-main)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[var(--text-secondary)] opacity-60 text-[10px] md:text-xs lg:text-sm uppercase tracking-wider font-bold">Total Fare</span>
                            <span className="text-2xl font-black text-[var(--text-primary)]">€{serviceType === "shared" ? "19.60" : "24.50"}</span>
                        </div>
                        <div className="h-px bg-[var(--border-main)]" />
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-4 rounded flex items-center justify-center bg-[var(--accent-primary)]/10">
                                <selectedPayment.icon size={10} className="text-[var(--accent-primary)]" />
                            </div>
                            <span className="text-[var(--text-secondary)] opacity-60 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-tight">{selectedPayment.label}</span>
                        </div>
                        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl pointer-events-none bg-[var(--accent-primary)]/10" />
                    </div>

                    {/* Rating Section */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <img src={driverInfo.image} alt="Driver" className="w-8 h-8 rounded-full border border-[var(--border-main)] shadow-sm" />
                            <div className="flex-1">
                                <p className="text-[var(--text-primary)] text-xs md:text-sm lg:text-base font-black uppercase italic tracking-tight">Rate {driverInfo.name}</p>
                                <p className="text-[var(--text-secondary)] opacity-60 text-[9px] md:text-[11px] lg:text-xs font-bold uppercase tracking-widest">How was your ride?</p>
                            </div>
                        </div>

                        {/* Interactive Stars */}
                        <div className="flex justify-between gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`h-10 flex-1 border rounded-lg flex items-center justify-center transition-all group ${rating >= star
                                        ? 'border-[var(--accent-primary)]/40'
                                        : 'bg-[var(--bg-secondary)] border-[var(--border-main)] hover:border-[var(--text-primary)]/20'
                                        }`}
                                    style={rating >= star ? { background: 'rgba(var(--accent-primary-rgb), 0.1)', boxShadow: '0 0 10px rgba(var(--accent-primary-rgb), 0.1)' } : {}}
                                >
                                    <Star
                                        size={18}
                                        className={`transition-colors ${rating >= star ? '' : 'text-[var(--text-secondary)] opacity-20 group-hover:text-[var(--text-primary)]/45'}`}
                                        style={rating >= star ? { color: 'var(--accent-primary)', fill: 'var(--accent-primary)' } : {}}
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Driver Tags */}
                        <div className="flex flex-wrap gap-2 mt-1">
                            {driverTags.map((tag) => (
                                <button
                                    key={tag.label}
                                    onClick={() => toggleTag(tag.label)}
                                    className={`px-3 py-1.5 rounded-full text-[10px] md:text-xs lg:text-sm font-black uppercase border transition-all flex items-center gap-1.5 ${selectedTags.includes(tag.label)
                                        ? 'text-white border-transparent'
                                        : 'border-[var(--border-main)] text-[var(--text-secondary)] opacity-70 hover:border-[var(--accent-primary)]/40 hover:text-[var(--text-primary)]'
                                        }`}
                                    style={selectedTags.includes(tag.label) ? { background: 'linear-gradient(135deg, var(--brand), var(--brand-end))', boxShadow: '0 0 12px rgba(var(--accent-primary-rgb), 0.3)' } : { background: 'var(--bg-btn-sec)' }}
                                >
                                    <span>{tag.emoji}</span>
                                    <span>{tag.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Co-Rider Rating Section (Only if Pooling/Shared) */}
                    {(isPoolingEnabled || serviceType === 'shared') && (
                        <div className="flex flex-col gap-4 p-5 rounded-[2rem] bg-[var(--bg-secondary)] border border-[var(--border-main)] shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-[var(--text-primary)]" />
                                    <h3 className="text-sm font-black italic uppercase text-[var(--text-primary)]">Co-Rider Social</h3>
                                </div>
                            </div>

                            {mockCoRiders.map((rider, idx) => (
                                <div key={rider.id} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={rider.image} alt={rider.name} className="w-10 h-10 rounded-full border border-black/10 shadow-sm" />
                                            {friendRequests[rider.id] && (
                                                <div className="absolute -top-1 -right-1 bg-black text-white rounded-full p-0.5 border border-white">
                                                    {friendRequests[rider.id] === 'pending' ? <Sparkles size={8} className="animate-pulse" /> : <ShieldCheck size={8} />}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-black text-[12px] font-black uppercase italic tracking-tight">{rider.name}</p>
                                            {friendRequests[rider.id] === 'pending' ? (
                                                <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-black/40 italic">Request Sent...</span>
                                            ) : friendRequests[rider.id] === 'accepted' ? (
                                                <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-black italic">Mutual Friend</span>
                                            ) : (
                                                <button 
                                                    onClick={() => setShowFriendConfirm(rider)}
                                                    className="flex items-center gap-1 text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-black/60 hover:text-black transition-colors"
                                                >
                                                    <Users size={8} /> Add as Friend
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Personality Check for Co-Rider */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {customerTags.map((tag) => (
                                            <button
                                                key={tag.label}
                                                onClick={() => {
                                                    setSelectedCoRiderTags(prev => {
                                                        const currentRiderTags = prev[rider.id] || [];
                                                        const newRiderTags = currentRiderTags.includes(tag.label)
                                                            ? currentRiderTags.filter(t => t !== tag.label)
                                                            : [...currentRiderTags, tag.label];
                                                        return { ...prev, [rider.id]: newRiderTags };
                                                    });
                                                }}
                                                className={`px-2 py-1 rounded-lg text-[8px] md:text-[10px] lg:text-xs font-bold border transition-all flex items-center gap-1 ${(selectedCoRiderTags[rider.id] || []).includes(tag.label)
                                                    ? 'bg-black/10 border-black/20 text-black'
                                                    : 'bg-white/50 border-black/5 text-black/40'
                                                }`}
                                            >
                                                <span>{tag.emoji}</span>
                                                <span>{tag.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {idx < mockCoRiders.length - 1 && <div className="h-px bg-black/5 mx-2" />}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Done Button */}
                    <button
                        onClick={async () => {
                            if (driverInfo) {
                                try {
                                    const ridePriceNum = parseFloat(finalBookingPrice) || (serviceType === 'shared' ? 19.60 : 24.50);
                                    const isCashPayment = selectedPayment?.id === 'cash';
                                    const rideProv = (3.00 + Math.floor(ridePriceNum / 30) * 2.00);

                                    const newRide = {
                                        passengerId: user?.email ? user.email.toLowerCase() : 'guest',
                                        driverId: driverInfo?.id || 'unknown',
                                        service: serviceType === 'shared' ? 'Grien Shared' : ((showPremiumBrands || selectedBrand) ? 'Grien Premium' : (serviceType === 'max' ? 'Grien Max' : 'Grien Ride (Standard)')),
                                        date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                        timestamp: Date.now(),
                                        price: `€ ${ridePriceNum.toFixed(2)}`,
                                        priceAmount: ridePriceNum,
                                        paymentMethod: isCashPayment ? 'cash' : 'card',
                                        paymentLabel: selectedPayment?.label || (isCashPayment ? 'Cash' : 'Card (Stripe)'),
                                        isCash: isCashPayment,
                                        provision: rideProv,
                                        cashOffset: isCashPayment ? rideProv : 0,
                                        stripeFeeAbsorbedByPlatform: isCashPayment ? 0 : parseFloat((ridePriceNum * 0.015 + 0.25).toFixed(2)),
                                        fleetId: driverInfo?.fleetId || 'acct_fleet_102',
                                        fleetName: driverInfo?.fleet || 'Hessen EcoFleet',
                                        pickup: pickup || 'Current Location',
                                        destination: destination || 'Eco-Park Central',
                                        driverName: driverInfo?.name || 'MICK D.',
                                        icon: serviceType === 'shared' ? 'Share2' : 'Zap',
                                        status: 'completed'
                                    };
                                    await addDoc(collection(db, 'rides'), newRide);
                                    
                                    // Maintain local copy for fast loading in legacy views
                                    const emailKey = user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'default';
                                    const historyKey = `green_ride_history_${emailKey}`;
                                    const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
                                    localStorage.setItem(historyKey, JSON.stringify([{ id: Date.now(), ...newRide }, ...existing]));
                                } catch (e) {
                                    console.error('Failed to save ride history to Firestore:', e);
                                }
                            }
                            setRideStatus('idle');
                            setDriverInfo(null);
                            setPickup('Main St 123 (Current)');
                            setDestination('');
                            setCoRiderRating(0);
                            setSelectedCoRiderTags({});
                            setHasWhistled(false);
                            setFriendRequests({});
                        }}
                        className="w-full h-12 font-black uppercase text-[10px] md:text-xs lg:text-sm tracking-[0.2em] italic rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all mt-2 text-white bg-[#1A1A1A] shadow-xl shadow-black/20"
                    >
                        Close Mission Ledger
                    </button>
                </div>
            );
        }


        if (rideStatus === 'arrived' && driverInfo) {
            return (
                <div className="flex flex-col gap-5 pt-1 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between border-b border-black/5 pb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_12px_rgba(var(--accent-primary-rgb), 0.3)]" />
                            <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-[var(--accent-primary)]">Driver has Arrived</span>
                        </div>
                        <div className="px-2.5 py-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-main)] flex items-center gap-2">
                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">FREE WAITING</span>
                            <span className="text-sm font-black font-mono text-[var(--text-primary)] italic">{formatTime(waitingSeconds)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-main)] shadow-sm">
                        <img src={driverInfo.image} alt="Driver" className="w-13 h-13 rounded-xl object-cover border border-[var(--border-main)] shadow-md" />
                        <div className="flex-1">
                            <h3 className="text-xl font-black italic tracking-tighter uppercase text-[var(--text-primary)]">{driverInfo.name}</h3>
                            <p className="text-[var(--text-secondary)] opacity-60 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest">{driverInfo.car} • {driverInfo.plate}</p>
                            <div className="flex items-center gap-1 mt-2">
                                <Sparkles size={10} className="text-[var(--accent-primary)]" />
                                <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">VEHICLE ID VERIFIED</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setShowChat(true)}
                            className="h-12 bg-white border border-black/5 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-black/60 hover:bg-black/5 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <MessageSquare size={16} /> Contact
                        </button>
                        <div className="h-12 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] italic text-[var(--accent-primary)]/60 flex items-center justify-center bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20">
                            Driver confirming boarding...
                        </div>
                    </div>
                </div>
            );
        }

        /* Standard Driver Details (Accepted State - Driver En Route) */
        if (driverInfo) {
            return (
                <div className="flex flex-col gap-5 pt-1">
                    {/* Status Header */}
                    <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_6px_rgba(var(--accent-primary-rgb), 0.3)]" />
                            <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-[var(--accent-primary)]">Driver En Route</span>
                        </div>
                        <span className="text-[var(--text-secondary)] opacity-60 text-[10px] md:text-xs lg:text-sm font-mono font-bold">ID: #8291</span>
                    </div>

                    {/* Main Driver & Car Info */}
                    <div className="flex gap-4">
                        {/* Driver Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 rounded-2xl p-1 border shadow-2xl bg-[var(--bg-secondary)] border-[var(--border-main)]">
                                <img src={driverInfo.image} alt="Driver" className="w-full h-full object-cover rounded-xl" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 text-[var(--bg-primary)] text-[10px] md:text-xs lg:text-sm font-black px-2 py-0.5 rounded-lg border border-[var(--border-main)] flex items-center gap-1 shadow-lg bg-[var(--accent-primary)]">
                                <span>★</span> {driverInfo.rating}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-0.5">
                                <h3 className="text-xl font-black italic tracking-tighter uppercase text-[var(--text-primary)]">{driverInfo.name}</h3>
                                <div className="px-3 py-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-main)] shadow-sm">
                                    <span className="text-lg font-black italic text-[var(--accent-primary)]">{driverInfo.eta}</span>
                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-tighter text-[var(--text-secondary)] opacity-60 ml-1.5">Arrival</span>
                                </div>
                            </div>
                            <p className="text-[var(--text-secondary)] opacity-80 text-xs md:text-sm lg:text-base font-black italic uppercase tracking-wider mb-2 leading-none">{driverInfo.car}</p>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg text-[10px] md:text-xs lg:text-sm text-[var(--text-secondary)] opacity-60 uppercase tracking-widest font-black bg-[var(--bg-secondary)] border border-[var(--border-main)]">{driverInfo.color}</span>
                                <span className="px-2.5 py-1 rounded-lg text-[10px] md:text-xs lg:text-sm font-mono text-[var(--text-secondary)] opacity-80 font-black bg-[var(--bg-secondary)] border border-[var(--border-main)]">{driverInfo.plate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 mt-1">
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setRideStatus('idle');
                                    setHasWhistled(false);
                                }}
                                className="flex-[1] h-11 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <X size={14} /> Cancel
                            </button>
                            <button
                                onClick={() => setShowChat(true)}
                                className="flex-[2] h-11 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-[var(--bg-primary)] bg-[var(--accent-primary)] shadow-[0_10px_25px_rgba(var(--accent-primary-rgb), 0.1)] border border-[var(--border-main)]"
                            >
                                Message Driver
                            </button>
                        </div>
                        {isPoolingEnabled && (
                            <button
                                onClick={() => {
                                    setIsPoolingEnabled(false);
                                    alert("Sharing stopped. Driver notified to maintain private route.");
                                }}
                                className="w-full h-10 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.1em] border border-white/20 bg-[var(--accent-primary)]/5 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all"
                            >
                                Exit Pool • Switch to Private
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return null;
    };

    const frankfurtCenter = [50.1109, 8.6821];

    return (
        <div className="relative min-h-full overflow-y-auto text-[var(--text-primary)] font-sans" style={{ background: 'var(--bg-primary)' }}>
            
            {/* Alive Infrastructure — Frankfurt Real-Time Grid */}
            <div className="absolute inset-0 z-0">
                <MapContainer 
                    center={frankfurtCenter} 
                    zoom={14} 
                    zoomControl={false}
                    attributionControl={false}
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        background: '#f8f9fa'
                    }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    <MapController 
                        center={pickupCoords} 
                        rideActive={rideStatus !== 'idle'}
                        driverPos={driverInfo ? [driverInfo.lat, driverInfo.lng] : null}
                        pickupPos={pickupCoords}
                    />

                    {/* Live Route Polyline */}
                    {driverInfo && driverInfo.lat && driverInfo.lng && (rideStatus === 'accepted' || rideStatus === 'arrived') && (
                        <Polyline 
                            positions={generateSmartPath([driverInfo.lat, driverInfo.lng], pickupCoords)}
                            pathOptions={{ 
                                color: 'var(--brand)', 
                                weight: 4, 
                                opacity: 0.6,
                                dashArray: '10, 15',
                                lineCap: 'round'
                            }} 
                        />
                    )}

                    {/* Dynamic Real Road Route Polyline */}
                    {streetCoordinates && streetCoordinates.length > 0 && (
                        <Polyline 
                            positions={streetCoordinates}
                            pathOptions={{ 
                                color: '#00D1FF', 
                                weight: 5, 
                                opacity: 0.8,
                                lineCap: 'round'
                            }} 
                        />
                    )}

                    {/* Destination Marker */}
                    {destinationCoords && (
                        <Marker 
                            position={destinationCoords} 
                            icon={L.divIcon({
                                className: 'destination-marker',
                                html: `<div class="w-8 h-8 rounded-full bg-red-500 border-4 border-white shadow-lg flex items-center justify-center">
                                    <div class="w-2 h-2 rounded-full bg-white"></div>
                                </div>`,
                                iconSize: [32, 32],
                                iconAnchor: [16, 16]
                            })}
                        >
                            <Tooltip direction="bottom" permanent>
                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-red-600 bg-white px-2 py-1 rounded shadow-sm border border-red-100">Destination</span>
                            </Tooltip>
                        </Marker>
                    )}

                    {/* Intermediate Stop Markers */}
                    {stops.filter(s => s.coords !== null).map((stop, idx) => (
                        <Marker 
                            key={stop.id}
                            position={stop.coords} 
                            icon={L.divIcon({
                                className: `stop-${idx}-marker`,
                                html: `<div class="w-8 h-8 rounded-full bg-amber-500 border-4 border-white shadow-lg flex items-center justify-center">
                                    <span class="text-[10px] md:text-xs lg:text-sm font-black text-white">${idx + 1}</span>
                                </div>`,
                                iconSize: [32, 32],
                                iconAnchor: [16, 16]
                            })}
                        >
                            <Tooltip direction="bottom" permanent>
                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-amber-600 bg-white px-2 py-1 rounded shadow-sm border border-amber-100">Stop {idx + 1}</span>
                            </Tooltip>
                        </Marker>
                    ))}

                    {/* Live Brand Markers */}
                    {activeMarkers?.filter(d => !selectedBrand || d.brand === selectedBrand).map(driver => {
                        const brand = brands.find(b => b.name === driver.brand) || brands[0];
                        const street = frankfurtStreets[Math.floor(Math.random() * frankfurtStreets.length)];
                        
                        // Highlight the assigned driver if ride is active
                        const isAssigned = driverInfo && (driver.id === driverInfo.id || (driver.name === driverInfo.name && driver.brand === driverInfo.brand));
                        const isSelected = selectedDriverId === driver.id;
                        const isOtherDriverActive = rideStatus !== 'idle' && !isAssigned;

                        if (isOtherDriverActive) return null; // Only show your driver when ride is active

                        return (
                            <Marker 
                                key={driver.id} 
                                position={[driver.lat, driver.lng]} 
                                icon={createBrandIcon(brand.logo, driver.status, isSelected, driver)}
                                eventHandlers={{
                                    click: () => {
                                        if (rideStatus !== 'idle') return;
                                        
                                        // Open Profile Dossier immediately on first click
                                        setShowDriverProfile({
                                            ...driver,
                                            street,
                                            car: `${driver.brand} Premium`,
                                            plate: `F-GR ${Math.floor(1000 + Math.random() * 9000)}`,
                                            color: 'Obsidian Black',
                                            eta: '3 min'
                                        });
                                        setSelectedDriverId(driver.id);
                                    }
                                }}
                            >
                                <Tooltip direction="top" offset={[0, isSelected ? -90 : -20]} permanent={isAssigned || isSelected}>
                                    <div className={`px-3 py-1.5 rounded-full shadow-2xl border transition-all ${isSelected ? 'bg-black border-black text-white' : (isAssigned ? 'bg-[var(--accent-primary)] border-white' : 'bg-white border-gray-100')}`}>
                                        <span className={`text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-black'}`}>
                                            {isAssigned ? 'Selected Unit' : (isSelected ? 'Confirm Selection' : brand.name)}
                                        </span>
                                    </div>
                                </Tooltip>
                            </Marker>
                        );
                    })}

                    {/* Customer Pickup Marker */}
                    {(rideStatus !== 'idle') && (
                        <Marker 
                            position={pickupCoords} 
                            icon={L.divIcon({
                                className: 'customer-marker',
                                html: `<div class="w-8 h-8 rounded-full bg-blue-500 border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
                                    <div class="w-2 h-2 rounded-full bg-white"></div>
                                </div>`,
                                iconSize: [32, 32],
                                iconAnchor: [16, 16]
                            })}
                        >
                            <Tooltip direction="bottom" permanent>
                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-blue-600 bg-white px-2 py-1 rounded shadow-sm border border-blue-100">Pick-up Here</span>
                            </Tooltip>
                        </Marker>
                    )}
                </MapContainer>

                {/* Radar Overlay Effect for "Alive" aesthetic */}
                <div className="absolute inset-0 z-10 pointer-events-none" 
                    style={{ 
                        background: 'radial-gradient(circle at center, transparent 30%, rgba(255,255,255,0.4) 100%)',
                        boxShadow: 'inset 0 0 150px rgba(0,0,0,0.02)'
                    }} 
                />
                
                {/* CRT Scanline Effect - Subtle for Light Mode */}
                <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.01]" 
                    style={{ 
                        backgroundImage: 'linear-gradient(rgba(0,0,0,1) 1px, transparent 1px)', 
                        backgroundSize: '100% 4px' 
                    }} 
                />
            </div>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
            `}</style>

            {/* Top Navigation - Compact HUD Overlay */}
            <header className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between pointer-events-none safe-top-padding">
                <button
                    onClick={() => {
                        if (showChat) {
                            setShowChat(false);
                        } else {
                            setAllowDashboardView(true);
                            navigate('/home');
                        }
                    }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all pointer-events-auto shadow-2xl bg-[var(--bg-secondary)] border border-[var(--border-main)]"
                >
                    <ArrowLeft size={20} className="text-[var(--text-primary)]" />
                </button>
                <div className="text-right">
                    <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.4em] italic" style={{ color: 'var(--text-primary)' }}>{currentCity}</p>
                </div>
            </header>

            {/* Top Sheet Notification System - Dark Glass Style */}
            <AnimatePresence>
                {rideStatus === 'searching' && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-20 left-4 right-4 z-50 pointer-events-none"
                    >
                        <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--accent-primary)', boxShadow: '0 12px 35px rgba(var(--accent-primary-rgb), 0.15)' }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center relative" style={{ background: 'rgba(var(--accent-primary-rgb), 0.1)' }}>
                                <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(var(--accent-primary-rgb), 0.2)' }} />
                                <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} className="relative z-10" />
                            </div>
                            <div>
                                <h3 className="text-black text-xs md:text-sm lg:text-base font-black uppercase tracking-widest">Scanning Grid...</h3>
                                <p className="text-black/40 text-[10px] md:text-xs lg:text-sm uppercase tracking-wider font-bold">Locating nearby premium units</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {rideStatus === 'accepted' && driverInfo && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-20 left-4 right-4 z-50 pointer-events-auto"
                    >
                        <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--accent-primary)', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                            <div className="absolute top-0 left-0 w-1 h-full" style={{ background: 'var(--accent-primary)' }} />

                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md" style={{ background: 'white', border: '1.5px solid white' }}>
                                        <img src={driverInfo.image} alt="Driver" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 text-[var(--bg-primary)] text-[8px] md:text-[10px] lg:text-xs font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm bg-[var(--accent-primary)] border border-[var(--border-main)]">
                                        <span>★</span> {driverInfo.rating}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[var(--text-primary)] text-sm font-black uppercase tracking-wider">{driverInfo.name}</h3>
                                        <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color: 'var(--accent-primary)', background: 'rgba(var(--accent-primary-rgb), 0.1)', border: '1px solid rgba(var(--accent-primary-rgb), 0.2)' }}>Accepted</span>
                                    </div>
                                    <p className="text-black/60 text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-tight mt-0.5">{driverInfo.car} • {driverInfo.color}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[var(--text-secondary)] opacity-60 text-[9px] md:text-[11px] lg:text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-[var(--bg-secondary)] border border-[var(--border-main)]">{driverInfo.plate}</span>
                                        <span className="text-black/20 text-[9px] md:text-[11px] lg:text-xs">•</span>
                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black" style={{ color: 'var(--text-primary)' }}>{driverInfo.eta} away</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payment Selection Modal Overlay */}
            <AnimatePresence>
                {showPaymentOptions && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-auto p-4"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                        onClick={() => {
                            setShowPaymentOptions(false);
                            setPaymentModalMode('select');
                        }}
                    >
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            className="p-8 rounded-[2.5rem] w-full max-w-sm shadow-[0_20px_80px_rgba(0,0,0,0.8)] relative overflow-hidden"
                            style={{ background: 'var(--bg-primary)', border: '2px solid var(--border-main)', backdropFilter: 'blur(40px)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-[var(--text-primary)] text-xl font-black italic uppercase tracking-tighter">
                                    {paymentModalMode === 'select' ? 'Select Payment' :
                                        paymentModalMode === 'card-form' ? 'Add Credit Card' : 'Add Bank Info'}
                                </h3>
                                <button
                                    onClick={() => {
                                        if (paymentModalMode === 'select') {
                                            setShowPaymentOptions(false);
                                        } else {
                                            setPaymentModalMode('select');
                                        }
                                    }}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/5"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-main)' }}
                                >
                                    {paymentModalMode === 'select' ? <X size={20} className="text-[var(--text-primary)]" /> : <ArrowLeft size={20} className="text-[var(--text-primary)]" />}
                                </button>
                            </div>

                            {paymentModalMode === 'select' ? (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                                    {userPaymentMethods.map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => {
                                                setSelectedPayment(method);
                                                setShowPaymentOptions(false);
                                            }}
                                            className={`w-full h-16 rounded-2xl flex items-center px-5 gap-5 transition-all group border ${selectedPayment.id === method.id
                                                ? 'border-[var(--accent-primary)]/40'
                                                : 'border-[var(--border-main)]'
                                                }`}
                                            style={selectedPayment.id === method.id ? { background: 'var(--accent-primary-glow)', boxShadow: '0 0 25px var(--accent-primary-glow)' } : { background: 'var(--bg-secondary)' }}
                                        >
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                                                <method.icon size={20} className={method.color} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <span className={`block text-xs md:text-sm lg:text-base font-black uppercase tracking-wider ${selectedPayment.id === method.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                                                    {method.name}
                                                </span>
                                                <span className="text-[10px] md:text-xs lg:text-sm text-[var(--text-secondary)] opacity-60 font-bold uppercase tracking-tight">{method.label}</span>
                                            </div>
                                            {selectedPayment.id === method.id && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)]" style={{ boxShadow: '0 0 15px var(--accent-primary-glow)' }} />
                                            )}
                                        </button>
                                    ))}

                                    <div className="pt-2 grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setPaymentModalMode('card-form')}
                                            className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 bg-[var(--bg-secondary)] border border-[var(--border-main)] hover:border-[var(--accent-primary)]/20 transition-all text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] shadow-sm"
                                        >
                                            <CreditCard size={16} className="text-[var(--accent-primary)]" />
                                            Add Card
                                        </button>
                                        <button
                                            onClick={() => setPaymentModalMode('bank-form')}
                                            className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 bg-[var(--bg-secondary)] border border-[var(--border-main)] hover:border-blue-400/20 transition-all text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] shadow-sm"
                                        >
                                            <Banknote size={16} className="text-blue-500" />
                                            Add Bank
                                        </button>
                                    </div>
                                </div>
                            ) : paymentModalMode === 'card-form' ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40">
                                            <Smile size={14} />
                                        </div>
                                        <input
                                            placeholder="Cardholder Name"
                                            value={cardForm.name}
                                            onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                                            className="w-full h-12 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl px-10 text-xs md:text-sm lg:text-base font-black text-[var(--text-primary)] focus:border-[var(--accent-primary)]/40 outline-none transition-all placeholder:text-[var(--text-secondary)]/30"
                                        />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40">
                                            <CreditCard size={14} />
                                        </div>
                                        <input
                                            placeholder="Card Number"
                                            value={cardForm.number}
                                            maxLength={16}
                                            onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                                            className="w-full h-12 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl px-10 text-xs md:text-sm lg:text-base font-black text-[var(--text-primary)] focus:border-[var(--accent-primary)]/40 outline-none transition-all placeholder:text-[var(--text-secondary)]/30"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            placeholder="MM/YY"
                                            value={cardForm.expiry}
                                            maxLength={5}
                                            onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                                            className="h-12 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl px-4 text-xs md:text-sm lg:text-base font-black text-[var(--text-primary)] focus:border-[var(--accent-primary)]/40 outline-none transition-all text-center placeholder:text-[var(--text-secondary)]/30"
                                        />
                                        <input
                                            placeholder="CVV"
                                            type="password"
                                            value={cardForm.cvv}
                                            maxLength={3}
                                            onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                                            className="h-12 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl px-4 text-xs md:text-sm lg:text-base font-black text-[var(--text-primary)] focus:border-[var(--accent-primary)]/40 outline-none transition-all text-center placeholder:text-[var(--text-secondary)]/30"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddCard}
                                        disabled={!cardForm.number || !cardForm.name}
                                        className="w-full h-14 bg-[var(--accent-primary)] text-[var(--bg-primary)] font-black uppercase tracking-[0.3em] text-[10px] md:text-xs lg:text-sm rounded-2xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                                        style={{ boxShadow: '0 0 30px var(--accent-primary-glow)' }}
                                    >
                                        Seal Securely
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <input
                                        placeholder="Account Holder"
                                        value={bankForm.name}
                                        onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
                                        className="w-full h-12 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl px-4 text-xs md:text-sm lg:text-base font-black text-[var(--text-primary)] focus:border-blue-400/40 outline-none transition-all placeholder:text-[var(--text-secondary)]/30"
                                    />
                                    <input
                                        placeholder="IBAN"
                                        value={bankForm.iban}
                                        onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                                        className="w-full h-12 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl px-4 text-xs md:text-sm lg:text-base font-black text-[var(--text-primary)] focus:border-blue-400/40 outline-none transition-all font-mono placeholder:text-[var(--text-secondary)]/30"
                                    />
                                    <input
                                        placeholder="BIC / SWIFT"
                                        value={bankForm.bic}
                                        onChange={(e) => setBankForm({ ...bankForm, bic: e.target.value })}
                                        className="w-full h-12 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl px-4 text-xs md:text-sm lg:text-base font-black text-[var(--text-primary)] focus:border-blue-400/40 outline-none transition-all placeholder:text-[var(--text-secondary)]/30"
                                    />
                                    <button
                                        onClick={handleAddBank}
                                        disabled={!bankForm.iban || !bankForm.name}
                                        className="w-full h-14 bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] md:text-xs lg:text-sm rounded-2xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                                        style={{ boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}
                                    >
                                        Verify Bank Link
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feedback Modal - Personalized Messaging */}
            <AnimatePresence>
                {showFeedbackModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-auto p-4"
                        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
                    >
                        <motion.div
                            initial={{ y: 100, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 100, scale: 0.95 }}
                            className="p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl relative overflow-hidden"
                            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(40px)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, var(--brand), transparent)' }} />
                            
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-13 h-13 rounded-3xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-4">
                                    <MessageSquare size={32} className="text-brand" />
                                </div>
                                <h3 className="text-black text-xl font-black italic uppercase tracking-widest">Hey Alex,</h3>
                                <p className="text-black/40 text-[10px] md:text-xs lg:text-sm font-bold uppercase tracking-widest mt-1">What's on your mind?</p>
                            </div>

                            <div className="relative group">
                                <textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="Share anything about the driver, car, or your experience..."
                                    className="w-full h-32 bg-white/5 border border-white/5 rounded-2xl p-4 text-[11px] md:text-sm lg:text-base text-white placeholder:text-white/20 focus:outline-none focus:border-brand/40 focus:bg-white/10 transition-all resize-none font-medium"
                                />
                                <div className="absolute bottom-3 right-3 text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-white/10 group-focus-within:text-brand/40 transition-colors">
                                    Live Channel
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-8">
                                <button
                                    onClick={() => setShowFeedbackModal(false)}
                                    className="h-12 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-white/40 border border-white/5 hover:bg-white/5 transition-all"
                                >
                                    Not Now
                                </button>
                                <button
                                    onClick={() => {
                                        if (feedbackText.trim()) {
                                            triggerNotification('success', 'Feedback Sent', 'Thank you for helping us improve Grien.');
                                            setFeedbackText('');
                                            setShowFeedbackModal(false);
                                        }
                                    }}
                                    className="h-12 rounded-2xl bg-brand text-dark-900 font-black uppercase tracking-widest text-[10px] md:text-xs lg:text-sm hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                                >
                                    Send Feedback
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Early Trip Termination Reason Selection Modal */}
            <AnimatePresence>
                {showEndTripReasons && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-auto p-4"
                        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
                    >
                        <motion.div
                            initial={{ y: 100, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 100, scale: 0.95 }}
                            className="p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl relative overflow-hidden"
                            style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border-main)', backdropFilter: 'blur(40px)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 left-0 w-full h-1" style={{ background: '#EF4444' }} />
                            
                            <h3 className="text-[var(--text-primary)] text-xl font-black italic uppercase tracking-widest mb-2">End Trip Early?</h3>
                            <p className="text-[var(--text-secondary)] opacity-60 text-[10px] md:text-xs lg:text-sm font-bold uppercase tracking-widest mb-8">Please select a reason for the record</p>

                            <div className="space-y-3 mb-6">
                                {[
                                    { id: 'emergency', label: 'Emergency', icon: '🚨' },
                                    { id: 'wrong', label: 'Wrong Destination', icon: '📍' },
                                    { id: 'discomfort', label: 'Safety/Discomfort', icon: '🛡️' },
                                    { id: 'other', label: 'Other / Personal', icon: '👤' }
                                ].map((reason) => (
                                    <button
                                        key={reason.id}
                                        onClick={() => setEndTripReason(reason.id)}
                                        className={`w-full h-14 rounded-2xl flex items-center px-5 gap-4 transition-all group ${endTripReason === reason.id ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-[var(--bg-secondary)] border-[var(--border-main)] text-[var(--text-secondary)] opacity-90 hover:border-red-500/30'}`}
                                        style={{ border: '1px solid', borderColor: endTripReason === reason.id ? '#EF4444' : 'var(--border-main)' }}
                                    >
                                        <span className="text-xl">{reason.icon}</span>
                                        <span className={`flex-1 text-left text-[11px] md:text-sm lg:text-base font-black uppercase tracking-widest ${endTripReason === reason.id ? 'text-red-500' : 'text-[var(--text-secondary)] opacity-80 group-hover:text-[var(--text-primary)]'}`}>{reason.label}</span>
                                        {endTripReason === reason.id && <div className="w-2 h-2 rounded-full bg-red-500" />}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        setRideStatus('completed');
                                        setShowEndTripReasons(false);
                                        triggerNotification('system', 'Trip Terminated', endTripReason ? `Trip ended early: ${endTripReason}` : 'Trip ended early by user request.');
                                    }}
                                    className="w-full h-14 rounded-2xl bg-[#EF4444] text-white font-black uppercase tracking-[0.2em] text-[11px] md:text-sm lg:text-base hover:brightness-110 active:scale-95 transition-all shadow-[0_10px_25px_rgba(239,68,68,0.2)]"
                                >
                                    Confirm End Trip
                                </button>
                                
                                <button
                                    onClick={() => {
                                        setShowEndTripReasons(false);
                                        setEndTripReason(null);
                                    }}
                                    className="w-full h-12 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60 border border-[var(--border-main)] hover:bg-[var(--text-primary)]/5 transition-all"
                                >
                                    Cancel & Continue
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Overflowing Floating Bottom Sheet - Premium Draggable Design */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: isMiniMode ? 420 : 0 }}
                transition={{ 
                    type: 'spring', 
                    damping: 35, 
                    stiffness: 180, 
                    mass: 0.6,
                    velocity: 2
                }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 420 }}
                dragElastic={0.05}
                onDrag={(event, info) => setSheetY(info.offset.y)}
                onDragEnd={(event, info) => {
                    // Optimized Snap logic for velocity-aware transitions
                    if (info.offset.y > 100 || info.velocity.y > 500) {
                        setIsMiniMode(true);
                    } else if (info.offset.y < -50 || info.velocity.y < -500) {
                        setIsMiniMode(false);
                    }
                    setSheetY(0);
                }}
                className="fixed bottom-0 left-0 right-0 z-40 p-4 safe-bottom-padding"
                style={{ touchAction: 'none' }}
            >
                <motion.div 
                    className="rounded-[3rem] p-6 relative shadow-[0_-20px_80px_rgba(0,0,0,0.12)] overflow-hidden" 
                    style={{ 
                        background: isMiniMode ? 'transparent' : 'var(--sheet-bg)',
                        border: isMiniMode ? 'none' : '3.5px solid var(--border-main)', 
                        backdropFilter: isMiniMode ? 'none' : 'blur(40px)', 
                        WebkitBackdropFilter: isMiniMode ? 'none' : 'blur(40px)',
                        minHeight: '520px',
                        scale: 1 - (sheetY / 2500),
                        opacity: 1 - (sheetY / 1800)
                    }}>
                    


                    {/* Dynamic Fluid Orbs Background - MULTI-COLOR MODE */}
                    {!isMiniMode && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <motion.div 
                                animate={{ 
                                    x: [0, 50, -50, 0], 
                                    y: [0, -30, 30, 0],
                                }}
                                transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/10 blur-[90px]" 
                            />
                            <motion.div 
                                animate={{ 
                                    x: [0, -60, 60, 0], 
                                    y: [0, 40, -40, 0],
                                }}
                                transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-1/4 -right-20 w-96 h-96 rounded-full bg-[#3B82F6]/15 blur-[100px]" 
                            />
                            <motion.div 
                                animate={{ 
                                    x: [0, 30, -30, 0], 
                                    y: [40, -40, 40],
                                }}
                                transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-[#A855F7]/10 blur-[80px]" // Violet Pulse
                            />
                            <motion.div 
                                animate={{ 
                                    x: [0, 40, -40, 0], 
                                    y: [50, -20, 50],
                                }}
                                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -bottom-20 left-1/4 w-80 h-80 rounded-full bg-[#FACC15]/10 blur-[100px]" 
                            />
                        </div>
                    )}

                    {/* Bottom Glow Anchor — Minimalist Hint */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/5 blur-md" />

                    {/* Developer Button for Testing Pool Request */}
                    {serviceType === 'shared' && rideStatus === 'in_ride' && (
                        <button
                            onClick={() => socket?.emit('simulate-pool-match', { passengerId: user?.email || 'alex-passenger-id' })}
                            className="absolute bottom-24 left-4 z-[70] bg-[var(--brand)] text-black text-xs md:text-sm lg:text-base font-black px-4 py-2 rounded-xl shadow-lg border border-black"
                        >
                            Dev: Test Match
                        </button>
                    )}

                    {!isMiniMode && (
                        /* Draggable Handle - Gray Contrast */
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-2 rounded-full bg-black/10 shadow-sm" />
                        </div>
                    )}

                    {renderBottomSheetContent()}
                </motion.div>
            </motion.div>

            {/* Holographic Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(52,211,153,1) 0.5px, transparent 0.5px), linear-gradient(90deg, rgba(52,211,153,1) 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }} />

            {/* Double Approval Pool Match Request Modal */}
            <AnimatePresence>
                {showPoolRequest && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        className="fixed inset-x-4 bottom-32 z-[80] bg-[#1A1A1A] rounded-[2rem] border-2 border-[var(--brand)] shadow-[0_20px_60px_-15px_rgba(52,211,153,0.4)] overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-5 mb-5 border-b border-white/10 pb-4">
                                <div className="w-16 h-16 rounded-2xl border-2 border-[var(--brand)] overflow-hidden shrink-0 shadow-inner">
                                    <img src={showPoolRequest.image} alt={showPoolRequest.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="text-[10px] md:text-xs lg:text-sm text-[var(--brand)] font-black uppercase tracking-widest mb-1 animate-pulse">New Request</div>
                                    <h3 className="text-white font-black text-xl italic leading-tight">{showPoolRequest.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-1 opacity-80">
                                        <Star className="w-3.5 h-3.5 text-[var(--brand)] fill-current" />
                                        <span className="text-[var(--brand)] text-sm font-bold">{showPoolRequest.rating} Rating</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-gray-300 text-sm font-medium mb-5 leading-relaxed">
                                This passenger is on your route. Do you approve adding them to your Green Shared ride?
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => {
                                        socket?.emit('pool-match-response', { role: 'passenger', originalPassengerId: user?.email || 'alex-passenger-id', accepted: false });
                                        setShowPoolRequest(null);
                                    }}
                                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3.5 rounded-xl font-bold text-sm transition-colors"
                                >
                                    Decline
                                </button>
                                <button 
                                    onClick={() => {
                                        socket?.emit('pool-match-response', { role: 'passenger', originalPassengerId: user?.email || 'alex-passenger-id', accepted: true });
                                        setShowPoolRequest(null);
                                    }}
                                    className="flex-1 bg-[var(--brand)] hover:brightness-110 text-black py-3.5 rounded-xl font-black text-sm uppercase tracking-wide transition-all shadow-[0_0_20px_rgba(52,211,153,0.2)]"
                                >
                                    Accept Match
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Overlay */}
            <AnimatePresence>
                {showChat && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="fixed inset-0 z-[60] pt-20 px-4 pb-8 flex flex-col pointer-events-auto"
                        style={{ background: 'var(--bg-primary)' }}
                    >
                        {/* Chat Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <img src={driverInfo?.image} alt="Driver" className="w-10 h-10 rounded-xl border border-[var(--border-main)]" />
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[var(--bg-primary)] rounded-full" />
                                </div>
                                <div>
                                    <h3 className="text-[var(--text-primary)] text-xl font-black italic uppercase tracking-tighter">{driverInfo?.name}</h3>
                                    <p className="text-[12px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--brand)' }}>ONLINE</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/80 hover:text-[var(--text-primary)] transition-all">
                                    <Phone size={18} />
                                </button>
                                <button
                                    onClick={() => setShowChat(false)}
                                    className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/80 hover:text-[var(--text-primary)] transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide">
                            {chatMessages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-5 rounded-[1.5rem] ${msg.sender === 'user'
                                            ? 'rounded-tr-none text-white font-black'
                                            : 'rounded-tl-none text-[var(--text-primary)] font-black'
                                            }`}
                                        style={msg.sender === 'user'
                                            ? { background: '#000000', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }
                                            : { background: 'var(--bg-secondary)', border: '2px solid var(--border-main)' }
                                        }
                                    >
                                        <p className="text-sm leading-relaxed tracking-tight">{msg.text}</p>
                                        <p className={`text-[9px] md:text-[11px] lg:text-xs mt-1 opacity-50 ${msg.sender === 'user' ? 'text-white/60' : 'text-[var(--text-secondary)]'}`}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area - Ultra Visible Tactical */}
                        <div className="h-16 rounded-[1.25rem] flex items-center p-2 pl-6 gap-3" 
                            style={{ 
                                background: 'var(--bg-secondary)', 
                                border: '2.5px solid var(--text-primary)',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.05)'
                            }}>
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="TYPE A MESSAGE..."
                                className="flex-1 bg-transparent text-[var(--text-primary)] text-[13px] font-black uppercase tracking-widest focus:outline-none placeholder:opacity-20"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!messageInput.trim()}
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-white hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
                                style={{ background: 'black' }}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {showFriendConfirm && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-center"
                        >
                            <div className="w-20 h-20 mx-auto rounded-full border-4 border-black/5 overflow-hidden shadow-inner">
                                <img src={showFriendConfirm.image} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black italic uppercase text-[var(--text-primary)] tracking-tight">Social Connection</h3>
                                <p className="text-xs md:text-sm lg:text-base text-[var(--text-secondary)] opacity-80 leading-relaxed px-4">
                                    Do you give permission to send a secure friend request to <span className="text-[var(--text-primary)] font-black">{showFriendConfirm.name}</span>?
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setShowFriendConfirm(null)}
                                    className="h-14 rounded-2xl border border-[var(--border-main)] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60 hover:bg-[var(--text-primary)]/5 transition-colors"
                                >
                                    Decline
                                </button>
                                <button 
                                    onClick={() => {
                                        setFriendRequests(prev => ({ ...prev, [showFriendConfirm.id]: 'pending' }));
                                        setShowFriendConfirm(null);
                                        triggerNotification("SOCIAL SIGNAL SENT", "SUCCESS");
                                    }}
                                    className="h-14 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all border border-[var(--border-main)]"
                                >
                                    Authorize
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Driver Profile Dossier Bottom Sheet */}
            <AnimatePresence>
                {showDriverProfile && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
                            onClick={() => setShowDriverProfile(null)}
                        />
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="w-full max-w-md bg-[var(--bg-secondary)] border-t border-[var(--border-main)] p-8 pb-12 pointer-events-auto relative z-10 shadow-[0_-20px_60px_rgba(0,0,0,0.3)]"
                        >
                            <div className="w-12 h-1.5 bg-[var(--border-main)] rounded-full mx-auto mb-8" />
                            
                            <div className="flex flex-col items-center text-center">
                                <div className="relative mb-6">
                                    <div className="w-24 h-24 rounded-[2.5rem] border-4 border-[var(--border-main)] overflow-hidden shadow-2xl">
                                        <img src={showDriverProfile.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=driver'} className="w-full h-full object-cover" alt="driver" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[var(--bg-primary)] border border-[var(--border-main)] rounded-2xl flex items-center justify-center shadow-lg">
                                        <img src={brands.find(b => b.name === showDriverProfile.brand)?.logo} className="w-5 h-5 filter brightness-0 invert" alt="brand" />
                                    </div>
                                </div>
                                
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-[var(--text-primary)]">{showDriverProfile.name}</h2>
                                <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.4em] text-[var(--text-secondary)] opacity-60 mt-1">{showDriverProfile.car} • {showDriverProfile.plate}</p>
                                
                                <div className="flex items-center gap-6 mt-8">
                                    <div className="text-center">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-[var(--text-secondary)] opacity-60 tracking-widest mb-1">Rating</p>
                                        <div className="flex items-center gap-1">
                                            <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                            <span className="text-sm font-black text-[var(--text-primary)]">{showDriverProfile.rating}</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-black/5" />
                                    <div className="text-center">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-black/40 tracking-widest mb-1">Arrival</p>
                                        <span className="text-sm font-black text-black">{showDriverProfile.eta}</span>
                                    </div>
                                    <div className="w-px h-8 bg-black/5" />
                                    <div className="text-center">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-black/40 tracking-widest mb-1">Unit ID</p>
                                        <span className="text-sm font-black text-black">#{showDriverProfile.id}</span>
                                    </div>
                                </div>
                                
                                <div className="w-full grid grid-cols-2 gap-4 mt-10">
                                    <button 
                                        onClick={() => {
                                            setShowDriverProfile(null);
                                            setSelectedDriverId(null);
                                        }}
                                        className="h-16 rounded-[2rem] border-2 border-[var(--border-main)] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60 hover:bg-[var(--text-primary)]/5 transition-all"
                                    >
                                        Go Back
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setShowWhistleConfirm(showDriverProfile);
                                            setShowDriverProfile(null);
                                        }}
                                        className="h-16 rounded-[2rem] bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border border-[var(--border-main)]"
                                    >
                                        <Zap size={14} className="fill-[var(--bg-primary)]" /> Whistle Now
                                    </button>
                                </div>
                                
                                <p className="mt-6 text-[7px] font-black uppercase tracking-[0.2em] text-black/20">Secure Mission Authorization Required</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Whistle Permission Authorization Modal */}
            <AnimatePresence>
                {showWhistleConfirm && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-[3rem] p-8 shadow-2xl space-y-8 text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-black" />
                            
                            <div className="space-y-4">
                                <div className="w-20 h-20 mx-auto rounded-[2rem] border-4 border-[var(--border-main)] overflow-hidden shadow-2xl">
                                    <img src={showWhistleConfirm.image} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter">Mission Authorization</h3>
                                    <p className="text-[10px] md:text-xs lg:text-sm text-[var(--text-secondary)] opacity-60 font-bold uppercase tracking-widest mt-2 px-6 leading-relaxed">
                                        Do you authorize the system to send a priority whistle request to <span className="text-[var(--text-primary)] font-black">{showWhistleConfirm.name}</span>?
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <button 
                                    onClick={() => {
                                        setTargetDriver(showWhistleConfirm);
                                        setShowWhistleConfirm(null);
                                        handleExecute();
                                    }}
                                    className="h-16 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] md:text-sm lg:text-base font-black uppercase tracking-[0.3em] italic shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 border border-[var(--border-main)]"
                                >
                                    <Zap size={18} className="fill-[var(--bg-primary)]" /> Authorize Whistle
                                </button>
                                <button 
                                    onClick={() => setShowWhistleConfirm(null)}
                                    className="h-12 rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60 hover:text-[var(--text-primary)] transition-colors"
                                >
                                    Cancel Mission
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Expansion Prompt Modal */}
            <AnimatePresence>
                {showExpansionPrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-[var(--bg-secondary)] border border-orange-500/30 rounded-[2rem] p-8 shadow-2xl space-y-6 text-center"
                        >
                            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto border border-orange-500/20">
                                <MapPin size={32} className="text-orange-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black italic uppercase text-[var(--text-primary)] mb-2 tracking-wide">No Drivers in 5km</h3>
                                <p className="text-xs md:text-sm lg:text-base text-[var(--text-secondary)] opacity-80 leading-relaxed">
                                    We couldn't find a driver nearby. Would you like to expand the search radius to 10km for a €3.00 surcharge to attract drivers from further away?
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 mt-4">
                                <button
                                    onClick={() => {
                                        setShowExpansionPrompt(false);
                                        if (socket) socket.emit('expand-search-radius', { passengerId: user?.email || `guest-${Date.now()}` });
                                    }}
                                    className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-black uppercase text-xs md:text-sm lg:text-base tracking-widest py-4 rounded-xl hover:opacity-90"
                                >
                                    Expand to 10km (+€3.00)
                                </button>
                                <button
                                    onClick={() => {
                                        setShowExpansionPrompt(false);
                                        if (socket) socket.emit('wait-in-radius', { passengerId: user?.email || `guest-${Date.now()}` });
                                    }}
                                    className="w-full bg-transparent border border-[var(--border-main)] text-[var(--text-primary)] font-bold uppercase text-[10px] md:text-xs lg:text-sm tracking-wider py-4 rounded-xl hover:bg-[var(--text-primary)]/5"
                                >
                                    Keep waiting in 5km
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GreenRidePage;





