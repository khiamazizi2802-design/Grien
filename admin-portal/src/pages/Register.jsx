import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
    Building2, User, Mail, Lock, Phone, MapPin, 
    CheckCircle2, ArrowLeft, ChevronRight, ShieldCheck, 
    Sparkles, BedDouble, Ticket, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Register = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialMode = searchParams.get('mode') === 'stadium' ? 'SM' : 'HM';

    const [partnerType, setPartnerType] = useState(initialMode); // 'HM' = Hotel, 'SM' = Stadium
    const [formData, setFormData] = useState({
        businessName: '',
        managerName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        receptionEmail: '',
        street: '',
        city: '',
        zip: '',
        acceptTerms: true
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errorMsg) setErrorMsg('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.businessName.trim()) {
            setErrorMsg(partnerType === 'HM' ? 'Bitte geben Sie den Namen Ihres Hotels an.' : 'Bitte geben Sie den Namen Ihres Stadions/Ihrer Arena an.');
            return;
        }
        if (!formData.managerName.trim()) {
            setErrorMsg('Bitte geben Sie Ihren vollständigen Namen an.');
            return;
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
            setErrorMsg('Bitte geben Sie eine gültige offizielle E-Mail-Adresse an.');
            return;
        }
        if (!formData.password || formData.password.length < 6) {
            setErrorMsg('Das Passwort muss mindestens 6 Zeichen lang sein.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setErrorMsg('Die Passwörter stimmen nicht überein.');
            return;
        }
        if (!formData.acceptTerms) {
            setErrorMsg('Bitte akzeptieren Sie die Partner-Richtlinien und AGB.');
            return;
        }

        setIsSubmitting(true);

        setTimeout(() => {
            const partnerId = `PARTNER-${partnerType}-${Date.now().toString().slice(-6)}`;
            const receptionMail = formData.receptionEmail.trim() || formData.email.trim();

            const partnerAccount = {
                id: partnerId,
                hotelName: formData.businessName.trim(),
                businessName: formData.businessName.trim(),
                name: formData.managerName.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password.trim(),
                role: 'manager',
                businessType: partnerType,
                phone: formData.phone.trim(),
                receptionEmail: receptionMail,
                street: formData.street.trim(),
                city: formData.city.trim(),
                zip: formData.zip.trim(),
                isRegisteredPartner: true,
                isDemo: false,
                registeredAt: new Date().toISOString()
            };

            try {
                // Save partner account session
                localStorage.setItem('green_current_partner', JSON.stringify(partnerAccount));
                
                // Save profile directly for Mein Profil
                const nameParts = formData.managerName.trim().split(' ');
                const profileObj = {
                    firstName: nameParts[0] || formData.managerName.trim(),
                    lastName: nameParts.slice(1).join(' ') || '',
                    email: formData.email.trim().toLowerCase(),
                    phone: formData.phone.trim(),
                    businessName: formData.businessName.trim(),
                    address: formData.street.trim(),
                    street: formData.street.trim(),
                    zip: formData.zip.trim(),
                    city: formData.city.trim(),
                    country: 'Deutschland'
                };
                const emailKey = partnerAccount.email.replace(/[^a-zA-Z0-9]/g, '_');
                localStorage.setItem(`green_manager_profile_${emailKey}`, JSON.stringify(profileObj));
                localStorage.removeItem('green_manager_profile_default');
                
                // Save context & reception mail for hotel
                localStorage.setItem(`green_manager_context_${partnerAccount.email.replace(/[^a-zA-Z0-9]/g, '_')}`, partnerType);
                localStorage.setItem(`green_hotel_reservation_email_${partnerAccount.email.replace(/[^a-zA-Z0-9]/g, '_')}`, receptionMail);
                
                // Set default empty menu for this new real account (so it has no mock items!)
                localStorage.setItem(`green_published_menu_${partnerType}_${partnerAccount.email.replace(/[^a-zA-Z0-9]/g, '_')}`, JSON.stringify([]));
                
                // Clear any mock reservations for this real partner
                localStorage.setItem(`grien_hotel_reservations_${partnerAccount.id}`, JSON.stringify([]));

                // Save to general registered partners directory
                const existingPartners = JSON.parse(localStorage.getItem('green_registered_partners') || '[]');
                existingPartners.push(partnerAccount);
                localStorage.setItem('green_registered_partners', JSON.stringify(existingPartners));

                sessionStorage.setItem('simulator_active_role', 'manager');
            } catch (err) {
                console.warn('Storage save notice:', err);
            }

            setSuccessMsg('Konto erfolgreich erstellt! Ihr Live-Dashboard wird eingerichtet...');

            setTimeout(() => {
                navigate(partnerType === 'SM' ? '/manager?mode=stadium' : '/manager?mode=hotel');
            }, 1000);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-[#070b14] text-white flex flex-col justify-between relative overflow-hidden font-sans">
            {/* Ambient Background Lights */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

            {/* Top Navigation */}
            <div className="relative z-10 px-6 md:px-12 py-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(partnerType === 'SM' ? '/manager?mode=stadium' : '/manager?mode=hotel')}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                        title="Zurück zum Dashboard"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="text-lg md:text-xl font-black italic tracking-wider text-white">
                            GRIEN <span className="text-emerald-400">BUSINESS</span>
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                            Partner Registration Portal
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 hidden sm:inline">Bereits registriert?</span>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-wider text-slate-200 transition-colors"
                    >
                        Login
                    </button>
                </div>
            </div>

            {/* Registration Card Container */}
            <div className="relative z-10 max-w-3xl mx-auto w-full px-4 py-10">
                <div className="bg-gradient-to-b from-[#0f172a]/90 via-[#0a0f1d]/90 to-black/95 border border-emerald-500/30 rounded-[2.5rem] p-6 md:p-10 shadow-2xl backdrop-blur-xl">
                    
                    {/* Header */}
                    <div className="text-center space-y-2 mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-black uppercase tracking-wider">
                            <Sparkles size={13} />
                            <span>Offizielles Partner-Konto</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-black uppercase italic tracking-tight text-white">
                            Partner-Konto <span className="text-emerald-400">Eröffnen</span>
                        </h1>
                        <p className="text-xs md:text-sm text-slate-300 max-w-lg mx-auto">
                            Verlassen Sie den Demo-Modus. Schalten Sie Ihr eigenes Hotel oder Stadion live, um echte Buchungen und VIP-Shuttles zu verwalten.
                        </p>
                    </div>

                    {/* Partner Type Selector Tabs */}
                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-black/40 border border-white/10 rounded-2xl mb-8">
                        <button
                            type="button"
                            onClick={() => setPartnerType('HM')}
                            className={`py-3.5 px-4 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                                partnerType === 'HM'
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/20'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <BedDouble size={18} />
                            <span>Hotel & Resort</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPartnerType('SM')}
                            className={`py-3.5 px-4 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                                partnerType === 'SM'
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/20'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Ticket size={18} />
                            <span>Stadion & Arena</span>
                        </button>
                    </div>

                    {/* Alerts */}
                    <AnimatePresence>
                        {errorMsg && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-300 text-xs md:text-sm font-bold flex items-center gap-3"
                            >
                                <span>⚠️ {errorMsg}</span>
                            </motion.div>
                        )}
                        {successMsg && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs md:text-sm font-bold flex items-center gap-3"
                            >
                                <CheckCircle2 size={18} />
                                <span>{successMsg}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Section 1: Business Details */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                                <Building2 size={14} />
                                <span>1. Angaben zum Betrieb ({partnerType === 'HM' ? 'Hotel' : 'Stadion'})</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                                        {partnerType === 'HM' ? 'Name des Hotels *' : 'Name des Stadions / Arena *'}
                                    </label>
                                    <div className="relative">
                                        <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            name="businessName"
                                            required
                                            placeholder={partnerType === 'HM' ? 'z.B. Grand Hotel Frankfurt' : 'z.B. Deutsche Bank Park'}
                                            value={formData.businessName}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                                        {partnerType === 'HM' ? 'Rezeptions-E-Mail (für Buchungsversand) *' : 'Ticket-System E-Mail *'}
                                    </label>
                                    <div className="relative">
                                        <Send size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
                                        <input
                                            type="email"
                                            name="receptionEmail"
                                            required
                                            placeholder="z.B. reservierung@hotel.de"
                                            value={formData.receptionEmail}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-cyan-500/40 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                        An diese E-Mail gehen alle automatischen Kunden-Reservierungen.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">Straße & Hausnummer</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            name="street"
                                            placeholder="z.B. Kaiserplatz 1"
                                            value={formData.street}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">PLZ & Stadt</label>
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="z.B. 60311 Frankfurt"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Manager Credentials */}
                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                                <User size={14} />
                                <span>2. Zugangsdaten des Managers</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">Vor- & Nachname *</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            name="managerName"
                                            required
                                            placeholder="z.B. Markus Müller"
                                            value={formData.managerName}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">Telefonnummer</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="z.B. +49 69 1234567"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">Offizielle Login-E-Mail *</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        placeholder="z.B. m.mueller@hotel.de"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">Passwort *</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="password"
                                            name="password"
                                            required
                                            placeholder="Mind. 6 Zeichen"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">Passwort bestätigen *</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            required
                                            placeholder="Passwort wiederholen"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="pt-2">
                            <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-300">
                                <input
                                    type="checkbox"
                                    name="acceptTerms"
                                    checked={formData.acceptTerms}
                                    onChange={handleChange}
                                    className="mt-0.5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span>
                                    Ich bestätige, dass ich bevollmächtigt bin, dieses Konto für den angegebenen Betrieb zu eröffnen. Ich akzeptiere die Grien B2B-Partnerbedingungen.
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <span>Live-Konto wird aktiviert...</span>
                                ) : (
                                    <>
                                        <span>Live-Dashboard Freischalten</span>
                                        <ChevronRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 px-6 py-6 border-t border-white/5 text-center text-xs text-slate-500">
                GRIEN BUSINESS PLATFORM • B2B Partner Portal • Alle Rechte vorbehalten
            </div>
        </div>
    );
};

export default Register;
