import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    FileText, Building2, Landmark, Receipt, MapPin,
    Upload, Star, Truck, Image as ImageIcon,
    Sparkles, Shirt, Smartphone, Flame, Home as HomeIcon, Gift,
    Plus, Search, Filter, Edit3, Trash2, CheckCircle2, XCircle,
    Eye, EyeOff, Bot, Key, Copy, Check, ArrowUpRight, TrendingUp,
    Package, AlertTriangle, RefreshCw, ExternalLink, SlidersHorizontal,
    DollarSign, Percent, Layers, ShieldCheck, Terminal, HelpCircle, X,
    ChevronLeft, ChevronRight, MessageSquare, Send, Zap, CheckCheck, Bell,
    Link as LinkIcon, Unlink, Globe, Lock, Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:3001/api/shop';
const AGENT_DEFAULT_KEY = 'grien_agent_live_secret_key_2026';

const CATEGORIES = [
    { id: 'all', label: 'Alle Produkte', icon: Sparkles },
    { id: 'fashion', label: 'Klamotten', icon: Shirt, labelLong: 'Klamotten & Fashion' },
    { id: 'electronics', label: 'Elektronik', icon: Smartphone, labelLong: 'Elektronik & Gadgets' },
    { id: 'perfume', label: 'Parfüm & Düfte', icon: Flame, labelLong: 'Parfüm & Düfte' },
    { id: 'home', label: 'Haushalt & Living', icon: HomeIcon, labelLong: 'Haushalt & Living' },
    { id: 'gifts', label: 'Geschenke', icon: Gift, labelLong: 'Geschenke & VIP Boxen' }
];

const PRESET_IMAGES = [
    { label: 'Hoodie', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80' },
    { label: 'T-Shirt', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80' },
    { label: 'Gadget', url: 'https://images.unsplash.com/photo-1609081219094-a2d9ec06917e?auto=format&fit=crop&w=800&q=80' },
    { label: 'Earbuds', url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80' },
    { label: 'Parfüm', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80' },
    { label: 'Diffuser', url: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80' },
    { label: 'Tumbler', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80' },
    { label: 'Gift Box', url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80' }
];

const CATEGORY_SETS_COUNT = 5;

const AdminProductHub = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('grid');

    // ==========================================
    // INFINITE SMOOTH CIRCULAR CAROUSEL LOGIC
    // ==========================================
    const loopCategories = useMemo(() => {
        const list = [];
        for (let s = 0; s < CATEGORY_SETS_COUNT; s++) {
            CATEGORIES.forEach(c => {
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
                el.scrollLeft = singleSetWidth * 2;
            }
        };
        setInitialPosition();
        const timer = setTimeout(setInitialPosition, 60);
        return () => clearTimeout(timer);
    }, []);

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
        if (movedDistanceRef.current > 8) {
            return;
        }
        setSelectedCategory(categoryId);
    };

    const scrollByAmount = (offset) => {
        if (!carouselRef.current) return;
        carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    };

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isSavingInvoice, setIsSavingInvoice] = useState(false);
    const [invoiceSettings, setInvoiceSettings] = useState({
        companyName: 'Grien Official',
        ownerName: 'Khiam Azizi',
        street: '',
        postalCode: '',
        city: '',
        taxId: '',
        vatId: '',
        email: 'rechnung@grien.app',
        phone: '',
        bankName: '',
        iban: '',
        bic: '',
        footerNote: 'Vielen Dank für Ihre Bestellung bei Grien Official. Dies ist ein elektronisch erstellter Beleg und ohne Unterschrift gültig.'
    });

    const fetchInvoiceSettings = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/shop/invoice-settings');
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.settings) {
                    setInvoiceSettings(prev => ({ ...prev, ...data.settings }));
                    localStorage.setItem('grien_invoice_settings', JSON.stringify(data.settings));
                }
            }
        } catch (e) {
            const cached = localStorage.getItem('grien_invoice_settings');
            if (cached) {
                try { setInvoiceSettings(JSON.parse(cached)); } catch(err) {}
            }
        }
    };

    const handleSaveInvoiceSettings = async (e) => {
        if (e) e.preventDefault();
        setIsSavingInvoice(true);
        try {
            const res = await fetch('http://localhost:3001/api/shop/invoice-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceSettings)
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('grien_invoice_settings', JSON.stringify(data.settings));
                notify('Rechnungsdaten erfolgreich gespeichert!', 'success');
                setIsInvoiceModalOpen(false);
            } else {
                notify('Fehler beim Speichern', 'error');
            }
        } catch (err) {
            localStorage.setItem('grien_invoice_settings', JSON.stringify(invoiceSettings));
            notify('Lokal gespeichert (Offline-Fallback)', 'success');
            setIsInvoiceModalOpen(false);
        } finally {
            setIsSavingInvoice(false);
        }
    };
    const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [notification, setNotification] = useState(null);
    const [copiedKey, setCopiedKey] = useState(false);
    const [agentPingStatus, setAgentPingStatus] = useState(null);
    const [isPingingAgent, setIsPingingAgent] = useState(false);

    // --- PRINT ON DEMAND (POD) & AI AGENT HUB STATE ---
    const [agentModalTab, setAgentModalTab] = useState('pod'); // 'pod' | 'connect' | 'agent_gen' | 'customer_chat' | 'api'
    const [podProducts, setPodProducts] = useState([]);
    const [podLoading, setPodLoading] = useState(false);
    const [podStatusFilter, setPodStatusFilter] = useState('all');
    const [editingPodPrices, setEditingPodPrices] = useState({});
    const [isGeneratingPod, setIsGeneratingPod] = useState(false);
    const [agentNotification, setAgentNotification] = useState(null);

    // POD Provider Settings (Printify / Printful / Gelato)
    const [podSettings, setPodSettings] = useState({
        provider: 'printify',
        apiKey: '',
        shopId: '',
        connectedShopName: '',
        status: 'unconnected'
    });
    const [isTestingPodKey, setIsTestingPodKey] = useState(false);
    const [isSyncingPodLive, setIsSyncingPodLive] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [podTestResult, setPodTestResult] = useState(null);

    // Customer Support Simulation
    const [chatMessages, setChatMessages] = useState([
        { id: 1, role: 'customer', text: 'Hallo, wie fallen die Grien Heavyweight Hoodies aus und wie lange dauert der Versand?', time: 'Gerade eben' },
        { id: 2, role: 'agent', text: 'Hallo geschätzter Kunde, unsere Heavyweight Hoodies werden per Print-on-Demand frisch und ressourcenschonend gefertigt. Die Passform ist ein moderner Regular/Boxy Schnitt. Die versicherte Lieferung erfolgt mit DHL GoGreen in 3-5 Werktagen!', time: 'Vor 1 Sek.' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isChatSending, setIsChatSending] = useState(false);

    // Form state
    const fileInputRef = useRef(null);
    const [activePreviewImgIdx, setActivePreviewImgIdx] = useState(0);
    const [newImageUrl, setNewImageUrl] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        category: 'fashion',
        price: '',
        originalPrice: '',
        costPrice: '',
        stock: '25',
        rating: '5.0',
        reviewsCount: '25',
        perk1: 'Schneller Grien Shuttle Versand',
        perk2: '30 Tage kostenlose Rückgabe',
        tag: 'Neu',
        description: '',
        image: PRESET_IMAGES[0].url,
        images: [PRESET_IMAGES[0].url],
        variantsText: 'S, M, L, XL',
        isActive: true
    });

    const notify = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3500);
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/products`);
            if (!res.ok) throw new Error('API offline');
            const data = await res.json();
            if (data.success && Array.isArray(data.products)) {
                setProducts(data.products);
                localStorage.setItem('grien_shop_products_cache', JSON.stringify(data.products));
            }
        } catch (err) {
            console.warn('API error, falling back to local cache:', err);
            const cached = localStorage.getItem('grien_shop_products_cache');
            if (cached) {
                try {
                    setProducts(JSON.parse(cached));
                } catch (e) {
                    setProducts([]);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchPodProducts = async () => {
        setPodLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/shop/pod/products');
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.products)) {
                    setPodProducts(data.products);
                }
            }
        } catch (err) {
            console.warn('POD fetch offline fallback');
        } finally {
            setPodLoading(false);
        }
    };

    const handleApprovePod = async (podItem) => {
        const customPrice = editingPodPrices[podItem.id] !== undefined ? Number(editingPodPrices[podItem.id]) : podItem.price;
        try {
            const res = await fetch(`http://localhost:3001/api/shop/pod/products/${podItem.id}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: customPrice })
            });
            const data = await res.json();
            if (data.success) {
                notify(`✅ "${podItem.name}" freigegeben für ${customPrice.toFixed(2)} €!`, 'success');
                fetchPodProducts();
                fetchProducts();
            } else {
                notify(data.error || 'Fehler bei der Freigabe', 'error');
            }
        } catch (err) {
            notify('Verbindungsfehler bei Freigabe', 'error');
        }
    };

    const handleRejectPod = async (podId) => {
        try {
            const res = await fetch(`http://localhost:3001/api/shop/pod/products/${podId}/reject`, {
                method: 'PUT'
            });
            const data = await res.json();
            if (data.success) {
                notify('POD Entwurf abgelehnt.', 'success');
                fetchPodProducts();
            } else {
                notify('Fehler beim Ablehnen', 'error');
            }
        } catch (err) {
            notify('Fehler beim Ablehnen', 'error');
        }
    };

    const handleAgentGeneratePod = async () => {
        setIsGeneratingPod(true);
        try {
            const res = await fetch('http://localhost:3001/api/shop/pod/agent-generate', {
                method: 'POST'
            });
            const data = await res.json();
            if (data.success) {
                setAgentNotification(data.notification || {
                    title: '⚡ KI-Agent hat Produkt generiert!',
                    message: `Neues Produkt "${data.product.name}" zur Freigabe bereit.`
                });
                notify(`⚡ KI-Agent: "${data.product.name}" generiert!`, 'success');
                await fetchPodProducts();
                setAgentModalTab('pod');
                setPodStatusFilter('pending_approval');
            } else {
                notify('Fehler bei KI-Produktgenerierung', 'error');
            }
        } catch (err) {
            notify('Fehler bei KI-Produktgenerierung', 'error');
        } finally {
            setIsGeneratingPod(false);
        }
    };

    const handleSendCustomerChat = async (customText) => {
        const textToSend = customText || chatInput;
        if (!textToSend.trim()) return;

        const userMsg = { id: Date.now(), role: 'customer', text: textToSend, time: 'Gerade eben' };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsChatSending(true);

        try {
            const res = await fetch('http://localhost:3001/api/shop/agent/customer-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: textToSend, customerName: 'Kunde' })
            });
            const data = await res.json();
            if (data.success) {
                setChatMessages(prev => [
                    ...prev,
                    { id: Date.now() + 1, role: 'agent', text: data.reply, time: 'Gerade eben', intent: data.intent }
                ]);
            }
        } catch (err) {
            setChatMessages(prev => [
                ...prev,
                { id: Date.now() + 1, role: 'agent', text: 'Entschuldigung, der KI-Dienst ist kurz offline. Unser Support antwortet dir gleich!', time: 'Gerade eben' }
            ]);
        } finally {
            setIsChatSending(false);
        }
    };

    const handleRestorePod = async (podId) => {
        try {
            const res = await fetch(`http://localhost:3001/api/shop/pod/products/${podId}/restore`, {
                method: 'PUT'
            });
            const data = await res.json();
            if (data.success) {
                notify('Produkt in Freigabe-Queue wiederhergestellt!', 'success');
                fetchPodProducts();
            } else {
                notify(data.error || 'Fehler beim Wiederherstellen', 'error');
            }
        } catch (err) {
            notify('Fehler beim Wiederherstellen', 'error');
        }
    };

    const handleDeletePod = async (podId) => {
        try {
            const res = await fetch(`http://localhost:3001/api/shop/pod/products/${podId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                notify('Produkt gelöscht.', 'success');
                fetchPodProducts();
            } else {
                notify(data.error || 'Fehler beim Löschen', 'error');
            }
        } catch (err) {
            notify('Fehler beim Löschen', 'error');
        }
    };

    const fetchPodSettings = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/shop/pod/settings');
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.settings) {
                    setPodSettings(data.settings);
                }
            }
        } catch (e) {
            console.warn('POD settings fetch fallback');
        }
    };

    const handleSavePodSettings = async (customSettings) => {
        const toSave = customSettings || podSettings;
        try {
            const res = await fetch('http://localhost:3001/api/shop/pod/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(toSave)
            });
            const data = await res.json();
            if (data.success) {
                notify('POD Einstellungen erfolgreich gespeichert!', 'success');
                setPodSettings(data.settings);
            }
        } catch (err) {
            notify('Fehler beim Speichern der POD-Einstellungen', 'error');
        }
    };

    const handleTestPodConnection = async () => {
        setIsTestingPodKey(true);
        setPodTestResult(null);
        try {
            const res = await fetch('http://localhost:3001/api/shop/pod/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: podSettings.provider,
                    apiKey: podSettings.apiKey,
                    shopId: podSettings.shopId
                })
            });
            const data = await res.json();
            setPodTestResult({
                ok: data.success,
                msg: data.success ? data.message : (data.error || 'Verbindung fehlgeschlagen')
            });
            if (data.success) {
                notify('✓ Verbindung erfolgreich hergestellt!', 'success');
                fetchPodSettings();
            } else {
                notify(data.error || 'Authentifizierung fehlgeschlagen', 'error');
            }
        } catch (err) {
            setPodTestResult({ ok: false, msg: `Netzwerkfehler: ${err.message}` });
            notify('Netzwerkfehler beim Verbindungstest', 'error');
        } finally {
            setIsTestingPodKey(false);
        }
    };

    const handleSyncLivePod = async () => {
        setIsSyncingPodLive(true);
        try {
            const res = await fetch('http://localhost:3001/api/shop/pod/sync-live', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: podSettings.provider,
                    apiKey: podSettings.apiKey,
                    shopId: podSettings.shopId
                })
            });
            const data = await res.json();
            if (data.success) {
                notify(`✓ ${data.message || 'Echte Artikel von Printify geladen!'}`, 'success');
                await fetchPodProducts();
                setAgentModalTab('pod');
                setPodStatusFilter('pending_approval');
            } else {
                notify(data.error || 'Fehler beim Synchronisieren', 'error');
                if (!podSettings.apiKey) {
                    setAgentModalTab('connect');
                }
            }
        } catch (err) {
            notify('Netzwerkfehler beim Synchronisieren', 'error');
        } finally {
            setIsSyncingPodLive(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchInvoiceSettings();
        fetchPodProducts();
        fetchPodSettings();
    }, []);

    const handleOpenAddModal = (presetCategory = 'fashion') => {
        setEditingProduct(null);
        setFormData({
            name: '',
            category: presetCategory === 'all' ? 'fashion' : presetCategory,
            price: '',
            originalPrice: '',
            costPrice: '',
            stock: '30',
            rating: '5.0',
            reviewsCount: '15',
            perk1: 'Schneller Grien Shuttle Versand',
            perk2: '30 Tage kostenlose Rückgabe',
            tag: 'Neu',
            description: '',
            image: PRESET_IMAGES[0].url,
            images: [PRESET_IMAGES[0].url],
            variantsText: presetCategory === 'fashion' ? 'S, M, L, XL' : presetCategory === 'perfume' ? '50ml, 100ml' : 'Standard',
            isActive: true
        });
        setActivePreviewImgIdx(0);
        setNewImageUrl('');
        setIsEditModalOpen(true);
    };

    const handleOpenEditModal = (product) => {
        setEditingProduct(product);
        const prodImages = (Array.isArray(product.images) && product.images.length > 0)
            ? product.images
            : (product.image ? [product.image] : [PRESET_IMAGES[0].url]);

        setFormData({
            name: product.name || '',
            category: product.category || 'fashion',
            price: product.price !== undefined ? String(product.price) : '',
            originalPrice: product.originalPrice ? String(product.originalPrice) : '',
            costPrice: product.costPrice !== undefined ? String(product.costPrice) : '',
            stock: product.stock !== undefined ? String(product.stock) : '25',
            rating: product.rating !== undefined ? String(product.rating) : '5.0',
            reviewsCount: product.reviewsCount !== undefined ? String(product.reviewsCount) : '25',
            perk1: product.perk1 || 'Schneller Grien Shuttle Versand',
            perk2: product.perk2 || '30 Tage kostenlose Rückgabe',
            tag: product.tag || '',
            description: product.description || '',
            image: prodImages[0] || product.image || PRESET_IMAGES[0].url,
            images: prodImages,
            variantsText: Array.isArray(product.variants) ? product.variants.join(', ') : (product.variants || 'Standard'),
            isActive: product.isActive !== false
        });
        setActivePreviewImgIdx(0);
        setNewImageUrl('');
        setIsEditModalOpen(true);
    };

    // Multi-Image Upload & Gallery Handlers
    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const readers = files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (uploadEvent) => resolve(uploadEvent.target.result);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(readers).then(dataUrls => {
            setFormData(prev => {
                const currentImages = Array.isArray(prev.images) && prev.images.length > 0 ? prev.images : (prev.image ? [prev.image] : []);
                const updated = [...currentImages, ...dataUrls];
                return {
                    ...prev,
                    images: updated,
                    image: updated[0]
                };
            });
            notify(`${dataUrls.length} Bild(er) erfolgreich hinzugefügt!`, 'success');
            if (fileInputRef.current) fileInputRef.current.value = '';
        });
    };

    const handleAddImageUrl = () => {
        const url = newImageUrl.trim();
        if (!url) return;
        setFormData(prev => {
            const currentImages = Array.isArray(prev.images) && prev.images.length > 0 ? prev.images : (prev.image ? [prev.image] : []);
            const updated = [...currentImages, url];
            return {
                ...prev,
                images: updated,
                image: updated[0]
            };
        });
        setNewImageUrl('');
        notify('Bild-URL zur Galerie hinzugefügt!', 'success');
    };

    const handleRemoveImage = (indexToRemove) => {
        setFormData(prev => {
            const currentImages = Array.isArray(prev.images) ? [...prev.images] : [prev.image];
            currentImages.splice(indexToRemove, 1);
            const finalImages = currentImages.length > 0 ? currentImages : [PRESET_IMAGES[0].url];
            return {
                ...prev,
                images: finalImages,
                image: finalImages[0]
            };
        });
        setActivePreviewImgIdx(0);
    };

    const handleSetAsPrimary = (index) => {
        setFormData(prev => {
            const currentImages = Array.isArray(prev.images) ? [...prev.images] : [prev.image];
            const [selected] = currentImages.splice(index, 1);
            currentImages.unshift(selected);
            return {
                ...prev,
                images: currentImages,
                image: selected
            };
        });
        setActivePreviewImgIdx(0);
        notify('Hauptbild festgelegt!', 'success');
    };

    const handleAiAutoFill = async () => {
        setIsAiGenerating(true);
        try {
            const res = await fetch(`${API_BASE}/agent/smart-generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keyword: formData.name || 'Signature VIP Essential',
                    category: formData.category
                })
            });
            const data = await res.json();
            if (data.success && data.suggestion) {
                const s = data.suggestion;
                setFormData(prev => ({
                    ...prev,
                    name: prev.name.trim() ? prev.name : s.name,
                    description: s.description,
                    price: prev.price ? prev.price : String(s.price),
                    originalPrice: prev.originalPrice ? prev.originalPrice : String(s.originalPrice),
                    costPrice: prev.costPrice ? prev.costPrice : String(s.costPrice),
                    stock: prev.stock ? prev.stock : String(s.stock),
                    tag: s.tag,
                    image: s.image,
                    variantsText: Array.isArray(s.variants) ? s.variants.join(', ') : prev.variantsText
                }));
                notify('✨ KI-Vorschlag erfolgreich generiert!', 'success');
            }
        } catch (err) {
            notify('KI-Generator offline: Fallback wird genutzt', 'error');
        } finally {
            setIsAiGenerating(false);
        }
    };

    const handleSaveProduct = async (e) => {
        if (e) e.preventDefault();
        if (!formData.name.trim() || !formData.price) {
            notify('Bitte Name und Preis eingeben', 'error');
            return;
        }

        setIsSaving(true);
        const cleanImages = (Array.isArray(formData.images) && formData.images.length > 0)
            ? formData.images.filter(img => Boolean(img && String(img).trim()))
            : [formData.image.trim() || PRESET_IMAGES[0].url];

        const primaryImage = cleanImages[0] || formData.image.trim() || PRESET_IMAGES[0].url;

        const payload = {
            name: formData.name.trim(),
            category: formData.category,
            price: parseFloat(formData.price) || 0,
            originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
            costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
            stock: parseInt(formData.stock, 10) || 0,
            rating: parseFloat(formData.rating) || 5.0,
            reviewsCount: parseInt(formData.reviewsCount, 10) || 0,
            perk1: formData.perk1 ? formData.perk1.trim() : 'Schneller Grien Shuttle Versand',
            perk2: formData.perk2 ? formData.perk2.trim() : '30 Tage kostenlose Rückgabe',
            tag: formData.tag.trim(),
            description: formData.description.trim(),
            image: primaryImage,
            images: cleanImages,
            variants: formData.variantsText.split(',').map(s => s.trim()).filter(Boolean),
            isActive: formData.isActive
        };

        try {
            const isEdit = Boolean(editingProduct);
            const url = isEdit ? `${API_BASE}/products/${editingProduct.id}` : `${API_BASE}/products`;
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-portal': 'true',
                    'x-agent-key': AGENT_DEFAULT_KEY
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                notify(isEdit ? 'Produkt aktualisiert!' : 'Neues Produkt angelegt!', 'success');
                setIsEditModalOpen(false);
                fetchProducts();
            } else {
                notify(data.error || 'Fehler beim Speichern', 'error');
            }
        } catch (err) {
            notify('Verbindungsfehler zur API', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (product) => {
        const newStatus = !product.isActive;
        try {
            const res = await fetch(`${API_BASE}/products/${product.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-portal': 'true',
                    'x-agent-key': AGENT_DEFAULT_KEY
                },
                body: JSON.stringify({ isActive: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: newStatus } : p));
                notify(`Produkt ist jetzt ${newStatus ? 'Aktiv im Shop' : 'Pausiert'}!`, 'success');
            }
        } catch (err) {
            notify('Status konnte nicht geändert werden', 'error');
        }
    };

    const handleDeleteProduct = async (product) => {
        if (!window.confirm(`Möchtest du "${product.name}" wirklich löschen?`)) return;

        try {
            const res = await fetch(`${API_BASE}/products/${product.id}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-portal': 'true',
                    'x-agent-key': AGENT_DEFAULT_KEY
                }
            });
            const data = await res.json();
            if (data.success) {
                setProducts(prev => prev.filter(p => p.id !== product.id));
                notify('Produkt gelöscht!', 'success');
            }
        } catch (err) {
            notify('Fehler beim Löschen', 'error');
        }
    };

    const handlePingAgent = async () => {
        setIsPingingAgent(true);
        setAgentPingStatus(null);
        const startTime = Date.now();
        try {
            const res = await fetch(`${API_BASE}/agent/status`);
            const data = await res.json();
            const latency = Date.now() - startTime;
            if (data.success) {
                setAgentPingStatus({ ok: true, latency, data });
            } else {
                setAgentPingStatus({ ok: false, msg: 'API hat Fehler gemeldet' });
            }
        } catch (err) {
            setAgentPingStatus({ ok: false, msg: 'API offline oder nicht erreichbar' });
        } finally {
            setIsPingingAgent(false);
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
            if (statusFilter === 'active' && p.isActive === false) return false;
            if (statusFilter === 'inactive' && p.isActive !== false) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = p.name && p.name.toLowerCase().includes(q);
                const matchDesc = p.description && p.description.toLowerCase().includes(q);
                const matchTag = p.tag && p.tag.toLowerCase().includes(q);
                if (!matchName && !matchDesc && !matchTag) return false;
            }
            return true;
        }).sort((a, b) => {
            if (sortBy === 'price_asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
            if (sortBy === 'price_desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
            if (sortBy === 'popular') return (b.salesCount || b.reviewsCount || 0) - (a.salesCount || a.reviewsCount || 0);
            if (sortBy === 'stock') return (a.stock || 0) - (b.stock || 0);
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
    }, [products, selectedCategory, statusFilter, searchQuery, sortBy]);

    const metrics = useMemo(() => {
        const total = products.length;
        const active = products.filter(p => p.isActive !== false).length;
        const lowStock = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 15).length;
        const totalInventoryValue = products.reduce((acc, p) => acc + ((Number(p.price) || 0) * (p.stock || 0)), 0);

        let totalMarginPct = 0;
        let marginCount = 0;
        products.forEach(p => {
            if (p.price && p.costPrice && p.price > 0) {
                const margin = ((p.price - p.costPrice) / p.price) * 100;
                totalMarginPct += margin;
                marginCount++;
            }
        });
        const avgMargin = marginCount > 0 ? (totalMarginPct / marginCount).toFixed(1) : '55.0';

        return { total, active, lowStock, totalInventoryValue, avgMargin };
    }, [products]);

    const currentFormMargin = useMemo(() => {
        const p = parseFloat(formData.price) || 0;
        const c = parseFloat(formData.costPrice) || 0;
        if (p <= 0 || c <= 0) return null;
        const profit = p - c;
        const pct = (profit / p) * 100;
        return { profit: profit.toFixed(2), pct: pct.toFixed(1) };
    }, [formData.price, formData.costPrice]);

    // RENDER EDIT MODAL VIA PORTAL TO PREVENT ANY PARENT TRANSFORM CLIPPING
    const renderEditModal = () => {
        if (!isEditModalOpen) return null;

        const modalContent = (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0B1324] border border-white/15 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
                >
                    {/* Fixed Modal Header */}
                    <div className="shrink-0 px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0E172C]">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#00D084]/20 border border-[#00D084]/30 flex items-center justify-center">
                                <Package className="w-5 h-5 text-[#00D084]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white m-0">
                                    {editingProduct ? 'Produkt bearbeiten' : 'Neues Produkt anlegen'}
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {editingProduct ? `ID: ${editingProduct.id}` : 'Füge einen neuen Artikel für deine Kunden hinzu'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Modal Body */}
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 no-scrollbar">
                        {/* Form Inputs (7 Cols) */}
                        <div className="lg:col-span-7 space-y-4">
                            {/* Category Select */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Kategorie *
                                </label>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                                        const Icon = cat.icon;
                                        const selected = formData.category === cat.id;
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, category: cat.id })}
                                                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition ${
                                                    selected
                                                        ? 'bg-[#00D084]/20 border-[#00D084] text-[#00D084]'
                                                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="truncate w-full text-center">{cat.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Name & AI Generator */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                        Artikelname / Titel *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAiAutoFill}
                                        disabled={isAiGenerating}
                                        className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-[11px] font-bold text-purple-300 flex items-center gap-1.5 transition"
                                    >
                                        <Sparkles className={`w-3 h-3 ${isAiGenerating ? 'animate-spin' : ''}`} />
                                        <span>{isAiGenerating ? 'Generiere...' : '🪄 KI-Vorschlag'}</span>
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="z.B. Grien Signature Cyber Hoodie"
                                    required
                                    className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00D084]"
                                />
                            </div>

                            {/* Prices & Cost Row */}
                            <div className="grid grid-cols-3 gap-2.5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                                        Preis (€) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="89.00"
                                        required
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-[#00D084]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                                        Streichpreis (€)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.originalPrice}
                                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                        placeholder="110.00"
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-[#00D084]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                                        Einkauf (€)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.costPrice}
                                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                        placeholder="35.00"
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-[#00D084]"
                                    />
                                </div>
                            </div>

                            {/* Real-Time Margin */}
                            {currentFormMargin && (
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                                    <span className="text-emerald-300">
                                        Marge: <strong>+{currentFormMargin.pct}%</strong> ({currentFormMargin.profit} € Rohertrag)
                                    </span>
                                    <span className="text-[10px] text-slate-400">Live Kalkulation</span>
                                </div>
                            )}

                            {/* Stock & Tag */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                                        Bestand (Stk.)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        placeholder="25"
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-[#00D084]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                                        Badge / Tag
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tag}
                                        onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                                        placeholder="Bestseller / Limitiert / Neu"
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-[#00D084]"
                                    />
                                </div>
                            </div>

                            {/* Rating & Reviews Count */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <Star size={12} className="text-amber-400 fill-amber-400" />
                                        <span>Bewertung (1.0 - 5.0)</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.05"
                                        min="1.0"
                                        max="5.0"
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                        placeholder="5.0"
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-[#00D084]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                                        Bewertungen Anzahl
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.reviewsCount}
                                        onChange={(e) => setFormData({ ...formData, reviewsCount: e.target.value })}
                                        placeholder="77"
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-[#00D084]"
                                    />
                                </div>
                            </div>

                            {/* Service Highlights / Perks */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <Truck size={12} className="text-[#00D084]" />
                                        <span>Highlight 1 (Versand)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.perk1}
                                        onChange={(e) => setFormData({ ...formData, perk1: e.target.value })}
                                        placeholder="Schneller Grien Shuttle Versand"
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#00D084]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <RefreshCw size={12} className="text-[#00D084]" />
                                        <span>Highlight 2 (Rückgabe)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.perk2}
                                        onChange={(e) => setFormData({ ...formData, perk2: e.target.value })}
                                        placeholder="30 Tage kostenlose Rückgabe"
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#00D084]"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                                    Produktbeschreibung
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detailbeschreibungen zu Material, Inhaltsstoffen..."
                                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00D084]"
                                />
                            </div>

                            {/* Variants */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                                    Varianten (Kommagetrennt)
                                </label>
                                <input
                                    type="text"
                                    value={formData.variantsText}
                                    onChange={(e) => setFormData({ ...formData, variantsText: e.target.value })}
                                    placeholder="z.B. S, M, L, XL oder 50ml, 100ml"
                                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-[#00D084]"
                                />
                            </div>

                            {/* Multi-Image Gallery & Uploader */}
                            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <ImageIcon size={14} className="text-[#00D084]" />
                                        <span>Produktbilder & Galerie</span>
                                    </label>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#00D084]">
                                        {formData.images?.length || 1} Bild{(formData.images?.length || 1) > 1 ? 'er' : ''}
                                    </span>
                                </div>

                                {/* Direct Device Upload Button */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-emerald-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-[#00D084]/40 hover:border-[#00D084] text-[#00D084] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                                >
                                    <Upload size={14} />
                                    <span>Bilder vom Gerät hochladen (Mehrere wählen)</span>
                                </button>

                                {/* URL Input & Add Button */}
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={newImageUrl}
                                        onChange={(e) => setNewImageUrl(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddImageUrl();
                                            }
                                        }}
                                        placeholder="Oder Bild-URL einfügen (https://...)"
                                        className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#00D084]"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddImageUrl}
                                        className="px-3 py-2 bg-[#00D084]/20 hover:bg-[#00D084] text-[#00D084] hover:text-black border border-[#00D084]/40 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1"
                                    >
                                        <Plus size={13} />
                                        <span>Hinzufügen</span>
                                    </button>
                                </div>

                                {/* Presets */}
                                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                                    <span className="text-[10px] text-slate-500 whitespace-nowrap">Schnellwahl:</span>
                                    {PRESET_IMAGES.map((p, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => {
                                                    const current = Array.isArray(prev.images) ? [...prev.images] : [prev.image];
                                                    if (!current.includes(p.url)) current.push(p.url);
                                                    return { ...prev, images: current, image: current[0] };
                                                });
                                                notify(`${p.label} hinzugefügt!`, 'success');
                                            }}
                                            className="px-2 py-0.5 rounded-md text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 whitespace-nowrap cursor-pointer hover:border-[#00D084]/40"
                                        >
                                            + {p.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Uploaded Gallery Grid */}
                                <div className="pt-2">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
                                        <span>Galerie-Übersicht (Klick zum Vorschau-Wechsel):</span>
                                        <span className="text-[9px] text-slate-500">★ = Hauptbild</span>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-36 overflow-y-auto no-scrollbar p-1 rounded-xl bg-black/20 border border-white/5">
                                        {(formData.images || [PRESET_IMAGES[0].url]).map((imgUrl, idx) => {
                                            const isPrimary = idx === 0;
                                            const isPreviewing = activePreviewImgIdx === idx;
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => setActivePreviewImgIdx(idx)}
                                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer group transition-all ${
                                                        isPreviewing
                                                            ? 'border-[#00D084] shadow-md shadow-[#00D084]/20 scale-102'
                                                            : 'border-white/10 hover:border-white/30'
                                                    }`}
                                                >
                                                    <img
                                                        src={imgUrl}
                                                        alt={`Bild ${idx + 1}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.src = PRESET_IMAGES[0].url; }}
                                                    />
                                                    
                                                    {isPrimary ? (
                                                        <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-[#00D084] text-black text-[7px] font-black uppercase">
                                                            Hauptbild
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            title="Als Hauptbild festlegen"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSetAsPrimary(idx);
                                                            }}
                                                            className="absolute top-1 left-1 p-1 rounded bg-black/70 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                                        >
                                                            <Star size={10} />
                                                        </button>
                                                    )}

                                                    {(formData.images?.length || 1) > 1 && (
                                                        <button
                                                            type="button"
                                                            title="Bild entfernen"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveImage(idx);
                                                            }}
                                                            className="absolute top-1 right-1 p-1 rounded bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                                        >
                                                            <Trash2 size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Active Switch */}
                            <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10">
                                <div>
                                    <div className="text-xs font-bold text-white">Sofort im Shop aktivieren</div>
                                    <div className="text-[11px] text-slate-400">Für Kunden im Shop sichtbar</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${
                                        formData.isActive ? 'bg-[#00D084]' : 'bg-slate-700'
                                    }`}
                                >
                                    <span
                                        className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${
                                            formData.isActive ? 'left-7' : 'left-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Right Preview Column (5 Cols) - Sticky & Compact */}
                        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-black/40 p-4 rounded-2xl border border-white/10 self-start w-full">
                            <div>
                                <div className="flex items-center justify-between text-xs text-slate-400 mb-3 pb-2 border-b border-white/10">
                                    <span className="font-bold uppercase tracking-wider text-[#00D084]">Live Shop Vorschau</span>
                                    <span className="text-[10px]">Wie Kunden es sehen</span>
                                </div>

                                {/* Controlled Height Preview Card */}
                                <div className="max-w-sm mx-auto rounded-2xl bg-[#0F172A] border border-white/10 overflow-hidden shadow-2xl">
                                    <div className="relative h-44 w-full bg-black overflow-hidden group">
                                        <img
                                            src={
                                                (formData.images && formData.images[activePreviewImgIdx]) ||
                                                formData.image ||
                                                PRESET_IMAGES[0].url
                                            }
                                            alt="Preview"
                                            className="w-full h-full object-cover transition-all duration-300"
                                            onError={(e) => { e.target.src = PRESET_IMAGES[0].url; }}
                                        />

                                        {/* Gallery Navigation Arrows (if > 1 image) */}
                                        {(formData.images?.length || 1) > 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setActivePreviewImgIdx(prev => (prev > 0 ? prev - 1 : (formData.images.length - 1)))}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActivePreviewImgIdx(prev => (prev < (formData.images.length - 1) ? prev + 1 : 0))}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 cursor-pointer"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>

                                                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/70 text-white border border-white/20 backdrop-blur-sm">
                                                    {activePreviewImgIdx + 1} / {formData.images.length}
                                                </span>
                                            </>
                                        )}

                                        {formData.tag && (
                                            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/80 text-white border border-white/20">
                                                {formData.tag}
                                            </span>
                                        )}
                                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00D084]/90 text-black">
                                            ★ 5.0
                                        </span>
                                    </div>

                                    {/* Mini Thumbnail Carousel Under Preview Image */}
                                    {(formData.images?.length || 1) > 1 && (
                                        <div className="px-3 py-1.5 bg-black/60 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                                            {formData.images.map((imgUrl, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setActivePreviewImgIdx(idx)}
                                                    className={`w-8 h-8 rounded-lg overflow-hidden shrink-0 border transition-all cursor-pointer ${
                                                        activePreviewImgIdx === idx
                                                            ? 'border-[#00D084] scale-105 shadow-md shadow-[#00D084]/30 ring-1 ring-[#00D084]'
                                                            : 'border-white/20 opacity-60 hover:opacity-100'
                                                    }`}
                                                >
                                                    <img src={imgUrl} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="p-3.5 space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#00D084]">
                                            {CATEGORIES.find(c => c.id === formData.category)?.label || formData.category}
                                        </div>
                                        <h4 className="text-sm font-black text-white line-clamp-1">
                                            {formData.name || 'Produktname'}
                                        </h4>
                                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                            {formData.description || 'Hier erscheint die Produktbeschreibung...'}
                                        </p>

                                        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-sm font-black text-white">
                                                    {(parseFloat(formData.price) || 0).toFixed(2)} €
                                                </span>
                                                {formData.originalPrice && (
                                                    <span className="text-[11px] text-slate-500 line-through">
                                                        {(parseFloat(formData.originalPrice) || 0).toFixed(2)} €
                                                    </span>
                                                )}
                                            </div>
                                            <span className="px-2.5 py-1 rounded-lg bg-[#00D084] text-black font-extrabold text-[11px]">
                                                + Warenkorb
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fixed Modal Footer */}
                    <div className="shrink-0 px-6 py-4 bg-[#0E172C] border-t border-white/10 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveProduct}
                            disabled={isSaving}
                            className="px-6 py-2.5 rounded-xl bg-[#00D084] hover:bg-[#00B875] text-black font-extrabold text-xs shadow-lg shadow-[#00D084]/20 transition flex items-center gap-1.5"
                        >
                            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            <span>{editingProduct ? 'Änderungen speichern' : 'Produkt erstellen'}</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        );

        return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
    };

    // RENDER INVOICE SETTINGS MODAL VIA PORTAL
    const renderInvoiceSettingsModal = () => {
        if (!isInvoiceModalOpen) return null;

        const modalContent = (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-2xl max-h-[90vh] bg-[#0A101D] border border-cyan-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white font-sans"
                >
                    {/* Header */}
                    <div className="shrink-0 px-6 py-4 bg-gradient-to-r from-cyan-950/60 to-slate-900 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-white m-0 uppercase tracking-wide">
                                    Offizielle Firmendaten & Rechnungs-Setup
                                </h2>
                                <p className="text-[11px] text-cyan-300/80 m-0">
                                    Pflichtangaben nach deutschem Steuerrecht (§ 14 Abs. 4 UStG)
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsInvoiceModalOpen(false)}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Scrollable Form Body */}
                    <form onSubmit={handleSaveInvoiceSettings} className="p-6 overflow-y-auto space-y-5 text-left">
                        {/* Box 1: Unternehmensdaten */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                                <Building2 size={14} /> 1. Firmenbezeichnung & Inhaber
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                        Firmenname / Rechnungssteller *
                                    </label>
                                    <input
                                        type="text"
                                        value={invoiceSettings.companyName}
                                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, companyName: e.target.value })}
                                        placeholder="z.B. Grien Official oder Firmenname"
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                        Inhaber / Vertretungsberechtigt
                                    </label>
                                    <input
                                        type="text"
                                        value={invoiceSettings.ownerName}
                                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, ownerName: e.target.value })}
                                        placeholder="z.B. Khiam Azizi"
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Box 2: Anschrift */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                                <MapPin size={14} /> 2. Anschrift (Betriebsstätte)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-3">
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                        Straße & Hausnummer *
                                    </label>
                                    <input
                                        type="text"
                                        value={invoiceSettings.street}
                                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, street: e.target.value })}
                                        placeholder="z.B. Musterstraße 12"
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                        Postleitzahl *
                                    </label>
                                    <input
                                        type="text"
                                        value={invoiceSettings.postalCode}
                                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, postalCode: e.target.value })}
                                        placeholder="z.B. 60311"
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                        Stadt / Ort *
                                    </label>
                                    <input
                                        type="text"
                                        value={invoiceSettings.city}
                                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, city: e.target.value })}
                                        placeholder="z.B. Frankfurt am Main"
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Box 3: Steuernummern */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                                <Receipt size={14} /> 3. Steuerangaben (Finanzamt & USt-IdNr.)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                        USt-IdNr. (falls vorhanden)
                                    </label>
                                    <input
                                        type="text"
                                        value={invoiceSettings.vatId}
                                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, vatId: e.target.value })}
                                        placeholder="z.B. DE 123456789"
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                        Steuernummer (Finanzamt)
                                    </label>
                                    <input
                                        type="text"
                                        value={invoiceSettings.taxId}
                                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, taxId: e.target.value })}
                                        placeholder="z.B. 014/123/45678"
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Box 4: Kontakt & Bank (Fußzeile) */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                                <Landmark size={14} /> 4. Bankverbindung & Kontakt (Optional für PDF-Fußzeile)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                        Rechnungs-E-Mail
                                    </label>
                                    <input
                                        type="email"
                                        value={invoiceSettings.email}
                                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, email: e.target.value })}
                                        placeholder="rechnung@grien.app"
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                        Telefon / Hotline
                                    </label>
                                    <input
                                        type="text"
                                        value={invoiceSettings.phone}
                                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, phone: e.target.value })}
                                        placeholder="+49 69 ..."
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                        IBAN
                                    </label>
                                    <input
                                        type="text"
                                        value={invoiceSettings.iban}
                                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, iban: e.target.value })}
                                        placeholder="DE..."
                                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Box 5: Fußzeilen-Text */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                            <label className="block text-xs font-black uppercase tracking-wider text-cyan-400">
                                5. Rechnungshinweis (Fußzeile)
                            </label>
                            <textarea
                                rows={2}
                                value={invoiceSettings.footerNote}
                                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, footerNote: e.target.value })}
                                placeholder="Hinweistext am Ende der Rechnung..."
                                className="w-full px-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                            />
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="shrink-0 px-6 py-4 bg-[#080E1B] border-t border-white/10 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                            Wird automatisch in alle Kunden-PDFs übertragen.
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsInvoiceModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition"
                            >
                                Abbrechen
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveInvoiceSettings}
                                disabled={isSavingInvoice}
                                className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs shadow-lg shadow-cyan-400/20 transition flex items-center gap-1.5 cursor-pointer"
                            >
                                {isSavingInvoice ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                <span>Rechnungsdaten speichern</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );

        return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
    };

    // RENDER AGENT & PRINT-ON-DEMAND MODAL VIA PORTAL
    const renderAgentModal = () => {
        if (!isAgentModalOpen) return null;

        const pendingPodCount = podProducts.filter(p => p.status === 'pending_approval').length;
        const approvedPodCount = podProducts.filter(p => p.status === 'approved').length;
        const rejectedPodCount = podProducts.filter(p => p.status === 'rejected').length;

        const filteredPods = podProducts.filter(item => {
            if (podStatusFilter === 'all') return true;
            return item.status === podStatusFilter;
        });

        const modalContent = (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0B1324] border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="shrink-0 p-5 bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-[#0B1324] border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 border border-purple-400/40 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Bot className="w-5 h-5 text-white animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-black text-white m-0 tracking-tight">PRINT-ON-DEMAND & KI-AGENT CONTROL CENTER</h2>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                        Autonomous Hub 2.0
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Verwalte POD-Kataloge (Printify/Gelato), bestimme Margen & lass den KI-Agenten Produkte erstellen und mit Kunden schreiben.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsAgentModalOpen(false)}
                            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="shrink-0 px-6 pt-3 bg-black/40 border-b border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setAgentModalTab('pod')}
                            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
                                agentModalTab === 'pod'
                                    ? 'bg-purple-500/20 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
                            }`}
                        >
                            <Package className="w-4 h-4 text-purple-400" />
                            <span>POD Freigabe-Center</span>
                            {pendingPodCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FFD700] text-black">
                                    {pendingPodCount} Neu
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setAgentModalTab('connect')}
                            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
                                agentModalTab === 'connect'
                                    ? 'bg-purple-500/20 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
                            }`}
                        >
                            <LinkIcon className="w-4 h-4 text-cyan-400" />
                            <span>🔌 Echte POD-Partner (Printify API)</span>
                            <span className={`w-2 h-2 rounded-full ${podSettings.apiKey ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]' : 'bg-amber-400 animate-pulse'}`}></span>
                        </button>

                        <button
                            onClick={() => setAgentModalTab('agent_gen')}
                            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
                                agentModalTab === 'agent_gen'
                                    ? 'bg-purple-500/20 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
                            }`}
                        >
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span>⚡ KI-Agent Produkt-Ersteller</span>
                        </button>

                        <button
                            onClick={() => setAgentModalTab('customer_chat')}
                            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
                                agentModalTab === 'customer_chat'
                                    ? 'bg-purple-500/20 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
                            }`}
                        >
                            <MessageSquare className="w-4 h-4 text-emerald-400" />
                            <span>💬 KI-Kundenchat Support</span>
                        </button>

                        <button
                            onClick={() => setAgentModalTab('api')}
                            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
                                agentModalTab === 'api'
                                    ? 'bg-purple-500/20 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
                            }`}
                        >
                            <Key className="w-4 h-4 text-blue-400" />
                            <span>🔑 REST API & Secrets</span>
                        </button>
                    </div>

                    {/* Agent Notification Toast Bar (if present) */}
                    {agentNotification && (
                        <div className="shrink-0 p-3 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between px-6">
                            <div className="flex items-center gap-2.5 text-xs text-amber-200">
                                <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
                                <div>
                                    <strong className="text-white mr-1.5">{agentNotification.title}:</strong>
                                    <span>{agentNotification.message}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setAgentModalTab('pod');
                                    setPodStatusFilter('all');
                                    setAgentNotification(null);
                                }}
                                className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[11px] rounded-lg transition cursor-pointer"
                            >
                                Jetzt ansehen & freigeben →
                            </button>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">

                        {/* TAB 1: POD FREIGABE-CENTER */}
                        {agentModalTab === 'pod' && (
                            <div className="space-y-5">
                                {/* Provider Status Header Banner */}
                                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-purple-950/20 to-black/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${podSettings.apiKey ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-white">
                                                <span>POD-Partner: <strong className="text-cyan-400 uppercase">{podSettings.provider}</strong></span>
                                                <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${podSettings.apiKey ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                                                    {podSettings.apiKey ? '✓ Echte Live API verbunden' : 'Demo / Kein Key eingetragen'}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                {podSettings.connectedShopName ? `Verknüpfter Store: "${podSettings.connectedShopName}"` : 'Trage deinen API-Key ein, um echte Produkte direkt aus Printify zu laden.'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setAgentModalTab('connect')}
                                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition cursor-pointer flex items-center gap-1.5"
                                        >
                                            <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                                            <span>API-Key verwalten</span>
                                        </button>

                                        <button
                                            onClick={handleSyncLivePod}
                                            disabled={isSyncingPodLive}
                                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center gap-1.5"
                                            title="Echte Artikel direkt aus Printify abrufen"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPodLive ? 'animate-spin' : ''}`} />
                                            <span>{isSyncingPodLive ? 'Lade echte Artikel...' : 'Printify Live-Sync'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Filter Controls */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={() => setPodStatusFilter('all')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                                podStatusFilter === 'all'
                                                    ? 'bg-white/20 text-white shadow-md'
                                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                            }`}
                                        >
                                            Alle ({podProducts.length})
                                        </button>

                                        <button
                                            onClick={() => setPodStatusFilter('pending_approval')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                                podStatusFilter === 'pending_approval'
                                                    ? 'bg-[#FFD700] text-black shadow-lg shadow-[#FFD700]/20 font-black'
                                                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                            }`}
                                        >
                                            <span>⏳ Wartet auf Freigabe</span>
                                            <span className="px-1.5 py-0.2 bg-black/20 rounded-full text-[10px] font-black">
                                                {pendingPodCount}
                                            </span>
                                        </button>

                                        <button
                                            onClick={() => setPodStatusFilter('approved')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                                podStatusFilter === 'approved'
                                                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black'
                                                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                            }`}
                                        >
                                            <span>✅ Freigegeben</span>
                                            <span className="px-1.5 py-0.2 bg-black/20 rounded-full text-[10px] font-black">
                                                {approvedPodCount}
                                            </span>
                                        </button>

                                        <button
                                            onClick={() => setPodStatusFilter('rejected')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                                podStatusFilter === 'rejected'
                                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 font-black'
                                                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                            }`}
                                        >
                                            <span>❌ Abgelehnt / Archiv</span>
                                            <span className="px-1.5 py-0.2 bg-black/20 rounded-full text-[10px] font-black">
                                                {rejectedPodCount}
                                            </span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleAgentGeneratePod}
                                        disabled={isGeneratingPod}
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-400/20 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                                    >
                                        <Zap className={`w-3.5 h-3.5 ${isGeneratingPod ? 'animate-spin' : ''}`} />
                                        <span>{isGeneratingPod ? 'KI generiert Artikel...' : '⚡ KI-Agent: Neues Produkt generieren'}</span>
                                    </button>
                                </div>

                                {/* Product Cards Grid */}
                                {filteredPods.length === 0 ? (
                                    <div className="py-12 text-center bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-3">
                                        <Package className="w-10 h-10 text-slate-500 mx-auto" />
                                        <h3 className="text-base font-bold text-white">Keine POD-Produkte in diesem Filter ({podStatusFilter})</h3>
                                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                                            Klicke auf den Filter <strong>„Alle ({podProducts.length})“</strong>, um sämtliche Produkte zu sehen, oder starte den Live-Sync mit Printify!
                                        </p>
                                        <div className="flex items-center justify-center gap-3 pt-2">
                                            <button
                                                onClick={() => setPodStatusFilter('all')}
                                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                                            >
                                                Alle Produkte anzeigen
                                            </button>
                                            <button
                                                onClick={() => setAgentModalTab('connect')}
                                                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl transition cursor-pointer"
                                            >
                                                Echte Printify API verbinden
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredPods.map((item) => {
                                            const currentPrice = editingPodPrices[item.id] !== undefined 
                                                ? Number(editingPodPrices[item.id]) 
                                                : Number(item.price);
                                            const profit = currentPrice - item.baseCost;
                                            const margin = currentPrice > 0 ? ((profit / currentPrice) * 100).toFixed(0) : 0;
                                            const isPending = item.status === 'pending_approval';
                                            const isRejected = item.status === 'rejected';

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`p-4 rounded-3xl bg-[#0F172A]/90 border transition-all flex flex-col justify-between space-y-3.5 ${
                                                        isPending 
                                                            ? 'border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.12)]' 
                                                            : isRejected
                                                            ? 'border-red-500/30 opacity-80'
                                                            : 'border-white/10 hover:border-white/20'
                                                    }`}
                                                >
                                                    {/* Image + Meta Row */}
                                                    <div className="flex gap-3.5">
                                                        <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80';
                                                                }}
                                                            />
                                                            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[8px] font-black text-amber-300 uppercase">
                                                                {item.tag || 'POD'}
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 min-w-0 space-y-1">
                                                            <div className="flex items-center justify-between gap-1">
                                                                <span className="text-[10px] font-black uppercase text-purple-400">
                                                                    {item.podProvider || 'Printify / Gelato'}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                                                    isPending
                                                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                                                        : item.status === 'approved'
                                                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                                }`}>
                                                                    {isPending ? '⏳ Wartet auf Freigabe' : item.status === 'approved' ? '✅ Im Shop Aktiv' : '❌ Abgelehnt'}
                                                                </span>
                                                            </div>

                                                            <h3 className="text-sm font-extrabold text-white truncate m-0" title={item.name}>
                                                                {item.name}
                                                            </h3>

                                                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                                                {item.description}
                                                            </p>

                                                            {/* Variants */}
                                                            {item.variants && item.variants.length > 0 && (
                                                                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                                                    <span className="text-[9px] font-semibold text-slate-500">Größen:</span>
                                                                    {item.variants.slice(0, 5).map(v => (
                                                                        <span key={v} className="px-1.5 py-0.2 bg-white/5 border border-white/10 rounded text-[9px] text-slate-300 font-mono">
                                                                            {v}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Financials & Price Setting Box */}
                                                    <div className="p-3 rounded-2xl bg-black/40 border border-white/10 grid grid-cols-3 gap-2 text-center items-center">
                                                        {/* Base Cost */}
                                                        <div>
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold">POD Einkauf</div>
                                                            <div className="text-sm font-black text-slate-300 font-mono mt-0.5">
                                                                {item.baseCost ? Number(item.baseCost).toFixed(2) : '15.00'} €
                                                            </div>
                                                            <div className="text-[9px] text-slate-500">Druck & Textil</div>
                                                        </div>

                                                        {/* Editable Selling Price */}
                                                        <div className="px-1">
                                                            <div className="text-[10px] text-amber-400 uppercase font-black">Dein Verkaufspreis</div>
                                                            <div className="flex items-center justify-center gap-1 mt-0.5">
                                                                <input
                                                                    type="number"
                                                                    step="0.5"
                                                                    value={editingPodPrices[item.id] !== undefined ? editingPodPrices[item.id] : item.price}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        setEditingPodPrices(prev => ({ ...prev, [item.id]: val }));
                                                                    }}
                                                                    className="w-20 px-1.5 py-1 text-center bg-black/70 border border-amber-500/50 rounded-lg text-xs font-black text-white font-mono focus:border-amber-400 focus:outline-none"
                                                                />
                                                                <span className="text-xs font-black text-amber-400">€</span>
                                                            </div>
                                                            <div className="text-[8px] text-slate-400 truncate">Vorschlag: {item.suggestedPrice}€</div>
                                                        </div>

                                                        {/* Profit / Margin */}
                                                        <div>
                                                            <div className="text-[10px] text-emerald-400 uppercase font-bold">Dein Gewinn</div>
                                                            <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                                                                +{profit.toFixed(2)} €
                                                            </div>
                                                            <div className="text-[9px] font-bold text-emerald-300/80">
                                                                {margin}% Marge
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions Row */}
                                                    <div className="flex items-center gap-2 pt-1">
                                                        {isRejected ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleRestorePod(item.id)}
                                                                    className="flex-1 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                                                >
                                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                                    <span>Wiederherstellen</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeletePod(item.id)}
                                                                    className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition cursor-pointer"
                                                                    title="Endgültig löschen"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApprovePod(item)}
                                                                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#00D084] hover:from-emerald-400 hover:to-[#00B875] text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95"
                                                                >
                                                                    <CheckCheck className="w-4 h-4 stroke-[3]" />
                                                                    <span>{isPending ? 'Jetzt freigeben & in den Shop' : 'Preis im Shop aktualisieren'}</span>
                                                                </button>

                                                                {isPending && (
                                                                    <button
                                                                        onClick={() => handleRejectPod(item.id)}
                                                                        className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 text-xs font-bold transition cursor-pointer"
                                                                        title="Entwurf ablehnen"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: CONNECT REAL PRINT-ON-DEMAND PARTNER (PRINTIFY / PRINTFUL) */}
                        {agentModalTab === 'connect' && (
                            <div className="space-y-6 max-w-3xl mx-auto">
                                <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950/40 via-indigo-950/30 to-black/50 border border-cyan-500/30 space-y-5">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                            <LinkIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-white m-0">Echte Print-on-Demand Firmen API anbinden</h3>
                                            <p className="text-xs text-slate-300 mt-0.5">
                                                Verknüpfe dein Printify- oder Printful-Konto. Der Agent synchronisiert echte Kataloge, Rohstoffpreise und leitet bezahlte Bestellungen automatisch an die Druckerei weiter.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Provider Chooser */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                            POD Anbieter auswählen:
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {[
                                                { id: 'printify', name: 'Printify (Empfohlen)', note: 'Größtes Sortiment & EU-Druckereien', url: 'https://printify.com/app/account/api' },
                                                { id: 'printful', name: 'Printful', note: 'Sehr hohe Textil- & Stickqualität', url: 'https://www.printful.com/dashboard/settings/api' },
                                                { id: 'gelato', name: 'Gelato', note: 'Lokales Drucknetzwerk in 30+ Ländern', url: 'https://dashboard.gelato.com/developer/api-keys' }
                                            ].map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => setPodSettings(prev => ({ ...prev, provider: p.id }))}
                                                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                                                        podSettings.provider === p.id
                                                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                                                            : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                                                    }`}
                                                >
                                                    <div className="font-extrabold text-xs text-white flex items-center justify-between">
                                                        <span>{p.name}</span>
                                                        {podSettings.provider === p.id && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-1">{p.note}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Direct Link to get Token */}
                                    <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between text-xs">
                                        <div className="space-y-0.5">
                                            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>Hier erhältst du deinen echten API-Key kostenlos:</span>
                                            </div>
                                            <div className="text-[11px] text-slate-400">
                                                Klicke auf den Link, logge dich ein und kopiere deinen persönlichen API-Token.
                                            </div>
                                        </div>
                                        <a
                                            href={podSettings.provider === 'printify' ? 'https://printify.com/app/account/api' : podSettings.provider === 'printful' ? 'https://www.printful.com/dashboard/settings/api' : 'https://dashboard.gelato.com/developer/api-keys'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition flex items-center gap-1 shrink-0"
                                        >
                                            <span>{podSettings.provider.toUpperCase()} API Portal</span>
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                        </a>
                                    </div>

                                    {/* API Token Input */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <label className="font-bold text-slate-300 flex items-center gap-1.5">
                                                <Key className="w-3.5 h-3.5 text-cyan-400" />
                                                <span>Dein persönlicher {podSettings.provider.toUpperCase()} API Token:</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                                {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                <span>{showApiKey ? 'Verbergen' : 'Anzeigen'}</span>
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showApiKey ? 'text' : 'password'}
                                                placeholder={`z. B. prnt_live_8a92b... oder ${podSettings.provider}_token`}
                                                value={podSettings.apiKey || ''}
                                                onChange={(e) => setPodSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                                                className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-2xl font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={handleTestPodConnection}
                                            disabled={isTestingPodKey || !podSettings.apiKey}
                                            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${isTestingPodKey ? 'animate-spin' : ''}`} />
                                            <span>{isTestingPodKey ? 'Prüfe Verbindung...' : '🔌 Verbindung live testen'}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleSavePodSettings()}
                                            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Einstellungen speichern</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleSyncLivePod}
                                            disabled={isSyncingPodLive || !podSettings.apiKey}
                                            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-[#00D084] hover:from-emerald-400 hover:to-[#00B875] disabled:opacity-40 text-black font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 ml-auto"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPodLive ? 'animate-spin' : ''}`} />
                                            <span>{isSyncingPodLive ? 'Importiere Artikel...' : '🔄 Echte Artikel jetzt importieren'}</span>
                                        </button>
                                    </div>

                                    {/* Connection Test Result */}
                                    {podTestResult && (
                                        <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                                            podTestResult.ok
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                                : 'bg-red-500/10 border-red-500/30 text-red-300'
                                        }`}>
                                            <div className="font-bold">{podTestResult.ok ? '✓ Authentifizierung erfolgreich' : '✗ Verbindungsfehler'}</div>
                                            <div className="mt-0.5">{podTestResult.msg}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: AUTONOMOUS AI PRODUCT GENERATOR */}
                        {agentModalTab === 'agent_gen' && (
                            <div className="space-y-6 max-w-3xl mx-auto">
                                <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-black/40 border border-purple-500/30 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                            <Zap className="w-6 h-6 text-amber-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-white m-0">Autonomer KI-Agent für Produkt-Kreation</h3>
                                            <p className="text-xs text-slate-300 mt-0.5">
                                                Lass den Agenten die Recherche, Mockup-Auswahl, Textformulierung und Margen-Kalkulation automatisch durchführen.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                                            <div className="font-bold text-white flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                                <span>1. Trend Analyse</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400">
                                                Analysiert virale Streetwear- und Luxus-Lifestyle Trends für die Marke Grien.
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                                            <div className="font-bold text-white flex items-center gap-1.5">
                                                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>2. Mockup & Daten</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400">
                                                Wählt Bio-Rohlinge (Hoodies, Shirts, Flaschen) und formuliert Verkaufsbeschreibungen.
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                                            <div className="font-bold text-white flex items-center gap-1.5">
                                                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                                                <span>3. Kalkulation & Alert</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400">
                                                Berechnet die Marge (z. B. 65%) und sendet dir eine Benachrichtigung zur Freigabe.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={handleAgentGeneratePod}
                                            disabled={isGeneratingPod}
                                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-400/25 transition flex items-center justify-center gap-2 cursor-pointer transform active:scale-[0.98]"
                                        >
                                            <Zap className={`w-4 h-4 fill-black ${isGeneratingPod ? 'animate-spin' : ''}`} />
                                            <span>{isGeneratingPod ? 'KI-Agent arbeitet (Recherche & Kalkulation)...' : 'Jetzt neues Trend-Produkt generieren & Notification senden'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Feature checklist */}
                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                                        Autonome Sicherheitsgarantien für deinen Shop:
                                    </h4>
                                    <div className="space-y-2 text-xs text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span><strong>Kein ungeprüfter Live-Gang:</strong> Jedes Produkt landet zwingend im Freigabe-Center, bis Sie Ihr OK geben.</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span><strong>Volle Preishoheit:</strong> Der KI-Preis ist nur ein Vorschlag – Sie können jeden Cent vor der Freigabe ändern.</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span><strong>Echte POD-Anbindung:</strong> Bestellungen werden nach Zahlung automatisiert an die Druckerei übergeben.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: AI CUSTOMER CHAT SUPPORT */}
                        {agentModalTab === 'customer_chat' && (
                            <div className="space-y-5 max-w-3xl mx-auto">
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-black to-[#0B1324] border border-emerald-500/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                            <Bot className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-extrabold text-white m-0">GRIEN AI SHOPPING & SUPPORT AGENT</h3>
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                                <span className="text-[10px] text-emerald-400 font-bold">24/7 Autonom Aktiv</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                Beantwortet Kundenfragen zu deinen Shop- & POD-Artikeln, Lieferzeiten und Retouren in Echtzeit.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Suggested Quick Prompts */}
                                <div className="space-y-1.5">
                                    <div className="text-[11px] font-bold text-slate-400">Typische Kundenfragen simulieren:</div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {[
                                            '📦 Wie lange dauert der Versand bei POD-Artikeln?',
                                            '👕 Wie fallen die Größen bei Hoodies aus?',
                                            '🔄 Wie läuft ein Umtausch oder Retoure ab?',
                                            '💎 Gilt mein 10K Diamond VIP-Rabatt auch im Shop?'
                                        ].map(prompt => (
                                            <button
                                                key={prompt}
                                                onClick={() => handleSendCustomerChat(prompt)}
                                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-[11px] font-semibold text-slate-300 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 transition text-left cursor-pointer"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Chat Window */}
                                <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3 h-80 overflow-y-auto no-scrollbar flex flex-col justify-end">
                                    <div className="space-y-3">
                                        {chatMessages.map(msg => (
                                            <div
                                                key={msg.id}
                                                className={`flex flex-col ${msg.role === 'customer' ? 'items-end' : 'items-start'}`}
                                            >
                                                <div className="text-[9px] font-bold text-slate-500 mb-1 px-1">
                                                    {msg.role === 'customer' ? 'Kunde' : '🤖 Grien AI Assistant'} • {msg.time}
                                                </div>
                                                <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                                                    msg.role === 'customer'
                                                        ? 'bg-purple-600/30 border border-purple-500/30 text-white rounded-br-none'
                                                        : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 rounded-bl-none'
                                                }`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                        {isChatSending && (
                                            <div className="flex items-center gap-2 text-xs text-emerald-400 italic">
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                <span>KI formuliert Antwort mit Shop-Kontext...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Input Box */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Kundenfrage eintippen (z. B. 'Gibt es Expressversand?')..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSendCustomerChat();
                                        }}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                    />
                                    <button
                                        onClick={() => handleSendCustomerChat()}
                                        disabled={isChatSending || !chatInput.trim()}
                                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>Antworten</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB 5: REST API & SECRETS */}
                        {agentModalTab === 'api' && (
                            <div className="space-y-5">
                                {/* Agent Secret Key Card */}
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                            <Key className="w-3.5 h-3.5 text-[#00D084]" />
                                            Dein Agent Secret API Key
                                        </span>
                                        <span className="text-[11px] text-[#00D084]">Vollzugriff (CRUD & Bulk)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={AGENT_DEFAULT_KEY}
                                            className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-xl font-mono text-xs text-emerald-400 select-all"
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(AGENT_DEFAULT_KEY);
                                                setCopiedKey(true);
                                                setTimeout(() => setCopiedKey(false), 2000);
                                            }}
                                            className="px-3.5 py-2 rounded-xl bg-[#00D084] text-black font-bold text-xs flex items-center gap-1.5 hover:bg-[#00B875] transition cursor-pointer"
                                        >
                                            {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span>{copiedKey ? 'Kopiert!' : 'Kopieren'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Interactive Test Trigger */}
                                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-white flex items-center gap-2">
                                            <Terminal className="w-4 h-4 text-purple-400" />
                                            <span>Live Agent Health-Check</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Sendet einen Ping an <code className="text-purple-300">GET /api/shop/agent/status</code>
                                        </p>
                                    </div>
                                    <button
                                        onClick={handlePingAgent}
                                        disabled={isPingingAgent}
                                        className="px-4 py-2 rounded-xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-600 transition flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${isPingingAgent ? 'animate-spin' : ''}`} />
                                        <span>Testen</span>
                                    </button>
                                </div>

                                {agentPingStatus && (
                                    <div className={`p-3 rounded-xl border text-xs font-mono ${
                                        agentPingStatus.ok
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                                    }`}>
                                        {agentPingStatus.ok ? (
                                            <div>
                                                ✓ Operational (Latenz: {agentPingStatus.latency}ms) — {agentPingStatus.data.metrics.totalProducts} Produkte synchronisiert
                                            </div>
                                        ) : (
                                            <div>✗ {agentPingStatus.msg}</div>
                                        )}
                                    </div>
                                )}

                                {/* Endpoints */}
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                                        REST API Endpunkte für deinen Agenten & POD
                                    </h4>
                                    <div className="space-y-1.5 text-xs font-mono">
                                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                                            <span className="text-purple-400 font-bold">GET /api/shop/pod/products</span>
                                            <span className="text-slate-400 font-sans text-[11px]">POD Freigabe-Queue abrufen</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                                            <span className="text-amber-400 font-bold">POST /api/shop/pod/agent-generate</span>
                                            <span className="text-slate-400 font-sans text-[11px]">KI generiert neues POD Produkt</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                                            <span className="text-emerald-400 font-bold">PUT /api/shop/pod/products/:id/approve</span>
                                            <span className="text-slate-400 font-sans text-[11px]">Produkt freigeben & Preis festlegen</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                                            <span className="text-blue-400 font-bold">POST /api/shop/agent/customer-reply</span>
                                            <span className="text-slate-400 font-sans text-[11px]">KI schreibt mit Kunden</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Code snippet */}
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Beispiel cURL: POD Produkt per Bot einreichen
                                    </h4>
                                    <pre className="p-3 bg-black/60 border border-white/10 rounded-2xl text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`curl -X POST http://localhost:3001/api/shop/pod/products \\
  -H "Content-Type: application/json" \\
  -H "x-agent-key: ${AGENT_DEFAULT_KEY}" \\
  -d '{
    "name": "Grien Signature Heavyweight Hoodie",
    "category": "fashion",
    "baseCost": 26.50,
    "suggestedPrice": 79.00,
    "podProvider": "Printify Direct EU"
  }'`}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="shrink-0 p-4 bg-[#0E172C] border-t border-white/10 flex items-center justify-between">
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Print-on-Demand Hub • {pendingPodCount} warten auf Freigabe • {podSettings.apiKey ? 'Live mit Printify verbunden' : 'Demo Modus'}</span>
                        </div>
                        <button
                            onClick={() => setIsAgentModalOpen(false)}
                            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
                        >
                            Schließen
                        </button>
                    </div>
                </motion.div>
            </div>
        );

        return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
    };

    return (
        <div className="w-full text-white space-y-6">
            {/* Notification Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 right-6 z-[10000] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold border backdrop-blur-xl ${
                            notification.type === 'error'
                                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                : 'bg-[#00D084]/20 text-[#00D084] border-[#00D084]/40'
                        }`}
                    >
                        {notification.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        <span>{notification.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Bar Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00D084] to-emerald-700 flex items-center justify-center shadow-lg shadow-[#00D084]/20">
                            <Package className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white m-0">GRIEN PRODUCT HUB</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/30">
                                    Smart & Agent API 2.0
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                                Intelligente Artikel- & Bestandsverwaltung für den Grien Shop mit autonomer KI-Schnittstelle.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        onClick={handlePingAgent}
                        className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-2"
                        title="Verbindung prüfen"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isPingingAgent ? 'animate-spin text-[#00D084]' : ''}`} />
                        <span>Sync</span>
                    </button>

                    <button
                        onClick={() => {
                            setAgentModalTab('pod');
                            setIsAgentModalOpen(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-emerald-500/20 hover:from-purple-500/30 hover:to-emerald-500/30 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold transition flex items-center gap-2.5 shadow-lg shadow-purple-500/10 cursor-pointer"
                        title="Print-on-Demand Produkte verwalten, Preise anpassen & KI-Agent starten"
                    >
                        <Bot className="w-4 h-4 text-purple-400" />
                        <span>Print-on-Demand & KI-Agent</span>
                        {podProducts.filter(p => p.status === 'pending_approval').length > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FFD700] text-black shadow-[0_0_10px_#FFD700] animate-pulse">
                                {podProducts.filter(p => p.status === 'pending_approval').length} zur Freigabe
                            </span>
                        ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        )}
                    </button>

                    <button
                        onClick={() => handleOpenAddModal(selectedCategory)}
                        className="px-5 py-2.5 rounded-xl bg-[#00D084] hover:bg-[#00B875] text-black font-extrabold text-xs sm:text-sm shadow-xl shadow-[#00D084]/20 transition flex items-center gap-2 transform active:scale-95"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Neues Produkt</span>
                    </button>

                    <button
                        onClick={() => setIsInvoiceModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-500/10 cursor-pointer"
                        title="Offizielle Firmendaten & Steuerangaben für Kundenrechnungen nach § 14 UStG anpassen"
                    >
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <span>PDF Rechnungsdaten</span>
                    </button>
                </div>
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Gesamt Artikel</span>
                        <Package className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-black text-white mt-1">{metrics.total}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">In 5 Shop-Kategorien</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#00D084]/20">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Aktiv im Shop</span>
                        <div className="w-2 h-2 rounded-full bg-[#00D084] animate-ping"></div>
                    </div>
                    <div className="text-2xl font-black text-[#00D084] mt-1">{metrics.active}</div>
                    <div className="text-[11px] text-emerald-400/70 mt-0.5">Für Kunden sichtbar</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-amber-500/20">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Knapper Bestand</span>
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-amber-400 mt-1">{metrics.lowStock}</div>
                    <div className="text-[11px] text-amber-400/70 mt-0.5">Bestand ≤ 15 Stk.</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Warenwert</span>
                        <DollarSign className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-black text-white mt-1">
                        {metrics.totalInventoryValue.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Gesamter Lagerwert</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Ø Marge</span>
                        <Percent className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">{metrics.avgMargin} %</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Rohertragspanne</div>
                </div>
            </div>

            {/* Category Carousel Track with Left/Right Buttons and Touch/Mouse Drag */}
            <div className="relative group/carousel">
                {/* Left Scroll Button */}
                <button
                    onClick={() => scrollByAmount(-280)}
                    className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#0E172C]/90 hover:bg-[#00D084] text-white hover:text-black border border-white/15 flex items-center justify-center shadow-lg transition-all opacity-80 hover:opacity-100 hover:scale-110 cursor-pointer"
                    aria-label="Nach links scrollen"
                >
                    <ChevronLeft size={16} strokeWidth={2.5} />
                </button>

                {/* Draggable Track */}
                <div 
                    ref={carouselRef}
                    onScroll={handleCarouselScroll}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-7 cursor-grab active:cursor-grabbing select-none"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {loopCategories.map(cat => {
                        const Icon = cat.icon;
                        const isActive = selectedCategory === cat.id;
                        const count = cat.id === 'all'
                            ? products.length
                            : products.filter(p => p.category === cat.id).length;

                        return (
                            <button
                                key={cat.loopKey}
                                onClick={() => handleCategoryClick(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                                    isActive
                                        ? 'bg-[#00D084] text-black border-[#00D084] shadow-lg shadow-[#00D084]/20 scale-[1.02]'
                                        : 'bg-white/[0.03] text-slate-300 hover:text-white border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                                <span>{cat.label}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-400'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Right Scroll Button */}
                <button
                    onClick={() => scrollByAmount(280)}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#0E172C]/90 hover:bg-[#00D084] text-white hover:text-black border border-white/15 flex items-center justify-center shadow-lg transition-all opacity-80 hover:opacity-100 hover:scale-110 cursor-pointer"
                    aria-label="Nach rechts scrollen"
                >
                    <ChevronRight size={16} strokeWidth={2.5} />
                </button>
            </div>

            {/* Filter & Search & Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Artikel suchen (z.B. Hoodie, Duft, ANC, VIP)..."
                        className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00D084] transition"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-[#00D084]"
                    >
                        <option value="all" className="bg-[#0A101D] text-white">Alle Status</option>
                        <option value="active" className="bg-[#0A101D] text-white">Nur Aktiv</option>
                        <option value="inactive" className="bg-[#0A101D] text-white">Nur Pausiert</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-[#00D084]"
                    >
                        <option value="newest" className="bg-[#0A101D] text-white">Neueste zuerst</option>
                        <option value="popular" className="bg-[#0A101D] text-white">Beliebteste</option>
                        <option value="price_asc" className="bg-[#0A101D] text-white">Preis: Niedrig → Hoch</option>
                        <option value="price_desc" className="bg-[#0A101D] text-white">Preis: Hoch → Niedrig</option>
                        <option value="stock" className="bg-[#0A101D] text-white">Geringster Bestand</option>
                    </select>

                    <div className="flex items-center bg-white/[0.04] p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg text-xs transition ${viewMode === 'grid' ? 'bg-[#00D084] text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                            title="Rasteransicht"
                        >
                            <Layers className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-lg text-xs transition ${viewMode === 'table' ? 'bg-[#00D084] text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                            title="Tabellenansicht"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Product Display Area */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 text-[#00D084] animate-spin" />
                    <p className="text-sm text-slate-400">Lade Produktkatalog...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="py-20 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/10 p-8 space-y-3">
                    <Package className="w-12 h-12 text-slate-600 mx-auto" />
                    <h3 className="text-lg font-bold text-white">Keine Artikel gefunden</h3>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                        In dieser Kategorie oder mit dem aktuellen Filter gibt es derzeit keine passenden Artikel.
                    </p>
                    <button
                        onClick={() => handleOpenAddModal(selectedCategory)}
                        className="mt-2 px-4 py-2 rounded-xl bg-[#00D084] text-black font-bold text-xs inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Jetzt Produkt anlegen</span>
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredProducts.map(product => {
                        const isLow = (product.stock || 0) <= 15;
                        const hasOriginal = product.originalPrice && product.originalPrice > product.price;

                        return (
                            <motion.div
                                key={product.id}
                                layout
                                className={`group relative rounded-3xl bg-white/[0.02] border transition-all duration-300 flex flex-col overflow-hidden hover:border-[#00D084]/40 hover:shadow-xl hover:shadow-[#00D084]/5 ${
                                    product.isActive === false ? 'opacity-60 border-white/5' : 'border-white/10'
                                }`}
                            >
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/40">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => { e.target.src = PRESET_IMAGES[0].url; }}
                                    />

                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                                        {product.tag && (
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/75 backdrop-blur-md text-white border border-white/20">
                                                {product.tag}
                                            </span>
                                        )}
                                        {product.isActive === false && (
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/80 backdrop-blur-md text-white">
                                                Pausiert
                                            </span>
                                        )}
                                    </div>

                                    <div className="absolute top-3 right-3">
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#070D18]/80 backdrop-blur-md text-[#00D084] border border-[#00D084]/30">
                                            {product.categoryLabel || product.category}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => handleToggleActive(product)}
                                        className={`absolute bottom-3 right-3 p-2 rounded-xl backdrop-blur-md transition ${
                                            product.isActive !== false
                                                ? 'bg-black/60 text-[#00D084] hover:bg-black/90'
                                                : 'bg-red-500/80 text-white hover:bg-red-500'
                                        }`}
                                        title={product.isActive !== false ? 'Artikel pausieren' : 'Artikel aktivieren'}
                                    >
                                        {product.isActive !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#00D084] transition-colors">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                                            {product.description || 'Keine Beschreibung vorhanden.'}
                                        </p>
                                    </div>

                                    {Array.isArray(product.variants) && product.variants.length > 0 && (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {product.variants.slice(0, 3).map((v, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded-md text-[10px] bg-white/[0.05] text-slate-300 border border-white/5">
                                                    {v}
                                                </span>
                                            ))}
                                            {product.variants.length > 3 && (
                                                <span className="text-[10px] text-slate-500">+{product.variants.length - 3}</span>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-lg font-black text-white">
                                                    {Number(product.price).toFixed(2)} €
                                                </span>
                                                {hasOriginal && (
                                                    <span className="text-xs text-slate-500 line-through">
                                                        {Number(product.originalPrice).toFixed(2)} €
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${isLow ? 'bg-amber-400' : 'bg-[#00D084]'}`} />
                                                <span className={isLow ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                                                    {product.stock ?? 25} auf Lager
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleOpenEditModal(product)}
                                                className="p-2 rounded-xl bg-white/5 hover:bg-[#00D084]/20 hover:text-[#00D084] text-slate-300 transition"
                                                title="Bearbeiten"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product)}
                                                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition"
                                                title="Löschen"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                /* Table View */
                <div className="rounded-3xl bg-white/[0.02] border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                            <thead className="bg-white/[0.04] text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-white/10">
                                <tr>
                                    <th className="py-3 px-4">Artikel</th>
                                    <th className="py-3 px-4">Kategorie</th>
                                    <th className="py-3 px-4">Preis</th>
                                    <th className="py-3 px-4">EK / Marge</th>
                                    <th className="py-3 px-4">Bestand</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredProducts.map(product => {
                                    const margin = product.price && product.costPrice
                                        ? (((product.price - product.costPrice) / product.price) * 100).toFixed(0)
                                        : null;

                                    return (
                                        <tr key={product.id} className="hover:bg-white/[0.02] transition">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-10 h-10 rounded-xl object-cover bg-black"
                                                        onError={(e) => { e.target.src = PRESET_IMAGES[0].url; }}
                                                    />
                                                    <div>
                                                        <div className="font-bold text-white line-clamp-1">{product.name}</div>
                                                        <div className="text-[11px] text-slate-500">{product.tag || 'Standard'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-slate-300">
                                                <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px]">
                                                    {product.categoryLabel || product.category}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 font-bold text-white">
                                                {Number(product.price).toFixed(2)} €
                                            </td>
                                            <td className="py-3 px-4 text-slate-400">
                                                {product.costPrice ? `${Number(product.costPrice).toFixed(2)} €` : '—'}
                                                {margin && (
                                                    <span className="ml-1.5 text-emerald-400 text-[11px] font-bold">
                                                        ({margin}%)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`font-semibold ${product.stock <= 15 ? 'text-amber-400' : 'text-slate-300'}`}>
                                                    {product.stock ?? 25} Stk.
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => handleToggleActive(product)}
                                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                                                        product.isActive !== false
                                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                    }`}
                                                >
                                                    {product.isActive !== false ? 'Aktiv' : 'Pausiert'}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleOpenEditModal(product)}
                                                        className="p-1.5 rounded-lg bg-white/5 hover:text-[#00D084]"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product)}
                                                        className="p-1.5 rounded-lg bg-white/5 hover:text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Render Modals outside transformed parent tree */}
            {renderEditModal()}
            {renderAgentModal()}
            {renderInvoiceSettingsModal()}
        </div>
    );
};

export default AdminProductHub;
