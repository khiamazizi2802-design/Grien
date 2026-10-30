import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Search, ShoppingBag, X, Plus, Minus, Trash2, 
    Sparkles, Check, SlidersHorizontal, Star, ShieldCheck, 
    Truck, RefreshCw, CreditCard, ChevronLeft, ChevronRight,
    Shirt, Smartphone, Flame, Home as HomeIcon, Gift,
    Building2, CheckCircle2, Lock, MapPin, User, Loader2,
    Wallet, ChevronDown, ChevronUp, Edit3, Receipt, FileText, Download, Printer, PackageCheck, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Curated Grien Marketplace Catalog
const PRODUCTS = [
    // Klamotten / Fashion
    {
        id: 'p-fashion-1',
        name: 'Grien Signature Cyber Hoodie',
        category: 'fashion',
        categoryLabel: 'Klamotten',
        price: 89.00,
        originalPrice: 110.00,
        rating: 4.9,
        reviewsCount: 48,
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
        description: 'Hochwertiger Heavyweight-Hoodie (450 gsm) aus 100% Bio-Baumwolle mit dezenter smaragdgrüner Grien-Stickerei auf Brust und Ärmel. Entspannter Oversized-Schnitt.',
        variants: ['S', 'M', 'L', 'XL'],
        isNew: true,
        tag: 'Bestseller'
    },
    {
        id: 'p-fashion-2',
        name: 'Grien Minimalist Heavyweight Tee',
        category: 'fashion',
        categoryLabel: 'Klamotten',
        price: 45.00,
        originalPrice: null,
        rating: 4.8,
        reviewsCount: 32,
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        description: 'Puristisches T-Shirt aus dichter gekämmter Bio-Baumwolle. Kräftiger Kragen, formstabil und samtweicher Griff.',
        variants: ['S', 'M', 'L', 'XL'],
        isNew: false,
        tag: 'Essential'
    },
    {
        id: 'p-fashion-3',
        name: 'Grien Techwear Chauffeur Cap',
        category: 'fashion',
        categoryLabel: 'Klamotten',
        price: 35.00,
        originalPrice: 42.00,
        rating: 4.9,
        reviewsCount: 24,
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
        description: 'Wasserabweisendes Performance-Cap mit lasergeschnittener Belüftung und magnetischem Fidlock-Verschluss.',
        variants: ['One Size'],
        isNew: true,
        tag: 'Techwear'
    },

    // Elektronik / Gadgets
    {
        id: 'p-elec-1',
        name: 'Grien MagSafe Fast Powerbank 10.000mAh',
        category: 'electronics',
        categoryLabel: 'Elektronik',
        price: 59.00,
        originalPrice: 75.00,
        rating: 4.95,
        reviewsCount: 61,
        image: 'https://images.unsplash.com/photo-1609081219094-a2d9ec06917e?auto=format&fit=crop&w=800&q=80',
        description: 'Ultradünne Aluminium-Powerbank mit starker magnetischer Haftung für iPhone & Android. 20W PD Schnellladung mit integrierter LED-Anzeige.',
        variants: ['Graphite Black', 'Titanium Silver'],
        isNew: true,
        tag: 'Top Pick'
    },
    {
        id: 'p-elec-2',
        name: 'Grien Spatial Pro ANC Earbuds',
        category: 'electronics',
        categoryLabel: 'Elektronik',
        price: 129.00,
        originalPrice: 159.00,
        rating: 4.88,
        reviewsCount: 89,
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
        description: 'Kabellose In-Ear-Kopfhörer mit adaptiver aktiver Geräuschunterdrückung (ANC), Spatial Audio und 32 Stunden Gesamtlaufzeit.',
        variants: ['Obsidian Black'],
        isNew: true,
        tag: 'High-End'
    },
    {
        id: 'p-elec-3',
        name: 'Grien MagMount Kfz-Schnellladegerät',
        category: 'electronics',
        categoryLabel: 'Elektronik',
        price: 49.00,
        originalPrice: null,
        rating: 4.75,
        reviewsCount: 19,
        image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
        description: 'Elegante Lüftungsgitter-Halterung mit aktiver Qi2-Kühlung für schonendes und blitzschnelles Laden während der Fahrt.',
        variants: ['Standard'],
        isNew: false,
        tag: 'Auto-Zubehör'
    },

    // Parfüm & Düfte
    {
        id: 'p-perfume-1',
        name: 'Grien N°1 „Midnight Emerald“ Eau de Parfum',
        category: 'perfume',
        categoryLabel: 'Parfüm',
        price: 135.00,
        originalPrice: 160.00,
        rating: 5.0,
        reviewsCount: 77,
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
        description: 'Exklusiver Signature-Duft der Grien First-Class Flotte. Kopfnote: Bergamotte & Schwarzer Pfeffer. Herznote: Iris & Salbei. Basisnote: Dunkles Zedernholz & Vetiver (100ml).',
        variants: ['100ml'],
        isNew: true,
        tag: 'Signature'
    },
    {
        id: 'p-perfume-2',
        name: 'Grien N°2 „Velvet Oud & Suede“ Extrait',
        category: 'perfume',
        categoryLabel: 'Parfüm',
        price: 160.00,
        originalPrice: null,
        rating: 4.92,
        reviewsCount: 42,
        image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
        description: 'Hochkonzentriertes Extrait de Parfum (30% Duftöl) mit samtigem laotischem Oud, feinem Wildleder und gerösteter Tonkabohne (50ml).',
        variants: ['50ml'],
        isNew: true,
        tag: 'Luxus'
    },
    {
        id: 'p-perfume-3',
        name: 'Grien Interior Aroma Car Diffuser',
        category: 'perfume',
        categoryLabel: 'Parfüm',
        price: 39.00,
        originalPrice: 49.00,
        rating: 4.85,
        reviewsCount: 35,
        image: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80',
        description: 'Hochwertiger Aluminium-Diffusor für die Fahrzeuglüftung inklusive 3 Nachfüllpatronen mit dem Grien Signature-Duft.',
        variants: ['Space Grey', 'Matt Black'],
        isNew: false,
        tag: 'Bestseller'
    },

    // Haushalt & Living
    {
        id: 'p-home-1',
        name: 'Grien Thermal Travel Tumbler (500ml)',
        category: 'home',
        categoryLabel: 'Haushalt',
        price: 34.00,
        originalPrice: null,
        rating: 4.9,
        reviewsCount: 53,
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        description: 'Doppelwandiger Vakuum-Edelstahlbecher. Hält Getränke 12h heiß oder 24h eiskalt. Auslaufsicher und spülmaschinengeeignet.',
        variants: ['Matt Black', 'Emerald Green'],
        isNew: true,
        tag: 'Living'
    },
    {
        id: 'p-home-2',
        name: 'Grien Aroma Scented Candle „Nordic Pine“',
        category: 'home',
        categoryLabel: 'Haushalt',
        price: 29.00,
        originalPrice: 38.00,
        rating: 4.8,
        reviewsCount: 29,
        image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
        description: 'Handgegossene Sojawachskerze im mattschwarzen Glasbehälter mit Holzdocht für sanftes Knistern. 50 Stunden Brenndauer.',
        variants: ['Standard 280g'],
        isNew: false,
        tag: 'Wellness'
    },
    {
        id: 'p-home-3',
        name: 'Grien Ergonomic Memory Foam Pillow',
        category: 'home',
        categoryLabel: 'Haushalt',
        price: 49.00,
        originalPrice: 65.00,
        rating: 4.87,
        reviewsCount: 38,
        image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
        description: 'Ergonomisches Nackenkissen mit kühlender Gelschicht für erstklassigen Schlafkomfort zu Hause oder auf langen Reisen.',
        variants: ['Standard'],
        isNew: true,
        tag: 'First Class'
    },

    // Geschenke & Boxen
    {
        id: 'p-gift-1',
        name: 'Grien VIP First-Class Gift Box',
        category: 'gifts',
        categoryLabel: 'Geschenke',
        price: 199.00,
        originalPrice: 249.00,
        rating: 5.0,
        reviewsCount: 64,
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
        description: 'Luxuriöse Geschenkbox in Samt-Optik mit goldenem Band: Beinhaltet den Signature-Duft N°1 (50ml), MagSafe Powerbank und eine gravierte VIP-Karte.',
        variants: ['Black Edition', 'Gold Edition'],
        isNew: true,
        tag: 'VIP Box'
    },
    {
        id: 'p-gift-2',
        name: 'Grien Chauffeur Care Gift Set',
        category: 'gifts',
        categoryLabel: 'Geschenke',
        price: 79.00,
        originalPrice: 95.00,
        rating: 4.86,
        reviewsCount: 22,
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
        description: 'Elegantes Pflegeset mit Car Diffuser, Duftkerze und hochwertigem Mikrofaser-Pflegetuch im Geschenkkarton.',
        variants: ['Standard Set'],
        isNew: false,
        tag: 'Geschenk-Tipp'
    },
    {
        id: 'p-gift-3',
        name: 'Grien Digital VIP Guthabenkarte',
        category: 'gifts',
        categoryLabel: 'Geschenke',
        price: 100.00,
        originalPrice: 100.00,
        rating: 5.0,
        reviewsCount: 88,
        image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
        description: 'Digitale Guthabenkarte für alle Grien Chauffeur-Fahrten, Airport-Shuttles und VIP-Transfers. Gültig für 3 Jahre, sofort per E-Mail & Wallet.',
        variants: ['100 EUR', '200 EUR', '500 EUR'],
        isNew: false,
        tag: 'Gutschein'
    }
];

const BASE_CATEGORIES = [
    { id: 'all', label: 'Alle Produkte', icon: Sparkles },
    { id: 'fashion', label: 'Klamotten', icon: Shirt },
    { id: 'electronics', label: 'Elektronik', icon: Smartphone },
    { id: 'perfume', label: 'Parfüm & Düfte', icon: Flame },
    { id: 'home', label: 'Haushalt & Living', icon: HomeIcon },
    { id: 'gifts', label: 'Geschenke', icon: Gift }
];

const CATEGORY_SETS_COUNT = 5;

// Normalizer to ensure every payment method has valid, non-empty fields
const normalizePaymentMethod = (m, idx, defaultUserName = 'Khiam Azizi') => {
    if (!m) return null;
    const id = String(m.id !== undefined && m.id !== null ? m.id : `pm-${idx}`);
    const rawType = String(m.type || m.paymentType || 'card').toLowerCase();
    let type = 'card';
    if (rawType.includes('bank') || rawType.includes('sepa') || rawType.includes('iban')) {
        type = 'bank';
    } else if (rawType.includes('paypal')) {
        type = 'paypal';
    } else if (rawType.includes('apple')) {
        type = 'applepay';
    } else {
        type = 'card';
    }

    let provider = m.provider || (type === 'bank' ? 'Deutsche Bank' : type === 'paypal' ? 'PayPal' : 'Mastercard');
    let last4 = m.last4 ? String(m.last4) : '';
    if (!last4 && m.cardNumber) last4 = m.cardNumber.replace(/\D/g, '').slice(-4);
    if (!last4 && m.number) last4 = String(m.number).replace(/\D/g, '').slice(-4);
    if (!last4 && m.iban) last4 = m.iban.replace(/\s/g, '').slice(-4);
    if (!last4 && type === 'card') last4 = '4242';

    const holder = m.holder || m.name || m.cardHolder || defaultUserName;
    const expiry = m.expiry || m.validThru || '12/28';
    const email = m.email || 'khiam@grien.de';
    const iban = m.iban || (last4 ? `DE91 •••• •••• •••• ${last4}` : 'DE91 •••• •••• •••• 6789');

    return {
        id,
        type,
        provider,
        last4,
        holder,
        expiry,
        email,
        iban
    };
};

export default function GrienShopPage() {
    const navigate = useNavigate();

    // Authentication & Profile
    let currentUser = null;
    try {
        const authCtx = useAuth();
        if (authCtx) currentUser = authCtx.user;
    } catch {
        // Fallback if rendered outside provider
    }
    const currentUserName = currentUser?.name || 'Khiam Azizi';

    // Theme Detection with robust fallback
    let currentTheme = 'dark';
    try {
        const themeCtx = useTheme();
        if (themeCtx && themeCtx.theme) currentTheme = themeCtx.theme;
    } catch {
        currentTheme = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'dark';
    }
    const isDark = currentTheme === 'dark';

    // Theme Colors Definition (Ensures 100% predictable contrast in both Light & Dark modes)
    const C = {
        pageBg: isDark ? '#080A09' : '#F8FAF8',
        cardBg: isDark ? '#121613' : '#FFFFFF',
        headerBg: isDark ? '#0B0F0C' : '#FFFFFF',
        textPrimary: isDark ? '#FFFFFF' : '#0A0A0A',
        textSecondary: isDark ? '#94A3B8' : '#64748B',
        borderMain: isDark ? '#232B25' : '#E2E8F0',
        inputBg: isDark ? '#141A16' : '#FFFFFF',
        inputBorder: isDark ? '#2A382E' : '#CBD5E1',
        brandGreen: '#00FF88',
        emeraldAccent: '#10B981',
    };

    // Filters & Search
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('popular');

    // Cart State
    const [cart, setCart] = useState(() => {
        try {
            const saved = localStorage.getItem('grien_shop_cart');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Dynamic Shop Products from Product Hub API (with fallback)
    const [shopProducts, setShopProducts] = useState(() => {
        try {
            const cached = localStorage.getItem('grien_shop_products_cache');
            return cached ? JSON.parse(cached) : PRODUCTS;
        } catch {
            return PRODUCTS;
        }
    });

    useEffect(() => {
        let isMounted = true;
        const loadProducts = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/shop/products?status=active');
                if (!res.ok) throw new Error('API offline');
                const data = await res.json();
                if (isMounted && data.success && Array.isArray(data.products) && data.products.length > 0) {
                    setShopProducts(data.products);
                    localStorage.setItem('grien_shop_products_cache', JSON.stringify(data.products));
                }
            } catch (err) {
                // Keep current products
            }
        };

        loadProducts();

        const onFocus = () => loadProducts();
        window.addEventListener('focus', onFocus);
        return () => {
            isMounted = false;
            window.removeEventListener('focus', onFocus);
        };
    }, []);

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedProductImgIdx, setSelectedProductImgIdx] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState('');
    const [addedFeedback, setAddedFeedback] = useState(null);

    // Orders & Invoices Side Sheet State
    const [isOrdersOpen, setIsOrdersOpen] = useState(false);
    const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
    const [orders, setOrders] = useState(() => {
        try {
            const saved = localStorage.getItem('grien_shop_orders');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}

        return [
            {
                id: 'GR-SHOP-849201',
                date: new Date(Date.now() - 86400000 * 2).toISOString(),
                status: 'Zugestellt',
                statusCode: 'delivered',
                items: [
                    {
                        id: 'p-fashion-1',
                        name: 'Grien Signature Cyber Hoodie',
                        price: 89.00,
                        quantity: 1,
                        variant: 'L',
                        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'
                    },
                    {
                        id: 'p-perfume-1',
                        name: 'Grien N°1 „Midnight Emerald“ Eau de Parfum',
                        price: 135.00,
                        quantity: 1,
                        variant: '100ml',
                        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80'
                    }
                ],
                subtotal: 224.00,
                total: 224.00,
                method: {
                    type: 'card',
                    brand: 'Mastercard',
                    last4: '4242',
                    holder: currentUserName
                },
                address: {
                    fullName: currentUserName,
                    street: 'Kurfürstendamm 21',
                    postalCode: '10719',
                    city: 'Berlin',
                    phone: '+49 170 1234567'
                }
            }
        ];
    });

    const handleReorder = (order) => {
        if (!order || !Array.isArray(order.items)) return;
        setCart(prev => {
            const updated = [...prev];
            order.items.forEach(newItem => {
                const idx = updated.findIndex(i => i.id === newItem.id && i.variant === newItem.variant);
                if (idx > -1) {
                    updated[idx].quantity += (newItem.quantity || 1);
                } else {
                    updated.push({
                        ...newItem,
                        quantity: newItem.quantity || 1
                    });
                }
            });
            localStorage.setItem('grien_shop_cart', JSON.stringify(updated));
            return updated;
        });
        setAddedFeedback('Artikel erneut in den Warenkorb gelegt!');
        setTimeout(() => setAddedFeedback(null), 2500);
        setIsOrdersOpen(false);
        setIsCartOpen(true);
        setCartStep('cart');
    };

    // ==========================================
    // CHECKOUT & PAYMENT FLOW STATE
    // ==========================================
    // Steps: 'cart' | 'checkout' | 'success'
    const [cartStep, setCartStep] = useState('cart');

    // Stored Payment Methods with rigorous normalization
    const [paymentMethods, setPaymentMethods] = useState(() => {
        let list = [];
        try {
            const saved = localStorage.getItem('green_payment_methods');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    list = parsed.map((m, idx) => normalizePaymentMethod(m, idx, currentUserName)).filter(Boolean);
                }
            }
        } catch (e) {
            console.error(e);
        }
        if (!list || list.length === 0) {
            list = [
                {
                    id: 'pm-1',
                    type: 'card',
                    provider: 'Mastercard',
                    last4: '4242',
                    holder: currentUserName,
                    expiry: '12/28'
                },
                {
                    id: 'pm-2',
                    type: 'bank',
                    provider: 'Deutsche Bank',
                    last4: '6789',
                    holder: currentUserName,
                    iban: 'DE91 •••• •••• •••• 6789'
                },
                {
                    id: 'pm-3',
                    type: 'paypal',
                    provider: 'PayPal',
                    email: currentUser?.email || 'khiam@grien.de'
                }
            ];
        }
        return list;
    });

    const [selectedMethodId, setSelectedMethodId] = useState(() => {
        return paymentMethods[0]?.id || 'pm-1';
    });

    // Add New Payment Method Modal / Form
    const [showAddMethod, setShowAddMethod] = useState(false);
    const [addMethodType, setAddMethodType] = useState('card'); // 'card' | 'bank' | 'paypal'
    const [cardForm, setCardForm] = useState({
        number: '',
        holder: currentUserName,
        expiry: '',
        cvv: ''
    });
    const [bankForm, setBankForm] = useState({
        holder: currentUserName,
        iban: '',
        bankName: ''
    });
    const [paypalForm, setPaypalForm] = useState({
        email: currentUser?.email || ''
    });
    const [formError, setFormError] = useState('');

    // Delivery Address - Loaded from LocalStorage or user entered
    const [deliveryAddress, setDeliveryAddress] = useState(() => {
        try {
            const saved = localStorage.getItem('grien_user_delivery_address');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    return {
                        name: parsed.name || currentUserName,
                        street: parsed.street || '',
                        zipCity: parsed.zipCity || '',
                        phone: parsed.phone || currentUser?.phoneNumber || '+49 170 1234567',
                        notes: parsed.notes || 'Grien Express Chauffeur'
                    };
                }
            }
        } catch (e) {
            console.error(e);
        }
        return {
            name: currentUserName,
            street: '',
            zipCity: '',
            phone: currentUser?.phoneNumber || '+49 170 1234567',
            notes: 'Grien Express Chauffeur'
        };
    });

    // If no street address has been entered yet, start in edit mode so the user sees and enters their address!
    const [isEditingAddress, setIsEditingAddress] = useState(() => {
        try {
            const saved = localStorage.getItem('grien_user_delivery_address');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.street && parsed.zipCity) return false;
            }
        } catch {}
        return !deliveryAddress.street;
    });

    const handleSaveAddress = () => {
        try {
            localStorage.setItem('grien_user_delivery_address', JSON.stringify(deliveryAddress));
        } catch (e) {
            console.error(e);
        }
        setIsEditingAddress(false);
        setAddedFeedback('Lieferadresse gespeichert!');
        setTimeout(() => setAddedFeedback(null), 2200);
    };

    // Order Processing
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [completedOrder, setCompletedOrder] = useState(null);

    // ==========================================
    // INFINITE SMOOTH CIRCULAR CAROUSEL LOGIC
    // ==========================================
    const loopCategories = useMemo(() => {
        const list = [];
        for (let s = 0; s < CATEGORY_SETS_COUNT; s++) {
            BASE_CATEGORIES.forEach(c => {
                list.push({
                    ...c,
                    loopKey: `set_${s}_${c.id}`
                });
            });
        }
        return list;
    }, []);

    const carouselRef = useRef(null);
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftRef = useRef(0);
    const movedDistanceRef = useRef(0);
    const momentumVelocityRef = useRef(0);
    const lastTimeRef = useRef(0);
    const lastXRef = useRef(0);
    const animFrameRef = useRef(null);

    // Center scroll on middle set on mount
    useEffect(() => {
        const el = carouselRef.current;
        if (!el) return;
        const setInitialPosition = () => {
            const singleSetWidth = el.scrollWidth / CATEGORY_SETS_COUNT;
            if (singleSetWidth > 0) {
                el.scrollLeft = singleSetWidth * 2; // Middle set is index 2
            }
        };
        setInitialPosition();
        const timer = setTimeout(setInitialPosition, 60);
        return () => clearTimeout(timer);
    }, []);

    // Handle seamless infinite wrapping in both directions
    const handleCarouselScroll = () => {
        const el = carouselRef.current;
        if (!el) return;
        const totalW = el.scrollWidth;
        const singleSetWidth = totalW / CATEGORY_SETS_COUNT;
        if (singleSetWidth <= 0) return;

        if (el.scrollLeft < singleSetWidth * 1.2) {
            el.scrollLeft += singleSetWidth * 2;
        } else if (el.scrollLeft > singleSetWidth * 3.8) {
            el.scrollLeft -= singleSetWidth * 2;
        }
    };

    // Mouse drag support for desktop
    const handleMouseDown = (e) => {
        const el = carouselRef.current;
        if (!el) return;
        isDraggingRef.current = true;
        movedDistanceRef.current = 0;
        startXRef.current = e.pageX - el.offsetLeft;
        scrollLeftRef.current = el.scrollLeft;
        lastXRef.current = e.pageX;
        lastTimeRef.current = Date.now();
        momentumVelocityRef.current = 0;
        cancelAnimationFrame(animFrameRef.current);
    };

    const handleMouseMove = (e) => {
        if (!isDraggingRef.current) return;
        const el = carouselRef.current;
        if (!el) return;

        const x = e.pageX - el.offsetLeft;
        const walk = (x - startXRef.current) * 1.3;
        const dist = Math.abs(e.pageX - lastXRef.current);
        movedDistanceRef.current += dist;

        el.scrollLeft = scrollLeftRef.current - walk;

        const now = Date.now();
        const dt = now - lastTimeRef.current;
        if (dt > 0) {
            momentumVelocityRef.current = (e.pageX - lastXRef.current) / dt;
        }
        lastXRef.current = e.pageX;
        lastTimeRef.current = now;
    };

    const handleMouseUp = () => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;

        const el = carouselRef.current;
        if (!el) return;

        let vel = momentumVelocityRef.current * 14;
        const glide = () => {
            if (Math.abs(vel) > 0.4) {
                el.scrollLeft -= vel;
                vel *= 0.92;
                animFrameRef.current = requestAnimationFrame(glide);
            }
        };
        animFrameRef.current = requestAnimationFrame(glide);
    };

    // Touch support for phones
    const touchStartXRef = useRef(0);
    const handleTouchStart = (e) => {
        touchStartXRef.current = e.touches[0].clientX;
        movedDistanceRef.current = 0;
    };

    const handleTouchMove = (e) => {
        const dist = Math.abs(e.touches[0].clientX - touchStartXRef.current);
        movedDistanceRef.current = dist;
    };

    const handleCategoryClick = (categoryId) => {
        // Prevent clicking if user was dragging/swiping
        if (movedDistanceRef.current > 8) {
            return;
        }
        setSelectedCategory(categoryId);
    };

    const scrollByAmount = (offset) => {
        if (!carouselRef.current) return;
        carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    };

    const updateCart = (newCart) => {
        setCart(newCart);
        try {
            localStorage.setItem('grien_shop_cart', JSON.stringify(newCart));
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddToCart = (product, variant = null) => {
        const chosenVariant = variant || (product.variants ? product.variants[0] : null);
        const itemKey = `${product.id}_${chosenVariant || 'def'}`;

        const existingIndex = cart.findIndex(item => item.itemKey === itemKey);
        let updated;
        if (existingIndex > -1) {
            updated = [...cart];
            updated[existingIndex].quantity += 1;
        } else {
            updated = [
                ...cart,
                {
                    itemKey,
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    variant: chosenVariant,
                    quantity: 1
                }
            ];
        }
        updateCart(updated);

        setAddedFeedback(product.name);
        setTimeout(() => setAddedFeedback(null), 2400);
    };

    const handleQuantityChange = (itemKey, delta) => {
        const updated = cart.map(item => {
            if (item.itemKey === itemKey) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
        }).filter(Boolean);
        updateCart(updated);
    };

    const handleRemoveItem = (itemKey) => {
        const updated = cart.filter(item => item.itemKey !== itemKey);
        updateCart(updated);
    };

    const totalItemsCount = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }, [cart]);

    const subtotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [cart]);

    const filteredProducts = useMemo(() => {
        return (shopProducts || []).filter(prod => {
            if (prod.isActive === false) return false;
            const matchesCat = selectedCategory === 'all' || prod.category === selectedCategory;
            const matchesSearch = !searchQuery.trim() || 
                (prod.name && prod.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (prod.categoryLabel && prod.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (prod.tag && prod.tag.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCat && matchesSearch;
        }).sort((a, b) => {
            if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
            if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
            return (b.rating || 5) - (a.rating || 5);
        });
    }, [shopProducts, selectedCategory, searchQuery, sortBy]);

    // ==========================================
    // PAYMENT FORM HANDLERS
    // ==========================================
    const handleSaveNewPaymentMethod = (e) => {
        if (e) e.preventDefault();
        setFormError('');

        let newMethod = null;

        if (addMethodType === 'card') {
            const cleanDigits = cardForm.number.replace(/\s+/g, '');
            if (cleanDigits.length < 15) {
                setFormError('Bitte gib eine gültige 16-stellige Kreditkartennummer ein.');
                return;
            }
            if (!cardForm.holder.trim()) {
                setFormError('Bitte gib den Namen des Karteninhabers ein.');
                return;
            }
            if (cardForm.expiry.length < 5) {
                setFormError('Bitte gib das Ablaufdatum im Format MM/JJ ein.');
                return;
            }
            if (cardForm.cvv.length < 3) {
                setFormError('Bitte gib den 3-stelligen Sicherheitscode (CVV) ein.');
                return;
            }

            const isVisa = cleanDigits.startsWith('4');
            const isMaster = cleanDigits.startsWith('5');
            const isAmex = cleanDigits.startsWith('3');
            const provider = isVisa ? 'Visa' : isMaster ? 'Mastercard' : isAmex ? 'American Express' : 'Kreditkarte';

            newMethod = {
                id: `pm-${Date.now()}`,
                type: 'card',
                provider,
                last4: cleanDigits.slice(-4),
                holder: cardForm.holder.trim(),
                expiry: cardForm.expiry
            };
        } else if (addMethodType === 'bank') {
            const cleanIban = bankForm.iban.replace(/\s+/g, '').toUpperCase();
            if (cleanIban.length < 15) {
                setFormError('Bitte gib eine gültige IBAN (mind. 15 Zeichen) ein.');
                return;
            }
            if (!bankForm.holder.trim()) {
                setFormError('Bitte gib den Namen des Kontoinhabers ein.');
                return;
            }

            newMethod = {
                id: `pm-${Date.now()}`,
                type: 'bank',
                provider: bankForm.bankName.trim() || 'SEPA Bankkonto',
                last4: cleanIban.slice(-4),
                holder: bankForm.holder.trim(),
                iban: `${cleanIban.slice(0, 4)} •••• •••• •••• ${cleanIban.slice(-4)}`
            };
        } else if (addMethodType === 'paypal') {
            if (!paypalForm.email.includes('@') || !paypalForm.email.includes('.')) {
                setFormError('Bitte gib eine gültige PayPal E-Mail-Adresse ein.');
                return;
            }

            newMethod = {
                id: `pm-${Date.now()}`,
                type: 'paypal',
                provider: 'PayPal',
                email: paypalForm.email.trim()
            };
        }

        if (newMethod) {
            const updated = [...paymentMethods, newMethod];
            setPaymentMethods(updated);
            try {
                localStorage.setItem('green_payment_methods', JSON.stringify(updated));
            } catch (err) {
                console.error(err);
            }
            setSelectedMethodId(newMethod.id);
            setShowAddMethod(false);
            setCardForm({ number: '', holder: currentUserName, expiry: '', cvv: '' });
            setBankForm({ holder: currentUserName, iban: '', bankName: '' });
            setPaypalForm({ email: currentUser?.email || '' });
            setAddedFeedback('Zahlungsmethode erfolgreich hinzugefügt!');
            setTimeout(() => setAddedFeedback(null), 2500);
        }
    };

    const handleConfirmOrder = () => {
        const chosenMethod = paymentMethods.find(m => String(m.id) === String(selectedMethodId)) || paymentMethods[0];
        if (!chosenMethod) {
            setShowAddMethod(true);
            return;
        }

        if (!deliveryAddress.street || !deliveryAddress.zipCity) {
            setIsEditingAddress(true);
            setAddedFeedback('Bitte gib zuerst eine Lieferadresse an!');
            setTimeout(() => setAddedFeedback(null), 2500);
            return;
        }

        setIsProcessingPayment(true);

        setTimeout(() => {
            const orderId = Math.floor(100000 + Math.random() * 900000);
            const order = {
                orderId,
                items: [...cart],
                subtotal,
                total: subtotal,
                method: chosenMethod,
                address: { ...deliveryAddress },
                date: new Date().toISOString()
            };

            try {
                const history = JSON.parse(localStorage.getItem('grien_shop_orders') || '[]');
                history.unshift(order);
                localStorage.setItem('grien_shop_orders', JSON.stringify(history));
            } catch (err) {
                console.error(err);
            }

            updateCart([]);
            setCompletedOrder(order);
            setOrders(prev => [order, ...prev]);
            setIsProcessingPayment(false);
            setCartStep('success');
        }, 1500);
    };

    const activePaymentMethod = useMemo(() => {
        const found = paymentMethods.find(m => String(m.id) === String(selectedMethodId));
        return found || paymentMethods[0] || null;
    }, [paymentMethods, selectedMethodId]);

    return (
        /* Full Viewport Scrollable Wrapper: Solves the overflow:hidden cutoff completely */
        <div 
            className="fixed inset-0 overflow-y-auto no-scrollbar font-sans select-text z-30"
            style={{ 
                backgroundColor: C.pageBg, 
                color: C.textPrimary,
                WebkitOverflowScrolling: 'touch' 
            }}
        >
            
            {/* STICKY HEADER WITH MAXIMUM CONTRAST */}
            <header 
                className="sticky top-0 z-40 backdrop-blur-2xl px-4 md:px-6 py-4 shadow-sm"
                style={{ 
                    backgroundColor: isDark ? 'rgba(11, 15, 12, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    borderBottom: `1.5px solid ${C.borderMain}`
                }}
            >
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    
                    {/* Back Button & Brand */}
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/home')}
                            className="w-11 h-11 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                            style={{ 
                                backgroundColor: isDark ? '#161B17' : '#F1F5F9',
                                border: `1.5px solid ${C.borderMain}`,
                                color: C.textPrimary
                            }}
                            aria-label="Zurück zur Home"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span 
                                    className="text-xl md:text-2xl font-black italic tracking-tighter uppercase"
                                    style={{ color: C.textPrimary }}
                                >
                                    GRIEN <span style={{ color: C.brandGreen }}>SHOP</span>
                                </span>
                                <span 
                                    className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full"
                                    style={{ 
                                        backgroundColor: 'rgba(0, 255, 136, 0.15)',
                                        color: isDark ? C.brandGreen : '#059669',
                                        border: '1px solid rgba(0, 255, 136, 0.35)'
                                    }}
                                >
                                    Official
                                </span>
                            </div>
                            <p 
                                className="text-[10px] md:text-xs font-bold tracking-wider"
                                style={{ color: C.textSecondary }}
                            >
                                Klamotten, Elektronik & Lifestyle
                            </p>
                        </div>
                    </div>

                    {/* RIGHT HEADER ACTIONS: ORDERS/INVOICES BUTTON + CART BUTTON */}
                    <div className="flex items-center gap-2.5">
                        {/* ORDERS & INVOICES BUTTON */}
                        <button
                            onClick={() => setIsOrdersOpen(true)}
                            className="relative w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                            style={{ 
                                backgroundColor: isDark ? '#161B17' : '#F1F5F9',
                                border: `1.5px solid ${C.borderMain}`,
                                color: C.textPrimary
                            }}
                            title="Meine Bestellungen & Rechnungen"
                            aria-label="Meine Bestellungen & Rechnungen"
                        >
                            <Receipt size={21} strokeWidth={2.4} style={{ color: C.textPrimary }} />
                            {orders.length > 0 && (
                                <motion.span 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 text-[10px] font-black rounded-full flex items-center justify-center shadow-md"
                                    style={{ 
                                        backgroundColor: '#10B981',
                                        color: '#FFFFFF',
                                        border: `2px solid ${isDark ? '#0B0F0C' : '#FFFFFF'}`
                                    }}
                                >
                                    {orders.length}
                                </motion.span>
                            )}
                        </button>

                        {/* CART BUTTON WITH CRYSTAL CLEAR HIGH CONTRAST */}
                        <button
                            onClick={() => {
                                setCartStep('cart');
                                setIsCartOpen(true);
                            }}
                            className="relative w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
                            style={{ 
                                backgroundColor: isDark ? '#FFFFFF' : '#0F172A',
                                border: `2px solid ${isDark ? '#FFFFFF' : '#0F172A'}`,
                                color: isDark ? '#0F172A' : '#FFFFFF'
                            }}
                            aria-label="Warenkorb öffnen"
                        >
                            <ShoppingBag size={22} strokeWidth={2.5} style={{ color: isDark ? '#0F172A' : '#FFFFFF' }} />
                            {totalItemsCount > 0 ? (
                                <motion.span 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 text-[11px] font-black rounded-full flex items-center justify-center shadow-lg"
                                    style={{ 
                                        backgroundColor: C.brandGreen,
                                        color: '#000000',
                                        border: `2px solid ${isDark ? '#0B0F0C' : '#FFFFFF'}`
                                    }}
                                >
                                    {totalItemsCount}
                                </motion.span>
                            ) : (
                                <span 
                                    className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
                                    style={{ backgroundColor: C.brandGreen }}
                                />
                            )}
                        </button>
                    </div>
                </div>

                {/* SEARCH BAR */}
                <div className="max-w-6xl mx-auto mt-4">
                    <div className="relative">
                        <Search 
                            size={18} 
                            className="absolute left-4 top-1/2 -translate-y-1/2" 
                            style={{ color: C.textSecondary }}
                        />
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Suche nach Klamotten, Parfüm, Elektronik, Geschenken..."
                            className="w-full pl-12 pr-10 py-3.5 rounded-2xl text-sm transition-all shadow-sm font-medium focus:outline-none"
                            style={{ 
                                backgroundColor: C.inputBg,
                                border: `1.5px solid ${C.inputBorder}`,
                                color: C.textPrimary
                            }}
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs cursor-pointer"
                                style={{ 
                                    backgroundColor: isDark ? '#232B25' : '#E2E8F0',
                                    color: C.textPrimary
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* INFINITE CIRCULAR TOUCH/FINGER DRAGGABLE CAROUSEL */}
                <div className="max-w-6xl mx-auto mt-4 relative select-none">
                    
                    {/* Desktop Left/Right quick scroll buttons */}
                    <button
                        onClick={() => scrollByAmount(-220)}
                        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full shadow-lg items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
                        style={{ 
                            backgroundColor: isDark ? '#161B17' : '#FFFFFF',
                            border: `1.5px solid ${C.borderMain}`,
                            color: C.textPrimary
                        }}
                        aria-label="Nach links scrollen"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => scrollByAmount(220)}
                        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full shadow-lg items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
                        style={{ 
                            backgroundColor: isDark ? '#161B17' : '#FFFFFF',
                            border: `1.5px solid ${C.borderMain}`,
                            color: C.textPrimary
                        }}
                        aria-label="Nach rechts scrollen"
                    >
                        <ChevronRight size={18} />
                    </button>

                    <div
                        ref={carouselRef}
                        onScroll={handleCarouselScroll}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-2 cursor-grab active:cursor-grabbing px-2"
                        style={{ 
                            WebkitOverflowScrolling: 'touch',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none'
                        }}
                    >
                        {loopCategories.map(cat => {
                            const isSelected = selectedCategory === cat.id;
                            const IconComponent = cat.icon;
                            return (
                                <button
                                    key={cat.loopKey}
                                    onClick={() => handleCategoryClick(cat.id)}
                                    className="flex-shrink-0 px-4 py-2.5 rounded-2xl text-xs md:text-sm flex items-center gap-2.5 transition-all duration-200 cursor-pointer shadow-sm select-none"
                                    style={{
                                        backgroundColor: isSelected 
                                            ? C.brandGreen 
                                            : (isDark ? '#161B17' : '#FFFFFF'),
                                        color: isSelected 
                                            ? '#000000' 
                                            : C.textPrimary,
                                        border: isSelected 
                                            ? `2px solid ${C.brandGreen}` 
                                            : `1.5px solid ${C.borderMain}`,
                                        fontWeight: isSelected ? 900 : 700,
                                        boxShadow: isSelected ? '0 4px 14px rgba(0, 255, 136, 0.35)' : 'none',
                                        transform: isSelected ? 'scale(1.04)' : 'scale(1)'
                                    }}
                                >
                                    <IconComponent 
                                        size={17} 
                                        strokeWidth={isSelected ? 3 : 2.2} 
                                        style={{ 
                                            color: isSelected ? '#000000' : (isDark ? C.brandGreen : C.emeraldAccent) 
                                        }} 
                                    />
                                    <span className="whitespace-nowrap tracking-tight">{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* HIGH CONTRAST LUXURY HERO BANNER */}
            <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6">
                <div 
                    className="relative rounded-[32px] overflow-hidden p-6 md:p-10 shadow-2xl dark-catalog-card"
                    style={{ 
                        background: 'linear-gradient(135deg, #022013 0%, #06150F 50%, #020705 100%)',
                        border: '1.5px solid rgba(0, 255, 136, 0.35)',
                        color: '#FFFFFF'
                    }}
                >
                    <div 
                        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
                        style={{ backgroundColor: 'rgba(0, 255, 136, 0.18)' }} 
                    />
                    <div className="relative z-10 max-w-xl">
                        
                        <div 
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider mb-3 shadow-md"
                            style={{ 
                                backgroundColor: C.brandGreen, 
                                color: '#000000' 
                            }}
                        >
                            <Sparkles size={13} strokeWidth={2.5} /> OFFICIAL GRIEN COLLECTION
                        </div>

                        {/* PURE WHITE HEADLINE - 100% UNBEATABLE CONTRAST */}
                        <div 
                            className="text-2xl md:text-4xl font-black italic tracking-tight uppercase leading-tight drop-shadow-lg mb-2"
                        >
                            <span style={{ color: '#FFFFFF' }}>DAS BESTE AUS </span>
                            <span style={{ color: C.brandGreen }}>FASHION, TECH</span>
                            <span style={{ color: '#FFFFFF' }}> & LIFESTYLE</span>
                        </div>

                        <p 
                            className="text-xs md:text-sm font-medium leading-relaxed mb-5"
                            style={{ color: '#E2E8F0' }}
                        >
                            Entdecke handverlesene Streetwear, innovative Gadgets und edle Signature-Düfte – direkt zu dir geliefert.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                            <span 
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl backdrop-blur-md"
                                style={{ 
                                    backgroundColor: 'rgba(0, 0, 0, 0.65)', 
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: '#FFFFFF'
                                }}
                            >
                                <Truck size={15} style={{ color: C.brandGreen }} /> Blitzschneller Expressversand
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RESULTS HEADER & SORT */}
            <div className="max-w-6xl mx-auto px-4 md:px-6 pt-8 pb-4 flex items-center justify-between">
                <span 
                    className="text-xs md:text-sm font-black uppercase tracking-wider"
                    style={{ color: C.textSecondary }}
                >
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'Artikel gefunden' : 'Artikel gefunden'}
                </span>
                <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} style={{ color: C.textSecondary }} />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
                        style={{ 
                            backgroundColor: isDark ? '#161B17' : '#FFFFFF',
                            border: `1.5px solid ${C.borderMain}`,
                            color: C.textPrimary
                        }}
                    >
                        <option value="popular">Beliebteste</option>
                        <option value="price-asc">Preis: Günstig zuerst</option>
                        <option value="price-desc">Preis: Exklusiv zuerst</option>
                    </select>
                </div>
            </div>

            {/* PRODUCT GRID */}
            <main className="max-w-6xl mx-auto px-4 md:px-6 pb-36">
                {filteredProducts.length === 0 ? (
                    <div 
                        className="text-center py-20 rounded-3xl border-2 border-dashed"
                        style={{ 
                            backgroundColor: C.cardBg,
                            borderColor: C.borderMain
                        }}
                    >
                        <ShoppingBag size={48} className="mx-auto mb-4" style={{ color: C.textSecondary }} />
                        <h3 className="text-lg font-bold" style={{ color: C.textPrimary }}>Keine Artikel gefunden</h3>
                        <p className="text-xs mt-1" style={{ color: C.textSecondary }}>Versuche eine andere Kategorie oder einen anderen Suchbegriff.</p>
                        <button
                            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                            className="mt-4 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                            style={{ backgroundColor: C.brandGreen, color: '#000000' }}
                        >
                            Filter zurücksetzen
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {filteredProducts.map(product => (
                            <motion.div
                                layout
                                key={product.id}
                                className="group relative rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-xl"
                                style={{ 
                                    backgroundColor: C.cardBg,
                                    border: `1.5px solid ${C.borderMain}`
                                }}
                            >
                                {/* IMAGE & BADGE */}
                                <div 
                                    className="relative aspect-square w-full overflow-hidden cursor-pointer"
                                    style={{ backgroundColor: '#0B0F0C' }}
                                    onClick={() => setSelectedProduct(product)}
                                >
                                    <img 
                                        src={product.image} 
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                    {product.tag && (
                                        <span 
                                            className="absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md backdrop-blur-md"
                                            style={{ 
                                                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                                color: C.brandGreen,
                                                border: '1px solid rgba(0, 255, 136, 0.35)'
                                            }}
                                        >
                                            {product.tag}
                                        </span>
                                    )}
                                    <div 
                                        className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-md backdrop-blur-md"
                                        style={{ 
                                            backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                            color: '#FBBF24',
                                            border: '1px solid rgba(255, 255, 255, 0.15)'
                                        }}
                                    >
                                        <Star size={10} fill="currentColor" /> {product.rating}
                                    </div>
                                </div>

                                {/* DETAILS */}
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div onClick={() => setSelectedProduct(product)} className="cursor-pointer">
                                        <span 
                                            className="text-[10px] font-black uppercase tracking-wider"
                                            style={{ color: isDark ? C.brandGreen : C.emeraldAccent }}
                                        >
                                            {product.categoryLabel}
                                        </span>
                                        <h3 
                                            className="font-bold text-sm md:text-base leading-snug line-clamp-2 mt-0.5 transition-colors"
                                            style={{ color: C.textPrimary }}
                                        >
                                            {product.name}
                                        </h3>
                                    </div>

                                    {/* PRICE & ADD BUTTON */}
                                    <div 
                                        className="mt-4 pt-3 flex items-center justify-between gap-2"
                                        style={{ borderTop: `1px solid ${C.borderMain}` }}
                                    >
                                        <div>
                                            <div className="flex items-baseline gap-1.5">
                                                <span 
                                                    className="text-base md:text-lg font-black tracking-tight"
                                                    style={{ color: C.textPrimary }}
                                                >
                                                    {product.price.toFixed(2)} €
                                                </span>
                                                {product.originalPrice && (
                                                    <span 
                                                        className="text-xs line-through"
                                                        style={{ color: C.textSecondary }}
                                                    >
                                                        {product.originalPrice.toFixed(2)} €
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            className="w-10 h-10 rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md font-bold cursor-pointer"
                                            style={{ 
                                                backgroundColor: C.brandGreen, 
                                                color: '#000000' 
                                            }}
                                            title="In den Warenkorb"
                                        >
                                            <Plus size={18} strokeWidth={3} style={{ color: '#000000' }} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* TOAST FEEDBACK */}
            <AnimatePresence>
                {addedFeedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
                        style={{ 
                            backgroundColor: '#0A0E0B', 
                            color: '#FFFFFF',
                            border: `1.5px solid ${C.brandGreen}`
                        }}
                    >
                        <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: C.brandGreen, color: '#000000' }}
                        >
                            <Check size={14} strokeWidth={3} />
                        </div>
                        <span className="text-xs font-bold">
                            <span style={{ color: C.brandGreen }}>{addedFeedback}</span>
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PRODUCT DETAIL MODAL */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            className="absolute inset-0 bg-black/75 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative z-10 w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                            style={{ 
                                backgroundColor: C.cardBg,
                                border: `1.5px solid ${C.borderMain}`,
                                color: C.textPrimary
                            }}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            {/* Image Header with Multi-Image Support */}
                            <div className="relative h-64 md:h-72 w-full overflow-hidden bg-slate-900 group">
                                {(() => {
                                    const pImages = (Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0)
                                        ? selectedProduct.images
                                        : [selectedProduct.image];
                                    const currImg = pImages[selectedProductImgIdx] || selectedProduct.image;
                                    return (
                                        <>
                                            <img 
                                                src={currImg} 
                                                alt={selectedProduct.name}
                                                className="w-full h-full object-cover transition-all duration-300"
                                            />
                                            {pImages.length > 1 && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedProductImgIdx(prev => (prev > 0 ? prev - 1 : pImages.length - 1));
                                                        }}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all cursor-pointer shadow"
                                                    >
                                                        <ChevronLeft size={18} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedProductImgIdx(prev => (prev < pImages.length - 1 ? prev + 1 : 0));
                                                        }}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all cursor-pointer shadow"
                                                    >
                                                        <ChevronRight size={18} />
                                                    </button>
                                                    <span className="absolute bottom-3 right-3 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/80 text-white border border-white/20 backdrop-blur-sm">
                                                        {selectedProductImgIdx + 1} / {pImages.length}
                                                    </span>
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                                <div 
                                    className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent pointer-events-none" 
                                    style={{ backgroundImage: `linear-gradient(to top, ${C.cardBg}, transparent)` }}
                                />
                            </div>

                            {/* Thumbnail strip in modal if > 1 image */}
                            {Array.isArray(selectedProduct.images) && selectedProduct.images.length > 1 && (
                                <div className="px-6 py-2 border-b border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar" style={{ backgroundColor: C.surfaceBg }}>
                                    {selectedProduct.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedProductImgIdx(idx)}
                                            className={`w-11 h-11 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                                                selectedProductImgIdx === idx ? 'border-[#00FF88] scale-105 shadow-md shadow-[#00FF88]/20' : 'border-white/15 opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <img src={img} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Body Content */}
                            <div className="p-6 overflow-y-auto flex-1">
                                <span 
                                    className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                                    style={{ 
                                        backgroundColor: 'rgba(0, 255, 136, 0.15)',
                                        color: isDark ? C.brandGreen : C.emeraldAccent,
                                        border: '1px solid rgba(0, 255, 136, 0.3)'
                                    }}
                                >
                                    {selectedProduct.categoryLabel}
                                </span>
                                <h2 
                                    className="text-xl md:text-2xl font-black mt-2"
                                    style={{ color: C.textPrimary }}
                                >
                                    {selectedProduct.name}
                                </h2>
                                
                                <div className="flex items-center gap-3 mt-2">
                                    <span 
                                        className="text-2xl font-black"
                                        style={{ color: isDark ? C.brandGreen : C.emeraldAccent }}
                                    >
                                        {selectedProduct.price.toFixed(2)} €
                                    </span>
                                    {selectedProduct.originalPrice && (
                                        <span 
                                            className="text-sm line-through"
                                            style={{ color: C.textSecondary }}
                                        >
                                            {selectedProduct.originalPrice.toFixed(2)} €
                                        </span>
                                    )}
                                    <span 
                                        className="text-xs ml-auto flex items-center gap-1 font-bold"
                                        style={{ color: C.textSecondary }}
                                    >
                                        <Star size={12} className="text-amber-400 fill-amber-400" /> {selectedProduct.rating} ({selectedProduct.reviewsCount} Bewertungen)
                                    </span>
                                </div>

                                <p 
                                    className="text-xs md:text-sm mt-4 leading-relaxed font-medium"
                                    style={{ color: isDark ? '#CBD5E1' : '#475569' }}
                                >
                                    {selectedProduct.description}
                                </p>

                                {/* Variants (if any) */}
                                {selectedProduct.variants && selectedProduct.variants.length > 1 && (
                                    <div className="mt-5">
                                        <label 
                                            className="text-xs font-bold uppercase tracking-wider block mb-2"
                                            style={{ color: C.textSecondary }}
                                        >
                                            Variante / Größe auswählen:
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProduct.variants.map(v => {
                                                const sel = (selectedVariant || selectedProduct.variants[0]) === v;
                                                return (
                                                    <button
                                                        key={v}
                                                        onClick={() => setSelectedVariant(v)}
                                                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                                        style={{ 
                                                            backgroundColor: sel ? C.brandGreen : (isDark ? '#161B17' : '#F1F5F9'),
                                                            color: sel ? '#000000' : C.textPrimary,
                                                            border: sel ? `2px solid ${C.brandGreen}` : `1.5px solid ${C.borderMain}`,
                                                            fontWeight: sel ? 900 : 700
                                                        }}
                                                    >
                                                        {v}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Service Highlights */}
                                <div 
                                    className="mt-6 pt-5 grid grid-cols-2 gap-3 text-[11px] font-bold"
                                    style={{ 
                                        borderTop: `1px solid ${C.borderMain}`,
                                        color: C.textSecondary
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Truck size={14} style={{ color: C.brandGreen }} />
                                        <span>Schneller Grien Shuttle Versand</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RefreshCw size={14} style={{ color: C.brandGreen }} />
                                        <span>30 Tage kostenlose Rückgabe</span>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer / Add Button */}
                            <div 
                                className="p-5 flex items-center gap-3"
                                style={{ 
                                    backgroundColor: isDark ? '#0E1310' : '#F8FAFC',
                                    borderTop: `1px solid ${C.borderMain}`
                                }}
                            >
                                <button
                                    onClick={() => {
                                        handleAddToCart(selectedProduct, selectedVariant || selectedProduct.variants?.[0]);
                                        setSelectedProduct(null);
                                    }}
                                    className="flex-1 py-4 rounded-2xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl cursor-pointer"
                                    style={{ 
                                        backgroundColor: C.brandGreen, 
                                        color: '#000000' 
                                    }}
                                >
                                    <ShoppingBag size={18} />
                                    In den Warenkorb ({selectedProduct.price.toFixed(2)} €)
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ========================================================= */}
            {/* CART & CHECKOUT NATIVE BOTTOM SHEET (Vollwertiges Bottom-Sheet) */}
            {/* ========================================================= */}
            <AnimatePresence>
                {isCartOpen && (
                    <div className="fixed inset-0 z-50 flex flex-col justify-end">
                        {/* Darkened Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                if (!isProcessingPayment) setIsCartOpen(false);
                            }}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        />

                        {/* BOTTOM SHEET CONTAINER */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="relative z-10 w-full max-w-2xl mx-auto max-h-[88vh] h-[88vh] flex flex-col rounded-t-[36px] md:rounded-t-[44px] shadow-[0_-20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
                            style={{ 
                                backgroundColor: C.cardBg,
                                borderTop: `2px solid ${C.borderMain}`,
                                color: C.textPrimary
                            }}
                        >
                            {/* BOTTOM SHEET DRAG HANDLE PILL */}
                            <div className="pt-3 pb-1 flex justify-center flex-shrink-0 cursor-grab active:cursor-grabbing">
                                <div 
                                    className="w-12 h-1.5 rounded-full"
                                    style={{ backgroundColor: isDark ? '#333F36' : '#CBD5E1' }}
                                />
                            </div>

                            {/* DRAWER HEADER */}
                            <div 
                                className="px-5 py-3.5 flex items-center justify-between"
                                style={{ borderBottom: `1.5px solid ${C.borderMain}` }}
                            >
                                <div className="flex items-center gap-3">
                                    {cartStep === 'checkout' && (
                                        <button
                                            onClick={() => setCartStep('cart')}
                                            className="w-8 h-8 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                            style={{
                                                backgroundColor: isDark ? '#161B17' : '#F1F5F9',
                                                border: `1.5px solid ${C.borderMain}`,
                                                color: C.textPrimary
                                            }}
                                            aria-label="Zurück zum Warenkorb"
                                        >
                                            <ArrowLeft size={16} />
                                        </button>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {cartStep === 'cart' && <ShoppingBag size={20} style={{ color: C.brandGreen }} />}
                                        {cartStep === 'checkout' && <Lock size={20} style={{ color: C.brandGreen }} />}
                                        {cartStep === 'success' && <CheckCircle2 size={20} style={{ color: C.brandGreen }} />}
                                        <h2 
                                            className="font-black text-lg uppercase tracking-tight"
                                            style={{ color: C.textPrimary }}
                                        >
                                            {cartStep === 'cart' && `Warenkorb (${totalItemsCount})`}
                                            {cartStep === 'checkout' && 'Kasse & Bezahlung'}
                                            {cartStep === 'success' && 'Bestellung Bestätigt'}
                                        </h2>
                                    </div>
                                </div>
                                {!isProcessingPayment && (
                                    <button
                                        onClick={() => setIsCartOpen(false)}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
                                        style={{ 
                                            backgroundColor: isDark ? '#161B17' : '#F1F5F9',
                                            border: `1.5px solid ${C.borderMain}`,
                                            color: C.textPrimary
                                        }}
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>

                            {/* ========================================================= */}
                            {/* VIEW 1: CART ITEMS LIST */}
                            {/* ========================================================= */}
                            {cartStep === 'cart' && (
                                <>
                                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                        {cart.length === 0 ? (
                                            <div className="text-center py-24" style={{ color: C.textSecondary }}>
                                                <ShoppingBag size={52} className="mx-auto opacity-30 mb-3" />
                                                <p className="font-bold text-base" style={{ color: C.textPrimary }}>Dein Warenkorb ist leer</p>
                                                <p className="text-xs mt-1">Füge Artikel aus dem Shop hinzu, um fortzufahren.</p>
                                            </div>
                                        ) : (
                                            cart.map(item => (
                                                <div 
                                                    key={item.itemKey}
                                                    className="p-3.5 rounded-2xl flex items-center gap-3.5"
                                                    style={{ 
                                                        backgroundColor: isDark ? '#161B17' : '#F8FAFC',
                                                        border: `1.5px solid ${C.borderMain}`
                                                    }}
                                                >
                                                    <img 
                                                        src={item.image} 
                                                        alt={item.name} 
                                                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                                                        style={{ backgroundColor: '#0B0F0C' }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-xs truncate" style={{ color: C.textPrimary }}>{item.name}</h4>
                                                        {item.variant && (
                                                            <span 
                                                                className="text-[10px] font-bold block"
                                                                style={{ color: isDark ? C.brandGreen : C.emeraldAccent }}
                                                            >
                                                                Variante: {item.variant}
                                                            </span>
                                                        )}
                                                        <div 
                                                            className="text-xs font-black mt-1"
                                                            style={{ color: C.textPrimary }}
                                                        >
                                                            {(item.price * item.quantity).toFixed(2)} €
                                                        </div>
                                                    </div>

                                                    {/* Quantity Controls */}
                                                    <div 
                                                        className="flex items-center gap-2 px-2 py-1 rounded-xl"
                                                        style={{ 
                                                            backgroundColor: isDark ? '#0C100E' : '#FFFFFF',
                                                            border: `1.5px solid ${C.borderMain}`
                                                        }}
                                                    >
                                                        <button
                                                            onClick={() => handleQuantityChange(item.itemKey, -1)}
                                                            className="w-6 h-6 flex items-center justify-center text-xs font-bold cursor-pointer"
                                                            style={{ color: C.textSecondary }}
                                                        >
                                                            <Minus size={12} />
                                                        </button>
                                                        <span 
                                                            className="text-xs font-bold min-w-[14px] text-center"
                                                            style={{ color: C.textPrimary }}
                                                        >
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => handleQuantityChange(item.itemKey, 1)}
                                                            className="w-6 h-6 flex items-center justify-center text-xs font-bold cursor-pointer"
                                                            style={{ color: C.textSecondary }}
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => handleRemoveItem(item.itemKey)}
                                                        className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center justify-center cursor-pointer"
                                                        title="Entfernen"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Cart Footer */}
                                    {cart.length > 0 && (
                                        <div 
                                            className="p-5 space-y-3"
                                            style={{ 
                                                backgroundColor: isDark ? '#0E1310' : '#F8FAFC',
                                                borderTop: `1.5px solid ${C.borderMain}`
                                            }}
                                        >
                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex justify-between" style={{ color: C.textSecondary }}>
                                                    <span>Zwischensumme:</span>
                                                    <span className="font-bold" style={{ color: C.textPrimary }}>{subtotal.toFixed(2)} €</span>
                                                </div>
                                                <div className="flex justify-between" style={{ color: C.textSecondary }}>
                                                    <span>Chauffeur Express-Lieferung:</span>
                                                    <span className="font-bold" style={{ color: C.brandGreen }}>Kostenlos</span>
                                                </div>
                                                <div 
                                                    className="pt-2 flex justify-between text-base font-black"
                                                    style={{ borderTop: `1px solid ${C.borderMain}` }}
                                                >
                                                    <span style={{ color: C.textPrimary }}>Gesamtsumme:</span>
                                                    <span style={{ color: C.brandGreen }}>{subtotal.toFixed(2)} €</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setCartStep('checkout')}
                                                className="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl cursor-pointer"
                                                style={{ 
                                                    backgroundColor: C.brandGreen, 
                                                    color: '#000000' 
                                                }}
                                            >
                                                <CreditCard size={18} /> Zur Kasse & Bezahlung ({subtotal.toFixed(2)} €)
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* ========================================================= */}
                            {/* VIEW 2: CHECKOUT (PAYMENT METHOD & ADDRESS SELECTION) */}
                            {/* ========================================================= */}
                            {cartStep === 'checkout' && (
                                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                                    <div className="flex-1 overflow-y-auto p-5 space-y-5">

                                        {/* SECTION 1: DELIVERY ADDRESS */}
                                        <div 
                                            className="p-4 rounded-2xl"
                                            style={{ 
                                                backgroundColor: isDark ? '#161B17' : '#F8FAFC',
                                                border: `1.5px solid ${C.borderMain}`
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                                                    <MapPin size={15} style={{ color: C.brandGreen }} />
                                                    <span style={{ color: C.textPrimary }}>Lieferadresse</span>
                                                </div>
                                                <button
                                                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                                                    className="text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                                    style={{ color: isDark ? C.brandGreen : C.emeraldAccent }}
                                                >
                                                    <Edit3 size={12} /> {isEditingAddress ? 'Fertig' : 'Bearbeiten'}
                                                </button>
                                            </div>

                                            {isEditingAddress ? (
                                                <div className="space-y-2.5 mt-3 pt-2" style={{ borderTop: `1px solid ${C.borderMain}` }}>
                                                    <p className="text-[10px]" style={{ color: C.textSecondary }}>
                                                        Gib hier deine Lieferadresse ein. Sie wird automatisch für deine künftigen Grien-Bestellungen gespeichert:
                                                    </p>
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.textSecondary }}>Empfänger Name:</label>
                                                        <input 
                                                            type="text"
                                                            value={deliveryAddress.name}
                                                            onChange={e => setDeliveryAddress({ ...deliveryAddress, name: e.target.value })}
                                                            placeholder="z. B. Khiam Azizi"
                                                            className="w-full px-3 py-2 rounded-xl text-xs font-medium focus:outline-none"
                                                            style={{ backgroundColor: C.inputBg, border: `1.5px solid ${C.inputBorder}`, color: C.textPrimary }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.textSecondary }}>Straße & Hausnummer:</label>
                                                        <input 
                                                            type="text"
                                                            value={deliveryAddress.street}
                                                            onChange={e => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                                                            placeholder="z. B. Zeil 106"
                                                            className="w-full px-3 py-2 rounded-xl text-xs font-medium focus:outline-none"
                                                            style={{ backgroundColor: C.inputBg, border: `1.5px solid ${C.inputBorder}`, color: C.textPrimary }}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.textSecondary }}>PLZ & Ort:</label>
                                                            <input 
                                                                type="text"
                                                                value={deliveryAddress.zipCity}
                                                                onChange={e => setDeliveryAddress({ ...deliveryAddress, zipCity: e.target.value })}
                                                                placeholder="z. B. 60313 Frankfurt am Main"
                                                                className="w-full px-3 py-2 rounded-xl text-xs font-medium focus:outline-none"
                                                                style={{ backgroundColor: C.inputBg, border: `1.5px solid ${C.inputBorder}`, color: C.textPrimary }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.textSecondary }}>Telefonnummer:</label>
                                                            <input 
                                                                type="text"
                                                                value={deliveryAddress.phone}
                                                                onChange={e => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                                                                placeholder="+49 ..."
                                                                className="w-full px-3 py-2 rounded-xl text-xs font-medium focus:outline-none"
                                                                style={{ backgroundColor: C.inputBg, border: `1.5px solid ${C.inputBorder}`, color: C.textPrimary }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleSaveAddress}
                                                        className="mt-2 w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md"
                                                        style={{ backgroundColor: C.brandGreen, color: '#000000' }}
                                                    >
                                                        Adresse Speichern & Übernehmen
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-xs space-y-0.5 mt-1 font-medium" style={{ color: C.textPrimary }}>
                                                    {deliveryAddress.street ? (
                                                        <>
                                                            <p className="font-bold text-sm">{deliveryAddress.name}</p>
                                                            <p>{deliveryAddress.street}</p>
                                                            <p>{deliveryAddress.zipCity}</p>
                                                            <p className="text-[11px]" style={{ color: C.textSecondary }}>Tel: {deliveryAddress.phone}</p>
                                                        </>
                                                    ) : (
                                                        <div className="py-2">
                                                            <p className="font-bold">{deliveryAddress.name}</p>
                                                            <p className="text-amber-500 font-bold text-[11px]">Noch keine Lieferadresse hinterlegt.</p>
                                                            <button
                                                                onClick={() => setIsEditingAddress(true)}
                                                                className="mt-2 text-xs font-black underline cursor-pointer"
                                                                style={{ color: isDark ? C.brandGreen : C.emeraldAccent }}
                                                            >
                                                                + Lieferadresse jetzt eingeben
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* SECTION 2: PAYMENT METHOD SELECTION */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                                                    <CreditCard size={15} style={{ color: C.brandGreen }} />
                                                    <span style={{ color: C.textPrimary }}>Zahlungsmethode wählen</span>
                                                </div>
                                                <span className="text-[10px] font-bold" style={{ color: C.textSecondary }}>
                                                    {paymentMethods.length} verfügbar
                                                </span>
                                            </div>

                                            {/* List of saved payment methods */}
                                            <div className="space-y-2.5">
                                                {paymentMethods.map(method => {
                                                    const isSelected = String(selectedMethodId) === String(method.id);
                                                    return (
                                                        <div
                                                            key={method.id}
                                                            onClick={() => setSelectedMethodId(method.id)}
                                                            className="p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
                                                            style={{
                                                                backgroundColor: isSelected 
                                                                    ? (isDark ? '#1A241C' : '#F0FDF4')
                                                                    : (isDark ? '#161B17' : '#FFFFFF'),
                                                                border: isSelected 
                                                                    ? `2.5px solid ${C.brandGreen}` 
                                                                    : `1.5px solid ${C.borderMain}`,
                                                                boxShadow: isSelected ? '0 4px 15px rgba(0,255,136,0.2)' : 'none'
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div 
                                                                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                                    style={{ 
                                                                        backgroundColor: isSelected ? C.brandGreen : (isDark ? '#232B25' : '#E2E8F0'),
                                                                        color: isSelected ? '#000000' : (isDark ? '#FFFFFF' : '#0F172A')
                                                                    }}
                                                                >
                                                                    {method.type === 'card' && <CreditCard size={18} strokeWidth={2.5} />}
                                                                    {method.type === 'bank' && <Building2 size={18} strokeWidth={2.5} />}
                                                                    {method.type === 'paypal' && <Wallet size={18} strokeWidth={2.5} />}
                                                                    {method.type === 'applepay' && <Smartphone size={18} strokeWidth={2.5} />}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-xs" style={{ color: C.textPrimary }}>
                                                                            {method.provider}
                                                                        </span>
                                                                        {method.last4 && (
                                                                            <span className="text-[11px] font-mono font-bold" style={{ color: C.textSecondary }}>
                                                                                •••• {method.last4}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px]" style={{ color: C.textSecondary }}>
                                                                        {method.type === 'card' && `Ablauf: ${method.expiry} · ${method.holder}`}
                                                                        {method.type === 'bank' && (method.iban || `Inhaber: ${method.holder}`)}
                                                                        {method.type === 'paypal' && method.email}
                                                                        {method.type === 'applepay' && 'Direkte Freigabe via Touch/Face ID'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Radio circle check */}
                                                            <div 
                                                                className="w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0"
                                                                style={{ 
                                                                    backgroundColor: isSelected ? C.brandGreen : 'transparent',
                                                                    border: isSelected ? 'none' : `2px solid ${C.borderMain}`,
                                                                    color: '#000000'
                                                                }}
                                                            >
                                                                {isSelected && <Check size={14} strokeWidth={3.5} />}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Button to add new payment method */}
                                            {!showAddMethod ? (
                                                <button
                                                    onClick={() => setShowAddMethod(true)}
                                                    className="w-full mt-3 py-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                                                    style={{ 
                                                        borderColor: isDark ? C.brandGreen : C.emeraldAccent,
                                                        color: isDark ? C.brandGreen : C.emeraldAccent,
                                                        backgroundColor: isDark ? 'rgba(0, 255, 136, 0.05)' : 'rgba(16, 185, 129, 0.05)'
                                                    }}
                                                >
                                                    <Plus size={16} strokeWidth={2.5} /> Neue Karte oder Bankkonto hinzufügen
                                                </button>
                                            ) : (
                                                /* INLINE FORM: ADD NEW PAYMENT METHOD */
                                                <div 
                                                    className="mt-3 p-4 rounded-2xl space-y-4"
                                                    style={{ 
                                                        backgroundColor: isDark ? '#141A16' : '#F1F5F9',
                                                        border: `2px solid ${C.brandGreen}`
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-black uppercase tracking-wider" style={{ color: C.textPrimary }}>
                                                            Neue Zahlungsmethode
                                                        </span>
                                                        <button 
                                                            onClick={() => setShowAddMethod(false)}
                                                            className="text-xs font-bold cursor-pointer"
                                                            style={{ color: C.textSecondary }}
                                                        >
                                                            Abbrechen
                                                        </button>
                                                    </div>

                                                    {/* Tabs: Credit Card | Bank Account | PayPal */}
                                                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl" style={{ backgroundColor: isDark ? '#0C100E' : '#E2E8F0' }}>
                                                        {[
                                                            { id: 'card', label: 'Kreditkarte' },
                                                            { id: 'bank', label: 'Bank / SEPA' },
                                                            { id: 'paypal', label: 'PayPal' }
                                                        ].map(t => {
                                                            const active = addMethodType === t.id;
                                                            return (
                                                                <button
                                                                    key={t.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setAddMethodType(t.id);
                                                                        setFormError('');
                                                                    }}
                                                                    className="py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                                                    style={{ 
                                                                        backgroundColor: active ? C.brandGreen : 'transparent',
                                                                        color: active ? '#000000' : C.textPrimary
                                                                    }}
                                                                >
                                                                    {t.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {formError && (
                                                        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-bold">
                                                            {formError}
                                                        </div>
                                                    )}

                                                    {/* CARD INPUTS */}
                                                    {addMethodType === 'card' && (
                                                        <div className="space-y-2.5">
                                                            <div>
                                                                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.textSecondary }}>Kartennummer:</label>
                                                                <input 
                                                                    type="text"
                                                                    placeholder="4532 •••• •••• 4242"
                                                                    maxLength={19}
                                                                    value={cardForm.number}
                                                                    onChange={e => {
                                                                        const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                                                                        const formatted = digits.replace(/(\d{4})/g, '$1 ').trim();
                                                                        setCardForm({ ...cardForm, number: formatted });
                                                                    }}
                                                                    className="w-full px-3 py-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none"
                                                                    style={{ backgroundColor: C.inputBg, border: `1.5px solid ${C.inputBorder}`, color: C.textPrimary }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.textSecondary }}>Karteninhaber (Name):</label>
                                                                <input 
                                                                    type="text"
                                                                    placeholder="Name auf der Karte"
                                                                    value={cardForm.holder}
                                                                    onChange={e => setCardForm({ ...cardForm, holder: e.target.value })}
                                                                    className="w-full px-3 py-2.5 rounded-xl text-xs font-medium focus:outline-none"
                                                                    style={{ backgroundColor: C.inputBg, border: `1.5px solid ${C.inputBorder}`, color: C.textPrimary }}
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.textSecondary }}>Ablauf (MM/JJ):</label>
                                                                    <input 
                                                                        type="text"
                                                                        placeholder="12/28"
                                                                        maxLength={5}
                                                                        value={cardForm.expiry}
                                                                        onChange={e => {
                                                                            let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                                            if (val.length >= 3) val = `${val.slice(0, 2)}/${val.slice(2)}`;
                                                                            setCardForm({ ...cardForm, expiry: val });
                                                                        }}
                                                                        className="w-full px-3 py-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none"
                                                                        style={{ backgroundColor: C.inputBg, border: `1.5px solid ${C.inputBorder}`, color: C.textPrimary }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.textSecondary }}>Sicherheitscode (CVV):</label>
                                                                    <input 
                                                                        type="password"
                                                                        placeholder="•••"
                                                                        maxLength={4}
                                                                        value={cardForm.cvv}
                                                                        onChange={e => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '') })}
                                                                        className="w-full px-3 py-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none"
                                                                        style={{ backgroundColor: C.inputBg, border: `1.5px solid ${C.inputBorder}`, color: C.textPrimary }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* BANK ACCOUNT INPUTS */}
                                                    {addMethodType === 'bank' && (
                                                        <div className="space-y-2.5">
                                                            <div>
                                                                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.textSecondary }}>IBAN:</label>
                                                                <input 
                                                                    type="text"
                                                                    placeholder="DE89 •••• •••• •••• •••• ••"
                                                                    maxLength={27}
                                                                    value={bankForm.iban}
                                                                    onChange={e => {
                                                                        const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 22);
                                                                        const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
                                                                        setBankForm({ ...bankForm, iban: formatted });
                                                                    }}
                                                                    className="w-full px-3 py-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none"
                                                                    style={{ backgroundColor: C.inputBg, border: `1.5px solid ${C.inputBorder}`, color: C.textPrimary }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.textSecondary }}>Kontoinhaber:</label>
                                                                <input 
                                                                    type="text"
                                                                    placeholder="Name laut Kontoauszug"
                                                                    value={bankForm.holder}
                                                                    onChange={e => setBankForm({ ...bankForm, holder: e.target.value })}
                                                                    className="w-full px-3 py-2.5 rounded-xl text-xs font-medium focus:outline-none"
                                                                    style={{ backgroundColor: C.inputBg, border: `1.5px solid ${C.inputBorder}`, color: C.textPrimary }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.textSecondary }}>Bankname (Optional):</label>
                                                                <input 
                                                                    type="text"
                                                                    placeholder="z.B. Sparkasse, Deutsche Bank"
                                                                    value={bankForm.bankName}
                                                                    onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })}
                                                                    className="w-full px-3 py-2.5 rounded-xl text-xs font-medium focus:outline-none"
                                                                    style={{ backgroundColor: C.inputBg, border: `1.5px solid ${C.inputBorder}`, color: C.textPrimary }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* PAYPAL INPUTS */}
                                                    {addMethodType === 'paypal' && (
                                                        <div className="space-y-2.5">
                                                            <div>
                                                                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: C.textSecondary }}>PayPal E-Mail:</label>
                                                                <input 
                                                                    type="email"
                                                                    placeholder="deine.email@paypal.de"
                                                                    value={paypalForm.email}
                                                                    onChange={e => setPaypalForm({ ...paypalForm, email: e.target.value })}
                                                                    className="w-full px-3 py-2.5 rounded-xl text-xs font-medium focus:outline-none"
                                                                    style={{ backgroundColor: C.inputBg, border: `1.5px solid ${C.inputBorder}`, color: C.textPrimary }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={handleSaveNewPaymentMethod}
                                                        className="w-full py-3 rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md"
                                                        style={{ backgroundColor: C.brandGreen, color: '#000000' }}
                                                    >
                                                        <Check size={15} strokeWidth={3} /> Zahlungsmethode Speichern & Auswählen
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* SECTION 3: SECURITY & DETAILS */}
                                        <div 
                                            className="p-3.5 rounded-2xl flex items-center gap-3 text-xs"
                                            style={{ 
                                                backgroundColor: isDark ? '#141A16' : '#F1F5F9',
                                                color: C.textSecondary,
                                                border: `1px solid ${C.borderMain}`
                                            }}
                                        >
                                            <ShieldCheck size={20} style={{ color: C.brandGreen }} className="flex-shrink-0" />
                                            <p className="text-[11px] leading-relaxed">
                                                256-Bit SSL Verschlüsselung. Deine Zahlungsdaten werden bankenkonform geschützt und verschlüsselt gespeichert.
                                            </p>
                                        </div>

                                    </div>

                                    {/* CHECKOUT FOOTER / FINAL PURCHASE BUTTON */}
                                    <div 
                                        className="p-5 space-y-3"
                                        style={{ 
                                            backgroundColor: isDark ? '#0E1310' : '#F8FAFC',
                                            borderTop: `1.5px solid ${C.borderMain}`
                                        }}
                                    >
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between" style={{ color: C.textSecondary }}>
                                                <span>Gewähltes Zahlungsmittel:</span>
                                                <span className="font-bold" style={{ color: C.textPrimary }}>
                                                    {activePaymentMethod ? `${activePaymentMethod.provider} (•••• ${activePaymentMethod.last4})` : 'Keine ausgewählt'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between" style={{ color: C.textSecondary }}>
                                                <span>Expressversand:</span>
                                                <span className="font-bold" style={{ color: C.brandGreen }}>Kostenlos</span>
                                            </div>
                                            <div 
                                                className="pt-2 flex justify-between text-base font-black"
                                                style={{ borderTop: `1px solid ${C.borderMain}` }}
                                            >
                                                <span style={{ color: C.textPrimary }}>Zu zahlender Gesamtbetrag:</span>
                                                <span style={{ color: C.brandGreen }}>{subtotal.toFixed(2)} €</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleConfirmOrder}
                                            disabled={isProcessingPayment}
                                            className="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl cursor-pointer disabled:opacity-50"
                                            style={{ 
                                                backgroundColor: C.brandGreen, 
                                                color: '#000000' 
                                            }}
                                        >
                                            {isProcessingPayment ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" /> Zahlung wird autorisiert...
                                                </>
                                            ) : (
                                                <>
                                                    <Lock size={16} /> Jetzt Zahlungspflichtig Bestellen ({subtotal.toFixed(2)} €)
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ========================================================= */}
                            {/* VIEW 3: ORDER SUCCESS CONFIRMATION */}
                            {/* ========================================================= */}
                            {cartStep === 'success' && completedOrder && (
                                <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between text-center">
                                    <div className="py-8 space-y-4">
                                        <motion.div 
                                            initial={{ scale: 0 }} 
                                            animate={{ scale: 1 }}
                                            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-2xl"
                                            style={{ backgroundColor: C.brandGreen, color: '#000000' }}
                                        >
                                            <Check size={40} strokeWidth={3.5} />
                                        </motion.div>

                                        <div>
                                            <span 
                                                className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2"
                                                style={{ backgroundColor: 'rgba(0,255,136,0.15)', color: isDark ? C.brandGreen : '#059669', border: '1px solid rgba(0,255,136,0.3)' }}
                                            >
                                                Zahlung Bestätigt
                                            </span>
                                            <h3 className="text-2xl font-black uppercase tracking-tight" style={{ color: C.textPrimary }}>
                                                Bestellung erfolgreich!
                                            </h3>
                                            <p className="text-xs mt-1" style={{ color: C.textSecondary }}>
                                                Bestellnummer: <strong className="font-mono text-sm" style={{ color: C.brandGreen }}>#GR-SHOP-{completedOrder.orderId}</strong>
                                            </p>
                                        </div>

                                        {/* Order Details Card */}
                                        <div 
                                            className="p-4 rounded-2xl text-left space-y-2.5 text-xs mt-6"
                                            style={{ 
                                                backgroundColor: isDark ? '#161B17' : '#F8FAFC',
                                                border: `1.5px solid ${C.borderMain}`
                                            }}
                                        >
                                            <div className="flex justify-between pb-2" style={{ borderBottom: `1px solid ${C.borderMain}` }}>
                                                <span style={{ color: C.textSecondary }}>Bezahlt mit:</span>
                                                <span className="font-bold" style={{ color: C.textPrimary }}>
                                                    {completedOrder.method?.provider} {completedOrder.method?.last4 ? `•••• ${completedOrder.method.last4}` : ''}
                                                </span>
                                            </div>
                                            <div className="flex justify-between pb-2" style={{ borderBottom: `1px solid ${C.borderMain}` }}>
                                                <span style={{ color: C.textSecondary }}>Lieferung an:</span>
                                                <span className="font-bold text-right" style={{ color: C.textPrimary }}>
                                                    {completedOrder.address?.name}<br />
                                                    {completedOrder.address?.street}, {completedOrder.address?.zipCity}
                                                </span>
                                            </div>
                                            <div className="flex justify-between pb-2" style={{ borderBottom: `1px solid ${C.borderMain}` }}>
                                                <span style={{ color: C.textSecondary }}>Lieferstatus:</span>
                                                <span className="font-bold flex items-center gap-1" style={{ color: C.brandGreen }}>
                                                    <Truck size={13} /> Ca. 25–40 Min (Chauffeur Express)
                                                </span>
                                            </div>
                                            <div className="flex justify-between pt-1 text-sm font-black">
                                                <span style={{ color: C.textPrimary }}>Gesamtbetrag:</span>
                                                <span style={{ color: C.brandGreen }}>{completedOrder.total.toFixed(2)} €</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setCartStep('cart');
                                            setIsCartOpen(false);
                                        }}
                                        className="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl cursor-pointer"
                                        style={{ 
                                            backgroundColor: C.brandGreen, 
                                            color: '#000000' 
                                        }}
                                    >
                                        Weiter Einkaufen
                                    </button>
                                </div>
                            )}

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ========================================================= */}
            {/* ORDERS & INVOICES RIGHT SIDE SHEET (Slide-Over Drawer)     */}
            {/* ========================================================= */}
            <AnimatePresence>
                {isOrdersOpen && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        {/* Darkened Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOrdersOpen(false)}
                            className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
                        />

                        {/* Slide-over Drawer Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            className="relative z-10 w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden"
                            style={{ 
                                backgroundColor: isDark ? '#0C100E' : '#FFFFFF',
                                color: C.textPrimary,
                                borderLeft: `1.5px solid ${C.borderMain}`
                            }}
                        >
                            {/* Drawer Header */}
                            <div 
                                className="px-6 py-5 flex items-center justify-between shrink-0"
                                style={{ 
                                    borderBottom: `1px solid ${C.borderMain}`,
                                    backgroundColor: isDark ? '#080C0A' : '#F8FAFC'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
                                        style={{ 
                                            backgroundColor: 'rgba(0, 255, 136, 0.15)',
                                            border: '1px solid rgba(0, 255, 136, 0.35)',
                                            color: isDark ? C.brandGreen : '#059669'
                                        }}
                                    >
                                        <Receipt size={20} strokeWidth={2.4} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black uppercase tracking-tight m-0" style={{ color: C.textPrimary }}>
                                            Bestellungen & Rechnungen
                                        </h2>
                                        <p className="text-[11px] font-bold mt-0.5" style={{ color: C.textSecondary }}>
                                            {orders.length} {orders.length === 1 ? 'Bestellung gefunden' : 'Bestellungen gefunden'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsOrdersOpen(false)}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer"
                                    style={{ 
                                        backgroundColor: isDark ? '#161B17' : '#F1F5F9',
                                        color: C.textSecondary
                                    }}
                                    aria-label="Schließen"
                                >
                                    <X size={18} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
                                {orders.length === 0 ? (
                                    <div className="py-20 text-center space-y-4 px-6">
                                        <div 
                                            className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center"
                                            style={{ 
                                                backgroundColor: isDark ? '#141A16' : '#F1F5F9',
                                                color: C.textSecondary
                                            }}
                                        >
                                            <PackageCheck size={28} />
                                        </div>
                                        <h3 className="text-base font-black" style={{ color: C.textPrimary }}>
                                            Noch keine Bestellungen
                                        </h3>
                                        <p className="text-xs leading-relaxed max-w-xs mx-auto" style={{ color: C.textSecondary }}>
                                            Sobald du Artikel in unserem Store kaufst, findest du hier alle deine Bestellungen, Rechnungen und Live-Status-Updates.
                                        </p>
                                        <button
                                            onClick={() => setIsOrdersOpen(false)}
                                            className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg cursor-pointer"
                                            style={{ backgroundColor: C.brandGreen, color: '#000000' }}
                                        >
                                            Jetzt Kollektion entdecken
                                        </button>
                                    </div>
                                ) : (
                                    orders.map((order, idx) => {
                                        const isDelivered = order.statusCode === 'delivered' || order.status?.includes('Zugestellt');
                                        const dateStr = order.date ? new Date(order.date).toLocaleDateString('de-DE', {
                                            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        }) : '28.10.2026';

                                        return (
                                            <div
                                                key={order.id || `order-${idx}`}
                                                className="rounded-2xl p-4 transition-all shadow-sm space-y-3"
                                                style={{ 
                                                    backgroundColor: isDark ? '#121814' : '#FFFFFF',
                                                    border: `1.5px solid ${C.borderMain}`
                                                }}
                                            >
                                                {/* Order Header Row */}
                                                <div className="flex items-start justify-between gap-2 pb-2.5" style={{ borderBottom: `1px solid ${C.borderMain}` }}>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-xs sm:text-sm tracking-tight" style={{ color: C.textPrimary }}>
                                                                #{order.id}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold mt-0.5" style={{ color: C.textSecondary }}>
                                                            <Clock size={11} />
                                                            <span>{dateStr} Uhr</span>
                                                        </div>
                                                    </div>

                                                    <span 
                                                        className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0"
                                                        style={{ 
                                                            backgroundColor: isDelivered ? 'rgba(0, 255, 136, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                                            color: isDelivered ? (isDark ? C.brandGreen : '#059669') : '#3B82F6',
                                                            border: `1px solid ${isDelivered ? 'rgba(0, 255, 136, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                                                        }}
                                                    >
                                                        {isDelivered ? <CheckCircle2 size={11} strokeWidth={3} /> : <Truck size={11} strokeWidth={2.5} />}
                                                        <span>{order.status || 'Zugestellt'}</span>
                                                    </span>
                                                </div>

                                                {/* Items List */}
                                                <div className="space-y-2">
                                                    {(order.items || []).map((item, i) => (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="w-11 h-11 rounded-xl object-cover shrink-0"
                                                                style={{ backgroundColor: isDark ? '#1C241E' : '#E2E8F0' }}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-xs font-bold truncate m-0" style={{ color: C.textPrimary }}>
                                                                    {item.name}
                                                                </h4>
                                                                <div className="flex items-center gap-2 text-[10px] font-semibold mt-0.5" style={{ color: C.textSecondary }}>
                                                                    {item.variant && <span>Variante: {item.variant}</span>}
                                                                    <span>• Menge: {item.quantity || 1}x</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs font-black shrink-0" style={{ color: C.textPrimary }}>
                                                                {((item.price || 0) * (item.quantity || 1)).toFixed(2)} €
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Address & Payment Info */}
                                                <div 
                                                    className="p-2.5 rounded-xl text-[10px] space-y-1 font-semibold"
                                                    style={{ 
                                                        backgroundColor: isDark ? '#161D19' : '#F8FAFC',
                                                        color: C.textSecondary 
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="flex items-center gap-1 truncate">
                                                            <MapPin size={11} style={{ color: C.brandGreen }} />
                                                            {order.address?.street || 'Kurfürstendamm 21'}, {order.address?.city || order.address?.zipCity || 'Berlin'}
                                                        </span>
                                                        <span className="shrink-0 font-bold" style={{ color: C.textPrimary }}>
                                                            {order.method?.provider || 'Kreditkarte'} {order.method?.last4 ? `•••• ${order.method.last4}` : ''}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Total & Action Buttons */}
                                                <div className="pt-2 border-t flex flex-col gap-2.5" style={{ borderColor: C.borderMain }}>
                                                    <div className="flex items-center justify-between text-xs font-black">
                                                        <span style={{ color: C.textSecondary }}>Gesamtbetrag (inkl. MwSt.):</span>
                                                        <span className="text-base font-black" style={{ color: isDark ? C.brandGreen : '#059669' }}>
                                                            {Number(order.total || order.subtotal || 0).toFixed(2)} €
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                                        <button
                                                            onClick={() => setSelectedInvoiceOrder(order)}
                                                            className="py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                                            style={{ 
                                                                backgroundColor: isDark ? '#1C241E' : '#E2E8F0',
                                                                color: C.textPrimary,
                                                                border: `1px solid ${C.borderMain}`
                                                            }}
                                                        >
                                                            <FileText size={13} strokeWidth={2.4} />
                                                            <span>Rechnung (PDF)</span>
                                                        </button>

                                                        <button
                                                            onClick={() => handleReorder(order)}
                                                            className="py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md"
                                                            style={{ 
                                                                backgroundColor: C.brandGreen,
                                                                color: '#000000'
                                                            }}
                                                        >
                                                            <RefreshCw size={13} strokeWidth={2.4} />
                                                            <span>Nochmal bestellen</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ========================================================= */}
            {/* OFFICIAL PRINTABLE INVOICE MODAL (PDF / RECHNUNG)        */}
            {/* ========================================================= */}
            <AnimatePresence>
                {selectedInvoiceOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden my-6 border border-slate-200"
                        >
                            {/* Invoice Top Action Bar */}
                            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Receipt size={18} className="text-[#00FF88]" />
                                    <span className="font-black text-xs sm:text-sm uppercase tracking-wider">
                                        Rechnungsbeleg #{selectedInvoiceOrder.id}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => window.print()}
                                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                                        title="Drucken / Als PDF speichern"
                                    >
                                        <Printer size={14} />
                                        <span>Drucken / PDF</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectedInvoiceOrder(null)}
                                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Invoice Printable Body */}
                            <div className="p-6 sm:p-8 space-y-6 text-xs sm:text-sm bg-white">
                                {/* Header / Company Info */}
                                <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                                    <div>
                                        <div className="text-2xl font-black italic tracking-tighter text-slate-950 uppercase">
                                            GRIEN <span className="text-[#059669]">OFFICIAL</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-semibold mt-1">
                                            Grien Chauffeur & Lifestyle Services GmbH<br />
                                            Kurfürstendamm 21, 10719 Berlin<br />
                                            USt-IdNr.: DE 318 942 158
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                            Rechnung Bezahlt
                                        </span>
                                        <p className="text-xs font-bold text-slate-700 mt-2">
                                            Rechnungs-Nr.: RE-{selectedInvoiceOrder.id}<br />
                                            Datum: {selectedInvoiceOrder.date ? new Date(selectedInvoiceOrder.date).toLocaleDateString('de-DE') : '28.10.2026'}
                                        </p>
                                    </div>
                                </div>

                                {/* Customer & Delivery Address */}
                                <div className="grid grid-cols-2 gap-6 pb-4 border-b border-slate-200">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                                            Rechnungsempfänger:
                                        </span>
                                        <p className="font-bold text-slate-800 text-xs">
                                            {selectedInvoiceOrder.address?.fullName || selectedInvoiceOrder.address?.name || currentUserName}<br />
                                            {selectedInvoiceOrder.address?.street || 'Kurfürstendamm 21'}<br />
                                            {selectedInvoiceOrder.address?.postalCode || '10719'} {selectedInvoiceOrder.address?.city || selectedInvoiceOrder.address?.zipCity || 'Berlin'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                                            Zahlungsmethode:
                                        </span>
                                        <p className="font-bold text-slate-800 text-xs">
                                            {selectedInvoiceOrder.method?.provider || 'Kreditkarte'}<br />
                                            {selectedInvoiceOrder.method?.last4 ? `Karten-Endung: •••• ${selectedInvoiceOrder.method.last4}` : 'Transaktion autorisiert'}
                                        </p>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div>
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-[10px]">
                                                <th className="py-2">Pos. / Artikel</th>
                                                <th className="py-2 text-center">Menge</th>
                                                <th className="py-2 text-right">Einzelpreis</th>
                                                <th className="py-2 text-right">Gesamt</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(selectedInvoiceOrder.items || []).map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="py-2.5">
                                                        <div className="font-bold text-slate-900">{item.name}</div>
                                                        {item.variant && <div className="text-[10px] text-slate-500">Variante: {item.variant}</div>}
                                                    </td>
                                                    <td className="py-2.5 text-center font-semibold text-slate-700">{item.quantity || 1}</td>
                                                    <td className="py-2.5 text-right font-semibold text-slate-700">{(item.price || 0).toFixed(2)} €</td>
                                                    <td className="py-2.5 text-right font-bold text-slate-900">{((item.price || 0) * (item.quantity || 1)).toFixed(2)} €</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totals Summary */}
                                <div className="border-t-2 border-slate-200 pt-4 space-y-1.5 text-xs text-right">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Zwischensumme (Netto):</span>
                                        <span className="font-semibold">{((selectedInvoiceOrder.total || selectedInvoiceOrder.subtotal || 0) / 1.19).toFixed(2)} €</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Inkl. 19% MwSt.:</span>
                                        <span className="font-semibold">{((selectedInvoiceOrder.total || selectedInvoiceOrder.subtotal || 0) - ((selectedInvoiceOrder.total || selectedInvoiceOrder.subtotal || 0) / 1.19)).toFixed(2)} €</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Grien Chauffeur Expressversand:</span>
                                        <span className="font-semibold text-emerald-600">Kostenlos (0,00 €)</span>
                                    </div>
                                    <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-200">
                                        <span>Gesamtbetrag (Brutto):</span>
                                        <span className="text-emerald-700">{Number(selectedInvoiceOrder.total || selectedInvoiceOrder.subtotal || 0).toFixed(2)} €</span>
                                    </div>
                                </div>

                                {/* Footer Note */}
                                <p className="text-[10px] text-slate-400 text-center pt-4 border-t border-slate-100 leading-relaxed">
                                    Vielen Dank für deine Bestellung bei Grien Official. Dies ist ein elektronisch erstellter Beleg und ohne Unterschrift gültig.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
