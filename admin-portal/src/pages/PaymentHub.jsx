import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, CreditCard, ShieldCheck, Landmark, 
    Wallet, Zap, Sparkles, Shield, Coins, Trash2, 
    Edit2, Check, Landmark as BankIcon, Lock, Loader2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { triggerNotification } from '../components/NotificationToast';
import { useAuth } from '../context/AuthContext';
import { db as fbDb } from '../config/firebase';
import {
    collection, doc, getDocs, setDoc, deleteDoc, writeBatch
} from 'firebase/firestore';

// --- Firestore helpers ---
const getMethodsColRef = (email) =>
    collection(fbDb, 'users', email.toLowerCase(), 'paymentMethods');

// Strip sensitive fields before saving to Firestore
const sanitizeForFirestore = (method) => {
    const { icon, cvv, ...safe } = method;
    // Mask IBAN: keep first 4 + last 4 chars only
    if (safe.iban) {
        const raw = safe.iban.replace(/\s/g, '');
        safe.maskedIban = `${raw.slice(0, 4)} •••• •••• ${raw.slice(-4)}`;
        delete safe.iban;
    }
    return safe;
};

// Restore icon component from stored type string
const restoreIcon = (type) => {
    if (type === 'Credit Card') return CreditCard;
    if (type === 'Bank Account') return BankIcon;
    if (type === 'PayPal') return Wallet;
    if (type === 'Klarna') return Sparkles;
    if (type === 'Revolut') return Zap;
    return Coins;
};

// Load methods from Firestore, fallback to demo data
const loadMethodsFromFirestore = async (email, user) => {
    try {
        const snap = await getDocs(getMethodsColRef(email));
        if (!snap.empty) {
            return snap.docs.map(d => ({
                ...d.data(),
                icon: restoreIcon(d.data().type)
            }));
        }
    } catch (e) {
        console.error('Failed to load payment methods from Firestore:', e);
    }

    // Fallback: demo users get sample data, real users get Cash only
    if (user?.isDemo) {
        return [
            { id: 1, type: 'Credit Card', provider: 'Mastercard', last4: '•••• •••• •••• 4242', icon: CreditCard, holder: 'Alex Passenger', expiry: '12/28' },
            { id: 2, type: 'Bank Account', provider: 'Deutsche Bank', maskedIban: 'DE91 •••• •••• 6789', icon: BankIcon, holder: 'Alex Passenger', swift: 'DBANKDEMXXX' },
            { id: 3, type: 'PayPal', provider: 'PayPal', email: 'alex.p@uplink.net', icon: Wallet }
        ];
    }
    return [
        { id: 'cash', type: 'Cash', provider: 'Physical Cash', status: 'Always Active', icon: Coins, holder: user?.name || 'Member' }
    ];
};

const PaymentHub = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const userEmail = user?.email ? user.email.toLowerCase() : null;

    const [editingPaymentId, setEditingPaymentId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingMethods, setIsLoadingMethods] = useState(true);

    // Stripe & PayPal modal and form states
    const [showStripeModal, setShowStripeModal] = useState(false);
    const [showPayPalModal, setShowPayPalModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [stripeForm, setStripeForm] = useState({
        cardNumber: '',
        expiry: '',
        cvv: '',
        holder: user?.name || 'Member',
        postalCode: '10115',
        city: 'Berlin',
        country: 'DE'
    });

    const [paypalForm, setPaypalForm] = useState({
        email: '',
        password: ''
    });

    const [activeMethodId, setActiveMethodId] = useState('cash');
    const [paymentMethods, setPaymentMethods] = useState([]);

    // Load payment methods from Firestore on mount
    React.useEffect(() => {
        if (!userEmail) return;
        setIsLoadingMethods(true);
        loadMethodsFromFirestore(userEmail, user).then(methods => {
            setPaymentMethods(methods);
            // Set active method: prefer the one marked isActive, else first
            const activeMeth = methods.find(m => m.isActive);
            setActiveMethodId(activeMeth ? activeMeth.id : (methods[0]?.id ?? 'cash'));
            setIsLoadingMethods(false);
        });
        setStripeForm(prev => ({ ...prev, holder: user?.name || 'Member' }));
    }, [userEmail]);

    // Sync to local storage for synchronous reads in other parts of the app (like VenueMenuPage)
    React.useEffect(() => {
        try {
            if (paymentMethods.length > 0) {
                // Strip complex objects like icons before stringifying
                const serializableMethods = paymentMethods.map(m => {
                    const { icon, ...rest } = m;
                    return rest;
                });
                localStorage.setItem('green_payment_methods', JSON.stringify(serializableMethods));
            } else {
                localStorage.removeItem('green_payment_methods');
            }
        } catch (e) {
            console.error('Failed to sync payment methods to localStorage:', e);
        }
    }, [paymentMethods]);

    // Save a single method to Firestore
    const saveMethodToFirestore = async (method) => {
        if (!userEmail || user?.isDemo) return;
        try {
            const safe = sanitizeForFirestore(method);
            const methodRef = doc(getMethodsColRef(userEmail), String(safe.id));
            await setDoc(methodRef, safe, { merge: true });
        } catch (e) {
            console.error('Failed to save payment method:', e);
        }
    };

    // Delete a method from Firestore
    const deleteMethodFromFirestore = async (methodId) => {
        if (!userEmail || user?.isDemo) return;
        try {
            await deleteDoc(doc(getMethodsColRef(userEmail), String(methodId)));
        } catch (e) {
            console.error('Failed to delete payment method:', e);
        }
    };

    // Update isActive flag across all methods in Firestore
    const setActiveInFirestore = async (newActiveId) => {
        if (!userEmail || user?.isDemo) return;
        try {
            const batch = writeBatch(fbDb);
            paymentMethods.forEach(m => {
                const ref = doc(getMethodsColRef(userEmail), String(m.id));
                batch.set(ref, { isActive: String(m.id) === String(newActiveId) }, { merge: true });
            });
            await batch.commit();
        } catch (e) {
            console.error('Failed to update active method:', e);
        }
    };

    const activeMethod = paymentMethods.find(m => String(m.id) === String(activeMethodId)) || paymentMethods[0] || {
        type: 'Cash', provider: 'Physical Cash', status: 'Always Active', icon: Coins, holder: user?.name || 'Member'
    };

    const getBackendUrl = () => {
        const wsUrl = import.meta.env.VITE_WS_URL || `http://${window.location.hostname}:3001`;
        return wsUrl.replace(/^ws/, 'http');
    };

    const handleGoBack = () => {
        if (location.state?.paymentFlowContext) {
            const flowContext = location.state.paymentFlowContext;
            navigate('/venue/menu', {
                replace: true,
                state: {
                    ...flowContext,
                    paymentMethod: activeMethod.id,
                    showPaymentTerminal: true,
                    paymentStep: 'method'
                }
            });
        } else {
            navigate(-1);
        }
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length > 0) {
            return parts.join(' ');
        } else {
            return v;
        }
    };

    const formatIBAN = (value) => {
        const v = value.replace(/\s+/g, '').toUpperCase();
        const parts = [];
        for (let i = 0, len = v.length; i < len; i += 4) {
            parts.push(v.substring(i, i + 4));
        }
        return parts.join(' ');
    };

    const handleAddPayment = async (type) => {
        const id = Date.now();
        const newMethod = {
            id,
            type,
            provider: type,
            icon: type === 'Credit Card' ? CreditCard : type === 'Bank Account' ? Landmark : type === 'PayPal' ? Wallet : type === 'Klarna' ? Sparkles : type === 'Revolut' ? Shield : Coins,
            holder: user?.name || 'Member',
            isActive: false,
            createdAt: new Date().toISOString(),
            ...(type === 'Bank Account' ? { maskedIban: 'DE•• •••• •••• ••••', swift: '' } : {}),
            ...(type === 'PayPal' ? { email: '' } : {})
        };
        setPaymentMethods(prev => [...prev, newMethod]);
        setActiveMethodId(id);
        setEditingPaymentId(id);
        await saveMethodToFirestore(newMethod);
        triggerNotification(`${type.toUpperCase()} CHANNEL INITIALIZED`, "SUCCESS");
    };

    const handleAddPaymentClick = (type) => {
        if (type === 'Credit Card') {
            setShowStripeModal(true);
        } else if (type === 'PayPal') {
            setShowPayPalModal(true);
        } else {
            handleAddPayment(type);
        }
    };

    const handleStripeSubmit = async (e) => {
        e.preventDefault();
        const cleanCard = stripeForm.cardNumber.replace(/\s+/g, '');
        if (cleanCard.length < 16 || !stripeForm.expiry || stripeForm.cvv.length < 3) {
            triggerNotification("VALIDATE SECURE CARD PARAMETERS", "ERROR");
            return;
        }
        setIsProcessing(true);
        try {
            const backendUrl = getBackendUrl();
            let isMock = false;
            try {
                const response = await fetch(`${backendUrl}/api/payment/stripe/intent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: 100, currency: 'eur' })
                });
                const data = await response.json();
                isMock = data.isMock;
            } catch (_) {
                isMock = true; // backend offline — still create method
            }

            // PSD2 simulation delay
            await new Promise(resolve => setTimeout(resolve, 1800));

            const id = Date.now();
            const cardBrand = cleanCard.startsWith('4') ? 'Visa' : 'Mastercard';
            const last4Digits = cleanCard.slice(-4);

            // NOTE: CVV and full card number are NOT stored
            const newMethod = {
                id,
                type: 'Credit Card',
                provider: cardBrand,
                last4: `•••• •••• •••• ${last4Digits}`,
                icon: CreditCard,
                holder: stripeForm.holder || user?.name || 'Member',
                expiry: stripeForm.expiry,
                isActive: true,
                createdAt: new Date().toISOString()
                // cvv intentionally NOT stored
            };

            setPaymentMethods(prev => [...prev, newMethod]);
            setActiveMethodId(id);
            setShowStripeModal(false);
            await saveMethodToFirestore(newMethod);
            await setActiveInFirestore(id);

            setStripeForm({
                cardNumber: '', expiry: '', cvv: '',
                holder: user?.name || 'Member',
                postalCode: '10115', city: 'Berlin', country: 'DE'
            });

            triggerNotification(isMock ? "STRIPE SECURED (SANDBOX)" : "STRIPE SECURE CHANNEL ACTIVE", "SUCCESS");
        } catch (err) {
            console.error(err);
            triggerNotification("SECURE CONNECTIVITY ERROR", "ERROR");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayPalSubmit = async (e) => {
        e.preventDefault();
        if (!paypalForm.email || !paypalForm.email.includes('@')) {
            triggerNotification("ENTER VALID PAYPAL ADDRESS", "ERROR");
            return;
        }
        setIsProcessing(true);
        try {
            // Simulate wallet sync
            await new Promise(resolve => setTimeout(resolve, 1500));

            const id = Date.now();
            const newMethod = {
                id,
                type: 'PayPal',
                provider: 'PayPal',
                email: paypalForm.email,
                icon: Wallet,
                isActive: true,
                createdAt: new Date().toISOString()
            };

            setPaymentMethods(prev => [...prev, newMethod]);
            setActiveMethodId(id);
            setShowPayPalModal(false);
            await saveMethodToFirestore(newMethod);
            await setActiveInFirestore(id);

            setPaypalForm({ email: '', password: '' });
            triggerNotification("PAYPAL ENDPOINT SYNCHRONIZED", "SUCCESS");
        } catch (err) {
            console.error(err);
            triggerNotification("PAYPAL ENDPOINT UNREACHABLE", "ERROR");
        } finally {
            setIsProcessing(false);
        }
    };

    const autofillStripeDemo = () => {
        setStripeForm({
            cardNumber: '4242 4242 4242 4242',
            expiry: '12/29',
            cvv: '888',
            holder: 'Alex Passenger',
            postalCode: '10115',
            city: 'Berlin',
            country: 'DE'
        });
        triggerNotification("DEMO PARAMS LOADED", "INFO");
    };

    const autofillPayPalDemo = () => {
        setPaypalForm({
            email: 'alex.passenger@paypal.de',
            password: 'secretpassword123'
        });
        triggerNotification("DEMO ACCOUNT READY", "INFO");
    };

    return (
        <div className="min-h-screen bg-dark-950 text-primary font-sans relative pb-32 transition-colors duration-300">
            <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-main pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-6 px-6 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <button 
                    onClick={handleGoBack}
                    className="w-12 h-12 bg-dark-900 border border-main rounded-2xl flex items-center justify-center text-primary shadow-sm active:scale-95 transition-all"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-black italic tracking-tighter uppercase text-primary">Bank Hub</h1>
                    <p className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] text-secondary mt-0.5">Secure Transaction Network</p>
                </div>
                <div className="w-12 h-12 bg-dark-900 border border-main rounded-2xl flex items-center justify-center text-primary">
                    <ShieldCheck size={24} />
                </div>
            </header>

            <main className="p-6 max-w-lg mx-auto space-y-10 pt-8 pb-32">
                {/* Security Status Card */}
                <section className="bg-dark-900 border border-main p-8 rounded-[3rem] space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform">
                        <ShieldCheck size={120} className="text-primary" />
                    </div>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <p className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-secondary">Secure Channel</p>
                            <h4 className="text-3xl font-black italic tracking-tighter text-primary uppercase">
                                {activeMethod.type === 'Credit Card' ? 'Card Secured' : activeMethod.type === 'Bank Account' ? 'Bank Verified' : 'Session Active'}
                            </h4>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-main flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-secondary">
                                {activeMethod.type === 'PayPal' ? 'Authorized Gateway' : 'Encrypted Flow Active'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {React.createElement(activeMethod.icon || Landmark, { size: 14, className: "text-primary" })}
                            <span className="text-xs md:text-sm lg:text-base font-black italic text-primary">
                                {activeMethod.type === 'Credit Card' 
                                    ? `•••• •••• •••• ${activeMethod.last4 ? activeMethod.last4.slice(-4) : '4242'}`
                                    : activeMethod.type === 'Bank Account'
                                    ? `${activeMethod.iban ? activeMethod.iban.slice(0, 4) : 'DE91'} •••• ${activeMethod.iban ? activeMethod.iban.slice(-4) : '5678'}`
                                    : activeMethod.email || 'alex.p@uplink.net'}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Active Channels List */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-secondary italic">Active Channels</h3>
                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}>{paymentMethods.length} Total</span>
                    </div>
                    
                    <div className="space-y-5">
                        <AnimatePresence mode="popLayout">
                            {paymentMethods.map(method => {
                                const isActive = activeMethodId !== null && activeMethodId !== undefined && String(activeMethodId) === String(method.id);
                                return (
                                    <motion.div 
                                        key={method.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileTap={{ scale: 0.98 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={() => {
                                            if (editingPaymentId !== method.id) {
                                                setActiveMethodId(method.id);
                                                setActiveInFirestore(method.id);
                                                
                                                if (location.state?.paymentFlowContext) {
                                                    const flowContext = location.state.paymentFlowContext;
                                                    navigate('/venue/menu', {
                                                        replace: true,
                                                        state: {
                                                            ...flowContext,
                                                            paymentMethod: method.id,
                                                            showPaymentTerminal: true,
                                                            paymentStep: 'method'
                                                        }
                                                    });
                                                } else {
                                                    triggerNotification(`${(method.provider || 'Card').toUpperCase()} ACTIVATED`, "SUCCESS");
                                                }
                                            }
                                        }}
                                        className={`relative p-6 rounded-[2.5rem] border transition-all duration-300 cursor-pointer overflow-hidden shadow-2xl min-h-[235px] flex flex-col justify-between group/item ${
                                            isActive 
                                                ? 'ring-2 ring-[var(--brand-accent,#ffffff)] border-[var(--brand-accent,#ffffff)] shadow-[0_0_35px_rgba(255,255,255,0.25)] z-20 scale-[1.02]' 
                                                : 'border-main hover:border-white/40 hover:scale-[1.01] opacity-80 hover:opacity-100'
                                        } ${
                                            (method.type === 'Credit Card' || !method.type)
                                                ? 'bg-gradient-to-br from-neutral-900 via-neutral-850 to-neutral-950 text-white' 
                                                : method.type === 'Bank Account'
                                                ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white'
                                                : 'bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 text-white'
                                        }`}
                                    >
                                        {/* Premium Card Gloss Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                                        {editingPaymentId === method.id ? (
                                            <div className="space-y-5 w-full text-left z-10" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                                    <span className="text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-neutral-400">Edit Channel Details</span>
                                                    <button
                                                        onClick={() => { setEditingPaymentId(null); triggerNotification("CHANNEL SECURED", "SUCCESS"); }}
                                                        className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-90 transition-all shrink-0"
                                                    >
                                                        <Check size={18} className="stroke-[3]" />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-neutral-400">Provider Name</label>
                                                        <input
                                                            type="text"
                                                            value={method.provider}
                                                            onChange={(e) => setPaymentMethods(prev => prev.map(m => m.id === method.id ? { ...m, provider: e.target.value } : m))}
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-bold text-white uppercase focus:border-white focus:bg-white/10 outline-none transition-all"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-neutral-400">Holder Name</label>
                                                        <input
                                                            type="text"
                                                            value={method.holder || ''}
                                                            onChange={(e) => setPaymentMethods(prev => prev.map(m => m.id === method.id ? { ...m, holder: e.target.value } : m))}
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-bold text-white uppercase focus:border-white focus:bg-white/10 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                {method.type === 'Credit Card' ? (
                                                    <>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-neutral-400">Card Number</label>
                                                            <input
                                                                type="text"
                                                                value={method.last4 || ''}
                                                                onChange={(e) => setPaymentMethods(prev => prev.map(m => m.id === method.id ? { ...m, last4: formatCardNumber(e.target.value) } : m))}
                                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-mono font-bold text-white tracking-widest outline-none transition-all focus:border-white focus:bg-white/10"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1.5">
                                                                 <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-neutral-400">Expiry (MM/YY)</label>
                                                                <input
                                                                    type="text"
                                                                    value={method.expiry || ''}
                                                                    placeholder="MM/YY"
                                                                    onChange={(e) => setPaymentMethods(prev => prev.map(m => m.id === method.id ? { ...m, expiry: e.target.value } : m))}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-mono font-bold text-white outline-none transition-all focus:border-white focus:bg-white/10"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-neutral-400">CVV</label>
                                                                <input
                                                                    type="text"
                                                                    value={method.cvv || ''}
                                                                    placeholder="CVV"
                                                                    onChange={(e) => setPaymentMethods(prev => prev.map(m => m.id === method.id ? { ...m, cvv: e.target.value } : m))}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-mono font-bold text-white outline-none transition-all focus:border-white focus:bg-white/10"
                                                                />
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : method.type === 'Bank Account' ? (
                                                    <>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-neutral-400">IBAN</label>
                                                            <input
                                                                type="text"
                                                                value={method.iban || ''}
                                                                onChange={(e) => setPaymentMethods(prev => prev.map(m => m.id === method.id ? { ...m, iban: formatIBAN(e.target.value) } : m))}
                                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-mono font-bold text-white tracking-widest outline-none transition-all focus:border-white focus:bg-white/10"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-neutral-400">SWIFT / BIC</label>
                                                            <input
                                                                type="text"
                                                                value={method.swift || ''}
                                                                onChange={(e) => setPaymentMethods(prev => prev.map(m => m.id === method.id ? { ...m, swift: e.target.value.toUpperCase() } : m))}
                                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-mono font-bold text-white uppercase outline-none transition-all focus:border-white focus:bg-white/10"
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-neutral-400">Account Email</label>
                                                        <input
                                                            type="text"
                                                            value={method.email || ''}
                                                            onChange={(e) => setPaymentMethods(prev => prev.map(m => m.id === method.id ? { ...m, email: e.target.value } : m))}
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-bold text-white outline-none transition-all focus:border-white focus:bg-white/10"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col justify-between h-full w-full relative z-10 select-none">
                                                {/* Card Header */}
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-neutral-400 leading-none">{method.type || 'Credit Card'}</span>
                                                            {isActive && (
                                                                <span className="bg-white text-black text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 leading-none shadow-md">
                                                                    <Check size={9} className="stroke-[3]" /> Active
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4 className="text-xl font-black italic tracking-tight uppercase text-white mt-2 leading-none">{method.provider || 'Secure Card'}</h4>
                                                    </div>
                                                    
                                                    {/* Universal Floating Actions */}
                                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => setEditingPaymentId(method.id)}
                                                            className="w-9 h-9 bg-white/10 hover:bg-white/20 active:scale-90 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all shadow-md"
                                                            title="Edit Channel Details"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                setPaymentMethods(prev => prev.filter(m => m.id !== method.id));
                                                                await deleteMethodFromFirestore(method.id);
                                                                if (isActive && paymentMethods.length > 1) {
                                                                    const remaining = paymentMethods.filter(m => m.id !== method.id);
                                                                    setActiveMethodId(remaining[0].id);
                                                                    await setActiveInFirestore(remaining[0].id);
                                                                }
                                                                triggerNotification("CHANNEL PURGED", "INFO");
                                                            }}
                                                            className="w-9 h-9 bg-white/10 hover:bg-red-500/30 hover:text-red-400 active:scale-90 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all shadow-md"
                                                            title="Purge Channel"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Metallic Gold/Silver Chip & Contactless Icons */}
                                                <div className="flex items-center gap-4 mt-6">
                                                    {method.type === 'Credit Card' ? (
                                                        <div className="w-12 h-8 rounded-lg bg-gradient-to-br from-yellow-400 via-amber-200 to-yellow-600 border border-amber-500/40 relative overflow-hidden flex flex-col justify-between p-1 shadow-inner shrink-0">
                                                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0.5 opacity-25 pointer-events-none">
                                                                <div className="border-r border-b border-black/40"></div>
                                                                <div className="border-r border-b border-black/40"></div>
                                                                <div className="border-b border-black/40"></div>
                                                                <div className="border-r border-b border-black/40"></div>
                                                                <div className="border-r border-b border-black/40"></div>
                                                                <div className="border-b border-black/40"></div>
                                                                <div className="border-r border-black/40"></div>
                                                                <div className="border-r border-black/40"></div>
                                                                <div></div>
                                                            </div>
                                                        </div>
                                                    ) : method.type === 'Bank Account' ? (
                                                        <div className="w-12 h-8 rounded-lg bg-gradient-to-br from-slate-300 via-neutral-100 to-slate-500 border border-slate-400/40 relative overflow-hidden flex flex-col justify-between p-1 shadow-inner shrink-0">
                                                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0.5 opacity-25 pointer-events-none">
                                                                <div className="border-r border-b border-black/40"></div>
                                                                <div className="border-r border-b border-black/40"></div>
                                                                <div className="border-b border-black/40"></div>
                                                                <div className="border-r border-b border-black/40"></div>
                                                                <div className="border-r border-b border-black/40"></div>
                                                                <div className="border-b border-black/40"></div>
                                                                <div className="border-r border-black/40"></div>
                                                                <div className="border-r border-black/40"></div>
                                                                <div></div>
                                                            </div>
                                                        </div>
                                                    ) : null}

                                                    {method.type === 'Credit Card' && (
                                                        <div className="flex gap-0.5 items-center opacity-50">
                                                            <div className="w-[1.5px] h-2 bg-white rounded-full"></div>
                                                            <div className="w-[1.5px] h-3 bg-white rounded-full"></div>
                                                            <div className="w-[1.5px] h-4 bg-white rounded-full"></div>
                                                            <div className="w-[1.5px] h-5 bg-white rounded-full"></div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Large Clear Card Number / IBAN */}
                                                <div className="mt-6">
                                                    <p className="text-lg sm:text-xl font-mono font-bold tracking-[0.2em] text-white whitespace-nowrap overflow-x-auto scrollbar-hide py-1 text-left">
                                                        {(method.type === 'Credit Card' || !method.type)
                                                            ? `•••• •••• •••• ${method.last4 ? method.last4.replace(/\\s/g, '').slice(-4) : '4242'}` 
                                                            : method.type === 'Bank Account'
                                                            ? `•••• ${method.iban ? method.iban.replace(/\\s/g, '').slice(-4) : '5678'}`
                                                            : method.email || 'alex.p@uplink.net'}
                                                    </p>
                                                </div>

                                                {/* Card Footer Details */}
                                                <div className="flex justify-between items-end mt-6 pt-4 border-t border-white/10 w-full gap-4">
                                                    <div className="min-w-0 flex-1 text-left">
                                                        <span className="text-[8px] md:text-[10px] lg:text-xs text-neutral-400 block tracking-widest uppercase mb-1">
                                                            {method.type === 'Credit Card' ? 'Cardholder' : method.type === 'Bank Account' ? 'Account Holder' : 'Associated Account'}
                                                        </span>
                                                        <span className="text-sm text-white font-black uppercase truncate block leading-none">{method.holder || 'Alex Passenger'}</span>
                                                    </div>
                                                    
                                                    {(!method.type || method.type === 'Credit Card') && (
                                                        <div className="flex gap-4 shrink-0 justify-end text-right">
                                                            <div>
                                                                <span className="text-[8px] md:text-[10px] lg:text-xs text-neutral-400 block tracking-widest uppercase mb-1">Expires</span>
                                                                <span className="text-sm text-white font-mono font-bold leading-none">{method.expiry || '12/28'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[8px] md:text-[10px] lg:text-xs text-neutral-400 block tracking-widest uppercase mb-1">CVV</span>
                                                                <span className="text-sm text-white font-mono font-bold leading-none">{method.cvv || '•••'}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {method.type === 'Bank Account' && (
                                                        <div className="shrink-0 text-right">
                                                            <span className="text-[8px] md:text-[10px] lg:text-xs text-neutral-400 block tracking-widest uppercase mb-1">SWIFT / BIC</span>
                                                            <span className="text-sm text-white font-mono font-bold leading-none">{method.swift || 'DBANKDEMXXX'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </section>

                {/* Add New Channel Grid */}
                <section className="space-y-4">
                    <h3 className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-gray-500 px-2 italic">Add New Channel</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: 'card', label: 'Card', icon: CreditCard, type: 'Credit Card' },
                            { id: 'bank', label: 'Bank', icon: Landmark, type: 'Bank Account' },
                            { id: 'paypal', label: 'PayPal', icon: Wallet, type: 'PayPal' },
                            { id: 'klarna', label: 'Klarna', icon: Sparkles, type: 'Klarna' }
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => handleAddPaymentClick(type.type)}
                                className="bg-dark-900 border border-main p-6 rounded-[2.5rem] flex flex-col items-center gap-3 group hover:border-primary hover:scale-[1.02] transition-all shadow-[0_5px_15px_rgba(0,0,0,0.02)]"
                            >
                                <div className="p-4 bg-dark-950 rounded-2xl text-secondary group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                    <type.icon size={24} />
                                </div>
                                <span className="text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-widest text-secondary group-hover:text-primary transition-colors">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </section>
                
                {/* Submit / Confirm Button placed naturally at the end of the scroll */}
                <div className="pt-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
                    <button 
                        onClick={handleGoBack}
                        className="w-full py-6 border border-main rounded-[2.5rem] text-[10px] md:text-xs lg:text-sm font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-0.98 transition-all font-sans"
                        style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                    >
                        Confirm & Return to Mission
                    </button>
                </div>
            </main>

            {/* STRIPE SECURE MODAL SHEET OVERLAY */}
            <AnimatePresence>
                {showStripeModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 backdrop-blur-2xl bg-black/75 flex items-center justify-center p-4 z-50 overflow-y-auto"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-[3rem] p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            {/* Emerald Ambient Glow */}
                            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
                            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                        <Lock size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black tracking-widest text-white uppercase italic">Stripe Secure</h4>
                                        <p className="text-[7px] font-black tracking-widest text-emerald-500 uppercase">PSD2 / 3D SECURE ENABLED</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowStripeModal(false)}
                                    className="text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-neutral-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                            </div>

                            {/* Real-time Dynamic Glowing Emerald Card Preview */}
                            <div className="w-full bg-gradient-to-br from-neutral-850 to-neutral-950 border border-emerald-500/30 rounded-[2.2rem] p-6 shadow-[0_8px_30px_rgba(16,185,129,0.1)] mb-8 flex flex-col justify-between min-h-[190px] relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                                <div className="flex justify-between items-start z-10">
                                    <div>
                                        <span className="text-[8px] md:text-[10px] lg:text-xs font-black tracking-widest uppercase text-emerald-400">SECURE NETWORK</span>
                                        <h5 className="text-base font-black italic uppercase text-white mt-1">
                                            {stripeForm.cardNumber.startsWith('4') ? 'Visa' : 'Mastercard'}
                                        </h5>
                                    </div>
                                    <ShieldCheck size={20} className="text-emerald-400" />
                                </div>

                                <div className="my-4 z-10">
                                    <p className="text-base font-mono font-bold tracking-[0.25em] text-white">
                                        {stripeForm.cardNumber || '•••• •••• •••• ••••'}
                                    </p>
                                </div>

                                <div className="flex justify-between items-end border-t border-white/5 pt-3 z-10">
                                    <div>
                                        <span className="text-[7px] text-neutral-400 block tracking-widest uppercase mb-0.5">Cardholder</span>
                                        <span className="text-xs md:text-sm lg:text-base text-white font-black uppercase tracking-wide truncate max-w-[150px] block">{stripeForm.holder || 'Alex Passenger'}</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <div>
                                            <span className="text-[7px] text-neutral-400 block tracking-widest uppercase mb-0.5">Expiry</span>
                                            <span className="text-xs md:text-sm lg:text-base text-white font-mono font-bold">{stripeForm.expiry || 'MM/YY'}</span>
                                        </div>
                                        <div>
                                            <span className="text-[7px] text-neutral-400 block tracking-widest uppercase mb-0.5">CVV</span>
                                            <span className="text-xs md:text-sm lg:text-base text-white font-mono font-bold">{stripeForm.cvv || '•••'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Form fields */}
                            <form onSubmit={handleStripeSubmit} className="space-y-4 text-left">
                                <div className="flex justify-between items-center">
                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-neutral-400">Card Parameters</label>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-emerald-500/70 ml-2">Card Number</label>
                                    <input
                                        type="text"
                                        placeholder="4242 4242 4242 4242"
                                        value={stripeForm.cardNumber}
                                        onChange={(e) => setStripeForm({ ...stripeForm, cardNumber: formatCardNumber(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-mono text-white outline-none focus:border-emerald-500 focus:bg-white/10 transition-all placeholder:text-neutral-600"
                                        maxLength="19"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-emerald-500/70 ml-2">Expiry Date</label>
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            value={stripeForm.expiry}
                                            onChange={(e) => {
                                                let val = e.target.value.replace(/[^0-9/]/g, '');
                                                if (val.length === 2 && !val.includes('/') && e.nativeEvent.inputType !== 'deleteContentBackward') {
                                                    val = val + '/';
                                                }
                                                setStripeForm({ ...stripeForm, expiry: val });
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-mono text-white outline-none focus:border-emerald-500 focus:bg-white/10 transition-all placeholder:text-neutral-600"
                                            maxLength="5"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-emerald-500/70 ml-2">CVV</label>
                                        <input
                                            type="password"
                                            placeholder="•••"
                                            value={stripeForm.cvv}
                                            onChange={(e) => setStripeForm({ ...stripeForm, cvv: e.target.value.replace(/[^0-9]/g, '') })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-mono text-white outline-none focus:border-emerald-500 focus:bg-white/10 transition-all placeholder:text-neutral-600"
                                            maxLength="4"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-emerald-500/70 ml-2">Cardholder Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. John Doe"
                                        value={stripeForm.holder}
                                        onChange={(e) => setStripeForm({ ...stripeForm, holder: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-emerald-500 focus:bg-white/10 transition-all placeholder:text-neutral-600"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-1 space-y-1">
                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-emerald-500/70 ml-2">Zip Code</label>
                                        <input
                                            type="text"
                                            placeholder="10115"
                                            value={stripeForm.postalCode}
                                            onChange={(e) => setStripeForm({ ...stripeForm, postalCode: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-3.5 text-xs md:text-sm lg:text-base text-white outline-none focus:border-emerald-500 focus:bg-white/10 transition-all placeholder:text-neutral-600"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[8px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-emerald-500/70 ml-2">City</label>
                                        <input
                                            type="text"
                                            placeholder="Berlin"
                                            value={stripeForm.city}
                                            onChange={(e) => setStripeForm({ ...stripeForm, city: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-3.5 text-xs md:text-sm lg:text-base text-white outline-none focus:border-emerald-500 focus:bg-white/10 transition-all placeholder:text-neutral-600"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="w-full mt-6 py-4 bg-emerald-500 text-black font-black uppercase tracking-[0.2em] text-xs md:text-sm lg:text-base rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin text-black stroke-[3]" />
                                            SECURING CHANNEL...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={16} />
                                            AUTHORIZE & SYNC CARD
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PAYPAL SECURE MODAL SHEET OVERLAY */}
            <AnimatePresence>
                {showPayPalModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 backdrop-blur-2xl bg-black/75 flex items-center justify-center p-4 z-50 overflow-y-auto"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3rem] p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            {/* Blue/Gold Glow Effects */}
                            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
                            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                        <Wallet size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black tracking-widest text-white uppercase italic">PayPal Sync</h4>
                                        <p className="text-[7px] font-black tracking-widest text-amber-400 uppercase">OFFICIAL WALLET SECURE TUNNEL</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowPayPalModal(false)}
                                    className="text-xs md:text-sm lg:text-base font-black uppercase tracking-widest text-neutral-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                            </div>

                            {/* PayPal Logo Graphic */}
                            <div className="w-full bg-gradient-to-br from-slate-950 to-blue-950/80 border border-blue-500/20 rounded-[2.2rem] p-8 mb-8 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Wallet size={80} />
                                </div>
                                <h3 className="text-3xl font-black italic tracking-tighter text-blue-400 flex items-center justify-center gap-1">
                                    Pay<span className="text-amber-400">Pal</span>
                                </h3>
                                <p className="text-[8px] md:text-[10px] lg:text-xs font-black tracking-[0.2em] text-neutral-500 uppercase mt-2">SECURE ENDPOINT CHECKOUT</p>
                                {paypalForm.email && (
                                    <span className="mt-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] md:text-xs lg:text-sm font-mono px-3 py-1 rounded-full truncate max-w-xs block">
                                        {paypalForm.email}
                                    </span>
                                )}
                            </div>

                            {/* Form fields */}
                            <form onSubmit={handlePayPalSubmit} className="space-y-4 text-left">
                                <div className="flex justify-between items-center">
                                    <label className="text-[9px] md:text-[11px] lg:text-xs font-black uppercase tracking-widest text-neutral-400">Sign-in Parameters</label>
                                </div>

                                <div className="space-y-1">
                                    <input
                                        type="email"
                                        placeholder="PayPal Account Email"
                                        value={paypalForm.email}
                                        onChange={(e) => setPaypalForm({ ...paypalForm, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all placeholder:text-neutral-600"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={paypalForm.password}
                                        onChange={(e) => setPaypalForm({ ...paypalForm, password: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all placeholder:text-neutral-600"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="w-full mt-6 py-4 bg-amber-400 text-slate-900 font-black uppercase tracking-[0.2em] text-xs md:text-sm lg:text-base rounded-2xl flex items-center justify-center gap-2 hover:bg-amber-300 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin text-slate-900 stroke-[3]" />
                                            CONNECTING TO WALLET...
                                        </>
                                    ) : (
                                        <>
                                            <Wallet size={16} />
                                            AUTHORIZE & LINK ACCOUNT
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PaymentHub;
