import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Upload, Star, Image as ImageIcon,
    Sparkles, Shirt, Smartphone, Flame, Home as HomeIcon, Gift,
    Plus, Search, Filter, Edit3, Trash2, CheckCircle2, XCircle,
    Eye, EyeOff, Bot, Key, Copy, Check, ArrowUpRight, TrendingUp,
    Package, AlertTriangle, RefreshCw, ExternalLink, SlidersHorizontal,
    DollarSign, Percent, Layers, ShieldCheck, Terminal, HelpCircle, X,
    ChevronLeft, ChevronRight
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
    const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [notification, setNotification] = useState(null);
    const [copiedKey, setCopiedKey] = useState(false);
    const [agentPingStatus, setAgentPingStatus] = useState(null);
    const [isPingingAgent, setIsPingingAgent] = useState(false);

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

    useEffect(() => {
        fetchProducts();
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

    // RENDER AGENT MODAL VIA PORTAL
    const renderAgentModal = () => {
        if (!isAgentModalOpen) return null;

        const modalContent = (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0B1324] border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="shrink-0 p-5 bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-transparent border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-black text-white m-0">AGENT & REST API CONNECTION</h2>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                        Active Key
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Docke deinen externen KI-Agenten oder Automations-Bot direkt an den Grien Shop Hub an.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsAgentModalOpen(false)}
                            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
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
                                    className="px-3.5 py-2 rounded-xl bg-[#00D084] text-black font-bold text-xs flex items-center gap-1.5 hover:bg-[#00B875] transition"
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
                                className="px-4 py-2 rounded-xl bg-purple-500 text-white font-bold text-xs hover:bg-purple-600 transition flex items-center gap-1.5"
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
                                REST API Endpunkte für deinen Agenten
                            </h4>
                            <div className="space-y-1.5 text-xs font-mono">
                                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                                    <span className="text-emerald-400 font-bold">GET /api/shop/products?category=...</span>
                                    <span className="text-slate-400 font-sans text-[11px]">Katalog abfragen</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                                    <span className="text-blue-400 font-bold">POST /api/shop/products</span>
                                    <span className="text-slate-400 font-sans text-[11px]">Neues Produkt uploaden</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                                    <span className="text-amber-400 font-bold">PUT /api/shop/products/:id</span>
                                    <span className="text-slate-400 font-sans text-[11px]">Preis/Bestand updaten</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                                    <span className="text-purple-400 font-bold">POST /api/shop/agent/bulk-sync</span>
                                    <span className="text-slate-400 font-sans text-[11px]">Batch Import (Array)</span>
                                </div>
                            </div>
                        </div>

                        {/* Code snippet */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                Beispiel cURL Befehl für deinen Bot
                            </h4>
                            <pre className="p-3 bg-black/60 border border-white/10 rounded-2xl text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`curl -X POST http://localhost:3001/api/shop/products \\
  -H "Content-Type: application/json" \\
  -H "x-agent-key: ${AGENT_DEFAULT_KEY}" \\
  -d '{
    "name": "Grien Quantum Pro ANC",
    "category": "electronics",
    "price": 129.00,
    "stock": 50,
    "tag": "Agent Deal"
  }'`}
                            </pre>
                        </div>
                    </div>

                    <div className="shrink-0 p-4 bg-[#0E172C] border-t border-white/10 flex justify-end">
                        <button
                            onClick={() => setIsAgentModalOpen(false)}
                            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
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
                        onClick={() => setIsAgentModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-purple-500/10"
                    >
                        <Bot className="w-4 h-4 text-purple-400" />
                        <span>Agent & API Hub</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </button>

                    <button
                        onClick={() => handleOpenAddModal(selectedCategory)}
                        className="px-5 py-2.5 rounded-xl bg-[#00D084] hover:bg-[#00B875] text-black font-extrabold text-xs sm:text-sm shadow-xl shadow-[#00D084]/20 transition flex items-center gap-2 transform active:scale-95"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Neues Produkt</span>
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
        </div>
    );
};

export default AdminProductHub;
