import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    DollarSign,
    TrendingUp,
    Star,
    Navigation,
    LogOut,
    Bell,
    PlayCircle,
    Calendar,
    ChevronRight,
    MapPin,
    Zap,
    User,
    ShieldCheck,
    TrendingDown,
    Menu,
    CheckCircle,
    Check,
    X,
    Compass,
    Upload,
    Edit3,
    MessageSquare,
    Clock,
    Shield,
    Filter,
    Download,
    Scale,
    FileSearch,
    Eye,
    EyeOff,
    Briefcase,
    Users,
    FileText,
    AlertCircle,
    Key,
    Lock,
    Mail,
    Smartphone,
    ChevronLeft,
    Car,
    Moon,
    Sun,
    RotateCcw,
    Bus,
    Handshake,
    ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db as fbDb } from '../config/firebase';
import { doc, updateDoc, onSnapshot, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import Radar from '../components/Radar';
import Button from '../components/Button';
import Sheet from '../components/Sheet';
import PostsFeed from '../components/PostsFeed';
import Sidebar from '../components/Sidebar';
import DocumentArea from '../components/DocumentArea';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';

// Fix for Leaflet default icon issue in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Custom Marker Icons for that Premium "Green" feel
// Custom Tactical Pointer for the Driver
const compressBase64 = (base64, callback) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        if (width > height) {
            if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
            }
        } else {
            if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
            }
        }
        canvas.width = width;
        canvas.height = height;
                const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        if (compressed.length > 900000) {
            alert("⚠️ The photo is too large for the database. Please take a screenshot of your document and upload that instead.");
            return;
        }
        callback(compressed);
    };
    img.onerror = () => {
        if (base64.length > 900000) {
            alert("⚠️ The file format is unsupported (e.g. PDF or iPhone HEIC) or too large. Please take a photo/screenshot (JPG/PNG) of your document and upload that instead.");
            return;
        }
        callback(base64);
    };
};

const driverIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="relative w-10 h-10 flex items-center justify-center">
        <div class="absolute inset-0 bg-brand/20 rounded-full" />
        <div class="relative w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 24 24" class="w-full h-full text-brand drop-shadow-[0_0_8px_rgba(0,212,255,0.8)] fill-current">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
            </svg>
        </div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

const pickupIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #FFFFFF; width: 16px; height: 16px; border-radius: 4px; border: 2px solid white; box-shadow: 0 0 10px rgba(255,255,255,0.1);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const dropoffIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #FFFFFF; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(255,255,255,0.1);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

// Component to auto-center map when sequence changes (Optimized to be less aggressive)
const MapRecenter = ({ pos }) => {
    const map = useMap();
    const lastPos = React.useRef(null);
    
    useEffect(() => {
        if (!pos) return;
        const lat = pos.lat !== undefined ? pos.lat : Array.isArray(pos) ? pos[0] : pos.latitude;
        const lng = pos.lng !== undefined ? pos.lng : Array.isArray(pos) ? pos[1] : pos.longitude;
        if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) return;

        if (!lastPos.current || Math.abs(lat - (lastPos.current.lat || 0)) > 0.001 || Math.abs(lng - (lastPos.current.lng || 0)) > 0.001) {
            map.panTo([lat, lng], { animate: true, duration: 1.5 });
            lastPos.current = { lat, lng };
        }
    }, [pos, map]);
    return null;
};

// Distance calculation helper in meters using Haversine formula
const calculateDistanceInMeters = (coord1, coord2) => {
    if (!coord1 || !coord2) return 999999;
    const lat1 = coord1.lat !== undefined ? coord1.lat : coord1.latitude;
    const lng1 = coord1.lng !== undefined ? coord1.lng : coord1.longitude;
    const lat2 = coord2.lat !== undefined ? coord2.lat : coord2.latitude;
    const lng2 = coord2.lng !== undefined ? coord2.lng : coord2.longitude;
    if (lat1 === undefined || lng1 === undefined || lat2 === undefined || lng2 === undefined) return 999999;

    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
};

const DriverDashboard = () => {
    const { user, logout } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const { lang, setLang, t } = useLanguage();

    // NOTCH & SAFE AREA INTEGRATION
    const [useSafeArea, setUseSafeArea] = useState(() => {
        return localStorage.getItem('green_manager_use_safe_area') !== 'false';
    });
    const [notchAdjustment, setNotchAdjustment] = useState(() => {
        const saved = localStorage.getItem('green_manager_notch_adjustment');
        if (saved) {
            const parsed = parseInt(saved, 10);
            if (!isNaN(parsed)) return parsed;
        }
        return window.innerWidth < 768 ? 16 : 0;
    });
    const [isNotchPanelOpen, setIsNotchPanelOpen] = useState(false);

    React.useEffect(() => {
        localStorage.setItem('green_manager_use_safe_area', useSafeArea ? 'true' : 'false');
    }, [useSafeArea]);

    React.useEffect(() => {
        localStorage.setItem('green_manager_notch_adjustment', notchAdjustment.toString());
    }, [notchAdjustment]);

    const [activeTab, setActiveTab] = useState('day');
    const [showPosts, setShowPosts] = useState(false);
    const [incomingRide, setIncomingRide] = useState(null);
    const [isOnline, setIsOnline] = useState(false); // Default offline, will be set online for demo in useEffect
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [hasUpdates, setHasUpdates] = useState(true);
    const [view, setView] = useState('dashboard'); // 'dashboard' or 'verification'
    const [sharedTripsEnabled, setSharedTripsEnabled] = useState(true);
    
    // Driver Identity Profile States
    const [profileSheetOpen, setProfileSheetOpen] = useState(false);
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        address: '',
        email: user?.email || '',
        zipCode: '',
        city: '',
        phoneNumber: '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Parsa'}`
    });
    // Driver Ausweis, Terms & Approval States
    const [idCardFront, setIdCardFront] = useState(() => localStorage.getItem('driver_id_card_front') || null);
    const [idCardBack, setIdCardBack] = useState(() => localStorage.getItem('driver_id_card_back') || null);
    const [idCardApproved, setIdCardApproved] = useState(() => localStorage.getItem('driver_id_card_approved') === 'true');
    const [avatarApproved, setAvatarApproved] = useState(() => localStorage.getItem('driver_avatar_approved') === 'true');
    const [termsAccepted, setTermsAccepted] = useState(() => localStorage.getItem('driver_terms_accepted') === 'true');
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

    const handleIdCardUpload = (e, side) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const img = new Image();
            img.src = reader.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                const max = 1000;
                if (w > h) { if (w > max) { h = Math.round(h * max / w); w = max; } }
                else { if (h > max) { w = Math.round(w * max / h); h = max; } }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                const compressed = canvas.toDataURL('image/jpeg', 0.8);
                if (side === 'front') {
                    setIdCardFront(compressed);
                    localStorage.setItem('driver_id_card_front', compressed);
                } else {
                    setIdCardBack(compressed);
                    localStorage.setItem('driver_id_card_back', compressed);
                }
                syncDriverProfileToCloud({
                    [side === 'front' ? 'idCardFront' : 'idCardBack']: compressed
                });
            };
        };
        reader.readAsDataURL(file);
        e.target.value = null;
    };

    const syncDriverProfileToCloud = async (extraFields = {}) => {
        const email = (user?.email || profileData?.email || 'omarde65aa@gmail.com').toLowerCase();
        if (!email) return;
        try {
            const uRef = doc(fbDb, 'users', email);
            const dataToSave = {
                email: email,
                name: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || user?.name || 'Khiam Azizi',
                firstName: profileData.firstName || '',
                lastName: profileData.lastName || '',
                phone: profileData.phoneNumber || '',
                address: profileData.address || '',
                city: profileData.city || '',
                zip: profileData.zipCode || '',
                role: 'driver',
                avatar: tempPhotoPreview || profileData.avatar || '',
                idCardFront: idCardFront || null,
                idCardBack: idCardBack || null,
                idCardApproved: idCardApproved,
                avatarApproved: avatarApproved,
                termsAccepted: termsAccepted,
                updatedAt: new Date().toISOString(),
                ...extraFields
            };
            dataToSave.driverComplianceDocs = [
                { id: 'avatar', name: 'Driver Profile Photo', status: avatarApproved ? 'verified' : (dataToSave.avatar ? 'pending' : 'missing'), fileUrl: dataToSave.avatar },
                { id: 'idcard', name: 'Personalausweis (Vorder- & Rückseite)', status: idCardApproved ? 'verified' : ((dataToSave.idCardFront || dataToSave.idCardBack) ? 'pending' : 'missing'), fileUrl: dataToSave.idCardFront || dataToSave.idCardBack, frontUrl: dataToSave.idCardFront, backUrl: dataToSave.idCardBack },
                { id: 'terms', name: 'Nutzungsbedingungen & AGB', status: dataToSave.termsAccepted ? 'verified' : 'missing' }
            ];
            await setDoc(uRef, dataToSave, { merge: true });

            try {
                const bc = new BroadcastChannel('green_fleet_sync');
                bc.postMessage({ type: 'DRIVER_UPDATE', driver: dataToSave });
                bc.close();
            } catch(e) {}
        } catch(e) {
            console.error('Cloud sync error:', e);
        }
    };

    // Cross-port sync listener
    useEffect(() => {
        let bc;
        try {
            bc = new BroadcastChannel('green_fleet_sync');
            bc.onmessage = (ev) => {
                if (ev.data && ev.data.type === 'DOC_APPROVED') {
                    const { email, docId } = ev.data;
                    const myEmail = (user?.email || profileData.email || '').toLowerCase();
                    if (email && myEmail === email.toLowerCase()) {
                        if (docId === 'avatar') {
                            setAvatarApproved(true);
                            localStorage.setItem('driver_avatar_approved', 'true');
                        }
                        if (docId === 'idcard') {
                            setIdCardApproved(true);
                            localStorage.setItem('driver_id_card_approved', 'true');
                        }
                        if (docId === 'terms') {
                            setTermsAccepted(true);
                            localStorage.setItem('driver_terms_accepted', 'true');
                        }
                    }
                }
            };
        } catch(e) {}
        return () => { if (bc) bc.close(); };
    }, [user?.email, profileData?.email]);

    
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([{ sender: 'ai', text: 'Hello! I am the Support assistant. How can I help you today?' }]);
    const [chatInput, setChatInput] = useState('');

    const [documentsSheetOpen, setDocumentsSheetOpen] = useState(false);
    const [showDocLockModal, setShowDocLockModal] = useState(false);
    
    // Defensive useState initializers to prevent crashes on invalid localStorage states
    const [driverDocs, setDriverDocs] = useState(() => {
        try {
            const saved = localStorage.getItem('driver_compliance_docs');
            if (saved && saved !== 'undefined') {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {
            console.error("Error parsing driver compliance docs:", e);
        }
        return [
            { id: 'avatar', name: 'Profile Photo', status: 'missing', requirement: 'High-resolution headshot for driver profile ID', file: null },
            { id: 'license', name: 'Driving License', status: 'missing', requirement: 'Class B EU License (Front & Back)', file: null },
            { id: 'idcard', name: 'Passport / ID Card', status: 'missing', requirement: 'Government-issued biometric passport or national identity card', file: null },
            { id: 'pschein', name: 'P-Schein (Passenger Permit)', status: 'missing', requirement: 'Passenger Transport License (Personenbeförderungsschein)', file: null },
            { id: 'terms', name: 'Terms & Conditions', status: 'missing', requirement: 'Accept Platform Partnership & Data Usage Agreement', file: null }
        ];
    });

    const [vehicleDocs, setVehicleDocs] = useState(() => {
        try {
            const saved = localStorage.getItem('driver_vehicle_docs');
            if (saved && saved !== 'undefined') {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {
            console.error("Error parsing driver vehicle docs:", e);
        }
        return [
            { id: 'tuv', name: 'HU/AU (TÜV)', status: 'missing', requirement: 'Valid main inspection certificate' },
            { id: 'insurance', name: 'Commercial Insurance', status: 'missing', requirement: 'PBefG-compliant passenger insurance coverage' }
        ];
    });
    const [mapPreference, setMapPreference] = useState('google'); // 'google' or 'apple'
    const { theme, setTheme } = useTheme();
    const [userEmail, setUserEmail] = useState(user?.email || 'driver@green.com');
    const [userPassword, setUserPassword] = useState('********');
    const [showPassword, setShowPassword] = useState(false);
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);
    const [termsDenied, setTermsDenied] = useState(false);
    // profilePicStatus is derived from driverDocs so it stays in sync with Firestore and Admin Document Hub
    const profilePicStatus = (() => {
        if (avatarApproved) return 'verified';
        const avatarDoc = driverDocs.find(d => d.id === 'avatar');
        if (!avatarDoc) return (tempPhotoPreview || profileData.avatar) ? 'pending' : 'missing';
        return avatarDoc.status === 'verified' ? 'verified' : (avatarDoc.status === 'pending' || tempPhotoPreview || profileData.avatar) ? 'pending' : 'missing';
    })();
    const [hasInitialPic, setHasInitialPic] = useState(false);
    const [tempPhotoPreview, setTempPhotoPreview] = useState(null);

    // NEW: Capacity and Active Rides
    const [vehicleCapacity, setVehicleCapacity] = useState(() => {
        try {
            const saved = localStorage.getItem('driver_vehicle_data');
            if (saved && saved !== 'undefined' && saved !== 'null') {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.sharingType) {
                    return parsed.sharingType;
                }
            }
        } catch (e) {}
        return 4; // Default to 4
    });
    const [currentOccupancy, setCurrentOccupancy] = useState(0);
    const [activeRidesCount, setActiveRidesCount] = useState(0);
    const [activeRide, setActiveRide] = useState(null);
    const [rideStatus, setRideStatus] = useState('none'); // 'none', 'accepted', 'arrived', 'picked_up'
    
    // --- MULTI-MISSION SHARED FLOW CORE ---
    const [activeMissions, setActiveMissions] = useState([]); 
    const [currentSequence, setCurrentSequence] = useState([]); 
    const [currentPos, setCurrentPos] = useState({ lat: 50.1109, lng: 8.6821 }); 
    const [routeGeometry, setRouteGeometry] = useState([]);
    
    const [missionSheetOpen, setMissionSheetOpen] = useState(false);
    const [missionStep, setMissionStep] = useState('confirm'); // 'confirm' | 'summary'
    const [earlyDropOffs, setEarlyDropOffs] = useState([]); // List of trip IDs that ended early
    const [showOfflineReport, setShowOfflineReport] = useState(false);
    const [reportData, setReportData] = useState({}); // { tripId: { reason, details } }
    // Vehicle Registration States
    const [vehicleSheetOpen, setVehicleSheetOpen] = useState(false);
    const [vehicleInfo, setVehicleInfo] = useState(() => {
        try {
            const saved = localStorage.getItem('driver_vehicle_data');
            if (saved && saved !== 'undefined' && saved !== 'null') {
                const parsed = JSON.parse(saved);
                if (parsed) return parsed;
            }
        } catch (e) {
            console.error("Error parsing vehicle info:", e);
        }
        return { plate: '', model: '', year: '', color: '', photo: null, status: 'unregistered' };
    });
    const [driverManagerId, setDriverManagerId] = useState(null);
    const [timeRange, setTimeRange] = useState('week');
    const [selectedMonth, setSelectedMonth] = useState('April 2026');
    const [selectedWeek, setSelectedWeek] = useState('Week 17');
    const [lastCompletedRide, setLastCompletedRide] = useState(null);
    const [riderRating, setRiderRating] = useState(5);
    const [selectedEmojis, setSelectedEmojis] = useState([]);
    const [earningsFilterDate, setEarningsFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [isExporting, setIsExporting] = useState(false);
    const [showSecurityReset, setShowSecurityReset] = useState(false);
    const [resetConfirmed, setResetConfirmed] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [confirmEmail, setConfirmEmail] = useState('');
    const [confirmPhone, setConfirmPhone] = useState('');
    const [sharingMode, setSharingMode] = useState('urban'); // 'urban' | 'autobahn'
    const [isReordering, setIsReordering] = useState(false);
    const [arrivalNotify, setArrivalNotify] = useState(null); // { name: string, id: string }
    const [paymentNotify, setPaymentNotify] = useState(null); // { name: string, amount: number }
    const notifiedMissions = React.useRef(new Set());
    const [dismissingMission, setDismissingMission] = useState(null); // { id: string, customer: string }
    const [acceptsShared, setAcceptsShared] = useState(true);
    const [queuedMission, setQueuedMission] = useState(null);
    const [showPoolRequest, setShowPoolRequest] = useState(null);

    React.useEffect(() => {
        if (currentSequence.length === 0) {
            setRouteGeometry([]);
            return;
        }

        const fetchRoute = async () => {
            try {
                const waypoints = [
                    `${currentPos.lng},${currentPos.lat}`,
                    ...currentSequence.filter(s => s && s.coord && s.coord.lat !== undefined && s.coord.lng !== undefined).map(s => `${s.coord.lng},${s.coord.lat}`)
                ].join(';');

                const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${waypoints}?geometries=geojson`);
                const data = await response.json();

                if (data.routes && data.routes.length > 0) {
                    const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]); // [lat, lng]
                    setRouteGeometry(coords);
                }
            } catch (err) {
                console.error("OSRM Routing Error:", err);
            }
        };

        fetchRoute();
    }, [currentSequence, currentPos.lat, currentPos.lng]);

    React.useEffect(() => {
        if (!incomingRide) return;
        const timer = setTimeout(() => {
            setIncomingRide(null);
            console.log("Incoming ride request auto-expired after 60 seconds.");
        }, 60000); // 1 minute
        return () => clearTimeout(timer);
    }, [incomingRide]);

    const isDemo = user?.email?.toLowerCase() === 'driver@green.de';
    const hasUnverifiedDocs = false; // Unlocked for instant online access & test rides

    React.useEffect(() => {
        const syncVehicleData = () => {
            const saved = localStorage.getItem('driver_vehicle_data');
            if (saved && saved !== 'undefined' && saved !== 'null') {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed) {
                        setVehicleInfo(prev => {
                            if (!prev || prev.status !== parsed.status || prev.plate !== parsed.plate || prev.model !== parsed.model || prev.photo !== parsed.photo || prev.sharingType !== parsed.sharingType) {
                                return parsed;
                            }
                            return prev;
                        });
                        if (parsed.sharingType) {
                            setVehicleCapacity(parsed.sharingType);
                        }
                    }
                } catch (e) {
                    console.error("Error parsing syncVehicleData:", e);
                }
            }
        };
        window.addEventListener('storage', syncVehicleData);
        const interval = setInterval(syncVehicleData, 1000);
        return () => {
            window.removeEventListener('storage', syncVehicleData);
            clearInterval(interval);
        };
    }, []);

    React.useEffect(() => {
        const syncDocsData = () => {
            const saved = localStorage.getItem('driver_compliance_docs');
            if (saved && saved !== 'undefined' && saved !== 'null') {
                try {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setDriverDocs(prev => {
                            if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
                                return parsed;
                            }
                            return prev;
                        });
                    }
                } catch (e) {
                    console.error("Error parsing compliance docs in sync:", e);
                }
            }
            const savedVehicleDocs = localStorage.getItem('driver_vehicle_docs');
            if (savedVehicleDocs && savedVehicleDocs !== 'undefined' && savedVehicleDocs !== 'null') {
                try {
                    const parsedVehicle = JSON.parse(savedVehicleDocs);
                    if (Array.isArray(parsedVehicle) && parsedVehicle.length > 0) {
                        setVehicleDocs(prev => {
                            if (JSON.stringify(prev) !== JSON.stringify(parsedVehicle)) {
                                return parsedVehicle;
                            }
                            return prev;
                        });
                    }
                } catch (e) {
                    console.error("Error parsing vehicle docs in sync:", e);
                }
            }
        };
        window.addEventListener('storage', syncDocsData);
        const interval = setInterval(syncDocsData, 1000);
        return () => {
            window.removeEventListener('storage', syncDocsData);
            clearInterval(interval);
        };
    }, []);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = chatInput.trim();
        setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setChatInput('');

        // Simulate AI answering
        setTimeout(() => {
            const lowerMsg = userMsg.toLowerCase();
            const aiResponse = (lowerMsg.includes('termine') || lowerMsg.includes('appointment'))
                ? "I see you are requesting a Termine. I cannot schedule this automatically. Please wait for the real Super Admin to review your request. Current wait time is approximately 12 hours."
                : "I understand. However, for this specific problem, you will need to wait for the real Super Admin to answer. Current wait time is approximately 12 hours.";
            
            setChatMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
        }, 1000);
    };

    // fileUrlOrBase64 is now always a Storage download URL (https://...) from DocumentArea
    // Legacy base64 uploads are also accepted for backwards-compat
    const handleUploadDocument = (id, fileUrlOrBase64) => {
        if (driverDocs.some(d => d.id === id)) {
            setDriverDocs(prev => {
                const updated = prev.map(d =>
                    d.id === id
                        ? { ...d, status: 'pending', fileUrl: fileUrlOrBase64 || null, file: null }
                        : d
                );
                // Store without the actual file data — just the URL and status
                const cleanedForStorage = updated.map(d => ({ id: d.id, name: d.name, status: d.status, requirement: d.requirement, fileUrl: d.fileUrl || null }));
                localStorage.setItem('driver_compliance_docs', JSON.stringify(cleanedForStorage));
                if (user?.email) {
                    updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                        driverComplianceDocs: cleanedForStorage
                    }).catch(err => console.error('Error updating driverComplianceDocs:', err));
                }
                return updated;
            });
        } else if (vehicleDocs.some(v => v.id === id)) {
            setVehicleDocs(prev => {
                const updated = prev.map(d =>
                    d.id === id
                        ? { ...d, status: 'pending', fileUrl: fileUrlOrBase64 || null, file: null }
                        : d
                );
                const cleanedForStorage = updated.map(d => ({ id: d.id, name: d.name, status: d.status, requirement: d.requirement, fileUrl: d.fileUrl || null }));
                localStorage.setItem('driver_vehicle_docs', JSON.stringify(cleanedForStorage));
                if (user?.email) {
                    updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                        driverVehicleDocs: cleanedForStorage
                    }).catch(err => console.error('Error updating driverVehicleDocs:', err));
                }
                return updated;
            });
        }
        alert('✅ Document uploaded to cloud successfully!');
    };

    const handleAcceptTerms = (id) => {
        setDriverDocs(prev => {
            const updated = prev.map(doc => doc.id === id ? { ...doc, status: 'verified' } : doc);
            localStorage.setItem('driver_compliance_docs', JSON.stringify(updated));
            if (user?.email) {
                updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                    driverComplianceDocs: updated
                }).catch(err => console.error("Error accepting terms in Firestore:", err));
            }
            return updated;
        });
        setTermsDenied(false);
        alert("Terms & Conditions Accepted!");
    };

    const handleDenyTerms = () => {
        setTermsDenied(true);
    };

    const [tripHistory, setTripHistory] = useState([]);
    const [inboxMessages, setInboxMessages] = useState([]);
    const [showReceipt, setShowReceipt] = useState(null);
    const [stats, setStats] = useState({
        day: { earnings: 0.00, trips: 0, hours: 0.0, rating: 5.0 },
        week: { earnings: 0.00, trips: 0, hours: 0.0, rating: 5.0 },
        month: { earnings: 0.00, trips: 0, hours: 0.0, rating: 5.0 },
        year: { earnings: 0.00, trips: 0, hours: 0.0, rating: 5.0 }
    });

    useEffect(() => {
        if (!user) return;
        const isDemo = user?.email?.toLowerCase() === 'driver@green.de';
        if (isDemo) {
            setIsOnline(true);
            setProfileData({
                firstName: 'Mick',
                lastName: 'Driver',
                address: 'Mainzer Landstraße 123',
                email: 'driver@green.de',
                zipCode: '60327',
                city: 'Frankfurt am Main',
                phoneNumber: '+49 176 12345678',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Mick`
            });
            setTripHistory([]);
            setInboxMessages([]);
            setStats({
                day: { earnings: 0.00, trips: 0, hours: 0, rating: 0 },
                week: { earnings: 0.00, trips: 0, hours: 0, rating: 0 },
                month: { earnings: 0.00, trips: 0, hours: 0, rating: 0 },
                year: { earnings: 0.00, trips: 0, hours: 0, rating: 0 }
            });
            
            const demoDocs = [];
            setDriverDocs(demoDocs);
            localStorage.setItem('driver_compliance_docs', JSON.stringify(demoDocs));

            const demoVehicleDocs = [];
            setVehicleDocs(demoVehicleDocs);
            localStorage.setItem('driver_vehicle_docs', JSON.stringify(demoVehicleDocs));
            
            // For demo user, check if we have a saved vehicleInfo in localStorage (e.g. from Firestore). If not, use the demo default.
            const savedVehicle = localStorage.getItem('driver_vehicle_data');
            let initialVehicleInfo = null;
            if (savedVehicle && savedVehicle !== 'undefined' && savedVehicle !== 'null') {
                try {
                    const parsed = JSON.parse(savedVehicle);
                    if (parsed && parsed.status) {
                        initialVehicleInfo = parsed;
                    }
                } catch (e) {
                    console.error("Error parsing saved vehicle info:", e);
                }
            }
            if (!initialVehicleInfo) {
                initialVehicleInfo = { plate: 'F-GR 2026E', model: 'Tesla Model Y', year: '2024', color: 'Midnight Green', photo: null, status: 'verified' };
                localStorage.setItem('driver_vehicle_data', JSON.stringify(initialVehicleInfo));
            }
            setVehicleInfo(initialVehicleInfo);
        } else {
            setIsOnline(false);
            setProfileData({
                firstName: user?.name?.split(' ')[0] || '',
                lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                address: user?.address || '',
                email: user?.email || '',
                zipCode: user?.zip || '',
                city: user?.city || '',
                phoneNumber: user?.phone || '',
                avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'NewDriver'}`
            });
            setTripHistory([]);
            setInboxMessages([]);
            setStats({
                day: { earnings: 0.00, trips: 0, hours: 0.0, rating: 5.0 },
                week: { earnings: 0.00, trips: 0, hours: 0.0, rating: 5.0 },
                month: { earnings: 0.00, trips: 0, hours: 0.0, rating: 5.0 },
                year: { earnings: 0.00, trips: 0, hours: 0.0, rating: 5.0 }
            });
            setDriverDocs(prev => {
                const saved = localStorage.getItem('driver_compliance_docs');
                if (saved && saved !== 'undefined') {
                    try {
                        const parsed = JSON.parse(saved);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            return parsed;
                        }
                    } catch (e) {
                        console.error("Error parsing saved driver docs:", e);
                    }
                }
                const arr = Array.isArray(prev) ? prev : [];
                const reset = arr.map(d => ({ ...d, status: 'verified' }));
                localStorage.setItem('driver_compliance_docs', JSON.stringify(reset));
                return reset;
            });
            setVehicleDocs(prev => {
                const saved = localStorage.getItem('driver_vehicle_docs');
                if (saved && saved !== 'undefined') {
                    try {
                        const parsed = JSON.parse(saved);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            return parsed;
                        }
                    } catch (e) {
                        console.error("Error parsing saved vehicle docs:", e);
                    }
                }
                const arr = Array.isArray(prev) ? prev : [];
                const reset = arr.map(d => ({ ...d, status: 'verified' }));
                localStorage.setItem('driver_vehicle_docs', JSON.stringify(reset));
                return reset;
            });
            setVehicleInfo(prev => {
                const saved = localStorage.getItem('driver_vehicle_data');
                if (saved && saved !== 'undefined') {
                    try {
                        const parsed = JSON.parse(saved);
                        if (parsed && parsed.status) {
                            return { ...parsed, status: 'approved' };
                        }
                    } catch (e) {
                        console.error("Error parsing saved vehicle info:", e);
                    }
                }
                const reset = { plate: 'F-GR 2026E', model: 'Tesla Model Y', year: '2024', color: 'Midnight Green', photo: null, status: 'approved' };
                localStorage.setItem('driver_vehicle_data', JSON.stringify(reset));
                return reset;
            });
        }
    }, [user?.email]);

    useEffect(() => {
        if (!user?.email) return;
        
        const unsubscribe = onSnapshot(doc(fbDb, 'users', user.email.toLowerCase()), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.vehicleInfo) {
                    setVehicleInfo(data.vehicleInfo);
                    localStorage.setItem('driver_vehicle_data', JSON.stringify(data.vehicleInfo));
                    if (data.vehicleInfo.sharingType) {
                        setVehicleCapacity(data.vehicleInfo.sharingType);
                    }
                } else {
                    const isDemo = user?.email?.toLowerCase() === 'driver@green.de';
                    if (!isDemo) {
                        setVehicleInfo({ plate: '', model: '', year: '', color: '', photo: null, status: 'unregistered' });
                        localStorage.removeItem('driver_vehicle_data');
                    } else {
                        const demoVehicleInfo = { plate: 'F-GR 2026E', model: 'Tesla Model Y', year: '2024', color: 'Midnight Green', photo: null, status: 'verified' };
                        setVehicleInfo(demoVehicleInfo);
                        localStorage.setItem('driver_vehicle_data', JSON.stringify(demoVehicleInfo));
                    }
                }
                
                if (data.avatarApproved !== undefined) {
                    setAvatarApproved(data.avatarApproved);
                    localStorage.setItem('driver_avatar_approved', data.avatarApproved ? 'true' : 'false');
                }
                if (data.idCardApproved !== undefined) {
                    setIdCardApproved(data.idCardApproved);
                    localStorage.setItem('driver_id_card_approved', data.idCardApproved ? 'true' : 'false');
                }
                if (data.idCardFront) {
                    setIdCardFront(data.idCardFront);
                    localStorage.setItem('driver_id_card_front', data.idCardFront);
                }
                if (data.idCardBack) {
                    setIdCardBack(data.idCardBack);
                    localStorage.setItem('driver_id_card_back', data.idCardBack);
                }
                if (data.termsAccepted !== undefined) {
                    setTermsAccepted(data.termsAccepted);
                    localStorage.setItem('driver_terms_accepted', data.termsAccepted ? 'true' : 'false');
                }
                if (data.driverComplianceDocs) {
                    setDriverDocs(data.driverComplianceDocs);
                    localStorage.setItem('driver_compliance_docs', JSON.stringify(data.driverComplianceDocs));
                }
                if (data.driverVehicleDocs) {
                    setVehicleDocs(data.driverVehicleDocs);
                    localStorage.setItem('driver_vehicle_docs', JSON.stringify(data.driverVehicleDocs));
                }
            }
        });
        
        return () => unsubscribe();
    }, [user?.email]);

    useEffect(() => {
        if (!user?.email || view !== 'verification') return;
        
        const loadDocFiles = async () => {
            let complianceUpdated = false;
            const updatedCompliance = await Promise.all(driverDocs.map(async (docItem) => {
                if (docItem.status !== 'missing' && !docItem.file && docItem.id !== 'terms') {
                    try {
                        const fileDoc = await getDoc(doc(fbDb, 'users', user.email.toLowerCase(), 'documents', docItem.id));
                        if (fileDoc.exists() && fileDoc.data().file) {
                            complianceUpdated = true;
                            return { ...docItem, file: fileDoc.data().file };
                        }
                    } catch (e) {
                        console.error(`Error loading compliance file ${docItem.id}:`, e);
                    }
                }
                return docItem;
            }));

            let vehicleUpdated = false;
            const updatedVehicle = await Promise.all(vehicleDocs.map(async (docItem) => {
                if (docItem.status !== 'missing' && !docItem.file) {
                    try {
                        const fileDoc = await getDoc(doc(fbDb, 'users', user.email.toLowerCase(), 'documents', docItem.id));
                        if (fileDoc.exists() && fileDoc.data().file) {
                            vehicleUpdated = true;
                            return { ...docItem, file: fileDoc.data().file };
                        }
                    } catch (e) {
                        console.error(`Error loading vehicle file ${docItem.id}:`, e);
                    }
                }
                return docItem;
            }));

            if (complianceUpdated) {
                setDriverDocs(updatedCompliance);
            }
            if (vehicleUpdated) {
                setVehicleDocs(updatedVehicle);
            }
        };

        loadDocFiles();
    }, [user?.email, view]);



    const currentStats = stats[activeTab];

    useEffect(() => {
        if (!socket || !isOnline) return;

        // Block receipt of ride requests if documents are not fully verified (real drivers only)
        if (hasUnverifiedDocs) {
            console.log("Documents compliance pending or missing: Blocked from receiving real-time trip requests.");
            return;
        }

        const handleNewRequest = (request) => {
            console.log('Incoming Real-Time Request:', request);
            // Don't show if we already have an active mission AND a queued mission
            setIncomingRide(prev => {
                if (activeMissions.length > 0 && queuedMission) return prev;
                return {
                    ...request,
                    customer: request.passengerName,
                    price: request.price || 24.50,
                    basePrice: request.price || 24.50,
                    distance: '4.2 km',
                    coords: { lat: 50.115, lng: 8.685 },
                    isRealTime: true,
                    rideType: request.rideType || 'green',
                    capacity: request.capacity || 3,
                    paymentType: request.paymentType || 'Digital'
                };
            });
        };

        const handleRequestsList = (list) => {
            console.log('Active Missions List Received:', list);
            if (list.length > 0 && !incomingRide) {
                handleNewRequest(list[0]); // Show the most recent available mission
            }
        };

        const handlePoolMatchPending = (data) => {
            setShowPoolRequest(data.newPassenger);
        };

        const handlePoolMatchResult = (data) => {
            if (data.accepted && data.role === 'passenger') {
                setShowPoolRequest(null);
                alert('Passenger accepted route deviation.');
            } else if (!data.accepted && data.role === 'passenger') {
                setShowPoolRequest(null);
                alert('Passenger declined route deviation.');
            } else if (data.role === 'driver') {
                setShowPoolRequest(null);
            }
        };

        socket.on('new-ride-request', handleNewRequest); // Legacy global broadcast
        socket.on('targeted-ride-request', handleNewRequest); // Smart dispatch engine
        socket.on('active-requests-list', handleRequestsList);
        socket.on('pool-match-pending', handlePoolMatchPending);
        socket.on('pool-match-result', handlePoolMatchResult);

        // Emit initial shared preference on connect
        socket.emit('update-shared-preference', { acceptsShared });
        
        // Fetch any missions already in the air
        socket.emit('get-active-requests');

        let geoWatchId;
        if (isOnline) {
            let lastEmitTime = 0;
            geoWatchId = navigator.geolocation.watchPosition(
                (position) => {
                    const now = Date.now();
                    // Throttle: only send to server every 10 seconds
                    if (now - lastEmitTime >= 10000) {
                        const { latitude, longitude } = position.coords;
                        socket.emit('driver-location-update', { lat: latitude, lng: longitude });
                        lastEmitTime = now;
                    }
                },
                (error) => console.error('Error watching location:', error),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }

        return () => {
            socket.off('new-ride-request', handleNewRequest);
            socket.off('targeted-ride-request', handleNewRequest);
            socket.off('active-requests-list', handleRequestsList);
            socket.off('pool-match-pending', handlePoolMatchPending);
            socket.off('pool-match-result', handlePoolMatchResult);
            if (geoWatchId) navigator.geolocation.clearWatch(geoWatchId);
        };
    }, [socket, isOnline, incomingRide, driverDocs, vehicleDocs, vehicleInfo, user]);



    // Tactical Manual Re-Sequencing Logic
    const moveMission = (index, direction) => {
        const newMissions = [...activeMissions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (targetIndex >= 0 && targetIndex < newMissions.length) {
            const temp = newMissions[index];
            newMissions[index] = newMissions[targetIndex];
            newMissions[targetIndex] = temp;
            
            setIsReordering(true);
            setTimeout(() => {
                setActiveMissions(newMissions);
                setIsReordering(false);
                alert("TACTICAL OVERRIDE: Passenger sequence updated. All riders have been notified.");
            }, 800);
        }
    };

    const getMultiplier = (type, count) => {
        if (type === 'premium' || count <= 1) return 1.0;
        if (type === 'green') {
            if (count === 2) return 1.5;
            if (count === 3) return 1.8;
        }
        if (type === 'max') {
            const steps = [1.0, 1.3, 1.6, 1.8, 2.0, 2.2, 2.4, 2.5];
            return steps[count - 1] || 2.5;
        }
        return 1.0;
    };

    const getPassengerRate = (type, count) => {
        if (type === 'premium') return 1.0;
        if (type === 'green') {
            if (count === 1) return 1.0;
            if (count === 2) return 0.7;
            if (count === 3) return 0.55;
        }
        if (type === 'max') {
            const rates = [1.0, 0.8, 0.65, 0.55, 0.45, 0.4, 0.35, 0.3];
            return rates[count - 1] || 0.3;
        }
        return 1.0;
    };

    // --- SEQUENCING ENGINE: NEAREST DROP-OFF OPTIMIZATION ---
    // --- TACTICAL AUTOPILOT SIMULATION ---
    useEffect(() => {
        if (!isOnline || rideStatus === 'none' || currentSequence.length === 0) return;
        
        const interval = setInterval(() => {
            const target = currentSequence[0]?.coord;
            if (!target || target.lat === undefined || target.lng === undefined) return;
            setCurrentPos(prev => {
                const dLat = target.lat - prev.lat;
                const dLng = target.lng - prev.lng;
                const distance = Math.sqrt(dLat * dLat + dLng * dLng);
                
                if (distance < 0.0001) return prev; // Closer than ~10 meters

                // Move 15% closer to target each tick for smooth visual progression
                return {
                    lat: prev.lat + dLat * 0.15,
                    lng: prev.lng + dLng * 0.15
                };
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [isOnline, rideStatus, currentSequence]);

    useEffect(() => {
        if (activeMissions.length === 0) {
            setCurrentSequence([]);
            return;
        }

        // Logic: Find the nearest pending target (Pickup or Drop-off)
        const sequence = [];
        const pickups = activeMissions.filter(m => !m.pickupDone);
        const dropoffs = activeMissions.filter(m => m.pickupDone);

        // Logic: Always show the immediate next target in the sequence
        pickups.forEach(m => {
            const coord = m.pickupCoord || { lat: 50.1109, lng: 8.6821 };
            sequence.push({ id: m.id, type: 'pickup', coord, label: `Pick-up: ${m.customer}`, customer: m.customer, address: m.pickup });
        });
        dropoffs.forEach(m => {
            const coord = m.destCoord || { lat: 50.1150, lng: 8.6850 };
            sequence.push({ id: m.id, type: 'dropoff', coord, label: `Drop-off: ${m.customer}`, customer: m.customer, address: m.destination });
        });

        // Nearest-neighbor sorting for the sequence
        sequence.sort((a, b) => {
            const coordA = a.coord || { lat: 50.1109, lng: 8.6821 };
            const coordB = b.coord || { lat: 50.1109, lng: 8.6821 };
            const distA = Math.sqrt(Math.pow(coordA.lat - currentPos.lat, 2) + Math.pow(coordA.lng - currentPos.lng, 2));
            const distB = Math.sqrt(Math.pow(coordB.lat - currentPos.lat, 2) + Math.pow(coordB.lng - currentPos.lng, 2));
            return distA - distB;
        });

        setCurrentSequence(sequence);
    }, [activeMissions, currentPos]);

    const handleAcceptRide = () => {
        if (!incomingRide) return;

        // If it's a real-time request from another user, notify them
        if (incomingRide.isRealTime && socket) {
            socket.emit('accept-ride', {
                passengerId: incomingRide.passengerId,
                driverName: `${profileData.firstName} ${profileData.lastName}`.trim() || user?.name || "Expert Driver"
            });
        }

        if (activeMissions.length > 0) {
            // Queue the mission if we are already busy
            setQueuedMission({
                ...incomingRide,
                status: 'accepted',
                id: incomingRide.id || `M-${Date.now()}`,
                distance: incomingRide.distance || '4.2 km',
                customer: incomingRide.customer || 'New Passenger'
            });
            setIncomingRide(null);
            return;
        }

        const newMission = {
            ...incomingRide,
            status: 'accepted',
            startTime: Date.now(),
            pickupCoord: incomingRide.coords || { lat: 50.115, lng: 8.685 },
            destCoord: { lat: 50.112, lng: 8.692 }, // Realistic Drop-off for simulation
            paymentType: (incomingRide.payment?.toLowerCase().includes('cash')) ? 'Cash' : 'Digital',
            price: incomingRide.price || 24.50
        };

        setActiveMissions(prev => [...prev, newMission]);
        setIncomingRide(null);
        setRideStatus('active_multi');
    };

    const [isActionLocked, setIsActionLocked] = useState(false);
    const lockAction = () => {
        setIsActionLocked(true);
        setTimeout(() => setIsActionLocked(false), 2000);
    };

    const handleArrived = (missionId) => {
        if (isActionLocked) return;
        
        // Find mission to send notification
        const id = missionId || currentSequence[0]?.id;
        const mission = activeMissions.find(m => m.id === id);
        
        if (mission) {
            // Guard: Must be within 50 meters of pickup location
            const pickupCoord = mission.pickupCoord || mission.coords || { lat: 50.115, lng: 8.685 };
            const dist = calculateDistanceInMeters(currentPos, pickupCoord);
            if (dist > 50) {
                alert(`⚠️ Du bist noch ${dist > 1000 ? (dist / 1000).toFixed(1) + 'km' : dist + 'm'} vom Abholort entfernt!\nDer Status "Angekommen" kann erst innerhalb von 50 Metern bestätigt werden.`);
                return;
            }

            // Guard: Prevent duplicate notification for the same mission
            if (notifiedMissions.current.has(mission.id)) {
                // If already notified but status isn't arrived yet (race condition), just update status
                if (mission.status !== 'arrived') {
                    setActiveMissions(prev => prev.map(m => 
                        m.id === mission.id ? { ...m, status: 'arrived', arrivedTime: Date.now() } : m
                    ));
                }
                return;
            }

            lockAction();
            notifiedMissions.current.add(mission.id);
            
            setArrivalNotify({ name: mission.customer, id: `${mission.id}-${Date.now()}` });
            setTimeout(() => setArrivalNotify(null), 10000);
            
            // Notify Passenger via Socket
            if (socket && mission.passengerId) {
                socket.emit('driver-arrived', { passengerId: mission.passengerId });
            }

            setActiveMissions(prev => prev.map(m => 
                m.id === mission.id ? { ...m, status: 'arrived', arrivedTime: Date.now() } : m
            ));
        }
    };

    const handleStartTrip = (missionId) => {
        if (isActionLocked) return;
        lockAction();
        const id = missionId || currentSequence[0]?.id;
        const mission = activeMissions.find(m => m.id === id);

        // Clear any pending arrival notification when trip starts
        setArrivalNotify(null);

        if (mission && socket && mission.passengerId) {
            socket.emit('start-ride', { passengerId: mission.passengerId });
        }

        setActiveMissions(prev => prev.map(m => 
            m.id === id ? { ...m, status: 'guest_in_car', pickupDone: true, startTime: Date.now() } : m
        ));
        
        // Immediate sequence refresh for UI responsiveness
        setCurrentSequence(prev => {
            const newSeq = prev.map(s => 
                s.id === id && s.type === 'pickup' ? { ...s, type: 'dropoff', label: `Drop-off: ${s.customer}` } : s
            );
            // Move the current drop-off to the front if it was the just-started mission
            const currentIdx = newSeq.findIndex(s => s.id === id);
            if (currentIdx > 0) {
                const [item] = newSeq.splice(currentIdx, 1);
                newSeq.unshift(item);
            }
            return newSeq;
        });
    };

    const handleDropOff = (missionId) => {
        if (isActionLocked) return;
        const id = missionId || currentSequence[0]?.id;
        const mission = activeMissions.find(m => m.id === id);
        
        if (mission) {
            lockAction();
            if (mission.isShuttle) {
                if (socket && mission.passengerId) {
                    socket.emit('complete-ride', { passengerId: mission.passengerId });
                }
                setActiveMissions(prev => prev.filter(m => m.id !== id));
                alert(`🏁 SHUTTLE FAHRT BEENDET!\n\nDie Fahrt für ${mission.customer} wurde erfolgreich abgeschlossen.`);
                return;
            }
            if (mission.status === 'guest_in_car') {
                setActiveMissions(prev => prev.map(m => 
                    m.id === id ? { ...m, status: 'collect_payment' } : m
                ));
                return;
            }
        }

        if (mission && mission.status === 'collect_payment') {
            lockAction();
            
            // Notify Passenger trip completed
            if (socket && mission.passengerId) {
                socket.emit('complete-ride', { passengerId: mission.passengerId });
            }

            // B & C: Skip confirm if digital
            if (mission.paymentType === 'Digital') {
                setActiveMissions(prev => prev.filter(m => m.id !== id));
                setPaymentNotify({ customer: mission.customer, amount: mission.price });
                setTimeout(() => setPaymentNotify(null), 5000);
            } else {
                setActiveMissions(prev => prev.map(m => 
                    m.id === id ? { ...m, status: 'confirm_payment' } : m
                ));
            }
            return;
        }

        if (mission && mission.status === 'confirm_payment') {
            lockAction();
            const price = mission.price || 24.50;
            
            // Save to earnings
            setStats(prev => ({
                ...prev,
                day: { ...prev.day, earnings: prev.day.earnings + price, trips: prev.day.trips + 1 }
            }));

            // Trigger Top Sheet Notification
            setPaymentNotify({ customer: mission.customer, amount: price });
            setTimeout(() => setPaymentNotify(null), 5000);

            // Clean up mission
            setActiveMissions(prev => {
                const remaining = prev.filter(m => m.id !== id);
                
                if (queuedMission) {
                    remaining.push(queuedMission);
                    setQueuedMission(null);
                    setRideStatus('accepted');
                } else if (remaining.length === 0) {
                    setRideStatus('none');
                    setRouteGeometry([]);
                }
                return remaining;
            });
            return;
        }
        setCurrentSequence(prev => prev.filter(s => s.id !== id));
        
        if (remaining.length === 0) {
            setRideStatus('none');
        }
    };

    const handleNoShow = () => {
        if (currentSequence.length === 0) return;
        const target = currentSequence[0];
        alert(`NO-SHOW: Moving to next node to protect passenger schedule.`);
        
        const remaining = activeMissions.filter(m => m.id !== target.id);
        setActiveMissions(remaining);
        setActiveRidesCount(prev => Math.max(0, prev - 1));
        
        if (remaining.length === 0) {
            setRideStatus('none');
        }
    };

    const openExternalMap = () => {
        if (currentSequence.length === 0) return;
        const target = currentSequence[0];
        const url = mapPreference === 'google' 
            ? `https://www.google.com/maps/dir/?api=1&destination=${target.coord.lat},${target.coord.lng}`
            : `http://maps.apple.com/?daddr=${target.coord.lat},${target.coord.lng}`;
        window.open(url, '_blank');
    };

    const handleCompleteRide = () => {
        if (currentSequence.length === 0) return;
        const target = currentSequence[0];

        setLastCompletedRide({
            ...target,
            finalAmount: (target?.basePrice || 15.00) * getMultiplier(target?.rideType, currentOccupancy),
            duration: '14m',
            date: new Date().toLocaleDateString(),
            completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        // Step transition: confirm -> summary
        setMissionStep('summary');
    };

    const finalizeMission = () => {
        const target = lastCompletedRide;
        const remaining = activeMissions.filter(m => m.id !== target.id);
        
        setActiveMissions(remaining);
        setCurrentOccupancy(prev => Math.max(0, prev - 1));
        setActiveRidesCount(prev => Math.max(0, prev - 1));
        
        setMissionSheetOpen(false);
        setMissionStep('confirm');
        setSelectedEmojis([]);

        if (remaining.length === 0) {
            setRideStatus('none');
        }
    };

    const handleEarlyDropOff = () => {
        if (currentSequence.length === 0) return;
        const target = currentSequence[0];
        
        // Track for end-of-shift report
        setEarlyDropOffs(prev => [...prev, { id: target.id, customer: target.customer, time: new Date().toLocaleTimeString() }]);
        
        // INSTANT PURGE: Remove from active missions and update occupancy
        setActiveMissions(prev => prev.filter(m => m.id !== target.id));
        setCurrentOccupancy(prev => Math.max(0, prev - 1));
        setActiveRidesCount(prev => Math.max(0, prev - 1));
        
        // Clear mission UI if it was open
        setMissionSheetOpen(false);
        setMissionStep('confirm');
    };

    const handleOfflineRequest = () => {
        if (!isOnline) {
            const isLicenseUploaded = driverDocs.some(d => d.id === 'license' && (d.file || d.fileUrl || d.status === 'verified' || d.status === 'pending'));
            const isPscheinUploaded = driverDocs.some(d => d.id === 'pschein' && (d.file || d.fileUrl || d.status === 'verified' || d.status === 'pending'));
            const isDemo = user?.email?.toLowerCase() === 'driver@green.de';
            if (!isDemo && (!isLicenseUploaded || !isPscheinUploaded)) {
                setShowDocLockModal(true);
                return;
            }
            setIsOnline(true);
            setTimeout(() => {
                handleSimulateTestRide();
            }, 800);
            return;
        }

        // Going offline logic
        if (activeMissions.length > 0) {
            setEarlyDropOffs(activeMissions);
            setShowOfflineReport(true);
            setIsOnline(false);
        } else {
            setIsOnline(false);
        }
    };

    const handleSimulateTestRide = () => {
        if (!isOnline) {
            setIsOnline(true);
        }
        const testRide = {
            id: 'test-trip-' + Date.now(),
            customer: 'Marcus Vance (VIP Guest)',
            passengerName: 'Marcus Vance',
            pickup: 'Frankfurt Airport (FRA T1)',
            dropoff: 'Steigenberger Icon Parkhotel',
            destination: 'Steigenberger Icon Parkhotel',
            price: 35.00,
            basePrice: 35.00,
            distance: '14.2 km',
            status: 'assigned',
            passengerCount: 2,
            bags: 3,
            rideType: 'green',
            capacity: 2,
            coords: { lat: 50.115, lng: 8.685 },
            paymentType: 'Digital'
        };
        setIncomingRide(testRide);
    };

    const finalizeOffline = () => {
        setIsOnline(false);
        setShowOfflineReport(false);
        setEarlyDropOffs([]);
        setReportData({});
        alert("Shift Report Submitted Successfully.");
    };



    const handleResumeTrip = () => {
        if (lastCompletedRide) {
            setActiveMissions(prev => [...prev, { ...lastCompletedRide, status: 'picked_up' }]);
            setCurrentOccupancy(prev => prev + 1);
            setActiveRidesCount(prev => prev + 1);
            setShowRideSummary(false);
            alert("TRIP RESTORED: Resuming active mission.");
        }
    };

    const handleSidebarClick = (id) => {
        if (id === 'verification') {
            setView('verification');
        } else if (id === 'social-profile' || id === 'night-crew') {
            setView('social-profile');
        } else if (id === 'driving-mode' || id === 'stats' || id === 'earnings') {
            setView('dashboard');
        } else if (id === 'profile-pic' || id === 'personal-data') {
            setView('profile-pic');
        } else if (id === 'history') {
            setView('history');
        } else if (id === 'inbox') {
            setView('inbox');
        } else if (id === 'support') {
            setView('support');
        } else if (id === 'shuttle-hub') {
            setView('shuttle-hub');
        } else if (id === 'app-settings' || id === 'settings' || id === 'navigation-settings') {
            setView('settings');
        }
    };

    const safeNotch = isNaN(notchAdjustment) ? 0 : notchAdjustment;
    const safeTopStyle = useSafeArea ? `calc(var(--safe-top, 0px) + ${safeNotch}px)` : `${safeNotch}px`;
    const safeHeightStyle = useSafeArea ? `calc(100% - (var(--safe-top, 0px) + ${safeNotch}px))` : `calc(100% - ${safeNotch}px)`;

    return (
        <div 
            className="absolute left-0 right-0 bottom-0 overflow-hidden bg-dark-950 font-sans text-primary flex flex-col items-center transition-all duration-300"
            style={{
                top: safeTopStyle,
                height: safeHeightStyle,
                minHeight: '100%'
            }}
        >
            {/* Arrival Notification Top Sheet */}
            <AnimatePresence mode="popLayout">
                {arrivalNotify && (
                    <motion.div 
                        key={arrivalNotify.id}
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="absolute top-4 z-[110] w-full max-w-[340px] px-4"
                    >
                        <div className="bg-dark-900/80 backdrop-blur-3xl border border-brand/30 rounded-2xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
                                <Bell className="text-brand" size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand mb-0.5">Rider Notified</p>
                                <p className="text-[12px] font-bold text-primary leading-tight">
                                    <span className="text-brand italic font-black uppercase">{arrivalNotify.name}</span> has been alerted of your arrival.
                                </p>
                            </div>
                            <div className="w-1 h-10 bg-brand/20 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ height: "100%" }}
                                    animate={{ height: "0%" }}
                                    transition={{ duration: 10, ease: "linear" }}
                                    className="w-full bg-brand"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
                {paymentNotify && (
                    <motion.div 
                        key={`pay-${paymentNotify.customer}`}
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="absolute top-4 z-[120] w-full max-w-[340px] px-4"
                    >
                        <div className="bg-emerald-500/10 backdrop-blur-3xl border border-emerald-500/30 rounded-2xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                <Check className="text-emerald-500" size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-emerald-500 mb-0.5">Payment Complete</p>
                                <p className="text-[12px] font-bold text-primary leading-tight">
                                    Collected <span className="text-emerald-500 italic font-black uppercase">€{paymentNotify.amount.toFixed(2)}</span> from {paymentNotify.customer}.
                                </p>
                            </div>
                            <div className="w-1 h-10 bg-emerald-500/20 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ height: "100%" }}
                                    animate={{ height: "0%" }}
                                    transition={{ duration: 5, ease: "linear" }}
                                    className="w-full bg-emerald-500"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                activeView={view}
                onItemClick={(id) => {
                    if (id === 'profile') setProfileSheetOpen(true);
                    else if (id === 'vehicle') setVehicleSheetOpen(true);
                    else if (id === 'documents') setDocumentsSheetOpen(true);
                    else if (id === 'earnings') setView('history');
                    else if (id === 'overview') setView('dashboard');
                    else if (id === 'discovery-feed') setShowPosts(true);
                    else if (id === 'theme-toggle') setTheme(theme === 'dark' ? 'light' : 'dark');
                    else setView(id);
                }}
                user={user}
            />

            {/* EARLY EXIT PROTOCOL SHEET */}
            <Sheet 
                isOpen={!!dismissingMission} 
                onClose={() => setDismissingMission(null)}
                title="Early Exit Protocol"
            >
                <div className="space-y-6">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                        <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-red-500 mb-1">Warning</p>
                        <p className="text-[12px] font-bold text-primary">
                            You are about to end the mission for <span className="text-red-500 italic uppercase font-black">{dismissingMission?.customer}</span> before reaching the destination.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-secondary px-2">Select Reason</p>
                        {[
                            { id: 'early_dropoff', label: 'Early Drop-off Request', icon: MapPin },
                            { id: 'safety', label: 'Safety / Behavior Concern', icon: ShieldCheck },
                            { id: 'technical', label: 'Vehicle Technical Issue', icon: Zap },
                            { id: 'guest_cancel', label: 'Guest Changed Mind', icon: X }
                        ].map((reason) => (
                            <button
                                key={reason.id}
                                onClick={() => {
                                    if (socket) {
                                        socket.emit('cancel-ride', {
                                            passengerId: dismissingMission.passengerId || dismissingMission.id,
                                            reason: reason.label
                                        });
                                    }
                                    setActiveMissions(prev => prev.filter(m => m.id !== dismissingMission.id));
                                    setDismissingMission(null);
                                    alert(`Mission Ended: ${reason.label}`);
                                }}
                                className="w-full flex items-center gap-4 p-4 bg-surface border border-main rounded-2xl hover:bg-surface-light hover:border-white/20 transition-all group text-left"
                            >
                                <div className="w-10 h-10 rounded-xl bg-surface border border-main flex items-center justify-center group-hover:border-red-500/50 transition-all">
                                    <reason.icon size={18} className="text-muted group-hover:text-red-500" />
                                </div>
                                <span className="text-[13px] font-bold text-primary uppercase tracking-tight">{reason.label}</span>
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => setDismissingMission(null)}
                        className="w-full py-4 bg-surface text-secondary rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest hover:text-primary transition-all"
                    >
                        Keep Mission Active
                    </button>
                </div>
            </Sheet>

            {/* Header - Fixed at top */}
            {/* Header - Fixed at top - Only visible in main dashboard view */}
            {view === 'dashboard' && (
                <header className="absolute top-0 left-0 right-0 z-20 p-3 md:p-6 flex justify-between items-center bg-gradient-to-b from-dark-950 to-transparent pointer-events-none">
                    <div className="flex items-center gap-2 md:gap-4 pointer-events-auto">
                        <div className="flex items-center gap-2 md:gap-4 relative z-30 pointer-events-auto">
                            <button 
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 md:p-3 bg-surface backdrop-blur-md border border-main rounded-2xl text-brand hover:bg-brand/10 transition-all shadow-lg relative group"
                            >
                                <Menu size={20} className="md:w-[22px] md:h-[22px]" />
                            </button>
                            
                            {view !== 'dashboard' && (
                                <button 
                                    onClick={() => setView('dashboard')}
                                    className="p-2 md:p-3 bg-surface backdrop-blur-md border border-main rounded-2xl text-primary hover:bg-surface-light transition-all shadow-lg"
                                >
                                    <ArrowLeft size={18} className="md:w-[20px] md:h-[20px]" />
                                </button>
                            )}

                            {rideStatus === 'none' && (
                                <>
                                    <div className="hidden md:flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => setView('social-profile')}>
                                        <span className="text-[6px] font-black text-brand uppercase tracking-widest bg-brand/5 px-1.5 py-0.5 rounded border border-brand/20 shadow-[0_0_10px_rgba(0,212,255,0.1)]">ID: GRN-{user?.id || '921Z'}</span>
                                    </div>
                                    <div className="cursor-pointer" onClick={() => setView('social-profile')}>
                                        <p className="text-[8px] md:text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-brand flex items-center gap-1">
                                            <motion.span 
                                                animate={isOnline ? { scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] } : {}}
                                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-brand shadow-[0_0_8px_var(--brand)]' : 'bg-gray-500'}`} 
                                            />
                                            {isOnline ? 'Searching' : 'Offline'}
                                        </p>
                                        <h2 className="hidden md:block text-sm font-black italic uppercase tracking-tighter -mt-1">{user?.name}</h2>
                                    </div>
                                    <div className="flex items-center gap-2 border-l border-main pl-4 ml-2">
                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-bold uppercase tracking-widest text-secondary">Multi-Trip</span>
                                        <button 
                                            onClick={() => setAcceptsShared(!acceptsShared)}
                                            className={`relative w-10 h-5 rounded-full transition-colors ${acceptsShared ? 'bg-brand' : 'bg-dark-700 border border-main'}`}
                                        >
                                            <motion.div 
                                                animate={{ x: acceptsShared ? 20 : 2 }}
                                                className={`absolute top-[2px] w-4 h-4 rounded-full ${acceptsShared ? 'bg-dark-900' : 'bg-gray-500'}`}
                                            />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Center - Daily Balance */}
                    <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto top-3 md:top-6 z-30">
                        {rideStatus === 'none' && (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center gap-1"
                            >
                                <div
                                    className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl backdrop-blur-md transition-all group"
                                    style={{
                                        background: 'var(--glass-bg)',
                                        border: '1px solid var(--border-main)',
                                        boxShadow: '0 8px 32px var(--shadow-main)'
                                    }}
                                >
                                    <div className="flex flex-col items-center">
                                        <span className="text-[7px] md:text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-brand/80 mb-0.5 group-hover:text-brand transition-colors">Funds</span>
                                        <div className="flex items-center justify-center min-w-[60px] md:min-w-[70px]">
                                            <span className={`text-sm md:text-lg font-black italic tracking-tighter transition-all duration-300 ${isBalanceVisible ? 'text-primary' : 'text-primary opacity- mt-1'}`}>
                                                {isBalanceVisible ? `€${currentStats.earnings.toFixed(2)}` : '••••••'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-[1px] h-6 md:h-8 bg-surface-light mx-0.5 md:mx-1" />
                                    <button
                                        onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                                        className="p-1.5 md:p-2 rounded-xl hover:bg-surface-light transition-colors text-primary opacity- hover:text-brand active:scale-95"
                                    >
                                        {isBalanceVisible ? <EyeOff size={14} className="md:w-[16px] md:h-[16px]" /> : <Eye size={14} className="md:w-[16px] md:h-[16px]" />}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="flex gap-1.5 md:gap-3 relative z-30 pointer-events-auto items-center">
                        {rideStatus === 'none' && (
                            <>
                                {/* Notch / Header Height Fit Controller */}
                                <div className="relative z-50">
                                    <button 
                                        onClick={() => setIsNotchPanelOpen(!isNotchPanelOpen)}
                                        className={`p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl border border-white/10 text-primary transition-all flex items-center justify-center gap-1.5 ${notchAdjustment > 0 || useSafeArea ? 'border-brand/40 text-brand shadow-[0_0_15px_rgba(52,211,153,0.1)]' : ''}`}
                                        title="Notch & Safe Area Alignment"
                                    >
                                        <Smartphone size={18} className={notchAdjustment > 0 ? 'text-brand animate-pulse' : 'text-secondary'} />
                                    </button>
                                    
                                    <AnimatePresence>
                                        {isNotchPanelOpen && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 mt-3 w-72 bg-[#0B121E]/95 backdrop-blur-2xl border border-brand/20 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-[999]"
                                            >
                                                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Smartphone size={14} className="text-brand" />
                                                        <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-brand">Notch & Safe-Fit</span>
                                                    </div>
                                                    <button onClick={() => setIsNotchPanelOpen(false)} className="text-secondary hover:text-primary">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                
                                                <div className="space-y-4 text-left font-sans">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-secondary">Auto Safe Area</span>
                                                        <button 
                                                            onClick={() => setUseSafeArea(!useSafeArea)}
                                                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${useSafeArea ? 'bg-brand' : 'bg-white/10'}`}
                                                        >
                                                            <div className={`w-4 h-4 bg-dark-950 rounded-full transition-transform ${useSafeArea ? 'translate-x-4' : 'translate-x-0'}`} />
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-secondary">Custom Offset</span>
                                                            <span className="text-xs md:text-sm lg:text-base font-black text-brand italic">{notchAdjustment}px</span>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-3">
                                                            <button 
                                                                onClick={() => setNotchAdjustment(Math.max(0, notchAdjustment - 2))}
                                                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-primary font-black"
                                                            >
                                                                -
                                                            </button>
                                                            <input 
                                                                type="range" 
                                                                min="0" 
                                                                max="60" 
                                                                value={notchAdjustment}
                                                                onChange={(e) => setNotchAdjustment(parseInt(e.target.value, 10))}
                                                                className="flex-1 accent-brand h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                                            />
                                                            <button 
                                                                onClick={() => setNotchAdjustment(Math.min(60, notchAdjustment + 2))}
                                                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-primary font-black"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-3 gap-2 pt-2">
                                                        <button 
                                                            onClick={() => setNotchAdjustment(0)}
                                                            className={`py-1.5 rounded-lg border text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-wider transition-all ${notchAdjustment === 0 ? 'bg-brand/10 border-brand text-brand' : 'bg-white/5 border-white/5 text-secondary hover:text-primary'}`}
                                                        >
                                                            0px
                                                            <span className="block text-[6px] opacity-40">Desktop</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => setNotchAdjustment(20)}
                                                            className={`py-1.5 rounded-lg border text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-wider transition-all ${notchAdjustment === 20 ? 'bg-brand/10 border-brand text-brand' : 'bg-white/5 border-white/5 text-secondary hover:text-primary'}`}
                                                        >
                                                            20px
                                                            <span className="block text-[6px] opacity-40">Compact</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => setNotchAdjustment(44)}
                                                            className={`py-1.5 rounded-lg border text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-wider transition-all ${notchAdjustment === 44 ? 'bg-brand/10 border-brand text-brand' : 'bg-white/5 border-white/5 text-secondary hover:text-primary'}`}
                                                        >
                                                            44px
                                                            <span className="block text-[6px] opacity-40">Sim Notch</span>
                                                        </button>
                                                    </div>
                                                    
                                                    <p className="text-[7px] text-gray-500 leading-normal uppercase tracking-wider">
                                                        Fits UI automatically to notches, status bars, and custom cases. Live syncing active.
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>


                            </>
                        )}
                    </div>
                </header>
            )}
            <main className={`flex-1 w-full relative z-10 flex flex-col overflow-hidden ${(rideStatus === 'active_multi' || view !== 'dashboard') ? 'justify-start' : 'items-center justify-center'}`}>
                <AnimatePresence mode="wait">
                            {view === 'social-profile' ? (
                        <motion.div 
                            key="social"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="flex-1 w-full flex flex-col pt-24 px-6 pb-20 overflow-y-auto no-scrollbar"
                        >
                            {/* Hidden file inputs for gallery and camera */}
                            <input
                                type="file"
                                id="social-gallery-upload"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    const url = URL.createObjectURL(file);
                                    alert(`✅ "${file.name}" selected! Action registered.`);
                                    e.target.value = null;
                                }}
                            />
                            <input
                                type="file"
                                id="social-camera-upload"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    alert(`✅ "${file.name}" captured! Action registered.`);
                                    e.target.value = null;
                                }}
                            />

                            <div className="absolute top-8 left-6 right-6 z-[100] flex justify-between items-center pointer-events-none">
                                <div className="flex gap-4 pointer-events-auto">
                                    <button 
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="p-3 bg-surface backdrop-blur-md border border-main rounded-2xl text-brand hover:bg-brand/10 transition-all shadow-lg"
                                    >
                                        <Menu size={20} />
                                    </button>
                                    <button 
                                        onClick={() => setView('dashboard')}
                                        className="p-3 bg-surface backdrop-blur-md border border-main rounded-2xl text-primary hover:bg-surface-light transition-all shadow-lg"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                </div>
                                <button 
                                    onClick={() => setShowPosts(true)}
                                    className="p-3 bg-surface backdrop-blur-md border border-main rounded-2xl text-brand hover:bg-brand/10 transition-all shadow-lg pointer-events-auto group"
                                    title="Open Social Discovery Feed"
                                >
                                    <Compass size={20} className="group-hover:rotate-45 transition-transform duration-300" />
                                </button>
                            </div>

                            {/* Profile Header */}
                            <div className="flex flex-col items-center mb-10">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-brand/10 border-4 border-brand/20 p-2 shadow-2xl relative group">
                                    <img
                                        src={
                                            tempPhotoPreview ||
                                            profileData.avatar ||
                                            (driverDocs.find(d => d.id === 'avatar')?.status === 'verified'
                                                ? null
                                                : null) ||
                                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Driver'}`
                                        }
                                        alt="Avatar"
                                        className="w-full h-full rounded-[2rem] object-cover"
                                    />
                                    {/* Verified badge if avatar doc is verified */}
                                    {driverDocs.find(d => d.id === 'avatar')?.status === 'verified' && (
                                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[var(--brand)] rounded-xl flex items-center justify-center text-[var(--bg-primary)] border-4 border-[var(--bg-primary)]">
                                            <CheckCircle size={20} />
                                        </div>
                                    )}
                                    {/* Pending badge */}
                                    {driverDocs.find(d => d.id === 'avatar')?.status === 'pending' && (
                                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white border-4 border-[var(--bg-primary)]">
                                            <Clock size={16} />
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter mt-6">{profileData.firstName || user?.name?.split(' ')[0] || 'Driver'} {profileData.lastName || user?.name?.split(' ').slice(1).join(' ') || ''}</h2>
                                <p className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-[0.3em] mt-2">Green Driver • {user?.email}</p>
                                
                                {/* Real stats - use real data, show 0 for new accounts */}
                                <div className="flex gap-8 mt-8">
                                    <div className="text-center">
                                        <p className="text-xl font-black italic">{currentStats?.rating?.toFixed(2) || '—'}</p>
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-widest">Rating</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-black italic text-brand">
                                            {user?.greenFlags > 1000 ? (user.greenFlags / 1000).toFixed(1) + 'K' : user?.greenFlags ?? 0}
                                        </p>
                                        <div className="flex items-center justify-center gap-1">
                                            <Zap size={8} className="text-brand fill-brand" />
                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-brand uppercase tracking-widest">Approvals</p>
                                        </div>
                                    </div>
                                    {user?.redFlags > 0 && (
                                        <div className="text-center">
                                            <p className="text-xl font-black italic text-red-500">{user.redFlags}</p>
                                            <div className="flex items-center justify-center gap-1">
                                                <AlertCircle size={8} className="text-red-500 fill-red-500" />
                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-red-500 uppercase tracking-widest">Strikes</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <p className="text-xl font-black italic">{currentStats?.trips ?? 0}</p>
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-widest">Missions</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stories / Reels */}
                            <div className="space-y-8">
                                <div className="flex justify-between items-end px-2">
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter">My <span className="text-brand">Discovery Stories</span></h3>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => document.getElementById('social-gallery-upload').click()}
                                            className="p-2 bg-surface border border-main rounded-xl text-muted hover:text-primary active:scale-95 transition-all"
                                            title="Upload from Gallery"
                                        >
                                            <Upload size={14} />
                                        </button>
                                        <button 
                                            onClick={() => document.getElementById('social-camera-upload').click()}
                                            className="px-4 py-2 bg-brand text-dark-900 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-lg shadow-brand/20 active:scale-95 transition-all"
                                        >
                                            New Reel +
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Empty state for new/real accounts — no mock posts */}
                                {!isDemo && (
                                    <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-white/10 rounded-[2rem]">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-brand/10 flex items-center justify-center border border-brand/20">
                                            <Upload size={28} className="text-brand" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black text-primary uppercase tracking-widest">No stories yet</p>
                                            <p className="text-[10px] md:text-xs lg:text-sm text-muted mt-1">Tap <strong>New Reel +</strong> to record or <strong>↑</strong> to upload from gallery</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => document.getElementById('social-gallery-upload').click()}
                                                className="px-5 py-3 bg-surface border border-main rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-primary hover:border-brand hover:text-brand active:scale-95 transition-all"
                                            >
                                                📷 Gallery
                                            </button>
                                            <button
                                                onClick={() => document.getElementById('social-camera-upload').click()}
                                                className="px-5 py-3 bg-brand text-dark-900 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-lg shadow-brand/20 active:scale-95 transition-all"
                                            >
                                                🎥 Camera
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Demo account still shows mock stories */}
                                {isDemo && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { title: 'Neon Night Cruise', views: '2.4K', img: 'https://images.unsplash.com/photo-1549239120-0a4c321d1bc1?q=80&w=400&auto=format&fit=crop' },
                                            { title: 'Rainy City Vibes', views: '1.8K', img: 'https://images.unsplash.com/photo-1533045607062-a5e2f75a74e5?q=80&w=400&auto=format&fit=crop' },
                                            { title: 'Tesla Speed Run', views: '4.2K', img: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=400&auto=format&fit=crop' },
                                            { title: 'Morning Hustle', views: '982', img: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=400&auto=format&fit=crop' }
                                        ].map((story, i) => (
                                            <div key={i} className="aspect-[9/16] bg-dark-900 rounded-[2rem] border border-main relative overflow-hidden group">
                                                <img src={story.img} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" alt="Story" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                                                    <p className="text-[10px] md:text-xs lg:text-sm font-black italic text-primary uppercase truncate">{story.title}</p>
                                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-brand uppercase mt-1">{story.views} Views</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (rideStatus === 'active_multi' || activeMissions.length > 0) ? (
                        <motion.div 
                            key="mission-hub"
                            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className={`flex-1 w-full p-4 md:p-6 flex flex-col min-h-0 overflow-y-auto no-scrollbar pb-10 ${rideStatus === 'active_multi' ? 'pt-20 md:pt-24' : 'pt-24'}`}
                        >
                            {/* --- NEURAL DATA STRIP (SLIM STATS) --- */}
                            <div className="flex items-center gap-3 md:gap-4 mb-4 px-3 md:px-4 py-2 bg-white/2 border border-main rounded-2xl backdrop-blur-md overflow-x-auto no-scrollbar">
                                <button 
                                    onClick={() => {
                                        setActiveMissions([]);
                                        setRideStatus('none');
                                    }}
                                    className="shrink-0 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 hover:bg-red-500 hover:text-primary transition-all mr-2"
                                    title="Exit Mission Control"
                                >
                                    <ChevronLeft size={14} strokeWidth={3} />
                                </button>
                                {[
                                    { label: 'LOAD', value: 'OPTIMAL', color: 'text-brand' },
                                    { label: 'MISSIONS', value: activeMissions.length, color: 'text-primary' },
                                    { label: 'CAPACITY', value: `${currentOccupancy}/${vehicleCapacity}`, color: 'text-brand' },
                                    { label: 'SESSION', value: '4:12', color: 'text-muted' }
                                ].map((s, i) => (
                                    <div key={i} className="shrink-0 flex items-center gap-2 pr-3 md:pr-4 border-r border-main last:border-0">
                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-brand/60">{s.label}</span>
                                        <span className={`text-[10px] md:text-xs lg:text-sm font-black italic uppercase ${s.color}`}>{s.value}</span>
                                    </div>
                                ))}
                                <div className="flex-1 min-w-[20px]" />
                                <div className={`shrink-0 flex items-center gap-2 px-3 py-1 rounded-lg border transition-all ${sharingMode === 'autobahn' ? 'bg-brand/10 border-brand text-brand' : 'bg-surface border-main text-muted'}`}>
                                    <div className={`w-1 h-1 rounded-full ${sharingMode === 'autobahn' ? 'bg-brand' : 'bg-gray-600'}`} />
                                    <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.2em]">{sharingMode} MODE</span>
                                </div>
                                <button 
                                    onClick={() => setSharedTripsEnabled(!sharedTripsEnabled)}
                                    className={`shrink-0 flex items-center gap-2 px-3 py-1 rounded-lg border transition-all active:scale-95 ${sharedTripsEnabled ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-surface border-main text-muted'}`}
                                >
                                    <div className={`w-1 h-1 rounded-full ${sharedTripsEnabled ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'}`} />
                                    <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.2em]">{sharedTripsEnabled ? 'Pool Active' : 'Pool Disabled'}</span>
                                </button>
                            </div>

                            {/* --- GLOBAL LIVE NAVIGATION HUB (MAP) --- */}
                            <div className="relative h-[35vh] min-h-[250px] bg-dark-900/40 border-2 border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl group z-0">
                                {/* Objective HUD Overlay */}
                                {currentSequence.length > 0 && (
                                    <div className="absolute top-6 left-6 right-6 z-[1000] flex justify-between items-start pointer-events-none">
                                        <div className="bg-dark-950/90 backdrop-blur-md border border-brand/40 p-4 rounded-3xl shadow-2xl max-w-[240px] pointer-events-auto ring-4 ring-black/40">
                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand"></div> Next Objective
                                            </p>
                                            <h4 className="text-sm font-black italic uppercase text-white truncate">{currentSequence[0].label}</h4>
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        animate={{ width: ['20%', '95%', '20%'] }}
                                                        transition={{ duration: 8, repeat: Infinity }}
                                                        className="h-full bg-brand shadow-[0_0_10px_var(--brand)]" 
                                                    />
                                                </div>
                                                <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase">ETA 4 MIN</span>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => {
                                                setRideStatus('none');
                                                setActiveMissions([]);
                                                setCurrentSequence([]);
                                            }}
                                            className="pointer-events-auto p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 hover:bg-red-500/20 shadow-xl transition-all"
                                            title="Abort All Missions"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                )}
                                <MapContainer 
                                    center={[currentPos.lat, currentPos.lng]} 
                                    zoom={14} 
                                    zoomControl={false}
                                    style={{ height: '100%', width: '100%', background: '#0B121E' }}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    
                                    <MapRecenter pos={currentPos} />

                                    {/* Driver Marker */}
                                    <Marker position={[currentPos.lat, currentPos.lng]} icon={driverIcon} />

                                    {/* Path Polyline */}
                                    {routeGeometry.length > 0 ? (
                                        <Polyline 
                                            positions={routeGeometry}
                                            color="var(--brand)"
                                            weight={5}
                                            opacity={0.8}
                                        />
                                    ) : currentSequence.length > 0 && (
                                        <Polyline 
                                            positions={[
                                                [currentPos.lat, currentPos.lng],
                                                ...currentSequence.map(s => [s.coord.lat, s.coord.lng])
                                            ]}
                                            color="var(--brand)"
                                            weight={4}
                                            opacity={0.6}
                                            dashArray="10, 10"
                                        />
                                    )}

                                </MapContainer>

                                <div className="absolute inset-0 pointer-events-none z-10 opacity-10 bg-gradient-to-t from-brand/20 to-transparent"></div>
                                <div className="absolute inset-0 pointer-events-none z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
                            </div>


                            {/* --- ACTION HUD: MISSION COMMAND CENTER --- */}
                            {currentSequence.length > 0 && (
                                <div className="mt-6 flex flex-col gap-4 px-2">
                                    {/* Navigation Row */}
                                    <div className="flex gap-2 md:gap-3">
                                        <button 
                                            onClick={openExternalMap}
                                            className="flex-1 py-4 md:py-5 bg-brand text-dark-900 rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-brand/20 flex items-center justify-center gap-2 md:gap-3 active:scale-95 transition-all border-2 md:border-4 border-main"
                                        >
                                            <Navigation size={18} className="md:w-[20px] md:h-[20px]" /> 
                                            <span className="truncate max-w-[200px]">
                                                {currentSequence[0]?.type === 'pickup' ? 'PICK-UP' : 'DROP-OFF'}: {currentSequence[0]?.address || 'LOCATION'}
                                            </span>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setCurrentPos(prev => ({ lat: prev.lat + 0.0015, lng: prev.lng + 0.0015 }));
                                            }}
                                            className="p-4 md:p-5 bg-dark-800 border border-main rounded-2xl md:rounded-3xl text-brand hover:bg-brand/10 transition-all shadow-lg active:scale-95"
                                        >
                                            <Zap size={20} className="md:w-[24px] md:h-[24px]" />
                                        </button>
                                    </div>

                                    {/* Core Action Row */}
                                    <div className="flex gap-3">
                                        {(() => {
                                            const target = currentSequence[0];
                                            const mission = activeMissions.find(m => m.id === target?.id);
                                            const isShared = activeMissions.length > 1;
                                            
                                            const getRideConfig = () => {
                                                if (isShared || mission?.rideType === 'shared') return { label: 'SHARED POOL', color: 'bg-blue-500/10 border-blue-500/30 text-blue-400', icon: '⚡' };
                                                if (mission?.rideType === 'premium') return { label: 'PREMIUM LUX', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400', icon: '👑' };
                                                if (mission?.rideType === 'max') return { label: 'GREEN MAX', color: 'bg-brand/10 border-brand/30 text-brand', icon: '🔋' };
                                                return { label: 'GREEN ECONOMY', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', icon: '🌱' };
                                            };

                                            const config = getRideConfig();

                                            return (
                                                <div className="w-full flex gap-3 h-16">
                                                    <div className={`flex-[1.5] flex items-center justify-center gap-3 rounded-[1.5rem] border backdrop-blur-xl transition-all ${config.color}`}>
                                                        <span className="text-sm">{config.icon}</span>
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black tracking-widest text-secondary uppercase">Mission Class</span>
                                                            <span className="text-[11px] md:text-sm lg:text-base font-black italic tracking-tight">{config.label}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 bg-white/2 border border-main rounded-[1.5rem] flex flex-col items-center justify-center relative overflow-hidden group">
                                                        <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black tracking-widest text-secondary uppercase">Target Sector</span>
                                                        <span className="text-[11px] md:text-sm lg:text-base font-black text-primary italic">{mission?.pickup?.split(' ')[0] || mission?.destination?.split(' ')[0] || 'FRANKFURT'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* --- DUAL-PHASE MISSION CONTROL TERMINALS --- */}
                            <div className="mt-4 space-y-4 pb-10">
                                {/* PICK-UP TERMINAL */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1 h-1 rounded-full bg-brand" />
                                            <h3 className="text-[11px] md:text-sm lg:text-base font-black uppercase tracking-[0.2em] text-primary italic">Pick-Up</h3>
                                        </div>
                                        <div className="px-1.5 py-0.5 bg-brand/5 border border-brand/20 rounded-md">
                                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-widest">{activeMissions.filter(m => m.status !== 'guest_in_car' && m.status !== 'collect_payment').length} In</span>
                                        </div>
                                    </div>
                                    <motion.div 
                                        layout
                                        className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-2 min-h-[120px]"
                                    >
                                        <AnimatePresence mode="popLayout">
                                            {queuedMission && (
                                                <motion.div
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="flex-shrink-0 w-52 bg-brand/10 backdrop-blur-2xl border border-brand/40 rounded-[2.5rem] p-5 space-y-4 transition-all relative z-10"
                                                >
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand text-dark-900 rounded-full shadow-lg shadow-brand/20">
                                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-[0.2em]">Up Next</span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <div className="w-7 h-7 rounded-lg bg-btn-sec border border-brand/30 overflow-hidden">
                                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${queuedMission.customer}`} className="w-full h-full" alt="" />
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs md:text-sm lg:text-base font-black italic">{queuedMission.customer}</span>
                                                            <div className="flex items-center gap-1">
                                                                <Star size={8} className="fill-brand text-brand" />
                                                                <span className="text-[9px] md:text-[11px] lg:text-xs font-bold text-muted">New</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 bg-dark-900/50 p-3 rounded-[1.5rem] border border-white/5">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin size={10} className="text-brand" />
                                                            <span className="text-[10px] md:text-xs lg:text-sm font-bold truncate text-primary">{queuedMission.pickup}</span>
                                                        </div>
                                                    </div>
                                                    <div className="pt-2 border-t border-brand/20 flex justify-between items-center">
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-widest">Queued</span>
                                                        <span className="text-[11px] md:text-sm lg:text-base font-black text-primary">{queuedMission.distance}</span>
                                                    </div>
                                                </motion.div>
                                            )}
                                            {activeMissions.filter(m => m.status !== 'guest_in_car' && m.status !== 'collect_payment').map((m, i) => {
                                            const minutesInCar = Math.floor((Date.now() - m.startTime) / 60000);
                                            const isNextObjective = currentSequence.length > 0 && currentSequence[0].label.includes(m.customer);
                                            const maxWait = sharingMode === 'autobahn' ? 40 : 25;
                                            const isHighPressure = minutesInCar > (maxWait * 0.6);
                                            const pickupCoord = m.pickupCoord || m.coords || { lat: 50.115, lng: 8.685 };
                                            const distToPickup = calculateDistanceInMeters(currentPos, pickupCoord);
                                            const isWithin50m = distToPickup <= 50;
                                            
                                             return (
                                                <React.Fragment key={m.id}>
                                                <motion.div 
                                                    layout
                                                    className={`flex-shrink-0 w-52 bg-[var(--bg-secondary)] backdrop-blur-2xl border rounded-[2.5rem] p-5 space-y-4 transition-all relative z-10 ${isNextObjective ? 'border-[var(--brand)] shadow-[0_0_20px_var(--brand-glow)]' : (isHighPressure ? 'border-orange-500/30' : 'border-main')}`}
                                                >
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (socket) {
                                                                socket.emit('cancel-ride', { passengerId: m.passengerId || m.id, reason: 'Driver dismissed request' });
                                                            }
                                                            setActiveMissions(prev => prev.filter(mission => mission.id !== m.id));
                                                        }}
                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-primary rounded-full flex items-center justify-center border border-dark-900 z-20 hover:scale-110 transition-transform"
                                                    >
                                                        <X size={10} strokeWidth={3} />
                                                    </button>
                                                    <div className="flex justify-between items-center">
                                                        <div className="w-7 h-7 rounded-lg bg-btn-sec border border-main overflow-hidden">
                                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.customer}`} className="w-full h-full" alt="" />
                                                        </div>
                                                        <span className={`text-[12px] font-black italic tracking-tighter ${isHighPressure ? 'text-orange-500' : 'text-primary'}`}>{minutesInCar}m</span>
                                                    </div>
                                                    
                                                    <div>
                                                        <p className="text-[14px] font-black italic uppercase text-primary truncate">{m.customer}</p>
                                                        <p className="text-[11px] md:text-sm lg:text-base font-black text-brand/70 uppercase truncate mt-0.5">{m.pickup}</p>
                                                    </div>

                                                    <div className="pt-0.5">
                                                        <AnimatePresence mode="wait">
                                                            {(m.status === 'accepted' || m.status === 'assigned' || m.status === 'requested' || m.status === 'pending') && (
                                                                <div className="space-y-1.5">
                                                                    <motion.button 
                                                                        key="arrived-btn"
                                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                                        whileHover={isWithin50m ? { scale: 1.02 } : {}}
                                                                        whileTap={isWithin50m ? { scale: 0.98 } : {}}
                                                                        disabled={!isWithin50m}
                                                                        onClick={() => {
                                                                            if (!isWithin50m) return;
                                                                            handleArrived(m.id);
                                                                        }}
                                                                        className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                                                            isWithin50m 
                                                                                ? 'bg-brand text-dark-900 border border-brand/60 shadow-lg shadow-brand/30 animate-pulse cursor-pointer' 
                                                                                : 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed opacity-50 shadow-none'
                                                                        }`}
                                                                        title={isWithin50m ? "Am Abholort angekommen" : `Noch ${distToPickup}m entfernt. Freischaltung erst ab 50m.`}
                                                                    >
                                                                        {isWithin50m ? (
                                                                            <span>📍 ANGEKOMMEN (Am Abholort)</span>
                                                                        ) : (
                                                                            <span>🔒 NOCH {distToPickup > 1000 ? (distToPickup / 1000).toFixed(1) + 'km' : distToPickup + 'm'} (ab 50m)</span>
                                                                        )}
                                                                    </motion.button>

                                                                    {!isWithin50m && (
                                                                        <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 px-1">
                                                                            <span className="text-[8px] uppercase tracking-wider text-amber-400/90 font-mono">Erst &le; 50m aktiv</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setCurrentPos({
                                                                                        lat: (pickupCoord.lat || 50.115) - 0.0002,
                                                                                        lng: (pickupCoord.lng || 8.685) - 0.0002
                                                                                    });
                                                                                }}
                                                                                className="text-[9px] text-cyan-400 hover:text-cyan-300 underline font-black uppercase tracking-wider cursor-pointer"
                                                                                title="Fahrzeug auf 30m an den Abholort setzen"
                                                                            >
                                                                                ⚡ Test: Anfahren (&lt;50m)
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {m.status === 'arrived' && (
                                                                <motion.div 
                                                                    key="start-group"
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                                    className="flex gap-2"
                                                                >
                                                                    <motion.button 
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={() => setActiveMissions(prev => prev.map(mission => mission.id === m.id ? { ...mission, status: 'accepted' } : mission))}
                                                                        className="w-12 h-10 bg-surface border border-main rounded-xl flex items-center justify-center text-muted hover:text-primary transition-all cursor-pointer"
                                                                        title="Rückgängig"
                                                                    >
                                                                        <RotateCcw size={16} />
                                                                    </motion.button>
                                                                    <motion.button 
                                                                        whileHover={{ scale: 1.02 }}
                                                                        whileTap={{ scale: 0.98 }}
                                                                        onClick={() => handleStartTrip(m.id)}
                                                                        className="flex-1 py-4 bg-brand text-dark-900 rounded-2xl text-[11px] md:text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20 transition-all cursor-pointer"
                                                                    >
                                                                        🚀 GÄSTE ABGEHOLT & FAHRT STARTEN
                                                                    </motion.button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </motion.div>

                                                {/* ABHOL-INTELLIGENCE CARD (Red-Box Slot Next to Pickup Card) */}
                                                <motion.div
                                                    layout
                                                    className="flex-shrink-0 w-80 bg-[var(--bg-secondary)] backdrop-blur-2xl border border-[var(--brand)]/30 rounded-[2.5rem] p-4 space-y-3 transition-all relative z-10 shadow-lg"
                                                >
                                                    {/* Row 1: Flight & Wait Timer */}
                                                    <div className="flex items-center justify-between bg-dark-900/40 p-2.5 rounded-2xl border border-white/5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs">✈️</span>
                                                            <div>
                                                                <p className="text-[10px] font-black text-brand uppercase tracking-wider">{m.flightNo || 'LH 401'} • {m.terminal || 'FRA T1'}</p>
                                                                <p className="text-[8px] font-semibold text-secondary uppercase">Status: Pünktlich</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                                                            <Clock size={12} className="animate-pulse" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">15 Min Frei</span>
                                                        </div>
                                                    </div>

                                                    {/* Row 2: Guests, Luggage & Auto-Split Status */}
                                                    <div className="bg-dark-900/40 p-2.5 rounded-2xl border border-white/5 space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-secondary">Gäste & Gepäck</span>
                                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                                ((m.passengerCount || 2) >= 5 || (m.bags || 3) >= 7) 
                                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                                                    : 'bg-brand/20 text-brand border border-brand/30'
                                                            }`}>
                                                                {((m.passengerCount || 2) >= 5 || (m.bags || 3) >= 7) ? '🚨 2 Autos (Auto-Split)' : '🚗 1 Auto (Standard)'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs font-bold text-primary">
                                                            <span className="flex items-center gap-1"><User size={12} className="text-brand" /> {m.passengerCount || 2} Gäste</span>
                                                            <span className="flex items-center gap-1"><Briefcase size={12} className="text-brand" /> {m.bags || 3} Koffer</span>
                                                        </div>
                                                        {((m.passengerCount || 2) >= 5 || (m.bags || 3) >= 7) && (
                                                            <p className="text-[8px] font-bold text-red-400 uppercase tracking-tight">
                                                                Partner-Fahrzeug 2 (Thomas K. - Flotte Khiam) führt Gepäck-Support.
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Row 3: Quick Action Contact Buttons */}
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => alert(`📞 Direct Call to ${m.customer}: +49 176 99887766`)}
                                                            className="flex-1 py-2.5 bg-brand/10 border border-brand/30 text-brand hover:bg-brand hover:text-dark-900 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                                        >
                                                            <Smartphone size={12} /> Anrufen
                                                        </button>
                                                        <button 
                                                            onClick={() => alert(`💬 WhatsApp dispatched to ${m.customer}: "Hello! I am your driver at FRA terminal."`)}
                                                            className="flex-1 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-dark-900 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                                        >
                                                            <MessageSquare size={12} /> WhatsApp
                                                        </button>
                                                    </div>
                                                </motion.div>
                                                </React.Fragment>
                                            );
                                        })}
                                    </AnimatePresence>
                                </motion.div>
                                </div>

                                {/* DROP-OFF TERMINAL */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                                            <h3 className="text-[11px] md:text-sm lg:text-base font-black uppercase tracking-[0.2em] text-primary italic">Drop-Off</h3>
                                        </div>
                                        <div className="px-1.5 py-0.5 bg-blue-500/5 border border-blue-500/20 rounded-md">
                                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-blue-400 uppercase tracking-widest">{activeMissions.filter(m => m.status === 'guest_in_car' || m.status === 'collect_payment').length} Act</span>
                                        </div>
                                    </div>
                                    <motion.div 
                                        layout
                                        className="flex gap-4 overflow-x-auto no-scrollbar pb-6 px-2 min-h-[200px]"
                                    >
                                        <AnimatePresence mode="popLayout">
                                            {activeMissions.filter(m => m.status === 'guest_in_car' || m.status === 'collect_payment' || m.status === 'confirm_payment').map((m, i) => {
                                                const minutesInCar = Math.floor((Date.now() - m.startTime) / 60000);
                                                const isNextObjective = currentSequence.length > 0 && currentSequence[0].label.includes(m.customer);
                                                const maxWait = sharingMode === 'autobahn' ? 40 : 25;
                                                const isHighPressure = minutesInCar > (maxWait * 0.6);
                                                
                                                return (
                                                    <motion.div 
                                                        layout
                                                        key={m.id} 
                                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                                        className={`flex-shrink-0 w-52 bg-[var(--bg-secondary)] backdrop-blur-2xl border rounded-[2.5rem] p-5 space-y-4 transition-all relative z-10 ${isNextObjective ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : (isHighPressure ? 'border-orange-500/30' : 'border-main')}`}
                                                    >
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDismissingMission({ id: m.id, customer: m.customer });
                                                            }}
                                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-primary rounded-full flex items-center justify-center border border-dark-900 z-20 hover:scale-110 transition-transform"
                                                        >
                                                            <X size={10} strokeWidth={3} />
                                                        </button>
                                                        <div className="flex justify-between items-center">
                                                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 overflow-hidden">
                                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.customer}`} className="w-full h-full" alt="" />
                                                            </div>
                                                            <span className={`text-[12px] font-black italic tracking-tighter ${isHighPressure ? 'text-orange-500' : 'text-primary'}`}>{minutesInCar}m</span>
                                                        </div>
                                                        
                                                        <div>
                                                            <p className="text-[14px] font-black italic uppercase text-primary truncate">{m.customer}</p>
                                                            <p className="text-[11px] md:text-sm lg:text-base font-black text-brand/70 uppercase truncate mt-0.5">{m.destination}</p>
                                                        </div>

                                                        <div className="pt-0.5">
                                                            <AnimatePresence mode="wait">
                                                                {m.status === 'confirm_payment' ? (
                                                                    <motion.button 
                                                                        key="confirm-btn"
                                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                                        whileHover={{ scale: 1.02 }}
                                                                        whileTap={{ scale: 0.98 }}
                                                                        onClick={() => handleDropOff(m.id)}
                                                                        className="w-full py-4 bg-emerald-500 text-[#000000] rounded-2xl text-[12px] font-black uppercase active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                                                                    >
                                                                        {m.paymentType === 'Cash' ? 'CONFIRM CASH' : 'CONFIRM DIGITAL'}
                                                                    </motion.button>
                                                                ) : m.status === 'collect_payment' ? (
                                                                    <motion.button 
                                                                        key="collect-btn"
                                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                                        whileHover={{ scale: 1.02 }}
                                                                        whileTap={{ scale: 0.98 }}
                                                                        onClick={() => handleDropOff(m.id)}
                                                                        className="w-full py-4 bg-amber-500 text-[#000000] rounded-2xl text-[11px] md:text-sm lg:text-base font-black uppercase active:scale-95 transition-all shadow-lg shadow-amber-500/20"
                                                                    >
                                                                        {m.paymentType === 'Cash' ? 'COLLECT CASH' : 'VERIFY DIGITAL'}: €{(m.price || 24.50).toFixed(2)}
                                                                    </motion.button>
                                                                ) : (
                                                                    <motion.button 
                                                                        key="dropoff-btn"
                                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                                        whileHover={{ scale: 1.02 }}
                                                                        whileTap={{ scale: 0.98 }}
                                                                        onClick={() => handleDropOff(m.id)}
                                                                        className="w-full py-4 bg-blue-500 text-[#000000] rounded-2xl text-[14px] font-black uppercase active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                                                                    >
                                                                        DROP OFF
                                                                    </motion.button>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </motion.div>
                                </div>
                                {/* Spacer to prevent cards from being hidden by the bottom bar */}
                                <div className="h-48 shrink-0" />
                            </div>
                        </motion.div>
                    ) : (
                        <div className="relative w-full h-[45vh] md:h-[600px] border border-gray-100 rounded-[3.5rem] overflow-hidden shadow-sm z-0 bg-white flex items-center justify-center">
                            <Radar />
                        </div>
                    )}
                </AnimatePresence>

                {/* Online Toggle & Sector Intelligence */}
                {/* Online Toggle & Sector Intelligence - Only visible on main dashboard */}
                {view === 'dashboard' && (
                    <div className="absolute bottom-6 w-full max-w-[420px] px-6 space-y-3 z-[60]">
                        {isOnline && (
                            <button
                                onClick={handleSimulateTestRide}
                                className="w-full py-3.5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Zap size={18} className="animate-pulse" /> Simulate Test Ride
                            </button>
                        )}
                        {rideStatus === 'none' && (
                            <button
                                onClick={handleOfflineRequest}
                                className={`w-full py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-[0.25em] italic transition-all shadow-xl flex items-center justify-center gap-3 border-2 md:border-4 ${
                                    isOnline 
                                        ? 'bg-brand text-dark-900 border-white/20 shadow-brand/20' 
                                        : 'bg-[#1F2937] text-white border-main shadow-black/40 hover:bg-brand/20 hover:border-brand/40'
                                }`}
                            >
                                <Zap size={22} className={`md:w-[24px] md:h-[24px] ${isOnline ? 'animate-pulse' : ''}`} />
                                {isOnline ? 'Go Offline' : 'Go Online'}
                            </button>
                        )}
                    </div>
                )}
            </main>

            {/* Post-Shift Tactical Report Sheet */}
            <Sheet
                isOpen={showOfflineReport}
                onClose={() => setShowOfflineReport(false)}
                className="max-w-[420px] mx-auto overflow-hidden"
            >
                <div className="max-h-[85vh] overflow-y-auto no-scrollbar pb-10 space-y-8">
                    <div className="text-center space-y-2 pt-4">
                        <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center text-brand mx-auto mb-4 border border-brand/20">
                            <FileText size={32} />
                        </div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Shift Intelligence</h2>
                        <p className="text-[10px] md:text-xs lg:text-sm font-bold text-secondary uppercase tracking-widest">Incident Reports Required: {earlyDropOffs.length}</p>
                    </div>

                    <div className="space-y-6">
                        {earlyDropOffs.map((trip, idx) => (
                            <div key={trip.id} className="bg-surface border border-main rounded-[2rem] p-6 space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <div>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest">{trip.customer}</p>
                                        <p className="text-[8px] md:text-[10px] lg:text-xs text-gray-600 font-bold uppercase tracking-wider">Early Trip End @ {trip.time}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-500">
                                        <AlertCircle size={16} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { label: '👤 Customer Request', id: 'request' },
                                        { label: '🚫 Customer Behavior', id: 'behavior' },
                                        { label: '🔧 Other Reasons', id: 'other' }
                                    ].map((reason) => (
                                        <button
                                            key={reason.id}
                                            onClick={() => setReportData(prev => ({ ...prev, [trip.id]: { ...prev[trip.id], reason: reason.id } }))}
                                            className={`w-full py-3 px-4 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest transition-all text-left border ${reportData[trip.id]?.reason === reason.id ? 'bg-brand/20 border-brand text-brand' : 'bg-surface border-main text-secondary'}`}
                                        >
                                            {reason.label}
                                        </button>
                                    ))}
                                </div>

                                {reportData[trip.id]?.reason === 'other' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-2"
                                    >
                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black text-gray-600 uppercase tracking-widest ml-1">Provide Details</label>
                                        <textarea
                                            placeholder="Write situation details here..."
                                            value={reportData[trip.id]?.details || ''}
                                            onChange={(e) => setReportData(prev => ({ ...prev, [trip.id]: { ...prev[trip.id], details: e.target.value } }))}
                                            className="w-full bg-dark-950 border border-main rounded-2xl p-4 text-[10px] md:text-xs lg:text-sm font-medium text-primary focus:border-brand outline-none h-24 no-scrollbar resize-none"
                                        />
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="px-2">
                        <button
                            onClick={finalizeOffline}
                            disabled={earlyDropOffs.some(t => !reportData[t.id]?.reason)}
                            className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] italic text-xs md:text-sm lg:text-base shadow-xl transition-all ${!earlyDropOffs.some(t => !reportData[t.id]?.reason) ? 'bg-brand text-dark-900 shadow-brand/20 active:scale-95' : 'bg-dark-800 text-gray-600 border border-main cursor-not-allowed opacity-50'}`}
                        >
                            Submit Report & Go Offline
                        </button>
                    </div>
                </div>
            </Sheet>




                {/* Unified View Overlays */}
                <AnimatePresence>
                    {view !== 'dashboard' && view !== 'social-profile' && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="absolute inset-0 z-50 bg-dark-950 overflow-y-auto no-scrollbar pb-32 px-6 pt-24 space-y-10"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setView('dashboard')}
                                        className="p-2 -ml-2 bg-btn-sec rounded-xl text-muted hover:text-brand transition-all"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <h3 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-gray-600 italic">
                                        {view === 'verification' ? 'Verification Hub' :
                                            view === 'history' ? 'Earnings History' :
                                                view === 'inbox' ? 'Inbox & Programs' :
                                                    view === 'support' ? 'Help & Support' :
                                                        view === 'profile-pic' ? 'My Profile' :
                                                            view === 'settings' ? 'App Settings' :
                                                                view === 'vehicle-hub' ? 'Vehicle Control' :
                                                                'Settings'}
                                    </h3>
                                </div>
                            </div>

                            {view === 'verification' && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-surface border border-main rounded-3xl space-y-4">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck size={28} className="text-brand" />
                                            <div>
                                                <h3 className="text-base font-black uppercase text-white">Gesetzliche Flottendokumente & Freigaben</h3>
                                                <p className="text-xs text-gray-400 font-medium">Verwaltet durch Ihren Flotten-Manager</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-brand/10 border border-brand/20 rounded-2xl text-xs text-emerald-300 font-bold leading-relaxed">
                                            ℹ️ Hinweis für Fahrer: Gesetzliche Nachweise (Konzession, TÜV, Versicherung, Flotten-Freigabe) werden zentral von Ihrem autorisierten Flotten-Manager eingereicht und vom Grien Admin geprüft. Als Fahrer müssen Sie in Ihrem Profil lediglich Ihr Profilbild, Ihren Personalausweis (Vorder- und Rückseite) hinterlegen und die AGB akzeptieren.
                                        </div>
                                        <button
                                            onClick={() => setView('profile-pic')}
                                            className="px-6 py-3 bg-brand text-dark-900 rounded-xl font-black uppercase text-xs hover:scale-105 transition-all cursor-pointer font-bold"
                                        >
                                            👉 Zu Mein Profil & Ausweis-Upload
                                        </button>
                                    </div>
                                </div>
                            )}

                            {view === 'history' && (
                                <div className="space-y-8">
                                    {/* Neural Filter - Calendar & Period Search */}
                                    <div className="bg-surface border border-main rounded-[2.5rem] p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-brand" />
                                                <h4 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-primary">Grid Calendar Filter</h4>
                                            </div>
                                            <div className="flex bg-dark-900/50 rounded-xl p-1 border border-main">
                                                {['week', 'month'].map(r => (
                                                    <button
                                                        key={r}
                                                        onClick={() => setTimeRange(r)}
                                                        className={`px-4 py-1.5 rounded-lg text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest transition-all ${timeRange === r ? 'bg-brand text-dark-900 shadow-brand-glow' : 'text-secondary hover:text-primary'}`}
                                                    >
                                                        {r}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-1">Search Period</p>
                                                <div className="relative group">
                                                    <select 
                                                        value={timeRange === 'week' ? selectedWeek : selectedMonth}
                                                        onChange={(e) => timeRange === 'week' ? setSelectedWeek(e.target.value) : setSelectedMonth(e.target.value)}
                                                        className="w-full bg-dark-950 border border-main rounded-2xl p-4 text-xs md:text-sm lg:text-base font-black uppercase tracking-tighter text-primary appearance-none focus:border-brand outline-none cursor-pointer group-hover:border-white/20 transition-all"
                                                    >
                                                        {timeRange === 'week' ? (
                                                            <>
                                                                <option>Week 17</option>
                                                                <option>Week 16</option>
                                                                <option>Week 15</option>
                                                                <option>Week 14</option>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <option>April 2026</option>
                                                                <option>March 2026</option>
                                                                <option>February 2026</option>
                                                                <option>January 2026</option>
                                                            </>
                                                        )}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand">
                                                        <Filter size={14} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-1">Payout Status</p>
                                                <div className="w-full bg-dark-950/50 border border-main rounded-2xl p-4 flex items-center justify-between">
                                                    <span className="text-[10px] md:text-xs lg:text-sm font-black text-brand italic">DISPATCHED</span>
                                                    <div className="w-2 h-2 rounded-full bg-brand" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Earnings Summary Grid */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: timeRange === 'week' ? 'This Week' : 'Selected Month', amount: timeRange === 'week' ? 452.20 : 1840.00, color: 'text-brand' },
                                            { label: 'Avg / Trip', amount: 14.50, color: 'text-primary' },
                                            { label: '3% Platform Fee', amount: (timeRange === 'week' ? 452.20 : 1840.00) * 0.03, color: 'text-brand' }
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-surface border border-main rounded-2xl p-4 text-center">
                                                <p className="text-[7px] font-black uppercase tracking-widest text-secondary mb-2">{stat.label}</p>
                                                <p className={`text-sm font-black italic tracking-tighter ${stat.color}`}>€{stat.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-gray-600 uppercase tracking-widest ml-2">Recent Trips</p>
                                        {tripHistory.map(trip => (
                                            <div key={trip.id} className="bg-surface border border-main rounded-3xl p-6 flex justify-between items-center group hover:border-brand/30 transition-all">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-secondary uppercase tracking-widest">{trip.date}</p>
                                                    <h4 className="font-black italic uppercase tracking-tighter text-primary">€{trip.amount.toFixed(2)}</h4>
                                                    <p className="text-[10px] md:text-xs lg:text-sm font-medium text-muted">{trip.from} → {trip.to}</p>
                                                </div>
                                                <button
                                                    onClick={() => setShowReceipt(trip)}
                                                    className="px-4 py-2 bg-brand/10 border border-brand/20 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand group-hover:bg-brand group-hover:text-dark-900 transition-all"
                                                >
                                                    Receipt
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {view === 'inbox' && (
                                <div className="space-y-6">
                                    {inboxMessages.map(msg => (
                                        <div key={msg.id} className="bg-surface border border-main rounded-3xl p-6 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-lg font-black italic uppercase tracking-tighter text-brand">{msg.title}</h4>
                                                <span className="text-[10px] md:text-xs lg:text-sm font-black text-gray-600 uppercase tracking-widest">{msg.date}</span>
                                            </div>
                                            <p className="text-sm text-muted font-medium leading-relaxed">{msg.content}</p>
                                            <button className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand hover:underline">Learn More →</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {view === 'support' && (
                                <div className="space-y-10">
                                    {isChatOpen ? (
                                        <div className="bg-surface border border-main rounded-[2.5rem] p-6 h-[400px] flex flex-col">
                                            <div className="flex justify-between items-center pb-4 border-b border-main mb-4">
                                                <h4 className="font-black italic uppercase tracking-tighter text-primary">Super Admin Support</h4>
                                                <button onClick={() => setIsChatOpen(false)} className="text-muted hover:text-primary"><X size={20} /></button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar mb-4">
                                                {chatMessages.map((msg, i) => (
                                                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[85%] p-4 rounded-2xl text-xs md:text-sm lg:text-base font-medium leading-relaxed ${msg.sender === 'user' ? 'bg-[var(--brand)] text-[var(--bg-primary)] rounded-tr-sm' : 'bg-surface-light text-primary border border-main rounded-tl-sm'}`}>
                                                            {msg.text}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={chatInput}
                                                    onChange={e => setChatInput(e.target.value)}
                                                    placeholder="Type your message..."
                                                    className="flex-1 bg-surface-light border border-main rounded-xl px-4 py-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand"
                                                />
                                                <button type="submit" className="p-3 bg-[var(--brand)] text-[var(--bg-primary)] rounded-xl hover:scale-105 transition-all flex items-center justify-center">
                                                    <Navigation size={20} className="rotate-90" />
                                                </button>
                                            </form>
                                        </div>
                                    ) : (
                                        <div className="bg-brand/10 border border-brand/20 rounded-3xl p-8 space-y-6 text-center">
                                            <div className="w-16 h-16 bg-brand/20 rounded-2xl flex items-center justify-center text-brand mx-auto">
                                                <MessageSquare size={32} />
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-xl font-black italic uppercase tracking-tighter text-primary">Chat with Super Admin</h4>
                                                <p className="text-sm text-secondary font-medium">Chat directly with the Super Admin. Please note, due to high volume, wait times are approximately 12 hours.</p>
                                            </div>
                                            <button onClick={() => setIsChatOpen(true)} className="w-full py-4 bg-[var(--brand)] text-[var(--bg-primary)] rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm lg:text-base shadow-lg shadow-brand/20">
                                                Start Chat
                                            </button>
                                        </div>
                                    )}

                                    <div className="bg-surface border border-main rounded-3xl p-8 space-y-4">
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-secondary uppercase tracking-widest">Email Support</p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-surface-light rounded-2xl flex items-center justify-center text-muted">
                                                <Bell size={24} />
                                            </div>
                                            <div>
                                                <p className="font-black italic uppercase tracking-tighter text-primary underline">support@green.com</p>
                                                <p className="text-[10px] md:text-xs lg:text-sm text-muted font-bold uppercase">Average response: 2 hours</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {view === 'shuttle-hub' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* BANNER HEADER */}
                                    <div className="bg-surface border border-main rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
                                                    <Bus size={18} />
                                                </div>
                                                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-brand">24h Flotten-Börse</span>
                                            </div>
                                            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-primary">Shuttle Service Hub</h2>
                                            <p className="text-[10px] md:text-xs text-secondary font-bold uppercase tracking-widest mt-1">Sichere dir vorgebuchte Flughafen- & Hotel-Shuttles 24h im Voraus für dein Flotten-Team.</p>
                                        </div>
                                        <button
                                            onClick={() => setView('dashboard')}
                                            className="px-6 py-3.5 bg-brand text-dark-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/20 self-start md:self-auto cursor-pointer"
                                        >
                                            Zurück zum Cockpit
                                        </button>
                                    </div>

                                    {/* SHUTTLE OFFERS LIST */}
                                    <div className="space-y-6">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-secondary ml-2">Vom Manager bestätigte Shuttle-Aufträge</h3>

                                        {/* CARD 1: MANAGER CONFIRMED SHUTTLE 1 */}
                                        <div className="bg-surface border border-emerald-500/40 rounded-[2.5rem] p-6 md:p-8 space-y-6 relative overflow-hidden shadow-2xl">
                                            <div className="absolute top-0 right-0 px-6 py-2 bg-emerald-500/20 border-b border-l border-emerald-500/40 text-emerald-400 rounded-bl-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest flex items-center gap-1.5">
                                                <ShieldCheck size={14} className="text-emerald-400" /> Vom Manager Bestätigt & Freigegeben
                                            </div>

                                            <div className="flex items-center gap-3 pt-4 md:pt-0">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                                    <Bus size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black italic uppercase text-primary">Marcus Vance Delegation</h4>
                                                    <p className="text-[10px] md:text-xs text-emerald-400 font-bold uppercase tracking-wider">📅 Morgen, 28. Sep 2026 • 🕒 15:15 - 15:45 Uhr</p>
                                                </div>
                                            </div>

                                            {/* DETAILS & PASSENGER/LUGGAGE INFO */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dark-950 p-4 rounded-2xl border border-white/5">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-secondary">Abholung & Flug</p>
                                                    <p className="text-sm font-black text-white">📍 Frankfurt Airport Terminal 2</p>
                                                    <p className="text-[10px] text-brand font-bold uppercase">Flug LH 401</p>
                                                </div>
                                                <div className="space-y-1 md:border-l md:border-white/10 md:pl-4">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-secondary">Zieladresse</p>
                                                    <p className="text-sm font-black text-white">🏁 Grand Hotel Frankfurt</p>
                                                    <p className="text-[10px] text-secondary font-semibold uppercase">Hotel Shuttle Transfer</p>
                                                </div>
                                            </div>

                                            {/* CAPACITY BADGE & TEAM STATUS */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-1">
                                                    <span className="text-[10px] font-black uppercase text-emerald-400">👥 Passagiere & 🧳 Koffer</span>
                                                    <p className="text-sm text-primary font-black">5 Passagiere • 7 Koffer</p>
                                                    <p className="text-[9px] text-secondary font-semibold">2 Fahrzeuge vom Manager zugewiesen (Auto-Split)</p>
                                                </div>
                                                <div className="p-4 bg-brand/5 border border-brand/20 rounded-2xl space-y-1">
                                                    <span className="text-[10px] font-black uppercase text-brand">🛡️ Manager Status</span>
                                                    <p className="text-xs text-primary font-bold">Freigabe durch Manager</p>
                                                    <p className="text-[9px] text-secondary font-semibold uppercase">Bereit zur Übernahme im Cockpit</p>
                                                </div>
                                            </div>

                                            {/* TIMING & DISTANCE CALCULATION */}
                                            <div className="space-y-3">
                                                <div className="bg-dark-950 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
                                                    <div className="flex items-center gap-2 text-secondary">
                                                        <Navigation size={14} className="text-brand" />
                                                        <span>Anfahrtsstrecke: <strong className="text-primary">12.8 km</strong> (~20 Min. Fahrzeit)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                                        <Clock size={14} />
                                                        <span>Empfohlene Abfahrt: <strong>14:55 Uhr</strong> • Freigabe max. 1 Std. vor Abholung (ab 14:15 Uhr)</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        const newShuttleMission = {
                                                            id: 'shuttle-split-' + Date.now(),
                                                            customer: 'Marcus Vance Delegation (Shuttle)',
                                                            pickup: 'Frankfurt Airport (FRA T2)',
                                                            dropoff: 'Grand Hotel Frankfurt',
                                                            destination: 'Grand Hotel Frankfurt',
                                                            pickupCoord: { lat: 50.1030, lng: 8.6650 },
                                                            destCoord: { lat: 50.1109, lng: 8.6750 },
                                                            price: 0,
                                                            basePrice: 0,
                                                            distance: '12.8 km',
                                                            status: 'assigned',
                                                            passengerCount: 5,
                                                            bags: 7,
                                                            isShuttle: true,
                                                            flightNo: 'LH 401',
                                                            terminal: 'FRA T2',
                                                            needsSecondVehicle: true,
                                                            startTime: Date.now()
                                                        };
                                                        setActiveMissions(prev => [...prev, newShuttleMission]);
                                                        setRideStatus('active_multi');
                                                        setView('dashboard');
                                                        alert("🤝 SHUTTLE-AUFTRAG ANGENOMMEN!\n\nDer vom Manager bestätigte Shuttle-Auftrag wurde im Cockpit gestartet.");
                                                    }}
                                                    className="w-full py-4 bg-brand text-dark-900 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-2 cursor-pointer"
                                                >
                                                    <Car size={18} /> 🚖 Jetzt zum Abholort starten (Im Cockpit öffnen)
                                                </button>
                                            </div>
                                        </div>

                                        {/* CARD 2: MANAGER CONFIRMED SHUTTLE 2 */}
                                        <div className="bg-surface border border-emerald-500/40 rounded-[2.5rem] p-6 md:p-8 space-y-6 relative overflow-hidden shadow-2xl">
                                            <div className="absolute top-0 right-0 px-6 py-2 bg-emerald-500/20 border-b border-l border-emerald-500/40 text-emerald-400 rounded-bl-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest flex items-center gap-1.5">
                                                <ShieldCheck size={14} className="text-emerald-400" /> Vom Manager Bestätigt & Freigegeben
                                            </div>

                                            <div className="flex items-center gap-3 pt-4 md:pt-0">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                                    <Car size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black italic uppercase text-primary">Lukas Weber Shuttle</h4>
                                                    <p className="text-[10px] md:text-xs text-emerald-400 font-bold uppercase tracking-wider">📅 Morgen, 28. Sep 2026 • 🕒 14:00 - 14:30 Uhr</p>
                                                </div>
                                            </div>

                                            {/* DETAILS & PASSENGER/LUGGAGE INFO */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dark-950 p-4 rounded-2xl border border-white/5">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-secondary">Abholung & Flug</p>
                                                    <p className="text-sm font-black text-white">📍 Frankfurt Airport Terminal 1</p>
                                                    <p className="text-[10px] text-brand font-bold uppercase">Flug LH 402</p>
                                                </div>
                                                <div className="space-y-1 md:border-l md:border-white/10 md:pl-4">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-secondary">Zieladresse</p>
                                                    <p className="text-sm font-black text-white">🏁 Steigenberger Icon Parkhotel</p>
                                                    <p className="text-[10px] text-secondary font-semibold uppercase">Hotel Shuttle Transfer</p>
                                                </div>
                                            </div>

                                            {/* CAPACITY BADGE */}
                                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-emerald-400">👥 Passagiere & 🧳 Koffer</span>
                                                    <p className="text-sm text-primary font-black">3 Passagiere • 4 Koffer</p>
                                                </div>
                                                <span className="text-[9px] text-emerald-400 font-bold uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">✓ Einzel-Fahrzeug Bestätigt</span>
                                            </div>

                                            {/* TIMING & DISTANCE CALCULATION */}
                                            <div className="space-y-3">
                                                <div className="bg-dark-950 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
                                                    <div className="flex items-center gap-2 text-secondary">
                                                        <Navigation size={14} className="text-brand" />
                                                        <span>Anfahrtsstrecke: <strong className="text-primary">14.2 km</strong> (~22 Min. Fahrzeit)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                                        <Clock size={14} />
                                                        <span>Empfohlene Abfahrt: <strong>13:38 Uhr</strong> • Freigabe max. 1 Std. vor Abholung (ab 13:00 Uhr)</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        const newStandardShuttle = {
                                                            id: 'shuttle-std-' + Date.now(),
                                                            customer: 'Lukas Weber (Shuttle)',
                                                            pickup: 'Frankfurt Airport (FRA T1)',
                                                            dropoff: 'Steigenberger Icon Parkhotel',
                                                            destination: 'Steigenberger Icon Parkhotel',
                                                            pickupCoord: { lat: 50.1050, lng: 8.6620 },
                                                            destCoord: { lat: 50.1150, lng: 8.6800 },
                                                            price: 0,
                                                            basePrice: 0,
                                                            distance: '14.2 km',
                                                            status: 'assigned',
                                                            passengerCount: 3,
                                                            bags: 4,
                                                            isShuttle: true,
                                                            flightNo: 'LH 402',
                                                            terminal: 'FRA T1',
                                                            needsSecondVehicle: false,
                                                            startTime: Date.now()
                                                        };
                                                        setActiveMissions(prev => [...prev, newStandardShuttle]);
                                                        setRideStatus('active_multi');
                                                        setView('dashboard');
                                                        alert("🚖 SHUTTLE-AUFTRAG ANGENOMMEN!\n\nDie Fahrt wurde in dein Cockpit übernommen.");
                                                    }}
                                                    className="w-full py-4 bg-brand text-dark-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-brand/20"
                                                >
                                                    <Car size={18} /> 🚖 Jetzt zum Abholort starten (Im Cockpit öffnen)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {view === 'vehicle-hub' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* STATUS BANNER */}
                                    <div className="bg-surface border border-main rounded-[2.5rem] p-8 flex items-center justify-between">
                                        <div>
                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-secondary mb-1">Asset Verification Status</p>
                                            {vehicleInfo?.status === 'approved' ? (
                                                <p className="text-[11px] md:text-sm lg:text-base font-black text-brand flex items-center gap-1.5 uppercase tracking-wider">
                                                    <ShieldCheck size={14} className="text-brand animate-bounce" /> Verified by Admin Portal
                                                </p>
                                            ) : vehicleInfo?.status === 'pending' ? (
                                                <p className="text-[11px] md:text-sm lg:text-base font-black text-amber-400 flex items-center gap-1.5 uppercase tracking-wider animate-pulse">
                                                    <Clock size={14} className="text-amber-400" /> Awaiting Manager Approval
                                                </p>
                                            ) : (
                                                <p className="text-[11px] md:text-sm lg:text-base font-black text-white/50 flex items-center gap-1.5 uppercase tracking-wider">
                                                    <AlertCircle size={14} className="text-white/30" /> Unregistered Asset
                                                </p>
                                            )}
                                        </div>
                                        <div className={`px-3 py-1 text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest rounded-md ${
                                            vehicleInfo?.status === 'approved' ? 'bg-brand/10 border border-brand/20 text-brand' :
                                            vehicleInfo?.status === 'pending' ? 'bg-amber-400/10 border border-amber-400/20 text-amber-400' :
                                            'bg-white/5 border border-white/10 text-white/40'
                                        }`}>
                                            {vehicleInfo?.status === 'approved' ? 'Active Duty' : vehicleInfo?.status === 'pending' ? 'Pending Director' : 'Inactive'}
                                        </div>
                                    </div>

                                    {/* VEHICLE PHOTO UPLOAD AREA */}
                                    <div className="bg-surface border border-main rounded-[2.5rem] p-8 space-y-6">
                                        <div className="flex flex-col items-center text-center space-y-4">
                                            <div className="w-full aspect-[16/9] bg-dark-950 border-2 border-dashed border-main rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group">
                                                {vehicleInfo?.photo ? (
                                                    <>
                                                        <img src={vehicleInfo.photo} className="w-full h-full object-cover" alt="Vehicle" />
                                                        {(!vehicleInfo?.status || vehicleInfo?.status === 'unregistered') && (
                                                            <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                                <Upload size={20} className="text-brand" />
                                                                <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-white">Upload New Shot</span>
                                                                <input 
                                                                    type="file" 
                                                                    accept="image/*"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file) {
                                                                            const reader = new FileReader();
                                                                            reader.onloadend = () => {
                                                                                compressBase64(reader.result, (compressed) => {
                                                                                    setVehicleInfo(prev => ({ ...(prev || {}), photo: compressed }));
                                                                                });
                                                                            };
                                                                            reader.readAsDataURL(file);
                                                                        }
                                                                    }}
                                                                    className="hidden" 
                                                                />
                                                            </label>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center space-y-3">
                                                        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
                                                            <Car size={32} className="text-gray-600" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-primary">Upload Vehicle Shot</p>
                                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-tight">Gallery or Camera roll</p>
                                                        </div>
                                                        <input 
                                                            type="file" 
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                            reader.onloadend = () => {
                                                                                compressBase64(reader.result, (compressed) => {
                                                                                    setVehicleInfo(prev => ({ ...(prev || {}), photo: compressed }));
                                                                                });
                                                                            };
                                                                            reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-4 w-full">
                                                <div className="flex-1 p-4 bg-brand/5 border border-brand/20 rounded-2xl flex items-center justify-center gap-3">
                                                    <Zap size={14} className="text-brand" />
                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-brand">Auto-Verification</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* VEHICLE DATA GRID */}
                                    <div className="bg-surface border border-main rounded-[2.5rem] p-8 space-y-8">
                                        <div className="grid grid-cols-2 gap-6">
                                            {[
                                                { label: 'Manufacturer & Model', field: 'model', placeholder: 'e.g. Tesla Model S' },
                                                { label: 'Year of Production', field: 'year', placeholder: 'e.g. 2024' },
                                                { label: 'License Plate', field: 'plate', placeholder: 'e.g. F-GR-2024' },
                                                { label: 'Vehicle Color', field: 'color', placeholder: 'e.g. Midnight Silver' }
                                            ].map((item) => (
                                                <div key={item.field} className="space-y-2">
                                                    <label className="text-[7px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">{item.label}</label>
                                                    <input 
                                                        type="text"
                                                        disabled={vehicleInfo?.status === 'approved' || vehicleInfo?.status === 'pending'}
                                                        value={vehicleInfo?.[item.field] || ''}
                                                        onChange={(e) => setVehicleInfo(prev => ({ ...(prev || {}), [item.field]: e.target.value }))}
                                                        placeholder={item.placeholder}
                                                        className="w-full bg-dark-950 border border-main rounded-xl px-4 py-3 text-[10px] md:text-xs lg:text-sm font-bold text-primary outline-none focus:border-brand/50 transition-all placeholder:text-gray-700 disabled:opacity-50"
                                                    />
                                                </div>
                                            ))}
                                            {(vehicleInfo?.status === 'approved' || vehicleInfo?.status === 'pending') && (
                                                <div className="space-y-2 col-span-2">
                                                    <label className="text-[7px] font-black text-gray-600 uppercase tracking-[0.2em] ml-1">Sharing Capacity Option</label>
                                                    <div className="w-full bg-dark-950 border border-brand/20 rounded-xl px-4 py-3.5 text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest flex items-center justify-between">
                                                        <span>Option {vehicleInfo?.sharingType || vehicleCapacity || 4} (Max capacity of {vehicleInfo?.sharingType || vehicleCapacity || 4} passengers)</span>
                                                        <span className="text-[7px] text-gray-500 font-bold uppercase tracking-wider">Set by Fleet Manager</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {vehicleInfo?.status === 'approved' ? (
                                            <button 
                                                onClick={() => {
                                                    if (confirm("Are you sure you want to reset this registration? This will revoke active verification status!")) {
                                                        const updated = { ...(vehicleInfo || {}), status: 'unregistered' };
                                                        setVehicleInfo(updated);
                                                        localStorage.setItem('driver_vehicle_data', JSON.stringify(updated));
                                                        if (user?.email) {
                                                            updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                                                                vehicleInfo: null
                                                            }).catch(err => console.error("Error resetting vehicle in Firestore:", err));
                                                        }
                                                    }
                                                }}
                                                className="w-full py-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] md:text-xs lg:text-sm shadow-xl hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                Reset Registration
                                            </button>
                                        ) : vehicleInfo?.status === 'pending' ? (
                                            <button 
                                                onClick={() => {
                                                    const updated = { ...(vehicleInfo || {}), status: 'unregistered' };
                                                    setVehicleInfo(updated);
                                                    localStorage.setItem('driver_vehicle_data', JSON.stringify(updated));
                                                    if (user?.email) {
                                                        updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                                                            vehicleInfo: null
                                                        }).catch(err => console.error("Error recalling vehicle in Firestore:", err));
                                                    }
                                                    alert("APPROVAL REQUEST RECALLED: Reverted back to draft status.");
                                                }}
                                                className="w-full py-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] md:text-xs lg:text-sm shadow-xl hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                Recall Approval Request
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    if (!vehicleInfo?.model || !vehicleInfo?.plate || !vehicleInfo?.year || !vehicleInfo?.color) {
                                                        alert("Please fill out all fields before requesting approval.");
                                                        return;
                                                    }
                                                    const updated = { 
                                                        ...(vehicleInfo || {}), 
                                                        status: 'pending', 
                                                        driverName: `placeHolderName` 
                                                    };
                                                    const dName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || user?.name || 'Driver';
                                                    updated.driverName = dName;
                                                    
                                                    setVehicleInfo(updated);
                                                    localStorage.setItem('driver_vehicle_data', JSON.stringify(updated));
                                                    if (user?.email) {
                                                        updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                                                            vehicleInfo: updated
                                                        })
                                                        .then(() => {
                                                            alert("VEHICLE REGISTRATION INITIATED • Secure approval request dispatched to the GreenRide Admin Portal!");
                                                        })
                                                        .catch(err => {
                                                            console.error("Error updating vehicle in Firestore:", err);
                                                            alert("❌ Failed to request approval.");
                                                        });
                                                    }
                                                }}
                                                className="w-full py-5 bg-brand text-dark-900 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] md:text-xs lg:text-sm shadow-xl shadow-brand/10 hover:shadow-brand/20 active:scale-[0.98] transition-all"
                                            >
                                                Request Admin Approval
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {view === 'profile-pic' && (
                                <div className="space-y-10 flex flex-col items-center py-6">
                                    {/* Hidden real file input for photo upload */}
                                    <input
                                        type="file"
                                        id="profile-pic-view-upload"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                const img = new Image();
                                                img.src = reader.result;
                                                img.onload = () => {
                                                    const canvas = document.createElement('canvas');
                                                    let w = img.width, h = img.height;
                                                    const max = 400;
                                                    if (w > h) { if (w > max) { h = Math.round(h * max / w); w = max; } }
                                                    else { if (h > max) { w = Math.round(w * max / h); h = max; } }
                                                    canvas.width = w; canvas.height = h;
                                                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                                                    const compressed = canvas.toDataURL('image/jpeg', 0.75);
                                                    setTempPhotoPreview(compressed);
                                                    setProfileData(prev => ({ ...prev, avatar: compressed }));
                                                    setHasInitialPic(true);
                                                    // Use the standard handler so the doc appears in Admin Document Hub
                                                    handleUploadDocument('avatar', compressed);
                                                };
                                            };
                                            reader.readAsDataURL(file);
                                            e.target.value = null;
                                        }}
                                    />

                                    {/* Avatar Section */}
                                    <div className="relative group">
                                        <div className="w-40 h-40 rounded-[2.5rem] bg-brand/20 border-4 border-brand/50 p-1.5 shadow-2xl relative overflow-hidden">
                                            <img
                                                src={tempPhotoPreview || profileData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                                                alt="Avatar"
                                                className={`w-full h-full rounded-[2.1rem] bg-dark-800 ${profilePicStatus === 'pending' ? 'grayscale opacity-50' : ''}`}
                                            />

                                            {profilePicStatus === 'pending' && (
                                                <div className="absolute inset-0 bg-[var(--bg-primary)]/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4">
                                                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center mb-2 border border-amber-500/30">
                                                        <Clock className="text-amber-500" size={20} />
                                                    </div>
                                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-amber-500">Awaiting Admin Approval</p>
                                                </div>
                                            )}

                                            {profilePicStatus === 'missing' && (
                                                <div className="absolute inset-0 bg-[var(--bg-primary)]/40 flex flex-col items-center justify-center cursor-pointer" onClick={() => document.getElementById('profile-pic-view-upload').click()}>
                                                    <Upload className="text-primary opacity- mb-1" size={24} />
                                                    <p className="text-[7px] font-black uppercase tracking-widest text-primary opacity-">Tap to Upload</p>
                                                </div>
                                            )}

                                            {profilePicStatus === 'verified' && (
                                                <div className="absolute inset-0 bg-[var(--bg-primary)]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => document.getElementById('profile-pic-view-upload').click()}>
                                                    <Upload className="text-brand" size={40} />
                                                </div>
                                            )}
                                        </div>
                                        {profilePicStatus !== 'pending' && (
                                            <button
                                                onClick={() => document.getElementById('profile-pic-view-upload').click()}
                                                className="absolute -bottom-2 -right-2 w-12 h-12 bg-[var(--brand)] rounded-2xl flex items-center justify-center text-[var(--bg-primary)] shadow-xl ring-4 ring-[var(--bg-primary)] hover:scale-110 transition-transform"
                                            >
                                                <Edit3 size={20} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Personal Data Form */}
                                    <div className="w-full space-y-6 max-w-xl">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-[0.2em] ml-1">First Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="First Name"
                                                    value={profileData.firstName || ''}
                                                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                                                    className="w-full bg-surface border border-main rounded-2xl p-4 text-sm font-bold text-primary focus:border-brand outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-[0.2em] ml-1">Surname</label>
                                                <input
                                                    type="text"
                                                    placeholder="Surname"
                                                    value={profileData.lastName || ''}
                                                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                                                    className="w-full bg-surface border border-main rounded-2xl p-4 text-sm font-bold text-primary focus:border-brand outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-[0.2em] ml-1">Email Address</label>
                                            <input
                                                type="email"
                                                placeholder="email@green.com"
                                                value={profileData.email || ''}
                                                readOnly
                                                className="w-full bg-surface border border-main rounded-2xl p-4 text-sm font-bold text-primary opacity-60 outline-none cursor-not-allowed"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-[0.2em] ml-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                placeholder="+49 151 ..."
                                                value={profileData.phoneNumber || ''}
                                                onChange={(e) => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                                className="w-full bg-surface border border-main rounded-2xl p-4 text-sm font-bold text-primary focus:border-brand outline-none"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-[0.2em] ml-1">Address</label>
                                            <input
                                                type="text"
                                                placeholder="Street and Number"
                                                value={profileData.address || ''}
                                                onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                                                className="w-full bg-surface border border-main rounded-2xl p-4 text-sm font-bold text-primary focus:border-brand outline-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-[0.2em] ml-1">City</label>
                                                <input
                                                    type="text"
                                                    placeholder="City"
                                                    value={profileData.city || ''}
                                                    onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                                                    className="w-full bg-surface border border-main rounded-2xl p-4 text-sm font-bold text-primary focus:border-brand outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-[0.2em] ml-1">Zip Code</label>
                                                <input
                                                    type="text"
                                                    placeholder="Zip Code"
                                                    value={profileData.zipCode || ''}
                                                    onChange={(e) => setProfileData(prev => ({ ...prev, zipCode: e.target.value }))}
                                                    className="w-full bg-surface border border-main rounded-2xl p-4 text-sm font-bold text-primary focus:border-brand outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* SECTION: PERSONALAUSWEIS / PASS (VORDER- & RÜCKSEITE) */}
                                        <div className="p-6 bg-surface border border-main rounded-3xl space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <ShieldCheck size={20} className="text-brand" />
                                                    <div>
                                                        <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-white">Personalausweis / Pass</h4>
                                                        <p className="text-[10px] text-gray-400 font-bold">Vorder- und Rückseite als Foto hochladen (Pflicht)</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    {idCardApproved ? (
                                                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                                            <CheckCircle size={12} /> Verifiziert
                                                        </span>
                                                    ) : (idCardFront || idCardBack) ? (
                                                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                                            <Clock size={12} /> Wartet auf Admin-Freigabe
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider">
                                                            Ausstehend
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                {/* Vorderseite Slot */}
                                                <div className="p-4 bg-dark-900/60 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 relative group">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand">1. Vorderseite</span>
                                                    {idCardFront ? (
                                                        <div className="w-full h-32 rounded-xl overflow-hidden border border-white/10 relative">
                                                            <img src={idCardFront} alt="Ausweis Vorderseite" className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setIdCardFront(null);
                                                                    localStorage.removeItem('driver_id_card_front');
                                                                    syncDriverProfileToCloud({ idCardFront: null });
                                                                }}
                                                                className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-[9px] font-bold"
                                                                title="Entfernen"
                                                            >✕</button>
                                                        </div>
                                                    ) : (
                                                        <label className="w-full h-32 rounded-xl border-2 border-dashed border-white/20 hover:border-brand/60 flex flex-col items-center justify-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.05]">
                                                            <Upload size={24} className="text-gray-400 group-hover:text-brand mb-1 transition-colors" />
                                                            <span className="text-[10px] font-black uppercase text-gray-300">Vorderseite wählen</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleIdCardUpload(e, 'front')}
                                                            />
                                                        </label>
                                                    )}
                                                </div>

                                                {/* Rückseite Slot */}
                                                <div className="p-4 bg-dark-900/60 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 relative group">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand">2. Rückseite</span>
                                                    {idCardBack ? (
                                                        <div className="w-full h-32 rounded-xl overflow-hidden border border-white/10 relative">
                                                            <img src={idCardBack} alt="Ausweis Rückseite" className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setIdCardBack(null);
                                                                    localStorage.removeItem('driver_id_card_back');
                                                                    syncDriverProfileToCloud({ idCardBack: null });
                                                                }}
                                                                className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-[9px] font-bold"
                                                                title="Entfernen"
                                                            >✕</button>
                                                        </div>
                                                    ) : (
                                                        <label className="w-full h-32 rounded-xl border-2 border-dashed border-white/20 hover:border-brand/60 flex flex-col items-center justify-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.05]">
                                                            <Upload size={24} className="text-gray-400 group-hover:text-brand mb-1 transition-colors" />
                                                            <span className="text-[10px] font-black uppercase text-gray-300">Rückseite wählen</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleIdCardUpload(e, 'back')}
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* SECTION: TERMS & CONDITIONS (AGB) */}
                                        <div className="p-6 bg-surface border border-main rounded-3xl space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <FileText size={20} className="text-brand" />
                                                    <div>
                                                        <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-white">Terms & Conditions (AGB)</h4>
                                                        <p className="text-[10px] text-gray-400 font-bold">Plattformrichtlinien & Verhaltenskodex für Fahrpersonal</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    {termsAccepted ? (
                                                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                                            <CheckCircle size={12} /> Akzeptiert
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider">
                                                            Ausstehend
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsTermsModalOpen(true)}
                                                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                                                >
                                                    <FileText size={14} className="text-brand" />
                                                    AGB & Richtlinien lesen
                                                </button>

                                                <label className="flex items-center gap-3 cursor-pointer w-full sm:w-auto p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-brand/40 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={termsAccepted}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setTermsAccepted(checked);
                                                            localStorage.setItem('driver_terms_accepted', checked ? 'true' : 'false');
                                                            syncDriverProfileToCloud({ termsAccepted: checked });
                                                        }}
                                                        className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                                                    />
                                                    <span className="text-xs font-bold text-gray-300">Ich akzeptiere die AGB & Plattformregeln</span>
                                                </label>
                                            </div>
                                        </div>

                                        <button
                                            onClick={async () => {
                                                await syncDriverProfileToCloud();
                                                alert("✅ Fahrer-Profil & Dokumente erfolgreich gespeichert und an Admin übermittelt!");
                                                setView('dashboard');
                                            }}
                                            className="w-full py-5 bg-[var(--brand)] text-[var(--bg-primary)] rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm lg:text-base shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 cursor-pointer"
                                        >
                                            Save Profile Changes
                                        </button>
                                    </div>
                                </div>
                            )}

                            {view === 'settings' && (
                                <div className="space-y-8">
                                    <div className="p-6 bg-surface border border-main rounded-[2.5rem] space-y-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                            <Shield size={80} className="text-brand" />
                                        </div>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-secondary uppercase tracking-widest">Profile Identity</p>
                                        <div className="space-y-6">
                                            <div className="space-y-1.5 px-2">
                                                <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest ml-1">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={userEmail}
                                                    onChange={(e) => setUserEmail(e.target.value)}
                                                    className="w-full bg-surface border border-main rounded-2xl p-4 text-sm font-bold text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all shadow-inner"
                                                />
                                            </div>

                                            <div className="space-y-4 px-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Lock size={14} className="text-brand" />
                                                        <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest">Security Protocol</label>
                                                    </div>
                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-gray-600 tracking-widest">Last changed: 3 months ago</span>
                                                </div>

                                                <button
                                                    onClick={() => setShowSecurityReset(true)}
                                                    className="w-full py-5 bg-surface border-2 border-dashed border-main hover:border-brand/30 hover:bg-brand/5 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all"
                                                >
                                                    <Key size={20} className="text-secondary group-hover:text-brand transition-colors" />
                                                    <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-muted group-hover:text-primary">Request Security Reset</span>
                                                </button>
                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase leading-relaxed text-center px-4">
                                                    Password changes require dual-factor verification via email and SMS for your protection.
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => alert("Identity updated successfully!")}
                                                className="w-full py-4 bg-[var(--brand)] text-[var(--bg-primary)] rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs lg:text-sm shadow-lg shadow-brand/20 active:scale-95 transition-all mt-2"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>

                                    {/* Appearance Settings */}
                                    <div className="p-6 bg-surface border border-main rounded-[2.5rem] space-y-6">
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-secondary uppercase tracking-widest">App Appearance</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setTheme('dark')}
                                                className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${theme === 'dark' ? 'bg-brand/10 border-brand' : 'bg-dark-800 border-main opacity-50'}`}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-dark-950 border border-main flex items-center justify-center text-primary">
                                                    <Zap size={20} />
                                                </div>
                                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest">Dark Mode</span>
                                            </button>
                                            <button
                                                onClick={() => setTheme('light')}
                                                className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${theme === 'light' ? 'bg-brand/10 border-brand shadow-[0_0_20px_rgba(5,150,105,0.1)]' : 'bg-white border-gray-200 text-muted'}`}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-800 shadow-sm">
                                                    <Zap size={20} fill="currentColor" />
                                                </div>
                                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest">Light Mode</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Map Settings */}
                                    <div className="p-6 bg-surface border border-main rounded-[2.5rem] space-y-4">
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-secondary uppercase tracking-widest">Navigation Preference</p>
                                        <div className="grid grid-cols-1 gap-4">
                                            {[
                                                { id: 'google', name: 'Google Maps', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Google_Maps_icon_%282015-2020%29.svg' },
                                                { id: 'apple', name: 'Apple Maps', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Apple_Maps_logo.svg' }
                                            ].map((map) => (
                                                <button
                                                    key={map.id}
                                                    onClick={() => setMapPreference(map.id)}
                                                    className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${mapPreference === map.id ? 'bg-brand/10 border-brand' : 'bg-surface border-main'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white p-2 flex items-center justify-center shadow-lg">
                                                            <img src={map.icon} alt={map.name} className="w-full h-full object-contain" />
                                                        </div>
                                                        <span className={`text-sm font-black italic uppercase tracking-tighter ${mapPreference === map.id ? 'text-primary' : 'text-secondary'}`}>{map.name}</span>
                                                    </div>
                                                    {mapPreference === map.id && <CheckCircle size={16} className="text-brand" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            {/* Terms Denied Block Overlay */}
            <AnimatePresence>
                {termsDenied && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-dark-950 flex flex-col items-center justify-center p-8 text-center"
                    >
                        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-8 border border-red-500/20">
                            <X size={48} strokeWidth={3} />
                        </div>
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase text-primary mb-4">Access Restricted</h2>
                        <p className="max-w-md text-muted font-bold uppercase tracking-widest text-[10px] md:text-xs lg:text-sm leading-relaxed mb-10">
                            You have denied the platform terms & conditions. To ensure safety and legal compliance, you cannot use the Green platform without accepting the agreement.
                        </p>
                        <button
                            onClick={() => setTermsDenied(false)}
                            className="px-10 py-5 bg-brand text-dark-900 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand/20"
                        >
                            Review Terms Again
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Security Reset Confirmation Overlay */}
            <AnimatePresence>
                {showSecurityReset && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[2000] bg-dark-950/90 backdrop-blur-xl flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-sm bg-dark-900 border border-main rounded-[3rem] p-8 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                <ShieldCheck size={100} className="text-brand" />
                            </div>

                            <button 
                                onClick={() => { setShowSecurityReset(false); setResetConfirmed(false); }}
                                className="absolute top-6 right-6 p-2 text-secondary hover:text-primary transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <AnimatePresence mode="wait">
                                {!resetConfirmed ? (
                                    <motion.div
                                        key="request"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand mb-2">
                                                <Key size={24} />
                                            </div>
                                            <h3 className="text-xl font-black italic uppercase tracking-tighter">Request <span className="text-brand">Reset</span></h3>
                                            <p className="text-[10px] md:text-xs lg:text-sm font-bold text-secondary uppercase tracking-widest leading-relaxed">Confirm your identity to receive a secure recovery link.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand uppercase tracking-widest ml-1">Confirm Email</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={14} />
                                                    <input 
                                                        type="email" 
                                                        placeholder="email@example.com"
                                                        value={confirmEmail}
                                                        onChange={(e) => setConfirmEmail(e.target.value)}
                                                        className="w-full bg-dark-800 border border-main rounded-2xl p-4 pl-10 text-xs md:text-sm lg:text-base font-bold text-primary focus:border-brand outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand uppercase tracking-widest ml-1">Confirm Number</label>
                                                <div className="relative">
                                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={14} />
                                                    <input 
                                                        type="tel" 
                                                        placeholder="+49 151 ..."
                                                        value={confirmPhone}
                                                        onChange={(e) => setConfirmPhone(e.target.value)}
                                                        className="w-full bg-dark-800 border border-main rounded-2xl p-4 pl-10 text-xs md:text-sm lg:text-base font-bold text-primary focus:border-brand outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setResetLoading(true);
                                                setTimeout(() => {
                                                    setResetLoading(false);
                                                    setResetConfirmed(true);
                                                }, 1500);
                                            }}
                                            disabled={!confirmEmail || !confirmPhone || resetLoading}
                                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs lg:text-sm transition-all flex items-center justify-center gap-2 ${confirmEmail && confirmPhone ? 'bg-brand text-dark-900 shadow-lg shadow-brand/20 active:scale-95' : 'bg-surface text-secondary border border-main'}`}
                                        >
                                            {resetLoading ? (
                                                <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>Dispatch Recovery Link <Zap size={14} /></>
                                            )}
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-6 space-y-6"
                                    >
                                        <div className="w-16 h-16 bg-brand/10 border border-brand/20 rounded-full flex items-center justify-center text-brand mx-auto">
                                            <CheckCircle size={32} />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black italic uppercase tracking-tighter">Dispatch <span className="text-brand">Success</span></h3>
                                            <p className="text-[10px] md:text-xs lg:text-sm font-bold text-secondary uppercase tracking-widest leading-relaxed">
                                                A secure verification link has been sent to your email and phone number.
                                            </p>
                                            <div className="p-6 bg-brand/5 border border-brand/20 rounded-[2.5rem] relative mt-4 shadow-xl">
                                                <div className="absolute -top-3 left-8 px-3 py-1 bg-brand text-black rounded-full text-[7px] font-black uppercase tracking-widest shadow-lg">Network Protocol 🛰️</div>
                                                <p className="text-[11px] md:text-sm lg:text-base font-black italic text-brand leading-relaxed">Partner Onboarding Active</p>
                                                <p className="text-[9px] md:text-[11px] lg:text-xs text-[var(--text-muted)] mt-1 font-bold">Full business licensing and venue registration will be finalized in the Partner Dashboard.</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-brand/5 border border-brand/10 rounded-2xl">
                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-widest">Development Link:</p>
                                            <a 
                                                href="/security-recovery" 
                                                className="text-[10px] md:text-xs lg:text-sm font-bold text-primary underline hover:text-brand"
                                            >
                                                Open Security Terminal
                                            </a>
                                        </div>
                                        <button
                                            onClick={() => setShowSecurityReset(false)}
                                            className="w-full py-4 bg-surface hover:bg-surface-light rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs lg:text-sm text-muted"
                                        >
                                            Close Terminal
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Unified Mission Lifecycle Sheet */}
            <Sheet 
                isOpen={missionSheetOpen && view === 'dashboard'} 
                onClose={() => setMissionSheetOpen(false)}
                className="max-w-[420px] mx-auto overflow-hidden"
            >
                <div className="max-h-[85vh] overflow-y-auto no-scrollbar pb-10">
                    <AnimatePresence mode="wait">
                        {missionStep === 'confirm' ? (
                            <motion.div 
                                key="confirm"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-8 py-4"
                            >
                                <div className="text-center space-y-3 px-6">
                                    <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center text-brand mx-auto mb-4 border border-brand/20">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Mission Complete?</h3>
                                    <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase tracking-[0.2em] leading-relaxed">
                                        Confirming will finalize the node for <span className="text-primary">{currentSequence[0]?.label.split(': ')[1]}</span>.
                                    </p>
                                </div>

                                <div className="space-y-3 px-2">
                                    <button
                                        onClick={handleCompleteRide}
                                        className="w-full py-5 bg-brand text-dark-900 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs md:text-sm lg:text-base shadow-xl active:scale-95 transition-all"
                                    >
                                        Proceed to Settlement
                                    </button>
                                    <button
                                        onClick={() => setMissionSheetOpen(false)}
                                        className="w-full py-4 bg-surface border border-main rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] md:text-[11px] lg:text-xs text-secondary"
                                    >
                                        Mistake - Go Back
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="summary"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4 py-2"
                            >
                                <div className="text-center">
                                    <h2 className="text-xl font-black italic uppercase tracking-tighter">Mission Accomplished</h2>
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-brand uppercase tracking-[0.2em]">Data Synchronized</p>
                                </div>

                                {/* High-Density Metrics */}
                                <div className="grid grid-cols-2 gap-2 px-2">
                                    <div className="bg-surface p-3 rounded-xl border border-main">
                                        <p className="text-[6px] font-black text-secondary uppercase mb-0.5">Fare</p>
                                        <p className="text-lg font-black italic text-primary">€{lastCompletedRide?.finalAmount?.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-brand/10 p-3 rounded-xl border border-brand/20 relative overflow-hidden">
                                        <Zap size={8} className="absolute top-2 right-2 text-brand opacity-40" />
                                        <p className="text-[6px] font-black text-brand uppercase mb-0.5">Bonus</p>
                                        <p className="text-lg font-black italic text-brand">€72.50</p>
                                    </div>
                                </div>

                                {/* Mandatory Vibe Check - High Density */}
                                <div className="bg-dark-950/40 border border-main rounded-2xl p-4 space-y-3 mx-2">
                                    <div className="flex justify-between items-center px-1">
                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-muted uppercase tracking-widest">Rate Vibe</p>
                                        <span className="text-[7px] text-gray-600 font-bold uppercase italic">Required</span>
                                    </div>

                                    <div className="grid grid-cols-5 gap-1.5">
                                        {[
                                            { emoji: '😊', id: 'friendly' },
                                            { emoji: '🤫', id: 'silent' },
                                            { emoji: '😇', id: 'polite' },
                                            { emoji: '⌚', id: 'punctual' },
                                            { emoji: '🛡️', id: 'safety' }
                                        ].map((vibe) => (
                                            <button 
                                                key={vibe.id}
                                                onClick={() => {
                                                    setSelectedEmojis(prev => 
                                                        prev.includes(vibe.id) ? prev.filter(i => i !== vibe.id) : [...prev, vibe.id]
                                                    );
                                                }}
                                                className={`flex items-center justify-center h-10 rounded-lg border-2 transition-all ${selectedEmojis.includes(vibe.id) ? 'bg-brand/20 border-brand' : 'bg-surface border-transparent opacity-40'}`}
                                            >
                                                <span className="text-xl">{vibe.emoji}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 px-2">
                                    <button 
                                        onClick={finalizeMission}
                                        className="w-full py-5 bg-brand text-dark-900 rounded-2xl font-black uppercase tracking-[0.15em] italic text-[11px] md:text-sm lg:text-base shadow-lg shadow-brand/20 active:scale-95 transition-all"
                                    >
                                        Complete & Sync: €{(lastCompletedRide?.finalAmount + 72.50).toFixed(2)}
                                    </button>
                                    <button 
                                        onClick={() => setMissionStep('confirm')}
                                        className="w-full py-2.5 bg-surface rounded-xl font-black uppercase tracking-widest text-[8px] md:text-[10px] lg:text-xs text-secondary hover:text-primary"
                                    >
                                        ↩ Resume Trip
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Sheet>

            {/* Incoming Ride Notification - High Visibility Refactor */}
            <AnimatePresence>
                {incomingRide && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[190]"
                            onClick={() => setIncomingRide(null)}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[420px] z-[200]"
                        >
                            <div className={`bg-[#1a1c1e] border-2 rounded-[2.5rem] p-8 text-primary shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden ${
                                incomingRide.rideType === 'premium' ? 'border-amber-500/50 shadow-amber-500/10' : 
                                incomingRide.rideType === 'max' ? 'border-white/50 shadow-white/5' : 
                                incomingRide.rideType === 'green' ? 'border-emerald-500/50 shadow-emerald-500/10' : 
                                'border-blue-500/50 shadow-blue-500/10'
                            }`}>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                                <div className="relative z-10 flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${
                                            incomingRide.rideType === 'premium' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 
                                            incomingRide.rideType === 'max' ? 'bg-white/10 text-white border-white/20' : 
                                            incomingRide.rideType === 'green' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 
                                            'bg-blue-500/20 text-blue-500 border-blue-500/30'
                                        }`}>
                                            {incomingRide.rideType === 'premium' ? <Star size={28} /> : 
                                             incomingRide.rideType === 'max' ? <Briefcase size={28} /> : 
                                             incomingRide.rideType === 'green' ? <Zap size={28} /> : 
                                             <Users size={28} />}
                                        </div>
                                        <div>
                                            <p className={`text-[11px] md:text-sm lg:text-base font-black uppercase tracking-[0.2em] ${
                                                incomingRide.rideType === 'premium' ? 'text-amber-500' : 
                                                incomingRide.rideType === 'max' ? 'text-white' : 
                                                incomingRide.rideType === 'green' ? 'text-emerald-500' : 
                                                'text-blue-500'
                                            }`}>
                                                {incomingRide.rideType.toUpperCase()} MISSION
                                            </p>
                                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                                                {incomingRide.rideType === 'premium' ? 'Direct Route' : 
                                                 incomingRide.rideType === 'shared pool' ? 'Shared Hub' : 'Green Transit'}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-secondary mb-1 opacity-80">Base Payout</p>
                                        <p className="text-3xl font-black text-white tracking-tighter">€{incomingRide.price}</p>
                                    </div>
                                </div>

                                <div className="relative z-10 grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-dark-900/50 backdrop-blur-md p-4 rounded-3xl border border-main">
                                        <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest mb-2 opacity-80">Max Occupancy</p>
                                        <div className="flex items-center gap-2 text-white">
                                            <User size={16} />
                                            <span className="text-base font-black">{incomingRide.capacity} Seats</span>
                                        </div>
                                    </div>
                                    <div className="bg-dark-900/50 backdrop-blur-md p-4 rounded-3xl border border-main">
                                        <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest mb-2 opacity-80">Green Bonus</p>
                                        <div className={`flex items-center gap-2 ${
                                            incomingRide.rideType === 'premium' ? 'text-amber-500' : 
                                            incomingRide.rideType === 'max' ? 'text-white' : 
                                            incomingRide.rideType === 'green' ? 'text-emerald-500' : 
                                            'text-blue-500'
                                        }`}>
                                            <TrendingUp size={16} />
                                            <span className="text-base font-black">+{incomingRide.rideType === 'max' ? '250%' : (incomingRide.rideType === 'green' ? '180%' : '100%')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative z-10 space-y-4 mb-10">
                                    <div className="flex items-center gap-4 bg-dark-900/50 p-4 rounded-3xl border border-main/50">
                                        <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                                            <Navigation size={18} className="text-brand" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest opacity-80">Pickup Location</p>
                                            <p className="text-sm font-bold truncate text-white">{incomingRide.pickup}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-dark-900/50 p-4 rounded-3xl border border-main/50">
                                        <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                                            <MapPin size={18} className="text-orange-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest opacity-80">Destination</p>
                                            <p className="text-sm font-bold truncate text-white">{incomingRide.destination}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative z-10 flex gap-4 mt-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            if (socket && incomingRide) {
                                                socket.emit('reject-ride', { passengerId: incomingRide.passengerId || incomingRide.id });
                                            }
                                            setIncomingRide(null);
                                        }}
                                        className="flex-1 py-5 bg-white/5 border border-white/20 rounded-2xl font-black text-xs md:text-sm lg:text-base uppercase tracking-widest transition-all text-white/70 hover:text-white"
                                    >
                                        Dismiss
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(255,255,255,0.4)" }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleAcceptRide}
                                        className="flex-[2] py-5 bg-white text-[#000000] rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                    >
                                        Accept & Launch
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* TACTICAL DRIVER PROFILE EDITOR SHEET */}
            <Sheet
                isOpen={profileSheetOpen}
                onClose={() => setProfileSheetOpen(false)}
                title="Driver Identity Profile"
            >
                <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1 no-scrollbar pb-6">
                    {/* Header Intro */}
                    <div className="p-4 bg-brand/5 border border-brand/20 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand mb-1">Telemetry Status</p>
                            <p className="text-[12px] font-bold text-primary">Verify and update your professional identity profile.</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center animate-pulse">
                            <ShieldCheck className="text-brand" size={16} />
                        </div>
                    </div>

                    {/* Profile Picture Upload Section */}
                    <div className="flex flex-col items-center gap-4 p-6 bg-white/5 border border-white/5 rounded-3xl text-center relative group">
                        <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-brand/40 group-hover:border-brand transition-all shadow-[0_0_30px_rgba(0,212,255,0.2)]">
                            <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload size={20} className="text-brand" />
                                <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-white">Upload Photo</span>
                            </label>
                            <input 
                                type="file" 
                                id="avatar-upload" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setProfileData(prev => ({ ...prev, avatar: reader.result }));
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-black italic tracking-tighter uppercase text-white leading-tight">
                                {profileData.firstName} {profileData.lastName}
                            </h3>
                            <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand uppercase tracking-widest mt-1">Active Duty Driver</p>
                        </div>
                    </div>

                    {/* Details Input Form */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-white/40 uppercase tracking-widest px-2">First Name</label>
                                <input 
                                    type="text" 
                                    value={profileData.firstName}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[12px] font-bold text-white focus:outline-none focus:border-brand/50 transition-all placeholder:text-white/10"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-white/40 uppercase tracking-widest px-2">Last Name</label>
                                <input 
                                    type="text" 
                                    value={profileData.lastName}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[12px] font-bold text-white focus:outline-none focus:border-brand/50 transition-all placeholder:text-white/10"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-white/40 uppercase tracking-widest px-2">Email Address</label>
                            <input 
                                type="email" 
                                value={profileData.email}
                                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[12px] font-bold text-white focus:outline-none focus:border-brand/50 transition-all placeholder:text-white/10"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-white/40 uppercase tracking-widest px-2">Phone Number</label>
                            <input 
                                type="text" 
                                value={profileData.phoneNumber}
                                onChange={(e) => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[12px] font-bold text-white focus:outline-none focus:border-brand/50 transition-all placeholder:text-white/10"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-white/40 uppercase tracking-widest px-2">Street Address</label>
                            <input 
                                type="text" 
                                value={profileData.address}
                                onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[12px] font-bold text-white focus:outline-none focus:border-brand/50 transition-all placeholder:text-white/10"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1 space-y-1">
                                <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-white/40 uppercase tracking-widest px-2">Zip Code</label>
                                <input 
                                    type="text" 
                                    value={profileData.zipCode}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, zipCode: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[12px] font-bold text-white focus:outline-none focus:border-brand/50 transition-all placeholder:text-white/10"
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-white/40 uppercase tracking-widest px-2">City</label>
                                <input 
                                    type="text" 
                                    value={profileData.city}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[12px] font-bold text-white focus:outline-none focus:border-brand/50 transition-all placeholder:text-white/10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-2">
                        <button 
                            onClick={() => setProfileSheetOpen(false)}
                            className="flex-1 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-xs md:text-sm lg:text-base uppercase tracking-widest text-white/60 hover:text-white transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => {
                                setProfileSheetOpen(false);
                                alert("TELEMETRY SYNCED: Profile successfully saved to GreenRide Mainframe!");
                            }}
                            className="flex-[2] py-5 bg-white text-black rounded-2xl font-black text-xs md:text-sm lg:text-base uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                        >
                            Save Profile
                        </button>
                    </div>
                </div>
            </Sheet>

            {/* TACTICAL DRIVER VEHICLE REGISTRATION SHEET */}
            <Sheet
                isOpen={vehicleSheetOpen}
                onClose={() => setVehicleSheetOpen(false)}
                title="Active Asset Registration"
            >
                <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1 no-scrollbar pb-6">
                    {/* Status Banner */}
                    <div className="p-4 rounded-2xl flex items-center justify-between border transition-all duration-300 bg-black/45 border-white/10">
                        <div>
                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-secondary mb-1">Asset Verification Status</p>
                            {vehicleInfo?.status === 'approved' ? (
                                <p className="text-[12px] font-black text-brand flex items-center gap-1.5 uppercase tracking-wider">
                                    <ShieldCheck size={14} className="text-brand animate-bounce" /> Verified by Khiam Azizi
                                </p>
                            ) : vehicleInfo?.status === 'pending' ? (
                                <p className="text-[12px] font-black text-amber-400 flex items-center gap-1.5 uppercase tracking-wider animate-pulse">
                                    <Clock size={14} className="text-amber-400" /> Awaiting Approval by Khiam Azizi
                                </p>
                            ) : (
                                <p className="text-[12px] font-black text-white/50 flex items-center gap-1.5 uppercase tracking-wider">
                                    <AlertCircle size={14} className="text-white/30" /> Unregistered Asset
                                </p>
                            )}
                        </div>
                        <div className={`px-3 py-1 text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest rounded-md ${
                            vehicleInfo?.status === 'approved' ? 'bg-brand/10 border border-brand/20 text-brand' :
                            vehicleInfo?.status === 'pending' ? 'bg-amber-400/10 border border-amber-400/20 text-amber-400' :
                            'bg-white/5 border border-white/10 text-white/40'
                        }`}>
                            {vehicleInfo?.status === 'approved' ? 'Active Duty' : vehicleInfo?.status === 'pending' ? 'Pending Director' : 'Inactive'}
                        </div>
                    </div>

                    {/* Vehicle Photo Area */}
                    <div className="w-full aspect-[16/9] bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group">
                        {vehicleInfo?.photo ? (
                            <>
                                <img src={vehicleInfo.photo} className="w-full h-full object-cover" alt="Vehicle preview" />
                                {vehicleInfo?.status === 'unregistered' && (
                                    <label htmlFor="vehicle-photo-upload" className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Upload size={20} className="text-brand" />
                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-white">Upload New Shot</span>
                                    </label>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center space-y-3 p-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                    <Car size={32} className="text-white/40" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-primary">Upload Vehicle Shot</p>
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-tight">Camera or gallery image</p>
                                </div>
                            </div>
                        )}
                        {vehicleInfo?.status === 'unregistered' && (
                            <input 
                                type="file" 
                                id="vehicle-photo-upload" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setVehicleInfo(prev => {
                                                const updated = { ...(prev || {}), photo: reader.result };
                                                localStorage.setItem('driver_vehicle_data', JSON.stringify(updated));
                                                return updated;
                                            });
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        )}
                    </div>

                    {/* Details Input Form */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-white/40 uppercase tracking-widest px-2">Manufacturer & Model</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Tesla Model Y"
                                disabled={vehicleInfo?.status !== 'unregistered'}
                                value={vehicleInfo?.model || ''}
                                onChange={(e) => setVehicleInfo(prev => {
                                    const updated = { ...(prev || {}), model: e.target.value };
                                    localStorage.setItem('driver_vehicle_data', JSON.stringify(updated));
                                    return updated;
                                })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[12px] font-bold text-white focus:outline-none focus:border-brand/50 transition-all placeholder:text-white/10 disabled:opacity-50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-white/40 uppercase tracking-widest px-2">License Plate (Kennzeichen)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. F-GR-2026"
                                    disabled={vehicleInfo?.status !== 'unregistered'}
                                    value={vehicleInfo?.plate || ''}
                                    onChange={(e) => setVehicleInfo(prev => {
                                        const updated = { ...(prev || {}), plate: e.target.value.toUpperCase() };
                                        localStorage.setItem('driver_vehicle_data', JSON.stringify(updated));
                                        return updated;
                                    })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[12px] font-bold text-white focus:outline-none focus:border-brand/50 transition-all placeholder:text-white/10 disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-white/40 uppercase tracking-widest px-2">Build Year (Baujahr)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 2025"
                                    disabled={vehicleInfo?.status !== 'unregistered'}
                                    value={vehicleInfo?.year || ''}
                                    onChange={(e) => setVehicleInfo(prev => {
                                        const updated = { ...(prev || {}), year: e.target.value };
                                        localStorage.setItem('driver_vehicle_data', JSON.stringify(updated));
                                        return updated;
                                    })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[12px] font-bold text-white focus:outline-none focus:border-brand/50 transition-all placeholder:text-white/10 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-white/40 uppercase tracking-widest px-2">Vehicle Color</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Midnight Blue"
                                disabled={vehicleInfo?.status !== 'unregistered'}
                                value={vehicleInfo?.color || ''}
                                onChange={(e) => setVehicleInfo(prev => {
                                    const updated = { ...(prev || {}), color: e.target.value };
                                    localStorage.setItem('driver_vehicle_data', JSON.stringify(updated));
                                    return updated;
                                })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[12px] font-bold text-white focus:outline-none focus:border-brand/50 transition-all placeholder:text-white/10 disabled:opacity-50"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2">
                        {vehicleInfo?.status === 'approved' ? (
                            <div className="space-y-3">
                                <div className="p-4 bg-brand/5 border border-brand/20 rounded-2xl text-center">
                                    <p className="text-[10px] md:text-xs lg:text-sm font-bold text-brand uppercase tracking-wider">⚡ ASSET REGISTERED & TELEMETRY LIVE</p>
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-semibold text-white/40 mt-1 uppercase">Ready for premium dispatch operations</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        if (confirm("Are you sure you want to reset this registration? This will revoke active verification status!")) {
                                            const updated = { ...(vehicleInfo || {}), status: 'unregistered' };
                                            setVehicleInfo(updated);
                                            localStorage.setItem('driver_vehicle_data', JSON.stringify(updated));
                                            if (user?.email) {
                                                updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                                                    vehicleInfo: null
                                                }).catch(err => console.error("Error resetting vehicle in Firestore:", err));
                                            }
                                        }
                                    }}
                                    className="w-full py-5 bg-white/5 border border-white/10 text-white/60 hover:text-white rounded-2xl font-black text-xs md:text-sm lg:text-base uppercase tracking-widest transition-all"
                                >
                                    Reset Registration
                                </button>
                            </div>
                        ) : vehicleInfo?.status === 'pending' ? (
                            <div className="space-y-3">
                                <div className="p-4 bg-amber-400/5 border border-amber-400/20 rounded-2xl text-center animate-pulse">
                                    <p className="text-[10px] md:text-xs lg:text-sm font-bold text-amber-400 uppercase tracking-wider">⏳ PENDING VERIFICATION</p>
                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-semibold text-white/40 mt-1 uppercase">Awaiting manual release inside staff dashboard</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        const updated = { ...(vehicleInfo || {}), status: 'unregistered' };
                                        setVehicleInfo(updated);
                                        localStorage.setItem('driver_vehicle_data', JSON.stringify(updated));
                                        if (user?.email) {
                                            updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                                                vehicleInfo: null
                                            }).catch(err => console.error("Error recalling vehicle in Firestore:", err));
                                        }
                                        alert("APPROVAL REQUEST RECALLED: Reverted back to draft status.");
                                    }}
                                    className="w-full py-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-black text-xs md:text-sm lg:text-base uppercase tracking-widest transition-all hover:bg-red-500 hover:text-white"
                                >
                                    Recall Approval Request
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setVehicleSheetOpen(false)}
                                    className="flex-1 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-xs md:text-sm lg:text-base uppercase tracking-widest text-white/60 hover:text-white transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        if (!vehicleInfo?.model || !vehicleInfo?.plate || !vehicleInfo?.year || !vehicleInfo?.color) {
                                            alert("Please fill out all fields before requesting approval.");
                                            return;
                                        }
                                        const updated = { ...(vehicleInfo || {}), status: 'pending', driverName: `${profileData.firstName} ${profileData.lastName}` };
                                        setVehicleInfo(updated);
                                        localStorage.setItem('driver_vehicle_data', JSON.stringify(updated));
                                        if (user?.email) {
                                            updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                                                vehicleInfo: updated
                                            }).catch(err => console.error("Error updating vehicle in Firestore:", err));
                                        }
                                        setVehicleSheetOpen(false);
                                        alert("VEHICLE REGISTRATION INITIATED • Secure approval request dispatched to the GreenRide Admin Portal! Awaiting verification by Chief Director Khiam Azizi.");
                                    }}
                                    className="flex-[2] py-5 bg-white text-black rounded-2xl font-black text-xs md:text-sm lg:text-base uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                >
                                    Request Admin Approval
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Sheet>

                        {/* DOCUMENT LOCK MODAL (PREVENTS GOING ONLINE WITHOUT UPLOADED DOCUMENTS) */}
            <AnimatePresence>
                {showDocLockModal && (
                    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.9 }} 
                            className="bg-[#0b0f19] border-2 border-amber-500/50 rounded-[2.5rem] p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl text-white text-center relative overflow-hidden"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                                <ShieldAlert size={34} />
                            </div>

                            <div className="space-y-2">
                                <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-300">
                                    Gesetzliche Freischaltung erforderlich
                                </div>
                                <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-white">
                                    Online-Schaltung gesperrt
                                </h3>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    Sie können erst online gehen und Fahraufträge annehmen, wenn Ihre erforderlichen Dokumente hochgeladen wurden gem. § 48 FeV & PBefG.
                                </p>
                            </div>

                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2.5 text-left text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-200">1. Führerschein (Klasse B)</span>
                                    {driverDocs.some(d => d.id === 'license' && (d.file || d.fileUrl || d.status === 'verified' || d.status === 'pending')) ? (
                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">Vorhanden</span>
                                    ) : (
                                        <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded font-bold">Fehlt noch</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-200">2. P-Schein (§ 48 FeV)</span>
                                    {driverDocs.some(d => d.id === 'pschein' && (d.file || d.fileUrl || d.status === 'verified' || d.status === 'pending')) ? (
                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">Vorhanden</span>
                                    ) : (
                                        <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded font-bold">Fehlt noch</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-200">3. Personalausweis / Pass</span>
                                    {driverDocs.some(d => d.id === 'idcard' && (d.file || d.fileUrl || d.status === 'verified' || d.status === 'pending')) ? (
                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">Vorhanden</span>
                                    ) : (
                                        <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded font-bold">Empfohlen</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <button 
                                    onClick={() => {
                                        setShowDocLockModal(false);
                                        setDocumentsSheetOpen(true);
                                    }}
                                    className="w-full py-3.5 bg-brand text-dark-900 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-brand/90 transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Upload size={16} /> Dokumente jetzt hochladen
                                </button>
                                <button 
                                    onClick={() => setShowDocLockModal(false)}
                                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                    Abbrechen
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* TACTICAL DRIVER DOCUMENT VAULT SHEET */}
            <Sheet
                isOpen={documentsSheetOpen}
                onClose={() => setDocumentsSheetOpen(false)}
                title="Compliance & Document Vault"
            >
                <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1 no-scrollbar pb-6">
                    {/* Security Badge */}
                    <div className="p-4 rounded-2xl flex items-center justify-between border transition-all duration-300 bg-black/45 border-white/10">
                        <div>
                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-secondary mb-1">Vault Security Level</p>
                            <p className="text-[12px] font-black text-brand flex items-center gap-1.5 uppercase tracking-wider">
                                <ShieldCheck size={14} className="text-brand" /> AES-256 Military Grade Encryption
                            </p>
                        </div>
                        <div className="px-3 py-1 text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest rounded-md bg-brand/10 border border-brand/20 text-brand">
                            SECURE
                        </div>
                    </div>

                    {/* Document List */}
                    <div className="space-y-4">
                        {driverDocs.map((doc) => (
                            <div key={doc.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-white/20 transition-all flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black italic text-white uppercase tracking-tight">{doc.name}</p>
                                            <span className={`px-2 py-0.5 text-[8px] md:text-[10px] lg:text-xs font-black rounded uppercase tracking-wider ${
                                                doc.status === 'verified' ? 'bg-brand/15 border border-brand/20 text-brand' :
                                                doc.status === 'pending' ? 'bg-amber-400/15 border border-amber-400/20 text-amber-400 animate-pulse' :
                                                'bg-red-500/15 border border-red-500/20 text-red-400'
                                            }`}>
                                                {doc.status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-medium text-white/40 uppercase tracking-widest">{doc.requirement}</p>
                                    </div>

                                    {/* Upload/Action Button */}
                                    {doc.id !== 'terms' && (
                                        <div className="relative">
                                            <input 
                                                type="file"
                                                accept="image/*"
                                                id={`file-input-${doc.id}`}
                                                className="hidden"
                                                disabled={doc.status === 'verified'}
                                                                                                 onChange={(e) => {
                                                     const file = e.target.files[0];
                                                     if (!file) return;
                                                     if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                                                         alert("⚠️ PDF files are not supported because they are too large for the database. Please take a photo of your P-Schein (JPG/PNG) and upload it instead.");
                                                         e.target.value = null;
                                                         return;
                                                     }
                                                     const reader = new FileReader();
                                                     reader.onloadend = () => {
                                                         compressBase64(reader.result, (compressed) => {
                                                             const updatedDocs = driverDocs.map(d => 
                                                                 d.id === doc.id ? { ...d, status: 'pending', file: compressed } : d
                                                             );
                                                             setDriverDocs(updatedDocs);
                                                             localStorage.setItem('driver_compliance_docs', JSON.stringify(updatedDocs));
                                                             if (user?.email) {
                                                                 updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                                                                     driverComplianceDocs: updatedDocs
                                                                 }).catch(err => console.error("Error updating driverComplianceDocs in Firestore:", err));
                                                             }
                                                             alert(`Document uploaded for ${doc.name} • Dispatched for manual audit!`);
                                                         });
                                                     };
                                                     reader.readAsDataURL(file);
                                                 }}
                                            />
                                            <button
                                                onClick={() => {
                                                    if (doc.status === 'verified') return;
                                                    document.getElementById(`file-input-${doc.id}`).click();
                                                }}
                                                className={`px-4 py-2 text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                                                    doc.status === 'verified'
                                                        ? 'bg-brand/10 text-brand cursor-default'
                                                        : 'bg-white text-black hover:scale-105 active:scale-95'
                                                }`}
                                            >
                                                {doc.status === 'verified' ? 'Verified' : doc.file ? 'Replace File' : 'Upload File'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* File Preview / Thumbnail */}
                                {doc.file && (
                                    <div className="relative w-24 h-16 bg-black/40 rounded-lg overflow-hidden border border-white/10 group">
                                        <img src={doc.file} className="w-full h-full object-cover" alt="Verification preview" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-wider text-white">Preview</span>
                                        </div>
                                    </div>
                                )}

                                {/* Custom UI for Terms & Conditions Checkbox */}
                                {doc.id === 'terms' && (
                                    <div className="flex items-start gap-3 mt-1 p-3 bg-white/5 border border-white/5 rounded-xl hover:border-brand/20 transition-all">
                                        <input
                                            type="checkbox"
                                            id="terms-checkbox"
                                            disabled={doc.status === 'verified'}
                                            checked={doc.status === 'verified'}
                                            onChange={(e) => {
                                                const accepted = e.target.checked;
                                                const updatedDocs = driverDocs.map(d => 
                                                    d.id === 'terms' ? { ...d, status: accepted ? 'verified' : 'missing' } : d
                                                );
                                                setDriverDocs(updatedDocs);
                                                localStorage.setItem('driver_compliance_docs', JSON.stringify(updatedDocs));
                                                if (user?.email) {
                                                    updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                                                        driverComplianceDocs: updatedDocs
                                                    }).catch(err => console.error("Error updating terms in Firestore:", err));
                                                }
                                            }}
                                            className="w-4 h-4 mt-0.5 rounded border-white/10 bg-white/5 text-brand focus:ring-0 focus:ring-offset-0"
                                        />
                                        <label htmlFor="terms-checkbox" className="text-[11px] md:text-sm lg:text-base font-bold text-white/60 leading-normal uppercase cursor-pointer select-none">
                                            I accept the GreenRide Partner Terms & Platform Data Usage Agreement.
                                        </label>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Summary Info */}
                    <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
                        {driverDocs.every(d => d.status === 'verified') ? (
                            <div className="p-4 bg-brand/5 border border-brand/20 rounded-2xl text-center">
                                <p className="text-[10px] md:text-xs lg:text-sm font-bold text-brand uppercase tracking-wider">👑 COMPLIANCE ACTIVE • SERVICE PERMITTED</p>
                                <p className="text-[8px] md:text-[10px] lg:text-xs font-semibold text-white/40 mt-1 uppercase">All strategic documentation is cleared by administration</p>
                            </div>
                        ) : driverDocs.some(d => d.status === 'pending') ? (
                            <div className="p-4 bg-amber-400/5 border border-amber-400/20 rounded-2xl text-center animate-pulse">
                                <p className="text-[10px] md:text-xs lg:text-sm font-bold text-amber-400 uppercase tracking-wider">⏳ MANUAL COMPLIANCE AUDIT ACTIVE</p>
                                <p className="text-[8px] md:text-[10px] lg:text-xs font-semibold text-white/40 mt-1 uppercase">Director Khiam Azizi is reviewing pending documents</p>
                            </div>
                        ) : (
                            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-center">
                                <p className="text-[10px] md:text-xs lg:text-sm font-bold text-red-400 uppercase tracking-wider">⚠️ COMPLIANCE DEFICIT DETECTED</p>
                                <p className="text-[8px] md:text-[10px] lg:text-xs font-semibold text-white/40 mt-1 uppercase">Upload all required credentials to activate dispatch access</p>
                            </div>
                        )}

                        {user?.email?.toLowerCase() !== 'driver@green.de' && (
                            <button
                                onClick={() => {
                                    const verifiedDocs = driverDocs.map(d => ({ ...d, status: 'verified' }));
                                    setDriverDocs(verifiedDocs);
                                    localStorage.setItem('driver_compliance_docs', JSON.stringify(verifiedDocs));
                                    
                                    const verifiedVehicleDocs = vehicleDocs.map(v => ({ ...v, status: 'verified' }));
                                    setVehicleDocs(verifiedVehicleDocs);
                                    localStorage.setItem('driver_vehicle_docs', JSON.stringify(verifiedVehicleDocs));

                                    const verifiedVehicleInfo = { ...(vehicleInfo || {}), status: 'approved' };
                                    setVehicleInfo(verifiedVehicleInfo);
                                    localStorage.setItem('driver_vehicle_data', JSON.stringify(verifiedVehicleInfo));

                                    alert("SANDBOX BYPASS: All compliance documents & vehicle assets have been instantly APPROVED/VERIFIED!");
                                }}
                                className="w-full py-3 bg-[var(--brand)]/10 border border-[var(--brand)]/35 text-[var(--brand)] rounded-2xl font-black text-[10px] md:text-xs lg:text-sm uppercase tracking-wider hover:bg-[var(--brand)] hover:text-dark-900 transition-all mb-2"
                            >
                                Sandbox: Approve All Credentials
                            </button>
                        )}

                        <button 
                            onClick={() => setDocumentsSheetOpen(false)}
                            className="w-full py-5 bg-white text-black hover:scale-[1.01] active:scale-[0.99] rounded-2xl font-black text-xs md:text-sm lg:text-base uppercase tracking-widest transition-all"
                        >
                            Return to Cockpit
                        </button>
                    </div>
                </div>
            </Sheet>

            <PostsFeed isOpen={showPosts} onClose={() => setShowPosts(false)} />

            {/* Double Approval Pool Match Request Modal */}
            <AnimatePresence>
                {showPoolRequest && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        className="fixed inset-x-4 top-1/4 z-[100] bg-[#1A1A1A] rounded-[2rem] border-2 border-[var(--brand)] shadow-[0_20px_60px_-15px_rgba(52,211,153,0.4)] overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-5 mb-5 border-b border-white/10 pb-4">
                                <div className="w-16 h-16 rounded-2xl border-2 border-[var(--brand)] overflow-hidden shrink-0 shadow-inner">
                                    <img src={showPoolRequest.image} alt={showPoolRequest.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="text-[10px] md:text-xs lg:text-sm text-[var(--brand)] font-black uppercase tracking-widest mb-1 animate-pulse">Route Deviation Request</div>
                                    <h3 className="text-white font-black text-xl italic leading-tight">{showPoolRequest.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-1 opacity-80">
                                        <Star className="w-3.5 h-3.5 text-[var(--brand)] fill-current" />
                                        <span className="text-[var(--brand)] text-sm font-bold">{showPoolRequest.rating} Rating</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-gray-300 text-sm font-medium mb-5 leading-relaxed">
                                A new passenger requested a shared ride along your current route. Do you approve the route deviation?
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => {
                                        socket?.emit('pool-match-response', { role: 'driver', originalPassengerId: user?.email || 'alex-passenger-id', accepted: false });
                                        setShowPoolRequest(null);
                                    }}
                                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3.5 rounded-xl font-bold text-sm transition-colors"
                                >
                                    Decline
                                </button>
                                <button 
                                    onClick={() => {
                                        socket?.emit('pool-match-response', { role: 'driver', originalPassengerId: user?.email || 'alex-passenger-id', accepted: true });
                                        setShowPoolRequest(null);
                                    }}
                                    className="flex-1 bg-[var(--brand)] hover:brightness-110 text-black py-3.5 rounded-xl font-black text-sm uppercase tracking-wide transition-all shadow-[0_0_20px_rgba(52,211,153,0.2)]"
                                >
                                    Approve Route
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        
            {/* TERMS & CONDITIONS MODAL */}
            <AnimatePresence>
                {isTermsModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0b0f19] border border-brand/30 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl text-white max-h-[85vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <div className="flex items-center gap-3">
                                    <FileText className="text-brand" size={24} />
                                    <div>
                                        <h3 className="text-lg font-black uppercase tracking-tight text-white">AGB & Richtlinien für Fahrpersonal</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Grien Mobility Operations GmbH</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsTermsModalOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
                                >✕</button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-xs md:text-sm text-gray-300 leading-relaxed font-normal">
                                <section className="space-y-1">
                                    <h4 className="font-bold text-white uppercase text-xs">§ 1 Geltungsbereich & Status</h4>
                                    <p>Als registrierter Fahrer auf der Grien Plattform erbringen Sie Fahrdienstleistungen im Auftrag oder in Kooperation mit Ihrem autorisierten Flottenmanager. Alle regionalen Personenbeförderungsgesetze (PBefG § 48 / § 49) sind verbindlich einzuhalten.</p>
                                </section>
                                <section className="space-y-1">
                                    <h4 className="font-bold text-white uppercase text-xs">§ 2 Pflichtdokumente & Identitätsnachweis</h4>
                                    <p>Das Fahrpersonal verpflichtet sich, ein aktuelles biometrisches Passfoto sowie die Vorder- und Rückseite eines gültigen Personalausweises oder Reisepasses im Profil zu hinterlegen. Die Freischaltung erfolgt nach administrativer Prüfung.</p>
                                </section>
                                <section className="space-y-1">
                                    <h4 className="font-bold text-white uppercase text-xs">§ 3 Verhaltenskodex & Kundenservice</h4>
                                    <p>Höchste Zuverlässigkeit, Pünktlichkeit, ein gepflegtes Erscheinungsbild sowie ein respektvoller Umgang mit Fahrgästen sind Kern unseres Qualitätsanspruchs. Manipulationen von GPS-Standorten führen zum sofortigen Entzug der Fahrerlizenz.</p>
                                </section>
                                <section className="space-y-1">
                                    <h4 className="font-bold text-white uppercase text-xs">§ 4 Datenschutz & Telemetrie</h4>
                                    <p>Standortdaten werden ausschließlich während der aktiven Schicht bzw. der Durchführung von Fahraufträgen in Echtzeit erfasst und nicht unbefugt an Dritte weitergegeben.</p>
                                </section>
                            </div>

                            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setIsTermsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold uppercase cursor-pointer"
                                >
                                    Schließen
                                </button>
                                <button
                                    onClick={() => {
                                        setTermsAccepted(true);
                                        localStorage.setItem('driver_terms_accepted', 'true');
                                        syncDriverProfileToCloud({ termsAccepted: true });
                                        setIsTermsModalOpen(false);
                                    }}
                                    className="px-6 py-2.5 rounded-xl bg-brand text-dark-900 text-xs font-black uppercase tracking-wider hover:scale-105 transition-all shadow-lg shadow-brand/20 cursor-pointer"
                                >
                                    ✓ Akzeptieren & Schließen
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
</div>
    );
};

export default DriverDashboard;
