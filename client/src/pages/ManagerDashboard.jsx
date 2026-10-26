import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeSetItem } from '../utils/storageHelper';
import { db as fbDb, storage } from '../config/firebase';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { calculateShuttleFare } from '../utils/shuttleFareHelper';
import {
    TrendingUp,
    History,
    Map,
    Building2,
    Briefcase,
    CreditCard,
    Wallet,
    Menu,
    X,
    Car,
    Zap,
    DollarSign,
    Star,
    LayoutDashboard,
    FileText,
    Users,
    Activity,
    ArrowUpRight,
    Search,
    MapPin,
    Calendar,
    ChevronRight,
    Clock,
    CheckCircle, Bus,
    Droplets,
    Handshake,
    ArrowDownRight,
    GlassWater,
    Utensils,
    BedDouble,
    Flame,
    Receipt,
    Timer,
    PlusCircle,
    ShieldCheck,
    Upload,
    Settings,
    User,
    CheckCircle2,
    CloudSun,
    BarChart3,
    ArrowLeft,
    Image as ImageIcon,
    Video,
    Smartphone,
    ShoppingBag,
    Trash2,
    ShieldAlert,
    Bot,
    Sparkles,
    Shield,
    Layers,
    Target,
    QrCode,
    Ticket,
    Trophy,
    Box,
    Languages,
    Search as SearchIcon,
    Heart,
    MessageCircle,
    Share2,
    Play,
    Lock,
    Send,
    DoorOpen,
    Undo,
    Mail,
    Camera,
    Key,
    Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Radar from '../components/Radar';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { Banknote, Check, Moon, Sun, Loader2, Eye, AlertCircle, ExternalLink, FileCheck2, XCircle, Ban, AlertTriangle, ArrowDown, ArrowUp, RefreshCw, BadgePercent, Printer, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { triggerNotification } from '../components/NotificationToast';
import PostsFeed from '../components/PostsFeed';
import MenuManagement from './MenuManagement';

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
        callback(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => {
        callback(base64);
    };
};

const itemMetadata = {
    // Bar / signature cocktails
    "midnight neon": { id: "C-01", image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=300&fit=crop" },
    "green emerald": { id: "C-02", image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop" },
    "emerald cocktail": { id: "C-02", image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop" },
    "truffle fries": { id: "F-04", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop" },

    // Hotel / Palace
    "deluxe king suite": { id: "H-01", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=400&fit=crop" },
    "emerald suite": { id: "H-01", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=400&fit=crop" },
    "spa access included": { id: "H-03", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=400&fit=crop" },
    "zenith penthouse": { id: "H-02", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=400&fit=crop" },
    "wagyu gold filet": { id: "F-01", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },
    "gold leaf burger": { id: "F-01", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },
    "wagyu burger": { id: "F-01", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },
    "lobster thermidor": { id: "F-02", image: "https://images.unsplash.com/photo-1533682805518-48d1f5a8cd3a?w=400&h=400&fit=crop" },
    "champagne (bottle)": { id: "F-03", image: "https://images.unsplash.com/photo-1594487053020-43b9a2487c97?w=400&h=400&fit=crop" },
    "champagne": { id: "F-03", image: "https://images.unsplash.com/photo-1594487053020-43b9a2487c97?w=400&h=400&fit=crop" },

    // Carwash
    "ceramic shield pro": { id: "W-01", image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&h=400&fit=crop" },
    "showroom carnuba wax": { id: "W-02", image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=400&fit=crop" },
    "interior steam purge": { id: "W-03", image: "https://images.unsplash.com/photo-1599256621730-535171e28e50?w=400&h=400&fit=crop" },
    "wheel brush elite": { id: "W-04", image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=400&fit=crop" },

    // Parking
    "standard hourly": { id: "P-01", image: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&h=400&fit=crop" },
    "prime space hourly": { id: "P-02", image: "https://images.unsplash.com/photo-1545179605-1296651bc9b4?w=400&h=400&fit=crop" },
    "daily pass (24h)": { id: "P-03", image: "https://images.unsplash.com/photo-1470224492023-147c28ff81ad?w=400&h=400&fit=crop" },
    "weekly membership": { id: "P-04", image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=400&fit=crop" },
    "monthly executive": { id: "P-05", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=400&fit=crop" },
    "annual diamond": { id: "P-06", image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=400&fit=crop" },

    // Stadium
    "executive vip box": { id: "S-01", image: "https://images.unsplash.com/photo-1510204819217-1d35ae4489ae?w=400&h=400&fit=crop" },
    "field-side premium": { id: "S-02", image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=400&h=400&fit=crop" },
    "stadium valet entry": { id: "S-03", image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=400&fit=crop" },
    "the 'watch & wash' bundle": { id: "S-04", image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=400&fit=crop" }
};

const getItemInfo = (itemName) => {
    const key = itemName.toLowerCase().replace(/\(\d+x\)/, '').trim();
    if (itemMetadata[key]) {
        return itemMetadata[key];
    }
    // Dynamic generation fallback
    const hash = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockId = `M-${10 + (hash % 90)}`;
    const mockImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop"; // generic premium food
    return { id: mockId, image: mockImage };
};

const ManagerDashboard = () => {
    const { user, setUser, loading, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const isLight = theme === 'light';
    const navigate = useNavigate();
    const { lang, setLang, t } = useLanguage();
    const [view, setView] = useState('overview');
    
    // NOTCH & SAFE AREA ALIGNMENT SYSTEM FOR MOBILE FIT
    const [isNotchPanelOpen, setIsNotchPanelOpen] = useState(false);
    const [useSafeArea, setUseSafeArea] = useState(() => {
        const saved = localStorage.getItem('green_manager_use_safe_area');
        return saved !== null ? saved === 'true' : true;
    });
    const [notchAdjustment, setNotchAdjustment] = useState(() => {
        const isMobileDevice = window.innerWidth < 768;
        const saved = localStorage.getItem('green_manager_notch_adjustment');
        if (saved !== null) return parseInt(saved, 10);
        return isMobileDevice ? 16 : 0;
    });

    useEffect(() => {
        localStorage.setItem('green_manager_use_safe_area', useSafeArea);
    }, [useSafeArea]);

    useEffect(() => {
        localStorage.setItem('green_manager_notch_adjustment', notchAdjustment);
    }, [notchAdjustment]);
    const [editingStaffIndex, setEditingStaffIndex] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const simRole = user?.role || 'manager';
    const [simTemplate, setSimTemplate] = useState('pilot');
    const [langSearch, setLangSearch] = useState('');
    const [isLangExpanded, setIsLangExpanded] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState(null); // 'processing', 'complete'
    const [previewUrl, setPreviewUrl] = useState(null);
    const [broadcastCaption, setBroadcastCaption] = useState('');

    const [shuttleRequests, setShuttleRequests] = useState([
        { id: 1, title: 'Airport FRA T1 Group Transfer', guests: 8, bags: 14, time: '14:00 - 14:30 Arrival', vehicle: '2x VIP Sprinter Vans', status: 'ACCEPTED', distanceKm: 14.5, pricePerPax: 13.00, totalPrice: 104.00 },
        { id: 2, title: 'Airport MUC T2 Group Transfer', guests: 2, bags: 3, time: '16:15 - 16:45 Arrival', vehicle: '1x Executive Van', status: 'PENDING', distanceKm: 9.8, pricePerPax: 11.50, totalPrice: 23.00 }
    ]);

    const handleAcceptShuttle = (id) => {
        setShuttleRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'ACCEPTED' } : req));
    };

    // B2B STADIUM TICKET & SHUTTLE BOTTOM SHEET STATES
    const [isTicketRevenueModalOpen, setIsTicketRevenueModalOpen] = useState(false);
    const [selectedTicketCategory, setSelectedTicketCategory] = useState(null);
    const [ticketStatusFilter, setTicketStatusFilter] = useState('all');

    const [isShuttleServiceModalOpen, setIsShuttleServiceModalOpen] = useState(false);
    const [shuttleStatusFilter, setShuttleStatusFilter] = useState('all');

    // Stadium Tickets Telemetry Data
    const stadiumTicketData = useMemo(() => {
        return [
            // Category 1: Fußball & Sport
            { id: 'TK-10821', name: 'VIP Loge Sektor A', category: 'Fußball & Sport', ticketType: 'VIP Box', buyerName: 'Maximilian Weber', buyerEmail: 'm.weber@corp.de', price: 250.00, date: '05.10.2026', status: 'sold', hasShuttle: true, shuttlePax: 2 },
            { id: 'TK-10822', name: 'Haupttribüne Block 14', category: 'Fußball & Sport', ticketType: 'Sitzplatz', buyerName: 'Laura Becker', buyerEmail: 'l.becker@web.de', price: 85.00, date: '05.10.2026', status: 'sold', hasShuttle: true, shuttlePax: 1 },
            { id: 'TK-10823', name: 'Haupttribüne Block 14', category: 'Fußball & Sport', ticketType: 'Sitzplatz', buyerName: 'Dennis Meyer', buyerEmail: 'd.meyer@outlook.com', price: 85.00, date: '05.10.2026', status: 'sold', hasShuttle: false },
            { id: 'TK-10824', name: 'Stehplatz Südkurve', category: 'Fußball & Sport', ticketType: 'Stehplatz', buyerName: 'Felix Hoffmann', buyerEmail: 'f.hoffmann@gmx.de', price: 35.00, date: '05.10.2026', status: 'sold', hasShuttle: false },
            { id: 'TK-10825', name: 'Haupttribüne Block 12', category: 'Fußball & Sport', ticketType: 'Sitzplatz', buyerName: 'Sarah Schmidt', buyerEmail: 's.schmidt@gmail.com', price: 85.00, date: '05.10.2026', status: 'reserved', hasShuttle: true, shuttlePax: 2 },
            { id: 'TK-10826', name: 'Stehplatz Südkurve', category: 'Fußball & Sport', ticketType: 'Stehplatz', buyerName: 'Kevin Krause', buyerEmail: 'k.krause@web.de', price: 35.00, date: '05.10.2026', status: 'cancelled', hasShuttle: false },

            // Category 2: Champions League
            { id: 'TK-20411', name: 'Executive Lounge Pass', category: 'Champions League', ticketType: 'Executive Lounge', buyerName: 'Dr. Hans Müller', buyerEmail: 'h.mueller@med-clinic.de', price: 380.00, date: '12.10.2026', status: 'sold', hasShuttle: true, shuttlePax: 2 },
            { id: 'TK-20412', name: 'Haupttribüne Center Block', category: 'Champions League', ticketType: 'Sitzplatz', buyerName: 'Christian Wolf', buyerEmail: 'c.wolf@wolf-logistics.com', price: 160.00, date: '12.10.2026', status: 'sold', hasShuttle: true, shuttlePax: 1 },
            { id: 'TK-20413', name: 'Haupttribüne Center Block', category: 'Champions League', ticketType: 'Sitzplatz', buyerName: 'Thomas Fischer', buyerEmail: 't.fischer@fischer-bau.de', price: 160.00, date: '12.10.2026', status: 'sold', hasShuttle: true, shuttlePax: 1 },
            { id: 'TK-20414', name: 'VIP Loge Sektor B', category: 'Champions League', ticketType: 'VIP Box', buyerName: 'Andreas Lang', buyerEmail: 'a.lang@finance-group.eu', price: 420.00, date: '12.10.2026', status: 'reserved', hasShuttle: true, shuttlePax: 4 },
            { id: 'TK-20415', name: 'Gegengerade Block 8', category: 'Champions League', ticketType: 'Sitzplatz', buyerName: 'Tim Wagner', buyerEmail: 't.wagner@hotmail.de', price: 110.00, date: '12.10.2026', status: 'cancelled', hasShuttle: true, shuttlePax: 1 },

            // Category 3: Konzerte & Shows
            { id: 'TK-30191', name: 'Golden Circle Front Stage', category: 'Konzerte & Shows', ticketType: 'Stehplatz', buyerName: 'Julia Richter', buyerEmail: 'j.richter@gmail.com', price: 140.00, date: '18.10.2026', status: 'sold', hasShuttle: true, shuttlePax: 2 },
            { id: 'TK-30192', name: 'VIP Loge Diamond', category: 'Konzerte & Shows', ticketType: 'VIP Box', buyerName: 'Alexander Berg', buyerEmail: 'a.berg@music-mgmt.de', price: 290.00, date: '18.10.2026', status: 'sold', hasShuttle: false },
            { id: 'TK-30193', name: 'Tribüne Oberrang Block C', category: 'Konzerte & Shows', ticketType: 'Sitzplatz', buyerName: 'Melanie Koch', buyerEmail: 'm.koch@posteo.de', price: 75.00, date: '18.10.2026', status: 'reserved', hasShuttle: false },
            { id: 'TK-30194', name: 'Golden Circle Front Stage', category: 'Konzerte & Shows', ticketType: 'Stehplatz', buyerName: 'Nico Schwarz', buyerEmail: 'n.schwarz@icloud.com', price: 140.00, date: '18.10.2026', status: 'cancelled', hasShuttle: false },

            // Category 4: VVIP & Logen
            { id: 'TK-40011', name: 'Presidential Sky Lounge', category: 'VVIP & Logen', ticketType: 'VIP Box', buyerName: 'Konsul E. Von Berg', buyerEmail: 'v.berg@holding.ch', price: 650.00, date: '25.10.2026', status: 'sold', hasShuttle: true, shuttlePax: 3 },
            { id: 'TK-40012', name: 'Valet Package & Exclusive Box', category: 'VVIP & Logen', ticketType: 'Valet Package', buyerName: 'Marc Oster', buyerEmail: 'm.oster@capital-partners.de', price: 490.00, date: '25.10.2026', status: 'reserved', hasShuttle: true, shuttlePax: 2 }
        ];
    }, []);

    const ticketCategorySummary = useMemo(() => {
        const categoriesMap = {};
        stadiumTicketData.forEach(t => {
            const cat = t.category || 'Allgemein';
            if (!categoriesMap[cat]) {
                categoriesMap[cat] = {
                    name: cat,
                    total: 0,
                    soldCount: 0,
                    reservedCount: 0,
                    cancelledCount: 0,
                    soldRevenue: 0,
                    reservedRevenue: 0,
                    cancelledRevenue: 0,
                    tickets: []
                };
            }
            categoriesMap[cat].total += 1;
            categoriesMap[cat].tickets.push(t);
            if (t.status === 'sold') {
                categoriesMap[cat].soldCount += 1;
                categoriesMap[cat].soldRevenue += t.price;
            } else if (t.status === 'reserved') {
                categoriesMap[cat].reservedCount += 1;
                categoriesMap[cat].reservedRevenue += t.price;
            } else if (t.status === 'cancelled') {
                categoriesMap[cat].cancelledCount += 1;
                categoriesMap[cat].cancelledRevenue += t.price;
            }
        });
        return Object.values(categoriesMap);
    }, [stadiumTicketData]);

    const totalTicketStats = useMemo(() => {
        let sold = 0, reserved = 0, cancelled = 0, soldRev = 0, reservedRev = 0, cancelledRev = 0;
        stadiumTicketData.forEach(t => {
            if (t.status === 'sold') { sold++; soldRev += t.price; }
            else if (t.status === 'reserved') { reserved++; reservedRev += t.price; }
            else if (t.status === 'cancelled') { cancelled++; cancelledRev += t.price; }
        });
        return { sold, reserved, cancelled, total: stadiumTicketData.length, soldRev, reservedRev, cancelledRev };
    }, [stadiumTicketData]);

    // Stadium Shuttle Bookings Telemetry Data
    const stadiumShuttleData = useMemo(() => {
        return [
            {
                id: 'SH-88101',
                guestName: 'Maximilian Weber',
                guestPhone: '+49 171 4920192',
                pax: 2,
                bags: 2,
                pickup: 'Frankfurt Hbf (Südausgang VIP Zone)',
                destination: 'Green Stadium Arena (VIP Gate 2)',
                date: '05.10.2026',
                time: '16:30 Uhr',
                vehicleType: 'Green VIP Shuttle Van',
                pricePerPax: 16.00,
                totalPrice: 32.00,
                status: 'sold'
            },
            {
                id: 'SH-88102',
                guestName: 'Laura Becker',
                guestPhone: '+49 152 8392011',
                pax: 1,
                bags: 1,
                pickup: 'Flughafen FRA (Terminal 1 Ankunft B)',
                destination: 'Green Stadium Arena (Haupteingang)',
                date: '05.10.2026',
                time: '17:00 Uhr',
                vehicleType: 'Executive EV Sedan',
                pricePerPax: 16.00,
                totalPrice: 16.00,
                status: 'sold'
            },
            {
                id: 'SH-88103',
                guestName: 'Dr. Hans Müller',
                guestPhone: '+49 160 5549210',
                pax: 2,
                bags: 2,
                pickup: 'Steigenberger Icon Frankfurter Hof',
                destination: 'Green Stadium Arena (VIP Gate 1)',
                date: '12.10.2026',
                time: '18:15 Uhr',
                vehicleType: 'Green VIP Shuttle Van',
                pricePerPax: 16.00,
                totalPrice: 32.00,
                status: 'sold'
            },
            {
                id: 'SH-88104',
                guestName: 'Christian Wolf',
                guestPhone: '+49 173 1198273',
                pax: 1,
                bags: 1,
                pickup: 'Hauptbahnhof Frankfurt (Nordseite)',
                destination: 'Green Stadium Arena (Südtor)',
                date: '12.10.2026',
                time: '18:30 Uhr',
                vehicleType: 'Executive EV Sedan',
                pricePerPax: 16.00,
                totalPrice: 16.00,
                status: 'sold'
            },
            {
                id: 'SH-88105',
                guestName: 'Thomas Fischer',
                guestPhone: '+49 151 7739204',
                pax: 1,
                bags: 0,
                pickup: 'Königsallee / Grand Hotel',
                destination: 'Green Stadium Arena (VIP Gate 2)',
                date: '12.10.2026',
                time: '18:45 Uhr',
                vehicleType: 'Executive EV Sedan',
                pricePerPax: 16.00,
                totalPrice: 16.00,
                status: 'sold'
            },
            {
                id: 'SH-88106',
                guestName: 'Julia Richter',
                guestPhone: '+49 176 9940129',
                pax: 2,
                bags: 2,
                pickup: 'Flughafen FRA (Terminal 2)',
                destination: 'Green Stadium Arena (Konzerteinlass)',
                date: '18.10.2026',
                time: '17:30 Uhr',
                vehicleType: 'Green VIP Shuttle Van',
                pricePerPax: 16.00,
                totalPrice: 32.00,
                status: 'sold'
            },
            {
                id: 'SH-88107',
                guestName: 'Konsul E. Von Berg',
                guestPhone: '+41 79 3392019',
                pax: 3,
                bags: 4,
                pickup: 'Privatjet Terminal FRA VIP Gate',
                destination: 'Green Stadium Arena (Presidential Gate)',
                date: '25.10.2026',
                time: '19:00 Uhr',
                vehicleType: 'VIP Sprinter Lounge Van',
                pricePerPax: 16.00,
                totalPrice: 48.00,
                status: 'sold'
            },
            {
                id: 'SH-88108',
                guestName: 'Sarah Schmidt',
                guestPhone: '+49 172 8820491',
                pax: 2,
                bags: 1,
                pickup: 'Hotel Hilton Frankfurt City',
                destination: 'Green Stadium Arena (Haupteingang)',
                date: '05.10.2026',
                time: '17:45 Uhr',
                vehicleType: 'Green VIP Shuttle Van',
                pricePerPax: 16.00,
                totalPrice: 32.00,
                status: 'reserved'
            },
            {
                id: 'SH-88109',
                guestName: 'Andreas Lang',
                guestPhone: '+49 170 3381902',
                pax: 4,
                bags: 3,
                pickup: 'Maritim Hotel Frankfurt',
                destination: 'Green Stadium Arena (VIP Gate 2)',
                date: '12.10.2026',
                time: '18:00 Uhr',
                vehicleType: 'VIP Sprinter Lounge Van',
                pricePerPax: 16.00,
                totalPrice: 64.00,
                status: 'reserved'
            },
            {
                id: 'SH-88110',
                guestName: 'Marc Oster',
                guestPhone: '+49 175 4482910',
                pax: 2,
                bags: 2,
                pickup: 'InterContinental Frankfurt',
                destination: 'Green Stadium Arena (VIP Gate 1)',
                date: '25.10.2026',
                time: '18:30 Uhr',
                vehicleType: 'Executive EV Sedan',
                pricePerPax: 16.00,
                totalPrice: 32.00,
                status: 'reserved'
            },
            {
                id: 'SH-88111',
                guestName: 'Tim Wagner',
                guestPhone: '+49 152 7749201',
                pax: 1,
                bags: 1,
                pickup: 'Frankfurt Hbf Vorplatz',
                destination: 'Green Stadium Arena (Südtor)',
                date: '12.10.2026',
                time: '17:15 Uhr',
                vehicleType: 'Executive EV Sedan',
                pricePerPax: 16.00,
                totalPrice: 16.00,
                status: 'cancelled'
            }
        ];
    }, []);

    const totalShuttleStats = useMemo(() => {
        let soldPax = 0, soldTotal = 0, reservedPax = 0, reservedTotal = 0, cancelledPax = 0, cancelledTotal = 0;
        stadiumShuttleData.forEach(s => {
            if (s.status === 'sold') {
                soldPax += s.pax;
                soldTotal += s.totalPrice;
            } else if (s.status === 'reserved') {
                reservedPax += s.pax;
                reservedTotal += s.totalPrice;
            } else if (s.status === 'cancelled') {
                cancelledPax += s.pax;
                cancelledTotal += s.totalPrice;
            }
        });
        return {
            soldCount: stadiumShuttleData.filter(s => s.status === 'sold').length,
            soldPax,
            soldTotal,
            reservedCount: stadiumShuttleData.filter(s => s.status === 'reserved').length,
            reservedPax,
            reservedTotal,
            cancelledCount: stadiumShuttleData.filter(s => s.status === 'cancelled').length,
            cancelledPax,
            cancelledTotal,
            totalTrips: stadiumShuttleData.length
        };
    }, [stadiumShuttleData]);

    const handleDownloadShuttlePdf = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Bitte Popups im Browser erlauben, um das PDF herunterzuladen.');
            return;
        }

        const todayStr = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const bName = 'Green Stadium Arena';

        const rowsHtml = stadiumShuttleData.map(s => `
            <tr>
                <td><strong>${s.id}</strong></td>
                <td>
                    <div><strong>${s.guestName}</strong></div>
                    <div style="font-size: 10px; color: #64748b;">${s.guestPhone}</div>
                </td>
                <td>${s.pax} Person${s.pax > 1 ? 'en' : ''} (${s.bags} Koffer)</td>
                <td>
                    <div><strong>${s.pickup}</strong></div>
                    <div style="font-size: 10px; color: #0284c7;">&rarr; ${s.destination}</div>
                </td>
                <td>${s.date} <br><span style="font-size: 10px; color: #64748b;">${s.time}</span></td>
                <td>${s.vehicleType}</td>
                <td><strong>€${s.totalPrice.toFixed(2)}</strong></td>
                <td>
                    <span class="badge ${s.status === 'sold' ? 'badge-sold' : s.status === 'reserved' ? 'badge-reserved' : 'badge-cancelled'}">
                        ${s.status === 'sold' ? 'Verkauft' : s.status === 'reserved' ? 'Reserviert' : 'Storniert'}
                    </span>
                </td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>B2B Shuttle-Service Abrechnung - ${bName}</title>
                <style>
                    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
                    body { padding: 40px; color: #0f172a; background: #ffffff; line-height: 1.5; font-size: 13px; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #00e5ff; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo-title { font-size: 24px; font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -0.5px; color: #0284c7; }
                    .logo-sub { font-size: 11px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 2px; }
                    .meta-right { text-align: right; font-size: 12px; color: #475569; }
                    .meta-right strong { color: #0f172a; }
                    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
                    .summary-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #f8fafc; }
                    .summary-card.sold { border-color: #10b981; background: #f0fdf4; }
                    .summary-card.reserved { border-color: #f59e0b; background: #fffbeb; }
                    .summary-card.cancelled { border-color: #ef4444; background: #fef2f2; }
                    .summary-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
                    .summary-val { font-size: 20px; font-weight: 900; color: #0f172a; }
                    .summary-sub { font-size: 11px; color: #64748b; font-weight: 600; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
                    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; vertical-align: middle; }
                    tr:nth-child(even) td { background: #f8fafc; }
                    .badge { display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
                    .badge-sold { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
                    .badge-reserved { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
                    .badge-cancelled { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
                    .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
                    .total-box { margin-left: auto; width: 280px; margin-bottom: 30px; border: 1px solid #0284c7; border-radius: 12px; padding: 16px; background: #f0f9ff; }
                    .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
                    .total-row.final { font-size: 16px; font-weight: 900; color: #0369a1; border-top: 1px solid #bae6fd; padding-top: 8px; margin-top: 8px; }
                    @media print {
                        body { padding: 15px; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="logo-title">KHIAM GREEN VIP FLEET</div>
                        <div class="logo-sub">B2B Shuttle-Service Abrechnung & Kontingente</div>
                    </div>
                    <div class="meta-right">
                        <div><strong>Partner:</strong> ${bName}</div>
                        <div><strong>Datum:</strong> ${todayStr}</div>
                        <div><strong>Dokumenten-Nr.:</strong> SHT-${Date.now().toString().slice(-6)}</div>
                        <div><strong>Tarif-Modell:</strong> Green B2B Staffeltarif (€16,00 / Pax)</div>
                    </div>
                </div>

                <div class="summary-grid">
                    <div class="summary-card sold">
                        <div class="summary-title">Ausgeführt / Verkauft</div>
                        <div class="summary-val">${totalShuttleStats.soldPax} Passagiere</div>
                        <div class="summary-sub">€${totalShuttleStats.soldTotal.toFixed(2)} (${totalShuttleStats.soldCount} Fahrten)</div>
                    </div>
                    <div class="summary-card reserved">
                        <div class="summary-title">Reserviert / Geplant</div>
                        <div class="summary-val">${totalShuttleStats.reservedPax} Passagiere</div>
                        <div class="summary-sub">€${totalShuttleStats.reservedTotal.toFixed(2)} (${totalShuttleStats.reservedCount} Fahrten)</div>
                    </div>
                    <div class="summary-card cancelled">
                        <div class="summary-title">Storniert</div>
                        <div class="summary-val">${totalShuttleStats.cancelledPax} Passagiere</div>
                        <div class="summary-sub">€${totalShuttleStats.cancelledTotal.toFixed(2)} (${totalShuttleStats.cancelledCount} Fahrten)</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-title">Gesamt Transfers</div>
                        <div class="summary-val">${totalShuttleStats.totalTrips} Fahrten</div>
                        <div class="summary-sub">${totalShuttleStats.soldPax + totalShuttleStats.reservedPax + totalShuttleStats.cancelledPax} Passagiere</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Transfer-ID</th>
                            <th>Gast / Fahrgast</th>
                            <th>Passagiere</th>
                            <th>Route (Abholung &rarr; Ziel)</th>
                            <th>Datum & Uhrzeit</th>
                            <th>Fahrzeug</th>
                            <th>Betrag</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>

                <div class="total-box">
                    <div class="total-row">
                        <span>Verkaufte Transfers:</span>
                        <strong>€${totalShuttleStats.soldTotal.toFixed(2)}</strong>
                    </div>
                    <div class="total-row">
                        <span>Reservierte Transfers (offen):</span>
                        <strong>€${totalShuttleStats.reservedTotal.toFixed(2)}</strong>
                    </div>
                    <div class="total-row">
                        <span>Stornierte Transfers:</span>
                        <strong style="color: #ef4444;">€${totalShuttleStats.cancelledTotal.toFixed(2)}</strong>
                    </div>
                    <div class="total-row final">
                        <span>Abrechnungsbetrag Green:</span>
                        <span>€${totalShuttleStats.soldTotal.toFixed(2)}</span>
                    </div>
                </div>

                <div class="footer">
                    <div>Khiam Green Technologies GmbH &bull; B2B Fleet Clearing &bull; info@green.de</div>
                    <div>Automatisch erstellter Abrechnungsbericht &bull; Gültig ohne Unterschrift</div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // B2B HOTEL ROOM & SHUTTLE BOTTOM SHEET STATES
    const [isHotelRevenueModalOpen, setIsHotelRevenueModalOpen] = useState(false);
    const [selectedRoomCategory, setSelectedRoomCategory] = useState(null);
    const [roomStatusFilter, setRoomStatusFilter] = useState('all');

    const [isHotelShuttleModalOpen, setIsHotelShuttleModalOpen] = useState(false);
    const [hotelShuttleStatusFilter, setHotelShuttleStatusFilter] = useState('all');

    // Hotel Room Bookings Telemetry Data (14 sold = €3.500,00)
    const hotelRoomData = useMemo(() => {
        return [
            // Category 1: Executive Suite Deluxe (€350,00) - 4 sold = €1.400,00
            { id: 'ZM-40101', name: 'Executive Suite Deluxe #401', category: 'Executive Suite Deluxe', roomType: 'Suite', guestName: 'Dr. Martin Lindner', guestEmail: 'm.lindner@holding.ch', price: 350.00, checkIn: '05.10.2026', nights: 1, status: 'sold', hasShuttle: true, shuttlePax: 2 },
            { id: 'ZM-40102', name: 'Executive Suite Deluxe #402', category: 'Executive Suite Deluxe', roomType: 'Suite', guestName: 'Beate Kaufmann', guestEmail: 'b.kaufmann@invest.com', price: 350.00, checkIn: '05.10.2026', nights: 1, status: 'sold', hasShuttle: true, shuttlePax: 1 },
            { id: 'ZM-40103', name: 'Executive Suite Deluxe #403', category: 'Executive Suite Deluxe', roomType: 'Suite', guestName: 'Sebastian Kraft', guestEmail: 's.kraft@kraft-law.de', price: 350.00, checkIn: '05.10.2026', nights: 1, status: 'sold', hasShuttle: false },
            { id: 'ZM-40104', name: 'Executive Suite Deluxe #404', category: 'Executive Suite Deluxe', roomType: 'Suite', guestName: 'Monika Wagner', guestEmail: 'm.wagner@global.at', price: 350.00, checkIn: '06.10.2026', nights: 1, status: 'sold', hasShuttle: true, shuttlePax: 2 },
            { id: 'ZM-40105', name: 'Executive Suite Deluxe #405', category: 'Executive Suite Deluxe', roomType: 'Suite', guestName: 'Christian Wolf', guestEmail: 'c.wolf@wolf-logistics.com', price: 350.00, checkIn: '08.10.2026', nights: 1, status: 'reserved', hasShuttle: true, shuttlePax: 1 },
            { id: 'ZM-40106', name: 'Executive Suite Deluxe #406', category: 'Executive Suite Deluxe', roomType: 'Suite', guestName: 'Jens Lehmann', guestEmail: 'j.lehmann@web.de', price: 350.00, checkIn: '05.10.2026', nights: 1, status: 'cancelled', hasShuttle: false },

            // Category 2: Superior King Room (€180,00) - 6 sold = €1.080,00
            { id: 'ZM-40201', name: 'Superior King Room #201', category: 'Superior King Room', roomType: 'King Room', guestName: 'Alexander Schulz', guestEmail: 'a.schulz@gmx.de', price: 180.00, checkIn: '05.10.2026', nights: 1, status: 'sold', hasShuttle: true, shuttlePax: 1 },
            { id: 'ZM-40202', name: 'Superior King Room #202', category: 'Superior King Room', roomType: 'King Room', guestName: 'Kathrin Vogel', guestEmail: 'k.vogel@telekom.de', price: 180.00, checkIn: '05.10.2026', nights: 1, status: 'sold', hasShuttle: false },
            { id: 'ZM-40203', name: 'Superior King Room #203', category: 'Superior King Room', roomType: 'King Room', guestName: 'Frank Zimmermann', guestEmail: 'f.zimmermann@outlook.com', price: 180.00, checkIn: '05.10.2026', nights: 1, status: 'sold', hasShuttle: true, shuttlePax: 2 },
            { id: 'ZM-40204', name: 'Superior King Room #204', category: 'Superior King Room', roomType: 'King Room', guestName: 'Nadine Meier', guestEmail: 'n.meier@yahoo.de', price: 180.00, checkIn: '06.10.2026', nights: 1, status: 'sold', hasShuttle: true, shuttlePax: 1 },
            { id: 'ZM-40205', name: 'Superior King Room #205', category: 'Superior King Room', roomType: 'King Room', guestName: 'Tobias Braun', guestEmail: 't.braun@braun-gmbh.de', price: 180.00, checkIn: '06.10.2026', nights: 1, status: 'sold', hasShuttle: false },
            { id: 'ZM-40206', name: 'Superior King Room #206', category: 'Superior King Room', roomType: 'King Room', guestName: 'Elena Rostova', guestEmail: 'e.rostova@consulting.eu', price: 180.00, checkIn: '07.10.2026', nights: 1, status: 'sold', hasShuttle: true, shuttlePax: 1 },
            { id: 'ZM-40207', name: 'Superior King Room #207', category: 'Superior King Room', roomType: 'King Room', guestName: 'Svenja Otto', guestEmail: 's.otto@web.de', price: 180.00, checkIn: '09.10.2026', nights: 1, status: 'reserved', hasShuttle: true, shuttlePax: 1 },
            { id: 'ZM-40208', name: 'Superior King Room #208', category: 'Superior King Room', roomType: 'King Room', guestName: 'Dirk Hoffmann', guestEmail: 'd.hoffmann@live.de', price: 180.00, checkIn: '10.10.2026', nights: 1, status: 'reserved', hasShuttle: false },

            // Category 3: Panorama Junior Suite (€260,00) - 3 sold = €780,00
            { id: 'ZM-40301', name: 'Panorama Junior Suite #301', category: 'Panorama Junior Suite', roomType: 'Junior Suite', guestName: 'Dr. Hans Müller', guestEmail: 'h.mueller@med-clinic.de', price: 260.00, checkIn: '05.10.2026', nights: 1, status: 'sold', hasShuttle: true, shuttlePax: 1 },
            { id: 'ZM-40302', name: 'Panorama Junior Suite #302', category: 'Panorama Junior Suite', roomType: 'Junior Suite', guestName: 'Claudia Richter', guestEmail: 'c.richter@art-gallery.de', price: 260.00, checkIn: '05.10.2026', nights: 1, status: 'sold', hasShuttle: false },
            { id: 'ZM-40303', name: 'Panorama Junior Suite #303', category: 'Panorama Junior Suite', roomType: 'Junior Suite', guestName: 'Janina Beck', guestEmail: 'j.beck@live.de', price: 260.00, checkIn: '06.10.2026', nights: 1, status: 'sold', hasShuttle: true, shuttlePax: 2 },
            { id: 'ZM-40304', name: 'Panorama Junior Suite #304', category: 'Panorama Junior Suite', roomType: 'Junior Suite', guestName: 'Marc Oster', guestEmail: 'm.oster@events.de', price: 260.00, checkIn: '08.10.2026', nights: 1, status: 'reserved', hasShuttle: true, shuttlePax: 2 },
            { id: 'ZM-40305', name: 'Panorama Junior Suite #305', category: 'Panorama Junior Suite', roomType: 'Junior Suite', guestName: 'Lukas May', guestEmail: 'l.may@outlook.de', price: 260.00, checkIn: '05.10.2026', nights: 1, status: 'cancelled', hasShuttle: false },

            // Category 4: Presidential Penthouse (€240,00 / €650,00) - 1 sold = €240,00
            { id: 'ZM-40401', name: 'Presidential Penthouse Suite #501', category: 'Presidential Penthouse', roomType: 'Penthouse Suite', guestName: 'Konsul E. Von Berg', guestEmail: 'e.vonberg@holding.ch', price: 240.00, checkIn: '05.10.2026', nights: 1, status: 'sold', hasShuttle: true, shuttlePax: 2 },
            { id: 'ZM-40402', name: 'Presidential Penthouse Suite #502', category: 'Presidential Penthouse', roomType: 'Penthouse Suite', guestName: 'Andreas Lang', guestEmail: 'a.lang@finance-group.eu', price: 650.00, checkIn: '12.10.2026', nights: 1, status: 'reserved', hasShuttle: true, shuttlePax: 4 }
        ];
    }, []);

    // Summary per Room Category
    const hotelCategorySummary = useMemo(() => {
        const catMap = {};
        hotelRoomData.forEach(r => {
            if (!catMap[r.category]) {
                catMap[r.category] = { name: r.category, total: 0, sold: 0, reserved: 0, cancelled: 0, soldRevenue: 0, reservedRevenue: 0, shuttlePax: 0 };
            }
            catMap[r.category].total += 1;
            if (r.status === 'sold') {
                catMap[r.category].sold += 1;
                catMap[r.category].soldRevenue += r.price;
            } else if (r.status === 'reserved') {
                catMap[r.category].reserved += 1;
                catMap[r.category].reservedRevenue += r.price;
            } else if (r.status === 'cancelled') {
                catMap[r.category].cancelled += 1;
            }
            if (r.hasShuttle && r.status !== 'cancelled') {
                catMap[r.category].shuttlePax += (r.shuttlePax || 1);
            }
        });
        return Object.values(catMap);
    }, [hotelRoomData]);

    const totalRoomStats = useMemo(() => {
        let sold = 0, reserved = 0, cancelled = 0, soldRev = 0, reservedRev = 0, cancelledRev = 0;
        hotelRoomData.forEach(r => {
            if (r.status === 'sold') {
                sold += 1;
                soldRev += r.price;
            } else if (r.status === 'reserved') {
                reserved += 1;
                reservedRev += r.price;
            } else if (r.status === 'cancelled') {
                cancelled += 1;
                cancelledRev += r.price;
            }
        });
        return { sold, reserved, cancelled, total: hotelRoomData.length, soldRev, reservedRev, cancelledRev };
    }, [hotelRoomData]);

    // Hotel Shuttle Bookings Telemetry Data (14 sold @ €16,00 = €224,00)
    const hotelShuttleData = useMemo(() => {
        return [
            { id: 'SH-H01', guestName: 'Dr. Martin Lindner', guestPhone: '+49 171 2891029', pax: 2, bags: 2, pickup: 'Flughafen FRA (Terminal 1)', destination: 'Green Hotel & Spa (VIP Eingang)', date: '05.10.2026', time: '13:30 Uhr', vehicleType: 'Executive EV Sedan', pricePerPax: 16.00, totalPrice: 16.00, status: 'sold' },
            { id: 'SH-H02', guestName: 'Beate Kaufmann', guestPhone: '+49 152 7719203', pax: 1, bags: 1, pickup: 'Frankfurt Hbf (Südausgang)', destination: 'Green Hotel & Spa (Lobby)', date: '05.10.2026', time: '14:00 Uhr', vehicleType: 'Executive EV Sedan', pricePerPax: 16.00, totalPrice: 16.00, status: 'sold' },
            { id: 'SH-H03', guestName: 'Monika Wagner', guestPhone: '+43 664 882910', pax: 2, bags: 2, pickup: 'Flughafen FRA (Terminal 2)', destination: 'Green Hotel & Spa (Lobby)', date: '05.10.2026', time: '14:45 Uhr', vehicleType: 'Green VIP Shuttle Van', pricePerPax: 16.00, totalPrice: 16.00, status: 'sold' },
            { id: 'SH-H04', guestName: 'Alexander Schulz', guestPhone: '+49 176 4492019', pax: 1, bags: 1, pickup: 'Messe Frankfurt (Tor Ost)', destination: 'Green Hotel & Spa (Haupteingang)', date: '05.10.2026', time: '15:15 Uhr', vehicleType: 'Executive EV Sedan', pricePerPax: 16.00, totalPrice: 16.00, status: 'sold' },
            { id: 'SH-H05', guestName: 'Frank Zimmermann', guestPhone: '+49 160 3381920', pax: 2, bags: 2, pickup: 'Flughafen FRA (Terminal 1)', destination: 'Green Hotel & Spa (VIP Eingang)', date: '05.10.2026', time: '16:00 Uhr', vehicleType: 'Green VIP Shuttle Van', pricePerPax: 16.00, totalPrice: 16.00, status: 'sold' },
            { id: 'SH-H06', guestName: 'Nadine Meier', guestPhone: '+49 173 9920182', pax: 1, bags: 1, pickup: 'Frankfurt Hbf (Vorplatz)', destination: 'Green Hotel & Spa (Lobby)', date: '06.10.2026', time: '11:30 Uhr', vehicleType: 'Executive EV Sedan', pricePerPax: 16.00, totalPrice: 16.00, status: 'sold' },
            { id: 'SH-H07', guestName: 'Elena Rostova', guestPhone: '+33 6 12345678', pax: 1, bags: 1, pickup: 'Flughafen FRA (Terminal 2)', destination: 'Green Hotel & Spa (Lobby)', date: '06.10.2026', time: '12:15 Uhr', vehicleType: 'Executive EV Sedan', pricePerPax: 16.00, totalPrice: 16.00, status: 'sold' },
            { id: 'SH-H08', guestName: 'Dr. Hans Müller', guestPhone: '+49 160 5549210', pax: 1, bags: 1, pickup: 'Flughafen FRA (Terminal 1)', destination: 'Green Hotel & Spa (VIP Eingang)', date: '06.10.2026', time: '13:00 Uhr', vehicleType: 'Executive EV Sedan', pricePerPax: 16.00, totalPrice: 16.00, status: 'sold' },
            { id: 'SH-H09', guestName: 'Janina Beck', guestPhone: '+49 175 8839201', pax: 2, bags: 2, pickup: 'Alte Oper Frankfurt', destination: 'Green Hotel & Spa (Lobby)', date: '06.10.2026', time: '17:30 Uhr', vehicleType: 'Green VIP Shuttle Van', pricePerPax: 16.00, totalPrice: 16.00, status: 'sold' },
            { id: 'SH-H10', guestName: 'Konsul E. Von Berg', guestPhone: '+41 79 3392019', pax: 2, bags: 3, pickup: 'Privatjet Terminal FRA Gate 1', destination: 'Green Hotel & Spa (Presidential Gate)', date: '06.10.2026', time: '18:45 Uhr', vehicleType: 'VIP Sprinter Lounge Van', pricePerPax: 16.00, totalPrice: 16.00, status: 'sold' },
            { id: 'SH-H11', guestName: 'Maximilian Weber', guestPhone: '+49 171 4920192', pax: 1, bags: 1, pickup: 'Green Hotel & Spa', destination: 'Flughafen FRA (Terminal 1)', date: '07.10.2026', time: '07:30 Uhr', vehicleType: 'Executive EV Sedan', pricePerPax: 16.00, totalPrice: 16.00, status: 'sold' },
            { id: 'SH-H12', guestName: 'Laura Becker', guestPhone: '+49 152 8392011', pax: 1, bags: 1, pickup: 'Green Hotel & Spa', destination: 'Messe Frankfurt (Tor Süd)', date: '07.10.2026', time: '08:45 Uhr', vehicleType: 'Executive EV Sedan', pricePerPax: 16.00, totalPrice: 16.00, status: 'sold' },
            { id: 'SH-H13', guestName: 'Thomas Fischer', guestPhone: '+49 151 7739204', pax: 1, bags: 0, pickup: 'Green Hotel & Spa', destination: 'Frankfurt Hbf (Gleis 1)', date: '07.10.2026', time: '10:15 Uhr', vehicleType: 'Executive EV Sedan', pricePerPax: 16.00, totalPrice: 16.00, status: 'sold' },
            { id: 'SH-H14', guestName: 'Dennis Meyer', guestPhone: '+49 172 3391028', pax: 1, bags: 1, pickup: 'Green Hotel & Spa', destination: 'Flughafen FRA (Terminal 2)', date: '07.10.2026', time: '11:00 Uhr', vehicleType: 'Executive EV Sedan', pricePerPax: 16.00, totalPrice: 16.00, status: 'sold' },

            // Reserved Shuttles (4 transfers)
            { id: 'SH-H15', guestName: 'Christian Wolf', guestPhone: '+49 173 1198273', pax: 1, bags: 1, pickup: 'Flughafen FRA (Terminal 1)', destination: 'Green Hotel & Spa (Lobby)', date: '08.10.2026', time: '14:00 Uhr', vehicleType: 'Executive EV Sedan', pricePerPax: 16.00, totalPrice: 16.00, status: 'reserved' },
            { id: 'SH-H16', guestName: 'Svenja Otto', guestPhone: '+49 176 8839102', pax: 1, bags: 1, pickup: 'Frankfurt Hbf (Nordseite)', destination: 'Green Hotel & Spa (Lobby)', date: '09.10.2026', time: '15:30 Uhr', vehicleType: 'Executive EV Sedan', pricePerPax: 16.00, totalPrice: 16.00, status: 'reserved' },
            { id: 'SH-H17', guestName: 'Marc Oster', guestPhone: '+49 175 4482910', pax: 2, bags: 2, pickup: 'Flughafen FRA (Terminal 2)', destination: 'Green Hotel & Spa (Lobby)', date: '08.10.2026', time: '16:15 Uhr', vehicleType: 'Green VIP Shuttle Van', pricePerPax: 16.00, totalPrice: 16.00, status: 'reserved' },
            { id: 'SH-H18', guestName: 'Andreas Lang', guestPhone: '+49 170 3381902', pax: 4, bags: 4, pickup: 'Flughafen FRA (Terminal 1)', destination: 'Green Hotel & Spa (VIP Eingang)', date: '12.10.2026', time: '18:00 Uhr', vehicleType: 'VIP Sprinter Lounge Van', pricePerPax: 16.00, totalPrice: 16.00, status: 'reserved' },

            // Cancelled Shuttles (2 transfers)
            { id: 'SH-H19', guestName: 'Jens Lehmann', guestPhone: '+49 171 5592019', pax: 1, bags: 1, pickup: 'Frankfurt Hbf (Südausgang)', destination: 'Green Hotel & Spa (Lobby)', date: '05.10.2026', time: '16:30 Uhr', vehicleType: 'Executive EV Sedan', pricePerPax: 16.00, totalPrice: 16.00, status: 'cancelled' },
            { id: 'SH-H20', guestName: 'Lukas May', guestPhone: '+49 177 4482019', pax: 1, bags: 1, pickup: 'Flughafen FRA (Terminal 1)', destination: 'Green Hotel & Spa (Lobby)', date: '05.10.2026', time: '17:00 Uhr', vehicleType: 'Executive EV Sedan', pricePerPax: 16.00, totalPrice: 16.00, status: 'cancelled' }
        ];
    }, []);

    const totalHotelShuttleStats = useMemo(() => {
        let soldPax = 0, soldTotal = 0, reservedPax = 0, reservedTotal = 0, cancelledPax = 0, cancelledTotal = 0;
        hotelShuttleData.forEach(s => {
            if (s.status === 'sold') {
                soldPax += s.pax;
                soldTotal += s.totalPrice;
            } else if (s.status === 'reserved') {
                reservedPax += s.pax;
                reservedTotal += s.totalPrice;
            } else if (s.status === 'cancelled') {
                cancelledPax += s.pax;
                cancelledTotal += s.totalPrice;
            }
        });
        return {
            soldCount: hotelShuttleData.filter(s => s.status === 'sold').length,
            soldPax,
            soldTotal,
            reservedCount: hotelShuttleData.filter(s => s.status === 'reserved').length,
            reservedPax,
            reservedTotal,
            cancelledCount: hotelShuttleData.filter(s => s.status === 'cancelled').length,
            cancelledPax,
            cancelledTotal,
            totalTrips: hotelShuttleData.length
        };
    }, [hotelShuttleData]);

    const handleDownloadHotelShuttlePdf = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Bitte Popups im Browser erlauben, um das PDF herunterzuladen.');
            return;
        }

        const todayStr = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const hName = getBusinessName() || 'Grand Hotel & Spa';

        const rowsHtml = hotelShuttleData.map(s => `
            <tr>
                <td><strong>${s.id}</strong></td>
                <td>
                    <div><strong>${s.guestName}</strong></div>
                    <div style="font-size: 10px; color: #64748b;">${s.guestPhone}</div>
                </td>
                <td>${s.pax} Person${s.pax > 1 ? 'en' : ''} (${s.bags} Koffer)</td>
                <td>
                    <div><strong>${s.pickup}</strong></div>
                    <div style="font-size: 10px; color: #0284c7;">&rarr; ${s.destination}</div>
                </td>
                <td>${s.date} <br><span style="font-size: 10px; color: #64748b;">${s.time}</span></td>
                <td>${s.vehicleType}</td>
                <td><strong>€${s.totalPrice.toFixed(2)}</strong></td>
                <td>
                    <span class="badge ${s.status === 'sold' ? 'badge-sold' : s.status === 'reserved' ? 'badge-reserved' : 'badge-cancelled'}">
                        ${s.status === 'sold' ? 'Verkauft' : s.status === 'reserved' ? 'Reserviert' : 'Storniert'}
                    </span>
                </td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>B2B Hotel Shuttle-Abrechnung - ${hName}</title>
                <style>
                    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
                    body { padding: 40px; color: #0f172a; background: #ffffff; line-height: 1.5; font-size: 13px; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #00e5ff; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo-title { font-size: 24px; font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -0.5px; color: #0284c7; }
                    .logo-sub { font-size: 11px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 2px; }
                    .meta-right { text-align: right; font-size: 12px; color: #475569; }
                    .meta-right strong { color: #0f172a; }
                    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
                    .summary-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #f8fafc; }
                    .summary-card.sold { border-color: #10b981; background: #f0fdf4; }
                    .summary-card.reserved { border-color: #f59e0b; background: #fffbeb; }
                    .summary-card.cancelled { border-color: #ef4444; background: #fef2f2; }
                    .summary-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
                    .summary-val { font-size: 20px; font-weight: 900; color: #0f172a; }
                    .summary-sub { font-size: 11px; color: #64748b; font-weight: 600; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
                    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; vertical-align: middle; }
                    tr:nth-child(even) td { background: #f8fafc; }
                    .badge { display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
                    .badge-sold { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
                    .badge-reserved { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
                    .badge-cancelled { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
                    .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
                    .total-box { margin-left: auto; width: 280px; margin-bottom: 30px; border: 1px solid #0284c7; border-radius: 12px; padding: 16px; background: #f0f9ff; }
                    .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
                    .total-row.final { font-size: 16px; font-weight: 900; color: #0369a1; border-top: 1px solid #bae6fd; padding-top: 8px; margin-top: 8px; }
                    @media print {
                        body { padding: 15px; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="logo-title">KHIAM GREEN HOTEL CONCIERGE & FLEET</div>
                        <div class="logo-sub">B2B Hotel Zimmer & Shuttle Abrechnung</div>
                    </div>
                    <div class="meta-right">
                        <div><strong>Hotel Partner:</strong> ${hName}</div>
                        <div><strong>Datum:</strong> ${todayStr}</div>
                        <div><strong>Dokumenten-Nr.:</strong> HTL-SHT-${Date.now().toString().slice(-6)}</div>
                        <div><strong>Tarif-Modell:</strong> Green B2B Hotel-Staffeltarif (€16,00 / Fahrt)</div>
                    </div>
                </div>

                <div class="summary-grid">
                    <div class="summary-card sold">
                        <div class="summary-title">Ausgeführt / Verkauft</div>
                        <div class="summary-val">${totalHotelShuttleStats.soldPax} Passagiere</div>
                        <div class="summary-sub">€${totalHotelShuttleStats.soldTotal.toFixed(2)} (${totalHotelShuttleStats.soldCount} Fahrten)</div>
                    </div>
                    <div class="summary-card reserved">
                        <div class="summary-title">Reserviert / Geplant</div>
                        <div class="summary-val">${totalHotelShuttleStats.reservedPax} Passagiere</div>
                        <div class="summary-sub">€${totalHotelShuttleStats.reservedTotal.toFixed(2)} (${totalHotelShuttleStats.reservedCount} Fahrten)</div>
                    </div>
                    <div class="summary-card cancelled">
                        <div class="summary-title">Storniert</div>
                        <div class="summary-val">${totalHotelShuttleStats.cancelledPax} Passagiere</div>
                        <div class="summary-sub">€${totalHotelShuttleStats.cancelledTotal.toFixed(2)} (${totalHotelShuttleStats.cancelledCount} Fahrten)</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-title">Gesamt Transfers</div>
                        <div class="summary-val">${totalHotelShuttleStats.totalTrips} Fahrten</div>
                        <div class="summary-sub">${totalHotelShuttleStats.soldPax + totalHotelShuttleStats.reservedPax + totalHotelShuttleStats.cancelledPax} Passagiere</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Transfer-ID</th>
                            <th>Hotelgast</th>
                            <th>Passagiere</th>
                            <th>Route (Abholung &rarr; Ziel)</th>
                            <th>Datum & Uhrzeit</th>
                            <th>Fahrzeug</th>
                            <th>Betrag</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>

                <div class="total-box">
                    <div class="total-row">
                        <span>Verkaufte Transfers:</span>
                        <strong>€${totalHotelShuttleStats.soldTotal.toFixed(2)}</strong>
                    </div>
                    <div class="total-row">
                        <span>Reservierte Transfers (offen):</span>
                        <strong>€${totalHotelShuttleStats.reservedTotal.toFixed(2)}</strong>
                    </div>
                    <div class="total-row">
                        <span>Stornierte Transfers:</span>
                        <strong style="color: #ef4444;">€${totalHotelShuttleStats.cancelledTotal.toFixed(2)}</strong>
                    </div>
                    <div class="total-row final">
                        <span>Abrechnungsbetrag Green:</span>
                        <span>€${totalHotelShuttleStats.soldTotal.toFixed(2)}</span>
                    </div>
                </div>

                <div class="footer">
                    <div>Khiam Green Technologies GmbH &bull; B2B Fleet Clearing &bull; info@green.de</div>
                    <div>Automatisch erstellter Abrechnungsbericht Hotel &bull; Gültig ohne Unterschrift</div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const allLanguages = [
        { code: 'en', name: 'English', native: 'English' },
        { code: 'de', name: 'German', native: 'Deutsch' },
        { code: 'fa', name: 'Persian', native: 'فارسی' },
        { code: 'fr', name: 'French', native: 'Français' },
        { code: 'es', name: 'Spanish', native: 'Español' },
        { code: 'it', name: 'Italian', native: 'Italiano' },
        { code: 'tr', name: 'Turkish', native: 'Türkçe' },
        { code: 'ar', name: 'Arabic', native: 'العربية' },
        { code: 'zh', name: 'Chinese', native: '中文' },
        { code: 'ja', name: 'Japanese', native: '日本語' },
        { code: 'ru', name: 'Russian', native: 'Русский' }
    ];

    const filteredLangs = allLanguages.filter(l => 
        l.name.toLowerCase().includes(langSearch.toLowerCase()) || 
        l.native.toLowerCase().includes(langSearch.toLowerCase()) ||
        l.code.toLowerCase().includes(langSearch.toLowerCase())
    );
    
    // Permission Guard Logic
    const hasPermission = (viewId) => {
        if (simRole === 'manager') return true; // Managers have global access
        if (simRole === 'staff') {
            const defaultStaffHubs = ['overview', 'documents', 'feed', 'reputation', 'sitting'];
            if (defaultStaffHubs.includes(viewId)) return true;
            const staffPermissions = user?.permissions || [];
            return staffPermissions.includes(viewId);
        }
        return false;
    };
    const userEmailKey = user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'default';
    const isDemo = ['manager@green.de', 'restaurant@green.de', 'club@green.de', 'hotel@green.de', 'stadium@green.de'].includes(user?.email?.toLowerCase());

    const [staffList, setStaffList] = useState(() => {
        const saved = localStorage.getItem(`green_staff_list_${userEmailKey}`);
        if (saved) return JSON.parse(saved);
        return [];
    });

    const [orders, setOrders] = useState(() => {
        const saved = localStorage.getItem(`green_active_orders_${userEmailKey}`);
        if (saved) return JSON.parse(saved);
        return [];
    });
    
    // Determine the initial context based on manager email/identity
    const getInitialContext = () => {
        if (user?.businessType && user?.businessType !== 'ALL') return user.businessType;
        if (user?.email?.includes('bar')) return 'BM';
        if (user?.email?.includes('restaurant') || user?.email?.includes('food')) return 'RM';
        if (user?.email?.includes('hotel') || user?.email?.includes('palace')) return 'HM';
        if (user?.email?.includes('club') || user?.email?.includes('party')) return 'CM';
        if (user?.email?.includes('stadium')) return 'SM';
        return 'FM'; // Default to Fleet Manager
    };

    const [managerContext, setManagerContext] = useState(() => {
        const saved = localStorage.getItem(`green_manager_context_${userEmailKey}`);
        if (saved) return saved;
        const ctx = getInitialContext();
        localStorage.setItem(`green_manager_context_${userEmailKey}`, ctx);
        return ctx;
    });

    // Fleet Manager Drivers State (NUR FÜR FLOTTEN MANAGER)
    const [driversList, setDriversList] = useState(() => {
        const saved = localStorage.getItem(`green_fleet_drivers_${userEmailKey}`);
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return [
            {
                id: 'drv_1',
                name: 'Sami Rahimi',
                phone: '+49 176 8829 1029',
                email: 'sami.rahimi@green-fleet.de',
                licenseNumber: 'B0892019382',
                vehicleAssigned: 'Tesla Model S Plaid (F-GR 777E)',
                status: 'Aktiv',
                approvalStatus: 'Approved',
                accessCode: 'DRV-7771-FM',
                pScheinDoc: { name: 'PSchein_Sami.pdf' },
                fuehrerscheinDoc: { name: 'Fuehrerschein_Sami.pdf' },
                ausweisDoc: { name: 'Pass_Sami.pdf' },
                rating: 4.95,
                tripsCompleted: 342,
                photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&fit=crop'
            },
            {
                id: 'drv_2',
                name: 'Darius Meier',
                phone: '+49 172 4432 9911',
                email: 'darius.m@green-fleet.de',
                licenseNumber: 'B0441920311',
                vehicleAssigned: 'Mercedes-Benz EQS (F-GR 888E)',
                status: 'Aktiv',
                approvalStatus: 'Approved',
                accessCode: 'DRV-8882-FM',
                pScheinDoc: { name: 'PSchein_Darius.pdf' },
                fuehrerscheinDoc: { name: 'Fuehrerschein_Darius.pdf' },
                ausweisDoc: { name: 'Pass_Darius.pdf' },
                rating: 4.88,
                tripsCompleted: 218,
                photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop'
            },
            {
                id: 'drv_3',
                name: 'Elena Rostova',
                phone: '+49 151 8877 6655',
                email: 'elena.r@green-fleet.de',
                licenseNumber: 'B0993021948',
                vehicleAssigned: 'Porsche Taycan (F-GR 999E)',
                status: 'Pause',
                approvalStatus: 'Approved',
                accessCode: 'DRV-9993-FM',
                pScheinDoc: { name: 'PSchein_Elena.pdf' },
                fuehrerscheinDoc: { name: 'Fuehrerschein_Elena.pdf' },
                ausweisDoc: { name: 'Pass_Elena.pdf' },
                rating: 5.0,
                tripsCompleted: 189,
                photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&fit=crop'
            }
        ];
    });

    // Fleet Manager Vehicles State (NUR FÜR FLOTTEN MANAGER)
    const [vehiclesList, setVehiclesList] = useState(() => {
        const saved = localStorage.getItem(`green_fleet_vehicles_${userEmailKey}`);
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return [
            {
                id: 'veh_1',
                make: 'Tesla',
                model: 'Model S Plaid',
                licensePlate: 'F-GR 777E',
                year: '2024',
                category: 'VIP Executive',
                batteryLevel: 94,
                assignedDriver: 'Sami Rahimi',
                status: 'Bereit',
                ratePerHour: '85 € / Std.',
                images: [
                    'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&fit=crop',
                    'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&fit=crop'
                ]
            },
            {
                id: 'veh_2',
                make: 'Mercedes-Benz',
                model: 'EQS 450+ AMG Line',
                licensePlate: 'F-GR 888E',
                year: '2024',
                category: 'First Class Luxury',
                batteryLevel: 88,
                assignedDriver: 'Darius Meier',
                status: 'In Fahrt',
                ratePerHour: '95 € / Std.',
                images: [
                    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&fit=crop',
                    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&fit=crop'
                ]
            },
            {
                id: 'veh_3',
                make: 'Porsche',
                model: 'Taycan 4S Cross Turismo',
                licensePlate: 'F-GR 999E',
                year: '2024',
                category: 'Sport VIP Shuttle',
                batteryLevel: 100,
                assignedDriver: 'Elena Rostova',
                status: 'Bereit',
                ratePerHour: '110 € / Std.',
                images: [
                    'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&fit=crop'
                ]
            }
        ];
    });

    // Modals for Driver & Vehicle registration
    const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
    const [newDriverForm, setNewDriverForm] = useState({
        name: '',
        phone: '',
        email: '',
        licenseNumber: '',
        vehicleAssigned: 'Kein Fahrzeug',
        status: 'Aktiv',
        photoUrl: ''
    });

    const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
    const [newVehicleForm, setNewVehicleForm] = useState({
        make: '',
        model: '',
        licensePlate: '',
        year: '2024',
        category: 'VIP Executive',
        batteryLevel: 100,
        assignedDriver: 'Kein Fahrer',
        status: 'Wartend auf Admin-Freigabe',
        approvalStatus: 'Pending Admin Verification',
        ratePerHour: '90 € / Std.',
        images: [],
        konzessionDoc: null,
        tuevDoc: null,
        fahrzeugscheinDoc: null,
        versicherungsDoc: null
    });

    useEffect(() => {
        localStorage.setItem(`green_fleet_drivers_${userEmailKey}`, JSON.stringify(driversList));
    }, [driversList, userEmailKey]);

    useEffect(() => {
        localStorage.setItem(`green_fleet_vehicles_${userEmailKey}`, JSON.stringify(vehiclesList));
    }, [vehiclesList, userEmailKey]);


    const complianceDocDefinitions = [
        {
            key: 'gewerbe',
            title: '1. Gewerbeanmeldung (GewA 1)',
            subtitle: 'Amtlicher Nachweis des Gewerbeamts über den angemeldeten Betrieb gem. § 14 GewO.',
            badge: 'Zwingend erforderlich (GewO)',
            numberLabel: 'Gewerbe-Registernummer / Aktenzeichen',
            numberPlaceholder: 'z.B. GewA-2026-98124',
            dateLabel: 'Datum der Gewerbeanmeldung',
            required: true
        },
        {
            key: 'konzession',
            title: '2. Genehmigungsurkunde / Konzession (§ 47 Taxi / § 49 PBefG)',
            subtitle: 'Konzessionsurkunde der Verkehrsbehörde für den gewerblichen Gelegenheitsverkehr / Mietwagenverkehr.',
            badge: 'Konzession nach PBefG',
            numberLabel: 'Konzessionsnummer / Ordnungsnummer',
            numberPlaceholder: 'z.B. FFM-PBefG-TX-402',
            dateLabel: 'Gültig bis (Ablaufdatum)',
            required: true
        },
        {
            key: 'unternehmerschein',
            title: '3. IHK-Fachkundenachweis / Unternehmerschein',
            subtitle: 'Fachliche Eignung für den Taxi- & Mietwagenverkehr gem. PBefG (Prüfungszeugnis der IHK).',
            badge: 'IHK-Fachkundenachweis',
            numberLabel: 'IHK-Zertifikatsnummer / Aktenzeichen',
            numberPlaceholder: 'z.B. IHK-FFM-FK-8819',
            dateLabel: 'Zertifikats- / Prüfungsdatum',
            required: true
        },
        {
            key: 'versicherung',
            title: '4. Kfz-Haftpflicht mit Personenbeförderung (Flottenpolice)',
            subtitle: 'Deckungsbestätigung der Versicherung für Personenbeförderungsrisiken nach StVG.',
            badge: 'Flotten-Deckungsschutz',
            numberLabel: 'Versicherung & Policennummer',
            numberPlaceholder: 'z.B. Allianz Fleet Pol-99382',
            dateLabel: 'Gültig bis (Policenablauf)',
            required: false
        }
    ];

    const [profileForm, setProfileForm] = useState(() => {
        const saved = localStorage.getItem(`green_manager_profile_${userEmailKey}`);
        let parsed = null;
        if (saved) {
            try { parsed = JSON.parse(saved); } catch (e) {}
        }
        return {
            firstName: parsed?.firstName || user?.firstName || user?.name?.split(' ')[0] || 'Khiam',
            lastName: parsed?.lastName || user?.lastName || user?.name?.split(' ').slice(1).join(' ') || 'Azizi',
            email: parsed?.email || user?.email || 'manager@hotel.de',
            phone: parsed?.phone || user?.phone || '+49 176 12345678',
            businessName: parsed?.businessName || user?.businessName || (managerContext === 'HM' ? 'Green Palace & Spa Hotel' : 'Green Stadium Arena'),
            address: parsed?.address || user?.address || 'Königsallee 42',
            zip: parsed?.zip || user?.zip || '40212',
            city: parsed?.city || user?.city || 'Düsseldorf',
            country: parsed?.country || user?.country || 'Deutschland',
            avatarUrl: parsed?.avatarUrl || user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&fit=crop',
            documents: parsed?.documents || {
                gewerbe: null,
                konzession: null,
                unternehmerschein: null,
                versicherung: null
            }
        };
    });
    const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

    const handleManagerDocUpload = (docKey, file) => {
        if (!file) return;
        
        if (file.size > 15 * 1024 * 1024) {
            alert('Die Datei ist größer als 15 MB. Bitte komprimieren oder eine kleinere Datei wählen.');
            return;
        }

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const newDoc = {
                id: docKey,
                name: file.name,
                type: isPdf ? 'pdf' : 'image',
                size: (file.size / 1024).toFixed(1) + ' KB',
                dataUrl: dataUrl,
                uploadedAt: new Date().toLocaleDateString('de-DE'),
                status: 'pending',
                docNumber: profileForm.documents?.[docKey]?.docNumber || '',
                expiryDate: profileForm.documents?.[docKey]?.expiryDate || ''
            };

            setProfileForm(prev => {
                const nextDocs = {
                    ...(prev.documents || {}),
                    [docKey]: newDoc
                };
                const nextState = { ...prev, documents: nextDocs };
                localStorage.setItem(`green_manager_profile_${userEmailKey}`, JSON.stringify(nextState));
                return nextState;
            });

            triggerNotification('success', 'Dokument hochgeladen 📄', `${file.name} erfolgreich erfasst (${isPdf ? 'PDF' : 'Foto'}).`);

            if (user?.email && fbDb) {
                try {
                    const userRef = doc(fbDb, 'users', user.email.toLowerCase());
                    updateDoc(userRef, {
                        [`complianceDocs.${docKey}`]: {
                            id: docKey,
                            name: file.name,
                            type: isPdf ? 'pdf' : 'image',
                            size: (file.size / 1024).toFixed(1) + ' KB',
                            status: 'pending',
                            uploadedAt: new Date().toISOString(),
                            docNumber: profileForm.documents?.[docKey]?.docNumber || '',
                            expiryDate: profileForm.documents?.[docKey]?.expiryDate || '',
                            fileData: dataUrl.length < 800000 ? dataUrl : null
                        },
                        [`complianceDocs._metadata`]: {
                            email: user.email,
                            name: user.name || `${profileForm.firstName} ${profileForm.lastName}`,
                            businessName: profileForm.businessName,
                            context: managerContext,
                            updatedAt: new Date().toISOString()
                        }
                    }).catch(err => console.log('Firestore doc sync info:', err));
                } catch(e) {}
            }
        };
        reader.readAsDataURL(file);
    };

    const handleManagerDocMetadataChange = (docKey, field, value) => {
        setProfileForm(prev => {
            const currentDoc = prev.documents?.[docKey] || {
                id: docKey,
                status: 'pending',
                name: '',
                dataUrl: null
            };
            const updatedDoc = { ...currentDoc, [field]: value };
            const nextDocs = {
                ...(prev.documents || {}),
                [docKey]: updatedDoc
            };
            const nextState = { ...prev, documents: nextDocs };
            localStorage.setItem(`green_manager_profile_${userEmailKey}`, JSON.stringify(nextState));
            return nextState;
        });
    };

    const handleRemoveManagerDoc = (docKey) => {
        if (!window.confirm('Möchten Sie dieses Dokument wirklich entfernen?')) return;
        setProfileForm(prev => {
            const nextDocs = { ...(prev.documents || {}) };
            delete nextDocs[docKey];
            const nextState = { ...prev, documents: nextDocs };
            localStorage.setItem(`green_manager_profile_${userEmailKey}`, JSON.stringify(nextState));
            return nextState;
        });
        triggerNotification('info', 'Dokument entfernt 🗑️', 'Das Dokument wurde aus dem Profil gelöscht.');
    };

    const handleOpenDocumentPreview = (docObj) => {
        if (!docObj || !docObj.dataUrl) return;
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.title = `${docObj.name || 'Dokument'} - Khiam Green Compliance`;
            if (docObj.type === 'pdf' || docObj.name?.toLowerCase().endsWith('.pdf')) {
                newWindow.document.body.style.margin = '0';
                newWindow.document.body.innerHTML = `
                    <iframe src="${docObj.dataUrl}" style="position:fixed; top:0; left:0; bottom:0; right:0; width:100%; height:100%; border:none; margin:0; padding:0; overflow:hidden; z-index:999999;">
                        Ihr Browser unterstützt keine eingebetteten PDFs. <a href="${docObj.dataUrl}" download="${docObj.name}">Hier herunterladen</a>
                    </iframe>
                `;
            } else {
                newWindow.document.body.style.margin = '0';
                newWindow.document.body.style.background = '#0a0f1d';
                newWindow.document.body.style.display = 'flex';
                newWindow.document.body.style.flexDirection = 'column';
                newWindow.document.body.style.justifyContent = 'center';
                newWindow.document.body.style.alignItems = 'center';
                newWindow.document.body.style.height = '100vh';
                newWindow.document.body.style.fontFamily = 'system-ui, sans-serif';
                newWindow.document.body.innerHTML = `
                    <div style="padding:12px 24px; background:rgba(255,255,255,0.06); border-radius:12px; color:#10b981; font-weight:bold; margin-bottom:16px;">
                        📄 ${docObj.name} (${docObj.size || ''}) - Khiam Green Verifikation
                    </div>
                    <img src="${docObj.dataUrl}" style="max-width:92vw; max-height:85vh; border-radius:16px; box-shadow:0 25px 60px rgba(0,0,0,0.8); border:1px solid rgba(255,255,255,0.1);" alt="Dokumentenvorschau" />
                `;
            }
        }
    };

    // Compliance Document States
    const [complianceDocs, setComplianceDocs] = useState({});

    // Fleet Weekly Ledger & Cancellation Analytics state
    const [fleetFinanceSubTab, setFleetFinanceSubTab] = useState('ledger'); // 'ledger' | 'cancellations' | 'audit'
    const [fleetPeriod, setFleetPeriod] = useState('KW41'); // 'KW41' | 'KW40' | any KW
    const [kwSearchQuery, setKwSearchQuery] = useState('');

    // Dynamic Helper to generate exact dates & realistic metrics for ANY Kalenderwoche (Past, Present & Future)
    const getFleetWeekMetrics = useMemo(() => {
        return (kwString) => {
            const kwNum = Math.max(1, Math.min(52, parseInt(String(kwString).replace(/[^0-9]/g, '')) || 41));
            const anchorKW = 41;
            const anchorMon = new Date(2026, 8, 29); // 29.09.2026 (KW 41 Montag)
            const diff = kwNum - anchorKW;
            const mon = new Date(anchorMon.getTime() + diff * 7 * 86400000);
            const sun = new Date(mon.getTime() + 6 * 86400000);
            const pad = n => String(n).padStart(2, '0');
            const f = d => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`;
            const fFull = d => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;

            const seed = (kwNum * 9301 + 49297) % 233280;
            const factor = 0.88 + (seed % 28) / 100;

            let tripsTotal = 0;
            let grossTotal = 0.00;
            let tripsCard = 0;
            let tripsCash = 0;
            let grossCard = 0.00;
            let grossCash = 0.00;
            let stornos = 0;

            if (kwNum > 41) {
                // Zukunft: Es haben noch keine Fahrten stattgefunden - Werte sind komplett leer (0 € / 0 Fahrten)
                tripsTotal = 0;
                tripsCard = 0;
                tripsCash = 0;
                grossTotal = 0.00;
                grossCard = 0.00;
                grossCash = 0.00;
                stornos = 0;
            } else if (kwNum === 41) {
                tripsTotal = 128;
                tripsCard = 94;
                tripsCash = 34;
                grossTotal = 4860.00;
                grossCard = 3620.00;
                grossCash = 1240.00;
                stornos = 14;
            } else if (kwNum === 40) {
                tripsTotal = 119;
                tripsCard = 86;
                tripsCash = 33;
                grossTotal = 4410.00;
                grossCard = 3240.00;
                grossCash = 1170.00;
                stornos = 12;
            } else {
                tripsTotal = Math.round(122 * factor);
                tripsCash = Math.round(tripsTotal * 0.27);
                tripsCard = tripsTotal - tripsCash;
                grossTotal = Math.round(4650 * factor);
                grossCash = Math.round(grossTotal * 0.26);
                grossCard = grossTotal - grossCash;
                stornos = Math.round(10 * factor);
            }

            const commRate = 0.15;
            const commTotal = grossTotal * commRate;
            const commCard = grossCard * commRate;
            const commCashOffset = grossCash * commRate;
            const stripeNetPayout = grossTotal === 0 ? 0.00 : Math.max(0, grossCard - commCard - commCashOffset + (stornos > 0 ? 19.50 : 0));
            const fleetTotal = grossCash + stripeNetPayout;

            const dayWeights = [0.13, 0.14, 0.12, 0.16, 0.20, 0.15, 0.10];
            const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d, i) => {
                const curDate = new Date(mon.getTime() + i * 86400000);
                const dayTot = grossTotal === 0 ? 0 : Math.round(grossTotal * dayWeights[i]);
                const dayCash = grossTotal === 0 ? 0 : Math.round(dayTot * 0.26);
                const dayCard = dayTot - dayCash;
                return {
                    d,
                    date: f(curDate),
                    card: dayCard,
                    cash: dayCash,
                    tot: dayTot,
                    h: grossTotal === 0 ? 0 : Math.min(100, Math.round((dayTot / (grossTotal * 0.21)) * 100))
                };
            });

            return {
                kwNum,
                kwKey: `KW${kwNum}`,
                label: `KW ${pad(kwNum)}`,
                rangeStr: `${f(mon)} – ${fFull(sun)}`,
                fullLabel: `KW ${pad(kwNum)} (${f(mon)} – ${fFull(sun)})`,
                isCurrent: kwNum === 41,
                isPast: kwNum < 41,
                isFuture: kwNum > 41,
                tripsTotal,
                tripsCard,
                tripsCash,
                grossTotal,
                grossCard,
                grossCash,
                commTotal,
                commCard,
                commCashOffset,
                stripeNetPayout,
                fleetTotal,
                stornos,
                days
            };
        };
    }, []);

    const activeWeekMetrics = useMemo(() => {
        return getFleetWeekMetrics(fleetPeriod);
    }, [fleetPeriod, getFleetWeekMetrics]);
    const [fleetAuditFilter, setFleetAuditFilter] = useState('all'); // 'all' | 'cash' | 'card' | 'storno_customer' | 'storno_driver'
    const [isDriverCashSheetOpen, setIsDriverCashSheetOpen] = useState(false);

    // Real-time Firestore sync for compliance documents
    useEffect(() => {
        if (!user?.email) return;
        const userRef = doc(fbDb, 'users', user.email.toLowerCase());
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.complianceDocs) {
                    setComplianceDocs(data.complianceDocs);
                } else {
                    setComplianceDocs({});
                }
            }
        });
        return () => unsubscribe();
    }, [user?.email]);

    // Real-time Firestore sync for all orders across devices
    useEffect(() => {
        if (!user?.email) return;
        const ordersRef = collection(fbDb, 'orders');
        // Filter by venueEmail to satisfy Firestore security rules and only load relevant orders
        const targetEmail = (simRole === 'staff' && user?.managerId) ? user.managerId.toLowerCase() : user.email.toLowerCase();
        const q = query(ordersRef, where('venueEmail', '==', targetEmail));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                // Merge the document ID if needed, but managerOrders usually have their own 'id' field
                fetchedOrders.push({
                    ...data,
                    // If no explicit ID was saved, fallback to doc ID
                    id: data.id || docSnap.id
                });
            });
            // Reverse once so newest are at the top (if they were added sequentially)
            fetchedOrders.reverse();
            setOrders(fetchedOrders);
            // Also keep local storage in sync
            safeSetItem(`green_active_orders_${userEmailKey}`, JSON.stringify(fetchedOrders));
        }, (error) => {
            console.error("Error syncing orders from Firestore:", error);
        });
        
        return () => unsubscribe();
    }, [user?.email, userEmailKey, simRole, user?.managerId]);

    const requiredDocIds = simRole === 'staff'
        ? ['passport_id', 'work_permit', 'bank_details']
        : (managerContext === 'FM' 
            ? ['tl', 'fip', 'cc', 'vr', 'tuv', 'es', 'sepa', 'vatc', 'bankv']
            : ['reg', 'mid', 'tax', 'gast', 'liq', 'fire', 'sepa', 'vatc', 'bankv']);

    const getComplianceStatus = () => {
        const missing = [];
        const pending = [];
        const rejected = [];
        const approved = [];
        requiredDocIds.forEach(id => {
            const docState = complianceDocs[id];
            if (!docState || docState.status === 'missing') {
                missing.push(id);
            } else if (docState.status === 'pending') {
                pending.push(id);
            } else if (docState.status === 'rejected') {
                rejected.push(id);
            } else if (docState.status === 'approved') {
                approved.push(id);
            }
        });
        return {
            missing,
            pending,
            rejected,
            approved,
            isApproved: approved.length === requiredDocIds.length
        };
    };

    const handleDocumentUpload = (docId, file) => {
        if (!file || !user?.email) return;
        
        setUploadStatus('processing');
        setUploadProgress(0);
        
        const storagePath = `compliance_docs/${user.email.toLowerCase()}/${docId}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setUploadProgress(progress);
            }, 
            (error) => {
                console.error("Document upload failed: ", error);
                setUploadStatus('error');
                alert(`❌ Upload failed: ${error.message}`);
            }, 
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    const userRef = doc(fbDb, 'users', user.email.toLowerCase());
                    
                    await updateDoc(userRef, {
                        [`complianceDocs.${docId}`]: {
                            id: docId,
                            name: file.name,
                            size: (file.size / 1024).toFixed(1) + ' KB',
                            status: 'pending',
                            uploadedAt: new Date().toISOString(),
                            fileUrl: downloadURL
                        },
                        [`complianceDocs._metadata`]: {
                            email: user.email,
                            name: user.name || 'Partner Manager',
                            businessName: getBusinessName(),
                            context: managerContext,
                            updatedAt: new Date().toISOString()
                        }
                    });
                    
                    setUploadStatus('complete');
                    setTimeout(() => {
                        setUploadStatus(null);
                        setUploadProgress(0);
                    }, 2000);
                    
                } catch (err) {
                    console.error("Error saving uploaded doc URL to Firestore: ", err);
                    setUploadStatus('error');
                }
            }
        );
    };

    const handleViewDocument = (docState) => {
        const url = docState?.fileUrl || docState?.fileData;
        if (!url) return;
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.title = docState.name || 'Document View';
            newWindow.document.body.style.margin = '0';
            newWindow.document.body.style.background = '#0a0a0a';
            newWindow.document.body.style.display = 'flex';
            newWindow.document.body.style.justifyContent = 'center';
            newWindow.document.body.style.alignItems = 'center';
            newWindow.document.body.style.height = '100vh';
            
            const isImage = url.startsWith('data:image/') || url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('alt=media');
            if (isImage) {
                const img = newWindow.document.createElement('img');
                img.src = url;
                img.style.maxWidth = '90%';
                img.style.maxHeight = '90%';
                img.style.borderRadius = '12px';
                img.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5)';
                newWindow.document.body.appendChild(img);
            } else {
                const iframe = newWindow.document.createElement('iframe');
                iframe.src = url;
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                newWindow.document.body.appendChild(iframe);
            }
        }
    };

    // A helper to auto-approve all documents for developer testing
    const handleDevAutoApprove = async () => {
        if (!user?.email) return;
        const userRef = doc(fbDb, 'users', user.email.toLowerCase());
        const autoDocs = {};
        requiredDocIds.forEach(id => {
            autoDocs[id] = {
                id,
                name: `Auto_Generated_${id}.pdf`,
                size: '150.0 KB',
                status: 'approved',
                uploadedAt: new Date().toISOString(),
                fileData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100"><rect width="100" height="100" fill="%2310b981"/><text x="50" y="50" font-family="sans-serif" font-size="8" fill="white" text-anchor="middle">APPROVED DOCUMENT</text></svg>'
            };
        });
        
        try {
            await updateDoc(userRef, {
                complianceDocs: {
                    ...autoDocs,
                    _metadata: {
                        email: user.email,
                        name: user.name || 'Partner Manager',
                        businessName: getBusinessName(),
                        context: managerContext,
                        updatedAt: new Date().toISOString()
                    }
                }
            });
            alert('✅ Developer Auto-Approve: All documents created and approved successfully in Firestore!');
        } catch (err) {
            console.error('Failed to auto approve compliance docs: ', err);
            alert('❌ Failed to update Firestore with approved documents.');
        }
    };

    // Dynamic Commission and Payout Calculations based on business type
    const commissionData = useMemo(() => {
        const gross = isDemo ? 15280.00 : orders.filter(o => o.status === 'Paid' || o.status === 'Served' || o.status === 'Departed').reduce((acc, curr) => acc + parseFloat(curr.total || 0), 0);
        let rateLabel = "Platform Comm. (15%)";
        let commVal = gross * 0.15;
        let isFree = false;

        if (managerContext === 'HM' || managerContext === 'SM') {
            rateLabel = "Platform Comm. (3%)";
            commVal = gross * 0.03;
        } else if (managerContext === 'RM' || managerContext === 'BM' || managerContext === 'CM') {
            rateLabel = "Platform Comm. (0% - Free Partner)";
            commVal = 0.00;
            isFree = true;
        } else if (managerContext === 'FM') {
            rateLabel = "Platform Comm. (Staffel / Degressive)";
            commVal = isDemo ? 1180.00 : gross * 0.08; 
        }

        return {
            gross: gross,
            rateLabel: rateLabel,
            commission: commVal,
            settlement: gross - commVal,
            isFree: isFree
        };
    }, [managerContext, orders, isDemo]);

    // Dynamic Top Level Financials Summary (Mock for Demo, calculated from active orders otherwise)
    const financialsSummary = useMemo(() => {
        if (isDemo) {
            return {
                primarySales: 8450.00,
                premiumSales: 5200.00,
                ancillarySales: 1630.00,
                txVolume: 1420
            };
        }
        
        const completedOrders = orders.filter(o => o.status === 'Paid' || o.status === 'Served' || o.status === 'Departed');
        
        const primarySales = completedOrders
            .filter(o => o.type !== 'VIP Table 1' && o.type !== 'VIP' && o.type !== 'VIP Premium')
            .reduce((acc, curr) => acc + parseFloat(curr.total || 0), 0);
            
        const premiumSales = completedOrders
            .filter(o => o.type === 'VIP Table 1' || o.type === 'VIP' || o.type === 'VIP Premium')
            .reduce((acc, curr) => acc + parseFloat(curr.total || 0), 0);
            
        const ancillarySales = completedOrders.reduce((acc, curr) => {
            const hasAncillary = curr.items && curr.items.some(item => {
                const itemName = typeof item === 'string' ? item : (item.name || '');
                return itemName.toLowerCase().includes('drink') || 
                       itemName.toLowerCase().includes('fries') || 
                       itemName.toLowerCase().includes('cocktail') || 
                       itemName.toLowerCase().includes('ancillary');
            });
            return hasAncillary ? acc + parseFloat(curr.total || 0) : acc;
        }, 0);
        
        const txVolume = completedOrders.length;
        
        return {
            primarySales,
            premiumSales,
            ancillarySales,
            txVolume
        };
    }, [orders, isDemo]);

    const [selectedGuest, setSelectedGuest] = useState(null);
    const [messageOrder, setMessageOrder] = useState(null);
    const [customMessage, setCustomMessage] = useState('');

    // Dynamic Industry Terminology Mapping
    const getTacticalLabels = () => {
        const labels = {
            HM: { unit: 'Room Number', id: 'Booking Ref', badge: 'Hotel' },
            RM: { unit: 'Table Number', id: 'Check ID', badge: 'Dining' },
            BM: { unit: 'Table Number', id: 'Ticket ID', badge: 'Bar' },
            CM: { unit: 'Table Number', id: 'Guest ID', badge: 'Nightlife' },
            SM: { unit: 'Ticket Inventory', id: 'Batch ID', badge: 'Stadium' },
            FM: { unit: 'Vehicle ID', id: 'Mission ID', badge: 'Fleet' }
        };
        return labels[managerContext] || { unit: 'Unit', id: 'Order ID', badge: 'General' };
    };
    const tLabel = getTacticalLabels();

    const [stadiumSeats, setStadiumSeats] = useState(() => {
        const sectors = ['Sector A', 'Sector B', 'VIP Box', 'Press'];
        const initial = {};
        sectors.forEach(s => {
            initial[s] = Array.from({ length: 15 }).map((_, i) => ({
                id: i + 1,
                status: isDemo ? ((i + 1) % 4 === 0 ? 'occupied' : 'available') : 'available',
                guest: isDemo ? ((i + 1) % 4 === 0 ? 'Julian R.' : null) : null
            }));
        });
        return initial;
    });
    const [selectedSeat, setSelectedSeat] = useState(null);

    const [isAddingVehicle, setIsAddingVehicle] = useState(false);
    const [newVehicleData, setNewVehicleData] = useState({ model: '', year: '', plate: '', color: '', concession: '', assignedDriver: 'None', photo: null });
    const [globalPosts, setGlobalPosts] = useState(() => JSON.parse(localStorage.getItem('green_global_posts') || '[]'));

    useEffect(() => {
        // HQ SENTINEL: Staff are allowed in the Manager Portal for business operations (Bar, Restaurant, etc.)
        // Fleet staff (FM) are traditionally drivers, but for testing and support, we allow dashboard entry
        // and let the hasPermission() logic handle internal view security.
    }, [managerContext, simRole, navigate]);

    const getBusinessName = (ctx = managerContext) => {
        if (user?.businessInfo?.legalName) {
            return user.businessInfo.legalName;
        }
        if (user?.businessName) {
            return user.businessName;
        }
        switch(ctx) {
            case 'BM': return "The Blue Velvet Bar";
            case 'RM': return "Saffron Fine Dining";
            case 'HM': return "Green Palace & Spa";
            case 'CM': return "Midnight Club & Lounge";
            case 'VM': return "Veranstaltung: Gala 2026";
            case 'SM': return "Green Stadium Arena";
            default: return "Green Fleet Operations";
        }
    };

    const [isInternalSidebarCollapsed, setIsInternalSidebarCollapsed] = useState(window.innerWidth < 1024);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [securityPassword, setSecurityPassword] = useState('1234'); 
    const [passInput, setPassInput] = useState('');
    const [showSecurityGate, setShowSecurityGate] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [resetStep, setResetStep] = useState('verify'); 
    const [currentPasswordInput, setCurrentPasswordInput] = useState('');
    const [newPasswordInput, setNewPasswordInput] = useState('');
    const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
    const [orderFilter, setOrderFilter] = useState('New');
    const [orderSearch, setOrderSearch] = useState('');

    // STRIPE & BANK ACCOUNT ONBOARDING STATE
    const [stripeConnected, setStripeConnected] = useState(() => localStorage.getItem('green_partner_stripe_connected') === 'true');
    const [stripeAccountId, setStripeAccountId] = useState(() => localStorage.getItem('green_partner_stripe_acc_id') || '');
    const [stripeBankName, setStripeBankName] = useState(() => localStorage.getItem('green_partner_bank_name') || '');
    const [stripeBankIban, setStripeBankIban] = useState(() => localStorage.getItem('green_partner_bank_iban') || '');
    const [stripeBankRouting, setStripeBankRouting] = useState(() => localStorage.getItem('green_partner_bank_routing') || '');
    
    const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
    const [stripeOnboardMode, setStripeOnboardMode] = useState('connect'); // 'connect' | 'create'
    const [stripeInputId, setStripeInputId] = useState('');
    const [stripeFormBankName, setStripeFormBankName] = useState('');
    const [stripeFormIban, setStripeFormIban] = useState('');
    const [stripeFormRouting, setStripeFormRouting] = useState('');
    const [stripeOnboardStep, setStripeOnboardStep] = useState(1); // 1: Details, 2: Bank Payout Setup
    const [stripeLoading, setStripeLoading] = useState(false);
    const [isFeedOpen, setIsFeedOpen] = useState(false);


    // STAFF ONBOARDING STATE
    const [staffSearchId, setStaffSearchId] = useState('');
    const [foundStaff, setFoundStaff] = useState(null);
    const [isSearchingStaff, setIsSearchingStaff] = useState(false);
    const [staffPermissions, setStaffPermissions] = useState({ 
        orders: true, 
        terminal: true, 
        marketing: false, 
        finance: false, 
        compliance: false 
    });
    const [activeTemplate, setActiveTemplate] = useState('pilot');

    const applyTemplate = (templateId) => {
        setActiveTemplate(templateId);
        if (managerContext === 'FM') {
            switch(templateId) {
                case 'pilot':
                    setStaffPermissions({ orders: true, terminal: false, marketing: false, finance: false, compliance: true });
                    break;
                case 'supervisor':
                    setStaffPermissions({ orders: true, terminal: true, marketing: false, finance: true, compliance: true });
                    break;
                case 'accountant':
                    setStaffPermissions({ orders: false, terminal: false, marketing: false, finance: true, compliance: true });
                    break;
                default: break;
            }
        } else {
            switch(templateId) {
                case 'pilot':
                    setStaffPermissions({ orders: true, terminal: true, marketing: true, finance: false, compliance: false });
                    break;
                case 'supervisor':
                    setStaffPermissions({ orders: true, terminal: true, marketing: true, finance: true, compliance: false });
                    break;
                case 'accountant':
                    setStaffPermissions({ orders: false, terminal: false, marketing: false, finance: true, compliance: true });
                    break;
                default: break;
            }
        }
    };

    // GREEN ID SEARCH: find a registered staff/driver by their Green ID
    const handleSearchByGreenId = async () => {
        if (!staffSearchId.trim()) return;
        setIsSearchingStaff(true);
        setFoundStaff(null);

        try {
            const targetId = staffSearchId.trim().toUpperCase();

            // 1. Search in the Firestore 'pending_staff' collection
            const pendingRef = doc(fbDb, 'pending_staff', targetId);
            const pendingSnap = await getDoc(pendingRef);

            if (pendingSnap.exists()) {
                setFoundStaff(pendingSnap.data());
            } else {
                // 2. Fallback: Search the 'users' collection for matching greenId attribute
                const usersRef = collection(fbDb, 'users');
                const q = query(usersRef, where('greenId', '==', targetId));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const docData = querySnapshot.docs[0].data();
                    setFoundStaff({ ...docData, fromUsers: true });
                } else {
                    setFoundStaff(null);
                }
            }
        } catch (error) {
            console.error('Error searching staff by Green ID in Firestore:', error);
            alert('❌ Error querying database for staff details.');
        } finally {
            setIsSearchingStaff(false);
        }
    };

    // ONBOARD: link the found staff to this manager/business
    const handleOnboardStaff = async () => {
        if (!foundStaff) return;

        const managerId = user?.email || 'manager@green.de';
        const businessName = getBusinessName();
        const onboardedAt = new Date().toISOString();
        const permissions = Object.keys(staffPermissions).filter(k => staffPermissions[k]);

        try {
            // 1. Update the document in Firestore pending_staff collection if it exists
            const pendingRef = doc(fbDb, 'pending_staff', foundStaff.greenId);
            const pendingSnap = await getDoc(pendingRef);
            if (pendingSnap.exists()) {
                await updateDoc(pendingRef, {
                    onboarded: true,
                    managerId,
                    businessName,
                    onboardedAt
                });
            }

            // 2. Update the document in Firestore users collection at the registered user's email
            if (foundStaff.email) {
                const userRef = doc(fbDb, 'users', foundStaff.email.toLowerCase());
                const updates = {
                    onboarded: true,
                    managerId,
                    businessName,
                    businessType: managerContext,
                    permissions: permissions
                };
                
                // If onboarded by a Fleet Manager or is a driver, auto-verify compliance documents so driver can go online
                                if (foundStaff.role === 'driver' || managerContext === 'FM') {
                    updates.driverComplianceDocs = [
                        { id: 'avatar', name: 'Profile Photo', status: 'verified', requirement: 'High-resolution headshot for driver profile ID', file: null },
                        { id: 'license', name: 'Driving License', status: 'verified', requirement: 'Class B EU License (Front & Back)', file: null },
                        { id: 'idcard', name: 'Passport / ID Card', status: 'verified', requirement: 'Government-issued biometric passport or national identity card', file: null },
                        { id: 'pschein', name: 'P-Schein (Passenger Permit)', status: 'verified', requirement: 'Passenger Transport License (Personenbeförderungsschein)', file: null },
                        { id: 'terms', name: 'Terms & Conditions', status: 'verified', requirement: 'Accept Platform Partnership & Data Usage Agreement', file: null }
                    ];
                    updates.driverVehicleDocs = [
                        { id: 'tuv', name: 'HU/AU (TÜV)', status: 'verified', requirement: 'Valid main inspection certificate' },
                        { id: 'insurance', name: 'Commercial Insurance', status: 'verified', requirement: 'PBefG-compliant passenger insurance coverage' }
                    ];
                }
                
                await updateDoc(userRef, updates);
            }

            // Add to local staff list for the dashboard
            const newMember = {
                id: foundStaff.greenId,
                name: foundStaff.name,
                role: foundStaff.role === 'driver' ? 'Driver / Pilot' : 'Staff Member',
                status: 'Pending First Login',
                avatar: foundStaff.name,
                permissions: permissions,
                greenId: foundStaff.greenId,
                email: foundStaff.email
            };
            setStaffList(prev => {
                const updated = [...prev, newMember];
                localStorage.setItem(`green_staff_list_${userEmailKey}`, JSON.stringify(updated));
                return updated;
            });

            alert(`✅ ${foundStaff.name} (${foundStaff.greenId}) has been successfully onboarded to ${businessName}!\n\nThey can now log in and access their dashboard.`);
            setFoundStaff(null);
            setStaffSearchId('');
        } catch (error) {
            console.error('Error onboarding staff in Firestore:', error);
            alert('❌ Failed to complete staff onboarding in Firestore.');
        }
    };

    const [isScanningMenu, setIsScanningMenu] = useState(false);
    const [aiDraftMenu, setAiDraftMenu] = useState(null);
    const [menuApprovalPending, setMenuApprovalPending] = useState(false);



    // STADIUM AI AGENT STATE
    const [isScanningSeats, setIsScanningSeats] = useState(false);
    const [aiMatrixResult, setAiMatrixResult] = useState(null);
    const [stadiumEvents, setStadiumEvents] = useState(() => {
        const saved = localStorage.getItem(`green_stadium_events_${userEmailKey}`);
        if (saved) return JSON.parse(saved);
        if (user?.role === 'club') {
            return [
                {
                    id: 'evt-1',
                    name: 'Midnight Neon Festival 2026',
                    date: '2026-06-12',
                    time: '22:00',
                    published: true,
                    tiers: [
                        { id: 't1', name: 'Silver (Normal Ticket)', price: 35, quantity: 1500, sold: 940 },
                        { id: 't2', name: 'Gold (Premium)', price: 120, quantity: 200, sold: 165 },
                        { id: 't3', name: 'Diamond (VIP)', price: 750, quantity: 20, sold: 14 }
                    ]
                }
            ];
        }
        if (user?.role === 'stadium' || user?.role === 'admin') {
            return [
                {
                    id: 'evt-1',
                    name: 'Champions League Final',
                    date: '2024-05-24',
                    time: '20:45',
                    published: true,
                    tiers: [
                        { id: 't1', name: 'Silver (Normal Ticket)', price: 85, quantity: 500, sold: 120 },
                        { id: 't2', name: 'Gold (Premium)', price: 450, quantity: 50, sold: 42 },
                        { id: 't3', name: 'Diamond (VIP)', price: 1200, quantity: 10, sold: 8 }
                    ]
                }
            ];
        }
        return [];
    });

    useEffect(() => {
        if (!userEmailKey) return;
        const fetchCloudEvents = async () => {
            try {
                const docRef = doc(fbDb, 'venue_events', user?.email?.toLowerCase() || userEmailKey);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data && Array.isArray(data.events)) {
                        setStadiumEvents(data.events);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch cloud events", err);
            }
        };
        fetchCloudEvents();
    }, [userEmailKey]);

    const [activeSettingsEvent, setActiveSettingsEvent] = useState(null);
    const [webhookTestType, setWebhookTestType] = useState('email1');
    const [testConsoleLogs, setTestConsoleLogs] = useState([]);
    const [copied, setCopied] = useState(false);
    const [isTestingWebhook, setIsTestingWebhook] = useState(false);

    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [isSimulatingUpload, setIsSimulatingUpload] = useState(false);

    const generateRandomToken = () => {
        const chars = 'abcdef0123456789';
        let token = 'grn_live_evt_';
        for (let i = 0; i < 32; i++) {
            token += chars[Math.floor(Math.random() * chars.length)];
        }
        return token;
    };

    const copyToClipboard = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const updateApiConfig = (fields) => {
        if (!activeSettingsEvent) return;
        const updatedEvents = stadiumEvents.map(evt => {
            if (evt.id === activeSettingsEvent.id) {
                const apiIntegration = {
                    ...(evt.apiIntegration || { active: false, webhookUrl: '', apiKey: '' }),
                    ...fields
                };
                const updatedEvt = { ...evt, apiIntegration };
                setActiveSettingsEvent(updatedEvt);
                return updatedEvt;
            }
            return evt;
        });
        setStadiumEvents(updatedEvents);
        localStorage.setItem(`green_stadium_events_${userEmailKey}`, JSON.stringify(updatedEvents));
        setDoc(doc(fbDb, 'venue_events', user?.email?.toLowerCase() || userEmailKey), { events: updatedEvents }).catch(console.error);
        
        try {
            if (window.parent) {
                window.parent.dispatchEvent(new CustomEvent('green-stadium-events-updated'));
            }
        } catch (e) {
            console.warn(e);
        }
    };

    const handleFireWebhook = () => {
        if (isTestingWebhook || !activeSettingsEvent) return;
        setIsTestingWebhook(true);
        
        setTimeout(() => {
            const timestamp = new Date().toLocaleTimeString();
            const apiConfig = activeSettingsEvent.apiIntegration || { active: false, webhookUrl: '', apiKey: '' };
            
            let mockPayload = {
                action: webhookTestType === 'email1' ? 'send_verification' : 'send_ticket',
                eventId: activeSettingsEvent.id,
                recipientEmail: "customer@partner-system.com",
                guestName: "Alex Riviera",
                ticketType: activeSettingsEvent.tiers[0]?.name || "General Admission"
            };
            
            if (webhookTestType === 'email2') {
                mockPayload.price = activeSettingsEvent.tiers[0]?.price || 35;
                mockPayload.quantity = 1;
            }
            
            let newLog = {
                id: 'log-' + Date.now(),
                time: timestamp,
                method: "POST",
                path: "/v1/tickets/send-email",
                action: mockPayload.action,
                recipient: mockPayload.recipientEmail,
                apiKeyMask: apiConfig.apiKey ? (apiConfig.apiKey.substring(0, 15) + '...') : 'NONE'
            };
            
            if (!apiConfig.apiKey) {
                newLog.status = 401;
                newLog.statusText = 'Unauthorized';
                newLog.latency = '2ms';
                newLog.response = { error: "Missing or invalid Bearer API Key in Authorization header." };
            } else {
                const lat = Math.floor(Math.random() * 150) + 40;
                newLog.status = 200;
                newLog.statusText = 'OK';
                newLog.latency = `${lat}ms`;
                newLog.response = {
                    success: true,
                    message: webhookTestType === 'email1' 
                        ? "Verification Email (Email 1) successfully dispatched to customer@partner-system.com!" 
                        : "Ticket PDF & Confirmation Email (Email 2) successfully dispatched to customer@partner-system.com!",
                    dispatchId: "dsp_" + Math.random().toString(36).substring(2, 10),
                    details: {
                        smtpStatus: "Delivered",
                        relayHost: "smtp.green-stadium.com",
                        timestamp: new Date().toISOString()
                    }
                };
            }
            
            setTestConsoleLogs(prev => [newLog, ...prev].slice(0, 20));
            setIsTestingWebhook(false);
        }, 750);
    };

    const highlightJson = (obj) => {
        const jsonStr = JSON.stringify(obj, null, 2);
        return jsonStr.split('\n').map((line, idx) => {
            const keyMatch = line.match(/^(\s*)"([^"]+)":/);
            if (keyMatch) {
                const indent = keyMatch[1];
                const key = keyMatch[2];
                const rest = line.substring(keyMatch[0].length);
                return (
                    <div key={idx} className="font-mono text-xs md:text-sm lg:text-base leading-5">
                        {indent}<span className="text-brand">"{key}"</span>:{highlightValues(rest)}
                    </div>
                );
            }
            return <div key={idx} className="font-mono text-xs md:text-sm lg:text-base leading-5 text-secondary">{line}</div>;
        });
    };

    const highlightValues = (valStr) => {
        if (valStr.includes('"')) {
            return <span className="text-violet-300">{valStr}</span>;
        }
        return <span className="text-amber-400">{valStr}</span>;
    };

    const fileInputRef = useRef(null);
    const [newEventData, setNewEventData] = useState({ 
        name: '', 
        date: '', 
        time: '', 
        endTime: '',
        address: '',
        file: null,
        tiers: [{ id: 't1', name: 'Silver (Normal Ticket)', price: 45, quantity: 100, sold: 0 }] 
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 800000) {
            alert('Image file is too large. Please select an image smaller than 800KB.');
            return;
        }

        const processFile = (fileUrl) => {
            const fileData = {
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB',
                type: file.type,
                url: fileUrl
            };

            setIsSimulatingUpload(true);
            setTimeout(() => {
                setNewEventData(prev => ({
                    ...prev,
                    file: fileData,
                    tiers: [
                        { id: 't1', name: 'General Admission', price: 35, quantity: 500, sold: 0 },
                        { id: 't2', name: 'VIP Lounge Pass', price: 120, quantity: 150, sold: 0 },
                        { id: 't3', name: 'Ultra VIP Diamond Table', price: 750, quantity: 10, sold: 0 }
                    ]
                }));
                setIsSimulatingUpload(false);
                alert("📂 [AI Manifest Parsed] Successfully extracted ticket tiers from document:\n• General Admission (500 tickets)\n• VIP Lounge Pass (150 tickets)\n• Ultra VIP Diamond Table (10 tickets)");
            }, 1200);
        };

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => processFile(reader.result);
            reader.readAsDataURL(file);
        } else {
            processFile(null);
        }
    };

    const handleSimulateUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleTierFileChange = async (index, e) => {
        const selectedFiles = Array.from(e.target.files).filter(f => f.size <= 800000);
        if (selectedFiles.length === 0) {
            if (e.target.files.length > 0) alert('Image file is too large. Please select an image smaller than 800KB.');
            return;
        }

        const newFilesData = await Promise.all(selectedFiles.map(file => {
            return new Promise((resolve) => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve({
                            name: file.name,
                            size: (file.size / 1024).toFixed(1) + ' KB',
                            type: file.type,
                            url: reader.result
                        });
                    };
                    reader.readAsDataURL(file);
                } else {
                    resolve({
                        name: file.name,
                        size: (file.size / 1024).toFixed(1) + ' KB',
                        type: file.type,
                        url: null
                    });
                }
            });
        }));

        setNewEventData(prev => {
            const updatedTiers = [...prev.tiers];
            if (managerContext === 'CM') {
                const currentFiles = updatedTiers[index].files || [];
                if (updatedTiers[index].file && currentFiles.length === 0) {
                    currentFiles.push(updatedTiers[index].file);
                }
                updatedTiers[index] = { 
                    ...updatedTiers[index], 
                    files: [...currentFiles, ...newFilesData], 
                    verified: false 
                };
            } else {
                updatedTiers[index] = { 
                    ...updatedTiers[index], 
                    file: newFilesData[0], 
                    verified: false 
                };
            }
            return { ...prev, tiers: updatedTiers };
        });
        e.target.value = '';
    };

    const handleRemoveTierFile = (tierIndex, fileIndex) => {
        setNewEventData(prev => {
            const updatedTiers = [...prev.tiers];
            const currentFiles = updatedTiers[tierIndex].files || [];
            const updatedFiles = currentFiles.filter((_, idx) => idx !== fileIndex);
            updatedTiers[tierIndex] = { 
                ...updatedTiers[tierIndex], 
                files: updatedFiles, 
                file: null, 
                verified: updatedFiles.length > 0 ? updatedTiers[tierIndex].verified : false 
            };
            return { ...prev, tiers: updatedTiers };
        });
    };

    const handleSimulateTierUpload = (index) => {
        setNewEventData(prev => {
            const updatedTiers = [...prev.tiers];
            updatedTiers[index] = { ...updatedTiers[index], isSimulating: true };
            return { ...prev, tiers: updatedTiers };
        });

        setTimeout(() => {
            setNewEventData(prev => {
                const updatedTiers = [...prev.tiers];
                const tierName = updatedTiers[index].name || 'Category';
                const currentQty = updatedTiers[index].quantity || 100;
                
                // Add console log
                setTestConsoleLogs(c => [
                    ...c,
                    `[${new Date().toLocaleTimeString()}] AI Parser verified manifest for [${tierName.toUpperCase()}]: Loaded ${currentQty} digital tickets successfully.`
                ]);

                updatedTiers[index] = { 
                    ...updatedTiers[index], 
                    isSimulating: false,
                    verified: true
                };
                setTimeout(() => {
                    alert(`📂 [AI Manifest Parsed] Successfully verified tier tickets!\n• Category: ${tierName}\n• Allocation: ${currentQty} Digital Tickets`);
                }, 100);
                return { ...prev, tiers: updatedTiers };
            });
        }, 1200);
    };

    // HOTEL ROOM HUB STATE & SIMULATOR
    const [roomsData, setRoomsData] = useState(() => {
        const saved = localStorage.getItem('green_hotel_rooms');
        if (saved) return JSON.parse(saved);
        if (isDemo) {
            return [
                { id: '101', name: 'Deluxe King Suite', tier: 'Deluxe', status: 'occupied', guest: 'Julian R.', price: 280, cleanStatus: 'clean' },
                { id: '102', name: 'Deluxe King Suite', tier: 'Deluxe', status: 'available', guest: null, price: 280, cleanStatus: 'clean' },
                { id: '103', name: 'Spa Balcony Suite', tier: 'Premium', status: 'cleaning', guest: null, price: 420, cleanStatus: 'cleaning' },
                { id: '104', name: 'Spa Balcony Suite', tier: 'Premium', status: 'occupied', guest: 'Sarah J.', price: 420, cleanStatus: 'clean' },
                { id: '201', name: 'Emerald Suite', tier: 'Executive', status: 'available', guest: null, price: 650, cleanStatus: 'clean' },
                { id: '202', name: 'Emerald Suite', tier: 'Executive', status: 'occupied', guest: 'Elena M.', price: 650, cleanStatus: 'clean' },
                { id: '301', name: 'Zenith Penthouse', tier: 'Presidential', status: 'available', guest: null, price: 1800, cleanStatus: 'clean' }
            ];
        }
        return [];
    });

    const [pmsApiKey, setPmsApiKey] = useState(isDemo ? 'grn_pms_key_8f3a2c91b8d7e4f0' : '');
    const [reservationEmail, setReservationEmail] = useState('');
    const [pmsConnected, setPmsConnected] = useState(isDemo);
    const [pmsLog, setPmsLog] = useState(() => {
        if (isDemo) {
            return [
                { time: '10:02:15', type: 'info', message: 'PMS Channel Synchronized: 7 rooms parsed.' },
                { time: '09:45:00', type: 'checkin', message: 'Room 202 checked in: Elena M. via Mews Webhook (Auto-Sync).' }
            ];
        }
        return [];
    });

    // Manual room adding form states
    const [newRoomNumber, setNewRoomNumber] = useState('');
    const [newRoomPrice, setNewRoomPrice] = useState('');
    const [newRoomCategory, setNewRoomCategory] = useState('');
    const [newRoomBedLayout, setNewRoomBedLayout] = useState('Single');

    const saveRooms = async (updatedRooms) => {
        setRoomsData(updatedRooms);
        localStorage.setItem('green_hotel_rooms', JSON.stringify(updatedRooms));
        if (user?.email) {
            try {
                const userDocRef = doc(fbDb, 'users', user.email.toLowerCase());
                await updateDoc(userDocRef, { hotelRooms: updatedRooms });
            } catch (err) {
                console.error("Failed to sync rooms to Firestore:", err);
            }
        }
    };

    const handleCreateManualRoom = () => {
        if (!newRoomNumber.trim() || !newRoomPrice || !newRoomCategory.trim()) {
            alert("Validation Error:\nPlease provide a room number, nightly price, and room category.");
            return;
        }

        const exists = roomsData.some(r => r.id === newRoomNumber.trim());
        if (exists) {
            alert(`Validation Error:\nRoom #${newRoomNumber.trim()} already exists in the inventory.`);
            return;
        }

        const newRoom = {
            id: newRoomNumber.trim(),
            name: newRoomCategory.trim(),
            tier: 'Deluxe',
            status: 'available',
            guest: null,
            price: parseFloat(newRoomPrice),
            cleanStatus: 'clean',
            bedLayout: newRoomBedLayout
        };

        const updatedRooms = [...roomsData, newRoom];
        saveRooms(updatedRooms);

        setNewRoomNumber('');
        setNewRoomPrice('');
        setNewRoomCategory('');
        setNewRoomBedLayout('Single');

        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        setPmsLog(prev => [
            { time: timeStr, type: 'info', message: `Manual Room #${newRoom.id} added to inventory (€${newRoom.price}/n).` },
            ...prev
        ]);
        alert(`ROOM INVENTORY UPDATED\n-------------------------------\nRoom #${newRoom.id} has been added successfully!`);
    };

    const handleSimulatePmsBooking = () => {
        const availableRooms = roomsData.filter(r => r.status === 'available');
        if (availableRooms.length === 0) return;
        
        const targetRoom = availableRooms[0];
        const mockGuests = ['David K.', 'Sophia L.', 'Markus W.', 'Amelie S.'];
        const randomGuest = mockGuests[Math.floor(Math.random() * mockGuests.length)];
        
        const updatedRooms = roomsData.map(r => 
            r.id === targetRoom.id 
                ? { ...r, status: 'occupied', guest: randomGuest }
                : r
        );
        saveRooms(updatedRooms);
        
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        setPmsLog(prev => [
            { time: timeStr, type: 'checkin', message: `Room ${targetRoom.id} checked in: ${randomGuest} via Mews Webhook (Auto-Sync).` },
            ...prev
        ]);
    };

    const handleToggleRoomStatus = (roomId) => {
        const updatedRooms = roomsData.map(r => {
            if (r.id === roomId) {
                const nextStatus = r.status === 'available' ? 'occupied' : r.status === 'occupied' ? 'cleaning' : 'available';
                const nextGuest = nextStatus === 'occupied' ? 'Walk-in Guest' : null;
                return { ...r, status: nextStatus, guest: nextGuest };
            }
            return r;
        });
        saveRooms(updatedRooms);
        
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        setPmsLog(prev => [
            { time: timeStr, type: 'override', message: `Manual status override for Room ${roomId}.` },
            ...prev
        ]);
    };

    // DRIVER ASSET PAIRING DEPLOYMENTS
    const [driverDeployments, setDriverDeployments] = useState(() => {
        const saved = localStorage.getItem(`green_driver_deployments_${userEmailKey}`);
        if (saved) return JSON.parse(saved);
        if (isDemo) {
            return [
                { name: 'Marcus H.', status: 'In Service', current: 'Tesla Model 3', rating: 4.9, avatar: 'Marcus' },
                { name: 'Sarah K.', status: 'Standby', current: 'VW ID.4', rating: 5.0, avatar: 'Sarah' },
                { name: 'Thomas M.', status: 'Locked', current: 'None', rating: 0.0, avatar: 'Thomas', isLocked: true }
            ];
        }
        return [];
    });

    useEffect(() => {
        if (!user?.email) return;
        const managerId = user.email.toLowerCase();
        
        const q = query(collection(fbDb, 'users'), where('managerId', '==', managerId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            const deployments = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                list.push({
                    id: data.greenId || doc.id,
                    name: data.name,
                    role: data.role === 'driver' ? 'Driver / Pilot' : 'Staff Member',
                    status: data.status || 'Offline',
                    avatar: data.name,
                    permissions: data.permissions || [],
                    greenId: data.greenId || '',
                    email: data.email,
                    vehicleInfo: data.vehicleInfo || null
                });
                
                if (data.role === 'driver') {
                    deployments.push({
                        name: data.name,
                        status: data.status || 'Standby',
                        current: data.vehicleInfo?.status === 'approved' || data.vehicleInfo?.status === 'pending' ? data.vehicleInfo.model : 'None',
                        rating: data.rating || 5.0,
                        avatar: data.name,
                        vehicleInfo: data.vehicleInfo || null,
                        email: data.email || doc.id
                    });
                }
            });
            
            if (list.length > 0) {
                setStaffList(list);
                localStorage.setItem(`green_staff_list_${userEmailKey}`, JSON.stringify(list));
            } else if (!isDemo) {
                setStaffList([]);
            }
            
            if (deployments.length > 0) {
                setDriverDeployments(prev => {
                    const merged = deployments.map(d => {
                        const local = prev.find(p => p.name === d.name);
                        return local ? { ...d, status: local.status } : d;
                    });
                    localStorage.setItem(`green_driver_deployments_${userEmailKey}`, JSON.stringify(merged));
                    return merged;
                });
            } else if (!isDemo) {
                setDriverDeployments([]);
            }
        });
        
        return () => unsubscribe();
    }, [user?.email, userEmailKey, isDemo]);

    const handleApproveVehicle = async (driverEmail) => {
        try {
            const userRef = doc(fbDb, 'users', driverEmail.toLowerCase());
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const currentVehicle = userSnap.data().vehicleInfo;
                await updateDoc(userRef, {
                    vehicleInfo: {
                        ...currentVehicle,
                        status: 'approved'
                    }
                });
                alert("✅ Vehicle registration approved successfully!");
            }
        } catch (err) {
            console.error("Error approving vehicle:", err);
            alert("❌ Failed to approve vehicle registration.");
        }
    };

    const handleRejectVehicle = async (driverEmail) => {
        try {
            const userRef = doc(fbDb, 'users', driverEmail.toLowerCase());
            await updateDoc(userRef, {
                vehicleInfo: null
            });
            alert("❌ Vehicle registration rejected and reset.");
        } catch (err) {
            console.error("Error rejecting vehicle:", err);
            alert("❌ Failed to reject vehicle registration.");
        }
    };
    const pendingVerifications = useMemo(() => {
        const items = [];
        staffList.forEach(member => {
            if (member.vehicleInfo && (member.vehicleInfo.status === 'pending' || member.vehicleInfo.status === 'awaiting_upload')) {
                items.push({
                    id: member.greenId || member.id,
                    driver: member.name,
                    model: member.vehicleInfo.model,
                    plate: member.vehicleInfo.plate,
                    status: member.vehicleInfo.status,
                    photo: member.vehicleInfo.photo || 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=200&auto=format&fit=crop',
                    email: member.email
                });
            }
        });
        return items;
    }, [staffList]);

    const activeVerificationQueue = useMemo(() => {
        if (pendingVerifications.length > 0) return pendingVerifications;
        if (isDemo) {
            return [
                { id: 'V-882', driver: 'Marcus H.', model: 'Tesla Model 3', plate: 'F-GR-2024', status: 'awaiting_upload', photo: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=200&auto=format&fit=crop' },
                { id: 'V-991', driver: 'Sarah K.', model: 'Mercedes EQE', plate: 'F-GR-9921', status: 'awaiting_verification', hasV5C: true, photo: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?q=80&w=200&auto=format&fit=crop' }
            ];
        }
        return [];
    }, [pendingVerifications, isDemo]);

    const [editingDriver, setEditingDriver] = useState(null);

    const [qrScanStep, setQrScanStep] = useState('idle'); // idle, scanning, result, choices
    const [scannedData, setScannedData] = useState(null);

    const [personalInfo, setPersonalInfo] = useState({
        name: user?.name || 'Authorized Manager',
        email: user?.email || 'admin@green-nightlife.com',
        phone: '+49 152 9821 004',
        address: 'Hauptstraße 12',
        zip: '60311',
        city: 'Frankfurt am Main'
    });

    const [businessInfo, setBusinessInfo] = useState({
        legalName: isDemo ? getBusinessName() : (user?.name ? `${user.name} Operations` : 'My Fleet Ops'),
        address: isDemo ? 'Zeil 106' : '',
        zip: isDemo ? '60313' : '',
        city: isDemo ? 'Frankfurt' : '',
        email: user?.email || '',
        ticketEmail: user?.email || '',
        phone: isDemo ? '+49 69 1234567' : '',
        vatId: isDemo ? 'DE123456789' : ''
    });

    const [bankingInfo, setBankingInfo] = useState({
        iban: isDemo ? 'DE44 1234 5678 9012 3456 78' : '',
        bic: isDemo ? 'MARKDEFFXXX' : '',
        bankName: isDemo ? 'Deutsche Bank AG' : '',
        holder: isDemo ? getBusinessName() : ''
    });

    const [fleetVehicles, setFleetVehicles] = useState(['Tesla Model 3', 'Tesla Model Y', 'VW ID.4', 'Polestar 2', 'BMW i4', 'None']);
    const [registeredVehicles, setRegisteredVehicles] = useState([]);

    useEffect(() => {
        if (!user?.email) return;
        const managerId = user.email.toLowerCase();
        
        const q = query(collection(fbDb, 'vehicles'), where('managerId', '==', managerId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = [];
            const vehiclesList = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                vehiclesList.push({
                    id: doc.id,
                    ...data
                });
                if (data.model) {
                    list.push(data.model);
                }
            });
            setRegisteredVehicles(vehiclesList);
            
            const defaultCatalog = ['Tesla Model 3', 'Tesla Model Y', 'VW ID.4', 'Polestar 2', 'BMW i4'];
            const combinedModels = Array.from(new Set([...list, ...defaultCatalog])).filter(m => m && m !== 'None');
            setFleetVehicles([...combinedModels, 'None']);
        }, (error) => {
            console.error("Error fetching vehicles snapshot:", error);
        });

        return () => unsubscribe();
    }, [user?.email]);

    useEffect(() => {
        if (user) {
            setPersonalInfo({
                name: user.name || 'Authorized Manager',
                email: user.email || 'admin@green-nightlife.com',
                phone: user.phone || '+49 152 9821 004',
                address: user.address || 'Hauptstraße 12',
                zip: user.zip || '60311',
                city: user.city || 'Frankfurt am Main',
                profilePicture: user.profilePicture || ''
            });

            if (user.businessInfo) {
                setBusinessInfo({
                    offer: '',
                    discount: '',
                    ...user.businessInfo
                });
            } else {
                setBusinessInfo({
                    legalName: user.businessName || (user.name ? `${user.name} Operations` : 'My Fleet Ops'),
                    address: user.businessAddress || (isDemo ? 'Zeil 106' : ''),
                    zip: user.businessZip || (isDemo ? '60313' : ''),
                    city: user.businessCity || (isDemo ? 'Frankfurt' : ''),
                    email: user.email || '',
                    phone: user.businessPhone || (isDemo ? '+49 69 1234567' : ''),
                    vatId: user.businessVatId || (isDemo ? 'DE123456789' : ''),
                    offer: '',
                    discount: ''
                });
            }

            if (user.bankingInfo) {
                setBankingInfo(user.bankingInfo);
            }

            if (user.securityPassword) {
                setSecurityPassword(user.securityPassword);
            }

            if (user.hotelRooms) {
                setRoomsData(user.hotelRooms);
            }
        }
    }, [user]);

    const handleSaveGlobalManifest = async () => {
        if (!user?.email) {
            alert("Error: No authenticated session found.");
            return;
        }

        try {
            const userEmail = user.email.toLowerCase();
            const userRef = doc(fbDb, 'users', userEmail);

            const updatedPersonalInfo = {
                ...personalInfo,
                profilePicture: personalInfo.profilePicture || ''
            };

            let stripeAccountId = user.stripeAccountId || null;
            if (bankingInfo.iban && bankingInfo.iban.length > 10) {
                try {
                    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
                    const res = await fetch(`${backendUrl}/api/payment/stripe/connect/onboard`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: userEmail,
                            name: personalInfo.name || userEmail,
                            iban: bankingInfo.iban
                        })
                    });
                    const data = await res.json();
                    if (data.stripeAccountId) {
                        stripeAccountId = data.stripeAccountId;
                    }
                } catch(e) {
                    console.error('Failed to auto-onboard stripe:', e);
                }
            }

            await setDoc(userRef, {
                name: personalInfo.name,
                phone: personalInfo.phone,
                address: personalInfo.address,
                zip: personalInfo.zip,
                city: personalInfo.city,
                profilePicture: personalInfo.profilePicture || '',
                businessInfo: businessInfo,
                bankingInfo: bankingInfo,
                stripeAccountId: stripeAccountId,
                securityPassword: securityPassword
            }, { merge: true });

            localStorage.setItem(`green_personal_info_${userEmailKey}`, JSON.stringify(updatedPersonalInfo));
            localStorage.setItem(`green_business_info_${userEmailKey}`, JSON.stringify(businessInfo));
            localStorage.setItem(`green_banking_info_${userEmailKey}`, JSON.stringify(bankingInfo));
            localStorage.setItem(`green_security_password_${userEmailKey}`, securityPassword);

            if (setUser) {
                setUser(prev => ({
                    ...prev,
                    name: personalInfo.name,
                    phone: personalInfo.phone,
                    address: personalInfo.address,
                    zip: personalInfo.zip,
                    city: personalInfo.city,
                    profilePicture: personalInfo.profilePicture || '',
                    businessInfo: businessInfo,
                    bankingInfo: bankingInfo,
                    securityPassword: securityPassword
                }));
            }

            alert("MANIFEST SAVED: All credentials encrypted and synchronized to Google Cloud in real-time.");
        } catch (error) {
            console.error("Error saving global manifest:", error);
            alert(`Error: Failed to save manifest. ${error.message}`);
        }
    };

    const handleExport = () => {
        alert(`GENERATING DATEV MANIFEST\n--------------------------\nEntity: ${getBusinessName()}\nIndustry Type: ${managerContext}\nTax Jurisdiction: DE/EU\n\nStatus: Encrypted & Industry-Segmented`);
    };

    const handleDownloadPDFReport = () => {
        const businessName = getBusinessName();
        const gross = commissionData.gross;
        const comm = commissionData.commission;
        const net = commissionData.settlement;
        const rateLabel = commissionData.rateLabel;
        const dateStr = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Monthly Performance Report - ${businessName}</title>
                <style>
                    body {
                        font-family: 'Inter', sans-serif;
                        background: #0B121E;
                        color: #FFFFFF;
                        padding: 40px;
                        margin: 0;
                    }
                    .header {
                        border-bottom: 2px solid #00FF88;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: 900;
                        font-style: italic;
                        text-transform: uppercase;
                        color: #00FF88;
                    }
                    .title {
                        font-size: 18px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: #8A99AD;
                        margin-top: 5px;
                    }
                    .meta-grid {
                        display: grid;
                        grid-template-cols: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 40px;
                    }
                    .meta-item {
                        background: #162235;
                        padding: 15px 20px;
                        border-radius: 12px;
                        border: 1px solid rgba(255,255,255,0.05);
                    }
                    .meta-label {
                        font-size: 10px;
                        text-transform: uppercase;
                        color: #8A99AD;
                        font-weight: bold;
                        letter-spacing: 1px;
                    }
                    .meta-value {
                        font-size: 16px;
                        font-weight: bold;
                        margin-top: 5px;
                    }
                    .stats-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 40px;
                    }
                    .stats-table th, .stats-table td {
                        padding: 15px 20px;
                        text-align: left;
                    }
                    .stats-table th {
                        background: #162235;
                        color: #8A99AD;
                        font-size: 11px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    .stats-table td {
                        border-bottom: 1px solid rgba(255,255,255,0.05);
                        font-size: 14px;
                    }
                    .total-row td {
                        font-weight: bold;
                        font-size: 16px;
                        color: #00FF88;
                        border-bottom: 2px solid #00FF88;
                    }
                    .footer {
                        text-align: center;
                        font-size: 10px;
                        color: #8A99AD;
                        margin-top: 60px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    @media print {
                        body {
                            background: white;
                            color: black;
                            padding: 20px;
                        }
                        .meta-item {
                            background: #F4F6F8;
                            border: 1px solid #E2E8F0;
                            color: black;
                        }
                        .meta-label {
                            color: #4A5568;
                        }
                        .stats-table th {
                            background: #F4F6F8;
                            color: #4A5568;
                        }
                        .stats-table td {
                            border-bottom: 1px solid #E2E8F0;
                            color: black;
                        }
                        .total-row td {
                            color: #2F855A;
                            border-bottom: 2px solid #2F855A;
                        }
                        .footer {
                            color: #4A5568;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">GREEN Fleet Operations</div>
                    <div class="title">Monthly Performance Statement</div>
                </div>
                <div class="meta-grid">
                    <div class="meta-item">
                        <div class="meta-label">Business Partner</div>
                        <div class="meta-value">${businessName}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Statement Period</div>
                        <div class="meta-value">${dateStr}</div>
                    </div>
                </div>
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Gross Earnings (Gross Invoiced)</td>
                            <td style="text-align: right; font-weight: bold;">€${gross.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                            <td>Platform Commission Fee (${rateLabel})</td>
                            <td style="text-align: right; color: #FF6B6B;">-€${comm.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr class="total-row">
                            <td>Net Payout Settlement</td>
                            <td style="text-align: right;">€${net.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="footer">
                    Generated via Green Partner Portal Security Protocol v4.0. Confirmed for Settlement.
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const [promotions] = useState([
        { id: 1, title: 'Founder Free Shot', target: 'Pioneer 10k', status: 'Active', used: '142' },
        { id: 2, title: 'VIP Table 20% Off', target: 'Pioneer 10k', status: 'Draft', used: '0' },
        { id: 3, title: 'Midnight Snack Box', target: 'Tier 1 Pioneer', status: 'Active', used: '85' }
    ]);

    const handleAddEvent = () => {
        if (!newEventData.name || !newEventData.date) return alert("Please fill in event details");
        const newEvent = {
            ...newEventData,
            id: 'evt-' + Date.now(),
            published: false,
            context: managerContext
        };
        const updated = [...stadiumEvents, newEvent];
        setStadiumEvents(updated);
        localStorage.setItem(`green_stadium_events_${userEmailKey}`, JSON.stringify(updated));
        setDoc(doc(fbDb, 'venue_events', user?.email?.toLowerCase() || userEmailKey), { events: updated }).catch(console.error);
        setIsAddingEvent(false);
        setNewEventData({ 
            name: '', 
            date: '', 
            time: '', 
            file: null,
            tiers: [{ id: 't1', name: 'Silver (Normal Ticket)', price: 45, quantity: 100, sold: 0 }] 
        });
    };

    const handleAddTier = () => {
        setNewEventData(prev => ({
            ...prev,
            tiers: [...prev.tiers, { id: 't' + Date.now(), name: prev.tiers.length === 1 ? 'Gold (Premium)' : prev.tiers.length === 2 ? 'Diamond (VIP)' : 'Premium Access', price: prev.tiers.length === 1 ? 120 : prev.tiers.length === 2 ? 750 : 250, quantity: 100, sold: 0 }]
        }));
    };

    const handleUpdateTier = (index, field, value) => {
        setNewEventData(prev => {
            const updated = [...prev.tiers];
            if (field === 'price' || field === 'quantity') {
                updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
            } else {
                updated[index] = { ...updated[index], [field]: value };
            }
            return { ...prev, tiers: updated };
        });
    };

    const handleRemoveTier = (index) => {
        if (newEventData.tiers.length <= 1) return;
        setNewEventData(prev => ({
            ...prev,
            tiers: prev.tiers.filter((_, idx) => idx !== index)
        }));
    };

    const togglePublishEvent = (id) => {
        const updated = stadiumEvents.map(e => e.id === id ? { ...e, published: !e.published } : e);
        setStadiumEvents(updated);
        localStorage.setItem(`green_stadium_events_${userEmailKey}`, JSON.stringify(updated));
        setDoc(doc(fbDb, 'venue_events', user?.email?.toLowerCase() || userEmailKey), { events: updated }).catch(console.error);
    };

    const handleDeleteEvent = (id) => {
        if (!window.confirm("Bist du sicher, dass du dieses Event unwiderruflich löschen möchtest?")) return;
        const updated = stadiumEvents.filter(e => e.id !== id);
        setStadiumEvents(updated);
        localStorage.setItem(`green_stadium_events_${userEmailKey}`, JSON.stringify(updated));
        setDoc(doc(fbDb, 'venue_events', user?.email?.toLowerCase() || userEmailKey), { events: updated }).catch(console.error);
    };

    const fleetDrivers = [];

    const { socket } = useSocket();
    const [cashAlerts, setCashAlerts] = useState([]);

    useEffect(() => {
        if (!socket) return;

        const handleAlert = (alert) => {
            setCashAlerts(prev => [alert, ...prev]);
            // Also update the local orders status if it exists
            const orderIdStr = String(alert.orderId);
            setOrders(prev => prev.map(o => o.id === orderIdStr ? { ...o, payment: 'Cash (Pending)' } : o));
        };

        const handleNewUxEvent = (ticket) => {
            console.log('📡 ManagerDashboard: Received new-uxlab-event via socket:', ticket.id);
            
            // Map items display
            let managerItemNames = [];
            if (ticket.items && ticket.items.length > 0) {
                // Keep the items as objects so we have access to item.file or item.image
                managerItemNames = ticket.items;
            } else if (ticket.venueOffer) {
                managerItemNames = [{ name: ticket.venueOffer.name || 'Premium Stay Package', quantity: 1 }];
            } else {
                managerItemNames = [{ name: 'Standard Booking', quantity: 1 }];
            }

            // Map payment display
            let paymentDisplay = ticket.paymentMethod || 'Online';
            if (String(ticket.paymentMethod).toLowerCase() === 'cash') paymentDisplay = 'Cash';

            // Map type display
            let typeDisplay = 'Dine-In';
            if (ticket.type === 'booking') typeDisplay = 'Stay Booking';
            else if (ticket.type === 'room_service') typeDisplay = 'Room Service';
            else if (ticket.type === 'stadium_ticket') typeDisplay = 'Stadium E-Ticket';
            else if (ticket.type === 'club_ticket') typeDisplay = 'Club Event Ticket';
            else if (ticket.type === 'parking') typeDisplay = 'Valet Parking';
            else if (ticket.type === 'service') typeDisplay = 'Wash Service';

            const managerOrder = {
                id: ticket.id,
                guest: ticket.guestDetails?.companyName ? `${ticket.guestName} (${ticket.guestDetails.companyName})` : (ticket.guestName || 'Anonymous Guest'),
                company: ticket.guestDetails?.companyName || undefined,
                items: managerItemNames,
                total: typeof ticket.total === 'number' ? ticket.total.toFixed(2) : String(ticket.total),
                status: ticket.type === 'booking' ? 'Booked' : 'Received',
                type: typeDisplay,
                time: 'Just now',
                payment: paymentDisplay,
                table: (ticket.type === 'order') ? ticket.tableId : undefined,
                room: (ticket.type === 'booking' || ticket.type === 'room_service') ? (ticket.tableId && ticket.tableId !== 'Check-in Assigned' ? ticket.tableId : String(Math.floor(100 + Math.random() * 400))) : undefined,
                checkIn: ticket.type === 'booking' ? 'May 19' : undefined,
                checkOut: ticket.type === 'booking' ? 'May 21' : undefined
            };

            // Prepend new order to global list, avoiding duplicates
            setOrders(prev => {
                if (prev.some(o => o.id === ticket.id)) return prev;
                const updated = [managerOrder, ...prev];
                safeSetItem(`green_active_orders_${userEmailKey}`, JSON.stringify(updated));
                return updated;
            });

            // Dispatch global toast notification
            let toastTitle = '🛎️ ORDER RECEIVED';
            if (ticket.type === 'booking') toastTitle = '🏨 ROOM BOOKING CONFIRMED';
            else if (ticket.type === 'stadium_ticket') toastTitle = '🎟️ STADIUM TICKET SECURED';
            else if (ticket.type === 'parking') toastTitle = '🚗 VALET PASS AUTHORIZED';
            else if (ticket.type === 'service') toastTitle = '💦 WASH SERVICE REQUESTED';

            let toastMsg = `${ticket.guestName || 'A Guest'} ordered ${managerItemNames.join(', ')} (Total: €${ticket.total})`;
            if (ticket.type === 'booking') {
                toastMsg = `${ticket.guestName || 'A Guest'} booked ${managerItemNames.join(', ')} (Total: €${ticket.total})`;
            }

            try {
                const event = new CustomEvent('green-notification', { 
                    detail: { 
                        type: ticket.type === 'booking' ? 'success' : (ticket.type === 'stadium_ticket' ? 'surge' : 'payment'), 
                        title: toastTitle, 
                        message: toastMsg 
                    } 
                });
                window.dispatchEvent(event);
                if (window.parent) {
                    window.parent.dispatchEvent(event);
                }
            } catch (e) {
                console.error('Failed to trigger alert notification toast:', e);
            }
        };

        socket.on('cash-payment-alert', handleAlert);
        socket.on('new-uxlab-event', handleNewUxEvent);

        return () => {
            socket.off('cash-payment-alert', handleAlert);
            socket.off('new-uxlab-event', handleNewUxEvent);
        };
    }, [socket]);

    const handleConfirmCash = (alert) => {
        socket.emit('confirm-cash-payment', {
            orderId: alert.orderId,
            tableId: alert.tableId
        });
        setCashAlerts(prev => prev.filter(a => a.orderId !== alert.orderId));
        // Mark as paid in local state
        const orderIdStr = String(alert.orderId);
        updateOrderStatus(orderIdStr, 'Served'); // Assuming served once paid
        setOrders(prev => prev.map(o => o.id === orderIdStr ? { ...o, payment: 'Cash (Paid)', status: 'Paid' } : o));
    };

    const [sessionTransitioned, setSessionTransitioned] = useState({});
    const [previousStatuses, setPreviousStatuses] = useState({});

    const updateOrderStatus = (id, newStatus) => {
        const order = orders.find(o => o.id === id);
        if (order) {
            setPreviousStatuses(prev => ({ ...prev, [id]: order.status }));
        }
        const updated = orders.map(o => o.id === id ? { ...o, status: newStatus } : o);
        setOrders(updated);
        safeSetItem(`green_active_orders_${userEmailKey}`, JSON.stringify(updated));
        setSessionTransitioned(prev => ({ ...prev, [id]: true }));
    };

    const undoOrderStatus = (id) => {
        const prevStatus = previousStatuses[id];
        if (!prevStatus) return;

        const updated = orders.map(o => o.id === id ? { ...o, status: prevStatus } : o);
        setOrders(updated);
        safeSetItem(`green_active_orders_${userEmailKey}`, JSON.stringify(updated));

        setPreviousStatuses(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const resendEmails = (order) => {
        const hasVerificationEmail1 = order.status === 'Preparing' || order.status === 'Ready' || order.status === 'Served';
        const hasTicketEmail2 = order.status === 'Ready' || order.status === 'Served';

        if (!hasVerificationEmail1 && !hasTicketEmail2) {
            alert(`No emails are available to resend yet. The ticket order is still in '${order.status}' state.`);
            return;
        }

        const choice = prompt(
            `Resend Emails for Order ${order.id} (${order.guest})\n` +
            `Available Resend Options:\n` +
            (hasVerificationEmail1 ? `• [1] Resend Verification Email (Email 1)\n` : '') +
            (hasTicketEmail2 ? `• [2] Resend Ticket & Confirmation (Email 2)\n` : '') +
            `• [3] Resend Both Emails\n\n` +
            `Please type 1, 2, or 3 to resend:`
        );

        if (!choice) return;

        if (choice === '1') {
            if (!hasVerificationEmail1) {
                alert("Error: Verification Email (Email 1) is not available yet.");
                return;
            }
            alert(`✉️ [Email 1 Resent] Verification Email has been successfully resent to ${order.guest}!`);
        } else if (choice === '2') {
            if (!hasTicketEmail2) {
                alert("Error: Ticket Email (Email 2) is not available yet.");
                return;
            }
            alert(`✉️ [Email 2 Resent] Ticket & Confirmation Email with native access code has been resent to ${order.guest}!`);
        } else if (choice === '3') {
            let sent = [];
            if (hasVerificationEmail1) sent.push("Email 1 (Verification)");
            if (hasTicketEmail2) sent.push("Email 2 (Ticket)");
            alert(`✉️ [Emails Resent] Resent ${sent.join(' & ')} to ${order.guest} successfully!`);
        } else {
            alert("Invalid selection. No emails were resent.");
        }
    };

    // Ensure demo booking exists for visualization
    useEffect(() => {
        if (!isDemo) return;
        const demoBooking = { id: '#BK-9921', guest: 'Lukas M.', items: ['Deluxe King Suite', 'Spa Access Included'], total: '450.00', status: 'Received', type: 'Stay Booking', time: 'Just now', payment: 'Online', room: '204', checkIn: 'May 10', checkOut: 'May 12' };
        if (!orders.find(o => o.id === demoBooking.id)) {
            const updated = [demoBooking, ...orders];
            setOrders(updated);
            safeSetItem(`green_active_orders_${userEmailKey}`, JSON.stringify(updated));
        }
    }, [orders, isDemo, userEmailKey]);

    // Real-Time orders synchronization from Firestore
    useEffect(() => {
        if (!userEmailKey || isDemo) return;
        const ordersRef = collection(fbDb, 'orders');
        // Query orders matching this venue, sorted by newest first
        const targetEmail = (simRole === 'staff' && user?.managerId) ? user.managerId.toLowerCase() : (user?.email ? user.email.toLowerCase() : userEmailKey);
        const q = query(
            ordersRef,
            where('venueEmail', '==', targetEmail),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const liveOrders = [];
            snapshot.forEach(doc => {
                liveOrders.push({ firestoreId: doc.id, ...doc.data() });
            });
            setOrders(liveOrders);
            // Also update local storage for backward compatibility with other views
            safeSetItem(`green_active_orders_${userEmailKey}`, JSON.stringify(liveOrders));
        }, (error) => {
            console.error('Error fetching live orders from Firestore:', error);
        });

        return () => unsubscribe();
    }, [userEmailKey, isDemo, user?.email, simRole, user?.managerId]);

    // Real-Time stadium events sold counts synchronization
    useEffect(() => {
        const handleEventsSync = () => {
            const saved = localStorage.getItem(`green_stadium_events_${userEmailKey}`);
            if (saved) {
                try {
                    setStadiumEvents(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to parse synchronized stadium events:', e);
                }
            }
        };

        try {
            if (window.parent) {
                window.parent.addEventListener('green-stadium-events-updated', handleEventsSync);
            }
        } catch (e) {
            console.warn('Blocked from accessing window.parent for stadium events sync due to Same-Origin Policy:', e);
        }

        return () => {
            try {
                if (window.parent) {
                    window.parent.removeEventListener('green-stadium-events-updated', handleEventsSync);
                }
            } catch (e) {
                console.warn('Failed to remove listener from window.parent:', e);
            }
        };
    }, []);

    const getStatsByContext = () => {
        if (!isDemo) {
            if (managerContext === 'CM' || managerContext === 'BM') return [
                { label: 'Guests Inside', value: '0', icon: Users, color: 'text-white', trend: '—' },
                { label: 'Weekly Sales', value: '€0', icon: DollarSign, color: 'text-brand', trend: 'Stable' },
                { label: 'Door Wait Time', value: '—', icon: Timer, color: 'text-brand', trend: '—' },
                { label: 'VIP Capacity', value: '0%', icon: Star, color: 'text-white', trend: '—' }
            ];
            if (managerContext === 'HM') return [
                { label: 'Current Guests', value: '0', icon: Users, color: 'text-white', trend: 'Stable' },
                { label: 'Nightlife Out', value: '0', icon: Car, color: 'text-brand', trend: '—' },
                { label: 'Concierge Tasks', value: '0', icon: Activity, color: 'text-brand', trend: 'Active' },
                { label: 'Service Rating', value: '—', icon: Star, color: 'text-white', trend: '—' }
            ];
            if (managerContext === 'RM') return [
                { label: 'Active Tables', value: '0/30', icon: Utensils, color: 'text-white', trend: '0% Full' },
                { label: 'Kitchen Load', value: 'None', icon: Activity, color: 'text-brand', trend: 'Optimal' },
                { label: 'Avg Ticket', value: '€0.00', icon: DollarSign, color: 'text-brand', trend: '—' },
                { label: 'Waitlist', value: '0', icon: Clock, color: 'text-white', trend: '—' }
            ];
            if (managerContext === 'SM') return [
                { label: 'Arena Fill', value: '0%', icon: Users, color: 'text-white', trend: '—' },
                { label: 'Gate Flow', value: '0/h', icon: Activity, color: 'text-brand', trend: 'Smooth' },
                { label: 'VIP Sales', value: '€0', icon: DollarSign, color: 'text-brand', trend: 'Stable' },
                { label: 'Alerts', value: '0', icon: ShieldCheck, color: 'text-white', trend: 'Clear' }
            ];
            return [
                { label: 'Weekly Accrual', value: '€0', icon: DollarSign, color: 'text-brand', trend: 'Friday Payout' },
                { label: 'Active Units', value: '0', icon: Car, color: 'text-brand', trend: 'No Deployment' },
                { label: 'Completion Rate', value: '0.0%', icon: CheckCircle2, color: 'text-white', trend: 'Optimal' },
                { label: 'Avg Arrival', value: '—', icon: Clock, color: 'text-brand', trend: '—' }
            ];
        }

        if (managerContext === 'CM' || managerContext === 'BM') return [
            { label: 'Guests Inside', value: '412', icon: Users, color: 'text-white', trend: '+12%' },
            { label: 'Weekly Sales', value: '€24,420', icon: DollarSign, color: 'text-brand', trend: 'Stable' },
            { label: 'Door Wait Time', value: '12m', icon: Timer, color: 'text-brand', trend: '-2m' },
            { label: 'VIP Capacity', value: '85%', icon: Star, color: 'text-white', trend: 'Peak' }
        ];
        if (managerContext === 'HM') return [
            { label: 'Occupancy Rate', value: '32/40 (80%)', icon: Users, color: 'text-white', trend: '80% Full' },
            { label: 'Check-ins Today', value: '12', icon: Activity, color: 'text-brand', trend: 'Active' },
            { label: 'Room Revenue', value: '€7,450', icon: DollarSign, color: 'text-brand', trend: '+18%' },
            { label: 'Service Rating', value: '4.98', icon: Star, color: 'text-white', trend: 'Green' }
        ];
        if (managerContext === 'RM') return [
            { label: 'Active Tables', value: '24/30', icon: Utensils, color: 'text-white', trend: '80% Full' },
            { label: 'Kitchen Load', value: 'Medium', icon: Activity, color: 'text-brand', trend: 'Optimal' },
            { label: 'Avg Ticket', value: '€72.50', icon: DollarSign, color: 'text-brand', trend: '+12%' },
            { label: 'Waitlist', value: '4', icon: Clock, color: 'text-white', trend: '15m ETA' }
        ];
        if (managerContext === 'SM') return [
            { label: 'Arena Fill', value: '92%', icon: Users, color: 'text-white', trend: 'Near Cap' },
            { label: 'Gate Flow', value: '1.2k/h', icon: Activity, color: 'text-brand', trend: 'Smooth' },
            { label: 'VIP Sales', value: '€42,800', icon: DollarSign, color: 'text-brand', trend: 'Stable' },
            { label: 'Alerts', value: '0', icon: ShieldCheck, color: 'text-white', trend: 'Clear' }
        ];
        return [
            { label: 'Weekly Accrual', value: '€28,450', icon: DollarSign, color: 'text-brand', trend: 'Friday Payout' },
            { label: 'Active Units', value: '18', icon: Car, color: 'text-brand', trend: 'Full Deployment' },
            { label: 'Completion Rate', value: '98.5%', icon: CheckCircle2, color: 'text-white', trend: 'Optimal' },
            { label: 'Avg Arrival', value: '4.2m', icon: Clock, color: 'text-brand', trend: '-30s' }
        ];
    };

    const getOperationalDataByContext = () => {
        if (!isDemo) return [];

        if (managerContext === 'SM') return [
            { id: 'S1-A12', guest: 'Julian R.', order: 'VVIP Sector A', status: 'Seated', time: '2h 15m' },
            { id: 'S2-B04', guest: 'TKT-9921', order: 'North Stand', status: 'Entry Scan', time: '1m' },
            { id: 'VIP-G', guest: 'Guest List', order: 'Executive Box', status: 'At Bar', time: '30m' }
        ];
        if (managerContext === 'RM') return [
            { id: 'T-12', guest: 'Sarah J.', order: '3x Premium Tasting', status: 'Main Course', time: '45m' },
            { id: 'T-04', guest: 'Pioneer #092', order: 'Bottle Service Only', status: 'Appetizer', time: '12m' },
            { id: 'VIP-1', guest: 'Dr. Müller', order: 'Table Reservation', status: 'Arriving', time: '5m' }
        ];
        return [
            { id: 'UNIT-1', guest: 'Driver #12', order: 'Active Trip', status: 'On Route', time: '12m' },
            { id: 'UNIT-4', guest: 'Sarah K.', order: 'Pickup Pending', status: 'Arrived', time: '2m' },
            { id: 'UNIT-8', guest: 'Pioneer #04', order: 'Standby', status: 'Online', time: '45m' }
        ];
    };

    const AccessDenied = ({ feature }) => (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8"
        >
            <div className="w-32 h-32 bg-red-500/10 rounded-[3rem] flex items-center justify-center text-red-500 border border-red-500/20 shadow-2xl relative overflow-hidden">
                <ShieldAlert size={64} />
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-red-500/20 rounded-full"
                />
            </div>
            <div className="space-y-4 max-w-md">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">Access <span className="text-red-500">Denied</span></h2>
                <p className="text-xs md:text-sm lg:text-base text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                    Personnel ID <span className="text-white">{user?.id || 'STAFF-GRID'}</span> is not authorized to access the <span className="text-brand">{feature}</span> module.
                </p>
            </div>
            <button 
                onClick={() => setView('overview')}
                className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest hover:bg-brand hover:text-dark-900 hover:border-brand transition-all shadow-xl"
            >
                Return to Operational Hub
            </button>
        </motion.div>
    );

    const renderSidebarContent = () => (
        <>
            <div className="p-4 pb-8 overflow-hidden flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center text-dark-900 shadow-[0_0_20px_rgba(52,211,153,0.5)] transition-transform">
                    <Zap size={24} fill="currentColor" />
                </div>
                {isMobile && (
                    <button 
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="w-8 h-8 rounded-xl bg-btn-sec border border-main flex items-center justify-center text-secondary hover:text-primary hover:border-brand/40 transition-all shrink-0"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-x-hidden">
                {(managerContext === 'FM' ? [
                    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
                    { id: 'drivers', label: 'Fahrer Hub', icon: Users, badge: 'Team' },
                    { id: 'vehicles', label: 'Auto Hub', icon: Car, badge: 'Flotte' },
                    { id: 'feed', label: 'Social Hub', icon: Activity, badge: 'Promo' },
                    { id: 'shuttle', label: 'Shuttle Service', icon: Bus, badge: 'Transfer' },
                    { id: 'finance', label: 'Umsatz Hub', icon: Receipt },
                    { id: 'profile', label: 'Mein Profil', icon: User }
                ] : [
                    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
                    { 
                        id: 'menu', 
                        label: managerContext === 'HM' ? 'Zimmer Angebote Hub' : managerContext === 'SM' ? 'Ticket Angebote Hub' : 'Angebote Hub', 
                        icon: managerContext === 'SM' ? Ticket : BedDouble, 
                        badge: 'Live'
                    },
                    { 
                        id: 'feed', 
                        label: 'Social Hub', 
                        icon: Activity, 
                        badge: 'Promo' 
                    },
                    { 
                        id: 'finance', 
                        label: 'Umsatz Hub', 
                        icon: Receipt 
                    },
                    { 
                        id: 'profile', 
                        label: 'Mein Profil', 
                        icon: User 
                    }
                ]).filter(item => {
                    if (item.hidden) return false;
                    if (item.visible !== undefined && !item.visible) return false;
                    return hasPermission(item.id);
                }).map(item => (
                    <button
                        key={item.id}
                        onClick={() => {
                            setView(item.id);
                            setActiveSettingsEvent(null);
                            setShowSecurityGate(false);
                            if (isMobile) setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex ${isMobile ? 'flex-row items-center justify-start px-5 gap-4 py-3.5' : 'flex-col items-center justify-center p-3'} rounded-2xl transition-all duration-300 group relative mb-2 ${
                            view === item.id 
                            ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-cyan-400/50' 
                            : 'text-gray-200 hover:text-white hover:bg-white/10 border border-transparent font-bold'
                        }`}
                    >
                        <item.icon size={22} className={`${isMobile ? '' : 'mb-1.5'} ${view === item.id ? 'text-cyan-400' : 'text-gray-300 group-hover:text-cyan-300 transition-colors'}`} />
                        <span className={`font-black uppercase tracking-widest leading-tight ${isMobile ? 'text-[11px] md:text-xs lg:text-sm text-left' : 'text-[10px] md:text-xs lg:text-xs text-center'}`}>{item.label}</span>
                        {item.badge && (
                            <span className={`absolute px-1.5 py-0.5 bg-cyan-400 text-dark-950 text-[8px] font-black rounded-md ${isMobile ? 'right-4 top-1/2 -translate-y-1/2' : '-top-1 -right-1'}`}>{item.badge}</span>
                        )}
                    </button>
                ))}
            </nav>

            <div className="p-2 md:p-3 mt-auto space-y-2">
                {/* Language Dropdown Button */}
                <div className="relative">
                    <button 
                        onClick={() => setIsLangExpanded(!isLangExpanded)}
                        className="w-full flex flex-col items-center justify-center p-2.5 rounded-xl bg-btn-sec text-secondary hover:text-brand hover:bg-brand/10 transition-all border border-main"
                    >
                        <Languages size={18} className="text-brand mb-1" />
                        <span className="text-[8px] font-black uppercase tracking-wider">{lang.toUpperCase()}</span>
                    </button>
                    {isLangExpanded && (
                        <div className={`absolute bottom-0 ${lang === 'fa' || lang === 'ar' ? 'right-full mr-4' : 'left-full ml-4'} w-60 max-h-72 overflow-y-auto no-scrollbar bg-[#060911] border-2 border-brand/60 rounded-2xl p-2.5 space-y-1.5 shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-[300]`}>
                            <div className="px-3 py-2 border-b border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-brand flex items-center justify-between">
                                <span>🌍 Sprache Wählen</span>
                                <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                            </div>
                            {allLanguages.map((l) => (
                                <button
                                    key={l.code}
                                    onClick={() => {
                                        setLang(l.code);
                                        setIsLangExpanded(false);
                                    }}
                                    className={`w-full p-3 rounded-xl flex items-center justify-between text-xs font-black uppercase transition-all ${
                                        lang === l.code 
                                        ? 'bg-brand text-dark-950 font-black shadow-xl shadow-brand/30 border border-brand' 
                                        : 'bg-white/5 hover:bg-brand/20 text-white hover:text-brand border border-white/5 hover:border-brand/40'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-extrabold">{l.name}</span>
                                        <span className="text-[10px] font-bold opacity-60">({l.native})</span>
                                    </div>
                                    {lang === l.code && <CheckCircle size={14} className="shrink-0 text-dark-950" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Theme Toggle Button */}
                <button 
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    className="w-full flex flex-col items-center justify-center p-2.5 rounded-xl bg-btn-sec text-secondary hover:text-brand hover:bg-brand/10 transition-all border border-main cursor-pointer"
                >
                    {theme === 'light' ? <Moon size={18} className="text-brand mb-1" /> : <Sun size={18} className="text-brand mb-1" />}
                    <span className="text-[8px] font-black uppercase tracking-wider">{theme === 'light' ? 'Light' : 'Dark'}</span>
                </button>

                {/* Exit Portal Button */}
                <button 
                    onClick={() => {
                        logout();
                        navigate('/login');
                    }}
                    className="w-full flex flex-col items-center justify-center p-2.5 rounded-xl bg-btn-sec text-secondary hover:text-red-400 hover:bg-red-500/10 transition-all border border-main cursor-pointer"
                >
                    <X size={18} className="mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-wider">Exit</span>
                </button>
            </div>
        </>
    );

    if (loading) {
        return (
            <div className="w-screen h-screen bg-dark-950 flex items-center justify-center">
                <div className="text-xl font-black italic uppercase text-brand animate-pulse">
                    Grid Intelligence Loading...
                </div>
            </div>
        );
    }

    const getBgImage = (ctx, currentTheme) => {
        const isDark = currentTheme !== 'light';
        switch (ctx) {
            case 'HM': return isDark ? 'https://images.unsplash.com/photo-1542314831-c6a4d14d8373?w=1600&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1600&auto=format&fit=crop&q=80';
            case 'CM': return isDark ? 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=1600&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80';
            case 'SM': return isDark ? 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1600&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1600&auto=format&fit=crop&q=80';
            case 'RM': return isDark ? 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1600&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80';
            case 'BM': return isDark ? 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1600&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1600&auto=format&fit=crop&q=80';
            case 'FM': return isDark ? 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600&auto=format&fit=crop&q=80';
            default: return isDark ? 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1600&auto=format&fit=crop&q=80';
        }
    };

    return (
        <div 
            className="absolute left-0 right-0 bottom-0 overflow-hidden glass-bg-wrapper font-sans text-primary transition-all duration-500 flex flex-col p-2 md:p-6"
            style={{
                top: `calc(${useSafeArea ? 'env(safe-area-inset-top, 0px)' : '0px'} + ${notchAdjustment}px)`,
                height: `calc(100% - (${useSafeArea ? 'env(safe-area-inset-top, 0px)' : '0px'} + ${notchAdjustment}px))`,
                backgroundImage: `url("${getBgImage(managerContext, theme)}")`,
                backgroundColor: theme === 'light' ? '#E5E7EB' : '#0B0F19'
            }}
        >
            {/* FLOATING GLASS TABLET WRAPPER */}
            <div className="flex-1 w-full h-full glass-panel rounded-[2rem] md:rounded-[3rem] overflow-hidden flex flex-row relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10">
            {/* Mobile Sidebar Overlay Backdrop */}
            {isMobile && isMobileSidebarOpen && (
                <div 
                    onClick={() => setIsMobileSidebarOpen(false)} 
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-[599] md:hidden"
                />
            )}

            {/* Desktop Sidebar (Only when not mobile) */}
            {!isMobile && (
                <motion.aside 
                    initial={false}
                    animate={{ width: 110 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="h-full bg-transparent border-r border-main flex flex-col z-30 relative shrink-0"
                >
                    {renderSidebarContent()}
                </motion.aside>
            )}

            {/* Mobile Sidebar Overlay Drawer */}
            {isMobile && (
                <AnimatePresence>
                    {isMobileSidebarOpen && (
                        <motion.aside 
                            initial={{ x: -288 }}
                            animate={{ x: 0 }}
                            exit={{ x: -288 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed inset-y-0 left-0 w-[288px] h-full bg-glass backdrop-blur-xl border-r border-main flex flex-col z-[600] shadow-[10px_0_30px_rgba(0,0,0,0.5)] md:hidden"
                            style={{
                                paddingTop: `calc(${useSafeArea ? 'env(safe-area-inset-top, 0px)' : '0px'} + ${notchAdjustment}px)`
                            }}
                        >
                            {renderSidebarContent()}
                        </motion.aside>
                    )}
                </AnimatePresence>
            )}

            <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
                <header className="h-24 bg-transparent px-6 md:px-10 flex items-center justify-between z-20 shrink-0">
                    <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-3">
                            {isMobile && (
                                <button 
                                    onClick={() => setIsMobileSidebarOpen(true)}
                                    className="w-10 h-10 bg-btn-sec border border-main rounded-xl flex items-center justify-center text-primary hover:border-brand/40 transition-all md:hidden"
                                >
                                    <Menu size={20} />
                                </button>
                            )}
                            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Good Evening, {simRole === 'staff' ? 'Staff' : 'Manager'} {user?.name || 'Alex'}</h2>
                        </div>
                        <div className="text-[11px] md:text-sm lg:text-base font-medium text-gray-400 mt-1 flex items-center gap-2">
                            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span>|</span>
                            <span>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        {/* Search Bar */}
                        <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 w-64">
                            <Search size={14} className="text-gray-400" />
                            <input type="text" placeholder="Search" className="bg-transparent border-none outline-none text-sm text-white ml-2 w-full placeholder-gray-500" />
                        </div>

                        {/* Notification Bell */}
                        <div className="relative cursor-pointer w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full text-[9px] md:text-[11px] lg:text-xs font-bold flex items-center justify-center text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]">3</span>
                        </div>

                        {/* Profile */}
                        <div className="flex items-center gap-3">
                            <img src={profileForm?.avatarUrl || user?.profilePicture || user?.avatarUrl || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white/10 object-cover" />
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-bold text-white">{user?.name || 'Alex P.'}</p>
                                <p className="text-[10px] md:text-xs lg:text-sm text-gray-400">{simRole === 'staff' ? 'Staff Member' : 'Manager'}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 relative no-scrollbar">
                    <div className="absolute top-0 left-0 right-0 h-96 opacity-[0.03] pointer-events-none">
                        <Radar isOnline={true} showLogos={false} />
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto py-6">
                        {!hasPermission(view) ? (
                            <AccessDenied feature={view} />
                        ) : (
                            <AnimatePresence mode="wait">
                                {view === 'overview' && (
                                    <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                        {/* FLEET CONTROL BANNER */}
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-950/40 via-dark-900 to-black/60 p-6 md:p-8 rounded-[2.5rem] border border-emerald-500/20 shadow-2xl relative overflow-hidden">
                                            <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                                            <div className="space-y-1.5 relative z-10">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-emerald-400">Live Flotten-Leitstand • Zentrale</span>
                                                </div>
                                                <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tight text-white">
                                                    Flotten <span className="text-emerald-400">Operations</span> Cockpit
                                                </h1>
                                                <p className="text-gray-400 text-xs md:text-sm">
                                                    Echtzeit-Telemetrie, aktive Fahrer-Schichten & automatische Transfer-Disposition
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 relative z-10 w-full md:w-auto">
                                                <button 
                                                    onClick={() => setIsAddDriverOpen(true)}
                                                    className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg"
                                                >
                                                    <Users size={15} /> + Fahrer anlegen
                                                </button>
                                                <button 
                                                    onClick={() => setIsAddVehicleOpen(true)}
                                                    className="flex-1 md:flex-none px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg"
                                                >
                                                    <Car size={15} /> + Fahrzeug registrieren
                                                </button>
                                                <button 
                                                    onClick={() => setView('shuttle')}
                                                    className="flex-1 md:flex-none px-4 py-2.5 bg-brand hover:bg-brand/90 text-dark-900 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
                                                >
                                                    <Activity size={15} /> Dispatches (9)
                                                </button>
                                            </div>
                                        </div>

                                        {/* FLEET KPI STATS GRID */}
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            {/* KPI 1: AKTIVE FAHRER */}
                                            <div 
                                                onClick={() => setView('drivers')}
                                                className="glass-panel-subtle p-5 rounded-2xl border border-white/5 hover:border-emerald-500/40 transition-all relative flex flex-col justify-between h-[120px] cursor-pointer group hover:bg-emerald-500/[0.03]"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="text-[11px] md:text-sm font-semibold text-gray-300 flex items-center gap-1.5">
                                                        <Users size={14} className="text-emerald-400" /> Fahrer im Dienst
                                                    </span>
                                                    <span className="text-[9px] md:text-[11px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full flex items-center border border-emerald-500/20 font-bold">
                                                        Online
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-end mt-2">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-2xl lg:text-3xl font-extrabold text-white">14</span>
                                                            <span className="text-sm font-bold text-gray-400">/ 18</span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-medium">10 auf Tour • 4 bereit</span>
                                                    </div>
                                                    <div className="w-14 h-8 opacity-80">
                                                        <svg viewBox="0 0 100 30" className="w-full h-full stroke-emerald-400" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M0,25 Q20,10 40,20 T80,5 T100,2" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* KPI 2: FLOTTEN-FAHRZEUGE */}
                                            <div 
                                                onClick={() => setView('vehicles')}
                                                className="glass-panel-subtle p-5 rounded-2xl border border-white/5 hover:border-cyan-500/40 transition-all relative flex flex-col justify-between h-[120px] cursor-pointer group hover:bg-cyan-500/[0.03]"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="text-[11px] md:text-sm font-semibold text-gray-300 flex items-center gap-1.5">
                                                        <Car size={14} className="text-cyan-400" /> Flotten-Fahrzeuge
                                                    </span>
                                                    <span className="text-[9px] md:text-[11px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded-full flex items-center border border-cyan-500/20 font-bold">
                                                        Fuhrpark
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-end mt-2">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-2xl lg:text-3xl font-extrabold text-white">24</span>
                                                            <span className="text-xs font-bold text-gray-400">Autos</span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-medium">18 unterwegs • 4 bereit • 2 Depot</span>
                                                    </div>
                                                    <div className="w-14 h-8">
                                                        <svg viewBox="0 0 100 30" className="w-full h-full stroke-cyan-400" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M0,20 L20,15 L40,10 L60,18 L80,5 L100,8" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* KPI 3: LAUFENDE DISPATCHES */}
                                            <div 
                                                onClick={() => setView('shuttle')}
                                                className="glass-panel-subtle p-5 rounded-2xl border border-white/5 hover:border-purple-500/40 transition-all relative flex flex-col justify-between h-[120px] cursor-pointer group hover:bg-purple-500/[0.03]"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="text-[11px] md:text-sm font-semibold text-gray-300 flex items-center gap-1.5">
                                                        <Activity size={14} className="text-purple-400" /> Aktive Touren
                                                    </span>
                                                    <span className="text-[9px] md:text-[11px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded-full flex items-center border border-purple-500/20 font-bold">
                                                        Dispatch
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-end mt-2">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-2xl lg:text-3xl font-extrabold text-white">9</span>
                                                            <span className="text-xs font-bold text-gray-400">im Lauf</span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-medium">Ø 12 Min. Anfahrt • 99.4% Pünktlich</span>
                                                    </div>
                                                    <div className="w-14 h-8">
                                                        <svg viewBox="0 0 100 30" className="w-full h-full stroke-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M0,15 Q25,5 50,18 T100,4" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* KPI 4: FLOTTEN-UMSATZ HEUTE */}
                                            <div 
                                                onClick={() => setView('finance')}
                                                className="glass-panel-subtle p-5 rounded-2xl border border-white/5 hover:border-brand/40 transition-all relative flex flex-col justify-between h-[120px] cursor-pointer group hover:bg-brand/[0.03]"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="text-[11px] md:text-sm font-semibold text-gray-300 flex items-center gap-1.5">
                                                        <TrendingUp size={14} className="text-brand" /> Flotten-Umsatz Heute
                                                    </span>
                                                    <span className="text-[9px] md:text-[11px] bg-brand/10 text-brand px-1.5 py-0.5 rounded-full flex items-center border border-brand/20 font-bold">
                                                        +18.4%
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-end mt-2">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-2xl lg:text-3xl font-extrabold text-white">€3.840</span>
                                                            <span className="text-xs font-bold text-gray-400">,00</span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-medium">58 Fahrten • Ø 66 € / Tour</span>
                                                    </div>
                                                    <div className="w-14 h-8">
                                                        <svg viewBox="0 0 100 30" className="w-full h-full stroke-brand drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M0,25 L25,20 L50,12 L75,14 L100,2" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3-COLUMN FLEET HUBS */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            
                                            {/* COL 1: Live Flotten-Status & Fahrzeuge */}
                                            <div className="glass-panel-subtle border border-white/5 rounded-3xl p-5 relative shadow-xl flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                                                <Car size={16} />
                                                            </div>
                                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Flotten-Status</h3>
                                                        </div>
                                                        <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20 font-bold">
                                                            E-Fuhrpark & VIP
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mb-4">Echtzeit-Telemetrie & Akkustände der Fahrzeuge</p>

                                                    <div className="space-y-3 mb-4">
                                                        {/* Car 1 */}
                                                        <div className="bg-[#0B121E]/60 border border-emerald-500/30 rounded-xl p-3.5 relative overflow-hidden shadow-lg">
                                                            <div className="flex justify-between items-start mb-1.5">
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                                        Tesla Model S Plaid
                                                                        <span className="text-[10px] px-1.5 py-0.2 bg-white/10 text-gray-300 rounded font-mono">F-GR 777E</span>
                                                                    </h4>
                                                                    <p className="text-[11px] text-gray-400">VIP Executive • Chauffeur: Sami Rahimi</p>
                                                                </div>
                                                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                                                                    Im Einsatz
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs text-gray-300 mt-2 pt-2 border-t border-white/5">
                                                                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                                                    <Zap size={12} /> 94% Akku (485 km)
                                                                </span>
                                                                <span className="text-[11px] text-gray-400">Ziel: Grand Hyatt</span>
                                                            </div>
                                                        </div>

                                                        {/* Car 2 */}
                                                        <div className="bg-[#0B121E]/60 border border-emerald-500/30 rounded-xl p-3.5 relative overflow-hidden shadow-lg">
                                                            <div className="flex justify-between items-start mb-1.5">
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                                        Mercedes-Benz EQS 450+
                                                                        <span className="text-[10px] px-1.5 py-0.2 bg-white/10 text-gray-300 rounded font-mono">F-GR 888E</span>
                                                                    </h4>
                                                                    <p className="text-[11px] text-gray-400">First Class Luxury • Chauffeur: Darius Meier</p>
                                                                </div>
                                                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                                                                    Auf Tour
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs text-gray-300 mt-2 pt-2 border-t border-white/5">
                                                                <span className="flex items-center gap-1 text-cyan-400 font-bold">
                                                                    <Zap size={12} /> 88% Akku (420 km)
                                                                </span>
                                                                <span className="text-[11px] text-gray-400">Ziel: Flughafen FRA</span>
                                                            </div>
                                                        </div>

                                                        {/* Car 3 */}
                                                        <div className="bg-[#0B121E]/60 border border-blue-500/30 rounded-xl p-3.5 relative overflow-hidden shadow-lg">
                                                            <div className="flex justify-between items-start mb-1.5">
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                                        Porsche Taycan 4S
                                                                        <span className="text-[10px] px-1.5 py-0.2 bg-white/10 text-gray-300 rounded font-mono">F-GR 999E</span>
                                                                    </h4>
                                                                    <p className="text-[11px] text-gray-400">Sport VIP Shuttle • Chauffeur: Elena Rostova</p>
                                                                </div>
                                                                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/40 px-2 py-0.5 rounded-full font-bold">
                                                                    Bereit
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs text-gray-300 mt-2 pt-2 border-t border-white/5">
                                                                <span className="flex items-center gap-1 text-blue-400 font-bold">
                                                                    <Zap size={12} /> 100% Akku (450 km)
                                                                </span>
                                                                <span className="text-[11px] text-gray-400">Standplatz: Terminal 1</span>
                                                            </div>
                                                        </div>

                                                        {/* Car 4 */}
                                                        <div className="bg-[#0B121E]/60 border border-white/10 rounded-xl p-3.5 relative overflow-hidden shadow-lg">
                                                            <div className="flex justify-between items-start mb-1.5">
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                                        Mercedes-Benz V-Klasse VIP
                                                                        <span className="text-[10px] px-1.5 py-0.2 bg-white/10 text-gray-300 rounded font-mono">F-GR 440E</span>
                                                                    </h4>
                                                                    <p className="text-[11px] text-gray-400">7-Sitzer VIP Van • Chauffeur: Dennis Weber</p>
                                                                </div>
                                                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                                                                    Im Einsatz
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs text-gray-300 mt-2 pt-2 border-t border-white/5">
                                                                <span className="flex items-center gap-1 text-amber-400 font-bold">
                                                                    <Zap size={12} /> 76% Akku (290 km)
                                                                </span>
                                                                <span className="text-[11px] text-gray-400">Steigenberger Transfer</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => setView('vehicles')}
                                                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 mt-2"
                                                >
                                                    Fuhrpark verwalten (24 Autos) <ChevronRight size={14} />
                                                </button>
                                            </div>

                                            {/* COL 2: Fahrer-Einsatz & Schichten */}
                                            <div className="glass-panel-subtle border border-white/5 rounded-3xl p-5 relative shadow-xl flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                                                <Users size={16} />
                                                            </div>
                                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fahrer-Schichten</h3>
                                                        </div>
                                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                                                            14 im Dienst
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mb-4">Aktive Schichten, Status & Fahrtenbilanz</p>
                                                    
                                                    <div className="space-y-3 mb-4">
                                                        {/* Driver 1 */}
                                                        <div className="bg-[#0B121E]/60 border border-emerald-500/30 rounded-xl p-3.5 relative shadow-lg">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-xs">
                                                                        SR
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                                                            Sami Rahimi <span className="text-amber-400 text-[11px] font-normal">★ 4.95</span>
                                                                        </h4>
                                                                        <p className="text-[11px] text-gray-400">Tesla Model S Plaid • Schicht Früh (06:00 - 15:00)</p>
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                                                                    Fahrt #482
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[11px] text-gray-400 pt-2 border-t border-white/5">
                                                                <span>Dienstzeit: 4h 15m</span>
                                                                <span className="text-emerald-400 font-semibold">6 Fahrten heute</span>
                                                            </div>
                                                        </div>

                                                        {/* Driver 2 */}
                                                        <div className="bg-[#0B121E]/60 border border-emerald-500/30 rounded-xl p-3.5 relative shadow-lg">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-400 text-xs">
                                                                        DM
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                                                            Darius Meier <span className="text-amber-400 text-[11px] font-normal">★ 4.88</span>
                                                                        </h4>
                                                                        <p className="text-[11px] text-gray-400">Mercedes EQS • Schicht Tag (10:00 - 19:00)</p>
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                                                                    Fahrt #483
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[11px] text-gray-400 pt-2 border-t border-white/5">
                                                                <span>Dienstzeit: 2h 40m</span>
                                                                <span className="text-cyan-400 font-semibold">3 Fahrten heute</span>
                                                            </div>
                                                        </div>

                                                        {/* Driver 3 */}
                                                        <div className="bg-[#0B121E]/60 border border-blue-500/30 rounded-xl p-3.5 relative shadow-lg">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-bold text-purple-400 text-xs">
                                                                        ER
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                                                            Elena Rostova <span className="text-amber-400 text-[11px] font-normal">★ 5.00</span>
                                                                        </h4>
                                                                        <p className="text-[11px] text-gray-400">Porsche Taycan • Schicht Spät (14:00 - 23:00)</p>
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                                                                    Bereit
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[11px] text-gray-400 pt-2 border-t border-white/5">
                                                                <span>Dienstzeit: 1h 10m</span>
                                                                <span className="text-blue-400 font-semibold">Wartet am Gate</span>
                                                            </div>
                                                        </div>

                                                        {/* Driver 4 */}
                                                        <div className="bg-[#0B121E]/60 border border-amber-500/30 rounded-xl p-3.5 relative shadow-lg">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-xs">
                                                                        DW
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                                                            Dennis Weber <span className="text-amber-400 text-[11px] font-normal">★ 4.91</span>
                                                                        </h4>
                                                                        <p className="text-[11px] text-gray-400">V-Klasse VIP • Schicht Tag (08:00 - 17:00)</p>
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                                                                    Pause
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[11px] text-gray-400 pt-2 border-t border-white/5">
                                                                <span>Pause bis: 17:30</span>
                                                                <span className="text-amber-400 font-semibold">5 Fahrten heute</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => setView('drivers')}
                                                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 mt-2"
                                                >
                                                    Fahrer-Team verwalten (18 Fahrer) <ChevronRight size={14} />
                                                </button>
                                            </div>

                                            {/* COL 3: Eingehende Transfer-Aufträge (Dispatch Queue) */}
                                            <div className="glass-panel-subtle border border-white/5 rounded-3xl p-5 relative shadow-xl flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                                                                <Activity size={16} />
                                                            </div>
                                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Transfer-Aufträge</h3>
                                                        </div>
                                                        <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20 font-bold">
                                                            Dispatch Queue
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mb-4">Hotels, VIP-Kunden & Partner Shuttle Anfragen</p>

                                                    <div className="space-y-3 mb-4">
                                                        {/* Dispatch 1 */}
                                                        <div className="bg-[#0B121E]/60 border border-purple-500/30 rounded-xl p-3.5 relative shadow-lg">
                                                            <div className="flex justify-between items-start mb-1.5">
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">#TR-882</span>
                                                                        <h4 className="text-xs font-bold text-white">Grand Hyatt → Frankfurt Airport (FRA)</h4>
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-400 mt-1">Gast: Dr. Markus Weber (2 Pers., 3 Gepäck)</p>
                                                                </div>
                                                                <span className="text-[9px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold shrink-0">
                                                                    In Fahrt
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 pt-2 border-t border-white/5">
                                                                <span className="text-emerald-400 font-semibold">Chauffeur: Darius Meier</span>
                                                                <span>ETA: 12 Min</span>
                                                            </div>
                                                        </div>

                                                        {/* Dispatch 2 */}
                                                        <div className="bg-[#0B121E]/60 border border-brand/40 rounded-xl p-3.5 relative shadow-lg">
                                                            <div className="flex justify-between items-start mb-1.5">
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[10px] font-mono text-brand bg-brand/10 px-1.5 py-0.5 rounded">#TR-883</span>
                                                                        <h4 className="text-xs font-bold text-white">Deutsche Bank Park → Steigenberger</h4>
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-400 mt-1">VIP Delegation (5 Personen • Van Shuttle)</p>
                                                                </div>
                                                                <span className="text-[9px] bg-brand/20 text-brand px-2 py-0.5 rounded-full border border-brand/30 font-bold shrink-0">
                                                                    Offen
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 pt-2 border-t border-white/5">
                                                                <span className="text-gray-400">Abholung: 18:15 Uhr</span>
                                                                <button 
                                                                    onClick={() => {
                                                                        triggerNotification('Tour #TR-883 wurde Chauffeur Dennis Weber zugewiesen', 'success');
                                                                    }}
                                                                    className="px-2.5 py-1 bg-brand text-dark-900 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-brand/90 transition-all shadow-md"
                                                                >
                                                                    Fahrer zuweisen
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Dispatch 3 */}
                                                        <div className="bg-[#0B121E]/60 border border-white/10 rounded-xl p-3.5 relative shadow-lg">
                                                            <div className="flex justify-between items-start mb-1.5">
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[10px] font-mono text-gray-400 bg-white/10 px-1.5 py-0.5 rounded">#TR-884</span>
                                                                        <h4 className="text-xs font-bold text-white">Kempinski Gravenbruch → Alte Oper</h4>
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-400 mt-1">Gast: L. Rothschild (1 Gast • VIP Executive)</p>
                                                                </div>
                                                                <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 font-bold shrink-0">
                                                                    Vorgemerkt
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 pt-2 border-t border-white/5">
                                                                <span className="text-gray-400">Abholung: 19:00 Uhr</span>
                                                                <span className="text-blue-400 font-semibold">Reserviert</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => setView('shuttle')}
                                                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 mt-2"
                                                >
                                                    Alle Shuttle-Aufträge öffnen (Live Tracker) <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                            {view === 'profile' && (
                                <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 max-w-4xl mx-auto pb-12">
                                    {/* Page Header */}
                                    <div className="flex justify-between items-center bg-glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                                        <div className="space-y-1">
                                            <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-brand">Mein Profil & Stammdaten</h1>
                                            <p className="text-gray-400 text-xs md:text-sm font-bold uppercase tracking-widest">
                                                Manager Kontaktdaten & Adresse von {managerContext === 'HM' ? 'Hotel / Resort' : 'Stadion / Arena'}
                                            </p>
                                        </div>
                                        <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
                                            <User size={28} />
                                        </div>
                                    </div>

                                    {/* Success Alert */}
                                    {profileSaveSuccess && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-brand/10 border border-brand/40 rounded-2xl text-brand text-xs font-black uppercase tracking-widest flex items-center gap-3">
                                            <CheckCircle size={18} /> Profil & Hotel-Adresse erfolgreich gespeichert!
                                        </motion.div>
                                    )}

                                    {/* Main Profile Form */}
                                    <div className="bg-glass rounded-[2.5rem] p-8 md:p-10 border border-white/10 space-y-8 shadow-2xl backdrop-blur-2xl">
                                        {/* Profile Photo Upload */}
                                        <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-white/10">
                                            <div className="relative group cursor-pointer">
                                                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-brand/50 shadow-[0_0_25px_rgba(52,211,153,0.3)] bg-dark-900 flex items-center justify-center">
                                                    {profileForm.avatarUrl ? (
                                                        <img src={profileForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={48} className="text-gray-500" />
                                                    )}
                                                </div>
                                                <label className="absolute bottom-0 right-0 w-9 h-9 bg-brand text-dark-950 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                                                    <Camera size={16} />
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        className="hidden" 
                                                        onChange={(e) => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                const url = URL.createObjectURL(e.target.files[0]);
                                                                setProfileForm(prev => ({ ...prev, avatarUrl: url }));
                                                            }
                                                        }} 
                                                    />
                                                </label>
                                            </div>
                                            <div className="space-y-1 text-center sm:text-left">
                                                <h3 className="text-xl font-black text-white italic uppercase">{profileForm.firstName} {profileForm.lastName}</h3>
                                                <p className="text-xs text-brand font-bold uppercase tracking-widest">{profileForm.businessName}</p>
                                                <p className="text-[10px] text-gray-400">Manager-Konto • Verifiziertes VIP Mitglied</p>
                                            </div>
                                        </div>

                                        {/* Personal Info Grid */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-brand/80">Persönliche Angaben</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">Vorname</label>
                                                    <input 
                                                        type="text"
                                                        value={profileForm.firstName}
                                                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                                                        placeholder="Vorname eingeben"
                                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-brand/40"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">Nachname</label>
                                                    <input 
                                                        type="text"
                                                        value={profileForm.lastName}
                                                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                                                        placeholder="Nachname eingeben"
                                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-brand/40"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">E-Mail Adresse</label>
                                                    <input 
                                                        type="email"
                                                        value={profileForm.email}
                                                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                                        placeholder="manager@hotel.de"
                                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-brand/40"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">Handynummer / Telefon</label>
                                                    <input 
                                                        type="text"
                                                        value={profileForm.phone}
                                                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                                        placeholder="+49 176 12345678"
                                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-brand/40"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Business / Location Address Grid */}
                                        <div className="space-y-4 pt-4 border-t border-white/10">
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-brand/80">
                                                {managerContext === 'FM' ? 'Adresse des Flottenbetriebs / Firma' : managerContext === 'HM' ? 'Adresse des Hotels / Resorts' : managerContext === 'SM' ? 'Adresse des Stadions / der Arena' : 'Adresse des Standorts / Unternehmens'}
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">
                                                        {managerContext === 'FM' ? 'Name der Firma / Flottenbetriebs' : managerContext === 'HM' ? 'Name des Hotels / Resorts' : managerContext === 'SM' ? 'Name des Stadions / der Arena' : 'Name des Unternehmens / Standorts'}
                                                    </label>
                                                    <input 
                                                        type="text"
                                                        value={profileForm.businessName}
                                                        onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                                                        placeholder={managerContext === 'FM' ? 'z.B. Green Fleet GmbH' : managerContext === 'HM' ? 'z.B. Grand Hyatt & Spa' : 'z.B. Green Stadium Arena'}
                                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-brand/40"
                                                    />
                                                </div>
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">Straße & Hausnummer</label>
                                                    <input 
                                                        type="text"
                                                        value={profileForm.address}
                                                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                                        placeholder="z.B. Königsallee 42"
                                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-brand/40"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">Postleitzahl (PLZ)</label>
                                                    <input 
                                                        type="text"
                                                        value={profileForm.zip}
                                                        onChange={(e) => setProfileForm({ ...profileForm, zip: e.target.value })}
                                                        placeholder="40212"
                                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-brand/40"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">Stadt / Ort</label>
                                                    <input 
                                                        type="text"
                                                        value={profileForm.city}
                                                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                                                        placeholder="Düsseldorf"
                                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-brand/40"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Compliance & Regulatory Documents Section (Gewerbeanmeldung, Taxiunternehmerschein & PBefG) - NUR FLOTTEN MANAGER (FM) */}
                                        {managerContext === 'FM' && (
                                            <div className="space-y-6 pt-6 border-t border-white/10">
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <span className="px-3 py-1 bg-brand/15 border border-brand/40 text-brand text-[9px] md:text-xs font-mono font-black uppercase tracking-widest rounded-full">
                                                                § Personenbeförderungsgesetz (PBefG) & GewO
                                                            </span>
                                                            <span className="px-3 py-1 bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 text-[9px] md:text-xs font-mono font-bold uppercase tracking-widest rounded-full">
                                                                📸 Foto (JPG, PNG) oder 📄 PDF
                                                            </span>
                                                        </div>
                                                        <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-brand flex items-center gap-2.5">
                                                            <ShieldCheck size={26} className="text-brand" /> Behördliche Genehmigungen & Gewerbenachweise
                                                        </h3>
                                                        <p className="text-xs md:text-sm text-gray-400 font-medium max-w-3xl mt-1 leading-relaxed">
                                                            Als registrierter Flotten- & Mietwagen-/Taxiunternehmer müssen diese Nachweise für die rechtssichere Auftragsvermittlung vorliegen. Sie können Fotos direkt mit der Handykamera aufnehmen oder digitale PDF-Dokumente hochladen.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-6">
                                                    {complianceDocDefinitions.map(def => {
                                                        const docData = profileForm.documents?.[def.key];
                                                        const isUploaded = Boolean(docData && docData.dataUrl);

                                                        return (
                                                            <div 
                                                                key={def.key} 
                                                                className={`p-6 md:p-8 rounded-[2rem] border transition-all ${
                                                                    isUploaded 
                                                                        ? 'bg-brand/5 border-brand/40 shadow-xl shadow-brand/5' 
                                                                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                                                                }`}
                                                            >
                                                                {/* Header: Title, Description & Status Badge */}
                                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-5 border-b border-white/10">
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] md:text-xs font-black text-brand uppercase tracking-wider">{def.badge}</span>
                                                                            {def.required && (
                                                                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 uppercase border border-rose-500/30">Pflichtdokument</span>
                                                                            )}
                                                                        </div>
                                                                        <h4 className="text-base md:text-lg font-black italic text-white uppercase tracking-tight">{def.title}</h4>
                                                                        <p className="text-xs text-gray-400">{def.subtitle}</p>
                                                                    </div>

                                                                    <div>
                                                                        {isUploaded ? (
                                                                            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold">
                                                                                <CheckCircle2 size={16} />
                                                                                <span>Eingereicht ({docData.uploadedAt})</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold animate-pulse">
                                                                                <AlertCircle size={16} />
                                                                                <span>Ausstehend / Fehlt</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Metadata Inputs (Number & Expiry Date) */}
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-white/10">
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[10px] md:text-xs font-black uppercase tracking-wider text-gray-400">
                                                                            {def.numberLabel}
                                                                        </label>
                                                                        <input 
                                                                            type="text"
                                                                            value={profileForm.documents?.[def.key]?.docNumber || ''}
                                                                            onChange={(e) => handleManagerDocMetadataChange(def.key, 'docNumber', e.target.value)}
                                                                            placeholder={def.numberPlaceholder}
                                                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white focus:outline-none focus:border-brand/40"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-[10px] md:text-xs font-black uppercase tracking-wider text-gray-400">
                                                                            {def.dateLabel}
                                                                        </label>
                                                                        <input 
                                                                            type="date"
                                                                            value={profileForm.documents?.[def.key]?.expiryDate || ''}
                                                                            onChange={(e) => handleManagerDocMetadataChange(def.key, 'expiryDate', e.target.value)}
                                                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white focus:outline-none focus:border-brand/40"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* File Upload / Preview Area */}
                                                                <div className="pt-5">
                                                                    {!isUploaded ? (
                                                                        <div className="relative border-2 border-dashed border-white/15 hover:border-brand/50 rounded-2xl p-6 text-center transition-all bg-white/[0.01] hover:bg-brand/[0.02]">
                                                                            <input 
                                                                                type="file"
                                                                                accept="image/*,application/pdf,.pdf"
                                                                                onChange={(e) => {
                                                                                    if (e.target.files && e.target.files[0]) {
                                                                                        handleManagerDocUpload(def.key, e.target.files[0]);
                                                                                    }
                                                                                }}
                                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                            />
                                                                            <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
                                                                                <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shadow-lg shadow-brand/10">
                                                                                    <Upload size={22} />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-xs md:text-sm font-bold text-white">
                                                                                        Klicken oder Datei hier ablegen
                                                                                    </p>
                                                                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                                                                        📸 <strong>Foto (Kamera-Scan / JPG / PNG)</strong> oder 📄 <strong>PDF-Dokument</strong> bis 15 MB
                                                                                    </p>
                                                                                </div>
                                                                                <div className="flex gap-2">
                                                                                    <span className="px-2.5 py-1 bg-white/5 rounded-lg text-[10px] font-mono text-gray-300 border border-white/10">.PDF</span>
                                                                                    <span className="px-2.5 py-1 bg-white/5 rounded-lg text-[10px] font-mono text-gray-300 border border-white/10">.JPG</span>
                                                                                    <span className="px-2.5 py-1 bg-white/5 rounded-lg text-[10px] font-mono text-gray-300 border border-white/10">.PNG</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-white/10">
                                                                            <div className="flex items-center gap-3.5 w-full sm:w-auto">
                                                                                {docData.type === 'pdf' ? (
                                                                                    <div className="w-14 h-14 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
                                                                                        <FileText size={28} />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-brand/40 flex-shrink-0 bg-dark-900 shadow-md">
                                                                                        <img src={docData.dataUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                                                                    </div>
                                                                                )}
                                                                                <div className="overflow-hidden">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-xs md:text-sm font-black text-white truncate max-w-[200px] sm:max-w-xs">{docData.name}</span>
                                                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                                                                                            docData.type === 'pdf' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-brand/20 text-brand border border-brand/30'
                                                                                        }`}>
                                                                                            {docData.type === 'pdf' ? 'PDF' : 'FOTO'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                                                        Größe: {docData.size} • Hochgeladen am: {docData.uploadedAt}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                                                                <button 
                                                                                    type="button"
                                                                                    onClick={() => handleOpenDocumentPreview(docData)}
                                                                                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                                                                    title="Dokument in voller Auflösung ansehen"
                                                                                >
                                                                                    <Eye size={14} /> Ansehen
                                                                                </button>
                                                                                
                                                                                <label className="cursor-pointer">
                                                                                    <input 
                                                                                        type="file"
                                                                                        accept="image/*,application/pdf,.pdf"
                                                                                        onChange={(e) => {
                                                                                            if (e.target.files && e.target.files[0]) {
                                                                                                handleManagerDocUpload(def.key, e.target.files[0]);
                                                                                            }
                                                                                        }}
                                                                                        className="hidden"
                                                                                    />
                                                                                    <div className="px-4 py-2.5 bg-brand/15 hover:bg-brand/25 border border-brand/40 text-brand rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                                                                                        <Upload size={14} /> Ersetzen
                                                                                    </div>
                                                                                </label>

                                                                                <button 
                                                                                    type="button"
                                                                                    onClick={() => handleRemoveManagerDoc(def.key)}
                                                                                    className="p-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 rounded-xl transition-all cursor-pointer"
                                                                                    title="Dokument löschen"
                                                                                >
                                                                                    <Trash2 size={15} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Save Action Button */}
                                        <div className="pt-6 border-t border-white/10 flex justify-end">
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    localStorage.setItem(`green_manager_profile_${userEmailKey}`, JSON.stringify(profileForm));
                                                    if (user && setUser) {
                                                        setUser({ ...user, ...profileForm, name: `${profileForm.firstName} ${profileForm.lastName}` });
                                                    }
                                                    if (user?.email && fbDb) {
                                                        try {
                                                            const userRef = doc(fbDb, 'users', user.email.toLowerCase());
                                                            updateDoc(userRef, {
                                                                firstName: profileForm.firstName,
                                                                lastName: profileForm.lastName,
                                                                name: `${profileForm.firstName} ${profileForm.lastName}`,
                                                                phone: profileForm.phone,
                                                                businessName: profileForm.businessName,
                                                                address: profileForm.address,
                                                                zip: profileForm.zip,
                                                                city: profileForm.city,
                                                                complianceDocsOverview: {
                                                                    gewerbe: Boolean(profileForm.documents?.gewerbe?.dataUrl),
                                                                    konzession: Boolean(profileForm.documents?.konzession?.dataUrl),
                                                                    unternehmerschein: Boolean(profileForm.documents?.unternehmerschein?.dataUrl),
                                                                    versicherung: Boolean(profileForm.documents?.versicherung?.dataUrl),
                                                                    updatedAt: new Date().toISOString()
                                                                }
                                                            }).catch(() => {});
                                                        } catch (e) {}
                                                    }
                                                    setProfileSaveSuccess(true);
                                                    triggerNotification('success', 'Profil & Dokumente gespeichert ✓', 'Stammdaten und behördliche Dokumente wurden gesichert.');
                                                    setTimeout(() => setProfileSaveSuccess(false), 4000);
                                                }}
                                                className="w-full md:w-auto px-10 py-5 bg-brand text-dark-950 font-black uppercase tracking-[0.2em] text-xs md:text-sm rounded-2xl shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
                                            >
                                                Profil Speichern
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                             {/* FAHRER HUB - EXCLUSIVELY FOR FLEET MANAGERS */}
                             {view === 'drivers' && (
                                 <motion.div key="drivers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 max-w-6xl mx-auto pb-12">
                                     {/* Header Banner */}
                                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-glass p-8 rounded-[2.5rem] border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] gap-6">
                                         <div className="space-y-2">
                                             <div className="flex items-center gap-3">
                                                 <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-cyan-500/40">Electric Fleet Studio</span>
                                                 <span className="text-xs font-bold text-gray-400">• Team & Fahrer-Verwaltung</span>
                                             </div>
                                             <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-cyan-400 flex items-center gap-3">
                                                 <Users size={32} /> Fahrer Hub
                                             </h1>
                                             <p className="text-gray-300 text-xs md:text-sm font-bold uppercase tracking-widest">
                                                 Registrieren & Verwalten Sie Ihre Flottenfahrer, Führerscheine & Fahrzeugzuweisungen
                                             </p>
                                         </div>
                                         <button 
                                             onClick={() => setIsAddDriverOpen(true)}
                                             className="px-8 py-4 bg-cyan-400 text-dark-950 font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-cyan-500/30 hover:bg-cyan-300 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shrink-0 cursor-pointer"
                                         >
                                             <PlusCircle size={18} /> Fahrer Anmelden
                                         </button>
                                     </div>

                                     {/* Stats Summary Row */}
                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                         <div className="bg-glass p-5 rounded-2xl border border-white/15 flex flex-col justify-between h-[100px]">
                                             <span className="text-xs font-extrabold uppercase text-gray-200 tracking-wider">Gesamt Fahrer</span>
                                             <span className="text-3xl font-black text-white">{driversList.length}</span>
                                         </div>
                                         <div className="bg-glass p-5 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 flex flex-col justify-between h-[100px]">
                                             <span className="text-xs font-extrabold uppercase text-cyan-300 tracking-wider">Aktive Fahrer</span>
                                             <span className="text-3xl font-black text-cyan-300">{driversList.filter(d => d.status === 'Aktiv').length}</span>
                                         </div>
                                         <div className="bg-glass p-5 rounded-2xl border border-white/15 flex flex-col justify-between h-[100px]">
                                             <span className="text-xs font-extrabold uppercase text-gray-200 tracking-wider">Absolvierte Fahrten</span>
                                             <span className="text-3xl font-black text-white">{driversList.reduce((acc, d) => acc + (d.tripsCompleted || 0), 0)}</span>
                                         </div>
                                         <div className="bg-glass p-5 rounded-2xl border border-white/15 flex flex-col justify-between h-[100px]">
                                             <span className="text-xs font-extrabold uppercase text-gray-200 tracking-wider">Flotten-Rating</span>
                                             <span className="text-3xl font-black text-amber-400 flex items-center gap-2">⭐ 4.94</span>
                                         </div>
                                     </div>

                                     {/* Drivers Cards Grid */}
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                         {driversList.map((drv) => (
                                             <div key={drv.id} className="bg-glass rounded-[2rem] p-6 border border-white/15 space-y-4 hover:border-cyan-500/50 transition-all shadow-xl relative overflow-hidden group">
                                                 <div className="flex items-center justify-between">
                                                     <div className="flex items-center gap-4">
                                                         <img src={drv.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${drv.name}`} alt={drv.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-400/50" />
                                                         <div>
                                                             <h3 className="text-lg font-black text-white uppercase italic">{drv.name}</h3>
                                                             <p className="text-xs font-extrabold text-cyan-300 uppercase tracking-widest">⭐ {drv.rating || '5.0'} • {drv.tripsCompleted || 0} Fahrten</p>
                                                         </div>
                                                     </div>
                                                     <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                                                         drv.status === 'Aktiv' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50' : 'bg-amber-500/30 text-amber-300 border border-amber-400/50'
                                                     }`}>
                                                         {drv.status}
                                                     </span>
                                                 </div>

                                                  {/* FAHRER KOPPLUNGS-CODE BADGE */}
                                                  <div 
                                                      className="p-3 rounded-2xl border flex items-center justify-between shadow-sm transition-all"
                                                      style={{
                                                          backgroundColor: theme === 'light' ? '#e0f2fe' : 'rgba(6, 182, 212, 0.15)',
                                                          borderColor: 'rgba(6, 182, 212, 0.4)'
                                                      }}
                                                  >
                                                      <div className="flex items-center gap-2">
                                                          <Key size={16} className={theme === 'light' ? 'text-cyan-700' : 'text-cyan-300'} />
                                                          <span className="text-xs font-black uppercase tracking-wider" style={{ color: theme === 'light' ? '#0369a1' : '#22d3ee' }}>
                                                              Fahrer-Code:
                                                          </span>
                                                      </div>
                                                      {drv.accessCode ? (
                                                          <div className="flex items-center gap-2">
                                                              <span className="text-xs font-mono font-black tracking-widest px-2.5 py-1 rounded-lg border shadow-sm" style={{ color: theme === 'light' ? '#0e7490' : '#67e8f9', backgroundColor: theme === 'light' ? '#ffffff' : '#060911', borderColor: 'rgba(6, 182, 212, 0.5)' }}>
                                                                  {drv.accessCode}
                                                              </span>
                                                              <button 
                                                                  onClick={() => {
                                                                      navigator.clipboard.writeText(drv.accessCode);
                                                                      alert(`📋 Fahrer-Code "${drv.accessCode}" in Zwischenablage kopiert!`);
                                                                  }}
                                                                  className="p-1.5 hover:bg-cyan-500/20 rounded-lg text-cyan-600 dark:text-cyan-300 transition-all cursor-pointer"
                                                                  title="Code kopieren"
                                                              >
                                                                  <Copy size={14} />
                                                              </button>
                                                          </div>
                                                      ) : (
                                                          <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 animate-pulse">
                                                              ⏳ Wartend auf Admin
                                                          </span>
                                                      )}
                                                  </div>

                                                  {/* Driver Contact & Info Box - Inline Styles Guaranteed Contrast */}
                                                  <div 
                                                      className="p-3.5 rounded-2xl border space-y-2 text-xs transition-all shadow-sm"
                                                      style={{
                                                          backgroundColor: theme === 'light' ? '#f1f5f9' : '#060911',
                                                          borderColor: 'rgba(6, 182, 212, 0.4)'
                                                      }}
                                                  >
                                                      <div className="flex items-center gap-2">
                                                          <Mail size={14} className={theme === 'light' ? 'text-cyan-700 shrink-0' : 'text-cyan-400 shrink-0'} />
                                                          <span className="truncate font-black" style={{ color: theme === 'light' ? '#0f172a' : '#ffffff' }}>{drv.email}</span>
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                          <Smartphone size={14} className={theme === 'light' ? 'text-cyan-700 shrink-0' : 'text-cyan-400 shrink-0'} />
                                                          <span className="font-black" style={{ color: theme === 'light' ? '#0f172a' : '#ffffff' }}>{drv.phone}</span>
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                          <FileText size={14} className={theme === 'light' ? 'text-cyan-700 shrink-0' : 'text-cyan-400 shrink-0'} />
                                                          <span className="font-extrabold" style={{ color: theme === 'light' ? '#334155' : '#cbd5e1' }}>
                                                              Führerschein: <strong className="font-black" style={{ color: theme === 'light' ? '#0e7490' : '#67e8f9' }}>{drv.licenseNumber}</strong>
                                                          </span>
                                                      </div>
                                                      <div className="flex items-center gap-2 pt-1.5 border-t" style={{ borderColor: theme === 'light' ? '#cbd5e1' : 'rgba(255, 255, 255, 0.1)' }}>
                                                          <Car size={14} className={theme === 'light' ? 'text-cyan-700 shrink-0' : 'text-cyan-400 shrink-0'} />
                                                          <span className="font-black truncate" style={{ color: theme === 'light' ? '#0e7490' : '#67e8f9' }}>{drv.vehicleAssigned || 'Kein Fahrzeug'}</span>
                                                      </div>

                                                      {/* 3 Documents checklist for driver */}
                                                      <div className="pt-2 border-t flex items-center justify-between gap-1 text-[10px] font-extrabold" style={{ borderColor: theme === 'light' ? '#cbd5e1' : 'rgba(255, 255, 255, 0.1)' }}>
                                                          <span className="flex items-center gap-1" style={{ color: theme === 'light' ? '#334155' : '#cbd5e1' }}><FileText size={11} className="text-cyan-500" /> P-Schein: <strong className="text-cyan-600 dark:text-cyan-300">{drv.pScheinDoc ? '✓ PDF' : '✓ OK'}</strong></span>
                                                          <span className="flex items-center gap-1" style={{ color: theme === 'light' ? '#334155' : '#cbd5e1' }}><ShieldCheck size={11} className="text-cyan-500" /> Führerschein: <strong className="text-cyan-600 dark:text-cyan-300">{drv.fuehrerscheinDoc ? '✓ PDF' : '✓ OK'}</strong></span>
                                                          <span className="flex items-center gap-1" style={{ color: theme === 'light' ? '#334155' : '#cbd5e1' }}><FileText size={11} className="text-cyan-500" /> Ausweis: <strong className="text-cyan-600 dark:text-cyan-300">{drv.ausweisDoc ? '✓ PDF' : '✓ OK'}</strong></span>
                                                      </div>
                                                  </div>

                                                  <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                                                      {drv.approvalStatus !== 'Approved' && drv.status === 'Wartend auf Admin-Freigabe' && (
                                                          <button 
                                                              onClick={() => {
                                                                  const newCode = `DRV-${Math.floor(1000 + Math.random() * 9000)}-FM`;
                                                                  const updated = driversList.map(d => d.id === drv.id ? { ...d, approvalStatus: 'Approved', status: 'Aktiv', accessCode: newCode } : d);
                                                                  setDriversList(updated);
                                                                  alert(`✅ Fahrer "${drv.name}" wurde vom Admin verifiziert und freigegeben!\n🔑 Generierter Fahrer-Zugangscode: ${newCode}`);
                                                              }}
                                                              className="w-full py-2.5 bg-emerald-500 text-dark-950 font-black uppercase tracking-wider text-[10px] rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                                          >
                                                              <CheckCircle size={14} /> Admin: Fahrer Prüfen & Freigeben
                                                          </button>
                                                      )}

                                                      <div className="flex items-center justify-between">
                                                          <button 
                                                              onClick={() => {
                                                                  const updated = driversList.map(d => d.id === drv.id ? { ...d, status: d.status === 'Aktiv' ? 'Pause' : 'Aktiv' } : d);
                                                                  setDriversList(updated);
                                                              }}
                                                              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-300 border border-white/10 transition-all cursor-pointer"
                                                          >
                                                              Status: {drv.status === 'Aktiv' ? 'Auf Pause' : 'Aktivieren'}
                                                          </button>
                                                          <button 
                                                              onClick={() => {
                                                                  if (confirm(`Fahrzeug "${drv.name}" wirklich entfernen?`)) {
                                                                      setDriversList(driversList.filter(d => d.id !== drv.id));
                                                                  }
                                                              }}
                                                              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-all cursor-pointer"
                                                          >
                                                              <Trash2 size={16} />
                                                          </button>
                                                      </div>
                                                  </div>
                                             </div>
                                         ))}
                                     </div>
                                 </motion.div>
                             )}

                             {/* AUTO HUB - EXCLUSIVELY FOR FLEET MANAGERS */}
                             {view === 'vehicles' && (
                                 <motion.div key="vehicles" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 max-w-6xl mx-auto pb-12">
                                     {/* Header Banner */}
                                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-glass p-8 rounded-[2.5rem] border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] gap-6">
                                         <div className="space-y-2">
                                             <div className="flex items-center gap-3">
                                                 <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-cyan-500/40">Electric Fleet Studio</span>
                                                 <span className="text-xs font-bold text-gray-400">• Fahrzeuge & Galerie</span>
                                             </div>
                                             <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-cyan-400 flex items-center gap-3">
                                                 <Car size={32} /> Auto & Flotten Hub
                                             </h1>
                                             <p className="text-gray-300 text-xs md:text-sm font-bold uppercase tracking-widest">
                                                 Registrieren Sie Fahrzeuge, pflegen Sie Fahrzeuggallerien & verwalten Sie Ladestände
                                             </p>
                                         </div>
                                         <button 
                                             onClick={() => setIsAddVehicleOpen(true)}
                                             className="px-8 py-4 bg-cyan-400 text-dark-950 font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-cyan-500/30 hover:bg-cyan-300 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shrink-0 cursor-pointer"
                                         >
                                             <PlusCircle size={18} /> Auto Anmelden
                                         </button>
                                     </div>

                                     {/* Stats Summary Row */}
                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                         <div className="bg-glass p-5 rounded-2xl border border-white/10 flex flex-col justify-between h-[100px]">
                                             <span className="text-[10px] md:text-xs font-black uppercase text-gray-400 tracking-wider">Gesamt Fahrzeuge</span>
                                             <span className="text-3xl font-black text-white">{vehiclesList.length}</span>
                                         </div>
                                         <div className="bg-glass p-5 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 flex flex-col justify-between h-[100px]">
                                             <span className="text-[10px] md:text-xs font-black uppercase text-cyan-400 tracking-wider">Bereit & Verfügbar</span>
                                             <span className="text-3xl font-black text-cyan-400">{vehiclesList.filter(v => v.status === 'Bereit').length}</span>
                                         </div>
                                         <div className="bg-glass p-5 rounded-2xl border border-white/10 flex flex-col justify-between h-[100px]">
                                             <span className="text-[10px] md:text-xs font-black uppercase text-gray-400 tracking-wider">In Fahrt</span>
                                             <span className="text-3xl font-black text-white">{vehiclesList.filter(v => v.status === 'In Fahrt').length}</span>
                                         </div>
                                         <div className="bg-glass p-5 rounded-2xl border border-white/10 flex flex-col justify-between h-[100px]">
                                             <span className="text-[10px] md:text-xs font-black uppercase text-gray-400 tracking-wider">Flotten Ladezustand</span>
                                             <span className="text-3xl font-black text-cyan-400 flex items-center gap-2">⚡ 94%</span>
                                         </div>
                                     </div>

                                     {/* Vehicles Grid */}
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                         {vehiclesList.map((veh) => (
                                             <div key={veh.id} className="bg-glass rounded-[2rem] p-6 border border-white/10 space-y-4 hover:border-cyan-500/50 transition-all shadow-xl relative overflow-hidden group flex flex-col justify-between">
                                                 <div className="space-y-4">
                                                     {/* Cover & Gallery Strip */}
                                                     <div className="relative h-44 rounded-2xl overflow-hidden border border-white/10">
                                                         <img src={veh.images?.[0] || 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&fit=crop'} alt={`${veh.make} ${veh.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                         <div className="absolute top-3 right-3 px-3 py-1 bg-dark-950/80 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-cyan-400 border border-cyan-500/40">
                                                             {veh.category}
                                                         </div>
                                                         <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/80 backdrop-blur-md rounded-xl text-xs font-mono font-black tracking-widest text-white border border-white/20">
                                                             🇩🇪 {veh.licensePlate}
                                                         </div>
                                                     </div>

                                                     {/* Multi-Photo Thumbnails */}
                                                     {veh.images && veh.images.length > 1 && (
                                                         <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                                                             {veh.images.map((imgUrl, i) => (
                                                                 <img key={i} src={imgUrl} alt={`Thumbnail ${i}`} className="w-12 h-10 rounded-lg object-cover border border-cyan-500/30 shrink-0" />
                                                             ))}
                                                         </div>
                                                     )}

                                                      {/* Title (No price) */}
                                                      <div className="space-y-1">
                                                          <div className="flex items-center justify-between">
                                                              <h3 className="text-xl font-black text-white uppercase italic">{veh.make} {veh.model}</h3>
                                                              <span className="text-xs font-bold text-gray-400">{veh.year}</span>
                                                          </div>
                                                      </div>

                                                      {/* Legal Compliance Documents & TÜV Status */}
                                                      <div className="space-y-3 pt-3 border-t border-white/10 text-xs">
                                                          {/* TÜV Status Header Bar */}
                                                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-cyan-500/30">
                                                              <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                                                                  <ShieldCheck size={15} className="text-cyan-400" /> TÜV / HU Status:
                                                              </span>
                                                              <span className="font-black text-emerald-300 bg-emerald-500/20 border border-emerald-400/50 px-2.5 py-1 rounded-lg text-xs tracking-wide">
                                                                  ✓ TÜV bis {veh.tuevDate || '10/2026'}
                                                              </span>
                                                          </div>

                                                          {/* Zugewiesener Fahrer */}
                                                          <div className="flex items-center justify-between px-1">
                                                              <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-300">Zugewiesener Fahrer:</span>
                                                              <span className="font-black text-white text-xs bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">{veh.assignedDriver || 'Keiner'}</span>
                                                          </div>

                                                          {/* Legal Compliance Badge */}
                                                          <div className="pt-2 border-t border-white/10 space-y-2">
                                                              <div className="flex items-center justify-between text-xs font-black uppercase">
                                                                  <span className="text-gray-400 dark:text-gray-300">Gesetzlicher Status:</span>
                                                                  <span className={`px-3 py-1 rounded-xl text-xs font-black tracking-wider ${
                                                                      veh.approvalStatus === 'Approved' || veh.status === 'Bereit' || veh.status === 'In Fahrt'
                                                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                                                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm animate-pulse'
                                                                  }`}>
                                                                      {veh.approvalStatus === 'Approved' || veh.status === 'Bereit' || veh.status === 'In Fahrt' ? '✓ Vollständig Angemeldet' : '⏳ Wartend auf Admin'}
                                                                  </span>
                                                              </div>

                                                                {/* 3 Documents checklist in dynamic theme high-contrast box */}
                                                                <div 
                                                                    className="p-3 rounded-2xl border space-y-2 text-xs transition-all shadow-sm"
                                                                    style={{
                                                                        backgroundColor: theme === 'light' ? '#f1f5f9' : '#060911',
                                                                        borderColor: 'rgba(6, 182, 212, 0.4)'
                                                                    }}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="flex items-center gap-1.5 font-extrabold" style={{ color: theme === 'light' ? '#0f172a' : '#e2e8f0' }}>
                                                                            <FileText size={13} className={theme === 'light' ? 'text-cyan-700 shrink-0' : 'text-cyan-400 shrink-0'} /> Konzessionsschein:
                                                                        </span>
                                                                        <span className="font-black px-2 py-0.5 rounded-md border" style={{ color: theme === 'light' ? '#0e7490' : '#67e8f9', backgroundColor: theme === 'light' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.4)' }}>
                                                                            {veh.konzessionDoc ? '✓ PDF' : '✓ OK'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="flex items-center gap-1.5 font-extrabold" style={{ color: theme === 'light' ? '#0f172a' : '#e2e8f0' }}>
                                                                            <ShieldCheck size={13} className={theme === 'light' ? 'text-cyan-700 shrink-0' : 'text-cyan-400 shrink-0'} /> TÜV / HU Prüfbericht:
                                                                        </span>
                                                                        <span className="font-black px-2 py-0.5 rounded-md border" style={{ color: theme === 'light' ? '#0e7490' : '#67e8f9', backgroundColor: theme === 'light' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.4)' }}>
                                                                            {veh.tuevDoc ? '✓ PDF' : '✓ OK'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="flex items-center gap-1.5 font-extrabold" style={{ color: theme === 'light' ? '#0f172a' : '#e2e8f0' }}>
                                                                            <FileText size={13} className={theme === 'light' ? 'text-cyan-700 shrink-0' : 'text-cyan-400 shrink-0'} /> Fahrzeugschein (Teil I):
                                                                        </span>
                                                                        <span className="font-black px-2 py-0.5 rounded-md border" style={{ color: theme === 'light' ? '#0e7490' : '#67e8f9', backgroundColor: theme === 'light' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.4)' }}>
                                                                            {veh.fahrzeugscheinDoc ? '✓ PDF' : '✓ OK'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                          </div>
                                                      </div>
                                                 </div>

                                                 <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                                                     {veh.approvalStatus !== 'Approved' && veh.status === 'Wartend auf Admin-Freigabe' && (
                                                         <button 
                                                             onClick={() => {
                                                                 const updated = vehiclesList.map(v => v.id === veh.id ? { ...v, approvalStatus: 'Approved', status: 'Bereit' } : v);
                                                                 setVehiclesList(updated);
                                                                 alert(`✅ Auto "${veh.make} ${veh.model}" (${veh.licensePlate}) wurde vom Admin geprüft und vollständig freigegeben!`);
                                                             }}
                                                             className="w-full py-2.5 bg-emerald-500 text-dark-950 font-black uppercase tracking-wider text-[10px] rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                                         >
                                                             <CheckCircle size={14} /> Admin: Auto Prüfen & Freigeben
                                                         </button>
                                                     )}

                                                     <div className="flex items-center justify-between">
                                                         <button 
                                                             onClick={() => {
                                                                 const updated = vehiclesList.map(v => v.id === veh.id ? { ...v, status: v.status === 'Bereit' ? 'In Fahrt' : 'Bereit' } : v);
                                                                 setVehiclesList(updated);
                                                             }}
                                                             className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                                                                 veh.status === 'Bereit' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : veh.status === 'In Fahrt' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-gray-500/20 text-gray-300 border-gray-500/40'
                                                             }`}
                                                         >
                                                             Status: {veh.status}
                                                         </button>
                                                         <button 
                                                             onClick={() => {
                                                                 if (confirm(`Fahrzeug "${veh.make} ${veh.model}" wirklich entfernen?`)) {
                                                                     setVehiclesList(vehiclesList.filter(v => v.id !== veh.id));
                                                                 }
                                                             }}
                                                             className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-all cursor-pointer"
                                                         >
                                                             <Trash2 size={16} />
                                                         </button>
                                                     </div>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </motion.div>
                             )}

                            {/* SOCIAL HUB VIEW FOR IN-APP MARKETING & PROMOTIONS */}
                            {view === 'feed' && (
                                <motion.div key="feed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 max-w-5xl mx-auto pb-12">
                                    {/* Header Banner */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-brand/20 text-brand text-[10px] font-black uppercase tracking-widest rounded-full border border-brand/30">Marketing Studio</span>
                                                <span className="text-xs font-bold text-gray-400">• App-Weite Werbung</span>
                                            </div>
                                            <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-brand">Social & Promo Hub</h1>
                                            <p className="text-gray-300 text-xs md:text-sm font-bold uppercase tracking-widest">
                                                Erstellen Sie In-App Werbebeiträge, Storys & Sonderangebote für Ihr {managerContext === 'HM' ? 'Hotel' : 'Stadion'}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => setIsFeedOpen(true)}
                                            className="px-8 py-4 bg-brand text-dark-950 font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                                        >
                                            <Sparkles size={18} /> Werbe-Beitrag Erstellen
                                        </button>
                                    </div>

                                    {/* Campaign Cards Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Card 1 */}
                                        <div className="bg-glass rounded-[2rem] p-6 border border-white/10 space-y-4 hover:border-brand/40 transition-all shadow-xl">
                                            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                                                <Sparkles size={24} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black text-white italic uppercase">VIP Special Deals</h3>
                                                <p className="text-xs text-gray-400">Bewerben Sie exklusive Zimmer-Pakete & VIP Tickets direkt im Feed.</p>
                                            </div>
                                            <button 
                                                onClick={() => setIsFeedOpen(true)}
                                                className="w-full py-3 bg-white/5 hover:bg-brand hover:text-dark-950 text-brand border border-brand/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                            >
                                                Deal Veröffentlichen
                                            </button>
                                        </div>

                                        {/* Card 2 */}
                                        <div className="bg-glass rounded-[2rem] p-6 border border-white/10 space-y-4 hover:border-brand/40 transition-all shadow-xl">
                                            <div className="w-12 h-12 rounded-2xl bg-brand/20 text-brand border border-brand/30 flex items-center justify-center">
                                                <ImageIcon size={24} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black text-white italic uppercase">Foto & Video Storys</h3>
                                                <p className="text-xs text-gray-400">Teilen Sie Impressionen Ihrer Zimmer, Suiten oder Stadion-Logen.</p>
                                            </div>
                                            <button 
                                                onClick={() => setIsFeedOpen(true)}
                                                className="w-full py-3 bg-white/5 hover:bg-brand hover:text-dark-950 text-brand border border-brand/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                            >
                                                Story Hochladen
                                            </button>
                                        </div>

                                        {/* Card 3 */}
                                        <div className="bg-glass rounded-[2rem] p-6 border border-white/10 space-y-4 hover:border-brand/40 transition-all shadow-xl">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                                                <TrendingUp size={24} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black text-white italic uppercase">App-Reichweite</h3>
                                                <p className="text-xs text-gray-400">Erreichen Sie tausende aktive Kunden & VIP Shuttle Passagiere.</p>
                                            </div>
                                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] text-gray-300 font-bold uppercase tracking-widest text-center">
                                                Status: 100% Aktiv auf Green Grid
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {view === 'orders' && (
                                <motion.div key="orders" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                                    <div className="flex flex-col gap-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-brand leading-none">Order Command</h1>
                                                <p className="text-gray-500 text-[10px] md:text-sm font-bold uppercase tracking-widest leading-none">Real-time Guest Requests & Fulfillment</p>
                                            </div>
                                            
                                            {/* Advanced Search Bar */}
                                            <div className="relative w-full md:w-80 group">
                                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                    <Search size={16} className="text-gray-500 group-focus-within:text-brand transition-colors" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={orderSearch}
                                                    onChange={(e) => setOrderSearch(e.target.value)}
                                                    placeholder="Search active orders..."
                                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-[11px] md:text-sm lg:text-base text-white placeholder:text-white/20 focus:outline-none focus:border-brand/40 focus:bg-white/10 transition-all font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex bg-white/5 p-1.5 rounded-[1.5rem] border border-white/10 w-full md:w-fit overflow-x-auto no-scrollbar">
                                            {['Just now', 'New', 'Opened', 'Completed', 'Todays Orders'].map(filter => (
                                                <button 
                                                    key={filter} 
                                                    onClick={() => setOrderFilter(filter)}
                                                    className={`flex-1 md:w-32 px-4 py-3 rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase transition-all whitespace-nowrap ${
                                                        orderFilter === filter 
                                                        ? 'bg-brand text-dark-900 shadow-[0_10px_20px_rgba(52,211,153,0.2)]' 
                                                        : 'text-gray-500 hover:text-white'
                                                    }`}
                                                >
                                                    {filter}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                        {orders
                                        .filter(order => {
                                            const searchMatch = order.guest.toLowerCase().includes(orderSearch.toLowerCase()) || 
                                                              order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
                                                              order.items.some(it => {
                                                                  const itemName = typeof it === 'string' ? it : (it.name || '');
                                                                  return itemName.toLowerCase().includes(orderSearch.toLowerCase());
                                                              });
                                            if (!searchMatch) return false;
                                            
                                            // "staying" rule: if the order status was updated in the current session, it stays visible in the tab it was originally loaded into
                                            if (sessionTransitioned[order.id]) return true;

                                            if (orderFilter === 'Just now') return order.time === 'Just now';
                                            if (orderFilter === 'New') return order.status === 'Received' || order.status === 'Booked';
                                            if (orderFilter === 'Opened') return order.status === 'Preparing' || order.status === 'Check-In';
                                            if (orderFilter === 'Completed') return order.status === 'Ready' || order.status === 'Staying';
                                            if (orderFilter === 'Todays Orders') return order.status === 'Served' || order.status === 'Departed' || order.status === 'Paid';
                                            return true;
                                        })
                                        .map((order, i) => {
                                            const isUrgent = parseInt(order.time) > 15 || order.status === 'Received';
                                            const isBooking = order.type === 'Stay Booking';
                                            const statusProgress = (order.status === 'Received' || order.status === 'Booked') ? 25 : 
                                                                  (order.status === 'Preparing' || order.status === 'Check-In') ? 50 : 
                                                                  (order.status === 'Ready' || order.status === 'Staying') ? 75 : 100;
                                            
                                            const isUnreceived = order.status === 'Received' || order.status === 'Booked';

                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`bg-glass border-2 ${
                                                        isUnreceived 
                                                        ? 'animate-blink-red border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                                                        : (isUrgent && order.status !== 'Served' ? 'border-red-500/30' : 'border-glass')
                                                    } rounded-[2rem] p-5 flex flex-col justify-between hover:border-brand/40 transition-all group relative overflow-hidden shadow-2xl min-h-[460px]`}
                                                >
                                                    {/* Background Glow for Urgency */}
                                                    {isUrgent && order.status !== 'Served' && (
                                                        <div className="absolute inset-0 bg-red-500/[0.03] animate-pulse pointer-events-none" />
                                                    )}

                                                    {/* RED MARKED AREA (Top Half: Guest Details & Table Info) */}
                                                    <div className="space-y-4 relative z-10">
                                                        <div className="flex items-start gap-4">
                                                            {/* Type-Specific Badge block */}
                                                            <div className="w-16 h-16 rounded-2xl bg-dark-900 border border-main flex flex-col items-center justify-center text-primary relative overflow-hidden group-hover:border-brand/40 transition-colors shrink-0">
                                                                <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                {order.type === 'Stay Booking' || order.type === 'Room Service' ? (
                                                                    <>
                                                                        <span className="text-[7px] font-black text-secondary uppercase tracking-[0.2em] mb-0.5 leading-none">ROOM</span>
                                                                        <span className="text-[6px] font-black text-secondary uppercase tracking-[0.2em] mb-0.5 leading-none">NUMBER</span>
                                                                        <span className="text-base font-black italic text-brand leading-none">{order.room || 'TBD'}</span>
                                                                    </>
                                                                ) : order.type === 'Stadium E-Ticket' || order.type === 'Club Event Ticket' ? (
                                                                    <>
                                                                        <span className="text-[7px] font-black text-secondary uppercase tracking-[0.2em] mb-0.5 leading-none">TICKET</span>
                                                                        <span className="text-[6px] font-black text-secondary uppercase tracking-[0.2em] mb-0.5 leading-none">DETAILS</span>
                                                                        <span className="text-[10px] md:text-xs lg:text-sm font-black italic text-brand leading-none truncate w-full text-center px-1">{order.id?.toString()?.replace('#', '')}</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="text-[7px] font-black text-secondary uppercase tracking-[0.2em] mb-0.5 leading-none">TABLE</span>
                                                                        <span className="text-[6px] font-black text-secondary uppercase tracking-[0.2em] mb-0.5 leading-none">NUMBER</span>
                                                                        <span className="text-base font-black italic text-brand leading-none">{order.table || '0'}</span>
                                                                    </>
                                                                )}
                                                                <div className={`absolute bottom-0 left-0 right-0 h-1 ${['Served', 'Departed', 'Delivered', 'Scanned', 'Valid', 'Paid'].includes(order.status) ? 'bg-brand' : 'bg-brand/20'}`} />
                                                            </div>
                                                            
                                                            {/* Guest details */}
                                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                                <h3 className="text-base font-black italic uppercase text-primary tracking-tighter truncate leading-none mb-0.5">{order.guest}</h3>
                                                                
                                                                {/* ID badge */}
                                                                <div className="w-fit px-2 py-0.5 bg-brand/10 border border-brand/20 rounded-md">
                                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-widest leading-none">
                                                                        {order.type === 'Stay Booking' ? 'BOOKING REF' : 'CHECK ID'}: {order.id}
                                                                    </span>
                                                                </div>
                                                                
                                                                {/* Status Dropdown & Details Button */}
                                                                <div className="flex items-center gap-1.5 pt-0.5">
                                                                    <select
                                                                        value={order.status}
                                                                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                                        className="bg-dark-900 border border-main rounded-md px-1.5 py-0.5 text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase outline-none focus:border-brand/40 cursor-pointer h-[21px]"
                                                                    >
                                                                        {order.type === 'Stay Booking' ? (
                                                                            <>
                                                                                <option value="Booked">Booked</option>
                                                                                <option value="Check-In">Check-In</option>
                                                                                <option value="Staying">Staying</option>
                                                                                <option value="Departed">Departed</option>
                                                                            </>
                                                                        ) : order.type === 'Stadium E-Ticket' || order.type === 'Club Event Ticket' ? (
                                                                            <>
                                                                                <option value="Purchased">Purchased</option>
                                                                                <option value="Issued">Issued</option>
                                                                                <option value="Valid">Valid</option>
                                                                                <option value="Scanned">Scanned</option>
                                                                            </>
                                                                        ) : order.type === 'Room Service' ? (
                                                                            <>
                                                                                <option value="Received">Received</option>
                                                                                <option value="Preparing">Preparing</option>
                                                                                <option value="On Route">On Route</option>
                                                                                <option value="Delivered">Delivered</option>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <option value="Received">Received</option>
                                                                                <option value="Preparing">Preparing</option>
                                                                                <option value="Ready">Ready</option>
                                                                                <option value="Served">Served</option>
                                                                            </>
                                                                        )}
                                                                        <option value="Paid">Paid</option>
                                                                    </select>
                                                                    
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedGuest({ 
                                                                                ...order, 
                                                                                phone: '+49 176 4421 8892', 
                                                                                email: order.guest.toLowerCase().replace(/\s+/g, '.') + '@green-social.com', 
                                                                                loyalty: 'Pioneer Tier 1', 
                                                                                visits: '12', 
                                                                                lastStay: 'April 2026',
                                                                                address: 'Königsallee 12, 40212 Düsseldorf',
                                                                                dob: 'May 12, 1992',
                                                                                idNumber: 'PA-99281-XM'
                                                                            });
                                                                        }}
                                                                        className="flex items-center gap-1 px-2.5 py-0.5 bg-brand text-dark-900 rounded-md text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 h-[21px]"
                                                                    >
                                                                        <User size={8} />
                                                                        Details
                                                                    </button>
                                                                </div>

                                                                {/* Metadata badges row */}
                                                                <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                                                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 rounded-full border border-white/5 leading-none shrink-0">
                                                                        <Timer size={8} className={isUrgent ? 'text-red-400 animate-pulse' : 'text-secondary'} />
                                                                        <span className={`text-[7px] font-black uppercase leading-none ${isUrgent ? 'text-red-400' : 'text-secondary'}`}>{order.time}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 rounded-full border border-white/5 leading-none shrink-0">
                                                                        <ShoppingBag size={8} className="text-secondary" />
                                                                        <span className="text-[7px] font-black uppercase leading-none text-secondary">
                                                                            {managerContext === 'HM' && (order.type === 'Takeaway' || order.type === 'Stay Booking') ? 'Room Only' : order.type}
                                                                        </span>
                                                                    </div>
                                                                    <div className="px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase border leading-none shrink-0 bg-brand/10 border-brand/20 text-brand">
                                                                        {order.payment}
                                                                    </div>
                                                                    {order.plate && <span className="px-1.5 py-0.5 bg-brand/10 border border-brand/20 rounded-full text-[7px] font-black text-brand tracking-widest leading-none shrink-0">{order.plate}</span>}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Actions & Gross Value Area */}
                                                        <div className="flex items-center justify-between border-t border-main pt-3">
                                                            <div>
                                                                <p className="text-[7px] font-black text-secondary uppercase tracking-[0.2em] mb-0.5 opacity-60 leading-none">Gross Value</p>
                                                                <p className="text-lg font-black italic text-primary leading-none tracking-tighter">€{order.total}</p>
                                                                {order.status === 'Paid' && (
                                                                    <div className="flex items-center gap-1 mt-1 px-2 py-0.5 bg-brand/10 border border-brand/20 rounded-full w-fit">
                                                                        <ShieldCheck size={8} className="text-brand" />
                                                                        <span className="text-[6px] font-black text-brand uppercase tracking-widest leading-none">Verified</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {order.type !== 'Stay Booking' && order.type !== 'Stadium E-Ticket' && order.type !== 'Club Event Ticket' && (
                                                                <div className="flex gap-2">
                                                                    {order.type === 'Stadium E-Ticket' || order.type === 'Club Event Ticket' ? (
                                                                        <button 
                                                                            onClick={() => resendEmails(order)}
                                                                            title="Resend Ticket / Verification Email"
                                                                            className="w-9 h-9 bg-brand/10 border border-brand/40 text-brand rounded-xl flex items-center justify-center hover:bg-brand/20 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
                                                                        >
                                                                            <Mail size={14} className="stroke-[2.5]" />
                                                                        </button>
                                                                    ) : (
                                                                        <button 
                                                                            onClick={() => undoOrderStatus(order.id)}
                                                                            disabled={!previousStatuses[order.id]}
                                                                            title="Undo Status Change"
                                                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 border ${
                                                                                previousStatuses[order.id]
                                                                                ? 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25 hover:text-red-300 hover:scale-105 active:scale-95 shadow-md shadow-red-500/5 cursor-pointer'
                                                                                : 'bg-white/5 border-white/5 text-gray-500 opacity-40 cursor-not-allowed'
                                                                            }`}
                                                                        >
                                                                            <Undo size={14} className="stroke-[2.5]" />
                                                                        </button>
                                                                    )}
                                                                    {order.status !== 'Served' && (
                                                                        <button 
                                                                            onClick={() => {
                                                                                setMessageOrder(order);
                                                                                setCustomMessage('');
                                                                            }}
                                                                            className="w-9 h-9 bg-white/5 border border-brand/20 hover:border-brand/40 rounded-xl flex items-center justify-center text-secondary hover:text-brand hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
                                                                        >
                                                                            <MessageCircle size={16} />
                                                                        </button>
                                                                    )}
                                                                    <button 
                                                                        onClick={() => {
                                                                            const isTicket = order.type === 'Stadium E-Ticket' || order.type === 'Club Event Ticket';
                                                                            if (order.status === 'Received' || order.status === 'Booked') {
                                                                                const nextStatus = order.type === 'Stay Booking' ? 'Check-In' : 'Preparing';
                                                                                updateOrderStatus(order.id, nextStatus);
                                                                                if (isTicket) {
                                                                                    alert("✉️ [Email 1 Sent] Verification Email has been sent automatically to the customer's email box for verification!");
                                                                                }
                                                                            } else if (order.status === 'Preparing' || order.status === 'Check-In') {
                                                                                const nextStatus = order.type === 'Stay Booking' ? 'Staying' : 'Ready';
                                                                                updateOrderStatus(order.id, nextStatus);
                                                                                if (isTicket) {
                                                                                    alert("✉️ [Email 2 Sent] Ticket & Confirmation Email containing the active ticket verification code and native receipt link has been sent to the partner!");
                                                                                }
                                                                            } else if (order.status === 'Ready' || order.status === 'Staying') {
                                                                                const nextStatus = order.type === 'Stay Booking' ? 'Departed' : 'Served';
                                                                                updateOrderStatus(order.id, nextStatus);
                                                                            }
                                                                        }}
                                                                        disabled={order.status === 'Served' || order.status === 'Departed'}
                                                                        className={`h-9 px-4 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-md shrink-0 ${
                                                                            (order.status === 'Served' || order.status === 'Departed') 
                                                                            ? 'bg-btn-sec text-secondary border border-main opacity-50 cursor-not-allowed' 
                                                                            : 'bg-brand text-dark-900 hover:scale-105 active:scale-95'
                                                                        }`}
                                                                    >
                                                                        <CheckCircle2 size={12} />
                                                                        {order.status === 'Received' || order.status === 'Booked' ? (order.type === 'Stadium E-Ticket' || order.type === 'Club Event Ticket' ? 'Verify & Email 1' : 'Prepare') :
                                                                         order.status === 'Preparing' || order.status === 'Check-In' ? (order.type === 'Stadium E-Ticket' || order.type === 'Club Event Ticket' ? 'Send Ticket & Email 2' : 'Ready') :
                                                                         order.status === 'Ready' || order.status === 'Staying' ? (order.type === 'Stay Booking' ? 'Depart' : 'Serve') :
                                                                         'Done'}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* STADIUM TICKET QR-CODE MANAGER WIDGET */}
                                                    {(order.type === 'Stadium E-Ticket' || order.type === 'Club Event Ticket' || order.type?.includes('Ticket')) && (
                                                        <div className="mt-2 p-3 bg-dark-900/80 rounded-2xl border border-brand/30 space-y-2 relative z-10 shadow-lg">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[9px] md:text-[10px] font-black text-brand uppercase tracking-wider flex items-center gap-1.5">
                                                                    <Receipt size={13} className="text-brand" /> Stadion QR-Code / Ticket-Link
                                                                </span>
                                                                {localStorage.getItem(`green_order_qr_${order.id}`) ? (
                                                                    <span className="text-[7px] md:text-[8px] font-black uppercase text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                                                        Hinterlegt ✓
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[7px] md:text-[8px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                                        Ausstehend ⏳
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                                <label className="px-3 py-2 bg-black/60 hover:bg-black/90 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider border border-white/10 cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95">
                                                                    <span>🖼️ Bild Upload</span>
                                                                    <input 
                                                                        type="file" 
                                                                        accept="image/*" 
                                                                        className="hidden" 
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) {
                                                                                const reader = new FileReader();
                                                                                reader.onload = (event) => {
                                                                                    const dataUrl = event.target.result;
                                                                                    safeSetItem(`green_order_qr_${order.id}`, dataUrl);
                                                                                    window.dispatchEvent(new Event('storage'));
                                                                                    if (window.parent) {
                                                                                        try { window.parent.dispatchEvent(new Event('storage')); } catch (_) {}
                                                                                    }
                                                                                    alert(`✅ Stadion QR-Code Bild für Bestellung #${String(order.id).slice(-6)} gespeichert!`);
                                                                                };
                                                                                reader.readAsDataURL(file);
                                                                            }
                                                                        }}
                                                                    />
                                                                </label>

                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const current = localStorage.getItem(`green_order_qr_${order.id}`) || '';
                                                                        const link = prompt("🔗 Stadion Ticket-Link oder QR-Code Text eingeben:", current.startsWith('data:') ? '' : current);
                                                                        if (link !== null && link.trim() !== '') {
                                                                            safeSetItem(`green_order_qr_${order.id}`, link.trim());
                                                                            window.dispatchEvent(new Event('storage'));
                                                                            if (window.parent) {
                                                                                try { window.parent.dispatchEvent(new Event('storage')); } catch (_) {}
                                                                            }
                                                                            alert(`✅ Ticket-Link für Bestellung #${String(order.id).slice(-6)} hinterlegt!`);
                                                                        }
                                                                    }}
                                                                    className="px-3 py-2 bg-brand/10 hover:bg-brand/20 text-brand rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider border border-brand/30 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                                                                >
                                                                    <span>🔗 Link / Text</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* YELLOW MARKED AREA (Bottom Half: Items & Pipeline Progress) */}
                                                    <div className="flex flex-col gap-3 mt-1 border-t border-main pt-3 relative z-10">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center leading-none">
                                                                <div className="flex items-center gap-1.5 leading-none">
                                                                    {order.type === 'Stay Booking' ? <BedDouble size={12} className="text-brand" /> : <Utensils size={12} className="text-brand" />}
                                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest opacity-60 leading-none">
                                                                        {order.type === 'Stay Booking' ? 'Reservation Overview' : 'Production Pipeline'}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-widest leading-none bg-brand/5 px-1.5 py-0.5 rounded border border-brand/10">
                                                                    STATUS: {order.status}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* Horizontal scrollable item pictures row */}
                                                            {order.type === 'Stay Booking' ? (
                                                                <div className="space-y-2 w-full">
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div className="p-2 bg-btn-sec rounded-xl border border-main">
                                                                            <span className="text-[7px] font-black text-secondary uppercase tracking-widest block opacity-60">Check-In</span>
                                                                            <p className="text-xs md:text-sm lg:text-base font-black italic uppercase text-primary">{order.guestDetails?.checkIn || order.checkIn || 'MAY 19'}</p>
                                                                        </div>
                                                                        <div className="p-2 bg-btn-sec rounded-xl border border-main">
                                                                            <span className="text-[7px] font-black text-secondary uppercase tracking-widest block opacity-60">Check-Out</span>
                                                                            <p className="text-xs md:text-sm lg:text-base font-black italic uppercase text-primary">{order.guestDetails?.checkOut || order.checkOut || 'MAY 21'}</p>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {(order.address || order.email || order.phone || order.guestDetails) && (
                                                                        <div className="p-3 bg-dark-950/40 rounded-xl border border-main/50 text-[8px] md:text-[10px] lg:text-xs space-y-1.5 w-full">
                                                                            {order.guestDetails?.bookingType === 'business' && (
                                                                                <div className="mb-2 pb-2 border-b border-white/5">
                                                                                    <span className="text-brand font-black uppercase tracking-wider block opacity-90 mb-1">Business Booking</span>
                                                                                    {order.guestDetails?.companyName && (
                                                                                        <div>
                                                                                            <span className="text-secondary font-black uppercase tracking-wider block opacity-60">Company</span>
                                                                                            <span className="text-primary font-bold text-[9px] md:text-[11px] lg:text-xs truncate block">{order.guestDetails.companyName}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                            {order.email && (
                                                                                <div>
                                                                                    <span className="text-secondary font-black uppercase tracking-wider block opacity-60">Email</span>
                                                                                    <span className="text-primary font-bold text-[9px] md:text-[11px] lg:text-xs truncate block">{order.email}</span>
                                                                                </div>
                                                                            )}
                                                                            {order.phone && (
                                                                                <div>
                                                                                    <span className="text-secondary font-black uppercase tracking-wider block opacity-60">Phone</span>
                                                                                    <span className="text-primary font-bold text-[9px] md:text-[11px] lg:text-xs">{order.phone}</span>
                                                                                </div>
                                                                            )}
                                                                            {order.address && (
                                                                                <div>
                                                                                    <span className="text-secondary font-black uppercase tracking-wider block opacity-60">Residential Address</span>
                                                                                    <span className="text-primary font-bold text-[9px] md:text-[11px] lg:text-xs">{order.address}, {order.zip} {order.city}</span>
                                                                                </div>
                                                                            )}
                                                                            {order.idNumber && (
                                                                                <div className="grid grid-cols-2 gap-2">
                                                                                    <div>
                                                                                        <span className="text-secondary font-black uppercase tracking-wider block opacity-60">Passport / ID</span>
                                                                                        <span className="text-primary font-bold text-[9px] md:text-[11px] lg:text-xs">{order.idNumber}</span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-secondary font-black uppercase tracking-wider block opacity-60">DOB</span>
                                                                                        <span className="text-primary font-bold text-[9px] md:text-[11px] lg:text-xs">{order.dob}</span>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {(order.company || order.companyAddress) && (
                                                                                <div className="pt-1.5 border-t border-white/5 mt-1">
                                                                                    <span className="text-brand font-black uppercase tracking-[0.2em] block text-[7px] mb-0.5">🏢 Company Invoice Address</span>
                                                                                    {order.company && <span className="text-primary font-black block text-[8px] md:text-[10px] lg:text-xs uppercase">{order.company}</span>}
                                                                                    {order.companyAddress && <span className="text-primary font-bold block text-[8px] md:text-[10px] lg:text-xs">{order.companyAddress}</span>}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex gap-4 overflow-x-auto no-scrollbar py-3 px-3 bg-dark-950/40 rounded-2xl border border-main min-h-[115px] items-start">
                                                                    {order.items.map((item, idx) => {
                                                                        let itemNameClean = '';
                                                                        let qty = '1';
                                                                        let finalImage = '';
                                                                        
                                                                        if (typeof item === 'string') {
                                                                            itemNameClean = item.replace(/\(\d+x\)/, '').trim();
                                                                            qty = item.match(/\((\d+)x\)/) ? item.match(/\((\d+)x\)/)[1] : '1';
                                                                            finalImage = getItemInfo(itemNameClean).image;
                                                                        } else {
                                                                            // It's an object!
                                                                            itemNameClean = item.name || 'Ticket/Item';
                                                                            qty = item.quantity || 1;
                                                                            
                                                                            if (item.file && item.file.url) {
                                                                                finalImage = item.file.url;
                                                                            } else if (item.image) {
                                                                                finalImage = item.image;
                                                                            } else {
                                                                                finalImage = getItemInfo(itemNameClean).image;
                                                                            }
                                                                        }

                                                                        return (
                                                                            <div key={idx} className="relative shrink-0 flex flex-col items-center gap-1 hover:scale-105 transition-transform duration-300">
                                                                                <div className="w-20 h-20 rounded-xl overflow-hidden border border-main bg-dark-900 shadow-md">
                                                                                    <img 
                                                                                        src={finalImage} 
                                                                                        alt={itemNameClean} 
                                                                                        className="w-full h-full object-cover"
                                                                                    />
                                                                                    </div>
                                                                                    {/* Qty Badge */}
                                                                                    <div className="absolute -top-1.5 -right-1.5 bg-brand text-dark-900 font-extrabold text-[9px] md:text-[11px] lg:text-xs w-5 h-5 rounded-full border border-main shadow-lg flex items-center justify-center">
                                                                                        {qty}
                                                                                    </div>
                                                                                    {/* Item Name */}
                                                                                    <span className="text-[7px] font-black uppercase text-secondary tracking-widest mt-1 text-center leading-none max-w-[70px] truncate">{itemNameClean}</span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>

                                                        {/* Progress Bar Container */}
                                                        <div className="space-y-1.5">
                                                            <div className="h-2 bg-dark-900 rounded-full border border-main p-0.5 overflow-hidden relative z-10">
                                                                <motion.div 
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${statusProgress}%` }}
                                                                    className={`h-full rounded-full transition-all duration-700 relative ${
                                                                        order.status === 'Received' ? 'bg-amber-500' :
                                                                        order.status === 'Preparing' ? 'bg-violet-500' :
                                                                        'bg-brand'
                                                                    }`}
                                                                >
                                                                    <div className="absolute inset-0 bg-white/20" />
                                                                </motion.div>
                                                            </div>
                                                            
                                                            {/* Status labels */}
                                                            <div className="flex justify-between px-0.5 text-[6.5px] font-black uppercase text-secondary tracking-widest opacity-60">
                                                                {(isBooking ? ['Booked', 'Check-In', 'Staying', 'Departed'] : order.type === 'Stadium E-Ticket' || order.type === 'Club Event Ticket' ? ['Purchased', 'Issued', 'Valid', 'Scanned'] : order.type === 'Room Service' ? ['Received', 'Preparing', 'On Route', 'Delivered'] : ['Received', 'Preparing', 'Ready', 'Served']).map((label, idx) => {
                                                                    const isActive = order.status === label;
                                                                    return (
                                                                        <span key={label} className={isActive ? 'text-brand opacity-100 font-extrabold scale-105 transition-all' : ''}>
                                                                            {label}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}


                            {view === 'shuttle' && (
    <motion.div key="shuttle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-btn-sec to-brand/5 p-8 rounded-[3rem] border border-main">
            <div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-primary">Shuttle <span className="text-brand">Service</span></h1>
                <p className="text-secondary text-xs md:text-sm font-bold uppercase tracking-[0.3em] mt-1">Incoming Guest Group Transfers & Acceptance Tracker</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-glass border border-main rounded-[2rem] space-y-2">
                <p className="text-[9px] md:text-xs font-black text-secondary uppercase tracking-widest">Expected Guests Today</p>
                <p className="text-3xl font-black italic text-brand">10 Guests ({shuttleRequests.filter(r => r.status === 'ACCEPTED').reduce((acc, curr) => acc + curr.guests, 0)} Confirmed)</p>
            </div>
            <div className="p-6 bg-glass border border-main rounded-[2rem] space-y-2">
                <p className="text-[9px] md:text-xs font-black text-secondary uppercase tracking-widest">Assigned Shuttle Fleet</p>
                <p className="text-3xl font-black italic text-cyan-400">2x VIP Sprinters (Auto-Split)</p>
            </div>
            <div className="p-6 bg-glass border border-main rounded-[2rem] space-y-2">
                <p className="text-[9px] md:text-xs font-black text-secondary uppercase tracking-widest">Total Luggage Volume</p>
                <p className="text-3xl font-black italic text-primary">{shuttleRequests.reduce((acc, curr) => acc + curr.bags, 0)} Luggage Bags</p>
            </div>
        </div>

        <div className="bg-glass border border-main rounded-[3rem] p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-main pb-4">
                <div>
                    <h3 className="text-lg font-black italic uppercase tracking-tighter text-primary">Incoming Guest Manifest</h3>
                    <p className="text-xs text-secondary font-bold uppercase tracking-wider">Live Shuttle Buchungen & Fahrpreis-Aufschlüsselung</p>
                </div>
                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-black uppercase tracking-widest">
                    Gesamt-Shuttle Umsatz: €{shuttleRequests.reduce((acc, curr) => acc + (curr.totalPrice || (curr.guests * curr.pricePerPax)), 0).toFixed(2)}
                </div>
            </div>

            <div className="space-y-4">
                {shuttleRequests.map((s) => {
                    const pricePerPax = s.pricePerPax || calculateShuttleFare(s.distanceKm || 12);
                    const totalPrice = s.totalPrice || (s.guests * pricePerPax);

                    return (
                        <div key={s.id} className="p-6 bg-btn-sec border border-main rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-brand/20 transition-all shadow-md">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <p className="text-base font-black italic uppercase text-primary">{s.title}</p>
                                    <span className="px-2.5 py-1 bg-brand/10 text-brand border border-brand/30 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                        {s.distanceKm || 12} KM
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider">
                                    <span className="px-3 py-1.5 bg-brand/10 text-brand rounded-xl border border-brand/20">👥 {s.guests} Guests</span>
                                    <span className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">🧳 {s.bags} Luggage Bags</span>
                                    <span className="px-3 py-1.5 bg-white/5 text-secondary rounded-xl border border-white/10">🕒 {s.time}</span>
                                    <span className="px-3 py-1.5 bg-white/5 text-secondary rounded-xl border border-white/10">🚐 {s.vehicle}</span>
                                    <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30 font-black">
                                        💳 €{pricePerPax.toFixed(2)} / Pax
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-right px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                                    <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest block">Fahrpreis Gesamt</span>
                                    <span className="text-xl font-black italic text-emerald-400 block">€{totalPrice.toFixed(2)}</span>
                                    <span className="text-[9px] text-gray-400 font-bold block">€{pricePerPax.toFixed(2)} × {s.guests} Pax</span>
                                </div>

                                <div>
                                    {s.status === 'ACCEPTED' ? (
                                        <span className="w-full md:w-auto px-5 py-3.5 bg-brand/20 text-brand border border-brand/30 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                            <CheckCircle size={16} /> Accepted & Confirmed
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleAcceptShuttle(s.id)}
                                            className="w-full md:w-auto px-6 py-3.5 bg-brand text-dark-900 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={16} /> Accept Request
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </motion.div>
)}

                        {view === 'finance' && (
                                <motion.div key="finance" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                                    <div className="flex flex-col md:flex-row gap-4 md:justify-between md:items-end">
                                        <div className="space-y-2">
                                            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-primary leading-none">Financial Intel</h1>
                                            <p className="text-secondary text-xs md:text-sm font-bold uppercase tracking-widest leading-none">Real-time Revenue & Payout Ledger</p>
                                        </div>
                                        {managerContext === 'FM' ? (
                                            <button onClick={handleDownloadPDFReport} className="w-full md:w-auto px-6 py-3 bg-brand text-dark-900 border border-brand rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all whitespace-nowrap shadow-[0_0_15px_rgba(33,255,165,0.3)]">
                                                <FileText size={14} /> Export Monthly PDF Report
                                            </button>
                                        ) : (
                                            <button onClick={handleExport} className="w-full md:w-auto px-6 py-3 bg-btn-sec border border-main rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all whitespace-nowrap">
                                                <FileText size={14} /> Export Datev (SKR03)
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* B2B STADION TICKET & SHUTTLE ABRECHNUNG (UMSATZ HUB) */}
                                    {managerContext === 'SM' && (
                                        <div className="bg-dark-900 border border-brand/30 rounded-[3rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/30 text-brand flex items-center justify-center font-black">
                                                        <Ticket size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">B2B Ticket & Shuttle Abrechnung</h3>
                                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Automatische Aufschlüsselung: Ticket-Verkauf, Shuttle-Service & Green Provision</p>
                                                    </div>
                                                </div>
                                                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider border border-emerald-500/30">
                                                    Abrechnungs-Status: Aktiv
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                                <div 
                                                    onClick={() => {
                                                        setSelectedTicketCategory(null);
                                                        setTicketStatusFilter('all');
                                                        setIsTicketRevenueModalOpen(true);
                                                    }}
                                                    className="bg-black/50 border border-white/10 hover:border-[#00e5ff] hover:bg-white/[0.04] cursor-pointer transition-all rounded-2xl p-6 space-y-2 group shadow-lg active:scale-98"
                                                    title="Klicken für Ticket-Aufschlüsselung & Kategorien"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Brutto Ticket-Umsatz</span>
                                                        <span className="text-[9px] font-black uppercase text-[#00e5ff] tracking-wider opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">Details ↗</span>
                                                    </div>
                                                    <span className="text-2xl font-black italic text-white block">€2.400,00</span>
                                                    <span className="text-[9px] text-gray-500 block">12 VIP & Sektor Tickets verkauft</span>
                                                </div>

                                                <div 
                                                    onClick={() => {
                                                        setShuttleStatusFilter('all');
                                                        setIsShuttleServiceModalOpen(true);
                                                    }}
                                                    className="bg-black/50 border border-white/10 hover:border-amber-400 hover:bg-white/[0.04] cursor-pointer transition-all rounded-2xl p-6 space-y-2 group shadow-lg active:scale-98"
                                                    title="Klicken für Shuttle-Service Aufschlüsselung & PDF-Download"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">- Shuttle-Service an Green</span>
                                                        <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">Details ↗</span>
                                                    </div>
                                                    <span className="text-2xl font-black italic text-amber-400 block">-€192,00</span>
                                                    <span className="text-[9px] text-gray-500 block">12 Passagiere @ €16,00 Staffeltarif</span>
                                                </div>

                                                <div className="bg-black/50 border border-white/10 rounded-2xl p-6 space-y-2">
                                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block">- Green Ticket-Provision</span>
                                                    <span className="text-2xl font-black italic text-purple-400 block">-€120,00</span>
                                                    <span className="text-[9px] text-gray-500">5% Verkaufs-Provision an Plattform</span>
                                                </div>

                                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 space-y-2">
                                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">= Netto-Auszahlung an Stadion</span>
                                                    <span className="text-2xl font-black italic text-emerald-400 block">€2.088,00</span>
                                                    <span className="text-[9px] text-emerald-400/80 font-bold">Auszahlungskonto DE77...9922</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* B2B HOTEL ZIMMER & SHUTTLE ABRECHNUNG (UMSATZ HUB) */}
                                    {managerContext === 'HM' && (
                                        <div className="bg-dark-900 border border-brand/30 rounded-[3rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/30 text-brand flex items-center justify-center font-black">
                                                        <BedDouble size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">B2B Hotel Zimmer & Shuttle Abrechnung</h3>
                                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Automatische Aufschlüsselung: Zimmer-Umsatz, Shuttle-Service & Green Provision</p>
                                                    </div>
                                                </div>
                                                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider border border-emerald-500/30">
                                                    Abrechnungs-Status: Aktiv
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                                <div 
                                                    onClick={() => {
                                                        setSelectedRoomCategory(null);
                                                        setRoomStatusFilter('all');
                                                        setIsHotelRevenueModalOpen(true);
                                                    }}
                                                    className="bg-black/50 border border-white/10 hover:border-[#00e5ff] hover:bg-white/[0.04] cursor-pointer transition-all rounded-2xl p-6 space-y-2 group shadow-lg active:scale-98"
                                                    title="Klicken für Zimmer-Aufschlüsselung & Kategorien"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Brutto Zimmer-Umsatz</span>
                                                        <span className="text-[9px] font-black uppercase text-[#00e5ff] tracking-wider opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">Details ↗</span>
                                                    </div>
                                                    <span className="text-2xl font-black italic text-white block">€3.500,00</span>
                                                    <span className="text-[9px] text-gray-500 block">14 Zimmer-Nächte gebucht</span>
                                                </div>

                                                <div 
                                                    onClick={() => {
                                                        setHotelShuttleStatusFilter('all');
                                                        setIsHotelShuttleModalOpen(true);
                                                    }}
                                                    className="bg-black/50 border border-white/10 hover:border-amber-400 hover:bg-white/[0.04] cursor-pointer transition-all rounded-2xl p-6 space-y-2 group shadow-lg active:scale-98"
                                                    title="Klicken für Hotel Shuttle-Service Aufschlüsselung & PDF-Download"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">- Hotel Shuttle-Service</span>
                                                        <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">Details ↗</span>
                                                    </div>
                                                    <span className="text-2xl font-black italic text-amber-400 block">-€224,00</span>
                                                    <span className="text-[9px] text-gray-500 block">14 Shuttle-Fahrten @ €16,00 Staffeltarif</span>
                                                </div>

                                                <div className="bg-black/50 border border-white/10 rounded-2xl p-6 space-y-2">
                                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block">- Green Hotel-Provision</span>
                                                    <span className="text-2xl font-black italic text-purple-400 block">-€175,00</span>
                                                    <span className="text-[9px] text-gray-500">5% Verkaufs-Provision an Plattform</span>
                                                </div>

                                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 space-y-2">
                                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">= Netto-Auszahlung an Hotel</span>
                                                    <span className="text-2xl font-black italic text-emerald-400 block">€3.101,00</span>
                                                    <span className="text-[9px] text-emerald-400/80 font-bold">Auszahlungskonto DE89...4411</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* WÖCHENTLICHES FLOTTEN-LEDGER & REVENUE TELEMETRY */}
                                        {managerContext === 'FM' ? (
                                            <div className={`lg:col-span-2 ${isLight ? 'bg-white border-slate-200 text-slate-900 shadow-xl' : 'bg-dark-900 border-main text-white shadow-2xl'} border rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 lg:p-10 space-y-7 relative overflow-hidden`}>
                                                {/* Ambient Grid Background */}
                                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] opacity-20 pointer-events-none"></div>

                                                {/* Header Bar */}
                                                <div className="flex flex-col xl:flex-row gap-4 xl:justify-between xl:items-center relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shadow-[0_0_20px_rgba(33,255,165,0.25)] shrink-0">
                                                            <Activity size={24} />
                                                        </div>
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className={`text-xl md:text-2xl font-black italic uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                                    Wöchentliches Flotten-Ledger & Analytics
                                                                </h3>
                                                                <span className={`text-[9px] md:text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                                                    fleetPeriod === 'KW41' 
                                                                        ? (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30')
                                                                        : (isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/10 text-slate-300 border-white/10')
                                                                }`}>
                                                                    {fleetPeriod === 'KW41' ? 'KW 41 (Aktuelle Woche)' : fleetPeriod === 'KW40' ? 'KW 40 (Vorwoche)' : 'KW 42 (Zukunft)'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Controls: Universelle KW-Suche & Alle Kalenderwochen (Vergangenheit bis Zukunft) */}
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {/* Schnellsprung-Pfeile */}
                                                        <button
                                                            type="button"
                                                            title="Vorherige Kalenderwoche"
                                                            onClick={() => {
                                                                const curNum = parseInt(String(fleetPeriod).replace(/[^0-9]/g, '')) || 41;
                                                                if (curNum > 1) setFleetPeriod(`KW${curNum - 1}`);
                                                            }}
                                                            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                                                                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-btn-sec hover:bg-white/10 border-white/10 text-white'
                                                            }`}
                                                        >
                                                            ◀
                                                        </button>

                                                        {/* KW Dropdown Selector (KW 01 bis KW 52) */}
                                                        <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-black ${isLight ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-btn-sec border-white/10 text-white'}`}>
                                                            <Calendar size={13} className="text-brand shrink-0" />
                                                            <select 
                                                                value={fleetPeriod}
                                                                onChange={(e) => setFleetPeriod(e.target.value)}
                                                                className="bg-transparent font-black uppercase outline-none cursor-pointer text-[10px] md:text-xs max-w-[210px] md:max-w-none"
                                                            >
                                                                {Array.from({ length: 52 }, (_, idx) => {
                                                                    const weekNum = idx + 1;
                                                                    const info = getFleetWeekMetrics(`KW${weekNum}`);
                                                                    const isCur = weekNum === 41;
                                                                    const prefix = isCur ? '🟢 ' : weekNum < 41 ? '⏱️ ' : '🔮 ';
                                                                    const suffix = isCur ? ' • JETZT (Aktuell)' : weekNum === 40 ? ' • Vorwoche' : weekNum === 42 ? ' • Kommende Woche' : '';
                                                                    return (
                                                                        <option 
                                                                            key={weekNum} 
                                                                            value={`KW${weekNum}`}
                                                                            className={isLight ? 'text-slate-900 bg-white' : 'text-white bg-dark-900'}
                                                                        >
                                                                            {`${prefix}KW ${String(weekNum).padStart(2, '0')} (${info.rangeStr})${suffix}`}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                        </div>

                                                        {/* Schnellsprung-Pfeil Vorwärts */}
                                                        <button
                                                            type="button"
                                                            title="Nächste Kalenderwoche"
                                                            onClick={() => {
                                                                const curNum = parseInt(String(fleetPeriod).replace(/[^0-9]/g, '')) || 41;
                                                                if (curNum < 52) setFleetPeriod(`KW${curNum + 1}`);
                                                            }}
                                                            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                                                                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-btn-sec hover:bg-white/10 border-white/10 text-white'
                                                            }`}
                                                        >
                                                            ▶
                                                        </button>

                                                        {/* Schnelleingabe / Direkte KW-Suche */}
                                                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs ${
                                                            isLight ? 'bg-white border-slate-300 text-slate-800 shadow-xs' : 'bg-black/40 border-white/10 text-white'
                                                        }`}>
                                                            <Search size={12} className="text-brand shrink-0" />
                                                            <input
                                                                type="text"
                                                                placeholder="KW (z.B. 38)"
                                                                value={kwSearchQuery}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setKwSearchQuery(val);
                                                                    const num = parseInt(val.replace(/[^0-9]/g, ''));
                                                                    if (num >= 1 && num <= 52) {
                                                                        setFleetPeriod(`KW${num}`);
                                                                    }
                                                                }}
                                                                className="w-16 md:w-20 bg-transparent text-[10px] md:text-xs font-black uppercase outline-none placeholder:text-slate-400 placeholder:normal-case"
                                                            />
                                                        </div>

                                                        {/* Reset auf JETZT (KW 41) */}
                                                        {fleetPeriod !== 'KW41' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setFleetPeriod('KW41');
                                                                    setKwSearchQuery('');
                                                                }}
                                                                className="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase bg-emerald-500 text-dark-950 shadow-sm hover:scale-105 transition-all"
                                                            >
                                                                Heute (KW 41)
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Navigation Sub-Tabs */}
                                                <div className={`flex items-center gap-2 p-1.5 rounded-2xl border relative z-10 overflow-x-auto ${isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-black/40 border-white/5'}`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFleetFinanceSubTab('ledger')}
                                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                                            fleetFinanceSubTab === 'ledger'
                                                                ? 'bg-brand text-dark-900 shadow-md font-black'
                                                                : (isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white/80' : 'text-slate-400 hover:text-white hover:bg-white/5')
                                                        }`}
                                                    >
                                                        <BarChart3 size={14} />
                                                        Wöchentliche Bilanz & Bar-Verrechnung
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFleetFinanceSubTab('cancellations')}
                                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                                            fleetFinanceSubTab === 'cancellations'
                                                                ? 'bg-brand text-dark-900 shadow-md font-black'
                                                                : (isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white/80' : 'text-slate-400 hover:text-white hover:bg-white/5')
                                                        }`}
                                                    >
                                                        <Ban size={14} />
                                                        Stornierte Fahrten (Kunde vs. Fahrer)
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                                            fleetFinanceSubTab === 'cancellations' 
                                                                ? 'bg-dark-900 text-brand' 
                                                                : (isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/20 text-rose-400')
                                                        }`}>
                                                            {fleetPeriod === 'KW41' ? '14' : '12'}
                                                        </span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFleetFinanceSubTab('audit')}
                                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                                            fleetFinanceSubTab === 'audit'
                                                                ? 'bg-brand text-dark-900 shadow-md font-black'
                                                                : (isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white/80' : 'text-slate-400 hover:text-white hover:bg-white/5')
                                                        }`}
                                                    >
                                                        <FileText size={14} />
                                                        Echtzeit-Auditliste & Einzelbelege
                                                    </button>
                                                </div>

                                                {/* TAB 1: WÖCHENTLICHE BILANZ & BAR-VERRECHNUNG */}
                                                {fleetFinanceSubTab === 'ledger' && (
                                                    <div className="space-y-6 relative z-10">
                                                        {/* 4 Main Fleet KPI Cards */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                            {/* 1. Fahrten Gesamt */}
                                                            <div className={`p-4 md:p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                                                                isLight ? 'bg-slate-50 border-slate-200/90 shadow-sm' : 'bg-black/40 border-white/10'
                                                            }`}>
                                                                <div className="flex items-center justify-between">
                                                                    <span className={`text-[9px] font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Wöchentliche Fahrten</span>
                                                                    <Car size={15} className="text-cyan-500" />
                                                                </div>
                                                                <div className="my-3">
                                                                    <div className={`text-2xl md:text-3xl font-black italic tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                                        {activeWeekMetrics.tripsTotal} <span className="text-xs not-italic font-bold text-slate-500">Fahrten</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold">
                                                                        <span className={`px-2 py-0.5 rounded-md border font-black ${isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                                                                            💳 {activeWeekMetrics.tripsCard} Karte
                                                                        </span>
                                                                        <span className={`px-2 py-0.5 rounded-md border font-black ${isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                                            💵 {activeWeekMetrics.tripsCash} Bar
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className={`text-[9px] font-extrabold flex items-center justify-between pt-2 border-t ${isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'}`}>
                                                                    <span>Erfolgsquote: 90.2%</span>
                                                                    <span className="text-rose-500">{activeWeekMetrics.stornos} Stornos</span>
                                                                </div>
                                                            </div>

                                                            {/* 2. Brutto-Umsatz */}
                                                            <div className={`p-4 md:p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                                                                isLight ? 'bg-slate-50 border-slate-200/90 shadow-sm' : 'bg-black/40 border-white/10'
                                                            }`}>
                                                                <div className="flex items-center justify-between">
                                                                    <span className={`text-[9px] font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Flotten Brutto-Umsatz</span>
                                                                    <DollarSign size={15} className="text-brand" />
                                                                </div>
                                                                <div className="my-3">
                                                                    <div className={`text-2xl md:text-3xl font-black italic tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                                        €{activeWeekMetrics.grossTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold">
                                                                        <span className={`px-2 py-0.5 rounded-md border font-black ${isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                                                                            💳 €{activeWeekMetrics.grossCard.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                                        </span>
                                                                        <span className={`px-2 py-0.5 rounded-md border font-black ${isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                                            💵 €{activeWeekMetrics.grossCash.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className={`text-[9px] font-extrabold flex items-center justify-between pt-2 border-t ${isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'}`}>
                                                                    <span>Ø Fahrpreis: {activeWeekMetrics.tripsTotal > 0 ? `€${(activeWeekMetrics.grossTotal / activeWeekMetrics.tripsTotal).toFixed(2).replace('.', ',')}` : '€0,00'}</span>
                                                                    <span className="text-brand font-black">Vor Provision</span>
                                                                </div>
                                                            </div>

                                                            {/* 3. Green Provision & Bar-Offset */}
                                                            <div className={`p-4 md:p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                                                                isLight ? 'bg-slate-50 border-slate-200/90 shadow-sm' : 'bg-black/40 border-white/10'
                                                            }`}>
                                                                <div className="flex items-center justify-between">
                                                                    <span className={`text-[9px] font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Green Provision (15%)</span>
                                                                    <BadgePercent size={15} className="text-purple-400" />
                                                                </div>
                                                                <div className="my-3">
                                                                    <div className="text-2xl md:text-3xl font-black italic tracking-tight text-purple-500">
                                                                        -{activeWeekMetrics.commTotal === 0 ? '€0,00' : `€${activeWeekMetrics.commTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                    </div>
                                                                    <div className="flex flex-col gap-1 mt-1.5 text-[9px] font-bold">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Karten-Provision:</span>
                                                                            <span className="font-black text-purple-400">€{activeWeekMetrics.commCard.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between">
                                                                            <span className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>🔄 Bar-Provisions Offset:</span>
                                                                            <span className="font-black text-emerald-500">-{activeWeekMetrics.commCashOffset === 0 ? '€0,00' : `€${activeWeekMetrics.commCashOffset.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className={`text-[9px] font-extrabold flex items-center justify-between pt-2 border-t ${isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'}`}>
                                                                    <span>Stripe-Gebühr: 0 €</span>
                                                                    <span className="text-emerald-500 font-bold">Von Green bezahlt</span>
                                                                </div>
                                                            </div>

                                                            {/* 4. Stripe Netto Auszahlung */}
                                                            <div 
                                                                onClick={() => setIsDriverCashSheetOpen(true)}
                                                                title="Klicken für Fahrer-Bargeldaufschlüsselung"
                                                                className={`p-4 md:p-5 rounded-2xl border flex flex-col justify-between transition-all relative overflow-hidden cursor-pointer group hover:scale-[1.01] hover:shadow-lg ${
                                                                    isLight ? 'bg-emerald-50/70 hover:bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/30'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className={`text-[9px] font-black uppercase tracking-wider ${isLight ? 'text-emerald-900' : 'text-emerald-400'}`}>Stripe Bank-Payout (Mo)</span>
                                                                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                                                        <span>Fahrer-Details</span>
                                                                        <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                                                    </div>
                                                                </div>
                                                                <div className="my-3">
                                                                    <div className="text-2xl md:text-3xl font-black italic tracking-tight text-emerald-500">
                                                                        €{activeWeekMetrics.stripeNetPayout.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </div>
                                                                    <div className={`text-[10px] font-bold mt-1.5 flex items-center justify-between px-2 py-1 rounded-lg border transition-all ${
                                                                        isLight ? 'bg-white/90 border-emerald-200 text-emerald-900 shadow-xs group-hover:border-emerald-300' : 'bg-black/40 border-emerald-500/20 text-emerald-300 group-hover:border-emerald-500/40'
                                                                    }`}>
                                                                        <span>+ €{activeWeekMetrics.grossCash.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bar beim Fahrer (Gesamt)</span>
                                                                        <span className="text-[9px] font-black uppercase text-emerald-500 underline ml-1">Fahrer ➔</span>
                                                                    </div>
                                                                </div>
                                                                <div className={`text-[9px] font-black flex items-center justify-between pt-2 border-t ${isLight ? 'border-emerald-200 text-emerald-900' : 'border-emerald-500/30 text-emerald-400'}`}>
                                                                    <span>Flotten-Gesamtertrag:</span>
                                                                    <span className="text-emerald-600 dark:text-emerald-300 font-black text-xs">€{activeWeekMetrics.fleetTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Wochen-Balkendiagramm mit dynamischer Wochen-Navigation & sauberer Legende */}
                                                        <div className="space-y-3 pt-2">
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                                {/* Dynamischer 3-Wochen-Navigator (1 Woche davor, aktuelle Auswahl, 1 Woche danach) */}
                                                                <div className={`flex items-center gap-1.5 p-1 rounded-2xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-white/10'}`}>
                                                                    {activeWeekMetrics.kwNum > 1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setFleetPeriod(`KW${activeWeekMetrics.kwNum - 1}`)}
                                                                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                                                                                isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                                            }`}
                                                                        >
                                                                            {`◀ KW ${activeWeekMetrics.kwNum - 1}`}
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setFleetPeriod('KW41')}
                                                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 bg-brand text-dark-950 shadow-sm font-black`}
                                                                    >
                                                                        {activeWeekMetrics.isCurrent && (
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                                                        )}
                                                                        {`KW ${activeWeekMetrics.kwNum} (${activeWeekMetrics.isCurrent ? 'Aktuell: JETZT' : activeWeekMetrics.isPast ? 'Vergangenheit' : 'Zukunft'})`}
                                                                    </button>
                                                                    {activeWeekMetrics.kwNum < 52 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setFleetPeriod(`KW${activeWeekMetrics.kwNum + 1}`)}
                                                                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                                                                                isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                                            }`}
                                                                        >
                                                                            {`KW ${activeWeekMetrics.kwNum + 1} ▶`}
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Saubere Legende (Ohne (Stripe) und ohne (Fahrzeug)) */}
                                                                <div className="flex items-center gap-3.5 text-xs font-black self-end sm:self-auto">
                                                                    <span className="flex items-center gap-1.5">
                                                                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                                                                        Karte
                                                                    </span>
                                                                    <span className="flex items-center gap-1.5">
                                                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                                                        Bar
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Scrollbarer Chart-Container mit allen 7 Wochentagen (Mo, Di, Mi, Do, Fr, Sa, So) */}
                                                            <div className={`overflow-x-auto pb-3 pt-2 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'}`}>
                                                                <div className="min-w-[560px] grid grid-cols-7 gap-2 h-44 items-end px-3">
                                                                    {activeWeekMetrics.days.map((b, i) => (
                                                                        <div key={i} className="flex flex-col items-center gap-2 h-full justify-end group">
                                                                            <div className={`opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black px-2 py-0.5 rounded shadow-lg mb-1 whitespace-nowrap z-20 ${
                                                                                isLight ? 'bg-slate-900 text-white' : 'bg-black text-brand border border-brand/30'
                                                                            }`}>
                                                                                €{b.tot} (💳 €{b.card} | 💵 €{b.cash})
                                                                            </div>
                                                                            <div className="w-full max-w-[52px] flex flex-col justify-end gap-0.5" style={{ height: `${b.h}%` }}>
                                                                                <motion.div 
                                                                                    initial={{ height: 0 }}
                                                                                    animate={{ height: `${b.tot > 0 ? (b.cash / b.tot) * 100 : 0}%` }}
                                                                                    className="w-full bg-emerald-500 rounded-t-sm"
                                                                                    title={`Bar: €${b.cash}`}
                                                                                />
                                                                                <motion.div 
                                                                                    initial={{ height: 0 }}
                                                                                    animate={{ height: `${b.tot > 0 ? (b.card / b.tot) * 100 : 0}%` }}
                                                                                    className="w-full bg-cyan-500 rounded-b-sm"
                                                                                    title={`Karte: €${b.card}`}
                                                                                />
                                                                            </div>
                                                                            <div className="text-center pt-1">
                                                                                <span className={`text-xs font-black uppercase block ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{b.d}</span>
                                                                                <span className={`text-[9px] font-bold block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{b.date}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {activeWeekMetrics.isFuture && (
                                                                    <div className={`mt-2 mx-3 text-center py-2 px-3 rounded-xl border text-xs font-bold ${
                                                                        isLight ? 'bg-slate-100/80 border-slate-200 text-slate-500' : 'bg-white/5 border-white/5 text-slate-400'
                                                                    }`}>
                                                                        📅 Zukünftige Periode ({activeWeekMetrics.label}) • Noch keine Fahrten oder Umsätze erfasst
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* TAB 2: STORNO-INTELLIGENCE (KUNDE VS. FAHRER) */}
                                                {fleetFinanceSubTab === 'cancellations' && (
                                                    <div className="space-y-6 relative z-10">
                                                        {activeWeekMetrics.isFuture ? (
                                                            <div className={`p-10 rounded-3xl border text-center ${isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-black/30 border-white/5 text-slate-400'}`}>
                                                                <Ban size={40} className="mx-auto mb-3 text-rose-500/70" />
                                                                <h4 className={`text-base font-black uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                                                    Zukünftige Kalenderwoche ({activeWeekMetrics.label})
                                                                </h4>
                                                                <p className="text-xs opacity-75 mt-1 max-w-md mx-auto">
                                                                    Für diesen Zeitraum liegen noch keine Fahrten oder Stornierungen vor. Alle Stornokennzahlen stehen bei 0.
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Summary Ribbon */}
                                                                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                                                                    isLight ? 'bg-rose-50/60 border-rose-200 text-slate-800' : 'bg-rose-500/10 border-rose-500/20 text-white'
                                                                }`}>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                                                                            <Ban size={20} />
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="text-sm font-black uppercase tracking-wider">
                                                                                {activeWeekMetrics.stornos} Stornierungen erfasst (Stornoquote: {activeWeekMetrics.tripsTotal > 0 ? ((activeWeekMetrics.stornos / (activeWeekMetrics.tripsTotal + activeWeekMetrics.stornos)) * 100).toFixed(1) + '%' : '0.0%'})
                                                                            </h4>
                                                                            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                                                                                Präzise Verursacher-Zuordnung mit automatischem Ausfallschutz für Flottenunternehmer
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className={`px-4 py-2 rounded-xl border text-center font-black text-xs ${
                                                                        isLight ? 'bg-white border-rose-200 text-rose-700' : 'bg-dark-900 border-rose-500/30 text-rose-400'
                                                                    }`}>
                                                                        <span className="block text-[9px] uppercase tracking-wider opacity-70">Flotten-Ausfallentschädigung</span>
                                                                        <span className="text-base text-emerald-500">+{activeWeekMetrics.stornos > 0 ? '€19,50' : '€0,00'}</span> Gutschrift
                                                                    </div>
                                                                </div>

                                                                {/* Two Columns: Customer vs Driver Cancellations */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    {/* 1. SELBST STORNIERT DURCH KUNDE / FAHRGAST */}
                                                                    <div className={`p-6 rounded-3xl border space-y-4 ${
                                                                        isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-black/40 border-white/10'
                                                                    }`}>
                                                                        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)' }}>
                                                                            <div className="flex items-center gap-2.5">
                                                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-black">
                                                                                    <User size={16} />
                                                                                </div>
                                                                                <div>
                                                                                    <h5 className={`text-sm font-black uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                                                        1. Selbst storniert (Kunde)
                                                                                    </h5>
                                                                                    <span className="text-[10px] text-slate-500 font-bold">{Math.round(activeWeekMetrics.stornos * 0.78)} Stornos durch Fahrgast</span>
                                                                                </div>
                                                                            </div>
                                                                            <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                                                                isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-500/20 text-blue-400'
                                                                            }`}>
                                                                                {Math.round(activeWeekMetrics.stornos * 0.78)} Stornos
                                                                            </span>
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            {/* Free instant cancellation */}
                                                                            <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-dark-900 border-white/5'}`}>
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-xs font-black flex items-center gap-1.5 text-slate-500">
                                                                                        <CheckCircle size={14} className="text-slate-400" />
                                                                                        Sofort-Storno (&lt; 2 Min)
                                                                                    </span>
                                                                                    <span className="text-xs font-extrabold">{Math.round(activeWeekMetrics.stornos * 0.55)} Fahrten</span>
                                                                                </div>
                                                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[10px]">
                                                                                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Kulanzfenster vor Fahrtantritt:</span>
                                                                                    <span className="font-bold text-slate-400">0,00 € Gebühr</span>
                                                                                </div>
                                                                            </div>

                                                                            {/* Late cancellation with fee */}
                                                                            <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-rose-50/70 border-rose-200' : 'bg-rose-500/10 border-rose-500/20'}`}>
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-xs font-black flex items-center gap-1.5 text-rose-500">
                                                                                        <AlertCircle size={14} />
                                                                                        Spät-Storno (&gt; 2 Min / Anfahrt)
                                                                                    </span>
                                                                                    <span className="text-xs font-black text-rose-500">{Math.max(0, Math.round(activeWeekMetrics.stornos * 0.78) - Math.round(activeWeekMetrics.stornos * 0.55))} Fahrten</span>
                                                                                </div>
                                                                                <div className="space-y-1.5 mt-2 pt-2 border-t border-rose-200/50 dark:border-rose-500/20 text-[10px]">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Stornogebühr vom Kunden eingezogen:</span>
                                                                                        <span className="font-extrabold">€{(Math.max(0, Math.round(activeWeekMetrics.stornos * 0.78) - Math.round(activeWeekMetrics.stornos * 0.55)) * 6).toFixed(2).replace('.', ',')}</span>
                                                                                    </div>
                                                                                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-black">
                                                                                        <span>Flotten-Entschädigung (75%):</span>
                                                                                        <span>+€{(Math.max(0, Math.round(activeWeekMetrics.stornos * 0.78) - Math.round(activeWeekMetrics.stornos * 0.55)) * 4.5).toFixed(2).replace('.', ',')} an Flotte</span>
                                                                                    </div>
                                                                                    <div className="flex items-center justify-between text-slate-500 font-bold">
                                                                                        <span>Green Plattformanteil (25%):</span>
                                                                                        <span>€{(Math.max(0, Math.round(activeWeekMetrics.stornos * 0.78) - Math.round(activeWeekMetrics.stornos * 0.55)) * 1.5).toFixed(2).replace('.', ',')}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <p className={`text-[10px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                                                            ℹ️ Bei Stornos nach 2 Minuten schützt Green Ihre Fahrer: Die Stornogebühr wird dem Kunden automatisch belastet und als Aufwandsentschädigung für Akkuladung und Fahrtzeit Ihrer Flotte gutgeschrieben.
                                                                        </p>
                                                                    </div>

                                                                    {/* 2. VOM FAHRER STORNIERT */}
                                                                    <div className={`p-6 rounded-3xl border space-y-4 ${
                                                                        isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-black/40 border-white/10'
                                                                    }`}>
                                                                        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)' }}>
                                                                            <div className="flex items-center gap-2.5">
                                                                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
                                                                                    <Car size={16} />
                                                                                </div>
                                                                                <div>
                                                                                    <h5 className={`text-sm font-black uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                                                        2. Vom Fahrer storniert
                                                                                    </h5>
                                                                                    <span className="text-[10px] text-slate-500 font-bold">{Math.max(0, activeWeekMetrics.stornos - Math.round(activeWeekMetrics.stornos * 0.78))} Stornos durch Fahrer</span>
                                                                                </div>
                                                                            </div>
                                                                            <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                                                                isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-400'
                                                                            }`}>
                                                                                {Math.max(0, activeWeekMetrics.stornos - Math.round(activeWeekMetrics.stornos * 0.78))} Stornos
                                                                            </span>
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            {/* No-show after waiting */}
                                                                            <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'}`}>
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-xs font-black flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                                                                        <Clock size={14} />
                                                                                        Kunde No-Show (&gt; 8 Min Wartezeit)
                                                                                    </span>
                                                                                    <span className="text-xs font-black">{activeWeekMetrics.stornos > 0 ? '1 Fahrt' : '0 Fahrten'}</span>
                                                                                </div>
                                                                                <div className="space-y-1 mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-500/20 text-[10px]">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Fahrer am Abholort gewartet & kontaktiert:</span>
                                                                                        <span className="font-bold text-amber-600 dark:text-amber-400">GPS verifiziert</span>
                                                                                    </div>
                                                                                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-black">
                                                                                        <span>No-Show Entschädigung für Flotte:</span>
                                                                                        <span>+{activeWeekMetrics.stornos > 0 ? '€4,50' : '€0,00'}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Traffic or emergency */}
                                                                            <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-dark-900 border-white/5'}`}>
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-xs font-black flex items-center gap-1.5 text-slate-500">
                                                                                        <AlertTriangle size={14} className="text-slate-400" />
                                                                                        Stau / Straßensperrung / Defekt
                                                                                    </span>
                                                                                    <span className="text-xs font-extrabold">{Math.max(0, activeWeekMetrics.stornos - Math.round(activeWeekMetrics.stornos * 0.78) - (activeWeekMetrics.stornos > 0 ? 1 : 0))} Fahrten</span>
                                                                                </div>
                                                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[10px]">
                                                                                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Kulanzstorno ohne Sanktion:</span>
                                                                                    <span className="font-bold text-slate-400">0,00 € (Neuzuweisung)</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <p className={`text-[10px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                                                            ℹ️ No-Show-Erkennung: Wenn ein Fahrer nachweislich mindestens 8 Minuten am Treffpunkt gewartet hat und der Kunde nicht erscheint, wird dem Kunden die No-Show Gebühr berechnet und der Flotte gutgeschrieben.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* TAB 3: AUDITLISTE & EINZELBELEGE */}
                                                {fleetFinanceSubTab === 'audit' && (
                                                    <div className="space-y-4 relative z-10">
                                                        {activeWeekMetrics.isFuture ? (
                                                            <div className={`p-10 rounded-3xl border text-center ${isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-black/30 border-white/5 text-slate-400'}`}>
                                                                <FileText size={40} className="mx-auto mb-3 text-slate-400/60" />
                                                                <h4 className={`text-base font-black uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                                                    Zukünftige Kalenderwoche ({activeWeekMetrics.label})
                                                                </h4>
                                                                <p className="text-xs opacity-75 mt-1 max-w-md mx-auto">
                                                                    In diesem Zeitraum wurden noch keine Fahrten oder Einzelbelege verbucht.
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Filter Bar */}
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    {[
                                                                        { id: 'all', label: 'Alle Einträge (8)' },
                                                                        { id: 'card', label: '💳 Nur Karte (2)' },
                                                                        { id: 'cash', label: '💵 Nur Barzahlung (2)' },
                                                                        { id: 'storno_customer', label: '👤 Kunde storniert (2)' },
                                                                        { id: 'storno_driver', label: '🚗 Fahrer storniert (2)' }
                                                                    ].map(f => (
                                                                        <button
                                                                            key={f.id}
                                                                            type="button"
                                                                            onClick={() => setFleetAuditFilter(f.id)}
                                                                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                                                                fleetAuditFilter === f.id
                                                                                    ? (isLight ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-brand text-dark-900 border-brand font-black')
                                                                                    : (isLight ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-300' : 'bg-dark-900 border-white/10 text-slate-400 hover:text-white')
                                                                            }`}
                                                                        >
                                                                            {f.label}
                                                                        </button>
                                                                    ))}
                                                                </div>

                                                                {/* Audit Entries List */}
                                                                <div className="space-y-2.5">
                                                                    {[
                                                                        {
                                                                            id: 'TRP-8841',
                                                                            time: 'Heute, 14:10',
                                                                            filterType: 'card',
                                                                            badgeText: 'Kreditkarte (Stripe)',
                                                                            badgeColor: 'cyan',
                                                                            driver: 'Sami Rahimi • Tesla Model S',
                                                                            passenger: 'Dr. Markus Weber',
                                                                            route: 'Kö-Bogen ➔ Flughafen DUS',
                                                                            gross: '€48,50',
                                                                            commission: '-€7,28 (15%)',
                                                                            net: '€41,22',
                                                                            status: 'Auszahlung Mo reserviert'
                                                                        },
                                                                        {
                                                                            id: 'TRP-8840',
                                                                            time: 'Heute, 13:25',
                                                                            filterType: 'cash',
                                                                            badgeText: 'Barzahlung im Fahrzeug',
                                                                            badgeColor: 'emerald',
                                                                            driver: 'Darius Meier • Mercedes EQS',
                                                                            passenger: 'Elena Sommer',
                                                                            route: 'Stadttor ➔ Hauptbahnhof DUS',
                                                                            gross: '€32,00',
                                                                            commission: '-€4,80 (Soll-Offset)',
                                                                            net: '€32,00 Bar',
                                                                            status: 'Bar im Auto • Provision im Stripe-Soll'
                                                                        },
                                                                        {
                                                                            id: 'TRP-8839',
                                                                            time: 'Heute, 12:48',
                                                                            filterType: 'storno_customer',
                                                                            badgeText: '👤 Kunde Spät-Storno (>2m)',
                                                                            badgeColor: 'rose',
                                                                            driver: 'Elena Rostova • Porsche Taycan',
                                                                            passenger: 'Thomas K. (Fahrgast)',
                                                                            route: 'Medienhafen ➔ Hyatt Regency',
                                                                            gross: '€6,00 Gebühr',
                                                                            commission: '-€1,50 Green',
                                                                            net: '+€4,50 Entschädigung',
                                                                            status: 'Flotten-Entschädigung gutgeschrieben'
                                                                        },
                                                                        {
                                                                            id: 'TRP-8838',
                                                                            time: 'Heute, 11:15',
                                                                            filterType: 'storno_customer',
                                                                            badgeText: '👤 Kunde Sofort-Storno (<2m)',
                                                                            badgeColor: 'slate',
                                                                            driver: 'Sami Rahimi • Tesla Model S',
                                                                            passenger: 'Lukas M. (Fahrgast)',
                                                                            route: 'Königsallee ➔ Messe DUS',
                                                                            gross: '€0,00',
                                                                            commission: '€0,00',
                                                                            net: '€0,00',
                                                                            status: 'Kostenlos im Kulanzfenster'
                                                                        },
                                                                        {
                                                                            id: 'TRP-8837',
                                                                            time: 'Gestern, 22:30',
                                                                            filterType: 'storno_driver',
                                                                            badgeText: '🚗 Fahrer No-Show (>8m)',
                                                                            badgeColor: 'purple',
                                                                            driver: 'Darius Meier • Mercedes EQS',
                                                                            passenger: 'Maximilian B. (Fahrgast)',
                                                                            route: 'Rheinterrasse ➔ Breidenbacher Hof',
                                                                            gross: '€6,00 Gebühr',
                                                                            commission: '-€1,50 Green',
                                                                            net: '+€4,50 Entschädigung',
                                                                            status: 'Wartezeit No-Show vergütet'
                                                                        },
                                                                        {
                                                                            id: 'TRP-8836',
                                                                            time: 'Gestern, 19:40',
                                                                            filterType: 'card',
                                                                            badgeText: 'Apple Pay (Stripe)',
                                                                            badgeColor: 'cyan',
                                                                            driver: 'Elena Rostova • Porsche Taycan',
                                                                            passenger: 'Sophie von Berg',
                                                                            route: 'Flughafen DUS ➔ Altstadt',
                                                                            gross: '€54,00',
                                                                            commission: '-€8,10 (15%)',
                                                                            net: '€45,90',
                                                                            status: 'Auszahlung Mo reserviert'
                                                                        },
                                                                        {
                                                                            id: 'TRP-8835',
                                                                            time: 'Gestern, 16:15',
                                                                            filterType: 'cash',
                                                                            badgeText: 'Barzahlung im Fahrzeug',
                                                                            badgeColor: 'emerald',
                                                                            driver: 'Sami Rahimi • Tesla Model S',
                                                                            passenger: 'Alexander P.',
                                                                            route: 'Oberkassel ➔ Carlsplatz',
                                                                            gross: '€26,00',
                                                                            commission: '-€3,90 (Soll-Offset)',
                                                                            net: '€26,00 Bar',
                                                                            status: 'Bar im Auto • Provision im Stripe-Soll'
                                                                        },
                                                                        {
                                                                            id: 'TRP-8834',
                                                                            time: 'Gestern, 14:05',
                                                                            filterType: 'storno_driver',
                                                                            badgeText: '🚗 Fahrer Stau / Kulanz',
                                                                            badgeColor: 'slate',
                                                                            driver: 'Darius Meier • Mercedes EQS',
                                                                            passenger: 'Nadine S. (Fahrgast)',
                                                                            route: 'Graf-Adolf-Platz ➔ Benrath',
                                                                            gross: '€0,00',
                                                                            commission: '€0,00',
                                                                            net: '€0,00',
                                                                            status: 'Kulanzstorno durch Fahrer'
                                                                        }
                                                                    ]
                                                                    .filter(item => fleetAuditFilter === 'all' || item.filterType === fleetAuditFilter)
                                                                    .map((item, idx) => (
                                                                        <div 
                                                                            key={idx}
                                                                            className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
                                                                                isLight ? 'bg-slate-50 border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-sm' : 'bg-black/30 border-white/5 hover:border-white/10'
                                                                            }`}
                                                                        >
                                                                            <div className="space-y-1.5">
                                                                                <div className="flex flex-wrap items-center gap-2">
                                                                                    <span className={`text-xs font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>#{item.id}</span>
                                                                                    <span className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>• {item.time}</span>
                                                                                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                                                                                        item.badgeColor === 'cyan' ? (isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30') :
                                                                                        item.badgeColor === 'emerald' ? (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30') :
                                                                                        item.badgeColor === 'rose' ? (isLight ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-rose-500/20 text-rose-400 border-rose-500/30') :
                                                                                        item.badgeColor === 'purple' ? (isLight ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-purple-500/20 text-purple-400 border-purple-500/30') :
                                                                                        (isLight ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-white/10 text-slate-300 border-white/10')
                                                                                    }`}>
                                                                                        {item.badgeText}
                                                                                    </span>
                                                                                </div>
                                                                                <div className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                                                                                    {item.driver} ➔ <span className={isLight ? 'text-slate-900 font-extrabold' : 'text-white font-extrabold'}>{item.passenger}</span>
                                                                                </div>
                                                                                <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                                                                    Route: {item.route}
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-200 dark:border-white/5">
                                                                                <div className="flex items-center gap-2 md:text-right">
                                                                                    <span className={`text-base font-black italic ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.gross}</span>
                                                                                    <span className="text-[10px] font-bold text-purple-500">({item.commission})</span>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <span className="text-xs font-black text-emerald-500">{item.net}</span>
                                                                                    <span className={`block text-[9px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.status}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* STANDARD GROSS PERFORMANCE (FOR VENUES / EVENT BOX OFFICES) */
                                            <div className={`lg:col-span-2 ${isLight ? 'bg-white border-slate-200 text-slate-900 shadow-xl' : 'bg-dark-900 border-main text-white shadow-2xl'} border rounded-[3rem] p-6 md:p-10 space-y-8 relative overflow-hidden`}>
                                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] opacity-30"></div>
                                                <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center text-brand shadow-[0_0_15px_rgba(33,255,165,0.2)] shrink-0">
                                                            <Activity size={24} />
                                                        </div>
                                                        <div>
                                                            <h3 className={`text-2xl font-black italic uppercase tracking-tighter leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>Gross Performance</h3>
                                                            <p className={`text-[9px] md:text-[11px] lg:text-xs font-bold uppercase tracking-[0.2em] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Real-time Revenue Telemetry</p>
                                                        </div>
                                                    </div>
                                                    <select className={`border rounded-xl px-4 py-2 text-[10px] md:text-xs lg:text-sm font-black uppercase outline-none cursor-pointer transition-all w-full sm:w-auto ${isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-btn-sec border-main text-white'}`}>
                                                        <option>Last 30 Days</option>
                                                        <option>Last 7 Days</option>
                                                        <option>Year to Date</option>
                                                    </select>
                                                </div>
                                                
                                                <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 border-b pb-8 ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                                                    <div className={`p-4 rounded-2xl border flex flex-col justify-between ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-main'}`}>
                                                        <p className={`text-[7px] font-black uppercase tracking-[0.1em] mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Primary Sales</p>
                                                        <p className={`text-xl font-black italic ${isLight ? 'text-slate-900' : 'text-white'}`}>€{financialsSummary.primarySales.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        <div className="mt-3 h-1 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-400" style={{ width: financialsSummary.primarySales > 0 ? '65%' : '0%' }}></div></div>
                                                    </div>
                                                    <div className={`p-4 rounded-2xl border flex flex-col justify-between ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-main'}`}>
                                                        <p className={`text-[7px] font-black uppercase tracking-[0.1em] mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Premium / VIP</p>
                                                        <p className={`text-xl font-black italic ${isLight ? 'text-slate-900' : 'text-white'}`}>€{financialsSummary.premiumSales.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        <div className="mt-3 h-1 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-purple-400" style={{ width: financialsSummary.premiumSales > 0 ? '80%' : '0%' }}></div></div>
                                                    </div>
                                                    <div className={`p-4 rounded-2xl border flex flex-col justify-between ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-main'}`}>
                                                        <p className={`text-[7px] font-black uppercase tracking-[0.1em] mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Ancillary / F&B</p>
                                                        <p className={`text-xl font-black italic ${isLight ? 'text-slate-900' : 'text-white'}`}>€{financialsSummary.ancillarySales.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        <div className="mt-3 h-1 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: financialsSummary.ancillarySales > 0 ? '40%' : '0%' }}></div></div>
                                                    </div>
                                                    <div className={`p-4 rounded-2xl border flex flex-col justify-between ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-main'}`}>
                                                        <p className={`text-[7px] font-black uppercase tracking-[0.1em] mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tx Volume</p>
                                                        <p className={`text-xl font-black italic ${isLight ? 'text-slate-900' : 'text-white'}`}>{financialsSummary.txVolume.toLocaleString('de-DE')}</p>
                                                        <div className="mt-3 h-1 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-brand" style={{ width: financialsSummary.txVolume > 0 ? '100%' : '0%' }}></div></div>
                                                    </div>
                                                </div>

                                                <div className="h-48 flex items-end justify-between gap-3 px-2 relative z-10 pt-4">
                                                    {[
                                                        { h: 35, v: 4200, l: 'Mon' }, 
                                                        { h: 45, v: 5400, l: 'Tue' }, 
                                                        { h: 40, v: 4800, l: 'Wed' }, 
                                                        { h: 65, v: 7800, l: 'Thu' }, 
                                                        { h: 85, v: 10200, l: 'Fri' }, 
                                                        { h: 95, v: 11400, l: 'Sat' }, 
                                                        { h: 55, v: 6600, l: 'Sun' }
                                                    ].map((bar, i) => (
                                                        <div key={i} className="flex flex-col items-center gap-3 w-full h-full justify-end group">
                                                            <div className={`opacity-0 group-hover:opacity-100 transition-opacity text-[10px] md:text-xs font-black px-2 py-1 rounded mb-1 whitespace-nowrap ${isLight ? 'bg-slate-900 text-white' : 'bg-dark-900 text-white border border-brand/30'}`}>
                                                                €{bar.v.toLocaleString()}
                                                            </div>
                                                            <motion.div 
                                                                initial={{ height: 0 }}
                                                                animate={{ height: `${bar.h}%` }}
                                                                className="w-full bg-btn-sec border border-main rounded-t-lg relative overflow-hidden group-hover:border-brand/50 group-hover:bg-brand/10 transition-all"
                                                            >
                                                                <div className="absolute bottom-0 w-full bg-brand/40 h-1" />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-brand/20 to-transparent opacity-0 group-hover:opacity-100" />
                                                            </motion.div>
                                                            <span className={`text-[8px] md:text-[10px] lg:text-xs font-black uppercase ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{bar.l}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 relative z-10 border-t ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                                                    <div className={`p-6 rounded-[2rem] border flex flex-col justify-center items-center ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-main'}`}>
                                                        <p className={`text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Gross Invoiced</p>
                                                        <p className={`text-2xl font-black italic ${isLight ? 'text-slate-900' : 'text-white'}`}>€{commissionData.gross.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    </div>
                                                    <div className={`p-6 rounded-[2rem] border flex flex-col justify-center items-center ${commissionData.isFree ? "bg-brand/5 border-brand/20" : "bg-red-500/5 border-red-500/10"}`}>
                                                        <p className={`text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] mb-2 ${commissionData.isFree ? "text-brand" : "text-red-500/70"}`}>{commissionData.rateLabel}</p>
                                                        <p className={`text-2xl font-black italic ${commissionData.isFree ? "text-brand" : "text-red-400"}`}>-€{commissionData.commission.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    </div>
                                                    <div className="p-6 bg-brand/10 rounded-[2rem] border border-brand/30 flex flex-col justify-center items-center relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(33,255,165,0.15)_0%,transparent_70%)]" />
                                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-[0.2em] mb-2 relative z-10">Settlement Amount</p>
                                                        <p className="text-2xl font-black italic text-brand relative z-10">€{commissionData.settlement.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}                                         <div className="space-y-8">
                                             {/* SETTLEMENT & BUSINESS CREDENTIALS CARD */}
                                             {(managerContext === 'FM' || managerContext === 'RM' || managerContext === 'HM' || managerContext === 'CM' || managerContext === 'BM' || managerContext === 'SM' || managerContext === 'VM') && (
                                                 <div className="bg-glass border border-main rounded-[3rem] p-6 md:p-10 space-y-6 relative overflow-hidden shadow-2xl">
                                                     <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-brand pointer-events-none">
                                                         <Building2 size={120} />
                                                     </div>
                                                     <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                                                         <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand/10 text-brand">
                                                             <Building2 size={18} />
                                                         </div>
                                                         <div>
                                                             <h3 className="text-base font-black italic uppercase tracking-tighter text-primary">Settlement & Business Credentials</h3>
                                                             <p className="text-[7px] font-black text-secondary uppercase tracking-[0.1em] mt-0.5">Genesis & Payout Settings</p>
                                                         </div>
                                                     </div>

                                                     <div className="space-y-4">
                                                         <div className="space-y-1">
                                                             <label className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-1">Legal Entity Name</label>
                                                             <input 
                                                                 type="text" 
                                                                 value={businessInfo.legalName} 
                                                                 onChange={(e) => setBusinessInfo({...businessInfo, legalName: e.target.value})}
                                                                 className="w-full bg-btn-sec border border-main rounded-xl px-4 py-3 text-xs md:text-sm lg:text-base font-bold text-primary focus:border-brand outline-none transition-all placeholder:text-gray-800" 
                                                             />
                                                         </div>
                                                         <div className="space-y-1">
                                                             <label className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-1">Notification Email (Tickets/Commissions)</label>
                                                             <input 
                                                                 type="email" 
                                                                 value={businessInfo.ticketEmail || ''} 
                                                                 onChange={(e) => setBusinessInfo({...businessInfo, ticketEmail: e.target.value})}
                                                                 className="w-full bg-btn-sec border border-main rounded-xl px-4 py-3 text-xs md:text-sm lg:text-base font-bold text-primary focus:border-brand outline-none transition-all placeholder:text-gray-800" 
                                                                 placeholder="accounting@venue.com"
                                                             />
                                                         </div>
                                                         <div className="space-y-1">
                                                             <label className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-1">HQ Physical Address</label>
                                                             <input 
                                                                 type="text" 
                                                                 value={businessInfo.address} 
                                                                 onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
                                                                 className="w-full bg-btn-sec border border-main rounded-xl px-4 py-3 text-xs md:text-sm lg:text-base font-bold text-primary focus:border-brand outline-none transition-all placeholder:text-gray-800" 
                                                             />
                                                         </div>
                                                         <div className="grid grid-cols-2 gap-3">
                                                             <div className="space-y-1">
                                                                 <label className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-1">ZIP Code</label>
                                                                 <input 
                                                                     type="text" 
                                                                     value={businessInfo.zip || ''} 
                                                                     onChange={(e) => setBusinessInfo({...businessInfo, zip: e.target.value})}
                                                                     className="w-full bg-btn-sec border border-main rounded-xl px-4 py-3 text-xs md:text-sm lg:text-base font-bold text-primary focus:border-brand outline-none transition-all placeholder:text-gray-800" 
                                                                 />
                                                             </div>
                                                             <div className="space-y-1">
                                                                 <label className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-1">City</label>
                                                                 <input 
                                                                     type="text" 
                                                                     value={businessInfo.city || ''} 
                                                                     onChange={(e) => setBusinessInfo({...businessInfo, city: e.target.value})}
                                                                     className="w-full bg-btn-sec border border-main rounded-xl px-4 py-3 text-xs md:text-sm lg:text-base font-bold text-primary focus:border-brand outline-none transition-all placeholder:text-gray-800" 
                                                                 />
                                                             </div>
                                                         </div>
                                                         <div className="space-y-1">
                                                                 <label className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-1">Settlement IBAN</label>
                                                                 <input 
                                                                     type="text" 
                                                                     value={bankingInfo.iban} 
                                                                     onChange={(e) => setBankingInfo({...bankingInfo, iban: e.target.value})}
                                                                     className="w-full bg-btn-sec border border-main rounded-xl px-4 py-3 text-xs md:text-sm lg:text-base font-bold text-primary focus:border-brand outline-none transition-all placeholder:text-gray-800" 
                                                                 />
                                                             </div>
                                                     </div>

                                                     <button 
                                                         onClick={handleSaveGlobalManifest}
                                                         className="w-full py-4 mt-2 bg-brand/10 border border-brand/20 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-brand hover:bg-brand hover:text-dark-900 transition-all flex items-center justify-center gap-1.5 shadow-lg"
                                                     >
                                                         <CheckCircle2 size={12} /> Save Credentials
                                                     </button>
                                                 </div>
                                             )}
                                          </div>
                                     </div>

                                </motion.div>
                            )}

                            {view === 'qr-terminal' && (
                                <motion.div key="terminal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-10 max-w-4xl mx-auto">
                                    <div className="text-center space-y-4">
                                        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">Voucher <span className="text-brand">Terminal</span></h1>
                                        <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.4em] italic leading-none">Scan Crew QR to authorize hospitality debt</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        {/* SCANNER VIEW */}
                                        <div className="bg-dark-900 border border-brand/20 rounded-[3rem] p-10 flex flex-col items-center justify-center space-y-8 relative overflow-hidden group shadow-2xl">
                                            <div className="absolute inset-0 bg-brand/5 opacity-20 group-hover:opacity-40 transition-opacity" />
                                            <div className="w-64 h-64 border-2 border-dashed border-brand/30 rounded-[2.5rem] flex items-center justify-center relative">
                                                <div className="absolute inset-4 border-2 border-brand/10 rounded-[2rem]" />
                                                <Zap size={64} className="text-brand/20" />
                                                <motion.div 
                                                    animate={{ top: ['10%', '90%', '10%'] }}
                                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                    className="absolute left-0 right-0 h-0.5 bg-brand shadow-[0_0_20px_rgba(33,255,165,0.8)] z-10"
                                                />
                                            </div>
                                            <button className="px-10 py-5 bg-brand text-dark-900 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all relative z-20">
                                                Activate Camera
                                            </button>
                                            <p className="text-[10px] md:text-xs lg:text-sm font-black text-secondary uppercase tracking-widest italic">Waiting for Crew Handshake...</p>
                                        </div>

                                        {/* MANUAL FORM */}
                                        <div className="bg-glass rounded-[3rem] p-10 space-y-8 border border-glass shadow-2xl">
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black italic uppercase text-primary">Manual Voucher Entry</h3>
                                                <p className="text-[9px] md:text-[11px] lg:text-xs text-secondary font-bold uppercase tracking-widest">Fallback authorization ledger</p>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] md:text-xs lg:text-sm font-black text-secondary uppercase tracking-widest ml-1">Voucher ID / Code</label>
                                                    <input type="text" placeholder="GRN-XXXX" className="w-full bg-btn-sec border border-main rounded-2xl p-5 text-sm font-black uppercase tracking-widest text-brand outline-none focus:border-brand/40 transition-all" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] md:text-xs lg:text-sm font-black text-secondary uppercase tracking-widest ml-1">Authorized Value (€)</label>
                                                    <input type="number" placeholder="0.00" className="w-full bg-btn-sec border border-main rounded-2xl p-5 text-3xl font-black text-center text-primary outline-none focus:border-brand/40 transition-all italic" />
                                                </div>
                                                <button className="w-full py-6 bg-brand text-dark-900 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all">
                                                    Authorize Payout
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* HISTORY LIST */}
                                    <div className="space-y-6">
                                        <h3 className="text-xl font-black italic uppercase tracking-tighter px-4">Terminal History</h3>
                                        <div className="space-y-4">
                                            {[
                                                { crew: 'VIP Knights', item: '3x Premium Drinks', amount: '€54.00', time: '12:04 AM', status: 'Settled' },
                                                { crew: 'Night Explorers', item: 'Late Check-out Fee', amount: '€45.00', time: '11:50 PM', status: 'Settled' }
                                            ].map((h, i) => (
                                                <div key={i} className="p-6 bg-btn-sec border border-main rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-all">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-12 h-12 rounded-xl bg-btn-sec flex items-center justify-center text-primary shadow-lg"><ShieldCheck size={24} /></div>
                                                        <div>
                                                            <p className="text-sm font-black italic uppercase text-primary">{h.crew}</p>
                                                            <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase tracking-widest">{h.item} • {h.time}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-black italic text-primary leading-none">{h.amount}</p>
                                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-primary uppercase mt-1 tracking-widest">{h.status}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {view === 'feed' && (
                                <motion.div key="marketing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                                    <div className="flex flex-col md:flex-row gap-6 md:justify-between md:items-end">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand"><Activity size={24} /></div>
                                                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-primary">Marketing <span className="text-brand">Hub</span></h1>
                                            </div>
                                            <p className="text-secondary text-xs md:text-sm lg:text-base font-bold uppercase tracking-widest leading-none">Broadcast 15s 4K Reels to the Grien Network</p>
                                        </div>
                                        <div className="flex gap-4 w-full md:w-auto">
                                            <div className="flex-1 md:flex-initial px-4 md:px-6 py-3 bg-btn-sec border border-main rounded-xl text-right">
                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest">Global Reach</p>
                                                <p className="text-sm md:text-xl font-black italic text-brand leading-none mt-1">{isDemo ? '2.4M Pilots' : '0 Pilots'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* 4K MEDIA STUDIO */}
                                        <div className="lg:col-span-1 bg-glass border border-brand/20 rounded-[3rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl -mr-10 -mt-10" />
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xl font-black italic uppercase text-primary">Media <span className="text-brand">Studio</span></h3>
                                                <span className="px-2 py-1 bg-brand text-dark-900 text-[8px] md:text-[10px] lg:text-xs font-black rounded uppercase">4K Ready</span>
                                            </div>
                                            
                                            <div 
                                                onClick={() => document.getElementById('media-upload').click()}
                                                className="aspect-[9/16] bg-black rounded-[2.5rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-600 hover:border-brand/40 hover:text-brand transition-all cursor-pointer group relative overflow-hidden"
                                            >
                                                {previewUrl ? (
                                                    <div className="absolute inset-0">
                                                        {(previewUrl.startsWith('data:video') || previewUrl.endsWith('.mp4') || previewUrl.includes('video')) ? (
                                                            <video src={previewUrl} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80" />
                                                        ) : (
                                                            <img src={previewUrl} className="w-full h-full object-cover opacity-60" alt="Preview" />
                                                        )}
                                                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
                                                            <div className="w-12 h-12 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center text-brand mb-4">
                                                                <CheckCircle2 size={24} />
                                                            </div>
                                                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-brand">UHD 4K Ready</p>
                                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-white mt-1 uppercase">15.0s Clip Verified</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative z-10 flex flex-col items-center p-6 text-center">
                                                        {uploadStatus === 'processing' ? (
                                                            <div className="space-y-4 w-full px-8">
                                                                <div className="w-16 h-16 rounded-full border-4 border-brand/20 border-t-brand animate-spin mx-auto" />
                                                                <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-brand">Processing 4K Engine...</p>
                                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                                    <motion.div 
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${uploadProgress}%` }}
                                                                        className="h-full bg-brand shadow-[0_0_15px_rgba(50,205,50,0.5)]"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="w-16 h-16 rounded-full bg-btn-sec border border-main flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                                    <Upload size={32} />
                                                                </div>
                                                                <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-primary">Upload 15s Reel</p>
                                                                <p className="text-[7px] font-bold text-secondary mt-2 uppercase">Videos exceeding 15s will be auto-clipped</p>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                                <input 
                                                    id="media-upload"
                                                    type="file" 
                                                    accept="video/*,image/*" 
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            setUploadStatus('processing');
                                                            setUploadProgress(0);
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setUploadStatus('complete');
                                                                setPreviewUrl(reader.result);
                                                            };
                                                            reader.readAsDataURL(file);

                                                            const interval = setInterval(() => {
                                                                setUploadProgress(prev => {
                                                                    if (prev >= 100) {
                                                                        clearInterval(interval);
                                                                        return 100;
                                                                    }
                                                                    return prev + 20;
                                                                });
                                                            }, 100);
                                                        }
                                                    }}
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-1">Caption & Vibes</label>
                                                    <textarea 
                                                        value={broadcastCaption}
                                                        onChange={(e) => setBroadcastCaption(e.target.value)}
                                                        placeholder="Describe your product experience..."
                                                        className="w-full bg-btn-sec border border-main rounded-2xl p-4 text-sm font-bold text-primary focus:border-brand outline-none transition-all h-24 resize-none"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        if (!previewUrl || !broadcastCaption) return alert("Please upload media and add a caption first.");
                                                        const newPost = {
                                                            id: Date.now(),
                                                            type: 'video',
                                                            url: previewUrl,
                                                            user: user?.name || 'Partner',
                                                            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`,
                                                            likes: '0',
                                                            greenFlags: user?.greenFlags || 0,
                                                            caption: broadcastCaption,
                                                            isBusiness: true
                                                        };
                                                        const existingPosts = JSON.parse(localStorage.getItem('green_global_posts') || '[]');
                                                        const updatedPosts = [newPost, ...existingPosts];
                                                        localStorage.setItem('green_global_posts', JSON.stringify(updatedPosts));
                                                        setGlobalPosts(updatedPosts);
                                                        if (managerContext === 'FM') {
                                                            alert("UPLOAD SUCCESSFUL: Your 4K Reel is now live for all pilots!");
                                                        } else {
                                                            alert("BROADCAST SUCCESSFUL: Your 4K Reel is now live for all pilots!");
                                                        }
                                                        setPreviewUrl(null);
                                                        setUploadStatus(null);
                                                        setBroadcastCaption('');
                                                    }}
                                                    className="w-full py-5 bg-brand text-dark-900 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] md:text-xs lg:text-sm shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all"
                                                >
                                                    {managerContext === 'FM' ? "Upload to 4K Live Feed" : "Blast to 4K Live Feed"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* PERFORMANCE & ENGAGEMENT */}
                                        <div className="lg:col-span-2 space-y-8">
                                            <div className="bg-glass border border-glass rounded-[3rem] p-4 md:p-10">
                                                <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center mb-8">
                                                    <h3 className="text-xl font-black italic uppercase text-primary">Social <span className="text-brand">Interaction Monitor</span></h3>
                                                    <div className="flex gap-2">
                                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-primary uppercase tracking-widest">Live Data Sync</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                                                    {[
                                                        { label: 'Likes', value: isDemo ? '12.4K' : '0', trend: isDemo ? '+18%' : '0%', surge: isDemo ? '18% Surge' : 'Stable', icon: Heart, color: 'text-rose-500' },
                                                        { label: 'Comments', value: isDemo ? '892' : '0', trend: isDemo ? '+5%' : '0%', surge: isDemo ? '5% Surge' : 'Stable', icon: MessageCircle, color: 'text-brand' },
                                                        { label: 'Shares', value: isDemo ? '452' : '0', trend: isDemo ? '+12%' : '0%', surge: isDemo ? '12% Surge' : 'Stable', icon: Share2, color: 'text-primary' }
                                                    ].map((stat, i) => (
                                                        <div key={i} className="p-6 md:p-8 bg-btn-sec rounded-[2.5rem] border border-main group hover:border-brand/20 transition-all text-left">
                                                            <stat.icon size={20} className={`${stat.color} mb-3`} />
                                                            <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest">{stat.label}</p>
                                                            <p className="text-2xl font-black italic text-primary mt-1">{stat.value}</p>
                                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-primary uppercase mt-2">{stat.surge}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                                                    <h3 className="text-lg font-black italic uppercase text-primary">Live <span className="text-brand">15s Feed Preview</span></h3>
                                                    <button 
                                                        onClick={() => setIsFeedOpen(true)}
                                                        className="px-6 py-2.5 bg-brand text-dark-900 rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-wider shadow-lg shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Activity size={12} /> View Live Feed
                                                    </button>
                                                </div>
                                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                                    {globalPosts.length > 0 ? (
                                                        globalPosts.map((post, i) => (
                                                            <div key={post.id || i} className="aspect-video bg-dark-900 rounded-[2.5rem] border border-main relative overflow-hidden group shadow-xl">
                                                                {post.url ? (
                                                                    <video 
                                                                        src={post.url} 
                                                                        autoPlay 
                                                                        loop 
                                                                        muted 
                                                                        playsInline 
                                                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" 
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full bg-btn-sec flex items-center justify-center text-secondary"><Video size={32} /></div>
                                                                )}
                                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-5 flex flex-col justify-end text-left">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <Play size={12} className="text-brand fill-brand" />
                                                                            <p className="text-[10px] md:text-xs font-black italic text-primary truncate max-w-[140px]">{post.caption || 'Partner Broadcast'}</p>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => {
                                                                                const updated = globalPosts.filter(p => p.id !== post.id);
                                                                                localStorage.setItem('green_global_posts', JSON.stringify(updated));
                                                                                setGlobalPosts(updated);
                                                                                alert("REEL REMOVED: Post deleted from live feed.");
                                                                            }}
                                                                            className="p-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer"
                                                                            title="Delete Post"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                                                                        <div className="flex gap-3">
                                                                            <span className="text-[8px] md:text-[10px] font-black text-brand uppercase">{post.likes || '0'} Likes</span>
                                                                            <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase">15.0s 4K</span>
                                                                        </div>
                                                                        <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">LIVE FEED</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="col-span-2 bg-btn-sec border border-main rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center min-h-[200px] w-full">
                                                            <Video size={32} className="text-secondary/30 mb-4" />
                                                            <p className="text-sm font-black italic uppercase text-primary">No Broadcasted Reels</p>
                                                            <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase tracking-widest mt-1">Upload your first 4K Reel using the media studio on the left.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {view === 'strategic-hub' && (
                                <motion.div key="strategic-hub" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-10">
                                    <div className="flex flex-col md:flex-row gap-4 md:justify-between md:items-end">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand"><Sparkles size={28} /></div>
                                                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none">Frankfurt <span className="text-brand">Strategic Hub</span></h1>
                                            </div>
                                            <p className="text-secondary text-xs md:text-sm font-bold uppercase tracking-widest leading-none">AI-Powered City Momentum & Demand Forecast</p>
                                        </div>
                                        <div className="w-full md:w-auto px-6 py-3 bg-btn-sec border border-main rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand text-center whitespace-nowrap">Live Neural Data Sync</div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2 space-y-8">
                                            <h3 className="text-xl font-black italic uppercase tracking-tighter ml-2">Upcoming High-Demand Events</h3>
                                            <div className="grid grid-cols-1 gap-4">
                                                {isDemo ? (
                                                    [
                                                        { title: 'Eintracht Frankfurt vs. Real Madrid', category: 'Football (UCL)', date: 'Saturday, 09.05.2026', impact: '95%', surge: 'Critical Rush', icon: Trophy, color: 'text-red-500' },
                                                        { title: 'Automechanika Frankfurt', category: 'Trade Fair (Messe)', date: '12.05 - 16.05.2026', impact: '82%', surge: 'High Demand', icon: Box, color: 'text-primary' },
                                                        { title: 'Museumsuferfest', category: 'City Festival', date: '22.05 - 24.05.2026', impact: '75%', surge: 'Medium Surge', icon: Users, color: 'text-primary' }
                                                    ].map((event, i) => (
                                                        <div key={i} className="bg-btn-sec border border-main rounded-[2.5rem] p-4 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/10 transition-all group overflow-hidden relative text-left">
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-10 -mt-10" />
                                                            <div className="flex items-center gap-4 md:gap-6 relative z-10 min-w-0">
                                                                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-btn-sec flex items-center justify-center shrink-0 ${event.color}`}><event.icon size={24} /></div>
                                                                <div className="min-w-0">
                                                                    <h4 className="text-lg md:text-xl font-black italic uppercase text-primary tracking-tighter leading-tight truncate">{event.title}</h4>
                                                                    <p className="text-[10px] md:text-xs lg:text-sm font-bold text-secondary uppercase tracking-widest mt-1 truncate">{event.category} | {event.date}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-left sm:text-right relative z-10 shrink-0">
                                                                <div className="flex items-center gap-2 sm:justify-end mb-1">
                                                                    <TrendingUp size={14} className={event.color} />
                                                                    <span className={`text-2xl font-black italic ${event.color}`}>{event.impact}</span>
                                                                </div>
                                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-secondary">{event.surge}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="bg-btn-sec border border-main rounded-[2.5rem] p-10 text-center">
                                                        <Sparkles size={32} className="text-secondary/30 mx-auto mb-4" />
                                                        <p className="text-sm font-black italic uppercase text-primary">No Upcoming Events Forecast</p>
                                                        <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase tracking-widest mt-1">AI predictive model will populate events as data syncs.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <h3 className="text-xl font-black italic uppercase tracking-tighter">AI Auditor Insights</h3>
                                            <div className="bg-brand/5 border border-brand/20 rounded-[3rem] p-8 space-y-8 relative overflow-hidden">
                                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                                                <div className="space-y-6 relative z-10">
                                                    {isDemo ? (
                                                        <>
                                                            <div className="p-5 bg-btn-sec rounded-2xl border border-main">
                                                                <p className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase mb-3 flex items-center gap-2"><Sparkles size={12} /> Strategic Advice</p>
                                                                <p className="text-xs md:text-sm lg:text-base font-bold text-gray-300 leading-relaxed italic">
                                                                    "The upcoming Champions League match will cause massive gridlock around Eco-Park Central. I recommend increasing valet staff by 20% and ensuring all EV chargers are pre-cleared by 15:00."
                                                                </p>
                                                            </div>

                                                            <div className="p-5 bg-btn-sec rounded-2xl border border-main">
                                                                <p className="text-[10px] md:text-xs lg:text-sm font-black text-primary uppercase mb-3">Resource Forecast</p>
                                                                <p className="text-xs md:text-sm lg:text-base font-bold text-gray-300 leading-relaxed italic">
                                                                    "Based on Messe attendance, your QR Paper stock will deplete in 4 days. Order placed for overnight delivery to avoid downtime."
                                                                </p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="p-5 bg-btn-sec rounded-2xl border border-main text-center py-10">
                                                            <Sparkles size={24} className="text-brand/20 mx-auto mb-3" />
                                                            <p className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase">No Active Insights</p>
                                                            <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary leading-relaxed uppercase tracking-wider mt-2">
                                                                Insights will generate dynamically as operational logs accumulate.
                                                            </p>
                                                        </div>
                                                    )}

                                                    <button className="w-full py-5 bg-brand text-dark-900 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-2xl shadow-brand/20 hover:scale-105 transition-all">Optimize My Operations 🚀</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {view === 'menu' && (
                                <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full">
                                    <MenuManagement />
                                </motion.div>
                            )}

                            {view === 'documents' && (
                                <motion.div key="documents" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                    <div className="space-y-2">
                                        <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
                                            Digital Compliance Vault
                                        </h1>
                                        <p className="text-secondary text-sm font-bold uppercase tracking-widest leading-none">Legal Document Repository & Verification Status</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {(simRole === 'staff' ? [
                                            { group: 'Identity Vault', docs: [{id: 'passport_id', name: 'Passport / ID Card'}], icon: ShieldCheck, color: 'text-brand' },
                                            { group: 'Employment Status', docs: [{id: 'work_permit', name: 'Work Permit / Visa'}], icon: FileText, color: 'text-primary' },
                                            { group: 'Compensation Vault', docs: [{id: 'bank_details', name: 'Bank Details (for tips)'}], icon: Building2, color: 'text-primary' }
                                        ] : [
                                            managerContext === 'FM' ? (
                                                { group: 'Fleet Credentials', docs: [{id: 'tl', name: 'Transport License (P-Schein)'}, {id: 'fip', name: 'Fleet Insurance Policy'}, {id: 'cc', name: 'Chauffeur Certification'}], icon: ShieldCheck, color: 'text-brand' }
                                            ) : (
                                                { group: 'Identity & Legal', docs: [{id: 'reg', name: 'Commercial Register'}, {id: 'mid', name: 'Manager ID'}, {id: 'tax', name: 'Tax Registration'}], icon: ShieldCheck, color: 'text-brand' }
                                            ),
                                            managerContext === 'FM' ? (
                                                { group: 'Vehicle Compliance', docs: [{id: 'vr', name: 'Vehicle Registration (V5C)'}, {id: 'tuv', name: 'Roadworthiness Cert (TÜV)'}, {id: 'es', name: 'Emission Standards'}], icon: FileText, color: 'text-primary' }
                                            ) : (
                                                { group: 'Licenses', docs: [{id: 'gast', name: 'Gastronomy License'}, {id: 'liq', name: 'Liquor License'}, {id: 'fire', name: 'Fire Safety'}], icon: FileText, color: 'text-primary' }
                                            ),
                                            { group: 'Banking & VAT', docs: [{id: 'sepa', name: 'SEPA Mandate'}, {id: 'vatc', name: 'VAT Certification'}, {id: 'bankv', name: 'Bank Validation'}], icon: Building2, color: 'text-primary' }
                                        ]).map((group, i) => (
                                            <div key={group.group} className="bg-btn-sec border border-main rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
                                                <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity"><group.icon size={120} /></div>
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className={`p-4 rounded-2xl bg-btn-sec ${group.color}`}><group.icon size={24} /></div>
                                                    <h3 className="text-xl font-black italic uppercase tracking-tighter">{group.group}</h3>
                                                </div>
                                                <div className="space-y-4 relative z-10">
                                                    {group.docs.map((doc) => {
                                                        const docState = complianceDocs[doc.id] || { status: 'missing' };
                                                        return (
                                                            <div key={doc.id} className="p-5 bg-btn-sec rounded-2xl border border-main flex flex-col gap-4 hover:bg-white/10 transition-all border-l-4 border-l-transparent hover:border-l-brand">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs md:text-sm lg:text-base font-black italic uppercase text-primary">{doc.name}</span>
                                                                    <div>
                                                                        {docState.status === 'missing' && (
                                                                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase px-2 py-1 bg-white/5 rounded">Missing</span>
                                                                        )}
                                                                        {docState.status === 'pending' && (
                                                                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-amber-500 uppercase px-2 py-1 bg-amber-500/10 rounded">Awaiting Admin</span>
                                                                        )}
                                                                        {docState.status === 'approved' && (
                                                                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase px-2 py-1 bg-brand/10 rounded">Approved ✓</span>
                                                                        )}
                                                                        {docState.status === 'rejected' && (
                                                                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-red-500 uppercase px-2 py-1 bg-red-500/10 rounded">Rejected ✗</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {docState.name && (
                                                                    <div className="text-[8px] md:text-[10px] lg:text-xs font-mono text-gray-500 truncate max-w-full">
                                                                        📄 {docState.name} ({docState.size})
                                                                    </div>
                                                                )}
                                                                <div className="flex gap-2">
                                                                    <label className="flex-1 cursor-pointer">
                                                                        <input 
                                                                            type="file" 
                                                                            className="hidden" 
                                                                            accept="image/*,application/pdf" 
                                                                            onChange={(e) => handleDocumentUpload(doc.id, e.target.files[0])} 
                                                                        />
                                                                        <div className="w-full py-3 bg-btn-sec border border-main rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                                                                            <Upload size={14} className="text-brand" />
                                                                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-400">
                                                                                {docState.status === 'missing' ? 'Upload (PDF/IMG)' : 'Re-Upload'}
                                                                            </span>
                                                                        </div>
                                                                    </label>
                                                                    {docState.fileData && (
                                                                        <button 
                                                                            onClick={() => handleViewDocument(docState)}
                                                                            className="p-3 bg-btn-sec border border-main rounded-xl text-secondary hover:text-primary transition-colors flex items-center justify-center" 
                                                                            title="View Document"
                                                                        >
                                                                            <FileText size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {view === 'fleet-control' && managerContext === 'FM' && (
                                <motion.div key="fleet-control" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                    <div className="flex flex-col gap-2">
                                        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-brand">Fleet Control <span className="text-primary">Hub</span></h1>
                                        <p className="text-[10px] md:text-xs lg:text-sm font-bold text-secondary uppercase tracking-[0.4em]">Asset Verification & Identity Resolution</p>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* VEHICLE VERIFICATION TERMINAL */}
                                        <div className="bg-glass border border-main rounded-[3rem] p-10 space-y-8 shadow-2xl">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-black italic uppercase tracking-tighter">Verification Queue</h3>
                                                    <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase tracking-widest">Global Asset Governance</p>
                                                </div>
                                                <span className="px-3 py-1 bg-brand/10 text-brand rounded-lg text-[9px] md:text-[11px] lg:text-xs font-black uppercase">Admin Auth Required</span>
                                            </div>

                                            <div className="space-y-4">
                                                {activeVerificationQueue.length > 0 ? (
                                                    activeVerificationQueue.map((v) => (
                                                        <div key={v.id} className="p-6 bg-btn-sec border border-main rounded-3xl space-y-4 group hover:border-brand/30 transition-all">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-5">
                                                                    <div className="w-20 h-14 bg-dark-950 rounded-xl overflow-hidden border border-main">
                                                                        <img src={v.photo} className="w-full h-full object-cover" alt="Car" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black italic uppercase text-primary">{v.driver}</p>
                                                                        <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase">{v.model} • {v.plate}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    {v.status === 'awaiting_upload' ? (
                                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-primary bg-amber-500/10 px-2 py-1 rounded uppercase">Missing V5C</span>
                                                                    ) : (
                                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-primary bg-blue-400/10 px-2 py-1 rounded uppercase">Awaiting Verification</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 pt-2 border-t border-main">
                                                                {v.status === 'awaiting_upload' ? (
                                                                    <button 
                                                                        onClick={() => alert(`Opening Secure Upload for ${v.plate}...`)}
                                                                        className="flex-1 py-3 bg-btn-sec border border-main rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-gray-400 hover:text-primary hover:bg-brand/20 hover:border-brand/30 transition-all flex items-center justify-center gap-2"
                                                                    >
                                                                        <Upload size={14} className="text-brand" /> Upload V5C Registration
                                                                    </button>
                                                                ) : (
                                                                    <button className="flex-1 py-3 bg-btn-sec border border-main rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-secondary cursor-not-allowed flex items-center justify-center gap-2 opacity-50">
                                                                        <FileText size={14} /> Document Uploaded
                                                                    </button>
                                                                )}
                                                                
                                                                <div className="flex gap-2">
                                                                    {v.email ? (
                                                                        <>
                                                                            <button 
                                                                                onClick={() => handleRejectVehicle(v.email)}
                                                                                className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-primary transition-all"
                                                                            >
                                                                                <X size={16} />
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handleApproveVehicle(v.email)}
                                                                                className="p-3 bg-brand/10 text-brand rounded-xl hover:bg-brand hover:text-dark-900 transition-all"
                                                                            >
                                                                                <CheckCircle size={16} />
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        user?.role === 'super_admin' ? (
                                                                            <>
                                                                                <button className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-primary transition-all"><X size={16} /></button>
                                                                                <button className="p-3 bg-brand/10 text-brand rounded-xl hover:bg-brand hover:text-dark-900 transition-all"><CheckCircle size={16} /></button>
                                                                            </>
                                                                        ) : (
                                                                            <div className="flex gap-2 opacity-30">
                                                                                <div className="p-3 bg-btn-sec text-secondary rounded-xl cursor-not-allowed" title="Super Admin Only"><Lock size={16} /></div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="bg-btn-sec border border-main rounded-[2.5rem] p-10 text-center py-12">
                                                        <ShieldCheck size={32} className="text-brand/30 mx-auto mb-4 animate-pulse" />
                                                        <p className="text-sm font-black italic uppercase text-primary">All Assets Verified</p>
                                                        <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase tracking-widest mt-1">No pending V5C uploads or verifications in queue.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* RED FLAG RESOLUTION CENTER */}
                                        <div className="bg-glass border border-main rounded-[3rem] p-10 space-y-8 shadow-2xl">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-black italic uppercase tracking-tighter text-red-500">Security Red Flags</h3>
                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${isDemo ? 'bg-red-500/10 text-red-500' : 'bg-brand/10 text-brand'}`}>
                                                    <ShieldAlert size={14} className={isDemo ? 'text-red-500' : 'text-brand'} />
                                                    <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase">{isDemo ? '1 Active Collision' : '0 Active Flags'}</span>
                                                </div>
                                            </div>

                                            {isDemo ? (
                                                <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-3xl space-y-6 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert size={80} className="text-red-500" /></div>
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
                                                            <User size={24} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-black italic uppercase text-primary">Identity Collision Detected</p>
                                                            <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase tracking-widest">Driver: Thomas M. (ID: GRN-284M)</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <p className="text-[7px] font-black text-secondary uppercase tracking-widest text-center">Master Profile</p>
                                                            <div className="aspect-square bg-dark-950 rounded-2xl border border-main overflow-hidden shadow-inner">
                                                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas" className="w-full h-full" alt="Profile" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-[7px] font-black text-red-500 uppercase tracking-widest text-center">Challenge Capture</p>
                                                            <div className="aspect-square bg-dark-950 rounded-2xl border border-red-500/30 overflow-hidden relative shadow-inner">
                                                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Stranger" className="w-full h-full grayscale" alt="Stranger" />
                                                                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black bg-red-500 text-primary px-2 py-1 rounded italic uppercase shadow-lg">NO MATCH</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3 pt-4">
                                                        <button className="flex-1 py-4 bg-btn-sec border border-main rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-gray-400 hover:text-primary transition-all">Reject Dispute</button>
                                                        <button className="flex-1 py-4 bg-red-500 text-primary rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all">Permaban Account</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-btn-sec border border-main rounded-[2.5rem] p-10 text-center py-12">
                                                    <ShieldCheck size={32} className="text-brand/30 mx-auto mb-4" />
                                                    <p className="text-sm font-black italic uppercase text-primary">System Secure</p>
                                                    <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase tracking-widest mt-1">No identity collisions or security red flags detected.</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* ASSET ASSIGNMENT TERMINAL */}
                                        <div className="lg:col-span-2 bg-glass border border-main rounded-[3rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-10 opacity-5"><Briefcase size={120} className="text-brand" /></div>
                                            <div className="flex items-center justify-between relative z-10">
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-black italic uppercase tracking-tighter">Active Deployment & Asset Assignment</h3>
                                                    <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase tracking-widest">Remotely manage driver vehicle pairings</p>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        setNewVehicleData({ model: '', year: '', plate: '', color: '', concession: '', assignedDriver: 'None', photo: null });
                                                        setIsAddingVehicle(true);
                                                    }}
                                                    className="px-6 py-3 bg-brand/10 border border-brand/20 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand flex items-center gap-2 hover:bg-brand hover:text-dark-900 transition-all"
                                                >
                                                    <PlusCircle size={14} /> Add New Asset to Pool
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                                                {driverDeployments.map((driver) => (
                                                    <div key={driver.name} className={`p-6 rounded-3xl border transition-all ${driver.isLocked ? 'bg-red-500/5 border-red-500/20 grayscale opacity-60' : 'bg-btn-sec border-main hover:border-brand/30'}`}>
                                                        <div className="flex items-center gap-4 mb-6">
                                                            <div className="w-12 h-12 rounded-xl bg-brand/10 p-1 border border-brand/20">
                                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.avatar}`} className="w-full h-full rounded-lg" alt="Driver" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black italic uppercase text-primary leading-none">{driver.name}</p>
                                                                <p className={`text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest mt-1 ${driver.isLocked ? 'text-red-500' : 'text-brand'}`}>{driver.status}</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="space-y-1">
                                                                <label className="text-[7px] font-black text-secondary uppercase tracking-widest ml-1">Assigned Vehicle</label>
                                                                <div 
                                                                    onClick={() => !driver.isLocked && setEditingDriver({ 
                                                                        ...driver, 
                                                                        originalName: driver.name,
                                                                        currentPlate: driver.vehicleInfo?.plate || null,
                                                                        selectedVehicle: driver.vehicleInfo || null
                                                                    })}
                                                                    className="w-full p-4 bg-dark-950 border border-main rounded-2xl flex items-center justify-between group cursor-pointer hover:border-brand/50 transition-all"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Car size={16} className={driver.isLocked ? 'text-secondary' : 'text-brand'} />
                                                                        <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-primary italic">{driver.current}</span>
                                                                    </div>
                                                                    {!driver.isLocked && <ChevronRight size={14} className="text-secondary group-hover:text-brand transition-colors" />}
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <button disabled={driver.isLocked} className="flex-1 py-3 bg-btn-sec border border-main rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary hover:bg-white/10 transition-all">History</button>
                                                                <button 
                                                                    disabled={driver.isLocked}
                                                                    onClick={() => !driver.isLocked && setEditingDriver({ 
                                                                        ...driver, 
                                                                        originalName: driver.name,
                                                                        currentPlate: driver.vehicleInfo?.plate || null,
                                                                        selectedVehicle: driver.vehicleInfo || null
                                                                    })}
                                                                    className="flex-1 py-3 bg-brand/10 border border-brand/20 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-brand hover:bg-brand hover:text-dark-900 transition-all"
                                                                >
                                                                    Switch Asset
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- REGISTERED VEHICLES DIRECTORY --- */}
                                    <div className="bg-glass border border-main rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-[100px] pointer-events-none" />
                                        
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="p-2 rounded-xl bg-brand/10 text-brand">
                                                        <Car size={20} />
                                                    </span>
                                                    <h2 className="text-xl font-black italic uppercase tracking-wider text-white">Registered Fleet Assets</h2>
                                                </div>
                                                <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase tracking-widest">
                                                    Active database records of vehicles registered in your business pool
                                                </p>
                                            </div>
                                            <div className="px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest">
                                                {registeredVehicles.length} Vehicles Total
                                            </div>
                                        </div>

                                        {registeredVehicles.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-secondary border border-white/10">
                                                    <Car size={28} className="opacity-40" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-white uppercase tracking-wider">No Fleet Assets Registered</p>
                                                    <p className="text-[10px] md:text-xs lg:text-sm text-secondary max-w-sm">
                                                        Use the registration portal below to register vehicles. Once added, they will appear in this directory and become assignable to drivers.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {registeredVehicles.map((vehicle) => (
                                                    <div key={vehicle.id} className="group relative bg-dark-900/50 border border-white/5 hover:border-brand/30 rounded-[2rem] p-6 space-y-6 transition-all duration-300 hover:shadow-lg hover:shadow-brand/5">
                                                        {/* Card Background gradient shift on hover */}
                                                        <div className="absolute inset-0 bg-gradient-to-br from-brand/0 to-brand/5 opacity-0 group-hover:opacity-100 rounded-[2rem] transition-opacity duration-300 pointer-events-none" />

                                                        {/* Vehicle Image / Placeholder */}
                                                        <div className="relative aspect-video w-full rounded-2xl bg-dark-800/80 border border-white/5 overflow-hidden flex items-center justify-center">
                                                            {vehicle.photo ? (
                                                                <img 
                                                                    src={vehicle.photo} 
                                                                    alt={`${vehicle.color} ${vehicle.model}`} 
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                />
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-2 text-secondary/40">
                                                                    <Car size={32} />
                                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-bold uppercase tracking-widest">No Image Available</span>
                                                                </div>
                                                            )}
                                                            <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white text-[8px] md:text-[10px] lg:text-xs font-bold uppercase tracking-widest">
                                                                {vehicle.year || 'N/A'}
                                                            </div>
                                                        </div>

                                                        {/* Vehicle Metadata */}
                                                        <div className="space-y-4 relative z-10">
                                                            <div className="space-y-1">
                                                                <h3 className="text-md font-extrabold text-white tracking-tight leading-tight uppercase">
                                                                    {vehicle.model}
                                                                </h3>
                                                                <div className="flex items-center gap-2 text-[10px] md:text-xs lg:text-sm text-secondary">
                                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: vehicle.color || '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />
                                                                    <span className="capitalize font-medium">{vehicle.color || 'Unknown Color'}</span>
                                                                </div>
                                                            </div>

                                                            {/* Sharing Capacity Selector */}
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center px-1">
                                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest">Sharing Option Capacity</span>
                                                                    <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand uppercase tracking-wider">Option {vehicle.sharingType || 4}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
                                                                    {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                                                                        const isSelected = (vehicle.sharingType || 4) === num;
                                                                        return (
                                                                            <button
                                                                                key={num}
                                                                                onClick={async () => {
                                                                                    try {
                                                                                        // Update vehicle doc in Firestore
                                                                                        await updateDoc(doc(fbDb, 'vehicles', vehicle.id), { sharingType: num });
                                                                                        // Find assigned driver and sync
                                                                                        const assignedDriver = driverDeployments.find(d => d.vehicleInfo?.plate === vehicle.plate);
                                                                                        if (assignedDriver && assignedDriver.email) {
                                                                                            const updatedVehicleInfo = { ...assignedDriver.vehicleInfo, sharingType: num };
                                                                                            await updateDoc(doc(fbDb, 'users', assignedDriver.email.toLowerCase()), {
                                                                                                vehicleInfo: updatedVehicleInfo
                                                                                            });
                                                                                        }
                                                                                    } catch (err) {
                                                                                        console.error("Failed to update sharing type:", err);
                                                                                    }
                                                                                }}
                                                                                className={`flex-1 aspect-square rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black transition-all flex items-center justify-center ${
                                                                                    isSelected 
                                                                                        ? 'bg-white text-black scale-105 shadow-md' 
                                                                                        : 'text-secondary hover:text-white hover:bg-white/5'
                                                                                }`}
                                                                            >
                                                                                {num}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                                <div className="space-y-0.5">
                                                                    <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-wider block">License Plate</span>
                                                                    <span className="text-xs md:text-sm lg:text-base font-black tracking-widest text-brand uppercase">{vehicle.plate || vehicle.id}</span>
                                                                </div>
                                                                <button 
                                                                    onClick={async () => {
                                                                        if (window.confirm(`Are you sure you want to deregister vehicle with plate ${vehicle.plate || vehicle.id}? This will remove it from the asset directory and pool.`)) {
                                                                            try {
                                                                                await deleteDoc(doc(fbDb, 'vehicles', vehicle.id));
                                                                                alert(`Vehicle ${vehicle.plate || vehicle.id} successfully removed from the fleet.`);
                                                                            } catch (err) {
                                                                                console.error(err);
                                                                                alert(`Failed to delete vehicle: ${err.message}`);
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
                                                                    title="Deregister Vehicle"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* --- EDIT DRIVER VEHICLE MODAL --- */}
                            <AnimatePresence>
                                {editingDriver && (
                                    <>
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => setEditingDriver(null)}
                                            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
                                        />
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101] p-1"
                                        >
                                            <div className="bg-dark-900 border border-main rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
                                                <div className="absolute top-0 left-0 right-0 h-1 bg-brand shadow-[0_0_20px_rgba(52,211,153,0.5)]" />
                                                
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">Manage Driver Asset</h3>
                                                        <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase tracking-widest">Driver: {editingDriver.name}</p>
                                                    </div>
                                                    <button onClick={() => setEditingDriver(null)} className="p-3 bg-btn-sec rounded-xl text-gray-400 hover:text-primary transition-all"><X size={20} /></button>
                                                </div>

                                                <div className="space-y-6">
                                                    {/* CURRENT STATUS */}
                                                    <div className="p-4 bg-btn-sec border border-main rounded-2xl flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-brand/10 p-1 border border-brand/20">
                                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${editingDriver.avatar}`} className="w-full h-full rounded-lg" alt="Driver" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs md:text-sm lg:text-base font-black uppercase text-primary">{editingDriver.name}</p>
                                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-widest">{editingDriver.status}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase">Rating</p>
                                                            <p className="text-xs md:text-sm lg:text-base font-bold text-primary">★ {editingDriver.rating}</p>
                                                        </div>
                                                    </div>

                                                    {/* DRIVER DETAILS EDIT FIELDS */}
                                                    <div className="space-y-4 p-4 bg-dark-950 border border-main rounded-2xl">
                                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-widest">Edit Driver Profile</p>
                                                        
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {/* DRIVER NAME */}
                                                            <div className="space-y-1.5 col-span-2">
                                                                <label className="text-[7px] font-black text-secondary uppercase tracking-widest ml-1">Driver Name</label>
                                                                <input 
                                                                    type="text"
                                                                    value={editingDriver.name}
                                                                    onChange={(e) => setEditingDriver(prev => ({ ...prev, name: e.target.value, avatar: e.target.value }))}
                                                                    className="w-full bg-btn-sec border border-main rounded-xl px-3 py-2 text-[10px] md:text-xs lg:text-sm font-bold text-primary outline-none focus:border-brand/50 transition-all placeholder:text-gray-800"
                                                                />
                                                            </div>

                                                            {/* DUTY STATUS */}
                                                            <div className="space-y-1.5">
                                                                <label className="text-[7px] font-black text-secondary uppercase tracking-widest ml-1">Duty Status</label>
                                                                <select 
                                                                    value={editingDriver.status}
                                                                    onChange={(e) => setEditingDriver(prev => ({ ...prev, status: e.target.value }))}
                                                                    className="w-full bg-btn-sec border border-main rounded-xl px-3 py-2 text-[10px] md:text-xs lg:text-sm font-bold text-primary outline-none focus:border-brand/50 transition-all cursor-pointer"
                                                                >
                                                                    <option value="In Service" className="bg-dark-900 text-primary">In Service</option>
                                                                    <option value="Standby" className="bg-dark-900 text-primary">Standby</option>
                                                                    <option value="Offline" className="bg-dark-900 text-primary">Offline</option>
                                                                    <option value="Locked" className="bg-dark-900 text-primary">Locked</option>
                                                                </select>
                                                            </div>

                                                            {/* RATING */}
                                                            <div className="space-y-1.5">
                                                                <label className="text-[7px] font-black text-secondary uppercase tracking-widest ml-1">Rating (Out of 5)</label>
                                                                <input 
                                                                    type="number"
                                                                    step="0.1"
                                                                    min="0"
                                                                    max="5"
                                                                    value={editingDriver.rating}
                                                                    onChange={(e) => setEditingDriver(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
                                                                    className="w-full bg-btn-sec border border-main rounded-xl px-3 py-2 text-[10px] md:text-xs lg:text-sm font-bold text-primary outline-none focus:border-brand/50 transition-all"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* VEHICLE PICKER */}
                                                    <div className="space-y-3">
                                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-2">Swap / Assign Vehicle</label>
                                                        <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto no-scrollbar pr-1">
                                                            {registeredVehicles.map((veh) => {
                                                                const isSelected = editingDriver.selectedVehicle?.plate === veh.plate;
                                                                return (
                                                                    <button
                                                                        key={veh.id}
                                                                        onClick={() => setEditingDriver(prev => ({ 
                                                                            ...prev, 
                                                                            current: veh.model,
                                                                            selectedVehicle: veh
                                                                        }))}
                                                                        className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                                                                            isSelected 
                                                                                ? 'bg-brand/10 border-brand text-brand' 
                                                                                : 'bg-dark-950 border-main text-secondary hover:border-brand/30 hover:text-primary'
                                                                        }`}
                                                                    >
                                                                        <div className="flex justify-between items-start w-full">
                                                                            <Car size={16} className={isSelected ? 'text-brand' : 'text-secondary'} />
                                                                            <span className="text-[7px] font-mono font-black uppercase opacity-65">{veh.plate}</span>
                                                                        </div>
                                                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase italic tracking-wider mt-3 truncate">{veh.model}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                            
                                                            <button
                                                                onClick={() => setEditingDriver(prev => ({ 
                                                                    ...prev, 
                                                                    current: 'None',
                                                                    selectedVehicle: null
                                                                }))}
                                                                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                                                                    editingDriver.current === 'None' || !editingDriver.selectedVehicle
                                                                        ? 'bg-brand/10 border-brand text-brand' 
                                                                        : 'bg-dark-950 border-main text-secondary hover:border-brand/30 hover:text-primary'
                                                                }`}
                                                            >
                                                                <X size={16} className={editingDriver.current === 'None' || !editingDriver.selectedVehicle ? 'text-brand' : 'text-secondary'} />
                                                                <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase italic tracking-wider mt-3 truncate">None</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-4 border-t border-white/5">
                                                    <button 
                                                        onClick={async () => {
                                                            const updated = driverDeployments.map(d => 
                                                                d.name === editingDriver.originalName ? { ...d, name: editingDriver.name, status: editingDriver.status, rating: editingDriver.rating, avatar: editingDriver.avatar, current: 'None', selectedVehicle: null } : d
                                                            );
                                                            setDriverDeployments(updated);
                                                            localStorage.setItem(`green_driver_deployments_${userEmailKey}`, JSON.stringify(updated));
                                                            
                                                            // Clear vehicleInfo in Firestore
                                                            if (editingDriver && editingDriver.email) {
                                                                try {
                                                                    await updateDoc(doc(fbDb, 'users', editingDriver.email.toLowerCase()), {
                                                                        vehicleInfo: null
                                                                    });
                                                                } catch (err) {
                                                                    console.error("Error clearing vehicle info in Firestore:", err);
                                                                }
                                                            }
                                                            
                                                            setEditingDriver(null);
                                                        }}
                                                        className="flex-1 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-primary transition-all"
                                                    >
                                                        Unassign Vehicle
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            const updated = driverDeployments.map(d => 
                                                                d.name === editingDriver.originalName ? { ...d, name: editingDriver.name, status: editingDriver.status, rating: editingDriver.rating, avatar: editingDriver.avatar, current: editingDriver.current, selectedVehicle: editingDriver.selectedVehicle } : d
                                                            );
                                                            setDriverDeployments(updated);
                                                            localStorage.setItem(`green_driver_deployments_${userEmailKey}`, JSON.stringify(updated));
                                                            
                                                            // Sync vehicle to Firestore
                                                            if (editingDriver && editingDriver.email) {
                                                                if (editingDriver.selectedVehicle) {
                                                                    try {
                                                                        await updateDoc(doc(fbDb, 'users', editingDriver.email.toLowerCase()), {
                                                                            vehicleInfo: {
                                                                                model: editingDriver.selectedVehicle.model,
                                                                                plate: editingDriver.selectedVehicle.plate,
                                                                                year: editingDriver.selectedVehicle.year,
                                                                                color: editingDriver.selectedVehicle.color,
                                                                                photo: editingDriver.selectedVehicle.photo || null,
                                                                                status: 'approved',
                                                                                sharingType: editingDriver.selectedVehicle.sharingType || 4
                                                                            }
                                                                        });
                                                                    } catch (err) {
                                                                        console.error("Error setting vehicle in Firestore:", err);
                                                                    }
                                                                } else {
                                                                    try {
                                                                        await updateDoc(doc(fbDb, 'users', editingDriver.email.toLowerCase()), {
                                                                            vehicleInfo: null
                                                                        });
                                                                    } catch (err) {
                                                                        console.error("Error clearing vehicle in Firestore:", err);
                                                                    }
                                                                }
                                                            }
                                                            
                                                            setEditingDriver(null);
                                                        }}
                                                        className="flex-1 py-4 bg-brand text-dark-900 rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-95 transition-all"
                                                    >
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>

                            {/* --- FLEET ADDITION MODAL --- */}
                            <AnimatePresence>
                                {isAddingVehicle && (
                                    <>
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => setIsAddingVehicle(false)}
                                            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
                                        />
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[101] p-1"
                                        >
                                            <div className="bg-dark-900 border border-main rounded-[3rem] p-10 space-y-8 shadow-2xl overflow-hidden relative">
                                                <div className="absolute top-0 left-0 right-0 h-1 bg-brand shadow-[0_0_20px_rgba(52,211,153,0.5)]" />
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">Add New Fleet Asset</h3>
                                                        <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase tracking-widest">Manual Vehicle Integration</p>
                                                    </div>
                                                    <button onClick={() => setIsAddingVehicle(false)} className="p-3 bg-btn-sec rounded-xl text-gray-400 hover:text-primary transition-all"><X size={20} /></button>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="w-full aspect-video bg-dark-950 border-2 border-dashed border-main rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group">
                                                        {newVehicleData.photo === 'uploading...' ? (
                                                            <div className="flex items-center justify-center h-full w-full bg-dark-900 text-brand text-[10px] md:text-xs lg:text-sm font-bold uppercase tracking-widest animate-pulse">Uploading...</div>
                                                        ) : newVehicleData.photo ? (
                                                            <img src={newVehicleData.photo} className="w-full h-full object-cover" alt="Preview" />
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-3">
                                                                <div className="w-12 h-12 rounded-full bg-btn-sec flex items-center justify-center text-secondary"><Car size={24} /></div>
                                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase text-secondary tracking-widest">Upload Vehicle Profile</p>
                                                            </div>
                                                        )}
                                                        <input 
                                                            type="file" 
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                            onChange={async (e) => {
                                                                const file = e.target.files[0];
                                                                if (file && user?.email) {
                                                                    setNewVehicleData(prev => ({ ...prev, photo: 'uploading...' }));
                                                                    try {
                                                                        const storageRef = ref(storage, `vehicles/${user.email.toLowerCase()}/${Date.now()}_${file.name}`);
                                                                        const uploadTask = await uploadBytesResumable(storageRef, file);
                                                                        const url = await getDownloadURL(uploadTask.ref);
                                                                        setNewVehicleData(prev => ({ ...prev, photo: url }));
                                                                    } catch (err) {
                                                                        console.error('Vehicle upload error:', err);
                                                                        setNewVehicleData(prev => ({ ...prev, photo: null }));
                                                                        alert('Failed to upload image.');
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        {[
                                                            { label: 'Manufacturer & Model', field: 'model', placeholder: 'e.g. Tesla Model Y' },
                                                            { label: 'Year', field: 'year', placeholder: 'e.g. 2025' },
                                                            { label: 'License Plate', field: 'plate', placeholder: 'e.g. F-GR-2025' },
                                                            { label: 'Color', field: 'color', placeholder: 'e.g. Midnight Blue' }, { label: 'Konzessionsnummer', field: 'concession', placeholder: 'e.g. TX-4820' }
                                                        ].map((f) => (
                                                            <div key={f.field} className="space-y-1.5">
                                                                <label className="text-[7px] font-black text-secondary uppercase tracking-widest ml-1">{f.label}</label>
                                                                <input 
                                                                    type="text"
                                                                    value={newVehicleData[f.field]}
                                                                    onChange={(e) => setNewVehicleData(prev => ({ ...prev, [f.field]: e.target.value }))}
                                                                    placeholder={f.placeholder}
                                                                    className="w-full bg-dark-950 border border-main rounded-xl px-4 py-3 text-[10px] md:text-xs lg:text-sm font-bold text-primary outline-none focus:border-brand/50 transition-all placeholder:text-gray-800"
                                                                />
                                                            </div>
                                                        ))}
                                                        <div className="space-y-1.5">
                                                            <label className="text-[7px] font-black text-secondary uppercase tracking-widest ml-1">Assign Driver</label>
                                                            <select 
                                                                value={newVehicleData.assignedDriver || 'None'}
                                                                onChange={(e) => setNewVehicleData(prev => ({ ...prev, assignedDriver: e.target.value }))}
                                                                className="w-full bg-dark-950 border border-main rounded-xl px-4 py-3 text-[10px] md:text-xs lg:text-sm font-bold text-primary outline-none focus:border-brand/50 transition-all"
                                                            >
                                                                <option value="None" className="bg-dark-950 text-secondary">None</option>
                                                                {driverDeployments.map(driver => (
                                                                    <option key={driver.name} value={driver.name} className="bg-dark-950 text-primary">{driver.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={async () => {
                                                        if (newVehicleData.model) {
                                                            try {
                                                                const managerId = user.email.toLowerCase();
                                                                const vehicleDocId = (newVehicleData.plate || 'V-' + Math.floor(100 + Math.random() * 900)).replace(/\s+/g, '-').toUpperCase();
                                                                const newVehicleRef = doc(fbDb, 'vehicles', vehicleDocId);
                                                                const newVehicleDoc = {
                                                                    id: vehicleDocId,
                                                                    managerId: managerId,
                                                                    model: newVehicleData.model,
                                                                    plate: newVehicleData.plate || 'F-GR ' + Math.floor(1000 + Math.random() * 9000) + 'E',
                                                                    year: newVehicleData.year || '2024',
                                                                    color: newVehicleData.color || 'Midnight Green',
                                                                    photo: newVehicleData.photo || null,
                                                                    status: 'approved',
                                                                    assignedDriver: newVehicleData.assignedDriver || 'None',
                                                                    sharingType: 4
                                                                };
                                                                await setDoc(newVehicleRef, newVehicleDoc);

                                                                // Auto-assign driver if selected
                                                                if (newVehicleData.assignedDriver && newVehicleData.assignedDriver !== 'None') {
                                                                    const driverObj = driverDeployments.find(d => d.name === newVehicleData.assignedDriver);
                                                                    if (driverObj && driverObj.email) {
                                                                        await updateDoc(doc(fbDb, 'users', driverObj.email.toLowerCase()), {
                                                                            vehicleInfo: {
                                                                                model: newVehicleDoc.model,
                                                                                plate: newVehicleDoc.plate,
                                                                                year: newVehicleDoc.year,
                                                                                color: newVehicleDoc.color,
                                                                                photo: newVehicleDoc.photo || null,
                                                                                status: 'approved',
                                                                                sharingType: 4
                                                                            }
                                                                        });
                                                                    }
                                                                }
                                                                alert(`FLEET ASSET REGISTERED IN FIRESTORE\n----------------------\nModel: ${newVehicleDoc.model}\nPlate: ${newVehicleDoc.plate}\nAssigned Driver: ${newVehicleDoc.assignedDriver}`);
                                                            } catch (err) {
                                                                console.error("Error registering vehicle in Firestore:", err);
                                                                alert("❌ Failed to register vehicle in Firestore.");
                                                            }
                                                        }
                                                        setIsAddingVehicle(false);
                                                    }}
                                                    className="w-full py-5 bg-brand text-dark-900 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] md:text-xs lg:text-sm shadow-xl shadow-brand/20 active:scale-95 transition-all"
                                                >
                                                    Register Asset to Pool
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>

                            {view === 'sitting' && (
                                <motion.div key="sitting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10 pb-20">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-2">
                                            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Console Sitting</h1>
                                            <p className="text-secondary text-sm font-bold uppercase tracking-widest leading-none">Identity, Business Credentials & GPS Lockdown</p>
                                        </div>
                                        <button 
                                            onClick={handleSaveGlobalManifest}
                                            className="px-12 py-5 bg-brand text-dark-900 rounded-[2.5rem] text-xs md:text-sm lg:text-base font-black uppercase tracking-widest shadow-2xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            Save Global Manifest
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* MANAGER PERSONAL DETAILS */}
                                        <div className="bg-btn-sec border border-main rounded-[3rem] p-10 space-y-8 shadow-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 rounded-2xl bg-violet-500/10 text-primary"><User size={24} /></div>
                                                <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">Manager Identity</h3>
                                            </div>

                                            {/* Profile Picture Uploader */}
                                            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/5">
                                                <div className="relative group">
                                                    <div className="w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-brand to-violet-500 shadow-[0_0_20px_rgba(52,211,153,0.15)] overflow-hidden">
                                                        {personalInfo.profilePicture === 'uploading...' ? (
                                                            <div className="w-full h-full rounded-[1.3rem] bg-dark-900 flex items-center justify-center">
                                                                <span className="text-[8px] md:text-[10px] lg:text-xs text-brand font-black animate-pulse">UP...</span>
                                                            </div>
                                                        ) : (
                                                            <img 
                                                                src={personalInfo.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${personalInfo.name}`} 
                                                                alt="Profile Preview" 
                                                                className="w-full h-full rounded-[1.3rem] object-cover bg-dark-900" 
                                                            />
                                                        )}
                                                    </div>
                                                    <label className="absolute -bottom-2 -right-2 p-2 bg-brand text-dark-900 rounded-xl cursor-pointer shadow-lg hover:scale-110 transition-transform">
                                                        <Camera size={14} />
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            accept="image/*" 
                                                            onChange={async (e) => {
                                                                const file = e.target.files[0];
                                                                if (file && user?.email) {
                                                                    setPersonalInfo(prev => ({ ...prev, profilePicture: 'uploading...' }));
                                                                    try {
                                                                        const storageRef = ref(storage, `profiles/${user.email.toLowerCase()}/${Date.now()}_${file.name}`);
                                                                        const uploadTask = await uploadBytesResumable(storageRef, file);
                                                                        const url = await getDownloadURL(uploadTask.ref);
                                                                        setPersonalInfo(prev => ({ ...prev, profilePicture: url }));
                                                                    } catch (err) {
                                                                        console.error('Profile photo upload error:', err);
                                                                        setPersonalInfo(prev => ({ ...prev, profilePicture: null }));
                                                                        alert('Failed to upload image.');
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                                <div className="space-y-1 text-center sm:text-left">
                                                    <h4 className="text-sm font-black italic uppercase text-primary">Manager Avatar</h4>
                                                    <p className="text-[10px] md:text-xs lg:text-sm text-secondary font-bold uppercase tracking-widest leading-relaxed">
                                                        Upload a custom profile photo or use auto-generated vector seed.
                                                    </p>
                                                    {personalInfo.profilePicture && (
                                                        <button 
                                                            onClick={() => setPersonalInfo(prev => ({ ...prev, profilePicture: '' }))}
                                                            className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase text-red-500 tracking-widest hover:text-red-400 mt-1 block"
                                                        >
                                                            Reset to Default Seed
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2 space-y-1">
                                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase ml-1">Full Legal Name</label>
                                                    <input 
                                                        type="text" 
                                                        value={personalInfo.name} 
                                                        onChange={(e) => setPersonalInfo({...personalInfo, name: e.target.value})}
                                                        className="w-full bg-btn-sec border border-main rounded-xl p-4 text-sm font-bold text-primary focus:border-violet-400 outline-none transition-all" 
                                                    />
                                                </div>
                                                <div className="col-span-2 md:col-span-1 space-y-1">
                                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase ml-1">Direct Email</label>
                                                    <input 
                                                        type="email" 
                                                        value={personalInfo.email} 
                                                        onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                                                        className="w-full bg-btn-sec border border-main rounded-xl p-4 text-sm font-bold text-primary focus:border-violet-400 outline-none" 
                                                    />
                                                </div>
                                                <div className="col-span-2 md:col-span-1 space-y-1">
                                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase ml-1">Mobile Line</label>
                                                    <input 
                                                        type="text" 
                                                        value={personalInfo.phone} 
                                                        onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                                                        className="w-full bg-btn-sec border border-main rounded-xl p-4 text-sm font-bold text-primary focus:border-violet-400 outline-none" 
                                                    />
                                                </div>
                                                <div className="col-span-2 md:col-span-1 space-y-1">
                                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase ml-1">Personal Address</label>
                                                    <input 
                                                        type="text" 
                                                        value={personalInfo.address} 
                                                        onChange={(e) => setPersonalInfo({...personalInfo, address: e.target.value})}
                                                        className="w-full bg-btn-sec border border-main rounded-xl p-4 text-sm font-bold text-primary focus:border-violet-400 outline-none" 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase ml-1">ZIP Code</label>
                                                    <input 
                                                        type="text" 
                                                        value={personalInfo.zip} 
                                                        onChange={(e) => setPersonalInfo({...personalInfo, zip: e.target.value})}
                                                        className="w-full bg-btn-sec border border-main rounded-xl p-4 text-sm font-bold text-primary focus:border-violet-400 outline-none" 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase ml-1">City</label>
                                                    <input 
                                                        type="text" 
                                                        value={personalInfo.city} 
                                                        onChange={(e) => setPersonalInfo({...personalInfo, city: e.target.value})}
                                                        className="w-full bg-btn-sec border border-main rounded-xl p-4 text-sm font-bold text-primary focus:border-violet-400 outline-none" 
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* PASSWORD CHANGE TERMINAL */}
                                        <div className="bg-btn-sec border border-main rounded-[3rem] p-10 space-y-8 shadow-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 rounded-2xl bg-brand/10 text-brand"><ShieldCheck size={24} /></div>
                                                <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">Console Security Password</h3>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase ml-1">Current Password</label>
                                                    <input 
                                                        type="password" 
                                                        placeholder="••••"
                                                        value={currentPasswordInput}
                                                        onChange={(e) => setCurrentPasswordInput(e.target.value)}
                                                        className="w-full bg-dark-950 border border-main rounded-xl p-4 text-sm font-bold text-primary focus:border-brand outline-none" 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase ml-1">New Password</label>
                                                    <input 
                                                        type="password" 
                                                        placeholder="••••"
                                                        value={newPasswordInput}
                                                        onChange={(e) => setNewPasswordInput(e.target.value)}
                                                        className="w-full bg-dark-950 border border-main rounded-xl p-4 text-sm font-bold text-primary focus:border-brand outline-none" 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase ml-1">Confirm New Password</label>
                                                    <input 
                                                        type="password" 
                                                        placeholder="••••"
                                                        value={confirmPasswordInput}
                                                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                                                        className="w-full bg-dark-950 border border-main rounded-xl p-4 text-sm font-bold text-primary focus:border-brand outline-none" 
                                                    />
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={() => {
                                                    if (currentPasswordInput !== securityPassword) {
                                                        return alert("Error: Current password is incorrect.");
                                                    }
                                                    if (!newPasswordInput) {
                                                        return alert("Error: New password cannot be empty.");
                                                    }
                                                    if (newPasswordInput !== confirmPasswordInput) {
                                                        return alert("Error: New passwords do not match.");
                                                    }
                                                    setSecurityPassword(newPasswordInput);
                                                    setCurrentPasswordInput('');
                                                    setNewPasswordInput('');
                                                    setConfirmPasswordInput('');
                                                    alert("PASSWORD CHANGED SUCCESSFULLY: Console security credentials updated.");
                                                }}
                                                className="px-6 py-3 bg-brand/10 border border-brand/20 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-brand hover:bg-brand hover:text-dark-900 transition-all"
                                            >
                                                Update Security Password
                                            </button>
                                        </div>

                                        {/* BUSINESS CORE DETAILS */}

                                        {/* GPS Lockdown (Relocated) */}
                                        {(managerContext !== 'FM' && managerContext !== 'SM' && simRole !== 'staff') && (
                                            <div className="lg:col-span-2 bg-dark-900 border border-main rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className="p-4 rounded-2xl bg-brand/10 text-brand"><Smartphone size={24} /></div>
                                                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">Geofence Ordering Hard-Lock</h3>
                                                </div>
                                                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                                                    <div className="flex-1 space-y-6">
                                                        <div className="flex items-center justify-between p-8 bg-black/40 rounded-3xl border border-main">
                                                            <div>
                                                                <p className="text-sm font-black italic uppercase text-primary">Proximity Enforcement</p>
                                                                <p className="text-[10px] md:text-xs lg:text-sm font-bold text-secondary uppercase mt-1">Require physical presence for digital ordering</p>
                                                            </div>
                                                            <div className="w-12 h-6 bg-brand rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-xl" /></div>
                                                        </div>
                                                    </div>
                                                    <div className="w-full md:w-64 space-y-4 px-2">
                                                        <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-secondary ml-1">Lockdown Radius</label>
                                                        <div className="flex items-center gap-6">
                                                            <input type="range" min="10" max="500" defaultValue="50" className="flex-1 accent-brand h-2 bg-black/40 rounded-full appearance-none" />
                                                            <span className="text-xl font-black italic text-brand">50m</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {view === 'staff' && (
                                <motion.div key="staff" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                                    <div className="flex flex-col md:flex-row gap-4 md:justify-between md:items-end">
                                        <div className="space-y-2">
                                            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-primary leading-none">Team Hub</h1>
                                            <p className="text-secondary text-xs md:text-sm font-bold uppercase tracking-widest leading-none">Access Control & Active Personnel</p>
                                        </div>
                                        <button 
                                            onClick={() => setView('onboarding')}
                                            className="w-full md:w-auto px-8 py-4 bg-brand text-dark-900 rounded-[2rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl shadow-brand/20 text-center flex items-center justify-center gap-2"
                                        >
                                            <PlusCircle size={16} /> Onboard via Grien ID
                                        </button>
                                    </div>
                                    
                                    <div className="bg-glass border border-main rounded-[3rem] p-4 md:p-10 space-y-4 shadow-2xl">
                                        {staffList.map((member, i) => (
                                            <div key={i} className="flex flex-row items-center justify-between p-4 md:p-6 bg-btn-sec rounded-3xl border border-main hover:bg-white/10 hover:border-brand/20 transition-all gap-2 md:gap-4 group">
                                                <div className="flex items-center gap-3 md:gap-6 min-w-0">
                                                    <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 p-1 shrink-0">
                                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatar}`} alt="Avatar" className="w-full h-full rounded-xl" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                            <p className="text-sm font-black italic uppercase text-primary tracking-tight leading-none truncate">{member.name}</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {['Orders', 'Feed', 'Finance', 'Terminal'].filter(p => member.permissions?.includes(p)).map(p => (
                                                                    <span key={p} className="px-2 py-0.5 bg-brand/10 text-brand text-[6px] font-black uppercase rounded border border-brand/20 whitespace-nowrap">{p}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] md:text-xs lg:text-sm font-bold text-brand uppercase tracking-widest mt-1.5 italic">ID: {member.id || `ST-10${i+24}`}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 md:gap-6 shrink-0">
                                                    <div className="text-right hidden md:block">
                                                        <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest">{member.role}</p>
                                                        <p className={`text-[8px] md:text-[10px] lg:text-xs font-black uppercase mt-0.5 ${member.status === 'On Shift' ? 'text-primary' : 'text-secondary'}`}>{member.status}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => navigate(`/manager/staff-permissions/${member.id || `ST-10${i+24}`}`)}
                                                        className="p-4 bg-btn-sec border border-main rounded-2xl text-secondary hover:text-brand hover:bg-brand/10 hover:border-brand/40 transition-all shadow-xl group-hover:scale-110"
                                                    >
                                                        <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {view === 'onboarding' && (
                                <motion.div key="onboarding" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-10 max-w-2xl mx-auto pb-20">
                                    <div className="text-center space-y-4">
                                        <div className="w-20 h-20 bg-violet-500/10 rounded-[2rem] flex items-center justify-center text-primary mx-auto border border-violet-500/20 shadow-2xl">
                                            <PlusCircle size={40} />
                                        </div>
                                        <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Staff <span className="text-primary">Onboarding</span></h1>
                                        <p className="text-secondary text-xs md:text-sm lg:text-base font-bold uppercase tracking-[0.3em] leading-none">Search Personnel by Grien ID</p>
                                    </div>

                                    {/* --- BULK INVITE LINK --- */}
                                    <div className="bg-glass border border-main rounded-[3rem] p-10 space-y-6 shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-6 opacity-5"><Handshake size={80} className="text-brand" /></div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                                                <Handshake size={22} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black italic uppercase text-primary">Bulk Invite Link</p>
                                                <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase tracking-widest">Copy and share this link to onboard drivers and staff automatically</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 bg-btn-sec border border-main p-3 rounded-2xl items-center justify-between">
                                            <span className="text-[10px] md:text-xs lg:text-sm font-mono text-secondary truncate flex-1 px-2 select-all">
                                                {`${window.location.origin}/signup?mode=partner&invite=${encodeURIComponent(user?.email || 'manager@green.de')}`}
                                            </span>
                                            <button 
                                                onClick={() => {
                                                    const link = `${window.location.origin}/signup?mode=partner&invite=${encodeURIComponent(user?.email || 'manager@green.de')}`;
                                                    navigator.clipboard.writeText(link);
                                                    alert("📋 Invite Link Copied to Clipboard!\n\nShare this link with your drivers and staff so they can register and link to your fleet automatically.");
                                                }}
                                                className="px-5 py-3 bg-brand text-dark-900 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shrink-0"
                                            >
                                                Copy Link
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-glass border border-main rounded-[3rem] p-10 space-y-8 shadow-2xl">
                                        {/* Header */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                                                <ShieldCheck size={22} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black italic uppercase text-primary">Onboard via Grien ID</p>
                                                <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase tracking-widest">Enter the Grien ID of the registered staff or driver</p>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary" size={20} />
                                            <input 
                                                type="text" 
                                                placeholder="Enter Grien ID (e.g. GRN-AB3X-Y7KP)" 
                                                value={staffSearchId}
                                                onChange={(e) => setStaffSearchId(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearchByGreenId()}
                                                className="w-full bg-btn-sec border border-main rounded-2xl py-6 pl-16 pr-36 text-sm font-black uppercase tracking-widest text-brand outline-none focus:border-brand transition-all placeholder:text-gray-700 placeholder:normal-case placeholder:font-bold" 
                                            />
                                            <button 
                                                onClick={handleSearchByGreenId}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 px-6 py-3 bg-brand text-dark-900 rounded-xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest hover:scale-105 transition-all"
                                            >
                                                {isSearchingStaff ? 'Searching...' : 'Search'}
                                            </button>
                                        </div>

                                        {/* Not found message */}
                                        {!isSearchingStaff && staffSearchId && !foundStaff && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                                    <X size={14} className="text-red-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-red-400 uppercase tracking-widest">Grien ID Not Found</p>
                                                    <p className="text-[9px] md:text-[11px] lg:text-xs text-secondary font-bold mt-0.5">No registered staff or driver matches this ID. Ask them to check their Grien ID on the pending page.</p>
                                                </div>
                                            </motion.div>
                                        )}

                                        <AnimatePresence>
                                            {foundStaff && (
                                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                                    {/* Staff Card */}
                                                    <div className="p-6 bg-brand/5 border border-brand/20 rounded-3xl flex items-center gap-5 relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
                                                        <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 p-1 shrink-0">
                                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${foundStaff.name}`} alt="Avatar" className="w-full h-full rounded-xl" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-lg font-black italic uppercase text-primary truncate">{foundStaff.name}</p>
                                                            <p className="text-[10px] md:text-xs lg:text-sm font-bold text-secondary uppercase tracking-widest">{foundStaff.role}</p>
                                                            {foundStaff.email && <p className="text-[9px] md:text-[11px] lg:text-xs text-secondary font-bold mt-0.5 truncate">{foundStaff.email}</p>}
                                                        </div>
                                                        <div className="shrink-0 text-right">
                                                            <p className="text-[7px] font-black text-brand/60 uppercase tracking-widest mb-1">Grien ID</p>
                                                            <span className="px-3 py-1.5 bg-brand/10 text-brand rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black font-mono tracking-widest border border-brand/20">{foundStaff.greenId}</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-secondary uppercase tracking-[0.2em] ml-2">Quick Templates</p>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {[
                                                                { id: 'pilot', label: managerContext === 'FM' ? 'Standard Driver' : 'Standard Pilot', icon: Zap },
                                                                { id: 'supervisor', label: managerContext === 'FM' ? 'Fleet Dispatcher' : 'Supervisor', icon: ShieldCheck },
                                                                { id: 'accountant', label: managerContext === 'FM' ? 'Fleet Accountant' : 'Accountant', icon: Receipt }
                                                            ].map(t => (
                                                                <button 
                                                                    key={t.id}
                                                                    onClick={() => applyTemplate(t.id)}
                                                                    className={`p-4 rounded-2xl border transition-all flex items-center gap-3 ${activeTemplate === t.id ? 'bg-brand text-dark-900 border-brand shadow-lg shadow-brand/20' : 'bg-btn-sec border-main text-secondary'}`}
                                                                >
                                                                    <t.icon size={16} />
                                                                    <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-tighter">{t.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-secondary uppercase tracking-[0.2em] ml-2">Operational Permissions</p>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <button 
                                                                onClick={() => setStaffPermissions(prev => ({ ...prev, orders: !prev.orders }))}
                                                                className={`p-6 rounded-[2rem] border transition-all text-left group ${staffPermissions.orders ? 'bg-brand/10 border-brand' : 'bg-btn-sec border-main'}`}
                                                            >
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${staffPermissions.orders ? 'bg-brand text-dark-900' : 'bg-btn-sec text-secondary'}`}><ShoppingBag size={20} /></div>
                                                                <p className={`text-sm font-black italic uppercase ${staffPermissions.orders ? 'text-primary' : 'text-secondary'}`}>
                                                                    {managerContext === 'FM' ? 'Rides & Dispatches' : 'Orders & Queue'}
                                                                </p>
                                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase mt-1">
                                                                    {managerContext === 'FM' ? 'Process live ride dispatches' : 'Process live service requests'}
                                                                </p>
                                                            </button>
                                                            <button 
                                                                onClick={() => setStaffPermissions(prev => ({ ...prev, terminal: !prev.terminal }))}
                                                                className={`p-6 rounded-[2rem] border transition-all text-left group ${staffPermissions.terminal ? 'bg-brand/10 border-brand' : 'bg-btn-sec border-main'}`}
                                                            >
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${staffPermissions.terminal ? 'bg-brand text-dark-900' : 'bg-btn-sec text-secondary'}`}><QrCode size={20} /></div>
                                                                <p className={`text-sm font-black italic uppercase ${staffPermissions.terminal ? 'text-primary' : 'text-secondary'}`}>
                                                                    {managerContext === 'FM' ? 'Driver Compliance' : 'Scan Terminal'}
                                                                </p>
                                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase mt-1">
                                                                    {managerContext === 'FM' ? 'Verify driver permits & logs' : 'Verify tickets & vouchers'}
                                                                </p>
                                                            </button>
                                                            <button 
                                                                onClick={() => setStaffPermissions(prev => ({ ...prev, finance: !prev.finance }))}
                                                                className={`p-6 rounded-[2rem] border transition-all text-left group ${staffPermissions.finance ? 'bg-brand/10 border-brand' : 'bg-btn-sec border-main'}`}
                                                            >
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${staffPermissions.finance ? 'bg-brand text-dark-900' : 'bg-btn-sec text-secondary'}`}><Receipt size={20} /></div>
                                                                <p className={`text-sm font-black italic uppercase ${staffPermissions.finance ? 'text-primary' : 'text-secondary'}`}>
                                                                    {managerContext === 'FM' ? 'Fleet Billing' : 'Financial Intel'}
                                                                </p>
                                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase mt-1">
                                                                    {managerContext === 'FM' ? 'View fleet revenue & exports' : 'View revenue & exports'}
                                                                </p>
                                                            </button>
                                                            <button 
                                                                onClick={() => setStaffPermissions(prev => ({ ...prev, compliance: !prev.compliance }))}
                                                                className={`p-6 rounded-[2rem] border transition-all text-left group ${staffPermissions.compliance ? 'bg-violet-500/10 border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.1)]' : 'bg-btn-sec border-main'}`}
                                                            >
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${staffPermissions.compliance ? 'bg-violet-500 text-primary' : 'bg-btn-sec text-secondary'}`}><ShieldCheck size={20} /></div>
                                                                <p className={`text-sm font-black italic uppercase ${staffPermissions.compliance ? 'text-primary' : 'text-secondary'}`}>
                                                                    {managerContext === 'FM' ? 'Vehicle & Driver Vault' : 'Compliance'}
                                                                </p>
                                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase mt-1">
                                                                    {managerContext === 'FM' ? 'Access vehicle & driver docs' : 'Access vault & legal docs'}
                                                                </p>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <button 
                                                        onClick={() => {
                                                            handleOnboardStaff();
                                                            setView('staff');
                                                        }}
                                                        className="w-full py-6 bg-brand text-dark-900 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                                    >
                                                        <CheckCircle size={18} /> Confirm Onboarding — Link to {getBusinessName()}
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    </motion.div>
                                )}

                            {view === 'stadium-seats' && (
                                <motion.div key="stadium" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10 pb-20">
                                    <div className="flex flex-col md:flex-row gap-6 md:justify-between md:items-end">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand"><Ticket size={24} /></div>
                                                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-primary">Ticket <span className="text-brand">Hub</span></h1>
                                            </div>
                                            <p className="text-secondary text-xs md:text-sm font-bold uppercase tracking-widest leading-none">Inventory Command • Batch Management</p>
                                        </div>
                                        <div className="flex gap-4 w-full md:w-auto">
                                            <div className="flex-1 md:flex-initial px-4 md:px-6 py-3 bg-btn-sec border border-main rounded-xl text-right">
                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest">Global Availability</p>
                                                <p className="text-sm md:text-xl font-black italic text-brand leading-none mt-1">
                                                    {(managerContext === 'CM' || managerContext === 'VM') ? '4,820 Tickets' : '4,820 Seats'}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => setIsAddingEvent(true)}
                                                className="flex-1 md:flex-initial px-4 md:px-8 py-4 bg-brand text-dark-900 rounded-[2rem] text-[9px] md:text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all text-center whitespace-nowrap"
                                            >
                                                Upload Tickets
                                            </button>
                                        </div>
                                    </div>

                                    {/* 4-OPTION QUICK UPLOAD GRID */}
                                    <div className={`grid gap-6 ${
                                        managerContext === 'CM' 
                                            ? 'grid-cols-2 md:grid-cols-2 max-w-2xl' 
                                            : 'grid-cols-2 md:grid-cols-4'
                                    }`}>
                                        {/* Sporting Match Card */}
                                        {managerContext === 'SM' && (
                                            <button 
                                                onClick={() => {
                                                    setNewEventData({
                                                        name: 'Champions League Football Match',
                                                        date: new Date().toISOString().split('T')[0],
                                                        time: '20:45',
                                                        file: null,
                                                        tiers: [
                                                            { id: 't1', name: 'Silver (Normal Ticket)', price: 85, quantity: 1200, sold: 0 },
                                                            { id: 't2', name: 'Gold (Premium)', price: 450, quantity: 150, sold: 0 },
                                                            { id: 't3', name: 'Diamond (VIP)', price: 1200, quantity: 30, sold: 0 }
                                                        ]
                                                    });
                                                    setIsAddingEvent(true);
                                                }}
                                                className="p-6 bg-glass border border-main rounded-[2rem] hover:border-brand/50 hover:shadow-[0_0_30px_rgba(33,255,165,0.1)] transition-all duration-300 text-left group relative overflow-hidden flex flex-col justify-between h-44 w-full"
                                            >
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 blur-[40px] rounded-full -mr-6 -mt-6 group-hover:bg-brand/10 transition-colors" />
                                                <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Trophy size={22} /></div>
                                                <div>
                                                    <p className="text-sm font-black italic uppercase text-primary">Sporting Match</p>
                                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase mt-1">Football Game / Arena Ticket</p>
                                                </div>
                                            </button>
                                        )}

                                        {/* Club Event Card */}
                                        {managerContext === 'CM' && (
                                            <button 
                                                onClick={() => {
                                                    setNewEventData({
                                                        name: 'Midnight VIP Club Party',
                                                        date: new Date().toISOString().split('T')[0],
                                                        time: '22:00',
                                                        file: null,
                                                        tiers: [
                                                            { id: 't1', name: 'Silver (Normal Ticket)', price: 35, quantity: 800, sold: 0 },
                                                            { id: 't2', name: 'Gold (Premium)', price: 120, quantity: 100, sold: 0 },
                                                            { id: 't3', name: 'Diamond (VIP)', price: 750, quantity: 15, sold: 0 }
                                                        ]
                                                    });
                                                    setIsAddingEvent(true);
                                                }}
                                                className="p-6 bg-glass border border-main rounded-[2rem] hover:border-violet-500/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all duration-300 text-left group relative overflow-hidden flex flex-col justify-between h-44 w-full"
                                            >
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 blur-[40px] rounded-full -mr-6 -mt-6 group-hover:bg-violet-500/10 transition-colors" />
                                                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Zap size={22} /></div>
                                                <div>
                                                    <p className="text-sm font-black italic uppercase text-primary">Club Party</p>
                                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase mt-1">Midnight Lounge / DJ Event</p>
                                                </div>
                                            </button>
                                        )}

                                        {/* Concert Card */}
                                        {managerContext === 'SM' && (
                                            <button 
                                                onClick={() => {
                                                    setNewEventData({
                                                        name: 'Live Music Open Air Festival',
                                                        date: new Date().toISOString().split('T')[0],
                                                        time: '19:00',
                                                        file: null,
                                                        tiers: [
                                                            { id: 't1', name: 'Silver (Normal Ticket)', price: 65, quantity: 2000, sold: 0 },
                                                            { id: 't2', name: 'Gold (Premium)', price: 150, quantity: 500, sold: 0 },
                                                            { id: 't3', name: 'Diamond (VIP)', price: 950, quantity: 50, sold: 0 }
                                                        ]
                                                    });
                                                    setIsAddingEvent(true);
                                                }}
                                                className="p-6 bg-glass border border-main rounded-[2rem] hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] transition-all duration-300 text-left group relative overflow-hidden flex flex-col justify-between h-44 w-full"
                                            >
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-[40px] rounded-full -mr-6 -mt-6 group-hover:bg-amber-500/10 transition-colors" />
                                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Activity size={22} /></div>
                                                <div>
                                                    <p className="text-sm font-black italic uppercase text-primary">Concert / Fest</p>
                                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase mt-1">Live Show & Stage Ticket</p>
                                                </div>
                                            </button>
                                        )}

                                        {/* Custom '+' Card */}
                                        <button 
                                            onClick={() => {
                                                setNewEventData({
                                                    name: '',
                                                    date: '',
                                                    time: '',
                                                    file: null,
                                                    tiers: [{ id: 't1', name: 'Silver (Normal Ticket)', price: 25, quantity: 100, sold: 0 }]
                                                });
                                                setIsAddingEvent(true);
                                            }}
                                            className="p-6 bg-glass border border-main rounded-[2rem] hover:border-brand/50 hover:shadow-[0_0_30px_rgba(33,255,165,0.1)] transition-all duration-300 text-left group relative overflow-hidden flex flex-col justify-between h-44 w-full"
                                        >
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 blur-[40px] rounded-full -mr-6 -mt-6 group-hover:bg-brand/10 transition-colors" />
                                            <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><PlusCircle size={22} /></div>
                                            <div>
                                                <p className="text-sm font-black italic uppercase text-primary">Custom Category</p>
                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase mt-1">Configure Custom Event</p>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                        {/* EVENT INVENTORY LIST */}
                                        <div className="lg:col-span-8 space-y-6">
                                            {stadiumEvents
                                                .filter(event => {
                                                    if (event.context) return event.context === managerContext;
                                                    if (event.name.toLowerCase().includes('neon') || event.name.toLowerCase().includes('club') || event.name.toLowerCase().includes('party')) {
                                                        return managerContext === 'CM';
                                                    }
                                                    return managerContext === 'SM';
                                                })
                                                .map((event) => (
                                                <div key={event.id} className="bg-glass border border-main rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[100px] rounded-full -mr-20 -mt-20 opacity-40" />
                                                    
                                                    <div className="flex justify-between items-start relative z-10">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-3">
                                                                 <h3 className="text-2xl font-black italic uppercase text-primary">{event.name}</h3>
                                                                 <span className={`px-2 py-0.5 rounded text-[8px] md:text-[10px] lg:text-xs font-black uppercase ${event.published ? 'bg-brand text-dark-900' : 'bg-btn-sec text-secondary border border-main'}`}>
                                                                     {event.published ? 'LIVE ON APP' : 'DRAFT'}
                                                                 </span>
                                                            </div>
                                                            <p className="text-[10px] md:text-xs lg:text-sm font-bold text-secondary uppercase tracking-[0.2em]">
                                                                {event.date} • {event.time} • {getBusinessName(managerContext)}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <button 
                                                                onClick={() => handleDeleteEvent(event.id)}
                                                                className="px-4 py-2 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase transition-all bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                                                            >
                                                                Delete
                                                            </button>
                                                            <button 
                                                                onClick={() => togglePublishEvent(event.id)}
                                                                className={`px-4 py-2 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase transition-all ${event.published ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-brand/10 text-brand border border-brand/20'}`}
                                                            >
                                                                {event.published ? 'Unpublish' : 'Publish to App'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                                        {event.tiers.map((tier, idx) => (
                                                            <div key={idx} className="p-6 bg-btn-sec rounded-[2rem] border border-main space-y-4 hover:border-brand/30 transition-all">
                                                                <div className="flex justify-between items-center">
                                                                    <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase">{tier.name}</p>
                                                                    <p className="text-xs md:text-sm lg:text-base font-black italic text-brand">€{tier.price}</p>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between items-end text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest">
                                                                        <span className="text-secondary">Sales Progress</span>
                                                                        <span className="text-primary">{tier.sold} / {tier.quantity}</span>
                                                                    </div>
                                                                    <div className="h-1.5 bg-dark-900 rounded-full overflow-hidden border border-white/5">
                                                                        <motion.div 
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${(tier.sold / tier.quantity) * 100}%` }}
                                                                            className="h-full bg-brand shadow-[0_0_10px_rgba(33,255,165,0.4)]"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                                                    <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase">Revenue</p>
                                                                    <p className="text-[10px] md:text-xs lg:text-sm font-black text-primary">€{(tier.sold * tier.price).toLocaleString()}</p>
                                                                </div>
                                                                <div className="flex justify-between items-center text-[7px] font-bold text-brand uppercase tracking-widest bg-brand/5 border border-brand/10 px-2.5 py-1.5 rounded-lg leading-none mt-1">
                                                                    <span>Remaining</span>
                                                                    <span>{tier.quantity - tier.sold} Left</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* TACTICAL STATS & CONTROLS */}
                                        <div className="lg:col-span-4 space-y-8">
                                            <div className="bg-dark-900 border border-main rounded-[3rem] p-10 space-y-8 shadow-2xl sticky top-6">
                                                <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                                                    <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-400 border border-violet-500/20">
                                                        <Activity size={32} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black italic uppercase tracking-tighter">Market Pulse</h3>
                                                        <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase tracking-widest mt-1">Real-time Demand Index</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="p-6 bg-btn-sec rounded-2xl border border-main">
                                                        <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase mb-2 tracking-widest">Total Sales Velocity</p>
                                                        <p className="text-3xl font-black italic text-brand">+14.2% <span className="text-[10px] md:text-xs lg:text-sm text-secondary not-italic uppercase">vs Last Event</span></p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-4 bg-btn-sec rounded-2xl border border-main">
                                                            <p className="text-[7px] font-black text-secondary uppercase mb-1">Queue Traffic</p>
                                                            <p className="text-xs md:text-sm lg:text-base font-black uppercase text-primary italic">Minimal</p>
                                                        </div>
                                                        <div className="p-4 bg-btn-sec rounded-2xl border border-main">
                                                            <p className="text-[7px] font-black text-secondary uppercase mb-1">Server Load</p>
                                                            <p className="text-xs md:text-sm lg:text-base font-black uppercase text-brand italic">Optimal</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4 pt-6">
                                                        <h4 className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-1">Quick Actions</h4>
                                                        <button className="w-full py-5 bg-btn-sec border border-main rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                                                            <Zap size={14} className="text-brand" /> Instant Flash Sale
                                                        </button>
                                                        <button className="w-full py-5 bg-btn-sec border border-main rounded-2xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                                            Export Sales Ledger
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ADD EVENT MODAL OVERLAY */}
                                    <AnimatePresence>
                                        {isAddingEvent && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-3xl overflow-y-auto py-12 px-6 flex items-start justify-center">
                                                <motion.div 
                                                    initial={{ scale: 0.9, y: 20 }} 
                                                    animate={{ scale: 1, y: 0 }} 
                                                    exit={{ scale: 0.9, y: 20 }}
                                                    className="w-full max-w-2xl bg-dark-900 border border-brand/20 rounded-[4rem] p-12 space-y-10 shadow-2xl relative overflow-hidden"
                                                >
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[100px] rounded-full" />
                                                    
                                                    <div className="text-center space-y-4">
                                                        <div className="w-20 h-20 bg-brand/10 rounded-[2rem] flex items-center justify-center text-brand mx-auto"><Upload size={40} /></div>
                                                        <h2 className="text-4xl font-black italic uppercase tracking-tighter">Upload <span className="text-brand">Tickets</span></h2>
                                                        <p className="text-[10px] md:text-xs lg:text-sm font-black text-secondary uppercase tracking-[0.4em]">Import and verify ticket manifest</p>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                                                        <div className="col-span-1 sm:col-span-2 space-y-2">
                                                            <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest ml-4">Event Identity</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="e.g. World Tour: Neon Nights" 
                                                                value={newEventData.name}
                                                                onChange={e => setNewEventData({...newEventData, name: e.target.value})}
                                                                className="w-full bg-btn-sec border border-main rounded-3xl p-4 md:p-6 text-lg md:text-xl font-black italic focus:border-brand outline-none transition-all text-primary" 
                                                            />
                                                        </div>
                                                        <div className="space-y-2 col-span-1">
                                                            <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest ml-4">Deployment Date</label>
                                                            <input 
                                                                type="date" 
                                                                value={newEventData.date}
                                                                onChange={e => setNewEventData({...newEventData, date: e.target.value})}
                                                                className="w-full bg-btn-sec border border-main rounded-3xl p-4 md:p-6 text-sm font-black focus:border-brand outline-none transition-all uppercase text-primary" 
                                                            />
                                                        </div>
                                                        <div className="space-y-2 col-span-1">
                                                            <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest ml-4">Start Time</label>
                                                            <input 
                                                                type="time" 
                                                                value={newEventData.time}
                                                                onChange={e => setNewEventData({...newEventData, time: e.target.value})}
                                                                className="w-full bg-btn-sec border border-main rounded-3xl p-4 md:p-6 text-sm font-black focus:border-brand outline-none transition-all text-primary" 
                                                            />
                                                        </div>
                                                        <div className="space-y-2 col-span-1">
                                                            <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest ml-4">End Time</label>
                                                            <input 
                                                                type="time" 
                                                                value={newEventData.endTime}
                                                                onChange={e => setNewEventData({...newEventData, endTime: e.target.value})}
                                                                className="w-full bg-btn-sec border border-main rounded-3xl p-4 md:p-6 text-sm font-black focus:border-brand outline-none transition-all text-primary" 
                                                            />
                                                        </div>
                                                        <div className="col-span-1 sm:col-span-2 space-y-2">
                                                            <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest ml-4">Event Address</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="e.g. Zeil 106, 60313 Frankfurt" 
                                                                value={newEventData.address}
                                                                onChange={e => setNewEventData({...newEventData, address: e.target.value})}
                                                                className="w-full bg-btn-sec border border-main rounded-3xl p-4 md:p-6 text-sm font-black italic focus:border-brand outline-none transition-all text-primary" 
                                                            />
                                                        </div>

                                                        <div className="col-span-1 sm:col-span-2 pt-6 space-y-6 border-t border-white/5">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-[10px] md:text-xs lg:text-sm font-black text-brand uppercase tracking-widest ml-4">Configure Ticket Categories & Allocations</label>
                                                                <button 
                                                                    onClick={handleAddTier}
                                                                    className="px-4 py-2 bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest transition-all"
                                                                >
                                                                    + Add Category
                                                                </button>
                                                            </div>

                                                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                                                                {newEventData.tiers.map((tier, idx) => (
                                                                    <div key={tier.id || idx} className="p-6 bg-btn-sec border border-main rounded-2xl space-y-5 relative group/tier pr-12 md:pr-6">
                                                                        <button 
                                                                            type="button"
                                                                            disabled={newEventData.tiers.length <= 1}
                                                                            onClick={() => handleRemoveTier(idx)}
                                                                            className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-all z-20 ${
                                                                                newEventData.tiers.length > 1 
                                                                                    ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white cursor-pointer' 
                                                                                    : 'opacity-20 cursor-not-allowed text-gray-500'
                                                                            }`}
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>

                                                                        <div className="grid grid-cols-12 gap-4 items-center">
                                                                            {/* Category Name */}
                                                                            <div className="col-span-12 md:col-span-6 space-y-1.5 text-left">
                                                                                <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-2">Category Name</span>
                                                                                <input 
                                                                                    type="text"
                                                                                    placeholder="e.g. VIP Club Pass"
                                                                                    value={tier.name}
                                                                                    onChange={e => handleUpdateTier(idx, 'name', e.target.value)}
                                                                                    className="w-full bg-dark-900 border border-main rounded-xl px-4 py-3 text-xs md:text-sm lg:text-base font-bold text-primary focus:border-brand outline-none transition-all"
                                                                                />
                                                                            </div>

                                                                            {/* Price */}
                                                                            <div className="col-span-12 md:col-span-3 space-y-1.5 text-left">
                                                                                <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-2">Price (€)</span>
                                                                                <div className="relative">
                                                                                    <input 
                                                                                        type="number"
                                                                                        placeholder="35"
                                                                                        value={tier.price || ''}
                                                                                        onChange={e => handleUpdateTier(idx, 'price', e.target.value)}
                                                                                        className="w-full bg-dark-900 border border-main rounded-xl pl-8 pr-3 py-3 text-xs md:text-sm lg:text-base font-black italic text-brand focus:border-brand outline-none transition-all"
                                                                                    />
                                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs md:text-sm lg:text-base font-black italic text-brand/40">€</span>
                                                                                </div>
                                                                            </div>

                                                                            {/* Quantity */}
                                                                            <div className="col-span-12 md:col-span-3 space-y-1.5 text-left">
                                                                                <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-2">Allocation</span>
                                                                                <div className="relative">
                                                                                    <input 
                                                                                        type="number"
                                                                                        placeholder="500"
                                                                                        value={tier.quantity || ''}
                                                                                        onChange={e => handleUpdateTier(idx, 'quantity', e.target.value)}
                                                                                        className="w-full bg-dark-900 border border-main rounded-xl pl-8 pr-3 py-3 text-xs md:text-sm lg:text-base font-black italic text-brand focus:border-brand outline-none transition-all"
                                                                                    />
                                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs md:text-sm lg:text-base font-black italic text-brand/40">#</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* PER-CATEGORY MANIFEST UPLOADER */}
                                                                        {/* PER-CATEGORY MANIFEST UPLOADER */}
                                                                        <div className="pt-4 border-t border-white/5 text-left space-y-3">
                                                                            <span className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-widest ml-2">
                                                                                {managerContext === 'CM' ? 'Manifest Documents / Pictures' : 'Manifest Document'} ({tier.name || 'Category'})
                                                                            </span>
                                                                            
                                                                            <input 
                                                                                type="file"
                                                                                id={`file-input-${idx}`}
                                                                                multiple={managerContext === 'CM'}
                                                                                onChange={(e) => handleTierFileChange(idx, e)}
                                                                                accept=".pdf,image/*,.csv,.xlsx,.xml"
                                                                                className="hidden"
                                                                            />

                                                                            {managerContext === 'CM' ? (
                                                                                /* Club Manager: Multi-file / picture layout */
                                                                                <>
                                                                                    {/* File Lists / Grid */}
                                                                                    {((tier.files && tier.files.length > 0) || tier.file) && (
                                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                                            {tier.file && (!tier.files || !tier.files.some(f => f.name === tier.file.name)) && (
                                                                                                <div className="p-3 bg-brand/5 border border-brand/20 rounded-xl flex items-center justify-between animate-fadeIn relative z-10 w-full">
                                                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                                                        {tier.file.url ? (
                                                                                                            <img src={tier.file.url} className="w-10 h-10 rounded-lg object-cover border border-brand/20 shrink-0" alt="Preview" />
                                                                                                        ) : (
                                                                                                            <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand text-xs md:text-sm lg:text-base font-bold border border-brand/20 shrink-0">
                                                                                                                <FileText size={16} className={tier.file.name.endsWith('.pdf') ? 'text-red-400' : ''} />
                                                                                                            </div>
                                                                                                        )}
                                                                                                        <div className="min-w-0">
                                                                                                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-primary truncate max-w-[140px]">{tier.file.name}</p>
                                                                                                            <p className="text-[7.5px] font-black text-brand uppercase tracking-widest">{tier.file.size} • Legacy</p>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <button 
                                                                                                        type="button"
                                                                                                        onClick={() => handleRemoveTierFile(idx, -1)}
                                                                                                        className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shrink-0"
                                                                                                    >
                                                                                                        <Trash2 size={12} />
                                                                                                    </button>
                                                                                                </div>
                                                                                            )}

                                                                                            {tier.files?.map((file, fIdx) => (
                                                                                                <div key={fIdx} className="p-3 bg-brand/5 border border-brand/20 rounded-xl flex items-center justify-between animate-fadeIn relative z-10 w-full">
                                                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                                                        {file.url ? (
                                                                                                            <img src={file.url} className="w-10 h-10 rounded-lg object-cover border border-brand/20 shrink-0" alt="Preview" />
                                                                                                        ) : (
                                                                                                            <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand text-xs md:text-sm lg:text-base font-bold border border-brand/20 shrink-0">
                                                                                                                <FileText size={16} className={file.name.endsWith('.pdf') ? 'text-red-400' : ''} />
                                                                                                            </div>
                                                                                                        )}
                                                                                                        <div className="min-w-0">
                                                                                                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase text-primary truncate max-w-[140px]">{file.name}</p>
                                                                                                            <p className="text-[7.5px] font-black text-brand uppercase tracking-widest">{file.size}</p>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <button 
                                                                                                        type="button"
                                                                                                        onClick={() => handleRemoveTierFile(idx, fIdx)}
                                                                                                        className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shrink-0"
                                                                                                    >
                                                                                                        <Trash2 size={12} />
                                                                                                    </button>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Action Buttons Area */}
                                                                                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => document.getElementById(`file-input-${idx}`).click()}
                                                                                            className="flex-1 py-3 border-2 border-dashed border-main hover:border-brand/40 hover:bg-brand/5 rounded-xl text-center transition-all flex items-center justify-center gap-2 group/upload w-full"
                                                                                        >
                                                                                            <Upload size={12} className="text-secondary group-hover/upload:text-brand" />
                                                                                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-secondary group-hover/upload:text-brand">
                                                                                                {((tier.files && tier.files.length > 0) || tier.file) ? 'Add More Pictures / Files' : `Upload ${tier.name || 'Category'} Manifest`}
                                                                                            </span>
                                                                                        </button>

                                                                                        {((tier.files && tier.files.length > 0) || tier.file) && (
                                                                                            <button 
                                                                                                type="button"
                                                                                                onClick={() => handleSimulateTierUpload(idx)}
                                                                                                disabled={tier.isSimulating}
                                                                                                className={`w-full sm:w-auto px-5 py-3 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest transition-all ${
                                                                                                    tier.verified 
                                                                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                                                                                        : 'bg-brand/15 hover:bg-brand/25 text-brand border border-brand/20'
                                                                                                }`}
                                                                                            >
                                                                                                {tier.isSimulating ? 'Processing...' : tier.verified ? 'Verified ✓' : 'Verify Tickets'}
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                /* Other contexts (e.g. Stadium Manager): Single-file manifest layout */
                                                                                <div className="flex gap-3 items-center w-full">
                                                                                    {tier.file ? (
                                                                                        <div className="flex-1 p-3.5 bg-brand/5 border border-brand/20 rounded-xl flex items-center justify-between animate-fadeIn relative z-10 w-full">
                                                                                            <div className="flex items-center gap-3">
                                                                                                <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center text-brand text-xs md:text-sm lg:text-base font-bold border border-brand/20">
                                                                                                    {tier.file.name.endsWith('.pdf') ? <FileText size={16} className="text-red-400" /> : <FileText size={16} />}
                                                                                                </div>
                                                                                                <div>
                                                                                                    <p className="text-[10.5px] font-black uppercase text-primary truncate max-w-[180px]">{tier.file.name}</p>
                                                                                                    <p className="text-[7.5px] font-black text-brand uppercase tracking-widest">{tier.file.size} • {tier.verified ? 'VERIFIED ✓' : 'UNVERIFIED'}</p>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex gap-2">
                                                                                                <button 
                                                                                                    type="button"
                                                                                                    onClick={() => handleSimulateTierUpload(idx)}
                                                                                                    disabled={tier.isSimulating}
                                                                                                    className={`px-3 py-1.5 rounded-lg text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all ${tier.verified ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-brand/15 hover:bg-brand/25 text-brand border border-brand/20'}`}
                                                                                                >
                                                                                                    {tier.isSimulating ? 'Processing...' : tier.verified ? 'Re-Verify' : 'Verify'}
                                                                                                </button>
                                                                                                <button 
                                                                                                    type="button"
                                                                                                    onClick={() => handleRemoveTierFile(idx, 0)}
                                                                                                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                                                                                >
                                                                                                    Remove
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => document.getElementById(`file-input-${idx}`).click()}
                                                                                            className="w-full py-4 border-2 border-dashed border-main hover:border-brand/40 hover:bg-brand/5 rounded-xl text-center transition-all flex items-center justify-center gap-2 group/upload"
                                                                                        >
                                                                                            <Upload size={12} className="text-secondary group-hover/upload:text-brand" />
                                                                                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-secondary group-hover/upload:text-brand">Upload {tier.name || 'Category'} Manifest Document (PDF, Photo, Spreadsheet)</span>
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-4 pt-6">
                                                        <button 
                                                            onClick={handleAddEvent}
                                                            className="flex-1 py-4 md:py-6 bg-brand text-dark-900 rounded-[2.5rem] text-xs md:text-sm lg:text-base font-black uppercase tracking-[0.2em] md:tracking-[0.3em] shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all text-center"
                                                        >
                                                            Commit Batch
                                                        </button>
                                                        <button 
                                                            onClick={() => setIsAddingEvent(false)}
                                                            className="flex-1 md:flex-initial px-4 md:px-10 py-4 md:py-6 bg-btn-sec border border-main rounded-[2.5rem] text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-secondary hover:text-primary transition-all text-center"
                                                        >
                                                            Abort
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    </motion.div>
                                )
                            }

                            {view === 'hotel-rooms' && managerContext === 'HM' && (
                                <motion.div key="hotel-rooms" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10 pb-20">
                                    <div className="flex flex-col md:flex-row gap-6 md:justify-between md:items-end">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand"><DoorOpen size={24} /></div>
                                                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-primary">Room <span className="text-brand">Hub</span></h1>
                                            </div>
                                            <p className="text-secondary text-xs md:text-sm font-bold uppercase tracking-widest leading-none">Automated Property Management • Mews Integration</p>
                                        </div>
                                        <div className="flex gap-4 w-full md:w-auto">
                                            <div className="flex-1 md:flex-initial px-4 md:px-6 py-3 bg-btn-sec border border-main rounded-xl text-right">
                                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest">Available Rooms</p>
                                                <p className="text-sm md:text-xl font-black italic text-brand leading-none mt-1">
                                                    {roomsData.filter(r => r.status === 'available').length} / {roomsData.length}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                        {/* ROOMS GRID */}
                                        <div className="lg:col-span-8 space-y-6">
                                            <div className="bg-glass border border-main rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[100px] rounded-full -mr-20 -mt-20 opacity-40" />
                                                
                                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                                                    <h3 className="text-lg font-black italic uppercase text-primary tracking-tight">Room Inventory Visualizer</h3>
                                                    <div className="flex gap-4 text-[9px] md:text-[11px] lg:text-xs font-black uppercase">
                                                        <span className="flex items-center gap-1.5 text-brand"><div className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_8px_var(--brand)]" /> Available</span>
                                                        <span className="flex items-center gap-1.5 text-violet-400"><div className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)]" /> Occupied</span>
                                                        <span className="flex items-center gap-1.5 text-amber-500"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" /> Cleaning</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {roomsData.map((room) => {
                                                        const isAvail = room.status === 'available';
                                                        const isOcc = room.status === 'occupied';
                                                        const isClean = room.status === 'cleaning';
                                                        
                                                        let statusColor = 'border-brand hover:border-brand/40';
                                                        let glowColor = 'shadow-[0_0_20px_rgba(33,255,165,0.05)]';
                                                        let badgeColor = 'bg-brand/10 text-brand border border-brand/20';
                                                        
                                                        if (isOcc) {
                                                            statusColor = 'border-violet-500/30 hover:border-violet-500';
                                                            glowColor = 'shadow-[0_0_25px_rgba(139,92,246,0.05)]';
                                                            badgeColor = 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
                                                        } else if (isClean) {
                                                            statusColor = 'border-amber-500/30 hover:border-amber-500';
                                                            glowColor = 'shadow-[0_0_20px_rgba(245,158,11,0.05)]';
                                                                badgeColor = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
                                                        }
                                                        
                                                        return (
                                                            <div 
                                                                key={room.id}
                                                                className={`p-6 bg-dark-900/60 backdrop-blur-xl border rounded-[2rem] transition-all duration-300 ${statusColor} ${glowColor} group`}
                                                            >
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div>
                                                                        <span className="text-[10px] md:text-xs lg:text-sm font-black text-secondary tracking-widest uppercase">Room</span>
                                                                        <p className="text-2xl font-black italic text-primary leading-none mt-1">#{room.id}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span 
                                                                            onClick={() => handleToggleRoomStatus(room.id)}
                                                                            className={`px-3 py-1 rounded-full text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-wider cursor-pointer select-none hover:scale-105 active:scale-95 transition-all ${badgeColor}`}
                                                                            title="Click to toggle status"
                                                                        >
                                                                            {room.status}
                                                                        </span>
                                                                        {!pmsApiKey && (
                                                                            <button 
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (confirm(`Remove Room #${room.id} from inventory?`)) {
                                                                                        const updated = roomsData.filter(r => r.id !== room.id);
                                                                                        saveRooms(updated);
                                                                                    }
                                                                                }}
                                                                                className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] md:text-xs lg:text-sm transition-all flex items-center justify-center shrink-0 w-6 h-6 border border-red-500/20"
                                                                                title="Delete Room"
                                                                            >
                                                                                <X size={12} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4 pt-4 border-t border-white/5">
                                                                    <div className="flex justify-between items-end">
                                                                        <div>
                                                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase">Room Category</p>
                                                                            <p className="text-xs md:text-sm lg:text-base font-black uppercase italic text-primary mt-0.5">{room.name}</p>
                                                                            {room.bedLayout && (
                                                                                <span className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-wider text-brand bg-brand/5 border border-brand/15 px-2 py-0.5 rounded-md mt-1.5 inline-block">
                                                                                    {room.bedLayout} Bed
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs md:text-sm lg:text-base font-black text-brand italic">€{room.price}<span className="text-[8px] md:text-[10px] lg:text-xs text-secondary font-bold">/n</span></p>
                                                                    </div>

                                                                    <div className="flex items-center gap-3 pt-2 bg-black/20 rounded-xl p-3 border border-white/5">
                                                                        <div className={`w-2 h-2 rounded-full ${isAvail ? 'bg-brand' : isOcc ? 'bg-violet-500' : 'bg-amber-500'}`} />
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase">Live Occupant</p>
                                                                            <p className="text-[10px] md:text-xs lg:text-sm font-black text-primary truncate uppercase italic">
                                                                                {room.guest || 'Ready for Check-In'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* PMS INTEGRATION BRIDGE */}
                                        <div className="lg:col-span-4 space-y-8">
                                            <div className="bg-dark-900 border border-main rounded-[3rem] p-10 space-y-8 shadow-2xl sticky top-6">
                                                <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                                                    <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                                                        <Zap size={22} className={pmsConnected ? 'animate-pulse' : ''} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black italic uppercase text-primary">PMS Integration Bridge</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className={`w-2 h-2 rounded-full ${pmsApiKey ? 'bg-brand animate-ping' : 'bg-amber-500'}`} />
                                                            <p className={`text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest ${pmsApiKey ? 'text-brand' : 'text-amber-500'}`}>
                                                                {pmsApiKey ? 'ACTIVE & SYNCHRONIZED' : 'OFFLINE / DIRECT MANUAL MODE'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-2">Integration Provider</label>
                                                        <div className="px-6 py-4 bg-btn-sec border border-main rounded-2xl text-xs md:text-sm lg:text-base font-black uppercase text-primary">
                                                            {pmsApiKey ? 'Mews Property Management (API v3)' : 'LOCAL MANUAL INVENTORY'}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-2">Mews API Auth Key</label>
                                                        <input 
                                                            type="text" 
                                                            value={pmsApiKey} 
                                                            onChange={(e) => setPmsApiKey(e.target.value)}
                                                            placeholder="Clear key to add rooms manually"
                                                            className="w-full bg-btn-sec border border-main rounded-2xl p-4 text-[9px] md:text-[11px] lg:text-xs font-mono text-brand focus:border-brand outline-none transition-all placeholder:text-gray-600"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-2">Reservation Notification Email</label>
                                                        <input 
                                                            type="email" 
                                                            value={reservationEmail} 
                                                            onChange={(e) => setReservationEmail(e.target.value)}
                                                            placeholder="hotel@business.com (For manual bookings)"
                                                            className="w-full bg-btn-sec border border-main rounded-2xl p-4 text-[9px] md:text-[11px] lg:text-xs font-mono text-primary focus:border-brand outline-none transition-all placeholder:text-gray-600"
                                                        />
                                                    </div>

                                                    {!pmsApiKey ? (
                                                        <div className="space-y-3 pt-3 border-t border-white/5 animate-in fade-in duration-300">
                                                            <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand uppercase tracking-widest">Manual Room Dispatch</p>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Room #" 
                                                                    value={newRoomNumber} 
                                                                    onChange={(e) => setNewRoomNumber(e.target.value)} 
                                                                    className="bg-btn-sec border border-main rounded-xl p-3 text-xs md:text-sm lg:text-base text-primary focus:border-brand outline-none" 
                                                                />
                                                                <input 
                                                                    type="number" 
                                                                    placeholder="Price (€)" 
                                                                    value={newRoomPrice} 
                                                                    onChange={(e) => setNewRoomPrice(e.target.value)} 
                                                                    className="bg-btn-sec border border-main rounded-xl p-3 text-xs md:text-sm lg:text-base text-primary focus:border-brand outline-none" 
                                                                />
                                                            </div>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Category (e.g. Deluxe Room)" 
                                                                value={newRoomCategory} 
                                                                onChange={(e) => setNewRoomCategory(e.target.value)} 
                                                                className="w-full bg-btn-sec border border-main rounded-xl p-3 text-xs md:text-sm lg:text-base text-primary focus:border-brand outline-none" 
                                                            />
                                                            <select 
                                                                value={newRoomBedLayout}
                                                                onChange={(e) => setNewRoomBedLayout(e.target.value)}
                                                                className="w-full bg-btn-sec border border-main rounded-xl p-3 text-xs md:text-sm lg:text-base text-primary focus:border-brand outline-none appearance-none cursor-pointer"
                                                            >
                                                                <option value="Single" className="bg-dark-900 text-primary">Single Bed (Einzelbett)</option>
                                                                <option value="Double" className="bg-dark-900 text-primary">Double Bed (Doppelbett)</option>
                                                                <option value="Triple" className="bg-dark-900 text-primary">Triple Bed (Dreibett)</option>
                                                            </select>
                                                            <button 
                                                                onClick={handleCreateManualRoom} 
                                                                className="w-full py-3 bg-brand text-dark-900 rounded-xl text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-md shadow-brand/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                            >
                                                                <PlusCircle size={10} /> Add Room
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="pt-3 border-t border-white/5 space-y-1">
                                                            <p className="text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-widest leading-none">Security Telemetry</p>
                                                            <p className="text-[10px] md:text-xs lg:text-sm font-black italic text-primary mt-1">SSL & Webhook Shield Active</p>
                                                        </div>
                                                    )}
                                                </div>


                                                {/* WEBHOOK TERMINAL LOGS */}
                                                <div className="space-y-4 pt-4 border-t border-white/5">
                                                    <h5 className="text-[9px] md:text-[11px] lg:text-xs font-black italic uppercase text-secondary tracking-widest">Real-time Webhook Console</h5>
                                                    <div className="h-48 bg-black/60 border border-main rounded-2xl p-4 overflow-y-auto font-mono text-[8px] md:text-[10px] lg:text-xs text-green-400 space-y-3 scrollbar-thin">
                                                        {pmsLog.map((log, idx) => (
                                                            <div key={idx} className="border-b border-white/5 pb-2">
                                                                <span className="text-secondary">[{log.time}]</span>{' '}
                                                                <span className={log.type === 'checkin' ? 'text-brand font-black' : log.type === 'override' ? 'text-amber-400' : 'text-primary'}>
                                                                    {log.message}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            </AnimatePresence>
                        )}
                    </div>
                    <AnimatePresence>
                        {showSecurityGate && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-dark-950/90 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center">
                                <div className="w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center text-brand mb-8 border border-brand/20 shadow-[0_0_50px_rgba(52,211,153,0.3)]"><ShieldCheck size={48} /></div>
                                <h2 className="text-4xl font-black italic tracking-tighter uppercase text-primary mb-2">
                                    {(managerContext === 'PM' || managerContext === 'WM') ? 'Security Gate' : 'Vault Locked'}
                                </h2>
                                <p className="max-w-sm text-secondary font-bold uppercase tracking-widest text-[10px] md:text-xs lg:text-sm mb-10">Manager Identity Verification Required</p>
                                <div className="w-full max-w-xs space-y-4">
                                    <input type="password" value={passInput} onChange={e => setPassInput(e.target.value)} className="w-full bg-btn-sec border border-main rounded-2xl p-6 text-center text-2xl font-black tracking-[0.5em] text-brand outline-none focus:border-brand transition-all" placeholder="••••" />
                                    <div className="flex gap-4">
                                        <button onClick={() => { if(passInput === securityPassword) { setIsUnlocked(true); setShowSecurityGate(false); } }} className="flex-1 py-5 bg-brand text-dark-900 rounded-2xl font-black uppercase text-xs md:text-sm lg:text-base shadow-2xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all">Unlock</button>
                                        <button onClick={() => setShowSecurityGate(false)} className="flex-1 py-5 bg-btn-sec text-secondary rounded-2xl font-black uppercase text-xs md:text-sm lg:text-base hover:bg-white/10 transition-all">Cancel</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>




                </main>
            </div>

            <Sidebar 
                                                isOpen={isSidebarOpen} 
                                                onClose={() => setIsSidebarOpen(false)} 
                                                currentRole={simRole}
                                                onItemClick={(id) => {
                                                    setView(id);
                                                    setIsSidebarOpen(false);
                                                }}
                                            />
            {/* GUEST DETAILS MODAL */}
            <AnimatePresence>
                {selectedGuest && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedGuest(null)}
                            className="fixed inset-0 bg-dark-950/80 backdrop-blur-xl z-[300]"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 m-auto w-full max-w-xl h-fit max-h-[90vh] z-[301] p-6 flex flex-col"
                        >
                            <div className="bg-glass border-2 border-brand/20 rounded-[3rem] p-8 md:p-12 relative overflow-y-auto no-scrollbar shadow-2xl flex-1 max-h-[85vh]">
                                <div className="absolute top-0 right-0 p-8 z-10">
                                    <button onClick={() => setSelectedGuest(null)} className="w-12 h-12 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-12">
                                    <div className="flex items-center gap-8">
                                        <div className="w-24 h-24 bg-dark-900 border-2 border-brand rounded-3xl flex items-center justify-center text-brand animate-pulse">
                                            <User size={40} />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <h2 className="text-4xl font-black italic uppercase text-primary tracking-tighter">{selectedGuest.guest}</h2>
                                                <span className="px-3 py-1 bg-brand/10 border border-brand/20 rounded-full text-[8px] md:text-[10px] lg:text-xs font-black text-brand uppercase tracking-widest">
                                                    {managerContext === 'HM' ? 'Hotel Guest' : 'Venue Guest'}
                                                </span>
                                            </div>
                                            <p className="text-xs md:text-sm lg:text-base font-bold text-secondary uppercase tracking-widest opacity-60">Verified Grien Network Member</p>
                                        </div>
                                    </div>

                                    {managerContext === 'HM' ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest">Total Visits</span>
                                                        <Activity size={14} className="text-brand" />
                                                    </div>
                                                    <p className="text-2xl font-black italic text-primary">{selectedGuest.visits || '12'}</p>
                                                </div>
                                                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest">Last Stay</span>
                                                        <Calendar size={14} className="text-brand" />
                                                    </div>
                                                    <p className="text-2xl font-black italic text-primary">{selectedGuest.lastStay || 'April 2026'}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <Shield size={14} className="text-brand" />
                                                    <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest opacity-60">Identity & Location</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="flex flex-col gap-1 p-5 bg-dark-900 rounded-2xl border border-main">
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-widest">Full Address</span>
                                                        <span className="text-sm font-black text-primary">{selectedGuest.address || 'Königsallee 12, 40212 Düsseldorf'}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1 p-5 bg-dark-900 rounded-2xl border border-main">
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-widest">ID / Passport Number</span>
                                                        <span className="text-sm font-black text-brand tracking-widest">{selectedGuest.idNumber || 'PA-99281-XM'}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1 p-5 bg-dark-900 rounded-2xl border border-main">
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-widest">Date of Birth</span>
                                                        <span className="text-sm font-black text-primary">{selectedGuest.dob || 'May 12, 1992'}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1 p-5 bg-dark-900 rounded-2xl border border-main">
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-widest">Security Status</span>
                                                        <span className="text-sm font-black text-brand uppercase tracking-tighter italic">Verified Member</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <Smartphone size={14} className="text-brand" />
                                                    <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest opacity-60">Contact Information</span>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center p-5 bg-dark-900 rounded-2xl border border-main">
                                                        <span className="text-[10px] md:text-xs lg:text-sm font-bold text-secondary uppercase tracking-widest">Phone</span>
                                                        <span className="text-sm font-black text-primary">{selectedGuest.phone || '+49 176 4421 8892'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-5 bg-dark-900 rounded-2xl border border-main">
                                                        <span className="text-[10px] md:text-xs lg:text-sm font-bold text-secondary uppercase tracking-widest">Email</span>
                                                        <span className="text-sm font-black text-primary">{selectedGuest.email || 'guest@green-social.com'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                        </>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest">{selectedGuest.type === 'Stay Booking' || selectedGuest.type === 'Room Service' ? 'Room' : selectedGuest.type === 'Stadium E-Ticket' || selectedGuest.type === 'Club Event Ticket' ? 'Ticket Details' : 'Table / Unit'}</span>
                                                        <ShoppingBag size={14} className="text-brand" />
                                                    </div>
                                                    <p className="text-2xl font-black italic text-brand">{selectedGuest.type === 'Stay Booking' || selectedGuest.type === 'Room Service' ? `Room ${selectedGuest.room}` : selectedGuest.type === 'Stadium E-Ticket' || selectedGuest.type === 'Club Event Ticket' ? `ID ${selectedGuest.id?.toString()?.replace('#', '')}` : `Table ${selectedGuest.table || 'N/A'}`}</p>
                                                </div>
                                                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest">Order ID</span>
                                                        <Timer size={14} className="text-brand" />
                                                    </div>
                                                    <p className="text-2xl font-black italic text-primary">{selectedGuest.id}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <ShoppingBag size={14} className="text-brand" />
                                                    <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest opacity-60">Ordered Items</span>
                                                </div>
                                                <div className="space-y-3">
                                                    {selectedGuest.items && selectedGuest.items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center p-5 bg-dark-900 rounded-2xl border border-main">
                                                            <span className="text-[10px] md:text-xs lg:text-sm font-bold text-secondary uppercase tracking-widest">{item.name || `Item ${idx + 1}`}</span>
                                                            <span className="text-sm font-black text-brand italic">{typeof item === 'object' ? `€${(item.price || 0).toFixed(2)}` : item}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-8 border-t border-main flex gap-4">
                                                <button onClick={() => setSelectedGuest(null)} className="flex-1 h-14 bg-brand text-dark-900 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-3">
                                                    <Check size={16} />
                                                    Close Details
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* STRIPE CONNECTION & BANK ACCOUNT MODAL */}
            <AnimatePresence>
                {isStripeModalOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsStripeModalOpen(false)}
                            className="fixed inset-0 bg-dark-950/80 backdrop-blur-xl z-[300]"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] md:w-full max-w-xl h-auto max-h-[90vh] z-[301] p-2 md:p-6 flex flex-col"
                        >
                            <div className="bg-glass border-2 border-brand/20 rounded-[2.5rem] p-6 md:p-12 relative overflow-y-auto no-scrollbar shadow-2xl flex-1 max-h-full text-primary">
                                <div className="absolute top-0 right-0 p-4 md:p-8 z-10">
                                    <button onClick={() => setIsStripeModalOpen(false)} className="w-10 h-10 md:w-12 md:h-12 bg-btn-sec border border-main rounded-2xl flex items-center justify-center text-secondary hover:text-primary transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-brand/10 border-2 border-brand/35 rounded-3xl flex items-center justify-center text-brand">
                                            <CreditCard size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black italic uppercase text-primary tracking-tighter leading-none">
                                                Connect Stripe
                                            </h2>
                                            <p className="text-[9px] md:text-[11px] lg:text-xs font-bold text-secondary uppercase tracking-[0.2em] mt-1.5 leading-none">Stripe Connect & Bank Settlements</p>
                                        </div>
                                    </div>

                                    {/* CONNECT EXISTING PROFILE FLOW */}
                                    <div className="space-y-6">
                                        <p className="text-[10px] md:text-xs lg:text-sm text-secondary font-bold uppercase tracking-wide leading-relaxed opacity-75">
                                            Input your existing Stripe Connected Account ID to link payments directly from your venue sessions.
                                        </p>
                                        
                                        <div className="space-y-2">
                                            <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest block ml-1">Stripe Account ID</label>
                                            <input 
                                                type="text"
                                                value={stripeInputId}
                                                onChange={(e) => setStripeInputId(e.target.value)}
                                                placeholder="acct_1N8hXm2e..."
                                                className="w-full bg-btn-sec border border-main rounded-2xl py-4 px-6 text-sm font-black text-primary placeholder:text-gray-400/70 focus:outline-none focus:border-brand/40 shadow-inner"
                                            />
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-main">
                                            <p className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest ml-1">Configure Payout Bank Details</p>
                                            
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest block ml-1">Bank Name</label>
                                                    <input 
                                                        type="text"
                                                        value={stripeFormBankName}
                                                        onChange={(e) => setStripeFormBankName(e.target.value)}
                                                        placeholder="e.g. Deutsche Bank"
                                                        className="w-full bg-btn-sec border border-main rounded-2xl py-3 px-5 text-xs md:text-sm lg:text-base font-bold text-primary placeholder:text-gray-400/70 focus:outline-none focus:border-brand/40"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest block ml-1">IBAN / Account Number</label>
                                                    <input 
                                                        type="text"
                                                        value={stripeFormIban}
                                                        onChange={(e) => setStripeFormIban(e.target.value)}
                                                        placeholder="DE89 3704 0044..."
                                                        className="w-full bg-btn-sec border border-main rounded-2xl py-3 px-5 text-xs md:text-sm lg:text-base font-bold text-primary placeholder:text-gray-400/70 focus:outline-none focus:border-brand/40"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black text-secondary uppercase tracking-widest block ml-1">Routing Code / BIC</label>
                                                    <input 
                                                        type="text"
                                                        value={stripeFormRouting}
                                                        onChange={(e) => setStripeFormRouting(e.target.value)}
                                                        placeholder="DEUTDEDBXXX"
                                                        className="w-full bg-btn-sec border border-main rounded-2xl py-3 px-5 text-xs md:text-sm lg:text-base font-bold text-primary placeholder:text-gray-400/70 focus:outline-none focus:border-brand/40"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => {
                                                if (!stripeInputId.trim() || !stripeFormIban.trim()) {
                                                    alert("Validation Error:\nPlease provide a valid Stripe Account ID and Bank IBAN.");
                                                    return;
                                                }
                                                setStripeLoading(true);
                                                setTimeout(() => {
                                                    setStripeLoading(false);
                                                    setStripeConnected(true);
                                                    setStripeAccountId(stripeInputId);
                                                    setStripeBankName(stripeFormBankName || 'Stripe Connected Bank');
                                                    setStripeBankIban(stripeFormIban);
                                                    setStripeBankRouting(stripeFormRouting);
                                                    
                                                    localStorage.setItem('green_partner_stripe_connected', 'true');
                                                    localStorage.setItem('green_partner_stripe_acc_id', stripeInputId);
                                                    localStorage.setItem('green_partner_bank_name', stripeFormBankName || 'Stripe Connected Bank');
                                                    localStorage.setItem('green_partner_bank_iban', stripeFormIban);
                                                    localStorage.setItem('green_partner_bank_routing', stripeFormRouting);
                                                    
                                                    setIsStripeModalOpen(false);
                                                    alert("STRIPE SECURE CONNECT SUCCESSFUL\n-------------------------------\nPlatform Account Linked!\nBank Details verified for weekly settlement.");
                                                }, 1800);
                                            }}
                                            disabled={stripeLoading}
                                            className="w-full py-5 bg-brand text-dark-900 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {stripeLoading ? (
                                                <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <span>Lock Connection Gateway</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* GUEST MESSAGING MODAL */}
            <AnimatePresence>
                {messageOrder && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMessageOrder(null)}
                            className="fixed inset-0 bg-dark-950/80 backdrop-blur-xl z-[300]"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 m-auto w-full max-w-xl h-fit max-h-[90vh] z-[301] p-6 flex flex-col"
                        >
                            <div className="bg-glass border-2 border-brand/20 rounded-[3rem] p-8 md:p-12 relative overflow-y-auto no-scrollbar shadow-2xl flex-1 max-h-[85vh]">
                                <div className="absolute top-0 right-0 p-8 z-10">
                                    <button onClick={() => setMessageOrder(null)} className="w-12 h-12 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-10">
                                    {/* Modal Header */}
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center text-brand animate-pulse">
                                            <MessageCircle size={32} />
                                        </div>
                                        <div>
                                            <span className="text-[9px] md:text-[11px] lg:text-xs font-black text-brand uppercase tracking-widest bg-brand/10 px-3 py-1 rounded-full">
                                                Direct Dispatcher
                                            </span>
                                            <h2 className="text-3xl font-black italic uppercase text-primary tracking-tighter mt-1">
                                                Message to {messageOrder.guest}
                                            </h2>
                                            <p className="text-[10px] md:text-xs lg:text-sm font-bold text-secondary uppercase tracking-widest mt-1 opacity-60">
                                                {messageOrder.type === 'Stay Booking' || messageOrder.type === 'Room Service' ? 'Room ' : messageOrder.type === 'Stadium E-Ticket' || messageOrder.type === 'Club Event Ticket' ? 'Ticket Details: ' : 'Table '}
                                                {messageOrder.type === 'Stadium E-Ticket' || messageOrder.type === 'Club Event Ticket' ? (messageOrder.items ? messageOrder.items.map(i => typeof i === 'string' ? i : (i.name || '')).join(', ') : '') : (messageOrder.table || messageOrder.room || '')} • {messageOrder.id}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Fast Templates Selection */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] md:text-xs lg:text-sm font-black text-secondary uppercase tracking-widest opacity-60 flex items-center gap-2">
                                            <Star size={12} className="text-brand" />
                                            Quick Templates
                                        </label>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {[
                                                (messageOrder.type === 'Stadium E-Ticket' || messageOrder.type === 'Club Event Ticket') 
                                                ? `🎟️ Ihre E-Tickets wurden generiert und stehen im Portal bereit!` 
                                                : messageOrder.type === 'Room Service'
                                                ? `🍽️ Ihre Bestellung wird frisch für Ihr Zimmer zubereitet!`
                                                : `🍹 Ihre Getränke werden gerade frisch zubereitet!`,
                                                
                                                (messageOrder.type === 'Stadium E-Ticket' || messageOrder.type === 'Club Event Ticket')
                                                ? `📬 Bitte überprüfen Sie auch Ihren Spam-Ordner für die Bestätigungs-E-Mail (E-Mail 1)!`
                                                : messageOrder.type === 'Room Service'
                                                ? `🍔 Ihre Bestellung ist auf dem Weg zu Zimmer ${messageOrder.room || ''}!`
                                                : `🍔 Ihre ${messageOrder.items ? messageOrder.items.map(i => typeof i === 'string' ? i.split(' ').slice(1).join(' ') : (i.name || '')).join(', ') : 'Bestellung'} ist auf dem Weg zu Tisch ${messageOrder.table || ''}!`,
                                                
                                                (messageOrder.type === 'Stadium E-Ticket' || messageOrder.type === 'Club Event Ticket')
                                                ? `🎉 Einlass für ${messageOrder.items ? messageOrder.items.map(i => typeof i === 'string' ? i : (i.name || '')).join(', ') : 'Ihr Event'} hat begonnen. Bitte prüfen Sie Ihre Ticket-Details im Profil!`
                                                : `⏱️ Entschuldigung für die Verzögerung, wir beeilen uns!`,
                                                
                                                (messageOrder.type === 'Stadium E-Ticket' || messageOrder.type === 'Club Event Ticket')
                                                ? `✨ Wichtig: Bitte prüfen Sie die Ticket-Details sorgfältig!`
                                                : `✨ Ihre Bestellung wurde erfolgreich serviert! Guten Appetit!`
                                            ].map((template, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCustomMessage(template)}
                                                    className="w-full text-left p-4 bg-white/5 border border-white/10 rounded-2xl text-xs md:text-sm lg:text-base font-semibold text-primary hover:border-brand/40 hover:bg-white/10 transition-all text-ellipsis overflow-hidden whitespace-nowrap active:scale-98"
                                                >
                                                    {template}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Custom Message Field */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] md:text-xs lg:text-sm font-black text-secondary uppercase tracking-widest opacity-60 flex items-center gap-2">
                                            <User size={12} className="text-brand" />
                                            Custom Message Text
                                        </label>
                                        <textarea
                                            value={customMessage}
                                            onChange={(e) => setCustomMessage(e.target.value)}
                                            placeholder="Write your custom message here..."
                                            className="w-full h-32 p-6 bg-dark-900 border border-main rounded-2xl text-sm font-bold text-primary focus:outline-none focus:border-brand/40 resize-none no-scrollbar placeholder:text-secondary placeholder:opacity-40"
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-6 border-t border-main flex gap-4">
                                        <button 
                                            onClick={() => setMessageOrder(null)} 
                                            className="flex-1 h-14 bg-white/5 border-2 border-main rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-secondary hover:text-primary hover:border-white/20 transition-all flex items-center justify-center gap-3"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (!customMessage.trim()) return;
                                                if (socket) {
                                                    socket.emit('send-guest-message', {
                                                        orderId: messageOrder.id,
                                                        guest: messageOrder.guest,
                                                        table: messageOrder.type === 'Stay Booking' || messageOrder.type === 'Room Service' ? messageOrder.room : (messageOrder.type === 'Stadium E-Ticket' || messageOrder.type === 'Club Event Ticket' ? 'Ticket' : messageOrder.table),
                                                        message: customMessage
                                                    });
                                                }
                                                const locType = messageOrder.type === 'Stay Booking' || messageOrder.type === 'Room Service' ? 'Room ' : messageOrder.type === 'Stadium E-Ticket' || messageOrder.type === 'Club Event Ticket' ? 'Ticket: ' : 'Table ';
                                                const locValue = messageOrder.type === 'Stay Booking' || messageOrder.type === 'Room Service' ? messageOrder.room : messageOrder.type === 'Stadium E-Ticket' || messageOrder.type === 'Club Event Ticket' ? (messageOrder.items ? messageOrder.items.map(i => typeof i === 'string' ? i : (i.name || '')).join(', ') : '') : messageOrder.table;
                                                alert(`MESSAGE DISPATCHED\n------------------\nTo: ${messageOrder.guest} (${locType}${locValue})\nMessage: "${customMessage}"\n\nStatus: Sent & Synced.`);
                                                setMessageOrder(null);
                                            }}
                                            disabled={!customMessage.trim()}
                                            className={`flex-1 h-14 rounded-2xl text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                                                customMessage.trim() 
                                                ? 'bg-brand text-dark-900 hover:scale-105 active:scale-95 shadow-xl shadow-brand/20' 
                                                : 'bg-btn-sec text-secondary border border-main opacity-50 cursor-not-allowed'
                                            }`}
                                        >
                                            <Send size={16} />
                                            Send Message
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <PostsFeed isOpen={isFeedOpen} onClose={() => setIsFeedOpen(false)} />

            {/* REAL-TIME CASH ALERTS (Floating) */}
            <div className="fixed bottom-10 right-10 z-[200] space-y-4 max-w-sm w-full">
                <AnimatePresence>
                    {cashAlerts.map((alert) => (
                        <motion.div 
                            key={alert.orderId}
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 100, opacity: 0 }}
                            className="bg-white text-dark-950 p-6 rounded-[2rem] shadow-2xl flex items-center justify-between gap-4 border-2 border-brand"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand"><Banknote size={24} /></div>
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-tighter">Table {alert.tableId} Cash</h4>
                                    <p className="text-[10px] md:text-xs lg:text-sm font-bold text-secondary uppercase">Collect €{parseFloat(alert.amount).toFixed(2)}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleConfirmCash(alert)}
                                className="w-10 h-10 bg-brand text-dark-900 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                            >
                                <Check size={20} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            {/* ADD DRIVER MODAL */}
            <AnimatePresence>
                {isAddDriverOpen && (
                    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#0b0f19] border-2 border-cyan-500/40 rounded-[2.5rem] p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl text-white">
                            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-4">
                                <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-wider flex items-center gap-2.5 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]">
                                    <Users size={26} className="text-cyan-400" />
                                    <span>Neuen Fahrer Anmelden</span>
                                </h2>
                                <button onClick={() => setIsAddDriverOpen(false)} className="p-2 bg-white/10 hover:bg-cyan-500/20 rounded-xl text-gray-200 hover:text-white transition-all cursor-pointer border border-white/10">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-black uppercase text-cyan-200 block mb-1">Vollständiger Name *</label>
                                    <input type="text" value={newDriverForm.name} onChange={(e) => setNewDriverForm({ ...newDriverForm, name: e.target.value })} placeholder="z.B. Alex Neumann" className="w-full bg-white/10 border border-cyan-500/30 rounded-xl p-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black uppercase text-cyan-200 block mb-1">E-Mail Adresse *</label>
                                        <input type="email" value={newDriverForm.email} onChange={(e) => setNewDriverForm({ ...newDriverForm, email: e.target.value })} placeholder="alex@green-fleet.de" className="w-full bg-white/10 border border-cyan-500/30 rounded-xl p-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase text-cyan-200 block mb-1">Handynummer *</label>
                                        <input type="text" value={newDriverForm.phone} onChange={(e) => setNewDriverForm({ ...newDriverForm, phone: e.target.value })} placeholder="+49 176 1234567" className="w-full bg-white/10 border border-cyan-500/30 rounded-xl p-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black uppercase text-cyan-200 block mb-1">Führerschein-Nr. *</label>
                                        <input type="text" value={newDriverForm.licenseNumber} onChange={(e) => setNewDriverForm({ ...newDriverForm, licenseNumber: e.target.value })} placeholder="B092182019" className="w-full bg-white/10 border border-cyan-500/30 rounded-xl p-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase text-cyan-200 block mb-1">Fahrzeug Zuweisung</label>
                                        <select value={newDriverForm.vehicleAssigned} onChange={(e) => setNewDriverForm({ ...newDriverForm, vehicleAssigned: e.target.value })} className="w-full bg-dark-900 border border-cyan-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-400">
                                            <option value="Kein Fahrzeug">Kein Fahrzeug</option>
                                            {vehiclesList.map(v => (
                                                <option key={v.id} value={`${v.make} ${v.model} (${v.licensePlate})`}>{v.make} {v.model} ({v.licensePlate})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase text-cyan-200 block mb-1">Fahrer Foto (URL oder Upload)</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={newDriverForm.photoUrl} onChange={(e) => setNewDriverForm({ ...newDriverForm, photoUrl: e.target.value })} placeholder="https://..." className="flex-1 bg-white/10 border border-cyan-500/30 rounded-xl p-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400" />
                                        <label className="px-4 py-3 bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-black uppercase rounded-xl cursor-pointer hover:bg-cyan-500/30 transition-all flex items-center gap-1 shrink-0">
                                            + Upload
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const url = URL.createObjectURL(file);
                                                    setNewDriverForm({ ...newDriverForm, photoUrl: url });
                                                }
                                            }} />
                                        </label>
                                    </div>
                                </div>

                                {/* GESETZLICHE PFLICHT-DOKUMENTE FÜR FAHRER ANMELDUNG */}
                                <div className="pt-3 border-t border-cyan-500/30 space-y-3">
                                    <div className="bg-cyan-950/70 border border-cyan-500/50 p-2.5 rounded-xl flex items-center gap-2 text-cyan-300 shadow-md">
                                        <ShieldCheck size={18} className="text-cyan-400 shrink-0" />
                                        <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-cyan-200">
                                            Gesetzliche Pflicht-Nachweise (Fahrer)
                                        </h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                        {/* P-Schein */}
                                        <div className="p-3 bg-white/10 border border-cyan-500/30 rounded-xl space-y-1.5">
                                            <span className="text-xs font-black uppercase text-white block">1. P-Schein (§ 48 FeV) *</span>
                                            <label className="flex items-center justify-between p-2.5 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-200 text-xs font-black uppercase cursor-pointer hover:bg-cyan-500/30 transition-all shadow-sm">
                                                <span className="truncate">{newDriverForm.pScheinDoc?.name || '+ Upload PDF/Bild'}</span>
                                                <Upload size={14} className="shrink-0 text-cyan-300" />
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setNewDriverForm(prev => ({ ...prev, pScheinDoc: { name: file.name, fileData: URL.createObjectURL(file) } }));
                                                    }
                                                }} />
                                            </label>
                                        </div>

                                        {/* Führerschein */}
                                        <div className="p-3 bg-white/10 border border-cyan-500/30 rounded-xl space-y-1.5">
                                            <span className="text-xs font-black uppercase text-white block">2. Führerschein (Klasse B) *</span>
                                            <label className="flex items-center justify-between p-2.5 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-200 text-xs font-black uppercase cursor-pointer hover:bg-cyan-500/30 transition-all shadow-sm">
                                                <span className="truncate">{newDriverForm.fuehrerscheinDoc?.name || '+ Upload PDF/Bild'}</span>
                                                <Upload size={14} className="shrink-0 text-cyan-300" />
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setNewDriverForm(prev => ({ ...prev, fuehrerscheinDoc: { name: file.name, fileData: URL.createObjectURL(file) } }));
                                                    }
                                                }} />
                                            </label>
                                        </div>

                                        {/* Ausweis / Pass */}
                                        <div className="p-3 bg-white/10 border border-cyan-500/30 rounded-xl space-y-1.5">
                                            <span className="text-xs font-black uppercase text-white block">3. Personalausweis / Pass *</span>
                                            <label className="flex items-center justify-between p-2.5 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-200 text-xs font-black uppercase cursor-pointer hover:bg-cyan-500/30 transition-all shadow-sm">
                                                <span className="truncate">{newDriverForm.ausweisDoc?.name || '+ Upload PDF/Bild'}</span>
                                                <Upload size={14} className="shrink-0 text-cyan-300" />
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setNewDriverForm(prev => ({ ...prev, ausweisDoc: { name: file.name, fileData: URL.createObjectURL(file) } }));
                                                    }
                                                }} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                                <button onClick={() => setIsAddDriverOpen(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase text-gray-400 cursor-pointer">
                                    Abbrechen
                                </button>
                                <button onClick={() => {
                                    if (!newDriverForm.name || !newDriverForm.email) {
                                        alert("Bitte Name und E-Mail des Fahrers eingeben.");
                                        return;
                                    }
                                    const generatedCode = `DRV-${Math.floor(1000 + Math.random() * 9000)}-FM`;
                                    const created = {
                                        id: `drv_${Date.now()}`,
                                        ...newDriverForm,
                                        status: 'Wartend auf Admin-Freigabe',
                                        approvalStatus: 'Pending Admin Verification',
                                        accessCode: generatedCode,
                                        rating: 5.0,
                                        tripsCompleted: 0
                                    };
                                    setDriversList([...driversList, created]);
                                    setIsAddDriverOpen(false);
                                    setNewDriverForm({ name: '', phone: '', email: '', licenseNumber: '', vehicleAssigned: 'Kein Fahrzeug', status: 'Wartend auf Admin-Freigabe', approvalStatus: 'Pending Admin Verification', accessCode: null, photoUrl: '', pScheinDoc: null, fuehrerscheinDoc: null, ausweisDoc: null });
                                    alert(`✅ Fahrer "${created.name}" wurde angelegt!\n🔑 Flotten-Manager Code für Fahrer: ${generatedCode}\n(Diesen Code kann dein Fahrer bei der Registrierung eingeben, um sich exklusiv mit deinem Dashboard zu verbinden.)`);
                                }} className="px-8 py-3 bg-cyan-400 text-dark-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-lg hover:bg-cyan-300 hover:scale-105 transition-all cursor-pointer">
                                    Fahrer Anmelden
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ADD VEHICLE MODAL */}
            <AnimatePresence>
                {isAddVehicleOpen && (
                    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#0b0f19] border-2 border-cyan-500/40 rounded-[2.5rem] p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl text-white">
                            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-4">
                                <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-wider flex items-center gap-2.5 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]">
                                    <Car size={26} className="text-cyan-400" />
                                    <span>Neues Auto Anmelden</span>
                                </h2>
                                <button onClick={() => setIsAddVehicleOpen(false)} className="p-2 bg-white/10 hover:bg-cyan-500/20 rounded-xl text-gray-200 hover:text-white transition-all cursor-pointer border border-white/10">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black uppercase text-cyan-200 block mb-1">Marke *</label>
                                        <input type="text" value={newVehicleForm.make} onChange={(e) => setNewVehicleForm({ ...newVehicleForm, make: e.target.value })} placeholder="z.B. Tesla, Mercedes" className="w-full bg-white/10 border border-cyan-500/30 rounded-xl p-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase text-cyan-200 block mb-1">Modell *</label>
                                        <input type="text" value={newVehicleForm.model} onChange={(e) => setNewVehicleForm({ ...newVehicleForm, model: e.target.value })} placeholder="z.B. Model 3, EQS" className="w-full bg-white/10 border border-cyan-500/30 rounded-xl p-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black uppercase text-cyan-200 block mb-1">Amtliches Kennzeichen *</label>
                                        <input type="text" value={newVehicleForm.licensePlate} onChange={(e) => setNewVehicleForm({ ...newVehicleForm, licensePlate: e.target.value })} placeholder="F-GR 777E" className="w-full bg-white/10 border border-cyan-500/30 rounded-xl p-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 font-mono uppercase" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase text-cyan-200 block mb-1">Kategorie</label>
                                        <input type="text" value={newVehicleForm.category} onChange={(e) => setNewVehicleForm({ ...newVehicleForm, category: e.target.value })} placeholder="VIP Executive" className="w-full bg-white/10 border border-cyan-500/30 rounded-xl p-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase text-cyan-200 block mb-1">Fahrzeug-Zuweisung Fahrer</label>
                                    <select value={newVehicleForm.assignedDriver} onChange={(e) => setNewVehicleForm({ ...newVehicleForm, assignedDriver: e.target.value })} className="w-full bg-dark-900 border border-cyan-500/30 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-400">
                                        <option value="Kein Fahrer">Kein Fahrer</option>
                                        {driversList.map(d => (
                                            <option key={d.id} value={d.name}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-black uppercase text-cyan-300 block mb-1.5 flex items-center gap-1.5">
                                        <Camera size={14} className="text-cyan-400" /> Multi-Bilder Galerie Upload
                                    </label>
                                    <label className="w-full p-4 border-2 border-dashed border-cyan-400/50 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer shadow-inner">
                                        <Camera className="text-cyan-300" size={26} />
                                        <span className="text-xs font-black uppercase tracking-wider text-cyan-200">+ Upload Fahrzeug-Bilder</span>
                                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                                            const files = Array.from(e.target.files);
                                            if (files.length > 0) {
                                                const newUrls = files.map(f => URL.createObjectURL(f));
                                                setNewVehicleForm(prev => ({ ...prev, images: [...prev.images, ...newUrls] }));
                                            }
                                        }} />
                                    </label>

                                    {newVehicleForm.images.length > 0 && (
                                        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar">
                                            {newVehicleForm.images.map((img, i) => (
                                                <div key={i} className="relative w-16 h-12 rounded-lg overflow-hidden border border-cyan-500/30 shrink-0">
                                                    <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => setNewVehicleForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-bl-md">
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* GESETZLICHE PFLICHT-DOKUMENTE FÜR DEUTSCHE AUTO ANMELDUNG */}
                                <div className="pt-3 border-t border-cyan-500/30 space-y-3">
                                    <div className="bg-cyan-950/70 border border-cyan-500/50 p-2.5 rounded-xl flex items-center gap-2 text-cyan-300 shadow-md">
                                        <ShieldCheck size={18} className="text-cyan-400 shrink-0" />
                                        <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-cyan-200">
                                            Gesetzliche Pflicht-Nachweise
                                        </h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                        {/* Konzessionsschein */}
                                        <div className="p-3 bg-white/10 border border-cyan-500/30 rounded-xl space-y-1.5">
                                            <span className="text-xs font-black uppercase text-white block">1. Konzessionsschein (§ 49 PBefG) *</span>
                                            <label className="flex items-center justify-between p-2.5 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-200 text-xs font-black uppercase cursor-pointer hover:bg-cyan-500/30 transition-all shadow-sm">
                                                <span className="truncate">{newVehicleForm.konzessionDoc?.name || '+ Upload PDF/Bild'}</span>
                                                <Upload size={14} className="shrink-0 text-cyan-300" />
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setNewVehicleForm(prev => ({ ...prev, konzessionDoc: { name: file.name, fileData: URL.createObjectURL(file) } }));
                                                    }
                                                }} />
                                            </label>
                                        </div>

                                        {/* TÜV / HU */}
                                        <div className="p-3 bg-white/10 border border-cyan-500/30 rounded-xl space-y-1.5">
                                            <span className="text-xs font-black uppercase text-white block">2. TÜV / HU Prüfbericht *</span>
                                            <label className="flex items-center justify-between p-2.5 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-200 text-xs font-black uppercase cursor-pointer hover:bg-cyan-500/30 transition-all shadow-sm">
                                                <span className="truncate">{newVehicleForm.tuevDoc?.name || '+ Upload PDF/Bild'}</span>
                                                <Upload size={14} className="shrink-0 text-cyan-300" />
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setNewVehicleForm(prev => ({ ...prev, tuevDoc: { name: file.name, fileData: URL.createObjectURL(file) } }));
                                                    }
                                                }} />
                                            </label>
                                        </div>

                                        {/* Fahrzeugschein */}
                                        <div className="p-3 bg-white/10 border border-cyan-500/30 rounded-xl space-y-1.5">
                                            <span className="text-xs font-black uppercase text-white block">3. Fahrzeugschein (Teil I) *</span>
                                            <label className="flex items-center justify-between p-2.5 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-200 text-xs font-black uppercase cursor-pointer hover:bg-cyan-500/30 transition-all shadow-sm">
                                                <span className="truncate">{newVehicleForm.fahrzeugscheinDoc?.name || '+ Upload PDF/Bild'}</span>
                                                <Upload size={14} className="shrink-0 text-cyan-300" />
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setNewVehicleForm(prev => ({ ...prev, fahrzeugscheinDoc: { name: file.name, fileData: URL.createObjectURL(file) } }));
                                                    }
                                                }} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                                <button onClick={() => setIsAddVehicleOpen(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase text-gray-400 cursor-pointer">
                                    Abbrechen
                                </button>
                                <button onClick={() => {
                                    if (!newVehicleForm.make || !newVehicleForm.model || !newVehicleForm.licensePlate) {
                                        alert("Bitte Marke, Modell und Kennzeichen eingeben.");
                                        return;
                                    }
                                    const created = {
                                        id: `veh_${Date.now()}`,
                                        ...newVehicleForm,
                                        status: 'Wartend auf Admin-Freigabe',
                                        approvalStatus: 'Pending Admin Verification',
                                        images: newVehicleForm.images.length > 0 ? newVehicleForm.images : ['https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&fit=crop']
                                    };
                                    setVehiclesList([...vehiclesList, created]);
                                    setIsAddVehicleOpen(false);
                                    setNewVehicleForm({ make: '', model: '', licensePlate: '', year: '2024', category: 'VIP Executive', batteryLevel: 100, assignedDriver: 'Kein Fahrer', status: 'Wartend auf Admin-Freigabe', approvalStatus: 'Pending Admin Verification', ratePerHour: '90 € / Std.', images: [], konzessionDoc: null, tuevDoc: null, fahrzeugscheinDoc: null, versicherungsDoc: null });
                                    alert(`⏳ Auto "${created.make} ${created.model}" (${created.licensePlate}) wurde eingereicht!\nStatus: Wartend auf Admin-Freigabe.`);
                                }} className="px-8 py-3 bg-cyan-400 text-dark-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-lg hover:bg-cyan-300 hover:scale-105 transition-all cursor-pointer">
                                    Auto Anmelden
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* DRIVER CASH BREAKDOWN BOTTOM SHEET */}
            <AnimatePresence>
                {isDriverCashSheetOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDriverCashSheetOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                        />

                        {/* Bottom Sheet Container */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            className={`relative z-10 w-full max-w-4xl max-h-[85vh] rounded-t-[2.5rem] md:rounded-t-[3rem] p-6 md:p-8 flex flex-col shadow-2xl border-t border-x overflow-hidden ${
                                isLight 
                                    ? 'bg-white border-slate-200 text-slate-900' 
                                    : 'bg-dark-900 border-white/10 text-white'
                            }`}
                        >
                            {/* Drag Handle Indicator */}
                            <div className="w-14 h-1.5 rounded-full mx-auto mb-4 bg-slate-300 dark:bg-white/20"></div>

                            {/* Header */}
                            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black shrink-0 border border-emerald-500/20">
                                        <Banknote size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-lg md:text-xl font-black uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                Bargeldbestand Fahrer
                                            </h3>
                                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                                                {activeWeekMetrics.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={`hidden sm:flex flex-col text-right px-4 py-1.5 rounded-xl border ${isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                        <span className="text-[9px] uppercase font-black opacity-75">Gesamt bei Fahrern</span>
                                        <span className="text-base font-black italic">€{activeWeekMetrics.grossCash.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsDriverCashSheetOpen(false)}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Driver Cards Area */}
                            <div className="overflow-y-auto py-4 space-y-3.5 pr-1 max-h-[58vh]">
                                {activeWeekMetrics.isFuture ? (
                                    <div className={`p-10 rounded-3xl border text-center ${isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-black/30 border-white/5 text-slate-400'}`}>
                                        <Banknote size={40} className="mx-auto mb-3 text-emerald-500/60" />
                                        <h4 className={`text-base font-black uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                            Zukünftige Kalenderwoche ({activeWeekMetrics.label})
                                        </h4>
                                        <p className="text-xs opacity-75 mt-1 max-w-md mx-auto">
                                            In diesem Zeitraum liegen noch keine Fahrten vor. Die Kassenstände aller Fahrer stehen bei 0,00 €.
                                        </p>
                                    </div>
                                ) : (
                                    [
                                        {
                                            id: 'drv_1',
                                            name: 'Sami Rahimi',
                                            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&fit=crop',
                                            vehicle: 'Tesla Model S Plaid',
                                            plate: 'F-GR 777E',
                                            cashTrips: fleetPeriod === 'KW41' ? 14 : Math.round(14 * (activeWeekMetrics.tripsCash / 34)),
                                            cashAmount: fleetPeriod === 'KW41' ? 490.00 : Math.round(490.00 * (activeWeekMetrics.grossCash / 1240.00)),
                                            commissionAmount: fleetPeriod === 'KW41' ? 73.50 : Math.round(490.00 * (activeWeekMetrics.grossCash / 1240.00) * 0.15),
                                            netCash: fleetPeriod === 'KW41' ? 416.50 : Math.round(490.00 * (activeWeekMetrics.grossCash / 1240.00) * 0.85),
                                            status: '💵 Im Fahrzeug',
                                            statusBadge: 'emerald',
                                            shift: activeWeekMetrics.isCurrent ? 'Schichtende heute 18:00 Uhr • Letzte Fahrt: Vor 35 Min (€32,00)' : 'Schicht beendet • Wochenabrechnung archiviert'
                                        },
                                        {
                                            id: 'drv_2',
                                            name: 'Darius Meier',
                                            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop',
                                            vehicle: 'Mercedes-Benz EQS 450+',
                                            plate: 'F-GR 888E',
                                            cashTrips: fleetPeriod === 'KW41' ? 12 : Math.round(12 * (activeWeekMetrics.tripsCash / 34)),
                                            cashAmount: fleetPeriod === 'KW41' ? 430.00 : Math.round(430.00 * (activeWeekMetrics.grossCash / 1240.00)),
                                            commissionAmount: fleetPeriod === 'KW41' ? 64.50 : Math.round(430.00 * (activeWeekMetrics.grossCash / 1240.00) * 0.15),
                                            netCash: fleetPeriod === 'KW41' ? 365.50 : Math.round(430.00 * (activeWeekMetrics.grossCash / 1240.00) * 0.85),
                                            status: '💵 Im Fahrzeug',
                                            statusBadge: 'emerald',
                                            shift: activeWeekMetrics.isCurrent ? 'Schichtende heute 22:00 Uhr • Letzte Fahrt: Gestern, 16:15 (€26,00)' : 'Schicht beendet • Wochenabrechnung archiviert'
                                        },
                                        {
                                            id: 'drv_3',
                                            name: 'Elena Rostova',
                                            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&fit=crop',
                                            vehicle: 'Porsche Taycan 4S',
                                            plate: 'F-GR 999E',
                                            cashTrips: fleetPeriod === 'KW41' ? 8 : Math.max(0, activeWeekMetrics.tripsCash - Math.round(14 * (activeWeekMetrics.tripsCash / 34)) - Math.round(12 * (activeWeekMetrics.tripsCash / 34))),
                                            cashAmount: fleetPeriod === 'KW41' ? 320.00 : Math.max(0, activeWeekMetrics.grossCash - Math.round(490.00 * (activeWeekMetrics.grossCash / 1240.00)) - Math.round(430.00 * (activeWeekMetrics.grossCash / 1240.00))),
                                            commissionAmount: fleetPeriod === 'KW41' ? 48.00 : Math.round(320.00 * 0.15),
                                            netCash: fleetPeriod === 'KW41' ? 272.00 : Math.round(320.00 * 0.85),
                                            status: '✅ In Firmenkasse übergeben',
                                            statusBadge: 'emerald',
                                            shift: 'Schicht beendet & quittiert • Übergeben an Manager'
                                        }
                                    ].map((driver) => (
                                        <div
                                            key={driver.id}
                                            className={`p-4 md:p-5 rounded-2xl border transition-all ${
                                                isLight 
                                                    ? 'bg-slate-50 border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-sm' 
                                                    : 'bg-black/30 border-white/5 hover:border-white/10'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                {/* Driver Info */}
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={driver.avatar}
                                                        alt={driver.name}
                                                        className="w-12 h-12 rounded-2xl object-cover border border-brand/30 shadow-md shrink-0"
                                                    />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className={`text-sm md:text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                                {driver.name}
                                                            </h4>
                                                            <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-md border ${
                                                                isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-dark-900 border-white/10 text-cyan-400'
                                                            }`}>
                                                                {driver.plate}
                                                            </span>
                                                        </div>
                                                        <div className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'} mt-0.5`}>
                                                            {driver.vehicle} • <strong className={isLight ? 'text-slate-700' : 'text-slate-300'}>{driver.cashTrips} Barfahrten</strong>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Cash Amounts */}
                                                <div className="flex items-center gap-3 self-end sm:self-center">
                                                    <div className="text-right">
                                                        <span className={`text-[9px] font-black uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                                            Kassiertes Bargeld
                                                        </span>
                                                        <span className="text-xl md:text-2xl font-black italic text-emerald-500">
                                                            €{driver.cashAmount.toFixed(2).replace('.', ',')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Bar & Shift Details */}
                                            <div className={`mt-3 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] ${
                                                isLight ? 'border-slate-200 text-slate-600' : 'border-white/5 text-slate-400'
                                            }`}>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={12} className="shrink-0 text-slate-400" />
                                                    <span>{driver.shift}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Sheet Bottom Footer */}
                            <div className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
                                isLight ? 'border-slate-200' : 'border-white/5'
                            }`}>
                                <div className="text-xs font-bold text-slate-500">
                                    Insgesamt <strong className={isLight ? 'text-slate-900' : 'text-white'}>{activeWeekMetrics.tripsCash} Barfahrten</strong> erfasst
                                </div>
                                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            alert(`📄 Kassen- und Fahrer-Bargeldbeleg (${activeWeekMetrics.label}) als PDF generiert!`);
                                        }}
                                        className={`px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto ${
                                            isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                                        }`}
                                    >
                                        <FileText size={14} />
                                        Quittung PDF
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsDriverCashSheetOpen(false)}
                                        className="px-6 py-2.5 bg-brand text-dark-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-lg hover:scale-105 transition-all w-full sm:w-auto text-center"
                                    >
                                        Fertig
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* B2B STADION TICKET-UMSATZ BOTTOM SHEET */}
            <AnimatePresence>
                {isTicketRevenueModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsTicketRevenueModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                        />

                        {/* Bottom Sheet Container */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            className={`relative z-10 w-full max-w-5xl max-h-[88vh] rounded-t-[2.5rem] md:rounded-t-[3rem] p-6 md:p-8 flex flex-col shadow-2xl border-t border-x overflow-hidden ${
                                isLight 
                                    ? 'bg-white border-slate-200 text-slate-900' 
                                    : 'bg-dark-900 border-white/10 text-white'
                            }`}
                        >
                            {/* Drag Handle Indicator */}
                            <div className="w-14 h-1.5 rounded-full mx-auto mb-4 bg-slate-300 dark:bg-white/20"></div>

                            {/* Header */}
                            <div className="flex items-center justify-between pb-4 border-b shrink-0" style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-black shrink-0 border border-cyan-500/20">
                                        <Ticket size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-lg md:text-xl font-black uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                {selectedTicketCategory ? selectedTicketCategory : 'Stadion Ticket-Umsatz Aufschlüsselung'}
                                            </h3>
                                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                                isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                                            }`}>
                                                {selectedTicketCategory ? 'Kategorie-Details' : 'Alle Kategorien'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                            {selectedTicketCategory 
                                                ? 'Einzeltickets aufgeschlüsselt nach Verkauft, Reserviert und Storniert' 
                                                : 'Gesamte Ticket-Verkäufe, Reservierungen & Stornierungen im Überblick'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {selectedTicketCategory && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTicketCategory(null)}
                                            className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                                                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                                            }`}
                                        >
                                            <ArrowLeft size={14} />
                                            Zurück
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setIsTicketRevenueModalOpen(false)}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                                            isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                                        }`}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* KPI Metrics Summary */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 shrink-0">
                                <div className={`p-3.5 rounded-2xl border ${
                                    isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">🟢 Verkauft</span>
                                        <span className="text-[10px] font-bold text-emerald-600">
                                            €{selectedTicketCategory 
                                                ? stadiumTicketData.filter(t => t.category === selectedTicketCategory && t.status === 'sold').reduce((sum, t) => sum + t.price, 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })
                                                : totalTicketStats.soldRev.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black italic text-emerald-500 mt-1">
                                        {selectedTicketCategory 
                                            ? stadiumTicketData.filter(t => t.category === selectedTicketCategory && t.status === 'sold').length
                                            : totalTicketStats.sold} <span className="text-xs font-bold font-sans not-italic">Tickets</span>
                                    </div>
                                </div>

                                <div className={`p-3.5 rounded-2xl border ${
                                    isLight ? 'bg-amber-50/80 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">🟡 Reserviert</span>
                                        <span className="text-[10px] font-bold text-amber-600">
                                            €{selectedTicketCategory 
                                                ? stadiumTicketData.filter(t => t.category === selectedTicketCategory && t.status === 'reserved').reduce((sum, t) => sum + t.price, 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })
                                                : totalTicketStats.reservedRev.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black italic text-amber-500 mt-1">
                                        {selectedTicketCategory 
                                            ? stadiumTicketData.filter(t => t.category === selectedTicketCategory && t.status === 'reserved').length
                                            : totalTicketStats.reserved} <span className="text-xs font-bold font-sans not-italic">Tickets</span>
                                    </div>
                                </div>

                                <div className={`p-3.5 rounded-2xl border ${
                                    isLight ? 'bg-rose-50/80 border-rose-200' : 'bg-rose-500/10 border-rose-500/20'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">🔴 Storniert</span>
                                        <span className="text-[10px] font-bold text-rose-600">
                                            €{selectedTicketCategory 
                                                ? stadiumTicketData.filter(t => t.category === selectedTicketCategory && t.status === 'cancelled').reduce((sum, t) => sum + t.price, 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })
                                                : totalTicketStats.cancelledRev.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black italic text-rose-500 mt-1">
                                        {selectedTicketCategory 
                                            ? stadiumTicketData.filter(t => t.category === selectedTicketCategory && t.status === 'cancelled').length
                                            : totalTicketStats.cancelled} <span className="text-xs font-bold font-sans not-italic">Tickets</span>
                                    </div>
                                </div>

                                <div className={`p-3.5 rounded-2xl border ${
                                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">🎫 Gesamt</span>
                                        <span className="text-[10px] font-bold text-cyan-400">Brutto</span>
                                    </div>
                                    <div className={`text-xl font-black italic mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                        {selectedTicketCategory 
                                            ? stadiumTicketData.filter(t => t.category === selectedTicketCategory).length
                                            : totalTicketStats.total} <span className="text-xs font-bold font-sans not-italic">Tickets</span>
                                    </div>
                                </div>
                            </div>

                            {/* MAIN BODY: VIEW 1 (CATEGORIES) VS VIEW 2 (TICKETS DRILL-DOWN) */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4 custom-scrollbar">
                                {!selectedTicketCategory ? (
                                    /* VIEW 1: CATEGORY OVERVIEW LIST */
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <span className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                                Kategorien auswählen für Detail-Ansicht
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-bold">
                                                {ticketCategorySummary.length} Kategorien gelistet
                                            </span>
                                        </div>

                                        {ticketCategorySummary.map((cat) => (
                                            <div
                                                key={cat.name}
                                                onClick={() => {
                                                    setSelectedTicketCategory(cat.name);
                                                    setTicketStatusFilter('all');
                                                }}
                                                className={`p-4 md:p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group ${
                                                    isLight
                                                        ? 'bg-slate-50 hover:bg-cyan-50/40 border-slate-200 hover:border-cyan-300 shadow-sm'
                                                        : 'bg-black/30 hover:bg-cyan-950/20 border-white/5 hover:border-cyan-500/40'
                                                }`}
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-black shrink-0 group-hover:scale-110 transition-transform">
                                                            <Target size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'} group-hover:text-cyan-400 transition-colors`}>
                                                                    {cat.name}
                                                                </h4>
                                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                                                    isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-dark-900 border-white/10 text-slate-300'
                                                                }`}>
                                                                    {cat.total} Tickets
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                                                Klicken, um verkaufte, stornierte & reservierte Einzeltickets einzusehen
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                                                        <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            🟢 {cat.sold} Verkauft (€{cat.soldRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })})
                                                        </span>
                                                        <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                            🟡 {cat.reserved} Reserviert
                                                        </span>
                                                        {cat.cancelled > 0 && (
                                                            <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                                🔴 {cat.cancelled} Storno
                                                            </span>
                                                        )}
                                                        {cat.shuttlePax > 0 && (
                                                            <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                                                <Bus size={12} /> {cat.shuttlePax} Shuttle-Gäste
                                                            </span>
                                                        )}
                                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all ml-1">
                                                            <ChevronRight size={18} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* VIEW 2: DRILL-DOWN TICKETS IN SELECTED CATEGORY */
                                    <div className="space-y-3">
                                        {/* Status Filter Tabs */}
                                        <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
                                            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/20 border border-white/5">
                                                {[
                                                    { id: 'all', label: 'Alle Status' },
                                                    { id: 'sold', label: '🟢 Verkauft' },
                                                    { id: 'reserved', label: '🟡 Reserviert' },
                                                    { id: 'cancelled', label: '🔴 Storniert' }
                                                ].map(tab => (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        onClick={() => setTicketStatusFilter(tab.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                                            ticketStatusFilter === tab.id
                                                                ? 'bg-cyan-500 text-black shadow-md'
                                                                : isLight
                                                                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                        }`}
                                                    >
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <span className="text-xs font-bold text-slate-400">
                                                Zeigt {stadiumTicketData.filter(t => t.category === selectedTicketCategory && (ticketStatusFilter === 'all' || t.status === ticketStatusFilter)).length} Tickets
                                            </span>
                                        </div>

                                        {stadiumTicketData
                                            .filter(t => t.category === selectedTicketCategory)
                                            .filter(t => ticketStatusFilter === 'all' || t.status === ticketStatusFilter)
                                            .map((ticket) => (
                                                <div
                                                    key={ticket.id}
                                                    className={`p-4 rounded-2xl border transition-all ${
                                                        isLight
                                                            ? 'bg-slate-50 border-slate-200'
                                                            : 'bg-black/30 border-white/5'
                                                    }`}
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                                                    {ticket.id}
                                                                </span>
                                                                <h5 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                                    {ticket.name}
                                                                </h5>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                                                    isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-dark-900 border-white/10 text-slate-300'
                                                                }`}>
                                                                    {ticket.ticketType}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                                                <span>👤 Käufer: <strong className={isLight ? 'text-slate-700' : 'text-slate-200'}>{ticket.buyerName}</strong></span>
                                                                <span>•</span>
                                                                <span>✉️ {ticket.buyerEmail}</span>
                                                                <span>•</span>
                                                                <span>📅 {ticket.date}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 self-end sm:self-center">
                                                            {ticket.hasShuttle ? (
                                                                <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                                    <Bus size={13} /> Shuttle ({ticket.shuttlePax} Pax)
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                                                    Ohne Shuttle
                                                                </span>
                                                            )}

                                                            <div className="text-right min-w-[70px]">
                                                                <span className={`text-base font-black italic block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                                    €{ticket.price.toFixed(2).replace('.', ',')}
                                                                </span>
                                                            </div>

                                                            <div>
                                                                {ticket.status === 'sold' && (
                                                                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                                                                        🟢 Verkauft
                                                                    </span>
                                                                )}
                                                                {ticket.status === 'reserved' && (
                                                                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                                                                        🟡 Reserviert
                                                                    </span>
                                                                )}
                                                                {ticket.status === 'cancelled' && (
                                                                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 whitespace-nowrap">
                                                                        🔴 Storniert
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* Sheet Bottom Footer */}
                            <div className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
                                isLight ? 'border-slate-200' : 'border-white/5'
                            }`}>
                                <div className="text-xs font-bold text-slate-500">
                                    Insgesamt <strong className={isLight ? 'text-slate-900' : 'text-white'}>{totalTicketStats.total} Tickets</strong> in allen Kategorien erfasst
                                </div>
                                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                    {selectedTicketCategory && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTicketCategory(null)}
                                            className={`px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto ${
                                                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                                            }`}
                                        >
                                            <ArrowLeft size={14} />
                                            Zurück zu Kategorien
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setIsTicketRevenueModalOpen(false)}
                                        className="px-6 py-2.5 bg-brand text-dark-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-lg hover:scale-105 transition-all w-full sm:w-auto text-center"
                                    >
                                        Fertig
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* B2B STADION SHUTTLE-SERVICE BOTTOM SHEET */}
            <AnimatePresence>
                {isShuttleServiceModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsShuttleServiceModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                        />

                        {/* Bottom Sheet Container */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            className={`relative z-10 w-full max-w-5xl max-h-[88vh] rounded-t-[2.5rem] md:rounded-t-[3rem] p-6 md:p-8 flex flex-col shadow-2xl border-t border-x overflow-hidden ${
                                isLight 
                                    ? 'bg-white border-slate-200 text-slate-900' 
                                    : 'bg-dark-900 border-white/10 text-white'
                            }`}
                        >
                            {/* Drag Handle Indicator */}
                            <div className="w-14 h-1.5 rounded-full mx-auto mb-4 bg-slate-300 dark:bg-white/20"></div>

                            {/* Header */}
                            <div className="flex items-center justify-between pb-4 border-b shrink-0" style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black shrink-0 border border-amber-500/20">
                                        <Bus size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-lg md:text-xl font-black uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                Stadion Shuttle-Service Abrechnung
                                            </h3>
                                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                                isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                            }`}>
                                                Green Mobility
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                            Aufschlüsselung aller Shuttle-Transfers: Verkauft, Reserviert und Storno (@ €16,00 Staffeltarif)
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleDownloadShuttlePdf}
                                        className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-wider text-xs shadow-lg hover:bg-amber-400 transition-all flex items-center gap-1.5"
                                        title="Shuttle-Service Abrechnung als PDF herunterladen"
                                    >
                                        <Download size={14} />
                                        PDF herunterladen
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsShuttleServiceModalOpen(false)}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                                            isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                                        }`}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* KPI Metrics Summary */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 shrink-0">
                                <div className={`p-3.5 rounded-2xl border ${
                                    isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">🟢 Verkauft</span>
                                        <span className="text-[10px] font-bold text-emerald-600">
                                            €{totalShuttleStats.soldTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black italic text-emerald-500 mt-1">
                                        {totalShuttleStats.soldCount} Fahrten <span className="text-xs font-bold font-sans not-italic">({totalShuttleStats.soldPax} Pax)</span>
                                    </div>
                                </div>

                                <div className={`p-3.5 rounded-2xl border ${
                                    isLight ? 'bg-amber-50/80 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">🟡 Reserviert</span>
                                        <span className="text-[10px] font-bold text-amber-600">
                                            €{totalShuttleStats.reservedTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black italic text-amber-500 mt-1">
                                        {totalShuttleStats.reservedCount} Fahrten <span className="text-xs font-bold font-sans not-italic">({totalShuttleStats.reservedPax} Pax)</span>
                                    </div>
                                </div>

                                <div className={`p-3.5 rounded-2xl border ${
                                    isLight ? 'bg-rose-50/80 border-rose-200' : 'bg-rose-500/10 border-rose-500/20'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">🔴 Storniert</span>
                                        <span className="text-[10px] font-bold text-rose-600">
                                            €{totalShuttleStats.cancelledTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black italic text-rose-500 mt-1">
                                        {totalShuttleStats.cancelledCount} Fahrten <span className="text-xs font-bold font-sans not-italic">({totalShuttleStats.cancelledPax} Pax)</span>
                                    </div>
                                </div>

                                <div className={`p-3.5 rounded-2xl border ${
                                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">🚍 Transfers</span>
                                        <span className="text-[10px] font-bold text-amber-400">Green Fleet</span>
                                    </div>
                                    <div className={`text-xl font-black italic mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                        {totalShuttleStats.totalTrips} Fahrten <span className="text-xs font-bold font-sans not-italic">gesamt</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Filter Tabs */}
                            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 shrink-0">
                                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/20 border border-white/5">
                                    {[
                                        { id: 'all', label: `Alle (${totalShuttleStats.totalTrips})` },
                                        { id: 'sold', label: `🟢 Verkauft (${totalShuttleStats.soldCount})` },
                                        { id: 'reserved', label: `🟡 Reserviert (${totalShuttleStats.reservedCount})` },
                                        { id: 'cancelled', label: `🔴 Storno (${totalShuttleStats.cancelledCount})` }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setShuttleStatusFilter(tab.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                                shuttleStatusFilter === tab.id
                                                    ? 'bg-amber-400 text-black shadow-md'
                                                    : isLight
                                                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <span className="text-xs font-bold text-slate-400">
                                    Zeigt {stadiumShuttleData.filter(s => shuttleStatusFilter === 'all' || s.status === shuttleStatusFilter).length} Shuttle-Buchungen
                                </span>
                            </div>

                            {/* Shuttle Bookings List */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4 custom-scrollbar">
                                {stadiumShuttleData
                                    .filter(s => shuttleStatusFilter === 'all' || s.status === shuttleStatusFilter)
                                    .map((shuttle) => (
                                        <div
                                            key={shuttle.id}
                                            className={`p-4 md:p-5 rounded-2xl border transition-all ${
                                                isLight
                                                    ? 'bg-slate-50 border-slate-200 shadow-sm'
                                                    : 'bg-black/30 border-white/5'
                                            }`}
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                                            {shuttle.id}
                                                        </span>
                                                        <h5 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                            {shuttle.guestName}
                                                        </h5>
                                                        <span className="text-xs text-slate-400 font-mono">
                                                            {shuttle.guestPhone}
                                                        </span>
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                                                            isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-dark-900 border-white/10 text-cyan-400'
                                                        }`}>
                                                            {shuttle.vehicleType}
                                                        </span>
                                                    </div>

                                                    {/* Route details */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-xs">
                                                        <div className="flex items-center gap-1.5 text-slate-400">
                                                            <MapPin size={13} className="text-amber-400 shrink-0" />
                                                            <span>Von: <strong className={isLight ? 'text-slate-700' : 'text-slate-200'}>{shuttle.pickup}</strong></span>
                                                        </div>
                                                        <span className="hidden sm:inline text-slate-500">→</span>
                                                        <div className="flex items-center gap-1.5 text-slate-400">
                                                            <MapPin size={13} className="text-emerald-400 shrink-0" />
                                                            <span>Nach: <strong className={isLight ? 'text-slate-700' : 'text-slate-200'}>{shuttle.destination}</strong></span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} /> {shuttle.date}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} /> {shuttle.time}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="font-bold text-slate-300">
                                                            👥 {shuttle.pax} Passagiere • 🧳 {shuttle.bags} Gepäck
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 self-end lg:self-center">
                                                    <div className="text-right">
                                                        <span className={`text-[9px] font-black uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                                            €16,00 / Pax Staffeltarif
                                                        </span>
                                                        <span className="text-lg md:text-xl font-black italic text-amber-400">
                                                            -€{shuttle.totalPrice.toFixed(2).replace('.', ',')}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        {shuttle.status === 'sold' && (
                                                            <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap block">
                                                                🟢 Verkauft
                                                            </span>
                                                        )}
                                                        {shuttle.status === 'reserved' && (
                                                            <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap block">
                                                                🟡 Reserviert
                                                            </span>
                                                        )}
                                                        {shuttle.status === 'cancelled' && (
                                                            <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 whitespace-nowrap block">
                                                                🔴 Storniert
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            {/* Sheet Bottom Footer */}
                            <div className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
                                isLight ? 'border-slate-200' : 'border-white/5'
                            }`}>
                                <div className="text-xs font-bold text-slate-500">
                                    Abrechnungspartner: <strong className={isLight ? 'text-slate-900' : 'text-white'}>Green Fleet Logistics & Mobility</strong>
                                </div>
                                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={handleDownloadShuttlePdf}
                                        className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-black uppercase tracking-wider text-xs shadow-lg hover:bg-amber-400 transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto"
                                    >
                                        <Printer size={14} />
                                        Als PDF herunterladen
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsShuttleServiceModalOpen(false)}
                                        className="px-6 py-2.5 bg-brand text-dark-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-lg hover:scale-105 transition-all w-full sm:w-auto text-center"
                                    >
                                        Fertig
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* B2B HOTEL ZIMMER-UMSATZ BOTTOM SHEET */}
            <AnimatePresence>
                {isHotelRevenueModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsHotelRevenueModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                        />

                        {/* Bottom Sheet Container */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            className={`relative z-10 w-full max-w-5xl max-h-[88vh] rounded-t-[2.5rem] md:rounded-t-[3rem] p-6 md:p-8 flex flex-col shadow-2xl border-t border-x overflow-hidden ${
                                isLight 
                                    ? 'bg-white border-slate-200 text-slate-900' 
                                    : 'bg-dark-900 border-white/10 text-white'
                            }`}
                        >
                            {/* Drag Handle Indicator */}
                            <div className="w-14 h-1.5 rounded-full mx-auto mb-4 bg-slate-300 dark:bg-white/20"></div>

                            {/* Header */}
                            <div className="flex items-center justify-between pb-4 border-b shrink-0" style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-black shrink-0 border border-cyan-500/20">
                                        <BedDouble size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-lg md:text-xl font-black uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                {selectedRoomCategory ? selectedRoomCategory : 'Hotel Zimmer-Umsatz Aufschlüsselung'}
                                            </h3>
                                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                                isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                                            }`}>
                                                {selectedRoomCategory ? 'Kategorie-Details' : 'Alle Zimmer-Kategorien'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                            {selectedRoomCategory 
                                                ? 'Einzelbuchungen aufgeschlüsselt nach Gebucht, Reserviert und Storniert' 
                                                : 'Gesamte Zimmer-Buchungen, Reservierungen & Stornierungen im Überblick'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {selectedRoomCategory && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRoomCategory(null)}
                                            className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                                                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                                            }`}
                                        >
                                            <ArrowLeft size={14} />
                                            Zurück
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setIsHotelRevenueModalOpen(false)}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                                            isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                                        }`}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* KPI Metrics Summary */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 shrink-0">
                                <div className={`p-3.5 rounded-2xl border ${
                                    isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">🟢 Gebucht</span>
                                        <span className="text-[10px] font-bold text-emerald-600">
                                            €{selectedRoomCategory 
                                                ? hotelRoomData.filter(r => r.category === selectedRoomCategory && r.status === 'sold').reduce((sum, r) => sum + r.price, 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })
                                                : totalRoomStats.soldRev.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black italic text-emerald-500 mt-1">
                                        {selectedRoomCategory 
                                            ? hotelRoomData.filter(r => r.category === selectedRoomCategory && r.status === 'sold').length
                                            : totalRoomStats.sold} <span className="text-xs font-bold font-sans not-italic">Zimmer</span>
                                    </div>
                                </div>

                                <div className={`p-3.5 rounded-2xl border ${
                                    isLight ? 'bg-amber-50/80 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">🟡 Reserviert</span>
                                        <span className="text-[10px] font-bold text-amber-600">
                                            €{selectedRoomCategory 
                                                ? hotelRoomData.filter(r => r.category === selectedRoomCategory && r.status === 'reserved').reduce((sum, r) => sum + r.price, 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })
                                                : totalRoomStats.reservedRev.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black italic text-amber-500 mt-1">
                                        {selectedRoomCategory 
                                            ? hotelRoomData.filter(r => r.category === selectedRoomCategory && r.status === 'reserved').length
                                            : totalRoomStats.reserved} <span className="text-xs font-bold font-sans not-italic">Zimmer</span>
                                    </div>
                                </div>

                                <div className={`p-3.5 rounded-2xl border ${
                                    isLight ? 'bg-rose-50/80 border-rose-200' : 'bg-rose-500/10 border-rose-500/20'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">🔴 Storniert</span>
                                        <span className="text-[10px] font-bold text-rose-600">
                                            €{selectedRoomCategory 
                                                ? hotelRoomData.filter(r => r.category === selectedRoomCategory && r.status === 'cancelled').reduce((sum, r) => sum + r.price, 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })
                                                : totalRoomStats.cancelledRev.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black italic text-rose-500 mt-1">
                                        {selectedRoomCategory 
                                            ? hotelRoomData.filter(r => r.category === selectedRoomCategory && r.status === 'cancelled').length
                                            : totalRoomStats.cancelled} <span className="text-xs font-bold font-sans not-italic">Zimmer</span>
                                    </div>
                                </div>

                                <div className={`p-3.5 rounded-2xl border ${
                                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">🛏️ Gesamt</span>
                                        <span className="text-[10px] font-bold text-cyan-400">Brutto</span>
                                    </div>
                                    <div className={`text-xl font-black italic mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                        {selectedRoomCategory 
                                            ? hotelRoomData.filter(r => r.category === selectedRoomCategory).length
                                            : totalRoomStats.total} <span className="text-xs font-bold font-sans not-italic">Zimmer</span>
                                    </div>
                                </div>
                            </div>

                            {/* MAIN BODY: VIEW 1 (ROOM CATEGORIES) VS VIEW 2 (ROOMS DRILL-DOWN) */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4 custom-scrollbar">
                                {!selectedRoomCategory ? (
                                    /* VIEW 1: CATEGORY OVERVIEW LIST */
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <span className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                                Kategorien auswählen für Detail-Ansicht
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-bold">
                                                {hotelCategorySummary.length} Zimmer-Kategorien gelistet
                                            </span>
                                        </div>

                                        {hotelCategorySummary.map((cat) => (
                                            <div
                                                key={cat.name}
                                                onClick={() => {
                                                    setSelectedRoomCategory(cat.name);
                                                    setRoomStatusFilter('all');
                                                }}
                                                className={`p-4 md:p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group ${
                                                    isLight
                                                        ? 'bg-slate-50 hover:bg-cyan-50/40 border-slate-200 hover:border-cyan-300 shadow-sm'
                                                        : 'bg-black/30 hover:bg-cyan-950/20 border-white/5 hover:border-cyan-500/40'
                                                }`}
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-black shrink-0 group-hover:scale-110 transition-transform">
                                                            <BedDouble size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'} group-hover:text-cyan-400 transition-colors`}>
                                                                    {cat.name}
                                                                </h4>
                                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                                                    isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-dark-900 border-white/10 text-slate-300'
                                                                }`}>
                                                                    {cat.total} Zimmer
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                                                Klicken, um gebuchte, stornierte & reservierte Zimmer einzusehen
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                                                        <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            🟢 {cat.sold} Gebucht (€{cat.soldRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })})
                                                        </span>
                                                        <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                            🟡 {cat.reserved} Reserviert
                                                        </span>
                                                        {cat.cancelled > 0 && (
                                                            <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                                🔴 {cat.cancelled} Storno
                                                            </span>
                                                        )}
                                                        {cat.shuttlePax > 0 && (
                                                            <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                                                <Bus size={12} /> {cat.shuttlePax} Shuttle-Gäste
                                                            </span>
                                                        )}
                                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all ml-1">
                                                            <ChevronRight size={18} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* VIEW 2: DRILL-DOWN ROOMS IN SELECTED CATEGORY */
                                    <div className="space-y-3">
                                        {/* Status Filter Tabs */}
                                        <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
                                            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/20 border border-white/5">
                                                {[
                                                    { id: 'all', label: 'Alle Status' },
                                                    { id: 'sold', label: '🟢 Gebucht' },
                                                    { id: 'reserved', label: '🟡 Reserviert' },
                                                    { id: 'cancelled', label: '🔴 Storniert' }
                                                ].map(tab => (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        onClick={() => setRoomStatusFilter(tab.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                                            roomStatusFilter === tab.id
                                                                ? 'bg-cyan-500 text-black shadow-md'
                                                                : isLight
                                                                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                        }`}
                                                    >
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <span className="text-xs font-bold text-slate-400">
                                                Zeigt {hotelRoomData.filter(r => r.category === selectedRoomCategory && (roomStatusFilter === 'all' || r.status === roomStatusFilter)).length} Zimmer
                                            </span>
                                        </div>

                                        {hotelRoomData
                                            .filter(r => r.category === selectedRoomCategory)
                                            .filter(r => roomStatusFilter === 'all' || r.status === roomStatusFilter)
                                            .map((room) => (
                                                <div
                                                    key={room.id}
                                                    className={`p-4 rounded-2xl border transition-all ${
                                                        isLight
                                                            ? 'bg-slate-50 border-slate-200'
                                                            : 'bg-black/30 border-white/5'
                                                    }`}
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                                                    {room.id}
                                                                </span>
                                                                <h5 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                                    {room.name}
                                                                </h5>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                                                    isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-dark-900 border-white/10 text-slate-300'
                                                                }`}>
                                                                    {room.roomType}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                                                <span>👤 Gast: <strong className={isLight ? 'text-slate-700' : 'text-slate-200'}>{room.guestName}</strong></span>
                                                                <span>•</span>
                                                                <span>✉️ {room.guestEmail}</span>
                                                                <span>•</span>
                                                                <span>📅 Check-in: {room.checkIn} ({room.nights} {room.nights > 1 ? 'Nächte' : 'Nacht'})</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 self-end sm:self-center">
                                                            {room.hasShuttle ? (
                                                                <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                                    <Bus size={13} /> Shuttle ({room.shuttlePax} Pax)
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                                                    Ohne Shuttle
                                                                </span>
                                                            )}

                                                            <div className="text-right min-w-[70px]">
                                                                <span className={`text-base font-black italic block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                                    €{room.price.toFixed(2).replace('.', ',')}
                                                                </span>
                                                            </div>

                                                            <div>
                                                                {room.status === 'sold' && (
                                                                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                                                                        🟢 Gebucht
                                                                    </span>
                                                                )}
                                                                {room.status === 'reserved' && (
                                                                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                                                                        🟡 Reserviert
                                                                    </span>
                                                                )}
                                                                {room.status === 'cancelled' && (
                                                                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 whitespace-nowrap">
                                                                        🔴 Storniert
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* Sheet Bottom Footer */}
                            <div className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
                                isLight ? 'border-slate-200' : 'border-white/5'
                            }`}>
                                <div className="text-xs font-bold text-slate-500">
                                    Insgesamt <strong className={isLight ? 'text-slate-900' : 'text-white'}>{totalRoomStats.total} Zimmer-Einheiten</strong> in allen Kategorien erfasst
                                </div>
                                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                    {selectedRoomCategory && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRoomCategory(null)}
                                            className={`px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto ${
                                                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                                            }`}
                                        >
                                            <ArrowLeft size={14} />
                                            Zurück zu Kategorien
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setIsHotelRevenueModalOpen(false)}
                                        className="px-6 py-2.5 bg-brand text-dark-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-lg hover:scale-105 transition-all w-full sm:w-auto text-center"
                                    >
                                        Fertig
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* B2B HOTEL SHUTTLE-SERVICE BOTTOM SHEET */}
            <AnimatePresence>
                {isHotelShuttleModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsHotelShuttleModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                        />

                        {/* Bottom Sheet Container */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            className={`relative z-10 w-full max-w-5xl max-h-[88vh] rounded-t-[2.5rem] md:rounded-t-[3rem] p-6 md:p-8 flex flex-col shadow-2xl border-t border-x overflow-hidden ${
                                isLight 
                                    ? 'bg-white border-slate-200 text-slate-900' 
                                    : 'bg-dark-900 border-white/10 text-white'
                            }`}
                        >
                            {/* Drag Handle Indicator */}
                            <div className="w-14 h-1.5 rounded-full mx-auto mb-4 bg-slate-300 dark:bg-white/20"></div>

                            {/* Header */}
                            <div className="flex items-center justify-between pb-4 border-b shrink-0" style={{ borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black shrink-0 border border-amber-500/20">
                                        <Bus size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-lg md:text-xl font-black uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                Hotel Shuttle-Service Abrechnung
                                            </h3>
                                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                                isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                            }`}>
                                                Green Mobility
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                            Aufschlüsselung aller Hotel-Transfers: Verkauft, Reserviert und Storno (@ €16,00 Staffeltarif)
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleDownloadHotelShuttlePdf}
                                        className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-wider text-xs shadow-lg hover:bg-amber-400 transition-all flex items-center gap-1.5"
                                        title="Hotel Shuttle-Service Abrechnung als PDF herunterladen"
                                    >
                                        <Download size={14} />
                                        PDF herunterladen
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsHotelShuttleModalOpen(false)}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                                            isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                                        }`}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* KPI Metrics Summary */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 shrink-0">
                                <div className={`p-3.5 rounded-2xl border ${
                                    isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">🟢 Ausgeführt</span>
                                        <span className="text-[10px] font-bold text-emerald-600">
                                            €{totalHotelShuttleStats.soldTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black italic text-emerald-500 mt-1">
                                        {totalHotelShuttleStats.soldCount} Fahrten <span className="text-xs font-bold font-sans not-italic">({totalHotelShuttleStats.soldPax} Pax)</span>
                                    </div>
                                </div>

                                <div className={`p-3.5 rounded-2xl border ${
                                    isLight ? 'bg-amber-50/80 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">🟡 Reserviert</span>
                                        <span className="text-[10px] font-bold text-amber-600">
                                            €{totalHotelShuttleStats.reservedTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black italic text-amber-500 mt-1">
                                        {totalHotelShuttleStats.reservedCount} Fahrten <span className="text-xs font-bold font-sans not-italic">({totalHotelShuttleStats.reservedPax} Pax)</span>
                                    </div>
                                </div>

                                <div className={`p-3.5 rounded-2xl border ${
                                    isLight ? 'bg-rose-50/80 border-rose-200' : 'bg-rose-500/10 border-rose-500/20'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">🔴 Storniert</span>
                                        <span className="text-[10px] font-bold text-rose-600">
                                            €{totalHotelShuttleStats.cancelledTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black italic text-rose-500 mt-1">
                                        {totalHotelShuttleStats.cancelledCount} Fahrten <span className="text-xs font-bold font-sans not-italic">({totalHotelShuttleStats.cancelledPax} Pax)</span>
                                    </div>
                                </div>

                                <div className={`p-3.5 rounded-2xl border ${
                                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">🚍 Transfers</span>
                                        <span className="text-[10px] font-bold text-amber-400">Hotel Flotte</span>
                                    </div>
                                    <div className={`text-xl font-black italic mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                        {totalHotelShuttleStats.totalTrips} Fahrten <span className="text-xs font-bold font-sans not-italic">gesamt</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Filter Tabs */}
                            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 shrink-0">
                                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/20 border border-white/5">
                                    {[
                                        { id: 'all', label: `Alle (${totalHotelShuttleStats.totalTrips})` },
                                        { id: 'sold', label: `🟢 Ausgeführt (${totalHotelShuttleStats.soldCount})` },
                                        { id: 'reserved', label: `🟡 Reserviert (${totalHotelShuttleStats.reservedCount})` },
                                        { id: 'cancelled', label: `🔴 Storno (${totalHotelShuttleStats.cancelledCount})` }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setHotelShuttleStatusFilter(tab.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                                hotelShuttleStatusFilter === tab.id
                                                    ? 'bg-amber-400 text-black shadow-md'
                                                    : isLight
                                                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <span className="text-xs font-bold text-slate-400">
                                    Zeigt {hotelShuttleData.filter(s => hotelShuttleStatusFilter === 'all' || s.status === hotelShuttleStatusFilter).length} Hotel-Shuttles
                                </span>
                            </div>

                            {/* Hotel Shuttle Bookings List */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4 custom-scrollbar">
                                {hotelShuttleData
                                    .filter(s => hotelShuttleStatusFilter === 'all' || s.status === hotelShuttleStatusFilter)
                                    .map((shuttle) => (
                                        <div
                                            key={shuttle.id}
                                            className={`p-4 md:p-5 rounded-2xl border transition-all ${
                                                isLight
                                                    ? 'bg-slate-50 border-slate-200 shadow-sm'
                                                    : 'bg-black/30 border-white/5'
                                            }`}
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                                            {shuttle.id}
                                                        </span>
                                                        <h5 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                            {shuttle.guestName}
                                                        </h5>
                                                        <span className="text-xs text-slate-400 font-mono">
                                                            {shuttle.guestPhone}
                                                        </span>
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                                                            isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-dark-900 border-white/10 text-cyan-400'
                                                        }`}>
                                                            {shuttle.vehicleType}
                                                        </span>
                                                    </div>

                                                    {/* Route details */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-xs">
                                                        <div className="flex items-center gap-1.5 text-slate-400">
                                                            <MapPin size={13} className="text-amber-400 shrink-0" />
                                                            <span>Von: <strong className={isLight ? 'text-slate-700' : 'text-slate-200'}>{shuttle.pickup}</strong></span>
                                                        </div>
                                                        <span className="hidden sm:inline text-slate-500">→</span>
                                                        <div className="flex items-center gap-1.5 text-slate-400">
                                                            <MapPin size={13} className="text-emerald-400 shrink-0" />
                                                            <span>Nach: <strong className={isLight ? 'text-slate-700' : 'text-slate-200'}>{shuttle.destination}</strong></span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} /> {shuttle.date}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} /> {shuttle.time}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="font-bold text-slate-300">
                                                            👥 {shuttle.pax} Personen • 🧳 {shuttle.bags} Gepäck
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 self-end lg:self-center">
                                                    <div className="text-right">
                                                        <span className={`text-[9px] font-black uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                                            €16,00 / Fahrt Staffeltarif
                                                        </span>
                                                        <span className="text-lg md:text-xl font-black italic text-amber-400">
                                                            -€{shuttle.totalPrice.toFixed(2).replace('.', ',')}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        {shuttle.status === 'sold' && (
                                                            <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap block">
                                                                🟢 Ausgeführt
                                                            </span>
                                                        )}
                                                        {shuttle.status === 'reserved' && (
                                                            <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap block">
                                                                🟡 Reserviert
                                                            </span>
                                                        )}
                                                        {shuttle.status === 'cancelled' && (
                                                            <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 whitespace-nowrap block">
                                                                🔴 Storniert
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            {/* Sheet Bottom Footer */}
                            <div className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
                                isLight ? 'border-slate-200' : 'border-white/5'
                            }`}>
                                <div className="text-xs font-bold text-slate-500">
                                    Abrechnungspartner: <strong className={isLight ? 'text-slate-900' : 'text-white'}>Green Fleet Logistics & Mobility</strong>
                                </div>
                                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={handleDownloadHotelShuttlePdf}
                                        className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-black uppercase tracking-wider text-xs shadow-lg hover:bg-amber-400 transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto"
                                    >
                                        <Printer size={14} />
                                        Als PDF herunterladen
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsHotelShuttleModalOpen(false)}
                                        className="px-6 py-2.5 bg-brand text-dark-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-lg hover:scale-105 transition-all w-full sm:w-auto text-center"
                                    >
                                        Fertig
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            </div> {/* END FLOATING GLASS TABLET WRAPPER */}
        </div>
    );
};

export default ManagerDashboard;
